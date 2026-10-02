/*
  Warnings:

  - You are about to drop the column `admin_notes` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `handled_by` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "admin_notes",
DROP COLUMN "handled_by";
