/*
  Warnings:

  - You are about to drop the column `thumbnail_url` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail_url` on the `menu_items` table. All the data in the column will be lost.
  - You are about to drop the column `logo_thumbnail_url` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail_url` on the `venues` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "categories" DROP COLUMN "thumbnail_url";

-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "thumbnail_url";

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "logo_thumbnail_url";

-- AlterTable
ALTER TABLE "venues" DROP COLUMN "thumbnail_url";
