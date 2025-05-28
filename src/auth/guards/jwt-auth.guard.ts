import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Otherwise, use the default JWT auth guard
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    // Get request details for better logging
    const request = context.switchToHttp().getRequest();
    const requestPath = request.url;
    const requestMethod = request.method;

    // Log detailed information about the request and auth status
    this.logger.debug(`Auth check for ${requestMethod} ${requestPath}`);

    // Special case for logout endpoint - allow even with invalid token
    if (requestPath === '/api/v1/auth/logout' && requestMethod === 'POST') {
      // For logout, if user is not found, create a minimal user object with a placeholder ID
      // This allows the logout process to continue without error
      if (!user) {
        this.logger.debug('Allowing logout with invalid token');
        return { id: 'logged-out-user', email: '', name: '', role: '' };
      }
      return user;
    }

    // Handle specific JWT errors with generic error messages
    if (err) {
      this.logger.error(`JWT error for ${requestMethod} ${requestPath}: ${err.message}`);

      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Authentication required');
      } else if (err instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Authentication required');
      } else {
        throw err;
      }
    }

    // Handle missing user
    if (!user) {
      this.logger.warn(`No user found for ${requestMethod} ${requestPath}`);

      if (info) {
        this.logger.warn(`Auth info: ${JSON.stringify(info)}`);
      }

      throw new UnauthorizedException('Authentication required');
    }

    return user;
  }
}
