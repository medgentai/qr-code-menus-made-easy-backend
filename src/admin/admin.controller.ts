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
}
