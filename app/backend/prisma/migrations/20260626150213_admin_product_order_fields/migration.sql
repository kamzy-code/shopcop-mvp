-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "admin_notes" TEXT,
ADD COLUMN     "handled_by" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "admin_notes" TEXT,
ADD COLUMN     "flag_reason" TEXT,
ADD COLUMN     "flagged_at" TIMESTAMP(3),
ADD COLUMN     "flagged_by" TEXT,
ADD COLUMN     "is_flagged" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "products_is_flagged_idx" ON "products"("is_flagged");
