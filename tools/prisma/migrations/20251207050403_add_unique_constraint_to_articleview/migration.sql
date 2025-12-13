/*
  Warnings:

  - Added the required column `source` to the `WalletTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('SUBSCRIPTION', 'ONE_TIME_PURCHASE', 'REFUND', 'BONUS', 'MANUAL_ADJUSTMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentAccess" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "TranslationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('ACTIVE', 'DELETED', 'HIDDEN', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "RecommendationReason" AS ENUM ('SIMILAR_TO_HISTORY', 'POPULAR_IN_CATEGORY', 'TRENDING_NOW', 'SIMILAR_USERS_LIKED', 'BASED_ON_SEARCH', 'EDITORS_PICK', 'COMPLEMENTARY_SKILL', 'CAREER_PATH');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('LIKED', 'NOT_INTERESTED', 'ALREADY_READ', 'NOT_RELEVANT');

-- CreateEnum
CREATE TYPE "EngagementAction" AS ENUM ('VIEW', 'READ_COMPLETE', 'LIKE', 'COMMENT', 'SHARE', 'SAVE', 'CLICK_RECOMMENDATION', 'DISMISS_RECOMMENDATION');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PROCESSING';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubscriptionStatus" ADD VALUE 'PENDING';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "source" "TransactionSource" NOT NULL;

-- CreateTable
CREATE TABLE "ArticleCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "articleCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "plainText" TEXT,
    "categoryId" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accessType" "ContentAccess" NOT NULL DEFAULT 'FREE',
    "coinPrice" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT NOT NULL,
    "coverImage" TEXT,
    "featuredImage" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "readingTime" INTEGER NOT NULL DEFAULT 5,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isTrending" BOOLEAN NOT NULL DEFAULT false,
    "isEditorPick" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueViewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "saveCount" INTEGER NOT NULL DEFAULT 0,
    "clapCount" INTEGER NOT NULL DEFAULT 0,
    "autoTranslate" BOOLEAN NOT NULL DEFAULT true,
    "availableLanguages" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "targetLanguages" TEXT[] DEFAULT ARRAY['fr']::TEXT[],
    "publishedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "lastTrendingAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PremiumAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "accessUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PremiumAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleTranslation" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "plainText" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "TranslationStatus" NOT NULL DEFAULT 'COMPLETED',
    "translatedBy" TEXT NOT NULL DEFAULT 'AI',
    "aiModel" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "qualityScore" INTEGER,
    "lastAccessed" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "isCached" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "CommentStatus" NOT NULL DEFAULT 'ACTIVE',
    "reported" BOOLEAN NOT NULL DEFAULT false,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleLike" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleClap" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleClap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleSave" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "folder" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleSave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleShare" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT,
    "platform" TEXT NOT NULL,
    "shareUrl" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleView" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationJob" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "status" "TranslationStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-4',
    "useCache" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReadingProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "favoriteTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "averageReadingTime" INTEGER NOT NULL DEFAULT 0,
    "preferredReadingTime" TEXT,
    "readingStreak" INTEGER NOT NULL DEFAULT 0,
    "lastReadAt" TIMESTAMP(3),
    "preferredContentType" TEXT,
    "difficultyPreference" TEXT NOT NULL DEFAULT 'intermediate',
    "notifyNewArticles" BOOLEAN NOT NULL DEFAULT true,
    "notifyTrending" BOOLEAN NOT NULL DEFAULT true,
    "notifyPersonalized" BOOLEAN NOT NULL DEFAULT true,
    "digestFrequency" TEXT NOT NULL DEFAULT 'weekly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReadingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" "RecommendationReason" NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'CONTENT_BASED',
    "shownAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "feedback" "FeedbackType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "results" INTEGER NOT NULL DEFAULT 0,
    "filters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEngagement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT,
    "action" "EngagementAction" NOT NULL,
    "metadata" JSONB,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArticleCategoryToUserReadingProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ArticleCategory_slug_key" ON "ArticleCategory"("slug");

-- CreateIndex
CREATE INDEX "ArticleCategory_slug_idx" ON "ArticleCategory"("slug");

-- CreateIndex
CREATE INDEX "ArticleCategory_order_idx" ON "ArticleCategory"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_slug_idx" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");

-- CreateIndex
CREATE INDEX "Article_categoryId_idx" ON "Article"("categoryId");

-- CreateIndex
CREATE INDEX "Article_status_idx" ON "Article"("status");

-- CreateIndex
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");

-- CreateIndex
CREATE INDEX "Article_isFeatured_idx" ON "Article"("isFeatured");

-- CreateIndex
CREATE INDEX "Article_isTrending_idx" ON "Article"("isTrending");

-- CreateIndex
CREATE INDEX "Article_viewCount_idx" ON "Article"("viewCount");

-- CreateIndex
CREATE INDEX "Article_likeCount_idx" ON "Article"("likeCount");

-- CreateIndex
CREATE INDEX "Article_accessType_idx" ON "Article"("accessType");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "PremiumAccess_userId_idx" ON "PremiumAccess"("userId");

-- CreateIndex
CREATE INDEX "PremiumAccess_articleId_idx" ON "PremiumAccess"("articleId");

-- CreateIndex
CREATE INDEX "PremiumAccess_accessUntil_idx" ON "PremiumAccess"("accessUntil");

-- CreateIndex
CREATE UNIQUE INDEX "PremiumAccess_userId_articleId_key" ON "PremiumAccess"("userId", "articleId");

-- CreateIndex
CREATE INDEX "ArticleTranslation_articleId_idx" ON "ArticleTranslation"("articleId");

-- CreateIndex
CREATE INDEX "ArticleTranslation_language_idx" ON "ArticleTranslation"("language");

-- CreateIndex
CREATE INDEX "ArticleTranslation_status_idx" ON "ArticleTranslation"("status");

-- CreateIndex
CREATE INDEX "ArticleTranslation_lastAccessed_idx" ON "ArticleTranslation"("lastAccessed");

-- CreateIndex
CREATE INDEX "ArticleTranslation_needsReview_idx" ON "ArticleTranslation"("needsReview");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleTranslation_articleId_language_key" ON "ArticleTranslation"("articleId", "language");

-- CreateIndex
CREATE INDEX "ArticleComment_articleId_idx" ON "ArticleComment"("articleId");

-- CreateIndex
CREATE INDEX "ArticleComment_userId_idx" ON "ArticleComment"("userId");

-- CreateIndex
CREATE INDEX "ArticleComment_parentId_idx" ON "ArticleComment"("parentId");

-- CreateIndex
CREATE INDEX "ArticleComment_isFeatured_idx" ON "ArticleComment"("isFeatured");

-- CreateIndex
CREATE INDEX "ArticleComment_createdAt_idx" ON "ArticleComment"("createdAt");

-- CreateIndex
CREATE INDEX "ArticleComment_language_idx" ON "ArticleComment"("language");

-- CreateIndex
CREATE INDEX "ArticleLike_articleId_idx" ON "ArticleLike"("articleId");

-- CreateIndex
CREATE INDEX "ArticleLike_userId_idx" ON "ArticleLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleLike_articleId_userId_language_key" ON "ArticleLike"("articleId", "userId", "language");

-- CreateIndex
CREATE INDEX "ArticleClap_articleId_idx" ON "ArticleClap"("articleId");

-- CreateIndex
CREATE INDEX "ArticleClap_userId_idx" ON "ArticleClap"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleClap_articleId_userId_language_key" ON "ArticleClap"("articleId", "userId", "language");

-- CreateIndex
CREATE INDEX "ArticleSave_articleId_idx" ON "ArticleSave"("articleId");

-- CreateIndex
CREATE INDEX "ArticleSave_userId_idx" ON "ArticleSave"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleSave_articleId_userId_language_key" ON "ArticleSave"("articleId", "userId", "language");

-- CreateIndex
CREATE INDEX "ArticleShare_articleId_idx" ON "ArticleShare"("articleId");

-- CreateIndex
CREATE INDEX "ArticleShare_userId_idx" ON "ArticleShare"("userId");

-- CreateIndex
CREATE INDEX "ArticleShare_platform_idx" ON "ArticleShare"("platform");

-- CreateIndex
CREATE INDEX "ArticleShare_createdAt_idx" ON "ArticleShare"("createdAt");

-- CreateIndex
CREATE INDEX "ArticleView_articleId_idx" ON "ArticleView"("articleId");

-- CreateIndex
CREATE INDEX "ArticleView_userId_idx" ON "ArticleView"("userId");

-- CreateIndex
CREATE INDEX "ArticleView_createdAt_idx" ON "ArticleView"("createdAt");

-- CreateIndex
CREATE INDEX "ArticleView_language_idx" ON "ArticleView"("language");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleView_articleId_userId_language_key" ON "ArticleView"("articleId", "userId", "language");

-- CreateIndex
CREATE INDEX "CommentLike_commentId_idx" ON "CommentLike"("commentId");

-- CreateIndex
CREATE INDEX "CommentLike_userId_idx" ON "CommentLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentLike_commentId_userId_key" ON "CommentLike"("commentId", "userId");

-- CreateIndex
CREATE INDEX "TranslationJob_articleId_idx" ON "TranslationJob"("articleId");

-- CreateIndex
CREATE INDEX "TranslationJob_status_idx" ON "TranslationJob"("status");

-- CreateIndex
CREATE INDEX "TranslationJob_priority_idx" ON "TranslationJob"("priority");

-- CreateIndex
CREATE INDEX "TranslationJob_createdAt_idx" ON "TranslationJob"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TranslationJob_articleId_targetLanguage_key" ON "TranslationJob"("articleId", "targetLanguage");

-- CreateIndex
CREATE UNIQUE INDEX "UserReadingProfile_userId_key" ON "UserReadingProfile"("userId");

-- CreateIndex
CREATE INDEX "ArticleRecommendation_userId_idx" ON "ArticleRecommendation"("userId");

-- CreateIndex
CREATE INDEX "ArticleRecommendation_articleId_idx" ON "ArticleRecommendation"("articleId");

-- CreateIndex
CREATE INDEX "ArticleRecommendation_score_idx" ON "ArticleRecommendation"("score");

-- CreateIndex
CREATE INDEX "ArticleRecommendation_createdAt_idx" ON "ArticleRecommendation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleRecommendation_userId_articleId_key" ON "ArticleRecommendation"("userId", "articleId");

-- CreateIndex
CREATE INDEX "SearchHistory_userId_idx" ON "SearchHistory"("userId");

-- CreateIndex
CREATE INDEX "SearchHistory_query_idx" ON "SearchHistory"("query");

-- CreateIndex
CREATE INDEX "SearchHistory_createdAt_idx" ON "SearchHistory"("createdAt");

-- CreateIndex
CREATE INDEX "UserEngagement_userId_idx" ON "UserEngagement"("userId");

-- CreateIndex
CREATE INDEX "UserEngagement_articleId_idx" ON "UserEngagement"("articleId");

-- CreateIndex
CREATE INDEX "UserEngagement_action_idx" ON "UserEngagement"("action");

-- CreateIndex
CREATE INDEX "UserEngagement_createdAt_idx" ON "UserEngagement"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_ArticleCategoryToUserReadingProfile_AB_unique" ON "_ArticleCategoryToUserReadingProfile"("A", "B");

-- CreateIndex
CREATE INDEX "_ArticleCategoryToUserReadingProfile_B_index" ON "_ArticleCategoryToUserReadingProfile"("B");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ArticleCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PremiumAccess" ADD CONSTRAINT "PremiumAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PremiumAccess" ADD CONSTRAINT "PremiumAccess_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTranslation" ADD CONSTRAINT "ArticleTranslation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleComment" ADD CONSTRAINT "ArticleComment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleComment" ADD CONSTRAINT "ArticleComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleComment" ADD CONSTRAINT "ArticleComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ArticleComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleLike" ADD CONSTRAINT "ArticleLike_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleLike" ADD CONSTRAINT "ArticleLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleClap" ADD CONSTRAINT "ArticleClap_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleClap" ADD CONSTRAINT "ArticleClap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleSave" ADD CONSTRAINT "ArticleSave_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleSave" ADD CONSTRAINT "ArticleSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleShare" ADD CONSTRAINT "ArticleShare_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleShare" ADD CONSTRAINT "ArticleShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleView" ADD CONSTRAINT "ArticleView_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleView" ADD CONSTRAINT "ArticleView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "ArticleComment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationJob" ADD CONSTRAINT "TranslationJob_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReadingProfile" ADD CONSTRAINT "UserReadingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleRecommendation" ADD CONSTRAINT "ArticleRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleRecommendation" ADD CONSTRAINT "ArticleRecommendation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEngagement" ADD CONSTRAINT "UserEngagement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEngagement" ADD CONSTRAINT "UserEngagement_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleCategoryToUserReadingProfile" ADD CONSTRAINT "_ArticleCategoryToUserReadingProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "ArticleCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleCategoryToUserReadingProfile" ADD CONSTRAINT "_ArticleCategoryToUserReadingProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "UserReadingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
