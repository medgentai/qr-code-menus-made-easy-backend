import { ApiProperty } from '@nestjs/swagger';
import { OrganizationType } from '@prisma/client';
import { 
  IsEnum, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsUrl, 
  MaxLength, 
  MinLength 
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateOrganizationDto {
  @ApiProperty({
    description: 'The name of the organization',
    example: 'Tasty Bites Restaurant',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'The slug of the organization (URL-friendly identifier)',
    example: 'tasty-bites',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => {
    if (value) {
      return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    return value;
  })
  slug?: string;

  @ApiProperty({
    description: 'The description of the organization',
    example: 'A family-friendly restaurant serving delicious meals',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'The logo URL of the organization',
    example: 'https://example.com/logo.jpg',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({
    description: 'The website URL of the organization',
    example: 'https://tastybites.com',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @ApiProperty({
    description: 'The type of organization',
    example: 'RESTAURANT',
    enum: ['RESTAURANT', 'HOTEL', 'CAFE', 'FOOD_TRUCK', 'BAR'],
  })
  @IsEnum(OrganizationType)
  @IsNotEmpty()
  type: OrganizationType;
}
