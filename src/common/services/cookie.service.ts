import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply } from 'fastify';

/**
 * Service for managing cookies
 *
 * Security features:
 * - HttpOnly cookies for sensitive data (refresh tokens and session IDs)
 * - Secure flag for HTTPS-only transmission in production
 * - SameSite=strict to prevent CSRF attacks
 * - Domain restriction in production environments
 * - Configurable expiration times
 */
@Injectable()
export class CookieService {
  private readonly logger = new Logger(CookieService.name);
  private readonly isProduction: boolean;
  private readonly domain: string;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = configService.get<string>('NODE_ENV') === 'production';
    this.domain = configService.get<string>('COOKIE_DOMAIN', '');
  }

  /**
   * Set a secure HttpOnly cookie
   *
   * Security features:
   * - httpOnly: Prevents JavaScript access to the cookie
   * - secure: Ensures cookies are only sent over HTTPS
   * - sameSite: Protects against CSRF attacks
   */
  setSecureCookie(
    res: FastifyReply,
    name: string,
    value: string,
    options: {
      maxAge?: number;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
      path?: string;
    } = {} as any,
  ): void {
    // Determine if we should use the Secure flag
    // In production: Always use Secure=true
    // In development: Use Secure=false to allow testing on localhost without HTTPS
    const useSecureFlag = this.isProduction;

    const defaultOptions = {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days by default
      httpOnly: true,
      secure: useSecureFlag,
      sameSite: this.isProduction ? 'strict' as const : 'lax' as const,
      path: '/',
    };

    const cookieOptions = { ...defaultOptions, ...options };

    // Add domain only in production
    if (this.isProduction && this.domain) {
      cookieOptions['domain'] = this.domain;
    }

    this.logger.debug(
      `Setting cookie ${name} with options: ${JSON.stringify(cookieOptions)}`,
    );

    // Set cookie using Fastify's reply object
    // @ts-ignore - Fastify's type definitions might not be complete
    if (typeof res.setCookie === 'function') {
      // Use setCookie if available
      res.setCookie(name, value, cookieOptions);
    } else {
      // Fallback to standard cookie method
      res.cookie(name, value, cookieOptions);
    }
  }

  /**
   * Set a refresh token cookie
   *
   * Security features:
   * - HttpOnly: Prevents JavaScript access to the cookie
   * - Secure: Ensures cookies are only sent over HTTPS in production
   * - SameSite=strict: Prevents CSRF attacks
   * - Path=/api/v1/auth: Restricts cookie to auth endpoints only
   * - 30-day expiration by default, configurable via maxAge parameter
   */
  setRefreshTokenCookie(
    res: FastifyReply,
    refreshToken: string,
    maxAge: number = 30 * 24 * 60 * 60 * 1000, // 30 days by default
  ): void {
    this.setSecureCookie(res, 'refreshToken', refreshToken, {
      maxAge,
      httpOnly: true, // Not accessible via JavaScript
      secure: this.isProduction,
      sameSite: 'strict', // Protect against CSRF
      path: '/api/v1/auth', // Only sent to auth endpoints
    });

    this.logger.debug(`Set refresh token cookie with maxAge: ${maxAge}ms`);
  }

  /**
   * Set a session ID cookie
   *
   * The sessionId cookie is now HttpOnly for enhanced security.
   * This prevents client-side JavaScript from accessing the cookie,
   * protecting against XSS attacks.
   */
  setSessionIdCookie(
    res: FastifyReply,
    sessionId: string,
    maxAge: number = 30 * 24 * 60 * 60 * 1000, // 30 days by default
  ): void {
    this.setSecureCookie(res, 'sessionId', sessionId, {
      maxAge,
      httpOnly: true, // No longer accessible via JavaScript for security
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/',
    });

    this.logger.debug(`Set session ID cookie with maxAge: ${maxAge}ms (HttpOnly)`);
  }

  /**
   * Clear a cookie
   */
  clearCookie(res: FastifyReply, name: string, path: string = '/'): void {
    // Clear cookie using Fastify's reply object
    // @ts-ignore - Fastify's type definitions might not be complete
    if (typeof res.clearCookie === 'function') {
      // Use clearCookie if available
      res.clearCookie(name, {
        path,
        domain: this.isProduction ? this.domain : undefined,
        sameSite: this.isProduction ? 'strict' as const : 'lax' as const,
      } as any);
    } else {
      // Fallback to standard cookie method with expiration in the past
      res.cookie(name, '', {
        path,
        domain: this.isProduction ? this.domain : undefined,
        maxAge: 0,
        expires: new Date(0),
        sameSite: this.isProduction ? 'strict' as const : 'lax' as const,
      });
    }

    this.logger.debug(`Cleared cookie: ${name}`);
  }

  /**
   * Clear all auth cookies
   */
  clearAuthCookies(res: FastifyReply): void {
    this.clearCookie(res, 'refreshToken', '/api/v1/auth');
    this.clearCookie(res, 'sessionId');

    this.logger.debug('Cleared all auth cookies');
  }
}
