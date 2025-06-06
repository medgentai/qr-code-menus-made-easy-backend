import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../auth/email.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { OrganizationInvitation, InvitationStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Create and send an invitation
   */
  async createInvitation(
    organizationId: string,
    createInvitationDto: CreateInvitationDto,
    invitedBy: string,
  ): Promise<OrganizationInvitation> {
    const { email, role = 'STAFF', staffType, venueIds = [] } = createInvitationDto;

    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, slug: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if inviter has permission
    const inviterMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: invitedBy,
        },
      },
    });

    if (!inviterMember || !['OWNER', 'ADMINISTRATOR'].includes(inviterMember.role)) {
      throw new ForbiddenException('You do not have permission to invite members to this organization');
    }

    // Check if user is already a member
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const existingMember = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: existingUser.id,
          },
        },
      });

      if (existingMember) {
        throw new ConflictException('User is already a member of this organization');
      }
    }

    // Check if there's already a pending invitation
    const existingInvitation = await this.prisma.organizationInvitation.findUnique({
      where: {
        organizationId_email: {
          organizationId,
          email,
        },
      },
    });

    if (existingInvitation && existingInvitation.status === 'PENDING') {
      throw new ConflictException('An invitation has already been sent to this email address');
    }

    // Delete any existing expired or cancelled invitations
    if (existingInvitation) {
      await this.prisma.organizationInvitation.delete({
        where: { id: existingInvitation.id },
      });
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const invitation = await this.prisma.organizationInvitation.create({
      data: {
        email,
        organizationId,
        invitedBy,
        role,
        staffType: role === 'STAFF' ? staffType : null,
        venueIds: role === 'STAFF' ? venueIds : [],
        token,
        expiresAt,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send invitation email
    await this.emailService.sendInvitationEmail(
      email,
      invitation.inviter.name,
      organization.name,
      token,
    );

    return invitation;
  }

  /**
   * Get all invitations for an organization
   */
  async getInvitations(organizationId: string, userId: string): Promise<OrganizationInvitation[]> {
    // Check if user has permission to view invitations
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!member || !['OWNER', 'ADMINISTRATOR'].includes(member.role)) {
      throw new ForbiddenException('You do not have permission to view invitations for this organization');
    }

    return this.prisma.organizationInvitation.findMany({
      where: { organizationId },
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

  /**
   * Cancel an invitation
   */
  async cancelInvitation(organizationId: string, invitationId: string, userId: string): Promise<void> {
    // Check if user has permission
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!member || !['OWNER', 'ADMINISTRATOR'].includes(member.role)) {
      throw new ForbiddenException('You do not have permission to cancel invitations');
    }

    // Find and update invitation
    const invitation = await this.prisma.organizationInvitation.findFirst({
      where: {
        id: invitationId,
        organizationId,
        status: 'PENDING',
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already processed');
    }

    await this.prisma.organizationInvitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(token: string, userId: string): Promise<OrganizationInvitation> {
    // Find invitation by token
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { token },
      include: {
        organization: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Invitation has already been processed');
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Invitation has expired');
    }

    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if invitation email matches user email
    if (invitation.email !== user.email) {
      throw new BadRequestException('Invitation email does not match your account email');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: invitation.organizationId,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('You are already a member of this organization');
    }

    // Create organization member and update invitation in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create organization member
      await tx.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId,
          role: invitation.role,
          staffType: invitation.staffType,
          venueIds: invitation.venueIds,
        },
      });

      // Update invitation status
      const updatedInvitation = await tx.organizationInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
        include: {
          organization: true,
          inviter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return updatedInvitation;
    });

    return result;
  }

  /**
   * Get invitation by token (for public access)
   */
  async getInvitationByToken(token: string): Promise<OrganizationInvitation> {
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (invitation.expiresAt < new Date() && invitation.status === 'PENDING') {
      await this.prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Invitation has expired');
    }

    return invitation;
  }
}
