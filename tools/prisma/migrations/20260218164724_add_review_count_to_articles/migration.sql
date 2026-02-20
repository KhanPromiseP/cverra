-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED', 'PAUSED', 'ACHIEVED');

-- CreateEnum
CREATE TYPE "GoalCategory" AS ENUM ('CAREER', 'LEARNING', 'HEALTH', 'FINANCE', 'RELATIONSHIP', 'PERSONAL_GROWTH', 'CONTENT_CREATION', 'BUSINESS');

-- CreateEnum
CREATE TYPE "EmotionalState" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE', 'FRUSTRATED', 'CONFUSED', 'ANXIOUS', 'MOTIVATED', 'TIRED', 'OVERWHELMED', 'DISCOURAGED', 'EXCITED', 'CURIOUS');

-- CreateEnum
CREATE TYPE "BrainItemType" AS ENUM ('THOUGHT', 'IDEA', 'NOTE', 'TODO', 'PROJECT', 'QUESTION', 'INSIGHT', 'REFERENCE');

-- CreateEnum
CREATE TYPE "BrainItemStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'COMPLETED', 'DEFERRED');

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "assistant_conversations" ADD COLUMN     "brainItems" TEXT[],
ADD COLUMN     "coachingEffectiveness" DOUBLE PRECISION,
ADD COLUMN     "emotionalArc" JSONB,
ADD COLUMN     "identityLens" TEXT,
ADD COLUMN     "insights" TEXT[],
ADD COLUMN     "keyDecisions" TEXT[],
ADD COLUMN     "primaryGoal" TEXT;

-- AlterTable
ALTER TABLE "assistant_memories" ADD COLUMN     "decisionContext" TEXT,
ADD COLUMN     "emotionalContext" TEXT,
ADD COLUMN     "importanceScore" DOUBLE PRECISION,
ADD COLUMN     "linkedGoals" TEXT[],
ADD COLUMN     "linkedIdentity" TEXT,
ADD COLUMN     "patternIds" TEXT[];

-- AlterTable
ALTER TABLE "assistant_messages" ADD COLUMN     "brainItemCreated" TEXT,
ADD COLUMN     "decisionPoint" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emotionalState" TEXT,
ADD COLUMN     "goalMentions" TEXT[],
ADD COLUMN     "identityReinforcement" BOOLEAN,
ADD COLUMN     "insightExtracted" TEXT;

-- CreateTable
CREATE TABLE "article_reviews" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "insightText" TEXT NOT NULL,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ReviewStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_helpful_votes" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_helpful_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "GoalCategory" NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "targetDate" TIMESTAMP(3),
    "progress" INTEGER DEFAULT 0,
    "milestones" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "mentionCount" INTEGER NOT NULL DEFAULT 0,
    "lastMentioned" TIMESTAMP(3),
    "stalledSince" TIMESTAMP(3),
    "stallReason" TEXT,
    "alignsWithIdentity" BOOLEAN NOT NULL DEFAULT true,
    "identity_statement_id" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_goal_mentions" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "conversationId" TEXT,
    "messageId" TEXT,
    "context" TEXT NOT NULL,
    "sentiment" TEXT,
    "progress" INTEGER,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "keywords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assistantMemoryId" TEXT,
    "assistantConversationId" TEXT,

    CONSTRAINT "assistant_goal_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_emotional_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "primaryState" "EmotionalState" NOT NULL,
    "secondaryStates" "EmotionalState"[],
    "intensity" INTEGER NOT NULL DEFAULT 5,
    "conversationId" TEXT,
    "messageId" TEXT,
    "trigger" TEXT,
    "keywords" TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "analysis" TEXT,
    "isPattern" BOOLEAN NOT NULL DEFAULT false,
    "patternId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assistantMemoryId" TEXT,
    "assistantConversationId" TEXT,
    "assistantEmotionalPatternId" TEXT,

    CONSTRAINT "assistant_emotional_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_emotional_patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "triggers" TEXT[],
    "frequency" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 5,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "firstDetected" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDetected" TIMESTAMP(3) NOT NULL,
    "lastInterventionAt" TIMESTAMP(3),
    "interventionCount" INTEGER NOT NULL DEFAULT 0,
    "interventionEffectiveness" DOUBLE PRECISION,

    CONSTRAINT "assistant_emotional_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_identities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "statements" JSONB NOT NULL,
    "careerIdentity" TEXT,
    "learningIdentity" TEXT,
    "values" TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "evolution" JSONB DEFAULT '{}',
    "lastReinforced" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_decisions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "prosCons" JSONB NOT NULL,
    "scores" JSONB NOT NULL,
    "recommendation" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "goalAlignment" JSONB,
    "chosenOption" TEXT,
    "chosenAt" TIMESTAMP(3),
    "outcome" TEXT,
    "satisfaction" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_weekly_summaries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "highlights" TEXT[],
    "challenges" TEXT[],
    "goalProgress" JSONB NOT NULL,
    "completedGoals" TEXT[],
    "emotionalTrend" JSONB NOT NULL,
    "fatigueDays" INTEGER NOT NULL DEFAULT 0,
    "motivatedDays" INTEGER NOT NULL DEFAULT 0,
    "conversationCount" INTEGER NOT NULL DEFAULT 0,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "articleReadCount" INTEGER NOT NULL DEFAULT 0,
    "driftingTopics" TEXT[],
    "recommendedFocus" TEXT,
    "recommendedActions" TEXT[],
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_weekly_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_brain_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BrainItemType" NOT NULL,
    "content" TEXT NOT NULL,
    "title" TEXT,
    "status" "BrainItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "parentId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "linkedItems" TEXT[],
    "linkedGoals" TEXT[],
    "linkedArticles" TEXT[],
    "projectPhase" TEXT,
    "milestones" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),

    CONSTRAINT "assistant_brain_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_path_simulations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "skillProjections" JSONB NOT NULL,
    "marketOpportunities" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "tradeoffs" JSONB NOT NULL,
    "alternatives" JSONB NOT NULL,
    "wasViewed" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" TIMESTAMP(3),
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_path_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_reviews_articleId_idx" ON "article_reviews"("articleId");

