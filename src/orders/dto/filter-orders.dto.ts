import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

export class FilterOrdersDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Organization ID must be a valid UUID' })
  @IsOptional()
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'Filter by venue ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Venue ID must be a valid UUID' })
  @IsOptional()
  venueId?: string;

  @ApiPropertyOptional({
    description: 'Filter by table ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Table ID must be a valid UUID' })
  @IsOptional()
  tableId?: string;

  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: OrderStatus,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Filter by customer name (partial match)',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer email (partial match)',
    example: 'john',
  })
  @IsString()
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer phone (partial match)',
    example: '123',
  })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiPropertyOptional({
    description: 'Filter by room number (partial match)',
    example: '10',
  })
  @IsString()
  @IsOptional()
  roomNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by created after date',
    example: '2023-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  createdAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter by created before date',
    example: '2023-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  createdBefore?: string;
}
