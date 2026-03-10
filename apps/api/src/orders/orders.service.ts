import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async getOrAddToCart(userId: string | null, guestToken?: string) {
    const where = userId ? { userId } : { guestToken };
    let cart = await this.prisma.cart.findFirst({
      where: { ...where, expiresAt: { gt: new Date() } },
      include: {
        items: {
          include: {
            product: { include: { images: { where: { isPrimary: true } } } },
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
          guestToken: guestToken || null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        include: { items: { include: { product: { include: { images: true } }, variant: true } } },
      });
    }

    return this.formatCart(cart);
  }

  async addToCart(cartId: string, productId: string, quantity: number, variantId?: string, unitPrice?: number) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const price = unitPrice ?? Number(product.basePrice);

    // Check if item exists
    const existing = await this.prisma.cartItem.findFirst({
      where: { cartId, productId, variantId: variantId || null },
    });

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId, productId, variantId, quantity, unitPrice: price },
      });
    }

    return this.getCart(cartId);
  }

  async getCart(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: { include: { images: { where: { isPrimary: true } } } },
            variant: true,
          },
        },
      },
    });
    if (!cart) throw new NotFoundException('Cart not found');
    return this.formatCart(cart);
  }

  async createOrder(userId: string, cartId: string, shippingAddressId: string, billingAddressId?: string) {
    const cart = await this.getCart(cartId);
    if (!cart.items.length) throw new BadRequestException('Cart is empty');

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const hasCustom = cart.items.some((i: any) => i.itemType === 'custom');
    const hasStandard = cart.items.some((i: any) => i.itemType === 'standard');
    const orderType = hasCustom && hasStandard ? 'mixed' : hasCustom ? 'custom' : 'standard';

    const subtotal = cart.subtotal;
    const shippingCost = subtotal > 150 ? 0 : 9.95; // free shipping over €150
    const taxAmount = Math.round(subtotal * 0.21 * 100) / 100;
    const total = subtotal + shippingCost + taxAmount;

    const order = await this.prisma.order.create({
      data: {
        userId,
        orderNumber,
        orderType,
        subtotal,
        shippingCost,
        taxAmount,
        total,
        shippingAddressId,
        billingAddressId: billingAddressId || shippingAddressId,
        status: 'pending',
        items: {
          create: cart.items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.unitPrice * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // Clear cart
    await this.prisma.cartItem.deleteMany({ where: { cartId } });

    return order;
  }

  async removeCartItem(itemId: string) {
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return { success: true };
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.prisma.order.update({ where: { id: orderId }, data: { status: status as OrderStatus } });
  }

  async getUserOrders(userId: string, page: any = 1, limit: any = 10) {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(100, parseInt(limit) || 10);
    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where: { userId } }),
      this.prisma.order.findMany({
        where: { userId },
        include: { items: true, shipments: true },
        orderBy: { placedAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return {
      data: orders.map(o => ({
        ...o,
        subtotal: Number(o.subtotal),
        shippingCost: Number(o.shippingCost),
        taxAmount: Number(o.taxAmount),
        total: Number(o.total),
      })),
      meta: { total, page, limit },
    };
  }

  async getAdminOrders(page: any = 1, limit: any = 20, status?: string) {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(200, parseInt(limit) || 20);
    const where: any = {};
    if (status) where.status = status;

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: {
          user: { select: { fullName: true, email: true, companyName: true } },
          items: { include: { product: { select: { name: true } } } },
          shipments: true,
        },
        orderBy: { placedAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return { data: orders, meta: { total, page: p, limit: l } };
  }

  async getAdminCustomOrders(page: any = 1, limit: any = 20, status?: string) {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(200, parseInt(limit) || 20);
    const where: any = {};
    if (status) where.status = status;
    else where.status = { not: 'draft' };

    const [total, orders] = await Promise.all([
      this.prisma.customOrder.count({ where }),
      this.prisma.customOrder.findMany({
        where,
        include: {
          user: { select: { fullName: true, email: true, companyName: true } },
          product: { select: { name: true, slug: true } },
          quote: true,
        },
        orderBy: { submittedAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return { data: orders, meta: { total, page: p, limit: l } };
  }

  private formatCart(cart: any) {
    const items = cart.items.map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      total: Number(item.unitPrice) * item.quantity,
    }));
    const subtotal = items.reduce((sum: number, i: any) => sum + i.total, 0);
    return { id: cart.id, items, subtotal: Math.round(subtotal * 100) / 100, itemCount: items.length };
  }
}
