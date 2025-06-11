import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

// Helper function to convert Decimal to number
function toNumber(value: number | Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

@Injectable()
export class PlatformAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getPlatformAnalytics(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalRevenue,
      totalOrders,
      totalUsers,
      totalOrganizations,
      activeUsers,
      activeOrganizations,
      dailyStats,
    ] = await Promise.all([
      this.getTotalRevenue(startDate),
      this.getTotalOrders(startDate),
      this.getTotalUsers(startDate),
      this.getTotalOrganizations(startDate),
      this.getActiveUsers(startDate),
      this.getActiveOrganizations(startDate),
      this.getDailyStats(startDate),
    ]);

    return {
      period: {
        days,
        startDate,
        endDate: new Date(),
      },
      overview: {
        totalRevenue: toNumber(totalRevenue),
        totalOrders: Number(totalOrders),
        totalUsers: Number(totalUsers),
        totalOrganizations: Number(totalOrganizations),
        activeUsers: Number(activeUsers),
        activeOrganizations: Number(activeOrganizations),
      },
      dailyStats,
      lastUpdated: new Date(),
    };
  }

  async getRevenueAnalytics(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get revenue by subscription plans
    const subscriptionRevenue = await this.prisma.subscription.groupBy({
      by: ['planId'],
      where: {
        createdAt: { gte: startDate },
        status: 'ACTIVE',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Get daily revenue
    const dailyRevenue = await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        SUM(amount) as revenue,
        COUNT(*) as transactions
      FROM subscriptions 
      WHERE created_at >= ${startDate}
        AND status = 'ACTIVE'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Convert BigInt values to numbers
    const convertedSubscriptionRevenue = subscriptionRevenue.map(item => ({
      ...item,
      _sum: {
        amount: toNumber(item._sum.amount),
      },
      _count: Number(item._count),
    }));

    const convertedDailyRevenue = Array.isArray(dailyRevenue) ? dailyRevenue.map((item: any) => ({
      ...item,
      revenue: toNumber(item.revenue),
      transactions: Number(item.transactions),
    })) : [];

    return {
      period: { days, startDate, endDate: new Date() },
      subscriptionRevenue: convertedSubscriptionRevenue,
      dailyRevenue: convertedDailyRevenue,
      lastUpdated: new Date(),
    };
  }

  async getGrowthMetrics(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    const [currentPeriod, previousPeriod] = await Promise.all([
      this.getPeriodMetrics(startDate, new Date()),
      this.getPeriodMetrics(previousStartDate, startDate),
    ]);

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      period: { days, startDate, endDate: new Date() },
      growth: {
        users: calculateGrowth(currentPeriod.users, previousPeriod.users),
        organizations: calculateGrowth(currentPeriod.organizations, previousPeriod.organizations),
        orders: calculateGrowth(currentPeriod.orders, previousPeriod.orders),
        revenue: calculateGrowth(toNumber(currentPeriod.revenue), toNumber(previousPeriod.revenue)),
      },
      currentPeriod,
      previousPeriod,
      lastUpdated: new Date(),
    };
  }

  async getTopOrganizations(limit: number) {
    // Get organizations with their venue and order counts
    const organizations = await this.prisma.organization.findMany({
      take: limit,
      include: {
        _count: {
          select: {
            venues: true,
            members: true,
          },
        },
        venues: {
          include: {
            _count: {
              select: {
                orders: true,
              },
            },
            orders: {
              select: {
                totalAmount: true,
              },
            },
          },
        },
      },
    });

    // Calculate metrics for each organization
    const organizationsWithMetrics = organizations.map((org) => {
      const totalOrders = org.venues.reduce((sum, venue) => sum + Number(venue._count.orders), 0);
      const totalRevenue = org.venues.reduce((sum, venue) =>
        sum + venue.orders.reduce((orderSum, order) => orderSum + toNumber(order.totalAmount), 0), 0
      );

      return {
        id: org.id,
        name: org.name,
        type: org.type,
        totalOrders: Number(totalOrders),
        totalVenues: Number(org._count.venues),
        totalMembers: Number(org._count.members),
        totalRevenue: Number(totalRevenue),
        createdAt: org.createdAt,
      };
    });

    // Sort by total orders and return
    return organizationsWithMetrics
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, limit);
  }

  private async getTotalRevenue(startDate: Date) {
    const result = await this.prisma.subscription.aggregate({
      where: {
        createdAt: { gte: startDate },
        status: 'ACTIVE',
      },
      _sum: { amount: true },
    });
    return toNumber(result._sum.amount);
  }

  private async getTotalOrders(startDate: Date) {
    const count = await this.prisma.order.count({
      where: { createdAt: { gte: startDate } },
    });
    return Number(count);
  }

  private async getTotalUsers(startDate: Date) {
    const count = await this.prisma.user.count({
      where: { createdAt: { gte: startDate } },
    });
    return Number(count);
  }

  private async getTotalOrganizations(startDate: Date) {
    const count = await this.prisma.organization.count({
      where: { createdAt: { gte: startDate } },
    });
    return Number(count);
  }

  private async getActiveUsers(startDate: Date) {
    const count = await this.prisma.user.count({
      where: {
        lastLoginAt: { gte: startDate },
        status: 'ACTIVE',
      },
    });
    return Number(count);
  }

  private async getActiveOrganizations(startDate: Date) {
    const count = await this.prisma.organization.count({
      where: {
        isActive: true,
        venues: {
          some: {
            orders: {
              some: {
                createdAt: { gte: startDate },
              },
            },
          },
        },
      },
    });
    return Number(count);
  }

  private async getDailyStats(startDate: Date) {
    const dailyStats = await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN table_name = 'users' THEN 1 END) as new_users,
        COUNT(CASE WHEN table_name = 'organizations' THEN 1 END) as new_organizations,
        COUNT(CASE WHEN table_name = 'orders' THEN 1 END) as new_orders
      FROM (
        SELECT created_at, 'users' as table_name FROM users WHERE created_at >= ${startDate}
        UNION ALL
        SELECT created_at, 'organizations' as table_name FROM organizations WHERE created_at >= ${startDate}
        UNION ALL
        SELECT created_at, 'orders' as table_name FROM orders WHERE created_at >= ${startDate}
      ) combined
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    return dailyStats;
  }

  private async getPeriodMetrics(startDate: Date, endDate: Date) {
    const [users, organizations, orders, revenue] = await Promise.all([
      this.prisma.user.count({
        where: {
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.organization.count({
        where: {
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      this.prisma.subscription.aggregate({
        where: {
          createdAt: { gte: startDate, lt: endDate },
          status: 'ACTIVE',
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      users: Number(users),
      organizations: Number(organizations),
      orders: Number(orders),
      revenue: toNumber(revenue._sum.amount),
    };
  }
}
