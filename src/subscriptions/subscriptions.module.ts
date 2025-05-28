import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ReceiptService } from '../payments/services/receipt.service';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, ReceiptService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
