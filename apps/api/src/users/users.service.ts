// apps/api/src/users/users.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
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
    if (typeof saltFromEnv === 'number') {
      this.saltRounds = saltFromEnv;
    } else {
      console.warn(
        `SALT_ROUNDS var ikke et tal i ConfigService, falder tilbage til 10. Værdi: ${saltFromEnv}`,
      );
      this.saltRounds = 10;
    }
  }

  public mapToCoreUser(
    user: PrismaGeneratedUserType,
  ): Omit<CoreUser, 'passwordHash'> {
    const {
      passwordHash: _passwordHash,
      passwordResetToken: _passwordResetToken,
      passwordResetExpires: _passwordResetExpires,
      ...result
    } = user;

    // Opret et objekt med de grundlæggende brugerfelter
    const coreUser: Partial<CoreUser> = {
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

    return coreUser as Omit<CoreUser, 'passwordHash'>;
  }

  async create(
    createUserDto: CreateUserDto,
    currentUserId?: number,
  ): Promise<Omit<CoreUser, 'passwordHash'>> {
    // Destrukturering af createUserDto
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

    // Opret data objekt til Prisma
    const userData: any = {
      email,
      name: name || null,
      role:
        (role as unknown as PrismaGeneratedRoleType) ||
        ('STUDENT' as PrismaGeneratedRoleType),
      profileImage: profileImage || null,
      bio: bio || null,
      socialLinks: socialLinks || null,
      settings: settings || null,
      createdBy: currentUserId || null,
      updatedBy: currentUserId || null,
    };

    // Hvis password er angivet, hash det (for normal login)
    if (password) {
      try {
        userData.passwordHash = await bcrypt.hash(password, this.saltRounds);
      } catch (error) {
        console.error('Fejl under hashing af password:', error);
        throw new InternalServerErrorException({
          message: 'Failed to create user',
          code: 'USER_CREATION_FAILED',
        });
      }
    } else {
      // Password er påkrævet
      throw new BadRequestException({
        message: 'Password required for login',
        code: 'MISSING_PASSWORD',
      });
    }

    try {
      const prismaUser = await this.prisma.user.create({
        data: userData,
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
        (updateData as any).passwordHash = await bcrypt.hash(
          password,
          this.saltRounds,
        );
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

  async findUsersByRoleAndIds(
    role: Role,
    ids: number[],
  ): Promise<PrismaGeneratedUserType[]> {
    return this.prisma.user.findMany({
      where: {
        id: { in: ids },
        role: role as PrismaGeneratedRoleType,
        deletedAt: null,
      },
    });
  }

  async bulkInvite(
    invitations: { email: string; name?: string; role: Role }[],
    currentUserId?: number,
  ): Promise<{ success: boolean; count: number; failed: string[] }> {
    const results = {
      success: true,
      count: 0,
      failed: [] as string[],
    };

    // Generer et tilfældigt password for hver bruger
    const generateRandomPassword = () => {
      const length = 12;
      const charset =
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
      let password = '';
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
      }
      return password;
    };

    // Behandl hver invitation
    for (const invitation of invitations) {
      try {
        // Tjek om brugeren allerede eksisterer
        const existingUser = await this.findOneByEmail(invitation.email);
        if (existingUser) {
          results.failed.push(`${invitation.email} (eksisterer allerede)`);
          continue;
        }

        // Opret bruger med tilfældigt password
        const password = generateRandomPassword();
        const createUserDto = {
          email: invitation.email,
          password,
          name: invitation.name,
          role: invitation.role,
        };

        await this.create(createUserDto, currentUserId);
        results.count++;

        // Her kunne man implementere afsendelse af invitation via email
        // med det genererede password
        // await this.emailService.sendInvitation(invitation.email, password);
      } catch (error) {
        console.error(`Fejl ved invitation af ${invitation.email}:`, error);
        results.failed.push(invitation.email);
        results.success = false;
      }
    }

    return results;
  }

  async bulkDelete(
    userIds: number[],
    currentUserId?: number,
  ): Promise<{ success: boolean; count: number }> {
    const results = {
      success: true,
      count: 0,
    };

    try {
      // Soft delete alle brugere på én gang
      const result = await this.prisma.user.updateMany({
        where: {
          id: { in: userIds },
          deletedAt: null, // Kun slet brugere, der ikke allerede er slettet
        },
        data: {
          deletedAt: new Date(),
          updatedBy: currentUserId || null,
        },
      });

      results.count = result.count;
    } catch (error) {
      console.error('Fejl ved bulk-sletning af brugere:', error);
      results.success = false;
    }

    return results;
  }

  async bulkGet(userIds: number[]): Promise<Omit<CoreUser, 'passwordHash'>[]> {
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        deletedAt: null,
      },
    });

    return users.map((user) => this.mapToCoreUser(user));
  }
}
