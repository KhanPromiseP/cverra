
import { Injectable, Logger, HttpException, HttpStatus, BadRequestException  } from '@nestjs/common';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { GroqService } from './groq.service';
import { ContextBuilderService } from './context-builder.service';
import { MemoryService } from './memory.service';
import { CacheService } from '../../redis/cache.service'; 
import { SendMessageDto, AssistantResponseDto } from '../dto';
import { NotFoundException } from '@nestjs/common';
import { AssistantMode } from '../dto/send-message.dto'; 

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private prisma: PrismaService,
    private groqService: GroqService,
    private contextBuilder: ContextBuilderService,
    private memoryService: MemoryService,
    private cacheService: CacheService, // ADD THIS DEPENDENCY
  ) {}



  async createConversation(userId: string, mode?: string) {
    const conversation = await this.prisma.assistantConversation.create({
      data: {
        userId,
         mode: (mode as AssistantMode) || AssistantMode.GENERAL_ASSISTANT,
        title: `Conversation ${new Date().toLocaleDateString()}`,
      },
    });

    // Initialize analytics if not exists
    await this.prisma.assistantAnalytics.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // Clear any cached conversation data
    await this.cacheService.clearPattern(`conversation:${conversation.id}:*`);

    return conversation;
  }

async sendMessage(
  userId: string,
  dto: SendMessageDto,
  userTier?: 'FREE' | 'PREMIUM' | 'ADMIN',
): Promise<AssistantResponseDto> {
  const startTime = Date.now();
  
  // Debug 1: Log the incoming request
  this.logger.debug('sendMessage called:', {
    userId,
    contentLength: dto.content?.length,
    mode: dto.mode,
    userTier,
  });
  
  // Check rate limit based on user tier - this will throw if limit reached
  await this.checkRateLimits(userId, userTier);

  // Get or create conversation
  let conversation = await this.prisma.assistantConversation.findFirst({
    where: { userId, active: true },
    orderBy: { updatedAt: 'desc' },
  });

  if (!conversation) {
    conversation = await this.createConversation(userId, dto.mode);
  }

  // Get conversation context from cache if available
  const cachedContext = await this.cacheService.getConversationContext(conversation.id);
  
  let fullContext;
  if (cachedContext) {
    fullContext = cachedContext;
    this.logger.debug(`Using cached context for conversation ${conversation.id}`);
  } else {
    // Build comprehensive context
    const userContext = await this.contextBuilder.buildUserContext(userId);
    const contentContext = await this.contextBuilder.buildContentContext(dto.contextIds);
    const careerContext = await this.contextBuilder.buildCareerContext(userId);
    const relevantMemories = await this.getRelevantMemoriesWithCache(
      userId,
      dto.content,
      3,
    );

    // Debug 2: Check what's in userContext
    this.logger.debug('User context structure:', {
      hasUser: !!userContext.user,
      userKeys: userContext.user ? Object.keys(userContext.user) : 'no user',
      userProfile: !!userContext.userProfile,
    });

    // Combine all context
    fullContext = {
      ...userContext,
      ...contentContext,
      careerContext,
      memories: relevantMemories,
      // Ensure user has proper name resolution
      user: {
        id: userId,
        tier: userTier || 'FREE',
        name: userContext.user?.name || userContext.userProfile?.name || userContext.user?.username || 'there',
        email: userContext.user?.email || '',
        username: userContext.user?.username || '',
        createdAt: userContext.user?.createdAt || new Date(),
      },
    };

    // Debug 3: Check the final context
    this.logger.debug('Full context built:', {
      hasUser: !!fullContext.user,
      userId: fullContext.user?.id,
      userTier: fullContext.user?.tier,
      contextKeys: Object.keys(fullContext),
    });

    // Cache the context for future use
    await this.cacheService.cacheConversationContext(conversation.id, fullContext);
  }

  // Debug 4: Check if fullContext exists
  if (!fullContext) {
    this.logger.error('fullContext is undefined! This should not happen.');
    throw new Error('Failed to build conversation context');
  }

  // Get recent messages (context window) - apply tier-based limit
  const contextSize = this.getContextSizeByTier(userTier);
  const recentMessages = await this.prisma.assistantMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
    take: contextSize,
  });

  // Clean messages for AI
  const cleanedMessages = this.cleanMessages(recentMessages.reverse());
  
  // Prepare messages for AI
  const aiMessages = [
    ...cleanedMessages,
    { role: 'user', content: dto.content },
  ];

  // Debug 5: Check messages being sent
  this.logger.debug('Messages for Groq:', {
    messageCount: aiMessages.length,
    sampleMessage: aiMessages[0] ? {
      role: aiMessages[0].role,
      contentPreview: aiMessages[0].content?.substring(0, 100) + '...',
    } : 'no messages',
  });

  // Debug 6: Check what we're passing to GroqService
  this.logger.debug('Calling GroqService with:', {
    messagesCount: aiMessages.length,
    hasContext: !!fullContext,
    contextUser: fullContext.user,
    mode: conversation.mode,
    userTier,
  });

  // Get AI response with tier-based token limit
  const aiResponse = await this.groqService.chatCompletion(
    aiMessages,
    fullContext,
    conversation.mode,
    {
      maxTokens: this.getMaxTokensByTier(userTier),
      temperature: 0.7,
      retryAttempts: 2,
      timeout: 15000, // 15 seconds timeout
    },
    userTier,
  );

  // Debug 7: Check the response
  this.logger.debug('Groq response:', {
    hasContent: !!aiResponse.content,
    contentLength: aiResponse.content?.length,
    tokens: aiResponse.tokens,
    model: aiResponse.model,
    isFallback: aiResponse.isFallback,
  });

  // Save user message
  const userMessage = await this.prisma.assistantMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'user',
      content: dto.content,
      tokens: this.estimateTokens(dto.content),
    },
  });

  // Save assistant message
  const assistantMessage = await this.prisma.assistantMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'assistant',
      content: aiResponse.content,
      tokens: aiResponse.tokens,
      model: aiResponse.model,
    },
  });

  // Update conversation
  await this.prisma.assistantConversation.update({
    where: { id: conversation.id },
    data: {
      messageCount: { increment: 2 },
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Update analytics
  try {
    await this.prisma.assistantAnalytics.update({
      where: { userId },
      data: {
        totalMessages: { increment: 2 },
        totalTokens: { increment: aiResponse.tokens + this.estimateTokens(dto.content) },
        modeUsage: this.updateModeUsage(conversation.mode),
      },
    });
  } catch (error) {
    this.logger.warn('Failed to update analytics:', error.message);
  }

  // Invalidate cached context since conversation has changed
  await this.cacheService.clearPattern(`conversation:${conversation.id}:*`);

  // Extract topic for memory
  const topic = this.extractTopic(dto.content);
  
  // Create memory if conversation has at least 3 messages
  let memoryId: string | undefined;

  if (
    recentMessages.length >= 3 && 
    !aiResponse.isFallback && 
    aiResponse.content && 
    !this.isErrorMessage(aiResponse.content)
  ) {
    // Prepare messages for memory creation
    const memoryMessages = this.cleanMessages([
      ...recentMessages.slice(-5),
      { role: 'user', content: dto.content },
      { role: 'assistant', content: aiResponse.content },
    ]);
    
    try {
      const result = await this.memoryService.createOrUpdateMemory(
        userId,
        conversation.id,
        memoryMessages,
        topic,
      );
      
      memoryId = result ?? undefined;
      
      if (memoryId) {
        this.logger.debug('Memory created successfully for user:', { userId, memoryId });
        await this.cacheService.clearPattern(`memory:search:${userId}:*`);
      }
    } catch (error) {
      this.logger.warn('Failed to create memory:', error.message);
    }
  }

  const responseTime = Date.now() - startTime;

  // Extract referenced articles from response
  const referencedArticles = await this.extractReferencedArticles(aiResponse.content);

  // Cache article references for future recommendations
  if (referencedArticles.length > 0) {
    await this.cacheService.cacheArticleRecommendations(userId, referencedArticles);
  }

  let rateLimit: { remaining: number; reset: number; limit: number } | undefined;

  if (userTier === 'FREE') {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const cacheKey = `ratelimit:daily:${userId}:${startOfDay.toISOString().split('T')[0]}`;
    
    const cachedCount = await this.cacheService.getCachedData(cacheKey);
    const todayCount = cachedCount ? parseInt(cachedCount) || 0 : 0;
    
    const remaining = Math.max(0, 10 - todayCount);
    
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const resetTimestamp = midnight.getTime(); // Get timestamp in milliseconds (number)
    
    rateLimit = {
      remaining: remaining,
      limit: 10,
      reset: resetTimestamp,
    };
  }

  // Debug 8: Final response
  this.logger.debug('Returning response:', {
    contentLength: aiResponse.content?.length,
    memoryCreated: !!memoryId,
    memoryId: memoryId || 'none',
    responseTime,
    rateLimit: userTier === 'FREE' ? rateLimit : 'unlimited',
  });

  return {
    content: aiResponse.content,
    conversationId: conversation.id,
    messageId: assistantMessage.id,
    mode: conversation.mode,
    referencedArticles,
    // Add empty array for referencedContent if you don't have it
    referencedContent: [],
    memoryCreated: !!memoryId,
    memoryId: memoryId,
    // memorySummary is optional, omit if not available
    userTier: userTier || 'FREE',
    features: this.getFeaturesByTier(userTier || 'FREE'),
    tokensUsed: aiResponse.tokens,
    responseTime,
    // Use the rateLimit object as defined in your DTO
    rateLimit: userTier === 'FREE' ? rateLimit : undefined,
    model: aiResponse.model,
    // suggestions is optional, omit if not available
    timestamp: new Date().toISOString(),
  };
}

// Helper method to detect error messages in AI responses
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
    'later'
  ];
  
  const lowerText = text.toLowerCase();
  
  // Check if it's an error message
  const isError = errorPatterns.some(pattern => 
    lowerText.includes(pattern.toLowerCase())
  );

  // Also check if it's too short to be meaningful (likely an error)
  const isTooShort = text.length < 50;

  return isError || isTooShort;
}

