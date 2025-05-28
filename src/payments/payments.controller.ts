import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PaymentsService } from './payments.service';
import { WebhookService } from './webhooks/webhook.service';
import { SubscriptionService } from './services/subscription.service';
import { CreatePaymentOrderDto, PaymentVerificationDto } from './dto';
import {
  CreateOrganizationPaymentDto,
  CreateVenuePaymentDto,
  CompleteOrganizationPaymentDto,
  CompleteVenuePaymentDto
} from './dto/subscription.dto';
import { RazorpayOrder, RazorpayPayment, PaymentResponse } from './entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly webhookService: WebhookService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new payment order' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: Object,
  })
  async createOrder(@Body() createOrderDto: CreatePaymentOrderDto): Promise<RazorpayOrder> {
    return this.paymentsService.createOrder(createOrderDto);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment signature' })
  @ApiResponse({
    status: 200,
    description: 'Payment verification result',
    type: Object,
  })
  async verifyPayment(@Body() verificationDto: PaymentVerificationDto): Promise<PaymentResponse> {
    return this.paymentsService.verifyPayment(verificationDto);
  }

  @Get('payment/:paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch payment details' })
  @ApiResponse({
    status: 200,
    description: 'Payment details retrieved successfully',
    type: Object,
  })
  async getPayment(@Param('paymentId') paymentId: string): Promise<RazorpayPayment> {
    return this.paymentsService.fetchPayment(paymentId);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch order details' })
  @ApiResponse({
    status: 200,
    description: 'Order details retrieved successfully',
    type: Object,
  })
  async getOrder(@Param('orderId') orderId: string): Promise<RazorpayOrder> {
    return this.paymentsService.fetchOrder(orderId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Razorpay webhooks' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ): Promise<{ success: boolean; message: string }> {
    const body = req.rawBody?.toString() || JSON.stringify(req.body);
    return this.webhookService.handleWebhook(body, signature);
  }

  @Get('config')
  @Public()
  @ApiOperation({ summary: 'Get Razorpay configuration for frontend' })
  @ApiResponse({
    status: 200,
    description: 'Razorpay configuration retrieved successfully',
  })
  async getConfig(): Promise<{ key_id: string }> {
    return {
      key_id: this.paymentsService['razorpayConfig'].getKeyId(),
    };
  }

  // Subscription endpoints
  @Post('organization/create-order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment order for organization setup' })
  @ApiResponse({
    status: 201,
    description: 'Organization payment order created successfully',
  })
  async createOrganizationPaymentOrder(
    @Body() dto: CreateOrganizationPaymentDto,
    @GetUser() user: any,
  ) {
    return this.subscriptionService.createOrganizationPaymentOrder({
      ...dto,
      userId: user.id,
    });
  }

  @Post('organization/complete-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete organization payment and create organization' })
  @ApiResponse({
    status: 200,
    description: 'Organization created successfully',
  })
  async completeOrganizationPayment(
    @Body() dto: CompleteOrganizationPaymentDto,
  ) {
    return this.subscriptionService.handleSuccessfulOrganizationPayment(
      dto.razorpay_payment_id,
      dto.razorpay_order_id,
      dto.razorpay_signature,
    );
  }

  @Post('venue/create-order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment order for new venue' })
  @ApiResponse({
    status: 201,
    description: 'Venue payment order created successfully',
  })
  async createVenuePaymentOrder(
    @Body() dto: CreateVenuePaymentDto,
    @GetUser() user: any,
  ) {
    return this.subscriptionService.createVenuePaymentOrder({
      ...dto,
      userId: user.id,
    });
  }

  @Post('venue/complete-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete venue payment and create venue' })
  @ApiResponse({
    status: 200,
    description: 'Venue created successfully',
  })
  async completeVenuePayment(
    @Body() dto: CompleteVenuePaymentDto,
  ) {
    return this.subscriptionService.handleSuccessfulVenuePayment(
      dto.razorpay_payment_id,
      dto.razorpay_order_id,
      dto.razorpay_signature,
    );
  }
}
