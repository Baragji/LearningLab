// File: apps/api/src/auth/strategies/jwt/jwt.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../../users/users.service';
import { User as PrismaUser } from '@prisma/client';
import { User as CoreUser, Role as CoreRole } from '@repo/core';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  email: string;
  sub: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'testSecret',
    });
  }

  private mapToCoreUser(user: PrismaUser): Omit<CoreUser, 'passwordHash'> {
    const {
      passwordHash: _passwordHash,
      passwordResetToken: _passwordResetToken,
      passwordResetExpires: _passwordResetExpires,
      socialLinks,
      settings,
      ...rest
    } = user;
    return {
      ...rest,
      role: user.role as CoreRole,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
      socialLinks: socialLinks as Record<string, string> | null,
      settings: settings as Record<string, unknown> | null,
    };
  }

  async validate(payload: JwtPayload): Promise<Omit<CoreUser, 'passwordHash'>> {
    const user = await this.usersService.findOneById(payload.sub);
    if (!user) throw new UnauthorizedException('Invalid token');
    return this.mapToCoreUser(user);
  }
}
