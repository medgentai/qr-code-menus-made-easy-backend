import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional } from 'class-validator';

export class UploadVenueImageDto {
  @ApiProperty({
    description: 'Venue ID to associate the image with',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  venueId: string;

  @ApiProperty({
    description: 'Alt text for the image',
    example: 'Beautiful restaurant interior',
    required: false,
  })
  @IsOptional()
  @IsString()
  altText?: string;
}
