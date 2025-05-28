import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({
    description: 'The name of the menu',
    example: 'Dinner Menu',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'The description of the menu',
    example: 'Our special dinner offerings',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The ID of the organization this menu belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @ApiPropertyOptional({
    description: 'Whether the menu is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
