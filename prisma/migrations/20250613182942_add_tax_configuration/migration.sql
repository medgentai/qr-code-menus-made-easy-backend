-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('GST', 'VAT', 'SALES_TAX', 'SERVICE_TAX', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('DINE_IN', 'TAKEAWAY', 'DELIVERY', 'ALL');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "is_price_inclusive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_tax_exempt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "service_type" "ServiceType" NOT NULL DEFAULT 'DINE_IN',
ADD COLUMN     "subtotal_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tax_type" "TaxType" NOT NULL DEFAULT 'GST';

-- CreateTable
CREATE TABLE "tax_configurations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationType" "OrganizationType" NOT NULL,
    "taxType" "TaxType" NOT NULL DEFAULT 'GST',
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_tax_exempt" BOOLEAN NOT NULL DEFAULT false,
    "is_price_inclusive" BOOLEAN NOT NULL DEFAULT false,
    "applicable_region" TEXT,
    "service_type" "ServiceType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tax_configurations_organization_id_organizationType_taxType_key" ON "tax_configurations"("organization_id", "organizationType", "taxType", "service_type", "is_default");

-- AddForeignKey
ALTER TABLE "tax_configurations" ADD CONSTRAINT "tax_configurations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
