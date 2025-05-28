import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateQrCodeDto {
  @ApiProperty({
    description: 'The venue ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Venue ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Venue ID is required' })
  venueId: string;

  @ApiProperty({
    description: 'The menu ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Menu ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Menu ID is required' })
  menuId: string;

  @ApiPropertyOptional({
    description: 'The table ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Table ID must be a valid UUID' })
  @IsOptional()
  tableId?: string;

  @ApiProperty({
    description: 'The name of the QR code',
    example: 'Table 1 QR Code',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiPropertyOptional({
    description: 'The description of the QR code',
    example: 'QR code for Table 1',
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the QR code is active',
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
}
