import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SamplesService } from './samples.service';

@ApiTags('samples')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('samples')
export class SamplesController {
  constructor(private samples: SamplesService) {}

  // ─── Client ───────────────────────────────────────────────────────────────

  @Post()
  create(@Request() req, @Body() body: any) {
    return this.samples.createSample(req.user.id, body);
  }

  @Get()
  getMySamples(@Request() req) {
    return this.samples.getUserSamples(req.user.id);
  }

  @Get('library')
  getLibrary(@Query('category') category?: string) {
    return this.samples.getLibrary(category);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Request() req) {
    return this.samples.getSampleById(id, req.user.id);
  }

  @Post(':id/revise')
  requestRevision(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.samples.requestRevision(id, req.user.id, body);
  }

  @Post(':id/reorder')
  reorder(@Param('id') id: string, @Request() req, @Body('quantity') qty: number) {
    return this.samples.reorderFromSample(id, req.user.id, qty);
  }

  @Post('library/:templateId/reorder')
  reorderFromTemplate(@Param('templateId') templateId: string, @Request() req, @Body('quantity') qty: number) {
    return this.samples.reorderFromTemplate(templateId, req.user.id, qty);
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  @Get('admin/all')
  adminList(@Query() q: any) {
    return this.samples.getAdminSamples(+q.page || 1, +q.limit || 20, q.status);
  }

  @Get('admin/library')
  adminLibrary() {
    return this.samples.getAdminLibrary();
  }

  @Patch('admin/:id/status')
  adminUpdateStatus(@Param('id') id: string, @Body() body: any) {
    return this.samples.updateSampleStatus(id, body.status, body.adminNotes, body.samplingFee);
  }

  @Post('admin/:id/approve')
  adminApprove(@Param('id') id: string, @Body() body: any) {
    return this.samples.approveSample(id, body);
  }

  @Patch('admin/library/:templateId/visibility')
  adminToggleVisibility(@Param('templateId') id: string, @Body('isPublic') isPublic: boolean) {
    return this.samples.toggleTemplateVisibility(id, isPublic);
  }
}
