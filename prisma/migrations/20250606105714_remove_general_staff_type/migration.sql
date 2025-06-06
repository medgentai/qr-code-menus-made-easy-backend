/*
  Warnings:

  - The values [GENERAL] on the enum `StaffType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StaffType_new" AS ENUM ('KITCHEN', 'FRONT_OF_HOUSE');
ALTER TABLE "organization_members" ALTER COLUMN "staff_type" TYPE "StaffType_new" USING ("staff_type"::text::"StaffType_new");
ALTER TABLE "organization_invitations" ALTER COLUMN "staff_type" TYPE "StaffType_new" USING ("staff_type"::text::"StaffType_new");
ALTER TYPE "StaffType" RENAME TO "StaffType_old";
ALTER TYPE "StaffType_new" RENAME TO "StaffType";
DROP TYPE "StaffType_old";
COMMIT;
