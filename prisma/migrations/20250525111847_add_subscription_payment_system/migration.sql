/*
  Warnings:

  - Added the required column `user_id` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationType` to the `plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `venue_price` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ORDER', 'SUBSCRIPTION', 'VENUE_CREATION', 'ORGANIZATION_SETUP');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED', 'TRIAL', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "organization_id" TEXT,
ADD COLUMN     "paymentType" "PaymentType" NOT NULL DEFAULT 'ORDER',
ADD COLUMN     "razorpay_order_id" TEXT,
ADD COLUMN     "razorpay_payment_id" TEXT,
ADD COLUMN     "razorpay_signature" TEXT,
ADD COLUMN     "receipt" TEXT,
ADD COLUMN     "subscription_id" TEXT,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "venue_id" TEXT,
ALTER COLUMN "order_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "organizationType" "OrganizationType" NOT NULL,
ADD COLUMN     "venue_price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "venues_included" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "device_info" JSONB,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "is_revoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_used" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "refresh_token" TEXT,
ADD COLUMN     "user_agent" TEXT;

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "canceled_at" TIMESTAMP(3),
    "trial_start" TIMESTAMP(3),
    "trial_end" TIMESTAMP(3),
    "venues_included" INTEGER NOT NULL DEFAULT 1,
    "venues_used" INTEGER NOT NULL DEFAULT 0,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
