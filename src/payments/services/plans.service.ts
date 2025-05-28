import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrganizationType } from '@prisma/client';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { organizationType: 'asc' },
    });
  }

  async getPlansByOrganizationType(organizationType: OrganizationType) {
    return this.prisma.plan.findMany({
      where: {
        organizationType,
        isActive: true,
      },
    });
  }

  async seedPlans() {
    try {
      // Check if plans already exist
      const existingRestaurantPlan = await this.prisma.plan.findFirst({
        where: {
          name: 'Restaurant Plan',
          organizationType: OrganizationType.RESTAURANT,
        },
      });

      const existingHotelPlan = await this.prisma.plan.findFirst({
        where: {
          name: 'Hotel Plan',
          organizationType: OrganizationType.HOTEL,
        },
      });

      const existingCafePlan = await this.prisma.plan.findFirst({
        where: {
          name: 'Cafe Plan',
          organizationType: OrganizationType.CAFE,
        },
      });

      // Create restaurant plan if it doesn't exist
      const restaurantPlan = existingRestaurantPlan || await this.prisma.plan.create({
        data: {
          name: 'Restaurant Plan',
          description: 'Complete restaurant management solution',
          organizationType: OrganizationType.RESTAURANT,
          monthlyPrice: 799, // ₹799 per month
          annualPrice: 7188, // ₹7188 per year (₹599/month when billed annually)
          features: [
            'Menu Management',
            'QR Code Generation',
            'Order Management',
            'Real-time Updates',
            'Customer Analytics',
            'Multi-table Support',
            'Staff Management',
          ],
          venuesIncluded: 1,
        },
      });

      // Create hotel plan if it doesn't exist
      const hotelPlan = existingHotelPlan || await this.prisma.plan.create({
        data: {
          name: 'Hotel Plan',
          description: 'Comprehensive hotel management solution',
          organizationType: OrganizationType.HOTEL,
          monthlyPrice: 799, // ₹799 per month
          annualPrice: 7188, // ₹7188 per year (₹599/month when billed annually)
          features: [
            'Room Service Management',
            'Menu Management',
            'QR Code Generation',
            'Order Management',
            'Real-time Updates',
            'Guest Analytics',
            'Multi-room Support',
            'Staff Management',
            'Housekeeping Integration',
          ],
          venuesIncluded: 1,
        },
      });

      // Create cafe plan if it doesn't exist
      const cafePlan = existingCafePlan || await this.prisma.plan.create({
        data: {
          name: 'Cafe Plan',
          description: 'Perfect for cafes and small eateries',
          organizationType: OrganizationType.CAFE,
          monthlyPrice: 799, // ₹799 per month
          annualPrice: 7188, // ₹7188 per year (₹599/month when billed annually)
          features: [
            'Menu Management',
            'QR Code Generation',
            'Order Management',
            'Real-time Updates',
            'Basic Analytics',
            'Multi-table Support',
          ],
          venuesIncluded: 1,
        },
      });

      this.logger.log('Plans seeded successfully');
      return { restaurantPlan, hotelPlan, cafePlan };
    } catch (error) {
      this.logger.error('Failed to seed plans', error);
      throw error;
    }
  }
}
