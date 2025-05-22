// apps/api/src/common/services/logger.service.ts
import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Udvidet logger service til konsistent logning på tværs af applikationen
 */
@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
  private context?: string;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Sætter konteksten for loggeren
   */
  setContext(context: string) {
    this.context = context;
    return this;
  }

  /**
   * Logger en fejlmeddelelse
   */
  error(message: any, trace?: string, context?: string) {
    const currentContext = context || this.context;
    const timestamp = new Date().toISOString();

    // Altid log fejlmeddelelsen
    console.error(`[${timestamp}] [${currentContext}] [ERROR] ${message}`);

    // Log stack trace hvis konfigureret til det
    const logStackTraces = this.configService.get<boolean>(
      'errorHandling.logStackTraces',
      true,
    );
    if (logStackTraces && trace) {
      console.error(`[${timestamp}] [${currentContext}] [STACK] ${trace}`);
    }
  }

  /**
   * Logger en advarsel
   */
  warn(message: any, context?: string) {
    const currentContext = context || this.context;
    console.warn(
      `[${new Date().toISOString()}] [${currentContext}] [WARN] ${message}`,
    );
  }

  /**
   * Logger en info-meddelelse
   */
  log(message: any, context?: string) {
    const currentContext = context || this.context;
    console.log(
      `[${new Date().toISOString()}] [${currentContext}] [INFO] ${message}`,
    );
  }

  /**
   * Logger en debug-meddelelse (kun i ikke-produktionsmiljøer)
   */
  debug(message: any, context?: string) {
    // Skip debug logs i produktion
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      return;
    }

    const currentContext = context || this.context;
    console.debug(
      `[${new Date().toISOString()}] [${currentContext}] [DEBUG] ${message}`,
    );
  }

  /**
   * Logger en verbose-meddelelse (kun i ikke-produktionsmiljøer)
   */
  verbose(message: any, context?: string) {
    // Skip verbose logs i produktion
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      return;
    }

    const currentContext = context || this.context;
    console.log(
      `[${new Date().toISOString()}] [${currentContext}] [VERBOSE] ${message}`,
    );
  }
}
