// apps/api/src/auth/dto/refresh-token.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'Refresh token skal være en streng.' })
  @IsNotEmpty({ message: 'Refresh token må ikke være tomt.' })
  refresh_token: string;
}
