// apps/api/src/common/middleware/cache-logger.middleware.ts
import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheLoggerMiddleware implements NestMiddleware {
  private cacheHits = 0;
  private cacheMisses = 0;
  private readonly logInterval = 60000; // Log hver minut

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    // Start periodisk logging
    setInterval(() => this.logCacheStats(), this.logInterval);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    // Gem original response.end metode
    const originalEnd = res.end;
    const originalJson = res.json;
    const self = this;

    // Overvåg cache hits/misses baseret på X-Cache-Hit header
    res.on('finish', () => {
      const cacheHit = res.getHeader('X-Cache-Hit');
      if (cacheHit === 'true') {
        self.cacheHits++;
      } else if (cacheHit === 'false') {
        self.cacheMisses++;
      }
    });

    // Overskriv response.json for at tilføje X-Cache-Hit header
    res.json = function (body) {
      // Hvis der er en cache-hit header, bevar den
      if (!res.getHeader('X-Cache-Hit')) {
        res.setHeader('X-Cache-Hit', 'false');
      }
      return originalJson.call(this, body);
    };

    // Fortsæt til næste middleware
    next();
  }

  private logCacheStats() {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;

    console.log('=== Cache Statistik ===');
    console.log(`Cache Hits: ${this.cacheHits}`);
    console.log(`Cache Misses: ${this.cacheMisses}`);
    console.log(`Total Requests: ${total}`);
    console.log(`Cache Hit Rate: ${hitRate.toFixed(2)}%`);
    console.log('======================');

    // Nulstil tællere efter logging
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}
