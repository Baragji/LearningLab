// apps/api/src/auth/dto/reset-password.dto.ts
import { IsNotEmpty, IsString, MinLength } from 'class-validator'; // Matches er fjernet fra import

export class ResetPasswordDto {
  @IsString({ message: 'Reset token skal være en streng.' })
  @IsNotEmpty({ message: 'Reset token må ikke være tomt.' })
  token: string;

  @IsString({ message: 'Nyt password skal være en streng.' })
  @IsNotEmpty({ message: 'Nyt password må ikke være tomt.' })
  @MinLength(8, { message: 'Nyt password skal være mindst 8 tegn langt.' })
  // Valgfri: Tilføj en regex for at håndhæve password-kompleksitet, f.eks. mindst ét stort bogstav, ét lille bogstav, ét tal og ét specialtegn.
  // @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Passwordet er for svagt. Det skal indeholde store og små bogstaver, tal og specialtegn.'})
  newPassword: string;

  @IsString({ message: 'Bekræft password skal være en streng.' })
  @IsNotEmpty({ message: 'Bekræft password må ikke være tomt.' })
  // Validering af, om confirmPassword matcher newPassword, vil blive håndteret i AuthService.
  confirmPassword: string;
}
