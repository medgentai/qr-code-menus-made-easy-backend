-- AlterTable
ALTER TABLE "menus" ADD COLUMN     "venue_id" TEXT;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
