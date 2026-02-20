import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common'; // ADD Inject and forwardRef
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { GroqService } from './groq.service';
import { GoalCategory, GoalStatus, AssistantGoal } from '@prisma/client';
import { IntentType } from '../interfaces/intent.types';
import { BufferedMessage } from './message-buffer.service';


interface GoalDetectionResult {
  goal: string;
  confidence: number;
  category: GoalCategory;
  progress?: number;
  sentiment: string;
}

@Injectable()
export class GoalService {
  private readonly logger = new Logger(GoalService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => GroqService)) private groqService: GroqService,
  ) {}

  /**
   * Detect goals from user message
   */
  async detectGoalsFromMessage(
    userId: string,
    message: string,
    conversationId?: string,
    messageId?: string,
  ): Promise<GoalDetectionResult[]> {
    try {
      // Use AI to detect goal mentions
      const prompt = `
Analyze this user message and extract any goals they mention. 
A goal is something they want to achieve, learn, or become.

Message: "${message}"

Return a JSON array of detected goals with:
- goal: the goal description
- confidence: 0-1 score
- category: one of [CAREER, LEARNING, HEALTH, FINANCE, RELATIONSHIP, PERSONAL_GROWTH, CONTENT_CREATION, BUSINESS]
- progress: if mentioned (0-100)
- sentiment: positive/neutral/frustrated/excited

Only return valid JSON. If no goals detected, return [].
`;

      const response = await this.groqService.chatCompletion(
        [{ role: 'user', content: prompt }],
        { user: { id: userId } },
        'GENERAL_ASSISTANT',
        { temperature: 0.3 }
      );

      if (response.isFallback || !response.content) {
        return [];
      }

      // Extract JSON from response
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const detectedGoals = JSON.parse(jsonMatch[0]) as GoalDetectionResult[];

      // Process each detected goal
      for (const detected of detectedGoals) {
        await this.processDetectedGoal(
          userId,
          detected,
          conversationId,
          messageId,
        );
      }

      return detectedGoals;
    } catch (error) {
      this.logger.error('Goal detection failed:', error);
      return [];
    }
  }

  /**
   * Process a detected goal - create or update
   */
  private async processDetectedGoal(
    userId: string,
    detected: GoalDetectionResult,
    conversationId?: string,
    messageId?: string,
  ): Promise<AssistantGoal | null> {
    try {
      // Check if goal already exists
      const existingGoal = await this.prisma.assistantGoal.findFirst({
        where: {
          userId,
          description: {
            contains: detected.goal,
            mode: 'insensitive',
          },
          status: { in: ['ACTIVE', 'PAUSED'] },
        },
      });

      if (existingGoal) {
        // Update existing goal
        const updatedGoal = await this.prisma.assistantGoal.update({
          where: { id: existingGoal.id },
          data: {
            mentionCount: { increment: 1 },
            lastMentioned: new Date(),
            updatedAt: new Date(),
            stalledSince: null, // Reset stalled if mentioned
            progress: detected.progress || existingGoal.progress,
          },
        });

        // Create mention record
        await this.prisma.assistantGoalMention.create({
          data: {
            goalId: existingGoal.id,
            conversationId,
            messageId,
            context: detected.goal,
            sentiment: detected.sentiment,
            progress: detected.progress,
            confidence: detected.confidence,
            keywords: detected.goal.split(' '),
          },
        });

        // Check if goal is stalled (mentioned but no progress)
        await this.checkStalledGoal(updatedGoal);

        return updatedGoal;
      }

      // Create new goal
      const newGoal = await this.prisma.assistantGoal.create({
        data: {
          userId,
          description: detected.goal,
          category: detected.category,
          status: 'ACTIVE',
          progress: detected.progress || 0,
          priority: 3,
          mentionCount: 1,
          lastMentioned: new Date(),
          metadata: {
            firstDetected: new Date().toISOString(),
            detectionMethod: 'conversation',
          },
        },
      });

      // Create mention record
      await this.prisma.assistantGoalMention.create({
        data: {
          goalId: newGoal.id,
          conversationId,
          messageId,
          context: detected.goal,
          sentiment: detected.sentiment,
          progress: detected.progress,
          confidence: detected.confidence,
          keywords: detected.goal.split(' '),
        },
      });

      // Check identity alignment
      await this.alignGoalWithIdentity(userId, newGoal.id, detected.goal);

      return newGoal;
    } catch (error) {
      this.logger.error('Failed to process goal:', error);
      return null;
    }
  }

  /**
   * Check if goal is stalled (mentioned 3+ times but no progress)
   */
  private async checkStalledGoal(goal: AssistantGoal): Promise<void> {
    if (goal.mentionCount >= 3 && goal.progress === 0 && !goal.stalledSince) {
      await this.prisma.assistantGoal.update({
        where: { id: goal.id },
        data: {
          stalledSince: new Date(),
          stallReason: 'no_progress',
        },
      });
    }
  }

  /**
   * Align goal with user's identity statements
   */
  private async alignGoalWithIdentity(
    userId: string,
    goalId: string,
    goalDescription: string,
  ): Promise<void> {
    try {
      const identity = await this.prisma.assistantIdentity.findUnique({
        where: { userId },
      });

      if (!identity) return;

      // Use AI to check alignment
      const prompt = `
Goal: "${goalDescription}"
User Identity: ${JSON.stringify(identity.statements)}

Does this goal align with the user's identity? Return JSON:
{
  "aligns": true/false,
  "confidence": 0-1,
  "reason": "explanation"
}
`;

      const response = await this.groqService.chatCompletion(
        [{ role: 'user', content: prompt }],
        { user: { id: userId } },
        'GENERAL_ASSISTANT',
        { temperature: 0.3 }
      );

      if (!response.isFallback && response.content) {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          await this.prisma.assistantGoal.update({
            where: { id: goalId },
            data: {
              alignsWithIdentity: result.aligns,
              identityStatementId: result.aligns ? identity.id : null,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('Goal identity alignment failed:', error);
    }
  }

  /**
   * Get active goals for user
   */
  async getActiveGoals(userId: string): Promise<AssistantGoal[]> {
    return this.prisma.assistantGoal.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: [
        { priority: 'desc' },
        { lastMentioned: 'desc' },
      ],
    });
  }

  /**
   * Detect repeated goals (mentioned multiple times)
   */
  async detectRepeatedGoals(userId: string): Promise<any[]> {
    const goals = await this.prisma.assistantGoal.findMany({
      where: {
        userId,
        mentionCount: { gte: 3 },
        status: 'ACTIVE',
      },
      include: {
        mentions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return goals.map((goal: any) => ({
      id: goal.id,
      description: goal.description,
      mentionCount: goal.mentionCount,
      lastMentioned: goal.lastMentioned,
      stalledSince: goal.stalledSince,
      stallReason: goal.stallReason,
      progress: goal.progress,
      recentMentions: goal.mentions.map((m: any) => ({
        context: m.context,
        sentiment: m.sentiment,
        date: m.createdAt,
      })),
    }));
  }

  /**
 * Detect goals from a batch of messages (ONE API call)
 */
async detectGoalsFromBatch(
  userId: string,
  combinedContent: string,
  messages: BufferedMessage[]
): Promise<GoalDetectionResult[]> {
  try {
    const prompt = `
Analyze this conversation and extract any goals the user mentions.
A goal is something they want to achieve, learn, or become.

Conversation:
${combinedContent}

Return a JSON array of detected goals with:
- goal: the goal description
- confidence: 0-1 score
- category: one of [CAREER, LEARNING, HEALTH, FINANCE, RELATIONSHIP, PERSONAL_GROWTH, CONTENT_CREATION, BUSINESS]
- progress: if mentioned (0-100)
- sentiment: positive/neutral/frustrated/excited
- messageIndices: array of message indices where this goal was mentioned

Only return valid JSON. If no goals detected, return [].
`;

    const response = await this.groqService.chatCompletion(
      [{ role: 'user', content: prompt }],
      { user: { id: userId } },
      'GENERAL_ASSISTANT',
      { temperature: 0.3 }
    );

    if (response.isFallback || !response.content) return [];

    const content = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const detectedGoals = JSON.parse(jsonMatch[0]) as GoalDetectionResult[];

    // Process each goal with message references
    for (const detected of detectedGoals) {
      await this.processDetectedGoal(
        userId,
        detected,
        messages[0]?.conversationId,
        messages.map(m => m.id).join(',')
      );
    }

    return detectedGoals;
  } catch (error) {
    this.logger.error('Batch goal detection failed:', error);
    return [];
  }
}

  /**
   * Generate accountability nudge for stalled goals
   */
  async generateAccountabilityNudge(userId: string): Promise<string | null> {
    const stalledGoals = await this.prisma.assistantGoal.findMany({
      where: {
        userId,
        stalledSince: { not: null },
        status: 'ACTIVE',
      },
      orderBy: { priority: 'desc' },
      take: 3,
    });

    if (stalledGoals.length === 0) return null;

    const prompt = `
Create a gentle, encouraging accountability nudge for a user who has mentioned these goals multiple times but hasn't started:

${stalledGoals.map((g:any, i:any) => `${i+1}. "${g.description}" (mentioned ${g.mentionCount} times)`).join('\n')}

The nudge should be warm, not pushy, and offer to help them create a micro-plan.
Keep it to 2-3 sentences.
`;

    const response = await this.groqService.chatCompletion(
      [{ role: 'user', content: prompt }],
      { user: { id: userId } },
      'GENERAL_ASSISTANT',
      { temperature: 0.7 }
    );

    return response.isFallback ? null : response.content;
  }

  /**
   * Create micro-plan for a goal
   */
  async createMicroPlan(userId: string, goalId: string): Promise<any> {
    const goal = await this.prisma.assistantGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) throw new Error('Goal not found');

    const prompt = `
Create a simple 7-day micro-plan for someone to start working on this goal:
"${goal.description}"

The plan should have:
- One small, achievable action per day
- Each action should take less than 30 minutes
- Progressive difficulty
- A mix of learning and doing

Return as JSON with:
{
  "goal": "${goal.description}",
  "days": [
    { "day": 1, "action": "...", "timeEstimate": "15 min", "type": "learn/do/reflect" }
  ],
  "encouragement": "A short motivational message"
}
`;

    const response = await this.groqService.chatCompletion(
      [{ role: 'user', content: prompt }],
      { user: { id: userId } },
      'GENERAL_ASSISTANT',
      { temperature: 0.7 }
    );

    if (response.isFallback || !response.content) {
      return null;
    }

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const plan = JSON.parse(jsonMatch[0]);

    // Save plan to goal metadata
    await this.prisma.assistantGoal.update({
      where: { id: goalId },
      data: {
        metadata: {
          ...(goal.metadata as any || {}),
          microPlan: plan,
          planCreatedAt: new Date().toISOString(),
        },
      },
    });

    return plan;
  }


  /**
   * Get goals for context with intent-based filtering
   * This is the ONLY new method needed
   */
  async getGoalsForContext(
    userId: string,
    intent: IntentType,
    limit: number = 2,
    requiresUrgency: boolean = false
  ): Promise<any[]> {
    try {
      // Get active goals
      const goals = await this.prisma.assistantGoal.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          ...(intent === IntentType.GOAL_STALLED ? { stalledSince: { not: null } } : {}),
          ...(requiresUrgency ? { priority: { gte: 4 } } : {})
        },
        orderBy: this.getOrderByForIntent(intent, requiresUrgency),
        take: limit * 2,
        include: {
          mentions: {
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        }
      });

      // Score and format
      return this.scoreAndFormatGoals(goals, intent, limit);
      
    } catch (error) {
      this.logger.error('Failed to get goals for context:', error);
      return [];
    }
  }

  /**
   * Order goals based on intent
   */
  private getOrderByForIntent(intent: IntentType, urgent: boolean): any {
    if (urgent) {
      return [
        { priority: 'desc' },
        { stalledSince: 'asc' },
        { updatedAt: 'desc' }
      ];
    }
    
    switch (intent) {
      case IntentType.GOAL_STALLED:
        return [
          { stalledSince: 'asc' },
          { priority: 'desc' }
        ];
        
      case IntentType.EMOTIONAL_SUPPORT:
        return [
          { priority: 'desc' },
          { updatedAt: 'desc' }
        ];
        
      default:
        return [
          { priority: 'desc' },
          { stalledSince: 'asc' },
          { updatedAt: 'desc' }
        ];
    }
  }

  /**
   * Score and format goals for prompt
   */
  private scoreAndFormatGoals(goals: any[], intent: IntentType, limit: number): any[] {
    const scored = goals.map(goal => {
      let score = goal.priority * 2;
      
      // Stalled goals get boost
      if (goal.stalledSince) {
        const daysStalled = Math.floor((Date.now() - goal.stalledSince.getTime()) / (1000 * 3600 * 24));
        score += daysStalled;
      }
      
      // Recent mentions boost
      if (goal.lastMentioned) {
        const daysSinceMention = Math.floor((Date.now() - goal.lastMentioned.getTime()) / (1000 * 3600 * 24));
        if (daysSinceMention < 3) score += 3;
        else if (daysSinceMention < 7) score += 1;
      }
      
      // Progress boost
      if (goal.progress > 80) score += 2;
      if (goal.progress < 20 && !goal.stalledSince) score += 1;
      
      return { ...goal, score };
    });

    // Sort and take top
    const topGoals = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Format based on intent
    return topGoals.map(goal => {
      if (goal.stalledSince) {
        const daysStalled = Math.floor((Date.now() - goal.stalledSince.getTime()) / (1000 * 3600 * 24));
        return {
          type: 'STALLED',
          description: goal.description,
          daysStalled,
          message: `⚠️ Stalled ${daysStalled}d: "${goal.description}"`
        };
      }
      
      const progressBar = this.createProgressBar(goal.progress || 0);
      return {
        type: 'ACTIVE',
        description: goal.description,
        progress: goal.progress,
        progressBar,
        message: `🎯 ${progressBar} ${goal.description}`
      };
    });
  }

  /**
   * Create progress bar (same as your existing)
   */
  private createProgressBar(progress: number): string {
    const filled = Math.floor(progress / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }
}