import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validationSchemaForEnv } from './environment-variables';
import { ConfigService } from './config.service';
import errorHandlingConfig from './error-handling.config';
import appConfig from './app.config';
import corsConfig from './cors.config';
import cacheConfig from './cache.config';
import throttleConfig from './throttle.config';
import authConfig from './auth.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema: validationSchemaForEnv,
      load: [
        appConfig,
        corsConfig,
        cacheConfig,
        throttleConfig,
        authConfig,
        errorHandlingConfig,
      ],
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
