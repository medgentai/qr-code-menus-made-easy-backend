import { ApiProperty } from '@nestjs/swagger';

export class OrderItemModifierEntity {
  @ApiProperty({
    description: 'The order item modifier ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The order item ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  orderItemId: string;

  @ApiProperty({
    description: 'The modifier ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  modifierId: string;

  @ApiProperty({
    description: 'The price of the modifier',
    example: 1.99,
  })
  price: number;

  @ApiProperty({
    description: 'The modifier information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Extra Cheese',
      price: '1.99',
    },
  })
  modifier?: {
    id: string;
    name: string;
    price: string;
  };
}
