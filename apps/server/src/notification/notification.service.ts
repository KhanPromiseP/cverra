// // notification/notification.service.ts - COMPLETE PRODUCTION READY
// import { 
//   Injectable, 
//   Logger, 
//   NotFoundException,
//   BadRequestException,
//   OnModuleInit 
// } from '@nestjs/common';
// import { PrismaService } from '../../../../tools/prisma/prisma.service';
// import { NotificationType, Prisma } from '@prisma/client';
// import { EventEmitter2 } from '@nestjs/event-emitter';
// import { Cron, CronExpression } from '@nestjs/schedule';
// import { ConfigService } from '@nestjs/config';

// interface NotificationData {
//   title: string;
//   message: string;
//   actorId?: string;
//   targetType?: 'ARTICLE' | 'COMMENT' | 'USER' | 'ACHIEVEMENT';
//   targetId?: string;
//   targetTitle?: string;
//   targetSlug?: string;
//   metadata?: Record<string, any>;
//   priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
//   target?: Record<string, any>;
// }

// interface NotificationWithActor extends Prisma.NotificationGetPayload<{
//   include: { actor: true }
// }> {}

// @Injectable()
// export class NotificationService implements OnModuleInit {
//   private readonly logger = new Logger(NotificationService.name);
//   private readonly batchSize = 50;
//   private readonly maxNotificationsPerUser = 500;

//   constructor(
//     private prisma: PrismaService,
//     private eventEmitter: EventEmitter2,
//     private configService: ConfigService,
//   ) {}

//   async onModuleInit() {
//     this.logger.log('Notification service initialized');
//   }

//   // ========== CORE NOTIFICATION METHODS ==========

//   async createNotification(userId: string, type: NotificationType, data: NotificationData) {
//     try {
//       // Check user notification settings
//       const settings = await this.getUserNotificationSettings(userId);
//       if (!this.shouldSendNotification(settings, type)) {
//         this.logger.debug(`Notification suppressed for user ${userId}, type: ${type}`);
//         return null;
//       }

//       // Check quiet hours
//       if (this.isInQuietHours(settings)) {
//         this.logger.debug(`Notification delayed due to quiet hours for user ${userId}`);
//         // You could queue this for later delivery
//       }

//       const notification = await this.prisma.notification.create({
//         data: {
//           userId,
//           type,
//           title: data.title,
//           message: data.message,
//           actorId: data.actorId,
//           targetType: data.targetType,
//           targetId: data.targetId,
//           targetTitle: data.targetTitle,
//           targetSlug: data.targetSlug,
//           metadata: data.metadata || {},
//           read: false,
//         },
//         include: {
//           actor: {
//             select: {
//               id: true,
//               name: true,
//               picture: true,
//               username: true,
//             },
//           },
//         },
//       });

//       // Emit real-time event
//       this.eventEmitter.emit('notification.created', this.formatNotification(notification));

//       // Send push notification if enabled
//       if (this.shouldSendPush(settings, type)) {
//         await this.sendPushNotification(userId, notification);
//       }

//       // Send email if enabled
//       if (this.shouldSendEmail(settings, type)) {
//         await this.queueEmailNotification(userId, notification);
//       }

//       // Cleanup old notifications if needed
//       await this.cleanupOldNotifications(userId);

//       return notification;
//     } catch (error) {
//       this.logger.error(`Failed to create notification: ${error.message}`, error.stack);
//       throw error;
//     }
//   }

//   // ========== SPECIFIC NOTIFICATION TYPES ==========

//   async notifyArticleLike(userId: string, articleId: string, likerId: string) {
//     const [article, liker] = await Promise.all([
//       this.prisma.article.findUnique({
//         where: { id: articleId },
//         select: { id: true, title: true, slug: true, authorId: true },
//       }),
//       this.prisma.user.findUnique({
//         where: { id: likerId },
//         select: { id: true, name: true, picture: true, username: true },
//       }),
//     ]);

//     if (!article || !liker) {
//       throw new NotFoundException('Article or user not found');
//     }

//     // Don't notify if user liked their own article
//     if (article.authorId === likerId) {
//       return null;
//     }

//     return this.createNotification(article.authorId, NotificationType.LIKE, {
//       title: 'New Like',
//       message: `${liker.name} liked your article "${article.title}"`,
//       actorId: likerId,
//       targetType: 'ARTICLE',
//       targetId: articleId,
//       targetTitle: article.title,
//       targetSlug: article.slug,
//       metadata: {
//         articleId,
//         articleTitle: article.title,
//         likerId,
//         likerName: liker.name,
//         timestamp: new Date().toISOString(),
//       },
//     });
//   }

//   async notifyArticleComment(userId: string, articleId: string, commenterId: string, commentId: string) {
//     const [article, commenter] = await Promise.all([
//       this.prisma.article.findUnique({
//         where: { id: articleId },
//         select: { id: true, title: true, slug: true, authorId: true },
//       }),
//       this.prisma.user.findUnique({
//         where: { id: commenterId },
//         select: { id: true, name: true, picture: true, username: true },
//       }),
//     ]);

//     if (!article || !commenter) {
//       throw new NotFoundException('Article or user not found');
//     }

//     // Don't notify if user commented on their own article
//     if (article.authorId === commenterId) {
//       return null;
//     }

//     return this.createNotification(article.authorId, NotificationType.COMMENT, {
//       title: 'New Comment',
//       message: `${commenter.name} commented on your article "${article.title}"`,
//       actorId: commenterId,
//       targetType: 'ARTICLE',
//       targetId: articleId,
//       targetTitle: article.title,
//       targetSlug: article.slug,
//       metadata: {
//         articleId,
//         articleTitle: article.title,
//         commentId,
//         commenterId,
//         commenterName: commenter.name,
//         timestamp: new Date().toISOString(),
//       },
//     });
//   }

//   async notifyCommentReply(userId: string, commentId: string, replierId: string, articleId: string) {
//     const [comment, replier, article] = await Promise.all([
//       this.prisma.articleComment.findUnique({
//         where: { id: commentId },
//         include: { user: true },
//       }),
//       this.prisma.user.findUnique({
//         where: { id: replierId },
//         select: { id: true, name: true, picture: true, username: true },
//       }),
//       this.prisma.article.findUnique({
//         where: { id: articleId },
//         select: { title: true, slug: true },
//       }),
//     ]);

//     if (!comment || !replier || !article) {
//       throw new NotFoundException('Comment, user, or article not found');
//     }

