import { PrismaClient, OrganizationType, TaxType, ServiceType } from '@prisma/client';

const prisma = new PrismaClient();

// Sample organizations for different types
const sampleOrganizations = [
  {
    name: 'The Grand Restaurant',
    slug: 'grand-restaurant',
    description: 'Fine dining restaurant with multiple locations',
    type: OrganizationType.RESTAURANT,
    ownerId: 'sample-user-1', // This would be a real user ID in production
  },
  {
    name: 'Luxury Palace Hotel',
    slug: 'luxury-palace-hotel',
    description: 'Premium hotel with restaurant services',
    type: OrganizationType.HOTEL,
    ownerId: 'sample-user-2',
  },
  {
    name: 'Coffee Corner Cafe',
    slug: 'coffee-corner-cafe',
    description: 'Cozy neighborhood cafe',
    type: OrganizationType.CAFE,
    ownerId: 'sample-user-3',
  },
  {
    name: 'Street Food Truck',
    slug: 'street-food-truck',
    description: 'Mobile food service',
    type: OrganizationType.FOOD_TRUCK,
    ownerId: 'sample-user-4',
  },
  {
    name: 'The Sports Bar',
    slug: 'sports-bar',
    description: 'Sports bar with food and drinks',
    type: OrganizationType.BAR,
    ownerId: 'sample-user-5',
  },
];

// Comprehensive tax configurations for all organization types
const taxConfigurations = [
  // Restaurant configurations
  {
    name: 'Restaurant GST - Dine In',
    description: 'Standard GST rate for restaurant dine-in service',
    organizationType: OrganizationType.RESTAURANT,
    taxType: TaxType.GST,
    taxRate: 5.0,
    isDefault: true,
    isActive: true,
    isTaxExempt: false,
    isPriceInclusive: false,
    serviceType: ServiceType.DINE_IN,
  },
  {
    name: 'Restaurant GST - Takeaway',
    description: 'Standard GST rate for restaurant takeaway service',
    organizationType: OrganizationType.RESTAURANT,
    taxType: TaxType.GST,
    taxRate: 5.0,
    isDefault: false,
    isActive: true,
    isTaxExempt: false,
    isPriceInclusive: false,
    serviceType: ServiceType.TAKEAWAY,
  },
  {
    name: 'Restaurant GST - Delivery',
    description: 'Standard GST rate for restaurant delivery service',
    organizationType: OrganizationType.RESTAURANT,
    taxType: TaxType.GST,
    taxRate: 5.0,
    isDefault: false,
    isActive: true,
    isTaxExempt: false,
    isPriceInclusive: false,
    serviceType: ServiceType.DELIVERY,
  },

  // Hotel configurations
  {
    name: 'Hotel GST - Standard',
    description: 'Standard GST rate for hotels with room tariff < ₹7,500',
    organizationType: OrganizationType.HOTEL,
    taxType: TaxType.GST,
    taxRate: 5.0,
    isDefault: true,
    isActive: true,
    isTaxExempt: false,
    isPriceInclusive: false,
    serviceType: ServiceType.DINE_IN,
  },
  {
    name: 'Hotel GST - Premium',
    description: 'Higher GST rate for hotels with room tariff ≥ ₹7,500',
    organizationType: OrganizationType.HOTEL,
    taxType: TaxType.GST,
    taxRate: 18.0,
    isDefault: false,
    isActive: true,
    isTaxExempt: false,
    isPriceInclusive: false,
    serviceType: ServiceType.DINE_IN,
  },
  {
    name: 'Hotel GST - Room Service',
    description: 'GST rate for hotel room service',
    organizationType: OrganizationType.HOTEL,
    taxType: TaxType.GST,
    taxRate: 18.0,
    isDefault: false,
    isActive: true,
    isTaxExempt: false,
    isPriceInclusive: false,
    serviceType: ServiceType.DELIVERY,
  },

  // Cafe configurations
  {
    name: 'Cafe GST - All Services',
    description: 'Standard GST rate for cafe services',
    organizationType: OrganizationType.CAFE,
    taxType: TaxType.GST,
    taxRate: 5.0,
    isDefault: true,
    isActive: true,
    isTaxExempt: false,
    isPriceInclusive: false,
    serviceType: ServiceType.ALL,
  },
  {
    name: 'Cafe GST - Tax Inclusive',
    description: 'Tax inclusive pricing for cafes',
    organizationType: OrganizationType.CAFE,
    taxType: TaxType.GST,
    taxRate: 5.0,
    isDefault: false,
    isActive: true,
    isTaxExempt: false,
    isPriceInclusive: true,
    serviceType: ServiceType.ALL,
  },

  // Food Truck configurations
  {
    name: 'Food Truck GST',
    description: 'Standard GST rate for food truck services',
    organizationType: OrganizationType.FOOD_TRUCK,
    taxType: TaxType.GST,
    taxRate: 5.0,
    isDefault: true,
    isActive: true,
    isTaxExempt: false,
    isPriceInclusive: false,
    serviceType: ServiceType.ALL,
  },
  {
    name: 'Food Truck - Tax Exempt',
    description: 'Tax exempt configuration for small food trucks',
    organizationType: OrganizationType.FOOD_TRUCK,
    taxType: TaxType.GST,
    taxRate: 0.0,
    isDefault: false,
    isActive: true,
    isTaxExempt: true,
    isPriceInclusive: false,
    serviceType: ServiceType.ALL,
  },

  // Bar configurations
  {
    name: 'Bar GST - Food & Beverages',
    description: 'Higher GST rate for establishments serving alcohol',
    organizationType: OrganizationType.BAR,
    taxType: TaxType.GST,
    taxRate: 18.0,
    isDefault: true,
    isActive: true,
    isTaxExempt: false,
    isPriceInclusive: false,
    serviceType: ServiceType.ALL,
  },
  {
    name: 'Bar GST - Food Only',
    description: 'Standard GST rate for food items in bars',
    organizationType: OrganizationType.BAR,
    taxType: TaxType.GST,
    taxRate: 5.0,
    isDefault: false,
    isActive: true,
    isTaxExempt: false,
    isPriceInclusive: false,
    serviceType: ServiceType.DINE_IN,
  },
];