-- CreateIndex
CREATE INDEX "article_reviews_userId_idx" ON "article_reviews"("userId");

-- CreateIndex
CREATE INDEX "article_reviews_rating_idx" ON "article_reviews"("rating");

-- CreateIndex
CREATE INDEX "article_reviews_status_idx" ON "article_reviews"("status");

-- CreateIndex
CREATE INDEX "article_reviews_createdAt_idx" ON "article_reviews"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "article_reviews_articleId_userId_key" ON "article_reviews"("articleId", "userId");

-- CreateIndex
CREATE INDEX "review_helpful_votes_reviewId_idx" ON "review_helpful_votes"("reviewId");

-- CreateIndex
CREATE INDEX "review_helpful_votes_userId_idx" ON "review_helpful_votes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "review_helpful_votes_reviewId_userId_key" ON "review_helpful_votes"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "assistant_goals_userId_idx" ON "assistant_goals"("userId");

-- CreateIndex
CREATE INDEX "assistant_goals_status_idx" ON "assistant_goals"("status");

-- CreateIndex
CREATE INDEX "assistant_goals_category_idx" ON "assistant_goals"("category");

-- CreateIndex
CREATE INDEX "assistant_goals_priority_idx" ON "assistant_goals"("priority");

-- CreateIndex
CREATE INDEX "assistant_goals_stalledSince_idx" ON "assistant_goals"("stalledSince");

-- CreateIndex
CREATE UNIQUE INDEX "assistant_goals_userId_description_key" ON "assistant_goals"("userId", "description");

-- CreateIndex
CREATE INDEX "assistant_goal_mentions_goalId_idx" ON "assistant_goal_mentions"("goalId");

-- CreateIndex
CREATE INDEX "assistant_goal_mentions_createdAt_idx" ON "assistant_goal_mentions"("createdAt");

-- CreateIndex
CREATE INDEX "assistant_emotional_snapshots_userId_idx" ON "assistant_emotional_snapshots"("userId");

-- CreateIndex
CREATE INDEX "assistant_emotional_snapshots_primaryState_idx" ON "assistant_emotional_snapshots"("primaryState");

-- CreateIndex
CREATE INDEX "assistant_emotional_snapshots_createdAt_idx" ON "assistant_emotional_snapshots"("createdAt");

-- CreateIndex
CREATE INDEX "assistant_emotional_snapshots_isPattern_idx" ON "assistant_emotional_snapshots"("isPattern");

