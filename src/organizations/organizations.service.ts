import { Injectable, ConflictException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaxConfigurationService } from '../tax/services/tax-configuration.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { MemberRole, Organization, OrganizationMember } from '@prisma/client';
import { OrganizationDetailsDto, SubscriptionInfoDto } from './dto/organization-details.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private taxConfigurationService: TaxConfigurationService,
  ) {}

  /**
   * Create a new organization
   */
  async create(createOrganizationDto: CreateOrganizationDto, userId: string): Promise<Organization> {
    const { name, slug: providedSlug, ...rest } = createOrganizationDto;

    // Generate a slug if not provided
    const slug = providedSlug || this.generateSlug(name);

    // Check if slug already exists
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      throw new ConflictException(`Organization with slug '${slug}' already exists`);
    }

    // Create the organization
    const organization = await this.prisma.organization.create({
      data: {
        name,
        slug,
        ...rest,
        ownerId: userId,
      },
    });

    // Add the owner as a member with OWNER role
    await this.prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId,
        role: 'OWNER',
      },
    });

    // Create default tax configurations for the organization
    try {
      await this.taxConfigurationService.createDefaultTaxConfigurations(
        organization.id,
        organization.type
      );
    } catch (error) {
      // Log error but don't fail organization creation
      console.error(`Failed to create default tax configurations for organization ${organization.id}:`, error.message);
    }

    return organization;
  }

  /**
   * Find all organizations
   */
  async findAll(): Promise<Organization[]> {
    return this.prisma.organization.findMany();
  }

  /**
   * Find all organizations for a user
   */
  async findAllForUser(userId: string): Promise<Organization[]> {
    // Ensure database connection is active
    await this.prisma.ensureConnection();

    try {
      // Use transaction for better reliability
      const memberships = await this.prisma.executeTransaction(async () => {
        return this.prisma.organizationMember.findMany({
          where: { userId },
          include: { organization: true },
        });
      });

      return memberships.map(membership => membership.organization);
    } catch (error) {
      // Log the error but throw a more user-friendly message
      console.error(`Error fetching organizations for user ${userId}:`, error);
      throw new Error('Failed to fetch organizations. Please try again.');
    }
  }

  /**
   * Find one organization by ID
   */
  async findOne(id: string): Promise<Organization> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID '${id}' not found`);
    }

    return organization;
  }

  /**
   * Find one organization by slug
   */
  async findBySlug(slug: string): Promise<Organization> {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with slug '${slug}' not found`);
    }

    return organization;
  }

  /**
   * Update an organization
   */
  async update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
    // Check if organization exists
    await this.findOne(id);

    // If slug is being updated, check if the new slug is available
    if (updateOrganizationDto.slug) {
      const existingOrgWithSlug = await this.prisma.organization.findUnique({
        where: { slug: updateOrganizationDto.slug },
      });

      if (existingOrgWithSlug && existingOrgWithSlug.id !== id) {
        throw new ConflictException(`Organization with slug '${updateOrganizationDto.slug}' already exists`);
      }
    }

    return this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
    });
  }

  /**
   * Delete an organization
   */
  async remove(id: string): Promise<Organization> {
    // Check if organization exists
    await this.findOne(id);

    return this.prisma.organization.delete({
      where: { id },
    });
  }

  /**
   * Generate a slug from a name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Check if a user is a member of an organization
   */
  async isMember(organizationId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    return !!member;
  }

  /**
   * Check if a user has a specific role in an organization
   */
  async hasRole(organizationId: string, userId: string, roles: MemberRole[]): Promise<boolean> {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!member) {
      return false;
    }

    return roles.includes(member.role);
  }

  /**
   * Get all members of an organization
   */
  async getMembers(organizationId: string, currentUserId: string): Promise<OrganizationMember[]> {
    // Check if organization exists
    await this.findOne(organizationId);

    // Check if user is a member of the organization
    const isMember = await this.isMember(organizationId, currentUserId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    return this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImageUrl: true,
          },
        },
      },
    });
  }

  /**
   * Add a member to an organization (deprecated - use invitations instead)
   * This method is kept for backward compatibility but should use the invitation system
   */
  async addMember(organizationId: string, addMemberDto: AddMemberDto, currentUserId: string): Promise<OrganizationMember> {
    const { email, role = 'STAFF', staffType, venueIds = [] } = addMemberDto;

    // Check if organization exists
    await this.findOne(organizationId);

    // Check if current user is an admin or owner
    const hasPermission = await this.hasRole(organizationId, currentUserId, ['OWNER', 'ADMINISTRATOR']);
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to add members to this organization');
    }

    // Find the user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email '${email}' not found. Please send an invitation instead.`);
    }

    // Check if user is already a member
    const existingMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException(`User with email '${email}' is already a member of this organization`);
    }

    // Add the user as a member
    return this.prisma.organizationMember.create({
      data: {
        organizationId,
        userId: user.id,
        role,
        staffType: role === 'STAFF' ? staffType : null,
        venueIds: role === 'STAFF' ? venueIds : [],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImageUrl: true,
          },
        },
      },
    });
  }

  /**
   * Update a member's role in an organization
   */
  async updateMemberRole(
    organizationId: string,
    memberId: string,
    updateMemberRoleDto: UpdateMemberRoleDto,
    currentUserId: string
  ): Promise<OrganizationMember> {
    const { role, staffType, venueIds = [] } = updateMemberRoleDto;

    // Check if organization exists
    await this.findOne(organizationId);

    // Check if current user is an admin or owner
    const hasPermission = await this.hasRole(organizationId, currentUserId, ['OWNER', 'ADMINISTRATOR']);
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to update member roles in this organization');
    }

    // Find the member
    const member = await this.prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
      include: {
        user: true,
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found in this organization`);
    }

    // Check if trying to update an owner
    if (member.role === 'OWNER') {
      throw new ForbiddenException('Cannot change the role of the organization owner');
    }

    // Check if current user is trying to update their own role
    if (member.userId === currentUserId) {
      throw new ForbiddenException('Cannot update your own role');
    }

    // Update the member's role and related fields
    return this.prisma.organizationMember.update({
      where: { id: memberId },
      data: {
        role,
        staffType: role === 'STAFF' ? staffType : null,
        venueIds: role === 'STAFF' ? venueIds : [],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImageUrl: true,
          },
        },
      },
    });
  }

  /**
   * Remove a member from an organization
   */
  async removeMember(organizationId: string, memberId: string, currentUserId: string): Promise<void> {
    // Check if organization exists
    await this.findOne(organizationId);

    // Check if current user is an admin or owner
    const hasPermission = await this.hasRole(organizationId, currentUserId, ['OWNER', 'ADMINISTRATOR']);
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to remove members from this organization');
    }

    // Find the member
    const member = await this.prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found in this organization`);
    }

    // Check if trying to remove an owner
    if (member.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove the organization owner');
    }

    // Check if current user is trying to remove themselves
    if (member.userId === currentUserId) {
      throw new BadRequestException('Cannot remove yourself from the organization. Use the leave organization endpoint instead.');
    }

    // Remove the member
    await this.prisma.organizationMember.delete({
      where: { id: memberId },
    });
  }

  /**
   * Leave an organization
   */
  async leaveOrganization(organizationId: string, userId: string): Promise<void> {
    // Check if organization exists
    await this.findOne(organizationId);

    // Find the member
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this organization');
    }

    // Check if trying to leave as an owner
    if (member.role === 'OWNER') {
      throw new ForbiddenException('Organization owners cannot leave. Transfer ownership first or delete the organization.');
    }

    // Remove the member
    await this.prisma.organizationMember.delete({
      where: { id: member.id },
    });
  }

  /**
   * Get comprehensive organization details
   */
  async getOrganizationDetails(id: string, userId: string): Promise<OrganizationDetailsDto> {
    // Check if user has access to this organization
    const isMember = await this.isMember(id, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // Get organization with owner info
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImageUrl: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID '${id}' not found`);
    }

    // Get members with user info
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImageUrl: true,
          },
        },
      },
    });

    // Get pending invitations (only for admins/owners)
    const currentUserMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId,
        },
      },
    });

    let invitations: any[] = [];
    if (currentUserMember && ['OWNER', 'ADMINISTRATOR'].includes(currentUserMember.role)) {
      invitations = await this.prisma.organizationInvitation.findMany({
        where: { organizationId: id },
        include: {
          inviter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Get stats
    const totalMembers = members.length;

    // Get venue count
    const totalVenues = await this.prisma.venue.count({
      where: { organizationId: id },
    });

    // Get subscription info if available
    let subscription: SubscriptionInfoDto | undefined = undefined;
    if (organization.planId) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: organization.planId },
      });

      subscription = {
        planName: plan?.name,
        planId: organization.planId,
        startDate: organization.planStartDate || undefined,
        endDate: organization.planEndDate || undefined,
        status: this.getSubscriptionStatus(organization),
      };
    }

    // Format the response according to the DTO
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      description: organization.description || undefined,
      logoUrl: organization.logoUrl || undefined,
      websiteUrl: organization.websiteUrl || undefined,
      type: organization.type,
      isActive: organization.isActive,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      owner: {
        id: organization.owner.id,
        name: organization.owner.name,
        email: organization.owner.email,
        profileImageUrl: organization.owner.profileImageUrl || undefined,
      },
      members: members.map(member => ({
        id: member.id,
        role: member.role,
        staffType: member.staffType || undefined,
        venueIds: member.venueIds || [],
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
        user: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          profileImageUrl: member.user.profileImageUrl || undefined,
        },
      })),
      invitations: invitations.length > 0 ? invitations.map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        staffType: invitation.staffType || undefined,
        venueIds: invitation.venueIds || [],
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        inviter: {
          id: invitation.inviter.id,
          name: invitation.inviter.name,
          email: invitation.inviter.email,
        },
      })) : undefined,
      stats: {
        totalMembers,
        totalVenues,
        // Add more stats as needed when those features are implemented
      },
      subscription,
    };
  }

  /**
   * Determine the subscription status based on plan dates
   */
  private getSubscriptionStatus(organization: Organization): string {
    if (!organization.planId) {
      return 'NONE';
    }

    const now = new Date();

    // If plan has not started yet
    if (organization.planStartDate && organization.planStartDate > now) {
      return 'PENDING';
    }

    // If plan has expired
    if (organization.planEndDate && organization.planEndDate < now) {
      return 'EXPIRED';
    }

    // If plan is active
    return 'ACTIVE';
  }
}
