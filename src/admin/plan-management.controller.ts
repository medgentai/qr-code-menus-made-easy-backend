import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { PlanManagementService } from './plan-management.service';
import {
  CreatePlanDto,
  UpdatePlanDto,
  GetPlansDto,
  GetPlanOrganizationsDto,
} from './dto/plan-management.dto';
import {
  PlanEntity,
  PlanListResponse,
  PlanStatsEntity,
  PlanUsageEntity,
  PlanOrganizationsResponse,
} from './entities/plan-management.entity';

@ApiTags('admin-plan-management')
@Controller('admin/plan-management')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class PlanManagementController {
  constructor(private readonly planManagementService: PlanManagementService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get plan statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan statistics retrieved successfully',
    type: PlanStatsEntity,
  })
  getPlanStats() {
    return this.planManagementService.getPlanStats();
  }

  @Get()
  @ApiOperation({ summary: 'Get all plans with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plans retrieved successfully',
    type: PlanListResponse,
  })
  getPlans(@Query() query: GetPlansDto) {
    return this.planManagementService.getPlans(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan retrieved successfully',
    type: PlanEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Plan not found',
  })
  getPlanById(@Param('id') id: string) {
    return this.planManagementService.getPlanById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new plan' })
  @ApiBody({ type: CreatePlanDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Plan created successfully',
    type: PlanEntity,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Plan with this name already exists for this organization type',
  })
  createPlan(@Body() createDto: CreatePlanDto) {
    return this.planManagementService.createPlan(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiBody({ type: UpdatePlanDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan updated successfully',
    type: PlanEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Plan not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Plan with this name already exists for this organization type',
  })
  updatePlan(@Param('id') id: string, @Body() updateDto: UpdatePlanDto) {
    return this.planManagementService.updatePlan(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Plan not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete plan with active organizations or subscriptions',
  })
  deletePlan(@Param('id') id: string) {
    return this.planManagementService.deletePlan(id);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle plan active status' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan status toggled successfully',
    type: PlanEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Plan not found',
  })
  togglePlanStatus(@Param('id') id: string) {
    return this.planManagementService.togglePlanStatus(id);
  }



  // Plan Analytics Endpoints
  @Get(':id/usage')
  @ApiOperation({ summary: 'Get plan usage analytics' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan usage retrieved successfully',
    type: PlanUsageEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Plan not found',
  })
  getPlanUsage(@Param('id') id: string) {
    return this.planManagementService.getPlanUsage(id);
  }

  @Get(':id/organizations')
  @ApiOperation({ summary: 'Get organizations using a specific plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan organizations retrieved successfully',
    type: PlanOrganizationsResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Plan not found',
  })
  getPlanOrganizations(
    @Param('id') id: string,
    @Query() query: GetPlanOrganizationsDto,
  ) {
    return this.planManagementService.getPlanOrganizations(id, query);
  }
}
