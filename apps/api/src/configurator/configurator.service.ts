import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfiguratorService {
  private s3: S3Client;

  constructor(private prisma: PrismaService, private config: ConfigService) {
    this.s3 = new S3Client({
      region: config.get('AWS_REGION', 'eu-west-1'),
      endpoint: config.get('S3_ENDPOINT'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID', 'test'),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY', 'test'),
      },
    });
  }

  async getSchema(categorySlug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
      include: {
        configuratorSchema: {
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!category?.configuratorSchema) {
      throw new NotFoundException(`No configurator found for category: ${categorySlug}`);
    }

    const schema = category.configuratorSchema;
    const version = schema.versions[0];

    return {
      schemaVersionId: version.id,
      categorySlug,
      basePrice: Number(schema.basePrice),
      moq: schema.moq,
      leadTimeStandardDays: schema.leadTimeStandardDays,
      leadTimeExpressDays: schema.leadTimeExpressDays,
      expressPriceMultiplier: Number(schema.expressPriceMultiplier),
      steps: this.normalizeSteps(version.steps as any[]),
    };
  }

  /**
   * Converts legacy / spec-document step formats to the canonical ConfiguratorStep shape.
   * The admin editor saves steps correctly, but schemas imported from spec docs
   * may use `name` instead of `title`, plain string options, `parameters` objects, etc.
   */
  private normalizeSteps(steps: any[]): any[] {
    if (!Array.isArray(steps)) return [];
    return steps.map((s, index) => {
      // Already in correct format — has id and ui_type as expected
      if (s.id && s.ui_type && Array.isArray(s.options) && (s.options.length === 0 || typeof s.options[0] === 'object')) {
        return s;
      }

      // Legacy / spec-doc format: `name`, `step`, string options, `parameters`, `checks`
      const id = s.id || `step-${index + 1}`;
      const title = s.title || s.name || `Step ${index + 1}`;
      const description = s.description || '';
      const order = typeof s.order === 'number' ? s.order : (typeof s.step === 'number' ? s.step : index + 1);

      // Build flat options list from whichever fields are present
      let rawOpts: string[] = [];

      if (Array.isArray(s.options)) {
        // options: ["Straight", "Curved"] or [{ label, id }]
        rawOpts = s.options.map((o: any) => (typeof o === 'string' ? o : o.label || String(o)));
      } else if (s.parameters && typeof s.parameters === 'object') {
        // parameters: { leather_type: [...], padding: [...] }
        for (const [groupName, values] of Object.entries(s.parameters)) {
          if (Array.isArray(values)) {
            for (const v of values) {
              if (typeof v === 'string') {
                rawOpts.push(`${this.titleCase(groupName)}: ${v}`);
              } else if (typeof v === 'object' && v !== null) {
                // e.g. { size: "Pony", width_mm: 18, length_mm: 380 }
                const label = (v as any).size || (v as any).label || JSON.stringify(v);
                const desc = Object.entries(v as object)
                  .filter(([k]) => k !== 'size' && k !== 'label')
                  .map(([k, val]) => `${k}: ${val}`)
                  .join(', ');
                rawOpts.push(desc ? `${label} (${desc})` : label);
              }
            }
          } else if (typeof values === 'string' || typeof values === 'number') {
            rawOpts.push(`${this.titleCase(groupName)}: ${values}`);
          }
        }
      } else if (Array.isArray(s.checks)) {
        // Quality control steps — list checks as info options, make step optional
        rawOpts = s.checks;
      }

      const options = rawOpts.map((label: string, i: number) => ({
        id: `${id}-opt-${i + 1}`,
        label,
        price_modifier: 0,
      }));

      // Determine best ui_type
      let ui_type = s.ui_type || 'image_card_grid';
      if (!s.ui_type) {
        if (Array.isArray(s.checks)) ui_type = 'notes_upload';
        else if (options.length > 6) ui_type = 'dropdown';
        else if (options.length <= 2) ui_type = 'icon_radio';
      }

      return {
        id,
        title,
        description,
        order,
        ui_type,
        required: Array.isArray(s.checks) ? false : (s.required !== false),
        options,
      };
    });
  }

  private titleCase(str: string): string {
    return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  async createDraft(userId: string, productId: string, schemaVersionId: string, selections?: Record<string, string>) {
    const [product, schemaVersion] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: productId } }),
      this.prisma.schemaVersion.findUnique({ where: { id: schemaVersionId }, include: { schema: true } }),
    ]);

    if (!product?.isCustomizable) throw new BadRequestException('Product is not customizable');
    if (!schemaVersion) throw new NotFoundException('Schema version not found');

    const draft = await this.prisma.customOrder.create({
      data: {
        userId,
        productId,
        schemaId: schemaVersion.schemaId,
        schemaVersionId,
        configSnapshot: selections || {},
        quantity: schemaVersion.schema.moq,
        status: 'draft',
      },
    });

    return { id: draft.id, status: draft.status, selections: draft.configSnapshot, createdAt: draft.createdAt };
  }

  async updateDraft(draftId: string, userId: string, selections: Record<string, string>, quantity?: number, notes?: string) {
    const draft = await this.prisma.customOrder.findFirst({
      where: { id: draftId, userId, status: 'draft' },
      include: { schemaVersion: true, product: true },
    });

    if (!draft) throw new NotFoundException('Draft not found');

    const steps = draft.schemaVersion?.steps as any[];
    const estimate = this.calculatePriceEstimate(
      Number(draft.product.basePrice),
      steps || [],
      selections,
      quantity || draft.quantity,
    );

    const completionPercent = this.calcCompletion(steps || [], selections);

    const updated = await this.prisma.customOrder.update({
      where: { id: draftId },
      data: {
        configSnapshot: selections,
        quantity: quantity || draft.quantity,
        notes,
        estimatedPriceMin: estimate.min,
        estimatedPriceMax: estimate.max,
      },
    });

    return {
      id: updated.id,
      selections: updated.configSnapshot,
      quantity: updated.quantity,
      estimatedPrice: estimate,
      completionPercent,
      updatedAt: updated.updatedAt,
    };
  }

  async submitDraft(draftId: string, userId: string, referenceFiles?: string[], internalRef?: string) {
    const draft = await this.prisma.customOrder.findFirst({
      where: { id: draftId, userId, status: 'draft' },
      include: { schemaVersion: true },
    });

    if (!draft) throw new NotFoundException('Draft not found');

    // Validate required steps (skip quantity_delivery — stored as draft.quantity, not in selections)
    const steps = draft.schemaVersion?.steps as any[] || [];
    const selections = draft.configSnapshot as Record<string, string>;
    const missing = steps
      .filter(s => s.required && s.ui_type !== 'quantity_delivery' && !selections[s.id])
      .map(s => s.title);

    if (missing.length > 0) {
      throw new BadRequestException(`Please complete required steps: ${missing.join(', ')}`);
    }

    const updated = await this.prisma.customOrder.update({
      where: { id: draftId },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
        referenceFiles: referenceFiles || [],
        internalRef,
      },
    });

    return { id: updated.id, status: updated.status, submittedAt: updated.submittedAt };
  }

  async getUserDrafts(userId: string) {
    const drafts = await this.prisma.customOrder.findMany({
      where: { userId, status: 'draft' },
      include: { product: { select: { name: true, slug: true, images: { where: { isPrimary: true } } } } },
      orderBy: { updatedAt: 'desc' },
    });
    return drafts;
  }

  calculatePriceEstimate(basePrice: number, steps: any[], selections: Record<string, string>, quantity: number) {
    let unitPrice = basePrice;

    for (const step of steps) {
      const selectedOptionId = selections[step.id];
      if (selectedOptionId && step.options) {
        const option = step.options.find((o: any) => o.id === selectedOptionId);
        if (option) unitPrice += option.price_modifier || 0;
      }
    }

    // Quantity discount tiers
    let discount = 0;
    if (quantity >= 100) discount = 0.18;
    else if (quantity >= 50) discount = 0.15;
    else if (quantity >= 20) discount = 0.10;
    else if (quantity >= 5) discount = 0.05;

    const discountedPrice = unitPrice * (1 - discount);

    return {
      unitPrice: Math.round(discountedPrice * 100) / 100,
      min: Math.round(discountedPrice * 0.95 * 100) / 100,
      max: Math.round(discountedPrice * 1.10 * 100) / 100,
      total: Math.round(discountedPrice * quantity * 100) / 100,
      currency: 'EUR',
      quantityDiscount: discount,
    };
  }

  private calcCompletion(steps: any[], selections: Record<string, string>): number {
    const required = steps.filter(s => s.required && s.ui_type !== 'quantity_delivery');
    if (!required.length) return 100;
    const done = required.filter(s => selections[s.id]).length;
    return Math.round((done / required.length) * 100);
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  async adminGetSchema(id: string) {
    const schema = await this.prisma.configuratorSchema.findUnique({
      where: { id },
      include: {
        category: { select: { name: true, slug: true } },
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });
    if (!schema) throw new NotFoundException(`Schema not found`);
    return {
      ...schema,
      basePrice: Number(schema.basePrice),
      expressPriceMultiplier: Number(schema.expressPriceMultiplier),
    };
  }

  async adminListSchemas() {
    const schemas = await this.prisma.configuratorSchema.findMany({
      include: {
        category: { select: { name: true, slug: true } },
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
        _count: { select: { versions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return schemas.map(s => ({
      ...s,
      basePrice: Number(s.basePrice),
      expressPriceMultiplier: Number(s.expressPriceMultiplier),
      versionCount: (s as any)._count.versions,
      latestVersion: s.versions[0] || null,
    }));
  }

  async adminCreateSchema(data: any) {
    return this.prisma.configuratorSchema.create({
      data: {
        categoryId: data.categoryId,
        basePrice: Number(data.basePrice) || 0,
        moq: Number(data.moq) || 1,
        leadTimeStandardDays: Number(data.leadTimeStandardDays) || 21,
        leadTimeExpressDays: Number(data.leadTimeExpressDays) || 10,
        expressPriceMultiplier: Number(data.expressPriceMultiplier) || 1.25,
        isActive: data.isActive !== false,
        versions: {
          create: {
            versionNumber: 1,
            steps: data.steps || [],
            notes: data.notes || 'Initial version',
          },
        },
      },
      include: {
        category: { select: { name: true, slug: true } },
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });
  }

  async adminUpdateSchema(id: string, data: any) {
    const allowed = ['basePrice', 'moq', 'leadTimeStandardDays', 'leadTimeExpressDays', 'expressPriceMultiplier', 'isActive'];
    const updateData: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    ['basePrice', 'expressPriceMultiplier'].forEach(k => {
      if (updateData[k] !== undefined) updateData[k] = Number(updateData[k]);
    });
    ['moq', 'leadTimeStandardDays', 'leadTimeExpressDays'].forEach(k => {
      if (updateData[k] !== undefined) updateData[k] = Number(updateData[k]);
    });
    return this.prisma.configuratorSchema.update({ where: { id }, data: updateData });
  }

  async adminPublishVersion(schemaId: string, steps: any, notes?: string) {
    const latest = await this.prisma.schemaVersion.findFirst({
      where: { schemaId },
      orderBy: { versionNumber: 'desc' },
    });
    const nextVersion = (latest?.versionNumber || 0) + 1;
    return this.prisma.schemaVersion.create({
      data: {
        schemaId,
        versionNumber: nextVersion,
        steps,
        notes: notes || `Version ${nextVersion}`,
      },
    });
  }

  async getUploadUrl(filename: string, contentType: string) {
    const key = `uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const command = new PutObjectCommand({
      Bucket: this.config.get('S3_BUCKET_NAME', 'blikcart-assets'),
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    const fileUrl = `${this.config.get('CLOUDFRONT_URL')}/${key}`;

    return { uploadUrl, fileUrl, expiresIn: 300 };
  }
}
