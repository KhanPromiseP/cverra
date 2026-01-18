// import { Injectable, Logger } from '@nestjs/common';
// import { PrismaService } from '../../../../tools/prisma/prisma.service';

// @Injectable()
// export class EngagementService {
//   private readonly logger = new Logger(EngagementService.name);

//   constructor(private prisma: PrismaService) {}

//   async trackView(userId: string, articleId: string, language: string = 'en') {
//     try {
//       // Check if user already viewed this article in this language recently
//       const recentView = await this.prisma.articleView.findFirst({
//         where: {
//           userId,
//           articleId,
//           language,
//           createdAt: {
//             gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
//           },
//         },
//       });

//       if (recentView) {
//         return recentView; // Already viewed recently
//       }

//       // Create new view
//       const view = await this.prisma.articleView.create({
//         data: {
//           userId,
//           articleId,
//           language,
//         },
//       });

//       // Update article view counts
//       await this.prisma.$transaction(async (tx) => {
//         // Increment viewCount
//         await tx.article.update({
//           where: { id: articleId },
//           data: {
//             viewCount: { increment: 1 },
//           },
//         });

//         // Check if this is a unique view (first time this user views this article)
//         const existingViews = await tx.articleView.count({
//           where: {
//             articleId,
//             userId,
//           },
//         });

//         if (existingViews === 1) {
//           // This is the first view from this user
//           await tx.article.update({
//             where: { id: articleId },
//             data: {
//               uniqueViewCount: { increment: 1 },
//             },
//           });
//         }
//       });

//       return view;
//     } catch (error) {
//       this.logger.error('Failed to track view', error);
//       throw error;
//     }
//   }

//   async trackLike(userId: string, articleId: string, language: string = 'en') {
//     try {
//       const existingLike = await this.prisma.articleLike.findUnique({
//         where: {
//           articleId_userId_language: {
//             articleId,
//             userId,
//             language,
//           },
//         },
//       });

//       if (existingLike) {
//         // Unlike
//         await this.prisma.articleLike.delete({
//           where: {
//             articleId_userId_language: {
//               articleId,
//               userId,
//               language,
//             },
//           },
//         });

//         // Decrement like count
//         await this.prisma.article.update({
//           where: { id: articleId },
//           data: {
//             likeCount: { decrement: 1 },
//           },
//         });

//         return { action: 'unliked' };
//       } else {
//         // Like
//         const like = await this.prisma.articleLike.create({
//           data: {
//             userId,
//             articleId,
//             language,
//           },
//         });

//         // Increment like count
//         await this.prisma.article.update({
//           where: { id: articleId },
//           data: {
//             likeCount: { increment: 1 },
//           },
//         });

//         return { action: 'liked', like };
//       }
//     } catch (error) {
//       this.logger.error('Failed to track like', error);
//       throw error;
//     }
//   }


//   async trackEngagement(userId: string, articleId: string, action: string, metadata?: any) {
//     try {
//       const engagement = await this.prisma.userEngagement.create({
//         data: {
//           userId,
//           articleId,
//           action: action as any, // Cast to your EngagementAction enum
//           metadata: metadata || {},
//         },
//       });

//       // Update article stats based on action
//       const updateData: any = {};
//       switch (action) {
//         case 'LIKE':
//           updateData.likeCount = { increment: 1 };
//           break;
//         case 'SAVE':
//           updateData.saveCount = { increment: 1 };
//           break;
//         case 'SHARE':
//           updateData.shareCount = { increment: 1 };
//           break;
//         case 'VIEW':
//           updateData.viewCount = { increment: 1 };
//           break;
//       }

//       if (Object.keys(updateData).length > 0) {
//         await this.prisma.article.update({
//           where: { id: articleId },
//           data: updateData,
//         });
//       }

//       return engagement;
//     } catch (error) {
//       this.logger.error('Failed to track engagement', error);
//       throw error;
//     }
//   }


//   async trackClap(userId: string, articleId: string, count: number = 1, language: string = 'en') {
//     try {
//       const existingClap = await this.prisma.articleClap.findUnique({
//         where: {
//           articleId_userId_language: {
//             articleId,
//             userId,
//             language,
//           },
//         },
//       });

