import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { VenuesModule } from './venues/venues.module';
import { MenusModule } from './menus/menus.module';
import { QrCodesModule } from './qr-codes/qr-codes.module';
import { OrdersModule } from './orders/orders.module';
import { PublicModule } from './public/public.module';
import { PaymentsModule } from './payments/payments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UploadsModule } from './uploads/uploads.module';
import { AnalyticsModule } from './analytics/analytics.module';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    // Configure environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: null, // We'll add Joi validation later
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
      // Provide default values for required environment variables
      load: [() => ({
        JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-key-change-in-production',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-jwt-refresh-secret-key-change-in-production',
        JWT_RESET_SECRET: process.env.JWT_RESET_SECRET || 'dev-jwt-reset-secret-key-change-in-production',
      })],
    }),
    // Register Common Module with global filters, interceptors, and services
    CommonModule,
    // Register Prisma Module
    PrismaModule,
    // Feature modules
    UsersModule,
    AuthModule,
    OrganizationsModule,
    VenuesModule,
    MenusModule,
    QrCodesModule,
    OrdersModule,
    PublicModule,
    PaymentsModule,
    SubscriptionsModule,
    UploadsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global JWT authentication guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global roles guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
