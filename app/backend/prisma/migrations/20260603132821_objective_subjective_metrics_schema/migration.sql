/*
  Warnings:

  - You are about to drop the column `customer_satisfaction_rate` on the `vendor_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "vendor_profiles" DROP COLUMN "customer_satisfaction_rate",
ADD COLUMN     "avg_delivery_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "avg_response_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "customer_satisfaction_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "review_count" INTEGER NOT NULL DEFAULT 0;
