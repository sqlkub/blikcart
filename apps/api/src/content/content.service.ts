import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  // ── Banners ──────────────────────────────────────────────────────────────────

  async getBanners(position?: string) {
    const where: any = { isActive: true };
    if (position) where.position = position;
    return this.prisma.banner.findMany({ where, orderBy: { sortOrder: 'asc' } });
  }

  async adminListBanners() {
    return this.prisma.banner.findMany({ orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }] });
  }

  async adminCreateBanner(data: any) {
    return this.prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || null,
        imageUrl: data.imageUrl || null,
        linkUrl: data.linkUrl || null,
        linkText: data.linkText || null,
        position: data.position || 'hero',
        sortOrder: Number(data.sortOrder) || 0,
        isActive: data.isActive !== false,
      },
    });
  }

  async adminUpdateBanner(id: string, data: any) {
    const allowed = ['title', 'subtitle', 'imageUrl', 'linkUrl', 'linkText', 'position', 'sortOrder', 'isActive'];
    const updateData: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    if (updateData.sortOrder !== undefined) updateData.sortOrder = Number(updateData.sortOrder);
    return this.prisma.banner.update({ where: { id }, data: updateData });
  }

  async adminDeleteBanner(id: string) {
    await this.prisma.banner.delete({ where: { id } });
    return { success: true };
  }

  // ── FAQs ────────────────────────────────────────────────────────────────────

  async getFaqs(categorySlug?: string) {
    const where: any = { isActive: true };
    if (categorySlug) where.categorySlug = categorySlug;
    return this.prisma.faq.findMany({ where, orderBy: [{ categorySlug: 'asc' }, { sortOrder: 'asc' }] });
  }

  async adminListFaqs() {
    return this.prisma.faq.findMany({ orderBy: [{ categorySlug: 'asc' }, { sortOrder: 'asc' }] });
  }

  async adminCreateFaq(data: any) {
    return this.prisma.faq.create({
      data: {
        question: data.question,
        answer: data.answer,
        categorySlug: data.categorySlug || 'general',
        sortOrder: Number(data.sortOrder) || 0,
        isActive: data.isActive !== false,
      },
    });
  }

  async adminUpdateFaq(id: string, data: any) {
    const allowed = ['question', 'answer', 'categorySlug', 'sortOrder', 'isActive'];
    const updateData: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    if (updateData.sortOrder !== undefined) updateData.sortOrder = Number(updateData.sortOrder);
    return this.prisma.faq.update({ where: { id }, data: updateData });
  }

  async adminDeleteFaq(id: string) {
    await this.prisma.faq.delete({ where: { id } });
    return { success: true };
  }

  // ── Static Pages ─────────────────────────────────────────────────────────────

  async getPage(slug: string) {
    const page = await this.prisma.staticPage.findUnique({ where: { slug } });
    if (!page || !page.isPublished) throw new NotFoundException(`Page not found: ${slug}`);
    return page;
  }

  async adminListPages() {
    return this.prisma.staticPage.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  async adminCreatePage(data: any) {
    return this.prisma.staticPage.create({
      data: {
        slug: data.slug,
        title: data.title,
        content: data.content || '',
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        isPublished: data.isPublished === true,
      },
    });
  }

  async adminUpdatePage(id: string, data: any) {
    const allowed = ['slug', 'title', 'content', 'metaTitle', 'metaDescription', 'isPublished'];
    const updateData: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    if (updateData.content !== undefined) {
      try { JSON.parse(updateData.content); } catch { throw new BadRequestException('Page content must be valid JSON'); }
    }
    return this.prisma.staticPage.update({ where: { id }, data: updateData });
  }

  async adminDeletePage(id: string) {
    await this.prisma.staticPage.delete({ where: { id } });
    return { success: true };
  }
}
