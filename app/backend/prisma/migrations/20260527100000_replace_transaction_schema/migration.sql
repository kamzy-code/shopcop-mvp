-- ============================================================
-- Replace Transaction Schema
-- ============================================================

-- Ensure required enums exist (shadow DB starts fresh; real DB has them from db push)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeliveryMethod') THEN
    CREATE TYPE "DeliveryMethod" AS ENUM ('PICKUP', 'DISPATCH', 'WAYBILL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PROOF_SUBMITTED', 'PAID', 'REFUNDED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RefundStatus') THEN
    CREATE TYPE "RefundStatus" AS ENUM ('NONE', 'REQUESTED', 'IN_PROGRESS', 'REFUNDED', 'RESOLVED');
  END IF;
END $$;

-- Step 1: Clear existing data (old schema incompatible)
DELETE FROM "transaction_status_history";
DELETE FROM "transactions";

-- Step 2: Rename TransactionStatus with new values (only alter transactions.status here;
-- drop transaction_status_history first to avoid altering non-existent columns)
ALTER TABLE "transaction_status_history"
  DROP CONSTRAINT IF EXISTS "transaction_status_history_transaction_id_fkey";
DROP TABLE "transaction_status_history";

CREATE TYPE "TransactionStatus_new" AS ENUM (
  'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY_FOR_DISPATCH',
  'SHIPPED', 'DELIVERED', 'COMPLETED', 'REFUND_REQUESTED',
  'REFUND_IN_PROGRESS', 'REFUNDED', 'RESOLVED', 'CANCELLED'
);

ALTER TABLE "transactions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "transactions" ALTER COLUMN "status" TYPE "TransactionStatus_new"
  USING ("status"::text::"TransactionStatus_new");

ALTER TYPE "TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "TransactionStatus_old";

ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Step 3: Recreate transaction_status_history with new shape
CREATE TABLE "transaction_status_history" (
  "id"             TEXT          NOT NULL,
  "transaction_id" TEXT          NOT NULL,
  "from_status"    "TransactionStatus",
  "to_status"      "TransactionStatus" NOT NULL,
  "changed_by"     TEXT          NOT NULL,
  "note"           TEXT,
  "created_at"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transaction_status_history_pkey" PRIMARY KEY ("id")
);

-- Step 4: Drop old FK and indexes from transactions
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_buyer_id_fkey";
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_product_id_fkey";
DROP INDEX IF EXISTS "transactions_buyer_id_idx";
DROP INDEX IF EXISTS "transactions_created_at_idx";
DROP INDEX IF EXISTS "transactions_status_idx";
DROP INDEX IF EXISTS "transactions_tracking_slug_idx";
DROP INDEX IF EXISTS "transactions_tracking_slug_key";
DROP INDEX IF EXISTS "transactions_vendor_id_idx";
DROP INDEX IF EXISTS "transactions_verification_status_idx";

-- Step 5: Add new columns to products
ALTER TABLE "products"
  ADD COLUMN "low_stock_threshold" INTEGER,
  ADD COLUMN "track_inventory"     BOOLEAN NOT NULL DEFAULT false;

-- Step 6: Drop old columns from transactions
ALTER TABLE "transactions"
  DROP COLUMN "amount",
  DROP COLUMN "estimated_delivery",
  DROP COLUMN "product_id",
  DROP COLUMN "product_name",
  DROP COLUMN "rejection_reason",
  DROP COLUMN "tracking_slug",
  DROP COLUMN "verification_status",
  DROP COLUMN "verified_at",
  DROP COLUMN "verified_by";

-- Step 7: Make buyer_phone NOT NULL (no rows exist)
ALTER TABLE "transactions" ALTER COLUMN "buyer_phone" SET NOT NULL;

