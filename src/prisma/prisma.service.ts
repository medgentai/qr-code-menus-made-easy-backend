import { Injectable, OnModuleInit, OnModuleDestroy, Logger, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Define the event type for Prisma query events
interface QueryEvent {
  query: string;
  params: string;
  duration: number;
  target: string;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? [
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ]
        : [{ emit: 'stdout', level: 'error' }],
      // Add connection pooling configuration
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  // Connect with retry logic
  async connect() {
    if (this.isConnected) {
      return;
    }

    try {
      this.connectionAttempts++;
      await this.$connect();
      this.isConnected = true;
      this.connectionAttempts = 0;
      this.logger.log('Prisma connected to database');
    } catch (error) {
      this.logger.error(`Failed to connect to database (attempt ${this.connectionAttempts}/${this.MAX_CONNECTION_ATTEMPTS})`, error.message);

      if (this.connectionAttempts < this.MAX_CONNECTION_ATTEMPTS) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.pow(2, this.connectionAttempts - 1) * 1000;
        this.logger.log(`Retrying connection in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.connect();
      } else {
        this.logger.error('Max connection attempts reached. Giving up.');
        throw error;
      }
    }
  }

  // Disconnect safely
  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.$disconnect();
      this.isConnected = false;
      this.logger.log('Prisma disconnected from database');
    } catch (error) {
      this.logger.error('Error disconnecting from database', error.message);
      // Force disconnect even if there's an error
      this.isConnected = false;
    }
  }

  // Ensure connection before executing queries
  async ensureConnection() {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  // Helper method for transactions with connection check
  async executeTransaction<T>(fn: () => Promise<T>): Promise<T> {
    await this.ensureConnection();

    return this.$transaction(async (prisma) => {
      return fn();
    }, {
      // Set transaction timeout
      timeout: 10000, // 10 seconds
    });
  }

  /**
   * Setup shutdown hooks for graceful shutdown
   */
  async enableShutdownHooks(app: INestApplication) {
    this.logger.log('Setting up shutdown hooks for Prisma');

    // Listen for the beforeExit event
    process.on('beforeExit', async () => {
      this.logger.log('Received beforeExit event, closing application');
      await app.close();
    });
  }
}
