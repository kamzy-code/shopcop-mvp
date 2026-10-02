-- AlterTable
ALTER TABLE "product_media" RENAME CONSTRAINT "product_images_pkey" TO "product_media_pkey";

-- RenameForeignKey
ALTER TABLE "product_media" RENAME CONSTRAINT "product_images_product_id_fkey" TO "product_media_product_id_fkey";

-- RenameIndex
ALTER INDEX "product_images_product_id_idx" RENAME TO "product_media_product_id_idx";
