import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { UpdateBillingCycleDto } from './dto/subscription.dto';
import { ReceiptService } from '../payments/services/receipt.service';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly receiptService: ReceiptService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions for the current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all subscriptions for the current user.',
  })
  async findAll(@GetUser() user: any) {
    return this.subscriptionsService.findAllForUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the subscription.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription not found.',
  })
  async findById(@Param('id') id: string, @GetUser() user: any) {
    const subscription = await this.subscriptionsService.findById(id, user.id);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription;
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'Get subscription by organization ID' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the subscription for the organization.',
  })
  async findByOrganizationId(@Param('organizationId') organizationId: string, @GetUser() user: any) {
    return this.subscriptionsService.findByOrganizationId(organizationId, user.id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get subscription summary with usage and billing info' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the subscription summary.',
  })
  async getSummary(@Param('id') id: string, @GetUser() user: any) {
    return this.subscriptionsService.getSubscriptionSummary(id, user.id);
  }

  @Get('organization/:organizationId/summary')
  @ApiOperation({ summary: 'Get subscription summary by organization ID' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the subscription summary for the organization.',
  })
  async getSummaryByOrganization(@Param('organizationId') organizationId: string, @GetUser() user: any) {
    return this.subscriptionsService.getSubscriptionSummaryByOrganization(organizationId, user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription cancelled successfully.',
  })
  async cancel(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.subscriptionsService.cancelSubscription(id, user.id);
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate a cancelled subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription reactivated successfully.',
  })
  async reactivate(@Param('id') id: string, @GetUser() user: any) {
    return this.subscriptionsService.reactivateSubscription(id, user.id);
  }

  @Patch(':id/billing-cycle')
  @ApiOperation({ summary: 'Update subscription billing cycle' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Billing cycle updated successfully.',
  })
  async updateBillingCycle(
    @Param('id') id: string,
    @Body() updateDto: UpdateBillingCycleDto,
    @GetUser() user: any,
  ) {
    return this.subscriptionsService.updateBillingCycle(id, user.id, updateDto.billingCycle);
  }

  @Get(':id/billing-history')
  @ApiOperation({ summary: 'Get billing history for a subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return billing history.',
  })
  async getBillingHistory(@Param('id') id: string, @GetUser() user: any) {
    return this.subscriptionsService.getBillingHistory(id, user.id);
  }

  @Get(':id/upcoming-invoice')
  @ApiOperation({ summary: 'Get upcoming invoice for a subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return upcoming invoice details.',
  })
  async getUpcomingInvoice(@Param('id') id: string, @GetUser() user: any) {
    return this.subscriptionsService.getUpcomingInvoice(id, user.id);
  }

  @Get(':id/payments/:paymentId/receipt/download')
  @ApiOperation({ summary: 'Download receipt PDF for a specific payment' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return receipt PDF file.',
  })
  async downloadReceipt(
    @Param('id') subscriptionId: string,
    @Param('paymentId') paymentId: string,
    @GetUser() user: any,
    @Res() res: FastifyReply,
  ): Promise<void> {
    try {
      // Verify subscription belongs to user
      const subscription = await this.subscriptionsService.findById(subscriptionId, user.id);
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      // Generate PDF with timeout protection
      const pdfBuffer = await Promise.race([
        this.receiptService.generateReceiptPDF(paymentId, user.id),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('PDF generation timeout')), 30000)
        )
      ]);

      // Set response headers for Fastify
      res.header('Content-Type', 'application/pdf');
      res.header('Content-Disposition', `attachment; filename="receipt-${paymentId.substring(0, 8)}.pdf"`);
      res.header('Content-Length', pdfBuffer.length.toString());

      // Send the PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.message === 'PDF generation timeout') {
        throw new NotFoundException('Receipt generation is taking too long. Please try again.');
      }
      if (error.message === 'PDF generation service is busy. Please try again in a moment.') {
        throw new NotFoundException('Service is busy. Please try again in a moment.');
      }
      throw new NotFoundException('Receipt not found or could not be generated');
    }
  }
}
