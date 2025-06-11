import { ApiProperty } from '@nestjs/swagger';
import { OrganizationType } from '@prisma/client';

export class PlanEntity {
  @ApiProperty({ description: 'Plan ID' })
  id: string;

  @ApiProperty({ description: 'Plan name' })
  name: string;

  @ApiProperty({ description: 'Plan description', required: false })
  description?: string;

  @ApiProperty({ description: 'Organization type', enum: OrganizationType })
  organizationType: OrganizationType;

  @ApiProperty({ description: 'Monthly price in cents' })
  monthlyPrice: number;

  @ApiProperty({ description: 'Annual price in cents' })
  annualPrice: number;

  @ApiProperty({ description: 'Plan features', type: [String] })
  features: string[];

  @ApiProperty({ description: 'Number of venues included' })
  venuesIncluded: number;

  @ApiProperty({ description: 'Whether plan is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Number of organizations using this plan', required: false })
  organizationCount?: number;

  @ApiProperty({ description: 'Number of active subscriptions', required: false })
  subscriptionCount?: number;
}

export class PlanListResponse {
  @ApiProperty({ description: 'List of plans', type: [PlanEntity] })
  plans: PlanEntity[];

  @ApiProperty({ description: 'Total number of plans' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

export class PlanStatsEntity {
  @ApiProperty({ description: 'Total number of plans' })
  totalPlans: number;

  @ApiProperty({ description: 'Number of active plans' })
  activePlans: number;

  @ApiProperty({ description: 'Total organizations with plans' })
  totalOrganizations: number;

  @ApiProperty({ description: 'Total active subscriptions' })
  totalSubscriptions: number;

  @ApiProperty({ description: 'Monthly revenue in cents' })
  monthlyRevenue: number;

  @ApiProperty({ description: 'Annual revenue in cents' })
  annualRevenue: number;

  @ApiProperty({ description: 'Plans breakdown by type' })
  plansByType: any;
}



export class PlanUsageEntity {
  @ApiProperty({ description: 'Plan information' })
  plan: {
    id: string;
    name: string;
    organizationType: OrganizationType;
  };

  @ApiProperty({ description: 'Usage statistics' })
  usage: {
    totalOrganizations: number;
    activeOrganizations: number;
    totalSubscriptions: number;
    monthlySubscriptions: number;
    annualSubscriptions: number;
  };

  @ApiProperty({ description: 'Revenue statistics' })
  revenue: {
    monthlyRevenue: number;
    annualRevenue: number;
    totalRevenue: number;
  };
}

export class PlanOrganizationEntity {
  @ApiProperty({ description: 'Organization ID' })
  id: string;

  @ApiProperty({ description: 'Organization name' })
  name: string;

  @ApiProperty({ description: 'Organization slug' })
  slug: string;

  @ApiProperty({ description: 'Organization type' })
  type: OrganizationType;

  @ApiProperty({ description: 'Plan start date', required: false })
  planStartDate?: Date;

  @ApiProperty({ description: 'Plan end date', required: false })
  planEndDate?: Date;

  @ApiProperty({ description: 'Whether organization is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Organization owner' })
  owner: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({ description: 'Venue count' })
  venueCount: number;

  @ApiProperty({ description: 'Member count' })
  memberCount: number;
}

export class PlanOrganizationsResponse {
  @ApiProperty({ description: 'List of organizations', type: [PlanOrganizationEntity] })
  organizations: PlanOrganizationEntity[];

  @ApiProperty({ description: 'Total number of organizations' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}
