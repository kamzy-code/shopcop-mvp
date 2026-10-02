-- Rename: transaction → order (safe rename-only migration, no data loss)

-- 1. Rename enum
ALTER TYPE "TransactionStatus" RENAME TO "OrderStatus";

-- 2. Rename tables
ALTER TABLE "transactions" RENAME TO "orders";
ALTER TABLE "transaction_items" RENAME TO "order_items";
ALTER TABLE "transaction_status_history" RENAME TO "order_status_history";

-- 3. Rename foreign key columns
ALTER TABLE "order_items" RENAME COLUMN "transaction_id" TO "order_id";
ALTER TABLE "order_status_history" RENAME COLUMN "transaction_id" TO "order_id";
ALTER TABLE "reviews" RENAME COLUMN "transaction_id" TO "order_id";

-- 4. Rename VendorProfile metric columns
ALTER TABLE "vendor_profiles" RENAME COLUMN "total_transactions" TO "total_orders";
ALTER TABLE "vendor_profiles" RENAME COLUMN "successful_transactions" TO "successful_orders";
ALTER TABLE "vendor_profiles" RENAME COLUMN "last_transaction_at" TO "last_order_at";
