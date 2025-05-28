import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'The data for the current page',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'The total number of items across all pages',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'The current page number (1-based)',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'The number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'The total number of pages',
    example: 10,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPreviousPage: boolean;
}
