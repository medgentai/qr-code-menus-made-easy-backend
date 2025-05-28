import { IsString, IsNumber, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentOrderDto {
  @ApiProperty({
    description: 'Amount in smallest currency unit (paise for INR)',
    example: 50000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'INR',
    default: 'INR',
  })
  @IsString()
  @IsOptional()
  currency?: string = 'INR';

  @ApiProperty({
    description: 'Receipt identifier for the order',
    example: 'receipt_order_74394',
  })
  @IsString()
  receipt: string;

  @ApiProperty({
    description: 'Additional notes for the order',
    example: { purpose: 'Subscription payment for venue' },
    required: false,
  })
  @IsOptional()
  notes?: string | Record<string, any>;

  @ApiProperty({
    description: 'Additional metadata for the order',
    example: { venueId: '123', subscriptionType: 'monthly' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
