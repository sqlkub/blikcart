import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConfiguratorService } from './configurator.service';

@ApiTags('configurator')
@Controller('configurator')
export class ConfiguratorController {
  constructor(private configurator: ConfiguratorService) {}

  // ── Public / Buyer ──────────────────────────────────────────────────────────

  @Get('schema/:categorySlug')
  getSchema(@Param('categorySlug') slug: string) {
    return this.configurator.getSchema(slug);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('drafts')
  createDraft(@Request() req, @Body() body: any) {
    return this.configurator.createDraft(req.user.id, body.productId, body.schemaVersionId, body.selections);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch('drafts/:id')
  updateDraft(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.configurator.updateDraft(id, req.user.id, body.selections, body.quantity, body.notes);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('drafts/:id/submit')
  submitDraft(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.configurator.submitDraft(id, req.user.id, body.referenceFiles, body.internalRef);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('drafts')
  getDrafts(@Request() req) {
    return this.configurator.getUserDrafts(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('upload-url')
  getUploadUrl(@Body() body: { filename: string; contentType: string }) {
    return this.configurator.getUploadUrl(body.filename, body.contentType);
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  @Get('admin/schemas')
  adminListSchemas() {
    return this.configurator.adminListSchemas();
  }

  @Post('admin/schemas')
  adminCreateSchema(@Body() body: any) {
    return this.configurator.adminCreateSchema(body);
  }

  @Patch('admin/schemas/:id')
  adminUpdateSchema(@Param('id') id: string, @Body() body: any) {
    return this.configurator.adminUpdateSchema(id, body);
  }

  @Post('admin/schemas/:id/versions')
  adminPublishVersion(@Param('id') id: string, @Body() body: any) {
    return this.configurator.adminPublishVersion(id, body.steps, body.notes);
  }
}