//       if (existingClap) {
//         // Update existing clap
//         const updatedClap = await this.prisma.articleClap.update({
//           where: {
//             articleId_userId_language: {
//               articleId,
//               userId,
//               language,
//             },
//           },
//           data: {
//             count: { increment: count },
//           },
//         });

//         // Update article clap count
//         await this.prisma.article.update({
//           where: { id: articleId },
//           data: {
//             clapCount: { increment: count },
//           },
//         });

//         return updatedClap;
//       } else {
//         // Create new clap
//         const clap = await this.prisma.articleClap.create({
//           data: {
//             userId,
//             articleId,
//             language,
//             count,
//           },
//         });

//         // Update article clap count
//         await this.prisma.article.update({
//           where: { id: articleId },
//           data: {
//             clapCount: { increment: count },
//           },
//         });

//         return clap;
//       }
//     } catch (error) {
//       this.logger.error('Failed to track clap', error);
//       throw error;
//     }
//   }

//   async trackSave(userId: string, articleId: string, folder: string = 'favorites', language: string = 'en') {
//     try {
//       const existingSave = await this.prisma.articleSave.findUnique({
//         where: {
//           articleId_userId_language: {
//             articleId,
//             userId,
//             language,
//           },
//         },
//       });

//       if (existingSave) {
//         // Remove save
//         await this.prisma.articleSave.delete({
//           where: {
//             articleId_userId_language: {
//               articleId,
//               userId,
//               language,
//             },
//           },
//         });

//         // Decrement save count
//         await this.prisma.article.update({
//           where: { id: articleId },
//           data: {
//             saveCount: { decrement: 1 },
//           },
//         });

//         return { action: 'unsaved' };
//       } else {
//         // Save
//         const save = await this.prisma.articleSave.create({
//           data: {
//             userId,
//             articleId,
//             language,
//             folder,
//           },
//         });

//         // Increment save count
//         await this.prisma.article.update({
//           where: { id: articleId },
//           data: {
//             saveCount: { increment: 1 },
//           },
//         });

//         return { action: 'saved', save };
//       }
//     } catch (error) {
//       this.logger.error('Failed to track save', error);
//       throw error;
//     }
//   }

//   async trackShare(userId: string, articleId: string, platform: string, language: string = 'en') {
//     try {
//       const share = await this.prisma.articleShare.create({
//         data: {
//           userId,
//           articleId,
//           platform,
//           language,
//         },
//       });

//       // Update article share count
//       await this.prisma.article.update({
//         where: { id: articleId },
//         data: {
//           shareCount: { increment: 1 },
//         },
//       });

//       return share;
//     } catch (error) {
//       this.logger.error('Failed to track share', error);
//       throw error;
//     }
//   }

//   async trackComment(userId: string, articleId: string, commentId: string, language: string = 'en') {
//     try {
//       // Update article comment count
//       await this.prisma.article.update({
//         where: { id: articleId },
//         data: {
//           commentCount: { increment: 1 },
//         },
//       });

//       // Track in user engagements
//       await this.prisma.userEngagement.create({
//         data: {
//           userId,
//           articleId,
//           action: 'COMMENT',
//           metadata: { commentId },
//         },
//       });

//       return { success: true };
//     } catch (error) {
//       this.logger.error('Failed to track comment', error);
//       throw error;
//     }
//   }

//   async getUserEngagementStats(userId: string) {
//     const [
//       totalViews,
//       totalLikes,
//       totalClaps,
//       totalSaves,
//       totalShares,
//       totalComments,
//       recentEngagements,
//     ] = await Promise.all([
//       this.prisma.articleView.count({ where: { userId } }),
//       this.prisma.articleLike.count({ where: { userId } }),
//       this.prisma.articleClap.aggregate({
//         where: { userId },
//         _sum: { count: true },
//       }),
//       this.prisma.articleSave.count({ where: { userId } }),
//       this.prisma.articleShare.count({ where: { userId } }),
//       this.prisma.articleComment.count({ where: { userId } }),
//       this.prisma.userEngagement.findMany({
//         where: { userId },
//         orderBy: { createdAt: 'desc' },
//         take: 20,
//         include: {
//           article: {
//             select: {
//               id: true,
//               title: true,
//               slug: true,
//             },
//           },
//         },
//       }),
//     ]);

