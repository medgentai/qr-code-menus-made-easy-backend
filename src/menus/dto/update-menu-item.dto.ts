import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsInt, 
  Min, 
  Max, 
  IsUrl,
  Matches
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { CreateMenuItemDto } from './create-menu-item.dto';

export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {
  @ApiPropertyOptional({
    description: 'The name of the menu item',
    example: 'Updated Margherita Pizza',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'The description of the menu item',
    example: 'Updated classic pizza with tomato sauce, mozzarella, and basil',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'The price of the menu item',
    example: '13.99',
  })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'Price must be a valid decimal number with up to 2 decimal places' })
  @IsOptional()
  price?: string;

  @ApiPropertyOptional({
    description: 'The discounted price of the menu item',
    example: '10.99',
  })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'Discount price must be a valid decimal number with up to 2 decimal places' })
  @IsOptional()
  discountPrice?: string;

  @ApiPropertyOptional({
    description: 'The URL of the menu item image',
    example: 'https://example.com/images/updated-margherita.jpg',
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'The preparation time of the menu item in minutes',
    example: 20,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  preparationTime?: number;

  @ApiPropertyOptional({
    description: 'The calorie count of the menu item',
    example: 850,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  calories?: number;

  @ApiPropertyOptional({
    description: 'Whether the menu item is vegetarian',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isVegetarian?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the menu item is vegan',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isVegan?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the menu item is gluten-free',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isGlutenFree?: boolean;

  @ApiPropertyOptional({
    description: 'The spicy level of the menu item (0-5)',
    example: 3,
  })
  @IsInt()
  @Min(0)
  @Max(5)
  @IsOptional()
  spicyLevel?: number;

  @ApiPropertyOptional({
    description: 'The allergens in the menu item',
    example: 'Dairy',
  })
  @IsString()
  @IsOptional()
  allergens?: string;

  @ApiPropertyOptional({
    description: 'The display order of the menu item',
    example: 2,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the menu item is available',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
