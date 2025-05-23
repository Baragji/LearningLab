// apps/api/src/app.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ErrorTestController } from './controllers/error-test.controller';
import { PersistenceModule } from './persistence/persistence.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
// Import CsrfMiddleware
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { CoursesModule } from './controllers/courses.module';
import { ModulesModule } from './controllers/modules.module';
import { LessonsModule } from './controllers/lessons.module';
import { ContentBlocksModule } from './controllers/contentBlocks.module';
import { QuizzesModule } from './controllers/quizzes.module';
import { QuizAttemptsModule } from './controllers/quizAttempts.module';
import { UserProgressModule } from './controllers/userProgress.module';
import { SubjectAreasModule } from './controllers/subjectAreas.module';
import { PensumModule } from './controllers/pensum.module';
import { SharedModule } from './shared/shared.module';
import { CommonModule } from './common/common.module';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SimpleCacheInterceptor } from './common/interceptors/simple-cache.interceptor';
import { ConfigModule } from './config/config.module';
// Import ConfigService
import { ConfigService } from './config/config.service';
// Midlertidigt deaktiveret pga. problemer med import
// import {
//   serverSchema,
//   ServerEnv,
//   clientEnv as getClientEnv,
// } from '@repo/config';

@Module({
  imports: [
    ConfigModule,

    // Registrer CacheModule globalt med faste værdier og memory store
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        ttl: 60, // Standard TTL på 60 sekunder
        max: 100, // Maksimalt 100 elementer i cachen
        store: 'memory', // Brug memory store eksplicit
      }),
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minut
        limit: 10, // 10 requests per ttl
      },
    ]),
    SharedModule, // Tilføj SharedModule for at gøre fælles funktionalitet tilgængelig globalt
    CommonModule, // Tilføj CommonModule for fejlhåndtering og logging
    PersistenceModule,
    UsersModule,
    AuthModule,
    CoursesModule,
    ModulesModule,
    LessonsModule,
    ContentBlocksModule,
    QuizzesModule,
    QuizAttemptsModule,
    UserProgressModule,
    SubjectAreasModule,
    PensumModule,
  ],
  controllers: [AppController, ErrorTestController],
  providers: [
    AppService,
    NestConfigService,
    // Registrer SimpleCacheInterceptor globalt
    {
      provide: APP_INTERCEPTOR,
      useClass: SimpleCacheInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Temporarily disable CSRF middleware until properly configured
    // consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
