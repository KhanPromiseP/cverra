import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { GroqService } from './groq.service';
import { GoalService } from './goal.service';
import { EmotionalIntelligenceService } from './emotional.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class LifeDashboardService {
  private readonly logger = new Logger(LifeDashboardService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => GroqService)) private groqService: GroqService,
    private goalService: GoalService,
    private emotionalService: EmotionalIntelligenceService,
  ) {}

  
  /**
   * Generate weekly summary for user (runs every Monday at 8 AM)
   */
  @Cron('0 8 * * 1') // Every Monday at 8 AM
  async generateWeeklySummaries() {
    this.logger.log('Starting weekly summary generation for all active users');
    
    // Get users who have been active in the last week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const activeUsers = await this.prisma.assistantConversation.findMany({
      where: {
        updatedAt: { gte: weekAgo },
      },
      distinct: ['userId'],
      select: { userId: true },
    });

    for (const { userId } of activeUsers) {
      try {
        await this.generateWeeklySummary(userId);
      } catch (error) {
        this.logger.error(`Failed to generate summary for user ${userId}:`, error);
      }
    }
  }

  /**
   * Generate weekly summary for specific user
   */
  async generateWeeklySummary(userId: string): Promise<any> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date();
    weekEnd.setHours(23, 59, 59, 999);

    // Check if summary already exists for this week
    const existing = await this.prisma.assistantWeeklySummary.findFirst({
      where: {
        userId,
        weekStartDate: { gte: weekStart },
      },
    });

    if (existing) return existing;

    // Gather data
    const [goals, emotionalSummary, conversations, brainItems] = await Promise.all([
      this.getGoalProgress(userId, weekStart, weekEnd),
      this.emotionalService.getEmotionalSummary(userId, 7),
      this.getConversationSummary(userId, weekStart, weekEnd),
      this.getBrainItemSummary(userId, weekStart, weekEnd),
    ]);

    // Generate AI summary
    const summary = await this.createAISummary(
      userId,
      goals,
      emotionalSummary,
      conversations,
      brainItems,
    );

    // Save to database
    const weeklySummary = await this.prisma.assistantWeeklySummary.create({
      data: {
        userId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        summary: summary.narrative,
        highlights: summary.highlights,
        challenges: summary.challenges,
        goalProgress: goals.progress,
        completedGoals: goals.completed,
        emotionalTrend: emotionalSummary,
        fatigueDays: emotionalSummary.fatigueDays,
        motivatedDays: emotionalSummary.motivationDays,
        conversationCount: conversations.count,
        messageCount: conversations.messageCount,
        articleReadCount: conversations.articleReadCount || 0,
        driftingTopics: summary.driftingTopics,
        recommendedFocus: summary.recommendedFocus,
        recommendedActions: summary.recommendedActions,
      },
    });

    return weeklySummary;
  }

  /**
   * Get goal progress for the week
   */
  private async getGoalProgress(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<any> {
    const goals = await this.prisma.assistantGoal.findMany({
      where: {
        userId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      include: {
        mentions: {
          where: {
            createdAt: { gte: weekStart, lte: weekEnd },
          },
        },
      },
    });

    const progress: Record<string, { before: number; after: number }> = {};
    const completed: string[] = [];

    for (const goal of goals) {
      // In a real implementation, you'd track progress over time
      // This is simplified
      const hasMentions = goal.mentions.length > 0;
      if (hasMentions && goal.progress && goal.progress > 0) {
        progress[goal.id] = {
          before: Math.max(0, goal.progress - 10),
          after: goal.progress,
        };
      }
      if (goal.status === 'COMPLETED') {
        completed.push(goal.id);
      }
    }

    return {
      progress,
      completed,
      total: goals.length,
      activeMentions: goals.reduce((acc:any, g:any) => acc + g.mentions.length, 0),
    };
  }

  /**
   * Get conversation summary for the week
   */
  private async getConversationSummary(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<any> {
    const conversations = await this.prisma.assistantConversation.findMany({
      where: {
        userId,
        updatedAt: { gte: weekStart, lte: weekEnd },
      },
      include: {
        messages: {
          where: {
            createdAt: { gte: weekStart, lte: weekEnd },
          },
        },
      },
    });

    let messageCount = 0;
    let articleReadCount = 0;

    conversations.forEach(c => {
      messageCount += c.messages.length;
      c.messages.forEach(m => {
        if (m.referencedArticles && m.referencedArticles.length > 0) {
          articleReadCount += m.referencedArticles.length;
        }
      });
    });

    return {
      count: conversations.length,
      messageCount,
      articleReadCount,
      topics: conversations.map(c => c.mode),
    };
  }

  /**
   * Get brain item summary for the week
   */
  private async getBrainItemSummary(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<any> {
    const items = await this.prisma.assistantBrainItem.findMany({
      where: {
        userId,
        createdAt: { gte: weekStart, lte: weekEnd },
      },
    });

    const byType: Record<string, number> = {};
    items.forEach((item:any) => {
      byType[item.type] = (byType[item.type] || 0) + 1;
    });

    return {
      total: items.length,
      byType,
      items: items.map(i => ({ id: i.id, title: i.title, type: i.type })),
    };
  }

  /**
   * Create AI-generated summary
   */
  private async createAISummary(
    userId: string,
    goals: any,
    emotionalSummary: any,
    conversations: any,
    brainItems: any,
  ): Promise<any> {
    const prompt = `
You are creating a personal weekly life dashboard summary for a user.

This week's data:

GOALS:
- Active goals: ${goals.total}
- Goals with progress: ${Object.keys(goals.progress).length}
- Goals completed: ${goals.completed.length}
- Goal mentions this week: ${goals.activeMentions}

EMOTIONAL STATE:
- Primary emotion: ${emotionalSummary.primaryEmotion}
- Emotional volatility: ${emotionalSummary.emotionalVolatility}
- Days with fatigue: ${emotionalSummary.fatigueDays}
- Days motivated: ${emotionalSummary.motivationDays}
- Top states: ${JSON.stringify(emotionalSummary.dominantStates)}

ACTIVITY:
- Conversations: ${conversations.count}
- Total messages: ${conversations.messageCount}
- Articles read: ${conversations.articleReadCount}
- New brain items: ${brainItems.total}

Generate a warm, insightful weekly summary with:

1. A brief narrative summary (3-4 sentences) that captures their week
2. Top 3 highlights (positive moments/achievements)
3. Top 2-3 challenges they faced
4. Topics they seem to be drifting from (based on goals with no mentions)
5. Recommended focus for next week (1 sentence)
6. 3 specific recommended actions for next week

Return as JSON with:
{
  "narrative": "...",
  "highlights": ["...", "...", "..."],
  "challenges": ["...", "..."],
  "driftingTopics": ["...", "..."],
  "recommendedFocus": "...",
  "recommendedActions": ["...", "...", "..."]
}
`;

    const response = await this.groqService.chatCompletion(
      [{ role: 'user', content: prompt }],
      { user: { id: userId } },
      'GENERAL_ASSISTANT',
      { temperature: 0.7 }
    );

    if (response.isFallback || !response.content) {
      // Fallback summary
      return {
        narrative: `You had ${conversations.count} conversations this week, with ${emotionalSummary.fatigueDays} days showing fatigue. Keep going!`,
        highlights: ['Engaged with assistant regularly'],
        challenges: ['Managing emotional energy'],
        driftingTopics: [],
        recommendedFocus: 'Continue building momentum',
        recommendedActions: ['Review your goals', 'Try a micro-plan for one goal', 'Take breaks when tired'],
      };
    }

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid summary format');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Get latest weekly summary for user
   */
  async getLatestSummary(userId: string): Promise<any> {
    return this.prisma.assistantWeeklySummary.findFirst({
      where: { userId },
      orderBy: { weekStartDate: 'desc' },
    });
  }

  /**
   * Get all summaries for user
   */
  async getAllSummaries(userId: string): Promise<any[]> {
    return this.prisma.assistantWeeklySummary.findMany({
      where: { userId },
      orderBy: { weekStartDate: 'desc' },
    });
  }
}