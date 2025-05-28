import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { OrderItemEntity } from './order-item.entity';

export class OrderEntity {
  @ApiProperty({
    description: 'The order ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'The table ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tableId: string | null;

  @ApiPropertyOptional({
    description: 'The customer name',
    example: 'John Doe',
  })
  customerName: string | null;

  @ApiPropertyOptional({
    description: 'The customer email',
    example: 'john.doe@example.com',
  })
  customerEmail: string | null;

  @ApiPropertyOptional({
    description: 'The customer phone',
    example: '+1234567890',
  })
  customerPhone: string | null;

  @ApiPropertyOptional({
    description: 'The room number (for hotels)',
    example: '101',
  })
  roomNumber: string | null;

  @ApiProperty({
    description: 'The order status',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'The total amount of the order',
    example: 25.99,
  })
  totalAmount: number;

  @ApiPropertyOptional({
    description: 'Notes for the order',
    example: 'Please deliver to Room 101',
  })
  notes: string | null;

  @ApiProperty({
    description: 'The date and time when the order was created',
    example: '2023-01-01T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time when the order was last updated',
    example: '2023-01-01T12:30:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'The date and time when the order was completed',
    example: '2023-01-01T13:00:00Z',
  })
  completedAt: Date | null;

  @ApiPropertyOptional({
    description: 'The order items',
    type: [OrderItemEntity],
  })
  items?: OrderItemEntity[];

  @ApiPropertyOptional({
    description: 'The table information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Table 1',
    },
  })
  table?: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional({
    description: 'The venue information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Restaurant A',
    },
  })
  venue?: {
    id: string;
    name: string;
  };
}
