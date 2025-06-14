import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TaxConfigurationService } from './services/tax-configuration.service';
import { TaxCalculationService } from './services/tax-calculation.service';
import { TaxConfigurationController, TaxCalculationController } from './controllers/tax-configuration.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TaxConfigurationController, TaxCalculationController],
  providers: [TaxConfigurationService, TaxCalculationService],
  exports: [TaxConfigurationService, TaxCalculationService],
})
export class TaxModule {}
