import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { VenuesModule } from '../venues/venues.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { OrderEventsModule } from './events/order-events.module';
import { TaxModule } from '../tax/tax.module';

@Module({
  imports: [
    PrismaModule,
    VenuesModule,
    OrganizationsModule,
    OrderEventsModule,
    TaxModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
