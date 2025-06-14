import { PrismaClient, OrganizationType, TaxType, ServiceType } from '@prisma/client';

const prisma = new PrismaClient();

export const defaultTaxConfigurations = [
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

  // Cafe configurations
  {
    name: 'Cafe GST',
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

  // Bar configurations
  {
    name: 'Bar GST',
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

  // Tax-exempt configurations for each organization type
  {
    name: 'Restaurant - Tax Exempt',
    description: 'Tax exempt configuration for restaurants',
    organizationType: OrganizationType.RESTAURANT,
    taxType: TaxType.GST,
    taxRate: 0.0,
    isDefault: false,
    isActive: true,
    isTaxExempt: true,
    isPriceInclusive: false,
    serviceType: ServiceType.ALL,
  },
  {
    name: 'Hotel - Tax Exempt',
    description: 'Tax exempt configuration for hotels',
    organizationType: OrganizationType.HOTEL,
    taxType: TaxType.GST,
    taxRate: 0.0,
    isDefault: false,
    isActive: true,
    isTaxExempt: true,
    isPriceInclusive: false,
    serviceType: ServiceType.ALL,
  },
  {
    name: 'Cafe - Tax Exempt',
    description: 'Tax exempt configuration for cafes',
    organizationType: OrganizationType.CAFE,
    taxType: TaxType.GST,
    taxRate: 0.0,
    isDefault: false,
    isActive: true,
    isTaxExempt: true,
    isPriceInclusive: false,
    serviceType: ServiceType.ALL,
  },
  {
    name: 'Food Truck - Tax Exempt',
    description: 'Tax exempt configuration for food trucks',
    organizationType: OrganizationType.FOOD_TRUCK,
    taxType: TaxType.GST,
    taxRate: 0.0,
    isDefault: false,
    isActive: true,
    isTaxExempt: true,
    isPriceInclusive: false,
    serviceType: ServiceType.ALL,
  },
  {
    name: 'Bar - Tax Exempt',
    description: 'Tax exempt configuration for bars',
    organizationType: OrganizationType.BAR,
    taxType: TaxType.GST,
    taxRate: 0.0,
    isDefault: false,
    isActive: true,
    isTaxExempt: true,
    isPriceInclusive: false,
    serviceType: ServiceType.ALL,
  },

  // Tax-inclusive configurations
  {
    name: 'Restaurant - Tax Inclusive',
    description: 'Tax inclusive pricing for restaurants',
    organizationType: OrganizationType.RESTAURANT,
    taxType: TaxType.GST,
    taxRate: 5.0,
    isDefault: false,
    isActive: true,
    isTaxExempt: false,
    isPriceInclusive: true,
    serviceType: ServiceType.ALL,
  },
];

export async function seedDefaultTaxConfigurations() {
  console.log('Seeding default tax configurations...');

  // Get all organizations
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      type: true,
      name: true,
    },
  });

  console.log(`Found ${organizations.length} organizations to seed tax configurations for.`);

  for (const organization of organizations) {
    console.log(`Seeding tax configurations for organization: ${organization.name} (${organization.type})`);

    // Get relevant configurations for this organization type
    const relevantConfigs = defaultTaxConfigurations.filter(
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
          console.log(`  ✓ Created: ${config.name}`);
        } else {
          console.log(`  - Skipped: ${config.name} (already exists)`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to create ${config.name}:`, error.message);
      }
    }
  }

  console.log('Default tax configurations seeding completed.');
}

export async function seedTaxConfigurationsForOrganization(organizationId: string, organizationType: OrganizationType) {
  console.log(`Seeding tax configurations for organization ${organizationId} (${organizationType})`);

  // Get relevant configurations for this organization type
  const relevantConfigs = defaultTaxConfigurations.filter(
    config => config.organizationType === organizationType
  );

  const createdConfigs: any[] = [];

  for (const config of relevantConfigs) {
    try {
      // Check if configuration already exists
      const existing = await prisma.taxConfiguration.findFirst({
        where: {
          organizationId,
          name: config.name,
          organizationType: config.organizationType,
          taxType: config.taxType,
          serviceType: config.serviceType,
        },
      });

      if (!existing) {
        const created = await prisma.taxConfiguration.create({
          data: {
            ...config,
            organizationId,
          },
        });
        createdConfigs.push(created);
        console.log(`  ✓ Created: ${config.name}`);
      } else {
        console.log(`  - Skipped: ${config.name} (already exists)`);
      }
    } catch (error: any) {
      console.error(`  ✗ Failed to create ${config.name}:`, error.message);
    }
  }

  return createdConfigs;
}

// Run this script directly
if (require.main === module) {
  seedDefaultTaxConfigurations()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
