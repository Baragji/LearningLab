// File: apps/api/src/auth/strategies/jwt/jwt.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../../users/users.service';
import { User as PrismaUser } from '@prisma/client';
import { User as CoreUser, Role as CoreRole } from '@repo/core';

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
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  private mapToCoreUser(user: PrismaUser): Omit<CoreUser, 'passwordHash'> {
    const { passwordHash, passwordResetToken, passwordResetExpires, ...rest } =
      user;
    return {
      ...rest,
      role: user.role as CoreRole,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  }

  async validate(payload: JwtPayload): Promise<Omit<CoreUser, 'passwordHash'>> {
    const user = await this.usersService.findOneById(payload.sub);
    if (!user) throw new UnauthorizedException('Invalid token');
    return this.mapToCoreUser(user);
  }
}
