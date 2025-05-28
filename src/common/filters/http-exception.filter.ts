import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';

/**
 * Global HTTP exception filter that handles all exceptions
 * and returns a standardized error response format.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    // Get request details for logging
    const requestInfo = {
      path: request.url,
      method: request.method,
      ip: request.ip,
      body: this.sanitizeRequestBody(request.body),
      query: request.query,
      params: request.params,
    };

    // Default error values
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorType = 'Internal Server Error';
    let validationErrors: string[] | null = null;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      // Handle NestJS HTTP exceptions
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'object') {
        message = errorResponse['message'] || message;
        errorType = errorResponse['error'] || errorType;

        // Extract validation errors if available
        if (Array.isArray(errorResponse['message'])) {
          validationErrors = errorResponse['message'];
          message = 'Validation failed';
        }
      } else {
        message = errorResponse as string;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle Prisma errors
      status = HttpStatus.BAD_REQUEST;

      // Map Prisma error codes to meaningful messages
      switch (exception.code) {
        case 'P2002':
          message = `Unique constraint violation on ${exception.meta?.target}`;
          break;
        case 'P2025':
          message = 'Record not found';
          status = HttpStatus.NOT_FOUND;
          break;
        case 'P2003':
          message = 'Foreign key constraint failed';
          break;
        case 'P2000':
          message = 'Input value too long';
          break;
        case 'P2001':
          message = 'Record does not exist';
          status = HttpStatus.NOT_FOUND;
          break;
        case 'P2006':
          message = 'Invalid input data';
          break;
        case 'P2010':
        case 'P2011':
          message = 'Null constraint violation';
          break;
        case 'P2012':
          message = 'Missing required field';
          break;
        case 'P2014':
          message = 'Relation violation';
          break;
        case 'P2015':
          message = 'Related record not found';
          status = HttpStatus.NOT_FOUND;
          break;
        case 'P2018':
          message = 'Required relation not found';
          status = HttpStatus.NOT_FOUND;
          break;
        case 'P2019':
          message = 'Input error';
          break;
        case 'P2024':
          message = 'Connection timeout';
          status = HttpStatus.SERVICE_UNAVAILABLE;
          break;
        default:
          message = 'Database error';
      }

      errorType = 'Database Error';
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      // Handle Prisma validation errors
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation error in database query';
      errorType = 'Validation Error';
    } else if (exception instanceof Prisma.PrismaClientRustPanicError) {
      // Handle Prisma panic errors (serious internal errors)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Critical database error';
      errorType = 'Database Error';

      // These are serious errors, so we should log them with high priority
      this.logger.fatal('Prisma client Rust panic error', exception);
    } else if (exception instanceof Prisma.PrismaClientInitializationError) {
      // Handle Prisma initialization errors
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Database connection failed';
      errorType = 'Service Unavailable';

      // These are serious errors, so we should log them with high priority
      this.logger.fatal('Prisma client initialization error', exception);
    } else if (exception instanceof Error) {
      // Handle generic errors
      message = exception.message || 'Unknown error';
    }

    // Log the error with appropriate level
    if (status >= 500) {
      // For 500 errors, log as much detail as possible
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
      );

      // Log the exception details
      if (exception instanceof Error) {
        this.logger.error(`Error: ${exception.message}`);
        this.logger.error(`Stack: ${exception.stack}`);
      } else {
        try {
          this.logger.error(`Raw exception: ${JSON.stringify(exception, null, 2)}`);
        } catch (e) {
          this.logger.error(`Non-stringifiable exception: ${typeof exception}`);
        }
      }

      // Log request details
      this.logger.error(`Request details: ${JSON.stringify(requestInfo, null, 2)}`);
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`,
      );
      this.logger.warn(`Request details: ${JSON.stringify(requestInfo, null, 2)}`);
    }

    // Build the error response
    const responseBody: Record<string, any> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
      error: errorType,
    };

    // Add validation errors if present
    if (validationErrors) {
      responseBody.errors = validationErrors;
    }

    // Add stack trace in non-production environments
    if (process.env.NODE_ENV !== 'production' && exception instanceof Error && exception.stack) {
      responseBody.stack = exception.stack.split('\n');
    }

    // Send the response
    response.status(status).send(responseBody);
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private sanitizeRequestBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'refreshToken', 'token', 'accessToken', 'secret'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
