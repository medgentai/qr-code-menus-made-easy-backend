import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class MarkOrderPaidDto {
  @ApiProperty({
    description: 'Payment method used for the order',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Additional notes about the payment',
    example: 'Customer paid in cash, no change required',
  })
  @IsString()
  @IsOptional()
  paymentNotes?: string;

  @ApiPropertyOptional({
    description: 'Payment amount for validation (should match order total)',
    example: 1250.50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;
}

export class MarkOrderUnpaidDto {
  @ApiPropertyOptional({
    description: 'Reason for marking order as unpaid',
    example: 'Payment was reversed due to customer dispute',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class PaymentStatusResponse {
  @ApiProperty({
    description: 'Current payment status of the order',
    example: 'PAID',
  })
  paymentStatus: string;

  @ApiPropertyOptional({
    description: 'Date and time when the order was marked as paid',
    example: '2023-12-01T14:30:00Z',
  })
  paidAt?: Date | null;

  @ApiPropertyOptional({
    description: 'ID of the staff member who marked the order as paid',
    example: 'user-123',
  })
  paidBy?: string | null;

  @ApiPropertyOptional({
    description: 'Name of the staff member who marked the order as paid',
    example: 'John Doe',
  })
  paidByName?: string | null;

  @ApiPropertyOptional({
    description: 'Payment method used',
    example: 'CASH',
  })
  paymentMethod?: string | null;

  @ApiPropertyOptional({
    description: 'Payment notes',
    example: 'Customer paid in cash',
  })
  paymentNotes?: string | null;

  @ApiProperty({
    description: 'Total amount of the order',
    example: 1250.50,
  })
  totalAmount: number;
}
