import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, OrderPaymentStatus, PaymentMethod } from '@prisma/client';
import { OrderItemEntity } from './order-item.entity';

export class OrderEntity {
  @ApiProperty({
    description: 'The order ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'The venue ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  venueId: string | null;

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

  @ApiPropertyOptional({
    description: 'The number of people in the party',
    example: 4,
  })
  partySize: number | null;

  @ApiProperty({
    description: 'The order status',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'The payment status of the order',
    enum: OrderPaymentStatus,
    example: OrderPaymentStatus.UNPAID,
  })
  paymentStatus: OrderPaymentStatus;

  @ApiPropertyOptional({
    description: 'Date and time when the order was marked as paid',
    example: '2023-12-01T14:30:00Z',
  })
  paidAt: Date | null;

  @ApiPropertyOptional({
    description: 'ID of the staff member who marked the order as paid',
    example: 'user-123',
  })
  paidBy: string | null;

  @ApiPropertyOptional({
    description: 'Payment method used for the order',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod | null;

  @ApiPropertyOptional({
    description: 'Additional notes about the payment',
    example: 'Customer paid in cash',
  })
  paymentNotes: string | null;

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
    description: 'The staff member who marked the order as paid',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Doe',
      email: 'john@example.com',
    },
  })
  paidByUser?: {
    id: string;
    name: string;
    email: string;
  };
}
