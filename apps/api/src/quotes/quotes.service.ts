import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  async sendQuote(adminId: string, customOrderId: string, dto: { unitPrice: number; leadTimeDays: number; message?: string; validDays?: number }) {
    const customOrder = await this.prisma.customOrder.findUnique({ where: { id: customOrderId } });
    if (!customOrder) throw new NotFoundException('Custom order not found');

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (dto.validDays || 14));

    const totalPrice = dto.unitPrice * customOrder.quantity;

    // Check for existing quote - if exists, create revision
    const existingQuote = await this.prisma.quote.findUnique({ where: { customOrderId } });

    let quote;
    if (existingQuote) {
      // Create revision
      const revisionCount = await this.prisma.quoteRevision.count({ where: { quoteId: existingQuote.id } });
      await this.prisma.quoteRevision.create({
        data: {
          quoteId: existingQuote.id,
          revisionNumber: revisionCount + 1,
          unitPrice: existingQuote.unitPrice,
          message: existingQuote.message || '',
        },
      });

      quote = await this.prisma.quote.update({
        where: { id: existingQuote.id },
        data: {
          unitPrice: dto.unitPrice,
          totalPrice,
          leadTimeDays: dto.leadTimeDays,
          message: dto.message,
          validUntil,
          status: 'revised',
          sentAt: new Date(),
          respondedAt: null,
        },
      });
    } else {
      quote = await this.prisma.quote.create({
        data: {
          customOrderId,
          adminId,
          unitPrice: dto.unitPrice,
          totalPrice,
          leadTimeDays: dto.leadTimeDays,
          validUntil,
          message: dto.message,
          status: 'sent',
        },
      });
    }

    // Update custom order status
    await this.prisma.customOrder.update({
      where: { id: customOrderId },
      data: { status: 'quoted', confirmedUnitPrice: dto.unitPrice, leadTimeDays: dto.leadTimeDays },
    });

    return quote;
  }

  async respondToQuote(quoteId: string, userId: string, action: 'accept' | 'decline') {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { customOrder: true },
    });

    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.customOrder.userId !== userId) throw new ForbiddenException();

    const status = action === 'accept' ? 'accepted' : 'declined';
    const customOrderStatus = action === 'accept' ? 'approved' : 'submitted';

    await Promise.all([
      this.prisma.quote.update({ where: { id: quoteId }, data: { status, respondedAt: new Date() } }),
      this.prisma.customOrder.update({ where: { id: quote.customOrderId }, data: { status: customOrderStatus } }),
    ]);

    return { success: true, status };
  }

  async getUserOrders(userId: string) {
    const orders = await this.prisma.customOrder.findMany({
      where: { userId },
      include: {
        product: { select: { name: true, slug: true, images: { where: { isPrimary: true } } } },
        quote: { select: { status: true, unitPrice: true, totalPrice: true, validUntil: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return orders.map(o => ({
      ...o,
      estimatedPriceMin: o.estimatedPriceMin ? Number(o.estimatedPriceMin) : null,
      estimatedPriceMax: o.estimatedPriceMax ? Number(o.estimatedPriceMax) : null,
    }));
  }

  async getCustomOrderDetails(id: string) {
    const order = await this.prisma.customOrder.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, email: true, companyName: true } },
        product: { select: { name: true, slug: true, images: { where: { isPrimary: true } } } },
        schemaVersion: { select: { steps: true, versionNumber: true } },
        quote: { include: { revisions: true } },
        messages: {
          include: { sender: { select: { fullName: true, accountType: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) throw new NotFoundException('Custom order not found');
    return {
      ...order,
      estimatedPriceMin: order.estimatedPriceMin ? Number(order.estimatedPriceMin) : null,
      estimatedPriceMax: order.estimatedPriceMax ? Number(order.estimatedPriceMax) : null,
    };
  }

  async sendMessage(customOrderId: string, senderId: string, body: string, attachments?: string[]) {
    return this.prisma.message.create({
      data: { customOrderId, senderId, body, attachments: attachments || [] },
      include: { sender: { select: { fullName: true, accountType: true } } },
    });
  }
}
