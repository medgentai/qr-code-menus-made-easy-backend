/*
  Warnings:

  - You are about to drop the column `venue_id` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `added_by` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `participant_id` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `session_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `order_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `session_participants` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "menus" DROP CONSTRAINT "menus_venue_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_participant_id_fkey";

-- DropForeignKey
ALTER TABLE "order_sessions" DROP CONSTRAINT "order_sessions_table_id_fkey";

-- DropForeignKey
ALTER TABLE "order_sessions" DROP CONSTRAINT "order_sessions_venue_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_session_id_fkey";

-- DropForeignKey
ALTER TABLE "session_participants" DROP CONSTRAINT "session_participants_session_id_fkey";

-- DropIndex
DROP INDEX "orders_session_id_key";

-- AlterTable
ALTER TABLE "menus" DROP COLUMN "venue_id";

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "added_by",
DROP COLUMN "participant_id";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "session_id";

-- DropTable
DROP TABLE "order_sessions";

-- DropTable
DROP TABLE "session_participants";
