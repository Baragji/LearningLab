import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  // App config
  get port(): number {
    return parseInt(this.configService.get<string>('PORT', '5002'), 10);
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  // Database config
  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL');
  }

  // Auth config
  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET');
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '1d');
  }

  // CORS config
  get corsOrigins(): string[] {
    const originsString = this.configService.get<string>(
      'CORS_ORIGINS',
      'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3007',
    );
    return originsString.split(',').map((origin) => origin.trim());
  }

  // Cache config
  get cacheTtl(): number {
    return parseInt(this.configService.get<string>('CACHE_TTL', '60'), 10);
  }

  get cacheMaxItems(): number {
    return parseInt(
      this.configService.get<string>('CACHE_MAX_ITEMS', '100'),
      10,
    );
  }

  // Throttle config
  get throttleTtl(): number {
    return parseInt(
      this.configService.get<string>('THROTTLE_TTL', '60000'),
      10,
    );
  }

  get throttleLimit(): number {
    return parseInt(this.configService.get<string>('THROTTLE_LIMIT', '10'), 10);
  }
}
