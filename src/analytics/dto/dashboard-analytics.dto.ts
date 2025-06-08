import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetAnalyticsQueryDto {
  @ApiProperty({
    description: 'Organization ID',
    required: false
  })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiProperty({
    description: 'Venue ID',
    required: false
  })
  @IsOptional()
  @IsString()
  venueId?: string;

  @ApiProperty({
    description: 'Number of days to include in analytics',
    required: false,
    default: 1,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  days?: number = 1;
}

export class QrAnalyticsDto {
  @ApiProperty({ description: 'Weekly scan data', type: [Number] })
  weeklyScans: number[];

  @ApiProperty({ description: 'Total scans' })
  totalScans: number;

  @ApiProperty({ description: 'Unique scans' })
  uniqueScans: number;
}

export class RecentOrderDto {
  @ApiProperty({ description: 'Order ID' })
  id: string;

  @ApiProperty({ description: 'Customer name' })
  customer: string;

  @ApiProperty({ description: 'Number of items' })
  items: number;

  @ApiProperty({ description: 'Total amount' })
  total: number;

  @ApiProperty({ description: 'Order time' })
  time: string;

  @ApiProperty({ description: 'Order status' })
  status: string;
}

export class TopMenuItemDto {
  @ApiProperty({ description: 'Menu item name' })
  name: string;

  @ApiProperty({ description: 'Number of orders' })
  orders: number;

  @ApiProperty({ description: 'Revenue generated' })
  revenue: number;
}

export class CustomerStatsDto {
  @ApiProperty({ description: 'New customers' })
  new: number;

  @ApiProperty({ description: 'Returning customers' })
  returning: number;

  @ApiProperty({ description: 'Total customers today' })
  totalToday: number;

  @ApiProperty({ description: 'Average spend per customer' })
  averageSpend: number;
}

export class RevenueStatsDto {
  @ApiProperty({ description: 'Today\'s revenue' })
  today: number;

  @ApiProperty({ description: 'Yesterday\'s revenue' })
  yesterday: number;

  @ApiProperty({ description: 'This week\'s revenue' })
  thisWeek: number;

  @ApiProperty({ description: 'Last week\'s revenue' })
  lastWeek: number;

  @ApiProperty({ description: 'Growth percentage' })
  growth: number;
}

export class PeakHourDataDto {
  @ApiProperty({ description: 'Hour of the day' })
  hour: string;

  @ApiProperty({ description: 'Number of orders' })
  orders: number;
}

export class DashboardAnalyticsDto {
  @ApiProperty({ description: 'QR code analytics', type: QrAnalyticsDto })
  qrAnalytics: QrAnalyticsDto;

  @ApiProperty({ description: 'Recent orders', type: [RecentOrderDto] })
  recentOrders: RecentOrderDto[];

  @ApiProperty({ description: 'Top menu items', type: [TopMenuItemDto] })
  topItems: TopMenuItemDto[];

  @ApiProperty({ description: 'Customer statistics', type: CustomerStatsDto })
  customerStats: CustomerStatsDto;

  @ApiProperty({ description: 'Revenue statistics', type: RevenueStatsDto })
  revenue: RevenueStatsDto;

  @ApiProperty({ description: 'Peak hours data', type: [PeakHourDataDto] })
  peakHours: PeakHourDataDto[];

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: string;
}
