import { Controller, Get, Param, Query, Patch, Body, Post, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.products.findAll(query);
  }

  @Get('categories')
  getCategories() {
    return this.products.findCategories();
  }

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
  ) {
    return this.products.uploadImage(id, file, isPrimary === 'true');
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.products.findBySlug(slug);
  }
}
