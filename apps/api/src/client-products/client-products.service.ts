import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClientProductsService {
  constructor(private prisma: PrismaService) {}

  // ── Admin ─────────────────────────────────────────────────────────────────

  async adminList(clientId?: string, status?: string) {
    return this.prisma.clientProduct.findMany({
      where: {
        parentId: null, // only root versions
        ...(clientId ? { clientId } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: {
        client: { select: { id: true, fullName: true, email: true, companyName: true } },
        manufacturer: { select: { id: true, name: true } },
        backupManufacturer: { select: { id: true, name: true } },
        versions: { orderBy: { version: 'desc' }, take: 5 },
        _count: { select: { reorders: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async adminGet(id: string) {
    const product = await this.prisma.clientProduct.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, fullName: true, email: true, companyName: true, wholesaleTier: true } },
        manufacturer: true,
        backupManufacturer: true,
        versions: { orderBy: { version: 'desc' } },
        reorders: {
          orderBy: { createdAt: 'desc' },
          include: { proforma: { select: { id: true, invoiceNumber: true, status: true } } },
          take: 10,
        },
      },
    });
    if (!product) throw new NotFoundException('Client product not found');
    return this.format(product);
  }

  async adminCreate(data: {
    clientId: string; name: string; category: string; specifications?: any;
    basePrice: number; unitPrice: number; moq?: number; leadTimeDays?: number;
    manufacturerId?: string; backupManufacturerId?: string;
    adminNotes?: string; sampleId?: string;
  }) {
    return this.prisma.clientProduct.create({
      data: {
        clientId: data.clientId,
        name: data.name,
        category: data.category,
        specifications: data.specifications || {},
        basePrice: data.basePrice,
        unitPrice: data.unitPrice,
        moq: data.moq || 1,
        leadTimeDays: data.leadTimeDays || 21,
        manufacturerId: data.manufacturerId || null,
        backupManufacturerId: data.backupManufacturerId || null,
        adminNotes: data.adminNotes || null,
        sampleId: data.sampleId || null,
        status: 'draft',
        version: 1,
      },
      include: { client: { select: { id: true, fullName: true, email: true, companyName: true } } },
    });
  }

  async adminUpdate(id: string, data: any) {
    const allowed = ['name', 'category', 'specifications', 'status', 'basePrice', 'unitPrice',
      'moq', 'leadTimeDays', 'manufacturerId', 'backupManufacturerId', 'adminNotes', 'images'];
    const updateData: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    if (updateData.basePrice) updateData.basePrice = Number(updateData.basePrice);
    if (updateData.unitPrice) updateData.unitPrice = Number(updateData.unitPrice);
    return this.prisma.clientProduct.update({ where: { id }, data: updateData });
  }

  async adminNewVersion(id: string, data: any) {
    const existing = await this.prisma.clientProduct.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found');

    // Find the root product (parentId is null on V1)
    const rootId = existing.parentId || existing.id;

    // Count existing versions to determine next version number
    const count = await this.prisma.clientProduct.count({ where: { parentId: rootId } });

    return this.prisma.clientProduct.create({
      data: {
        clientId: existing.clientId,
        name: data.name || existing.name,
        category: existing.category,
        specifications: data.specifications || (existing.specifications as Prisma.InputJsonValue),
        basePrice: Number(data.basePrice || existing.basePrice),
        unitPrice: Number(data.unitPrice || existing.unitPrice),
        moq: existing.moq,
        leadTimeDays: existing.leadTimeDays,
        manufacturerId: data.manufacturerId || existing.manufacturerId,
        backupManufacturerId: data.backupManufacturerId || existing.backupManufacturerId,
        adminNotes: data.adminNotes || null,
        sampleId: data.sampleId || null,
        status: 'draft',
        version: count + 2, // +1 for root (V1), +1 for the new one
        parentId: rootId,
      },
    });
  }

  // ── Client ────────────────────────────────────────────────────────────────

  async clientGetMine(userId: string) {
    // Return only approved products visible to this client (all versions → latest approved)
    const products = await this.prisma.clientProduct.findMany({
      where: { clientId: userId, status: 'approved', parentId: null },
      include: {
        manufacturer: { select: { id: true, name: true, leadTimeDays: true } },
        versions: {
          where: { status: 'approved' },
          orderBy: { version: 'desc' },
          take: 1,
        },
        _count: { select: { reorders: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Also include latest approved version even if root is still in draft
    const versioned = await this.prisma.clientProduct.findMany({
      where: { clientId: userId, status: 'approved', parentId: { not: null } },
      include: {
        manufacturer: { select: { id: true, name: true, leadTimeDays: true } },
        _count: { select: { reorders: true } },
      },
      orderBy: { version: 'desc' },
    });

    return [...products, ...versioned].map(this.format);
  }

  async clientReorder(userId: string, productId: string, quantity: number, notes?: string) {
    const product = await this.prisma.clientProduct.findFirst({
      where: { id: productId, clientId: userId, status: 'approved' },
      include: { client: true },
    });
    if (!product) throw new ForbiddenException('Product not found or not yet approved');

    const unitPrice = Number(product.unitPrice);
    const totalPrice = unitPrice * quantity;

    // Create reorder
    const reorder = await this.prisma.clientProductReorder.create({
      data: {
        clientProductId: productId,
        clientId: userId,
        quantity,
        unitPrice,
        totalPrice,
        notes: notes || null,
        status: 'pending',
      },
    });

    // Auto-generate proforma invoice
    const proforma = await this.generateProforma(userId, product, quantity, unitPrice, totalPrice, reorder.id);

    // Link proforma to reorder
    await this.prisma.clientProductReorder.update({
      where: { id: reorder.id },
      data: { proformaId: proforma.id },
    });

    return { reorder: { ...reorder, proformaId: proforma.id }, proforma };
  }

  private async generateProforma(
    userId: string, product: any, quantity: number,
    unitPrice: number, totalPrice: number, reorderId: string,
  ) {
    const taxAmount = Math.round(totalPrice * 0.21 * 100) / 100;
    const total = totalPrice + taxAmount;
    const invoiceNumber = `PRO-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    return this.prisma.proformaInvoice.create({
      data: {
        invoiceNumber,
        clientId: userId,
        status: 'draft',
        lines: [{
          productId: product.id,
          productName: product.name,
          category: product.category,
          version: `V${product.version}`,
          quantity,
          unitPrice,
          total: totalPrice,
        }] as unknown as Prisma.InputJsonValue,
        clientDetails: {
          fullName: product.client?.fullName,
          email: product.client?.email,
          companyName: product.client?.companyName,
        } as unknown as Prisma.InputJsonValue,
        subtotal: totalPrice,
        taxAmount,
        total,
        estimatedDelivery: product.leadTimeDays || 21,
      },
    });
  }

  private format(p: any) {
    return {
      ...p,
      basePrice: Number(p.basePrice),
      unitPrice: Number(p.unitPrice),
      reorderCount: p._count?.reorders ?? 0,
    };
  }
}
