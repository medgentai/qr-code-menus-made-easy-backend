import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { RazorpayConfig } from './config/razorpay.config';
import { CreatePaymentOrderDto, PaymentVerificationDto } from './dto';
import { RazorpayOrder, RazorpayPayment, PaymentResponse, PaymentStatus } from './entities';
import { PaymentMethod as PrismaPaymentMethod } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly razorpayConfig: RazorpayConfig) {}

  async createOrder(createOrderDto: CreatePaymentOrderDto): Promise<RazorpayOrder> {
    try {
      const razorpay = this.razorpayConfig.getInstance();

      const orderOptions = {
        amount: createOrderDto.amount,
        currency: createOrderDto.currency || 'INR',
        receipt: createOrderDto.receipt,
        notes: createOrderDto.notes || {},
      };

      const order = await razorpay.orders.create(orderOptions);

      this.logger.log(`Order created successfully: ${order.id}`);
      return order as RazorpayOrder;
    } catch (error) {
      this.logger.error('Failed to create Razorpay order', error);
      throw new BadRequestException('Failed to create payment order');
    }
  }

  async verifyPayment(verificationDto: PaymentVerificationDto): Promise<PaymentResponse> {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verificationDto;

      // Create signature for verification
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', this.razorpayConfig.getKeySecret())
        .update(body.toString())
        .digest('hex');

      const isAuthentic = expectedSignature === razorpay_signature;

      if (isAuthentic) {
        // Fetch payment details from Razorpay
        const razorpay = this.razorpayConfig.getInstance();
        const payment = await razorpay.payments.fetch(razorpay_payment_id) as RazorpayPayment;

        this.logger.log(`Payment verified successfully: ${razorpay_payment_id}`);

        return {
          success: true,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          amount: payment.amount,
          currency: payment.currency,
          status: this.mapRazorpayStatus(payment.status),
          paymentMethod: this.mapRazorpayPaymentMethod(payment.method),
          message: 'Payment verified successfully',
        };
      } else {
        this.logger.warn(`Payment verification failed: ${razorpay_payment_id}`);
        return {
          success: false,
          error: 'Payment verification failed',
        };
      }
    } catch (error) {
      this.logger.error('Payment verification error', error);
      throw new BadRequestException('Payment verification failed');
    }
  }

  async fetchPayment(paymentId: string): Promise<RazorpayPayment> {
    try {
      const razorpay = this.razorpayConfig.getInstance();
      const payment = await razorpay.payments.fetch(paymentId);
      return payment as RazorpayPayment;
    } catch (error) {
      this.logger.error(`Failed to fetch payment: ${paymentId}`, error);
      throw new BadRequestException('Failed to fetch payment details');
    }
  }

  async fetchOrder(orderId: string): Promise<RazorpayOrder> {
    try {
      const razorpay = this.razorpayConfig.getInstance();
      const order = await razorpay.orders.fetch(orderId);
      return order as RazorpayOrder;
    } catch (error) {
      this.logger.error(`Failed to fetch order: ${orderId}`, error);
      throw new BadRequestException('Failed to fetch order details');
    }
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.razorpayConfig.getWebhookSecret())
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      return false;
    }
  }

  private mapRazorpayStatus(razorpayStatus: string): PaymentStatus {
    switch (razorpayStatus) {
      case 'created':
        return PaymentStatus.PENDING;
      case 'authorized':
        return PaymentStatus.PROCESSING;
      case 'captured':
        return PaymentStatus.COMPLETED;
      case 'refunded':
        return PaymentStatus.REFUNDED;
      case 'failed':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  private mapRazorpayPaymentMethod(razorpayMethod: string): PrismaPaymentMethod {
    switch (razorpayMethod) {
      case 'card':
        return PrismaPaymentMethod.CREDIT_CARD;
      case 'netbanking':
        return PrismaPaymentMethod.NET_BANKING;
      case 'wallet':
        return PrismaPaymentMethod.WALLET;
      case 'upi':
        return PrismaPaymentMethod.UPI;
      case 'emi':
        return PrismaPaymentMethod.CREDIT_CARD; // EMI is typically card-based
      default:
        return PrismaPaymentMethod.CREDIT_CARD;
    }
  }
}
