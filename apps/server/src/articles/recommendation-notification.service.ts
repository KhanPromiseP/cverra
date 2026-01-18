// recommendation-notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { RecommendationService } from './recommendation.service';
import { ArticleStatus } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RecommendationNotificationService {
  private readonly logger = new Logger(RecommendationNotificationService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private recommendationService: RecommendationService,
  ) {}

  // Send personalized recommendations notifications
  async sendPersonalizedRecommendations() {
    try {
      this.logger.log('Starting personalized recommendations notifications...');

      // Get all users with notification preferences enabled
      const users = await this.prisma.user.findMany({
        where: {
          readingProfile: {
            notifyPersonalized: true,
          },
        },
        include: {
          readingProfile: true,
        },
        take: 100, // Process in batches
      });

      let totalNotificationsSent = 0;

      for (const user of users) {
        try {
          // Generate personalized recommendations for each user
          const recommendations = await this.recommendationService.getPersonalizedRecommendations(
            user.id,
            { limit: 5 }
          );

          if (recommendations && recommendations.length > 0) {
            // Send notification with top recommendations
            await this.notifyUserAboutRecommendations(
              user.id,
              recommendations.slice(0, 3)
            );
            totalNotificationsSent++;
          }
        } catch (error) {
          this.logger.error(`Failed to process user ${user.id}:`, error);
          continue;
        }
      }

      this.logger.log(`Sent ${totalNotificationsSent} personalized recommendation notifications`);
      return totalNotificationsSent;
    } catch (error) {
      this.logger.error('Error sending personalized recommendations:', error);
      throw error;
    }
  }

  // Send new articles notifications based on user preferences
  async sendNewArticlesNotifications() {
    try {
      this.logger.log('Starting new articles notifications...');

      // Get users who want new article notifications
      const users = await this.prisma.user.findMany({
        where: {
          readingProfile: {
            notifyNewArticles: true,
          },
        },
        include: {
          readingProfile: {
            include: {
              favoriteCategories: true,
            },
          },
        },
        take: 100, // Process in batches
      });

      // Get articles published in the last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const recentArticles = await this.prisma.article.findMany({
        where: {
          status: ArticleStatus.PUBLISHED,
          publishedAt: {
            gte: oneDayAgo,
          },
        },
        include: {
          category: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: 50,
      });

      let totalNotificationsSent = 0;

      for (const user of users) {
        try {
          // Filter articles based on user preferences
          const userFavoriteCategoryIds = user.readingProfile?.favoriteCategories?.map(cat => cat.id) || [];
          const userInterests = user.readingProfile?.favoriteTags || [];

          const relevantArticles = recentArticles.filter(article => {
            // Check if article is in favorite categories
            if (userFavoriteCategoryIds.length > 0 && 
                article.categoryId && 
                userFavoriteCategoryIds.includes(article.categoryId)) {
              return true;
            }

            // Check if article tags match user interests
            if (userInterests.length > 0 && 
                article.tags && 
                article.tags.some(tag => userInterests.includes(tag))) {
              return true;
            }

            return false;
          });

          if (relevantArticles.length > 0) {
            await this.notifyUserAboutNewArticles(
              user.id,
              relevantArticles.slice(0, 3)
            );
            totalNotificationsSent++;
          }
        } catch (error) {
          this.logger.error(`Failed to process user ${user.id}:`, error);
          continue;
        }
      }

      this.logger.log(`Sent ${totalNotificationsSent} new article notifications`);
      return totalNotificationsSent;
    } catch (error) {
      this.logger.error('Error sending new articles notifications:', error);
      throw error;
    }
  }

  // Send trending articles notifications
  async sendTrendingArticlesNotifications() {
    try {
      this.logger.log('Starting trending articles notifications...');

      // Get users who want trending notifications
      const users = await this.prisma.user.findMany({
        where: {
          readingProfile: {
            notifyTrending: true,
          },
        },
        take: 100,
      });

      // Get trending articles
      const trendingArticles = await this.prisma.article.findMany({
        where: {
          status: ArticleStatus.PUBLISHED,
          isTrending: true,
          viewCount: {
            gt: 100, // Only articles with significant views
          },
        },
        orderBy: {
          trendingScore: 'desc',
        },
        take: 10,
        include: {
          category: true,
        },
      });

      let totalNotificationsSent = 0;

      for (const user of users) {
        if (trendingArticles.length > 0) {
          await this.notifyUserAboutTrendingArticles(
            user.id,
            trendingArticles.slice(0, 3)
          );
          totalNotificationsSent++;
        }
      }

      this.logger.log(`Sent ${totalNotificationsSent} trending article notifications`);
      return totalNotificationsSent;
    } catch (error) {
      this.logger.error('Error sending trending articles notifications:', error);
      throw error;
    }
  }

  // Send weekly digest notifications
  async sendWeeklyDigestNotifications() {
    try {
      this.logger.log('Starting weekly digest notifications...');

      // Get users with weekly digest frequency
      const users = await this.prisma.user.findMany({
        where: {
          readingProfile: {
            digestFrequency: 'WEEKLY',
          },
        },
        include: {
          readingProfile: true,
        },
        take: 100,
      });

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      let totalNotificationsSent = 0;

      for (const user of users) {
        try {
          // Get user's reading stats for the week
          const stats = await this.getWeeklyReadingStats(user.id, oneWeekAgo);
          
          // Get personalized recommendations for the week
          const recommendations = await this.recommendationService.getPersonalizedRecommendations(
            user.id,
            { limit: 5 }
          );

          if ((stats.totalArticlesRead > 0 || (recommendations && recommendations.length > 0))) {
            await this.sendWeeklyDigest(
              user.id, 
              stats, 
              recommendations ? recommendations.slice(0, 3) : []
            );
            totalNotificationsSent++;
          }
        } catch (error) {
          this.logger.error(`Failed to process user ${user.id}:`, error);
          continue;
        }
      }

      this.logger.log(`Sent ${totalNotificationsSent} weekly digest notifications`);
      return totalNotificationsSent;
    } catch (error) {
      this.logger.error('Error sending weekly digest notifications:', error);
      throw error;
    }
  }

  // Helper method to get weekly reading stats - FIXED VERSION
  private async getWeeklyReadingStats(userId: string, since: Date) {
    const [
      articleViews,
      favoriteCategoryResult,
      likedArticles,
      savedArticles,
    ] = await Promise.all([
      // Total articles read (article views)
      this.prisma.articleView.count({
        where: {
          userId,
          createdAt: { gte: since },
        },
      }),
      // Favorite category
      this.prisma.$queryRaw<{category: string, count: number}[]>`
        SELECT ac.name as category, COUNT(*) as count
        FROM "ArticleView" av
        JOIN "Article" a ON av."articleId" = a.id
        JOIN "ArticleCategory" ac ON a."categoryId" = ac.id
        WHERE av."userId" = ${userId}
          AND av."createdAt" >= ${since}
        GROUP BY ac.name
        ORDER BY count DESC
        LIMIT 1
      `,
      // Liked articles count
      this.prisma.articleLike.count({
        where: {
          userId,
          createdAt: { gte: since },
        },
      }),
      // Saved articles count
      this.prisma.articleSave.count({
        where: {
          userId,
          createdAt: { gte: since },
        },
      }),
    ]);

    // Calculate total reading time (estimate 5 minutes per article view)
    const totalReadingTime = articleViews * 5;

    return {
      totalArticlesRead: articleViews,
      totalReadingTime,
      favoriteCategory: favoriteCategoryResult[0]?.category || 'General',
      likedArticles,
      savedArticles,
    };
  }

  // Notification methods
  private async notifyUserAboutRecommendations(userId: string, articles: any[]) {
    if (!articles || articles.length === 0) return;
    
    const articleTitles = articles.map(article => article.title).join(', ');
    
    await this.notificationService.createNotification(userId, 'RECOMMENDATION', {
      title: '🎯 New Recommendations For You',
      message: `Based on your interests: ${articleTitles}`,
      targetType: 'ARTICLE',
      targetId: articles[0]?.id,
      targetTitle: articles[0]?.title,
      targetSlug: articles[0]?.slug,
      metadata: {
        articleIds: articles.map(a => a.id),
        articleTitles: articles.map(a => a.title),
        count: articles.length,
        type: 'PERSONALIZED_RECOMMENDATIONS',
      },
    });
  }

  private async notifyUserAboutNewArticles(userId: string, articles: any[]) {
    if (!articles || articles.length === 0) return;
    
    const articleTitles = articles.map(article => article.title).join(', ');
    
    await this.notificationService.createNotification(userId, 'SYSTEM', {
      title: '📚 New Articles You Might Like',
      message: `Check out these new articles: ${articleTitles}`,
      targetType: 'ARTICLE',
      targetId: articles[0]?.id,
      targetTitle: articles[0]?.title,
      targetSlug: articles[0]?.slug,
      metadata: {
        articleIds: articles.map(a => a.id),
        articleTitles: articles.map(a => a.title),
        count: articles.length,
        type: 'NEW_ARTICLES',
      },
    });
  }

  private async notifyUserAboutTrendingArticles(userId: string, articles: any[]) {
    if (!articles || articles.length === 0) return;
    
    const articleTitles = articles.map(article => article.title).join(', ');
    
    await this.notificationService.createNotification(userId, 'SYSTEM', {
      title: '🔥 Trending Now',
      message: `Everyone's reading: ${articleTitles}`,
      targetType: 'ARTICLE',
      targetId: articles[0]?.id,
      targetTitle: articles[0]?.title,
      targetSlug: articles[0]?.slug,
      metadata: {
        articleIds: articles.map(a => a.id),
        articleTitles: articles.map(a => a.title),
        count: articles.length,
        type: 'TRENDING_ARTICLES',
      },
    });
  }

  private async sendWeeklyDigest(userId: string, stats: any, recommendations: any[]) {
    const message = this.generateDigestMessage(stats, recommendations);
    
    await this.notificationService.createNotification(userId, 'DIGEST', {
      title: '📈 Your Weekly Reading Digest',
      message: message,
      metadata: {
        stats,
        recommendations: recommendations.map(r => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
        })),
        type: 'WEEKLY_DIGEST',
      },
    });
  }

  private generateDigestMessage(stats: any, recommendations: any[]): string {
    const parts = [];
    
    if (stats.totalArticlesRead > 0) {
      parts.push(`You read ${stats.totalArticlesRead} articles`);
    }
    
    if (stats.likedArticles > 0) {
      parts.push(`liked ${stats.likedArticles} articles`);
    }
    
    if (stats.savedArticles > 0) {
      parts.push(`saved ${stats.savedArticles} articles`);
    }
    
    let message = 'Your weekly reading summary: ';
    
    if (parts.length > 0) {
      message += parts.join(', ') + '.';
    } else {
      message += 'No reading activity this week. Start exploring!';
    }
    
    if (recommendations && recommendations.length > 0) {
      message += ` Check out ${recommendations.length} new recommendations for you!`;
    }
    
    return message;
  }

  // Scheduled tasks
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async dailyRecommendationsJob() {
    this.logger.log('Running daily recommendations notification job');
    await this.sendPersonalizedRecommendations();
  }

  @Cron(CronExpression.EVERY_DAY_AT_11AM)
  async newArticlesJob() {
    this.logger.log('Running new articles notification job');
    await this.sendNewArticlesNotifications();
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async trendingArticlesJob() {
    this.logger.log('Running trending articles notification job');
    await this.sendTrendingArticlesNotifications();
  }

  // Use EVERY_WEEK instead of EVERY_MONDAY_AT_9AM
  @Cron(CronExpression.EVERY_WEEK)
  async weeklyDigestJob() {
    this.logger.log('Running weekly digest notification job');
    await this.sendWeeklyDigestNotifications();
  }

  // Optional: If you want to run at a specific time on Monday, use custom cron expression
  // @Cron('0 9 * * 1') // Runs at 9 AM every Monday
  // async mondayDigestJob() {
  //   this.logger.log('Running Monday weekly digest notification job');
  //   await this.sendWeeklyDigestNotifications();
  // }

  // Manual trigger methods for testing
  async triggerManualNotifications(userId: string, type: 'recommendations' | 'new' | 'trending' | 'digest') {
    switch (type) {
      case 'recommendations':
        const recs = await this.recommendationService.getPersonalizedRecommendations(userId, { limit: 3 });
        await this.notifyUserAboutRecommendations(userId, recs || []);
        break;
      case 'new':
        const newArticles = await this.prisma.article.findMany({
          where: {
            status: ArticleStatus.PUBLISHED,
            publishedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
          take: 3,
        });
        await this.notifyUserAboutNewArticles(userId, newArticles);
        break;
      case 'trending':
        const trending = await this.prisma.article.findMany({
          where: {
            status: ArticleStatus.PUBLISHED,
            isTrending: true,
          },
          take: 3,
        });
        await this.notifyUserAboutTrendingArticles(userId, trending);
        break;
      case 'digest':
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const stats = await this.getWeeklyReadingStats(userId, oneWeekAgo);
        const weeklyRecs = await this.recommendationService.getPersonalizedRecommendations(userId, { limit: 3 });
        await this.sendWeeklyDigest(userId, stats, weeklyRecs || []);
        break;
    }
    
    return { success: true, message: `Notification triggered: ${type}` };
  }
}