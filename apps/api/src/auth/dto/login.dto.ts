// apps/api/src/auth/dto/login.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email skal være en gyldig email-adresse.' })
  @IsNotEmpty({ message: 'Email må ikke være tom.' })
  email: string;

  @IsString({ message: 'Password skal være en streng.' })
  @MinLength(8, { message: 'Password skal være mindst 8 tegn langt.' }) // Juster evt. minLength baseret på dine krav
  @IsNotEmpty({ message: 'Password må ikke være tomt.' })
  password: string;
}
