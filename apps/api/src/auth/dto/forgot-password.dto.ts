// apps/api/src/auth/dto/forgot-password.dto.ts
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email skal være en gyldig email-adresse.' })
  @IsNotEmpty({ message: 'Email må ikke være tom.' })
  email: string;
}
