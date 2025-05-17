// apps/api/src/auth/strategies/jwt/jwt.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../../users/users.service'; // Justeret sti til UsersService
import { User } from '@prisma/client';

export interface JwtPayload {
  email: string;
  sub: number; // Brugerens ID
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
      secretOrKey: configService.get<string>('JWT_SECRET') || 'DEFAULT_VERY_SECRET_KEY_CHANGE_ME_IN_ENV',
    });
  }

  async validate(payload: JwtPayload): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersService.findOneById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Bruger ikke fundet eller token er ugyldigt.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }
}
