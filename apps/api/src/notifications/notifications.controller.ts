import { Controller, Get, Post, Patch, Param, Query, UseGuards, Request, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  @Get()
  getAll(@Query('page') page: string, @Query('limit') limit: string) {
    return this.svc.getAll(parseInt(page) || 1, parseInt(limit) || 50);
  }

  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.svc.create({ ...body, fromUserId: req.user?.id });
  }

  @Get('unread-count')
  getUnreadCount() {
    return this.svc.getUnreadCount();
  }

  @Patch('mark-all-read')
  markAllRead() {
    return this.svc.markAllRead();
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.svc.markRead(id);
  }
}
