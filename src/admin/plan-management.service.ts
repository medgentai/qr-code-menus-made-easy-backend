import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto, GetPlansDto, GetPlanOrganizationsDto } from './dto/plan-management.dto';
import { OrganizationType, BillingCycle } from '@prisma/client';

@Injectable()
export class PlanManagementService {
  constructor(private prisma: PrismaService) {}

  async getPlanStats() {
    const [
      totalPlans,
      activePlans,
      totalOrganizations,
      totalSubscriptions,
      planUsageStats,
    ] = await Promise.all([
      this.prisma.plan.count(),
      this.prisma.plan.count({ where: { isActive: true } }),
      this.prisma.organization.count({ where: { planId: { not: null } } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.getPlanUsageByType(),
    ]);

    const revenueData = await this.calculateRevenue();

    return {
      totalPlans: Number(totalPlans),
      activePlans: Number(activePlans),
      totalOrganizations: Number(totalOrganizations),
      totalSubscriptions: Number(totalSubscriptions),
      monthlyRevenue: revenueData.monthlyRevenue,
      annualRevenue: revenueData.annualRevenue,
      plansByType: planUsageStats,
    };
  }

  async getPlans(params: GetPlansDto) {
    const { page = 1, limit = 20, search, organizationType, isActive } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (organizationType) {
      where.organizationType = organizationType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [plans, total] = await Promise.all([
      this.prisma.plan.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              organizations: true,
              subscriptions: {
                where: { status: 'ACTIVE' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.plan.count({ where }),
    ]);

    const plansWithCounts = plans.map(plan => ({
      ...plan,
      monthlyPrice: Number(plan.monthlyPrice),
      annualPrice: Number(plan.annualPrice),
      organizationCount: plan._count.organizations,
      subscriptionCount: plan._count.subscriptions,
    }));

    return {
      plans: plansWithCounts,
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            organizations: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return {
      ...plan,
      monthlyPrice: Number(plan.monthlyPrice),
      annualPrice: Number(plan.annualPrice),
      organizationCount: plan._count.organizations,
      subscriptionCount: plan._count.subscriptions,
    };
  }

  async createPlan(createDto: CreatePlanDto) {
    // Check if plan with same name and organization type already exists
    const existingPlan = await this.prisma.plan.findFirst({
      where: {
        name: createDto.name,
        organizationType: createDto.organizationType,
      },
    });

    if (existingPlan) {
      throw new ConflictException('Plan with this name already exists for this organization type');
    }

    return this.prisma.plan.create({
      data: {
        ...createDto,
        venuesIncluded: createDto.venuesIncluded || 1,
        isActive: createDto.isActive ?? true,
      },
      include: {
        _count: {
          select: {
            organizations: true,
            subscriptions: true,
          },
        },
      },
    });
  }

  async updatePlan(id: string, updateDto: UpdatePlanDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Check for name conflicts if name is being updated
    if (updateDto.name && updateDto.name !== plan.name) {
      const existingPlan = await this.prisma.plan.findFirst({
        where: {
          name: updateDto.name,
          organizationType: updateDto.organizationType || plan.organizationType,
          id: { not: id },
        },
      });

      if (existingPlan) {
        throw new ConflictException('Plan with this name already exists for this organization type');
      }
    }

    return this.prisma.plan.update({
      where: { id },
      data: updateDto,
      include: {
        _count: {
          select: {
            organizations: true,
            subscriptions: true,
          },
        },
      },
    });
  }

  async deletePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            organizations: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Check if plan has active subscriptions or organizations
    if (plan._count.organizations > 0 || plan._count.subscriptions > 0) {
      throw new ConflictException('Cannot delete plan with active organizations or subscriptions');
    }

    await this.prisma.plan.delete({ where: { id } });

    return { message: 'Plan deleted successfully' };
  }

  async togglePlanStatus(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return this.prisma.plan.update({
      where: { id },
      data: { isActive: !plan.isActive },
      include: {
        _count: {
          select: {
            organizations: true,
            subscriptions: true,
          },
        },
      },
    });
  }

  private async getPlanUsageByType() {
    const organizationTypes = Object.values(OrganizationType);
    const usageByType = {};

    for (const type of organizationTypes) {
      const [planCount, orgCount, subCount] = await Promise.all([
        this.prisma.plan.count({ where: { organizationType: type, isActive: true } }),
        this.prisma.organization.count({ where: { type, planId: { not: null } } }),
        this.prisma.subscription.count({
          where: {
            status: 'ACTIVE',
            organization: { type },
          },
        }),
      ]);

      const revenue = await this.calculateRevenueByType(type);

      usageByType[type] = {
        plans: Number(planCount),
        organizations: Number(orgCount),
        subscriptions: Number(subCount),
        revenue: revenue,
      };
    }

    return usageByType;
  }

  private async calculateRevenue() {
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: {
        plan: {
          select: {
            monthlyPrice: true,
            annualPrice: true,
          },
        },
      },
    });

    let monthlyRevenue = 0;
    let annualRevenue = 0;

    for (const subscription of activeSubscriptions) {
      if (subscription.billingCycle === BillingCycle.MONTHLY) {
        monthlyRevenue += Number(subscription.plan.monthlyPrice);
      } else if (subscription.billingCycle === BillingCycle.ANNUAL) {
        annualRevenue += Number(subscription.plan.annualPrice);
      }
    }

    return {
      monthlyRevenue,
      annualRevenue,
    };
  }

  private async calculateRevenueByType(organizationType: OrganizationType) {
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        organization: { type: organizationType },
      },
      include: {
        plan: {
          select: {
            monthlyPrice: true,
            annualPrice: true,
          },
        },
      },
    });

    let monthlyRevenue = 0;
    let annualRevenue = 0;

    for (const subscription of activeSubscriptions) {
      if (subscription.billingCycle === BillingCycle.MONTHLY) {
        monthlyRevenue += Number(subscription.plan.monthlyPrice);
      } else if (subscription.billingCycle === BillingCycle.ANNUAL) {
        annualRevenue += Number(subscription.plan.annualPrice);
      }
    }

    return {
      monthlyRevenue,
      annualRevenue,
      totalRevenue: monthlyRevenue + annualRevenue,
    };
  }



