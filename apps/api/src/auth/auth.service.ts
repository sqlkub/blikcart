import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.accountType };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '604800') + 's',
    });

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + parseInt(this.config.get('JWT_REFRESH_EXPIRES_IN', '604800')) * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: parseInt(this.config.get('JWT_EXPIRES_IN', '900')),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        accountType: user.accountType,
        wholesaleTier: user.wholesaleTier,
        isApproved: user.isApproved,
      },
    };
  }

  async register(dto: { email: string; password: string; fullName: string; phone?: string; companyName?: string; vatNumber?: string; accountType?: string }) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const isWholesale = dto.accountType === 'wholesale';

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        companyName: dto.companyName,
        vatNumber: dto.vatNumber,
        accountType: (dto.accountType as any) || 'retail',
        isApproved: !isWholesale, // retail auto-approved, wholesale requires manual review
      },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async refreshTokens(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException();

    // Delete old, issue new
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.login(user);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    return { success: true };
  }

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async createAddress(userId: string, data: any) {
    if (data.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.address.create({
      data: {
        userId,
        fullName: data.fullName,
        streetLine1: data.streetLine1,
        streetLine2: data.streetLine2,
        city: data.city,
        postalCode: data.postalCode,
        countryCode: data.countryCode || 'NL',
        isDefault: data.isDefault || false,
      },
    });
  }

  async deleteAddress(userId: string, id: string) {
    await this.prisma.address.deleteMany({ where: { id, userId } });
    return { success: true };
  }

  async getUsers(page: any = 1, limit: any = 50, search?: string) {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(200, parseInt(limit) || 50);
    const where: any = search
      ? { OR: [{ email: { contains: search, mode: 'insensitive' } }, { fullName: { contains: search, mode: 'insensitive' } }] }
      : {};

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true, email: true, fullName: true, companyName: true,
          accountType: true, isApproved: true, createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return { data: users, meta: { total, page: p, limit: l } };
  }

  async getAdminStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const [ordersToday, revenueToday, customOrdersPending, wholesalePending, quotesExpiring] = await Promise.all([
      this.prisma.order.count({ where: { placedAt: { gte: today, lt: tomorrow } } }),
      this.prisma.order.aggregate({ where: { placedAt: { gte: today, lt: tomorrow } }, _sum: { total: true } }),
      this.prisma.customOrder.count({ where: { status: 'submitted' } }),
      this.prisma.user.count({ where: { accountType: 'wholesale', isApproved: false } }),
      this.prisma.quote.count({ where: { status: 'sent', validUntil: { lte: in48h, gt: new Date() } } }),
    ]);

    return {
      ordersToday,
      revenueToday: Number(revenueToday._sum.total || 0),
      customOrdersPending,
      wholesalePending,
      quotesExpiring,
    };
  }

  async approveWholesale(userId: string, tier: string = 'bronze') {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isApproved: true, wholesaleTier: tier as any },
      select: { id: true, email: true, fullName: true, isApproved: true, wholesaleTier: true },
    });
  }

  async rejectUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isApproved: false, accountType: 'retail' as any },
      select: { id: true, email: true, fullName: true, accountType: true },
    });
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, fullName: true, phone: true, companyName: true,
        vatNumber: true, accountType: true, wholesaleTier: true, isApproved: true,
        locale: true, currency: true, createdAt: true,
        addresses: { orderBy: { createdAt: 'desc' } },
        orders: {
          select: { id: true, orderNumber: true, status: true, total: true, placedAt: true, items: { select: { quantity: true } } },
          orderBy: { placedAt: 'desc' }, take: 20,
        },
        customOrders: {
          select: { id: true, status: true, quantity: true, estimatedPriceMin: true, estimatedPriceMax: true, submittedAt: true, product: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }, take: 20,
        },
        _count: { select: { orders: true, customOrders: true } },
      },
    });
    if (!user) throw new Error('User not found');
    return user;
  }

  async findOrCreateOAuthUser(dto: { email: string; fullName: string; provider: string; providerId: string }) {
    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          passwordHash: '',
          accountType: 'retail',
          isApproved: true,
        },
      });
    }
    const { passwordHash: _, ...result } = user;
    return result;
  }

  loginWithToken(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.accountType };
    const accessToken = this.jwt.sign(payload);
    return { accessToken, user };
  }
}
