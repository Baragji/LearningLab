// apps/api/src/users/users.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
// ÆNDRET IMPORT: Importer hele Prisma namespace og tilgå typer derfra
import { Prisma } from '@prisma/client'; // Importer Prisma namespace
import { User as CoreUser, Role as CoreRole } from '@repo/core';

// Definer dine Prisma-typer baseret på Prisma namespace
type PrismaUserType = Prisma.User;
type PrismaRoleType = Prisma.Role;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private mapToCoreUser(user: PrismaUserType): Omit<CoreUser, 'passwordHash'> {
    const { passwordHash, passwordResetToken, passwordResetExpires, ...result } = user;
    return {
      ...result,
      name: result.name ?? undefined,
      role: user.role as CoreRole, // Antager at PrismaRoleType og CoreRole er kompatible
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

    const saltRounds = 10;
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, saltRounds);
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
          role: (role as unknown as PrismaRoleType) || ('USER' as PrismaRoleType),
        },
      });
      return this.mapToCoreUser(prismaUser);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
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

  async findOneByEmail(email: string): Promise<PrismaUserType | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOneById(id: number): Promise<PrismaUserType | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findOneByEmailForAuth(email: string): Promise<Omit<CoreUser, 'passwordHash'> | null> {
    const prismaUser = await this.findOneByEmail(email);
    return prismaUser ? this.mapToCoreUser(prismaUser) : null;
  }
}