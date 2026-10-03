-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('PENDING', 'CONTACTED', 'CONVERTED', 'IGNORED');

-- AlterTable
ALTER TABLE "waitlist_entries" ADD COLUMN     "contacted_at" TIMESTAMP(3),
ADD COLUMN     "contacted_by" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "WaitlistStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "waitlist_entries_status_idx" ON "waitlist_entries"("status");

-- CreateIndex
CREATE INDEX "waitlist_entries_contacted_at_idx" ON "waitlist_entries"("contacted_at");
