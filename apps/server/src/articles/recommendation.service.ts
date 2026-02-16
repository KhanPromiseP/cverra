// recommendation.service.ts - CORRECTED VERSION
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import { 
  RecommendationRequestDto, 
  UpdateReadingProfileDto,
  FeedbackDto,
  RecommendationReason,
  FeedbackType
} from './dto/recommendation.dto';
import { EngagementService } from './engagement.service';

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEEDS_REVISION = 'NEEDS_REVISION',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  SCHEDULED = 'SCHEDULED'
}

interface Recommendation {
  article: any;
  score: number;
  reason: RecommendationReason;
  source: string;
}

interface SimilarUser {
  userId: string;
}

interface UserProfile {
  id: string;
  userId: string;
  favoriteCategories: any[];
  favoriteTags: string[];
  notifyNewArticles: boolean;
  notifyPersonalized: boolean;
  digestFrequency: string;
  [key: string]: any;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private prisma: PrismaService,
    private engagementService: EngagementService,
  ) {}

  async getPersonalizedRecommendations(userId: string, options: RecommendationRequestDto) {
    if (userId === 'anonymous' || !userId) {
      return this.getTrendingRecommendationsSimple(options.limit || 10);
    }

    try {
      const userExists = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!userExists) {
        return this.getTrendingRecommendationsSimple(options.limit || 10);
      }

      const userProfile = await this.getOrCreateUserProfile(userId);
      const recommendations = await this.generateRecommendations(userId, userProfile, options);
      
      const filtered = recommendations.filter(
        rec => !options.excludeIds?.includes(rec.article.id)
      ).slice(0, options.limit || 10);

      await this.trackRecommendationsShown(userId, filtered);

      return filtered.map(rec => rec.article);
    } catch (error) {
      this.logger.error('Error getting personalized recommendations:', error);
      return this.getTrendingRecommendationsSimple(options.limit || 10);
    }
  }

  private async getTrendingRecommendationsSimple(limit: number = 6) {
    return this.prisma.article.findMany({
      where: {
        status: ArticleStatus.PUBLISHED,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            picture: true,
          },
        },
        category: true,
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: limit,
    });
  }

  private async generateRecommendations(userId: string, userProfile: UserProfile, options: RecommendationRequestDto): Promise<Recommendation[]> {
    const strategies = [
      this.getContentBasedRecommendations(userId, userProfile),
      this.getCollaborativeRecommendations(userId),
      this.getTrendingRecommendations(),
      this.getCategoryBasedRecommendations(userProfile),
    ];

    const results = await Promise.allSettled(strategies);
    
    const allRecs: Recommendation[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allRecs.push(...result.value);
      }
    }

    return this.scoreAndSortRecommendations(allRecs);
  }

  private async getContentBasedRecommendations(userId: string, userProfile: UserProfile): Promise<Recommendation[]> {
    const readArticles = await this.prisma.articleView.findMany({
      where: { userId },
      select: { articleId: true },
      take: 50,
    });

    if (readArticles.length === 0) {
      return [];
    }

    const recentArticleIds = readArticles.map(r => r.articleId);
    const recentArticles = await this.prisma.article.findMany({
      where: {
        id: { in: recentArticleIds.slice(-5) },
      },
      select: {
        categoryId: true,
        tags: true,
      },
    });

    const favoriteCategories = userProfile.favoriteCategories?.map((c: any) => c.id) || [];
    const favoriteTags = userProfile.favoriteTags || [];

    const categoryIds = favoriteCategories.length > 0 
      ? favoriteCategories 
      : recentArticles.map(a => a.categoryId).filter(id => id);

    const tags = favoriteTags.length > 0 
      ? favoriteTags 
      : recentArticles.flatMap(a => a.tags || []);

    const whereClause: any = {
      status: ArticleStatus.PUBLISHED,
      id: { notIn: recentArticleIds },
    };

    const orConditions = [];
    if (categoryIds.length > 0) {
      orConditions.push({ categoryId: { in: categoryIds } });
    }
    if (tags.length > 0) {
      orConditions.push({ tags: { hasSome: tags } });
    }

    if (orConditions.length > 0) {
      whereClause.OR = orConditions;
    } else {
      return [];
    }

    const recommendations = await this.prisma.article.findMany({
      where: whereClause,
      take: 20,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            picture: true,
          },
        },
      },
    });

    return recommendations.map(article => ({
      article,
      score: 0.7,
      reason: RecommendationReason.SIMILAR_TO_HISTORY,
      source: 'CONTENT_BASED',
    }));
  }

  private async getCollaborativeRecommendations(userId: string): Promise<Recommendation[]> {
    const userReadArticles = await this.prisma.articleView.findMany({
      where: { userId },
      select: { articleId: true },
      take: 20,
    });

    if (userReadArticles.length < 3) {
      return [];
    }

    const articleIds = userReadArticles.map(r => r.articleId);
    const similarUsers = await this.prisma.$queryRaw<SimilarUser[]>`
      SELECT DISTINCT uv."userId"
      FROM "ArticleView" uv
      WHERE uv."articleId" IN (${articleIds.join("','")})
        AND uv."userId" != ${userId}
      GROUP BY uv."userId"
      HAVING COUNT(DISTINCT uv."articleId") >= 2
      LIMIT 10
    `;

    if (!similarUsers || similarUsers.length === 0) {
      return [];
    }

    const similarUserIds = similarUsers.map(u => u.userId);
    const likedArticles = await this.prisma.articleLike.findMany({
      where: {
        userId: { in: similarUserIds },
        article: {
          status: ArticleStatus.PUBLISHED,
        },
      },
      include: {
        article: {
          include: {
            category: true,
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                picture: true,
              },
            },
          },
        },
      },
      take: 20,
    });

    const articleCounts = new Map<string, number>();
    likedArticles.forEach(like => {
      const count = articleCounts.get(like.articleId) || 0;
      articleCounts.set(like.articleId, count + 1);
    });

    const recommendations = Array.from(articleCounts.entries())
      .map(([articleId, count]) => {
        const like = likedArticles.find(l => l.articleId === articleId);
        if (!like?.article) return null;
        
        return {
          article: like.article,
          score: count / similarUsers.length,
          reason: RecommendationReason.SIMILAR_USERS_LIKED,
          source: 'COLLABORATIVE',
        };
      })
      .filter((rec): rec is Recommendation => rec !== null);

    return recommendations;
  }

  private async getTrendingRecommendations(): Promise<Recommendation[]> {
    const trendingArticles = await this.prisma.article.findMany({
      where: {
        status: ArticleStatus.PUBLISHED,
        isTrending: true,
      },
      take: 10,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            picture: true,
          },
        },
      },
    });

    return trendingArticles.map(article => ({
      article,
      score: 0.8,
      reason: RecommendationReason.TRENDING_NOW,
      source: 'TRENDING',
    }));
  }

  private async getCategoryBasedRecommendations(userProfile: UserProfile): Promise<Recommendation[]> {
    if (!userProfile.favoriteCategories || userProfile.favoriteCategories.length === 0) {
      return [];
    }

    const categoryIds = userProfile.favoriteCategories.map((c: any) => c.id);
    const popularInCategories = await this.prisma.article.findMany({
      where: {
        status: ArticleStatus.PUBLISHED,
        categoryId: { in: categoryIds },
        viewCount: { gt: 100 },
      },
      orderBy: {
        likeCount: 'desc',
      },
      take: 15,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            picture: true,
          },
        },
      },
    });

    return popularInCategories.map(article => ({
      article,
      score: 0.6,
      reason: RecommendationReason.POPULAR_IN_CATEGORY,
      source: 'CATEGORY_BASED',
    }));
  }

  private scoreAndSortRecommendations(recommendations: Recommendation[]): Recommendation[] {
    const uniqueMap = new Map<string, Recommendation>();
    recommendations.forEach(rec => {
      if (!rec.article) return;
      
      if (uniqueMap.has(rec.article.id)) {
        const existing = uniqueMap.get(rec.article.id)!;
        if (rec.score > existing.score) {
          uniqueMap.set(rec.article.id, rec);
        }
      } else {
        uniqueMap.set(rec.article.id, rec);
      }
    });

    const now = new Date();
    const uniqueRecs = Array.from(uniqueMap.values()).map(rec => {
      const publishDate = rec.article.publishedAt || rec.article.createdAt;
      const articleAge = now.getTime() - new Date(publishDate).getTime();
      const daysOld = articleAge / (1000 * 60 * 60 * 24);
      
      let freshnessBoost = 0;
      if (daysOld < 7) {
        freshnessBoost = (7 - daysOld) * 0.05;
      }
      
      return {
        ...rec,
        score: Math.min(1, rec.score + freshnessBoost),
      };
    });

    return uniqueRecs.sort((a, b) => b.score - a.score);
  }

  private async getOrCreateUserProfile(userId: string): Promise<UserProfile> {
    let profile = await this.prisma.userReadingProfile.findUnique({
      where: { userId },
      include: {
        favoriteCategories: true,
      },
    });

    if (!profile) {
      profile = await this.prisma.userReadingProfile.create({
        data: {
          userId,
        },
        include: {
          favoriteCategories: true,
        },
      });

      await this.initializeUserProfile(userId);
    }

    return profile as UserProfile;
  }

  private async initializeUserProfile(userId: string): Promise<void> {
    const recentReads = await this.prisma.articleView.findMany({
      where: { userId },
      include: {
        article: {
          include: {
            category: true,
          },
        },
      },
      take: 10,
    });

    if (recentReads.length > 0) {
      const categoryCounts = new Map<string, number>();
      recentReads.forEach(read => {
        if (read.article.category) {
          const count = categoryCounts.get(read.article.category.id) || 0;
          categoryCounts.set(read.article.category.id, count + 1);
        }
      });

      const topCategories = Array.from(categoryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([categoryId]) => ({ id: categoryId }));

      if (topCategories.length > 0) {
        await this.prisma.userReadingProfile.update({
          where: { userId },
          data: {
            favoriteCategories: {
              connect: topCategories,
            },
          },
        });
      }
    }
  }

  private async trackRecommendationsShown(userId: string, recommendations: Recommendation[]): Promise<void> {
    try {
      const shownData = recommendations.map(rec => ({
        userId,
        articleId: rec.article.id,
        score: rec.score,
        reason: rec.reason,
        source: rec.source,
        shownAt: new Date(),
      }));

      await this.prisma.articleRecommendation.createMany({
        data: shownData,
        skipDuplicates: true,
      });
    } catch (error) {
      this.logger.error('Failed to track recommendations shown', error);
    }
  }

  async recordFeedback(userId: string, articleId: string, feedback: FeedbackDto) {
    await this.prisma.articleRecommendation.updateMany({
      where: {
        userId,
        articleId,
        clickedAt: null,
        dismissedAt: null,
      },
      data: {
        feedback: feedback.feedback,
        ...(feedback.feedback === FeedbackType.LIKED 
          ? { clickedAt: new Date() } 
          : { dismissedAt: new Date() }
        ),
      },
    });

    if (feedback.feedback === FeedbackType.NOT_INTERESTED) {
      await this.updateUserPreferences(userId, articleId, 'negative');
    } else if (feedback.feedback === FeedbackType.LIKED) {
      await this.updateUserPreferences(userId, articleId, 'positive');
    }
  }

  private async updateUserPreferences(userId: string, articleId: string, feedbackType: 'positive' | 'negative'): Promise<void> {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: { category: true },
    });

    if (!article) return;

    const profile = await this.prisma.userReadingProfile.findUnique({
      where: { userId },
      include: { favoriteCategories: true },
    });

    if (!profile) return;

    if (feedbackType === 'positive' && article.category) {
      const isAlreadyFavorite = profile.favoriteCategories.some(
        (cat: any) => cat.id === article.categoryId
      );

      if (!isAlreadyFavorite) {
        await this.prisma.userReadingProfile.update({
          where: { userId },
          data: {
            favoriteCategories: {
              connect: { id: article.categoryId },
            },
          },
        });
      }
    }
  }

  // This method should be in article.service.ts, not here
  // Remove this method from recommendation.service.ts
  // async updateReadingProfile(userId: string, dto: UpdateReadingProfileDto) {
  //   // This should be moved to article.service.ts
  // }

  async getRecommendationStats(userId: string) {
    const [totalShown, totalClicked, totalDismissed, recentRecommendations] = await Promise.all([
      this.prisma.articleRecommendation.count({ where: { userId } }),
      this.prisma.articleRecommendation.count({ 
        where: { 
          userId, 
          clickedAt: { not: null } 
        } 
      }),
      this.prisma.articleRecommendation.count({ 
        where: { 
          userId, 
          dismissedAt: { not: null } 
        } 
      }),
      this.prisma.articleRecommendation.findMany({
        where: { userId },
        orderBy: { shownAt: 'desc' },
        take: 20,
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
              category: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const clickThroughRate = totalShown > 0 ? (totalClicked / totalShown) * 100 : 0;
    const dismissalRate = totalShown > 0 ? (totalDismissed / totalShown) * 100 : 0;

    return {
      stats: {
        totalShown,
        totalClicked,
        totalDismissed,
        clickThroughRate: parseFloat(clickThroughRate.toFixed(2)),
        dismissalRate: parseFloat(dismissalRate.toFixed(2)),
      },
      recentRecommendations,
      profile: await this.getOrCreateUserProfile(userId),
    };
  }
}