async function createSampleUser(email: string, name: string) {
  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: 'hashed_password_placeholder', // In real app, this would be properly hashed
        role: 'USER',
        status: 'ACTIVE',
        isEmailVerified: true,
      },
    });
    return user.id;
  } catch (error) {
    // User might already exist, try to find them
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    return existingUser?.id || null;
  }
}

async function main() {
  console.log('🌱 Starting comprehensive tax system seeding...');

  // Create sample users first
  const userIds: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const userId = await createSampleUser(
      `sample-user-${i}@example.com`,
      `Sample User ${i}`
    );
    if (userId) {
      userIds.push(userId);
    }
  }

  console.log(`✅ Created/found ${userIds.length} sample users`);

  // Create sample organizations
  const createdOrganizations: any[] = [];
  for (let i = 0; i < sampleOrganizations.length; i++) {
    const orgData = sampleOrganizations[i];
    const userId = userIds[i] || userIds[0]; // Fallback to first user if not enough users

    try {
      // Check if organization already exists
      const existingOrg = await prisma.organization.findUnique({
        where: { slug: orgData.slug },
      });

      if (existingOrg) {
        console.log(`⏭️  Organization '${orgData.name}' already exists, skipping...`);
        createdOrganizations.push(existingOrg);
        continue;
      }

      const organization = await prisma.organization.create({
        data: {
          ...orgData,
          ownerId: userId,
        },
      });

      // Add the owner as a member with OWNER role
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: userId,
          role: 'OWNER',
        },
      });

      createdOrganizations.push(organization);
      console.log(`✅ Created organization: ${organization.name} (${organization.type})`);
    } catch (error: any) {
      console.error(`❌ Failed to create organization ${orgData.name}:`, error.message);
    }
  }

  console.log(`\n📊 Created ${createdOrganizations.length} organizations`);

  // Create tax configurations for each organization
  let totalTaxConfigs = 0;
  for (const organization of createdOrganizations) {
    console.log(`\n🏢 Setting up tax configurations for: ${organization.name}`);

    // Get relevant tax configurations for this organization type
    const relevantConfigs = taxConfigurations.filter(
      config => config.organizationType === organization.type
    );

    for (const config of relevantConfigs) {
      try {
        // Check if configuration already exists
        const existing = await prisma.taxConfiguration.findFirst({
          where: {
            organizationId: organization.id,
            name: config.name,
            organizationType: config.organizationType,
            taxType: config.taxType,
            serviceType: config.serviceType,
          },
        });

        if (!existing) {
          await prisma.taxConfiguration.create({
            data: {
              ...config,
              organizationId: organization.id,
            },
          });
          console.log(`  ✅ ${config.name}`);
          totalTaxConfigs++;
        } else {
          console.log(`  ⏭️  ${config.name} (already exists)`);
        }
      } catch (error: any) {
        console.error(`  ❌ Failed to create ${config.name}:`, error.message);
      }
    }
  }

  console.log(`\n🎉 Tax system seeding completed!`);
  console.log(`📈 Summary:`);
  console.log(`   - Organizations: ${createdOrganizations.length}`);
  console.log(`   - Tax Configurations: ${totalTaxConfigs}`);
  console.log(`   - Organization Types: ${new Set(createdOrganizations.map(o => o.type)).size}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
