// apps/api/src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Prisma, User as PrismaGeneratedUserType } from '@prisma/client';
import { User as CoreUser, Role as CoreRole } from '@repo/core';
import { JwtPayload } from './strategies/jwt/jwt';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ServerEnv } from '@repo/config';

@Injectable()
export class AuthService {
  private readonly saltRounds: number;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService<ServerEnv, true>,
  ) {
    const saltFromEnv = this.configService.get('SALT_ROUNDS', { infer: true });
     if (typeof saltFromEnv !== 'number') {
        console.warn(`SALT_ROUNDS var ikke et tal i ConfigService for AuthService, falder tilbage til 10. Værdi: ${saltFromEnv}`);
        this.saltRounds = 10;
    } else {
        this.saltRounds = saltFromEnv;
    }
    this.jwtSecret = this.configService.get('JWT_SECRET', { infer: true });
    this.jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN', { infer: true });
  }

  private mapToCoreUserFromPrisma(user: PrismaGeneratedUserType): Omit<CoreUser, 'passwordHash'> {
    const { passwordHash, passwordResetToken, passwordResetExpires, ...result } = user;
    return {
      ...result,
      name: result.name ?? undefined,
      role: user.role as CoreRole,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  }

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<CoreUser, 'passwordHash'> | null> {
    const userEntity = await this.usersService.findOneByEmail(email);

    if (userEntity) {
      const isPasswordMatching = await bcrypt.compare(pass, userEntity.passwordHash);
      if (isPasswordMatching) {
        return this.mapToCoreUserFromPrisma(userEntity);
      }
    }
    return null;
  }

  async login(
    user: Omit<CoreUser, 'passwordHash'>,
  ): Promise<{ access_token: string }> {
    const payload: JwtPayload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.jwtSecret,
        expiresIn: this.jwtExpiresIn,
      }),
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      return {
        message:
          'Hvis din email findes i systemet, vil du modtage et link til at nulstille dit password.',
      };
    }

    const resetToken = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    try {
      await this.prisma.user.update({
        where: { email },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: expires,
        },
      });
      console.log(`Password Reset Token for ${email}: ${resetToken}`);
      return {
        message:
          'Hvis din email findes i systemet, vil du modtage et link til at nulstille dit password.',
      };
    } catch (error) {
      console.error('Fejl under opdatering af bruger med reset token:', error);
      throw new InternalServerErrorException(
        'Der opstod en fejl under behandling af din anmodning.',
      );
    }
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('De nye passwords matcher ikke.');
    }

    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (!user) {
      throw new BadRequestException(
        'Ugyldigt eller udløbet password reset token (bruger ikke fundet).',
      );
    }

    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: null, passwordResetExpires: null },
      });
      throw new BadRequestException(
        'Ugyldigt eller udløbet password reset token (token udløbet).',
      );
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
    } catch (error) {
      console.error('Fejl under hashing af nyt password:', error);
      throw new InternalServerErrorException(
        'Der opstod en fejl under nulstilling af password (hashing).',
      );
    }

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });
      return { message: 'Dit password er blevet nulstillet succesfuldt.' };
    } catch (error) {
      console.error('Fejl under opdatering af brugers password:', error);
      throw new InternalServerErrorException(
        'Der opstod en fejl under nulstilling af password (database).',
      );
    }
  }
}
