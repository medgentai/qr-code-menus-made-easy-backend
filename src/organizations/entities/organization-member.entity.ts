import { ApiProperty } from '@nestjs/swagger';
import { OrganizationMember, MemberRole, StaffType } from '@prisma/client';

export class OrganizationMemberEntity implements Partial<OrganizationMember> {
  @ApiProperty({
    description: 'The unique identifier of the organization member',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The ID of the organization',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  organizationId: string;

  @ApiProperty({
    description: 'The ID of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'The role of the member in the organization',
    example: 'STAFF',
    enum: ['OWNER', 'ADMINISTRATOR', 'MANAGER', 'STAFF'],
  })
  role: MemberRole;

  @ApiProperty({
    description: 'The staff type (only applicable for STAFF role)',
    example: 'KITCHEN',
    enum: ['KITCHEN', 'FRONT_OF_HOUSE', 'GENERAL'],
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
    description: 'The date when the member was added',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the member was last updated',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;
}
