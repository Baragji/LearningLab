// apps/api/src/search/search.module.ts
import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { SearchCacheService } from './search-cache.service';
import { SearchCacheInvalidationService } from './search-cache-invalidation.service';
import { PersistenceModule } from '../persistence/persistence.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PersistenceModule, ConfigModule],
  controllers: [SearchController],
  providers: [
    SearchService,
    SearchCacheService,
    SearchCacheInvalidationService,
  ],
  exports: [SearchService, SearchCacheService, SearchCacheInvalidationService],
})
export class SearchModule {}
