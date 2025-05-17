// apps/api/src/users/users.service.ts
import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../persistence/prisma/prisma.service'; // Sti til din PrismaService
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { User, Role } from '@prisma/client'; // Importer User og Role typer fra Prisma

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const { email, password, name, role } = createUserDto;

    // Tjek om brugeren allerede eksisterer
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('En bruger med denne email eksisterer allerede.');
    }

    // Hash passwordet
    const saltRounds = 10; // Anbefalet antal "salt rounds" for bcrypt
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, saltRounds);
    } catch (error) {
      // Log den faktiske fejl internt
      console.error('Fejl under hashing af password:', error);
      // Vis en generisk fejl til klienten
      throw new InternalServerErrorException('Der opstod en intern fejl under brugeroprettelse (hashing).');
    }

    // Opret brugeren i databasen
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword, // Gem det hashede password
          name: name || null, // Sæt til null hvis name ikke er angivet i DTO'en
          role: role || Role.USER, // Brug den angivne rolle fra DTO'en, eller default til USER hvis ikke angivet
        },
      });

      // Fjern det hashede password fra det objekt, der returneres til klienten
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;

    } catch (error) {
      // Håndter specifikke databasefejl, f.eks. hvis unique constraint fejler (selvom vi tjekker ovenfor)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') { // Prisma's kode for unique constraint violation
        throw new ConflictException('En bruger med denne email eksisterer allerede (databasefejl).');
      }
      // Log den faktiske fejl internt
      console.error('Databasefejl under brugeroprettelse:', error);
      // Vis en generisk fejl til klienten
      throw new InternalServerErrorException('Der opstod en databasefejl under brugeroprettelse.');
    }
  }

  // Metode til at finde en bruger baseret på email (nyttig til login senere)
  async findOneByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Metode til at finde en bruger baseret på ID (nyttig til andre operationer senere)
  async findOneById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
