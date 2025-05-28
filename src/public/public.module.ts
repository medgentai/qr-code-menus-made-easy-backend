import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QrCodesModule } from '../qr-codes/qr-codes.module';
import { OrdersModule } from '../orders/orders.module';
import { VenuesModule } from '../venues/venues.module';

@Module({
  imports: [PrismaModule, QrCodesModule, OrdersModule, VenuesModule],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
