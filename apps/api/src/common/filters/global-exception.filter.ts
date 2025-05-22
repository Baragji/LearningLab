// apps/api/src/common/filters/global-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../services/logger.service';

/**
 * Standardiseret fejlrespons interface
 */
export interface StandardizedErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  timestamp: string;
  path: string;
  details?: any; // Kun inkluderet i udviklingsmiljø
}

/**
 * Enum med fejlkoder for bedre maskinlæsbarhed
 */
export enum ErrorCode {
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  CONFLICT = 'CONFLICT',
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Mapper HTTP statuskoder til ErrorCode enum
 */
const statusToErrorCodeMap: Record<number, ErrorCode> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.METHOD_NOT_ALLOWED]: ErrorCode.METHOD_NOT_ALLOWED,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCode.UNPROCESSABLE_ENTITY,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.TOO_MANY_REQUESTS,
  [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCode.INTERNAL_SERVER_ERROR,
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger: AppLoggerService;
  private readonly isProduction: boolean;

  constructor(
    @Optional() private readonly configService?: ConfigService,
    @Optional() logger?: AppLoggerService,
  ) {
    // Hvis configService ikke er tilgængelig, antag udvikling som standard
    this.isProduction = configService?.get<string>('NODE_ENV') === 'production';

    // Brug den injicerede logger eller opret en ny
    this.logger = logger || new AppLoggerService(configService);
    this.logger.setContext(GlobalExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Standardværdier for status og fejlbesked
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Der opstod en intern serverfejl.';
    let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
    let details: any = undefined;

    // Håndter forskellige typer af exceptions
    if (exception instanceof HttpException) {
      // NestJS HttpException
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || message;

        // Gem detaljerede fejloplysninger til udvikling
        if (!this.isProduction) {
          details = exceptionResponse;
        }
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }

      // Map HTTP status til ErrorCode
      errorCode = statusToErrorCodeMap[status] || ErrorCode.UNKNOWN_ERROR;
    } else if (exception instanceof Error) {
      // Standard JavaScript Error
      message = this.isProduction
        ? 'Der opstod en intern serverfejl.'
        : exception.message;

      // Gem stack trace til udvikling
      if (!this.isProduction) {
        details = {
          name: exception.name,
          stack: exception.stack,
        };
      }

      // Speciel håndtering af kendte fejltyper
      if (
        exception.name === 'PrismaClientKnownRequestError' ||
        exception.name === 'PrismaClientValidationError'
      ) {
        errorCode = ErrorCode.DATABASE_ERROR;
      }
    }

    // Log fejlen med alle detaljer (uanset miljø)
    const logMessage = `${request.method} ${request.url} - Status: ${status}, ErrorCode: ${errorCode}, Message: ${message}`;
    const stackTrace =
      exception instanceof Error ? exception.stack : 'No stack trace available';
    this.logger.error(logMessage, stackTrace);

    // Byg standardiseret fejlrespons
    const errorResponse: StandardizedErrorResponse = {
      statusCode: status,
      errorCode: errorCode,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Tilføj detaljer kun i udviklingsmiljø
    if (!this.isProduction && details) {
      errorResponse.details = details;
    }

    // Send et struktureret svar tilbage til klienten
    response.status(status).json(errorResponse);
  }
}
