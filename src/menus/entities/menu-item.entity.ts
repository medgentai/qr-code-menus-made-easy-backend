import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MenuItem, Prisma } from '@prisma/client';
import { Type } from 'class-transformer';

export class MenuItemEntity implements MenuItem {
  @ApiProperty({
    description: 'The unique identifier of the menu item',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The ID of the category this menu item belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  categoryId: string;

  @ApiProperty({
    description: 'The name of the menu item',
    example: 'Margherita Pizza',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'The description of the menu item',
    example: 'Classic pizza with tomato sauce, mozzarella, and basil',
  })
  description: string | null;

  @ApiProperty({
    description: 'The price of the menu item',
    example: '12.99',
  })
  price: Prisma.Decimal;

  @ApiPropertyOptional({
    description: 'The discounted price of the menu item',
    example: '9.99',
  })
  discountPrice: Prisma.Decimal | null;

  @ApiPropertyOptional({
    description: 'The URL of the menu item image',
    example: 'https://example.com/images/margherita.jpg',
  })
  imageUrl: string | null;

  @ApiPropertyOptional({
    description: 'The preparation time of the menu item in minutes',
    example: 15,
  })
  preparationTime: number | null;

  @ApiPropertyOptional({
    description: 'The calorie count of the menu item',
    example: 800,
  })
  calories: number | null;

  @ApiPropertyOptional({
    description: 'Whether the menu item is vegetarian',
    example: true,
  })
  isVegetarian: boolean;

  @ApiPropertyOptional({
    description: 'Whether the menu item is vegan',
    example: false,
  })
  isVegan: boolean;

  @ApiPropertyOptional({
    description: 'Whether the menu item is gluten-free',
    example: false,
  })
  isGlutenFree: boolean;

  @ApiPropertyOptional({
    description: 'The spicy level of the menu item (0-5)',
    example: 2,
  })
  spicyLevel: number | null;

  @ApiPropertyOptional({
    description: 'The allergens in the menu item',
    example: 'Gluten, Dairy',
  })
  allergens: string | null;

  @ApiProperty({
    description: 'The display order of the menu item',
    example: 1,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Whether the menu item is available',
    example: true,
  })
  isAvailable: boolean;

  @ApiProperty({
    description: 'The date when the menu item was created',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the menu item was last updated',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'The category this menu item belongs to',
    type: () => 'CategoryEntity',
  })
  @Type(() => Object)
  category?: any;

  @ApiPropertyOptional({
    description: 'The modifier groups associated with this menu item',
    type: 'array',
  })
  modifierGroups?: any[];
}
