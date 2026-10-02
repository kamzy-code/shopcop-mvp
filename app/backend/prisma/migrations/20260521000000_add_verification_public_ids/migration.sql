-- Add public_id columns for Cloudinary document references
ALTER TABLE "vendor_verifications" ADD COLUMN IF NOT EXISTS "govt_id_front_public_id" TEXT;
ALTER TABLE "vendor_verifications" ADD COLUMN IF NOT EXISTS "govt_id_back_public_id" TEXT;
ALTER TABLE "vendor_verifications" ADD COLUMN IF NOT EXISTS "cac_certificate_public_id" TEXT;
ALTER TABLE "vendor_verifications" ADD COLUMN IF NOT EXISTS "smedan_certificate_public_id" TEXT;
ALTER TABLE "vendor_verifications" ADD COLUMN IF NOT EXISTS "address_document_public_id" TEXT;
