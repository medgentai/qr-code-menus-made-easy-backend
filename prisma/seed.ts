import { PrismaClient, UserRole, OrganizationType, MemberRole, TableStatus, OrderStatus, PaymentStatus, PaymentMethod, PaymentType, SubscriptionStatus, BillingCycle } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  
  // Check if we already have users
  const userCount = await prisma.user.count();
  console.log(`📊 Current user count: ${userCount}`);

  if (userCount === 0) {
    console.log('📝 Creating initial data...');

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@scanserve.com',
        name: 'System Admin',
        password: 'Admin123!', // In a real app, this should be hashed
        role: UserRole.ADMIN,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Create demo users
    console.log('👥 Creating demo users...');
    const restaurantOwner = await prisma.user.create({
      data: {
        email: 'restaurant@example.com',
        name: 'Restaurant Owner',
        password: 'Password123!', // In a real app, this should be hashed
        role: UserRole.USER,
        phoneNumber: '+91-9876543210',
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    const hotelOwner = await prisma.user.create({
      data: {
        email: 'hotel@example.com',
        name: 'Hotel Manager',
        password: 'Password123!', // In a real app, this should be hashed
        role: UserRole.USER,
        phoneNumber: '+91-9876543211',
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Create subscription plans
    console.log('📋 Creating subscription plans...');
    const restaurantPlan = await prisma.plan.upsert({
      where: { id: 'restaurant-plan' },
      update: {
        monthlyPrice: 799.00,
        annualPrice: 7188.00,
      },
      create: {
        id: 'restaurant-plan',
        name: 'Restaurant',
        description: 'Perfect for restaurants looking to modernize their menu experience.',
        organizationType: OrganizationType.RESTAURANT,
        monthlyPrice: 799.00,
        annualPrice: 7188.00,
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
    });    const hotelPlan = await prisma.plan.upsert({
      where: { id: 'hotel-plan' },
      update: {
        monthlyPrice: 1699.00,
        annualPrice: 17988.00,
      },
      create: {
        id: 'hotel-plan',
        name: 'Hotel',
        description: 'Ideal for hotels with multiple dining venues and room service.',
        organizationType: OrganizationType.HOTEL,
        monthlyPrice: 1699.00,
        annualPrice: 17988.00,
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
        venuesIncluded: 3,
        isActive: true,
      }
    });

    const cafePlan = await prisma.plan.upsert({
      where: { id: 'cafe-plan' },
      update: {
        monthlyPrice: 799.00,
        annualPrice: 7188.00,
      },
      create: {
        id: 'cafe-plan',
        name: 'Cafe',
        description: 'Perfect for cafes looking to modernize their menu experience.',
        organizationType: OrganizationType.CAFE,
        monthlyPrice: 799.00,
        annualPrice: 7188.00,
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

    const barPlan = await prisma.plan.upsert({
      where: { id: 'bar-plan' },
      update: {
        monthlyPrice: 799.00,
        annualPrice: 7188.00,
      },
      create: {
        id: 'bar-plan',
        name: 'Bar',
        description: 'Perfect for bars looking to modernize their menu experience.',
        organizationType: OrganizationType.BAR,
        monthlyPrice: 799.00,
        annualPrice: 7188.00,
        features: [
          'Unlimited QR code menus',
          'Menu customization',
          'Real-time menu updates',
          'Mobile-friendly design',
          'Basic analytics',
          'Email support',
          'Easy category management',
          'Special drink highlights'
        ],
        venuesIncluded: 1,
        isActive: true,
      }
    });

    const foodTruckPlan = await prisma.plan.upsert({
      where: { id: 'food-truck-plan' },
      update: {
        monthlyPrice: 399.00,
        annualPrice: 3588.00, // 299 * 12 = 3588
      },
      create: {
        id: 'food-truck-plan',
        name: 'Food Truck',
        description: 'Affordable solution for food trucks on the move.',
        organizationType: OrganizationType.FOOD_TRUCK,
        monthlyPrice: 399.00,
        annualPrice: 3588.00, // 299 * 12 = 3588
        features: [
          'QR code menu',
          'Mobile-first design',
          'Basic menu customization',
          'Real-time updates',
          'Location-based features',
          'Basic analytics',
          'Email support'
        ],
        venuesIncluded: 1,
        isActive: true,
      }
    });

    // Create demo restaurant organization
    console.log('🏢 Creating demo organizations...');
    const restaurantOrg = await prisma.organization.create({
      data: {
        name: 'Bistro Deluxe',
        slug: 'bistro-deluxe',
        description: 'Fine dining restaurant with contemporary cuisine',
        type: OrganizationType.RESTAURANT,
        ownerId: restaurantOwner.id,
        planId: restaurantPlan.id,
        planStartDate: new Date(),
        planEndDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        logoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200',
        websiteUrl: 'https://bistrodeluxe.com',
        isActive: true,
      },
    });

    // Create organization members
    await prisma.organizationMember.create({
      data: {
        organizationId: restaurantOrg.id,
        userId: restaurantOwner.id,
        role: MemberRole.OWNER,
      },
    });

    // Create hotel organization
    const hotelOrg = await prisma.organization.create({
      data: {
        name: 'Grand Palace Hotel',
        slug: 'grand-palace-hotel',
        description: 'Luxury hotel with multiple dining venues',
        type: OrganizationType.HOTEL,
        ownerId: hotelOwner.id,
        planId: hotelPlan.id,
        planStartDate: new Date(),
        planEndDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        logoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200',
        websiteUrl: 'https://grandpalacehotel.com',
        isActive: true,
      },
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: hotelOrg.id,
        userId: hotelOwner.id,
        role: MemberRole.OWNER,
      },
    });

    // Create subscriptions
    console.log('💳 Creating subscriptions...');
    const restaurantSubscription = await prisma.subscription.create({
      data: {
        organizationId: restaurantOrg.id,
        planId: restaurantPlan.id,
        userId: restaurantOwner.id,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: BillingCycle.MONTHLY,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        amount: restaurantPlan.monthlyPrice,
        venuesIncluded: restaurantPlan.venuesIncluded,
        venuesUsed: 1,
      },
    });

    const hotelSubscription = await prisma.subscription.create({
      data: {
        organizationId: hotelOrg.id,
        planId: hotelPlan.id,
        userId: hotelOwner.id,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: BillingCycle.ANNUAL,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        amount: hotelPlan.annualPrice,
        venuesIncluded: hotelPlan.venuesIncluded,
        venuesUsed: 2,
      },
    });

    // Create venues
    console.log('🏠 Creating venues...');
    const restaurantVenue = await prisma.venue.create({
      data: {
        organizationId: restaurantOrg.id,
        name: 'Main Dining Hall',
        description: 'Our main dining area with elegant ambiance',
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400001',
        phoneNumber: '+91-22-12345678',
        email: 'dining@bistrodeluxe.com',
        imageUrl: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800',
        isActive: true,
      },
    });

    const hotelRestaurant = await prisma.venue.create({
      data: {
        organizationId: hotelOrg.id,
        name: 'The Royal Restaurant',
        description: 'Fine dining restaurant within the hotel',
        address: '456 Hotel Avenue',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        postalCode: '110001',
        phoneNumber: '+91-11-87654321',
        email: 'restaurant@grandpalacehotel.com',
        imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800',
        isActive: true,
      },
    });

    const hotelRoomService = await prisma.venue.create({
      data: {
        organizationId: hotelOrg.id,
        name: 'Room Service',
        description: '24/7 room service for hotel guests',
        address: '456 Hotel Avenue',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        postalCode: '110001',
        phoneNumber: '+91-11-87654322',
        email: 'roomservice@grandpalacehotel.com',
        imageUrl: 'https://images.unsplash.com/photo-1578898886596-fe2f1b14d60b?w=800',
        isActive: true,
      },
    });    // Create tables
    console.log('🪑 Creating tables...');
    const restaurantTables: any[] = [];
    for (let i = 1; i <= 10; i++) {
      const table = await prisma.table.create({
        data: {
          venueId: restaurantVenue.id,
          name: `Table ${i}`,
          capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
          status: TableStatus.AVAILABLE,
          location: `Dining Area ${Math.ceil(i / 4)}`,
        },
      });
      restaurantTables.push(table);
    }

    // Create menus
    console.log('📋 Creating menus...');
    const restaurantMenu = await prisma.menu.create({
      data: {
        organizationId: restaurantOrg.id,
        name: 'Dinner Menu',
        description: 'Our signature dinner menu featuring contemporary cuisine',
        isActive: true,
      },
    });

    // Create categories and menu items
    console.log('🍽️ Creating menu categories and items...');
    
    // Restaurant menu categories
    const appetizersCategory = await prisma.category.create({
      data: {
        menuId: restaurantMenu.id,
        name: 'Appetizers',
        description: 'Start your meal with our delicious appetizers',
        imageUrl: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400',
        displayOrder: 1,
      },
    });

    const mainCoursesCategory = await prisma.category.create({
      data: {
        menuId: restaurantMenu.id,
        name: 'Main Courses',
        description: 'Our signature main dishes',
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
        displayOrder: 2,
      },
    });

    const dessertsCategory = await prisma.category.create({
      data: {
        menuId: restaurantMenu.id,
        name: 'Desserts',
        description: 'Sweet endings to your perfect meal',
        imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
        displayOrder: 3,
      },
    });

    // Restaurant menu items
    await prisma.menuItem.createMany({
      data: [
        {
          categoryId: appetizersCategory.id,
          name: 'Truffle Arancini',
          description: 'Crispy risotto balls with truffle oil and parmesan',
          price: 850,
          imageUrl: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400',
          preparationTime: 15,
          calories: 320,
          isVegetarian: true,
          displayOrder: 1,
        },
        {
          categoryId: appetizersCategory.id,
          name: 'Seared Scallops',
          description: 'Pan-seared scallops with cauliflower puree',
          price: 1200,
          imageUrl: 'https://images.unsplash.com/photo-1559847844-0ad9a82d6fb0?w=400',
          preparationTime: 20,
          calories: 280,
          displayOrder: 2,
        },
        {
          categoryId: mainCoursesCategory.id,
          name: 'Grilled Salmon',
          description: 'Atlantic salmon with herb crust and seasonal vegetables',
          price: 1800,
          imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
          preparationTime: 25,
          calories: 450,
          displayOrder: 1,
        },
        {
          categoryId: mainCoursesCategory.id,
          name: 'Beef Tenderloin',
          description: 'Prime beef tenderloin with red wine reduction',
          price: 2200,
          imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
          preparationTime: 30,
          calories: 520,
          displayOrder: 2,
        },
        {
          categoryId: dessertsCategory.id,
          name: 'Chocolate Lava Cake',
          description: 'Warm chocolate cake with vanilla ice cream',
          price: 650,
          imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
          preparationTime: 12,
          calories: 420,
          isVegetarian: true,
          displayOrder: 1,
        },
      ],
    });

    // Create QR codes for tables
    console.log('📱 Creating QR codes...');
    for (const table of restaurantTables.slice(0, 5)) {
      await prisma.qrCode.create({
        data: {
          venueId: restaurantVenue.id,
          menuId: restaurantMenu.id,
          tableId: table.id,
          name: `QR Code for ${table.name}`,
          description: `QR code for ${table.name} at Bistro Deluxe`,
          qrCodeUrl: `https://api.scanserve.com/qr/${table.id}.png`,
          qrCodeData: `https://menu.scanserve.com/${restaurantOrg.slug}?table=${table.id}`,
          isActive: true,
        }
      });
    }

    // Create sample orders
    console.log('🛒 Creating sample orders...');
    const sampleOrder1 = await prisma.order.create({
      data: {
        tableId: restaurantTables[0].id,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+91-9876543213',
        status: OrderStatus.COMPLETED,
        totalAmount: 2650,
        notes: 'Please make it medium spicy',
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
    });

    const sampleOrder2 = await prisma.order.create({
      data: {
        tableId: restaurantTables[1].id,
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        customerPhone: '+91-9876543214',
        status: OrderStatus.PREPARING,
        totalAmount: 1850,
        notes: 'No onions please',
      },
    });

    // Get menu items for order items
    const truffleArancini = await prisma.menuItem.findFirst({ where: { name: 'Truffle Arancini' } });
    const grilledSalmon = await prisma.menuItem.findFirst({ where: { name: 'Grilled Salmon' } });
    const searedScallops = await prisma.menuItem.findFirst({ where: { name: 'Seared Scallops' } });
    const chocolateCake = await prisma.menuItem.findFirst({ where: { name: 'Chocolate Lava Cake' } });

    // Create order items
    if (truffleArancini && grilledSalmon && searedScallops && chocolateCake) {
      await prisma.orderItem.createMany({
        data: [
          {
            orderId: sampleOrder1.id,
            menuItemId: truffleArancini.id,
            quantity: 1,
            unitPrice: 850,
            totalPrice: 850,
            status: 'COMPLETED',
          },
          {
            orderId: sampleOrder1.id,
            menuItemId: grilledSalmon.id,
            quantity: 1,
            unitPrice: 1800,
            totalPrice: 1800,
            status: 'COMPLETED',
          },
          {
            orderId: sampleOrder2.id,
            menuItemId: searedScallops.id,
            quantity: 1,
            unitPrice: 1200,
            totalPrice: 1200,
            status: 'PREPARING',
          },
          {
            orderId: sampleOrder2.id,
            menuItemId: chocolateCake.id,
            quantity: 1,
            unitPrice: 650,
            totalPrice: 650,
            status: 'PENDING',
          },
        ],
      });
    }

    // Create sample payments
    console.log('💰 Creating sample payments...');
    await prisma.payment.create({
      data: {
        orderId: sampleOrder1.id,
        userId: restaurantOwner.id,
        amount: 2650,
        paymentMethod: PaymentMethod.UPI,
        status: PaymentStatus.COMPLETED,
        paymentType: PaymentType.ORDER,
        razorpayOrderId: 'order_sample_123',
        razorpayPaymentId: 'pay_sample_123',
        transactionId: 'txn_sample_123',
        receipt: 'receipt_sample_123',
      },
    });

    await prisma.payment.create({
      data: {
        subscriptionId: restaurantSubscription.id,
        organizationId: restaurantOrg.id,
        userId: restaurantOwner.id,
        amount: restaurantPlan.monthlyPrice,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.COMPLETED,
        paymentType: PaymentType.SUBSCRIPTION,
        razorpayOrderId: 'order_sub_123',
        razorpayPaymentId: 'pay_sub_123',
        transactionId: 'txn_sub_123',
        receipt: 'receipt_sub_123',
      },
    });

    console.log('✅ Successfully created comprehensive seed data:');
    console.log(`   - ${await prisma.user.count()} users`);
    console.log(`   - ${await prisma.plan.count()} subscription plans`);
    console.log(`   - ${await prisma.organization.count()} organizations`);
    console.log(`   - ${await prisma.venue.count()} venues`);
    console.log(`   - ${await prisma.table.count()} tables`);
    console.log(`   - ${await prisma.menu.count()} menus`);
    console.log(`   - ${await prisma.category.count()} categories`);
    console.log(`   - ${await prisma.menuItem.count()} menu items`);
    console.log(`   - ${await prisma.qrCode.count()} QR codes`);
    console.log(`   - ${await prisma.order.count()} orders`);
    console.log(`   - ${await prisma.payment.count()} payments`);

  } else {
    console.log('ℹ️  Database already contains users, skipping seed');
  }
}

main()
  .then(() => {
    console.log('✅ Database seeded successfully');
  })
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