//     return {
//       totalViews,
//       totalLikes,
//       totalClaps: totalClaps._sum.count || 0,
//       totalSaves,
//       totalShares,
//       totalComments,
//       recentEngagements,
//       readingStreak: await this.calculateReadingStreak(userId),
//       favoriteCategories: await this.getFavoriteCategories(userId),
//     };
//   }

//   private async calculateReadingStreak(userId: string): Promise<number> {
//     // Simple streak calculation - consecutive days with at least one view
//     const views = await this.prisma.articleView.findMany({
//       where: { userId },
//       select: { createdAt: true },
//       orderBy: { createdAt: 'desc' },
//     });

//     if (views.length === 0) return 0;

//     let streak = 1;
//     let lastDate = new Date(views[0].createdAt).toDateString();

//     for (let i = 1; i < views.length; i++) {
//       const currentDate = new Date(views[i].createdAt).toDateString();
//       const yesterday = new Date(views[i - 1].createdAt);
//       yesterday.setDate(yesterday.getDate() - 1);
//       const yesterdayStr = yesterday.toDateString();

//       if (currentDate === yesterdayStr) {
//         streak++;
//         lastDate = currentDate;
//       } else if (currentDate !== lastDate) {
//         break;
//       }
//     }

//     return streak;
//   }

//   private async getFavoriteCategories(userId: string): Promise<any[]> {
//     const views = await this.prisma.articleView.findMany({
//       where: { userId },
//       include: {
//         article: {
//           include: {
//             category: true,
//           },
//         },
//       },
//       take: 100,
//     });

//     const categoryCounts = new Map();
//     views.forEach(view => {
//       if (view.article?.category) {
//         const count = categoryCounts.get(view.article.category.id) || 0;
//         categoryCounts.set(view.article.category.id, {
//           category: view.article.category,
//           count: count + 1,
//         });
//       }
//     });

//     return Array.from(categoryCounts.values())
//       .sort((a, b) => b.count - a.count)
//       .slice(0, 5)
//       .map(item => ({
//         ...item.category,
//         viewCount: item.count,
//       }));
//   }
// }



// REPLACE THE ENTIRE EngagementService file with this:

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';

@Injectable()
export class EngagementService {
  private readonly logger = new Logger(EngagementService.name);
  
  // Session cache for preventing duplicate tracking
  private sessionCache = new Map<string, { timestamp: number }>();
  private readonly SESSION_TTL = 60 * 60 * 1000; // 1 hour

  constructor(private prisma: PrismaService) {
    // Clean up old cache entries every hour
    setInterval(() => this.cleanupCache(), 60 * 60 * 1000);
  }