//     // Don't notify if user replied to their own comment
//     if (comment.userId === replierId) {
//       return null;
//     }

//     return this.createNotification(comment.userId, NotificationType.COMMENT_REPLY, {
//       title: 'New Reply',
//       message: `${replier.name} replied to your comment on "${article.title}"`,
//       actorId: replierId,
//       targetType: 'COMMENT',
//       targetId: commentId,
//       targetTitle: article.title,
//       targetSlug: article.slug,
//       metadata: {
//         articleId,
//         articleTitle: article.title,
//         commentId,
//         commentContent: comment.content.substring(0, 100),
//         replierId,
//         replierName: replier.name,
//         timestamp: new Date().toISOString(),
//       },
//     });
//   }

//   async notifyAchievementUnlocked(userId: string, achievementId: string) {
//     const achievement = await this.prisma.achievement.findUnique({
//       where: { id: achievementId },
//       select: { id: true, title: true, description: true, badgeColor: true, icon: true },
//     });

//     if (!achievement) {
//       throw new NotFoundException('Achievement not found');
//     }

//     return this.createNotification(userId, NotificationType.ACHIEVEMENT, {
//       title: '🏆 Achievement Unlocked!',
//       message: `You unlocked "${achievement.title}" achievement!`,
//       targetType: 'ACHIEVEMENT',
//       targetId: achievementId,
//       targetTitle: achievement.title,
//       metadata: {
//         achievementId,
//         achievementTitle: achievement.title,
//         achievementDescription: achievement.description,
//         badgeColor: achievement.badgeColor,
//         icon: achievement.icon,
//         timestamp: new Date().toISOString(),
//       },
//     });
//   }

//   async notifyReadingMilestone(userId: string, milestone: string, details?: any) {
//     return this.createNotification(userId, NotificationType.READING_MILESTONE, {
//       title: '📚 Reading Milestone',
//       message: milestone,
//       metadata: {
//         milestone,
//         details,
//         timestamp: new Date().toISOString(),
//       },
//     });
//   }

//   async notifyNewRecommendations(userId: string, count: number, articleIds: string[]) {
//     const articles = await this.prisma.article.findMany({
//       where: { id: { in: articleIds } },
//       select: { id: true, title: true, slug: true },
//       take: 3,
//     });

//     return this.createNotification(userId, NotificationType.RECOMMENDATION, {
//       title: '🎯 New Recommendations',
//       message: `You have ${count} new article recommendations based on your interests`,
//       targetType: 'ARTICLE',
//       targetId: articles[0]?.id,
//       targetTitle: articles[0]?.title,
//       targetSlug: articles[0]?.slug,
//       metadata: {
//         count,
//         articleIds,
//         articleTitles: articles.map(a => a.title),
//         timestamp: new Date().toISOString(),
//       },
//     });
//   }

//   async notifyPremiumFeature(userId: string, featureName: string, featureDetails: string) {
//     return this.createNotification(userId, NotificationType.PREMIUM, {
//       title: '👑 Premium Feature',
//       message: `New premium feature available: ${featureName}`,
//       metadata: {
//         featureName,
//         featureDetails,
//         timestamp: new Date().toISOString(),
//       },
//     });
//   }

//   async notifySystemAnnouncement(userIds: string[], title: string, message: string, metadata?: any) {
//     const notifications = [];
    
//     for (const userId of userIds) {
//       try {
//         const notification = await this.createNotification(userId, NotificationType.SYSTEM, {
//           title,
//           message,
//           metadata: {
//             ...metadata,
//             announcement: true,
//             timestamp: new Date().toISOString(),
//           },
//           priority: 'HIGH',
//         });
        
//         if (notification) {
//           notifications.push(notification);
//         }
//       } catch (error) {
//         this.logger.error(`Failed to send system announcement to user ${userId}: ${error.message}`);
//       }
//     }
    
//     return notifications;
//   }

//   // ========== NOTIFICATION MANAGEMENT ==========

//   async getUserNotifications(userId: string, options: {
//     page?: number;
//     limit?: number;
//     unreadOnly?: boolean;
//     types?: NotificationType[];
//   } = {}) {
//     const page = options.page || 1;
//     const limit = Math.min(options.limit || 20, 100);
//     const skip = (page - 1) * limit;

//     const where: Prisma.NotificationWhereInput = {
//       userId,
//       ...(options.unreadOnly && { read: false }),
//       ...(options.types && options.types.length > 0 && { type: { in: options.types } }),
//     };

//     const [notifications, total, unreadCount] = await Promise.all([
//       this.prisma.notification.findMany({
//         where,
//         include: {
//           actor: {
//             select: {
//               id: true,
//               name: true,
//               picture: true,
//               username: true,
//             },
//           },
//         },
//         orderBy: { createdAt: 'desc' },
//         skip,
//         take: limit,
//       }),
//       this.prisma.notification.count({ where }),
//       this.prisma.notification.count({ where: { userId, read: false } }),
//     ]);

//     const formattedNotifications = notifications.map(notification => 
//       this.formatNotification(notification)
//     );

//     return {
//       notifications: formattedNotifications,
//       total,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//       unreadCount,
//       hasMore: page * limit < total,
//     };
//   }

//   async markAsRead(userId: string, notificationId: string) {
//     const notification = await this.prisma.notification.findFirst({
//       where: {
//         id: notificationId,
//         userId,
//       },
//     });

//     if (!notification) {
//       throw new NotFoundException('Notification not found');
//     }

//     if (notification.read) {
//       return this.formatNotification(notification);
//     }

//     const updated = await this.prisma.notification.update({
//       where: { id: notificationId },
//       data: { 
//         read: true, 
//         readAt: new Date(),
//         updatedAt: new Date(),
//       },
//       include: {
//         actor: {
//           select: {
//             id: true,
//             name: true,
//             picture: true,
//             username: true,
//           },
//         },
//       },
//     });

//     this.eventEmitter.emit('notification.updated', this.formatNotification(updated));

//     return this.formatNotification(updated);
//   }

//   async markAllAsRead(userId: string) {
//     const result = await this.prisma.notification.updateMany({
//       where: {
//         userId,
//         read: false,
//       },
//       data: { 
//         read: true, 
//         readAt: new Date(),
//         updatedAt: new Date(),
//       },
//     });

//     this.eventEmitter.emit('notifications.markedAllRead', { userId, count: result.count });

//     return {
//       success: true,
//       count: result.count,
//       message: `Marked ${result.count} notifications as read`,
//     };
//   }

