import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const Razorpay = require('razorpay');

@Injectable()
export class RazorpayConfig {
  private razorpayInstance: any;

  constructor(private configService: ConfigService) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials are not configured properly');
    }

    try {
      this.razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    } catch (error) {
      throw error;
    }
  }

  getInstance(): any {
    return this.razorpayInstance;
  }

  getKeyId(): string {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    if (!keyId) {
      throw new Error('RAZORPAY_KEY_ID is not configured');
    }
    return keyId;
  }

  getKeySecret(): string {
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      throw new Error('RAZORPAY_KEY_SECRET is not configured');
    }
    return keySecret;
  }

  getWebhookSecret(): string {
    const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured');
    }
    return webhookSecret;
  }
}
