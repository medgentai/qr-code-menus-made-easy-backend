import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  MaxLength,
  IsEnum
} from 'class-validator';
import { TableStatus } from '@prisma/client';

export class CreateTableDto {
  @ApiProperty({
    description: 'The venue ID this table belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  venueId: string;

  @ApiProperty({
    description: 'The name or number of the table',
    example: 'Table 1',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

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
