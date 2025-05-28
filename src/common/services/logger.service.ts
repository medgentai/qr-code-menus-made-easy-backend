import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

/**
 * Custom logger service that extends NestJS LoggerService
 * and provides enhanced logging capabilities with Winston.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
  private context?: string;
  private logger: winston.Logger;

  constructor() {
    const { combine, timestamp, printf, colorize, align } = winston.format;

    // Define log format
    const logFormat = printf((info) => {
      const { timestamp, level, message, context, ...meta } = info;
      return `${timestamp} [${level}] ${context ? `[${context}] ` : ''}${message} ${
        Object.keys(meta).length ? JSON.stringify(meta) : ''
      }`;
    });

    // Create Winston logger with console and file transports
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        align(),
        logFormat,
      ),
      transports: [
        new winston.transports.Console({
          format: combine(colorize({ all: true }), logFormat),
        }),
      ],
    });

    // Add file transports in production
    if (process.env.NODE_ENV === 'production') {
      this.logger.add(
        new winston.transports.DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: combine(timestamp(), logFormat),
        }),
      );

      this.logger.add(
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
          format: combine(timestamp(), logFormat),
        }),
      );
    }
  }

  /**
   * Set the context for the logger
   * @param context The context (usually class name)
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Log a message at the 'log' level
   */
  log(message: any, ...optionalParams: any[]): void {
    this.logger.info(this.formatMessage(message), {
      context: this.context,
      ...this.formatOptionalParams(optionalParams),
    });
  }

  /**
   * Log a message at the 'error' level
   */
  error(message: any, ...optionalParams: any[]): void {
    this.logger.error(this.formatMessage(message), {
      context: this.context,
      ...this.formatOptionalParams(optionalParams),
    });
  }

  /**
   * Log a message at the 'warn' level
   */
  warn(message: any, ...optionalParams: any[]): void {
    this.logger.warn(this.formatMessage(message), {
      context: this.context,
      ...this.formatOptionalParams(optionalParams),
    });
  }

  /**
   * Log a message at the 'debug' level
   */
  debug(message: any, ...optionalParams: any[]): void {
    this.logger.debug(this.formatMessage(message), {
      context: this.context,
      ...this.formatOptionalParams(optionalParams),
    });
  }

  /**
   * Log a message at the 'verbose' level
   */
  verbose(message: any, ...optionalParams: any[]): void {
    this.logger.verbose(this.formatMessage(message), {
      context: this.context,
      ...this.formatOptionalParams(optionalParams),
    });
  }

  /**
   * Format the message to string
   */
  private formatMessage(message: any): string {
    return typeof message === 'object' ? JSON.stringify(message) : message;
  }

  /**
   * Format optional parameters for logging
   */
  private formatOptionalParams(optionalParams: any[]): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (optionalParams.length === 0) {
      return params;
    }

    // If the first param is an Error, extract stack trace
    if (optionalParams[0] instanceof Error) {
      const error = optionalParams[0];
      params.stack = error.stack;
      params.name = error.name;
      optionalParams = optionalParams.slice(1);
    }

    // Add any remaining params as metadata
    if (optionalParams.length > 0) {
      params.metadata = optionalParams;
    }

    return params;
  }
}
