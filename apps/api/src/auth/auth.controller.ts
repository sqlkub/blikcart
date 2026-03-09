import { Controller, Post, Body, UseGuards, Request, Get, Delete, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

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
}
