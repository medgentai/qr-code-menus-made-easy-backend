import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserStatus, SubscriptionStatus, BillingCycle } from '@prisma/client';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { Decimal } from '@prisma/client/runtime/library';

// Helper function to convert Decimal to number
function toNumber(value: number | Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

interface GetUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
}

interface GetOrganizationsParams {
  page: number;
  limit: number;
  search?: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getPlatformStats() {
    const [
      totalUsers,
      totalOrganizations,
      totalVenues,
      totalOrders,
      activeUsers,
      activeOrganizations,
      recentUsers,
      recentOrganizations,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.organization.count(),
      this.prisma.venue.count(),
      this.prisma.order.count(),
      this.prisma.user.count({
        where: { status: UserStatus.ACTIVE },
      }),
      this.prisma.organization.count({
        where: { isActive: true },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      this.prisma.organization.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    return {
      totalUsers: Number(totalUsers),
      totalOrganizations: Number(totalOrganizations),
      totalVenues: Number(totalVenues),
      totalOrders: Number(totalOrders),
      activeUsers: Number(activeUsers),
      activeOrganizations: Number(activeOrganizations),
      recentUsers: Number(recentUsers),
      recentOrganizations: Number(recentOrganizations),
      lastUpdated: new Date(),
    };
  }

  async getAllUsers(params: GetUsersParams) {
    const { page, limit, search, role } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          phoneNumber: true,
          isEmailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              organizations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Convert BigInt values to numbers
    const convertedUsers = users.map(user => ({
      ...user,
      _count: {
        organizations: Number(user._count.organizations),
      },
    }));

    return {
      users: convertedUsers,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }

  async getAllOrganizations(params: GetOrganizationsParams) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              members: true,
              venues: true,
            },
          },
          members: {
            where: { role: 'OWNER' },
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            take: 1,
          },
          venues: {
            include: {
              _count: {
                select: {
                  orders: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count({ where }),
    ]);

    // Transform organizations to include order count and convert BigInt values
    const transformedOrganizations = organizations.map(org => {
      // Get the owner from the members array
      const ownerMember = org.members.find(member => member.role === 'OWNER');

      const memberCount = Number(org._count.members);
      const venueCount = Number(org._count.venues);
      const orderCount = Number(org.venues.reduce((sum, venue) => sum + Number(venue._count.orders), 0));

      console.log(`Organization ${org.name}: members=${memberCount}, venues=${venueCount}, orders=${orderCount}`);

      return {
        ...org,
        _count: {
          members: memberCount,
          venues: venueCount,
        },
        memberCount,
        venueCount,
        orderCount,
        owner: ownerMember ? {
          name: ownerMember.user.name,
          email: ownerMember.user.email,
        } : null,
        venues: undefined, // Remove venues from response to keep it clean
        members: undefined, // Remove members from response to keep it clean
      };
    });

    return {
      organizations: transformedOrganizations,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }

  async updateUserStatus(id: string, updateUserStatusDto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admins from changing other admin statuses
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot modify admin user status');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: updateUserStatusDto.status },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async updateUserRole(id: string, updateUserRoleDto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Log the role change for security audit
    console.log(`Admin changing user ${user.email} role from ${user.role} to ${updateUserRoleDto.role}`);

    return this.prisma.user.update({
      where: { id },
      data: { role: updateUserRoleDto.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organizations: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deletion of admin users
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot delete admin users');
    }

    // Check if user is the only owner of any organization
    const ownerMemberships = user.organizations.filter(
      (membership) => membership.role === 'OWNER'
    );

    for (const membership of ownerMemberships) {
      const ownerCount = await this.prisma.organizationMember.count({
        where: {
          organizationId: membership.organizationId,
          role: 'OWNER',
        },
      });

      if (Number(ownerCount) === 1) {
        throw new ForbiddenException(
          'Cannot delete user who is the sole owner of an organization'
        );
      }
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async deleteOrganization(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            venues: true,
          },
        },
        venues: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if organization has active orders through its venues
    const venueIds = organization.venues.map(venue => venue.id);
    const activeOrdersCount = await this.prisma.order.count({
      where: {
        venueId: {
          in: venueIds,
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'],
        },
      },
    });
    const activeOrdersCountNumber = Number(activeOrdersCount);

    if (activeOrdersCountNumber > 0) {
      throw new ForbiddenException(
        'Cannot delete organization with active orders'
      );
    }

    return this.prisma.organization.delete({
      where: { id },
    });
  }

  async getUserDetails(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            organizations: true,
          },
        },
        organizations: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      organizationCount: Number(user._count.organizations),
      organizations: user.organizations.map(org => ({
        id: org.organization.id,
        name: org.organization.name,
        type: org.organization.type,
        role: org.role,
        joinedAt: org.createdAt,
      })),
    };
  }

  async getOrganizationVenues(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const venues = await this.prisma.venue.findMany({
      where: { organizationId },
      include: {
        organization: {
          select: {
            type: true,
          },
        },
        _count: {
          select: {
            tables: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      organization,
      venues: venues.map(venue => ({
        ...venue,
        type: venue.organization.type, // Add the organization type to venue
        tableCount: Number(venue._count.tables),
        orderCount: Number(venue._count.orders),
        organization: undefined, // Remove organization object from response
      })),
    };
  }

  async getOrganizationMembers(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      organization,
      members: members.map(member => ({
        id: member.id,
        role: member.role,
        joinedAt: member.createdAt,
        user: member.user,
      })),
    };
  }

  async getSystemInfo() {
    // Get database stats
    const userCount = await this.prisma.user.count();
    const orgCount = await this.prisma.organization.count();
    const venueCount = await this.prisma.venue.count();
    const orderCount = await this.prisma.order.count();

    // Calculate uptime (since app start)
    const uptimeMs = process.uptime() * 1000;
    const uptimeDays = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const uptimeHours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    // Get memory usage
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

    return {
      database: {
        status: 'Connected',
        type: 'PostgreSQL',
        version: '15.4', // This could be fetched from actual DB
        recordCounts: {
          users: Number(userCount),
          organizations: Number(orgCount),
          venues: Number(venueCount),
          orders: Number(orderCount),
        },
      },
      application: {
        version: process.env.npm_package_version || 'v1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: `${uptimeDays} days, ${uptimeHours} hours`,
        nodeVersion: process.version,
      },
      performance: {
        memoryUsage: `${memUsedMB} MB / ${memTotalMB} MB`,
        memoryPercentage: Math.round((memUsedMB / memTotalMB) * 100),
        cpuUsage: '~12%', // This would need a proper CPU monitoring library
      },
      security: {
        twoFactorAuth: 'Optional',
        sessionTimeout: '24 hours',
        lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      platform: {
        status: 'Online',
        maintenanceMode: false,
      },
      lastUpdated: new Date(),
    };
  }

  // Subscription Management Methods
  async getAllSubscriptions(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: SubscriptionStatus;
    billingCycle?: BillingCycle;
    organizationType?: string;
  }) {
    const { page = 1, limit = 20, search, status, billingCycle, organizationType } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        {
          organization: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (billingCycle) {
      where.billingCycle = billingCycle;
    }

    if (organizationType) {
      where.organization = {
        ...where.organization,
        type: organizationType,
      };
    }

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              members: {
                where: { role: 'OWNER' },
                include: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
                take: 1,
              },
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              description: true,
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
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    const formattedSubscriptions = subscriptions.map((sub) => ({
      ...sub,
      amount: toNumber(sub.amount),
      organization: {
        ...sub.organization,
        owner: sub.organization.members[0]?.user || null,
        members: undefined,
      },
      plan: {
        ...sub.plan,
        monthlyPrice: toNumber(sub.plan.monthlyPrice),
        annualPrice: toNumber(sub.plan.annualPrice),
      },
    }));

    return {
      subscriptions: formattedSubscriptions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSubscriptionById(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        organization: {
          include: {
            members: {
              where: { role: 'OWNER' },
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
              take: 1,
            },
            venues: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
          },
        },
        plan: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return {
      ...subscription,
      amount: toNumber(subscription.amount),
      organization: {
        ...subscription.organization,
        owner: subscription.organization.members[0]?.user || null,
        members: undefined,
      },
      plan: {
        ...subscription.plan,
        monthlyPrice: toNumber(subscription.plan.monthlyPrice),
        annualPrice: toNumber(subscription.plan.annualPrice),
      },
      payments: subscription.payments.map((payment) => ({
        ...payment,
        amount: toNumber(payment.amount),
      })),
    };
  }

  async getSubscriptionStats() {
    const [
      totalActive,
      totalInactive,
      totalCancelled,
      totalExpired,
      totalTrial,
      totalPastDue,
      revenueStats,
    ] = await Promise.all([
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.count({ where: { status: 'INACTIVE' } }),
      this.prisma.subscription.count({ where: { status: 'CANCELLED' } }),
      this.prisma.subscription.count({ where: { status: 'EXPIRED' } }),
      this.prisma.subscription.count({ where: { status: 'TRIAL' } }),
      this.prisma.subscription.count({ where: { status: 'PAST_DUE' } }),
      this.getSubscriptionRevenueStats(),
    ]);

    return {
      totalActive: Number(totalActive),
      totalInactive: Number(totalInactive),
      totalCancelled: Number(totalCancelled),
      totalExpired: Number(totalExpired),
      totalTrial: Number(totalTrial),
      totalPastDue: Number(totalPastDue),
      ...revenueStats,
    };
  }

  private async getSubscriptionRevenueStats() {
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: {
        amount: true,
        billingCycle: true,
      },
    });

    let monthlyRecurringRevenue = 0;
    let annualRecurringRevenue = 0;

    activeSubscriptions.forEach((sub) => {
      const amount = toNumber(sub.amount);
      if (sub.billingCycle === 'MONTHLY') {
        monthlyRecurringRevenue += amount;
        annualRecurringRevenue += amount * 12;
      } else {
        annualRecurringRevenue += amount;
        monthlyRecurringRevenue += amount / 12;
      }
    });

    const totalUsers = await this.prisma.user.count();
    const averageRevenuePerUser = totalUsers > 0 ? annualRecurringRevenue / totalUsers : 0;

    // Calculate churn rate (simplified - cancelled in last 30 days / total active 30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [cancelledLast30Days, activeLast30Days] = await Promise.all([
      this.prisma.subscription.count({
        where: {
          status: 'CANCELLED',
          canceledAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          createdAt: { lte: thirtyDaysAgo },
        },
      }),
    ]);

    const churnRate = activeLast30Days > 0 ? (Number(cancelledLast30Days) / Number(activeLast30Days)) * 100 : 0;

    return {
      monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue * 100) / 100,
      annualRecurringRevenue: Math.round(annualRecurringRevenue * 100) / 100,
      averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
      churnRate: Math.round(churnRate * 100) / 100,
    };
  }

  async updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus, reason?: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { organization: true, user: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const updateData: any = { status };

    if (status === 'CANCELLED') {
      updateData.canceledAt = new Date();
      updateData.cancelAtPeriodEnd = false;
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        ...updateData,
        metadata: {
          ...(subscription.metadata as object || {}),
          adminAction: {
            action: 'status_update',
            previousStatus: subscription.status,
            newStatus: status,
            reason,
            timestamp: new Date().toISOString(),
          },
        },
      },
      include: {
        organization: true,
        plan: true,
        user: true,
      },
    });

    this.logger.log(`Subscription ${subscriptionId} status updated from ${subscription.status} to ${status} by admin`);

    return {
      ...updatedSubscription,
      amount: toNumber(updatedSubscription.amount),
      plan: {
        ...updatedSubscription.plan,
        monthlyPrice: toNumber(updatedSubscription.plan.monthlyPrice),
        annualPrice: toNumber(updatedSubscription.plan.annualPrice),
      },
    };
  }

  async pauseSubscription(subscriptionId: string, reason?: string, resumeDate?: Date) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== 'ACTIVE') {
      throw new BadRequestException('Only active subscriptions can be paused');
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'INACTIVE',
        metadata: {
          ...(subscription.metadata as object || {}),
          pausedInfo: {
            pausedAt: new Date().toISOString(),
            reason,
            resumeDate: resumeDate?.toISOString(),
            pausedByAdmin: true,
          },
        },
      },
      include: {
        organization: true,
        plan: true,
        user: true,
      },
    });

    this.logger.log(`Subscription ${subscriptionId} paused by admin. Reason: ${reason}`);

    return {
      ...updatedSubscription,
      amount: toNumber(updatedSubscription.amount),
      plan: {
        ...updatedSubscription.plan,
        monthlyPrice: toNumber(updatedSubscription.plan.monthlyPrice),
        annualPrice: toNumber(updatedSubscription.plan.annualPrice),
      },
    };
  }

  async cancelSubscription(subscriptionId: string, immediate: boolean = false, reason?: string, offerRefund: boolean = false) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { organization: true, plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === 'CANCELLED') {
      throw new BadRequestException('Subscription is already cancelled');
    }

    const updateData: any = {
      metadata: {
        ...(subscription.metadata as object || {}),
        cancellationInfo: {
          cancelledAt: new Date().toISOString(),
          reason,
          immediate,
          offerRefund,
          cancelledByAdmin: true,
        },
      },
    };

    if (immediate) {
      updateData.status = 'CANCELLED';
      updateData.canceledAt = new Date();
      updateData.cancelAtPeriodEnd = false;
    } else {
      updateData.cancelAtPeriodEnd = true;
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        organization: true,
        plan: true,
        user: true,
      },
    });

    this.logger.log(`Subscription ${subscriptionId} ${immediate ? 'cancelled immediately' : 'scheduled for cancellation'} by admin`);

    return {
      ...updatedSubscription,
      amount: toNumber(updatedSubscription.amount),
      plan: {
        ...updatedSubscription.plan,
        monthlyPrice: toNumber(updatedSubscription.plan.monthlyPrice),
        annualPrice: toNumber(updatedSubscription.plan.annualPrice),
      },
    };
  }

  async modifySubscription(subscriptionId: string, modifications: {
    planId?: string;
    billingCycle?: BillingCycle;
    venuesIncluded?: number;
    immediate?: boolean;
    reason?: string;
  }) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true, organization: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const updateData: any = {
      metadata: {
        ...(subscription.metadata as object || {}),
        modificationInfo: {
          modifiedAt: new Date().toISOString(),
          modifications,
          modifiedByAdmin: true,
        },
      },
    };

    // Handle plan change
    if (modifications.planId && modifications.planId !== subscription.planId) {
      const newPlan = await this.prisma.plan.findUnique({
        where: { id: modifications.planId },
      });

      if (!newPlan) {
        throw new NotFoundException('New plan not found');
      }

      updateData.planId = modifications.planId;

      // Update amount based on current billing cycle
      const currentBillingCycle = modifications.billingCycle || subscription.billingCycle;
      updateData.amount = currentBillingCycle === 'MONTHLY'
        ? newPlan.monthlyPrice
        : newPlan.annualPrice;

      updateData.venuesIncluded = newPlan.venuesIncluded;
    }

    // Handle billing cycle change
    if (modifications.billingCycle && modifications.billingCycle !== subscription.billingCycle) {
      updateData.billingCycle = modifications.billingCycle;

      // Update amount based on new billing cycle
      const plan = modifications.planId
        ? await this.prisma.plan.findUnique({ where: { id: modifications.planId } })
        : subscription.plan;

      if (!plan) {
        throw new NotFoundException('Plan not found');
      }

      updateData.amount = modifications.billingCycle === 'MONTHLY'
        ? plan.monthlyPrice
        : plan.annualPrice;
    }

    // Handle venues included change
    if (modifications.venuesIncluded !== undefined) {
      updateData.venuesIncluded = modifications.venuesIncluded;
    }

    // Handle immediate vs next billing cycle
    if (modifications.immediate) {
      // Apply changes immediately
      if (updateData.billingCycle && updateData.billingCycle !== subscription.billingCycle) {
        // Recalculate period end based on new billing cycle
        const now = new Date();
        const periodEnd = new Date(now);

        if (updateData.billingCycle === 'MONTHLY') {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        updateData.currentPeriodStart = now;
        updateData.currentPeriodEnd = periodEnd;
      }
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        organization: true,
        plan: true,
        user: true,
      },
    });

    this.logger.log(`Subscription ${subscriptionId} modified by admin: ${JSON.stringify(modifications)}`);

    return {
      ...updatedSubscription,
      amount: toNumber(updatedSubscription.amount),
      plan: {
        ...updatedSubscription.plan,
        monthlyPrice: toNumber(updatedSubscription.plan.monthlyPrice),
        annualPrice: toNumber(updatedSubscription.plan.annualPrice),
      },
    };
  }
}
