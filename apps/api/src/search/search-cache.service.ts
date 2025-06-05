// apps/api/src/search/search-cache.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class SearchCacheService {
  private readonly logger = new Logger(SearchCacheService.name);
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL: number;
  private readonly maxCacheSize: number;

  constructor(private configService: ConfigService) {
    // Cache TTL in milliseconds (default: 5 minutes)
    this.defaultTTL = this.configService.get<number>(
      'SEARCH_CACHE_TTL',
      5 * 60 * 1000,
    );
    // Maximum number of cached entries (default: 1000)
    this.maxCacheSize = this.configService.get<number>(
      'SEARCH_CACHE_MAX_SIZE',
      1000,
    );

    // Clean up expired entries every 10 minutes
    setInterval(() => this.cleanupExpiredEntries(), 10 * 60 * 1000);
  }

  /**
   * Generate a cache key from search parameters
   */
  private generateCacheKey(params: any): string {
    const normalizedParams = {
      ...params,
      // Normalize arrays and objects for consistent keys
      tags: Array.isArray(params.tags) ? params.tags.sort() : params.tags,
      status: Array.isArray(params.status)
        ? params.status.sort()
        : params.status,
    };

    return JSON.stringify(normalizedParams);
  }

  /**
   * Get cached search results
   */
  get(params: any): any | null {
    const key = this.generateCacheKey(params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.logger.debug(`Cache entry expired for key: ${key}`);
      return null;
    }

    this.logger.debug(`Cache hit for key: ${key}`);
    return entry.data;
  }

  /**
   * Set cached search results
   */
  set(params: any, data: any, ttl?: number): void {
    const key = this.generateCacheKey(params);
    const cacheTTL = ttl || this.defaultTTL;

    // If cache is at max size, remove oldest entry
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.logger.debug(
        `Cache size limit reached, removed oldest entry: ${oldestKey}`,
      );
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: cacheTTL,
    });

    this.logger.debug(`Cache set for key: ${key}, TTL: ${cacheTTL}ms`);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }

  /**
   * Clear cache entries related to specific entities
   */
  invalidateByEntity(entityType: string, entityId?: string): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      try {
        const params = JSON.parse(key);

        // Invalidate based on entity type or specific entity ID
        if (params.type === entityType || params.type === 'all') {
          if (!entityId || key.includes(entityId)) {
            keysToDelete.push(key);
          }
        }
      } catch (error) {
        // If key parsing fails, remove the entry
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      this.cache.delete(key);
      this.logger.debug(`Invalidated cache entry: ${key}`);
    });

    if (keysToDelete.length > 0) {
      this.logger.debug(
        `Invalidated ${keysToDelete.length} cache entries for entity type: ${entityType}`,
      );
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      this.logger.debug(
        `Cleaned up ${keysToDelete.length} expired cache entries`,
      );
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    defaultTTL: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      defaultTTL: this.defaultTTL,
    };
  }

  /**
   * Check if caching should be used for given parameters
   */
  shouldCache(params: any): boolean {
    // Don't cache if query is too short (likely to change frequently)
    if (params.query && params.query.length < 3) {
      return false;
    }

    // Don't cache real-time or user-specific searches
    if (params.realTime || params.userId) {
      return false;
    }

    return true;
  }
}
