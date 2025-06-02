// apps/api/src/shared/shared.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * SharedModule indeholder fælles funktionalitet, der kan bruges på tværs af moduler.
 * Dette hjælper med at undgå cirkulære afhængigheder ved at udtrække fælles funktionalitet
 * til et separat modul, som kan importeres af flere moduler.
 */
@Module({
  imports: [
    // JwtModule konfigureres her og eksporteres, så det kan bruges af både AuthModule og andre moduler
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  providers: [],
  exports: [JwtModule], // Eksportér JwtModule, så det kan bruges af andre moduler
})
export class SharedModule {}
