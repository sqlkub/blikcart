import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get()
  getUserOrders(@Request() req, @Query() query: any) {
    return this.orders.getUserOrders(req.user.id, query.page, query.limit);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post()
  createOrder(@Request() req, @Body() body: any) {
    return this.orders.createOrder(req.user.id, body.cartId, body.shippingAddressId, body.billingAddressId);
  }

  @Get('cart')
  getCart(@Query('cartId') cartId: string) {
    return this.orders.getCart(cartId);
  }

  @Post('cart/add')
  addToCart(@Body() body: any) {
    return this.orders.addToCart(body.cartId, body.productId, body.quantity, body.variantId, body.unitPrice);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/orders')
  getAdminOrders(@Query() query: any) {
    return this.orders.getAdminOrders(query.page, query.limit, query.status);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/custom-orders')
  getAdminCustomOrders(@Query() query: any) {
    return this.orders.getAdminCustomOrders(query.page, query.limit, query.status);
  }
}
