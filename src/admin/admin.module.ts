import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PlatformAnalyticsController } from './platform-analytics.controller';
import { PlatformAnalyticsService } from './platform-analytics.service';
import { PlanManagementController } from './plan-management.controller';
import { PlanManagementService } from './plan-management.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminController, PlatformAnalyticsController, PlanManagementController],
  providers: [AdminService, PlatformAnalyticsService, PlanManagementService],
  exports: [AdminService, PlatformAnalyticsService, PlanManagementService],
})
export class AdminModule {}
