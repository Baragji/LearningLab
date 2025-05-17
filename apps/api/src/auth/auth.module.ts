// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local/local';
import { JwtStrategy } from './strategies/jwt/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PersistenceModule } from '../persistence/persistence.module'; // <--- TILFØJ DENNE LINJE

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'DEFAULT_VERY_SECRET_KEY_CHANGE_ME_IN_ENV',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h',
        },
      }),
    }),
    ConfigModule,
    PersistenceModule, // <--- TILFØJ PersistenceModule HER
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
