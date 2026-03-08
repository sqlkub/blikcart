import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
    return this.fmt(product);
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
    const allowed = ['name', 'description', 'basePrice', 'wholesalePrice', 'moq', 'leadTimeDays', 'isActive', 'isCustomizable', 'imageUrl'];
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
  async uploadImage(productId: string, file: Express.Multer.File, isPrimary: boolean) {
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
      data: { productId, url, isPrimary, sortOrder: 0 },
    });
  }

  fmt(product: any) {
    return {
      ...product,
      basePrice: Number(product.basePrice),
      wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : null,
    };
  }
}

  // This line intentionally left blank
