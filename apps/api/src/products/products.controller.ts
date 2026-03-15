import { Controller, Get, Param, Query, Patch, Body, Post, Delete, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}

  // ── Public ──────────────────────────────────────────────────────────────────

  @Get()
  findAll(@Query() query: any) {
    return this.products.findAll(query);
  }

  @Get('categories')
  getCategories() {
    return this.products.findCategories();
  }

  // ── Admin: Products ─────────────────────────────────────────────────────────

  @Get('admin/all')
  adminListAll(@Query() q: any) {
    return this.products.adminListAll(q.page, q.limit, q.search, q.categoryId, q.status);
  }

  @Post('admin')
  adminCreate(@Body() body: any) {
    return this.products.adminCreate(body);
  }

  @Patch('admin/:id/toggle')
  adminToggle(@Param('id') id: string) {
    return this.products.adminToggle(id);
  }

  @Delete('admin/:id')
  adminDelete(@Param('id') id: string) {
    return this.products.adminDelete(id);
  }


  // ── Admin: Categories ───────────────────────────────────────────────────────

  @Get('admin/categories')
  adminListCategories() {
    return this.products.adminListCategories();
  }

  @Post('admin/categories')
  adminCreateCategory(@Body() body: any) {
    return this.products.adminCreateCategory(body);
  }

  @Patch('admin/categories/:id')
  adminUpdateCategory(@Param('id') id: string, @Body() body: any) {
    return this.products.adminUpdateCategory(id, body);
  }

  // ── Admin: Variants ─────────────────────────────────────────────────────────

  @Get('admin/variants')
  adminListVariants(@Query('productId') productId?: string) {
    return this.products.adminListVariants(productId);
  }

  @Post('admin/variants')
  adminCreateVariant(@Body() body: any) {
    return this.products.adminCreateVariant(body);
  }

  @Patch('admin/variants/:id')
  adminUpdateVariant(@Param('id') id: string, @Body() body: any) {
    return this.products.adminUpdateVariant(id, body);
  }

  @Delete('admin/variants/:id')
  adminDeleteVariant(@Param('id') id: string) {
    return this.products.adminDeleteVariant(id);
  }

  // ── Existing ────────────────────────────────────────────────────────────────

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.products.update(id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  @Post(':id/images')
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('isPrimary') isPrimary: string,
    @Body('layerType') layerType: string,
  ) {
    return this.products.uploadImage(id, file, isPrimary === 'true', layerType);
  }

  @Patch(':id/images/:imageId')
  updateImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @Body() body: { isPrimary?: boolean; layerType?: string; altText?: string; sortOrder?: number },
  ) {
    return this.products.updateImage(id, imageId, body);
  }

  @Delete(':id/images/:imageId')
  deleteImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.products.deleteImage(id, imageId);
  }

  @Get(':id/images')
  listImages(@Param('id') id: string) {
    return this.products.listImages(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  @Post(':id/variants/:variantId/image')
  uploadVariantImage(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.products.uploadVariantImage(id, variantId, file);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/variants/:variantId/image')
  deleteVariantImage(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ) {
    return this.products.deleteVariantImage(id, variantId);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.products.findBySlug(slug);
  }
}