// Add this helper method to the class:
private cleanMessages(messages: any[]): any[] {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
    // Remove all other properties
  }));
}

async searchMemories(
  userId: string,
  searchDto: any,
  userTier?: 'FREE' | 'PREMIUM' | 'ADMIN', // Keep param for compatibility but don't use it
): Promise<any[]> {
  const { query, contextType, tags = [], sortBy = 'recent', limit = 10, offset = 0, dateFrom, dateTo } = searchDto;
  
  // ALL users get the same limit (or remove limit entirely)
  const actualLimit = Math.min(limit, 100); // Same for everyone
  
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

  // Filter out error messages
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
  await this.cacheService.cacheData(cacheKey, validMemories, 300);
  
  return validMemories;
}

 private async checkRateLimits(userId: string, userTier?: 'FREE' | 'PREMIUM' | 'ADMIN'): Promise<void> {
  const tier = userTier || 'FREE';
  
  if (tier === 'FREE') {
    // Free tier: 10 messages per day ACROSS ALL MODES
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    
    // Use a single key for ALL messages regardless of mode
    const cacheKey = `ratelimit:daily:${userId}:${startOfDay.toISOString().split('T')[0]}`;
    
    // Get current count
    const cachedCount = await this.cacheService.getCachedData(cacheKey);
    const todayCount = cachedCount ? parseInt(cachedCount) || 0 : 0;
    
    // Log for debugging
    this.logger.debug(`Rate limit check for user ${userId}: ${todayCount}/10 messages used today`);
    
    if (todayCount >= 10) {
      // Calculate reset time (midnight tonight)
      const resetTime = new Date();
      resetTime.setHours(24, 0, 0, 0);
      
      throw new HttpException(
        {
          message: 'Daily message limit reached (10 messages).',
          upgradeLink: '/pricing',
          remainingMessages: 0,
          limit: 10,
          resetTime: resetTime.toISOString(),
          upgradeText: 'Upgrade to Premium for unlimited access',
          currentUsage: todayCount,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment the counter for this request
    const newCount = todayCount + 1;
    await this.cacheService.cacheData(cacheKey, newCount.toString(), 86400); // 24 hours TTL
    
    this.logger.debug(`Incremented rate limit for user ${userId}: ${newCount}/10 messages used today`);
  }
  // Premium and Admin tiers have no daily limits
}



async getLatestConversation(userId: string): Promise<any> {
  const latestConversation = await this.prisma.assistantConversation.findFirst({
    where: {
      userId,
      isDeleted: false,
      isArchived: false,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    include: {
      messages: {
        where: {
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: 50,
      },
    },
  });

  if (!latestConversation) {
    throw new NotFoundException('No conversation found');
  }

  return latestConversation;
}

async getLatestConversationMessages(
  userId: string, 
  limit?: number, 
  offset?: number
): Promise<{ conversationId: string; messages: any[]; total: number }> {
  const latestConversation = await this.prisma.assistantConversation.findFirst({
    where: {
      userId,
      isDeleted: false,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    select: {
      id: true,
    },
  });

  if (!latestConversation) {
    throw new NotFoundException('No conversation found');
  }

  const actualLimit = limit || 50;
  const actualOffset = offset || 0;

  const [messages, total] = await Promise.all([
    this.prisma.assistantMessage.findMany({
      where: {
        conversationId: latestConversation.id,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: actualLimit,
      skip: actualOffset,
    }),
    this.prisma.assistantMessage.count({
      where: {
        conversationId: latestConversation.id,
        isDeleted: false,
      },
    }),
  ]);

  return {
    conversationId: latestConversation.id,
    messages,
    total,
  };
}


  private async getRelevantMemoriesWithCache(
    userId: string,
    query: string,
    limit: number,
  ): Promise<any[]> {
    // Try to get from cache first
    const cachedMemories = await this.cacheService.getMemorySearch(userId, query);
    
    if (cachedMemories && cachedMemories.length > 0) {
      this.logger.debug(`Using cached memories for query: ${query.substring(0, 50)}...`);
      return cachedMemories;
    }

    // Get from database if not cached
    const memories = await this.memoryService.getRelevantMemories(userId, query, limit);
    
    // Cache the results
    await this.cacheService.cacheMemorySearch(userId, query, memories);
    
    return memories;
  }

  private getContextSizeByTier(userTier?: 'FREE' | 'PREMIUM' | 'ADMIN'): number {
    switch (userTier) {
      case 'ADMIN':
        return 50;
      case 'PREMIUM':
        return 10;
      case 'FREE':
      default:
        return 5;
    }
  }

    private getMaxTokensByTier(userTier?: string): number {
    switch (userTier) {
        case 'ADMIN': return 8000;
        case 'PREMIUM': return 4000;
        case 'FREE':
        default: return 1000;
    }
    }

//   private getMaxTokensByTier(userTier?: 'FREE' | 'PREMIUM' | 'ADMIN'): number {
//     switch (userTier) {
//       case 'ADMIN':
//         return 8000;
//       case 'PREMIUM':
//         return 4000;
//       case 'FREE':
//       default:
//         return 1000;
//     }
//   }

  
private canCreateMemory(userTier?: 'FREE' | 'PREMIUM' | 'ADMIN', messageCount: number = 0): boolean {
  // ALL users can create memories - no tier-based restriction
  // Only require minimum messages for context (3 messages is enough for meaningful memory)
  return messageCount >= 3;
}

  private getFeaturesByTier(userTier?: 'FREE' | 'PREMIUM' | 'ADMIN'): any {
    return {
      unlimitedMessages: userTier === 'PREMIUM' || userTier === 'ADMIN',
      advancedMemory: userTier === 'PREMIUM' || userTier === 'ADMIN',
      priorityProcessing: userTier === 'PREMIUM' || userTier === 'ADMIN',
      customModels: userTier === 'ADMIN',
      maxTokens: this.getMaxTokensByTier(userTier),
      contextSize: this.getContextSizeByTier(userTier),
    };
  }

  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
  }

  private updateModeUsage(mode: string): any {
    // Update JSON field with mode usage statistics
    return {
      update: {
        [mode]: {
          increment: 1,
        },
      },
    };
  }

  private extractTopic(content: string): string {
    // Simple topic extraction - could be enhanced with AI
    const sentences = content.split(/[.!?]+/);
    const firstSentence = sentences[0].trim();
    return firstSentence.length > 50 
      ? firstSentence.substring(0, 50) + '...' 
      : firstSentence;
  }

  private async extractReferencedArticles(content: string): Promise<any[]> {
    // Extract article mentions from response
    const articleMentions = content.match(/article\s+["']([^"']+)["']/gi) || [];
    
    if (articleMentions.length === 0) return [];

    // Search for articles by title
    const titles = articleMentions.map(m => 
      m.replace(/article\s+["']([^"']+)["']/i, '$1')
    );

    const articles = await this.prisma.article.findMany({
      where: {
        title: { in: titles },
        OR: [
          { accessType: 'FREE' },
          { authorId: (this as any).userId }, // User's own articles
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        accessType: true,
      },
      take: 3,
    });

    return articles.map((article: any) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      accessType: article.accessType,
      relevance: 0.8,
    }));
  }

  async getConversations(userId: string, userTier?: 'FREE' | 'PREMIUM' | 'ADMIN') {
    // Apply tier-based limits on number of conversations returned
    const limit = userTier === 'FREE' ? 10 : 50;
    
    return this.prisma.assistantConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });
  }

//   async getConversationMessages(conversationId: string, userId: string, userTier?: 'FREE' | 'PREMIUM' | 'ADMIN') {
//     // Verify ownership
//     const conversation = await this.prisma.assistantConversation.findFirst({
//       where: { id: conversationId, userId },
//     });

//     if (!conversation) {
//       throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
//     }

//     // Apply tier-based limit on messages
//     const limit = userTier === 'FREE' ? 50 : 500;
    
//     return this.prisma.assistantMessage.findMany({
//       where: { conversationId },
//       orderBy: { createdAt: 'asc' },
//       take: limit,
//     });
//   }

    // Add to AssistantService class
    async getConversationMessages(conversationId: string, userId: string, userTier?: string): Promise<any[]> {
    // Verify ownership
    const conversation = await this.prisma.assistantConversation.findFirst({
        where: { id: conversationId, userId },
    });

    if (!conversation) {
        throw new NotFoundException('Conversation not found');
    }

    // Apply tier-based limit on messages
    const limit = userTier === 'FREE' ? 50 : userTier === 'PREMIUM' ? 500 : 1000;
    
    return this.prisma.assistantMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: limit,
    });
    }

  async getMemories(userId: string, userTier?: 'FREE' | 'PREMIUM' | 'ADMIN') {
    // Apply tier-based limits on memories
    const limit = userTier === 'FREE' ? 10 : 100;
    
    return this.prisma.assistantMemory.findMany({
      where: { userId },
      orderBy: [
        { importance: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: limit,
    });
  }

  // New method to get user analytics with caching
  async getUserAnalytics(userId: string) {
    const cacheKey = `analytics:${userId}`;
    const cachedAnalytics = await this.cacheService.getCachedData(cacheKey);
    
    if (cachedAnalytics) {
      return cachedAnalytics;
    }

    const analytics = await this.prisma.assistantAnalytics.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    // Cache for 5 minutes
    await this.cacheService.cacheData(cacheKey, analytics, 300);
    
    return analytics;
  }

  // Health check method
  async healthCheck(): Promise<{
    database: boolean;
    redis: boolean;
    groq: boolean;
    cacheStats: any;
  }> {
    const [database, redis, groq] = await Promise.all([
      this.checkDatabaseHealth(),
      this.cacheService.healthCheck(),
      this.checkGroqHealth(),
    ]);

    // Get cache statistics
    const cacheStats = await this.getCacheStats();

    return {
      database,
      redis,
      groq,
      cacheStats,
    };
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
      return false;
    }
  }

  private async checkGroqHealth(): Promise<boolean> {
  try {
    await this.groqService.chatCompletion(
      [{ role: 'user', content: 'Hello' }],
      {},
      'GENERAL_ASSISTANT',
      { maxTokens: 10 }, 
    );
    return true;
  } catch (error) {
    this.logger.error(`Groq health check failed: ${error.message}`);
    return false;
  }
}

  private async getCacheStats(): Promise<any> {
    try {
      // Get keys by pattern to estimate cache usage
      const patterns = [
        'user:*',
        'conversation:*',
        'memory:*',
        'ratelimit:*',
      ];

      const stats: any = {};
      
      for (const pattern of patterns) {
        const keys = await (this.cacheService as any).redis.keys(pattern);
        stats[pattern.replace(':*', '')] = keys.length;
      }

      return stats;
    } catch (error) {
      this.logger.error(`Failed to get cache stats: ${error.message}`);
      return { error: error.message };
    }
  }

async getConversation(
  conversationId: string,
  userId: string,
  includeDeleted: boolean = false,
) {
  const where: any = {
    id: conversationId,
    userId,
  };
  
  if (!includeDeleted) {
    where.isDeleted = false;
  }

  const conversation = await this.prisma.assistantConversation.findFirst({
    where,
    include: {
      messages: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'asc' },
        take: 100,
      },
      _count: {
        select: {
          messages: {
            where: { isDeleted: false },
          },
        },
      },
    },
  });

  return conversation;
}

