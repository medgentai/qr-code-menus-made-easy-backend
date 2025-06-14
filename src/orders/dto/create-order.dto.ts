import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEmail,
  IsArray,
  ValidateNested,
  IsNumber,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, ServiceType } from '@prisma/client';

export class CreateOrderItemModifierDto {
  @ApiProperty({
    description: 'The modifier ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Modifier ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Modifier ID is required' })
  modifierId: string;
}

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'The menu item ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Menu item ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Menu item ID is required' })
  menuItemId: string;

  @ApiProperty({
    description: 'The quantity of the item',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ApiPropertyOptional({
    description: 'Notes for the item',
    example: 'No onions please',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Modifiers for the item',
    type: [CreateOrderItemModifierDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemModifierDto)
  @IsOptional()
  modifiers?: CreateOrderItemModifierDto[];
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'The venue ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Venue ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Venue ID is required' })
  venueId: string;

  @ApiPropertyOptional({
    description: 'The table ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Table ID must be a valid UUID' })
  @IsOptional()
  tableId?: string;

  @ApiPropertyOptional({
    description: 'The customer name',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({
    description: 'The customer email',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'The customer phone',
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiPropertyOptional({
    description: 'The room number (for hotels)',
    example: '101',
  })
  @IsString()
  @IsOptional()
  roomNumber?: string;

  @ApiPropertyOptional({
    description: 'The number of people in the party',
    example: 4,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  partySize?: number;

  @ApiPropertyOptional({
    description: 'Notes for the order',
    example: 'Please deliver to Room 101',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'The order items',
    type: [CreateOrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsNotEmpty({ message: 'Order items are required' })
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({
    description: 'The order status',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'The service type for tax calculation',
    enum: ServiceType,
    default: ServiceType.DINE_IN,
  })
  @IsEnum(ServiceType)
  @IsOptional()
  serviceType?: ServiceType;
}
