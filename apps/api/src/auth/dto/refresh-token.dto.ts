// apps/api/src/auth/dto/refresh-token.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token modtaget ved login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true,
  })
  @IsString({ message: 'Refresh token skal være en streng.' })
  @IsNotEmpty({ message: 'Refresh token må ikke være tomt.' })
  refresh_token: string;
}
