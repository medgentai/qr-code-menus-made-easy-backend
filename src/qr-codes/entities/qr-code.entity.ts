import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QrCode } from '@prisma/client';

export class QrCodeEntity implements QrCode {
  @ApiProperty({
    description: 'The QR code ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The venue ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  venueId: string;

  @ApiProperty({
    description: 'The menu ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  menuId: string;

  @ApiPropertyOptional({
    description: 'The table ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tableId: string | null;

  @ApiProperty({
    description: 'The name of the QR code',
    example: 'Table 1 QR Code',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'The description of the QR code',
    example: 'QR code for Table 1',
  })
  description: string | null;

  @ApiProperty({
    description: 'The URL to the QR code image',
    example: 'https://api.scanserve.com/qr/123e4567-e89b-12d3-a456-426614174000.png',
  })
  qrCodeUrl: string;

  @ApiProperty({
    description: 'The data encoded in the QR code',
    example: 'https://menu.scanserve.com/restaurant-name?table=123e4567-e89b-12d3-a456-426614174000',
  })
  qrCodeData: string;

  @ApiProperty({
    description: 'Whether the QR code is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'The number of times the QR code has been scanned',
    example: 42,
  })
  scanCount: number;

  @ApiProperty({
    description: 'The date and time when the QR code was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time when the QR code was last updated',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
