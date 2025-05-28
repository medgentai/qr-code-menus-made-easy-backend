import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min, IsUrl } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiPropertyOptional({
    description: 'The name of the category',
    example: 'Updated Appetizers',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'The description of the category',
    example: 'Updated small plates to start your meal',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'The URL of the category image',
    example: 'https://example.com/images/updated-appetizers.jpg',
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'The display order of the category',
    example: 2,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the category is active',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
