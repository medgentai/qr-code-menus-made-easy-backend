import { PrismaClient, UserRole, OrganizationType, MemberRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check if we already have users
  const userCount = await prisma.user.count();

  if (userCount === 0) {

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@scanserve.com',
        name: 'System Admin',
        password: 'Admin123!', // In a real app, this should be hashed
        role: UserRole.ADMIN,
      },
    });

    // Create demo users
    const restaurantOwner = await prisma.user.create({
      data: {
        email: 'restaurant@example.com',
        name: 'Restaurant Owner',
        password: 'Password123!', // In a real app, this should be hashed
        role: UserRole.USER,
      },
    });

    const hotelOwner = await prisma.user.create({
      data: {
        email: 'hotel@example.com',
        name: 'Hotel Manager',
        password: 'Password123!', // In a real app, this should be hashed
        role: UserRole.USER,
      },
    });

    // Create subscription plans - Your Original Simple Structure
    const restaurantPlan = await prisma.plan.upsert({
      where: { id: 'restaurant-plan' },
      update: {
        monthlyPrice: 799.00, // ₹799 per month
        annualPrice: 7188.00, // ₹7188 per year (₹599/month when billed annually)
      },
      create: {
        id: 'restaurant-plan',
        name: 'Restaurant / Cafes',
        description: 'Perfect for restaurants looking to modernize their menu experience.',
        organizationType: OrganizationType.RESTAURANT,
        monthlyPrice: 799.00, // ₹799 per month
        annualPrice: 7188.00, // ₹7188 per year (₹599/month when billed annually)
        features: [
          'Unlimited QR code menus',
          'Menu customization',
          'Real-time menu updates',
          'Mobile-friendly design',
          'Basic analytics',
          'Email support',
          'Easy category management',
          'Special dish highlights'
        ],
        venuesIncluded: 1,
        isActive: true,
      }
    });

    const hotelPlan = await prisma.plan.upsert({
      where: { id: 'hotel-plan' },
      update: {
        monthlyPrice: 1699.00, // ₹1699 per month
        annualPrice: 17988.00, // ₹17988 per year (₹1499/month when billed annually)
      },
      create: {
        id: 'hotel-plan',
        name: 'Hotel',
        description: 'Ideal for hotels with multiple dining venues and room service.',
        organizationType: OrganizationType.HOTEL,
         monthlyPrice: 1699.00, // ₹1699 per month
        annualPrice: 17988.00, // ₹17988 per year (₹1499/month when billed annually)
        features: [
          'All Restaurant features',
          'Multiple menu management',
          'Room service integration',
          'Order management system',
          'Customer feedback collection',
          'Enhanced analytics',
          'Priority support',
          'Multi-language support'
        ],
        venuesIncluded: 1,
        isActive: true,
      }
    });

    // Create demo restaurant organization
    const restaurantOrg = await prisma.organization.create({
      data: {
        name: 'Bistro Deluxe',
        slug: 'bistro-deluxe',
        description: 'A fine dining restaurant with modern cuisine',
        type: OrganizationType.RESTAURANT,
        ownerId: restaurantOwner.id,
        planId: restaurantPlan.id,
        planStartDate: new Date(),
        planEndDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        isActive: true,
      }
    });

    // Add owner as member
    await prisma.organizationMember.create({
      data: {
        organizationId: restaurantOrg.id,
        userId: restaurantOwner.id,
        role: MemberRole.OWNER,
      }
    });

    // Create restaurant venue
    const restaurantVenue = await prisma.venue.create({
      data: {
        organizationId: restaurantOrg.id,
        name: 'Bistro Deluxe Main',
        description: 'Main restaurant location',
        address: '123 Gourmet Street',
        city: 'Foodville',
        state: 'CA',
        country: 'USA',
        postalCode: '90210',
        phoneNumber: '555-123-4567',
        email: 'info@bistrodeluxe.com',
      }
    });

    // Create tables
    type TableType = {
      id: string;
      name: string;
      venueId: string;
      capacity: number;
      status: string;
      location: string | null;
      createdAt: Date;
      updatedAt: Date;
    };

    const tables: TableType[] = [];
    for (let i = 1; i <= 10; i++) {
      const table = await prisma.table.create({
        data: {
          venueId: restaurantVenue.id,
          name: `Table ${i}`,
          capacity: 4,
          status: 'AVAILABLE',
        }
      });
      tables.push(table as unknown as TableType);
    }

    // Create demo menu
    const restaurantMenu = await prisma.menu.create({
      data: {
        organizationId: restaurantOrg.id,
        name: 'Main Menu',
        description: 'Our regular dining menu',
        isActive: true,
      }
    });

    // Create menu categories
    const appetizerCategory = await prisma.category.create({
      data: {
        menuId: restaurantMenu.id,
        name: 'Appetizers',
        description: 'Start your meal with these delicious options',
        displayOrder: 1,
      }
    });

    const mainCourseCategory = await prisma.category.create({
      data: {
        menuId: restaurantMenu.id,
        name: 'Main Courses',
        description: 'Hearty entrees for your dining pleasure',
        displayOrder: 2,
      }
    });

    const dessertCategory = await prisma.category.create({
      data: {
        menuId: restaurantMenu.id,
        name: 'Desserts',
        description: 'Sweet treats to finish your meal',
        displayOrder: 3,
      }
    });

    // Create menu items
    await prisma.menuItem.create({
      data: {
        categoryId: appetizerCategory.id,
        name: 'Bruschetta',
        description: 'Toasted bread topped with tomatoes, garlic, and basil',
        price: 9.99,
        isVegetarian: true,
        displayOrder: 1,
      }
    });

    await prisma.menuItem.create({
      data: {
        categoryId: appetizerCategory.id,
        name: 'Calamari',
        description: 'Crispy fried squid served with lemon aioli',
        price: 12.99,
        displayOrder: 2,
      }
    });

    await prisma.menuItem.create({
      data: {
        categoryId: mainCourseCategory.id,
        name: 'Filet Mignon',
        description: '8oz premium beef tenderloin with red wine reduction',
        price: 34.99,
        displayOrder: 1,
      }
    });

    await prisma.menuItem.create({
      data: {
        categoryId: mainCourseCategory.id,
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon with lemon butter sauce',
        price: 26.99,
        displayOrder: 2,
      }
    });

    await prisma.menuItem.create({
      data: {
        categoryId: dessertCategory.id,
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with a molten center',
        price: 8.99,
        displayOrder: 1,
      }
    });

    // Create demo hotel organization
    const hotelOrg = await prisma.organization.create({
      data: {
        name: 'Grand Plaza Hotel',
        slug: 'grand-plaza-hotel',
        description: 'A luxury hotel with exceptional service',
        type: OrganizationType.HOTEL,
        ownerId: hotelOwner.id,
        planId: hotelPlan.id,
        planStartDate: new Date(),
        planEndDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        isActive: true,
      }
    });

    // Add owner as member
    await prisma.organizationMember.create({
      data: {
        organizationId: hotelOrg.id,
        userId: hotelOwner.id,
        role: MemberRole.OWNER,
      }
    });

    // Create hotel venue
    const hotelVenue = await prisma.venue.create({
      data: {
        organizationId: hotelOrg.id,
        name: 'Grand Plaza Main',
        description: 'Main hotel building',
        address: '456 Luxury Avenue',
        city: 'Resortville',
        state: 'FL',
        country: 'USA',
        postalCode: '33139',
        phoneNumber: '555-987-6543',
        email: 'info@grandplaza.com',
      }
    });

    // Create QR codes for tables
    for (const table of tables) {
      await prisma.qrCode.create({
        data: {
          venueId: restaurantVenue.id,
          menuId: restaurantMenu.id,
          tableId: table.id,
          name: `QR for ${table.name}`,
          description: `QR code for ${table.name}`,
          qrCodeUrl: `https://api.scanserve.com/qr/${table.id}.png`,
          qrCodeData: `https://menu.scanserve.com/${restaurantOrg.slug}?table=${table.id}`,
          isActive: true,
        }
      });
    }

  }
}

main()
  .catch(() => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
