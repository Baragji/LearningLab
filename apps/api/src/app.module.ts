// apps/api/src/app.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import {
  ConfigModule as NestConfigModule,
  ConfigService as NestConfigService,
} from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ErrorTestController } from './controllers/error-test.controller';
import { PersistenceModule } from './persistence/persistence.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
// Import Middlewares
import { UserIdentificationMiddleware } from './common/middleware/user-identification.middleware';
import { CoursesModule } from './controllers/courses.module';
import { TopicsModule } from './controllers/topics.module';
import { LessonsModule } from './controllers/lessons.module';
import { ContentBlocksModule } from './controllers/contentBlocks.module';
import { QuizzesModule } from './controllers/quizzes.module';
import { QuizAttemptsModule } from './controllers/quizAttempts.module';
import { UserProgressModule } from './controllers/userProgress.module';
import { EducationProgramsModule } from './controllers/educationPrograms.module';
import { PensumModule } from './controllers/pensum.module';
import { QuestionBankModule } from './controllers/question-bank.module';
import { CertificateModule } from './controllers/certificate.module';
import { UserGroupsModule } from './user-groups/user-groups.module';
import { SharedModule } from './shared/shared.module';
import { CommonModule } from './common/common.module';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR, APP_FILTER, APP_PIPE } from '@nestjs/core';
import { SimpleCacheInterceptor } from './common/interceptors/simple-cache.interceptor';
import {
  LoggingInterceptor,
  PerformanceInterceptor,
} from './interceptors/logging.interceptor';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { CustomValidationPipe } from './pipes/validation.pipe';
import { ConfigModule } from './config/config.module';
// Import ConfigService
// import { ConfigService } from './config/config.service'; // Removed unused import

import { SearchModule } from './search/search.module';
import { FileUploadModule } from './modules/file-upload.module';
import { MaterialModule } from './modules/material.module';
import { AIModule } from './ai/ai.module';
// Import social auth config
import socialAuthConfig from './config/social-auth.config';
// Midlertidigt deaktiveret pga. problemer med import
// import {
//   serverSchema,
//   ServerEnv,
//   clientEnv as getClientEnv,
// } from '@repo/config';

@Module({
  imports: [
    ConfigModule,

    // Registrer social auth config
    NestConfigModule.forFeature(socialAuthConfig),

    // Registrer CacheModule globalt med faste værdier og memory store
    CacheModule.register({
      isGlobal: true,
      ttl: 60, // Standard TTL på 60 sekunder
      max: 100, // Maksimalt 100 elementer i cachen
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
    UserGroupsModule, // Tilføj UserGroupsModule
    SearchModule, // Tilføj SearchModule for avanceret søgning
    FileUploadModule, // Tilføj FileUploadModule for fil-upload
    MaterialModule, // Tilføj MaterialModule for materiale-styring
    AIModule, // Tilføj AIModule for AI funktionalitet
    CoursesModule,
    TopicsModule, // Updated from ModulesModule
    LessonsModule,
    ContentBlocksModule,
    QuizzesModule,
    QuizAttemptsModule,
    UserProgressModule,
    EducationProgramsModule, // Updated from SubjectAreasModule
    PensumModule,
    QuestionBankModule,
    CertificateModule,
  ],
  controllers: [AppController, ErrorTestController],
  providers: [
    AppService,
    NestConfigService,
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Global Validation Pipe
    {
      provide: APP_PIPE,
      useClass: CustomValidationPipe,
    },
    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
    // Registrer SimpleCacheInterceptor globalt
    {
      provide: APP_INTERCEPTOR,
      useClass: SimpleCacheInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Registrer UserIdentificationMiddleware for alle ruter
    consumer.apply(UserIdentificationMiddleware).forRoutes('*');

    // Temporarily disable CSRF middleware until properly configured
    // consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
