/*
  Warnings:

  - You are about to drop the column `preferredReadingTime` on the `UserReadingProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "contentType" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "featuredRanking" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "isPopular" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readingLevel" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
ADD COLUMN     "timeToRead" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "trendingScore" INTEGER NOT NULL DEFAULT 50;

-- AlterTable
ALTER TABLE "ArticleTranslation" ADD COLUMN     "contentHash" TEXT;

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "UserReadingProfile" DROP COLUMN "preferredReadingTime",
ADD COLUMN     "preferredReadingTimeOfDay" TEXT,
ADD COLUMN     "preferredSessionDuration" INTEGER;

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "badgeColor" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalRequired" INTEGER NOT NULL,
    "shareable" BOOLEAN NOT NULL DEFAULT true,
    "shareImage" TEXT,
    "shareText" TEXT,
    "shareUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeTranslation" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" "TranslationStatus" NOT NULL DEFAULT 'PENDING',
    "confidence" DOUBLE PRECISION,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "translatedBy" TEXT,
    "aiModel" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "qualityScore" INTEGER,
    "totalTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAccessed" TIMESTAMP(3),

    CONSTRAINT "ResumeTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeTranslationJob" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "status" "TranslationStatus" NOT NULL DEFAULT 'PENDING',
    "aiModel" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ResumeTranslationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeTranslationRecord" (
    "id" TEXT NOT NULL,
    "originalResumeId" TEXT NOT NULL,
    "translatedResumeId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "aiModel" TEXT,
    "totalTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeTranslationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Achievement_userId_idx" ON "Achievement"("userId");

-- CreateIndex
CREATE INDEX "Achievement_userId_unlocked_idx" ON "Achievement"("userId", "unlocked");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_userId_title_key" ON "Achievement"("userId", "title");

-- CreateIndex
CREATE INDEX "ResumeTranslation_resumeId_idx" ON "ResumeTranslation"("resumeId");

-- CreateIndex
CREATE INDEX "ResumeTranslation_language_idx" ON "ResumeTranslation"("language");

-- CreateIndex
CREATE INDEX "ResumeTranslation_status_idx" ON "ResumeTranslation"("status");

-- CreateIndex
CREATE INDEX "ResumeTranslation_updatedAt_idx" ON "ResumeTranslation"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeTranslation_resumeId_language_key" ON "ResumeTranslation"("resumeId", "language");

-- CreateIndex
CREATE INDEX "ResumeTranslationJob_resumeId_idx" ON "ResumeTranslationJob"("resumeId");

-- CreateIndex
CREATE INDEX "ResumeTranslationJob_status_idx" ON "ResumeTranslationJob"("status");

-- CreateIndex
CREATE INDEX "ResumeTranslationJob_priority_idx" ON "ResumeTranslationJob"("priority");

-- CreateIndex
CREATE INDEX "ResumeTranslationJob_createdAt_idx" ON "ResumeTranslationJob"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeTranslationJob_resumeId_targetLanguage_key" ON "ResumeTranslationJob"("resumeId", "targetLanguage");

-- CreateIndex
CREATE INDEX "ResumeTranslationRecord_originalResumeId_idx" ON "ResumeTranslationRecord"("originalResumeId");

-- CreateIndex
CREATE INDEX "ResumeTranslationRecord_translatedResumeId_idx" ON "ResumeTranslationRecord"("translatedResumeId");

-- CreateIndex
CREATE INDEX "ResumeTranslationRecord_language_idx" ON "ResumeTranslationRecord"("language");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeTranslationRecord_originalResumeId_translatedResumeId_key" ON "ResumeTranslationRecord"("originalResumeId", "translatedResumeId");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeTranslationRecord_translatedResumeId_key" ON "ResumeTranslationRecord"("translatedResumeId");

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeTranslation" ADD CONSTRAINT "ResumeTranslation_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeTranslationJob" ADD CONSTRAINT "ResumeTranslationJob_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeTranslationRecord" ADD CONSTRAINT "ResumeTranslationRecord_originalResumeId_fkey" FOREIGN KEY ("originalResumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeTranslationRecord" ADD CONSTRAINT "ResumeTranslationRecord_translatedResumeId_fkey" FOREIGN KEY ("translatedResumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
