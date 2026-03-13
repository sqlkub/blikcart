import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ContentService } from './content.service';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private content: ContentService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  @Get('banners')
  getBanners(@Query('position') position?: string) {
    return this.content.getBanners(position);
  }

  @Get('faqs')
  getFaqs(@Query('category') category?: string) {
    return this.content.getFaqs(category);
  }

  @Get('pages/:slug')
  getPage(@Param('slug') slug: string) {
    return this.content.getPage(slug);
  }

  // ── Admin: Banners ────────────────────────────────────────────────────────

  @Get('admin/banners')
  adminListBanners() {
    return this.content.adminListBanners();
  }

  @Post('admin/banners')
  adminCreateBanner(@Body() body: any) {
    return this.content.adminCreateBanner(body);
  }

  @Patch('admin/banners/:id')
  adminUpdateBanner(@Param('id') id: string, @Body() body: any) {
    return this.content.adminUpdateBanner(id, body);
  }

  @Delete('admin/banners/:id')
  adminDeleteBanner(@Param('id') id: string) {
    return this.content.adminDeleteBanner(id);
  }

  // ── Admin: FAQs ───────────────────────────────────────────────────────────

  @Get('admin/faqs')
  adminListFaqs() {
    return this.content.adminListFaqs();
  }

  @Post('admin/faqs')
  adminCreateFaq(@Body() body: any) {
    return this.content.adminCreateFaq(body);
  }

  @Patch('admin/faqs/:id')
  adminUpdateFaq(@Param('id') id: string, @Body() body: any) {
    return this.content.adminUpdateFaq(id, body);
  }

  @Delete('admin/faqs/:id')
  adminDeleteFaq(@Param('id') id: string) {
    return this.content.adminDeleteFaq(id);
  }

  // ── Admin: Static Pages ───────────────────────────────────────────────────

  @Get('admin/pages')
  adminListPages() {
    return this.content.adminListPages();
  }

  @Post('admin/pages')
  adminCreatePage(@Body() body: any) {
    return this.content.adminCreatePage(body);
  }

  @Patch('admin/pages/:id')
  adminUpdatePage(@Param('id') id: string, @Body() body: any) {
    return this.content.adminUpdatePage(id, body);
  }

  @Delete('admin/pages/:id')
  adminDeletePage(@Param('id') id: string) {
    return this.content.adminDeletePage(id);
  }
}
