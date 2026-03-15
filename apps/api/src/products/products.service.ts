import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
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

  async findAll(params: any) {
    const { categorySlug, search, isCustomizable, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    let categoryIds: string[] | undefined;

    if (categorySlug) {
      const cat = await this.prisma.category.findUnique({
        where: { slug: categorySlug },
        include: {
          children: {
            include: { children: true }
          }
        },
      });

      if (cat) {
        const childIds = cat.children.map((c: any) => c.id);
        const grandchildIds = cat.children.flatMap((c: any) => c.children.map((gc: any) => gc.id));
        categoryIds = [cat.id, ...childIds, ...grandchildIds];
      }
    }

    const where: any = { isActive: true };
    if (categoryIds) where.categoryId = { in: categoryIds };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (isCustomizable !== undefined) where.isCustomizable = isCustomizable === 'true';
    if (params.tags) where.tags = { has: params.tags };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where, skip, take: Number(limit),
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          category: { include: { parent: true } },
          variants: { where: { isActive: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: data.map(this.fmt),
      meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: { include: { parent: true } },
        variants: { where: { isActive: true } },
      },
    });
    if (!product) return null;

    // Attach variant swatch images (stored as ProductImage with layerType='variant')
    const variantImages = await this.prisma.productImage.findMany({
      where: { productId: product.id, layerType: 'variant' },
    });
    const varImgMap = new Map(variantImages.map(i => [i.layerVariantKey, i.url]));

    return this.fmt({
      ...product,
      variants: product.variants.map((v: any) => ({ ...v, imageUrl: varImgMap.get(v.id) || null })),
    });
  }

  async findCategories() {
    return this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            }
          }
        },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }


  async update(id: string, data: any) {
    const allowed = ['name', 'description', 'basePrice', 'wholesalePrice', 'moq', 'leadTimeDays', 'isActive', 'isCustomizable', 'imageUrl', 'tags'];
    const updateData: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    if (data.basePrice !== undefined) updateData.basePrice = Number(data.basePrice);
    if (data.wholesalePrice !== undefined) updateData.wholesalePrice = Number(data.wholesalePrice);
    if (data.moq !== undefined) updateData.moq = Number(data.moq);
    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true, images: true },
    });
    return this.fmt(product);
  }
  async uploadImage(productId: string, file: Express.Multer.File, isPrimary: boolean, layerType?: string) {
    const key = `products/${productId}/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.config.get('S3_BUCKET_NAME', 'blikcart-assets'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const cloudfrontUrl = this.config.get('CLOUDFRONT_URL');
    const bucket = this.config.get('S3_BUCKET_NAME', 'blikcart-assets');
    const region = this.config.get('AWS_REGION', 'eu-west-1');
    const url = cloudfrontUrl
      ? `${cloudfrontUrl}/${key}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    if (isPrimary) {
      await this.prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
    }

    return this.prisma.productImage.create({
      data: { productId, url, isPrimary, sortOrder: 0, layerType: layerType || null },
    });
  }

  async listImages(productId: string) {
    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async updateImage(productId: string, imageId: string, data: { isPrimary?: boolean; layerType?: string; altText?: string; sortOrder?: number }) {
    if (data.isPrimary) {
      await this.prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
    }
    return this.prisma.productImage.update({
      where: { id: imageId },
      data: {
        ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
        ...(data.layerType !== undefined && { layerType: data.layerType || null }),
        ...(data.altText !== undefined && { altText: data.altText }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
  }

  async deleteImage(productId: string, imageId: string) {
    const img = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!img || img.productId !== productId) throw new NotFoundException('Image not found');

    // Extract S3 key from URL and delete from S3
    try {
      const bucket = this.config.get('S3_BUCKET_NAME', 'blikcart-assets');
      const cloudfrontUrl = this.config.get('CLOUDFRONT_URL');
      const region = this.config.get('AWS_REGION', 'eu-west-1');
      const baseUrl = cloudfrontUrl || `https://${bucket}.s3.${region}.amazonaws.com`;
      const key = img.url.replace(`${baseUrl}/`, '');
      await this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch { /* ignore S3 errors — still remove from DB */ }

    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { deleted: true };
  }

  fmt(product: any) {
    return {
      ...product,
      basePrice: Number(product.basePrice),
      wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : null,
    };
  }

  // ── Admin: Products ─────────────────────────────────────────────────────────

  async adminListAll(page: any = 1, limit: any = 20, search?: string, categoryId?: string, status?: string) {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(100, parseInt(limit) || 20);
    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (categoryId) where.categoryId = categoryId;
    if (status === 'active') where.isActive = true;
    else if (status === 'inactive') where.isActive = false;

    const [total, data] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
          variants: { select: { stockQty: true }, where: { isActive: true } },
          _count: { select: { variants: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return {
      data: data.map(prod => ({
        ...this.fmt(prod),
        variantCount: (prod as any)._count.variants,
        totalStock: (prod as any).variants?.reduce((s: number, v: any) => s + (v.stockQty || 0), 0) ?? null,
      })),
      meta: { total, page: p, limit: l },
    };
  }

  async adminCreate(data: any) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const sku = data.sku || `SKU-${Date.now()}`;
    return this.prisma.product.create({
      data: {
        categoryId: data.categoryId,
        slug,
        sku,
        name: data.name,
        description: data.description || null,
        basePrice: Number(data.basePrice) || 0,
        wholesalePrice: data.wholesalePrice ? Number(data.wholesalePrice) : null,
        moq: Number(data.moq) || 1,
        isCustomizable: Boolean(data.isCustomizable),
        isActive: data.isActive !== false,
        leadTimeDays: Number(data.leadTimeDays) || 0,
        tags: data.tags || [],
      },
      include: { category: true },
    });
  }

  async adminToggle(id: string) {
    const prod = await this.prisma.product.findUnique({ where: { id }, select: { isActive: true } });
    if (!prod) throw new NotFoundException('Product not found');
    return this.prisma.product.update({ where: { id }, data: { isActive: !prod.isActive } });
  }

  async adminDelete(id: string) {
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  // ── Admin: Categories ───────────────────────────────────────────────────────

  async adminListCategories() {
    return this.prisma.category.findMany({
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } },
      },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async adminCreateCategory(data: any) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return this.prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        parentId: data.parentId || null,
        sortOrder: Number(data.sortOrder) || 0,
        isActive: data.isActive !== false,
        isCustomizable: Boolean(data.isCustomizable),
      },
    });
  }

  async adminUpdateCategory(id: string, data: any) {
    const allowed = ['name', 'slug', 'description', 'sortOrder', 'isActive', 'isCustomizable', 'parentId'];
    const updateData: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    if (data.sortOrder !== undefined) updateData.sortOrder = Number(data.sortOrder);
    return this.prisma.category.update({ where: { id }, data: updateData });
  }

  // ── Admin: Variants ─────────────────────────────────────────────────────────

  async adminListVariants(productId?: string) {
    const where: any = {};
    if (productId) where.productId = productId;
    const variants = await this.prisma.productVariant.findMany({
      where,
      include: { product: { select: { name: true, sku: true } } },
      orderBy: [{ productId: 'asc' }, { createdAt: 'asc' }],
      take: 500,
    });
    if (variants.length === 0) return variants;
    const variantIds = variants.map((v: any) => v.id);
    const images = await this.prisma.productImage.findMany({
      where: { layerType: 'variant', layerVariantKey: { in: variantIds } },
    });
    const imgMap = new Map(images.map(i => [i.layerVariantKey, i]));
    return variants.map((v: any) => ({ ...v, variantImage: imgMap.get(v.id) || null }));
  }

  async uploadVariantImage(productId: string, variantId: string, file: Express.Multer.File) {
    const bucket = this.config.get('S3_BUCKET_NAME', 'blikcart-assets');
    const region = this.config.get('AWS_REGION', 'eu-west-1');
    const cloudfrontUrl = this.config.get('CLOUDFRONT_URL');

    // Remove previous swatch
    const existing = await this.prisma.productImage.findFirst({
      where: { productId, layerType: 'variant', layerVariantKey: variantId },
    });
    if (existing) {
      try {
        const baseUrl = cloudfrontUrl || `https://${bucket}.s3.${region}.amazonaws.com`;
        const key = existing.url.replace(`${baseUrl}/`, '');
        await this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      } catch { /* ignore */ }
      await this.prisma.productImage.delete({ where: { id: existing.id } });
    }

    const key = `products/${productId}/variants/${variantId}/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    await this.s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: file.buffer, ContentType: file.mimetype }));
    const url = cloudfrontUrl ? `${cloudfrontUrl}/${key}` : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return this.prisma.productImage.create({
      data: { productId, url, isPrimary: false, sortOrder: 99, layerType: 'variant', layerVariantKey: variantId },
    });
  }

  async setVariantImageUrl(productId: string, variantId: string, url: string) {
    const existing = await this.prisma.productImage.findFirst({
      where: { productId, layerType: 'variant', layerVariantKey: variantId },
    });
    if (existing) {
      return this.prisma.productImage.update({
        where: { id: existing.id },
        data: { url },
      });
    }
    return this.prisma.productImage.create({
      data: { productId, url, isPrimary: false, sortOrder: 99, layerType: 'variant', layerVariantKey: variantId },
    });
  }

  async deleteVariantImage(productId: string, variantId: string) {
    const bucket = this.config.get('S3_BUCKET_NAME', 'blikcart-assets');
    const region = this.config.get('AWS_REGION', 'eu-west-1');
    const cloudfrontUrl = this.config.get('CLOUDFRONT_URL');
    const img = await this.prisma.productImage.findFirst({
      where: { productId, layerType: 'variant', layerVariantKey: variantId },
    });
    if (!img) return { deleted: false };
    try {
      const baseUrl = cloudfrontUrl || `https://${bucket}.s3.${region}.amazonaws.com`;
      await this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: img.url.replace(`${baseUrl}/`, '') }));
    } catch { /* ignore */ }
    await this.prisma.productImage.delete({ where: { id: img.id } });
    return { deleted: true };
  }

  async adminCreateVariant(data: any) {
    const sku = data.sku || `${data.productId.slice(-6)}-${Date.now()}`;
    return this.prisma.productVariant.create({
      data: {
        productId: data.productId,
        sku,
        size: data.size || null,
        color: data.color || null,
        material: data.material || null,
        priceModifier: Number(data.priceModifier) || 0,
        stockQty: Number(data.stockQty) || 0,
        isActive: data.isActive !== false,
      },
      include: { product: { select: { name: true } } },
    });
  }

  async adminUpdateVariant(id: string, data: any) {
    const allowed = ['sku', 'size', 'color', 'material', 'priceModifier', 'stockQty', 'isActive'];
    const updateData: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    if (data.priceModifier !== undefined) updateData.priceModifier = Number(data.priceModifier);
    if (data.stockQty !== undefined) updateData.stockQty = Number(data.stockQty);
    return this.prisma.productVariant.update({ where: { id }, data: updateData });
  }

  async adminDeleteVariant(id: string) {
    await this.prisma.productVariant.delete({ where: { id } });
    return { success: true };
  }
}
