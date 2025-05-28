import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PlansController } from './controllers/plans.controller';
import { PaymentsService } from './payments.service';
import { WebhookService } from './webhooks/webhook.service';
import { SubscriptionService } from './services/subscription.service';
import { PlansService } from './services/plans.service';
import { RazorpayConfig } from './config/razorpay.config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [PaymentsController, PlansController],
  providers: [PaymentsService, WebhookService, SubscriptionService, PlansService, RazorpayConfig],
  exports: [PaymentsService, SubscriptionService, PlansService, RazorpayConfig],
})
export class PaymentsModule {}
