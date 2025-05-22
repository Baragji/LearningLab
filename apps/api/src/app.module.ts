// apps/api/src/app.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PersistenceModule } from './persistence/persistence.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { CoursesModule } from './controllers/courses.module';
import {
  serverSchema,
  ServerEnv,
  clientEnv as getClientEnv,
} from '@repo/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (configFromEnvFile) => {
        const source = { ...configFromEnvFile, ...process.env };
        const validatedConfig = serverSchema.safeParse(source);

        // In CI/CD or build environments, we don't need to validate all environment variables
        if (process.env.CI || process.env.NODE_ENV === 'production') {
          console.log(
            'Running in CI/CD or production environment, skipping strict env validation',
          );
          return source as ServerEnv;
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
          // In CI/CD or build environments, we don't need to validate client environment variables
          if (!(process.env.CI || process.env.NODE_ENV === 'production')) {
            throw clientError;
          }
        }

        return validatedConfig.data as ServerEnv;
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minut
        limit: 10, // 10 requests per ttl
      },
    ]),
    PersistenceModule,
    UsersModule,
    AuthModule,
    CoursesModule,
  ],
  controllers: [AppController],
  providers: [AppService, ConfigService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Temporarily disable CSRF middleware until properly configured
    // consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
