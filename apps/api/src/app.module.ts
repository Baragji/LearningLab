// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validationSchemaForEnv } from './config/environment-variables';
import { PersistenceModule } from './persistence/persistence.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module'; // <--- TILFØJ DENNE LINJE

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: validationSchemaForEnv,
    }),
    PersistenceModule,
    UsersModule,
    AuthModule, // <--- TILFØJ AuthModule HER
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
