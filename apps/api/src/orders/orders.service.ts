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
            productName: item.product?.name || '',
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

  async getAdminOrder(id: string) {
    const order: any = await (this.prisma.order as any).findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, email: true, companyName: true } },
        manufacturer: { select: { id: true, name: true, country: true, contactName: true, contactEmail: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
        shipments: true,
        payments: true,
      },
    });
    if (!order) throw new Error('Order not found');
    return {
      ...order,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      taxAmount: Number(order.taxAmount),
      total: Number(order.total),
      items: (order.items || []).map((i: any) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        total: Number(i.total),
      })),
    };
  }

  async updateAdminOrder(id: string, data: { manufacturerId?: string; notes?: string; status?: string }) {
    const update: any = {};
    if (data.manufacturerId !== undefined) update.manufacturerId = data.manufacturerId || null;
    if (data.notes !== undefined) update.notes = data.notes;
    if (data.status) update.status = data.status;
    return (this.prisma.order as any).update({ where: { id }, data: update });
  }

  async getManufacturerOrders(userId: string) {
    // Find the manufacturer record linked to this user by email
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw new NotFoundException('User not found');
    const manufacturer = await (this.prisma as any).manufacturer.findFirst({
      where: { contactEmail: user.email },
    });
    if (!manufacturer) return { manufacturer: null, orders: [] };

    const orders: any[] = await (this.prisma.order as any).findMany({
      where: { manufacturerId: manufacturer.id },
      include: {
        user: { select: { fullName: true, email: true, companyName: true } },
        items: true,
        shipments: true,
      },
      orderBy: { placedAt: 'desc' },
    });

    return {
      manufacturer,
      orders: orders.map((o: any) => ({
        ...o,
        subtotal: Number(o.subtotal),
        shippingCost: Number(o.shippingCost),
        taxAmount: Number(o.taxAmount),
        total: Number(o.total),
        items: (o.items || []).map((i: any) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
        })),
      })),
    };
  }

  async updateManufacturerOrder(orderId: string, userId: string, data: {
    status?: string;
    productionNotes?: string;
    estimatedLeadDays?: number;
    trackingNumber?: string;
    carrier?: string;
  }) {
    // Verify the order is assigned to a manufacturer linked to this user
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw new NotFoundException('User not found');
    const manufacturer = await (this.prisma as any).manufacturer.findFirst({ where: { contactEmail: user.email } });
    if (!manufacturer) throw new NotFoundException('Manufacturer record not found for this user');

    const order: any = await (this.prisma.order as any).findUnique({ where: { id: orderId } });
    if (!order || order.manufacturerId !== manufacturer.id) throw new NotFoundException('Order not found');

    const update: any = {};
    if (data.status) update.status = data.status;

    // Store production notes and lead time in order notes field
    if (data.productionNotes !== undefined || data.estimatedLeadDays !== undefined) {
      const lines: string[] = [];
      if (data.productionNotes) lines.push(`Production note: ${data.productionNotes}`);
      if (data.estimatedLeadDays) lines.push(`Estimated lead time: ${data.estimatedLeadDays} days`);
      const existingNotes = order.notes || '';
      // Append new notes (avoid duplicating B2B import notes)
      update.notes = [existingNotes, ...lines].filter(Boolean).join('\n');
    }

    const updated = await (this.prisma.order as any).update({ where: { id: orderId }, data: update });

    // Handle shipment creation/update
    if (data.trackingNumber || data.carrier) {
      const existingShipment = await this.prisma.shipment.findFirst({ where: { orderId } });
      if (existingShipment) {
        await this.prisma.shipment.update({
          where: { id: existingShipment.id },
          data: {
            trackingNumber: data.trackingNumber || existingShipment.trackingNumber,
            carrier: data.carrier || existingShipment.carrier,
          },
        });
      } else {
        await this.prisma.shipment.create({
          data: {
            orderId,
            trackingNumber: data.trackingNumber || '',
            carrier: data.carrier || '',
            status: 'in_transit' as any,
          },
        });
      }
    }

    return updated;
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

  async getAnalyticsStats(days = 30) {
    const d = Math.min(90, parseInt(String(days)) || 30);
    const since = new Date(Date.now() - d * 24 * 60 * 60 * 1000);

    const [revenueByDay, ordersByStatus, topProducts, totalRevenue, totalOrders, customRevenue] = await Promise.all([
      // Revenue per day for the last N days
      this.prisma.$queryRaw`
        SELECT DATE(placed_at) as date, SUM(total)::float as revenue, COUNT(*)::int as orders
        FROM orders
        WHERE placed_at >= ${since}
        GROUP BY DATE(placed_at)
        ORDER BY date ASC
      `,
      // Orders by status
      this.prisma.order.groupBy({ by: ['status'], _count: { id: true } }),
      // Top 5 products by revenue
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { total: true },
        _count: { id: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
      // Total revenue all time
      this.prisma.order.aggregate({ _sum: { total: true } }),
      // Total orders all time
      this.prisma.order.count(),
      // Custom order revenue
      this.prisma.order.aggregate({ where: { orderType: 'custom' }, _sum: { total: true } }),
    ]);

    // Get product names for top products
    const productIds = (topProducts as any[]).map((p: any) => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productMap = Object.fromEntries(products.map(p => [p.id, p.name]));

    // Custom order funnel
    const customFunnelStatuses = ['draft', 'submitted', 'quoted', 'approved', 'in_production', 'shipped'];
    const customFunnelRows = await Promise.all(
      customFunnelStatuses.map(s =>
        this.prisma.customOrder.count({ where: { status: s as any } }).then(count => ({ status: s, count }))
      )
    );

    // Revenue by category
    const catRevRows = await this.prisma.$queryRaw<any[]>`
      SELECT c.name AS category, SUM(oi.total)::float AS revenue, COUNT(oi.id)::int AS orders
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN categories c ON c.id = p.category_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.placed_at >= ${since}
      GROUP BY c.name
      ORDER BY revenue DESC
    `;

    // Geographic breakdown
    const geoRows = await this.prisma.$queryRaw<any[]>`
      SELECT a.country_code AS country, COUNT(DISTINCT o.id)::int AS orders, SUM(o.total)::float AS revenue
      FROM orders o
      JOIN addresses a ON a.id = o.shipping_address_id
      WHERE o.placed_at >= ${since}
      GROUP BY a.country_code
      ORDER BY revenue DESC
      LIMIT 10
    `;

    return {
      revenueByDay,
      ordersByStatus: (ordersByStatus as any[]).map(s => ({ status: s.status, count: s._count.id })),
      topProducts: (topProducts as any[]).map((p: any) => ({
        name: productMap[p.productId] || 'Unknown',
        revenue: Number(p._sum.total || 0),
        orders: p._count.id,
      })),
      summary: {
        totalRevenue: Number(totalRevenue._sum.total || 0),
        totalOrders,
        customRevenue: Number(customRevenue._sum.total || 0),
        avgOrderValue: totalOrders > 0 ? Number(totalRevenue._sum.total || 0) / totalOrders : 0,
      },
      customOrderFunnel: customFunnelRows,
      revenueByCategory: catRevRows,
      geoBreakdown: geoRows,
    };
  }

  async getAdminPayments(page: any = 1, limit: any = 50, status?: string, dateFrom?: string, dateTo?: string) {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(200, parseInt(limit) || 50);
    const where: any = {};
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59');
    }

    const [total, payments] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              user: { select: { fullName: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return { data: payments, meta: { total, page: p, limit: l } };
  }

  async getRevenueSplit(days = 30) {
    const d = Math.min(90, parseInt(String(days)) || 30);
    const since = new Date(Date.now() - d * 24 * 60 * 60 * 1000);

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        DATE(placed_at)::text AS date,
        order_type,
        SUM(total)::float AS revenue,
        COUNT(*)::int AS orders
      FROM orders
      WHERE placed_at >= ${since}
      GROUP BY DATE(placed_at), order_type
      ORDER BY date ASC
    `;

    const dateSet = new Set<string>(rows.map(r => String(r.date)));
    const dates = Array.from(dateSet).sort();

    return dates.map(date => {
      const dayRows = rows.filter(r => String(r.date) === date);
      const standard = dayRows.filter(r => r.order_type === 'standard');
      const custom = dayRows.filter(r => r.order_type === 'custom' || r.order_type === 'mixed');
      return {
        date,
        standardRevenue: standard.reduce((s, r) => s + Number(r.revenue), 0),
        customRevenue: custom.reduce((s, r) => s + Number(r.revenue), 0),
        totalRevenue: dayRows.reduce((s, r) => s + Number(r.revenue), 0),
        orders: dayRows.reduce((s, r) => s + Number(r.orders), 0),
      };
    });
  }

  async getAdminInvoices(page: any = 1, limit: any = 50, dateFrom?: string, dateTo?: string) {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(200, parseInt(limit) || 50);

    const where: any = { payments: { some: { status: 'paid' } } };
    if (dateFrom || dateTo) {
      where.placedAt = {};
      if (dateFrom) where.placedAt.gte = new Date(dateFrom);
      if (dateTo) where.placedAt.lte = new Date(dateTo + 'T23:59:59');
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: {
          user: { select: { fullName: true, email: true, companyName: true, vatNumber: true } },
          payments: { where: { status: 'paid' }, orderBy: { paidAt: 'desc' }, take: 1 },
          items: { include: { product: { select: { name: true, sku: true } } } },
        },
        orderBy: { placedAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return {
      data: orders.map(o => ({
        invoiceNumber: `INV-${o.orderNumber}`,
        orderId: o.id,
        orderNumber: o.orderNumber,
        customer: o.user,
        amount: Number(o.total),
        subtotal: Number(o.subtotal),
        taxAmount: Number(o.taxAmount),
        shippingCost: Number(o.shippingCost),
        currency: 'EUR',
        paidAt: o.payments[0]?.paidAt || null,
        provider: o.payments[0]?.provider || null,
        method: o.payments[0]?.method || null,
        placedAt: o.placedAt,
        items: o.items.map(i => ({
          name: (i as any).product?.name || 'Unknown',
          sku: (i as any).product?.sku || '',
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
        })),
      })),
      meta: { total, page: p, limit: l },
    };
  }

  async getAdminRefunds(page: any = 1, limit: any = 50) {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(200, parseInt(limit) || 50);

    const [total, payments] = await Promise.all([
      this.prisma.payment.count({ where: { status: { in: ['refunded', 'partially_refunded'] } } }),
      this.prisma.payment.findMany({
        where: { status: { in: ['refunded', 'partially_refunded'] } },
        include: {
          order: {
            select: {
              orderNumber: true,
              user: { select: { fullName: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return { data: payments, meta: { total, page: p, limit: l } };
  }

  async processRefund(paymentId: string, amount: number, reason?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'paid' && payment.status !== 'partially_refunded') {
      throw new BadRequestException('Payment is not eligible for refund');
    }

    const currentRefunded = Number(payment.refundedAmount || 0);
    const newRefunded = currentRefunded + amount;
    const originalAmount = Number(payment.amount);

    if (newRefunded > originalAmount) {
      throw new BadRequestException('Refund amount exceeds payment amount');
    }

    const newStatus = newRefunded >= originalAmount ? 'refunded' : 'partially_refunded';

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { refundedAmount: newRefunded, status: newStatus as any },
    });
    // Update order status when fully refunded
    if (newStatus === 'refunded') {
      await this.prisma.order.update({ where: { id: payment.orderId }, data: { status: 'cancelled' as any } });
    }
    return { ...updated, refundReason: reason || null };
  }

  async getAdminShipments(page: any = 1, limit: any = 20, search?: string) {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(100, parseInt(limit) || 20);
    const where: any = {};
    if (search) {
      where.OR = [
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { order: { user: { fullName: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    const [total, shipments] = await Promise.all([
      this.prisma.shipment.count({ where }),
      this.prisma.shipment.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              user: { select: { fullName: true, email: true } },
              shippingAddress: { select: { fullName: true, streetLine1: true, city: true, countryCode: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);
    return { data: shipments, meta: { total, page: p, limit: l } };
  }

  async createShipment(orderId: string, data: { carrier?: string; trackingNumber?: string; trackingUrl?: string; estimatedDelivery?: string }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    const shipment = await this.prisma.shipment.create({
      data: {
        orderId,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
        estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : undefined,
        status: 'pending',
      },
    });
    // Update order status to shipped if not already
    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'shipped' as any } });
    return shipment;
  }

  async updateShipment(shipmentId: string, data: { carrier?: string; trackingNumber?: string; trackingUrl?: string; status?: string; shippedAt?: string; deliveredAt?: string; estimatedDelivery?: string }) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
        status: data.status as any,
        shippedAt: data.shippedAt ? new Date(data.shippedAt) : undefined,
        deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : undefined,
        estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : undefined,
      },
    });
    // Sync order status with shipment status
    if (data.status === 'delivered') {
      await this.prisma.order.update({ where: { id: shipment.orderId }, data: { status: 'delivered' as any } });
    }
    return updated;
  }

  async bulkImport(userId: string, lines: { sku: string; productName: string; color?: string; size?: string; quantity: number; unitPrice: number }[]) {
    if (!lines?.length) throw new BadRequestException('No line items provided');

    // Try to match SKUs to products — unmatched lines still get created for admin review
    const skus = lines.map(l => l.sku).filter(Boolean);
    const products = await this.prisma.product.findMany({ where: { sku: { in: skus } } });
    const productBySku = Object.fromEntries(products.map(p => [p.sku!, p]));

    const resolvedSkus: string[] = [];
    const unresolvedSkus: string[] = [];

    for (const line of lines) {
      if (line.sku && productBySku[line.sku]) {
        resolvedSkus.push(line.sku);
      } else if (line.sku) {
        unresolvedSkus.push(line.sku);
      }
    }

    const subtotal = lines.reduce((sum, l) => sum + (l.unitPrice * l.quantity), 0);
    const shippingCost = subtotal > 150 ? 0 : 9.95;
    const taxAmount = Math.round(subtotal * 0.21 * 100) / 100;
    const total = subtotal + shippingCost + taxAmount;
    const orderNumber = `B2B-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const notes = [
      'B2B Bulk Import',
      unresolvedSkus.length ? `Manual review needed for SKUs: ${unresolvedSkus.join(', ')}` : '',
    ].filter(Boolean).join(' | ');

    const order = await this.prisma.order.create({
      data: {
        userId,
        orderNumber,
        orderType: 'standard',
        subtotal: Math.round(subtotal * 100) / 100,
        shippingCost,
        taxAmount,
        total: Math.round(total * 100) / 100,
        status: 'pending',
        notes,
        items: {
          create: lines.map(line => {
            const product = line.sku ? productBySku[line.sku] : null;
            return {
              productId: product?.id ?? null,
              productName: line.productName || product?.name || line.sku || 'Unknown',
              sku: line.sku || null,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              total: Math.round(line.unitPrice * line.quantity * 100) / 100,
            };
          }) as any,
        },
      },
      include: { items: { include: { product: { select: { name: true, sku: true } } } } },
    });

    return { order, unresolvedSkus };
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
