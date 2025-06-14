#!/usr/bin/env ts-node

import { PrismaClient, ServiceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TaxCalculationService } from '../tax/services/tax-calculation.service';
import { TaxConfigurationService } from '../tax/services/tax-configuration.service';

const prisma = new PrismaClient();
const prismaService = new PrismaService();

async function testTaxCalculation() {
  console.log('🧪 Testing Tax Calculation System...\n');

  // Initialize services with PrismaService wrapper
  const taxConfigService = new TaxConfigurationService(prismaService);
  const taxCalcService = new TaxCalculationService(taxConfigService);

  try {
    // Get a sample organization (restaurant)
    const restaurant = await prisma.organization.findFirst({
      where: { type: 'RESTAURANT' },
    });

    if (!restaurant) {
      console.log('❌ No restaurant organization found. Please run the tax seed first.');
      return;
    }

    console.log(`🏢 Testing with organization: ${restaurant.name}`);

    // Test 1: Basic tax calculation for restaurant
    console.log('\n📊 Test 1: Restaurant Dine-In Tax Calculation');
    const restaurantTax = await taxCalcService.calculateOrderTax(
      restaurant.id,
      restaurant.type,
      ServiceType.DINE_IN,
      [
        {
          menuItemId: 'sample-item-1',
          quantity: 2,
          unitPrice: 150.00,
          modifiersPrice: 25.00,
        },
        {
          menuItemId: 'sample-item-2',
          quantity: 1,
          unitPrice: 200.00,
        },
      ]
    );

    console.log('Results:');
    console.log(`  Subtotal: ₹${restaurantTax.subtotalAmount}`);
    console.log(`  Tax Rate: ${restaurantTax.taxBreakdown.taxRate}%`);
    console.log(`  Tax Amount: ₹${restaurantTax.taxAmount}`);
    console.log(`  Total: ₹${restaurantTax.totalAmount}`);
    console.log(`  Tax Type: ${restaurantTax.taxBreakdown.taxType}`);
    console.log(`  Service Type: ${restaurantTax.serviceType}`);

    // Test 2: Get a bar organization
    const bar = await prisma.organization.findFirst({
      where: { type: 'BAR' },
    });

    if (bar) {
      console.log('\n📊 Test 2: Bar Tax Calculation (Higher Rate)');
      const barTax = await taxCalcService.calculateOrderTax(
        bar.id,
        bar.type,
        ServiceType.DINE_IN,
        [
          {
            menuItemId: 'sample-item-1',
            quantity: 1,
            unitPrice: 500.00, // Expensive bar item
          },
        ]
      );

      console.log('Results:');
      console.log(`  Subtotal: ₹${barTax.subtotalAmount}`);
      console.log(`  Tax Rate: ${barTax.taxBreakdown.taxRate}%`);
      console.log(`  Tax Amount: ₹${barTax.taxAmount}`);
      console.log(`  Total: ₹${barTax.totalAmount}`);
    }

    // Test 3: Get a food truck (might be tax exempt)
    const foodTruck = await prisma.organization.findFirst({
      where: { type: 'FOOD_TRUCK' },
    });

    if (foodTruck) {
      console.log('\n📊 Test 3: Food Truck Tax Calculation');
      const foodTruckTax = await taxCalcService.calculateOrderTax(
        foodTruck.id,
        foodTruck.type,
        ServiceType.ALL,
        [
          {
            menuItemId: 'sample-item-1',
            quantity: 3,
            unitPrice: 80.00,
          },
        ]
      );

      console.log('Results:');
      console.log(`  Subtotal: ₹${foodTruckTax.subtotalAmount}`);
      console.log(`  Tax Rate: ${foodTruckTax.taxBreakdown.taxRate}%`);
      console.log(`  Tax Amount: ₹${foodTruckTax.taxAmount}`);
      console.log(`  Total: ₹${foodTruckTax.totalAmount}`);
      console.log(`  Tax Exempt: ${foodTruckTax.taxBreakdown.isTaxExempt}`);
    }

    // Test 4: Tax preview
    console.log('\n📊 Test 4: Tax Preview for Restaurant');
    const preview = await taxCalcService.getTaxPreview(restaurant.id, ServiceType.DINE_IN);
    
    if (preview.hasConfiguration && preview.configuration) {
      console.log('Tax Configuration Preview:');
      console.log(`  Configuration: ${preview.configuration.name}`);
      console.log(`  Tax Rate: ${preview.configuration.taxRate}%`);
      console.log(`  Tax Type: ${preview.configuration.taxType}`);
      console.log(`  Example (₹100 base):`);
      console.log(`    Subtotal: ₹${preview.exampleCalculation.subtotal}`);
      console.log(`    Tax: ₹${preview.exampleCalculation.taxAmount}`);
      console.log(`    Total: ₹${preview.exampleCalculation.total}`);
    }

    console.log('\n✅ Tax calculation tests completed successfully!');

  } catch (error: any) {
    console.error('❌ Error during tax calculation test:', error.message);
    console.error(error.stack);
  }
}

testTaxCalculation()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaService.$disconnect();
  });
