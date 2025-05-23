// apps/api/src/user-groups/user-groups.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';
import { Prisma } from '@prisma/client';
import { UsersService } from '../users/users.service';

@Injectable()
export class UserGroupsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(createUserGroupDto: CreateUserGroupDto, currentUserId?: number) {
    const { name, description, permissions } = createUserGroupDto;

    // Tjek om en gruppe med samme navn allerede eksisterer
    const existingGroup = await this.prisma.userGroup.findUnique({
      where: { name },
    });

    if (existingGroup) {
      throw new ConflictException(
        'En brugergruppe med dette navn eksisterer allerede.',
      );
    }

    try {
      const userGroup = await this.prisma.userGroup.create({
        data: {
          name,
          description,
          permissions: permissions || {},
          createdBy: currentUserId || null,
          updatedBy: currentUserId || null,
        },
      });

      return userGroup;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'En brugergruppe med dette navn eksisterer allerede (databasefejl).',
        );
      }
      console.error('Databasefejl under oprettelse af brugergruppe:', error);
      throw new InternalServerErrorException(
        'Der opstod en databasefejl under oprettelse af brugergruppen.',
      );
    }
  }

  async findAll(page = 1, limit = 10, filter?: string) {
    const skip = (page - 1) * limit;

    // Opbyg where-betingelser baseret på filtre
    const where: Prisma.UserGroupWhereInput = {
      deletedAt: null, // Ekskluder slettede grupper
    };

    // Tilføj tekstsøgning hvis angivet
    if (filter) {
      where.OR = [
        { name: { contains: filter, mode: 'insensitive' } },
        { description: { contains: filter, mode: 'insensitive' } },
      ];
    }

    // Hent brugergrupper og total antal
    const [userGroups, total] = await Promise.all([
      this.prisma.userGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      }),
      this.prisma.userGroup.count({ where }),
    ]);

    return {
      userGroups,
      total,
    };
  }

  async findOneById(id: number) {
    return this.prisma.userGroup.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  }

  async update(
    id: number,
    updateUserGroupDto: UpdateUserGroupDto,
    currentUserId?: number,
  ) {
    const { name, description, permissions } = updateUserGroupDto;

    // Tjek om en anden gruppe med samme navn allerede eksisterer
    if (name) {
      const existingGroup = await this.prisma.userGroup.findUnique({
        where: { name },
      });

      if (existingGroup && existingGroup.id !== id) {
        throw new ConflictException(
          'En anden brugergruppe med dette navn eksisterer allerede.',
        );
      }
    }

    try {
      const updatedUserGroup = await this.prisma.userGroup.update({
        where: { id },
        data: {
          name,
          description,
          permissions: permissions !== undefined ? permissions : undefined,
          updatedBy: currentUserId || null,
          updatedAt: new Date(),
        },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      return updatedUserGroup;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'En anden brugergruppe med dette navn eksisterer allerede (databasefejl).',
        );
      }
      console.error('Databasefejl under opdatering af brugergruppe:', error);
      throw new InternalServerErrorException(
        'Der opstod en databasefejl under opdatering af brugergruppen.',
      );
    }
  }

  async softDelete(id: number, currentUserId?: number) {
    await this.prisma.userGroup.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: currentUserId || null,
      },
    });
  }

  async getGroupUsers(id: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          groups: {
            some: {
              id,
            },
          },
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          profileImage: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({
        where: {
          groups: {
            some: {
              id,
            },
          },
          deletedAt: null,
        },
      }),
    ]);

    return {
      users: users.map((user) => this.usersService.mapToCoreUser(user as any)),
      total,
    };
  }

  async addUsersToGroup(
    groupId: number,
    userIds: number[],
    currentUserId?: number,
  ) {
    // Tjek om alle brugere eksisterer
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (users.length !== userIds.length) {
      throw new NotFoundException('En eller flere brugere blev ikke fundet');
    }

    // Opdater brugergruppen med de nye brugere
    const updatedGroup = await this.prisma.userGroup.update({
      where: { id: groupId },
      data: {
        users: {
          connect: userIds.map((userId) => ({ id: userId })),
        },
        updatedBy: currentUserId || null,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return updatedGroup;
  }

  async removeUserFromGroup(
    groupId: number,
    userId: number,
    currentUserId?: number,
  ) {
    // Tjek om brugeren eksisterer
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Bruger med ID ${userId} blev ikke fundet`);
    }

    // Fjern brugeren fra gruppen
    await this.prisma.userGroup.update({
      where: { id: groupId },
      data: {
        users: {
          disconnect: { id: userId },
        },
        updatedBy: currentUserId || null,
        updatedAt: new Date(),
      },
    });
  }
}
