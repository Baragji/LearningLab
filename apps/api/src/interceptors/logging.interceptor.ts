import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // Get user info if available
    const user = (request as any).user;
    const userId = user ? user.id : 'anonymous';
    const userRole = user ? user.role : 'none';

    // Log request
    this.logger.log(
      `[REQUEST] ${method} ${url} - IP: ${ip} - User: ${userId} (${userRole}) - UserAgent: ${userAgent}`
    );

    // Log request body for non-GET requests (excluding sensitive data)
    if (method !== 'GET' && request.body) {
      const sanitizedBody = this.sanitizeRequestBody(request.body);
      if (Object.keys(sanitizedBody).length > 0) {
        this.logger.debug(`[REQUEST BODY] ${JSON.stringify(sanitizedBody)}`);
      }
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;
          
          this.logger.log(
            `[RESPONSE] ${method} ${url} - ${statusCode} - ${duration}ms - User: ${userId}`
          );

          // Log response data for development (excluding large responses)
          if (process.env.NODE_ENV === 'development' && data) {
            const responseSize = JSON.stringify(data).length;
            if (responseSize < 1000) { // Only log small responses
              this.logger.debug(`[RESPONSE DATA] ${JSON.stringify(data)}`);
            } else {
              this.logger.debug(`[RESPONSE DATA] Large response (${responseSize} chars) - truncated`);
            }
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          
          this.logger.error(
            `[ERROR] ${method} ${url} - ${statusCode} - ${duration}ms - User: ${userId} - Error: ${error.message}`
          );
        },
      })
    );
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return {};
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'auth',
      'credential',
      'passwd',
      'pwd',
    ];

    const sanitized = { ...body };

    // Remove sensitive fields
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Remove file buffers and large data
    for (const key in sanitized) {
      if (sanitized[key] && typeof sanitized[key] === 'object') {
        if (Buffer.isBuffer(sanitized[key])) {
          sanitized[key] = `[BUFFER:${sanitized[key].length}bytes]`;
        } else if (Array.isArray(sanitized[key])) {
          // Limit array logging
          if (sanitized[key].length > 10) {
            sanitized[key] = `[ARRAY:${sanitized[key].length}items]`;
          }
        } else {
          // Recursively sanitize nested objects
          sanitized[key] = this.sanitizeRequestBody(sanitized[key]);
        }
      }
    }

    return sanitized;
  }
}

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);
  private readonly slowRequestThreshold = 1000; // 1 second

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const startTime = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => {
          const endTime = process.hrtime.bigint();
          const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

          if (duration > this.slowRequestThreshold) {
            this.logger.warn(
              `[SLOW REQUEST] ${method} ${url} - ${duration.toFixed(2)}ms (threshold: ${this.slowRequestThreshold}ms)`
            );
          }

          // Log memory usage for slow requests
          if (duration > this.slowRequestThreshold) {
            const memUsage = process.memoryUsage();
            this.logger.debug(
              `[MEMORY] RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)}MB, ` +
              `Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB, ` +
              `Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`
            );
          }
        },
        error: () => {
          const endTime = process.hrtime.bigint();
          const duration = Number(endTime - startTime) / 1000000;
          
          this.logger.error(
            `[ERROR PERFORMANCE] ${method} ${url} - ${duration.toFixed(2)}ms`
          );
        },
      })
    );
  }
}