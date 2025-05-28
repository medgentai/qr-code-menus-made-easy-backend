import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { BillingCycle } from '@prisma/client';

export class UpdateBillingCycleDto {
  @ApiProperty({
    description: 'New billing cycle',
    enum: BillingCycle,
    example: BillingCycle.ANNUAL,
  })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;
}

export class CancelSubscriptionDto {
  // Removed cancelAtPeriodEnd option - subscriptions are always cancelled at period end
}
