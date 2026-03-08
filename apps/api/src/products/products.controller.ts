import { Controller, Get, Param, Query, Patch, Body } from '@nestjs/common';
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

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.products.findBySlug(slug);
  }
}
