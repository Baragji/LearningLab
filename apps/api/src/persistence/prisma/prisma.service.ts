import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to the database');
    } catch (error: unknown) {
      // During build process, we don't need to connect to the database
      if (process.env.NODE_ENV === 'production' || process.env.CI) {
        this.logger.warn(
          'Skipping database connection in production/CI environment',
        );
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      this.logger.error(`Failed to connect to the database: ${errorMessage}`);
      // Don't throw error to allow the application to start without database in build environments
    }
  }
}
