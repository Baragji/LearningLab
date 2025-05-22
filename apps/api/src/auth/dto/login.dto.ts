// apps/api/src/auth/dto/login.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  // Matches, // Ubrugt import fjernet
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
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
  @IsNotEmpty({ message: 'Password må ikke være tomt.' })
  // Vi validerer ikke password kompleksitet ved login, kun ved oprettelse/ændring
  password: string;
}
