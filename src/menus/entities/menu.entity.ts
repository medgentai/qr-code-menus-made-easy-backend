import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Menu } from '@prisma/client';
import { Type } from 'class-transformer';

export class MenuEntity implements Menu {
  @ApiProperty({
    description: 'The unique identifier of the menu',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The ID of the organization this menu belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  organizationId: string;

  @ApiProperty({
    description: 'The name of the menu',
    example: 'Dinner Menu',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'The description of the menu',
    example: 'Our special dinner offerings',
  })
  description: string | null;

  @ApiProperty({
    description: 'Whether the menu is active',
    example: true,
  })
  isActive: boolean;

  // Start and end dates removed as they are unnecessary

  @ApiProperty({
    description: 'The date when the menu was created',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the menu was last updated',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'The categories in this menu',
    type: () => 'CategoryEntity[]',
    isArray: true,
  })
  @Type(() => Object)
  categories?: any[];
}
