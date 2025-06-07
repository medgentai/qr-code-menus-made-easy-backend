import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UploadOrganizationLogoDto {
  @ApiProperty({
    description: 'Alt text for the logo',
    example: 'Restaurant ABC Logo',
    required: false,
  })
  @IsOptional()
  @IsString()
  altText?: string;
}
