import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SessionRefreshDto } from './dto/session-refresh.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { Request } from 'express';
import { FastifyReply } from 'fastify';

// Define a custom Request type with user property
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    sessionId?: string;
    [key: string]: any;
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  login(@Body() loginDto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: FastifyReply) {
    return this.authService.login(loginDto, req, res);
  }

  @Post('verify-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired OTP code',
  })
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Req() req: Request, @Res({ passthrough: true }) res: FastifyReply) {
    return this.authService.verifyOtp(verifyOtpDto, req, res);
  }

  @Post('resend-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP code' })
  @ApiBody({ type: ResendOtpDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP code resent successfully',
  })
  resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto);
  }

  @Post('refresh-token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token (Legacy method)' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token',
  })
  refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    return this.authService.refreshToken(refreshTokenDto, req, res);
  }

  @Post('refresh-session')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using session ID' })
  @ApiBody({ type: SessionRefreshDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid session',
  })
  refreshSession(
    @Body() sessionRefreshDto: SessionRefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    // Get session ID from cookie if not provided in the request body
    // This allows the endpoint to work with HttpOnly cookies
    if (!sessionRefreshDto.sessionId) {
      const cookies = req.cookies || {};
      const sessionId = cookies.sessionId;

      if (sessionId) {
        sessionRefreshDto.sessionId = sessionId;
      }
    }

    return this.authService.refreshTokenBySession(sessionRefreshDto, req, res);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent',
  })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token',
  })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout a user from current session or all sessions' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logged out successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiBody({ type: LogoutDto })
  logout(
    @Req() req: RequestWithUser,
    @Body() logoutDto: LogoutDto,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    try {
      // Handle the special case where we have a placeholder user ID
      if (req.user.id === 'logged-out-user') {
        // Clear auth cookies even if user is already logged out
        this.authService.clearAuthCookies(res);
        return {
          message: 'Logged out successfully',
        };
      }

      // Get session ID from JWT payload if available
      const sessionId = req.user.sessionId;

      // If logoutAll is true, revoke all sessions
      if (logoutDto.logoutAll) {
        const result = this.authService.logout(req.user.id, undefined, res);
        return result;
      } else {
        // Otherwise, just revoke the current session
        const result = this.authService.logout(req.user.id, sessionId, res);
        return result;
      }
    } catch (error) {
      // Always return success for logout attempts
      // Clear auth cookies even on error
      this.authService.clearAuthCookies(res);
      return {
        message: 'Logged out successfully',
      };
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  getProfile(@Req() req: RequestWithUser) {
    return req.user;
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all active sessions for the current user' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sessions retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  getSessions(@Req() req: RequestWithUser) {
    return this.authService.getUserSessions(req.user.id, req.user.sessionId);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'Session ID to revoke' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session revoked successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  revokeSession(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.authService.logout(req.user.id, id);
  }

  @Get('session-status/current')
  @Public()
  @ApiOperation({ summary: 'Check current session status from cookie' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session status retrieved successfully',
  })
  async checkCurrentSessionStatus(@Req() req: Request) {
    // Get session ID from cookie
    const cookies = req.cookies || {};
    const sessionId = cookies.sessionId;

    if (!sessionId) {
      return {
        exists: false,
        message: 'No session ID found in cookies'
      };
    }

    return this.authService.checkSessionStatus(sessionId);
  }

  @Get('session-status/:id')
  @Public()
  @ApiOperation({ summary: 'Check session status by ID' })
  @ApiParam({ name: 'id', description: 'Session ID to check' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session status retrieved successfully',
  })
  async checkSessionStatus(@Param('id') id: string) {
    return this.authService.checkSessionStatus(id);
  }

  @Post('debug-fingerprint')
  @Public()
  @ApiOperation({ summary: 'Debug endpoint to check fingerprint matching' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fingerprint check result',
  })
  async debugFingerprint(@Body() data: { sessionId: string, fingerprint: string }) {
    return this.authService.debugFingerprint(data.sessionId, data.fingerprint);
  }
}
