import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
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

  @Post('cart')
  createCart(@Body('guestToken') guestToken: string) {
    return this.orders.getOrAddToCart(null, guestToken);
  }

  @Get('cart')
  getCart(@Query('cartId') cartId: string) {
    return this.orders.getCart(cartId);
  }

  @Post('cart/add')
  addToCart(@Body() body: any) {
    return this.orders.addToCart(body.cartId, body.productId, body.quantity, body.variantId, body.unitPrice);
  }

  @Delete('cart/item/:id')
  removeCartItem(@Param('id') id: string) {
    return this.orders.removeCartItem(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('bulk-import')
  bulkImport(@Request() req, @Body('lines') lines: any[]) {
    return this.orders.bulkImport(req.user.id, lines);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/orders')
  getAdminOrders(@Query() query: any) {
    return this.orders.getAdminOrders(query.page, query.limit, query.status);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/orders/:id')
  getAdminOrder(@Param('id') id: string) {
    return this.orders.getAdminOrder(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/orders/:id')
  updateAdminOrder(@Param('id') id: string, @Body() body: any) {
    return this.orders.updateAdminOrder(id, body);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.orders.updateOrderStatus(id, status);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/custom-orders')
  getAdminCustomOrders(@Query() query: any) {
    return this.orders.getAdminCustomOrders(query.page, query.limit, query.status);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/analytics')
  getAnalytics(@Query('days') days: string) {
    return this.orders.getAnalyticsStats(parseInt(days) || 30);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/revenue-split')
  getRevenueSplit(@Query('days') days: string) {
    return this.orders.getRevenueSplit(parseInt(days) || 30);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/payments')
  getAdminPayments(@Query() query: any) {
    return this.orders.getAdminPayments(query.page, query.limit, query.status, query.dateFrom, query.dateTo);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/invoices')
  getAdminInvoices(@Query() query: any) {
    return this.orders.getAdminInvoices(query.page, query.limit, query.dateFrom, query.dateTo);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/refunds')
  getAdminRefunds(@Query() query: any) {
    return this.orders.getAdminRefunds(query.page, query.limit);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/payments/:id/refund')
  processRefund(@Param('id') id: string, @Body('amount') amount: number, @Body('reason') reason?: string) {
    return this.orders.processRefund(id, amount, reason);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/shipments')
  getAdminShipments(@Query() query: any) {
    return this.orders.getAdminShipments(query.page, query.limit, query.search);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/orders/:orderId/shipments')
  createShipment(@Param('orderId') orderId: string, @Body() body: any) {
    return this.orders.createShipment(orderId, body);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/shipments/:id')
  updateShipment(@Param('id') id: string, @Body() body: any) {
    return this.orders.updateShipment(id, body);
  }

  // ── Change Requests ──────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/change-request')
  submitChangeRequest(@Param('id') id: string, @Request() req: any, @Body('message') message: string) {
    return this.orders.submitChangeRequest(id, req.user.id, message);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get(':id/change-requests')
  getChangeRequests(@Param('id') id: string) {
    return this.orders.getChangeRequests(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/change-requests')
  getAllPendingChangeRequests() {
    return this.orders.getAllPendingChangeRequests();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/change-requests/:id')
  resolveChangeRequest(@Param('id') id: string, @Body() body: { status: 'approved' | 'rejected'; adminNote?: string }) {
    return this.orders.resolveChangeRequest(id, body.status, body.adminNote);
  }

  // ── Manufacturer Portal ──────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('manufacturer/my-orders')
  getManufacturerOrders(@Request() req: any) {
    return this.orders.getManufacturerOrders(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch('manufacturer/orders/:id')
  updateManufacturerOrder(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.orders.updateManufacturerOrder(id, req.user.id, body);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/orders/:id')
  deleteAdminOrder(@Param('id') id: string) {
    return this.orders.deleteAdminOrder(id);
  }
}
