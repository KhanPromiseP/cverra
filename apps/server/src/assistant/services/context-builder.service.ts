
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';

@Injectable()
export class ContextBuilderService {
  private readonly logger = new Logger(ContextBuilderService.name);

  constructor(private prisma: PrismaService) {}

  async buildUserContext(userId: string): Promise<any> {
    const [
      user,
      activeSubscription,
      recentMemories,
      readingProfile,
      recentArticles,
      recentResumes,
      recentLetters,
      achievements,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      // Get active subscription to determine tier
      this.prisma.userSubscription.findFirst({
        where: { 
          userId, 
          status: 'ACTIVE',
          currentPeriodEnd: { gt: new Date() }
        },
        orderBy: { currentPeriodEnd: 'desc' },
        include: {
          plan: {
            select: {
              name: true,
              coins: true,
              interval: true,
            }
          }
        }
      }),
      this.prisma.assistantMemory.findMany({
        where: { userId },
        orderBy: { lastAccessed: 'desc' },
        take: 10,
      }),
      this.prisma.userReadingProfile.findUnique({
        where: { userId },
        include: { favoriteCategories: true },
      }),
      this.prisma.article.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          category: { select: { name: true } },
        },
      }),
      this.prisma.resume.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 3,
      }),
      this.prisma.coverLetter.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 3,
      }),
      this.prisma.achievement.findMany({
        where: { userId, unlocked: true },
        orderBy: { unlockedAt: 'desc' },
        take: 5,
      }),
    ]);

    // Determine user tier from subscription and role
    const userTier = this.determineUserTier(user?.role, activeSubscription);

    // Get article count
    const articleCount = await this.prisma.article.count({
      where: { authorId: userId },
    });

    if (!user) {
      return {
        user: {
          id: userId,
          name: 'User',
          tier: 'FREE',
          createdAt: new Date(),
        },
        userProfile: {
          name: 'User',
          memberSince: new Date(),
          articleCount: 0,
        },
        subscription: null,
        memories: [],
        readingPreferences: null,
        userContent: {
          recentArticles: [],
          recentResumes: [],
          recentLetters: [],
        },
        achievements: [],
      };
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tier: userTier,
        role: user.role,
        createdAt: user.createdAt,
      },
      subscription: activeSubscription ? {
        planName: activeSubscription.plan.name,
        coins: activeSubscription.plan.coins,
        interval: activeSubscription.plan.interval,
        status: activeSubscription.status,
        currentPeriodEnd: activeSubscription.currentPeriodEnd,
      } : null,
      userProfile: {
        name: user.name,
        memberSince: user.createdAt,
        articleCount: articleCount,
      },
      memories: recentMemories.map((memory: any) => ({
        topic: memory.topic,
        summary: memory.summary,
        importance: memory.importance,
        updatedAt: memory.updatedAt,
      })),
      readingPreferences: readingProfile ? {
        favoriteCategories: readingProfile.favoriteCategories.map((c: any) => c.name),
        difficultyPreference: readingProfile.difficultyPreference,
        readingStreak: readingProfile.readingStreak,
      } : null,
      userContent: {
        recentArticles,
        recentResumes,
        recentLetters,
      },
      achievements: achievements.map((ach: any) => ({
        title: ach.title,
        description: ach.description,
        unlockedAt: ach.unlockedAt,
      })),
    };
  }

  private determineUserTier(role?: string, activeSubscription?: any): string {
    // Admin users get ADMIN tier regardless of subscription
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return 'ADMIN';
    }

    // Check for active PREMIUM subscription
    if (activeSubscription) {
      const planName = activeSubscription.plan.name.toLowerCase();
      if (planName.includes('premium') || planName.includes('pro')) {
        return 'PREMIUM';
      }
    }

    // Default to FREE
    return 'FREE';
  }

  async buildContentContext(articleIds?: string[]): Promise<any> {
    if (!articleIds?.length) return {};

    const articles = await this.prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        category: { select: { name: true } },
        author: { select: { name: true } },
        accessType: true,
        readingTime: true,
        tags: true,
      },
      take: 5,
    });

    return {
      articles: articles.map((article: any) => ({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        category: article.category.name,
        author: article.author.name,
        accessType: article.accessType,
        readingTime: article.readingTime,
        tags: article.tags,
      })),
    };
  }

  async buildCareerContext(userId: string): Promise<any> {
    const [resumes, letters, builderJobs] = await Promise.all([
      this.prisma.resume.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      this.prisma.coverLetter.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 3,
      }),
      this.prisma.resumeBuilderJob.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      resumes: resumes.map((resume: any) => ({
        id: resume.id,
        title: resume.title,
        updatedAt: resume.updatedAt,
        statistics: resume.statistics,
      })),
      coverLetters: letters.map((letter: any) => ({
        id: letter.id,
        title: letter.title,
        style: letter.style,
        updatedAt: letter.updatedAt,
      })),
      aiBuilderHistory: builderJobs.map((job: any) => ({
        sourceType: job.sourceType,
        status: job.status,
        createdAt: job.createdAt,
      })),
    };
  }

  // Helper method to get user tier independently (useful for other services)
  async getUserTier(userId: string): Promise<'FREE' | 'PREMIUM' | 'ADMIN'> {
    const [user, activeSubscription] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      }),
      this.prisma.userSubscription.findFirst({
        where: { 
          userId, 
          status: 'ACTIVE',
          currentPeriodEnd: { gt: new Date() }
        },
        include: {
          plan: {
            select: { name: true }
          }
        }
      })
    ]);

    return this.determineUserTier(user?.role, activeSubscription) as 'FREE' | 'PREMIUM' | 'ADMIN';
  }
}