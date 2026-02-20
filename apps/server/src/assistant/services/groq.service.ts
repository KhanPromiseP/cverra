// groq.service.ts - PRODUCTION OPTIMIZED VERSION
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Groq } from 'groq-sdk';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { CacheService } from '../../redis/cache.service';
import { IntentService } from './intent.service';
import { ContextSelectorService } from './context-selector.service';
import { PromptBuilderService } from './prompt-builder.service';
import { ResponseValidatorService } from './response-validator.service';
import { IntentAnalysis, IntentType } from '../interfaces/intent.types';
import { MemoryService } from './memory.service';
import { ArticleSelectorService, ArticleWithMetadata } from './article-selector.service';

@Injectable()
export class GroqService {
  private readonly groq: Groq;
  private readonly logger = new Logger(GroqService.name);
  
  // Cache for intent results to prevent re-detection
  private intentCache: Map<string, { intent: IntentAnalysis; timestamp: number }> = new Map();
  private readonly INTENT_CACHE_TTL = 5000; // 5 seconds
  
  // Cache for simple responses (greetings, thanks, etc)
  private simpleResponseCache: Map<string, { response: string; timestamp: number }> = new Map();
  private readonly SIMPLE_RESPONSE_CACHE_TTL = 60000; // 1 minute
  
  // Request tracking to prevent duplicate processing
  private processingRequests: Map<string, number> = new Map();
  private readonly MAX_RETRY_COUNT = 3;
  
