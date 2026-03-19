import { Controller, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProformaService } from './proforma.service';

@ApiTags('proforma')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('proforma')
export class ProformaController {
  constructor(private svc: ProformaService) {}

  @Get('mine')
  getMine(@Request() req: any) {
    return this.svc.getForClient(req.user.id);
  }

  @Get('mine/:id')
  getOne(@Request() req: any, @Param('id') id: string) {
    return this.svc.getById(id, req.user.id);
  }

  @Get('admin/all')
  adminList(@Query('status') status?: string, @Query('clientId') clientId?: string) {
    return this.svc.adminList(status, clientId);
  }

  @Get('admin/:id')
  adminGet(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Patch('admin/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.svc.updateStatus(id, status);
  }

  @Patch('admin/:id/notes')
  updateNotes(@Param('id') id: string, @Body('notes') notes: string) {
    return this.svc.updateNotes(id, notes);
  }
}
