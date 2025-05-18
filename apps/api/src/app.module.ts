// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Kun ConfigModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { validationSchemaForEnv } from './config/environment-variables'; // Fjernet
import { PersistenceModule } from './persistence/persistence.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ // Ingen validationSchema her længere for de delte variabler
      isGlobal: true,
    }),
    PersistenceModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
