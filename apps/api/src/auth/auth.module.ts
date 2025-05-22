// File: apps/api/src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local/local';
import { JwtStrategy } from './strategies/jwt/jwt';
import { ConfigModule } from '@nestjs/config';
import { PersistenceModule } from '../persistence/persistence.module';
import { SharedModule } from '../shared/shared.module';

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
    SharedModule, // Importér SharedModule i stedet for at konfigurere JwtModule direkte
    ConfigModule, // global via AppModule, but imported here for clarity
    PersistenceModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
