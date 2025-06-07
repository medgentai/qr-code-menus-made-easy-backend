import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UploadUserProfileImageDto {
  @ApiProperty({
    description: 'Alt text for the profile image',
    example: 'John Doe profile picture',
    required: false,
  })
  @IsOptional()
  @IsString()
  altText?: string;
}
