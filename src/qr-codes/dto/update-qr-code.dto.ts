import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateQrCodeDto {
  @ApiPropertyOptional({
    description: 'The menu ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Menu ID must be a valid UUID' })
  @IsOptional()
  menuId?: string;

  @ApiPropertyOptional({
    description: 'The name of the QR code',
    example: 'Table 1 QR Code',
  })
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;

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
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
}
