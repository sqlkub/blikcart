import { Controller, Post, Body, UseGuards, Request, Get, Delete, Param, Res, Query, Patch } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private config: ConfigService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req) {
    return this.auth.login(req.user);
  }

  @Post('register')
  async register(@Body() dto: any) {
    return this.auth.register(dto);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') token: string) {
    return this.auth.refreshTokens(token);
  }

  @Post('logout')
  async logout(@Body('refreshToken') token: string) {
    return this.auth.logout(token);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Request() req) {
    return req.user;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('addresses')
  async getAddresses(@Request() req) {
    return this.auth.getAddresses(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('addresses')
  async createAddress(@Request() req, @Body() body: any) {
    return this.auth.createAddress(req.user.id, body);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete('addresses/:id')
  async deleteAddress(@Request() req, @Param('id') id: string) {
    return this.auth.deleteAddress(req.user.id, id);
  }

  // ── Admin: list all users ─────────────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('users')
  async getUsers(@Query() query: any) {
    return this.auth.getUsers(query.page, query.limit, query.search, query.accountType, query.isApproved);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('users/:id')
  async getUserDetail(@Param('id') id: string) {
    return this.auth.getUserDetail(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/stats')
  async adminStats() {
    return this.auth.getAdminStats();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/wholesale-pending')
  async wholesalePending(@Query() query: any) {
    return this.auth.getUsers(query.page, query.limit, query.search, 'wholesale', 'false');
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/users/:id/approve')
  async approveWholesale(@Param('id') id: string, @Body('tier') tier: string) {
    return this.auth.approveWholesale(id, tier);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/users/:id/reject')
  async rejectUser(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.auth.rejectUser(id, reason);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/users/:id/request-info')
  async requestMoreInfo(@Param('id') id: string, @Body('message') message: string) {
    return this.auth.requestMoreInfo(id, message);
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() { /* redirects to Google */ }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Request() req, @Res() res: Response) {
    const { accessToken } = this.auth.loginWithToken(req.user);
    const webUrl = this.config.get('WEB_URL', 'http://localhost:3000');
    res.redirect(`${webUrl}/auth/callback?token=${accessToken}`);
  }

  // ── Apple OAuth ───────────────────────────────────────────────────────────
  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  appleLogin() { /* redirects to Apple */ }

  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleCallback(@Request() req, @Res() res: Response) {
    const { accessToken } = this.auth.loginWithToken(req.user);
    const webUrl = this.config.get('WEB_URL', 'http://localhost:3000');
    res.redirect(`${webUrl}/auth/callback?token=${accessToken}`);
  }
}
