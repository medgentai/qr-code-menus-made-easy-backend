import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  DashboardAnalyticsDto,
  GetAnalyticsQueryDto,
  QrAnalyticsDto,
  RecentOrderDto,
  TopMenuItemDto,
  CustomerStatsDto,
  RevenueStatsDto,
  PeakHourDataDto
} from './dto/dashboard-analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardAnalytics(organizationId: string, queryDto: GetAnalyticsQueryDto): Promise<DashboardAnalyticsDto> {
    const { venueId, days = 1 } = queryDto;

    // Validate that organizationId is actually an organization ID, not a venue ID
    // Check if the provided ID is actually a venue ID by trying to find it as a venue
    const possibleVenue = await this.prisma.venue.findUnique({
      where: { id: organizationId },
      select: { id: true, organizationId: true }
    });

    // If the provided ID is actually a venue ID, use its organization ID instead
    const actualOrganizationId = possibleVenue ? possibleVenue.organizationId : organizationId;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Build where clause for orders - handle both table-based and direct venue orders
    const whereClause: Prisma.OrderWhereInput = {
      OR: [
        // Orders with tables from organization venues
        {
          table: {
            venue: {
              organizationId: actualOrganizationId,
              ...(venueId && { id: venueId })
            }
          }
        },
        // Orders without tables but directly associated with organization venues
        {
          venue: {
            organizationId: actualOrganizationId,
            ...(venueId && { id: venueId })
          },
          tableId: null
        }
      ],
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    // Fetch all analytics data in parallel
    const [
      qrAnalytics,
      recentOrders,
      topItems,
      customerStats,
      revenue,
      peakHours
    ] = await Promise.all([
      this.getQrAnalytics(actualOrganizationId, venueId),
      this.getRecentOrders(whereClause),
      this.getTopMenuItems(whereClause),
      this.getCustomerStats(whereClause),
      this.getRevenueStats(actualOrganizationId, venueId),
      this.getPeakHours()
    ]);

    return {
      qrAnalytics,
      recentOrders,
      topItems,
      customerStats,
      revenue,
      peakHours,
      lastUpdated: new Date().toISOString()
    };
  }

  private async getQrAnalytics(organizationId: string, venueId?: string): Promise<QrAnalyticsDto> {
    // For now, return mock data as QR analytics tracking is not implemented
    return {
      weeklyScans: [],
      totalScans: 0,
      uniqueScans: 0
    };
  }

  private async getRecentOrders(whereClause: Prisma.OrderWhereInput): Promise<RecentOrderDto[]> {
    const orders = await this.prisma.order.findMany({
      where: whereClause,
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    return orders.map(order => ({
      id: order.id,
      customer: order.customerName || 'Anonymous',
      items: order.items.length,
      total: Number(order.totalAmount),
      time: order.createdAt.toISOString(),
      status: order.status
    }));
  }

  private async getTopMenuItems(whereClause: Prisma.OrderWhereInput): Promise<TopMenuItemDto[]> {
    const topItems = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: whereClause
      },
      _count: {
        id: true
      },
      _sum: {
        totalPrice: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    // Get menu item details
    const menuItemIds = topItems.map(item => item.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: {
          in: menuItemIds
        }
      }
    });

    return topItems.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      return {
        name: menuItem?.name || 'Unknown Item',
        orders: item._count.id,
        revenue: Number(item._sum.totalPrice || 0)
      };
    });
  }

  private async getCustomerStats(whereClause: Prisma.OrderWhereInput): Promise<CustomerStatsDto> {
    // Get all orders for the period
    const orders = await this.prisma.order.findMany({
      where: whereClause,
      select: {
        customerPhone: true,
        totalAmount: true
      }
    });

    // Track customers by phone number (as per user preference)
    const customerPhones = new Set<string>();
    let totalRevenue = 0;

    orders.forEach(order => {
      if (order.customerPhone) {
        customerPhones.add(order.customerPhone);
      }
      totalRevenue += Number(order.totalAmount);
    });

    const totalCustomers = customerPhones.size;
    const averageSpend = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    // For simplicity, assume all customers are new for today-only analytics
    // In a real implementation, you'd track customer history
    return {
      new: totalCustomers,
      returning: 0,
      totalToday: totalCustomers,
      averageSpend
    };
  }

  private async getRevenueStats(organizationId: string, venueId?: string): Promise<RevenueStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build base where clause for revenue queries
    const baseWhere: Prisma.OrderWhereInput = {
      OR: [
        {
          table: {
            venue: {
              organizationId,
              ...(venueId && { id: venueId })
            }
          }
        },
        {
          venue: {
            organizationId,
            ...(venueId && { id: venueId })
          },
          tableId: null
        }
      ],
      status: {
        in: ['COMPLETED', 'SERVED']
      }
    };

    // Get today's revenue
    const todayRevenue = await this.prisma.order.aggregate({
      where: {
        ...baseWhere,
        createdAt: {
          gte: today
        }
      },
      _sum: {
        totalAmount: true
      }
    });

    return {
      today: Number(todayRevenue._sum.totalAmount || 0),
      yesterday: 0, // Simplified - only showing today's data as per user preference
      thisWeek: 0,
      lastWeek: 0,
      growth: 0
    };
  }

  private async getPeakHours(): Promise<PeakHourDataDto[]> {
    // For now, return empty array as peak hours analysis is complex
    // In a real implementation, you'd analyze order patterns by hour
    return [];
  }
}
