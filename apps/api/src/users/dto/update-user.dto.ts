// apps/api/src/users/dto/update-user.dto.ts
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  Matches,
  IsUrl,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@repo/core';
import { Type } from 'class-transformer';
import { SocialLinks, socialLinksSchema } from '../schemas/social-links.schema';
import {
  UserSettings,
  userSettingsSchema,
} from '../schemas/user-settings.schema';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Brugerens email-adresse',
    example: 'bruger@eksempel.dk',
  })
  @IsEmail({}, { message: 'Email skal være en gyldig email-adresse.' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Brugerens password',
    example: 'StærktPassword123!',
    minLength: 8,
  })
  @IsString({ message: 'Password skal være en streng.' })
  @MinLength(8, { message: 'Password skal være mindst 8 tegn langt.' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Passwordet er for svagt. Det skal indeholde store og små bogstaver, tal og/eller specialtegn.',
  })
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    description: 'Brugerens navn',
    example: 'John Doe',
  })
  @IsString({ message: 'Navn skal være en streng.' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Brugerens rolle',
    enum: Role,
    example: 'STUDENT',
  })
  @IsEnum(Role, {
    message: 'Rolle skal være en gyldig værdi (STUDENT, TEACHER eller ADMIN).',
  })
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({
    description: 'URL til brugerens profilbillede',
    example: 'https://example.com/profile.jpg',
  })
  @IsUrl({}, { message: 'Profilbillede skal være en gyldig URL.' })
  @IsOptional()
  profileImage?: string;

  @ApiPropertyOptional({
    description: 'Brugerens biografi eller beskrivelse',
    example: 'Jeg er en passioneret udvikler med interesse for...',
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
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  @IsObject({ message: 'Sociale links skal være et objekt.' })
  socialLinks?: SocialLinks;

  @ApiPropertyOptional({
    description: 'Brugerens indstillinger',
    example: {
      notifications: { email: true, browser: true },
      privacy: { showProfile: true, showProgress: false },
      theme: 'system',
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  @IsObject({ message: 'Indstillinger skal være et objekt.' })
  settings?: UserSettings;
}
