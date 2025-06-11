import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum, Min } from 'class-validator';
import { OrganizationType } from '@prisma/client';

export class CreatePlanDto {
  @ApiProperty({ description: 'Plan name', example: 'Premium Restaurant Plan' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Plan description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Organization type', enum: OrganizationType })
  @IsEnum(OrganizationType)
  organizationType: OrganizationType;

  @ApiProperty({ description: 'Monthly price in cents', example: 79900 })
  @IsNumber()
  @Min(0)
  monthlyPrice: number;

  @ApiProperty({ description: 'Annual price in cents', example: 718800 })
  @IsNumber()
  @Min(0)
  annualPrice: number;

  @ApiProperty({ description: 'Plan features', type: [String] })
  @IsArray()
  @IsString({ each: true })
  features: string[];

  @ApiProperty({ description: 'Number of venues included', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  venuesIncluded?: number;

  @ApiProperty({ description: 'Whether plan is active', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlanDto {
  @ApiProperty({ description: 'Plan name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Plan description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Organization type', enum: OrganizationType, required: false })
  @IsOptional()
  @IsEnum(OrganizationType)
  organizationType?: OrganizationType;

  @ApiProperty({ description: 'Monthly price in cents', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPrice?: number;

  @ApiProperty({ description: 'Annual price in cents', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  annualPrice?: number;

  @ApiProperty({ description: 'Plan features', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({ description: 'Number of venues included', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  venuesIncluded?: number;

  @ApiProperty({ description: 'Whether plan is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GetPlansDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filter by organization type', enum: OrganizationType, required: false })
  @IsOptional()
  @IsEnum(OrganizationType)
  organizationType?: OrganizationType;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}



export class GetPlanOrganizationsDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
