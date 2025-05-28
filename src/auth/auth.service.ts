import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { TokenService } from './services/token.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
// LogoutDto is used in the controller, not directly in the service
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from '@prisma/client';
import { Request } from 'express';
import { FastifyReply } from 'fastify';
import { CookieService } from '../common/services/cookie.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readonly usersService: UsersService, // Injected for future use
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly cookieService: CookieService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password
    const hashedPassword = await this.hashPassword(password);

    // Generate OTP code
    const otpCode = this.generateOtpCode();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create the user
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        otpCode,
        otpExpiresAt,
      },
    });

    // Send OTP email
    await this.emailService.sendOtpEmail(email, otpCode, name);

    return {
      message: 'User registered successfully. Please verify your email with the OTP code sent.',
      userId: user.id,
      email: user.email,
    };
  }

  /**
   * Login a user
   */
  async login(loginDto: LoginDto, req: Request, res?: FastifyReply) {
    const { email, password } = loginDto;

    // Ensure database connection is active
    await this.prisma.ensureConnection();

    try {
      // Find the user with transaction for better reliability
      const user = await this.prisma.executeTransaction(async () => {
        return this.prisma.user.findUnique({
          where: { email },
        });
      });

      if (!user) {
        this.logger.warn(`Login attempt with non-existent email: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        this.logger.warn(`Login attempt for inactive user: ${email}`);
        throw new UnauthorizedException('User account is not active');
      }

      // Verify password
      const isPasswordValid = await this.comparePasswords(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password for user: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        this.logger.log(`Login attempt for unverified email: ${email}`);

        // Generate new OTP if needed
        if (!user.otpCode || !user.otpExpiresAt || new Date() > user.otpExpiresAt) {
          const otpCode = this.generateOtpCode();
          const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

          await this.prisma.executeTransaction(async () => {
            return this.prisma.user.update({
              where: { id: user.id },
              data: { otpCode, otpExpiresAt },
            });
          });

          // Send OTP email
          await this.emailService.sendOtpEmail(email, otpCode, user.name);
        }

        return {
          message: 'Email not verified. Please verify your email with the OTP code sent.',
          requiresOtp: true,
          userId: user.id,
          email: user.email,
        };
      }

      // Generate tokens using the token service
      const tokenResponse = await this.tokenService.generateTokens(user, req);

      // Update last login time
      await this.prisma.executeTransaction(async () => {
        return this.prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
          },
        });
      });

      // Extract session ID from JWT payload
      const decodedToken = this.jwtService.decode(tokenResponse.accessToken) as JwtPayload;
      const sessionId = decodedToken?.sessionId;

      this.logger.log(`User logged in successfully: ${email}, session: ${sessionId}`);

      // Set cookies if response object is provided
      if (res) {
        // Set refresh token in HttpOnly cookie
        if (tokenResponse.refreshToken) {
          this.cookieService.setRefreshTokenCookie(
            res,
            tokenResponse.refreshToken,
            tokenResponse.sessionExpiresAt ?
              tokenResponse.sessionExpiresAt.getTime() - Date.now() :
              30 * 24 * 60 * 60 * 1000 // 30 days default
          );
        }

        // Set session ID in regular cookie (accessible to JavaScript)
        if (sessionId) {
          this.cookieService.setSessionIdCookie(
            res,
            sessionId,
            tokenResponse.sessionExpiresAt ?
              tokenResponse.sessionExpiresAt.getTime() - Date.now() :
              30 * 24 * 60 * 60 * 1000 // 30 days default
          );
        }

        this.logger.debug('Set auth cookies for user login');
      }

      return {
        message: 'Login successful',
        accessToken: tokenResponse.accessToken,
        // Only include refresh token in response if cookies are not used
        ...(res ? {} : { refreshToken: tokenResponse.refreshToken }),
        sessionId: sessionId, // Include session ID in response
        expiresAt: tokenResponse.expiresAt,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      // Log the specific error but don't expose sensitive details
      this.logger.error(`Login error for ${email}: ${error.message}`, error.stack);

      // Rethrow the original error if it's already an UnauthorizedException
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Otherwise, throw a generic error
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto, req: Request, res?: FastifyReply) {
    const { email, otpCode } = verifyOtpDto;

    this.logger.log(`OTP verification attempt for email: ${email}, OTP: ${otpCode}`);

    // Find the user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.error(`User not found for email: ${email}`);
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User found. Stored OTP: ${user.otpCode}, Expires: ${user.otpExpiresAt}`);

    // Check if OTP is valid
    if (!user.otpCode) {
      this.logger.error('No OTP code stored for user');
      throw new BadRequestException('No OTP code found. Please request a new one.');
    }

    if (user.otpCode !== otpCode) {
      this.logger.error(`OTP mismatch. Expected: ${user.otpCode}, Received: ${otpCode}`);
      throw new BadRequestException('Invalid OTP code');
    }

    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      this.logger.error(`OTP expired. Expires at: ${user.otpExpiresAt}, Current time: ${new Date()}`);
      throw new BadRequestException('OTP code has expired. Please request a new one.');
    }

    // Generate tokens with session
    const tokens = await this.tokenService.generateTokens(user, req);

    // Update user as verified
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        otpCode: null,
        otpExpiresAt: null,
        lastLoginAt: new Date(),
        refreshToken: tokens.refreshToken ? await this.hashPassword(tokens.refreshToken) : null,
      },
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(email, user.name);

    // Get session ID from token response
    const sessionId = tokens.sessionId;

    // Set cookies if response object is provided
    if (res) {
      // Set refresh token in HttpOnly cookie
      if (tokens.refreshToken) {
        this.cookieService.setRefreshTokenCookie(
          res,
          tokens.refreshToken,
          30 * 24 * 60 * 60 * 1000 // 30 days default
        );
      }

      // Set session ID in regular cookie (accessible to JavaScript)
      if (sessionId) {
        this.cookieService.setSessionIdCookie(
          res,
          sessionId,
          30 * 24 * 60 * 60 * 1000 // 30 days default
        );
      }

      this.logger.debug('Set auth cookies for email verification');
    }

    return {
      message: 'Email verified successfully',
      accessToken: tokens.accessToken,
      // Only include refresh token in response if cookies are not used
      ...(res ? {} : { refreshToken: tokens.refreshToken }),
      sessionId: sessionId,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Refresh access token using session ID
   *
   * Security features:
   * - Uses HttpOnly cookies for refresh tokens and session IDs
   * - Automatically renews refresh tokens if they're within 7 days of expiration
   * - Refresh tokens expire after 30 days of inactivity
   * - Access tokens are short-lived (typically 1 hour)
   */
  async refreshTokenBySession(sessionRefreshDto: any, req: Request, res?: FastifyReply) {
    let { sessionId, fingerprint } = sessionRefreshDto;

    // Ensure database connection is active
    await this.prisma.ensureConnection();

    try {
      // Get session ID from cookie if not provided in the request body
      if (!sessionId) {
        const cookies = req.cookies || {};
        sessionId = cookies.sessionId;

        if (sessionId) {
          this.logger.log(`Using session ID from cookie: ${sessionId}`);
        }
      }

      // Validate input
      if (!sessionId || typeof sessionId !== 'string') {
        this.logger.warn('No valid session ID found in request body or cookies');
        throw new UnauthorizedException('No valid session ID found');
      }

      // Use the token service to refresh the token by session
      const tokenResponse = await this.tokenService.refreshTokenBySession(
        sessionId,
        req,
        fingerprint
      );

      this.logger.log(`Token refreshed successfully for session: ${sessionId}`);

      // Set cookies if response object is provided
      if (res) {
        // Set refresh token in HttpOnly cookie
        if (tokenResponse.refreshToken) {
          this.cookieService.setRefreshTokenCookie(
            res,
            tokenResponse.refreshToken,
            tokenResponse.sessionExpiresAt ?
              tokenResponse.sessionExpiresAt.getTime() - Date.now() :
              30 * 24 * 60 * 60 * 1000 // 30 days default
          );
        }

        // Set session ID in regular cookie (accessible to JavaScript)
        if (tokenResponse.sessionId) {
          this.cookieService.setSessionIdCookie(
            res,
            tokenResponse.sessionId,
            tokenResponse.sessionExpiresAt ?
              tokenResponse.sessionExpiresAt.getTime() - Date.now() :
              30 * 24 * 60 * 60 * 1000 // 30 days default
          );
        }

        this.logger.debug('Set auth cookies for token refresh');
      }

      return {
        message: 'Token refreshed successfully',
        accessToken: tokenResponse.accessToken,
        // Only include refresh token in response if cookies are not used
        ...(res ? {} : { refreshToken: tokenResponse.refreshToken }),
        sessionId: tokenResponse.sessionId,
        expiresAt: tokenResponse.expiresAt,
      };
    } catch (error) {
      // Log the specific error but return a generic message
      this.logger.error(`Refresh token by session error: ${error.message}`, error.stack);

      // Rethrow the original error if it's already an UnauthorizedException
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Otherwise, throw a generic error
      throw new UnauthorizedException('Failed to refresh token');
    }
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use refreshTokenBySession instead
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto, req: Request, res?: FastifyReply) {
    const { refreshToken } = refreshTokenDto;

    // Ensure database connection is active
    await this.prisma.ensureConnection();

    try {
      // Validate input
      if (!refreshToken || typeof refreshToken !== 'string') {
        this.logger.warn('Invalid refresh token format');
        throw new UnauthorizedException('Invalid refresh token format');
      }

      // Use the token service to refresh the token
      // @ts-ignore - Ignore deprecation warning as this is a legacy method
      const tokenResponse = await this.tokenService.refreshToken(refreshToken, req);

      this.logger.log(`Token refreshed successfully`);

      // Set cookies if response object is provided
      if (res) {
        // Set refresh token in HttpOnly cookie
        if (tokenResponse.refreshToken) {
          this.cookieService.setRefreshTokenCookie(
            res,
            tokenResponse.refreshToken,
            tokenResponse.sessionExpiresAt ?
              tokenResponse.sessionExpiresAt.getTime() - Date.now() :
              30 * 24 * 60 * 60 * 1000 // 30 days default
          );
        }

        this.logger.debug('Set auth cookies for token refresh (legacy method)');
      }

      return {
        message: 'Token refreshed successfully',
        accessToken: tokenResponse.accessToken,
        // Only include refresh token in response if cookies are not used
        ...(res ? {} : { refreshToken: tokenResponse.refreshToken }),
        expiresAt: tokenResponse.expiresAt,
      };
    } catch (error) {
      // Log the specific error but return a generic message
      this.logger.error(`Refresh token error: ${error.message}`, error.stack);

      // Rethrow the original error if it's already an UnauthorizedException
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Otherwise, throw a generic error
      throw new UnauthorizedException('Failed to refresh token');
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Find the user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist
      return {
        message: 'If your email is registered, you will receive a password reset link',
      };
    }

    // Generate reset token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const resetToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_RESET_SECRET'),
      expiresIn: '1h',
    });

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(email, resetToken, user.name);

    return {
      message: 'If your email is registered, you will receive a password reset link',
    };
  }

  /**
   * Reset password
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    try {
      // Verify reset token
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_RESET_SECRET'),
      });

      // Hash the new password
      const hashedPassword = await this.hashPassword(password);

      // Update user's password
      await this.prisma.user.update({
        where: { id: decoded.sub },
        data: {
          password: hashedPassword,
          refreshToken: null, // Invalidate all sessions
        },
      });

      return {
        message: 'Password reset successfully',
      };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  /**
   * Resend OTP code
   */
  async resendOtp(resendOtpDto: ResendOtpDto) {
    const { email } = resendOtpDto;

    this.logger.log(`Resending OTP for email: ${email}`);

    // Find the user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist
      return {
        message: 'If your email is registered, you will receive a new OTP code',
      };
    }

    // Check if user is already verified
    if (user.isEmailVerified) {
      return {
        message: 'Your email is already verified. Please login.',
      };
    }

    // Generate new OTP
    const otpCode = this.generateOtpCode();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new OTP
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode,
        otpExpiresAt,
      },
    });

    // Send OTP email
    await this.emailService.sendOtpEmail(email, otpCode, user.name);

    return {
      message: 'A new OTP code has been sent to your email',
    };
  }

  /**
   * Clear authentication cookies
   */
  clearAuthCookies(res: FastifyReply): void {
    this.cookieService.clearAuthCookies(res);
    this.logger.debug('Cleared authentication cookies');
  }

  /**
   * Logout a user
   */
  async logout(userId: string, sessionId?: string, res?: FastifyReply) {
    try {
      // Check if user exists first
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        // If user doesn't exist, still return success
        // This prevents information leakage and ensures logout always "succeeds"
        if (res) {
          this.clearAuthCookies(res);
        }
        return {
          message: 'Logged out successfully',
        };
      }

      if (sessionId) {
        // Revoke specific session
        await this.tokenService.revokeSession(sessionId, userId);
      } else {
        // Revoke all sessions
        await this.tokenService.revokeAllSessions(userId);
      }

      // Clear cookies if response object is provided
      if (res) {
        this.clearAuthCookies(res);
      }

      return {
        message: 'Logged out successfully',
      };
    } catch (error) {
      // Log the error but don't expose it to the client
      this.logger.error(`Error during logout: ${error.message}`, error.stack);

      // Clear cookies even on error if response object is provided
      if (res) {
        this.clearAuthCookies(res);
      }

      // Always return success to the client
      return {
        message: 'Logged out successfully',
      };
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.tokenService.getUserSessions(userId);

    // Mark current session
    if (currentSessionId) {
      return sessions.map(session => ({
        ...session,
        isCurrent: session.id === currentSessionId,
      }));
    }

    return sessions;
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '30d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generate a random 6-digit OTP code
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Hash a password
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare a plain password with a hashed password
   */
  private async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Client IP is now handled by the token service

  /**
   * Debug endpoint to check session status
   */
  async checkSessionStatus(sessionId: string) {
    try {
      // Find the session
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      });

      if (!session) {
        return {
          exists: false,
          message: 'Session not found',
        };
      }

      // Check if session is valid
      const now = new Date();
      const isExpired = session.expiresAt < now;
      const isRevoked = session.isRevoked;

      // If the session is expired but not revoked, extend it automatically
      // This helps with testing and prevents unnecessary logouts
      if (isExpired && !isRevoked) {
        this.logger.log(`Auto-extending expired session ${session.id}`);

        // Calculate new expiration time
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 30); // 30 days from now

        // Update the session
        await this.prisma.session.update({
          where: { id: session.id },
          data: {
            expiresAt: newExpiresAt,
            lastUsed: now
          }
        });

        // Return the updated session info
        return {
          exists: true,
          isValid: true, // Now valid after extension
          isExpired: false, // No longer expired
          isRevoked: false,
          expiresAt: newExpiresAt,
          lastUsed: now,
          createdAt: session.createdAt,
          userId: session.userId,
          user: session.user,
          userAgent: session.userAgent,
          wasExtended: true // Flag to indicate extension happened
        };
      }

      return {
        exists: true,
        isValid: !isExpired && !isRevoked,
        isExpired,
        isRevoked,
        expiresAt: session.expiresAt,
        lastUsed: session.lastUsed,
        createdAt: session.createdAt,
        userId: session.userId,
        user: session.user,
        userAgent: session.userAgent,
      };
    } catch (error) {
      this.logger.error(`Error checking session status: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to check session status');
    }
  }

  /**
   * Debug endpoint to check fingerprint matching
   */
  async debugFingerprint(sessionId: string, fingerprint: string) {
    try {
      // Find the session
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return {
          exists: false,
          message: 'Session not found',
        };
      }

      // Check fingerprint match
      const sessionUserAgent = session.userAgent || '';
      const simplifiedFingerprint = fingerprint.split(' ').slice(0, 3).join(' ');

      const strictMatch = sessionUserAgent.includes(fingerprint);
      const simplifiedMatch = sessionUserAgent.includes(simplifiedFingerprint);

      return {
        exists: true,
        sessionUserAgent,
        providedFingerprint: fingerprint,
        simplifiedFingerprint,
        strictMatch,
        simplifiedMatch,
        suggestion: 'Use simplified fingerprint for better compatibility'
      };
    } catch (error) {
      this.logger.error(`Error checking fingerprint: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to check fingerprint');
    }
  }
}
