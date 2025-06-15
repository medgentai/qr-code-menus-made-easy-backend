-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "view_only_mode" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "venues" ADD COLUMN     "view_only_mode" BOOLEAN NOT NULL DEFAULT false;
