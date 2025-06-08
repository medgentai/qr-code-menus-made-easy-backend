import { Controller, Get, Query, Param, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { DashboardAnalyticsDto, GetAnalyticsQueryDto } from './dto/dashboard-analytics.dto';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics data' })
  @ApiQuery({ name: 'organizationId', description: 'Organization ID', required: false })
  @ApiQuery({ name: 'venueId', description: 'Venue ID', required: false })
  @ApiQuery({ name: 'days', description: 'Number of days to include', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard analytics data retrieved successfully.',
    type: DashboardAnalyticsDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  async getDashboardAnalytics(@Query() queryDto: GetAnalyticsQueryDto): Promise<DashboardAnalyticsDto> {
    if (!queryDto.organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.analyticsService.getDashboardAnalytics(queryDto.organizationId, queryDto);
  }

  @Get('dashboard/:organizationId')
  @ApiOperation({ summary: 'Get dashboard analytics data for a specific organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiQuery({ name: 'venueId', description: 'Venue ID', required: false })
  @ApiQuery({ name: 'days', description: 'Number of days to include', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard analytics data retrieved successfully.',
    type: DashboardAnalyticsDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  async getDashboardAnalyticsForOrganization(
    @Param('organizationId') organizationId: string,
    @Query() queryDto: GetAnalyticsQueryDto
  ): Promise<DashboardAnalyticsDto> {
    return this.analyticsService.getDashboardAnalytics(organizationId, queryDto);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get analytics service health status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics service health status.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'analytics' },
        timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        features: {
          type: 'object',
          properties: {
            dashboardAnalytics: { type: 'string', example: 'active' },
            scheduledAggregation: { type: 'string', example: 'active' },
            manualAggregation: { type: 'string', example: 'active' }
          }
        }
      }
    }
  })
  async getHealthStatus(): Promise<{
    status: string;
    service: string;
    timestamp: string;
    features: {
      dashboardAnalytics: string;
      scheduledAggregation: string;
      manualAggregation: string;
    };
  }> {
    return {
      status: 'ok',
      service: 'analytics',
      timestamp: new Date().toISOString(),
      features: {
        dashboardAnalytics: 'active',
        scheduledAggregation: 'active',
        manualAggregation: 'active'
      }
    };
  }
}
