// apps/api/src/search/search-cache-invalidation.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SearchCacheService } from './search-cache.service';

@Injectable()
export class SearchCacheInvalidationService {
  private readonly logger = new Logger(SearchCacheInvalidationService.name);

  constructor(private readonly cacheService: SearchCacheService) {}

  /**
   * Invalidate cache when a course is created, updated, or deleted
   */
  invalidateCourseCache(courseId?: string): void {
    this.logger.debug(`Invalidating course cache${courseId ? ` for course ${courseId}` : ''}`);
    this.cacheService.invalidateByEntity('course', courseId);
    this.cacheService.invalidateByEntity('all'); // Also invalidate 'all' searches
  }

  /**
   * Invalidate cache when a topic is created, updated, or deleted
   */
  invalidateTopicCache(topicId?: string): void {
    this.logger.debug(`Invalidating topic cache${topicId ? ` for topic ${topicId}` : ''}`);
    this.cacheService.invalidateByEntity('topic', topicId);
    this.cacheService.invalidateByEntity('all'); // Also invalidate 'all' searches
  }

  /**
   * Invalidate cache when a lesson is created, updated, or deleted
   */
  invalidateLessonCache(lessonId?: string): void {
    this.logger.debug(`Invalidating lesson cache${lessonId ? ` for lesson ${lessonId}` : ''}`);
    this.cacheService.invalidateByEntity('lesson', lessonId);
    this.cacheService.invalidateByEntity('all'); // Also invalidate 'all' searches
  }

  /**
   * Invalidate cache when a material (ContentBlock) is created, updated, or deleted
   */
  invalidateMaterialCache(materialId?: string): void {
    this.logger.debug(`Invalidating material cache${materialId ? ` for material ${materialId}` : ''}`);
    this.cacheService.invalidateByEntity('material', materialId);
    this.cacheService.invalidateByEntity('all'); // Also invalidate 'all' searches
  }

  /**
   * Invalidate cache when a file is created, updated, or deleted
   */
  invalidateFileCache(fileId?: string): void {
    this.logger.debug(`Invalidating file cache${fileId ? ` for file ${fileId}` : ''}`);
    this.cacheService.invalidateByEntity('file', fileId);
    this.cacheService.invalidateByEntity('all'); // Also invalidate 'all' searches
  }

  /**
   * Invalidate cache when an education program is created, updated, or deleted
   */
  invalidateEducationProgramCache(programId?: string): void {
    this.logger.debug(`Invalidating education program cache${programId ? ` for program ${programId}` : ''}`);
    // Education program changes affect all entity types
    this.cacheService.clear();
  }

  /**
   * Invalidate all cache entries
   */
  invalidateAllCache(): void {
    this.logger.debug('Invalidating all cache entries');
    this.cacheService.clear();
  }

  /**
   * Invalidate cache based on tags
   */
  invalidateCacheByTags(tags: string[]): void {
    if (!tags || tags.length === 0) return;
    
    this.logger.debug(`Invalidating cache for tags: ${tags.join(', ')}`);
    // For tag-based invalidation, we need to clear all cache since tags can affect any search
    this.cacheService.clear();
  }

  /**
   * Invalidate cache based on difficulty level
   */
  invalidateCacheByDifficulty(difficulty: string): void {
    this.logger.debug(`Invalidating cache for difficulty: ${difficulty}`);
    // For difficulty-based invalidation, we need to clear all cache
    this.cacheService.clear();
  }

  /**
   * Invalidate cache based on status
   */
  invalidateCacheByStatus(status: string): void {
    this.logger.debug(`Invalidating cache for status: ${status}`);
    // For status-based invalidation, we need to clear all cache
    this.cacheService.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cacheService.getStats();
  }
}