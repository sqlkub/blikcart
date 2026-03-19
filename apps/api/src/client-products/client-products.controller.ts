import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProductsService } from './client-products.service';

@ApiTags('client-products')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('client-products')
export class ClientProductsController {
  constructor(private svc: ClientProductsService) {}

  // ── Client endpoints ───────────────────────────────────────────────────────

  @Get('mine')
  getMyProducts(@Request() req: any) {
    return this.svc.clientGetMine(req.user.id);
  }

  @Post(':id/reorder')
  reorder(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.clientReorder(req.user.id, id, Number(body.quantity), body.notes);
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────

  @Get('admin/all')
  adminList(@Query('clientId') clientId?: string, @Query('status') status?: string) {
    return this.svc.adminList(clientId, status);
  }

  @Get('admin/:id')
  adminGet(@Param('id') id: string) {
    return this.svc.adminGet(id);
  }

  @Post('admin')
  adminCreate(@Body() body: any) {
    return this.svc.adminCreate(body);
  }

  @Patch('admin/:id')
  adminUpdate(@Param('id') id: string, @Body() body: any) {
    return this.svc.adminUpdate(id, body);
  }

  @Post('admin/:id/new-version')
  adminNewVersion(@Param('id') id: string, @Body() body: any) {
    return this.svc.adminNewVersion(id, body);
  }

  @Delete('admin/:id')
  adminDelete(@Param('id') id: string) {
    return this.svc.adminDelete(id);
  }
}
