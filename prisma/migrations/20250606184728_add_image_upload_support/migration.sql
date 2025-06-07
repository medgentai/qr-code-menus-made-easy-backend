/*
  Warnings:

  - The values [OTHER] on the enum `OrganizationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrganizationType_new" AS ENUM ('RESTAURANT', 'HOTEL', 'CAFE', 'FOOD_TRUCK', 'BAR');
ALTER TABLE "organizations" ALTER COLUMN "type" TYPE "OrganizationType_new" USING ("type"::text::"OrganizationType_new");
ALTER TABLE "plans" ALTER COLUMN "organizationType" TYPE "OrganizationType_new" USING ("organizationType"::text::"OrganizationType_new");
ALTER TYPE "OrganizationType" RENAME TO "OrganizationType_old";
ALTER TYPE "OrganizationType_new" RENAME TO "OrganizationType";
DROP TYPE "OrganizationType_old";
COMMIT;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "thumbnail_url" TEXT;

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "thumbnail_url" TEXT;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "logo_thumbnail_url" TEXT;

-- AlterTable
ALTER TABLE "venues" ADD COLUMN     "thumbnail_url" TEXT;

-- CreateTable
CREATE TABLE "media_files" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "s3_url" TEXT NOT NULL,
    "thumbnail_s3_key" TEXT,
    "thumbnail_s3_url" TEXT,
    "organization_id" TEXT NOT NULL,
    "venue_id" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
