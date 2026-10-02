-- Remove buyer_name, buyer_phone, delivery_address, delivery_notes from transactions
-- (transactions are anonymous; buyers track orders via the public tracking link)
--
-- Rename DeliveryMethod enum: COURIER → DISPATCH, DELIVERY_SERVICE → WAYBILL

-- AlterEnum
BEGIN;
CREATE TYPE "DeliveryMethod_new" AS ENUM ('PICKUP', 'DISPATCH', 'WAYBILL');
ALTER TABLE "transactions" ALTER COLUMN "delivery_method" TYPE "DeliveryMethod_new" USING ("delivery_method"::text::"DeliveryMethod_new");
ALTER TYPE "DeliveryMethod" RENAME TO "DeliveryMethod_old";
ALTER TYPE "DeliveryMethod_new" RENAME TO "DeliveryMethod";
DROP TYPE "public"."DeliveryMethod_old";
COMMIT;

-- DropIndex
DROP INDEX "transactions_buyer_phone_idx";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "buyer_name",
DROP COLUMN "buyer_phone",
DROP COLUMN "delivery_address",
DROP COLUMN "delivery_notes";

-- CreateIndex
CREATE INDEX "transactions_buyer_email_idx" ON "transactions"("buyer_email");
