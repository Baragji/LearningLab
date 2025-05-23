// apps/api/src/users/users.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import {
  Prisma,
  User as PrismaGeneratedUserType,
  Role as PrismaGeneratedRoleType,
} from '@prisma/client';
import { User as CoreUser, Role as CoreRole, Role } from '@repo/core';
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

  public mapToCoreUser(
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
      profileImage: user.profileImage ?? undefined,
      bio: user.bio ?? undefined,
      socialLinks: user.socialLinks as Record<string, string> | undefined,
      settings: user.settings as Record<string, any> | undefined,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  }

  async create(
    createUserDto: CreateUserDto,
  ): Promise<Omit<CoreUser, 'passwordHash'>> {
    const {
      email,
      password,
      name,
      role,
      profileImage,
      bio,
      socialLinks,
      settings,
    } = createUserDto;

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
            ('STUDENT' as PrismaGeneratedRoleType),
          profileImage: profileImage || null,
          bio: bio || null,
          socialLinks: socialLinks || null,
          settings: settings || null,
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

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUserId?: number,
  ): Promise<Omit<CoreUser, 'passwordHash'>> {
    const { password, email, ...restData } = updateUserDto;

    // Tjek om email allerede er i brug af en anden bruger
    if (email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(
          'En anden bruger med denne email eksisterer allerede.',
        );
      }
    }

    // Forbered data til opdatering
    const updateData = {
      ...restData,
      email,
      updatedBy: currentUserId || null,
    };

    // Hvis password er angivet, hash det
    if (password) {
      try {
        // Tilføj passwordHash til updateData
        (updateData as any).passwordHash = await bcrypt.hash(password, this.saltRounds);
      } catch (error) {
        console.error('Fejl under hashing af password:', error);
        throw new InternalServerErrorException(
          'Der opstod en intern fejl under opdatering af bruger (hashing).',
        );
      }
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
      return this.mapToCoreUser(updatedUser);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'En anden bruger med denne email eksisterer allerede (databasefejl).',
        );
      }
      console.error('Databasefejl under opdatering af bruger:', error);
      throw new InternalServerErrorException(
        'Der opstod en databasefejl under opdatering af bruger.',
      );
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    filter?: string,
    role?: Role,
  ): Promise<{ users: Omit<CoreUser, 'passwordHash'>[]; total: number }> {
    const skip = (page - 1) * limit;

    // Opbyg where-betingelser baseret på filtre
    const where: Prisma.UserWhereInput = {
      deletedAt: null, // Ekskluder slettede brugere
    };

    // Tilføj rollefilter hvis angivet
    if (role) {
      where.role = role as PrismaGeneratedRoleType;
    }

    // Tilføj tekstsøgning hvis angivet
    if (filter) {
      where.OR = [
        { email: { contains: filter, mode: 'insensitive' } },
        { name: { contains: filter, mode: 'insensitive' } },
        { bio: { contains: filter, mode: 'insensitive' } },
      ];
    }

    // Hent brugere og total antal
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => this.mapToCoreUser(user)),
      total,
    };
  }

  async softDelete(id: number, currentUserId?: number): Promise<void> {
    const updateData = {
      deletedAt: new Date(),
      updatedBy: currentUserId || null,
    };

    await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }
}
