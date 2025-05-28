import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModifierGroup } from '@prisma/client';
import { ModifierEntity } from './modifier.entity';

export class ModifierGroupEntity implements ModifierGroup {
  @ApiProperty({
    description: 'The unique identifier of the modifier group',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the modifier group',
    example: 'Toppings',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'The description of the modifier group',
    example: 'Choose your pizza toppings',
  })
  description: string | null;

  @ApiProperty({
    description: 'Whether selecting at least one modifier is required',
    example: true,
  })
  required: boolean;

  @ApiProperty({
    description: 'Whether multiple modifiers can be selected',
    example: true,
  })
  multiSelect: boolean;

  @ApiProperty({
    description: 'The minimum number of modifiers that must be selected',
    example: 1,
  })
  minSelect: number;

  @ApiPropertyOptional({
    description: 'The maximum number of modifiers that can be selected',
    example: 3,
  })
  maxSelect: number | null;

  @ApiProperty({
    description: 'The display order of the modifier group',
    example: 1,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'The date when the modifier group was created',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the modifier group was last updated',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'The modifiers in this group',
    type: [ModifierEntity],
  })
  modifiers?: ModifierEntity[];

  @ApiPropertyOptional({
    description: 'The menu items this modifier group is associated with',
    type: 'array',
  })
  menuItems?: any[];
}
