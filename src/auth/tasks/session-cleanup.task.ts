import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Task to clean up expired sessions
 */
@Injectable()
export class SessionCleanupTask {
  private readonly logger = new Logger(SessionCleanupTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Clean up expired sessions every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredSessions() {
    this.logger.log('Running expired sessions cleanup task');

    try {
      // Get current date
      const now = new Date();

      // Delete expired sessions
      const expiredSessionsResult = await this.prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      this.logger.log(`Deleted ${expiredSessionsResult.count} expired sessions`);

      // Mark sessions as expired if they haven't been used within inactivity timeout
      const inactivityTimeoutSeconds = this.parseExpirationTime(
        this.configService.get<string>('SESSION_INACTIVITY_TIMEOUT', '4h')
      );
      const inactivityThreshold = new Date();
      inactivityThreshold.setSeconds(inactivityThreshold.getSeconds() - inactivityTimeoutSeconds);

      const inactiveSessions = await this.prisma.session.updateMany({
        where: {
          lastUsed: {
            lt: inactivityThreshold,
          },
          isRevoked: false,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          isRevoked: true,
        },
      });

      this.logger.log(`Marked ${inactiveSessions.count} inactive sessions as revoked`);
    } catch (error) {
      this.logger.error(`Error cleaning up sessions: ${error.message}`, error.stack);
    }
  }

  /**
   * Parse expiration time string to seconds
   */
  private parseExpirationTime(expirationTime: string): number {
    const match = expirationTime.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600; // Default to 1 hour
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 3600;
    }
  }
}
