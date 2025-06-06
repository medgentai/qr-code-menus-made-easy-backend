import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments.service';
import { OrganizationType, BillingCycle, PaymentType, SubscriptionStatus } from '@prisma/client';

export interface CreateOrganizationWithPaymentDto {
  organizationName: string;
  organizationType: OrganizationType;
  planId?: string;
  billingCycle: BillingCycle;
  venueName: string;
  venueDescription?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phoneNumber?: string;
  email?: string;
  imageUrl?: string;
  userId: string;
}

export interface CreateVenueWithPaymentDto {
  organizationId: string;
  billingCycle: BillingCycle;
  venueName: string;
  venueDescription?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phoneNumber?: string;
  email?: string;
  imageUrl?: string;
  userId: string;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async createOrganizationPaymentOrder(dto: CreateOrganizationWithPaymentDto) {
    try {
      this.logger.log(`Creating organization payment order for user: ${dto.userId}`);
      this.logger.log(`Request data: ${JSON.stringify(dto)}`);

      // Get the plan by ID if provided, otherwise by organization type
      let plan;

      if (dto.planId) {
        this.logger.log(`Looking for plan by ID: ${dto.planId}`);
        plan = await this.prisma.plan.findUnique({
          where: {
            id: dto.planId,
            isActive: true,
          },
        });
      } else {
        this.logger.log(`Looking for plan by organization type: ${dto.organizationType}`);
        plan = await this.prisma.plan.findFirst({
          where: {
            organizationType: dto.organizationType,
            isActive: true,
          },
        });
      }

      if (!plan) {
        const errorMsg = dto.planId
          ? `Plan with ID ${dto.planId} not found`
          : `No active plan found for ${dto.organizationType}`;
        this.logger.error(errorMsg);
        throw new NotFoundException(errorMsg);
      }

      this.logger.log(`Found plan: ${plan.name} (${plan.id})`);
      this.logger.log(`Plan prices - Monthly: ${plan.monthlyPrice}, Annual: ${plan.annualPrice}`);

      // Calculate amount based on billing cycle
      const amount = dto.billingCycle === BillingCycle.ANNUAL
        ? plan.annualPrice
        : plan.monthlyPrice;

      // Create payment order (receipt must be <= 40 characters)
      const shortUserId = dto.userId.substring(0, 6); // First 6 chars of UUID
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
      const receipt = `org${timestamp}${shortUserId}`;
      this.logger.log(`Generated receipt: ${receipt} (length: ${receipt.length})`);

      // Prepare metadata for our database
      const paymentMetadata = {
        type: 'ORGANIZATION_SETUP',
        organizationType: String(dto.organizationType),
        billingCycle: String(dto.billingCycle),
        organizationName: String(dto.organizationName),
        venueName: String(dto.venueName),
        venueDescription: String(dto.venueDescription || ''),
        address: String(dto.address || ''),
        city: String(dto.city || ''),
        state: String(dto.state || ''),
        country: String(dto.country || ''),
        postalCode: String(dto.postalCode || ''),
        phoneNumber: String(dto.phoneNumber || ''),
        email: String(dto.email || ''),
        imageUrl: String(dto.imageUrl || ''),
        userId: String(dto.userId),
        planId: String(plan.id),
      };

      const orderData = {
        amount: Number(amount) * 100, // Convert to paise
        currency: 'INR',
        receipt,
        notes: {
          organization: dto.organizationName,
          type: dto.organizationType,
          billing: dto.billingCycle,
          venue: dto.venueName
        },
      };

      this.logger.log(`Creating Razorpay order with data: ${JSON.stringify(orderData)}`);
      const razorpayOrder = await this.paymentsService.createOrder(orderData);
      this.logger.log(`Razorpay order created successfully: ${JSON.stringify(razorpayOrder)}`);

      // Store payment record in database
      await this.prisma.payment.create({
        data: {
          userId: dto.userId,
          amount,
          currency: 'INR',
          paymentMethod: 'CREDIT_CARD', // Will be updated after payment
          paymentType: PaymentType.ORGANIZATION_SETUP,
          razorpayOrderId: razorpayOrder.id,
          receipt,
          notes: JSON.stringify(orderData.notes),
          metadata: paymentMetadata,
        },
      });

      this.logger.log(`Organization payment order created: ${razorpayOrder.id}`);

      return {
        orderId: razorpayOrder.id,
        amount: Number(amount),
        currency: 'INR',
        planDetails: {
          id: plan.id,
          name: plan.name,
          billingCycle: dto.billingCycle,
          venuesIncluded: plan.venuesIncluded,
        },
      };
    } catch (error) {
      this.logger.error('Failed to create organization payment order', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      // Log the specific error for debugging
      if (error.message) {
        this.logger.error(`Specific error: ${error.message}`);
      }

      throw new BadRequestException(
        error.message || 'Failed to create payment order'
      );
    }
  }

  async createVenuePaymentOrder(dto: CreateVenueWithPaymentDto) {
    try {
      // Get organization and its plan
      const organization = await this.prisma.organization.findUnique({
        where: { id: dto.organizationId },
        include: {
          plan: true,
          subscriptions: {
            where: { status: SubscriptionStatus.ACTIVE },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      if (!organization.plan) {
        throw new BadRequestException('Organization does not have an active plan');
      }

      // Check if user has permission to create venues
      const isMember = await this.prisma.organizationMember.findFirst({
        where: {
          organizationId: dto.organizationId,
          userId: dto.userId,
          role: { in: ['OWNER', 'ADMINISTRATOR'] },
        },
      });

      if (!isMember) {
        throw new BadRequestException('You do not have permission to create venues for this organization');
      }

      // Calculate venue price - same as main plan pricing
      let amount = dto.billingCycle === BillingCycle.MONTHLY
        ? Number(organization.plan.monthlyPrice)
        : Number(organization.plan.annualPrice);
      const shortUserId = dto.userId.substring(0, 6); // First 6 chars of UUID
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
      const receipt = `ven${timestamp}${shortUserId}`;
      this.logger.log(`Generated venue receipt: ${receipt} (length: ${receipt.length})`);

      // Prepare metadata for our database
      const venueMetadata = {
        type: 'VENUE_CREATION',
        organizationId: dto.organizationId,
        billingCycle: String(dto.billingCycle),
        venueName: dto.venueName,
        venueDescription: dto.venueDescription,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        postalCode: dto.postalCode,
        phoneNumber: dto.phoneNumber,
        email: dto.email,
        imageUrl: dto.imageUrl,
        userId: dto.userId,
        planId: organization.plan.id,
      };

      const orderData = {
        amount: Number(amount) * 100, // Convert to paise
        currency: 'INR',
        receipt,
        notes: {
          organization: organization.name,
          venue: dto.venueName,
          type: 'VENUE_CREATION',
          plan: organization.plan.name,
          billingCycle: dto.billingCycle
        },
      };

      const razorpayOrder = await this.paymentsService.createOrder(orderData);

      // Store payment record
      await this.prisma.payment.create({
        data: {
          userId: dto.userId,
          organizationId: dto.organizationId,
          amount,
          currency: 'INR',
          paymentMethod: 'CREDIT_CARD',
          paymentType: PaymentType.VENUE_CREATION,
          razorpayOrderId: razorpayOrder.id,
          receipt,
          notes: JSON.stringify(orderData.notes),
          metadata: venueMetadata,
        },
      });

      this.logger.log(`Venue payment order created: ${razorpayOrder.id}`);

      return {
        orderId: razorpayOrder.id,
        amount: Number(amount),
        currency: 'INR',
        organizationName: organization.name,
        planName: organization.plan.name,
        billingCycle: dto.billingCycle,
      };
    } catch (error) {
      this.logger.error('Failed to create venue payment order', error);
      throw new BadRequestException('Failed to create venue payment order');
    }
  }

  async handleSuccessfulOrganizationPayment(paymentId: string, orderId: string, signature: string) {
    try {
      // Verify payment
      const verificationResult = await this.paymentsService.verifyPayment({
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
      });

      if (!verificationResult.success) {
        throw new BadRequestException('Payment verification failed');
      }

      // Get payment record
      const payment = await this.prisma.payment.findFirst({
        where: { razorpayOrderId: orderId },
      });

      if (!payment || !payment.metadata) {
        throw new NotFoundException('Payment record not found');
      }

      const metadata = payment.metadata as any;

      // Update payment record with actual payment method used
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          status: 'COMPLETED',
          paymentMethod: (verificationResult.paymentMethod as any) || payment.paymentMethod, // Use detected method or fallback
        },
      });

      // Create organization and first venue
      const result = await this.prisma.$transaction(async (tx) => {
        // Get the plan to calculate correct amount
        const plan = await tx.plan.findUnique({
          where: { id: metadata.planId },
        });

        if (!plan) {
          throw new NotFoundException('Plan not found');
        }

        // Calculate correct amount based on billing cycle
        const correctAmount = metadata.billingCycle === BillingCycle.ANNUAL
          ? Number(plan.annualPrice)
          : Number(plan.monthlyPrice);

        // Create organization
        const organization = await tx.organization.create({
          data: {
            name: metadata.organizationName,
            slug: this.generateSlug(metadata.organizationName),
            type: metadata.organizationType,
            ownerId: metadata.userId,
            planId: metadata.planId,
            planStartDate: new Date(),
            planEndDate: this.calculatePlanEndDate(metadata.billingCycle),
          },
        });

        // Create subscription with correct amount
        const subscription = await tx.subscription.create({
          data: {
            organizationId: organization.id,
            planId: metadata.planId,
            userId: metadata.userId,
            billingCycle: metadata.billingCycle,
            currentPeriodStart: new Date(),
            currentPeriodEnd: this.calculatePlanEndDate(metadata.billingCycle),
            amount: correctAmount,
            venuesIncluded: 1,
            venuesUsed: 1,
          },
        });

        // Add owner as organization member
        await tx.organizationMember.create({
          data: {
            organizationId: organization.id,
            userId: metadata.userId,
            role: 'OWNER',
          },
        });

        // Create first venue
        const venue = await tx.venue.create({
          data: {
            organizationId: organization.id,
            name: metadata.venueName,
            description: metadata.venueDescription,
            address: metadata.address,
            city: metadata.city,
            state: metadata.state,
            country: metadata.country,
            postalCode: metadata.postalCode,
            phoneNumber: metadata.phoneNumber,
            email: metadata.email,
            imageUrl: metadata.imageUrl,
          },
        });

        // Update payment with organization and subscription IDs
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            organizationId: organization.id,
            subscriptionId: subscription.id,
          },
        });

        return { organization, venue, subscription };
      });

      this.logger.log(`Organization created successfully: ${result.organization.id}`);

      return {
        success: true,
        organization: result.organization,
        venue: result.venue,
        subscription: result.subscription,
      };
    } catch (error) {
      this.logger.error('Failed to handle successful organization payment', error);
      throw new BadRequestException('Failed to process organization creation');
    }
  }

  async handleSuccessfulVenuePayment(paymentId: string, orderId: string, signature: string) {
    try {
      // Verify payment
      const verificationResult = await this.paymentsService.verifyPayment({
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
      });

      if (!verificationResult.success) {
        throw new BadRequestException('Payment verification failed');
      }

      // Get payment record
      const payment = await this.prisma.payment.findFirst({
        where: { razorpayOrderId: orderId },
      });

      if (!payment || !payment.metadata) {
        throw new NotFoundException('Payment record not found');
      }

      const metadata = payment.metadata as any;

      // Update payment record with actual payment method used
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          status: 'COMPLETED',
          paymentMethod: (verificationResult.paymentMethod as any) || payment.paymentMethod, // Use detected method or fallback
        },
      });

      // Create venue and update subscription
      const result = await this.prisma.$transaction(async (tx) => {
        // Get organization
        const organization = await tx.organization.findUnique({
          where: { id: metadata.organizationId },
          include: { plan: true },
        });

        if (!organization) {
          throw new NotFoundException('Organization not found');
        }

        // Create venue
        const venue = await tx.venue.create({
          data: {
            organizationId: metadata.organizationId,
            name: metadata.venueName,
            description: metadata.venueDescription,
            address: metadata.address,
            city: metadata.city,
            state: metadata.state,
            country: metadata.country,
            postalCode: metadata.postalCode,
            phoneNumber: metadata.phoneNumber,
            email: metadata.email,
            imageUrl: metadata.imageUrl,
          },
        });

        // Update subscription to increment venues used
        const subscription = await tx.subscription.findFirst({
          where: {
            organizationId: metadata.organizationId,
            status: 'ACTIVE',
          },
          orderBy: { createdAt: 'desc' },
        });

        if (subscription) {
          await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              venuesUsed: subscription.venuesUsed + 1,
            },
          });
        }

        // Update payment with venue ID
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            venueId: venue.id,
          },
        });

        return { organization, venue, subscription };
      });

      this.logger.log('Venue created successfully after payment');
      return {
        success: true,
        organization: result.organization,
        venue: result.venue,
        subscription: result.subscription
      };
    } catch (error) {
      this.logger.error('Failed to handle successful venue payment', error);
      throw new BadRequestException('Failed to create venue after payment');
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now();
  }

  private calculatePlanEndDate(billingCycle: BillingCycle): Date {
    const now = new Date();
    if (billingCycle === BillingCycle.ANNUAL) {
      return new Date(now.setFullYear(now.getFullYear() + 1));
    } else {
      return new Date(now.setMonth(now.getMonth() + 1));
    }
  }
}