// Soft delete conversation
async softDeleteConversation(
  conversationId: string,
  userId: string,
): Promise<{ success: boolean; conversation: any }> {
  const result = await this.prisma.$transaction(async (tx) => {
    // 1. Verify ownership
    const conversation = await tx.assistantConversation.findFirst({
      where: {
        id: conversationId,
        userId,
        isDeleted: false,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found or already deleted');
    }

    // 2. Soft delete the conversation
    const updated = await tx.assistantConversation.update({
      where: { id: conversationId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
        active: false,
      },
    });

    // 3. Soft delete all messages in the conversation
    await tx.assistantMessage.updateMany({
      where: { conversationId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // 4. Clear caches
    await this.cacheService.clearPattern(`conversation:${conversationId}:*`);
    await this.cacheService.clearPattern(`conversation:${conversationId}:context`);
    await this.cacheService.clearPattern(`messages:${conversationId}:*`);

    return updated;
  });

  return {
    success: true,
    conversation: result,
  };
}

// Hard delete conversation
async hardDeleteConversation(
  conversationId: string,
  userId: string,
  force: boolean = false,
): Promise<{ success: boolean; deletedCount: number }> {
  const result = await this.prisma.$transaction(async (tx) => {
    // 1. Verify ownership
    const where: any = {
      id: conversationId,
      userId,
    };
    
    if (!force) {
      where.isDeleted = true;
    }

    const conversation = await tx.assistantConversation.findFirst({
      where,
    });

    if (!conversation) {
      throw new NotFoundException(
        force 
          ? 'Conversation not found' 
          : 'Conversation must be soft-deleted first before permanent deletion'
      );
    }

    let deletedCount = 0;

    // 2. Delete all messages
    const messagesDeleted = await tx.assistantMessage.deleteMany({
      where: { conversationId },
    });
    deletedCount += messagesDeleted.count;

    // 3. Delete the conversation
    await tx.assistantConversation.delete({
      where: { id: conversationId },
    });
    deletedCount++;

    // 4. Clear caches
    await this.cacheService.clearPattern(`conversation:${conversationId}:*`);
    await this.cacheService.clearPattern(`memory:search:${userId}:*`);
    await this.cacheService.clearPattern(`analytics:${userId}`);

    return deletedCount;
  });

  return {
    success: true,
    deletedCount: result,
  };
}

// Clear conversation messages
async clearConversationMessages(
  conversationId: string,
  userId: string,
): Promise<{ success: boolean; clearedMessages: number }> {
  const result = await this.prisma.$transaction(async (tx) => {
    // 1. Verify ownership
    const conversation = await tx.assistantConversation.findFirst({
      where: {
        id: conversationId,
        userId,
        isDeleted: false,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // 2. Soft delete all messages
    const updateResult = await tx.assistantMessage.updateMany({
      where: { 
        conversationId,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // 3. Update conversation metadata
    await tx.assistantConversation.update({
      where: { id: conversationId },
      data: {
        messageCount: 0,
        updatedAt: new Date(),
        lastMessageContent: null,
        lastMessageAt: null,
        summary: null,
      },
    });

    // 4. Clear cached context
    await this.cacheService.clearPattern(`conversation:${conversationId}:*`);
    await this.cacheService.clearPattern(`conversation:${conversationId}:context`);
    await this.cacheService.clearPattern(`messages:${conversationId}:*`);

    return updateResult.count;
  });

  return {
    success: true,
    clearedMessages: result,
  };
}

// Restore conversation from trash
async restoreConversation(
  conversationId: string,
  userId: string,
): Promise<{ success: boolean; conversation: any }> {
  const result = await this.prisma.$transaction(async (tx) => {
    const conversation = await tx.assistantConversation.findFirst({
      where: {
        id: conversationId,
        userId,
        isDeleted: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Deleted conversation not found');
    }

    // Restore conversation
    const updated = await tx.assistantConversation.update({
      where: { id: conversationId },
      data: {
        isDeleted: false,
        deletedAt: null,
        restoredAt: new Date(),
        updatedAt: new Date(),
        active: true,
      },
    });

    // Restore messages
    await tx.assistantMessage.updateMany({
      where: { 
        conversationId,
        isDeleted: true,
      },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    return updated;
  });

  return {
    success: true,
    conversation: result,
  };
}

// Archive conversation
async archiveConversation(
  conversationId: string,
  userId: string,
): Promise<{ success: boolean; conversation: any }> {
  try {
    const conversationExists = await this.prisma.assistantConversation.findFirst({
      where: {
        id: conversationId,
        userId,
        isDeleted: false,
      },
    });

    if (!conversationExists) {
      throw new NotFoundException('Conversation not found or already deleted');
    }

    const result = await this.prisma.assistantConversation.updateMany({
      where: {
        id: conversationId,
        userId,
        isDeleted: false,
      },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        active: false,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Failed to archive conversation');
    }

    const conversation = await this.prisma.assistantConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    return {
      success: true,
      conversation,
    };
  } catch (error) {
    this.logger.error('Failed to archive conversation:', error);
    
    if (error instanceof NotFoundException) {
      throw error;
    }
    
    throw new BadRequestException(
      error.message || 'Failed to archive conversation'
    );
  }
}

// Unarchive conversation 
async unarchiveConversation(
  conversationId: string,
  userId: string,
): Promise<{ success: boolean; conversation: any }> {
  try {
    const conversationExists = await this.prisma.assistantConversation.findFirst({
      where: {
        id: conversationId,
        userId,
        isDeleted: false,
      },
    });

    if (!conversationExists) {
      throw new NotFoundException('Conversation not found or already deleted');
    }

    const result = await this.prisma.assistantConversation.updateMany({
      where: {
        id: conversationId,
        userId,
        isDeleted: false,
      },
      data: {
        isArchived: false,
        archivedAt: null,
        active: true,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Failed to unarchive conversation');
    }

    const conversation = await this.prisma.assistantConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    return {
      success: true,
      conversation,
    };
  } catch (error) {
    this.logger.error('Failed to unarchive conversation:', error);
    
    if (error instanceof NotFoundException) {
      throw error;
    }
    
    throw new BadRequestException(
      error.message || 'Failed to unarchive conversation'
    );
  }
}

// Star/Unstar conversation
async toggleStarConversation(
  conversationId: string,
  userId: string,
  starred: boolean,
): Promise<{ success: boolean; conversation: any }> {
  try {
    const conversationExists = await this.prisma.assistantConversation.findFirst({
      where: {
        id: conversationId,
        userId,
        isDeleted: false,
      },
    });

    if (!conversationExists) {
      throw new NotFoundException('Conversation not found or already deleted');
    }

    const result = await this.prisma.assistantConversation.updateMany({
      where: {
        id: conversationId,
        userId,
        isDeleted: false,
      },
      data: {
        isStarred: starred,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Failed to update conversation');
    }

    const conversation = await this.prisma.assistantConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    return {
      success: true,
      conversation,
    };
  } catch (error) {
    this.logger.error('Failed to star conversation:', error);
    
    if (error instanceof NotFoundException) {
      throw error;
    }
    
    throw new BadRequestException(
      error.message || 'Failed to star conversation'
    );
  }
}


// Pin/Unpin conversation
async togglePinConversation(
  conversationId: string,
  userId: string,
  pinned: boolean,
): Promise<{ success: boolean; conversation: any }> {
  try {
    // First, check if conversation exists
    const conversationExists = await this.prisma.assistantConversation.findFirst({
      where: {
        id: conversationId,
        userId,
        isDeleted: false,
      },
    });

    if (!conversationExists) {
      throw new NotFoundException('Conversation not found or already deleted');
    }

    // Use updateMany to avoid unique constraint issues
    const result = await this.prisma.assistantConversation.updateMany({
      where: {
        id: conversationId,
        userId,
        isDeleted: false,
      },
      data: {
        isPinned: pinned,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Failed to update conversation');
    }

    // Fetch the updated conversation
    const conversation = await this.prisma.assistantConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    return {
      success: true,
      conversation,
    };
  } catch (error) {
    this.logger.error('Failed to pin conversation:', error);
    
    if (error instanceof NotFoundException) {
      throw error;
    }
    
    throw new BadRequestException(
      error.message || 'Failed to pin conversation'
    );
  }
}

// Update conversation title
async updateConversationTitle(
  conversationId: string,
  userId: string,
  title: string,
): Promise<{ success: boolean; conversation: any }> {
  if (!title || title.trim().length === 0) {
    throw new BadRequestException('Title cannot be empty');
  }

  if (title.length > 100) {
    throw new BadRequestException('Title cannot exceed 100 characters');
  }

  const conversation = await this.prisma.assistantConversation.update({
    where: {
      id: conversationId,
      userId,
      isDeleted: false,
    },
    data: {
      title: title.trim(),
      updatedAt: new Date(),
    },
  });

  if (!conversation) {
    throw new NotFoundException('Conversation not found');
  }

  return {
    success: true,
    conversation,
  };
}

// Get deleted conversations
async getDeletedConversations(
  userId: string,
  limit: number = 10,
  offset: number = 0,
): Promise<{ conversations: any[]; total: number }> {
  const [conversations, total] = await Promise.all([
    this.prisma.assistantConversation.findMany({
      where: {
        userId,
        isDeleted: true,
      },
      orderBy: { deletedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: {
            messages: {
              where: { isDeleted: false },
            },
          },
        },
      },
    }),
    this.prisma.assistantConversation.count({
      where: {
        userId,
        isDeleted: true,
      },
    }),
  ]);

  return {
    conversations,
    total,
  };
}

// Empty trash
async emptyTrash(userId: string): Promise<{ success: boolean; deletedCount: number }> {
  const deletedConversations = await this.prisma.assistantConversation.findMany({
    where: {
      userId,
      isDeleted: true,
    },
    select: { id: true },
  });

  let totalDeleted = 0;

  for (const conversation of deletedConversations) {
    const result = await this.hardDeleteConversation(conversation.id, userId, true);
    totalDeleted += result.deletedCount;
  }

  return {
    success: true,
    deletedCount: totalDeleted,
  };
}

// Get conversation analytics (simplified version)
async getConversationAnalytics(
  userId: string,
  timeframe: 'day' | 'week' | 'month' | 'year' = 'month',
): Promise<any> {
  const cacheKey = `conversation:analytics:${userId}:${timeframe}`;
  const cached = await this.cacheService.getCachedData(cacheKey);
  
  if (cached) {
    return cached;
  }

  const dateFilter = this.getDateFilter(timeframe);

  const [
    totalConversations,
    activeConversations,
    archivedConversations,
    deletedConversations,
    totalMessages,
    recentActivity,
  ] = await Promise.all([
    // Total conversations
    this.prisma.assistantConversation.count({
      where: {
        userId,
        isDeleted: false,
      },
    }),

    // Active conversations
    this.prisma.assistantConversation.count({
      where: {
        userId,
        isDeleted: false,
        active: true,
      },
    }),

    // Archived conversations
    this.prisma.assistantConversation.count({
      where: {
        userId,
        isDeleted: false,
        isArchived: true,
      },
    }),

    // Deleted conversations
    this.prisma.assistantConversation.count({
      where: {
        userId,
        isDeleted: true,
      },
    }),

    // Total messages
    this.prisma.assistantMessage.count({
      where: {
        conversation: {
          userId,
          isDeleted: false,
        },
        isDeleted: false,
      },
    }),

    // Recent activity
    this.prisma.assistantConversation.findMany({
      where: {
        userId,
        isDeleted: false,
        updatedAt: dateFilter,
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        mode: true,
        updatedAt: true,
        messageCount: true,
      },
    }),
  ]);

  // Get most used mode
  const modeUsage = await this.prisma.$queryRaw<{mode: string, count: number}[]>`
    SELECT mode, COUNT(*) as count
    FROM assistant_conversations
    WHERE user_id = ${userId} 
      AND is_deleted = false
    GROUP BY mode
    ORDER BY count DESC
  `;

  const analytics = {
    summary: {
      totalConversations,
      activeConversations,
      archivedConversations,
      deletedConversations,
      totalMessages,
      avgMessagesPerConversation: totalConversations > 0 
        ? Math.round(totalMessages / totalConversations) 
        : 0,
      mostUsedMode: modeUsage[0]?.mode || 'GENERAL_ASSISTANT',
      modeUsageCount: modeUsage[0]?.count || 0,
      modeUsage,
    },
    recentActivity,
    timeframe,
    generatedAt: new Date().toISOString(),
  };

  // Cache for 5 minutes
  await this.cacheService.cacheData(cacheKey, analytics, 300);

  return analytics;
}

private getDateFilter(timeframe: string): any {
  const now = new Date();
  const startDate = new Date();

  switch (timeframe) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  return {
    gte: startDate,
    lte: now,
  };
}

async getUserTierAndRateLimit(userId: string): Promise<{
  userTier: 'FREE' | 'PREMIUM' | 'ADMIN';
  rateLimitInfo: {
    remaining: number;
    limit: number;
    resetTime: Date | null;
    usage: number;
  } | null;
}> {
  try {
    // Get user from database with subscription info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE',
            currentPeriodEnd: { gt: new Date() },
          },
          take: 1,
        },
      },
    });

    let userTier: 'FREE' | 'PREMIUM' | 'ADMIN' = 'FREE';
    
    if (user) {
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        userTier = 'ADMIN';
      } else if (user.subscriptions.length > 0) {
        userTier = 'PREMIUM';
      }
    }

    // Get rate limit info for FREE users
    let rateLimitInfo = null;
    if (userTier === 'FREE') {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const cacheKey = `ratelimit:daily:${userId}:${startOfDay.toISOString().split('T')[0]}`;
      
      // Use getCachedData to get the count
      const cachedCount = await this.cacheService.getCachedData(cacheKey);
      const dailyUsage = cachedCount ? parseInt(cachedCount) || 0 : 0;
      
      const resetTime = new Date();
      resetTime.setHours(24, 0, 0, 0); // Reset at midnight
      
      rateLimitInfo = {
        remaining: Math.max(0, 10 - dailyUsage),
        limit: 10,
        resetTime,
        usage: dailyUsage,
      };
    }

    // Cache the user tier for faster access
    await this.cacheService.cacheData(`user:${userId}:tier`, userTier, 300); // 5 minutes

    return {
      userTier,
      rateLimitInfo,
    };
  } catch (error) {
    this.logger.error('Failed to get user tier and rate limit:', error);
    return {
      userTier: 'FREE',
      rateLimitInfo: {
        remaining: 10,
        limit: 10,
        resetTime: null,
        usage: 0,
      },
    };
  }
}

  
}