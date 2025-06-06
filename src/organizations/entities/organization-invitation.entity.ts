import { ApiProperty } from '@nestjs/swagger';
import { OrganizationInvitation, MemberRole, StaffType, InvitationStatus } from '@prisma/client';

export class OrganizationInvitationEntity implements Partial<OrganizationInvitation> {
  @ApiProperty({
    description: 'The unique identifier of the invitation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The email address of the invited user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'The ID of the organization',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  organizationId: string;

  @ApiProperty({
    description: 'The ID of the user who sent the invitation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  invitedBy: string;

  @ApiProperty({
    description: 'The role assigned to the invited member',
    example: 'STAFF',
    enum: ['OWNER', 'ADMINISTRATOR', 'MANAGER', 'STAFF'],
  })
  role: MemberRole;

  @ApiProperty({
    description: 'The staff type (only applicable for STAFF role)',
    example: 'KITCHEN',
    enum: ['KITCHEN', 'FRONT_OF_HOUSE'],
    required: false,
  })
  staffType?: StaffType;

  @ApiProperty({
    description: 'Array of venue IDs the member is assigned to',
    example: ['venue-id-1', 'venue-id-2'],
    type: [String],
    required: false,
  })
  venueIds?: string[];

  @ApiProperty({
    description: 'The status of the invitation',
    example: 'PENDING',
    enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED'],
  })
  status: InvitationStatus;

  @ApiProperty({
    description: 'The invitation token',
    example: 'abc123def456',
  })
  token: string;

  @ApiProperty({
    description: 'The expiration date of the invitation',
    example: '2023-12-31T23:59:59Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'The date when the invitation was accepted',
    example: '2023-01-15T10:30:00Z',
    required: false,
  })
  acceptedAt?: Date;

  @ApiProperty({
    description: 'The date when the invitation was created',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the invitation was last updated',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'The user who sent the invitation',
    required: false,
  })
  inviter?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({
    description: 'The organization details',
    required: false,
  })
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}
