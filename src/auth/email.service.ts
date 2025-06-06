import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(resendApiKey);
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@scanserve.com');
  }

  /**
   * Send an OTP code to the user's email
   */
  async sendOtpEmail(email: string, otp: string, name: string): Promise<boolean> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Your ScanServe Verification Code',
        html: this.getOtpEmailTemplate(otp, name),
      });

      if (error) {
        this.logger.error(`Failed to send OTP email: ${error.message}`);
        return false;
      }

      this.logger.log(`OTP email sent to ${email} with ID: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending OTP email: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Send a welcome email to a new user
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Welcome to ScanServe!',
        html: this.getWelcomeEmailTemplate(name),
      });

      if (error) {
        this.logger.error(`Failed to send welcome email: ${error.message}`);
        return false;
      }

      this.logger.log(`Welcome email sent to ${email} with ID: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending welcome email: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string, name: string): Promise<boolean> {
    try {
      const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'https://scanserve.com')}/reset-password?token=${resetToken}`;

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Reset Your ScanServe Password',
        html: this.getPasswordResetEmailTemplate(resetUrl, name),
      });

      if (error) {
        this.logger.error(`Failed to send password reset email: ${error.message}`);
        return false;
      }

      this.logger.log(`Password reset email sent to ${email} with ID: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending password reset email: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Send an organization invitation email
   */
  async sendInvitationEmail(email: string, inviterName: string, organizationName: string, token: string): Promise<boolean> {
    try {
      const invitationUrl = `${this.configService.get<string>('FRONTEND_URL', 'https://scanserve.com')}/invitation?token=${token}`;

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `You're invited to join ${organizationName} on ScanServe`,
        html: this.getInvitationEmailTemplate(inviterName, organizationName, invitationUrl),
      });

      if (error) {
        this.logger.error(`Failed to send invitation email: ${error.message}`);
        return false;
      }

      this.logger.log(`Invitation email sent to ${email} with ID: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending invitation email: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * OTP email template
   */
  private getOtpEmailTemplate(otp: string, name: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #f97316;">ScanServe</h1>
        </div>
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin-top: 0;">Your Verification Code</h2>
          <p style="color: #334155; margin-bottom: 20px;">Hi ${name},</p>
          <p style="color: #334155; margin-bottom: 20px;">Your verification code for ScanServe is:</p>
          <div style="background-color: #e2e8f0; padding: 15px; border-radius: 4px; text-align: center; margin-bottom: 20px;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${otp}</span>
          </div>
          <p style="color: #334155; margin-bottom: 20px;">This code will expire in 10 minutes.</p>
          <p style="color: #334155; margin-bottom: 0;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
        <div style="text-align: center; color: #64748b; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} ScanServe. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  /**
   * Welcome email template
   */
  private getWelcomeEmailTemplate(name: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #f97316;">ScanServe</h1>
        </div>
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin-top: 0;">Welcome to ScanServe!</h2>
          <p style="color: #334155; margin-bottom: 20px;">Hi ${name},</p>
          <p style="color: #334155; margin-bottom: 20px;">Thank you for joining ScanServe! We're excited to have you on board.</p>
          <p style="color: #334155; margin-bottom: 20px;">With ScanServe, you can create digital menus, generate QR codes, and manage orders for your business.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.configService.get<string>('FRONTEND_URL', 'https://scanserve.com')}/dashboard" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Go to Dashboard</a>
          </div>
          <p style="color: #334155; margin-bottom: 0;">If you have any questions, feel free to contact our support team.</p>
        </div>
        <div style="text-align: center; color: #64748b; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} ScanServe. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  /**
   * Password reset email template
   */
  private getPasswordResetEmailTemplate(resetUrl: string, name: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #f97316;">ScanServe</h1>
        </div>
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin-top: 0;">Reset Your Password</h2>
          <p style="color: #334155; margin-bottom: 20px;">Hi ${name},</p>
          <p style="color: #334155; margin-bottom: 20px;">We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #334155; margin-bottom: 20px;">This link will expire in 1 hour.</p>
          <p style="color: #334155; margin-bottom: 0;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
        <div style="text-align: center; color: #64748b; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} ScanServe. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  /**
   * Organization invitation email template
   */
  private getInvitationEmailTemplate(inviterName: string, organizationName: string, invitationUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #f97316;">ScanServe</h1>
        </div>
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin-top: 0;">You're Invited!</h2>
          <p style="color: #334155; margin-bottom: 20px;">Hi there,</p>
          <p style="color: #334155; margin-bottom: 20px;"><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on ScanServe.</p>
          <p style="color: #334155; margin-bottom: 20px;">ScanServe helps restaurants and hospitality businesses create digital menus, manage orders, and provide seamless customer experiences through QR code technology.</p>
          <p style="color: #334155; margin-bottom: 20px;">Click the button below to accept the invitation and join the team:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
          </div>
          <p style="color: #334155; margin-bottom: 20px;">If you don't have a ScanServe account yet, you'll be able to create one during the invitation process.</p>
          <p style="color: #334155; margin-bottom: 0;">This invitation will expire in 7 days.</p>
        </div>
        <div style="text-align: center; color: #64748b; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} ScanServe. All rights reserved.</p>
        </div>
      </div>
    `;
  }
}
