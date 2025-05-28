import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();
      let token = client.handshake.auth?.token;

      if (!token) {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        this.logger.warn('No token provided in WebSocket connection');
        client.disconnect();
        return false;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      if (!payload || !payload.sub) {
        this.logger.warn('Invalid JWT payload in WebSocket connection');
        client.disconnect();
        return false;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        this.logger.warn(`User not found for WebSocket connection: ${payload.sub}`);
        client.disconnect();
        return false;
      }

      if (user.status !== UserStatus.ACTIVE) {
        this.logger.warn(`Inactive user attempted WebSocket connection: ${payload.sub}`);
        client.disconnect();
        return false;
      }

      // Validate session if sessionId is provided
      if (payload.sessionId) {
        const session = await this.prisma.session.findUnique({
          where: { id: payload.sessionId },
        });

        if (!session || session.isRevoked || session.expiresAt < new Date()) {
          this.logger.warn(`Invalid session for WebSocket connection: ${payload.sessionId}`);
          client.disconnect();
          return false;
        }

        // Update session last used time
        await this.prisma.session.update({
          where: { id: payload.sessionId },
          data: { lastUsed: new Date() },
        });
      }

      // Attach user data to client
      client.data.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        sessionId: payload.sessionId,
      };

      this.logger.log(`WebSocket authenticated for user: ${user.email}`);
      return true;
    } catch (error) {
      this.logger.error(`WebSocket authentication error: ${error.message}`);
      const client = context.switchToWs().getClient();
      client.disconnect();
      return false;
    }
  }
}

@Injectable()
export class WsOptionalJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsOptionalJwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();
      let token = client.handshake.auth?.token;

      if (!token) {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        // No token provided, allow as public connection
        client.data.user = null;
        client.data.isPublic = true;
        this.logger.log(`Public WebSocket connection established: ${client.id}`);
        return true;
      }

      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get('JWT_SECRET'),
        });

        if (!payload || !payload.sub) {
          client.data.user = null;
          client.data.isPublic = true;
          this.logger.log(`Invalid token provided, allowing as public connection: ${client.id}`);
          return true;
        }

        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
        });

        if (!user || user.status !== UserStatus.ACTIVE) {
          client.data.user = null;
          client.data.isPublic = true;
          this.logger.log(`User not found or inactive, allowing as public connection: ${client.id}`);
          return true;
        }

        // Validate session if sessionId is provided
        if (payload.sessionId) {
          const session = await this.prisma.session.findUnique({
            where: { id: payload.sessionId },
          });

          if (!session || session.isRevoked || session.expiresAt < new Date()) {
            client.data.user = null;
            client.data.isPublic = true;
            this.logger.log(`Invalid session, allowing as public connection: ${client.id}`);
            return true;
          }

          // Update session last used time
          await this.prisma.session.update({
            where: { id: payload.sessionId },
            data: { lastUsed: new Date() },
          });
        }

        // Attach user data to client
        client.data.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionId: payload.sessionId,
        };
        client.data.isPublic = false;

        this.logger.log(`WebSocket authenticated for user: ${user.email}`);
        return true;
      } catch (tokenError) {
        // Token validation failed, allow as public connection
        client.data.user = null;
        client.data.isPublic = true;
        this.logger.log(`Token validation failed, allowing as public connection: ${client.id}`);
        return true;
      }
    } catch (error) {
      this.logger.error(`WebSocket guard error: ${error.message}`);
      const client = context.switchToWs().getClient();
      client.data.user = null;
      client.data.isPublic = true;
      return true;
    }
  }
}
