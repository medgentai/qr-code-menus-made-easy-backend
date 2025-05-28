import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SessionRefreshDto {
  @ApiProperty({
    description: 'The session ID (optional if using HttpOnly cookies)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'Session ID must be a string' })
  @IsOptional()
  sessionId?: string;

  @ApiProperty({
    description: 'Device fingerprint for additional security',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
    required: false,
  })
  @IsString({ message: 'Fingerprint must be a string' })
  @IsOptional()
  fingerprint?: string;
}