//   async deleteNotification(userId: string, notificationId: string) {
//     const notification = await this.prisma.notification.findFirst({
//       where: {
//         id: notificationId,
//         userId,
//       },
//     });

//     if (!notification) {
//       throw new NotFoundException('Notification not found');
//     }

//     await this.prisma.notification.delete({
//       where: { id: notificationId },
//     });

//     this.eventEmitter.emit('notification.deleted', { userId, notificationId });

//     return {
//       success: true,
//       message: 'Notification deleted',
//     };
//   }

//   async clearAllNotifications(userId: string) {
//     const result = await this.prisma.notification.deleteMany({
//       where: { userId },
//     });

//     this.eventEmitter.emit('notifications.cleared', { userId, count: result.count });

//     return {
//       success: true,
//       count: result.count,
//       message: `Deleted ${result.count} notifications`,
//     };
//   }

//   // ========== NOTIFICATION SETTINGS ==========

//   async getUserNotificationSettings(userId: string) {
//     let settings = await this.prisma.userNotificationSettings.findUnique({
//       where: { userId },
//     });

//     if (!settings) {
//       settings = await this.prisma.userNotificationSettings.create({
//         data: { userId },
//       });
//     }

//     return settings;
//   }

//   async updateNotificationSettings(userId: string, updates: Partial<Prisma.UserNotificationSettingsUpdateInput>) {
//     const settings = await this.getUserNotificationSettings(userId);

//     const updated = await this.prisma.userNotificationSettings.update({
//       where: { id: settings.id },
//       data: {
//         ...updates,
//         updatedAt: new Date(),
//       },
//     });

//     return updated;
//   }

//   // ========== SCHEDULED TASKS ==========

//   // notification.service.ts

// @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
// async cleanupOldNotificationsJob() {
//   this.logger.log('Starting old notifications cleanup job');
  
//   try {
//     // STRATEGY 1: Delete notifications older than 90 days for ALL users
//     const ninetyDaysAgo = new Date();
//     ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
//     const oldNotificationsResult = await this.prisma.notification.deleteMany({
//       where: {
//         createdAt: {
//           lt: ninetyDaysAgo
//         }
//       }
//     });
    
//     this.logger.log(`Deleted ${oldNotificationsResult.count} notifications older than 90 days`);
    
//     // STRATEGY 2: For users with too many notifications, keep only the newest ones
//     const maxNotificationsPerUser = this.maxNotificationsPerUser || 5000; // Default to 5000
    
//     // Find users with excessive notifications
//     const usersWithExcess = await this.prisma.$queryRaw<{userId: string, total: bigint}[]>`
//       SELECT "userId", COUNT(*) as total 
//       FROM "Notification" 
//       GROUP BY "userId" 
//       HAVING COUNT(*) > ${maxNotificationsPerUser}
//       ORDER BY COUNT(*) DESC
//     `;
    
//     let totalExcessCleaned = 0;
    
//     for (const { userId, total } of usersWithExcess) {
//       const userTotal = Number(total);
//       const toDeleteCount = userTotal - maxNotificationsPerUser;
      
//       if (toDeleteCount > 0) {
//         // Get the IDs of the OLDEST notifications to delete (keep newest)
//         const oldNotificationIds = await this.prisma.$queryRaw<{id: string}[]>`
//           SELECT id 
//           FROM "Notification" 
//           WHERE "userId" = ${userId} 
//           ORDER BY "createdAt" ASC 
//           LIMIT ${toDeleteCount}
//         `;
        
//         if (oldNotificationIds.length > 0) {
//           const deleteResult = await this.prisma.notification.deleteMany({
//             where: {
//               id: {
//                 in: oldNotificationIds.map(n => n.id)
//               }
//             }
//           });
          
//           totalExcessCleaned += deleteResult.count;
//           this.logger.debug(`Cleaned ${deleteResult.count} excess notifications for user ${userId}`);
//         }
//       }
//     }
    
//     this.logger.log(`Deleted ${totalExcessCleaned} excess notifications from ${usersWithExcess.length} users`);
    
//     // STRATEGY 3: Clean up orphaned notifications (users that no longer exist)
//     const orphanedResult = await this.prisma.$executeRaw`
//       DELETE FROM "Notification" n
//       WHERE NOT EXISTS (
//         SELECT 1 FROM "User" u WHERE u.id = n."userId"
//       )
//     `;
    
//     this.logger.log(`Deleted ${orphanedResult} orphaned notifications`);
    
//     // Final summary
//     const totalCleaned = oldNotificationsResult.count + totalExcessCleaned + Number(orphanedResult);
//     this.logger.log(`✅ Cleanup completed: ${totalCleaned} total notifications removed`);
    
//   } catch (error) {
//     this.logger.error('Failed to cleanup old notifications', error);
    
//     // Don't throw - let cron continue running other jobs
//     // Log detailed error for debugging
//     if (error instanceof Prisma.PrismaClientKnownRequestError) {
//       this.logger.error(`Prisma error code: ${error.code}, meta: ${JSON.stringify(error.meta)}`);
//     }
//   }
// }

//   @Cron(CronExpression.EVERY_DAY_AT_9AM)
//   async sendDailyDigests() {
//     this.logger.log('Starting daily digest notifications');
    
//     try {
//       const users = await this.prisma.userNotificationSettings.findMany({
//         where: {
//           emailReadingDigest: true,
//           digestFrequency: 'DAILY',
//         },
//         include: {
//           user: true,
//         },
//       });

//       for (const settings of users) {
//         await this.sendDigestNotification(settings.userId, 'daily');
//       }

//       this.logger.log(`Sent daily digests to ${users.length} users`);
//     } catch (error) {
//       this.logger.error('Failed to send daily digests', error);
//     }
//   }

//   @Cron(CronExpression.EVERY_WEEK) // Changed from EVERY_MONDAY_AT_9AM
//   async sendWeeklyDigests() {
//     this.logger.log('Starting weekly digest notifications');
    
//     try {
//       const users = await this.prisma.userNotificationSettings.findMany({
//         where: {
//           emailReadingDigest: true,
//           digestFrequency: 'WEEKLY',
//         },
//         include: {
//           user: true,
//         },
//       });

//       for (const settings of users) {
//         await this.sendDigestNotification(settings.userId, 'weekly');
//       }

//       this.logger.log(`Sent weekly digests to ${users.length} users`);
//     } catch (error) {
//       this.logger.error('Failed to send weekly digests', error);
//     }
//   }

