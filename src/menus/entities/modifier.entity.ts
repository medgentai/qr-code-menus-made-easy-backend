import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Modifier, Prisma } from '@prisma/client';
import { ModifierGroupEntity } from './modifier-group.entity';

export class ModifierEntity implements Modifier {
  @ApiProperty({
    description: 'The unique identifier of the modifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The ID of the modifier group this modifier belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  modifierGroupId: string;

  @ApiProperty({
    description: 'The name of the modifier',
    example: 'Extra Cheese',
  })
  name: string;

  @ApiProperty({
    description: 'The additional price for this modifier',
    example: '1.50',
  })
  price: Prisma.Decimal;

  @ApiProperty({
    description: 'The display order of the modifier',
    example: 1,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Whether the modifier is available',
    example: true,
  })
  isAvailable: boolean;

  @ApiProperty({
    description: 'The date when the modifier was created',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the modifier was last updated',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'The modifier group this modifier belongs to',
    type: ModifierGroupEntity,
  })
  modifierGroup?: ModifierGroupEntity;
}
