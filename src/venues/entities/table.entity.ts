import { ApiProperty } from '@nestjs/swagger';
import { Table, TableStatus } from '@prisma/client';

export class TableEntity implements Partial<Table> {
  @ApiProperty({
    description: 'The unique identifier of the table',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The venue ID this table belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  venueId: string;

  @ApiProperty({
    description: 'The name or number of the table',
    example: 'Table 1',
  })
  name: string;

  @ApiProperty({
    description: 'The seating capacity of the table',
    example: 4,
    required: false,
  })
  capacity?: number;

  @ApiProperty({
    description: 'The status of the table',
    example: 'AVAILABLE',
    enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'UNAVAILABLE'],
  })
  status: TableStatus;

  @ApiProperty({
    description: 'The location description of the table within the venue',
    example: 'Near window, second floor',
    required: false,
  })
  location?: string;

  @ApiProperty({
    description: 'The date when the table was created',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the table was last updated',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: Date;
}
