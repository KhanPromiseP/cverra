
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { GroqService } from './groq.service';
import { CacheService } from '../../redis/cache.service'; 
import { MemoryImportance } from '@prisma/client';

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(
    private prisma: PrismaService,
    private groqService: GroqService,
    private cacheService: CacheService, 
  ) {}

  async createOrUpdateMemory(
  userId: string,
  conversationId: string,
  messages: any[],
  topic: string,
): Promise<string | undefined> { // Changed from string | null
  try {
    // Validate inputs
    if (!messages || messages.length === 0) {
      this.logger.debug('No messages to create memory from');
      return undefined; // Return undefined, not null
    }

    // Extract key information from conversation
    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');

    // Use AI to summarize the conversation
    const summaryPrompt = `Summarize this conversation about "${topic}" for long-term memory. Extract key decisions, insights, and action items. Be concise but comprehensive.`;

    const summaryResponse = await this.groqService.chatCompletion(
      [
        ...messages,
        { role: 'user', content: summaryPrompt },
      ],
      {},
      'GENERAL_ASSISTANT',
    );

    // CRITICAL: Check if the response is valid
    if (summaryResponse.isFallback) {
      this.logger.debug('Skipping memory creation due to fallback response');
      return undefined; // Return undefined
    }

    if (!summaryResponse.content) {
      this.logger.debug('Skipping memory creation - empty response');
      return undefined; // Return undefined
    }

    // CRITICAL: Check if the content is actually an error message
    if (this.isErrorMessage(summaryResponse.content)) {
      this.logger.debug('Skipping memory creation - response contains error message');
      return undefined; // Return undefined
    }

    // CRITICAL: Check if the summary is meaningful
    if (summaryResponse.content.length < 20) {
      this.logger.debug('Skipping memory creation - summary too short');
      return undefined; // Return undefined
    }

    // Calculate importance score based on engagement
    const importanceScore = this.calculateImportance(messages);
    const importanceEnum = this.mapImportanceToEnum(importanceScore);

    // Create or update memory
    const existingMemory = await this.prisma.assistantMemory.findFirst({
      where: {
        userId,
        topic: { contains: topic, mode: 'insensitive' },
      },
    });

    if (existingMemory) {
      await this.prisma.assistantMemory.update({
        where: { id: existingMemory.id },
        data: {
          summary: summaryResponse.content,
          importance: importanceEnum,
          lastAccessed: new Date(),
          updatedAt: new Date(),
        },
      });
      
      // Clear cache
      await this.cacheService.clearPattern(`memory:search:${userId}:*`);
      
      return existingMemory.id; // Return string on success
    }

    const memory = await this.prisma.assistantMemory.create({
      data: {
        userId,
        topic,
        summary: summaryResponse.content,
        importance: importanceEnum,
        contextType: this.determineContextType(topic, messages, summaryResponse.content),
        source: 'conversation',
      },
    });

    // Link memory to conversation
    await this.prisma.assistantConversation.update({
      where: { id: conversationId },
      data: {
        memories: { connect: { id: memory.id } },
      },
    });

    // Clear cache for this user's memories
    await this.cacheService.clearPattern(`memory:search:${userId}:*`);

    return memory.id; // Return string on success
  } catch (error) {
    this.logger.error('Failed to create memory:', error);
    return undefined; // Return undefined on error
  }
}

  // Helper to detect error messages
  private isErrorMessage(text: string): boolean {
    const errorPatterns = [
      'connection issues',
      'temporary',
      'please try again',
      'technical difficulties',
      'unavailable',
      'failed to',
      'error',
      'timeout',
      'sorry',
      'cannot',
      'unable to',
      'not available',
      'experiencing',
      'try again',
      'moment',
      'later',
    ];
    
    const lowerText = text.toLowerCase();
    
    // Check if it's an error message
    const isError = errorPatterns.some(pattern => 
      lowerText.includes(pattern.toLowerCase())
    );

    // Also check if it's too short to be meaningful
    const isTooShort = text.length < 50;

    // Check if it contains typical memory summary keywords (good signal)
    const hasGoodKeywords = /key (points|decisions|insights)|learned|discussed|decided|agreed/i.test(text);

    return isError || (isTooShort && !hasGoodKeywords);
  }

  // Enhanced context type determination
  private determineContextType(topic: string, messages: any[], summary: string): string {
    const allText = `${topic} ${summary} ${messages.map(m => m.content).join(' ')}`.toLowerCase();
    
    // More sophisticated context detection
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

  // Validate memory quality before returning to user
  async getValidatedMemory(memoryId: string, userId: string): Promise<any | null> {
    const memory = await this.prisma.assistantMemory.findFirst({
      where: { id: memoryId, userId },
    });

    if (!memory) return null;

    // If memory contains error message, return a cleaned version
    if (this.isErrorMessage(memory.summary)) {
      return {
        ...memory,
        summary: '[This memory could not be properly saved due to a temporary issue]',
        isValid: false,
      };
    }

    return memory;
  }

  // Rest of your existing methods remain the same
  private calculateImportance(messages: any[]): number {
    const userMessages = messages.filter(m => m.role === 'user');
    
    // Factors for importance:
    let score = 3; // Default medium
    
    // More messages = higher importance
    if (userMessages.length > 10) score += 1;
    if (userMessages.length > 20) score += 1;
    
    // Check for decision keywords
    const decisionKeywords = ['decide', 'choose', 'option', 'should', 'recommend'];
    const hasDecisions = messages.some(m =>
      decisionKeywords.some(keyword => 
        m.content.toLowerCase().includes(keyword)
      )
    );
    
    if (hasDecisions) score += 1;
    
    // Cap at maximum importance
    return Math.min(Math.max(score, 1), 10);
  }

  private mapImportanceToEnum(score: number): MemoryImportance {
    // Map numeric score to MemoryImportance enum
    if (score <= 2) return MemoryImportance.LOW;
    if (score <= 5) return MemoryImportance.MEDIUM;
    if (score <= 8) return MemoryImportance.HIGH;
    return MemoryImportance.CRITICAL;
  }

  async searchMemories(
    userId: string,
    searchDto: any,
    userTier?: 'FREE' | 'PREMIUM' | 'ADMIN',
  ): Promise<any[]> {
    const { query, contextType, tags = [], sortBy = 'recent', limit = 10, offset = 0, dateFrom, dateTo } = searchDto;
    
    // Apply tier-based limit
    const maxLimit = userTier === 'FREE' ? 20 : userTier === 'PREMIUM' ? 100 : 200;
    const actualLimit = Math.min(limit, maxLimit);
    
    // Build where clause
    const where: any = { userId };
    
    if (query) {
      where.OR = [
        { topic: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ];
    }
    
    if (contextType) {
      where.contextType = contextType;
    }
    
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }
    
    if (dateFrom || dateTo) {
      where.updatedAt = {};
      if (dateFrom) where.updatedAt.gte = new Date(dateFrom);
      if (dateTo) where.updatedAt.lte = new Date(dateTo);
    }
    
    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'importance':
        orderBy = { importance: 'desc' };
        break;
      case 'relevance':
        orderBy = { relevanceScore: 'desc' };
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

    // Filter out error messages from search results
    const validMemories = memories.map(memory => {
      if (this.isErrorMessage(memory.summary)) {
        return {
          ...memory,
          summary: '[This memory could not be properly saved due to a temporary issue]',
          isValid: false,
        };
      }
      return memory;
    });
    
    // Cache the search results
    const cacheKey = `memory:search:${userId}:${JSON.stringify(searchDto)}`;
    await this.cacheService.cacheData(cacheKey, validMemories, 300); // Cache for 5 minutes
    
    return validMemories;
  }

  async getRelevantMemories(userId: string, query: string, limit: number = 5): Promise<any[]> {
    // Simple keyword matching for now - could upgrade to vector search
    const memories = await this.prisma.assistantMemory.findMany({
      where: { userId },
      orderBy: [
        { importance: 'desc' },
        { lastAccessed: 'desc' },
      ],
      take: limit * 2, // Get extra to filter
    });

    // Simple relevance scoring
    const queryWords = query.toLowerCase().split(/\s+/);
    
    return memories
      .map((memory: any) => {
        // Skip memories that are actually error messages
        if (this.isErrorMessage(memory.summary)) {
          return null;
        }

        const memoryText = `${memory.topic} ${memory.summary}`.toLowerCase();
        let score = 0;
        
        queryWords.forEach(word => {
          if (memoryText.includes(word)) {
            score += 1;
          }
        });
        
        // Boost score for recent and important memories
        const daysSinceAccess = (Date.now() - new Date(memory.lastAccessed).getTime()) / (1000 * 60 * 60 * 24);
        const recencyBoost = Math.max(0, 1 - (daysSinceAccess / 30)); // Decay over 30 days
        const importanceBoost = this.mapNumericImportance(memory.importance) / 10;
        
        score += (recencyBoost + importanceBoost) * 2;
        
        return { ...memory, relevanceScore: score };
      })
      .filter((m: any) => m !== null && m.relevanceScore > 0)
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  private mapNumericImportance(importance: MemoryImportance): number {
    // Map MemoryImportance enum back to numeric for scoring
    switch (importance) {
      case MemoryImportance.LOW: return 1;
      case MemoryImportance.MEDIUM: return 3;
      case MemoryImportance.HIGH: return 5;
      case MemoryImportance.CRITICAL: return 10;
      default: return 3;
    }
  }

  async deleteMemory(userId: string, memoryId: string): Promise<void> {
    const memory = await this.prisma.assistantMemory.findFirst({
      where: { id: memoryId, userId },
    });

    if (!memory) {
      throw new Error('Memory not found or access denied');
    }

    // Find all conversations that reference this memory and disconnect them
    const conversations = await this.prisma.assistantConversation.findMany({
      where: { memories: { some: { id: memoryId } } },
    });

    // Disconnect memory from each conversation
    for (const conversation of conversations) {
      await this.prisma.assistantConversation.update({
        where: { id: conversation.id },
        data: {
          memories: { disconnect: { id: memoryId } },
        },
      });
    }

    // Delete the memory
    await this.prisma.assistantMemory.delete({
      where: { id: memoryId },
    });

    // Clear cache
    await this.cacheService.clearPattern(`memory:search:${userId}:*`);
  }

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

    // Clear cache
    await this.cacheService.clearPattern(`memory:search:${userId}:*`);
  }

  async getMemoryStats(userId: string): Promise<{
    total: number;
    byImportance: Record<MemoryImportance, number>;
    byContextType: Record<string, number>;
    recentCount: number;
    invalidCount: number; // Track invalid memories
  }> {
    const memories = await this.prisma.assistantMemory.findMany({
      where: { userId },
      select: {
        importance: true,
        contextType: true,
        updatedAt: true,
        summary: true, // Need summary to check validity
      },
    });

    // Initialize with all possible enum values
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
    let invalidCount = 0;

    memories.forEach((memory) => {
      // Check if memory is invalid
      if (this.isErrorMessage(memory.summary)) {
        invalidCount++;
        return; // Skip counting invalid memories in other stats
      }

      // Count by importance
      const importance = memory.importance as MemoryImportance;
      if (importance in byImportance) {
        byImportance[importance] = (byImportance[importance] || 0) + 1;
      }
      
      // Count by context type
      const contextType = memory.contextType || 'unknown';
      byContextType[contextType] = (byContextType[contextType] || 0) + 1;
      
      // Count recent memories using updatedAt
      if (memory.updatedAt && new Date(memory.updatedAt) > thirtyDaysAgo) {
        recentCount++;
      }
    });

    return {
      total: memories.length,
      byImportance,
      byContextType,
      recentCount,
      invalidCount, // Return invalid count
    };
  }

  // Clean up invalid memories
  async cleanupInvalidMemories(userId?: string): Promise<number> {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    const memories = await this.prisma.assistantMemory.findMany({
      where,
      select: { id: true, summary: true },
    });

    const invalidMemories = memories.filter(m => this.isErrorMessage(m.summary));
    
    for (const memory of invalidMemories) {
      await this.prisma.assistantMemory.delete({
        where: { id: memory.id },
      });
    }

    // Clear all memory caches
    if (userId) {
      await this.cacheService.clearPattern(`memory:search:${userId}:*`);
    } else {
      // Clear all memory caches (admin function)
      await this.cacheService.clearPattern('memory:search:*');
    }

    this.logger.log(`Cleaned up ${invalidMemories.length} invalid memories`);
    return invalidMemories.length;
  }
}