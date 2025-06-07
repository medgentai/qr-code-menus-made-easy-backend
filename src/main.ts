import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from '@fastify/helmet';
import { AppLoggerService } from './common/services/logger.service';
import { PrismaService } from './prisma/prisma.service';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';

async function bootstrap() {
  // Create custom logger
  const logger = new AppLoggerService();
  logger.setContext('Bootstrap');

  let app: NestFastifyApplication | null = null;

  try {
    // Use Fastify instead of Express with custom logger
    app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({
        logger: {
          level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
          transport: process.env.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: {
                  translateTime: 'HH:MM:ss Z',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
        },
        // Add request timeout to prevent hanging requests
        requestTimeout: 60000, // 60 seconds
        // Add keep-alive timeout
        keepAliveTimeout: 5000, // 5 seconds
      })
    );

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS with specific options - more permissive for development
  if (process.env.NODE_ENV === 'production') {
    // In production, be more strict with CORS
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'https://yourdomain.com',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    });
  } else {
    // In development, allow all origins
    app.enableCors({
      origin: true, // Allow all origins in development
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    });
  }

  // Register Helmet for security headers
  if (process.env.NODE_ENV === 'production') {
    // In production, use stricter CSP
    await app.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`, 'cdn.jsdelivr.net', 'fonts.googleapis.com'],
          fontSrc: [`'self'`, 'fonts.gstatic.com'],
          imgSrc: [`'self'`, 'data:', 'cdn.jsdelivr.net'],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`, 'cdn.jsdelivr.net'],
        },
      },
    });
  } else {
    // In development, disable CSP
    await app.register(helmet, {
      contentSecurityPolicy: false,
    });
  }

  // Register cookie plugin
  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || process.env.JWT_SECRET, // Use JWT secret as fallback
    hook: 'onRequest', // Parse cookies on every request
    parseOptions: {
      // Cookie parsing options
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    }
  });

  // Register multipart plugin for file uploads
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });

  // Rate limiting removed as it's not necessary for this SaaS platform
  // This simplifies the application and improves user experience

  // Set global API prefix with exclusions for root path
  app.setGlobalPrefix('api/v1', {
    exclude: ['/'],
  });

  // Global interceptors are now registered in the CommonModule

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Slink Up API')
    .setDescription('The Slink Up API documentation')
    .setVersion('1.0')
    .addServer(process.env.NODE_ENV === 'production' ? 'https://api.slinkup.com' : 'http://localhost:3000')
    .addTag('app', 'Application endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('auth', 'Authentication endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    operationIdFactory: (
      _controllerKey: string,
      methodKey: string,
    ) => methodKey,
  });
  const customOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Slink Up API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  };

  SwaggerModule.setup('api/docs', app, document, customOptions);

  // Get the Prisma service for graceful shutdown
  const prismaService = app.get(PrismaService);

  // Enable graceful shutdown
  prismaService.enableShutdownHooks(app);

  // Handle shutdown signals
  const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.log(`Received ${signal} signal. Starting graceful shutdown...`);

      try {
        if (app) {
          await app.close();
          logger.log('Application closed successfully');
        }

        logger.log('Graceful shutdown completed');
        process.exit(0);
      } catch (err) {
        logger.error('Error during graceful shutdown', err);
        process.exit(1);
      }
    });
  }

  // Start the server
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  const appUrl = await app.getUrl();
  logger.log(`Application is running on: ${appUrl}`);
  logger.log(`Swagger documentation is available at: ${appUrl}/api/docs`);
  } catch (error) {
    logger.error('Error starting application', error.stack || error.message || error);

    // Try to close the app if it was created
    if (app) {
      try {
        await app.close();
        logger.log('Application closed after startup error');
      } catch (closeError) {
        logger.error('Error closing application', closeError);
      }
    }

    process.exit(1);
  }
}

// Add unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  // Handle unhandled rejections silently
  // Application continues running
});

// Add uncaught exception handler
process.on('uncaughtException', (error) => {
  // Handle uncaught exceptions silently
  // For uncaught exceptions, we exit the process
  process.exit(1);
});

bootstrap();
