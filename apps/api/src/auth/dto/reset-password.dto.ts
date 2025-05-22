// apps/api/src/auth/dto/reset-password.dto.ts
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Reset token modtaget via email',
    example: 'a1b2c3d4e5f6g7h8i9j0',
    required: true,
  })
  @IsString({ message: 'Reset token skal være en streng.' })
  @IsNotEmpty({ message: 'Reset token må ikke være tomt.' })
  token: string;

  @ApiProperty({
    description: 'Nyt password',
    example: 'NytStærktPassword123!',
    required: true,
    minLength: 8,
  })
  @IsString({ message: 'Nyt password skal være en streng.' })
  @IsNotEmpty({ message: 'Nyt password må ikke være tomt.' })
  @MinLength(8, { message: 'Nyt password skal være mindst 8 tegn langt.' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Passwordet er for svagt. Det skal indeholde store og små bogstaver, tal og/eller specialtegn.',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Bekræftelse af nyt password',
    example: 'NytStærktPassword123!',
    required: true,
  })
  @IsString({ message: 'Bekræft password skal være en streng.' })
  @IsNotEmpty({ message: 'Bekræft password må ikke være tomt.' })
  // Validering af, om confirmPassword matcher newPassword, vil blive håndteret i AuthService.
  confirmPassword: string;
}
