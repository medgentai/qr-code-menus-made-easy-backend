import { IsString, IsEnum, IsOptional, IsUUID, IsEmail, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrganizationType, BillingCycle } from '@prisma/client';

export class CreateOrganizationPaymentDto {
  @ApiProperty({
    description: 'Name of the organization',
    example: 'My Restaurant',
  })
  @IsString()
  organizationName: string;

  @ApiProperty({
    description: 'Type of organization',
    enum: OrganizationType,
    example: OrganizationType.RESTAURANT,
  })
  @IsEnum(OrganizationType)
  organizationType: OrganizationType;

  @ApiProperty({
    description: 'Plan ID for the subscription',
    example: 'restaurant-plan',
    required: false,
  })
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiProperty({
    description: 'Billing cycle for the subscription',
    enum: BillingCycle,
    example: BillingCycle.MONTHLY,
  })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiProperty({
    description: 'Name of the first venue',
    example: 'Main Branch',
  })
  @IsString()
  venueName: string;

  @ApiProperty({
    description: 'Description of the first venue',
    example: 'Our main restaurant location',
    required: false,
  })
  @IsString()
  @IsOptional()
  venueDescription?: string;

  @ApiProperty({
    description: 'Address of the first venue',
    example: '123 Main Street',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'City of the first venue',
    example: 'New York',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'State/Province of the first venue',
    example: 'NY',
    required: false,
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    description: 'Country of the first venue',
    example: 'USA',
    required: false,
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'Postal code of the first venue',
    example: '10001',
    required: false,
  })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({
    description: 'Phone number of the first venue',
    example: '+1-555-123-4567',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Email of the first venue',
    example: 'venue@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Image URL of the first venue',
    example: 'https://example.com/venue.jpg',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}

export class CreateVenuePaymentDto {
  @ApiProperty({
    description: 'Organization ID',
    example: 'uuid-string',
  })
  @IsUUID()
  organizationId: string;

  @ApiProperty({
    description: 'Billing cycle for the venue',
    enum: BillingCycle,
    example: BillingCycle.MONTHLY,
  })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiProperty({
    description: 'Name of the new venue',
    example: 'Second Branch',
  })
  @IsString()
  venueName: string;

  @ApiProperty({
    description: 'Description of the new venue',
    example: 'Our second restaurant location',
    required: false,
  })
  @IsString()
  @IsOptional()
  venueDescription?: string;

  @ApiProperty({
    description: 'Address of the venue',
    example: '123 Main Street',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'City of the venue',
    example: 'New York',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'State/Province of the venue',
    example: 'NY',
    required: false,
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    description: 'Country of the venue',
    example: 'USA',
    required: false,
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'Postal code of the venue',
    example: '10001',
    required: false,
  })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({
    description: 'Phone number of the venue',
    example: '+1-555-123-4567',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Email of the venue',
    example: 'venue@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Image URL of the venue',
    example: 'https://example.com/venue.jpg',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}

export class CompleteOrganizationPaymentDto {
  @ApiProperty({
    description: 'Razorpay payment ID',
    example: 'pay_IluGWxBm9U8zJ8',
  })
  @IsString()
  razorpay_payment_id: string;

  @ApiProperty({
    description: 'Razorpay order ID',
    example: 'order_IluGWxBm9U8zJ8',
  })
  @IsString()
  razorpay_order_id: string;

  @ApiProperty({
    description: 'Razorpay signature for verification',
    example: '9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d',
  })
  @IsString()
  razorpay_signature: string;
}

export class CompleteVenuePaymentDto {
  @ApiProperty({
    description: 'Razorpay payment ID',
    example: 'pay_IluGWxBm9U8zJ8',
  })
  @IsString()
  razorpay_payment_id: string;

  @ApiProperty({
    description: 'Razorpay order ID',
    example: 'order_IluGWxBm9U8zJ8',
  })
  @IsString()
  razorpay_order_id: string;

  @ApiProperty({
    description: 'Razorpay signature for verification',
    example: '9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d',
  })
  @IsString()
  razorpay_signature: string;
}
