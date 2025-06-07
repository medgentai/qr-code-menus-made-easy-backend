import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional } from 'class-validator';

export class UploadMenuItemImageDto {
  @ApiProperty({
    description: 'Menu item ID to associate the image with',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  menuItemId: string;

  @ApiProperty({
    description: 'Alt text for the image',
    example: 'Delicious pasta with marinara sauce',
    required: false,
  })
  @IsOptional()
  @IsString()
  altText?: string;
}
