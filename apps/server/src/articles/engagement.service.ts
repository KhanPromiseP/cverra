import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';

@Injectable()
export class EngagementService {
  private readonly logger = new Logger(EngagementService.name);

  constructor(private prisma: PrismaService) {}

  async trackView(userId: string, articleId: string, language: string = 'en') {
    try {
      // Check if user already viewed this article in this language recently
      const recentView = await this.prisma.articleView.findFirst({
        where: {
          userId,
          articleId,
          language,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      if (recentView) {
        return recentView; // Already viewed recently
      }

      // Create new view
      const view = await this.prisma.articleView.create({
        data: {
          userId,
          articleId,
          language,
        },
      });

      // Update article view counts
      await this.prisma.$transaction(async (tx) => {
        // Increment viewCount
        await tx.article.update({
          where: { id: articleId },
          data: {
            viewCount: { increment: 1 },
          },
        });

        // Check if this is a unique view (first time this user views this article)
        const existingViews = await tx.articleView.count({
          where: {
            articleId,
            userId,
          },
        });

        if (existingViews === 1) {
          // This is the first view from this user
          await tx.article.update({
            where: { id: articleId },
            data: {
              uniqueViewCount: { increment: 1 },
            },
          });
        }
      });

      return view;
    } catch (error) {
      this.logger.error('Failed to track view', error);
      throw error;
    }
  }

  async trackLike(userId: string, articleId: string, language: string = 'en') {
    try {
      const existingLike = await this.prisma.articleLike.findUnique({
        where: {
          articleId_userId_language: {
            articleId,
            userId,
            language,
          },
        },
      });

      if (existingLike) {
        // Unlike
        await this.prisma.articleLike.delete({
          where: {
            articleId_userId_language: {
              articleId,
              userId,
              language,
            },
          },
        });

        // Decrement like count
        await this.prisma.article.update({
          where: { id: articleId },
          data: {
            likeCount: { decrement: 1 },
          },
        });

        return { action: 'unliked' };
      } else {
        // Like
        const like = await this.prisma.articleLike.create({
          data: {
            userId,
            articleId,
            language,
          },
        });

        // Increment like count
        await this.prisma.article.update({
          where: { id: articleId },
          data: {
            likeCount: { increment: 1 },
          },
        });

        return { action: 'liked', like };
      }
    } catch (error) {
      this.logger.error('Failed to track like', error);
      throw error;
    }
  }


  async trackEngagement(userId: string, articleId: string, action: string, metadata?: any) {
    try {
      const engagement = await this.prisma.userEngagement.create({
        data: {
          userId,
          articleId,
          action: action as any, // Cast to your EngagementAction enum
          metadata: metadata || {},
        },
      });

      // Update article stats based on action
      const updateData: any = {};
      switch (action) {
        case 'LIKE':
          updateData.likeCount = { increment: 1 };
          break;
        case 'SAVE':
          updateData.saveCount = { increment: 1 };
          break;
        case 'SHARE':
          updateData.shareCount = { increment: 1 };
          break;
        case 'VIEW':
          updateData.viewCount = { increment: 1 };
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await this.prisma.article.update({
          where: { id: articleId },
          data: updateData,
        });
      }

      return engagement;
    } catch (error) {
      this.logger.error('Failed to track engagement', error);
      throw error;
    }
  }


  async trackClap(userId: string, articleId: string, count: number = 1, language: string = 'en') {
    try {
      const existingClap = await this.prisma.articleClap.findUnique({
        where: {
          articleId_userId_language: {
            articleId,
            userId,
            language,
          },
        },
      });

      if (existingClap) {
        // Update existing clap
        const updatedClap = await this.prisma.articleClap.update({
          where: {
            articleId_userId_language: {
              articleId,
              userId,
              language,
            },
          },
          data: {
            count: { increment: count },
          },
        });

        // Update article clap count
        await this.prisma.article.update({
          where: { id: articleId },
          data: {
            clapCount: { increment: count },
          },
        });

        return updatedClap;
      } else {
        // Create new clap
        const clap = await this.prisma.articleClap.create({
          data: {
            userId,
            articleId,
            language,
            count,
          },
        });

        // Update article clap count
        await this.prisma.article.update({
          where: { id: articleId },
          data: {
            clapCount: { increment: count },
          },
        });

        return clap;
      }
    } catch (error) {
      this.logger.error('Failed to track clap', error);
      throw error;
    }
  }

  async trackSave(userId: string, articleId: string, folder: string = 'favorites', language: string = 'en') {
    try {
      const existingSave = await this.prisma.articleSave.findUnique({
        where: {
          articleId_userId_language: {
            articleId,
            userId,
            language,
          },
        },
      });

      if (existingSave) {
        // Remove save
        await this.prisma.articleSave.delete({
          where: {
            articleId_userId_language: {
              articleId,
              userId,
              language,
            },
          },
        });

        // Decrement save count
        await this.prisma.article.update({
          where: { id: articleId },
          data: {
            saveCount: { decrement: 1 },
          },
        });

        return { action: 'unsaved' };
      } else {
        // Save
        const save = await this.prisma.articleSave.create({
          data: {
            userId,
            articleId,
            language,
            folder,
          },
        });

        // Increment save count
        await this.prisma.article.update({
          where: { id: articleId },
          data: {
            saveCount: { increment: 1 },
          },
        });

        return { action: 'saved', save };
      }
    } catch (error) {
      this.logger.error('Failed to track save', error);
      throw error;
    }
  }

  async trackShare(userId: string, articleId: string, platform: string, language: string = 'en') {
    try {
      const share = await this.prisma.articleShare.create({
        data: {
          userId,
          articleId,
          platform,
          language,
        },
      });

      // Update article share count
      await this.prisma.article.update({
        where: { id: articleId },
        data: {
          shareCount: { increment: 1 },
        },
      });

      return share;
    } catch (error) {
      this.logger.error('Failed to track share', error);
      throw error;
    }
  }

  async trackComment(userId: string, articleId: string, commentId: string, language: string = 'en') {
    try {
      // Update article comment count
      await this.prisma.article.update({
        where: { id: articleId },
        data: {
          commentCount: { increment: 1 },
        },
      });

      // Track in user engagements
      await this.prisma.userEngagement.create({
        data: {
          userId,
          articleId,
          action: 'COMMENT',
          metadata: { commentId },
        },
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to track comment', error);
      throw error;
    }
  }

  async getUserEngagementStats(userId: string) {
    const [
      totalViews,
      totalLikes,
      totalClaps,
      totalSaves,
      totalShares,
      totalComments,
      recentEngagements,
    ] = await Promise.all([
      this.prisma.articleView.count({ where: { userId } }),
      this.prisma.articleLike.count({ where: { userId } }),
      this.prisma.articleClap.aggregate({
        where: { userId },
        _sum: { count: true },
      }),
      this.prisma.articleSave.count({ where: { userId } }),
      this.prisma.articleShare.count({ where: { userId } }),
      this.prisma.articleComment.count({ where: { userId } }),
      this.prisma.userEngagement.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    return {
      totalViews,
      totalLikes,
      totalClaps: totalClaps._sum.count || 0,
      totalSaves,
      totalShares,
      totalComments,
      recentEngagements,
      readingStreak: await this.calculateReadingStreak(userId),
      favoriteCategories: await this.getFavoriteCategories(userId),
    };
  }

  private async calculateReadingStreak(userId: string): Promise<number> {
    // Simple streak calculation - consecutive days with at least one view
    const views = await this.prisma.articleView.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    if (views.length === 0) return 0;

    let streak = 1;
    let lastDate = new Date(views[0].createdAt).toDateString();

    for (let i = 1; i < views.length; i++) {
      const currentDate = new Date(views[i].createdAt).toDateString();
      const yesterday = new Date(views[i - 1].createdAt);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (currentDate === yesterdayStr) {
        streak++;
        lastDate = currentDate;
      } else if (currentDate !== lastDate) {
        break;
      }
    }

    return streak;
  }

  private async getFavoriteCategories(userId: string): Promise<any[]> {
    const views = await this.prisma.articleView.findMany({
      where: { userId },
      include: {
        article: {
          include: {
            category: true,
          },
        },
      },
      take: 100,
    });

    const categoryCounts = new Map();
    views.forEach(view => {
      if (view.article?.category) {
        const count = categoryCounts.get(view.article.category.id) || 0;
        categoryCounts.set(view.article.category.id, {
          category: view.article.category,
          count: count + 1,
        });
      }
    });

    return Array.from(categoryCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({
        ...item.category,
        viewCount: item.count,
      }));
  }
}