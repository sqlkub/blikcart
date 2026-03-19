import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    type: string;        // 'change_request' | 'status_update' | 'manual_email' | 'manual_whatsapp'
    channels: string[];  // ['email', 'whatsapp', 'in_app']
    orderId?: string;
    fromUserId?: string;
    subject?: string;
    body: string;
    metadata?: any;      // { clientPhone, manufacturerPhone, orderNumber, newStatus, etc }
  }) {
    return (this.prisma as any).notification.create({
      data: {
        type: data.type,
        channels: data.channels.join(','),
        orderId: data.orderId || null,
        fromUserId: data.fromUserId || null,
        subject: data.subject || null,
        body: data.body,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        isRead: false,
      },
    });
  }

  async getAll(page = 1, limit = 50) {
    const p = Math.max(1, page);
    const l = Math.min(100, limit);
    const [total, items] = await Promise.all([
      (this.prisma as any).notification.count(),
      (this.prisma as any).notification.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
        include: {
          order: { select: { orderNumber: true } },
          fromUser: { select: { fullName: true, email: true, companyName: true } },
        },
      }),
    ]);
    return {
      data: items.map((n: any) => ({
        ...n,
        channels: n.channels ? n.channels.split(',') : [],
        metadata: n.metadata ? JSON.parse(n.metadata) : null,
      })),
      meta: { total, page: p, limit: l },
    };
  }

  async markRead(id: string) {
    return (this.prisma as any).notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllRead() {
    return (this.prisma as any).notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
  }

  async getUnreadCount() {
    return (this.prisma as any).notification.count({ where: { isRead: false } });
  }
}
