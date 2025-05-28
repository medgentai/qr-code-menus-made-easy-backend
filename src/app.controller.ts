import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiExcludeEndpoint() // Hide this endpoint from Swagger docs
  getRoot(@Res() res: FastifyReply) {
    // Redirect to Swagger docs - Fastify style
    return res.status(302).redirect('/api/docs');
  }

  @Get('health')
  @Public()
  @ApiExcludeEndpoint(false) // Include this endpoint in Swagger docs
  @ApiTags('app')
  @ApiOperation({ summary: 'Get API health status' })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        service: { type: 'string', example: 'slink-up-api' },
        environment: { type: 'string', example: 'development' },
      }
    }
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'slink-up-api',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
