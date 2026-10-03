-- CreateEnum
CREATE TYPE "WaitlistUserType" AS ENUM ('BUY', 'SELL', 'BOTH');

-- CreateTable
CREATE TABLE "waitlist_entries" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "user_type" "WaitlistUserType" NOT NULL,
    "trade_details" TEXT NOT NULL,
    "open_to_chat" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_email_key" ON "waitlist_entries"("email");

-- CreateIndex
CREATE INDEX "waitlist_entries_user_type_idx" ON "waitlist_entries"("user_type");

-- CreateIndex
CREATE INDEX "waitlist_entries_open_to_chat_idx" ON "waitlist_entries"("open_to_chat");

-- CreateIndex
CREATE INDEX "waitlist_entries_created_at_idx" ON "waitlist_entries"("created_at");
