import { ApiProperty } from '@nestjs/swagger';
import { Venue } from '@prisma/client';

export class VenueEntity implements Partial<Venue> {
  @ApiProperty({
    description: 'The unique identifier of the venue',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The organization ID this venue belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  organizationId: string;

  @ApiProperty({
    description: 'The name of the venue',
    example: 'Downtown Restaurant',
  })
  name: string;

  @ApiProperty({
    description: 'The description of the venue',
    example: 'Our flagship restaurant in the heart of downtown',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'The address of the venue',
    example: '123 Main Street',
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'The city of the venue',
    example: 'New York',
    required: false,
  })
  city?: string;

  @ApiProperty({
    description: 'The state/province of the venue',
    example: 'NY',
    required: false,
  })
  state?: string;

  @ApiProperty({
    description: 'The country of the venue',
    example: 'USA',
    required: false,
  })
  country?: string;

  @ApiProperty({
    description: 'The postal code of the venue',
    example: '10001',
    required: false,
  })
  postalCode?: string;

  @ApiProperty({
    description: 'The phone number of the venue',
    example: '+1-555-123-4567',
    required: false,
  })
  phoneNumber?: string;

  @ApiProperty({
    description: 'The email of the venue',
    example: 'downtown@restaurant.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'The image URL of the venue',
    example: 'https://example.com/venue.jpg',
    required: false,
  })
  imageUrl?: string;

  @ApiProperty({
    description: 'Whether the venue is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'The date when the venue was created',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the venue was last updated',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;
}
