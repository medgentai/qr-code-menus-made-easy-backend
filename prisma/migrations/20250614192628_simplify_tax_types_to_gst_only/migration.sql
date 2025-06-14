/*
  Warnings:

  - The values [VAT,SALES_TAX,SERVICE_TAX,OTHER] on the enum `TaxType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TaxType_new" AS ENUM ('GST');
ALTER TABLE "orders" ALTER COLUMN "tax_type" DROP DEFAULT;
ALTER TABLE "tax_configurations" ALTER COLUMN "taxType" DROP DEFAULT;
ALTER TABLE "tax_configurations" ALTER COLUMN "taxType" TYPE "TaxType_new" USING ("taxType"::text::"TaxType_new");
ALTER TABLE "orders" ALTER COLUMN "tax_type" TYPE "TaxType_new" USING ("tax_type"::text::"TaxType_new");
ALTER TYPE "TaxType" RENAME TO "TaxType_old";
ALTER TYPE "TaxType_new" RENAME TO "TaxType";
DROP TYPE "TaxType_old";
ALTER TABLE "orders" ALTER COLUMN "tax_type" SET DEFAULT 'GST';
ALTER TABLE "tax_configurations" ALTER COLUMN "taxType" SET DEFAULT 'GST';
COMMIT;
