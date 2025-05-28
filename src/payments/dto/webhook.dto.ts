import { IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WebhookDto {
  @ApiProperty({
    description: 'Webhook event type',
    example: 'payment.captured',
  })
  @IsString()
  event: string;

  @ApiProperty({
    description: 'Account ID from Razorpay',
    example: 'acc_BFQ7uQEaa30PNf',
  })
  @IsString()
  account_id: string;

  @ApiProperty({
    description: 'Entity data from webhook',
    example: {
      entity: 'event',
      account_id: 'acc_BFQ7uQEaa30PNf',
      event: 'payment.captured',
      contains: ['payment'],
      payload: {
        payment: {
          entity: {
            id: 'pay_IluGWxBm9U8zJ8',
            amount: 50000,
            currency: 'INR',
            status: 'captured',
            order_id: 'order_IluGWxBm9U8zJ8',
          },
        },
      },
    },
  })
  @IsObject()
  payload: any;

  @ApiProperty({
    description: 'Webhook creation timestamp',
    example: 1234567890,
    required: false,
  })
  @IsOptional()
  created_at?: number;
}
