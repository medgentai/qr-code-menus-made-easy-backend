import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { Type } from 'class-transformer';

export class CategoryEntity implements Category {
  @ApiProperty({
    description: 'The unique identifier of the category',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The ID of the menu this category belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  menuId: string;

  @ApiProperty({
    description: 'The name of the category',
    example: 'Appetizers',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'The description of the category',
    example: 'Small plates to start your meal',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'The URL of the category image',
    example: 'https://example.com/images/appetizers.jpg',
  })
  imageUrl: string | null;



  @ApiProperty({
    description: 'The display order of the category',
    example: 1,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Whether the category is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'The date when the category was created',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the category was last updated',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'The menu this category belongs to',
    type: () => 'MenuEntity',
  })
  @Type(() => Object)
  menu?: any;

  @ApiPropertyOptional({
    description: 'The menu items in this category',
    type: () => 'MenuItemEntity[]',
    isArray: true,
  })
  @Type(() => Object)
  items?: any[];
}
