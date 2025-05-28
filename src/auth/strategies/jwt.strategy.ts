import { Injectable, UnauthorizedException, Logger, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserStatus } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret-for-dev',
    });
  }

  async validate(payload: JwtPayload) {
    // Handle empty or invalid payload
    if (!payload) {
      this.logger.warn('Empty JWT payload');
      throw new UnauthorizedException('Invalid token');
    }

    const { sub: userId, sessionId } = payload;

    if (!userId) {
      this.logger.warn('JWT payload missing user ID');
      throw new UnauthorizedException('Invalid token format');
    }

    this.logger.debug(`Validating token for user: ${userId}`);

    try {
      // Ensure database connection is active
      await this.prisma.ensureConnection();

      // Get user with all fields using transaction for reliability
      const user = await this.prisma.executeTransaction(async () => {
        return this.prisma.user.findUnique({
          where: { id: userId },
        });
      });

      if (!user) {
        this.logger.warn(`User not found: ${userId}`);
        throw new UnauthorizedException('User not found');
      }

      if (user.status !== UserStatus.ACTIVE) {
        this.logger.warn(`Inactive user attempted login: ${userId}`);
        throw new UnauthorizedException('User account is not active');
      }

      // If sessionId is provided, check if the session is valid
      if (sessionId) {
        const session = await this.prisma.session.findUnique({
          where: { id: sessionId },
        });

        if (!session) {
          this.logger.warn(`Session not found: ${sessionId}`);
          throw new UnauthorizedException('Invalid session');
        }

        if (session.isRevoked) {
          this.logger.warn(`Revoked session used: ${sessionId}`);
          throw new UnauthorizedException('Session has been revoked');
        }

        if (session.expiresAt < new Date()) {
          this.logger.warn(`Expired session used: ${sessionId}`);
          throw new UnauthorizedException('Session has expired');
        }

        // Update session last used time
        await this.prisma.session.update({
          where: { id: sessionId },
          data: { lastUsed: new Date() },
        });
      }

      // Create a clean user object without sensitive information
      const cleanUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        profileImageUrl: user.profileImageUrl,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        sessionId, // Include the session ID
      };

      return cleanUser;
    } catch (error) {
      // Log the specific error
      this.logger.error(`Error validating token for user ${userId}: ${error.message}`, error.stack);

      // Rethrow as appropriate exception
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // For database connection issues, throw a more specific error
      if (error.code === 'P2024' || error.message.includes('connection')) {
        throw new InternalServerErrorException('Database connection error. Please try again later.');
      }

      // For other errors, throw a generic unauthorized exception
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
