import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TaxType, ServiceType } from '@prisma/client';

export class OrderItemForTaxDto {
  @ApiProperty({
    description: 'Menu item ID',
    example: 'uuid-string'
  })
  @IsString()
  menuItemId: string;

  @ApiProperty({
    description: 'Quantity of the item',
    example: 2
  })
  @IsNumber()
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value) : value)
  quantity: number;

  @ApiProperty({
    description: 'Unit price of the item',
    example: 150.00,
    type: 'number',
    format: 'decimal'
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  unitPrice: number;

  @ApiPropertyOptional({
    description: 'Total price for modifiers',
    example: 25.00,
    type: 'number',
    format: 'decimal'
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => value ? (typeof value === 'string' ? parseFloat(value) : value) : undefined)
  modifiersPrice?: number;
}

export class CalculateTaxDto {
  @ApiProperty({
    description: 'Organization ID',
    example: 'uuid-string'
  })
  @IsString()
  organizationId: string;

  @ApiProperty({
    description: 'Service type for the order',
    enum: ServiceType,
    example: ServiceType.DINE_IN
  })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiProperty({
    description: 'Array of order items for tax calculation',
    type: [OrderItemForTaxDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemForTaxDto)
  items: OrderItemForTaxDto[];
}

export class TaxBreakdownDto {
  @ApiProperty({
    description: 'Tax type',
    enum: TaxType,
    example: TaxType.GST
  })
  taxType: TaxType;

  @ApiProperty({
    description: 'Tax rate as percentage',
    example: 5.00,
    type: 'number',
    format: 'decimal'
  })
  taxRate: number;

  @ApiProperty({
    description: 'Tax amount',
    example: 15.00,
    type: 'number',
    format: 'decimal'
  })
  taxAmount: number;

  @ApiProperty({
    description: 'Whether tax is included in price',
    example: false
  })
  isPriceInclusive: boolean;

  @ApiProperty({
    description: 'Whether order is tax exempt',
    example: false
  })
  isTaxExempt: boolean;
}

export class OrderTotalsDto {
  @ApiProperty({
    description: 'Subtotal amount (before tax)',
    example: 300.00,
    type: 'number',
    format: 'decimal'
  })
  subtotalAmount: number;

  @ApiProperty({
    description: 'Total tax amount',
    example: 15.00,
    type: 'number',
    format: 'decimal'
  })
  taxAmount: number;

  @ApiProperty({
    description: 'Total amount (including tax)',
    example: 315.00,
    type: 'number',
    format: 'decimal'
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Service type',
    enum: ServiceType,
    example: ServiceType.DINE_IN
  })
  serviceType: ServiceType;

  @ApiProperty({
    description: 'Tax breakdown details',
    type: TaxBreakdownDto
  })
  taxBreakdown: TaxBreakdownDto;

  @ApiPropertyOptional({
    description: 'Display message for tax-exempt or special cases',
    example: 'Tax Inclusive Pricing'
  })
  @IsOptional()
  displayMessage?: string;
}