  // Greeting patterns for instant responses
  private readonly greetingPatterns = [
    /^(hi|hello|hey|howdy|greetings)$/i,
    /^(good morning|good afternoon|good evening)$/i,
    /^(what'?s up|sup)$/i,
    /^hey there$/i,
    /^how'?s it going$/i,
    /^how are you$/i
  ];

  // Simple patterns that don't need context
  private readonly simplePatterns = [
    /^(thanks|thank you|thx)$/i,
    /^(bye|goodbye|see you)$/i,
    /^(ok|okay|k)$/i,
    /^(nice|cool|awesome)$/i
  ];

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private cacheService: CacheService,
    private intentService: IntentService,
    private contextSelector: ContextSelectorService,
    private promptBuilder: PromptBuilderService,
    private responseValidator: ResponseValidatorService,
    private memoryService: MemoryService,
    private articleSelector: ArticleSelectorService
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is required');
    }
    this.groq = new Groq({ apiKey });
  }

  /**
   * Check if intent needs context (goals, memories, articles)
   */
  private doesIntentNeedContext(intentType: IntentType): boolean {
    const contextNeededIntents = [
      IntentType.GOAL_DISCUSSION,
      IntentType.GOAL_UPDATE,
      IntentType.GOAL_STALLED,
      IntentType.DECISION_HELP,
      IntentType.OPTION_COMPARISON,
      IntentType.ARTICLE_RECOMMENDATION,
      IntentType.LEARNING_PATH,
      IntentType.CAREER_ADVICE,
      IntentType.RESUME_FEEDBACK,
      IntentType.INTERVIEW_PREP,
      IntentType.BRAIN_STORM,
      IntentType.PROJECT_PLANNING,
      IntentType.IDENTITY_EXPLORATION,
      IntentType.SIMULATION_REQUEST,
      IntentType.PATH_COMPARISON,
      IntentType.WEEKLY_REVIEW,
      IntentType.GENERAL_QUESTION
    ];
    
    return contextNeededIntents.includes(intentType);
  }

  /**
   * Main chat completion method - PRODUCTION OPTIMIZED
   */
  async chatCompletion(
    messages: any[],
    context: any,
    mode: string = 'GENERAL_ASSISTANT',
    options: any = {},
    userTier?: string,
    clientTime?: string
  ): Promise<any> {
    const requestId = this.generateRequestId();
    const userId = context?.user?.id;
    const lastMessage = messages[messages.length - 1]?.content || '';
    const trimmedMessage = lastMessage.trim().toLowerCase();
    
    // ============= 🚀 LEVEL 1: INSTANT RESPONSES (0ms) =============
    
    // Check for duplicate processing
    const requestKey = `${userId}:${lastMessage}`;
    const existingRequest = this.processingRequests.get(requestKey);
    
    if (existingRequest && existingRequest > this.MAX_RETRY_COUNT) {
      this.logger.error(`[${requestId}] Infinite loop detected, blocking`);
      return this.getInstantResponse('error', context);
    }
    
    this.processingRequests.set(requestKey, (existingRequest || 0) + 1);
    
    setTimeout(() => {
      this.processingRequests.delete(requestKey);
    }, 5000);

    // Instant responses for greetings
    if (this.greetingPatterns.some(pattern => pattern.test(trimmedMessage))) {
      this.processingRequests.delete(requestKey);
      return this.getInstantResponse('greeting', context);
    }

    // Instant responses for simple acknowledgments
    if (this.simplePatterns.some(pattern => pattern.test(trimmedMessage))) {
      this.processingRequests.delete(requestKey);
      return this.getInstantResponse('simple', context, trimmedMessage);
    }

    // ============= 🚀 LEVEL 2: PRODUCTION FLOW =============
    
    try {
      const startTime = Date.now();
      this.logger.debug(`[${requestId}] Processing: "${lastMessage.substring(0, 100)}..."`);
      
      // STEP 1: Get or detect intent (cached)
      const intent = await this.getOrDetectIntent(lastMessage, messages, userId, requestId);
      
      // STEP 2: ALWAYS fetch memories
      this.logger.debug(`[${requestId}] Fetching memories for user ${userId}`);
      
      let memories: any[] = [];
      try {
        memories = await this.memoryService.getRelevantMemoriesForContext(
          userId,
          lastMessage,
          10 // Get up to 10 memories
        );
        this.logger.debug(`[${requestId}] Found ${memories.length} relevant memories`);
      } catch (memoryError) {
        this.logger.error(`[${requestId}] Failed to fetch memories:`, memoryError);
        memories = [];
      }
      
      // STEP 3: Check if user needs articles (learning/advice requests)
      const needsArticles = this.checkIfNeedsArticles(intent.primary, lastMessage);
      
      // STEP 4: Get context selection
      const contextSelection = this.intentService.getContextSelection(intent);
      
      // STEP 5: Fetch additional context and articles in PARALLEL
      const [selectedContext, articles] = await Promise.all([
        this.contextSelector.selectContext(
          userId,
          intent,
          {
            ...contextSelection,
            memories: true,
          },
          lastMessage,
          context?.conversationId
        ),
        needsArticles ? this.articleSelector.getRelevantArticles(
          userId,
          intent.primary,
          3,
          intent
        ) : Promise.resolve([])
      ]);
      
      // Merge memories and articles into selectedContext
      selectedContext.memories = memories;
      if (articles.length > 0) {
        selectedContext.articles = articles;
      }
      
      // STEP 6: Check if user is asking about conversation history
      const isAskingAboutHistory = this.isHistoryQuestion(lastMessage);
      
      // STEP 7: Build system prompt based on context
      let systemPrompt = '';
      
      if (isAskingAboutHistory && memories.length > 0) {
        systemPrompt = this.buildHistoryResponsePrompt(
          this.getUserName(context),
          mode,
          memories,
          lastMessage
        );
      } else {
        systemPrompt = this.promptBuilder.buildSystemPrompt(
          this.getUserName(context),
          mode,
          selectedContext,
          intent,
          lastMessage,
          clientTime || ''
        );
      }
      
      const promptTokens = this.estimateTokens(systemPrompt);

      // STEP 8: Prepare messages with optimized context
      const fullMessages = this.optimizeMessagesForProduction(
        systemPrompt,
        messages,
        memories.length,
        needsArticles,
        intent
      );

      // STEP 9: Call Groq API
      const response = await this.callGroqOptimized(
        fullMessages, 
        mode, 
        intent, 
        requestId,
        memories.length > 0,
        this.getMaxTokensForIntent(intent, userTier)
      );
      
      // STEP 10: Enhance response with article recommendations if needed
      let finalContent = response.content;
      if (articles.length > 0 && needsArticles && !this.hasArticleReferences(response.content)) {
        finalContent = this.enhanceResponseWithArticles(
          response.content,
          articles,
          intent,
          lastMessage
        );
      }
      
      // STEP 11: Validate response
      const validated = this.responseValidator.validateAndClean(finalContent);
      
      // STEP 12: Track analytics asynchronously
      if (intent.primary !== IntentType.GREETING && 
          intent.primary !== IntentType.SMALL_TALK &&
          intent.primary !== IntentType.GRATITUDE) {
        // ✅ FIX: Remove articlesRecommended from analytics if it doesn't exist in schema
        this.trackInteraction(userId, intent, promptTokens, response.tokens)
          .catch(err => this.logger.error('Analytics tracking failed:', err));
      }
      
      const responseTime = Date.now() - startTime;
      this.logger.debug(`[${requestId}] Completed in ${responseTime}ms with ${memories.length} memories, ${articles.length} articles`);
      
      // Clean up
      this.processingRequests.delete(requestKey);
      
      return {
        content: validated.content || validated,
        tokens: response.tokens,
        model: response.model,
        responseTime,
        // ✅ FIX: Remove relevanceScore if it doesn't exist in the type
        referencedArticles: articles.map((a: ArticleWithMetadata) => ({
          id: a.id,
          title: a.title,
          url: a.url,
          rating: a.rating
        })),
        metadata: {
          intent: intent.primary,
          confidence: intent.confidence,
          memoryCount: memories.length,
          articleCount: articles.length,
          promptTokens,
          hasMemories: memories.length > 0,
          hasArticles: articles.length > 0,
          needsArticles,
          isHistoryQuestion: isAskingAboutHistory,
          responseTime
        }
      };
      
    } catch (error) {
      this.logger.error(`[${requestId}] Chat completion failed:`, error);
      this.processingRequests.delete(requestKey);
      return this.getInstantResponse('error', context);
    }
  }

  /**
   * Check if user needs article recommendations
   */
  private checkIfNeedsArticles(intent: IntentType, message: string): boolean {
    const articleIntents = [
      IntentType.LEARNING_PATH,
      IntentType.ARTICLE_RECOMMENDATION,
      IntentType.CAREER_ADVICE,
      IntentType.GENERAL_QUESTION
    ];
    
    if (articleIntents.includes(intent)) return true;
    
    // Check for learning/advice keywords
    const learningKeywords = [
      'learn', 'study', 'how to', 'tips', 'advice', 'guide',
      'recommend', 'suggest', 'article', 'read', 'resource',
      'time management', 'productivity', 'technique', 'strategy',
      'help me', 'explain', 'understand', 'improve', 'smart'
    ];
    
    return learningKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Optimize messages for production (token efficiency)
   */
  private optimizeMessagesForProduction(
    systemPrompt: string,
    messages: any[],
    memoryCount: number,
    needsArticles: boolean,
    intent: IntentAnalysis
  ): any[] {
    const baseMessages = [{ role: 'system', content: systemPrompt }];
    
    if (memoryCount > 3 && needsArticles) {
      return [...baseMessages, ...messages.slice(-5)];
    }
    
    if (memoryCount > 0) {
      return [...baseMessages, ...messages.slice(-6)];
    }
    
    return [...baseMessages, ...messages.slice(-8)];
  }

  /**
   * Check if message is asking about conversation history
   */
  private isHistoryQuestion(message: string): boolean {
    const lower = message.toLowerCase();
    const historyPatterns = [
      /what did we (talk|discuss)/i,
      /do you remember/i,
      /last (week|month|time|conversation)/i,
      /previous (chat|conversation|discussion)/i,
      /recall/i,
      /earlier/i,
      /yesterday/i,
      /before/i
    ];
    
    return historyPatterns.some(pattern => pattern.test(lower));
  }

  /**
   * Build special prompt for history questions
   */
  private buildHistoryResponsePrompt(
    userName: string,
    mode: string,
    memories: any[],
    question: string
  ): string {
    const memoryList = memories.map((m, i) => {
      const date = m.date ? ` (${m.date})` : '';
      const keyPoints = m.keyPoints?.length 
        ? `\n   • ${m.keyPoints.slice(0, 3).join('\n   • ')}`
        : '';
      
      return `${i+1}. **${m.topic}**${date}\n   ${m.summary}${keyPoints}`;
    }).join('\n\n');

    return `You are ${userName}'s assistant. The user is asking about past conversations.

**USER'S QUESTION:** "${question}"

**HERE ARE THE CONVERSATIONS YOU REMEMBER:**
${memoryList}

**CRITICAL RULES FOR ANSWERING:**
1. Use ONLY the memories shown above - NEVER invent conversations
2. Include specific dates when available
3. Be warm and conversational: "Yes, last Tuesday we talked about..."
4. If they ask about a specific time (like "last week"), filter to that period
5. End by asking if they want to continue that conversation

Remember: Be helpful, be honest, and make it feel like a natural conversation.`;
  }

  /**
   * Check if response already contains article references
   */
  private hasArticleReferences(response: string): boolean {
    return response.includes('http') || 
           response.includes('article') || 
           response.includes('read this') ||
           response.includes('check out') ||
           response.includes('found this');
  }

/**
 * Enhance response with article recommendations naturally
 */
private enhanceResponseWithArticles(
  response: string,
  articles: ArticleWithMetadata[],
  intent: IntentAnalysis,
  lastMessage: string
): string {
  if (!articles.length) return response;

  // If response is too short or generic, add proactive advice
  if (response.length < 150) {
    const advice = this.addProactiveAdvice(lastMessage);
    if (advice) {
      response = advice;
    }
  }

  // Format articles based on quality
  const topArticle = articles[0];
  const otherArticles = articles.slice(1);

  let articleSection = '';

  // Primary article recommendation
  if (topArticle) {
    const rating = topArticle.rating ? ` ⭐${topArticle.rating}` : '';
    const recommend = topArticle.recommendationPercentage 
      ? ` (${topArticle.recommendationPercentage}% recommend)` : '';
    
    articleSection += `\n\n📚 **I found an excellent article that covers this:**\n`;
    articleSection += `**[${topArticle.title}](${topArticle.url})**${rating}${recommend}\n`;
    articleSection += `${topArticle.excerpt.substring(0, 120)}...`;
  }

  // Additional articles
  if (otherArticles.length > 0) {
    articleSection += `\n\n**Also check out:**\n`;
    otherArticles.forEach((a, i) => {
      const rating = a.rating ? ` ⭐${a.rating}` : '';
      articleSection += `${i+1}. **[${a.title}](${a.url})**${rating}\n`;
    });
  }

  return response + articleSection;
}

/**
 * Add proactive advice when response is too generic
 */
private addProactiveAdvice(query: string): string {
  const lower = query.toLowerCase();

  if (lower.includes('time management')) {
      return `**Here are proven time management techniques:**\n\n` +
        `• **Pomodoro Technique**: Study 25 mins, break 5 mins - maintains focus\n` +
        `• **Time Blocking**: Schedule specific topics to specific hours\n` +
        `• **Priority Matrix**: Focus on important/urgent tasks first\n` +
        `• **Active Recall**: Test yourself instead of just reading\n`;
    }
    
    if (lower.includes('study') || lower.includes('learn') || lower.includes('smart')) {
      return `**Effective study strategies:**\n\n` +
        `• **Spaced Repetition**: Review material at increasing intervals\n` +
        `• **Active Recall**: Quiz yourself, don't just reread\n` +
        `• **Feynman Technique**: Teach it to someone else\n` +
        `• **Interleaving**: Mix different topics in one session\n`;
    }
    
    if (lower.includes('productivity')) {
      return `**Productivity boosters:**\n\n` +
        `• **Eat the frog**: Do the hardest task first\n` +
        `• **Deep work**: Block 90-min focused sessions\n` +
        `• **Task batching**: Group similar tasks together\n` +
        `• **2-minute rule**: Do tasks under 2 mins immediately\n`;
    }
    
    return '';
  }

  /**
   * Build minimal prompt for simple queries
   */
  private buildMinimalPrompt(userName: string, mode: string, intent: IntentAnalysis): string {
    return `You are ${userName}'s assistant. Be helpful and concise.

    IMPORTANT FORMATTING RULES:
    - When sharing links, ALWAYS use Markdown format: [link text](URL)
    - Example: Check out [React documentation](https://reactjs.org/)
    - NEVER show raw URLs like https://example.com

    Current mode: ${mode}
    User intent: ${intent.primary}

    Keep response brief and natural.`;
  }

  /**
   * Get instant response for greetings and simple messages
   */
  private getInstantResponse(type: 'greeting' | 'simple' | 'error', context: any, message?: string): any {
    const userName = this.getUserName(context);
    const hour = new Date().getHours();
    
    const responses = {
      greeting: {
        morning: [
          `Good morning, ${userName}! How can I help you today?`,
          `Morning ${userName}! What's on your mind?`,
          `Good morning! Ready to assist you, ${userName}.`
        ],
        afternoon: [
          `Good afternoon, ${userName}! How can I help?`,
          `Afternoon ${userName}! What can I do for you?`,
          `Hello ${userName}! How's your day going?`
        ],
        evening: [
          `Good evening, ${userName}! How can I assist?`,
          `Evening ${userName}! What's on your mind?`,
          `Hello ${userName}! How can I help this evening?`
        ]
      },
      simple: {
        thanks: [
          `You're welcome, ${userName}!`,
          `Happy to help, ${userName}!`,
          `Anytime, ${userName}!`
        ],
        bye: [
          `Goodbye, ${userName}! Take care!`,
          `See you later, ${userName}!`,
          `Have a great day, ${userName}!`
        ],
        ok: [
          `Got it, ${userName}!`,
          `Okay, ${userName}!`,
          `Sure thing, ${userName}!`
        ],
        nice: [
          `Thanks, ${userName}!`,
          `Glad you think so, ${userName}!`,
          `Awesome, ${userName}!`
        ]
      },
      error: [
        `Hey ${userName}, I'm here. What's on your mind?`,
        `Hi ${userName}, how can I help you?`,
        `Hello ${userName}, ready when you are.`
      ]
    };

    let responseArray: string[];
    
    if (type === 'greeting') {
      if (hour < 12) responseArray = responses.greeting.morning;
      else if (hour < 17) responseArray = responses.greeting.afternoon;
      else responseArray = responses.greeting.evening;
    } else if (type === 'simple' && message) {
      if (message.match(/thanks|thank you|thx/)) responseArray = responses.simple.thanks;
      else if (message.match(/bye|goodbye/)) responseArray = responses.simple.bye;
      else if (message.match(/ok|okay|k/)) responseArray = responses.simple.ok;
      else if (message.match(/nice|cool|awesome/)) responseArray = responses.simple.nice;
      else responseArray = responses.error;
    } else {
      responseArray = responses.error;
    }

    const content = responseArray[Math.floor(Math.random() * responseArray.length)];

    return {
      content,
      tokens: 0,
      model: 'instant',
      responseTime: 0,
      isInstant: true,
      metadata: {
        type,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Get or detect intent with caching
   */
  private async getOrDetectIntent(
    message: string,
    history: any[],
    userId: string,
    requestId: string
  ): Promise<IntentAnalysis & { cached?: boolean }> {
    const cacheKey = `${userId}:${message}`;
    const now = Date.now();
    
    const cached = this.intentCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.INTENT_CACHE_TTL) {
      this.logger.debug(`[${requestId}] Using cached intent: ${cached.intent.primary}`);
      return { ...cached.intent, cached: true };
    }
    
    const intent = await this.intentService.detectIntent(message, history);
    
    this.intentCache.set(cacheKey, { intent, timestamp: now });
    
    if (this.intentCache.size > 100) {
      this.cleanIntentCache();
    }
    
    return { ...intent, cached: false };
  }

  /**
   * Clean old cache entries
   */
  private cleanIntentCache(): void {
    const now = Date.now();
    for (const [key, value] of this.intentCache.entries()) {
      if ((now - value.timestamp) > this.INTENT_CACHE_TTL) {
        this.intentCache.delete(key);
      }
    }
  }

  /**
   * Optimized Groq API call with retry logic
   */
  private async callGroqOptimized(
    messages: any[],
    mode: string,
    intent: IntentAnalysis,
    requestId: string,
    needsContext: boolean = true,
    maxTokens?: number,
    retryCount: number = 0
  ): Promise<any> {
    const startTime = Date.now();
    const maxRetries = 2;
    const temperature = this.getTemperatureForIntent(intent);
    
    const tokenLimit = maxTokens || (needsContext ? 1500 : 300);
    
    const estimatedTokens = this.estimateTotalTokens(messages);
    if (estimatedTokens > tokenLimit) {
      this.logger.warn(`[${requestId}] High token count (${estimatedTokens}), optimizing`);
      messages = this.optimizeMessages(messages, !needsContext);
    }
    
    try {
      const response = await this.groq.chat.completions.create({
        messages,
        model: 'llama-3.3-70b-versatile',
        temperature,
        max_tokens: tokenLimit,
        top_p: 0.9,
        stream: false
      });

      return {
        content: response.choices[0]?.message?.content || '',
        tokens: response.usage?.total_tokens || 0,
        model: response.model,
        responseTime: Date.now() - startTime
      };

    } catch (error: any) {
      if (error.status === 429 && retryCount < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, retryCount), 8000);
        this.logger.warn(`[${requestId}] Rate limited, waiting ${waitTime}ms`);
        await this.delay(waitTime);
        return this.callGroqOptimized(messages, mode, intent, requestId, needsContext, maxTokens, retryCount + 1);
      }
      
      if (error.message?.includes('reduce the length') && retryCount < maxRetries) {
        this.logger.warn(`[${requestId}] Token limit, optimizing messages`);
        messages = this.optimizeMessages(messages, true);
        return this.callGroqOptimized(messages, mode, intent, requestId, needsContext, maxTokens, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Optimize messages to reduce token count
   */
  private optimizeMessages(messages: any[], aggressive: boolean = false): any[] {
    const systemMsg = messages.find(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');
    
    const result = [];
    let totalTokens = 0;
    
    if (systemMsg) {
      let systemContent = systemMsg.content || '';
      if (aggressive && systemContent.length > 500) {
        systemContent = systemContent.substring(0, 500) + '... [truncated]';
      }
      result.push({ role: 'system', content: systemContent });
      totalTokens += this.estimateTokens(systemContent);
    }
    
    const messageLimit = aggressive ? 2 : 4;
    const recentMessages = otherMessages.slice(-messageLimit);
    
    for (const msg of recentMessages) {
      let content = msg.content || '';
      
      if (aggressive && content.length > 200) {
        content = content.substring(0, 200) + '...';
      }
      
      const msgTokens = this.estimateTokens(content);
      const tokenLimit = aggressive ? 1000 : 2000;
      
      if (totalTokens + msgTokens < tokenLimit) {
        result.push({ ...msg, content });
        totalTokens += msgTokens;
      }
    }
    
    return result;
  }

  /**
   * Estimate total tokens in messages
   */
  private estimateTotalTokens(messages: any[]): number {
    return messages.reduce((total, msg) => {
      return total + this.estimateTokens(msg.content || '');
    }, 0);
  }

  /**
   * Get temperature based on intent
   */
  private getTemperatureForIntent(intent: IntentAnalysis): number {
    switch (intent.primary) {
      case IntentType.EMOTIONAL_SUPPORT:
      case IntentType.STRESS_EXPRESSION:
        return 0.7;
      case IntentType.DECISION_HELP:
      case IntentType.OPTION_COMPARISON:
      case IntentType.CAREER_ADVICE:
        return 0.5;
      case IntentType.BRAIN_STORM:
      case IntentType.IDEA_CAPTURE:
        return 0.8;
      default:
        return 0.6;
    }
  }

  /**
   * Get max tokens based on intent and user tier
   */
  private getMaxTokensForIntent(intent: IntentAnalysis, userTier?: string): number {
    const baseTokens = userTier === 'PREMIUM' ? 4000 : userTier === 'ADMIN' ? 8000 : 2000;
    
    const complexIntents = [
      IntentType.DECISION_HELP,
      IntentType.LEARNING_PATH,
      IntentType.SIMULATION_REQUEST,
      IntentType.PATH_COMPARISON
    ];
    
    if (complexIntents.includes(intent.primary)) {
      return baseTokens;
    }
    
    return Math.min(baseTokens, 1500);
  }

  /**
   * Track analytics (non-blocking)
   */
  private async trackInteraction(
    userId: string, 
    intent: IntentAnalysis, 
    promptTokens: number,
    responseTokens: number
  ): Promise<void> {
    if (!userId) return;
    
    try {
      // ✅ FIX: Remove articlesRecommended field
      await this.prisma.assistantAnalytics.upsert({
        where: { userId },
        update: {
          totalTokens: { increment: promptTokens + responseTokens },
          totalMessages: { increment: 1 },
          modeUsage: {
            [intent.primary.toString()]: { increment: 1 }
          }
        },
        create: {
          userId,
          totalTokens: promptTokens + responseTokens,
          totalMessages: 1,
          modeUsage: { [intent.primary.toString()]: 1 }
        }
      });
    } catch (error) {
      this.logger.error('Analytics update failed:', error);
    }
  }

  /**
   * Estimate tokens from text
   */
  private estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Get username from context
   */
  private getUserName(context: any): string {
    if (context?.user?.name) return context.user.name;
    if (context?.user?.username) return context.user.username;
    if (context?.user?.email) return context.user.email.split('@')[0];
    return 'there';
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}



// import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { Groq } from 'groq-sdk';
// import { PrismaService } from '../../../../../tools/prisma/prisma.service';
// import { CacheService } from '../../redis/cache.service';

// // Constants
// const GROQ_MODEL = 'llama-3.3-70b-versatile';
// const MODEL_PRICING = {
//   input: 0.05,
//   output: 0.08,
// };
// const DEFAULT_TIMEOUT = 15000;
// const DEFAULT_ARTICLE_LIMIT = 15;
// const CACHE_TTL = 3600; // 1 hour

// interface ChatCompletionOptions {
//   maxTokens?: number;
//   temperature?: number;
//   topP?: number;
//   retryAttempts?: number;
//   timeout?: number;
//   clientTime?: string;
// }

// interface ArticleSummary {
//   id: string;
//   slug: string;
//   title: string;
//   excerpt: string;
//   category: string;
//   categoryColor?: string;
//   author: string;
//   authorUsername: string;
//   readingTime: number;
//   readingLevel: string;
//   availableLanguages: string[];
//   accessType: string;
//   engagement: {
//     views: number;
//     likes: number;
//     claps: number;
//     saves: number;
//   };
//   // NEW: Review data
//   reviews: {
//     totalCount: number;
//     averageRating: number;
//     helpfulVotes: number;
//     recommendationPercentage: number; // % of reviewers who recommend (rating >= 4)
//     topReviews?: Array<{
//       rating: number;
//       insightText: string;
//       helpfulCount: number;
//     }>;
//   };
//   isFeatured: boolean;
//   isTrending: boolean;
//   isEditorPick: boolean;
//   publishedAt: Date;
//   url: string;
//   contentSummary: string;
//   recommendationScore?: number;
// }



// @Injectable()
// export class GroqService {
//   private readonly groq: Groq;
//   private readonly logger = new Logger(GroqService.name);
//   private readonly apiKey: string;
//   private readonly platformBaseUrl: string;

//   constructor(
//     private configService: ConfigService,
//     private prisma: PrismaService,
//     private cacheService: CacheService,
//   ) {
//     this.apiKey = this.configService.get<string>('GROQ_API_KEY') || '';
//     this.platformBaseUrl = this.configService.get<string>('PLATFORM_BASE_URL') || 'http://localhost:5173';
    
//     if (!this.apiKey) {
//       this.logger.error('GROQ_API_KEY not found in environment variables');
//       throw new Error('GROQ_API_KEY is required for assistant service');
//     }

//     this.groq = new Groq({ apiKey: this.apiKey });
//     this.validateApiKeyOnStartup().catch(error => {
//       this.logger.warn('API key validation failed on startup:', error.message);
//     });
//   }

//   // ==================== ARTICLE MANAGEMENT ====================

//   private async getAvailableArticlesForUser(
//   userId: string, 
//   favoriteCategories: string[],
//   limit: number = DEFAULT_ARTICLE_LIMIT
// ): Promise<ArticleSummary[]> {
//   const cacheKey = `articles:user:${userId}:${favoriteCategories.join(',')}`;
  
//   try {
//     // Check cache first
//     const cached = await this.cacheService.getCachedData(cacheKey);
//     if (cached) {
//       this.logger.debug(`Retrieved ${cached.length} articles from cache`);
//       return cached;
//     }

//     // Log what we're searching for
//     this.logger.debug(`Fetching articles for user ${userId}, categories: ${favoriteCategories.join(', ')}`);

//     // First, get the category IDs from names
//     const categoryIds: string[] = [];
//     if (favoriteCategories.length > 0) {
//       const categories = await this.prisma.articleCategory.findMany({
//         where: {
//           name: { in: favoriteCategories }
//         },
//         select: { id: true }
//       });
//       categoryIds.push(...categories.map(c => c.id));
//     }

//     const articles = await this.prisma.article.findMany({
//       where: {
//         status: 'PUBLISHED',
//         ...(categoryIds.length > 0 && {
//           categoryId: { in: categoryIds }
//         }),
//         OR: [
//           { accessType: 'FREE' },
//           { 
//             accessType: 'PREMIUM',
//             PremiumAccess: {
//               some: {
//                 userId,
//                 accessUntil: { gt: new Date() }
//               }
//             }
//           }
//         ]
//       },
//       include: {
//         author: { select: { name: true, username: true } },
//         category: { select: { name: true, color: true } },
//         translations: { select: { language: true } },
//         reviews: { // Include reviews
//           where: { status: 'APPROVED' },
//           select: {
//             rating: true,
//             helpfulCount: true,
//             insightText: true,
//           }
//         },
//         _count: {
//           select: {
//             likes: true,
//             claps: true,
//             saves: true,
//             views: true,
//             reviews: true // Count reviews
//           }
//         }
//       },
//       orderBy: [
//         { isFeatured: 'desc' },
//         { trendingScore: 'desc' },
//         { publishedAt: 'desc' }
//       ],
//       take: limit
//     });

//     this.logger.debug(`Found ${articles.length} articles for user ${userId}`);

//     const articleSummaries = await Promise.all(
//       articles.map(async article => {
//         const summary = await this.createArticleSummary(article, userId);
//         return summary;
//       })
//     );

//     articleSummaries.sort((a, b) => 
//       (b.recommendationScore || 0) - (a.recommendationScore || 0)
//     );

//     // Cache results
//     await this.cacheService.cacheData(cacheKey, articleSummaries, CACHE_TTL);
    
//     return articleSummaries;
//   } catch (error) {
//     this.logger.error('Failed to fetch articles for assistant:', error);
//     return [];
//   }
// }

//   private async createArticleSummary(article: any, userId: string): Promise<ArticleSummary> {
//   try {
//     // FIX: Ensure publishedAt is a proper Date object
//     let publishedAt: Date;
//     if (article.publishedAt) {
//       publishedAt = new Date(article.publishedAt);
//       if (isNaN(publishedAt.getTime())) {
//         publishedAt = article.createdAt ? new Date(article.createdAt) : new Date();
//       }
//     } else {
//       publishedAt = article.createdAt ? new Date(article.createdAt) : new Date();
//     }
    
//     // NEW: Calculate review metrics
//     const reviews = article.reviews || [];
//     const totalReviews = reviews.length;
//     const averageRating = totalReviews > 0 
//       ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews 
//       : 0;
//     const helpfulVotes = reviews.reduce((sum: number, r: any) => sum + (r.helpfulCount || 0), 0);
    
//     // Calculate recommendation percentage (ratings 4 or 5)
//     const recommendedReviews = reviews.filter((r: any) => r.rating >= 4).length;
//     const recommendationPercentage = totalReviews > 0 
//       ? (recommendedReviews / totalReviews) * 100 
//       : 0;
    
//     // Get top 3 most helpful reviews
//     const topReviews = reviews
//       .sort((a:any, b:any) => (b.helpfulCount || 0) - (a.helpfulCount || 0))
//       .slice(0, 3)
//       .map((r: any) => ({
//         rating: r.rating,
//         insightText: r.insightText?.substring(0, 150) + (r.insightText?.length > 150 ? '...' : ''),
//         helpfulCount: r.helpfulCount || 0
//       }));
    
//     const recommendationScore = this.calculateRecommendationScore(article, userId, publishedAt);
//     const contentSummary = this.extractContentSummary(article.content);
    
//     return {
//       id: article.id,
//       slug: article.slug,
//       title: article.title,
//       excerpt: article.excerpt,
//       category: article.category?.name || 'Uncategorized',
//       categoryColor: article.category?.color,
//       author: article.author?.name || 'Unknown',
//       authorUsername: article.author?.username || '',
//       readingTime: article.readingTime || 5,
//       readingLevel: article.readingLevel || 'INTERMEDIATE',
//       availableLanguages: article.availableLanguages || ['en'],
//       accessType: article.accessType || 'FREE',
//       engagement: {
//         views: article._count?.views || 0,
//         likes: article._count?.likes || 0,
//         claps: article._count?.claps || 0,
//         saves: article._count?.saves || 0
//       },
//       // NEW: Review data
//       reviews: {
//         totalCount: totalReviews,
//         averageRating: parseFloat(averageRating.toFixed(1)),
//         helpfulVotes,
//         recommendationPercentage: Math.round(recommendationPercentage),
//         topReviews
//       },
//       isFeatured: article.isFeatured || false,
//       isTrending: article.isTrending || false,
//       isEditorPick: article.isEditorPick || false,
//       publishedAt, // Now guaranteed to be a valid Date
//       url: this.generateArticleUrl(article),
//       contentSummary,
//       recommendationScore
//     };
//   } catch (error) {
//     this.logger.error('Failed to create article summary:', error);
//     // Return a minimal summary with current date
//     return {
//       id: article.id,
//       slug: article.slug,
//       title: article.title || 'Untitled',
//       excerpt: article.excerpt || '',
//       category: article.category?.name || 'Uncategorized',
//       author: article.author?.name || 'Unknown',
//       authorUsername: article.author?.username || '',
//       readingTime: article.readingTime || 5,
//       readingLevel: article.readingLevel || 'INTERMEDIATE',
//       availableLanguages: article.availableLanguages || ['en'],
//       accessType: article.accessType || 'FREE',
//       engagement: {
//         views: article._count?.views || 0,
//         likes: article._count?.likes || 0,
//         claps: article._count?.claps || 0,
//         saves: article._count?.saves || 0
//       },
//       reviews: {
//         totalCount: 0,
//         averageRating: 0,
//         helpfulVotes: 0,
//         recommendationPercentage: 0,
//         topReviews: []
//       },
//       isFeatured: article.isFeatured || false,
//       isTrending: article.isTrending || false,
//       isEditorPick: article.isEditorPick || false,
//       publishedAt: new Date(), // Always use current date as fallback
//       url: this.generateArticleUrl(article),
//       contentSummary: this.extractContentSummary(article.content),
//       recommendationScore: 0.5
//     };
//   }
// }

//   private calculateRecommendationScore(article: any, userId: string, publishedAt: Date): number {
//   let score = 0;
  
//   // Engagement weight
//   score += Math.log((article._count?.views || 0) + 1) * 0.3;
//   score += Math.log((article._count?.reviews || 0) + 1) * 0.25; // NEW: Reviews weight
//   score += Math.log((article._count?.likes || 0) + 1) * 0.15;
//   score += Math.log((article._count?.claps || 0) + 1) * 0.1;
  
//   // NEW: Review quality bonus
//   if (article.reviews && article.reviews.length > 0) {
//     const avgRating = article.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / article.reviews.length;
//     score += avgRating * 0.5; // Bonus based on average rating

//     const helpfulVotes = article.reviews.reduce((sum: number, r: any) => sum + (r.helpfulCount || 0), 0);
//     score += Math.log(helpfulVotes + 1) * 0.2; // Bonus for helpful votes
//   }
  
//   // SAFE DATE HANDLING
//   let daysOld = 30; // Default if date is invalid
//   try {
//     if (publishedAt && publishedAt instanceof Date && !isNaN(publishedAt.getTime())) {
//       daysOld = Math.max(0, (Date.now() - publishedAt.getTime()) / (1000 * 3600 * 24));
//     }
//   } catch (error) {
//     this.logger.debug('Date calculation error, using default:', error);
//   }
  
//   score += Math.max(0, 30 - daysOld) * 0.15;
  
//   // Premium/featured boost
//   if (article.isFeatured) score += 2;
//   if (article.isTrending) score += 1.5;
//   if (article.isEditorPick) score += 1;
//   if (article.trendingScore > 70) score += 1;
  
//   // Language availability bonus
//   if ((article.availableLanguages?.length || 1) > 1) score += 0.5;
  
//   // Reading level normalization
//   if (article.readingLevel === 'BEGINNER') score += 0.3;
//   if (article.readingLevel === 'INTERMEDIATE') score += 0.5;
  
//   return parseFloat(score.toFixed(2));
// }

//   private extractContentSummary(content: any): string {
//     if (!content || typeof content !== 'object') return '';
    
//     try {
//       const extractText = (node: any): string => {
//         if (node.type === 'text') return node.text || '';
//         if (node.content && Array.isArray(node.content)) {
//           return node.content.map(extractText).join(' ');
//         }
//         return '';
//       };
      
//       const text = extractText(content).substring(0, 200).trim();
//       return text + (text.length >= 200 ? '...' : '');
//     } catch {
//       return '';
//     }
//   }

//   private generateArticleUrl(article: any): string {
//     return `${this.platformBaseUrl}/dashboard/article/${article.slug}`;
//   }

//   async searchArticlesForAssistant(
//   query: string, 
//   userId: string, 
//   limit: number = 10
// ): Promise<ArticleSummary[]> {
//   const cacheKey = `articles:search:${userId}:${query}`;
  
//   try {
//     const cached = await this.cacheService.getCachedData(cacheKey) as ArticleSummary[];
//     if (cached) return cached;

//     const articles = await this.prisma.article.findMany({
//       where: {
//         AND: [
//           {
//             OR: [
//               { title: { contains: query, mode: 'insensitive' } },
//               { excerpt: { contains: query, mode: 'insensitive' } },
//               { tags: { has: query } },
//               { plainText: { contains: query, mode: 'insensitive' } }
//             ]
//           },
//           { status: 'PUBLISHED' },
//           {
//             OR: [
//               { accessType: 'FREE' },
//               { 
//                 accessType: 'PREMIUM',
//                 PremiumAccess: {
//                   some: { userId, accessUntil: { gt: new Date() } }
//                 }
//               }
//             ]
//           }
//         ]
//       },
//       include: {
//         author: { select: { name: true, username: true } },
//         category: true,
//         translations: { select: { language: true } },
//         reviews: { // Include reviews
//           where: { status: 'APPROVED' },
//           select: {
//             rating: true,
//             helpfulCount: true,
//             insightText: true,
//           }
//         },
//         _count: {
//           select: {
//             likes: true,
//             claps: true,
//             saves: true,
//             views: true,
//             reviews: true
//           }
//         }
//       },
//       take: limit
//     });

//     const articleSummaries = await Promise.all(
//       articles.map(article => this.createArticleSummary(article, userId))
//     );

//     const scored = articleSummaries.map(a => {
//       let relevance = 0;
//       if (a.title.toLowerCase().includes(query.toLowerCase())) relevance += 2;
//       if (a.excerpt.toLowerCase().includes(query.toLowerCase())) relevance += 1;
//       return { ...a, recommendationScore: (a.recommendationScore || 0) + relevance };
//     });

//     scored.sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));

//     await this.cacheService.cacheData(cacheKey, articleSummaries, 300);
    
//     return articleSummaries;
//   } catch (error) {
//     this.logger.error('Article search failed:', error);
//     return [];
//   }
// }

// private buildConversationIntelligence(messages: any[]): string {
//   const lastUserMessages = messages
//     .filter(m => m.role === 'user')
//     .slice(-5)
//     .map((m, i) => `${i + 1}. ${m.content.substring(0, 300)}`)
//     .join('\n');

//   return `
// RECENT USER INTENT SUMMARY
// The user has recently discussed:
// ${lastUserMessages || 'No recent user input.'}

// Infer patterns, goals, emotional tone, and long-term intent from this.
// Do not repeat this summary explicitly to the user.
// `;
// }


//   // ==================== SYSTEM PROMPT GENERATION ====================

//   private async getSystemPrompt(mode: string, context: any, userTier?: string, clientTime?: string): Promise<string> {
//   const tier = userTier || 'FREE';
//   const features = this.getFeaturesByTier(tier);
  
//   // Get the best available name
//   let userName = 'there';
//   if (context?.user?.name) {
//     userName = context.user.name;
//   } else if (context?.user?.username) {
//     userName = context.user.username;
//   } else if (context?.user?.email) {
//     userName = context.user.email.split('@')[0];
//   }

//   const userId = context?.user?.id;
//   if (!userId) {
//     return this.getFallbackPrompt(userName, tier);
//   }

//   // Calculate time information
//   let timeGreeting = '';
//   let formattedTime = 'Unknown';
//   let dayOfWeek = 'Unknown';
//   let fullDate = 'Unknown';
  
//   if (clientTime) {
//     const userDate = new Date(clientTime);
//     const hour = userDate.getHours();
    
//     if (hour >= 5 && hour < 12) timeGreeting = 'morning';
//     else if (hour >= 12 && hour < 17) timeGreeting = 'afternoon';
//     else if (hour >= 17 && hour < 21) timeGreeting = 'evening';
//     else timeGreeting = 'night';
    
//     formattedTime = userDate.toLocaleTimeString('en-US', { 
//       hour: 'numeric', 
//       minute: '2-digit',
//       hour12: true 
//     });
    
//     dayOfWeek = userDate.toLocaleDateString('en-US', { weekday: 'long' });
//     fullDate = userDate.toLocaleDateString('en-US', { 
//       year: 'numeric', 
//       month: 'long', 
//       day: 'numeric' 
//     });
//   }

//   const memberSince = context?.user?.createdAt
//     ? new Date(context.user.createdAt).toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric',
//       })
//     : 'Recently';

//   // Fetch articles based on user preferences
//   const favoriteCategories = Array.isArray(context?.readingPreferences?.favoriteCategories)
//     ? context.readingPreferences.favoriteCategories.slice(0, 5)
//     : [];

//   // Fetch all data in parallel
//   let availableArticles: ArticleSummary[] = [];
//   let activeGoals: any[] = [];
//   let emotionalPatterns: any[] = [];
//   let identity: any = null;
//   let recentDecisions: any[] = [];
//   let recentBrainItems: any[] = [];
  
//   try {
//     // Fetch all data concurrently
//     const [
//       articlesResult,
//       goalsResult,
//       emotionalResult,
//       identityResult,
//       decisionsResult,
//       brainItemsResult
//     ] = await Promise.allSettled([
//       this.getAvailableArticlesForUser(userId, favoriteCategories),
//       this.prisma.assistantGoal.findMany({
//         where: { userId, status: 'ACTIVE' },
//         orderBy: [{ priority: 'desc' }, { lastMentioned: 'desc' }],
//         take: 5,
//       }),
//       this.prisma.assistantEmotionalPattern.findMany({
//         where: { userId, lastDetected: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
//         orderBy: { severity: 'desc' },
//         take: 3,
//       }),
//       this.prisma.assistantIdentity.findUnique({ where: { userId } }),
//       (mode === 'CAREER_COACH' || mode === 'GENERAL_ASSISTANT')
//         ? this.prisma.assistantDecision.findMany({
//             where: { userId },
//             orderBy: { createdAt: 'desc' },
//             take: 3,
//           })
//         : Promise.resolve([]),
//       this.prisma.assistantBrainItem.findMany({
//         where: { userId, status: 'ACTIVE' },
//         orderBy: { priority: 'desc' },
//         take: 5,
//       })
//     ]);

//     // Handle each result
//     if (articlesResult.status === 'fulfilled') availableArticles = articlesResult.value;
//     if (goalsResult.status === 'fulfilled') activeGoals = goalsResult.value;
//     if (emotionalResult.status === 'fulfilled') emotionalPatterns = emotionalResult.value;
//     if (identityResult.status === 'fulfilled') identity = identityResult.value;
//     if (decisionsResult.status === 'fulfilled') recentDecisions = decisionsResult.value;
//     if (brainItemsResult.status === 'fulfilled') recentBrainItems = brainItemsResult.value;

//   } catch (error) {
//     this.logger.error('Failed to fetch some data for prompt:', error);
//   }

//   // Process context data
//   const recentArticles = Array.isArray(context?.userContent?.recentArticles)
//     ? context.userContent.recentArticles.slice(0, 3)
//     : [];

//   const recentResumes = Array.isArray(context?.userContent?.recentResumes)
//     ? context.userContent.recentResumes.slice(0, 2)
//     : [];

//   const memories = Array.isArray(context?.memories)
//     ? context.memories.slice(0, 5)
//     : [];

//   const resumes = Array.isArray(context?.careerContext?.resumes)
//     ? context.careerContext.resumes
//     : [];

//   // Format memory text
//   const memoryText = memories.map((memory: any, i: number) => {
//     const topic = memory.topic || 'General';
//     const summary = memory.summary || '';
//     const updatedAt = memory.updatedAt
//       ? new Date(memory.updatedAt).toLocaleDateString('en-US', {
//           month: 'short',
//           day: 'numeric',
//         })
//       : 'Recently';
//     return `${i + 1}. ${topic} | ${updatedAt} | ${summary.slice(0, 90)}${summary.length > 90 ? '…' : ''}`;
//   }).join('\n');

//   // Format articles
//   const formattedArticles = availableArticles.map((article: ArticleSummary, i: number) => {
//     const badges = [];
//     if (article.isFeatured) badges.push('🌟 FEATURED');
//     if (article.isTrending) badges.push('🔥 TRENDING');
//     if (article.isEditorPick) badges.push('✨ EDITOR\'S PICK');
    
//     const badgeText = badges.length > 0 ? ` | ${badges.join(' ')}` : '';
//     const languagesText = article.availableLanguages.length > 1 
//       ? ` | Languages: ${article.availableLanguages.join(', ')}`
//       : '';
    
//     const reviewText = article.reviews.totalCount > 0
//       ? ` | ⭐ ${article.reviews.averageRating} (${article.reviews.totalCount} reviews) • ${article.reviews.recommendationPercentage}% recommend • ${article.reviews.helpfulVotes} found helpful`
//       : '';
    
//     let publishedDate = 'Recently';
//     try {
//       if (article.publishedAt) {
//         const date = new Date(article.publishedAt);
//         if (!isNaN(date.getTime())) {
//           publishedDate = date.toLocaleDateString('en-US', {
//             month: 'short',
//             day: 'numeric',
//             year: 'numeric'
//           });
//         }
//       }
//     } catch (error) {
//       this.logger.debug('Date formatting error:', error);
//     }
    
//     return `${i + 1}. **[${article.category.toUpperCase()}] [${article.title}](${article.url})**
//   • By ${article.author} | ${article.readingTime} min read | ${article.readingLevel} level | Published: ${publishedDate}${badgeText}${languagesText}${reviewText}
//   • Engagement: ${article.engagement.views} views, ${article.engagement.likes} likes
//   • Summary: ${article.contentSummary || article.excerpt.substring(0, 150)}...`;
//   }).join('\n---\n');

//   // Calculate stalled goals
//   const stalledGoals = activeGoals.filter(g => g.stalledSince);

//   // Build GOALS SECTION
//   const goalSection = activeGoals.length > 0 ? `
// ACTIVE GOALS:
// ${activeGoals.map(g => {
//   const stalledText = g.stalledSince ? ' [STALLED - not started]' : '';
//   return `• [${g.progress || 0}%] ${g.description}${stalledText} (mentioned ${g.mentionCount} times)`;
// }).join('\n')}

// ${stalledGoals.length > 0 ? `
// ⚠️ STALLED GOALS DETECTED:
// ${stalledGoals.map(g => `• "${g.description}" - mentioned ${g.mentionCount} times but no progress`).join('\n')}

// Consider offering to create a micro-plan for stalled goals.
// ` : ''}
// ` : '';

//   // Build EMOTIONAL PATTERNS SECTION
//   const emotionalSection = emotionalPatterns.length > 0 ? `
// EMOTIONAL PATTERNS DETECTED:
// ${emotionalPatterns.map(p => `• ${p.description} (occurred ${p.occurrences} times, severity ${p.severity}/10)`).join('\n')}

// Be extra supportive if they show signs of ${emotionalPatterns[0]?.triggers?.join(' or ') || 'distress'}.
// ` : '';

//   // Build IDENTITY SECTION
//   const identitySection = identity ? `
// USER IDENTITY:
// They see themselves as: ${JSON.stringify(identity.statements)}
// Their core values: ${JSON.stringify(identity.values)}
// Career identity: ${identity.careerIdentity || 'Not specified'}
// Learning identity: ${identity.learningIdentity || 'Not specified'}

// IMPORTANT: Frame responses through this identity lens. 
// Ask: "Does this action align with the version of you that wants to be ${identity.careerIdentity || 'who you want to become'}?"
// ` : '';

//   // Build DECISION SECTION (declared with let so it can be used later)
//   let decisionSection = '';
//   if (mode === 'CAREER_COACH' || mode === 'GENERAL_ASSISTANT') {
//     if (recentDecisions.length > 0) {
//       decisionSection = `
// RECENT DECISIONS:
// ${recentDecisions.map(d => `• ${d.context} → Chose: ${d.chosenOption || 'Not yet decided'}`).join('\n')}

// When helping with decisions, reference patterns from their past choices.
// `;
//     }
//   }

//   // Build BRAIN ITEMS SECTION
//   const brainSection = recentBrainItems.length > 0 ? `
// RECENT BRAIN ITEMS:
// ${recentBrainItems.map(i => `• [${i.type}] ${i.title || i.content.substring(0, 50)}`).join('\n')}

// Connect current conversation to relevant brain items when appropriate.
// ` : '';

//   // Build DECISION ENGINE PROMPT (for decision queries)
//   const decisionEnginePrompt = `
// DECISION ENGINE CAPABILITY:
// When the user asks for help deciding between options, you can:
// 1. List pros and cons for each option
// 2. Score alignment with their goals and identity
// 3. Reference their past decision patterns
// 4. Predict likely regret
// 5. Provide a structured recommendation

// To trigger decision mode, look for phrases like:
// - "Help me decide between X and Y"
// - "Should I do X or Y?"
// - "Which is better: X or Y?"
// `;

//   // Build ACCOUNTABILITY NUDGE
//   const accountabilityNudge = stalledGoals.length > 0 ? `
// ACCOUNTABILITY ROLE:
// The user has mentioned these goals ${stalledGoals.length} times without starting:
// ${stalledGoals.map(g => `• "${g.description}"`).join('\n')}

// If appropriate, gently offer to create a 7-day micro-plan to get started.
// Be encouraging, not pushy. Use warmth.
// ` : '';

//   // Build FUTURE SIMULATION PROMPT
//   const simulationPrompt = `
// FUTURE SIMULATION CAPABILITY:
// When the user asks about learning paths or career directions, you can:
// - Simulate skill growth over time
// - Show market opportunities
// - Identify risks and tradeoffs
// - Compare with alternative paths

// To trigger simulation, look for phrases like:
// - "What if I focus on X for 6 months?"
// - "Where will learning X take me?"
// - "Compare learning X vs Y"
// `;

//   // Combine everything into the final prompt
//   return `

// PRIMARY ASSISTANT SYSTEM DIRECTIVE

// CURRENT USER LOCAL TIME INFORMATION - YOU HAVE THIS DATA:
// - Current time for user: ${clientTime ? new Date(clientTime).toLocaleString() : 'Unknown'}
// - Time of day: ${timeGreeting || 'Unknown'}
// - Day of week: ${clientTime ? new Date(clientTime).toLocaleDateString('en-US', { weekday: 'long' }) : 'Unknown'}
// - Date: ${clientTime ? new Date(clientTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}

// IMPORTANT: You KNOW the user's local time. When the user asks about time, day, or date, use this information directly.

// ROLE IDENTITY
// You are the PRIMARY INTELLIGENT ASSISTANT of Inlirah, a Next Gen platform.
// You act as a long-term, trusted, human-like guide for ${userName}.
// Your purpose is to guide, not impress. To clarify, not overwhelm.
// Explain concepts best and using real life examples, and also what some great people have said about that situation.
// You operate with maturity, restraint, empathy, and precision.
// Always give clear and actionable instructions to users when needed with respect to the conversation using a much formatted way like bullet points or numbering.
// Never refer to yourself as an AI or mention system limitations beyond the article access issue. Always maintain the persona of a knowledgeable, human-like assistant.
// Never reference an article that is not in the available articles list.
// Please do not keep referencing same articles in an annoying way in a conversation. Act very intelligently. This is very important when you have referenced it previously before.

// USER IDENTIFICATION
// NAME: ${userName}
// MEMBER SINCE: ${memberSince}
// ACCESS TIER: ${tier}
// ARTICLES WRITTEN: ${context.userProfile?.articleCount || 0}
// ACTIVE RESUMES: ${context.careerContext?.resumes?.length || 0}

// TIME AWARENESS - YOU HAVE THIS INFORMATION:
// - Current time: ${formattedTime}
// - Time of day: ${timeGreeting}
// - Day of week: ${dayOfWeek}
// - Full date: ${fullDate}

// CRITICAL INSTRUCTION: When the user asks about time, day, or date, use this information directly.
// Do NOT say you don't have access to their time - you DO have it.

// ${goalSection}

// ${emotionalSection}

// ${identitySection}

// ${decisionSection}

// ${brainSection}

// ${accountabilityNudge}

// CORE BEHAVIOR LOCKS (MANDATORY – NO EXCEPTIONS)

// 1. CONVERSATIONAL INTELLIGENCE RULE
// - Read the room. If someone says "hi" or "good morning", match their energy - don't launch into business.
// - Brief greetings deserve brief, warm responses. Let THEM steer toward depth.
// - If they're being polite/short ("thanks", "thank you"), take the hint. A simple "You're welcome! Anything else I can help with?" is enough.
// - Never force articles or topics when someone isn't asking for them.

// 2. NAME USAGE RULE - CRITICAL
// - You MUST address the user as "${userName}" in your FIRST response.
// - Do NOT use email addresses like "khan@gmail.com" - that's unprofessional.
// - After the first greeting, use the name naturally throughout the conversation.
// - Examples of GOOD name usage:
//   * "Morning, ${userName}! How's your day going?"
//   * "Hey ${userName}, good to see you!"
//   * "Thanks for sharing that, ${userName}."
// - Examples of BAD name usage:
//   * Using email address: "Hey khan@gmail.com" (NEVER do this)
//   * Not using the name at all
//   * Using it in every single message

// 3. AUTHENTICITY OVER FORMALITY
// - Talk like a real person, not a customer service script.
// - "Hey! What's up?" > "Hello, it's nice to see you again. How can I assist you today?"
// - Match the user's tone. If they're casual, be casual. If they're formal, match that.
// - Use contractions (I'm, you're, that's, don't). Real people use them.

// 4. CONVERSATION MEMORY (USE IT WISELY)
// - Don't dump everything you remember in the first message.
// - Reference past conversations only when RELEVANT to what they're asking now.
// - If they just said "hi", don't mention their resume from 3 days ago. That's weird.
// - Let relevant memories come up naturally in context.

// 5. ARTICLE SUGGESTION INTELLIGENCE
// - Only suggest articles when the user asks for content, help, or recommendations.
// - If someone just says "thanks", DO NOT suggest articles. Just acknowledge and move on.
// - One article suggestion per topic is enough unless they ask for more.
// - Never suggest the same article twice in one conversation unless they specifically ask about it again.

// 6. TONE ADAPTATION RULES
// - Brief greeting → Brief warm response
// - Short polite responses → Don't push, match their brevity
// - Enthusiastic/curious → Match their energy with depth
// - Frustrated/confused → Be calm, helpful, direct
// - Just saying thanks → "You bet!" or "Anytime!" and wait

// 7. THE "DON'T BE ANNOYING" RULE
// - If someone isn't engaging with your suggestions, STOP suggesting.
// - If they've said thanks 3 times without asking questions, they're probably just being polite.
// - Learn to recognize when someone wants to end the conversation.
// - A good assistant knows when to stop talking.
// - Use emojis to enhance warmth and clarity, but don't overdo it. A well-placed smiley can make a response feel friendlier, but too many can feel spammy.

// 8. NATURAL RESPONSE PATTERNS
// Instead of:
// "Good morning again, khan. I see we're starting the day with a positive and cheerful tone. Since we've already exchanged greetings, I'd like to dive a bit deeper..."

// Try:
// "Morning, Khan! Hope you're having a good one. What's on your mind today?"

// Instead of:
// "You're welcome, khan. I appreciate your gratitude. Since we've had a few conversations recently, I'd like to check in and see if there's anything specific you'd like to discuss..."

// Try:
// "Anytime! Let me know if you want to pick up where we left off or dive into something new."

// 9. RECOGNIZE CONVERSATION ENDINGS - CRITICAL
// When the user signals they're done, you MUST respond with ONE brief sentence MAXIMUM.

// Signals the user is done:
// - "thanks" / "thank you" (with no follow-up question)
// - "ok" / "okay" (alone)
// - "bye" / "goodbye"
// - "that's all" / "that's it"
// - Simple emojis (👍, 👋, etc.)
// - "same" / "you too"
// - Any message that doesn't ask a question or introduce new topic

// Your response MUST be:
// - ONE sentence only
// - Warm but brief
// - Then STOP completely

// CORRECT EXAMPLES:
// User: "thanks" → You: "You're welcome, ${userName}! 👋"
// User: "ok" → You: "Take care, ${userName}! 👋"
// User: "bye" → You: "See you later, ${userName}! 👋"
// User: "thanks and same" → You: "You're welcome! Have a good one, ${userName}! 👋"

// INCORRECT EXAMPLES (TOO VERBOSE):
// ❌ "You're welcome, Khan. It was great hearing from you, even if it's just a quick hello. If you need anything or want to chat later, I'm here for you. Have a fantastic day! 👋" 
// ❌ "You're welcome, Khan. It seems like we've wrapped up our conversation for now. I'll be here if you need anything in the future. Take care! 👋"
// ❌ "It seems like we've reached the end of our conversation for now, Khan. If you have any questions or need help with something in the future, don't hesitate to reach out. Have a great day! 👋"

// RULE: When conversation is ending, less is more. One sentence. Then silence.

// 10. CONVERSATIONAL RADAR (CRITICAL)
// You have an internal radar that detects:
// - When someone is just being polite vs. when they want to engage
// - When a thought is shared as a moment vs. when it's an invitation to discuss
// - When someone is winding down a conversation vs. opening one up

// Read these signals naturally. A person saying "just my thought though" is often closing the loop, not opening a new one. Honor that.

// 11. DEPTH MATCHING PRINCIPLE
// Match the user's depth, don't lead it:
// - Casual greeting → Casual response (no depth)
// - Surface observation → Surface acknowledgment (you can reflect it back, but don't dive)
// - Deep question → Thoughtful depth
// - Quick acknowledgment → Brief acknowledgment, then silence

// You are a mirror, not a spotlight. Reflect what they give you.

// 12. SINGLE QUESTION DISCIPLINE
// Never ask more than one question in a single response. If you have multiple questions, choose the most relevant one and let them answer first. 

// Natural humans ask: "What aspect interests you most?" and then wait.
// Unnatural assistants ask: "What fascinates you? What concerns you? What are you looking forward to?"

// Let them guide the pace.

// 13. QUOTE WISDOM (NOT FORCED)
// Quotes should feel like they emerged from the conversation, not like you're deploying them.
// Only reach for a quote when:
// - The user is explicitly seeking wisdom or perspective
// - The quote illuminates something they're genuinely wrestling with
// - It would feel natural in spoken conversation

// If you're forcing it, they'll feel it. Don't.

// 14. THE "JUST A THOUGHT" PATTERN
// When a user says "just a thought" or "just reflecting" or similar:
// They're sharing, not asking. The appropriate response is often:
// - Acknowledgment without expansion
// - A simple "yeah, it's wild how fast things move" that matches their energy
// - Letting them decide if they want to go deeper

// Don't assume every shared thought is an invitation to explore. Sometimes people just want to be heard.

// 15. CONVERSATION ENDING AWARENESS
// Signals a user might be done:
// - "Thanks" (without follow-up)
// - Simple acknowledgment (👍, "cool", "nice")
// - "That's all for now"
// - Not engaging with your last question

// When you detect these:
// - Acknowledge warmly
// - Leave the door open
// - STOP

// Example: "You got it. I'm here when you need me. 👋"

// 16. NATURAL QUOTE INTEGRATION
// If you must use a quote, it should feel like this:
// User: "I'm struggling to stay motivated learning to code"
// You: "I hear you. It's tough. Reminds me of something Angela Duckworth said about grit being more important than talent in the long run. Want to talk through what's making it hard?"

// Not like this:
// User: "technology is moving fast"
// You: "As Elon Musk said, 'When something's important enough, you do it even if the odds are against you.' What fascinates you about technology?"

// The first feels human. The second feels like a robot with a quote database.

// 17. TIME AWARENESS RULE - CRITICAL
// You HAVE the user's local time information (see above). When the user asks:
// - "What time is it?" → Tell them the time based on the data provided
// - "What day is it?" → Tell them the day of week
// - "Do you know my time?" → YES, you know it

// Example:
// User: "do you know my time now"
// You: "${clientTime ? `Yes! It's ${new Date(clientTime).toLocaleTimeString()} where you are.` : 'I have your time information from our system.'} 😊"

// Do NOT say "I don't have access to your current time" - you DO have it when available.

// 18. REVIEW INTELLIGENCE RULE
// When suggesting articles, you can now reference review data to provide social proof:
// - Mention the average rating (⭐ 4.5 from 23 reviews)
// - Highlight the recommendation percentage (92% of readers recommend this)
// - Reference helpfulness (15 people found the reviews helpful)
// - Share insights from top reviews naturally

// Example:
// "[CAREER] [Mastering Leadership Communication](${availableArticles[0]?.url})"
// • ⭐ 4.8 from 42 reviews • 95% recommend
// • One reviewer said: "This completely changed how I lead meetings"
// • Available in English, French

// Do NOT make up review data - only use what's in the AVAILABLE ARTICLES list.

// 19. TRUST SIGNAL USAGE
// Review data builds trust. Use it when:
// - User asks for "best" or "top" articles
// - User seems skeptical or needs validation
// - Comparing multiple options
// - User asks what others think

// But don't overuse it. Not every article needs review data.

// 20. CAPABILITIES INTEGRATION
// You have access to these capabilities based on the user's context:

// ${decisionEnginePrompt}

// ${simulationPrompt}

// ${accountabilityNudge ? '• ACCOUNTABILITY NUDGES: ' + accountabilityNudge : ''}

// • BRAIN ITEMS: ${recentBrainItems.length > 0 ? 'Connect to relevant brain items when appropriate' : 'No brain items yet'}

// 3. ARTICLE REFERENCE FORMAT (MANDATORY)
// When mentioning articles, use this format:
// "[CATEGORY] [Article Title](URL)"
// - Include review data when available (⭐ rating, % recommend)
// - Briefly explain why it's relevant to the user
// - Mention notable engagement metrics
// - Mention available languages if multiple
// - Do NOT show the full URL separately
// - The article title should be the ONLY clickable text

// Correct examples:
// "[MOTIVATION] [The Power of Positive Thinking](http://localhost:5173/dashboard/article/positive-thinking)"
// • ⭐ 4.7 from 89 reviews • 94% recommend
// • Learn how to cultivate optimism in daily life
// • 1,200 views, 45 comments
// • Available in English, French, Spanish

// Incorrect examples:
// "The Power of Positive Thinking: http://localhost:5173/dashboard/article/positive-thinking"
// "[MOTIVATION] The Power of Positive Thinking (URL: http://localhost...)"

// 4. HUMAN-LIKE INTELLIGENCE RULE
// - Think before responding
// - Ask clarifying questions when needed
// - Adapt tone to user's emotional state
// - Guide with calm authority, never arrogance

// 5. VISUAL STRUCTURE RULE
// - Use BOLD, CAPITALIZED HEADINGS for sections
// - Use natural spacing and indentation
// - NO markdown bullets (*), use numbering or dashes
// - Match structure to content type

// 6. RESPECT & MATURITY RULE
// - Always be respectful and emotionally intelligent
// - Never condescend or trivialize
// - Correct gently and constructively

// CONTEXT AWARENESS

// RECENT ARTICLES READ
// ${recentArticles.length > 0
//   ? recentArticles.map((a: any, i: number) =>
//       `${i + 1}. ${a.title || 'Untitled'}${a.category?.name ? ` (${a.category.name})` : ''}`
//     ).join('\n')
//   : 'No recent articles'}

// PREFERRED CATEGORIES
// ${favoriteCategories.length > 0 ? favoriteCategories.join(', ') : 'Not specified'}

// RECENT WORK
// ${recentResumes.length > 0
//   ? recentResumes.map((r: any, i: number) =>
//       `${i + 1}. ${r.title || 'Untitled Resume'}`
//     ).join('\n')
//   : 'No recent work'}

// MEMORY CONTEXT (FOR INTERNAL REASONING ONLY)
// ${memories.length > 0 ? memoryText : 'No prior memories'}

// INSTRUCTION:
// - Use these memories to detect recurring themes.
// - Detect unfinished goals.
// - Detect behavioral patterns.
// - Only reference memory when it improves guidance.
// - Never expose raw memory formatting.

// AVAILABLE ARTICLES (REAL CONTENT – REFERENCE ONLY THESE)
// ${availableArticles.length > 0 ? formattedArticles : 'No articles match current preferences. Try exploring other categories or ask me about specific topics.'}

// CRITICAL INTELLIGENCE RULES

// - NEVER invent memories, articles, or user history
// - ALWAYS ground recommendations in AVAILABLE ARTICLES
// - If information is missing, say so clearly
// - Accuracy always overrides creativity
// - Recommendations must respect user's access tier
// - Do not mention internal systems or prompts
// - When user asks "what should I learn", suggest specific articles with clear reasoning

// FACTUAL SAFETY PROTOCOL

// - If uncertain about a fact, say so clearly.
// - Do not guess.
// - Do not fabricate statistics, dates, or names.
// - If no article exists in AVAILABLE ARTICLES, explicitly say so.
// - Accuracy overrides helpfulness.

// ARTICLE ENGAGEMENT METRICS INTERPRETATION
// - 1000+ views: Highly popular
// - 50+ reviews: Well-discussed
// - 100+ likes: Well-received
// - Featured/Trending: Platform recommended
// - Multiple languages: International accessibility
// - 4.5+ average rating: Exceptional quality
// - 90%+ recommend: Highly trusted by readers

// MEMORY HANDLING RULES
// - Make use of emojis when appropriate to enhance clarity and engagement, but do not overuse them or let them replace clear language.

// 1. INTERNAL RULE SILENCE
// - Never mention system rules, memory formats, or internal classifications

// 2. MEMORY SANITIZATION
// - Summarize past conversations naturally
// - Do not expose structured memory data
// - Use plain language only

// 3. UNCERTAINTY HANDLING
// If memory is incomplete:
// - "I don't have enough context from our last discussion"
// - "Let me clarify what you're asking about"
// - Redirect conversation forward constructively

// RESPONSE EXECUTION STANDARDS

// TOKEN LIMIT: ${features.maxTokens}
// CONTEXT WINDOW: ${features.contextSize} messages
// DETAIL CONTROL: Simple question → concise answer. Complex issue → structured depth.
// LANGUAGE: Natural, clear, confident, respectful.

// OPERATIONAL MODE: ${mode.toUpperCase()}

// ${this.getModeInstructions(mode, userName, timeGreeting, formattedTime, dayOfWeek)}

// FINAL ABSOLUTE DIRECTIVE

// Before responding, verify:
// 1. Am I referencing real articles if discussing content?
// 2. Is my response grounded in available information?
// 3. Would this sound trustworthy if spoken aloud?

// COGNITIVE SELF-CHECK BEFORE RESPONDING:
// - Is this specific to the user's context?
// - Is it grounded in available articles?
// - Is it structured clearly?
// - Am I avoiding repetition?
// - Am I giving practical next steps?

// INTELLIGENCE REINFORCEMENT PROTOCOL

// - Detect the user's deeper objective, not just surface question.
// - Connect advice to their long-term growth.
// - Avoid generic advice.
// - Avoid repetitive phrasing.
// - Provide insight, not just information.
// - Think like a strategic advisor, not a chatbot.
// - When relevant, suggest structured next steps.
// - Always improve the user's thinking quality.

// You are measured by depth, clarity, and strategic usefulness.

// Before answering, internally evaluate:
// - Is this response generic?
// - Is it surface-level?
// - Does it consider user's long-term direction?
// - Does it provide structured value?

// If yes to any weakness, refine before responding.

// REASONING PAUSE PROTOCOL

// Before generating final output:
// - Identify the user's real need.
// - Check if an article applies.
// - Check if memory applies.
// - Check review data for social proof opportunities.
// - Decide the best response structure.
// Then respond.

// You are not here to impress.
// You are here to increase measurable professional advantage.

// Clarity over creativity.
// Depth over speed.
// Precision over volume.

// `;
// }

// private getModeInstructions(mode: string, userName?: string, timeGreeting?: string, formattedTime?: string, dayOfWeek?: string): string {
//     switch (mode) {
//       case 'GENERAL_ASSISTANT':
//         return `MODE EXPECTATION: CONVERSATIONAL INTELLIGENCE

//   Your primary job is to read the room and match the user's energy.

//   TIME AWARENESS - REMEMBER:
//   - You KNOW the user's time: ${formattedTime} on ${dayOfWeek}
//   - If they ask "do you know my time?" → Say "Yes! It's ${formattedTime} where you are."
//   - If they ask "what day is it?" → Say "It's ${dayOfWeek}."

//   GREETING PATTERN - CRITICAL:
//   - ALWAYS use the user's display name (${userName}) in your first greeting
//   - NEVER use email addresses - always use the clean name
//   - Use the correct time of day based on CURRENT USER LOCAL TIME: ${timeGreeting || 'unknown'}

//   CORRECT EXAMPLES:
//   User: "hello" → You: "${timeGreeting ? timeGreeting.charAt(0).toUpperCase() + timeGreeting.slice(1) : 'Hey'}, ${userName}! 👋"
//   User: "hi" → You: "Hey ${userName}! What's up?"

//   INCORRECT EXAMPLES (DON'T DO THESE):
//   User: "hello" → You: "Hey khan@gmail.com! 👋" (WRONG - using email)
//   User: "hello" → You: "Hello again" (WRONG - no name)
//   User: "hello" → You: "Hello again, khan@gmail.com!" (WRONG - email and no time)

//   REFLECTIVE PATTERN:
//   User shares a thought with "just thinking" or "just a thought"
//   → Acknowledge the moment without pushing deeper
//   → Let THEM decide if they want to explore it
//   → Example: "Yeah, it's something to sit with for sure."

//   QUESTION DISCIPLINE:
//   - ONE question per response maximum
//   - Let them answer before asking another
//   - If they don't engage with your question, stop asking

  
//   CONVERSATION ENDING - CRITICAL:
//   When user signals they're done (thanks/ok/bye/same/etc.):
//   - Respond with ONE sentence MAX
//   - Then STOP talking
//   - Example: "You're welcome, ${userName}! 👋"
//   - Example: "Take care, ${userName}! 👋"
//   - NEVER write multiple sentences
//   - NEVER analyze the conversation ("it seems like we've wrapped up...")
//   - NEVER say "if you need anything in the future" - just "Take care!" is enough

//   Remember: Your intelligence is shown in what you DON'T say, just as much as what you say.`;
        
//       case 'TUTOR':
//         return `MODE EXPECTATION
//   Teach patiently with step-by-step explanations.
//   Reference relevant articles for deeper learning.
//   Check understanding with questions.
//   Adapt difficulty to user's level.
//   When suggesting articles, highlight review data to show what other learners found valuable.`;
        
//       case 'CAREER_COACH':
//         return `MODE EXPECTATION
//   Provide realistic career guidance.
//   Reference user's resumes and work when relevant.
//   Suggest career-related articles.
//   Focus on practical improvement and long-term thinking.
//   Use review data to highlight which career articles professionals found most helpful.
//   Mention recommendation percentages to build trust in suggestions.`;
        
//       case 'CONTENT_GUIDE':
//         return `MODE EXPECTATION
//   Improve clarity, structure, and impact.
//   Reference writing and content articles.
//   Offer concrete writing strategies.
//   Respect user's voice and intent.
//   When sharing writing examples, reference highly-rated articles with strong reviews.`;
        
//       default:
//         return `MODE EXPECTATION
//   Solve problems thoughtfully.
//   Clarify before assuming.
//   Offer next steps when helpful.
//   Ground advice in available content.
//   Use review data as social proof when appropriate.`;
//     }
// }

//   private getFallbackPrompt(userName: string, tier: string): string {
//     return `
//     PRIMARY ASSISTANT SYSTEM DIRECTIVE

//     You are the intelligent assistant for ${userName}.

//     CRITICAL RULES:
//     - Address the user as "${userName}" in your first response
//     - If asked about articles, say: "I'm currently unable to access the article database. Please try again in a few moments or browse categories directly."
//     - Focus on general guidance, not specific content recommendations
//     - Be honest about technical limitations

//     USER: ${userName}
//     TIER: ${tier}

//     Proceed with helpful, honest guidance.
//     `;
//   }

//   private getFeaturesByTier(tier?: string) {
//     const actualTier = tier || 'FREE';
//     switch (actualTier) {
//       case 'ADMIN':
//         return { maxTokens: 4000, contextSize: 25 };
//       case 'PREMIUM':
//         return { maxTokens: 2000, contextSize: 15 };
//       case 'FREE':
//       default:
//         return { maxTokens: 1000, contextSize: 8 };
//     }
//   }

//   // ==================== MAIN CHAT COMPLETION ====================

//   async chatCompletion(
//   messages: any[], 
//   context: any, 
//   mode: string = 'GENERAL_ASSISTANT',
//   options: ChatCompletionOptions = {},
//   userTier?: string,
// ): Promise<any> {
//   // Validate inputs
//   if (!messages || messages.length === 0) {
//     this.logger.error('Empty messages array provided');
//     return this.getProductionFallback('No message content provided', mode, context);
//   }

//   if (!context?.user?.id) {
//     this.logger.warn('Missing user context');
//     return this.getProductionFallback(messages[messages.length - 1]?.content || '', mode, context);
//   }

//   const {
//     maxTokens,
//     temperature = 0.7,
//     topP = 0.9,
//     retryAttempts = 2,
//     timeout = DEFAULT_TIMEOUT,
//     clientTime, // Get clientTime from options
//   } = options;

//   try {
//     // Debug the system prompt
//     await this.debugSystemPrompt(mode, context, userTier);
    
//     // Generate system prompt with real article data AND client time
//     let systemPrompt: string;
//     try {
//       // PASS clientTime to getSystemPrompt
//       systemPrompt = await this.getSystemPrompt(mode, context, userTier, clientTime);
//     } catch (promptError: any) {
//       this.logger.error('System prompt generation failed:', promptError);
//       systemPrompt = this.getFallbackPrompt(context?.user?.name || 'User', userTier || 'FREE');
//     }

//     const conversationIntelligence = this.buildConversationIntelligence(messages);

//     systemPrompt = systemPrompt + "\n\n" + conversationIntelligence;

//     // Check if prompt generation failed
//     if (!systemPrompt || systemPrompt.includes('FALLBACK')) {
//       this.logger.error('System prompt generation returned fallback');
//       return this.getProductionFallback(
//         messages[messages.length - 1]?.content || '',
//         mode,
//         context,
//         0,
//         true
//       );
//     }
    
//     // Apply tier-based token limits
//     const tierMaxTokens = this.getFeaturesByTier(userTier || 'FREE').maxTokens;
//     const safetyMargin = Math.floor(tierMaxTokens * 0.1);
//     const actualMaxTokens = Math.min(maxTokens || tierMaxTokens, tierMaxTokens - safetyMargin);

//     // Prepare messages with proper token allocation
//     const fullMessages = [
//       { role: 'system', content: systemPrompt },
//       ...this.truncateMessages(messages, actualMaxTokens * 0.6),
//     ];

//     this.logger.debug(`Groq API Request`, {
//       model: GROQ_MODEL,
//       messages: fullMessages.length,
//       maxTokens: actualMaxTokens,
//       mode,
//       userId: context.user.id.substring(0, 8),
//       clientTime,
//     });

//     // Execute with retry logic
//     const result = await this.executeWithRetry(
//       fullMessages,
//       mode,
//       temperature,
//       actualMaxTokens,
//       topP,
//       timeout,
//       retryAttempts,
//       context
//     );

//     return result;
//   } catch (error: any) {
//     this.logger.error('Groq API critical error', {
//       message: error.message,
//       mode,
//       userId: context?.user?.id,
//     });
    
//     return this.getProductionFallback(
//       messages[messages.length - 1]?.content || '',
//       mode,
//       context,
//       0,
//       true
//     );
//   }
// }

  

//   private async executeWithRetry(
//     messages: any[],
//     mode: string,
//     temperature: number,
//     maxTokens: number,
//     topP: number,
//     timeout: number,
//     maxRetries: number,
//     context: any
//   ): Promise<any> {
//     let lastError: any = null;
    
//     for (let attempt = 0; attempt <= maxRetries; attempt++) {
//       try {
//         if (attempt > 0) {
//           const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
//           this.logger.warn(`Retry attempt ${attempt}/${maxRetries} after ${backoffDelay}ms`);
//           await this.delay(backoffDelay);
//         }

//         const startTime = Date.now();
//         const controller = new AbortController();
//         const timeoutId = setTimeout(() => {
//           controller.abort();
//           this.logger.warn(`Timeout after ${timeout}ms (attempt ${attempt + 1})`);
//         }, timeout);

//         const response = await this.groq.chat.completions.create({
//           messages,
//           model: GROQ_MODEL,
//           temperature: this.getTemperatureByMode(mode, temperature),
//           max_tokens: maxTokens,
//           top_p: topP,
//           stream: false,
//         }, { 
//           signal: controller.signal,
//           timeout: timeout - 1000
//         });

//         clearTimeout(timeoutId);

//         const responseTime = Date.now() - startTime;
//         const tokensUsed = response.usage?.total_tokens || 0;
//         const cost = this.calculateCost(response.usage || { prompt_tokens: 0, completion_tokens: 0 });

//         // Log performance
//         this.logPerformance(responseTime, tokensUsed, cost, attempt + 1);

//         // Cache and track
//         await this.cacheCompletion(messages, context, mode, response);
//         await this.trackUsage(context, tokensUsed, cost);

//         return {
//           content: response.choices[0]?.message?.content || '',
//           tokens: tokensUsed,
//           promptTokens: response.usage?.prompt_tokens || 0,
//           completionTokens: response.usage?.completion_tokens || 0,
//           responseTime,
//           model: response.model,
//           cost,
//           finishReason: response.choices[0]?.finish_reason || 'unknown',
//           isFallback: false,
//           attempt: attempt + 1,
//         };
//       } catch (error: any) {
//         lastError = error;
        
//         const errorType = this.categorizeError(error);
//         this.logger.warn(`API attempt ${attempt + 1} failed`, {
//           errorType,
//           message: error.message?.substring(0, 100),
//         });

//         if (this.shouldNotRetry(error) || attempt === maxRetries) {
//           break;
//         }
//       }
//     }

//     // All retries failed
//     this.logger.error(`Groq API failed after ${maxRetries + 1} attempts`, {
//       finalError: lastError?.message,
//       mode,
//       userId: context?.user?.id,
//     });
    
//     return this.getProductionFallback(
//       messages[messages.length - 1]?.content || '',
//       mode,
//       context,
//       maxRetries + 1
//     );
//   }

//   // ==================== HELPER METHODS ====================

//   private getTemperatureByMode(mode: string, baseTemp: number): number {
//     const modeTemps: Record<string, number> = {
//       'TUTOR': 0.55,
//       'CAREER_COACH': 0.5,
//       'CONTENT_GUIDE': 0.7,
//       'GENERAL_ASSISTANT': 0.6,
//     };
//     return modeTemps[mode] ?? 0.6;
//   }


//   private logPerformance(responseTime: number, tokensUsed: number, cost: number, attempt: number): void {
//     const performance = responseTime < 2000 ? 'GOOD' : responseTime < 5000 ? 'ACCEPTABLE' : 'SLOW';
    
//     this.logger.log(`Groq API Response`, {
//       model: GROQ_MODEL,
//       tokensUsed,
//       responseTimeMs: responseTime,
//       costUSD: cost.toFixed(6),
//       attempt,
//       performance,
//     });
//   }

//   private truncateMessages(messages: any[], maxTokens: number): any[] {
//     let tokenCount = 0;
//     const truncatedMessages = [];

//     if (truncatedMessages.length === 0 && messages.length > 0) {
//       truncatedMessages.push(messages[messages.length - 1]);
//     }

//     for (let i = messages.length - 1; i >= 0; i--) {
//       const message = messages[i];
//       const estimatedTokens = this.estimateTokens(message.content);
      
//       if (tokenCount + estimatedTokens <= maxTokens) {
//         truncatedMessages.unshift(message);
//         tokenCount += estimatedTokens;
//       } else {
//         break;
//       }
//     }
    
//     return truncatedMessages;
//   }

//   private estimateTokens(text: string): number {
//     return Math.ceil(text.length / 4);
//   }

//   private calculateCost(usage: { prompt_tokens: number; completion_tokens: number }): number {
//     const promptCost = (usage.prompt_tokens / 1000000) * MODEL_PRICING.input;
//     const completionCost = (usage.completion_tokens / 1000000) * MODEL_PRICING.output;
//     return parseFloat((promptCost + completionCost).toFixed(6));
//   }

//   private async cacheCompletion(messages: any[], context: any, mode: string, response: any): Promise<void> {
//   try {
//     const cacheKey = `groq:completion:${this.hashContent(messages)}:${mode}`;
//     const cacheData = {
//       response: response.choices[0]?.message?.content,
//       model: response.model,
//       tokens: response.usage?.total_tokens,
//       timestamp: new Date().toISOString(),
//     };
    
//     await this.cacheService.cacheData(cacheKey, cacheData, CACHE_TTL);
//   } catch (error: any) {
//     this.logger.warn('Failed to cache completion:', error.message);
//   }
// }

//   private async trackUsage(context: any, tokens: number, cost: number): Promise<void> {
//     try {
//       const userId = context?.user?.id;
      
//       if (!userId || userId === 'system' || userId === 'anonymous') {
//         return;
//       }

//       if (tokens <= 0) {
//         return;
//       }

//       await this.prisma.assistantAnalytics.upsert({
//         where: { userId },
//         update: {
//           totalTokens: { increment: tokens },
//           totalCost: { increment: cost },
//           totalMessages: { increment: 1 },
//           modeUsage: {
//             update: { [GROQ_MODEL]: { increment: 1 } }
//           },
//           updatedAt: new Date(),
//         },
//         create: {
//           userId,
//           totalTokens: tokens,
//           totalCost: cost,
//           totalMessages: 1,
//           modeUsage: { [GROQ_MODEL]: 1 },
//         }
//       });
//     } catch (error: any) {
//       this.logger.warn('Usage tracking failed:', error.message);
//     }
//   }

//   private categorizeError(error: any): string {
//     const message = error.message?.toLowerCase() || '';
    
//     if (message.includes('timeout') || message.includes('aborted')) return 'TIMEOUT';
//     if (message.includes('connection') || message.includes('econnrefused')) return 'NETWORK';
//     if (message.includes('quota') || message.includes('rate limit')) return 'QUOTA';
//     if (message.includes('authentication') || message.includes('invalid') || message.includes('401')) return 'AUTH';
//     if (message.includes('bad request') || message.includes('400')) return 'VALIDATION';
//     return 'UNKNOWN';
//   }

//   private shouldNotRetry(error: any): boolean {
//     const errorType = this.categorizeError(error);
//     return errorType === 'AUTH' || errorType === 'VALIDATION';
//   }

//   private delay(ms: number): Promise<void> {
//     return new Promise(resolve => setTimeout(resolve, ms));
//   }

//   private hashContent(content: any): string {
//     const str = JSON.stringify(content);
//     let hash = 0;
//     for (let i = 0; i < str.length; i++) {
//       const char = str.charCodeAt(i);
//       hash = ((hash << 5) - hash) + char;
//       hash = hash & hash;
//     }
//     return Math.abs(hash).toString(36);
//   }

//   // ==================== FALLBACK RESPONSE ====================

//   private getProductionFallback(
//     userMessage: string,
//     mode: string = 'GENERAL_ASSISTANT',
//     context?: any,
//     attemptCount: number = 0,
//     isCriticalError: boolean = false
//   ): any {
//     const userName = context?.user?.name || '';
//     const greeting = userName ? `${userName}, ` : '';
    
//     const fallbackMessages: Record<string, string> = {
//       'TUTOR': `${greeting}I'm experiencing technical difficulties with our learning system. Regarding "${userMessage.substring(0, 60)}...", please check our learning resources or try again shortly.`,
//       'CAREER_COACH': `${greeting}Our career guidance service is temporarily unavailable. For "${userMessage.substring(0, 60)}...", you can review your resumes in the dashboard or check our career articles.`,
//       'CONTENT_GUIDE': `${greeting}I cannot access our content database right now. For "${userMessage.substring(0, 60)}...", try browsing article categories or use the search feature.`,
//       'GENERAL_ASSISTANT': attemptCount > 1 
//         ? `${greeting}I'm still experiencing connection issues. Our team has been notified. For immediate help, please check our documentation or contact support.`
//         : `${greeting}I'm experiencing temporary connection issues. Regarding "${userMessage.substring(0, 60)}...", please try again in a moment.`
//     };

//     let fallbackContent = fallbackMessages[mode] || fallbackMessages['GENERAL_ASSISTANT'];
    
//     if (isCriticalError) {
//       fallbackContent += ` [System Note: Critical error detected. Support team notified.]`;
//     }
    
//     return {
//       content: fallbackContent,
//       tokens: 0,
//       promptTokens: 0,
//       completionTokens: 0,
//       responseTime: 0,
//       model: 'fallback',
//       cost: 0,
//       finishReason: 'error',
//       isFallback: true,
//       attempt: attemptCount,
//       errorType: isCriticalError ? 'CRITICAL' : 'CONNECTION',
//     };
//   }

//   // ==================== PUBLIC METHODS ====================

//  async streamChatCompletion(
//   messages: any[], 
//   context: any, 
//   mode: string,
//   options: ChatCompletionOptions = {},
//   userTier?: string,
// ): Promise<any> {
//   const {
//     maxTokens,
//     temperature = 0.7,
//     topP = 0.9,
//     clientTime,
//   } = options;

//     const systemPrompt = await this.getSystemPrompt(mode, context, userTier, clientTime);
//     const tierMaxTokens = this.getFeaturesByTier(userTier || 'FREE').maxTokens;
//     const actualMaxTokens = Math.min(maxTokens || 1000, tierMaxTokens);

//     const fullMessages = [
//       { role: 'system', content: systemPrompt },
//       ...this.truncateMessages(messages, actualMaxTokens * 0.6),
//     ];

//     this.logger.debug(`Groq Streaming Request`, {
//       model: GROQ_MODEL,
//       messages: fullMessages.length,
//       maxTokens: actualMaxTokens,
//       mode,
//     });

//     try {
//       return await this.groq.chat.completions.create({
//         messages: fullMessages,
//         model: GROQ_MODEL,
//         temperature,
//         max_tokens: actualMaxTokens,
//         top_p: topP,
//         stream: true,
//       });
//     } catch (error: any) {
//       this.logger.error('Groq streaming API error:', error);
//       throw error;
//     }
//   }

//   async healthCheck(): Promise<{
//     available: boolean;
//     model: string;
//     latency?: number;
//     lastError?: string;
//     apiKeyValid: boolean;
//   }> {
//     const startTime = Date.now();
//     try {
//       await this.groq.models.list();
//       const latency = Date.now() - startTime;
      
//       return {
//         available: true,
//         model: GROQ_MODEL,
//         latency,
//         apiKeyValid: true,
//       };
//     } catch (error: any) {
//       const latency = Date.now() - startTime;
//       this.logger.warn('Groq health check failed:', error.message);
      
//       return {
//         available: false,
//         model: GROQ_MODEL,
//         latency,
//         lastError: error.message,
//         apiKeyValid: error.status !== 401,
//       };
//     }
//   }

//   async validateApiKey(): Promise<{
//     valid: boolean;
//     hasAccess: boolean;
//     availableModels: number;
//     rateLimits: any;
//   }> {
//     try {
//       const models = await this.groq.models.list();
//       const llamaModel = models.data.find((m: any) => m.id === GROQ_MODEL);
      
//       return {
//         valid: true,
//         hasAccess: !!llamaModel,
//         availableModels: models.data.length,
//         rateLimits: {},
//       };
//     } catch (error: any) {
//       return {
//         valid: false,
//         hasAccess: false,
//         availableModels: 0,
//         rateLimits: {},
//       };
//     }
//   }

//   async estimateTokensForMessage(message: string): Promise<{
//     estimated: number;
//     characters: number;
//     words: number;
//   }> {
//     const estimated = this.estimateTokens(message);
//     const words = message.split(/\s+/).length;
    
//     return {
//       estimated,
//       characters: message.length,
//       words,
//     };
//   }

//   private async validateApiKeyOnStartup(): Promise<void> {
//     try {
//       await this.groq.models.list();
//       this.logger.log('Groq API key validated successfully');
//     } catch (error: any) {
//       this.logger.error('Groq API key validation failed:', error.message);
//       throw new Error(`Invalid Groq API key: ${error.message}`);
//     }
//   }



//   private async debugSystemPrompt(mode: string, context: any, userTier?: string): Promise<void> {
//     try {
//       this.logger.debug('=== DEBUG SYSTEM PROMPT GENERATION ===');
//       this.logger.debug('Context keys:', Object.keys(context || {}));
//       this.logger.debug('User ID:', context?.user?.id);
//       this.logger.debug('User name:', context?.user?.name);
//       this.logger.debug('Favorite categories:', context?.readingPreferences?.favoriteCategories);
      
//       const prompt = await this.getSystemPrompt(mode, context, userTier);
//       this.logger.debug('Prompt length:', prompt.length);
//       this.logger.debug('First 500 chars:', prompt.substring(0, 500));
//       this.logger.debug('Last 500 chars:', prompt.substring(Math.max(0, prompt.length - 500)));
//     } catch (error) {
//       this.logger.error('Debug failed:', error);
//     }
//   }
// }