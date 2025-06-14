#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { seedDefaultTaxConfigurations } from '../tax/seeds/default-tax-configurations.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting tax configurations seeding...');
  
  try {
    await seedDefaultTaxConfigurations();
    console.log('✅ Tax configurations seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding tax configurations:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
