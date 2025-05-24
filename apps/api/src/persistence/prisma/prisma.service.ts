import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { setTimeout } from 'timers/promises';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private readonly MAX_RETRIES = 10; // Increased from 5 to 10
  private readonly INITIAL_BACKOFF_MS = 100;
  private readonly MAX_BACKOFF_MS = 5000;
  private isConnected = false;

  constructor() {
    // Determine if we're running in Docker or directly on the host
    const isRunningInDocker = process.env.RUNNING_IN_DOCKER === 'true';
    const nodeEnv = process.env.NODE_ENV || 'development';

    // Get the database URL from environment variables
    let dbUrl = process.env.DATABASE_URL;
    let originalUrl = '';
    const logMessages = [];

    if (!dbUrl) {
      logMessages.push({
        level: 'error',
        message: 'DATABASE_URL environment variable is not set!',
      });
      dbUrl =
        'postgresql://test:test@localhost:5432/learninglab_dev?schema=public';
      logMessages.push({
        level: 'warn',
        message: `Using default database URL: ${dbUrl.replace(/\/\/.*?@/, '//***@')}`,
      });
    }

    // If URL contains 'postgres:' and we're not explicitly running in Docker,
    // or we're in development mode, replace 'postgres:' with 'localhost:'
    if (
      dbUrl &&
      dbUrl.includes('postgres:') &&
      (!isRunningInDocker || nodeEnv === 'development')
    ) {
      originalUrl = dbUrl;
      dbUrl = dbUrl.replace('postgres:', 'localhost:');
      logMessages.push({
        level: 'log',
        message: `Modified database URL from ${originalUrl.replace(/\/\/.*?@/, '//***@')} to ${dbUrl.replace(/\/\/.*?@/, '//***@')}`,
      });
    }

    // Extract and log database name for debugging
    try {
      const dbUrlObj = new URL(dbUrl);
      const pathParts = dbUrlObj.pathname.split('/');
      let dbName = pathParts.length > 1 ? pathParts[1].split('?')[0] : '';

      // Check if database name is missing or empty
      if (!dbName) {
        dbName = 'learninglab_dev';
        logMessages.push({
          level: 'warn',
          message: `Database name is missing in URL. Adding default database name: ${dbName}`,
        });

        // Reconstruct the URL with the database name
        const searchParams = dbUrlObj.search;
        const newPathname = `/learninglab_dev${searchParams}`;
        dbUrlObj.pathname = newPathname;
        dbUrl = dbUrlObj.toString();

        logMessages.push({
          level: 'log',
          message: `Updated database URL: ${dbUrl.replace(/\/\/.*?@/, '//***@')}`,
        });
      } else {
        logMessages.push({
          level: 'log',
          message: `Connecting to database: ${dbName}`,
        });
      }
    } catch (error) {
      logMessages.push({
        level: 'warn',
        message: `Could not parse database URL: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    // Call super() first with the prepared configuration
    super({
      errorFormat: 'pretty',
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Log the final database URL being used (with credentials masked)
    this.logger.log(
      `Final database URL being used: ${dbUrl.replace(/\/\/.*?@/, '//***@')}`,
    );

    // Now we can use this.logger to output the collected messages
    for (const msg of logMessages) {
      if (msg.level === 'error') this.logger.error(msg.message);
      if (msg.level === 'warn') this.logger.warn(msg.message);
      if (msg.level === 'log') this.logger.log(msg.message);
    }

    // Log connection information after super() call
    if (!isRunningInDocker) {
      this.logger.log(
        `Running outside Docker in ${nodeEnv} environment, using localhost for database connection`,
      );
    } else {
      this.logger.log(
        `Running in Docker in ${nodeEnv} environment, using database connection: ${dbUrl?.replace(/\/\/.*?@/, '//***@')}`,
      );
    }
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
      this.logger.log('Attempting to connect to the database...');
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to the database');
    } catch (error: unknown) {
      // Vi skal altid forsøge at oprette forbindelse til databasen, uanset miljø
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      this.logger.warn(`Database connection error: ${errorMessage}`);

      // Additional error diagnostics
      if (errorMessage.includes('denied access')) {
        this.logger.warn('Permission error detected. Checking database URL...');
        try {
          const dbUrl = process.env.DATABASE_URL || '';
          const dbUrlObj = new URL(dbUrl);
          const pathParts = dbUrlObj.pathname.split('/');
          const dbName =
            pathParts.length > 1 ? pathParts[1].split('?')[0] : 'unknown';
          const username = dbUrlObj.username;

          this.logger.warn(
            `Connection attempt details: Database: "${dbName}", User: "${username}"`,
          );
          this.logger.warn(
            'Please ensure the database exists and the user has proper permissions',
          );

          // Suggest potential fixes
          this.logger.warn('Potential fixes:');
          this.logger.warn('1. Check if the database exists');
          this.logger.warn(
            '2. Ensure the user has proper permissions on the database',
          );
          this.logger.warn('3. Verify the DATABASE_URL is correctly formatted');
          this.logger.warn(
            '4. If using Docker, ensure the postgres container is running',
          );
        } catch (parseError) {
          this.logger.warn(
            `Could not parse database URL for diagnostics: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          );
        }
      }

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
        this.logger.error(
          'Please check that your database is running and accessible.',
        );
        this.logger.error(
          'If running locally, make sure PostgreSQL is installed and running on port 5432.',
        );
        this.logger.error(
          'If using Docker, make sure the postgres container is running with: docker-compose up -d postgres',
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
    // If not connected to the database, try to connect first
    if (!this.isConnected) {
      this.logger.warn(
        'Database not connected. Attempting to connect before executing operation...',
      );
      await this.connectWithRetry();

      // If still not connected after retry, throw an error
      if (!this.isConnected) {
        throw new Error(
          'Cannot execute database operation: Database is not connected',
        );
      }
    }

    let retryCount = 0;

    while (true) {
      try {
        return await operation();
      } catch (error: unknown) {
        // Tjek om fejlen er midlertidig (f.eks. forbindelsesfejl)
        const isTransientError = this.isTransientError(error);

        if (!isTransientError || retryCount >= this.MAX_RETRIES) {
          // If we lost connection, update the flag
          if (this.isConnectionError(error)) {
            this.isConnected = false;
            this.logger.error('Lost connection to the database');
          }
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
   * Checks if an error is related to database connection
   */
  private isConnectionError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return ['P1001', 'P1002', 'P1017', 'P2024'].includes(error.code);
    }

    if (error instanceof Error) {
      return (
        error.message.includes('Connection refused') ||
        error.message.includes('Connection terminated') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes("Can't reach database")
      );
    }

    return false;
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
