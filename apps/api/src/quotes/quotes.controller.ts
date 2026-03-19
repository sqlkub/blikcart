import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';

@ApiTags('quotes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('quotes')
export class QuotesController {
  constructor(private quotes: QuotesService) {}

  @Post('send')
  sendQuote(@Request() req, @Body() body: any) {
    return this.quotes.sendQuote(req.user.id, body.customOrderId, body);
  }

  @Post(':id/respond')
  respond(@Param('id') id: string, @Request() req, @Body() body: { action: 'accept' | 'decline' }) {
    return this.quotes.respondToQuote(id, req.user.id, body.action);
  }

  @Get('custom-orders')
  getMyOrders(@Request() req) {
    return this.quotes.getUserOrders(req.user.id);
  }

  @Get('custom-orders/:id')
  getCustomOrder(@Param('id') id: string) {
    return this.quotes.getCustomOrderDetails(id);
  }

  @Post('custom-orders/:id/messages')
  sendMessage(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.quotes.sendMessage(id, req.user.id, body.body, body.attachments);
  }

  @Get('admin/all')
  getAdminQuotes(@Query() query: any) {
    return this.quotes.getAdminQuotes(query.page, query.limit, query.status);
  }

  @Patch('admin/custom-orders/:id/status')
  updateCustomOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.quotes.updateCustomOrderStatus(id, status);
  }

  @Patch('admin/custom-orders/:id')
  updateCustomOrder(@Param('id') id: string, @Body() body: any) {
    return this.quotes.updateCustomOrder(id, body);
  }

  @Delete('admin/custom-orders/:id')
  deleteAdminCustomOrder(@Param('id') id: string) {
    return this.quotes.deleteAdminCustomOrder(id);
  }

  @Delete('admin/quotes/:id')
  deleteAdminQuote(@Param('id') id: string) {
    return this.quotes.deleteAdminQuote(id);
  }
}
