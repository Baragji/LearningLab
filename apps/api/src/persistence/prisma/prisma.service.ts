import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { setTimeout } from 'timers/promises';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private readonly MAX_RETRIES = 5;
  private readonly INITIAL_BACKOFF_MS = 100;
  private readonly MAX_BACKOFF_MS = 5000;

  constructor() {
    super({
      // Tilføj global error handling middleware til alle Prisma-operationer
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  /**
   * Forsøger at oprette forbindelse til databasen med eksponentiel backoff-strategi
   * for at håndtere midlertidige forbindelsesproblemer
   */
  private async connectWithRetry(retryCount = 0): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to the database');
    } catch (error: unknown) {
      // Under byggeprocessen behøver vi ikke at oprette forbindelse til databasen
      if (process.env.NODE_ENV === 'production' || process.env.CI) {
        this.logger.warn(
          'Skipping database connection in production/CI environment',
        );
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      if (retryCount < this.MAX_RETRIES) {
        // Beregn ventetid med eksponentiel backoff og jitter
        const backoffTime = Math.min(
          this.INITIAL_BACKOFF_MS * Math.pow(2, retryCount),
          this.MAX_BACKOFF_MS,
        );
        // Tilføj jitter (tilfældig variation) for at undgå samtidig genopkobling
        const jitter = Math.random() * 100;
        const waitTime = backoffTime + jitter;

        this.logger.warn(
          `Failed to connect to the database: ${errorMessage}. Retrying in ${Math.round(
            waitTime,
          )}ms... (Attempt ${retryCount + 1}/${this.MAX_RETRIES})`,
        );

        await setTimeout(waitTime);
        await this.connectWithRetry(retryCount + 1);
      } else {
        this.logger.error(
          `Failed to connect to the database after ${this.MAX_RETRIES} attempts: ${errorMessage}`,
        );
        // Kast ikke fejl for at tillade applikationen at starte uden database i byggemiljøer
      }
    }
  }

  /**
   * Udfører en databaseoperation med automatisk genopkobling ved midlertidige fejl
   * @param operation Funktionen der skal udføres
   * @returns Resultatet af operationen
   */
  async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let retryCount = 0;

    while (true) {
      try {
        return await operation();
      } catch (error: unknown) {
        // Tjek om fejlen er midlertidig (f.eks. forbindelsesfejl)
        const isTransientError = this.isTransientError(error);

        if (!isTransientError || retryCount >= this.MAX_RETRIES) {
          throw error;
        }

        retryCount++;
        const backoffTime = Math.min(
          this.INITIAL_BACKOFF_MS * Math.pow(2, retryCount - 1),
          this.MAX_BACKOFF_MS,
        );
        const jitter = Math.random() * 100;
        const waitTime = backoffTime + jitter;

        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        this.logger.warn(
          `Transient database error: ${errorMessage}. Retrying in ${Math.round(
            waitTime,
          )}ms... (Attempt ${retryCount}/${this.MAX_RETRIES})`,
        );

        await setTimeout(waitTime);
      }
    }
  }

  /**
   * Tjekker om en fejl er midlertidig og kan forsøges igen
   */
  private isTransientError(error: unknown): boolean {
    // Typiske midlertidige fejl inkluderer forbindelsesfejl, deadlocks, og timeout
    const transientErrorCodes = [
      'P1001', // "Can't reach database server"
      'P1002', // "Database server timeout"
      'P1008', // "Operations timed out"
      'P1017', // "Server has closed the connection"
      'P2024', // "Timed out fetching a new connection from the connection pool"
      'P2028', // "Transaction API error"
    ];

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return transientErrorCodes.includes(error.code);
    }

    if (error instanceof Error) {
      return (
        error.message.includes('Connection refused') ||
        error.message.includes('Connection terminated') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('deadlock detected')
      );
    }

    return false;
  }
}
