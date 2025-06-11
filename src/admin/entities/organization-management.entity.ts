import { ApiProperty } from '@nestjs/swagger';
import { OrganizationType } from '@prisma/client';

export class OrganizationManagementEntity {
  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'Delicious Restaurant',
  })
  name: string;

  @ApiProperty({
    description: 'Organization type',
    enum: OrganizationType,
    example: OrganizationType.RESTAURANT,
  })
  type: OrganizationType;

  @ApiProperty({
    description: 'Organization description',
    example: 'A fine dining restaurant',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Whether organization is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Organization creation date',
    example: '2025-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Number of members',
    example: 5,
  })
  memberCount: number;

  @ApiProperty({
    description: 'Number of venues',
    example: 3,
  })
  venueCount: number;

  @ApiProperty({
    description: 'Number of orders',
    example: 150,
  })
  orderCount: number;

  @ApiProperty({
    description: 'Organization owner information',
    example: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    required: false,
  })
  owner?: {
    name: string;
    email: string;
  } | null;
}
