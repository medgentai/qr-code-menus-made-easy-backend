import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPlansMaster() {
  console.log('🌱 Seeding master plans data...');
  // Delete existing plans to recreate them
  await prisma.plan.deleteMany({});

  // Create Restaurant Plan
  const restaurantPlan = await prisma.plan.create({
    data: {
      name: 'Restaurant Plan',
      description: 'Complete restaurant management solution with digital menu and order management',
      organizationType: 'RESTAURANT',
      monthlyPrice: 799.00,
      annualPrice: 7188.00,
      features: [
        'Digital menu management with categories and items',
        'QR code generation',
        'Table and venue management',
        'Real-time order management and notifications',
        'Staff management with role-based access',
        'Menu scheduling and availability controls',
        'Order tracking and status management',
        'Basic analytics and reporting',
        'Mobile-optimized customer menu interface',
        'Receipt generation and download',
        'Multi-menu support',
        'Real-time WebSocket updates'
      ],
      venuesIncluded: 1,
      isActive: true    }
  });

  // Create Cafe Plan
  const cafePlan = await prisma.plan.create({
    data: {
      name: 'Cafe Plan',
      description: 'Perfect solution for cafes with essential management features',
      organizationType: 'CAFE',
      monthlyPrice: 799.00,
      annualPrice: 7188.00,
      features: [
        'Digital menu management with categories and items',
        'QR code generation',
        'Table and venue management',
        'Real-time order management and notifications',
        'Staff management with role-based access',
        'Menu scheduling and availability controls',
        'Order tracking and status management',
        'Basic analytics and reporting',
        'Mobile-optimized customer menu interface',
        'Receipt generation and download',
        'Time-based menu switching (breakfast, lunch, dinner)',
        'Real-time WebSocket updates'
      ],
      venuesIncluded: 1,
      isActive: true    }
  });

  // Create Bar Plan
  const barPlan = await prisma.plan.create({
    data: {
      name: 'Bar Plan',
      description: 'Comprehensive bar management with beverage-focused features',
      organizationType: 'BAR',
      monthlyPrice: 799.00,
      annualPrice: 7188.00,
      features: [
        'Digital menu management with categories and items',
        'QR code generation',
        'Table and venue management',
        'Real-time order management and notifications',
        'Staff management with role-based access',
        'Menu scheduling and availability controls',
        'Order tracking and status management',
        'Basic analytics and reporting',
        'Mobile-optimized customer menu interface',
        'Receipt generation and download',
        'Party size tracking and table capacity management',
        'Real-time WebSocket updates'
      ],
      venuesIncluded: 1,
      isActive: true    }
  });

  // Create Hotel Plan
  const hotelPlan = await prisma.plan.create({
    data: {
      name: 'Hotel Plan',
      description: 'Enterprise hotel management solution with premium features',
      organizationType: 'HOTEL',
      monthlyPrice: 1699.00,
      annualPrice: 17988.00,
      features: [
        'Digital menu management with categories and items',
        'QR code generation',
        'Table and venue management',
        'Real-time order management and notifications',
        'Staff management with role-based access',
        'Menu scheduling and availability controls',
        'Order tracking and status management',
        'Advanced analytics and reporting',
        'Mobile-optimized customer menu interface',
        'Receipt generation and download',
        'Multi-venue support within organization',
        'Room service order management',
        'Party size tracking and table capacity management',
        'Real-time WebSocket updates',
        'Subscription and billing management',
        'Premium customer support'
      ],
      venuesIncluded: 1,
      isActive: true    }
  });

  // Create Food Truck Plan
  const foodTruckPlan = await prisma.plan.create({
    data: {
      name: 'Food Truck Plan',
      description: 'Mobile food business solution with essential features',
      organizationType: 'FOOD_TRUCK',
      monthlyPrice: 399.00,
      annualPrice: 3588.00, // ₹299/month when paid annually
      features: [
        'Digital menu management with categories and items',
        'QR code generation',
        'Venue management (mobile location tracking)',
        'Real-time order management and notifications',
        'Staff management with role-based access',
        'Menu scheduling and availability controls',
        'Order tracking and status management',
        'Basic analytics and reporting',
        'Mobile-optimized customer menu interface',
        'Receipt generation and download',
        'Quick order processing for mobile service',
        'Real-time WebSocket updates'
      ],
      venuesIncluded: 1,
      isActive: true
    }
  });

  console.log('✅ Master plans seeded successfully');
  console.log(`Created/Updated plans:`);
  console.log(`- Restaurant Plan: ${restaurantPlan.name}`);
  console.log(`- Cafe Plan: ${cafePlan.name}`);
  console.log(`- Bar Plan: ${barPlan.name}`);
  console.log(`- Hotel Plan: ${hotelPlan.name}`);
  console.log(`- Food Truck Plan: ${foodTruckPlan.name}`);
  return {
    restaurantPlan,
    cafePlan,
    barPlan,
    hotelPlan,
    foodTruckPlan
  };
}

// Run if called directly
if (require.main === module) {
  seedPlansMaster()
    .catch((e) => {
      console.error('Error seeding master plans:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
