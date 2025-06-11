import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PlatformAnalyticsController } from './platform-analytics.controller';
import { PlatformAnalyticsService } from './platform-analytics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminController, PlatformAnalyticsController],
  providers: [AdminService, PlatformAnalyticsService],
  exports: [AdminService, PlatformAnalyticsService],
})
export class AdminModule {}
