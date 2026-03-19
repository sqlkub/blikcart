import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SamplesService {
  constructor(private prisma: PrismaService) {}

  // ─── Client: submit a new sample request ──────────────────────────────────

  async createSample(userId: string, dto: {
    categorySlug: string;
    productName: string;
    description?: string;
    configSnapshot: Record<string, unknown>;
    schemaVersionId?: string;
    quantity?: number;
    clientNotes?: string;
    referenceFiles?: string[];
  }) {
    return this.prisma.sample.create({
      data: {
        userId,
        categorySlug: dto.categorySlug,
        productName: dto.productName,
        description: dto.description,
        configSnapshot: dto.configSnapshot,
        schemaVersionId: dto.schemaVersionId,
        quantity: dto.quantity ?? 1,
        clientNotes: dto.clientNotes,
        referenceFiles: dto.referenceFiles ?? [],
        version: 1,
      },
      include: { user: { select: { id: true, fullName: true, companyName: true, email: true } } },
    });
  }

  // ─── Client: request a revision (V2, V3, …) ───────────────────────────────

  async requestRevision(sampleId: string, userId: string, dto: {
    configSnapshot?: Record<string, unknown>;
    clientNotes?: string;
    referenceFiles?: string[];
  }) {
    const original = await this.prisma.sample.findUnique({ where: { id: sampleId } });
    if (!original) throw new NotFoundException('Sample not found');
    if (original.userId !== userId) throw new ForbiddenException();
    if (original.status !== 'revision_requested' && original.status !== 'rejected') {
      throw new BadRequestException('Can only revise samples that are revision_requested or rejected');
    }

    // Find root sample (parentSampleId=null is the root)
    const rootId = original.parentSampleId ?? original.id;

    // Count existing versions under this root
    const existingVersions = await this.prisma.sample.count({
      where: { OR: [{ id: rootId }, { parentSampleId: rootId }] },
    });

    return this.prisma.sample.create({
      data: {
        userId,
        categorySlug: original.categorySlug,
        productName: original.productName,
        description: original.description,
        configSnapshot: (dto.configSnapshot ?? original.configSnapshot) as any,
        schemaVersionId: original.schemaVersionId,
        quantity: original.quantity,
        clientNotes: dto.clientNotes ?? original.clientNotes,
        referenceFiles: dto.referenceFiles ?? original.referenceFiles,
        parentSampleId: rootId,
        version: existingVersions + 1,
      },
      include: { user: { select: { id: true, fullName: true, companyName: true, email: true } } },
    });
  }

  // ─── Client: list own samples ──────────────────────────────────────────────

  async getUserSamples(userId: string) {
    const samples = await this.prisma.sample.findMany({
      where: { userId, parentSampleId: null }, // only root versions
      orderBy: { requestedAt: 'desc' },
      include: {
        revisions: { orderBy: { version: 'asc' } },
        template: { select: { id: true, name: true, isPublic: true } },
      },
    });
    return samples;
  }

  // ─── Client: get single sample detail ─────────────────────────────────────

  async getSampleById(sampleId: string, userId?: string) {
    const sample = await this.prisma.sample.findUnique({
      where: { id: sampleId },
      include: {
        user: { select: { id: true, fullName: true, companyName: true, email: true } },
        revisions: { orderBy: { version: 'asc' } },
        template: true,
      },
    });
    if (!sample) throw new NotFoundException('Sample not found');
    if (userId && sample.userId !== userId) throw new ForbiddenException();
    return sample;
  }

  // ─── Client: 1-click reorder from approved sample ─────────────────────────

  async reorderFromSample(sampleId: string, userId: string, quantity: number) {
    const sample = await this.prisma.sample.findUnique({ where: { id: sampleId } });
    if (!sample) throw new NotFoundException('Sample not found');
    if (sample.userId !== userId) throw new ForbiddenException();
    if (sample.status !== 'approved') throw new BadRequestException('Can only reorder from approved samples');

    // Create a new custom order draft pre-filled with the sample's config
    return this.prisma.customOrder.create({
      data: {
        userId,
        productId: await this.resolveProductByCategory(sample.categorySlug),
        schemaVersionId: sample.schemaVersionId,
        configSnapshot: sample.configSnapshot as any,
        quantity: quantity || sample.quantity,
        notes: `Reorder from approved sample V${sample.version}: ${sample.productName}`,
        status: 'draft',
      },
    });
  }

  // ─── Client: reorder from library template ────────────────────────────────

  async reorderFromTemplate(templateId: string, userId: string, quantity: number) {
    const template = await this.prisma.sampleTemplate.findUnique({
      where: { id: templateId },
      include: { sample: true },
    });
    if (!template) throw new NotFoundException('Template not found');
    if (!template.isPublic && template.sample.userId !== userId) throw new ForbiddenException();

    // Increment usage count
    await this.prisma.sampleTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    return this.prisma.customOrder.create({
      data: {
        userId,
        productId: await this.resolveProductByCategory(template.categorySlug),
        schemaVersionId: template.sample.schemaVersionId,
        configSnapshot: template.configSnapshot as any,
        quantity: quantity || 1,
        notes: `From sampling library: ${template.name}`,
        status: 'draft',
      },
    });
  }

  // ─── Client: browse public sampling library ───────────────────────────────

  async getLibrary(categorySlug?: string) {
    return this.prisma.sampleTemplate.findMany({
      where: {
        isPublic: true,
        ...(categorySlug ? { categorySlug } : {}),
      },
      orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
      include: {
        sample: {
          select: {
            id: true,
            productName: true,
            version: true,
            approvedAt: true,
            user: { select: { companyName: true } },
          },
        },
      },
    });
  }

  // ─── Admin: list all samples ───────────────────────────────────────────────

  async getAdminSamples(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = {
      ...(status ? { status: status as any } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.sample.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, companyName: true, email: true, wholesaleTier: true } },
          template: { select: { id: true, name: true } },
        },
      }),
      this.prisma.sample.count({ where }),
    ]);

    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  // ─── Admin: update sample status ──────────────────────────────────────────

  async updateSampleStatus(sampleId: string, status: string, adminNotes?: string, samplingFee?: number) {
    const sample = await this.prisma.sample.findUnique({ where: { id: sampleId } });
    if (!sample) throw new NotFoundException('Sample not found');

    return this.prisma.sample.update({
      where: { id: sampleId },
      data: {
        status: status as any,
        ...(adminNotes ? { adminNotes } : {}),
        ...(samplingFee !== undefined ? { samplingFee } : {}),
        ...(status === 'approved' ? { approvedAt: new Date() } : {}),
      },
      include: { user: { select: { id: true, fullName: true, companyName: true, email: true } } },
    });
  }

  // ─── Admin: approve sample and optionally save to library ─────────────────

  async approveSample(sampleId: string, dto: {
    adminNotes?: string;
    samplingFee?: number;
    saveToLibrary?: boolean;
    templateName?: string;
    templateDescription?: string;
    isPublic?: boolean;
  }) {
    const sample = await this.prisma.sample.findUnique({ where: { id: sampleId } });
    if (!sample) throw new NotFoundException('Sample not found');

    const updated = await this.prisma.sample.update({
      where: { id: sampleId },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        ...(dto.adminNotes ? { adminNotes: dto.adminNotes } : {}),
        ...(dto.samplingFee !== undefined ? { samplingFee: dto.samplingFee } : {}),
      },
    });

    let template = null;
    if (dto.saveToLibrary) {
      template = await this.prisma.sampleTemplate.upsert({
        where: { sampleId },
        create: {
          sampleId,
          name: dto.templateName || sample.productName,
          description: dto.templateDescription,
          categorySlug: sample.categorySlug,
          isPublic: dto.isPublic ?? false,
          configSnapshot: sample.configSnapshot as any,
        },
        update: {
          name: dto.templateName || sample.productName,
          description: dto.templateDescription,
          isPublic: dto.isPublic ?? false,
        },
      });
    }

    return { sample: updated, template };
  }

  // ─── Admin: get library (admin view, all templates) ───────────────────────

  async getAdminLibrary() {
    return this.prisma.sampleTemplate.findMany({
      orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
      include: {
        sample: {
          include: {
            user: { select: { id: true, fullName: true, companyName: true } },
          },
        },
      },
    });
  }

  // ─── Admin: toggle template visibility ────────────────────────────────────

  async toggleTemplateVisibility(templateId: string, isPublic: boolean) {
    return this.prisma.sampleTemplate.update({
      where: { id: templateId },
      data: { isPublic },
    });
  }

  // ─── Helper: resolve a product ID from category slug ──────────────────────

  private async resolveProductByCategory(categorySlug: string): Promise<string> {
    const product = await this.prisma.product.findFirst({
      where: { category: { slug: categorySlug }, isCustomizable: true, isActive: true },
    });
    if (!product) throw new BadRequestException(`No customizable product found for category: ${categorySlug}`);
    return product.id;
  }
}
