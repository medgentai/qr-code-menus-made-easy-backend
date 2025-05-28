import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsBoolean, 
  IsInt, 
  Min, 
  Max, 
  IsUrl, 
  IsNumber,
  Matches
} from 'class-validator';

export class CreateMenuItemDto {
  @ApiProperty({
    description: 'The name of the menu item',
    example: 'Margherita Pizza',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'The description of the menu item',
    example: 'Classic pizza with tomato sauce, mozzarella, and basil',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The price of the menu item',
    example: '12.99',
  })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'Price must be a valid decimal number with up to 2 decimal places' })
  @IsNotEmpty()
  price: string;

  @ApiPropertyOptional({
    description: 'The discounted price of the menu item',
    example: '9.99',
  })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'Discount price must be a valid decimal number with up to 2 decimal places' })
  @IsOptional()
  discountPrice?: string;

  @ApiPropertyOptional({
    description: 'The URL of the menu item image',
    example: 'https://example.com/images/margherita.jpg',
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'The preparation time of the menu item in minutes',
    example: 15,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  preparationTime?: number;

  @ApiPropertyOptional({
    description: 'The calorie count of the menu item',
    example: 800,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  calories?: number;

  @ApiPropertyOptional({
    description: 'Whether the menu item is vegetarian',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isVegetarian?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the menu item is vegan',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isVegan?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the menu item is gluten-free',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isGlutenFree?: boolean;

  @ApiPropertyOptional({
    description: 'The spicy level of the menu item (0-5)',
    example: 2,
  })
  @IsInt()
  @Min(0)
  @Max(5)
  @IsOptional()
  spicyLevel?: number;

  @ApiPropertyOptional({
    description: 'The allergens in the menu item',
    example: 'Gluten, Dairy',
  })
  @IsString()
  @IsOptional()
  allergens?: string;

  @ApiPropertyOptional({
    description: 'The display order of the menu item',
    example: 1,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the menu item is available',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
