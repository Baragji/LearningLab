// apps/api/src/common/common.module.ts
import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { AppLoggerService } from './services/logger.service';

@Global()
@Module({
  providers: [
    AppLoggerService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [AppLoggerService],
})
export class CommonModule {}
