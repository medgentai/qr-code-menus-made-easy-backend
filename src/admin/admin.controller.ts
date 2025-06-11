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
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { PlatformStatsEntity } from './entities/platform-stats.entity';
import { UserManagementEntity } from './entities/user-management.entity';
import { OrganizationManagementEntity } from './entities/organization-management.entity';
import { SubscriptionManagementEntity, SubscriptionListResponse, SubscriptionStatsEntity } from './entities/subscription-management.entity';
import {
  GetSubscriptionsDto,
  UpdateSubscriptionStatusDto,
  PauseSubscriptionDto,
  CancelSubscriptionDto,
  ModifySubscriptionDto
} from './dto/subscription-management.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Platform statistics retrieved successfully',
    type: PlatformStatsEntity,
  })
  getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with management info (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    type: [UserManagementEntity],
  })
  getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
  ) {
    return this.adminService.getAllUsers({
      page: page || 1,
      limit: limit || 20,
      search,
      role,
    });
  }

  @Get('organizations')
  @ApiOperation({ summary: 'Get all organizations with management info (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organizations retrieved successfully',
    type: [OrganizationManagementEntity],
  })
  getAllOrganizations(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllOrganizations({
      page: page || 1,
      limit: limit || 20,
      search,
    });
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Update user status (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User status updated successfully',
  })
  updateUserStatus(
    @Param('id') id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, updateUserStatusDto);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserRoleDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User role updated successfully',
  })
  updateUserRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(id, updateUserRoleDto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully',
  })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Delete('organizations/:id')
  @ApiOperation({ summary: 'Delete organization (Admin only)' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization deleted successfully',
  })
  deleteOrganization(@Param('id') id: string) {
    return this.adminService.deleteOrganization(id);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User details retrieved successfully',
  })
  getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Get('organizations/:id/venues')
  @ApiOperation({ summary: 'Get organization venues (Admin only)' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization venues retrieved successfully',
  })
  getOrganizationVenues(@Param('id') id: string) {
    return this.adminService.getOrganizationVenues(id);
  }

  @Get('organizations/:id/members')
  @ApiOperation({ summary: 'Get organization members (Admin only)' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization members retrieved successfully',
  })
  getOrganizationMembers(@Param('id') id: string) {
    return this.adminService.getOrganizationMembers(id);
  }

  @Get('system-info')
  @ApiOperation({ summary: 'Get system information (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System information retrieved successfully',
  })
  getSystemInfo() {
    return this.adminService.getSystemInfo();
  }

  // Subscription Management Endpoints
  @Get('subscriptions')
  @ApiOperation({ summary: 'Get all subscriptions with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscriptions retrieved successfully',
    type: SubscriptionListResponse,
  })
  getAllSubscriptions(@Query() query: GetSubscriptionsDto) {
    return this.adminService.getAllSubscriptions(query);
  }

  @Get('subscriptions/stats')
  @ApiOperation({ summary: 'Get subscription statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription statistics retrieved successfully',
    type: SubscriptionStatsEntity,
  })
  getSubscriptionStats() {
    return this.adminService.getSubscriptionStats();
  }

  @Get('subscriptions/:id')
  @ApiOperation({ summary: 'Get subscription details by ID' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription details retrieved successfully',
    type: SubscriptionManagementEntity,
  })
  getSubscriptionById(@Param('id') id: string) {
    return this.adminService.getSubscriptionById(id);
  }

  @Patch('subscriptions/:id/status')
  @ApiOperation({ summary: 'Update subscription status' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription status updated successfully',
    type: SubscriptionManagementEntity,
  })
  updateSubscriptionStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubscriptionStatusDto,
  ) {
    return this.adminService.updateSubscriptionStatus(id, updateDto.status, updateDto.reason);
  }

  @Post('subscriptions/:id/pause')
  @ApiOperation({ summary: 'Pause a subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription paused successfully',
    type: SubscriptionManagementEntity,
  })
  pauseSubscription(
    @Param('id') id: string,
    @Body() pauseDto: PauseSubscriptionDto,
  ) {
    return this.adminService.pauseSubscription(id, pauseDto.reason, pauseDto.resumeDate);
  }

  @Post('subscriptions/:id/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription cancelled successfully',
    type: SubscriptionManagementEntity,
  })
  cancelSubscription(
    @Param('id') id: string,
    @Body() cancelDto: CancelSubscriptionDto,
  ) {
    return this.adminService.cancelSubscription(
      id,
      cancelDto.immediate,
      cancelDto.reason,
      cancelDto.offerRefund
    );
  }

  @Patch('subscriptions/:id/modify')
  @ApiOperation({ summary: 'Modify a subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription modified successfully',
    type: SubscriptionManagementEntity,
  })
  modifySubscription(
    @Param('id') id: string,
    @Body() modifyDto: ModifySubscriptionDto,
  ) {
    return this.adminService.modifySubscription(id, modifyDto);
  }
}
