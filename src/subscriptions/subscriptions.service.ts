import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingCycle, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            organizationType: true,
            monthlyPrice: true,
            annualPrice: true,
            features: true,
            venuesIncluded: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string, userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            organizationType: true,
            monthlyPrice: true,
            annualPrice: true,
            features: true,
            venuesIncluded: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async findByOrganizationId(organizationId: string, userId: string) {
    // First check if user has access to this organization
    const organization = await this.prisma.organization.findFirst({
      where: {
        id: organizationId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
    });

    if (!organization) {
      throw new ForbiddenException('Access denied to this organization');
    }

    return this.prisma.subscription.findFirst({
      where: { organizationId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            organizationType: true,
            monthlyPrice: true,
            annualPrice: true,
            features: true,
            venuesIncluded: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getSubscriptionSummary(subscriptionId: string, userId: string) {
    const subscription = await this.findById(subscriptionId, userId);

    // Calculate usage
    const venuesUsed = subscription.venuesUsed;
    const venuesIncluded = subscription.venuesIncluded;
    const venuesRemaining = Math.max(0, venuesIncluded - venuesUsed);
    const usagePercentage = venuesIncluded > 0 ? Math.round((venuesUsed / venuesIncluded) * 100) : 0;

    // Calculate billing info
    const nextBillingDate = subscription.currentPeriodEnd;
    const lastBillingDate = subscription.currentPeriodStart;

    // Check if trial is active
    const now = new Date();
    const isTrialActive = subscription.trialEnd ? now < subscription.trialEnd : false;
    const trialDaysRemaining = subscription.trialEnd
      ? Math.max(0, Math.ceil((subscription.trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : undefined;

    return {
      subscription,
      usage: {
        venuesUsed,
        venuesIncluded,
        venuesRemaining,
        usagePercentage,
      },
      billing: {
        nextBillingDate: nextBillingDate.toISOString(),
        lastBillingDate: lastBillingDate.toISOString(),
        amount: Number(subscription.amount),
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
      },
      isTrialActive,
      trialDaysRemaining,
      canUpgrade: subscription.status === SubscriptionStatus.ACTIVE,
      canDowngrade: subscription.status === SubscriptionStatus.ACTIVE,
      canCancel: subscription.status === SubscriptionStatus.ACTIVE && !subscription.cancelAtPeriodEnd,
    };
  }

  async getSubscriptionSummaryByOrganization(organizationId: string, userId: string) {
    const subscription = await this.findByOrganizationId(organizationId, userId);

    if (!subscription) {
      return null;
    }

    return this.getSubscriptionSummary(subscription.id, userId);
  }

  async cancelSubscription(subscriptionId: string, userId: string) {
    const subscription = await this.findById(subscriptionId, userId);

    // Always cancel at period end - subscription remains active until current period ends
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: true,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            organizationType: true,
            monthlyPrice: true,
            annualPrice: true,
            features: true,
            venuesIncluded: true,
          },
        },
      },
    });
  }

  async reactivateSubscription(subscriptionId: string, userId: string) {
    const subscription = await this.findById(subscriptionId, userId);

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            organizationType: true,
            monthlyPrice: true,
            annualPrice: true,
            features: true,
            venuesIncluded: true,
          },
        },
      },
    });
  }

  async updateBillingCycle(subscriptionId: string, userId: string, billingCycle: BillingCycle) {
    const subscription = await this.findById(subscriptionId, userId);

    // Calculate new amount based on billing cycle
    const plan = subscription.plan;
    const newAmount = billingCycle === BillingCycle.MONTHLY
      ? Number(plan.monthlyPrice)
      : Number(plan.annualPrice);

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        billingCycle,
        amount: newAmount,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            organizationType: true,
            monthlyPrice: true,
            annualPrice: true,
            features: true,
            venuesIncluded: true,
          },
        },
      },
    });
  }

  async getBillingHistory(subscriptionId: string, userId: string) {
    const subscription = await this.findById(subscriptionId, userId);

    // Get payment history for this subscription and organization
    const payments = await this.prisma.payment.findMany({
      where: {
        OR: [
          {
            // Direct subscription payments
            metadata: {
              path: ['subscriptionId'],
              equals: subscriptionId,
            },
          },
          {
            // Organization and venue payments
            organizationId: subscription.organizationId,
            status: 'COMPLETED',
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Format the billing history
    return payments.map(payment => ({
      id: payment.id,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      paymentType: payment.paymentType,
      paymentMethod: payment.paymentMethod,
      razorpayPaymentId: payment.razorpayPaymentId,
      razorpayOrderId: payment.razorpayOrderId,
      receipt: payment.receipt,
      notes: payment.notes,
      createdAt: payment.createdAt,
      organization: payment.organization,
      venue: payment.venue,
      metadata: payment.metadata,
      description: this.getPaymentDescription(payment),
    }));
  }

  private getPaymentDescription(payment: any): string {
    const metadata = payment.metadata as any;

    if (payment.paymentType === 'ORGANIZATION_SETUP') {
      return `Organization setup - ${payment.organization?.name || 'Unknown'}`;
    } else if (payment.paymentType === 'VENUE_CREATION') {
      return `New venue - ${payment.venue?.name || metadata?.venueName || 'Unknown'}`;
    } else if (payment.paymentType === 'SUBSCRIPTION_RENEWAL') {
      return `Subscription renewal - ${metadata?.billingCycle || 'Monthly'}`;
    } else {
      return `Payment - ${payment.paymentType || 'Unknown'}`;
    }
  }

  async getUpcomingInvoice(subscriptionId: string, userId: string) {
    const subscription = await this.findById(subscriptionId, userId);

    // Calculate upcoming invoice details
    const nextBillingDate = subscription.currentPeriodEnd;
    const amount = Number(subscription.amount);

    return {
      subscriptionId,
      amount,
      currency: subscription.currency,
      billingDate: nextBillingDate.toISOString(),
      description: `${subscription.plan.name} - ${subscription.billingCycle.toLowerCase()} billing`,
      items: [
        {
          description: subscription.plan.name,
          quantity: 1,
          unitPrice: amount,
          totalPrice: amount,
        },
      ],
    };
  }
}
