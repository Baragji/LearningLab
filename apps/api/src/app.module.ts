// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PersistenceModule } from './persistence/persistence.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { serverSchema, ServerEnv, clientEnv as getClientEnv } from '@repo/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (configFromEnvFile) => {
        const source = { ...configFromEnvFile, ...process.env };
        const validatedConfig = serverSchema.safeParse(source);
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
          throw clientError;
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
