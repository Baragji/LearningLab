// apps/api/src/auth/dto/login.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email skal være en gyldig email-adresse.' })
  @IsNotEmpty({ message: 'Email må ikke være tom.' })
  email: string;

  @IsString({ message: 'Password skal være en streng.' })
  @MinLength(8, { message: 'Password skal være mindst 8 tegn langt.' })
  @IsNotEmpty({ message: 'Password må ikke være tomt.' })
  // Vi validerer ikke password kompleksitet ved login, kun ved oprettelse/ændring
  password: string;
}
