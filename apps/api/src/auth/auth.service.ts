// File: apps/api/src/auth/auth.service.ts
import {
  Injectable,
  // UnauthorizedException, // Commented out unused import
  BadRequestException,
  // InternalServerErrorException, // Commented out unused import
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { JwtPayload } from './strategies/jwt/jwt';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { v4 as uuidv4 } from 'uuid';
import { User as CoreUser, Role as CoreRole } from '@repo/core';
import { User as PrismaUser } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly saltRounds: number;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.saltRounds = Number(
      this.configService.get<string>('SALT_ROUNDS', '10'),
    );
    this.jwtSecret = this.configService.get<string>('JWT_SECRET');
    this.jwtExpiresIn = this.configService.get<string>(
      'JWT_EXPIRES_IN',
      '3600s',
    );
  }

  private mapToCoreUser(user: PrismaUser): Omit<CoreUser, 'passwordHash'> {
    // Destructure and ignore sensitive fields with underscore prefix
    const {
      passwordHash: _passwordHash,
      passwordResetToken: _passwordResetToken,
      passwordResetExpires: _passwordResetExpires,
      ...rest
    } = user;
    return {
      ...rest,
      role: user.role as CoreRole,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<CoreUser, 'passwordHash'> | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      return this.mapToCoreUser(user);
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: expires,
      },
    });

    // TODO: Send reset link via din email-service: `${frontendUrl}/reset-password?token=${resetToken}`

    return {
      message:
        'Hvis din email findes i systemet, vil du modtage et link til at nulstille dit password.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword, confirmPassword } = dto;
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('De nye adgangskoder matcher ikke.');
    }

    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: token },
    });
    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new BadRequestException('Ugyldigt eller udløbet reset-token.');
    }

    const hashed = await bcrypt.hash(newPassword, this.saltRounds);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashed,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Din adgangskode er blevet nulstillet.' };
  }
}
