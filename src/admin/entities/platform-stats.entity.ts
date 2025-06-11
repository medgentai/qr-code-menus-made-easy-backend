import { ApiProperty } from '@nestjs/swagger';

export class PlatformStatsEntity {
  @ApiProperty({
    description: 'Total number of users on the platform',
    example: 1250,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Total number of organizations on the platform',
    example: 85,
  })
  totalOrganizations: number;

  @ApiProperty({
    description: 'Total number of venues on the platform',
    example: 142,
  })
  totalVenues: number;

  @ApiProperty({
    description: 'Total number of orders on the platform',
    example: 5420,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Number of active users',
    example: 980,
  })
  activeUsers: number;

  @ApiProperty({
    description: 'Number of active organizations',
    example: 72,
  })
  activeOrganizations: number;

  @ApiProperty({
    description: 'Number of new users in the last 30 days',
    example: 125,
  })
  recentUsers: number;

  @ApiProperty({
    description: 'Number of new organizations in the last 30 days',
    example: 8,
  })
  recentOrganizations: number;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2025-01-08T10:30:00Z',
  })
  lastUpdated: Date;
}
