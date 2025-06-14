import { Injectable } from '@nestjs/common';
import { TaxConfigurationService } from './tax-configuration.service';
import { CalculateTaxDto, OrderTotalsDto, TaxBreakdownDto, OrderItemForTaxDto } from '../dto/tax-calculation.dto';
import { OrganizationType, ServiceType, TaxType } from '@prisma/client';

@Injectable()
export class TaxCalculationService {
  constructor(private taxConfigurationService: TaxConfigurationService) {}

  /**
   * Calculate tax for an order based on organization tax configuration
   * Service type is kept for business logic but doesn't affect tax rates
   */
  async calculateOrderTax(
    organizationId: string,
    organizationType: OrganizationType,
    serviceType: ServiceType,
    items: OrderItemForTaxDto[]
  ): Promise<OrderTotalsDto> {
    // Calculate subtotal from items
    const subtotal = this.calculateSubtotal(items);

    // Get applicable tax configuration (service type no longer affects tax rates)
    const taxConfig = await this.taxConfigurationService.getApplicableTaxConfiguration(
      organizationId,
      organizationType
    );

    // If no tax configuration found, return zero tax
    if (!taxConfig) {
      return {
        subtotalAmount: subtotal,
        taxAmount: 0,
        totalAmount: subtotal,
        serviceType,
        taxBreakdown: {
          taxType: TaxType.GST,
          taxRate: 0,
          taxAmount: 0,
          isPriceInclusive: false,
          isTaxExempt: true,
        },
        displayMessage: 'No tax configuration found',
      };
    }

    // Check if tax exempt
    if (taxConfig.isTaxExempt) {
      return {
        subtotalAmount: subtotal,
        taxAmount: 0,
        totalAmount: subtotal,
        serviceType,
        taxBreakdown: {
          taxType: taxConfig.taxType,
          taxRate: Number(taxConfig.taxRate),
          taxAmount: 0,
          isPriceInclusive: false,
          isTaxExempt: true,
        },
        displayMessage: 'Tax Exempt',
      };
    }

    const taxRate = Number(taxConfig.taxRate);

    // Handle tax-inclusive pricing
    if (taxConfig.isPriceInclusive) {
      // Extract tax from subtotal if prices are tax-inclusive
      const taxAmount = this.roundToTwoDecimals(subtotal - (subtotal / (1 + (taxRate / 100))));
      const actualSubtotal = subtotal - taxAmount;

      return {
        subtotalAmount: actualSubtotal,
        taxAmount,
        totalAmount: subtotal,
        serviceType,
        taxBreakdown: {
          taxType: taxConfig.taxType,
          taxRate,
          taxAmount,
          isPriceInclusive: true,
          isTaxExempt: false,
        },
        displayMessage: 'Tax Inclusive Pricing',
      };
    }

    // Standard tax calculation (tax-exclusive pricing)
    const taxAmount = this.roundToTwoDecimals(subtotal * (taxRate / 100));
    const total = subtotal + taxAmount;

    return {
      subtotalAmount: subtotal,
      taxAmount,
      totalAmount: total,
      serviceType,
      taxBreakdown: {
        taxType: taxConfig.taxType,
        taxRate,
        taxAmount,
        isPriceInclusive: false,
        isTaxExempt: false,
      },
    };
  }

  /**
   * Calculate tax using the CalculateTaxDto
   */
  async calculateTax(calculateTaxDto: CalculateTaxDto): Promise<OrderTotalsDto> {
    // Get organization to determine organization type
    const organization = await this.taxConfigurationService['prisma'].organization.findUnique({
      where: { id: calculateTaxDto.organizationId },
    });

    if (!organization) {
      throw new Error(`Organization with ID ${calculateTaxDto.organizationId} not found`);
    }

    return this.calculateOrderTax(
      calculateTaxDto.organizationId,
      organization.type,
      calculateTaxDto.serviceType,
      calculateTaxDto.items
    );
  }

  /**
   * Calculate subtotal from order items
   */
  private calculateSubtotal(items: OrderItemForTaxDto[]): number {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const modifiersTotal = item.modifiersPrice || 0;
      return sum + itemTotal + modifiersTotal;
    }, 0);

    return this.roundToTwoDecimals(subtotal);
  }

  /**
   * Round amount to two decimal places
   */
  private roundToTwoDecimals(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Get tax preview for an organization
   * Service type parameter kept for API compatibility but doesn't affect tax calculation
   */
  async getTaxPreview(organizationId: string, serviceType: ServiceType = ServiceType.DINE_IN) {
    // Get organization
    const organization = await this.taxConfigurationService['prisma'].organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error(`Organization with ID ${organizationId} not found`);
    }

    // Get applicable tax configuration (service type no longer affects tax rates)
    const taxConfig = await this.taxConfigurationService.getApplicableTaxConfiguration(
      organizationId,
      organization.type
    );

    if (!taxConfig) {
      return {
        hasConfiguration: false,
        message: 'No tax configuration found for this organization',
      };
    }

    // Calculate example with ₹100 base amount
    const exampleAmount = 100;
    const taxRate = Number(taxConfig.taxRate);

    let exampleCalculation;

    if (taxConfig.isTaxExempt) {
      exampleCalculation = {
        subtotal: exampleAmount,
        taxAmount: 0,
        total: exampleAmount,
        message: 'Tax Exempt',
      };
    } else if (taxConfig.isPriceInclusive) {
      const taxAmount = this.roundToTwoDecimals(exampleAmount - (exampleAmount / (1 + (taxRate / 100))));
      exampleCalculation = {
        subtotal: exampleAmount - taxAmount,
        taxAmount,
        total: exampleAmount,
        message: 'Tax Inclusive Pricing',
      };
    } else {
      const taxAmount = this.roundToTwoDecimals(exampleAmount * (taxRate / 100));
      exampleCalculation = {
        subtotal: exampleAmount,
        taxAmount,
        total: exampleAmount + taxAmount,
        message: 'Tax Exclusive Pricing',
      };
    }

    return {
      hasConfiguration: true,
      configuration: {
        id: taxConfig.id,
        name: taxConfig.name,
        description: taxConfig.description,
        taxType: taxConfig.taxType,
        taxRate: taxRate,
        isDefault: taxConfig.isDefault,
        isActive: taxConfig.isActive,
        isTaxExempt: taxConfig.isTaxExempt,
        isPriceInclusive: taxConfig.isPriceInclusive,
        serviceType: taxConfig.serviceType,
      },
      exampleCalculation,
    };
  }

  /**
   * Validate tax calculation parameters
   */
  validateTaxCalculationParams(items: OrderItemForTaxDto[]): void {
    if (!items || items.length === 0) {
      throw new Error('At least one item is required for tax calculation');
    }

    for (const item of items) {
      if (item.quantity <= 0) {
        throw new Error('Item quantity must be greater than 0');
      }
      if (item.unitPrice < 0) {
        throw new Error('Item unit price cannot be negative');
      }
      if (item.modifiersPrice && item.modifiersPrice < 0) {
        throw new Error('Modifiers price cannot be negative');
      }
    }
  }
}
