// apps/api/src/users/dto/create-user.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';
import { Role } from '@repo/core'; // Importer Role enum fra @repo/core

export class CreateUserDto {
  @IsEmail({}, { message: 'Email skal være en gyldig email-adresse.' })
  @IsNotEmpty({ message: 'Email må ikke være tom.' })
  email: string;

  @IsString({ message: 'Password skal være en streng.' })
  @MinLength(8, { message: 'Password skal være mindst 8 tegn langt.' })
  @IsNotEmpty({ message: 'Password må ikke være tomt.' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Passwordet er for svagt. Det skal indeholde store og små bogstaver, tal og/eller specialtegn.',
  })
  password: string;

  @IsString({ message: 'Navn skal være en streng.' })
  @IsOptional()
  name?: string;

  // Bruger nu Role enum fra @repo/core
  @IsEnum(Role, {
    message: 'Rolle skal være en gyldig værdi (USER eller ADMIN).',
  })
  @IsOptional() // Gør rollen valgfri ved oprettelse, så den kan falde tilbage til default i Prisma schema
  role?: Role;
}
