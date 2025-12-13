// translation.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from '../../../../tools/prisma/prisma.service';
import { TranslationStatus, ArticleStatus } from '@prisma/client';

export interface TranslationResult {
  title: string;
  excerpt: string;
  content: any;
  plainText?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  confidence: number;
  needsReview: boolean;
}

export interface AvailableLanguage {
  language: string;
  isOriginal: boolean;
  confidence: number;
  qualityScore: number;
}

@Injectable()
export class TranslationService implements OnModuleInit {
  private readonly logger = new Logger(TranslationService.name);
  private readonly groqApiKey: string;
  private readonly groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private httpService: HttpService
  ) {
    const key = this.config.get('GROQ_API_KEY');
    if (!key) {
      this.logger.warn('GROQ_API_KEY is not set in .env. Using mock translations.');
    }
    this.groqApiKey = key;
  }

  async onModuleInit() {
    await this.initializeGroqClient();
  }

  private async initializeGroqClient() {
    if (!this.groqApiKey) {
      this.logger.warn('GROQ_API_KEY not configured. Translation service will be in mock mode.');
      return;
    }

  }

  

  private async generateContent(prompt: string, model: string = 'llama-3.3-70b-versatile'): Promise<string> {
  if (!this.groqApiKey) {
    throw new Error('Groq API key not configured');
  }

  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      this.logger.log(`Sending translation request to Groq API (model: ${model}) - Attempt ${attempt}/${maxRetries}...`);
      
      const response = await lastValueFrom(
        this.httpService.post(
          this.groqApiUrl,
          {
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            model: model,
            temperature: 0.3,
            max_tokens: 4000,
            top_p: 1,
            stream: false,
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              'Authorization': `Bearer ${this.groqApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        )
      );

      const content = response.data.choices[0]?.message?.content || '';
      this.logger.log(`✅ Successfully received response from Groq API (Attempt ${attempt})`);
      return content;
      
    } catch (error: any) {
      lastError = error;
      
      // Log error details
      const errorDetails = {
        attempt,
        maxRetries,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        code: error.code,
      };
      
      this.logger.warn(`⚠️ Groq API attempt ${attempt} failed:`, JSON.stringify(errorDetails, null, 2));

      // Check if we should retry
      const shouldRetry = this.shouldRetryRequest(error, attempt, maxRetries);
      
      if (!shouldRetry) {
        break; // Don't retry for certain errors
      }

      // Calculate exponential backoff delay
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        this.logger.log(`🔄 Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }

  // All retries failed, throw the last error
  this.logger.error(`❌ All ${maxRetries} attempts failed for Groq API`);
  
  // Provide better error message
  if (lastError.response?.status === 401) {
    throw new Error('Invalid Groq API key. Please check your API key in .env file');
  } else if (lastError.response?.status === 404) {
    throw new Error(`Groq model "${model}" not found. Try using "llama-3.3-70b-versatile"`);
  } else if (lastError.response?.status === 429) {
    throw new Error('Groq API rate limit exceeded. Please wait and try again.');
  } else if (lastError.code === 'ECONNREFUSED' || lastError.code === 'ETIMEDOUT') {
    throw new Error(`Network error: ${lastError.message}. Check your internet connection.`);
  }
  
  throw new Error(`Groq API failed after ${maxRetries} attempts: ${lastError.response?.data?.error?.message || lastError.message}`);
}

private shouldRetryRequest(error: any, attempt: number, maxRetries: number): boolean {
  // Don't retry if we've reached max retries
  if (attempt >= maxRetries) return false;

  // Don't retry for authentication errors
  if (error.response?.status === 401 || error.response?.status === 403) {
    return false;
  }

  // Don't retry for "not found" errors
  if (error.response?.status === 404) {
    return false;
  }

  // Retry for network errors, timeouts, and rate limits
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  const retryableErrorCodes = ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];
  
  return (
    retryableStatusCodes.includes(error.response?.status) ||
    retryableErrorCodes.includes(error.code) ||
    !error.response?.status // Network error without status
  );
}

private sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}



  async translateArticle(articleId: string, targetLanguage: string, options?: {
    force?: boolean;
    aiModel?: string;
    useCache?: boolean;
  }): Promise<any> {
    try {
      this.logger.log(`Translating article ${articleId} to ${targetLanguage}`);

      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          excerpt: true,
          content: true,
          metaTitle: true,
          metaDescription: true,
          keywords: true,
          status: true,
        },
      });

      if (!article) {
        throw new Error(`Article ${articleId} not found`);
      }

      if (article.status !== ArticleStatus.PUBLISHED) {
        throw new Error('Article must be published to translate');
      }

      if (!options?.force) {
        const existing = await this.prisma.articleTranslation.findUnique({
          where: {
            articleId_language: {
              articleId,
              language: targetLanguage,
            },
          },
        });

        if (existing) {
          if (existing.status === TranslationStatus.COMPLETED) {
            this.logger.log(`Translation already exists for ${articleId} -> ${targetLanguage}`);
            
            await this.prisma.articleTranslation.update({
              where: { id: existing.id },
              data: {
                lastAccessed: new Date(),
                accessCount: { increment: 1 },
              },
            });

            return existing;
          } else if (existing.status === TranslationStatus.FAILED) {
            if (existing.attemptCount < 3) {
              this.logger.log(`Retrying failed translation for ${articleId} -> ${targetLanguage} (attempt ${existing.attemptCount + 1})`);
            } else {
              this.logger.warn(`Max retry attempts reached for ${articleId} -> ${targetLanguage}`);
              throw new Error('Max retry attempts reached');
            }
          }
        }
      }

      const translationJob = await this.prisma.translationJob.upsert({
        where: {
          articleId_targetLanguage: {
            articleId,
            targetLanguage,
          },
        },
        update: {
          status: TranslationStatus.PROCESSING,
          startedAt: new Date(),
          attemptCount: { increment: 1 },
          aiModel: options?.aiModel || 'llama-3.3-70b-versatile',
        },
        create: {
          articleId,
          targetLanguage,
          status: TranslationStatus.PROCESSING,
          startedAt: new Date(),
          aiModel: options?.aiModel || 'llama-3.3-70b-versatile',
          priority: 1,
        },
      });

      try {
        const translationResult = await this.performTranslation(
          article,
          targetLanguage,
          translationJob.aiModel
        );

        const savedTranslation = await this.saveTranslation(
          articleId,
          targetLanguage,
          translationResult,
          translationJob.aiModel
        );

        await this.prisma.translationJob.update({
          where: { id: translationJob.id },
          data: {
            status: TranslationStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        this.logger.log(`✅ Successfully translated article ${articleId} to ${targetLanguage}`);
        return savedTranslation;

      } catch (translationError) {
        await this.prisma.translationJob.update({
          where: { id: translationJob.id },
          data: {
            status: TranslationStatus.FAILED,
            errorMessage: (translationError as Error).message,
          },
        });

        await this.prisma.articleTranslation.updateMany({
          where: {
            articleId,
            language: targetLanguage,
          },
          data: {
            status: TranslationStatus.FAILED,
            attemptCount: { increment: 1 },
          },
        });

        throw translationError;
      }

    } catch (error) {
      this.logger.error(`❌ Failed to translate article ${articleId} to ${targetLanguage}:`, error);
      throw error;
    }
  }

  async translateMultipleArticles(articleIds: string[], targetLanguage: string) {
    const results = [];

    for (const articleId of articleIds) {
      try {
        const translation = await this.translateArticle(articleId, targetLanguage);
        results.push({
          articleId,
          success: true,
          translationId: translation.id,
        });
      } catch (error) {
        results.push({
          articleId,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return results;
  }

 private async performTranslation(
    article: any,
    targetLanguage: string,
    aiModel: string = 'llama-3.3-70b-versatile'
  ): Promise<TranslationResult> {
    if (this.groqApiKey) {
      try {
        // Try real translation with retries
        return await this.performGroqTranslation(article, targetLanguage, aiModel);
      } catch (error) {
        this.logger.error('❌ Groq translation failed after all retries:', error);
        
        // Check if we should fall back to mock or fail completely
        if (this.shouldFallbackToMock(error)) {
          this.logger.warn('⚠️ Falling back to mock translation');
          return this.performMockTranslation(article, targetLanguage);
        } else {
          throw error; // Re-throw for critical errors
        }
      }
    } else {
      return this.performMockTranslation(article, targetLanguage);
    }
  }

  private shouldFallbackToMock(error: any): boolean {
    // Fall back to mock for network issues, timeouts, rate limits
    const fallbackMessages = [
      'network',
      'timeout',
      'rate limit',
      'connection',
      'econnrefused',
      'etimedout'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return fallbackMessages.some(msg => errorMessage.includes(msg));
  }

  private async performGroqTranslation(
  article: any,
  targetLanguage: string,
  aiModel: string
): Promise<TranslationResult> {
  const maxRetries = 2;
  const baseDelay = 500;
  let lastParseError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const systemPrompt = this.buildTranslationPrompt(targetLanguage);
      
      const userContent = {
        originalTitle: article.title,
        originalExcerpt: article.excerpt,
        originalContent: article.content,
        originalMetaTitle: article.metaTitle,
        originalMetaDescription: article.metaDescription,
        originalKeywords: article.keywords,
        targetLanguage,
      };

      const prompt = `${systemPrompt}\n\n${JSON.stringify(userContent, null, 2)}`;

      this.logger.log(`Attempting Groq translation (Attempt ${attempt}/${maxRetries})`);
      const generatedContent = await this.generateContent(prompt, aiModel);
      
      try {
        const translated = JSON.parse(generatedContent);
        
        this.logger.log(`✅ Groq translation successful (Attempt ${attempt})`);
        return {
          title: translated.title || article.title,
          excerpt: translated.excerpt || article.excerpt,
          content: translated.content || article.content,
          plainText: this.extractPlainText(translated.content || article.content),
          metaTitle: translated.metaTitle || article.metaTitle,
          metaDescription: translated.metaDescription || article.metaDescription,
          keywords: translated.keywords || article.keywords || [],
          confidence: translated.confidence || 0.9,
          needsReview: translated.needsReview || false,
        };
      } catch (parseError) {
        lastParseError = parseError;
        this.logger.warn(`Failed to parse Groq response (Attempt ${attempt}):`, parseError.message);
        
        // If it's a JSON parse error, we can retry with a different prompt
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          this.logger.log(`🔄 Retrying due to JSON parse error in ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }
      }
      
    } catch (error: any) {
      lastParseError = error;
      this.logger.warn(`Groq translation attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries && this.isRetryableError(error)) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        this.logger.log(`🔄 Retrying translation in ${delay}ms...`);
        await this.sleep(delay);
        continue;
      }
    }
  }

  // All attempts failed
  this.logger.error('❌ All Groq translation attempts failed:', lastParseError?.message);
  throw new Error(`Groq translation failed after ${maxRetries} attempts: ${lastParseError?.message}`);
}

private isRetryableError(error: any): boolean {
  // Retry for network issues, timeouts, and server errors
  const retryableMessages = [
    'timeout',
    'network',
    'connection',
    'rate limit',
    'server error',
    'temporarily',
    'busy',
    'overloaded'
  ];
  
  const errorMessage = error.message.toLowerCase();
  return retryableMessages.some(msg => errorMessage.includes(msg));
}

  private performMockTranslation(
    article: any,
    targetLanguage: string
  ): TranslationResult {
    this.logger.log(`⚠️ Using mock translation for ${targetLanguage}`);
    
    return {
      title: `[${targetLanguage.toUpperCase()}] ${article.title}`,
      excerpt: `[${targetLanguage.toUpperCase()}] ${article.excerpt}`,
      content: article.content,
      plainText: this.extractPlainText(article.content),
      metaTitle: article.metaTitle,
      metaDescription: article.metaDescription,
      keywords: article.keywords || [],
      confidence: 0.5,
      needsReview: true,
    };
  }

  private buildTranslationPrompt(targetLanguage: string): string {
    return `You are a professional translator. Translate the following content to ${targetLanguage}.

CRITICAL REQUIREMENTS:
1. Maintain EXACT original meaning and tone
2. Keep technical/specialized terms as-is if no direct translation exists
3. Preserve ALL markdown/HTML formatting, structure, and styling
4. Translate SEO elements naturally while maintaining keywords
5. Return response in valid JSON format only

RETURN JSON FORMAT:
{
  "title": "translated title here",
  "excerpt": "translated excerpt here",
  "content": "translated content (same JSON structure as input)",
  "metaTitle": "translated meta title or null",
  "metaDescription": "translated meta description or null",
  "keywords": ["translated", "keywords", "array"],
  "confidence": 0.95,
  "needsReview": false
}

Important:
- If content is JSON/structured (like TipTap editor content), preserve the exact structure
- Only translate text nodes, not structure
- Mark needsReview as true if you're unsure about technical terms

Translate the following content:`;
  }

  private async saveTranslation(
    articleId: string,
    language: string,
    translationResult: TranslationResult,
    aiModel: string
  ) {
    const existing = await this.prisma.articleTranslation.findUnique({
      where: {
        articleId_language: {
          articleId,
          language,
        },
      },
    });

    const translationData = {
      title: translationResult.title,
      excerpt: translationResult.excerpt,
      content: translationResult.content,
      plainText: translationResult.plainText || this.extractPlainText(translationResult.content),
      metaTitle: translationResult.metaTitle,
      metaDescription: translationResult.metaDescription,
      keywords: translationResult.keywords,
      status: TranslationStatus.COMPLETED,
      translatedBy: this.groqApiKey ? 'AI' : 'MOCK',
      aiModel: aiModel,
      confidence: translationResult.confidence,
      needsReview: translationResult.needsReview,
      qualityScore: this.calculateQualityScore(translationResult.confidence, translationResult.needsReview),
      attemptCount: 0,
    };

    if (existing) {
      return await this.prisma.articleTranslation.update({
        where: { id: existing.id },
        data: translationData,
      });
    } else {
      return await this.prisma.articleTranslation.create({
        data: {
          articleId,
          language,
          ...translationData,
        },
      });
    }
  }

  private calculateQualityScore(confidence: number, needsReview: boolean): number {
    let score = Math.floor(confidence * 10);
    
    if (needsReview) {
      score = Math.max(1, score - 3);
    }
    
    return Math.min(5, Math.ceil(score / 2));
  }

  private extractPlainText(content: any): string {
    if (typeof content === 'string') return content;
    
    try {
      if (content && typeof content === 'object') {
        if (content.type === 'doc' && content.content) {
          return this.extractTextFromNodes(content.content);
        }
        return JSON.stringify(content);
      }
    } catch (error) {
      this.logger.warn('Failed to extract plain text:', error);
    }
    
    return '';
  }

  private extractTextFromNodes(nodes: any[]): string {
    let text = '';
    for (const node of nodes) {
      if (node.type === 'text' && node.text) {
        text += node.text + ' ';
      }
      if (node.content && Array.isArray(node.content)) {
        text += this.extractTextFromNodes(node.content);
      }
    }
    return text.trim();
  }

  async getTranslation(articleId: string, language: string) {
    const translation = await this.prisma.articleTranslation.findUnique({
      where: {
        articleId_language: {
          articleId,
          language,
        },
      },
    });

    if (translation) {
      await this.prisma.articleTranslation.update({
        where: { id: translation.id },
        data: {
          lastAccessed: new Date(),
          accessCount: { increment: 1 },
        },
      });
    }

    return translation;
  }

  async getArticleTranslations(articleId: string, includeFailed: boolean = false) {
    const where: any = { articleId };
    if (!includeFailed) {
      where.status = TranslationStatus.COMPLETED;
    }

    return this.prisma.articleTranslation.findMany({
      where,
      orderBy: [
        { language: 'asc' },
        { updatedAt: 'desc' },
      ],
    });
  }

  async getAvailableLanguages(articleId: string): Promise<AvailableLanguage[]> {
    const translations = await this.prisma.articleTranslation.findMany({
      where: {
        articleId,
        status: TranslationStatus.COMPLETED,
      },
      select: {
        language: true,
        confidence: true,
        qualityScore: true,
      },
    });

    const languages: AvailableLanguage[] = [
      { 
        language: 'en', 
        isOriginal: true, 
        confidence: 1, 
        qualityScore: 5 
      }
    ];

    translations.forEach(trans => {
      languages.push({
        language: trans.language,
        isOriginal: false,
        confidence: trans.confidence || 0.95,
        qualityScore: trans.qualityScore || 3,
      });
    });

    return languages;
  }

  async retryFailedTranslations(articleId?: string) {
    const where: any = { status: TranslationStatus.FAILED };
    if (articleId) {
      where.articleId = articleId;
    }

    const failedTranslations = await this.prisma.articleTranslation.findMany({
      where,
      include: {
        article: {
          select: {
            title: true,
            content: true,
            excerpt: true,
          },
        },
      },
    });

    const results = [];
    for (const translation of failedTranslations) {
      try {
        const retried = await this.translateArticle(
          translation.articleId,
          translation.language,
          { force: true }
        );
        results.push({
          articleId: translation.articleId,
          language: translation.language,
          success: true,
          newTranslationId: retried.id,
        });
      } catch (error) {
        results.push({
          articleId: translation.articleId,
          language: translation.language,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return results;
  }

  async cleanupOldTranslations(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const deletedJobs = await this.prisma.translationJob.deleteMany({
      where: {
        status: TranslationStatus.FAILED,
        updatedAt: { lt: cutoffDate },
      },
    });

    const deletedCompletedJobs = await this.prisma.translationJob.deleteMany({
      where: {
        status: TranslationStatus.COMPLETED,
        updatedAt: { lt: cutoffDate },
      },
    });

    return {
      deletedFailedJobs: deletedJobs.count,
      deletedCompletedJobs: deletedCompletedJobs.count,
      total: deletedJobs.count + deletedCompletedJobs.count,
    };
  }

  async getServiceStatus() {
    const apiKey = !!this.groqApiKey;
    const [totalTranslations, completedTranslations] = await Promise.all([
      this.prisma.articleTranslation.count(),
      this.prisma.articleTranslation.count({ where: { status: TranslationStatus.COMPLETED } }),
    ]);

    return {
      groqConfigured: apiKey,
      mode: apiKey ? 'REAL' : 'MOCK',
      totalTranslations,
      completedTranslations,
      successRate: totalTranslations > 0 ? (completedTranslations / totalTranslations) * 100 : 0,
      message: apiKey 
        ? '✅ Real AI translations enabled with Groq API'
        : '⚠️ Mock translations (add GROQ_API_KEY to .env)',
    };
  }

  
}