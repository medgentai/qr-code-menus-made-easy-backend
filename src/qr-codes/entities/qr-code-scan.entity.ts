import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QrCodeScan } from '@prisma/client';

export class QrCodeScanEntity implements QrCodeScan {
  @ApiProperty({
    description: 'The QR code scan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The QR code ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  qrCodeId: string;

  @ApiPropertyOptional({
    description: 'The IP address of the scanner',
    example: '192.168.1.1',
  })
  ipAddress: string | null;

  @ApiPropertyOptional({
    description: 'The user agent of the scanner',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  })
  userAgent: string | null;

  @ApiProperty({
    description: 'The date and time when the QR code was scanned',
    example: '2023-01-01T00:00:00.000Z',
  })
  scannedAt: Date;
}
