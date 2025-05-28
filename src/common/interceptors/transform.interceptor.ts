import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

/**
 * Standard response format for all successful API responses
 */
export interface Response<T> {
  data: T;
  statusCode: number;
  message: string;
  timestamp: string;
  path?: string;
  meta?: Record<string, any>;
}

/**
 * Global interceptor that transforms all successful responses
 * to a standardized format with data, status code, and metadata.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;
    const requestStartTime = Date.now();
    const path = request.url;
    const method = request.method;

    return next.handle().pipe(
      tap(() => {
        // Log successful requests
        const requestDuration = Date.now() - requestStartTime;
        this.logger.log(
          `${method} ${path} ${statusCode} - ${requestDuration}ms`,
        );
      }),
      map((data) => {
        // Skip transformation for binary responses (like PDF downloads)
        // Check if this is a download endpoint or if data is a Buffer
        if (data instanceof Buffer || path.includes('/download') || path.includes('/invoice/download')) {
          return data;
        }

        // Handle pagination metadata if present
        const meta = data && data.meta ? data.meta : undefined;
        const responseData = data && data.data ? data.data : data;

        // Determine appropriate success message based on method and status
        let message = 'Success';
        if (method === 'POST' && statusCode === 201) {
          message = 'Resource created successfully';
        } else if (method === 'PUT' || method === 'PATCH') {
          message = 'Resource updated successfully';
        } else if (method === 'DELETE') {
          message = 'Resource deleted successfully';
        }

        return {
          data: responseData,
          statusCode,
          message,
          timestamp: new Date().toISOString(),
          path,
          ...(meta && { meta }),
        };
      }),
    );
  }
}
