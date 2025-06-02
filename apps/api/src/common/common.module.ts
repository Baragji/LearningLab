// apps/api/src/common/common.module.ts
import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { AppLoggerService } from './services/logger.service';
import { SharedModule } from '../shared/shared.module';

@Global()
@Module({
  imports: [SharedModule], // Importér SharedModule for at få adgang til JwtService
  providers: [
    AppLoggerService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [AppLoggerService, SharedModule], // Eksportér også SharedModule
})
export class CommonModule {}
