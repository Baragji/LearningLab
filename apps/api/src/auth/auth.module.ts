// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local/local';
import { JwtStrategy } from './strategies/jwt/jwt';
import { ConfigModule } from '@nestjs/config'; // ConfigModule kan stadig være her, hvis andre dele har brug for den
import { PersistenceModule } from '../persistence/persistence.module';
import { serverEnv } from '@repo/config'; // Importer serverEnv for JWT secret og expires_in

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      // imports: [ConfigModule], // Ikke længere nødvendigt at importere ConfigModule specifikt for JWT secret/expires her
      // inject: [ConfigService], // Ikke længere nødvendigt at injecte ConfigService specifikt for JWT secret/expires her
      useFactory: async () => ({ // ConfigService parameter fjernet, da vi bruger serverEnv direkte
        secret: serverEnv.JWT_SECRET,
        signOptions: {
          expiresIn: serverEnv.JWT_EXPIRES_IN,
        },
      }),
    }),
    ConfigModule, // Bevar hvis andre dele af AuthModule eller dens providers bruger ConfigService generelt
    PersistenceModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService, JwtModule], // JwtModule eksporteres typisk, så andre moduler kan injecte JwtService
})
export class AuthModule {}
