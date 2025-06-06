import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpStatus
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { InvitationsService } from './invitations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationEntity } from './entities/organization.entity';
import { OrganizationMemberEntity } from './entities/organization-member.entity';
import { OrganizationInvitationEntity } from './entities/organization-invitation.entity';
import { OrganizationDetailsDto } from './dto/organization-details.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    [key: string]: any;
  };
}

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly invitationsService: InvitationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The organization has been successfully created.',
    type: OrganizationEntity
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request.'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Organization with this slug already exists.'
  })
  create(@Body() createOrganizationDto: CreateOrganizationDto, @Req() req: RequestWithUser) {
    return this.organizationsService.create(createOrganizationDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations for the current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all organizations for the current user.',
    type: [OrganizationEntity]
  })
  findAll(@Req() req: RequestWithUser) {
    return this.organizationsService.findAllForUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an organization by ID' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the organization.',
    type: OrganizationEntity
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found.'
  })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get an organization by slug' })
  @ApiParam({ name: 'slug', description: 'Organization slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the organization.',
    type: OrganizationEntity
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found.'
  })
  findBySlug(@Param('slug') slug: string) {
    return this.organizationsService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The organization has been successfully updated.',
    type: OrganizationEntity
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request.'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found.'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Organization with this slug already exists.'
  })
  update(@Param('id') id: string, @Body() updateOrganizationDto: UpdateOrganizationDto) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The organization has been successfully deleted.',
    type: OrganizationEntity
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found.'
  })
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get all members of an organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all members of the organization.',
    type: [OrganizationMemberEntity]
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You are not a member of this organization.'
  })
  getMembers(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.organizationsService.getMembers(id, req.user.id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to an organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The member has been successfully added.',
    type: OrganizationMemberEntity
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request.'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization or user not found.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You do not have permission to add members to this organization.'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User is already a member of this organization.'
  })
  addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
    @Req() req: RequestWithUser
  ) {
    return this.organizationsService.addMember(id, addMemberDto, req.user.id);
  }

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: 'Update a member\'s role in an organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The member\'s role has been successfully updated.',
    type: OrganizationMemberEntity
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request.'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization or member not found.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You do not have permission to update member roles in this organization.'
  })
  updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
    @Req() req: RequestWithUser
  ) {
    return this.organizationsService.updateMemberRole(id, memberId, updateMemberRoleDto, req.user.id);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from an organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The member has been successfully removed.'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization or member not found.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You do not have permission to remove members from this organization.'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot remove yourself from the organization. Use the leave organization endpoint instead.'
  })
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Req() req: RequestWithUser
  ) {
    return this.organizationsService.removeMember(id, memberId, req.user.id);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Leave an organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'You have successfully left the organization.'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found or you are not a member.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Organization owners cannot leave. Transfer ownership first or delete the organization.'
  })
  leaveOrganization(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.organizationsService.leaveOrganization(id, req.user.id);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get comprehensive organization details' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return detailed organization information.',
    type: OrganizationDetailsDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You are not a member of this organization.'
  })
  getOrganizationDetails(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.organizationsService.getOrganizationDetails(id, req.user.id);
  }

  // Invitation endpoints
  @Post(':id/invitations')
  @ApiOperation({ summary: 'Send an invitation to join an organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The invitation has been successfully sent.',
    type: OrganizationInvitationEntity
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request.'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You do not have permission to invite members to this organization.'
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User is already a member or has a pending invitation.'
  })
  sendInvitation(
    @Param('id') id: string,
    @Body() createInvitationDto: CreateInvitationDto,
    @Req() req: RequestWithUser
  ) {
    return this.invitationsService.createInvitation(id, createInvitationDto, req.user.id);
  }

  @Get(':id/invitations')
  @ApiOperation({ summary: 'Get all invitations for an organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all invitations for the organization.',
    type: [OrganizationInvitationEntity]
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You do not have permission to view invitations for this organization.'
  })
  getInvitations(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.invitationsService.getInvitations(id, req.user.id);
  }

  @Delete(':id/invitations/:invitationId')
  @ApiOperation({ summary: 'Cancel an invitation' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiParam({ name: 'invitationId', description: 'Invitation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The invitation has been successfully cancelled.'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization or invitation not found.'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You do not have permission to cancel invitations.'
  })
  cancelInvitation(
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
    @Req() req: RequestWithUser
  ) {
    return this.invitationsService.cancelInvitation(id, invitationId, req.user.id);
  }
}
