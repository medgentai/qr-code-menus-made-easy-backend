import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadResponseEntity {
  @ApiProperty({
    description: 'The unique identifier of the uploaded media file',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The URL of the uploaded image',
    example: 'https://scanserve-media.s3.ap-south-1.amazonaws.com/menu-items/image.jpg',
  })
  url: string;



  @ApiProperty({
    description: 'The generated file name',
    example: '123e4567-e89b-12d3-a456-426614174000.jpg',
  })
  fileName: string;

  @ApiProperty({
    description: 'The original file name',
    example: 'menu-item-photo.jpg',
  })
  originalName: string;

  @ApiProperty({
    description: 'The file size in bytes',
    example: 1024000,
  })
  fileSize: number;

  @ApiProperty({
    description: 'The MIME type of the file',
    example: 'image/jpeg',
  })
  mimeType: string;
}
