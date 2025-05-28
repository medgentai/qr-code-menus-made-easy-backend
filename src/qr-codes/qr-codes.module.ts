import { Module } from '@nestjs/common';
import { QrCodesController } from './qr-codes.controller';
import { QrCodesService } from './qr-codes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { VenuesModule } from '../venues/venues.module';
import { MenusModule } from '../menus/menus.module';

@Module({
  imports: [PrismaModule, VenuesModule, MenusModule],
  controllers: [QrCodesController],
  providers: [QrCodesService],
  exports: [QrCodesService],
})
export class QrCodesModule {}
