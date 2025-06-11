import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PlatformAnalyticsService } from './platform-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PlatformAnalyticsEntity } from './entities/platform-analytics.entity';

@ApiTags('admin-analytics')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class PlatformAnalyticsController {
  constructor(private readonly platformAnalyticsService: PlatformAnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get platform analytics overview (Admin only)' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Platform analytics overview retrieved successfully',
    type: PlatformAnalyticsEntity,
  })
  getPlatformAnalytics(@Query('days') days?: number) {
    return this.platformAnalyticsService.getPlatformAnalytics(days || 30);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get platform revenue analytics (Admin only)' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Platform revenue analytics retrieved successfully',
  })
  getRevenueAnalytics(@Query('days') days?: number) {
    return this.platformAnalyticsService.getRevenueAnalytics(days || 30);
  }

  @Get('growth')
  @ApiOperation({ summary: 'Get platform growth metrics (Admin only)' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Platform growth metrics retrieved successfully',
  })
  getGrowthMetrics(@Query('days') days?: number) {
    return this.platformAnalyticsService.getGrowthMetrics(days || 30);
  }

  @Get('top-organizations')
  @ApiOperation({ summary: 'Get top performing organizations (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top organizations retrieved successfully',
  })
  getTopOrganizations(@Query('limit') limit?: number) {
    return this.platformAnalyticsService.getTopOrganizations(limit || 10);
  }
}
