import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { PlansService } from '../services/plans.service';
import { OrganizationType } from '@prisma/client';

@ApiTags('plans')
@Controller('plans')
@Public() // Make the entire controller public
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active plans' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: OrganizationType,
    description: 'Filter plans by organization type'
  })
  @ApiResponse({
    status: 200,
    description: 'Plans retrieved successfully',
  })
  async getPlans(@Query('type') type?: OrganizationType) {
    if (type) {
      return this.plansService.getPlansByOrganizationType(type);
    }
    return this.plansService.getAllPlans();
  }
}
