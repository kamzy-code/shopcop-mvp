/*
  Warnings:

  - You are about to drop the column `rating` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `review_categories` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `review_type` on the `reviews` table. All the data in the column will be lost.
  - Added the required column `overall_rating` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "reviews_rating_idx";

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "rating",
DROP COLUMN "review_categories",
DROP COLUMN "review_type",
ADD COLUMN     "delivery_rating" INTEGER,
ADD COLUMN     "overall_rating" INTEGER NOT NULL,
ADD COLUMN     "response_rating" INTEGER,
ADD COLUMN     "satisfaction_rating" INTEGER,
ALTER COLUMN "buyer_name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "payment_proof_submitted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vendor_profiles" ADD COLUMN     "avg_response_time_minutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "customer_satisfaction_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "on_time_delivery_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "refund_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "successful_transactions" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "reviews_overall_rating_idx" ON "reviews"("overall_rating");