//   // ========== HELPER METHODS ==========

//   private async cleanupOldNotifications(userId: string) {
//     try {
//       // Find the 500th newest notification
//       const newestToKeep = await this.prisma.notification.findMany({
//         where: { userId },
//         orderBy: { createdAt: 'desc' },
//         skip: this.maxNotificationsPerUser - 1,
//         take: 1,
//         select: { createdAt: true },
//       });

//       if (newestToKeep.length > 0) {
//         await this.prisma.notification.deleteMany({
//           where: {
//             userId,
//             createdAt: { lt: newestToKeep[0].createdAt },
//           },
//         });
//       }
//     } catch (error) {
//       this.logger.error(`Failed to cleanup notifications for user ${userId}: ${error.message}`);
//     }
//   }

//   private async sendDigestNotification(userId: string, period: 'daily' | 'weekly') {
//     const startDate = new Date();
//     if (period === 'daily') {
//       startDate.setDate(startDate.getDate() - 1);
//     } else {
//       startDate.setDate(startDate.getDate() - 7);
//     }

//     const stats = await this.calculateReadingStats(userId, startDate);

//     return this.createNotification(userId, NotificationType.DIGEST, {
//       title: period === 'daily' ? '📊 Daily Reading Digest' : '📈 Weekly Reading Digest',
//       message: this.generateDigestMessage(stats, period),
//       metadata: {
//         period,
//         stats,
//         timestamp: new Date().toISOString(),
//       },
//     });
//   }

//   private async calculateReadingStats(userId: string, since: Date) {
//     const [
//       articlesRead,
//       likesReceived,
//       commentsReceived,
//       achievementsUnlocked,
//     ] = await Promise.all([
//       this.prisma.articleView.count({
//         where: {
//           userId,
//           createdAt: { gte: since },
//         },
//       }),
//       this.prisma.articleLike.count({
//         where: {
//           article: { authorId: userId },
//           createdAt: { gte: since },
//         },
//       }),
//       this.prisma.articleComment.count({
//         where: {
//           article: { authorId: userId },
//           createdAt: { gte: since },
//         },
//       }),
//       this.prisma.achievement.count({
//         where: {
//           userId,
//           unlocked: true,
//           unlockedAt: { gte: since },
//         },
//       }),
//     ]);

//     // For reading time, if you don't have a duration field yet:
//     // You might need to add readingDuration to ArticleView model first
//     // For now, estimate reading time (5 minutes per article)
//     const estimatedReadingTime = articlesRead * 5; // in minutes

//     return {
//       articlesRead,
//       readingTime: estimatedReadingTime,
//       likesReceived,
//       commentsReceived,
//       achievementsUnlocked,
//     };
//   }

//   private generateDigestMessage(stats: any, period: string): string {
//     const periodText = period === 'daily' ? 'today' : 'this week';
    
//     const parts = [];
//     if (stats.articlesRead > 0) {
//       parts.push(`Read ${stats.articlesRead} articles`);
//     }
//     if (stats.likesReceived > 0) {
//       parts.push(`Received ${stats.likesReceived} likes`);
//     }
//     if (stats.commentsReceived > 0) {
//       parts.push(`Got ${stats.commentsReceived} comments`);
//     }
//     if (stats.achievementsUnlocked > 0) {
//       parts.push(`Unlocked ${stats.achievementsUnlocked} achievements`);
//     }

//     if (parts.length === 0) {
//       return `Your ${period} reading summary: No activity yet. Start reading!`;
//     }

//     return `Your ${period} reading summary: ${parts.join(', ')}. Keep it up!`;
//   }

//   private formatNotification(notification: any) {
//   // Ensure createdAt is a valid Date object
//   let createdAt: string;
//   try {
//     createdAt = notification.createdAt instanceof Date 
//       ? notification.createdAt.toISOString()
//       : new Date(notification.createdAt).toISOString();
//   } catch (error) {
//     createdAt = new Date().toISOString();
//     this.logger.warn(`Invalid createdAt for notification ${notification.id}: ${error.message}`);
//   }

//   // Ensure readAt is properly formatted if it exists
//   let readAt: string | undefined;
//   if (notification.readAt) {
//     try {
//       readAt = notification.readAt instanceof Date
//         ? notification.readAt.toISOString()
//         : new Date(notification.readAt).toISOString();
//     } catch (error) {
//       this.logger.warn(`Invalid readAt for notification ${notification.id}`);
//     }
//   }

//   return {
//     id: notification.id,
//     type: notification.type?.toLowerCase() || notification.type,
//     title: notification.title,
//     message: notification.message,
//     data: notification.metadata || notification.data || {},
//     read: Boolean(notification.read),
//     readAt: readAt,
//     createdAt,
//     actor: notification.actor ? {
//       id: notification.actor.id,
//       name: notification.actor.name,
//       picture: notification.actor.picture,
//       username: notification.actor.username,
//     } : undefined,
//     target: notification.targetId ? {
//       type: (notification.targetType || 'article').toLowerCase(),
//       id: notification.targetId,
//       title: notification.targetTitle,
//       slug: notification.targetSlug,
//     } : undefined,
//   };
// }

//   private shouldSendNotification(settings: any, type: NotificationType): boolean {
//     // Map notification types to setting fields - COMPLETE VERSION
//     const settingMap: Record<NotificationType, string> = {
//       [NotificationType.LIKE]: 'emailArticleLikes',
//       [NotificationType.COMMENT]: 'emailArticleComments',
//       [NotificationType.COMMENT_REPLY]: 'emailCommentReplies',
//       [NotificationType.REPLY]: 'emailCommentReplies', // Map REPLY to comment replies
//       [NotificationType.ACHIEVEMENT]: 'emailAchievements',
//       [NotificationType.RECOMMENDATION]: 'emailRecommendations',
//       [NotificationType.SYSTEM]: 'emailSystemAnnouncements',
//       [NotificationType.DIGEST]: 'emailReadingDigest',
//       [NotificationType.READING_MILESTONE]: 'emailReadingDigest',
//       [NotificationType.PREMIUM]: 'emailSystemAnnouncements', // Map PREMIUM to system announcements
//       [NotificationType.ARTICLE_PUBLISHED]: 'emailSystemAnnouncements', // Map ARTICLE_PUBLISHED
//       [NotificationType.MENTION]: 'emailArticleComments', // Map MENTION to comments
//     };

//     const settingField = settingMap[type];
//     // Default to true if setting not mapped
//     return settingField ? settings[settingField] !== false : true;
//   }

