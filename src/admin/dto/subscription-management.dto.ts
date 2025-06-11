import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionStatus, BillingCycle } from '@prisma/client';

export class GetSubscriptionsDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search term for organization or user' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus, description: 'Filter by subscription status' })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ enum: BillingCycle, description: 'Filter by billing cycle' })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ description: 'Filter by organization type' })
  @IsOptional()
  @IsString()
  organizationType?: string;
}

export class UpdateSubscriptionStatusDto {
  @ApiProperty({ enum: SubscriptionStatus, description: 'New subscription status' })
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class PauseSubscriptionDto {
  @ApiPropertyOptional({ description: 'Reason for pausing subscription' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Resume date (if not provided, manual resume required)' })
  @IsOptional()
  @Type(() => Date)
  resumeDate?: Date;
}

export class CancelSubscriptionDto {
  @ApiProperty({ description: 'Cancel immediately or at period end', default: false })
  @IsBoolean()
  immediate: boolean = false;

  @ApiPropertyOptional({ description: 'Reason for cancellation' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Offer refund for remaining period', default: false })
  @IsOptional()
  @IsBoolean()
  offerRefund?: boolean = false;
}

export class ModifySubscriptionDto {
  @ApiPropertyOptional({ description: 'New plan ID' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ enum: BillingCycle, description: 'New billing cycle' })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ description: 'Number of venues to include' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  venuesIncluded?: number;

  @ApiPropertyOptional({ description: 'Reason for modification' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Apply changes immediately or at next billing cycle', default: false })
  @IsOptional()
  @IsBoolean()
  immediate?: boolean = false;
}

export class ProcessRefundDto {
  @ApiProperty({ description: 'Refund amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Reason for refund' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Refund type: full or partial', default: 'partial' })
  @IsOptional()
  @IsString()
  refundType?: 'full' | 'partial' = 'partial';

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SubscriptionAnalyticsDto {
  @ApiPropertyOptional({ description: 'Number of days for analytics', default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  days?: number = 30;

  @ApiPropertyOptional({ description: 'Start date for custom range' })
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date for custom range' })
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}
