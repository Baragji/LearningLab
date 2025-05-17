    // apps/api/src/users/dto/create-user.dto.ts
    import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
    import { Role } from '@prisma/client'; // Importer Role enum fra Prisma Client

    export class CreateUserDto {
      @IsEmail({}, { message: 'Email skal være en gyldig email-adresse.' })
      @IsNotEmpty({ message: 'Email må ikke være tom.' })
      email: string;

      @IsString({ message: 'Password skal være en streng.' })
      @MinLength(8, { message: 'Password skal være mindst 8 tegn langt.' })
      @IsNotEmpty({ message: 'Password må ikke være tomt.' })
      password: string;

      @IsString({ message: 'Navn skal være en streng.' })
      @IsOptional() // Gør navnefeltet valgfrit
      name?: string;

      // Baseret på din schema.prisma, hvor en bruger har én 'role'
      @IsEnum(Role, { message: 'Rolle skal være en gyldig værdi (USER eller ADMIN).' })
      @IsOptional() // Gør rollen valgfri ved oprettelse, så den kan falde tilbage til default i schema
      role?: Role;
    }
    