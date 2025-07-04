import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsUrl,
  MaxLength,
  IsBoolean,
  ValidateIf
} from 'class-validator';

export class UpdateVenueDto {
  @ApiProperty({
    description: 'The name of the venue',
    example: 'Downtown Restaurant',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: 'The description of the venue',
    example: 'Our flagship restaurant in the heart of downtown',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'The address of the venue',
    example: '123 Main Street',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;

  @ApiProperty({
    description: 'The city of the venue',
    example: 'New York',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiProperty({
    description: 'The state/province of the venue',
    example: 'NY',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  @ApiProperty({
    description: 'The country of the venue',
    example: 'USA',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @ApiProperty({
    description: 'The postal code of the venue',
    example: '10001',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  @ApiProperty({
    description: 'The phone number of the venue',
    example: '+1-555-123-4567',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiProperty({
    description: 'The email of the venue',
    example: 'downtown@restaurant.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'The image URL of the venue',
    example: 'https://example.com/venue.jpg',
    required: false,
  })
  @ValidateIf((o) => o.imageUrl !== '' && o.imageUrl != null)
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    description: 'Whether the venue is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Whether the venue is in view-only mode (disables ordering)',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  viewOnlyMode?: boolean;
}