-- Step 8: Add all new columns to transactions (no rows → NOT NULL is fine)
ALTER TABLE "transactions"
  ADD COLUMN "reference"               TEXT            NOT NULL,
  ADD COLUMN "tracking_token"          TEXT            NOT NULL,
  ADD COLUMN "buyer_name"              TEXT            NOT NULL,
  ADD COLUMN "buyer_email"             TEXT,
  ADD COLUMN "delivery_method"         "DeliveryMethod" NOT NULL,
  ADD COLUMN "delivery_address"        TEXT,
  ADD COLUMN "delivery_notes"          TEXT,
  ADD COLUMN "expected_delivery_start" TIMESTAMP(3),
  ADD COLUMN "expected_delivery_end"   TIMESTAMP(3),
  ADD COLUMN "actual_delivery_date"    TIMESTAMP(3),
  ADD COLUMN "subtotal"                DECIMAL(10,2)   NOT NULL,
  ADD COLUMN "delivery_fee"            DECIMAL(10,2),
  ADD COLUMN "discount_amount"         DECIMAL(10,2),
  ADD COLUMN "total_amount"            DECIMAL(10,2)   NOT NULL,
  ADD COLUMN "currency"                TEXT            NOT NULL DEFAULT 'NGN',
  ADD COLUMN "payment_status"          "PaymentStatus"  NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN "payment_confirmed_at"    TIMESTAMP(3),
  ADD COLUMN "payment_notes"           TEXT,
  ADD COLUMN "confirmed_at"            TIMESTAMP(3),
  ADD COLUMN "in_progress_at"          TIMESTAMP(3),
  ADD COLUMN "ready_for_dispatch_at"   TIMESTAMP(3),
  ADD COLUMN "shipped_at"              TIMESTAMP(3),
  ADD COLUMN "completed_at"            TIMESTAMP(3),
  ADD COLUMN "cancelled_at"            TIMESTAMP(3),
  ADD COLUMN "refund_initiated_at"     TIMESTAMP(3),
  ADD COLUMN "refunded_at"             TIMESTAMP(3),
  ADD COLUMN "resolved_at"             TIMESTAMP(3),
  ADD COLUMN "refund_status"           "RefundStatus"   NOT NULL DEFAULT 'NONE',
  ADD COLUMN "refund_reason"           TEXT,
  ADD COLUMN "refund_amount"           DECIMAL(10,2),
  ADD COLUMN "refund_vendor_notes"     TEXT,
  ADD COLUMN "auto_close_at"           TIMESTAMP(3),
  ADD COLUMN "cancelled_by"            TEXT,
  ADD COLUMN "cancellation_reason"     TEXT,
  ADD COLUMN "vendor_notes"            TEXT,
  ADD COLUMN "order_notes"             TEXT;

-- Step 9: Create transaction_items table
CREATE TABLE "transaction_items" (
  "id"             TEXT          NOT NULL,
  "transaction_id" TEXT          NOT NULL,
  "product_id"     TEXT,
  "item_name"      TEXT          NOT NULL,
  "item_price"     DECIMAL(10,2) NOT NULL,
  "quantity"       INTEGER       NOT NULL DEFAULT 1,
  "subtotal"       DECIMAL(10,2) NOT NULL,
  "item_image_url" TEXT,
  "variant"        TEXT,
  "stock_deducted" INTEGER       NOT NULL DEFAULT 0,
  "stock_restored" INTEGER       NOT NULL DEFAULT 0,
  CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

-- Step 10: Unique constraints on transactions
CREATE UNIQUE INDEX "transactions_reference_key"      ON "transactions"("reference");
CREATE UNIQUE INDEX "transactions_tracking_token_key" ON "transactions"("tracking_token");

-- Step 11: Operational indexes
CREATE INDEX "transactions_vendor_id_status_idx"                  ON "transactions"("vendor_id", "status");
CREATE INDEX "transactions_tracking_token_idx"                     ON "transactions"("tracking_token");
CREATE INDEX "transactions_reference_idx"                          ON "transactions"("reference");
CREATE INDEX "transactions_buyer_phone_idx"                        ON "transactions"("buyer_phone");
CREATE INDEX "transactions_refund_status_idx"                      ON "transactions"("refund_status");
CREATE INDEX "transaction_status_history_transaction_id_idx"       ON "transaction_status_history"("transaction_id");
CREATE INDEX "transaction_items_transaction_id_idx"                ON "transaction_items"("transaction_id");
CREATE INDEX "transaction_items_product_id_idx"                    ON "transaction_items"("product_id");

-- Step 12: Foreign keys
ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_buyer_id_fkey"
    FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "transaction_status_history"
  ADD CONSTRAINT "transaction_status_history_transaction_id_fkey"
    FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transaction_items"
  ADD CONSTRAINT "transaction_items_transaction_id_fkey"
    FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transaction_items"
  ADD CONSTRAINT "transaction_items_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
