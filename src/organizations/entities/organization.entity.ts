import { ApiProperty } from '@nestjs/swagger';
import { Organization, OrganizationType } from '@prisma/client';

export class OrganizationEntity implements Partial<Organization> {
  @ApiProperty({
    description: 'The unique identifier of the organization',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the organization',
    example: 'Tasty Bites Restaurant',
  })
  name: string;

  @ApiProperty({
    description: 'The slug of the organization (URL-friendly identifier)',
    example: 'tasty-bites',
  })
  slug: string;

  @ApiProperty({
    description: 'The description of the organization',
    example: 'A family-friendly restaurant serving delicious meals',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'The logo URL of the organization',
    example: 'https://example.com/logo.jpg',
    required: false,
  })
  logoUrl?: string;

  @ApiProperty({
    description: 'The website URL of the organization',
    example: 'https://tastybites.com',
    required: false,
  })
  websiteUrl?: string;

  @ApiProperty({
    description: 'The type of organization',
    example: 'RESTAURANT',
    enum: ['RESTAURANT', 'HOTEL', 'CAFE', 'FOOD_TRUCK', 'BAR', 'OTHER'],
  })
  type: OrganizationType;

  @ApiProperty({
    description: 'The ID of the organization owner',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  ownerId: string;

  @ApiProperty({
    description: 'The ID of the subscription plan',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  planId?: string;

  @ApiProperty({
    description: 'The start date of the subscription plan',
    example: '2023-01-01T00:00:00Z',
    required: false,
  })
  planStartDate?: Date;

  @ApiProperty({
    description: 'The end date of the subscription plan',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  planEndDate?: Date;

  @ApiProperty({
    description: 'Whether the organization is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'The date when the organization was created',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the organization was last updated',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;
}
