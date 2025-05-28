import { ApiProperty } from '@nestjs/swagger';
import { OrganizationType, MemberRole } from '@prisma/client';

// Basic user information DTO
export class UserBasicInfoDto {
  @ApiProperty({
    description: 'The unique identifier of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'The profile image URL of the user',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  profileImageUrl?: string;
}

// Organization member with user information
export class OrganizationMemberWithUserDto {
  @ApiProperty({
    description: 'The unique identifier of the organization member',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The role of the member in the organization',
    example: 'ADMIN',
    enum: ['OWNER', 'ADMIN', 'MEMBER'],
  })
  role: MemberRole;

  @ApiProperty({
    description: 'When the member was added to the organization',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the member information was last updated',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Basic information about the user',
    type: UserBasicInfoDto,
  })
  user: UserBasicInfoDto;
}

// Subscription information
export class SubscriptionInfoDto {
  @ApiProperty({
    description: 'The name of the subscription plan',
    example: 'Premium',
    required: false,
  })
  planName?: string;

  @ApiProperty({
    description: 'The unique identifier of the plan',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  planId?: string;

  @ApiProperty({
    description: 'When the subscription started',
    example: '2023-01-01T00:00:00Z',
    required: false,
  })
  startDate?: Date;

  @ApiProperty({
    description: 'When the subscription ends',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  endDate?: Date;

  @ApiProperty({
    description: 'The current status of the subscription',
    example: 'ACTIVE',
    required: false,
  })
  status?: string;
}

// Organization statistics
export class OrganizationStatsDto {
  @ApiProperty({
    description: 'Total number of members in the organization',
    example: 5,
  })
  totalMembers: number;

  @ApiProperty({
    description: 'Total number of venues in the organization',
    example: 3,
    required: false,
  })
  totalVenues?: number;

  @ApiProperty({
    description: 'Total number of menus in the organization',
    example: 10,
    required: false,
  })
  totalMenus?: number;

  @ApiProperty({
    description: 'Total number of QR codes in the organization',
    example: 15,
    required: false,
  })
  totalQrCodes?: number;
}

// Main organization details DTO
export class OrganizationDetailsDto {
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
    description: 'Whether the organization is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'When the organization was created',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the organization was last updated',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'The owner of the organization',
    type: UserBasicInfoDto,
  })
  owner: UserBasicInfoDto;

  @ApiProperty({
    description: 'The members of the organization',
    type: [OrganizationMemberWithUserDto],
  })
  members: OrganizationMemberWithUserDto[];

  @ApiProperty({
    description: 'Statistics about the organization',
    type: OrganizationStatsDto,
  })
  stats: OrganizationStatsDto;

  @ApiProperty({
    description: 'Subscription information for the organization',
    type: SubscriptionInfoDto,
    required: false,
  })
  subscription?: SubscriptionInfoDto;
}
