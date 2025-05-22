// apps/api/src/config/error-handling.config.ts
import { registerAs } from '@nestjs/config';

/**
 * Konfiguration for fejlhåndtering
 */
export interface ErrorHandlingConfig {
  /**
   * Om detaljerede fejlmeddelelser skal vises til klienten
   */
  showDetailedErrors: boolean;

  /**
   * Om stack traces skal logges
   */
  logStackTraces: boolean;
}

/**
 * Standard fejlhåndteringskonfiguration baseret på miljø
 */
export default registerAs('errorHandling', (): ErrorHandlingConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  return {
    // I produktion vises ikke detaljerede fejl til klienten
    showDetailedErrors: !isProduction,

    // Stack traces logges altid, uanset miljø
    logStackTraces: true,
  };
});
