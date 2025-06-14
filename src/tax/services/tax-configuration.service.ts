import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaxConfigurationDto } from '../dto/create-tax-configuration.dto';
import { UpdateTaxConfigurationDto } from '../dto/update-tax-configuration.dto';
import { OrganizationType, TaxType, ServiceType } from '@prisma/client';

@Injectable()
export class TaxConfigurationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new tax configuration for an organization
   */
  async create(organizationId: string, createTaxConfigurationDto: CreateTaxConfigurationDto) {
    // Verify organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }

    // Simple create - no more default logic complexity
    return this.prisma.taxConfiguration.create({
      data: {
        ...createTaxConfigurationDto,
        organizationId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
  }

  /**
   * Find all tax configurations for an organization
   */
  async findByOrganization(organizationId: string) {
    return this.prisma.taxConfiguration.findMany({
      where: { organizationId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { organizationType: 'asc' },
        { serviceType: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Find a specific tax configuration by ID
   */
  async findOne(id: string, organizationId: string) {
    const taxConfiguration = await this.prisma.taxConfiguration.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!taxConfiguration) {
      throw new NotFoundException(`Tax configuration with ID ${id} not found`);
    }

    return taxConfiguration;
  }

  /**
   * Update a tax configuration
   */
  async update(id: string, organizationId: string, updateTaxConfigurationDto: UpdateTaxConfigurationDto) {
    // Check if tax configuration exists and belongs to organization
    await this.findOne(id, organizationId);

    // Simple update - no more default logic complexity
    return this.prisma.taxConfiguration.update({
      where: { id },
      data: updateTaxConfigurationDto,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
  }

  /**
   * Delete a tax configuration
   */
  async remove(id: string, organizationId: string) {
    // Check if tax configuration exists and belongs to organization
    await this.findOne(id, organizationId);

    return this.prisma.taxConfiguration.delete({
      where: { id },
    });
  }

  /**
   * Get applicable tax configuration for an organization
   * Uses the most recent active configuration (service type no longer affects tax rates)
   */
  async getApplicableTaxConfiguration(
    organizationId: string,
    organizationType: OrganizationType
  ) {
    // Find the most recent active configuration for the organization type
    // Service type no longer affects tax rates as per Indian GST regulations
    const taxConfig = await this.prisma.taxConfiguration.findFirst({
      where: {
        organizationId,
        organizationType,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc', // Use the most recent active configuration
      },
    });

    return taxConfig;
  }

  /**
   * Create default tax configurations for a new organization
   */
  async createDefaultTaxConfigurations(organizationId: string, organizationType: OrganizationType) {
    const defaultConfigurations = this.getDefaultTaxConfigurationsByType(organizationType);

    const createdConfigurations: any[] = [];

    for (const config of defaultConfigurations) {
      try {
        const created = await this.create(organizationId, {
          ...config,
          organizationType,
        });
        createdConfigurations.push(created);
      } catch (error: any) {
        // Log error but continue with other configurations
        console.error(`Failed to create default tax configuration: ${error.message}`);
      }
    }

    return createdConfigurations;
  }

  /**
   * Get default tax configurations based on organization type
   */
  private getDefaultTaxConfigurationsByType(organizationType: OrganizationType): CreateTaxConfigurationDto[] {
    const baseConfig = {
      taxType: TaxType.GST,
      isDefault: true,
      isActive: true,
      isTaxExempt: false,
      isPriceInclusive: false,
    };

    switch (organizationType) {
      case OrganizationType.RESTAURANT:
        return [
          {
            ...baseConfig,
            name: 'Restaurant GST',
            description: 'Standard GST rate for restaurant services (applies to dine-in, takeaway, and delivery)',
            organizationType,
            taxRate: 5.0,
            // No service type - same rate applies to all service types
          },
        ];

      case OrganizationType.HOTEL:
        return [
          {
            ...baseConfig,
            name: 'Hotel GST - Budget',
            description: 'Standard GST rate for hotels with room tariff < ₹7,500 (applies to all food services)',
            organizationType,
            taxRate: 5.0,
            // No service type - same rate applies to all service types
          },
        ];

      case OrganizationType.CAFE:
        return [
          {
            ...baseConfig,
            name: 'Cafe GST',
            description: 'Standard GST rate for cafe services',
            organizationType,
            taxRate: 5.0,
            serviceType: ServiceType.ALL,
          },
        ];

      case OrganizationType.FOOD_TRUCK:
        return [
          {
            ...baseConfig,
            name: 'Food Truck GST',
            description: 'Standard GST rate for food truck services',
            organizationType,
            taxRate: 5.0,
            serviceType: ServiceType.ALL,
          },
        ];

      case OrganizationType.BAR:
        return [
          {
            ...baseConfig,
            name: 'Bar GST',
            description: 'Higher GST rate for establishments serving alcohol',
            organizationType,
            taxRate: 18.0,
            serviceType: ServiceType.ALL,
          },
        ];

      default:
        return [
          {
            ...baseConfig,
            name: 'Default GST',
            description: 'Default GST configuration (applies to all service types)',
            organizationType,
            taxRate: 5.0,
            // No service type - same rate applies to all service types
          },
        ];
    }
  }
}
