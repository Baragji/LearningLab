// apps/api/src/users/users.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import {
  Prisma,
  User as PrismaGeneratedUserType,
  Role as PrismaGeneratedRoleType,
} from '@prisma/client';
import { User as CoreUser, Role as CoreRole } from '@repo/core';
import { ServerEnv } from '@repo/config';

@Injectable()
export class UsersService {
  private readonly saltRounds: number;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService<ServerEnv, true>,
  ) {
    const saltFromEnv = this.configService.get('SALT_ROUNDS', { infer: true });
    if (typeof saltFromEnv !== 'number') {
      console.warn(
        `SALT_ROUNDS var ikke et tal i ConfigService, falder tilbage til 10. Værdi: ${saltFromEnv}`,
      );
      this.saltRounds = 10;
    } else {
      this.saltRounds = saltFromEnv;
    }
  }

  private mapToCoreUser(
    user: PrismaGeneratedUserType,
  ): Omit<CoreUser, 'passwordHash'> {
    const {
      passwordHash,
      passwordResetToken,
      passwordResetExpires,
      ...result
    } = user;
    return {
      ...result,
      name: result.name ?? undefined,
      role: user.role as CoreRole,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  }

  async create(
    createUserDto: CreateUserDto,
  ): Promise<Omit<CoreUser, 'passwordHash'>> {
    const { email, password, name, role } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        'En bruger med denne email eksisterer allerede.',
      );
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      console.error('Fejl under hashing af password:', error);
      throw new InternalServerErrorException(
        'Der opstod en intern fejl under brugeroprettelse (hashing).',
      );
    }

    try {
      const prismaUser = await this.prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          name: name || null,
          role:
            (role as unknown as PrismaGeneratedRoleType) ||
            ('USER' as PrismaGeneratedRoleType),
        },
      });
      return this.mapToCoreUser(prismaUser);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'En bruger med denne email eksisterer allerede (databasefejl).',
        );
      }
      console.error('Databasefejl under brugeroprettelse:', error);
      throw new InternalServerErrorException(
        'Der opstod en databasefejl under brugeroprettelse.',
      );
    }
  }

  async findOneByEmail(email: string): Promise<PrismaGeneratedUserType | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOneById(id: number): Promise<PrismaGeneratedUserType | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findOneByEmailForAuth(
    email: string,
  ): Promise<Omit<CoreUser, 'passwordHash'> | null> {
    const prismaUser = await this.findOneByEmail(email);
    return prismaUser ? this.mapToCoreUser(prismaUser) : null;
  }
}
