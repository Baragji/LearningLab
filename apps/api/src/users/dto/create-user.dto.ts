// apps/api/src/users/dto/create-user.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  Matches,
  IsUrl,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, AuthProvider } from '@repo/core'; // Importer Role og AuthProvider enums fra @repo/core
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({
    description: 'Brugerens email-adresse',
    example: 'bruger@eksempel.dk',
    required: true,
  })
  @IsEmail({}, { message: 'Email skal være en gyldig email-adresse.' })
  @IsNotEmpty({ message: 'Email må ikke være tom.' })
  email: string;

  @ApiProperty({
    description: 'Brugerens password',
    example: 'StærktPassword123!',
    required: true,
    minLength: 8,
  })
  @IsString({ message: 'Password skal være en streng.' })
  @MinLength(8, { message: 'Password skal være mindst 8 tegn langt.' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Passwordet er for svagt. Det skal indeholde store og små bogstaver, tal og/eller specialtegn.',
  })
  @IsNotEmpty({ message: 'Password må ikke være tom.' })
  password: string;

  @ApiPropertyOptional({
    description: 'Brugerens navn',
    example: 'John Doe',
    required: false,
  })
  @IsString({ message: 'Navn skal være en streng.' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Brugerens rolle',
    enum: Role,
    example: 'STUDENT',
    required: false,
    default: 'STUDENT',
  })
  // Bruger nu Role enum fra @repo/core
  @IsEnum(Role, {
    message: 'Rolle skal være en gyldig værdi (STUDENT, TEACHER eller ADMIN).',
  })
  @IsOptional() // Gør rollen valgfri ved oprettelse, så den kan falde tilbage til default i Prisma schema
  role?: Role;

  @ApiPropertyOptional({
    description: 'URL til brugerens profilbillede',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsUrl({}, { message: 'Profilbillede skal være en gyldig URL.' })
  @IsOptional()
  profileImage?: string;

  @ApiPropertyOptional({
    description: 'Brugerens biografi eller beskrivelse',
    example: 'Jeg er en passioneret udvikler med interesse for...',
    required: false,
  })
  @IsString({ message: 'Bio skal være en tekst.' })
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Brugerens sociale links',
    example: {
      twitter: 'https://twitter.com/username',
      linkedin: 'https://linkedin.com/in/username',
    },
    required: false,
  })
  @IsObject({ message: 'Sociale links skal være et objekt.' })
  @IsOptional()
  socialLinks?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Brugerens indstillinger',
    example: { notifications: true, privacy: { showEmail: false } },
    required: false,
  })
  @IsObject({ message: 'Indstillinger skal være et objekt.' })
  @IsOptional()
  settings?: Record<string, any>;

  // Social login er deaktiveret indtil det skal bruges i produktion
  // Følgende felter er fjernet:
  // - googleId
  // - githubId
  // - provider
}
