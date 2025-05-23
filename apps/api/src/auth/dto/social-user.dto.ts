// apps/api/src/auth/dto/social-user.dto.ts
import { AuthProvider } from '@repo/core';

export class SocialUserDto {
  providerId: string;
  provider: AuthProvider;
  email: string;
  name?: string;
  profileImage?: string;
}