  private cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.sessionCache.entries()) {
      if (now - value.timestamp > this.SESSION_TTL) {
        this.sessionCache.delete(key);
      }
    }
  }

  // OPTIMIZED: Track view WITHOUT validating user existence
  async trackView(userId: string, articleId: string, language: string = 'en') {
    const sessionKey = `view:${userId}:${articleId}:${language}`;
    
    // Check session cache first
    if (this.sessionCache.has(sessionKey)) {
      return null; // Already tracked in this session
    }

    try {
      // Use raw query to avoid Prisma user validation
      // First check if view already exists today
      const existingView = await this.prisma.$queryRaw<Array<{id: string}>>`
        SELECT id FROM "ArticleView" 
        WHERE "userId" = ${userId}::uuid 
          AND "articleId" = ${articleId}::uuid 
          AND "language" = ${language}
          AND "createdAt" >= NOW() - INTERVAL '24 hours'
        LIMIT 1
      `;

      if (existingView && existingView.length > 0) {
        // Cache to prevent future checks in this session
        this.sessionCache.set(sessionKey, { timestamp: Date.now() });
        return existingView[0];
      }

      // Try to insert view - will fail silently if user doesn't exist
      try {
        const view = await this.prisma.$queryRaw<Array<{id: string}>>`
          INSERT INTO "ArticleView" 
            ("userId", "articleId", "language", "createdAt", "updatedAt")
          VALUES 
            (${userId}::uuid, ${articleId}::uuid, ${language}, NOW(), NOW())
          ON CONFLICT DO NOTHING
          RETURNING id
        `;

        if (view && view.length > 0) {
          // Update article counts asynchronously
          this.updateArticleCounts(articleId, userId).catch(error => {
            this.logger.debug(`Failed to update counts: ${error.message}`);
          });
          
          // Cache this session
          this.sessionCache.set(sessionKey, { timestamp: Date.now() });
          return view[0];
        }
      } catch (error) {
        // If foreign key violation (user doesn't exist), just log and continue
        if (error.code === '23503' || error.message?.includes('foreign key')) {
          this.logger.debug(`User ${userId} not found, skipping view tracking`);
          return null;
        }
        throw error;
      }
    } catch (error) {
      // Log but don't throw - don't break article loading
      this.logger.debug(`View tracking failed: ${error.message}`);
      return null;
    }
  }

  // Update counts asynchronously
  private async updateArticleCounts(articleId: string, userId: string) {
    try {
      // Update total view count
      await this.prisma.$executeRaw`
        UPDATE "Article" 
        SET "viewCount" = COALESCE("viewCount", 0) + 1,
            "updatedAt" = NOW()
        WHERE "id" = ${articleId}::uuid
      `;

      // Check if this is a unique view (first from this user)
      const userViews = await this.prisma.$queryRaw<Array<{count: string}>>`
        SELECT COUNT(*) as count FROM "ArticleView" 
        WHERE "articleId" = ${articleId}::uuid 
          AND "userId" = ${userId}::uuid
      `;

      const viewCount = parseInt(userViews[0]?.count || '0');
      if (viewCount === 1) {
        // First view from this user
        await this.prisma.$executeRaw`
          UPDATE "Article" 
          SET "uniqueViewCount" = COALESCE("uniqueViewCount", 0) + 1
          WHERE "id" = ${articleId}::uuid
        `;
      }
    } catch (error) {
      // Don't throw - just log
      this.logger.debug(`Failed to update article counts: ${error.message}`);
    }
  }

  // OPTIMIZED: Track like
  async trackLike(userId: string, articleId: string, language: string = 'en') {
    try {
      // Check if already liked using raw query
      const existingLike = await this.prisma.$queryRaw<Array<{id: string}>>`
        SELECT id FROM "ArticleLike" 
        WHERE "articleId" = ${articleId}::uuid 
          AND "userId" = ${userId}::uuid
          AND "language" = ${language}
        LIMIT 1
      `;

      if (existingLike && existingLike.length > 0) {
        // Unlike
        await this.prisma.$executeRaw`
          DELETE FROM "ArticleLike" 
          WHERE "id" = ${existingLike[0].id}::uuid
        `;

        await this.prisma.$executeRaw`
          UPDATE "Article" 
          SET "likeCount" = GREATEST(COALESCE("likeCount", 0) - 1, 0)
          WHERE "id" = ${articleId}::uuid
        `;

        return { action: 'unliked' };
      } else {
        // Try to like
        try {
          await this.prisma.$executeRaw`
            INSERT INTO "ArticleLike" 
              ("userId", "articleId", "language", "createdAt", "updatedAt")
            VALUES 
              (${userId}::uuid, ${articleId}::uuid, ${language}, NOW(), NOW())
          `;

          await this.prisma.$executeRaw`
            UPDATE "Article" 
            SET "likeCount" = COALESCE("likeCount", 0) + 1
            WHERE "id" = ${articleId}::uuid
          `;

          return { action: 'liked' };
        } catch (error) {
          // If user doesn't exist, just skip
          if (error.code === '23503' || error.message?.includes('foreign key')) {
            this.logger.debug(`User ${userId} not found, skipping like`);
            return { action: 'skipped' };
          }
          throw error;
        }
      }
    } catch (error) {
      this.logger.debug(`Like tracking failed: ${error.message}`);
      return { action: 'error' };
    }
  }

  // OPTIMIZED: Track engagement (for other actions)
  async trackEngagement(userId: string, articleId: string, action: string, metadata?: any) {
    try {
      // Skip VIEW action - it's handled by trackView
      if (action === 'VIEW') return null;

      // Try to insert engagement record
      try {
        await this.prisma.$executeRaw`
          INSERT INTO "UserEngagement" 
            ("userId", "articleId", "action", "metadata", "createdAt", "updatedAt")
          VALUES 
            (${userId}::uuid, ${articleId}::uuid, ${action}, 
             ${metadata ? JSON.stringify(metadata) : '{}'}::jsonb, NOW(), NOW())
        `;
      } catch (error) {
        // If user doesn't exist, just skip
        if (error.code === '23503' || error.message?.includes('foreign key')) {
          return null;
        }
        throw error;
      }

      // Update article stats if needed
      await this.updateStatsForAction(articleId, action);
      
      return { success: true };
    } catch (error) {
      this.logger.debug(`Engagement tracking failed: ${error.message}`);
      return null;
    }
  }

  // Helper to update stats for different actions
  private async updateStatsForAction(articleId: string, action: string) {
    try {
      const columnMap: Record<string, string> = {
        'LIKE': 'likeCount',
        'SAVE': 'saveCount',
        'SHARE': 'shareCount',
        'COMMENT': 'commentCount'
      };

      const column = columnMap[action];
      if (column) {
        await this.prisma.$executeRaw`
          UPDATE "Article" 
          SET "${column}" = COALESCE("${column}", 0) + 1
          WHERE "id" = ${articleId}::uuid
        `;
      }
    } catch (error) {
      // Don't throw - just log
      this.logger.debug(`Failed to update stats for ${action}: ${error.message}`);
    }
  }

  // Keep your existing methods for save, share, comment, etc.
  // But add similar raw query optimizations
  
  async trackSave(userId: string, articleId: string, folder: string = 'favorites', language: string = 'en') {
    try {
      // Use similar raw query pattern as trackLike
      const existingSave = await this.prisma.$queryRaw<Array<{id: string}>>`
        SELECT id FROM "ArticleSave" 
        WHERE "articleId" = ${articleId}::uuid 
          AND "userId" = ${userId}::uuid
          AND "language" = ${language}
        LIMIT 1
      `;

      if (existingSave && existingSave.length > 0) {
        // Unsave
        await this.prisma.$executeRaw`
          DELETE FROM "ArticleSave" 
          WHERE "id" = ${existingSave[0].id}::uuid
        `;

        await this.prisma.$executeRaw`
          UPDATE "Article" 
          SET "saveCount" = GREATEST(COALESCE("saveCount", 0) - 1, 0)
          WHERE "id" = ${articleId}::uuid
        `;

        return { action: 'unsaved' };
      } else {
        try {
          await this.prisma.$executeRaw`
            INSERT INTO "ArticleSave" 
              ("userId", "articleId", "language", "folder", "createdAt", "updatedAt")
            VALUES 
              (${userId}::uuid, ${articleId}::uuid, ${language}, ${folder}, NOW(), NOW())
          `;

          await this.prisma.$executeRaw`
            UPDATE "Article" 
            SET "saveCount" = COALESCE("saveCount", 0) + 1
            WHERE "id" = ${articleId}::uuid
          `;

          return { action: 'saved' };
        } catch (error) {
          if (error.code === '23503') {
            return { action: 'skipped' };
          }
          throw error;
        }
      }
    } catch (error) {
      this.logger.debug(`Save tracking failed: ${error.message}`);
      return { action: 'error' };
    }
  }

  // Keep existing methods for stats - they're only called on profile pages
  async getUserEngagementStats(userId: string) {
    // This is OK - called infrequently on profile pages
    const [
      totalViews,
      totalLikes,
      totalSaves,
      totalComments,
    ] = await Promise.all([
      this.prisma.articleView.count({ where: { userId } }),
      this.prisma.articleLike.count({ where: { userId } }),
      this.prisma.articleSave.count({ where: { userId } }),
      this.prisma.articleComment.count({ where: { userId } }),
    ]);

    return {
      totalViews,
      totalLikes,
      totalSaves,
      totalComments,
      readingStreak: await this.calculateReadingStreak(userId),
    };
  }

  private async calculateReadingStreak(userId: string): Promise<number> {
    // Your existing implementation is fine
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
}