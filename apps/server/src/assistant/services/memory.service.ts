import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common'; 
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { GroqService } from './groq.service';
import { CacheService } from '../../redis/cache.service';
import { MemoryImportance } from '@prisma/client';
import { IntentType } from '../interfaces/intent.types';
import { BufferedMessage } from './message-buffer.service';

interface MemoryRecall {
  exists: boolean;
  memory?: {
    id: string;
    topic: string;
    summary: string;
    keyPoints: string[];
    updatedAt: Date;
    conversationId: string | null;
    previousDiscussion?: {
      date: Date;
      summary: string;
    };
    nextDiscussion?: {
      date: Date;
      summary: string;
    };
  };
  timeline?: {
    first: Date;
    last: Date;
    count: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  };
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private readonly MEMORY_CACHE_TTL = 3600; // 1 hour

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => GroqService)) private groqService: GroqService,
    private cacheService: CacheService,
  ) {}

  /**
   * Create or update memory - MAIN METHOD USED BY ASSISTANT SERVICE
   */
  async createOrUpdateMemory(
    userId: string,
    conversationId: string,
    messages: any[],
    topic: string,
  ): Promise<string | undefined> {
    try {
      // Validate inputs
      if (!messages || messages.length === 0) {
        this.logger.debug('No messages to create memory from');
        return undefined;
      }

      this.logger.debug(`Creating memory for user ${userId}, topic: ${topic}, messages: ${messages.length}`);

      // Use AI to summarize the conversation - with proper context
      const summaryPrompt = `Summarize this conversation about "${topic}" for long-term memory. Extract key decisions, insights, and action items. Be concise but comprehensive.`;

      // FIX: Pass proper context with user ID
      const summaryResponse = await this.groqService.chatCompletion(
        [
          ...messages,
          { role: 'user', content: summaryPrompt },
        ],
        { user: { id: userId } }, // Pass user context properly
        'GENERAL_ASSISTANT',
      );

      // Check if response is valid
      if (summaryResponse.isFallback) {
        this.logger.debug('Skipping memory creation due to fallback response');
        return undefined;
      }

      if (!summaryResponse.content) {
        this.logger.debug('Skipping memory creation - empty response');
        return undefined;
      }

      // Parse the summary to extract structured data
      const memoryData = await this.parseMemorySummary(summaryResponse.content, messages, topic);

      // Calculate importance score
      const importanceScore = this.calculateImportance(messages, memoryData);
      const importanceEnum = this.mapImportanceToEnum(importanceScore);

      // Create or update memory
      const existingMemory = await this.prisma.assistantMemory.findFirst({
        where: {
          userId,
          topic: { contains: topic, mode: 'insensitive' },
        },
      });

      if (existingMemory) {
        // Update existing memory
        await this.prisma.assistantMemory.update({
          where: { id: existingMemory.id },
          data: {
            summary: memoryData.summary || summaryResponse.content.substring(0, 500),
            keyPoints: memoryData.keyPoints || [],
            importance: importanceEnum,
            contextType: memoryData.contextType || this.determineContextType(topic, messages, summaryResponse.content),
            lastAccessed: new Date(),
            updatedAt: new Date(),
            metadata: {
              decisions: memoryData.decisions || [],
              questions: memoryData.questions || [],
              actionItems: memoryData.actionItems || [],
              entities: memoryData.entities || {},
              sentiment: memoryData.sentiment || 'neutral',
              fullSummary: summaryResponse.content,
              messageCount: messages.length,
              userMessageCount: messages.filter(m => m.role === 'user').length,
              timestamp: new Date().toISOString()
            }
          },
        });
        
        // Clear cache
        await this.cacheService.clearPattern(`memory:search:${userId}:*`);
        
        this.logger.log(`✅ Memory updated: ${existingMemory.id} for topic "${topic}"`);
        return existingMemory.id;
      }

      // Create new memory
      const memory = await this.prisma.assistantMemory.create({
        data: {
          userId,
          topic: memoryData.topic || topic,
          summary: memoryData.summary || summaryResponse.content.substring(0, 500),
          keyPoints: memoryData.keyPoints || [],
          importance: importanceEnum,
          contextType: memoryData.contextType || this.determineContextType(topic, messages, summaryResponse.content),
          source: 'conversation',
          conversationId: conversationId,
          metadata: {
            decisions: memoryData.decisions || [],
            questions: memoryData.questions || [],
            actionItems: memoryData.actionItems || [],
            entities: memoryData.entities || {},
            sentiment: memoryData.sentiment || 'neutral',
            fullSummary: summaryResponse.content,
            messageCount: messages.length,
            userMessageCount: messages.filter(m => m.role === 'user').length,
            timestamp: new Date().toISOString()
          }
        }
      });

      // Link memory to conversation
      await this.prisma.assistantConversation.update({
        where: { id: conversationId },
        data: {
          memories: { connect: { id: memory.id } },
        },
      });

      // Clear cache
      await this.cacheService.clearPattern(`memory:search:${userId}:*`);

      this.logger.log(`✅ Memory created: ${memory.id} for topic "${topic}"`);
      return memory.id;

    } catch (error) {
      this.logger.error('Failed to create memory:', error);
      return undefined;
    }
  }

  // Add to your existing MemoryService

