/*
  Warnings:

  - The `status` column on the `Article` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `data` on the `Notification` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,slug,language]` on the table `CoverLetter` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `type` on the `Notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `amount` to the `user_subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AIBuilderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AIBuilderSource" AS ENUM ('TEXT', 'PDF', 'DOC', 'LINKEDIN');

-- CreateEnum
CREATE TYPE "ContactSubject" AS ENUM ('SUPPORT', 'BILLING', 'FEEDBACK', 'BUSINESS', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CategoryTranslationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AssistantMode" AS ENUM ('TUTOR', 'CAREER_COACH', 'CONTENT_GUIDE', 'GENERAL_ASSISTANT');

-- CreateEnum
CREATE TYPE "MemoryImportance" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LIKE', 'COMMENT', 'REPLY', 'ACHIEVEMENT', 'PREMIUM', 'SYSTEM', 'RECOMMENDATION', 'DIGEST', 'READING_MILESTONE', 'ARTICLE_PUBLISHED', 'COMMENT_REPLY', 'MENTION');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ArticleStatus" ADD VALUE 'UNDER_REVIEW';
ALTER TYPE "ArticleStatus" ADD VALUE 'APPROVED';
ALTER TYPE "ArticleStatus" ADD VALUE 'REJECTED';
ALTER TYPE "ArticleStatus" ADD VALUE 'NEEDS_REVISION';

-- AlterEnum
ALTER TYPE "TransactionSource" ADD VALUE 'AI_BUILDER';

-- AlterEnum
ALTER TYPE "UsageAction" ADD VALUE 'AI_RESUME_BUILDER';

-- DropIndex
DROP INDEX "Notification_read_idx";

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewerId" TEXT,
ADD COLUMN     "submittedForReviewAt" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "ArticleCategory" ADD COLUMN     "autoTranslate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "availableLanguages" TEXT[] DEFAULT ARRAY['en']::TEXT[],
ADD COLUMN     "targetLanguages" TEXT[] DEFAULT ARRAY['fr', 'es', 'de']::TEXT[];

-- AlterTable
ALTER TABLE "CoverLetter" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "originalId" TEXT;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "data",
ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "targetId" TEXT,
ADD COLUMN     "targetSlug" TEXT,
ADD COLUMN     "targetTitle" TEXT,
ADD COLUMN     "targetType" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- AlterTable
ALTER TABLE "user_subscriptions" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" "ContactSubject" NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_builder_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "sourceType" "AIBuilderSource" NOT NULL,
    "textLength" INTEGER,
    "characterCount" INTEGER,
    "aiModel" TEXT,
    "enhanceWithAI" BOOLEAN NOT NULL DEFAULT true,
    "includeSuggestions" BOOLEAN NOT NULL DEFAULT true,
    "targetTemplate" TEXT,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "coinsDeducted" INTEGER,
    "transactionId" TEXT,
    "status" "AIBuilderStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "confidence" DOUBLE PRECISION,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "extractedBasics" BOOLEAN NOT NULL DEFAULT false,
    "extractedWork" BOOLEAN NOT NULL DEFAULT false,
    "extractedEducation" BOOLEAN NOT NULL DEFAULT false,
    "extractedSkills" BOOLEAN NOT NULL DEFAULT false,
    "extractedProjects" BOOLEAN NOT NULL DEFAULT false,
    "resultResumeId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "resume_builder_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_builder_costs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "baseCost" INTEGER NOT NULL DEFAULT 0,
    "minCost" INTEGER NOT NULL DEFAULT 0,
    "maxCost" INTEGER NOT NULL DEFAULT 100,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dependsOnLength" BOOLEAN NOT NULL DEFAULT false,
    "lengthMultiplier" DOUBLE PRECISION,
    "lengthThresholds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_builder_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryTranslation" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "status" "CategoryTranslationStatus" NOT NULL DEFAULT 'COMPLETED',
    "translatedBy" TEXT NOT NULL DEFAULT 'AI',
    "aiModel" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "qualityScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryTranslationJob" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "status" "CategoryTranslationStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "aiModel" TEXT NOT NULL DEFAULT 'llama-3.3-70b-versatile',
    "useCache" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CategoryTranslationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotificationSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailArticleLikes" BOOLEAN NOT NULL DEFAULT true,
    "emailArticleComments" BOOLEAN NOT NULL DEFAULT true,
    "emailCommentReplies" BOOLEAN NOT NULL DEFAULT true,
    "emailAchievements" BOOLEAN NOT NULL DEFAULT true,
    "emailReadingDigest" BOOLEAN NOT NULL DEFAULT true,
    "emailRecommendations" BOOLEAN NOT NULL DEFAULT true,
    "emailSystemAnnouncements" BOOLEAN NOT NULL DEFAULT true,
    "pushArticleLikes" BOOLEAN NOT NULL DEFAULT true,
    "pushArticleComments" BOOLEAN NOT NULL DEFAULT true,
    "pushCommentReplies" BOOLEAN NOT NULL DEFAULT true,
    "pushAchievements" BOOLEAN NOT NULL DEFAULT true,
    "pushReadingMilestones" BOOLEAN NOT NULL DEFAULT true,
    "digestFrequency" TEXT NOT NULL DEFAULT 'WEEKLY',
    "quietStartHour" INTEGER NOT NULL DEFAULT 22,
    "quietEndHour" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationMessage" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "section" TEXT,
    "lineNumber" INTEGER,
    "createdById" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValidationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_memories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "topic" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyPoints" TEXT[],
    "contextType" TEXT NOT NULL,
    "relatedIds" TEXT[],
    "tags" TEXT[],
    "importance" "MemoryImportance" NOT NULL DEFAULT 'MEDIUM',
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "source" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "assistant_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "AssistantMode" NOT NULL DEFAULT 'GENERAL_ASSISTANT',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "contextSize" INTEGER NOT NULL DEFAULT 10,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "restoredAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "lastMessageContent" TEXT,

    CONSTRAINT "assistant_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokens" INTEGER,
    "referencedArticles" TEXT[],
    "referencedResumes" TEXT[],
    "referencedLetters" TEXT[],
    "model" TEXT,
    "reasoningTokens" INTEGER,
    "userFeedback" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalConversations" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "preferredMode" "AssistantMode",
    "modeUsage" JSONB NOT NULL DEFAULT '{}',
    "averageResponseTime" DOUBLE PRECISION,
    "satisfactionScore" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_status_idx" ON "contacts"("status");

-- CreateIndex
CREATE INDEX "contacts_createdAt_idx" ON "contacts"("createdAt");

-- CreateIndex
CREATE INDEX "contacts_subject_idx" ON "contacts"("subject");

-- CreateIndex
CREATE UNIQUE INDEX "resume_builder_jobs_requestId_key" ON "resume_builder_jobs"("requestId");

-- CreateIndex
CREATE INDEX "resume_builder_jobs_userId_idx" ON "resume_builder_jobs"("userId");

-- CreateIndex
CREATE INDEX "resume_builder_jobs_status_idx" ON "resume_builder_jobs"("status");

-- CreateIndex
CREATE INDEX "resume_builder_jobs_createdAt_idx" ON "resume_builder_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "resume_builder_jobs_sourceType_idx" ON "resume_builder_jobs"("sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "resume_builder_costs_action_key" ON "resume_builder_costs"("action");

-- CreateIndex
CREATE INDEX "CategoryTranslation_categoryId_idx" ON "CategoryTranslation"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryTranslation_language_idx" ON "CategoryTranslation"("language");

-- CreateIndex
CREATE INDEX "CategoryTranslation_status_idx" ON "CategoryTranslation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_language_key" ON "CategoryTranslation"("categoryId", "language");

-- CreateIndex
CREATE INDEX "CategoryTranslationJob_categoryId_idx" ON "CategoryTranslationJob"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryTranslationJob_status_idx" ON "CategoryTranslationJob"("status");

-- CreateIndex
CREATE INDEX "CategoryTranslationJob_priority_idx" ON "CategoryTranslationJob"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslationJob_categoryId_targetLanguage_key" ON "CategoryTranslationJob"("categoryId", "targetLanguage");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationSettings_userId_key" ON "UserNotificationSettings"("userId");

-- CreateIndex
CREATE INDEX "ValidationMessage_articleId_idx" ON "ValidationMessage"("articleId");

-- CreateIndex
CREATE INDEX "ValidationMessage_createdById_idx" ON "ValidationMessage"("createdById");

-- CreateIndex
CREATE INDEX "ValidationMessage_resolved_idx" ON "ValidationMessage"("resolved");

-- CreateIndex
CREATE INDEX "ValidationMessage_type_idx" ON "ValidationMessage"("type");

-- CreateIndex
CREATE INDEX "ValidationMessage_createdAt_idx" ON "ValidationMessage"("createdAt");

-- CreateIndex
CREATE INDEX "assistant_memories_userId_idx" ON "assistant_memories"("userId");

-- CreateIndex
CREATE INDEX "assistant_memories_topic_idx" ON "assistant_memories"("topic");

-- CreateIndex
CREATE INDEX "assistant_memories_importance_idx" ON "assistant_memories"("importance");

-- CreateIndex
CREATE INDEX "assistant_memories_lastAccessed_idx" ON "assistant_memories"("lastAccessed");

-- CreateIndex
CREATE INDEX "assistant_memories_contextType_idx" ON "assistant_memories"("contextType");

-- CreateIndex
CREATE INDEX "assistant_memories_updatedAt_idx" ON "assistant_memories"("updatedAt");

-- CreateIndex
CREATE INDEX "assistant_conversations_userId_idx" ON "assistant_conversations"("userId");

-- CreateIndex
CREATE INDEX "assistant_conversations_mode_idx" ON "assistant_conversations"("mode");

-- CreateIndex
CREATE INDEX "assistant_conversations_active_idx" ON "assistant_conversations"("active");

-- CreateIndex
CREATE INDEX "assistant_conversations_updatedAt_idx" ON "assistant_conversations"("updatedAt");

-- CreateIndex
CREATE INDEX "assistant_conversations_isDeleted_idx" ON "assistant_conversations"("isDeleted");

-- CreateIndex
CREATE INDEX "assistant_conversations_isArchived_idx" ON "assistant_conversations"("isArchived");

-- CreateIndex
CREATE INDEX "assistant_conversations_isStarred_idx" ON "assistant_conversations"("isStarred");

-- CreateIndex
CREATE INDEX "assistant_conversations_isPinned_idx" ON "assistant_conversations"("isPinned");

-- CreateIndex
CREATE INDEX "assistant_messages_conversationId_idx" ON "assistant_messages"("conversationId");

-- CreateIndex
CREATE INDEX "assistant_messages_role_idx" ON "assistant_messages"("role");

-- CreateIndex
CREATE INDEX "assistant_messages_createdAt_idx" ON "assistant_messages"("createdAt");

-- CreateIndex
CREATE INDEX "assistant_messages_isDeleted_idx" ON "assistant_messages"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "assistant_analytics_userId_key" ON "assistant_analytics"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_idx" ON "AuditLog"("resourceType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_severity_idx" ON "AuditLog"("severity");

-- CreateIndex
CREATE INDEX "Article_status_idx" ON "Article"("status");

-- CreateIndex
CREATE INDEX "CoverLetter_originalId_idx" ON "CoverLetter"("originalId");

-- CreateIndex
CREATE INDEX "CoverLetter_language_idx" ON "CoverLetter"("language");

-- CreateIndex
CREATE UNIQUE INDEX "CoverLetter_userId_slug_language_key" ON "CoverLetter"("userId", "slug", "language");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_builder_jobs" ADD CONSTRAINT "resume_builder_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_builder_jobs" ADD CONSTRAINT "resume_builder_jobs_resultResumeId_fkey" FOREIGN KEY ("resultResumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverLetter" ADD CONSTRAINT "CoverLetter_originalId_fkey" FOREIGN KEY ("originalId") REFERENCES "CoverLetter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ArticleCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryTranslationJob" ADD CONSTRAINT "CategoryTranslationJob_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ArticleCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotificationSettings" ADD CONSTRAINT "UserNotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationMessage" ADD CONSTRAINT "ValidationMessage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationMessage" ADD CONSTRAINT "ValidationMessage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationMessage" ADD CONSTRAINT "ValidationMessage_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_memories" ADD CONSTRAINT "assistant_memories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_memories" ADD CONSTRAINT "assistant_memories_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "assistant_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_conversations" ADD CONSTRAINT "assistant_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_messages" ADD CONSTRAINT "assistant_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "assistant_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_analytics" ADD CONSTRAINT "assistant_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