-- CreateIndex
CREATE INDEX "assistant_emotional_patterns_userId_idx" ON "assistant_emotional_patterns"("userId");

-- CreateIndex
CREATE INDEX "assistant_emotional_patterns_patternType_idx" ON "assistant_emotional_patterns"("patternType");

-- CreateIndex
CREATE INDEX "assistant_emotional_patterns_frequency_idx" ON "assistant_emotional_patterns"("frequency");

-- CreateIndex
CREATE UNIQUE INDEX "assistant_identities_userId_key" ON "assistant_identities"("userId");

-- CreateIndex
CREATE INDEX "assistant_decisions_userId_idx" ON "assistant_decisions"("userId");

-- CreateIndex
CREATE INDEX "assistant_decisions_createdAt_idx" ON "assistant_decisions"("createdAt");

-- CreateIndex
CREATE INDEX "assistant_weekly_summaries_userId_idx" ON "assistant_weekly_summaries"("userId");

-- CreateIndex
CREATE INDEX "assistant_weekly_summaries_weekStartDate_idx" ON "assistant_weekly_summaries"("weekStartDate");

-- CreateIndex
CREATE INDEX "assistant_weekly_summaries_isRead_idx" ON "assistant_weekly_summaries"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "assistant_weekly_summaries_userId_weekStartDate_key" ON "assistant_weekly_summaries"("userId", "weekStartDate");

-- CreateIndex
CREATE INDEX "assistant_brain_items_userId_idx" ON "assistant_brain_items"("userId");

-- CreateIndex
CREATE INDEX "assistant_brain_items_type_idx" ON "assistant_brain_items"("type");

-- CreateIndex
CREATE INDEX "assistant_brain_items_status_idx" ON "assistant_brain_items"("status");

-- CreateIndex
CREATE INDEX "assistant_brain_items_category_idx" ON "assistant_brain_items"("category");

-- CreateIndex
CREATE INDEX "assistant_brain_items_priority_idx" ON "assistant_brain_items"("priority");

-- CreateIndex
CREATE INDEX "assistant_path_simulations_userId_idx" ON "assistant_path_simulations"("userId");

-- CreateIndex
CREATE INDEX "assistant_path_simulations_createdAt_idx" ON "assistant_path_simulations"("createdAt");

-- AddForeignKey
ALTER TABLE "article_reviews" ADD CONSTRAINT "article_reviews_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_reviews" ADD CONSTRAINT "article_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "article_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_goals" ADD CONSTRAINT "assistant_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_goals" ADD CONSTRAINT "assistant_goals_identity_statement_id_fkey" FOREIGN KEY ("identity_statement_id") REFERENCES "assistant_identities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_goal_mentions" ADD CONSTRAINT "assistant_goal_mentions_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "assistant_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_goal_mentions" ADD CONSTRAINT "assistant_goal_mentions_assistantMemoryId_fkey" FOREIGN KEY ("assistantMemoryId") REFERENCES "assistant_memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_goal_mentions" ADD CONSTRAINT "assistant_goal_mentions_assistantConversationId_fkey" FOREIGN KEY ("assistantConversationId") REFERENCES "assistant_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_emotional_snapshots" ADD CONSTRAINT "assistant_emotional_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_emotional_snapshots" ADD CONSTRAINT "assistant_emotional_snapshots_assistantMemoryId_fkey" FOREIGN KEY ("assistantMemoryId") REFERENCES "assistant_memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_emotional_snapshots" ADD CONSTRAINT "assistant_emotional_snapshots_assistantConversationId_fkey" FOREIGN KEY ("assistantConversationId") REFERENCES "assistant_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_emotional_snapshots" ADD CONSTRAINT "assistant_emotional_snapshots_assistantEmotionalPatternId_fkey" FOREIGN KEY ("assistantEmotionalPatternId") REFERENCES "assistant_emotional_patterns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_emotional_patterns" ADD CONSTRAINT "assistant_emotional_patterns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_identities" ADD CONSTRAINT "assistant_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_decisions" ADD CONSTRAINT "assistant_decisions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_weekly_summaries" ADD CONSTRAINT "assistant_weekly_summaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_brain_items" ADD CONSTRAINT "assistant_brain_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_path_simulations" ADD CONSTRAINT "assistant_path_simulations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
