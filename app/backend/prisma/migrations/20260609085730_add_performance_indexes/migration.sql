-- AlterTable
ALTER TABLE "order_items" RENAME CONSTRAINT "transaction_items_pkey" TO "order_items_pkey";

-- AlterTable
ALTER TABLE "order_status_history" RENAME CONSTRAINT "transaction_status_history_pkey" TO "order_status_history_pkey";

-- AlterTable
ALTER TABLE "orders" RENAME CONSTRAINT "transactions_pkey" TO "orders_pkey";

-- CreateIndex
CREATE INDEX "orders_payment_status_idx" ON "orders"("payment_status");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "products_vendor_id_created_at_idx" ON "products"("vendor_id", "created_at");

-- RenameForeignKey
ALTER TABLE "order_items" RENAME CONSTRAINT "transaction_items_product_id_fkey" TO "order_items_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "order_items" RENAME CONSTRAINT "transaction_items_transaction_id_fkey" TO "order_items_order_id_fkey";

-- RenameForeignKey
ALTER TABLE "order_status_history" RENAME CONSTRAINT "transaction_status_history_transaction_id_fkey" TO "order_status_history_order_id_fkey";

-- RenameForeignKey
ALTER TABLE "orders" RENAME CONSTRAINT "transactions_buyer_id_fkey" TO "orders_buyer_id_fkey";

-- RenameForeignKey
ALTER TABLE "orders" RENAME CONSTRAINT "transactions_vendor_id_fkey" TO "orders_vendor_id_fkey";

-- RenameForeignKey
ALTER TABLE "reviews" RENAME CONSTRAINT "reviews_transaction_id_fkey" TO "reviews_order_id_fkey";

-- RenameIndex
ALTER INDEX "transaction_items_product_id_idx" RENAME TO "order_items_product_id_idx";

-- RenameIndex
ALTER INDEX "transaction_items_transaction_id_idx" RENAME TO "order_items_order_id_idx";

-- RenameIndex
ALTER INDEX "transaction_status_history_transaction_id_idx" RENAME TO "order_status_history_order_id_idx";

-- RenameIndex
ALTER INDEX "transactions_buyer_email_idx" RENAME TO "orders_buyer_email_idx";

-- RenameIndex
ALTER INDEX "transactions_reference_idx" RENAME TO "orders_reference_idx";

-- RenameIndex
ALTER INDEX "transactions_reference_key" RENAME TO "orders_reference_key";

-- RenameIndex
ALTER INDEX "transactions_refund_status_idx" RENAME TO "orders_refund_status_idx";

-- RenameIndex
ALTER INDEX "transactions_tracking_token_idx" RENAME TO "orders_tracking_token_idx";

-- RenameIndex
ALTER INDEX "transactions_tracking_token_key" RENAME TO "orders_tracking_token_key";

-- RenameIndex
ALTER INDEX "transactions_vendor_id_status_idx" RENAME TO "orders_vendor_id_status_idx";

-- RenameIndex
ALTER INDEX "reviews_transaction_id_key" RENAME TO "reviews_order_id_key";

-- RenameIndex
ALTER INDEX "vendor_profiles_total_transactions_idx" RENAME TO "vendor_profiles_total_orders_idx";
