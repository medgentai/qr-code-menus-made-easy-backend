import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { AppLoggerService } from './services/logger.service';
import { CookieService } from './services/cookie.service';

/**
 * Global module for common services, filters, and interceptors
 * that are used throughout the application.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    // Register global exception filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Register global response transformation interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Register logger service
    AppLoggerService,
    // Register cookie service
    CookieService,
  ],
  exports: [
    AppLoggerService,
    CookieService,
  ],
})
export class CommonModule {}
