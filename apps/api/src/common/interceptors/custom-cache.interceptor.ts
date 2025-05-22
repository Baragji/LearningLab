// apps/api/src/common/interceptors/custom-cache.interceptor.ts
import { CacheInterceptor, CACHE_TTL_METADATA } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Injectable, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, tap } from 'rxjs';

@Injectable()
export class CustomCacheInterceptor extends CacheInterceptor {
  constructor(
    protected readonly cacheManager: Cache,
    protected readonly reflector: Reflector,
  ) {
    super(cacheManager, reflector);
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    // Hvis metoden ikke er GET, så skip caching
    if (request.method !== 'GET') {
      return next.handle();
    }

    const key = await this.trackBy(context);

    // Hvis der ikke er en cache key, så skip caching
    if (!key) {
      return next.handle();
    }

    try {
      // Forsøg at hente fra cache
      const value = await this.cacheManager.get(key);

      if (value !== undefined && value !== null) {
        // Cache hit - sæt header og returner cached værdi
        response.setHeader('X-Cache-Hit', 'true');
        return of(value);
      }

      // Cache miss - fortsæt med at hente data og gem i cache
      response.setHeader('X-Cache-Hit', 'false');

      return next.handle().pipe(
        tap((response) => {
          // Hent TTL fra metadata eller brug standard TTL
          const ttl =
            this.reflector.get(CACHE_TTL_METADATA, context.getHandler()) || 60;
          this.cacheManager.set(key, response, ttl);
        }),
      );
    } catch (err) {
      // Ved fejl, log og fortsæt uden caching
      console.error('Cache error:', err);
      return next.handle();
    }
  }
}
