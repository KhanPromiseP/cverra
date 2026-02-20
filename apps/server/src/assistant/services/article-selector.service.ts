// services/article-selector.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { IntentAnalysis, IntentType } from '../interfaces/intent.types';
import { Prisma } from '@prisma/client';

export interface ArticleWithMetadata {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  categoryColor?: string;
  author: string;
  readingTime: number;
  readingLevel: string;
  url: string; // This will be a relative path now
  isFeatured: boolean;
  isTrending: boolean;
  isEditorPick: boolean;
  rating?: string;
  reviewCount: number;
  recommendationPercentage?: number;
  recommendPercent?: number;
  conversational?: string;
  formatted: string;
}

@Injectable()
export class ArticleSelectorService {
  private readonly logger = new Logger(ArticleSelectorService.name);

  constructor(private prisma: PrismaService) {}

  async getRelevantArticles(
    userId: string,
    intent: IntentType | string,
    limit: number = 3,
    intentAnalysis?: IntentAnalysis
  ): Promise<ArticleWithMetadata[]> {
    try {
      // Get user's reading profile
      const profile = await this.prisma.userReadingProfile.findUnique({
        where: { userId },
        select: {
          favoriteCategories: true,
          favoriteTags: true,
          difficultyPreference: true
        }
      });

      // Get user's reading history
      const readArticles = await this.prisma.articleView.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        distinct: ['articleId'],
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { articleId: true }
      });

      const readArticleIds = readArticles.map(v => v.articleId);

      // Get recent reading history
      const recentViews = await this.prisma.articleView.groupBy({
        by: ['articleId'],
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        _count: true,
        orderBy: { _count: { articleId: 'desc' } },
        take: 5
      });

      const recentArticleIds = recentViews.map(v => v.articleId);

      // Build search query based on intent
      const intentQuery = this.getIntentSearchQuery(intent, intentAnalysis);

      // Build the where clause
      const where: Prisma.ArticleWhereInput = {
        status: 'PUBLISHED',
      };

      const orConditions: Prisma.ArticleWhereInput[] = [];

      // Add favorite categories condition
      if (profile?.favoriteCategories?.length) {
        orConditions.push({
          categoryId: { in: profile.favoriteCategories.map((c: any) => c.id) }
        });
      }

      // Add recent views condition
      if (recentArticleIds.length) {
        orConditions.push({
          id: { in: recentArticleIds }
        });
      }

      // Add intent-based search condition
      if (intentQuery) {
        orConditions.push({
          OR: [
            { title: { contains: intentQuery, mode: 'insensitive' as Prisma.QueryMode } },
            { excerpt: { contains: intentQuery, mode: 'insensitive' as Prisma.QueryMode } },
            { tags: { has: intentQuery } }
          ]
        });
      }

      // Add featured/trending articles
      orConditions.push(
        { isFeatured: true },
        { isTrending: true },
        { isEditorPick: true }
      );

      if (orConditions.length > 0) {
        where.OR = orConditions;
      }

      // Don't recommend already-read articles
      if (readArticleIds.length) {
        where.NOT = { id: { in: readArticleIds } };
      }