/**
 * Get memories for context with intent-based filtering
 * This is the only new method you need
 */
async getMemoriesForContext(
  userId: string,
  intent: IntentType,
  limit: number = 3
): Promise<any[]> {
  try {
    const memories = await this.prisma.assistantMemory.findMany({
      where: {
        userId,
        OR: [
          { importance: { in: ['CRITICAL', 'HIGH'] } },
          { lastAccessed: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          { contextType: this.mapIntentToContextType(intent) }
        ]
      },
      orderBy: [
        { importance: 'desc' },
        { lastAccessed: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        topic: true,
        summary: true,
        keyPoints: true,
        updatedAt: true,
        metadata: true
      }
    });

    // 🟢 FIX: Safely format dates
    return memories.map(m => ({
      topic: m.topic,
      summary: m.summary,
      keyPoints: m.keyPoints?.slice(0, 2),
      date: m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : 'Recent'
    }));

  } catch (error) {
    this.logger.error('Failed to get memories for context:', error);
    return [];
  }
}

/**
 * Create memory from a batch of messages
 */
async createMemoryFromBatch(
  userId: string,
  conversationId: string,
  messages: BufferedMessage[],
  topic: string
): Promise<string | undefined> {
  try {
    if (!messages || messages.length === 0) return undefined;

    this.logger.debug(`Creating batch memory for user ${userId}, topic: ${topic}, messages: ${messages.length}`);

    const summaryPrompt = `Summarize this conversation about "${topic}" for long-term memory. Extract key decisions, insights, and action items. Be concise but comprehensive.

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`;

    const summaryResponse = await this.groqService.chatCompletion(
      [{ role: 'user', content: summaryPrompt }],
      { user: { id: userId } },
      'GENERAL_ASSISTANT',
    );

    if (summaryResponse.isFallback || !summaryResponse.content) {
      return undefined;
    }

    // Parse and save memory
    const memoryData = await this.parseMemorySummary(
      summaryResponse.content, 
      messages, 
      topic
    );

    const importanceScore = this.calculateImportance(messages, memoryData);
    const importanceEnum = this.mapImportanceToEnum(importanceScore);

    // ✅ FIX: Use updatedAt instead of createdAt
    const existingMemory = await this.prisma.assistantMemory.findFirst({
      where: {
        userId,
        topic: { contains: topic, mode: 'insensitive' },
        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      },
    });

    // Calculate user message count for metadata
    const userMessageCount = messages.filter(m => m.role === 'user').length;

    if (existingMemory) {
      // Merge existing keyPoints with new ones
      const mergedKeyPoints = [...new Set([
        ...(existingMemory.keyPoints || []),
        ...(memoryData.keyPoints || [])
      ])];

      // Merge metadata
      const existingMetadata = (existingMemory.metadata as any) || {};
      const updatedMetadata = {
        ...existingMetadata,
        decisions: [...new Set([...(existingMetadata.decisions || []), ...(memoryData.decisions || [])])],
        questions: [...new Set([...(existingMetadata.questions || []), ...(memoryData.questions || [])])],
        actionItems: [...new Set([...(existingMetadata.actionItems || []), ...(memoryData.actionItems || [])])],
        sentiment: memoryData.sentiment || existingMetadata.sentiment,
        totalMessages: (existingMetadata.totalMessages || 0) + messages.length,
        totalUserMessages: (existingMetadata.totalUserMessages || 0) + userMessageCount,
        lastBatchAt: new Date().toISOString(),
        batchCount: (existingMetadata.batchCount || 0) + 1,
      };

      // ✅ FIX: Update without mentionCount field
      await this.prisma.assistantMemory.update({
        where: { id: existingMemory.id },
        data: {
          summary: memoryData.summary || summaryResponse.content.substring(0, 500),
          keyPoints: mergedKeyPoints,
          importance: importanceEnum,
          lastAccessed: new Date(),
          updatedAt: new Date(),
          metadata: updatedMetadata,
          // ✅ mentionCount is NOT in schema, so we don't use it
        },
      });
      
      this.logger.log(`✅ Memory updated: ${existingMemory.id} (batch #${updatedMetadata.batchCount})`);
      return existingMemory.id;
    }

    // ✅ FIX: Create new memory with correct schema fields
    const memory = await this.prisma.assistantMemory.create({
      data: {
        userId,
        topic: memoryData.topic || topic,
        summary: memoryData.summary || summaryResponse.content.substring(0, 500),
        keyPoints: memoryData.keyPoints || [],
        importance: importanceEnum,
        contextType: memoryData.contextType || 'general_discussion',
        source: 'conversation',
        conversationId,
        lastAccessed: new Date(),
        startedAt: new Date(), // ✅ Use startedAt instead of createdAt
        // ✅ Store counts in metadata
        metadata: {
          decisions: memoryData.decisions || [],
          questions: memoryData.questions || [],
          actionItems: memoryData.actionItems || [],
          sentiment: memoryData.sentiment || 'neutral',
          totalMessages: messages.length,
          userMessageCount: userMessageCount,
          batchCreated: true,
          batchTime: new Date().toISOString(),
        },
        // Optional fields with defaults
        tags: memoryData.tags || [],
        relevanceScore: 0.8,
        importanceScore: importanceScore,
      },
    });

    this.logger.log(`✅ Memory created: ${memory.id}`);
    return memory.id;

  } catch (error) {
    this.logger.error('Failed to create batch memory:', error);
    return undefined;
  }
}


/**
 * Get relevant memories specifically for conversation context
 */
async getRelevantMemoriesForContext(
  userId: string,
  currentMessage: string,
  limit: number = 5
): Promise<any[]> {
  // Check cache first
  const cacheKey = `memories:${userId}:${currentMessage.substring(0, 20)}`;
  const cached = await this.cacheService.getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // 🔴 FIX: Get ALL recent important memories, not just keyword-matched
    const memories = await this.prisma.assistantMemory.findMany({
      where: {
        userId,
        OR: [
          // Include high importance memories regardless of relevance
          { importance: { in: ['CRITICAL', 'HIGH'] } },
          // Include recent memories (last 30 days)
          { updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          // Include keyword-matched memories
          {
            OR: [
              { topic: { contains: currentMessage, mode: 'insensitive' as const } },
              { summary: { contains: currentMessage, mode: 'insensitive' as const } }
            ]
          }
        ]
      },
      orderBy: [
        { importance: 'desc' },
        { updatedAt: 'desc' }
      ],
      take: limit * 2, // Get more than needed for scoring
      select: {
        id: true,
        topic: true,
        summary: true,
        keyPoints: true,
        updatedAt: true,
        importance: true,
        metadata: true
      }
    });

    // Format with proper dates
    const formatted = memories.map(m => {
      const date = m.updatedAt 
        ? this.getRelativeDateString(m.updatedAt)
        : 'Recently';
      
      // Extract decisions if available
      const metadata = (m.metadata as any) || {};
      const decisions = metadata.decisions || [];
      
      return {
        topic: m.topic,
        summary: m.summary,
        keyPoints: m.keyPoints?.slice(0, 3) || [],
        date: date,
        fullDate: m.updatedAt ? m.updatedAt.toISOString() : null,
        importance: m.importance,
        decisions: decisions.slice(0, 2)
      };
    });

    // Cache for 5 minutes
    await this.cacheService.cacheData(cacheKey, formatted, 300);
    
    return formatted;

  } catch (error) {
    this.logger.error('Failed to get memories for context:', error);
    return [];
  }
}

// Helper method to get relative dates
private getRelativeDateString(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Map intent to context type for better memory matching
 */
private mapIntentToContextType(intent: IntentType): string | undefined {
  // Create a complete mapping with type safety
  switch (intent) {
    // Career intents
    case IntentType.CAREER_ADVICE:
    case IntentType.RESUME_FEEDBACK:
    case IntentType.INTERVIEW_PREP:
      return 'career_advice';
    
    // Learning intents
    case IntentType.LEARNING_PATH:
    case IntentType.CONTENT_CLARIFICATION:
    case IntentType.ARTICLE_RECOMMENDATION:
      return 'learning_path';
    
    // Content/reading intents
    case IntentType.CONTENT_CLARIFICATION:
    case IntentType.ARTICLE_RECOMMENDATION:
      return 'content_reading';
    
    // Personal development intents
    case IntentType.GOAL_DISCUSSION:
    case IntentType.GOAL_UPDATE:
    case IntentType.GOAL_STALLED:
    case IntentType.MOTIVATION_SEEKING:
      return 'personal_development';
    
    // Decision intents
    case IntentType.DECISION_HELP:
    case IntentType.OPTION_COMPARISON:
      return 'general_discussion';
    
    // Brain/idea intents
    case IntentType.BRAIN_STORM:
    case IntentType.IDEA_CAPTURE:
    case IntentType.PROJECT_PLANNING:
      return 'general_discussion';
    
    // Identity intents
    case IntentType.IDENTITY_EXPLORATION:
    case IntentType.VALUE_CLARIFICATION:
      return 'personal_development';
    
    // Emotional intents
    case IntentType.EMOTIONAL_SUPPORT:
    case IntentType.STRESS_EXPRESSION:
      return 'emotional_support';
    
    // Future/simulation intents
    case IntentType.SIMULATION_REQUEST:
    case IntentType.PATH_COMPARISON:
      return 'general_discussion';
    
    // Weekly review
    case IntentType.WEEKLY_REVIEW:
      return 'personal_development';
    
    // Basic intents (no specific context needed)
    case IntentType.GREETING:
    case IntentType.FAREWELL:
    case IntentType.GRATITUDE:
    case IntentType.SMALL_TALK:
    case IntentType.GENERAL_QUESTION:
    case IntentType.UNKNOWN:
    default:
      return undefined;
  }
}
/**
 * Quick memory check for greeting intents (lightweight)
 */
async hasRecentActivity(userId: string): Promise<boolean> {
  const recent = await this.prisma.assistantMemory.count({
    where: {
      userId,
      updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24h
    }
  });
  return recent > 0;
}

  /**
   * Parse memory summary to extract structured data
   */
  private async parseMemorySummary(summary: string, messages: any[], topic: string): Promise<any> {
    try {
      // Try to extract JSON from the summary
      const jsonMatch = summary.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Invalid JSON, fall back to extraction
        }
      }

      // Manual extraction if JSON parsing fails
      return {
        topic,
        summary: summary.substring(0, 200),
        keyPoints: this.extractKeyPoints(summary),
        decisions: this.extractDecisions(summary),
        questions: [],
        actionItems: [],
        entities: {},
        sentiment: 'neutral',
        contextType: this.determineContextType(topic, messages, summary)
      };
    } catch (error) {
      this.logger.error('Failed to parse memory summary:', error);
      return {
        topic,
        summary: summary.substring(0, 200),
        keyPoints: [],
        decisions: [],
        questions: [],
        actionItems: [],
        entities: {},
        sentiment: 'neutral',
        contextType: 'general'
      };
    }
  }

  /**
   * Extract key points from summary
   */
  private extractKeyPoints(summary: string): string[] {
    const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).map(s => s.trim());
  }

  /**
   * Extract decisions from summary
   */
  private extractDecisions(summary: string): string[] {
    const decisionIndicators = ['decided', 'chose', 'selected', 'opted for', 'will', 'going to', 'plan to', 'need to'];
    const decisions: string[] = [];
    
    const sentences = summary.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (decisionIndicators.some(indicator => sentence.toLowerCase().includes(indicator))) {
        decisions.push(sentence.trim());
      }
    }
    
    return decisions.slice(0, 3);
  }

  /**
   * RECALL METHOD - Find past conversations about a topic with dates and details
   */
  async recallPastDiscussion(
    userId: string,
    query: string
  ): Promise<string> {
    try {
      // 1. Extract what they're asking about
      const searchTopic = query.toLowerCase();
      
      // 2. Search for relevant memories
      const memories = await this.prisma.assistantMemory.findMany({
        where: {
          userId,
          OR: [
            { topic: { contains: searchTopic, mode: 'insensitive' } },
            { summary: { contains: searchTopic, mode: 'insensitive' } },
            { keyPoints: { has: searchTopic } }
          ]
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      });

      if (memories.length === 0) {
        return "I don't recall discussing that before. Would you like to talk about it now?";
      }

      // 3. Get the most relevant memory
      const primaryMemory = memories[0];
      
      // 4. Parse metadata
      const metadata = primaryMemory.metadata as any || {};
      const decisions = metadata.decisions || [];
      const actionItems = metadata.actionItems || [];

      // 5. Build response with date and details
      const dateStr = primaryMemory.updatedAt.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let response = `Yes, we discussed this on ${dateStr}. `;

      // Check if this was part of a longer conversation chain
      if (memories.length > 1) {
        response += `In fact, we've talked about this ${memories.length} times. `;
        
        const oldest = memories[memories.length - 1];
        const oldestDate = oldest.updatedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        response += `The first time was in ${oldestDate}. `;
      }

      response += `\n\nHere's what we discussed:\n${primaryMemory.summary}\n\n`;

      if (decisions.length > 0) {
        response += `**Key decisions made:**\n`;
        decisions.forEach((d: string) => response += `• ${d}\n`);
        response += '\n';
      }

      if (primaryMemory.keyPoints.length > 0) {
        response += `**Important points:**\n`;
        primaryMemory.keyPoints.forEach((p: string) => response += `• ${p}\n`);
        response += '\n';
      }

      if (actionItems.length > 0) {
        response += `**Action items we discussed:**\n`;
        actionItems.forEach((a: string) => response += `• ${a}\n`);
      }

      return response;

    } catch (error) {
      this.logger.error('Failed to recall memories:', error);
      return "I'm having trouble recalling that right now. Could you tell me more about what you're looking for?";
    }
  }

  /**
   * Get relevant memories for context
   */
  async getRelevantMemories(userId: string, query: string, limit: number = 5): Promise<any[]> {
    try {
      // If query is empty, return recent memories
      if (!query || query.trim() === '') {
        const recentMemories = await this.prisma.assistantMemory.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: limit
        });
        return recentMemories;
      }

      // Otherwise search by relevance
      const memories = await this.prisma.assistantMemory.findMany({
        where: {
          userId,
          OR: [
            { topic: { contains: query, mode: 'insensitive' } },
            { summary: { contains: query, mode: 'insensitive' } },
            { keyPoints: { has: query } }
          ]
        },
        orderBy: [
          { importance: 'desc' },
          { updatedAt: 'desc' }
        ],
        take: limit
      });

      return memories;

    } catch (error) {
      this.logger.error('Failed to get relevant memories:', error);
      return [];
    }
  }

  /**
   * Get memory timeline
   */
  async getMemoryTimeline(userId: string, months: number = 6): Promise<any> {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const memories = await this.prisma.assistantMemory.findMany({
      where: {
        userId,
        updatedAt: { gte: cutoff }
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        topic: true,
        summary: true,
        keyPoints: true,
        updatedAt: true,
        importance: true,
        contextType: true,
        metadata: true
      }
    });

    // Group by month
    const byMonth: Record<string, any[]> = {};
    
    memories.forEach(memory => {
      const month = memory.updatedAt.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      if (!byMonth[month]) byMonth[month] = [];
      byMonth[month].push(memory);
    });

    return {
      total: memories.length,
      byMonth,
      timeline: memories
    };
  }

  /**
   * Enhanced context type determination
   */
  private determineContextType(topic: string, messages: any[], summary: string): string {
    const allText = `${topic} ${summary} ${messages.map(m => m.content).join(' ')}`.toLowerCase();
    
    const contextPatterns = [
      { type: 'career_advice', patterns: ['career', 'job', 'interview', 'resume', 'work', 'profession', 'salary', 'promotion', 'hire'] },
      { type: 'learning_path', patterns: ['learn', 'study', 'course', 'skill', 'teach', 'education', 'tutorial', 'guide', 'how to'] },
      { type: 'content_creation', patterns: ['write', 'article', 'content', 'blog', 'post', 'publish', 'draft', 'edit', 'story'] },
      { type: 'content_reading', patterns: ['read', 'book', 'article', 'paper', 'research', 'study material'] },
      { type: 'technical_discussion', patterns: ['code', 'programming', 'development', 'api', 'database', 'frontend', 'backend'] },
      { type: 'personal_development', patterns: ['goal', 'habit', 'improve', 'better', 'growth', 'mindset', 'motivation'] },
    ];

    for (const { type, patterns } of contextPatterns) {
      if (patterns.some(pattern => allText.includes(pattern))) {
        return type;
      }
    }

    return 'general_discussion';
  }

  /**
   * Calculate importance based on conversation
   */
  private calculateImportance(messages: any[], memoryData: any): number {
    let score = 5; // Base score

    // More messages = more important
    if (messages.length > 15) score += 2;
    else if (messages.length > 8) score += 1;
    else if (messages.length > 3) score += 0.5;

    // Decisions increase importance
    if (memoryData.decisions?.length > 0) score += 2;

    // Action items increase importance
    if (memoryData.actionItems?.length > 0) score += 1;

    // Questions indicate engagement
    if (memoryData.questions?.length > 0) score += 1;

    // Emotional content
    if (memoryData.sentiment === 'positive' || memoryData.sentiment === 'negative') {
      score += 1;
    }

    return Math.min(10, Math.max(1, score));
  }

  /**
   * Map score to importance enum
   */
  private mapImportanceToEnum(score: number): MemoryImportance {
    if (score >= 8) return MemoryImportance.CRITICAL;
    if (score >= 5) return MemoryImportance.HIGH;
    if (score >= 3) return MemoryImportance.MEDIUM;
    return MemoryImportance.LOW;
  }

  /**
   * Search memories
   */
  async searchMemories(
    userId: string,
    searchDto: any,
    userTier?: 'FREE' | 'PREMIUM' | 'ADMIN',
  ): Promise<any[]> {
    const { query, contextType, sortBy = 'recent', limit = 10, offset = 0 } = searchDto;
    
    const maxLimit = userTier === 'FREE' ? 20 : userTier === 'PREMIUM' ? 100 : 200;
    const actualLimit = Math.min(limit, maxLimit);
    
    const where: any = { userId };
    
    if (query) {
      where.OR = [
        { topic: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
        { keyPoints: { has: query } },
      ];
    }
    
    if (contextType) {
      where.contextType = contextType;
    }
    
    let orderBy: any = {};
    switch (sortBy) {
      case 'importance':
        orderBy = { importance: 'desc' };
        break;
      case 'oldest':
        orderBy = { updatedAt: 'asc' };
        break;
      case 'recent':
      default:
        orderBy = { updatedAt: 'desc' };
        break;
    }
    
    const memories = await this.prisma.assistantMemory.findMany({
      where,
      orderBy,
      skip: offset,
      take: actualLimit,
    });

    return memories;
  }

  /**
   * Get memory stats
   */
  async getMemoryStats(userId: string): Promise<{
    total: number;
    byImportance: Record<MemoryImportance, number>;
    byContextType: Record<string, number>;
    recentCount: number;
  }> {
    const memories = await this.prisma.assistantMemory.findMany({
      where: { userId },
      select: {
        importance: true,
        contextType: true,
        updatedAt: true,
      },
    });

    const byImportance: Record<MemoryImportance, number> = {
      [MemoryImportance.LOW]: 0,
      [MemoryImportance.MEDIUM]: 0,
      [MemoryImportance.HIGH]: 0,
      [MemoryImportance.CRITICAL]: 0,
    };

    const byContextType: Record<string, number> = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let recentCount = 0;

    memories.forEach((memory) => {
      // Count by importance
      const importance = memory.importance as MemoryImportance;
      byImportance[importance] = (byImportance[importance] || 0) + 1;
      
      // Count by context type
      const contextType = memory.contextType || 'unknown';
      byContextType[contextType] = (byContextType[contextType] || 0) + 1;
      
      // Count recent memories
      if (memory.updatedAt && new Date(memory.updatedAt) > thirtyDaysAgo) {
        recentCount++;
      }
    });

    return {
      total: memories.length,
      byImportance,
      byContextType,
      recentCount,
    };
  }

  /**
   * Delete memory
   */
  async deleteMemory(userId: string, memoryId: string): Promise<void> {
    const memory = await this.prisma.assistantMemory.findFirst({
      where: { id: memoryId, userId },
    });

    if (!memory) {
      throw new Error('Memory not found or access denied');
    }

    await this.prisma.assistantMemory.delete({
      where: { id: memoryId },
    });

    await this.cacheService.clearPattern(`memory:search:${userId}:*`);
  }

  // Add to memory.service.ts
async recallConversationsByTimeframe(
  userId: string,
  timeframe: 'today' | 'yesterday' | 'week' | 'month' | 'last-week' | 'last-month'
): Promise<string> {
  try {
    let startDate: Date;
    const now = new Date();
    
    switch (timeframe) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'yesterday':
        startDate = new Date(now.setDate(now.getDate() - 1));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
      case 'last-week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
      case 'last-month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    // Get memories from that period
    const memories = await this.prisma.assistantMemory.findMany({
      where: {
        userId,
        updatedAt: { gte: startDate }
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        topic: true,
        summary: true,
        updatedAt: true,
        keyPoints: true
      }
    });

    if (memories.length === 0) {
      return `I don't have any memories from ${timeframe.replace('-', ' ')}.`;
    }

    // Group by date
    const byDate: Record<string, any[]> = {};
    memories.forEach(m => {
      const dateStr = m.updatedAt.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
      if (!byDate[dateStr]) byDate[dateStr] = [];
      byDate[dateStr].push(m);
    });

    // Build response
    let response = `Here's what we discussed ${timeframe.replace('-', ' ')}:\n\n`;
    
    Object.entries(byDate).forEach(([date, mems]) => {
      response += `**${date}**\n`;
      mems.forEach(m => {
        response += `• ${m.topic}: ${m.summary}\n`;
        if (m.keyPoints?.length) {
          response += `  - ${m.keyPoints.slice(0, 2).join('\n  - ')}\n`;
        }
      });
      response += '\n';
    });

    return response;

  } catch (error) {
    this.logger.error('Failed to recall conversations:', error);
    return "I'm having trouble recalling that right now. Could you be more specific?";
  }
}

  /**
   * Update memory importance
   */
  async updateMemoryImportance(userId: string, memoryId: string, importance: MemoryImportance): Promise<void> {
    const memory = await this.prisma.assistantMemory.findFirst({
      where: { id: memoryId, userId },
    });

    if (!memory) {
      throw new Error('Memory not found or access denied');
    }

    await this.prisma.assistantMemory.update({
      where: { id: memoryId },
      data: { importance, updatedAt: new Date() },
    });

    await this.cacheService.clearPattern(`memory:search:${userId}:*`);
  }
}