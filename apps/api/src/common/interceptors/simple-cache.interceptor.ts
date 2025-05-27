// apps/api/src/common/interceptors/simple-cache.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Observable /*, of*/ } from 'rxjs';
// import { tap } from 'rxjs/operators';
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

    const _cacheKey = `${request.method}_${request.url}`;

    // Midlertidig deaktivering af cache pga. problemer med store
    // Returnerer direkte uden at forsøge at bruge cache
    return next.handle();
  }
}