      const articles = await this.prisma.article.findMany({
        where,
        include: {
          author: { select: { name: true } },
          category: { select: { name: true, color: true } },
          reviews: {
            where: { status: 'APPROVED' },
            select: { rating: true, helpfulCount: true, insightText: true }
          },
          _count: {
            select: {
              views: true,
              likes: true,
              saves: true,
              reviews: true
            }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { isTrending: 'desc' },
          { isEditorPick: 'desc' },
          { publishedAt: 'desc' }
        ],
        take: limit * 3
      });

      return this.scoreAndFormatArticles(articles, profile, limit, intentQuery);
    } catch (error) {
      this.logger.error('Failed to get relevant articles:', error);
      return [];
    }
  }

  private getIntentSearchQuery(intent: IntentType | string, intentAnalysis?: IntentAnalysis): string | null {
    if (intentAnalysis?.keywords && intentAnalysis.keywords.length > 0) {
      return intentAnalysis.keywords[0];
    }

    const intentMap: Record<string, string> = {
      [IntentType.CAREER_ADVICE]: 'career',
      [IntentType.LEARNING_PATH]: 'learning',
      [IntentType.ARTICLE_RECOMMENDATION]: 'guide',
      [IntentType.CONTENT_CLARIFICATION]: 'explanation',
    };

    return intentMap[intent as string] || null;
  }

  private scoreAndFormatArticles(
    articles: any[], 
    profile: any, 
    limit: number,
    searchQuery: string | null
  ): ArticleWithMetadata[] {
    // Score articles based on multiple factors
    const scoredArticles = articles.map(article => {
      let score = 0;
      
      // Base score from features
      if (article.isFeatured) score += 10;
      if (article.isTrending) score += 8;
      if (article.isEditorPick) score += 9;
      
      // Popularity score
      score += Math.log((article._count?.views || 0) + 1) * 2;
      score += Math.log((article._count?.likes || 0) + 1) * 1.5;
      score += Math.log((article._count?.saves || 0) + 1) * 1.5;
      
      // Review score
      if (article.reviews?.length) {
        const avgRating = article.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / article.reviews.length;
        score += avgRating * 3;
        
        const helpfulCount = article.reviews.reduce((sum: number, r: any) => sum + (r.helpfulCount || 0), 0);
        score += Math.log(helpfulCount + 1);
      }
      
      // Relevance to search query
      if (searchQuery) {
        if (article.title?.toLowerCase().includes(searchQuery.toLowerCase())) score += 5;
        if (article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())) score += 3;
        if (article.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))) score += 2;
      }
      
      // Category match
      if (profile?.favoriteCategories?.some((c: any) => c.id === article.categoryId)) {
        score += 5;
      }
      
      // Difficulty match
      if (profile?.difficultyPreference && article.readingLevel) {
        if (article.readingLevel === profile.difficultyPreference.toUpperCase()) {
          score += 3;
        }
      }
      
      return { ...article, score };
    });

    // Sort by score and take top
    const topArticles = scoredArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Format with rich metadata
    return topArticles.map(article => {
      // Calculate review stats
      const reviews = article.reviews || [];
      const totalReviews = reviews.length;
      const avgRating = totalReviews > 0 
        ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : null;
      
      const recommendedReviews = reviews.filter((r: any) => r.rating >= 4).length;
      const recommendPercent = totalReviews > 0 
        ? Math.round((recommendedReviews / totalReviews) * 100)
        : null;

      // Get a helpful review snippet
      const helpfulReview = reviews
        .sort((a: any, b: any) => (b.helpfulCount || 0) - (a.helpfulCount || 0))[0];

      // Build badges
      const badges = [];
      if (article.isFeatured) badges.push('🌟 FEATURED');
      if (article.isTrending) badges.push('🔥 TRENDING');
      if (article.isEditorPick) badges.push('✨ EDITOR\'S PICK');
      
      const badgeText = badges.length ? ` *${badges.join(' ')}*` : '';

      // Build review text
      let reviewText = '';
      if (totalReviews > 0 && avgRating) {
        reviewText = `\n   ⭐ ${avgRating} (${totalReviews} reviews)`;
        if (recommendPercent) {
          reviewText += ` • ${recommendPercent}% recommend`;
        }
        
        if (helpfulReview?.insightText) {
          const insight = helpfulReview.insightText.substring(0, 100);
          reviewText += `\n   💬 "${insight}${helpfulReview.insightText.length > 100 ? '...' : ''}"`;
        }
      }

      // Reading time and level
      const readingTime = article.readingTime ? `${article.readingTime} min read` : '';
      const readingLevel = article.readingLevel ? article.readingLevel.toLowerCase() : '';
      const metadata = [readingTime, readingLevel].filter(Boolean).join(' • ');
      const metadataText = metadata ? ` • ${metadata}` : '';

      // Category - handle null properly
      const category = article.category?.name || 'Uncategorized';
      
      // Category color - convert null to undefined
      const categoryColor = article.category?.color || undefined;

      // Generate relative URL for SPA routing
      const articleUrl = this.generateArticleUrl(article);

      // Create CONVERSATIONAL format for the assistant
      const conversational = `I found this great article ${badgeText ? 'that\'s ' + badgeText : ''}:\n\n` +
        `**[${article.title}](${articleUrl})**${metadataText}\n` +
        `${article.excerpt ? article.excerpt.substring(0, 120) + '...' : ''}` +
        reviewText;

      return {
        id: article.id,
        title: article.title,
        excerpt: article.excerpt?.substring(0, 150) + '...' || '',
        category,
        categoryColor,
        author: article.author?.name || 'Unknown',
        readingTime: article.readingTime || 5,
        readingLevel: article.readingLevel || 'INTERMEDIATE',
        url: articleUrl, // This is now a relative path
        isFeatured: article.isFeatured || false,
        isTrending: article.isTrending || false,
        isEditorPick: article.isEditorPick || false,
        rating: avgRating || undefined,
        reviewCount: totalReviews,
        recommendationPercentage: recommendPercent || undefined,
        recommendPercent: recommendPercent || undefined,
        conversational,
        formatted: `[${category}] [${article.title}](${articleUrl})${metadataText}${reviewText}`
      };
    });
  }

  private generateArticleUrl(article: any): string {
    // Return relative path for SPA routing
    return `/dashboard/article/${article.slug}`;
  }
}