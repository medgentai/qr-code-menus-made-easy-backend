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
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';
import { CreateOrderItemDto, CreateOrderItemModifierDto } from '../../orders/dto/create-order.dto';

export class CreatePublicOrderDto {
  @ApiPropertyOptional({
    description: 'The venue ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Venue ID must be a valid UUID' })
  @IsOptional()
  venueId?: string;

  @ApiPropertyOptional({
    description: 'The table ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Table ID must be a valid UUID' })
  @IsOptional()
  tableId?: string;

  @ApiProperty({
    description: 'The customer name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Customer name is required' })
  customerName: string;

  @ApiPropertyOptional({
    description: 'The customer email',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  customerEmail?: string;

  @ApiProperty({
    description: 'The customer phone',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty({ message: 'Customer phone is required' })
  customerPhone: string;

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
  @IsNumber()
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
}
