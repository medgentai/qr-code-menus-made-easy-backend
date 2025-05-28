import { Injectable, Logger } from '@nestjs/common';
import { PaymentsService } from '../payments.service';
import { RazorpayWebhookEvent } from '../entities';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  async handleWebhook(body: string, signature: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verify webhook signature
      const isValid = this.paymentsService.verifyWebhookSignature(body, signature);
      
      if (!isValid) {
        this.logger.warn('Invalid webhook signature received');
        return { success: false, message: 'Invalid signature' };
      }

      const event: RazorpayWebhookEvent = JSON.parse(body);
      
      this.logger.log(`Processing webhook event: ${event.event}`);

      // Handle different webhook events
      switch (event.event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(event);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(event);
          break;
        case 'order.paid':
          await this.handleOrderPaid(event);
          break;
        case 'payment.authorized':
          await this.handlePaymentAuthorized(event);
          break;
        default:
          this.logger.log(`Unhandled webhook event: ${event.event}`);
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error('Webhook processing failed', error);
      return { success: false, message: 'Webhook processing failed' };
    }
  }

  private async handlePaymentCaptured(event: RazorpayWebhookEvent): Promise<void> {
    const payment = event.payload.payment?.entity;
    if (!payment) {
      this.logger.warn('Payment entity not found in webhook payload');
      return;
    }

    this.logger.log(`Payment captured: ${payment.id} for amount ${payment.amount}`);
    
    // TODO: Update your database with payment success
    // Example: Update subscription status, activate venue, etc.
    // await this.subscriptionService.activateSubscription(payment.order_id);
  }

  private async handlePaymentFailed(event: RazorpayWebhookEvent): Promise<void> {
    const payment = event.payload.payment?.entity;
    if (!payment) {
      this.logger.warn('Payment entity not found in webhook payload');
      return;
    }

    this.logger.log(`Payment failed: ${payment.id} - ${payment.error_description}`);
    
    // TODO: Handle payment failure
    // Example: Send notification, update order status, etc.
  }

  private async handleOrderPaid(event: RazorpayWebhookEvent): Promise<void> {
    const order = event.payload.order?.entity;
    if (!order) {
      this.logger.warn('Order entity not found in webhook payload');
      return;
    }

    this.logger.log(`Order paid: ${order.id} for amount ${order.amount}`);
    
    // TODO: Handle order completion
    // Example: Fulfill order, send confirmation, etc.
  }

  private async handlePaymentAuthorized(event: RazorpayWebhookEvent): Promise<void> {
    const payment = event.payload.payment?.entity;
    if (!payment) {
      this.logger.warn('Payment entity not found in webhook payload');
      return;
    }

    this.logger.log(`Payment authorized: ${payment.id} for amount ${payment.amount}`);
    
    // TODO: Handle payment authorization
    // Example: Auto-capture payment, update status, etc.
  }
}
