import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrganizationType, TaxType, ServiceType } from '@prisma/client';

export class CreateTaxConfigurationDto {
  @ApiProperty({
    description: 'Name of the tax configuration',
    example: 'Restaurant GST - Dine In'
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the tax configuration',
    example: 'Standard GST rate for restaurant dine-in service'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Organization type this tax configuration applies to',
    enum: OrganizationType,
    example: OrganizationType.RESTAURANT
  })
  @IsEnum(OrganizationType)
  organizationType: OrganizationType;

  @ApiProperty({
    description: 'Type of tax',
    enum: TaxType,
    example: TaxType.GST,
    default: TaxType.GST
  })
  @IsEnum(TaxType)
  taxType: TaxType = TaxType.GST;

  @ApiProperty({
    description: 'Tax rate as a percentage (e.g., 5.00 for 5%)',
    example: 5.00,
    type: 'number',
    format: 'decimal'
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  taxRate: number;

  @ApiPropertyOptional({
    description: 'Whether this is the default tax configuration for the organization type',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  @ApiPropertyOptional({
    description: 'Whether this tax configuration is active',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Whether the organization is tax exempt',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isTaxExempt?: boolean = false;

  @ApiPropertyOptional({
    description: 'Whether prices are tax inclusive',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isPriceInclusive?: boolean = false;

  @ApiPropertyOptional({
    description: 'Applicable region for this tax configuration',
    example: 'Delhi, India'
  })
  @IsOptional()
  @IsString()
  applicableRegion?: string;

  @ApiPropertyOptional({
    description: 'Service type this tax configuration applies to',
    enum: ServiceType,
    example: ServiceType.DINE_IN
  })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;
}