//   private shouldSendPush(settings: any, type: NotificationType): boolean {
//     const pushSettingMap: Record<NotificationType, string> = {
//       [NotificationType.LIKE]: 'pushArticleLikes',
//       [NotificationType.COMMENT]: 'pushArticleComments',
//       [NotificationType.COMMENT_REPLY]: 'pushCommentReplies',
//       [NotificationType.REPLY]: 'pushCommentReplies',
//       [NotificationType.ACHIEVEMENT]: 'pushAchievements',
//       [NotificationType.READING_MILESTONE]: 'pushReadingMilestones',
//       [NotificationType.SYSTEM]: 'pushSystemAnnouncements',
//       [NotificationType.PREMIUM]: 'pushSystemAnnouncements',
//       [NotificationType.ARTICLE_PUBLISHED]: 'pushSystemAnnouncements',
//       [NotificationType.MENTION]: 'pushArticleComments',
//       // These might not need push notifications
//       [NotificationType.RECOMMENDATION]: 'pushSystemAnnouncements',
//       [NotificationType.DIGEST]: 'pushSystemAnnouncements',
//     };

//     const settingField = pushSettingMap[type];
//     // Default to false if setting not mapped
//     return settingField ? settings[settingField] === true : false;
//   }


//   private shouldSendEmail(settings: any, type: NotificationType): boolean {
//     return this.shouldSendNotification(settings, type);
//   }

//   private isInQuietHours(settings: any): boolean {
//     const now = new Date();
//     const currentHour = now.getHours();
    
//     if (settings.quietStartHour < settings.quietEndHour) {
//       return currentHour >= settings.quietStartHour && currentHour < settings.quietEndHour;
//     } else {
//       return currentHour >= settings.quietStartHour || currentHour < settings.quietEndHour;
//     }
//   }

//   private async sendPushNotification(userId: string, notification: any) {
//     // Implement push notification logic (Firebase, OneSignal, etc.)
//     // This is a placeholder
//     this.logger.debug(`Would send push notification to ${userId}: ${notification.title}`);
//   }

//   private async queueEmailNotification(userId: string, notification: any) {
//     // Implement email queue logic
//     // This is a placeholder
//     this.logger.debug(`Would queue email to ${userId}: ${notification.title}`);
//   }

//   // ========== ANALYTICS ==========

//   async getNotificationStats(userId: string) {
//     const [
//       total,
//       unread,
//       byType,
//       recentActivity,
//     ] = await Promise.all([
//       this.prisma.notification.count({ where: { userId } }),
//       this.prisma.notification.count({ where: { userId, read: false } }),
//       this.prisma.notification.groupBy({
//         by: ['type'],
//         where: { userId },
//         _count: { id: true },
//       }),
//       this.prisma.notification.count({
//         where: {
//           userId,
//           createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
//         },
//       }),
//     ]);

//     return {
//       total,
//       unread,
//       read: total - unread,
//       readPercentage: total > 0 ? Math.round(((total - unread) / total) * 100) : 0,
//       byType: byType.reduce((acc, item) => ({
//         ...acc,
//         [item.type]: item._count.id,
//       }), {}),
//       recentActivity,
//     };
//   }
// }


// src/notification/notification.service.ts
// src/notification/notification.service.ts - COMPLETE CORRECTED VERSION
import { 
  Injectable, 
  Logger, 
  NotFoundException,
  OnModuleInit
} from '@nestjs/common';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

interface NotificationData {
  title?: string;
  message?: string;
  actorId?: string;
  targetType?: 'ARTICLE' | 'COMMENT' | 'USER' | 'ACHIEVEMENT' | 'WALLET' | 'FEATURES' | 'GUIDE' | 'SYSTEM';
  targetId?: string;
  targetTitle?: string;
  targetSlug?: string;
  metadata?: Record<string, any>;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  templateKey?: string;
  templatePayload?: Record<string, any>;
  target?: {
    type: string;
    id: string;
    title?: string;
    slug?: string;
  };
}

