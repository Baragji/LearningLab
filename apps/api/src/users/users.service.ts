    // apps/api/src/users/users.service.ts
    import {
      Injectable,
      ConflictException,
      InternalServerErrorException,
    } from '@nestjs/common';
    import { PrismaService } from '../persistence/prisma/prisma.service';
    import { CreateUserDto } from './dto/create-user.dto';
    import * as bcrypt from 'bcryptjs';
    import { User as PrismaUser, Role as PrismaRole } from '@prisma/client'; // Omdøb Prisma types for klarhed
    import { User as CoreUser, Role as CoreRole } from '@repo/core'; // Importer Core types

    @Injectable()
    export class UsersService {
      constructor(private prisma: PrismaService) {}

      /**
       * Helper function to map a PrismaUser object to a CoreUser object (omitting passwordHash).
       * @param user The PrismaUser object.
       * @returns A CoreUser object without the passwordHash.
       */
      private mapToCoreUser(user: PrismaUser): Omit<CoreUser, 'passwordHash'> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...result } = user;
        return {
          ...result,
          // Ensure enum compatibility if names are identical (which they are: USER, ADMIN)
          role: user.role as CoreRole,
          // Ensure Date objects are correctly typed if they come from JSON,
          // though Prisma typically returns Date objects directly.
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        };
      }

      async create(
        createUserDto: CreateUserDto,
      ): Promise<Omit<CoreUser, 'passwordHash'>> { // Returtype er nu baseret på CoreUser
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
              // Map CoreRole from DTO to PrismaRole for database operation
              role: (role as unknown as PrismaRole) || PrismaRole.USER,
            },
          });
          // Map den oprettede PrismaUser til CoreUser format før returnering
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

      // Metoder der bruges internt af f.eks. AuthService kan stadig returnere PrismaUser
      async findOneByEmail(email: string): Promise<PrismaUser | null> {
        return this.prisma.user.findUnique({
          where: { email },
        });
      }

      async findOneById(id: number): Promise<PrismaUser | null> {
        return this.prisma.user.findUnique({
          where: { id },
        });
      }

      // Valgfri: Hvis du vil have en metode, der eksplicit returnerer CoreUser for auth-formål
      async findOneByEmailForAuth(email: string): Promise<Omit<CoreUser, 'passwordHash'> | null> {
        const prismaUser = await this.findOneByEmail(email);
        return prismaUser ? this.mapToCoreUser(prismaUser) : null;
      }
    }
    