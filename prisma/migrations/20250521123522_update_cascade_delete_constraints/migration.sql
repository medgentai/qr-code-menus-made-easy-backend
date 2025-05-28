-- DropForeignKey
ALTER TABLE "order_item_modifiers" DROP CONSTRAINT "order_item_modifiers_modifier_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_menu_item_id_fkey";

-- DropForeignKey
ALTER TABLE "qr_codes" DROP CONSTRAINT "qr_codes_menu_id_fkey";

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_modifier_id_fkey" FOREIGN KEY ("modifier_id") REFERENCES "modifiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
