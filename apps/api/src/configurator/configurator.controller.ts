import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConfiguratorService } from './configurator.service';

@ApiTags('configurator')
@Controller('configurator')
export class ConfiguratorController {
  constructor(private configurator: ConfiguratorService) {}

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
}
