import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemStatus } from '@prisma/client';
import { CreateOrderItemModifierDto } from './create-order.dto';

export class UpdateOrderItemDto {
  @ApiPropertyOptional({
    description: 'The quantity of the item',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Notes for the item',
    example: 'No onions please',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'The status of the item',
    enum: OrderItemStatus,
  })
  @IsEnum(OrderItemStatus)
  @IsOptional()
  status?: OrderItemStatus;

  @ApiPropertyOptional({
    description: 'Modifiers to add to the item',
    type: [CreateOrderItemModifierDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemModifierDto)
  @IsOptional()
  addModifiers?: CreateOrderItemModifierDto[];

  @ApiPropertyOptional({
    description: 'Modifier IDs to remove from the item',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  removeModifierIds?: string[];
}
