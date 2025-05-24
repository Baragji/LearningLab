import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { setTimeout } from 'timers/promises';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private readonly MAX_RETRIES = 5;
  private readonly INITIAL_BACKOFF_MS = 100;
  private readonly MAX_BACKOFF_MS = 5000;
  private isConnected = false;

  constructor() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    // Get database URL from environment variables with a fallback
    const dbUrl = process.env.DATABASE_URL || 
      'postgresql://test:test@localhost:5432/learninglab_dev?schema=public';
    
    // Initialize Prisma client with simple configuration
    super({
      errorFormat: 'pretty',
      datasources: {
        db: { url: dbUrl },
      },
      log: nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Log database connection info (with credentials masked)
    const maskedUrl = dbUrl.replace(/\/\/.*?@/, '//***@');
    this.logger.log(`Database URL: ${maskedUrl}`);
    
    // Extract database name for logging
    try {
      const dbUrlObj = new URL(dbUrl);
      const pathParts = dbUrlObj.pathname.split('/');
      const dbName = pathParts.length > 1 ? pathParts[1].split('?')[0] : 'unknown';
      this.logger.log(`Connecting to database: ${dbName}`);
    } catch (error) {
      this.logger.warn(`Could not parse database URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  /**
   * Connect to the database with exponential backoff retry strategy
   */
  private async connectWithRetry(retryCount = 0): Promise<void> {
    try {
      this.logger.log('Attempting to connect to the database...');
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to the database');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.warn(`Database connection error: ${errorMessage}`);

      if (retryCount < this.MAX_RETRIES) {
        // Calculate wait time with exponential backoff and jitter
        const backoffTime = Math.min(
          this.INITIAL_BACKOFF_MS * Math.pow(2, retryCount),
          this.MAX_BACKOFF_MS
        );
        const jitter = Math.random() * 100;
        const waitTime = backoffTime + jitter;

        this.logger.warn(
          `Retrying database connection in ${Math.round(waitTime)}ms... (Attempt ${retryCount + 1}/${this.MAX_RETRIES})`
        );

        await setTimeout(waitTime);
        await this.connectWithRetry(retryCount + 1);
      } else {
        this.logger.error(`Failed to connect to the database after ${this.MAX_RETRIES} attempts`);
        this.logger.error('Please check that your database is running and accessible');
        this.logger.error('Run: docker-compose up -d postgres');
      }
    }
  }

  /**
   * Execute a database operation with automatic retry for transient errors
   * @param operation Function to execute
   * @returns Result of the operation
   */
  async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    // Ensure we're connected before executing operations
    if (!this.isConnected) {
      this.logger.warn('Database not connected. Attempting to connect...');
      await this.connectWithRetry();
      
      if (!this.isConnected) {
        throw new Error('Cannot execute operation: Database is not connected');
      }
    }

    // Common transient error codes that can be retried
    const transientErrorCodes = [
      'P1001', // "Can't reach database server"
      'P1002', // "Database server timeout"
      'P1008', // "Operations timed out"
      'P1017', // "Server has closed the connection"
      'P2024', // "Timed out fetching a new connection"
      'P2028', // "Transaction API error"
    ];

    let retryCount = 0;

    while (true) {
      try {
        return await operation();
      } catch (error: unknown) {
        // Check if error is transient and can be retried
        let isTransient = false;
        
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          isTransient = transientErrorCodes.includes(error.code);
        } else if (error instanceof Error) {
          isTransient = error.message.includes('Connection') || 
                        error.message.includes('timeout') ||
                        error.message.includes('deadlock');
        }

        // If not transient or max retries reached, throw the error
        if (!isTransient || retryCount >= this.MAX_RETRIES) {
          // Update connection status if we lost connection
          if (error instanceof Prisma.PrismaClientKnownRequestError && 
              ['P1001', 'P1002', 'P1017'].includes(error.code)) {
            this.isConnected = false;
            this.logger.error('Lost connection to the database');
          }
          throw error;
        }

        // Calculate backoff time for retry
        retryCount++;
        const backoffTime = Math.min(
          this.INITIAL_BACKOFF_MS * Math.pow(2, retryCount - 1),
          this.MAX_BACKOFF_MS
        );
        const waitTime = backoffTime + (Math.random() * 100);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(
          `Transient database error: ${errorMessage}. Retrying in ${Math.round(waitTime)}ms... (${retryCount}/${this.MAX_RETRIES})`
        );

        await setTimeout(waitTime);
      }
    }
  }
}
