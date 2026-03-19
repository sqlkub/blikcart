import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProformaService {
  constructor(private prisma: PrismaService) {}

  async getForClient(userId: string) {
    return this.prisma.proformaInvoice.findMany({
      where: { clientId: userId },
      include: { reorders: { include: { clientProduct: { select: { name: true, category: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, userId?: string) {
    const inv = await this.prisma.proformaInvoice.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, fullName: true, email: true, companyName: true, vatNumber: true } },
        reorders: { include: { clientProduct: { select: { id: true, name: true, category: true, version: true } } } },
      },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    if (userId && inv.clientId !== userId) throw new NotFoundException('Invoice not found');
    return this.format(inv);
  }

  async adminList(status?: string, clientId?: string) {
    return this.prisma.proformaInvoice.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(clientId ? { clientId } : {}),
      },
      include: { client: { select: { id: true, fullName: true, email: true, companyName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: 'draft' | 'sent' | 'approved' | 'rejected') {
    const data: any = { status };
    if (status === 'sent') data.sentAt = new Date();
    if (status === 'approved') data.approvedAt = new Date();
    return this.prisma.proformaInvoice.update({ where: { id }, data });
  }

  async updateNotes(id: string, notes: string) {
    return this.prisma.proformaInvoice.update({ where: { id }, data: { notes } });
  }

  private format(inv: any) {
    return {
      ...inv,
      subtotal: Number(inv.subtotal),
      taxAmount: Number(inv.taxAmount),
      total: Number(inv.total),
    };
  }
}
