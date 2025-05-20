// apps/api/src/common/filters/global-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Standardværdier for status og fejlbesked
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Der opstod en intern serverfejl.';
    let error = 'Internal Server Error';

    // Hvis det er en HttpException, brug dens status og besked
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error || exception.name;
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }
    }

    // Log fejlen med detaljer
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status}, Message: ${message}`,
      exception instanceof Error ? exception.stack : 'No stack trace available',
    );

    // Send et struktureret svar tilbage til klienten
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      message,
    });
  }
}
