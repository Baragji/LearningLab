// apps/api/src/auth/strategies/jwt/jwt.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../../users/users.service';
import { User as PrismaUser, Role as PrismaRole } from '@prisma/client'; // Prisma User for interaktion med UsersService
import { User as CoreUser, Role as CoreRole } from '@repo/core'; // CoreUser for payload og returtype
import { serverEnv } from '@repo/config';

export interface JwtPayload {
  email: string;
  sub: number; // Brugerens ID
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: serverEnv.JWT_SECRET,
    });
  }

  /**
   * Helper function to map a PrismaUser object to a CoreUser object (omitting passwordHash).
   * @param user The PrismaUser object.
   * @returns A CoreUser object without the passwordHash.
   */
  private mapToCoreUser(user: PrismaUser): Omit<CoreUser, 'passwordHash'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, passwordResetToken, passwordResetExpires, ...result } = user;
    return {
      ...result,
      name: result.name ?? undefined, // Sørg for at name er string | undefined
      role: user.role as CoreRole,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  }

  async validate(payload: JwtPayload): Promise<Omit<CoreUser, 'passwordHash'>> {
    const prismaUser = await this.usersService.findOneById(payload.sub);

    if (!prismaUser) {
      throw new UnauthorizedException(
        'Bruger ikke fundet eller token er ugyldigt.',
      );
    }
    // Map PrismaUser til CoreUser format
    return this.mapToCoreUser(prismaUser);
  }
}
