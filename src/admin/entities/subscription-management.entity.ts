import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus, BillingCycle } from '@prisma/client';

export class SubscriptionManagementEntity {
  @ApiProperty({ description: 'Subscription ID' })
  id: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Plan ID' })
  planId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ enum: SubscriptionStatus, description: 'Subscription status' })
  status: SubscriptionStatus;

  @ApiProperty({ enum: BillingCycle, description: 'Billing cycle' })
  billingCycle: BillingCycle;

  @ApiProperty({ description: 'Current period start date' })
  currentPeriodStart: Date;

  @ApiProperty({ description: 'Current period end date' })
  currentPeriodEnd: Date;

  @ApiProperty({ description: 'Cancel at period end flag' })
  cancelAtPeriodEnd: boolean;

  @ApiProperty({ description: 'Canceled at date', required: false })
  canceledAt?: Date;

  @ApiProperty({ description: 'Trial start date', required: false })
  trialStart?: Date;

  @ApiProperty({ description: 'Trial end date', required: false })
  trialEnd?: Date;

  @ApiProperty({ description: 'Number of venues included' })
  venuesIncluded: number;

  @ApiProperty({ description: 'Number of venues used' })
  venuesUsed: number;

  @ApiProperty({ description: 'Subscription amount' })
  amount: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Metadata', required: false })
  metadata?: any;

  @ApiProperty({ description: 'Created at date' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Organization details' })
  organization: {
    id: string;
    name: string;
    type: string;
    owner: {
      name: string;
      email: string;
    };
  };

  @ApiProperty({ description: 'Plan details' })
  plan: {
    id: string;
    name: string;
    description: string;
    monthlyPrice: number;
    annualPrice: number;
    features: string[];
    venuesIncluded: number;
  };

  @ApiProperty({ description: 'User details' })
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export class SubscriptionListResponse {
  @ApiProperty({ type: [SubscriptionManagementEntity] })
  subscriptions: SubscriptionManagementEntity[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;
}

export class SubscriptionStatsEntity {
  @ApiProperty({ description: 'Total active subscriptions' })
  totalActive: number;

  @ApiProperty({ description: 'Total inactive subscriptions' })
  totalInactive: number;

  @ApiProperty({ description: 'Total cancelled subscriptions' })
  totalCancelled: number;

  @ApiProperty({ description: 'Total expired subscriptions' })
  totalExpired: number;

  @ApiProperty({ description: 'Total trial subscriptions' })
  totalTrial: number;

  @ApiProperty({ description: 'Total past due subscriptions' })
  totalPastDue: number;

  @ApiProperty({ description: 'Monthly recurring revenue' })
  monthlyRecurringRevenue: number;

  @ApiProperty({ description: 'Annual recurring revenue' })
  annualRecurringRevenue: number;

  @ApiProperty({ description: 'Average revenue per user' })
  averageRevenuePerUser: number;

  @ApiProperty({ description: 'Churn rate percentage' })
  churnRate: number;
}
