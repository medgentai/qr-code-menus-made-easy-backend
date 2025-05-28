-- Drop foreign key constraints first
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_fkey";
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_organization_id_fkey";
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_venue_id_fkey";

-- Drop indexes
DROP INDEX IF EXISTS "notifications_user_id_read_created_at_idx";
DROP INDEX IF EXISTS "notifications_organization_id_created_at_idx";
DROP INDEX IF EXISTS "notifications_venue_id_created_at_idx";
DROP INDEX IF EXISTS "notifications_expires_at_idx";

-- Drop the table
DROP TABLE IF EXISTS "notifications";

-- Drop the enum
DROP TYPE IF EXISTS "NotificationType";
