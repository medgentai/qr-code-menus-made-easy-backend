import { ApiProperty } from '@nestjs/swagger';

export class PlatformAnalyticsEntity {
  @ApiProperty({
    description: 'Analytics period information',
    example: {
      days: 30,
      startDate: '2024-12-09T00:00:00Z',
      endDate: '2025-01-08T00:00:00Z',
    },
  })
  period: {
    days: number;
    startDate: Date;
    endDate: Date;
  };

  @ApiProperty({
    description: 'Platform overview metrics',
    example: {
      totalRevenue: 25000,
      totalOrders: 1250,
      totalUsers: 500,
      totalOrganizations: 85,
      activeUsers: 420,
      activeOrganizations: 72,
    },
  })
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    totalOrganizations: number;
    activeUsers: number;
    activeOrganizations: number;
  };

  @ApiProperty({
    description: 'Daily statistics breakdown',
    example: [
      {
        date: '2025-01-08',
        newUsers: 12,
        newOrganizations: 2,
        newOrders: 45,
      },
    ],
  })
  dailyStats: Array<{
    date: string;
    newUsers: number;
    newOrganizations: number;
    newOrders: number;
  }>;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2025-01-08T10:30:00Z',
  })
  lastUpdated: Date;
}