interface BatchResult {
  userId: string;
  success: boolean;
  notification?: any;
  error?: string;
}

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private readonly batchSize = 100;
  private readonly maxNotificationsPerUser = 1000;
  private readonly notificationRetentionDays = 90;

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Notification Service Initialized');
  }

  // ========== SPECIFIC NOTIFICATION METHODS ==========

  async notifyArticleLike(articleAuthorId: string, articleId: string, likerId: string) {
    try {
      if (articleAuthorId === likerId) return null;

      const [liker, article] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: likerId },
          select: { name: true }
        }),
        this.prisma.article.findUnique({
          where: { id: articleId },
          select: { title: true, slug: true }
        }),
      ]);

      if (!article) return null;

      return await this.createNotification(articleAuthorId, NotificationType.LIKE, {
        title: 'New Like',
        message: `${liker?.name || 'Someone'} liked your article "${article.title}"`,
        actorId: likerId,
        targetType: 'ARTICLE',
        targetId: articleId,
        targetTitle: article.title,
        targetSlug: article.slug,
        metadata: {
          articleId,
          articleTitle: article.title,
          likerId,
          likerName: liker?.name,
          timestamp: new Date().toISOString(),
        }
      });
    } catch (error) {
      this.logger.error('Failed to send article like notification:', error);
      return null;
    }
  }

  async notifyArticleComment(articleAuthorId: string, articleId: string, commenterId: string, commentId?: string) {
    try {
      if (articleAuthorId === commenterId) return null;

      const [commenter, article] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: commenterId },
          select: { name: true }
        }),
        this.prisma.article.findUnique({
          where: { id: articleId },
          select: { title: true, slug: true }
        }),
      ]);

      if (!article) return null;

      return await this.createNotification(articleAuthorId, NotificationType.COMMENT, {
        title: 'New Comment',
        message: `${commenter?.name || 'Someone'} commented on your article "${article.title}"`,
        actorId: commenterId,
        targetType: 'ARTICLE',
        targetId: articleId,
        targetTitle: article.title,
        targetSlug: article.slug,
        metadata: {
          articleId,
          articleTitle: article.title,
          commentId,
          commenterId,
          commenterName: commenter?.name,
          timestamp: new Date().toISOString(),
        }
      });
    } catch (error) {
      this.logger.error('Failed to send article comment notification:', error);
      return null;
    }
  }

  async notifyCommentReply(parentCommentAuthorId: string, articleId: string, replierId: string, commentId: string) {
    try {
      if (parentCommentAuthorId === replierId) return null;

      const [replier, article] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: replierId },
          select: { name: true }
        }),
        this.prisma.article.findUnique({
          where: { id: articleId },
          select: { title: true, slug: true }
        }),
      ]);

      if (!article) return null;

      return await this.createNotification(parentCommentAuthorId, NotificationType.COMMENT_REPLY, {
        title: 'New Reply',
        message: `${replier?.name || 'Someone'} replied to your comment on "${article.title}"`,
        actorId: replierId,
        targetType: 'COMMENT',
        targetId: commentId,
        targetTitle: article.title,
        targetSlug: article.slug,
        metadata: {
          articleId,
          articleTitle: article.title,
          commentId,
          replierId,
          replierName: replier?.name,
          timestamp: new Date().toISOString(),
        }
      });
    } catch (error) {
      this.logger.error('Failed to send comment reply notification:', error);
      return null;
    }
  }

  async notifyAchievementUnlocked(userId: string, achievementId: string, achievementTitle: string) {
    try {
      return await this.createNotification(userId, NotificationType.ACHIEVEMENT, {
        title: '🏆 Achievement Unlocked!',
        message: `You unlocked "${achievementTitle}" achievement!`,
        targetType: 'ACHIEVEMENT',
        targetId: achievementId,
        metadata: {
          achievementId,
          achievementTitle,
          unlockedAt: new Date().toISOString(),
        }
      });
    } catch (error) {
      this.logger.error('Failed to send achievement notification:', error);
      return null;
    }
  }

  async notifyReadingMilestone(userId: string, milestone: string, details?: any) {
    try {
      return await this.createNotification(userId, NotificationType.READING_MILESTONE, {
        title: '📚 Reading Milestone',
        message: milestone,
        metadata: {
          milestone,
          details,
          timestamp: new Date().toISOString(),
        }
      });
    } catch (error) {
      this.logger.error('Failed to send reading milestone notification:', error);
      return null;
    }
  }

  async notifyNewRecommendations(userId: string, count: number, articleIds: string[]) {
    try {
      const articles = await this.prisma.article.findMany({
        where: { id: { in: articleIds } },
        select: { id: true, title: true, slug: true },
        take: 3,
      });

      return await this.createNotification(userId, NotificationType.RECOMMENDATION, {
        title: '🎯 New Recommendations',
        message: `You have ${count} new article recommendations based on your interests`,
        targetType: 'ARTICLE',
        targetId: articles[0]?.id,
        targetTitle: articles[0]?.title,
        targetSlug: articles[0]?.slug,
        metadata: {
          count,
          articleIds,
          articleTitles: articles.map(a => a.title),
          timestamp: new Date().toISOString(),
        }
      });
    } catch (error) {
      this.logger.error('Failed to send recommendations notification:', error);
      return null;
    }
  }

  async notifyPremiumFeature(userId: string, featureName: string, featureDetails: string) {
    try {
      return await this.createNotification(userId, NotificationType.PREMIUM, {
        title: '👑 Premium Feature',
        message: `New premium feature available: ${featureName}`,
        metadata: {
          featureName,
          featureDetails,
          timestamp: new Date().toISOString(),
        }
      });
    } catch (error) {
      this.logger.error('Failed to send premium feature notification:', error);
      return null;
    }
  }

  async notifySystemAnnouncement(userIds: string[], title: string, message: string, metadata?: any) {
    const notifications = [];
    
    for (const userId of userIds) {
      try {
        const notification = await this.createNotification(userId, NotificationType.SYSTEM, {
          title,
          message,
          metadata: {
            ...metadata,
            announcement: true,
            timestamp: new Date().toISOString(),
          },
          priority: 'HIGH',
        });
        
        if (notification) {
          notifications.push(notification);
        }
      } catch (error) {
        this.logger.error(`Failed to send system announcement to user ${userId}: ${error.message}`);
      }
    }
    
    return notifications;
  }

  // ========== ANALYTICS METHOD ==========

  async getNotificationStats(userId: string) {
    const [
      total,
      unread,
      byType,
      recentActivity,
    ] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, read: false } }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: { id: true },
      }),
      this.prisma.notification.count({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const stats = {
      total,
      unread,
      read: total - unread,
      readPercentage: total > 0 ? Math.round(((total - unread) / total) * 100) : 0,
      byType: byType.reduce((acc, item) => ({
        ...acc,
        [item.type]: item._count.id,
      }), {}),
      recentActivity,
      averagePerDay: total > 0 ? Math.round(total / 30) : 0,
    };

    return stats;
  }

  private isInQuietHours(settings: any): boolean {
    if (!settings?.quietStartHour || !settings?.quietEndHour) {
      return false;
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    
    if (settings.quietStartHour < settings.quietEndHour) {
      return currentHour >= settings.quietStartHour && currentHour < settings.quietEndHour;
    } else {
      // Handle overnight quiet hours (e.g., 22:00 to 7:00)
      return currentHour >= settings.quietStartHour || currentHour < settings.quietEndHour;
    }
  }

  // ========== CORE NOTIFICATION METHOD ==========

  async createNotification(userId: string, type: NotificationType, data: NotificationData) {
    const startTime = Date.now();
    
    try {
      // 1. Check user notification settings
      const settings = await this.getUserNotificationSettings(userId);
      if (!this.shouldSendNotification(settings, type)) {
        this.logger.debug(`Notification suppressed for user ${userId}, type: ${type}`);
        return null;
      }

      // 2. Check quiet hours
      if (this.isInQuietHours(settings)) {
        this.logger.debug(`Notification delayed due to quiet hours for user ${userId}`);
        // You could queue this for later delivery
      }

      // 3. Handle target data
      const targetData = data.target || {
        type: data.targetType,
        id: data.targetId,
        title: data.targetTitle,
        slug: data.targetSlug
      };

      // 4. Create notification in database
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          title: data.title || this.getDefaultTitle(type),
          message: data.message || this.getDefaultMessage(type),
          actorId: data.actorId,
          targetType: targetData.type,
          targetId: targetData.id,
          targetTitle: targetData.title,
          targetSlug: targetData.slug,
          metadata: data.metadata || {},
          read: false,
        },
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              picture: true,
              username: true,
            },
          },
        },
      });

      // 5. Emit real-time event
      this.eventEmitter.emit('notification.created', this.formatNotification(notification));

      // 6. Send push notification if enabled
      if (this.shouldSendPush(settings, type)) {
        await this.sendPushNotification(userId, notification);
      }

      // 7. Performance logging
      const duration = Date.now() - startTime;
      this.logger.log(`✅ [${userId}] ${type} notification created in ${duration}ms`);
      
      return notification;
    } catch (error) {
      this.logger.error(`❌ [${userId}] Failed to create notification:`, error);
      return null;
    }
  }

  // ========== NOTIFICATION MANAGEMENT ==========

  async getUserNotifications(userId: string, options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    types?: NotificationType[];
    fromDate?: Date;
  } = {}) {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(options.unreadOnly && { read: false }),
      ...(options.types && options.types.length > 0 && { type: { in: options.types } }),
      ...(options.fromDate && { createdAt: { gte: options.fromDate } }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              picture: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);

    const formattedNotifications = notifications.map(notification => 
      this.formatNotification(notification)
    );

    return {
      notifications: formattedNotifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
      hasMore: page * limit < total,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.read) {
      return this.formatNotification(notification);
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { 
        read: true, 
        readAt: new Date(),
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            picture: true,
            username: true,
          },
        },
      },
    });

    this.eventEmitter.emit('notification.updated', this.formatNotification(updated));

    return this.formatNotification(updated);
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { 
        read: true, 
        readAt: new Date(),
      },
    });

    this.eventEmitter.emit('notifications.markedAllRead', { userId, count: result.count });

    return {
      success: true,
      count: result.count,
      message: `Marked ${result.count} notifications as read`,
    };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    this.eventEmitter.emit('notification.deleted', { userId, notificationId });

    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  }

  async clearAllNotifications(userId: string, options?: { keepUnread?: boolean }) {
    const where: Prisma.NotificationWhereInput = { userId };
    
    if (options?.keepUnread) {
      where.read = true;
    }

    const result = await this.prisma.notification.deleteMany({
      where,
    });

    this.eventEmitter.emit('notifications.cleared', { userId, count: result.count });

    return {
      success: true,
      data: {
        count: result.count,
        message: `Deleted ${result.count} notifications`,
      },
    };
  }

  // ========== NOTIFICATION SETTINGS ==========

  async getUserNotificationSettings(userId: string) {
    let settings = await this.prisma.userNotificationSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.userNotificationSettings.create({
        data: { 
          userId,
          emailArticleLikes: true,
          emailArticleComments: true,
          emailCommentReplies: true,
          emailAchievements: true,
          emailRecommendations: true,
          emailReadingDigest: true,
          emailSystemAnnouncements: true,
          pushArticleLikes: true,
          pushArticleComments: true,
          pushCommentReplies: true,
          pushAchievements: true,
          pushReadingMilestones: true,
          digestFrequency: 'WEEKLY',
          quietStartHour: 22,
          quietEndHour: 7,
        },
      });
    }

    return settings;
  }

  async updateNotificationSettings(userId: string, updates: Partial<Prisma.UserNotificationSettingsUpdateInput>) {
    const settings = await this.getUserNotificationSettings(userId);

    const updated = await this.prisma.userNotificationSettings.update({
      where: { id: settings.id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: updated,
    };
  }

  // ========== HELPER METHODS ==========

  private formatNotification(notification: any) {
    try {
      const metadata = typeof notification.metadata === 'string' 
        ? JSON.parse(notification.metadata)
        : notification.metadata || {};

      return {
        id: notification.id,
        type: notification.type?.toLowerCase() || notification.type,
        title: notification.title,
        message: notification.message,
        data: metadata,
        read: Boolean(notification.read),
        readAt: notification.readAt ? new Date(notification.readAt).toISOString() : null,
        createdAt: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
        actor: notification.actor ? {
          id: notification.actor.id,
          name: notification.actor.name,
          picture: notification.actor.picture,
          username: notification.actor.username,
        } : undefined,
        target: notification.targetId ? {
          type: (notification.targetType || 'article').toLowerCase(),
          id: notification.targetId,
          title: notification.targetTitle,
          slug: notification.targetSlug,
        } : undefined,
      };
    } catch (error) {
      this.logger.error('Failed to format notification:', error);
      return {
        id: notification.id,
        type: notification.type,
        title: notification.title || 'Notification',
        message: notification.message || '',
        read: false,
        createdAt: new Date().toISOString(),
      };
    }
  }

  private getDefaultTitle(type: NotificationType): string {
  const titles: Record<NotificationType, string> = {
    [NotificationType.LIKE]: 'New Like',
    [NotificationType.COMMENT]: 'New Comment',
    [NotificationType.COMMENT_REPLY]: 'New Reply',
    [NotificationType.REPLY]: 'New Reply',
    [NotificationType.ACHIEVEMENT]: '🏆 Achievement Unlocked!',
    [NotificationType.RECOMMENDATION]: '🎯 New Recommendations',
    [NotificationType.SYSTEM]: 'System Notification',
    [NotificationType.DIGEST]: '📊 Reading Digest',
    [NotificationType.READING_MILESTONE]: '📚 Reading Milestone',
    [NotificationType.PREMIUM]: '👑 Premium Feature',
    [NotificationType.ARTICLE_PUBLISHED]: 'Article Published',
    [NotificationType.MENTION]: 'You were mentioned',
    // Add the new types:
    [NotificationType.DRAFT_SUBMITTED]: '📝 Draft Submitted for Review',
    [NotificationType.DRAFT_REVIEWED]: '✅ Draft Reviewed',
    [NotificationType.VALIDATION_MESSAGE_ADDED]: '💬 New Feedback on Draft',
  };
  
  return titles[type] || 'Notification';
}

private getDefaultMessage(type: NotificationType): string {
  const messages: Record<NotificationType, string> = {
    [NotificationType.LIKE]: 'Someone liked your content',
    [NotificationType.COMMENT]: 'Someone commented on your content',
    [NotificationType.COMMENT_REPLY]: 'Someone replied to your comment',
    [NotificationType.REPLY]: 'Someone replied to your comment',
    [NotificationType.ACHIEVEMENT]: 'You unlocked a new achievement',
    [NotificationType.RECOMMENDATION]: 'New recommendations for you',
    [NotificationType.SYSTEM]: 'You have a new system notification',
    [NotificationType.DIGEST]: 'Your reading summary is ready',
    [NotificationType.READING_MILESTONE]: 'You reached a reading milestone',
    [NotificationType.PREMIUM]: 'New premium feature available',
    [NotificationType.ARTICLE_PUBLISHED]: 'Your article has been published',
    [NotificationType.MENTION]: 'Someone mentioned you in a comment',
    // Add the new types:
    [NotificationType.DRAFT_SUBMITTED]: 'A draft has been submitted for your review',
    [NotificationType.DRAFT_REVIEWED]: 'Your draft has been reviewed',
    [NotificationType.VALIDATION_MESSAGE_ADDED]: 'New feedback has been added to your draft',
  };
  
  return messages[type] || 'You have a new notification';
}

private shouldSendNotification(settings: any, type: NotificationType): boolean {
  const settingMap: Record<NotificationType, string> = {
    [NotificationType.LIKE]: 'emailArticleLikes',
    [NotificationType.COMMENT]: 'emailArticleComments',
    [NotificationType.COMMENT_REPLY]: 'emailCommentReplies',
    [NotificationType.REPLY]: 'emailCommentReplies',
    [NotificationType.ACHIEVEMENT]: 'emailAchievements',
    [NotificationType.RECOMMENDATION]: 'emailRecommendations',
    [NotificationType.SYSTEM]: 'emailSystemAnnouncements',
    [NotificationType.DIGEST]: 'emailReadingDigest',
    [NotificationType.READING_MILESTONE]: 'emailReadingDigest',
    [NotificationType.PREMIUM]: 'emailSystemAnnouncements',
    [NotificationType.ARTICLE_PUBLISHED]: 'emailSystemAnnouncements',
    [NotificationType.MENTION]: 'emailCommentReplies',
    // Add the new types - map them to appropriate settings:
    [NotificationType.DRAFT_SUBMITTED]: 'emailSystemAnnouncements', // or create new setting
    [NotificationType.DRAFT_REVIEWED]: 'emailSystemAnnouncements', // or create new setting
    [NotificationType.VALIDATION_MESSAGE_ADDED]: 'emailArticleComments', // or create new setting
  };

  const settingField = settingMap[type];
  return settingField ? settings[settingField] !== false : true;
}

private shouldSendPush(settings: any, type: NotificationType): boolean {
  const pushSettingMap: Record<NotificationType, string> = {
    [NotificationType.LIKE]: 'pushArticleLikes',
    [NotificationType.COMMENT]: 'pushArticleComments',
    [NotificationType.COMMENT_REPLY]: 'pushCommentReplies',
    [NotificationType.REPLY]: 'pushCommentReplies',
    [NotificationType.ACHIEVEMENT]: 'pushAchievements',
    [NotificationType.READING_MILESTONE]: 'pushReadingMilestones',
    [NotificationType.SYSTEM]: 'pushSystemAnnouncements',
    [NotificationType.PREMIUM]: 'pushSystemAnnouncements',
    [NotificationType.ARTICLE_PUBLISHED]: 'pushSystemAnnouncements',
    [NotificationType.MENTION]: 'pushArticleComments',
    [NotificationType.RECOMMENDATION]: 'pushSystemAnnouncements',
    [NotificationType.DIGEST]: 'pushSystemAnnouncements',
    // Add the new types - map them to appropriate push settings:
    [NotificationType.DRAFT_SUBMITTED]: 'pushSystemAnnouncements',
    [NotificationType.DRAFT_REVIEWED]: 'pushSystemAnnouncements',
    [NotificationType.VALIDATION_MESSAGE_ADDED]: 'pushArticleComments',
  };

  const settingField = pushSettingMap[type];
  return settingField ? settings[settingField] === true : false;
}
  private async sendPushNotification(userId: string, notification: any): Promise<void> {
    try {
      // Implement your push notification service here
      this.logger.debug(`Would send push notification to ${userId}: ${notification.title}`);
    } catch (error) {
      this.logger.error(`Failed to send push notification to ${userId}:`, error);
    }
  }

  // ========== BATCH NOTIFICATIONS ==========

  async createBatchNotifications(userIds: string[], type: NotificationType, data: NotificationData) {
    const results: Array<{userId: string; notificationId: string}> = [];
    const failedUsers: Array<{userId: string; error: string}> = [];
    
    // Process in batches
    for (let i = 0; i < userIds.length; i += this.batchSize) {
      const batch = userIds.slice(i, i + this.batchSize);
      
      const batchPromises = batch.map(async (userId): Promise<BatchResult> => {
        try {
          const notification = await this.createNotification(userId, type, data);
          return { 
            userId, 
            notification, 
            success: !!notification 
          };
        } catch (error: any) {
          this.logger.error(`[${userId}] Batch notification failed:`, error.message);
          return { 
            userId, 
            error: error.message, 
            success: false 
          };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          const value = result.value;
          if (value.success && value.notification) {
            results.push({ 
              userId: value.userId, 
              notificationId: value.notification.id 
            });
          } else {
            failedUsers.push({ 
              userId: value.userId, 
              error: value.error || 'Unknown error' 
            });
          }
        } else {
          failedUsers.push({ 
            userId: 'unknown', 
            error: result.reason || 'Promise rejected' 
          });
        }
      });
      
      // Small delay between batches
      if (i + this.batchSize < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return {
      total: userIds.length,
      success: results.length,
      failed: failedUsers.length,
      results,
      failures: failedUsers,
    };
  }

  // ========== SCHEDULED TASKS ==========

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldNotificationsJob() {
    this.logger.log('🔄 Starting old notifications cleanup job');
    
    try {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - this.notificationRetentionDays);

      const result = await this.prisma.notification.deleteMany({
        where: {
          createdAt: { lt: retentionDate },
          read: true,
        },
      });

      this.logger.log(`🗑️ Deleted ${result.count} old notifications`);
    } catch (error) {
      this.logger.error('❌ Cleanup job failed:', error);
    }
  }

  // ========== HEALTH CHECK ==========

  async healthCheck(): Promise<{ status: string; stats: any }> {
    const [
      totalNotifications,
      unreadNotifications,
      usersWithNotifications,
      recentNotifications,
    ] = await Promise.all([
      this.prisma.notification.count(),
      this.prisma.notification.count({ where: { read: false } }),
      this.prisma.notification.groupBy({
        by: ['userId'],
        _count: { id: true },
      }).then(results => results.length),
      this.prisma.notification.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      status: 'healthy',
      stats: {
        totalNotifications,
        unreadNotifications,
        usersWithNotifications,
        recentNotifications,
        retentionDays: this.notificationRetentionDays,
        maxPerUser: this.maxNotificationsPerUser,
        batchSize: this.batchSize,
      },
    };
  }
}