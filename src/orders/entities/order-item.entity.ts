import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderItemStatus } from '@prisma/client';
import { OrderItemModifierEntity } from './order-item-modifier.entity';

export class OrderItemEntity {
  @ApiProperty({
    description: 'The order item ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The order ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  orderId: string;

  @ApiProperty({
    description: 'The menu item ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  menuItemId: string;

  @ApiProperty({
    description: 'The quantity of the item',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'The unit price of the item',
    example: 9.99,
  })
  unitPrice: number;

  @ApiProperty({
    description: 'The total price of the item (quantity * unitPrice)',
    example: 19.98,
  })
  totalPrice: number;

  @ApiPropertyOptional({
    description: 'Notes for the item',
    example: 'No onions please',
  })
  notes: string | null;

  @ApiProperty({
    description: 'The status of the item',
    enum: OrderItemStatus,
    example: OrderItemStatus.PENDING,
  })
  status: OrderItemStatus;

  @ApiProperty({
    description: 'The date and time when the item was created',
    example: '2023-01-01T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time when the item was last updated',
    example: '2023-01-01T12:30:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'The modifiers for the item',
    type: [OrderItemModifierEntity],
  })
  modifiers?: OrderItemModifierEntity[];

  @ApiPropertyOptional({
    description: 'The menu item information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Burger',
      description: 'Delicious burger with cheese',
      price: '9.99',
      imageUrl: 'https://example.com/burger.jpg',
    },
  })
  menuItem?: {
    id: string;
    name: string;
    description?: string | null;
    price: string;
    imageUrl?: string | null;
  };
}
