import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

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
  fmt(product: any) {
    return {
      ...product,
      basePrice: Number(product.basePrice),
      wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : null,
    };
  }
}

  // This line intentionally left blank
