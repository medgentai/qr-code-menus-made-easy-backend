import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  IsEnum
} from 'class-validator';
import { TableStatus } from '@prisma/client';

export class UpdateTableDto {
  @ApiProperty({
    description: 'The name or number of the table',
    example: 'Table 1',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiProperty({
    description: 'The seating capacity of the table',
    example: 4,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiProperty({
    description: 'The status of the table',
    example: 'AVAILABLE',
    enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'UNAVAILABLE'],
    required: false,
  })
  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;

  @ApiProperty({
    description: 'The location description of the table within the venue',
    example: 'Near window, second floor',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string;
}
