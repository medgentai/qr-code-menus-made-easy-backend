import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentVerificationDto {
  @ApiProperty({
    description: 'Razorpay order ID',
    example: 'order_IluGWxBm9U8zJ8',
  })
  @IsString()
  razorpay_order_id: string;

  @ApiProperty({
    description: 'Razorpay payment ID',
    example: 'pay_IluGWxBm9U8zJ8',
  })
  @IsString()
  razorpay_payment_id: string;

  @ApiProperty({
    description: 'Razorpay signature for verification',
    example: '9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d',
  })
  @IsString()
  razorpay_signature: string;
}
