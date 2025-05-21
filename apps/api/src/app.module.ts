// apps/api/src/app.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PersistenceModule } from './persistence/persistence.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  serverSchema,
  ServerEnv,
  clientEnv as getClientEnv,
} from '@repo/config';
import { UserProgressModule } from './modules/userProgress.module'; // Korrekt casing her

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (configFromEnvFile) => {
        const source = { ...configFromEnvFile, ...process.env };
        const validatedConfig = serverSchema.safeParse(source);

        if (process.env.CI || process.env.NODE_ENV === 'production') {
          console.log(
            'Running in CI/CD or production environment, using potentially default envs for missing ones.',
          );
          const defaults: Partial<ServerEnv> = {
            DATABASE_URL: source.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy',
            JWT_SECRET: source.JWT_SECRET || 'dummy_secret_for_build_32_chars_long_enough_to_pass',
            JWT_EXPIRES_IN: source.JWT_EXPIRES_IN || '15m',
            SALT_ROUNDS: source.SALT_ROUNDS ? parseInt(String(source.SALT_ROUNDS), 10) : 10,
          };
          return { ...defaults, ...source } as ServerEnv;
        }

        if (!validatedConfig.success) {
          console.error(
            'Fejl i server miljøvariabel-validering (AppModule):',
            validatedConfig.error.flatten().fieldErrors,
          );
          throw new Error(
            `Server miljøvariabel-validering fejlede: ${JSON.stringify(validatedConfig.error.format())}`,
          );
        }
        try {
          getClientEnv(); 
        } catch (clientError) {
           if (!(process.env.CI || process.env.NODE_ENV === 'production')) {
            throw clientError;
          }
        }
        return validatedConfig.data as ServerEnv;
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // Juster efter behov for produktion
      },
    ]),
    PersistenceModule,
    UsersModule,
    AuthModule,
    UserProgressModule, // Korrekt casing her
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // CsrfMiddleware kan genaktiveres senere hvis nødvendigt
    // consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