  // Plan Usage and Analytics
  async getPlanUsage(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        organizationType: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const [
      totalOrganizations,
      activeOrganizations,
      totalSubscriptions,
      monthlySubscriptions,
      annualSubscriptions,
    ] = await Promise.all([
      this.prisma.organization.count({ where: { planId: id } }),
      this.prisma.organization.count({ where: { planId: id, isActive: true } }),
      this.prisma.subscription.count({ where: { planId: id } }),
      this.prisma.subscription.count({
        where: { planId: id, billingCycle: BillingCycle.MONTHLY, status: 'ACTIVE' },
      }),
      this.prisma.subscription.count({
        where: { planId: id, billingCycle: BillingCycle.ANNUAL, status: 'ACTIVE' },
      }),
    ]);

    const revenue = await this.calculateRevenueByPlan(id);

    return {
      plan,
      usage: {
        totalOrganizations: Number(totalOrganizations),
        activeOrganizations: Number(activeOrganizations),
        totalSubscriptions: Number(totalSubscriptions),
        monthlySubscriptions: Number(monthlySubscriptions),
        annualSubscriptions: Number(annualSubscriptions),
      },
      revenue,
    };
  }

  private async calculateRevenueByPlan(planId: string) {
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: {
        planId,
        status: 'ACTIVE',
      },
      include: {
        plan: {
          select: {
            monthlyPrice: true,
            annualPrice: true,
          },
        },
      },
    });

    let monthlyRevenue = 0;
    let annualRevenue = 0;

    for (const subscription of activeSubscriptions) {
      if (subscription.billingCycle === BillingCycle.MONTHLY) {
        monthlyRevenue += Number(subscription.plan.monthlyPrice);
      } else if (subscription.billingCycle === BillingCycle.ANNUAL) {
        annualRevenue += Number(subscription.plan.annualPrice);
      }
    }

    return {
      monthlyRevenue,
      annualRevenue,
      totalRevenue: monthlyRevenue + annualRevenue,
    };
  }

  async getPlanOrganizations(id: string, query: GetPlanOrganizationsDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const plan = await this.prisma.plan.findUnique({ where: { id } });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where: { planId: id },
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              venues: true,
              members: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count({ where: { planId: id } }),
    ]);

    const organizationsWithCounts = organizations.map(org => ({
      ...org,
      venueCount: org._count.venues,
      memberCount: org._count.members,
    }));

    return {
      organizations: organizationsWithCounts,
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }
}
