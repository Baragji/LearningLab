// apps/api/src/common/interceptors/simple-cache.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class SimpleCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SimpleCacheInterceptor.name);
  private readonly ttl = 300; // 5 minutter standard TTL

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();

    // Skip cache for POST, PUT, DELETE, PATCH requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      return next.handle();
    }

    const cacheKey = `${request.method}_${request.url}`;

    try {
      // Tjek om data findes i cachen
      const cachedData = await this.cacheManager.get(cacheKey);
      if (cachedData) {
        this.logger.log(`Cache hit for ${cacheKey}`);
        return of(cachedData);
      }

      this.logger.log(`Cache miss for ${cacheKey}`);
    } catch (error) {
      this.logger.error(
        `Cache error: ${(error as Error).message || 'Unknown error'}`,
      );
      // Continue with the request even if cache fails
    }

    // Hvis ikke i cache, hent data og gem i cache
    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.cacheManager.set(cacheKey, data, this.ttl);
        } catch (error) {
          this.logger.error(
            `Cache set error: ${(error as Error).message || 'Unknown error'}`,
          );
          // Continue even if cache set fails
        }
      }),
    );
  }
}
