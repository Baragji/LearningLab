// File: apps/api/src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local/local';
import { JwtStrategy } from './strategies/jwt/jwt';

import {
  ConfigModule as NestConfigModule,
  // ConfigService, // Removed unused import
} from '@nestjs/config';
import { PersistenceModule } from '../persistence/persistence.module';
import { SharedModule } from '../shared/shared.module';
import socialAuthConfig from '../config/social-auth.config';

/**
 * AuthModule håndterer autentificering og autorisation i applikationen.
 *
 * For at undgå cirkulære afhængigheder:
 * 1. Vi bruger forwardRef() til at importere UsersModule
 * 2. Vi importerer SharedModule, der indeholder JwtModule-konfiguration
 */
@Module({
  imports: [
    forwardRef(() => UsersModule), // Brug forwardRef for at undgå cirkulære afhængigheder
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'testSecret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
    }),
    SharedModule, // Importér SharedModule i stedet for at konfigurere JwtModule direkte
    NestConfigModule.forFeature(socialAuthConfig), // Tilføj social auth config
    NestConfigModule, // global via AppModule, but imported here for clarity
    PersistenceModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    // Social login strategier er deaktiveret indtil de skal bruges i produktion
    // GoogleStrategy,
    // GithubStrategy,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
