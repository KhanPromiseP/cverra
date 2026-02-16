/*
  Warnings:

  - A unique constraint covering the columns `[userId,originalId,language]` on the table `CoverLetter` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'DRAFT_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE 'DRAFT_REVIEWED';
ALTER TYPE "NotificationType" ADD VALUE 'VALIDATION_MESSAGE_ADDED';

-- DropIndex
DROP INDEX "CoverLetter_userId_id_key";

-- DropIndex
DROP INDEX "CoverLetter_userId_slug_language_key";

-- CreateIndex
CREATE UNIQUE INDEX "CoverLetter_userId_originalId_language_key" ON "CoverLetter"("userId", "originalId", "language");
