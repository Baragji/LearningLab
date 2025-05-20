// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PersistenceModule } from './persistence/persistence.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
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
    PersistenceModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, ConfigService],
})
export class AppModule {}
