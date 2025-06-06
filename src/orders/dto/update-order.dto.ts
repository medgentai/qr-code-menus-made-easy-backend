import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEmail,
  IsEnum,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';
import { CreateOrderItemDto } from './create-order.dto';

export class UpdateOrderItemQuantityDto {
  @ApiPropertyOptional({
    description: 'The order item ID to update',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Order item ID must be a valid UUID' })
  itemId: string;

  @ApiPropertyOptional({
    description: 'The new quantity for the item',
    example: 3,
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ApiPropertyOptional({
    description: 'Updated notes for the item',
    example: 'Extra spicy',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateOrderDto {
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

  @ApiPropertyOptional({
    description: 'The order status',
    enum: OrderStatus,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'The order items to add',
    type: [CreateOrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsOptional()
  addItems?: CreateOrderItemDto[];

  @ApiPropertyOptional({
    description: 'The order item IDs to remove',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  removeItemIds?: string[];

  @ApiPropertyOptional({
    description: 'The order items to update (quantity/notes)',
    type: [UpdateOrderItemQuantityDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemQuantityDto)
  @IsOptional()
  updateItems?: UpdateOrderItemQuantityDto[];
}
