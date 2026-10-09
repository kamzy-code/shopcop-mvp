-- Remove BOTH from WaitlistUserType enum
-- Postgres doesn't support removing enum values directly; we rename and recreate.

-- Step 1: Update any existing BOTH entries to BUY (safe default)
UPDATE "waitlist_entries" SET "user_type" = 'BUY' WHERE "user_type" = 'BOTH';

-- Step 2: Change column type to text temporarily
ALTER TABLE "waitlist_entries" ALTER COLUMN "user_type" TYPE TEXT;

-- Step 3: Drop old enum
DROP TYPE "WaitlistUserType";

-- Step 4: Recreate enum without BOTH
CREATE TYPE "WaitlistUserType" AS ENUM ('BUY', 'SELL');

-- Step 5: Restore column type
ALTER TABLE "waitlist_entries" ALTER COLUMN "user_type" TYPE "WaitlistUserType" USING "user_type"::"WaitlistUserType";

-- Step 6: Add challenges column
ALTER TABLE "waitlist_entries" ADD COLUMN "challenges" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
