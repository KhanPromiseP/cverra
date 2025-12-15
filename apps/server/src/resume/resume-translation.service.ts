// resume-translation.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from "nestjs-prisma";
import { Prisma, TranslationStatus } from '@prisma/client';
import { lastValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';




export interface SaveTranslationResult {
  success: boolean;
  translatedResume: any;
  translation: {
    confidence: number;
    needsReview: boolean;
    language: string;
    languageName: string;
  };
}


export interface TranslationOptions {
  force?: boolean;
  aiModel?: string;
  useCache?: boolean;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface TranslationResult {
  data: any;
  confidence: number;
  needsReview: boolean;
  totalTokens?: number;
  sourceHash?: string;
}

export interface AvailableLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isOriginal: boolean;
  confidence?: number;
  qualityScore?: number;
  available: boolean;
  lastUpdated?: Date;
}

@Injectable()
export class ResumeTranslationService implements OnModuleInit {
  private readonly logger = new Logger(ResumeTranslationService.name);
  private readonly groqApiKey: string;
  private readonly openaiApiKey: string;
  private readonly groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly openaiApiUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly cache = new Map<string, any>();
  private readonly SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', isOriginal: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
    { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
    { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  ];

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {
    this.groqApiKey = this.config.get('GROQ_API_KEY') || '';
    this.openaiApiKey = this.config.get('OPENAI_API_KEY') || '';
  }

  async onModuleInit() {
    await this.cleanupOldJobs();
  }

  /**
   * Main translation method
   */
  async translateResume(
    resumeId: string,
    targetLanguage: string,
    options: TranslationOptions = {},
  ): Promise<TranslationResult> {
    const startTime = Date.now();
    const requestId = uuidv4().substring(0, 8);
    
    this.logger.log(`[${requestId}] Starting translation: ${resumeId} -> ${targetLanguage}`);

    try {
      // Validate language
      if (!this.isLanguageSupported(targetLanguage)) {
        throw new Error(`Language "${targetLanguage}" is not supported`);
      }

      // Check cache first
      const cacheKey = this.getCacheKey(resumeId, targetLanguage);
      if (options.useCache !== false && this.cache.has(cacheKey)) {
        this.logger.log(`[${requestId}] Using cached translation`);
        return this.cache.get(cacheKey);
      }

      // Get resume data
      const resume = await this.prisma.resume.findUnique({
        where: { id: resumeId },
        select: { data: true, title: true, userId: true },
      });

      if (!resume) {
        throw new Error(`Resume ${resumeId} not found`);
      }

      // Check for existing translation
      if (!options.force) {
        const existing = await this.prisma.resumeTranslation.findUnique({
          where: { resumeId_language: { resumeId, language: targetLanguage } },
        });

        if (existing && existing.status === TranslationStatus.COMPLETED) {
          this.logger.log(`[${requestId}] Using existing translation`);
          
          // Update access time
          await this.prisma.resumeTranslation.update({
            where: { id: existing.id },
            data: { lastAccessed: new Date() },
          });

          // Cache for future requests
          const result: TranslationResult = {
            data: existing.data as any,
            confidence: existing.confidence || 0.9,
            needsReview: existing.needsReview,
          };
          
          this.cache.set(cacheKey, result);
          return result;
        }
      }

      // Create translation job - FIXED
      const job = await this.prisma.resumeTranslationJob.upsert({
        where: { 
          resumeId_targetLanguage: { resumeId, targetLanguage } 
        },
        update: {
          status: TranslationStatus.PROCESSING,
          startedAt: new Date(),
          attemptCount: { increment: 1 },
          aiModel: options.aiModel || this.getPreferredModel(),
          priority: options.priority || 1,
        },
        create: {
          resumeId,
          targetLanguage,
          status: TranslationStatus.PROCESSING,
          startedAt: new Date(),
          attemptCount: 1,
          aiModel: options.aiModel || this.getPreferredModel(),
          priority: options.priority || 1,
        },
      });

      try {
        // Perform AI translation
        const translationResult = await this.performAITranslation(
          resume.data,
          targetLanguage,
          job.aiModel,
          requestId,
        );

        // Save translation - FIXED
        const savedTranslation = await this.prisma.resumeTranslation.upsert({
          where: { resumeId_language: { resumeId, language: targetLanguage } },
          update: {
            data: translationResult.data,
            status: TranslationStatus.COMPLETED,
            confidence: translationResult.confidence,
            needsReview: translationResult.needsReview,
            translatedBy: 'ai',
            aiModel: job.aiModel,
            attemptCount: 0,
            error: null,
            qualityScore: this.calculateQualityScore(translationResult.confidence),
            totalTokens: translationResult.totalTokens,
            updatedAt: new Date(),
            lastAccessed: new Date(),
          },
          create: {
            resumeId,
            language: targetLanguage,
            data: translationResult.data,
            status: TranslationStatus.COMPLETED,
            confidence: translationResult.confidence,
            needsReview: translationResult.needsReview,
            translatedBy: 'ai',
            aiModel: job.aiModel,
            qualityScore: this.calculateQualityScore(translationResult.confidence),
            totalTokens: translationResult.totalTokens,
          },
        });

        // Update job status
        await this.prisma.resumeTranslationJob.update({
          where: { id: job.id },
          data: {
            status: TranslationStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        // Cache result
        this.cache.set(cacheKey, translationResult);

        const duration = Date.now() - startTime;
        this.logger.log(`[${requestId}] Translation completed in ${duration}ms`);

        return translationResult;

      } catch (translationError) {
        // Update job as failed
        await this.prisma.resumeTranslationJob.update({
          where: { id: job.id },
          data: {
            status: TranslationStatus.FAILED,
            errorMessage: (translationError as Error).message,
          },
        });

        // Update or create failed translation record - FIXED
        await this.prisma.resumeTranslation.upsert({
          where: { resumeId_language: { resumeId, language: targetLanguage } },
          update: {
            status: TranslationStatus.FAILED,
            error: (translationError as Error).message,
            attemptCount: { increment: 1 },
            updatedAt: new Date(),
          },
          create: {
            resumeId,
            language: targetLanguage,
            data: {}, // Add empty data object as it's required
            status: TranslationStatus.FAILED,
            error: (translationError as Error).message,
            attemptCount: 1,
          },
        });

        throw translationError;
      }

    } catch (error) {
      this.logger.error(`[${requestId}] Translation failed:`, error);
      throw error;
    }
  }

  /**
   * Perform AI translation using Groq or OpenAI
   */
  private async performAITranslation(
    resumeData: any,
    targetLanguage: string,
    model: string | null,
    requestId: string,
  ): Promise<TranslationResult> {
    const maxRetries = 3;
    let lastError: Error | undefined = undefined; // FIXED: Initialize as undefined

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`[${requestId}] AI translation attempt ${attempt}/${maxRetries}`);

        const prompt = this.buildTranslationPrompt(resumeData, targetLanguage);
        
        let apiResponse;
        const aiModel = model || this.getPreferredModel();
        
        if (aiModel.includes('groq') || aiModel.includes('llama')) {
          apiResponse = await this.callGroqAPI(prompt, aiModel, requestId);
        } else if (aiModel.includes('gpt')) {
          apiResponse = await this.callOpenAIAPI(prompt, aiModel, requestId);
        } else {
          // Default to Groq
          apiResponse = await this.callGroqAPI(prompt, this.getPreferredModel(), requestId);
        }

        // Parse and validate response
        const parsedResponse = JSON.parse(apiResponse);
        const translatedData = parsedResponse.translatedResume;
        
        if (!translatedData) {
          throw new Error('Invalid response format from AI');
        }

        // Validate structure
        this.validateTranslation(resumeData, translatedData);

        const confidence = parsedResponse.confidence || 0.9;
        const needsReview = parsedResponse.needsReview || false;
        const totalTokens = parsedResponse.usage?.total_tokens;

        return {
          data: translatedData,
          confidence,
          needsReview,
          totalTokens,
          sourceHash: this.generateHash(JSON.stringify(resumeData)),
        };

      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`[${requestId}] Attempt ${attempt} failed: ${error.message}`);

        if (attempt < maxRetries) {
          // Exponential backoff
          await this.sleep(1000 * Math.pow(2, attempt - 1));
          continue;
        }
      }
    }

    throw new Error(`AI translation failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Build translation prompt for AI
   */
  private buildTranslationPrompt(resumeData: any, targetLanguage: string): string {
    const languageInfo = this.SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage);
    const languageName = languageInfo?.nativeName || targetLanguage;

    return `You are a professional resume translator specializing in ${languageName} (${targetLanguage}).

TASK: Translate this English resume JSON to ${languageName} while preserving all structure and formatting.

CRITICAL RULES (MUST FOLLOW):
1. ONLY translate text values - NEVER translate JSON keys, identifiers, or property names
2. Preserve EXACT JSON structure, types, and formatting
3. DO NOT translate these elements (keep them in original English):
   - All JSON keys (e.g., "name", "title", "company", "skills", "education")
   - All "id" fields (id, userId, resumeId, etc.)
   - All "url", "href", "link", "website" fields
   - All email addresses and phone numbers
   - All keys inside "metadata" section
   - Template names, category names
   - Date formats (e.g., "Jan 2020 - Dec 2023")
   - HTML tags, markdown, special formatting
   - Company names, university names (unless they have official translations)
   - Technical terms, software names, certifications
   - Currency symbols and numbers

4. DO translate these elements to ${languageName}:
   - Personal names (if they have common translations)
   - Job titles and positions (professionally adapted)
   - Job descriptions and achievements
   - Educational descriptions
   - Skill descriptions
   - Project descriptions
   - Summary/objective statements
   - Award descriptions

5. Cultural adaptation:
   - Use professional tone appropriate for ${languageName} business culture
   - Adapt measurements if culturally relevant
   - Use appropriate honorifics if needed
   - Maintain resume conventions for ${targetLanguage}

RETURN FORMAT (JSON):
{
  "translatedResume": { /* The translated JSON with same structure */ },
  "confidence": 0.95, /* 0-1 confidence score */
  "needsReview": false, /* true if unsure about translations */
  "notes": "Any notes about the translation"
}

EXAMPLE INPUT:
{
  "basics": {
    "name": "John Smith",
    "email": "john@example.com",
    "summary": "Senior software engineer with 10+ years experience..."
  }
}

EXAMPLE OUTPUT (Spanish):
{
  "translatedResume": {
    "basics": {
      "name": "John Smith",
      "email": "john@example.com",
      "summary": "Ingeniero de software senior con más de 10 años de experiencia..."
    }
  },
  "confidence": 0.98,
  "needsReview": false
}

Now translate this resume to ${languageName} (${targetLanguage}):

${JSON.stringify(resumeData, null, 2)}

Remember: Only translate text values, keep all keys and structure exactly the same.`;
  }

  /**
   * Call Groq API
   */
  private async callGroqAPI(
    prompt: string,
    model: string = 'llama-3.3-70b-versatile',
    requestId: string,
  ): Promise<string> {
    if (!this.groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    try {
      const response = await lastValueFrom(
        this.httpService.post(
          this.groqApiUrl,
          {
            messages: [{ role: 'user', content: prompt }],
            model: model,
            temperature: 0.2,
            max_tokens: 16000,
            top_p: 0.9,
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              'Authorization': `Bearer ${this.groqApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 60000,
          }
        )
      );

      this.logger.log(`[${requestId}] Groq API call successful`);
      return response.data.choices[0]?.message?.content || '';
    } catch (error: any) {
      this.logger.error(`[${requestId}] Groq API error:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAIAPI(
    prompt: string,
    model: string = 'gpt-4-turbo-preview',
    requestId: string,
  ): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    try {
      const response = await lastValueFrom(
        this.httpService.post(
          this.openaiApiUrl,
          {
            messages: [{ role: 'user', content: prompt }],
            model: model,
            temperature: 0.2,
            max_tokens: 16000,
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 60000,
          }
        )
      );

      this.logger.log(`[${requestId}] OpenAI API call successful`);
      return response.data.choices[0]?.message?.content || '';
    } catch (error: any) {
      this.logger.error(`[${requestId}] OpenAI API error:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Validate translation structure
   */
  private validateTranslation(original: any, translated: any): void {
    // Check top-level structure
    const originalKeys = Object.keys(original).sort();
    const translatedKeys = Object.keys(translated).sort();
    
    if (JSON.stringify(originalKeys) !== JSON.stringify(translatedKeys)) {
      throw new Error('Translation structure mismatch: top-level keys differ');
    }

    // Recursively validate structure
    this.validateObjectStructure(original, translated);
  }

  private validateObjectStructure(original: any, translated: any, path: string = ''): void {
    if (typeof original !== typeof translated) {
      throw new Error(`Type mismatch at ${path}: ${typeof original} vs ${typeof translated}`);
    }

    if (Array.isArray(original)) {
      if (!Array.isArray(translated) || original.length !== translated.length) {
        throw new Error(`Array mismatch at ${path}`);
      }
      
      for (let i = 0; i < original.length; i++) {
        this.validateObjectStructure(original[i], translated[i], `${path}[${i}]`);
      }
    } else if (typeof original === 'object' && original !== null) {
      const originalKeys = Object.keys(original).sort();
      const translatedKeys = Object.keys(translated).sort();
      
      if (JSON.stringify(originalKeys) !== JSON.stringify(translatedKeys)) {
        throw new Error(`Key mismatch at ${path}`);
      }
      
      for (const key of originalKeys) {
        this.validateObjectStructure(original[key], translated[key], `${path}.${key}`);
      }
    }
  }

  /**
   * Get available languages for a resume - FIXED
   */
  async getAvailableLanguages(resumeId: string): Promise<AvailableLanguage[]> {
    // Get existing translations
    const existingTranslations = await this.prisma.resumeTranslation.findMany({
      where: {
        resumeId,
        status: TranslationStatus.COMPLETED,
      },
      select: {
        language: true,
        confidence: true,
        qualityScore: true,
        updatedAt: true,
      },
    });

    const translationMap = new Map(
      existingTranslations.map(t => [t.language, t])
    );

    // Build available languages list
    const languages = this.SUPPORTED_LANGUAGES.map(lang => {
      const translation = translationMap.get(lang.code);
      
      const confidence = translation?.confidence ?? undefined;
      const qualityScore = translation?.qualityScore ?? undefined;
      
      return {
        code: lang.code,
        name: lang.name,
        nativeName: lang.nativeName,
        flag: lang.flag,
        isOriginal: lang.isOriginal || false,
        confidence: typeof confidence === 'number' ? confidence : undefined,
        qualityScore: typeof qualityScore === 'number' ? qualityScore : undefined,
        available: !!translation || lang.isOriginal,
        lastUpdated: translation?.updatedAt,
      };
    });

    return languages as AvailableLanguage[];
  }

/**
 * Translate resume and save as new copy
 */
async translateAndSaveAsCopy(
  originalResumeId: string,
  targetLanguage: string,
  newTitle?: string,
  options: TranslationOptions = {},
): Promise<SaveTranslationResult> {
  const startTime = Date.now();
  const requestId = uuidv4().substring(0, 8);
  
  this.logger.log(`[${requestId}] Translating and saving as copy: ${originalResumeId} -> ${targetLanguage}`);

  try {
    // Validate language
    if (!this.isLanguageSupported(targetLanguage)) {
      throw new Error(`Language "${targetLanguage}" is not supported`);
    }

    // Get original resume - include metadata
    const originalResume = await this.prisma.resume.findUnique({
      where: { id: originalResumeId },
    });

    if (!originalResume) {
      throw new Error(`Resume ${originalResumeId} not found`);
    }

    // Perform translation
    const translationResult = await this.translateResume(
      originalResumeId,
      targetLanguage,
      options
    );

    // Get language name
    const languageInfo = this.SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage);
    const languageName = languageInfo?.name || targetLanguage.toUpperCase();

    // Generate new title with language indicator
    const finalTitle = newTitle || `${originalResume.title} (${languageName})`;

    // Generate unique slug
    const baseSlug = originalResume.slug.replace(/-\w{2}$/, ''); // Remove existing language suffix if any
    const newSlug = `${baseSlug}-${targetLanguage.toLowerCase()}`;
    
    // Check if slug exists - FIXED: Use userId with slug or generate a unique query
    // Option 1: Check by userId and slug combination
    const existingSlug = await this.prisma.resume.findFirst({
      where: {
        userId: originalResume.userId,
        slug: newSlug,
      },
    });

    let finalSlug = newSlug;
    if (existingSlug) {
      // Add timestamp to make it unique
      const timestamp = Date.now().toString().slice(-6);
      finalSlug = `${newSlug}-${timestamp}`;
    }

    // Parse existing metadata
    let existingMetadata = {};
    if (originalResume.metadata) {
      try {
        existingMetadata = typeof originalResume.metadata === 'string' 
          ? JSON.parse(originalResume.metadata)
          : originalResume.metadata;
      } catch (e) {
        this.logger.warn(`[${requestId}] Failed to parse existing metadata:`, e);
      }
    }

    // Create new resume record - FIXED: Use Json type for metadata
    const translatedResume = await this.prisma.resume.create({
      data: {
        title: finalTitle,
        slug: finalSlug,
        data: translationResult.data as any,
        userId: originalResume.userId,
        visibility: originalResume.visibility,
        locked: originalResume.locked,
        // Store translation metadata as Json
        metadata: {
          ...existingMetadata,
          originalResumeId,
          translatedFrom: originalResumeId,
          translationLanguage: targetLanguage,
          translationConfidence: translationResult.confidence,
          translationDate: new Date().toISOString(),
          translationModel: options.aiModel || this.getPreferredModel(),
          isTranslation: true,
          needsReview: translationResult.needsReview,
        } as any, // Cast to Json type
      },
    });

    // Record the translation relationship
    await this.prisma.resumeTranslationRecord.create({
      data: {
        originalResumeId,
        translatedResumeId: translatedResume.id,
        language: targetLanguage,
        confidence: translationResult.confidence,
        needsReview: translationResult.needsReview,
        aiModel: options.aiModel || this.getPreferredModel(),
        totalTokens: translationResult.totalTokens,
      },
    });

    const duration = Date.now() - startTime;
    this.logger.log(`[${requestId}] Translation and save completed in ${duration}ms`);

    return {
      success: true,
      translatedResume,
      translation: {
        confidence: translationResult.confidence,
        needsReview: translationResult.needsReview,
        language: targetLanguage,
        languageName,
      },
    };

  } catch (error) {
    this.logger.error(`[${requestId}] Translation and save failed:`, error);
    throw error;
  }
}

/**
 * Get translated copies for a resume - FIXED: Remove metadata if not needed
 */
async getTranslatedCopies(resumeId: string) {
  return this.prisma.resumeTranslationRecord.findMany({
    where: { originalResumeId: resumeId },
    include: {
      translatedResume: {
        select: {
          id: true,
          title: true,
          slug: true,
          updatedAt: true,
          visibility: true,
          // Remove metadata if you don't need it in the response
          // metadata: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get original resume for a translation
 */
async getOriginalResume(translatedResumeId: string) {
  const record = await this.prisma.resumeTranslationRecord.findUnique({
    where: { translatedResumeId },
    include: {
      originalResume: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });

  return record?.originalResume;
}

  /**
   * Get specific translation
   */
  async getTranslation(resumeId: string, language: string) {
    const translation = await this.prisma.resumeTranslation.findUnique({
      where: { resumeId_language: { resumeId, language } },
    });

    if (translation && translation.status === TranslationStatus.COMPLETED) {
      // Update access stats
      await this.prisma.resumeTranslation.update({
        where: { id: translation.id },
        data: { lastAccessed: new Date() },
      });
    }

    return translation;
  }

  /**
   * Translate multiple resumes
   */
  async translateMultiple(
    resumeIds: string[],
    targetLanguage: string,
    options?: TranslationOptions,
  ) {
    const results = [];
    
    for (const resumeId of resumeIds) {
      try {
        const result = await this.translateResume(resumeId, targetLanguage, options);
        results.push({
          resumeId,
          success: true,
          confidence: result.confidence,
          needsReview: result.needsReview,
        });
      } catch (error) {
        results.push({
          resumeId,
          success: false,
          error: (error as Error).message,
        });
      }
    }
    
    return results;
  }

  /**
   * Retry failed translations
   */
  async retryFailedTranslations(resumeId?: string) {
    const where: Prisma.ResumeTranslationWhereInput = {
      status: TranslationStatus.FAILED,
      attemptCount: { lt: 3 }, // Max 3 attempts
    };
    
    if (resumeId) {
      where.resumeId = resumeId;
    }

    const failedTranslations = await this.prisma.resumeTranslation.findMany({
      where,
      include: {
        resume: {
          select: { data: true },
        },
      },
    });

    const results = [];
    
    for (const translation of failedTranslations) {
      try {
        await this.translateResume(
          translation.resumeId,
          translation.language,
          { force: true }
        );
        
        results.push({
          resumeId: translation.resumeId,
          language: translation.language,
          success: true,
        });
      } catch (error) {
        results.push({
          resumeId: translation.resumeId,
          language: translation.language,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return results;
  }

  /**
   * Get translation statistics
   */
  async getStatistics() {
    const [
      totalTranslations,
      completedTranslations,
      failedTranslations,
      pendingTranslations,
      totalTokens,
      topLanguages,
    ] = await Promise.all([
      this.prisma.resumeTranslation.count(),
      this.prisma.resumeTranslation.count({ where: { status: TranslationStatus.COMPLETED } }),
      this.prisma.resumeTranslation.count({ where: { status: TranslationStatus.FAILED } }),
      this.prisma.resumeTranslation.count({ where: { status: TranslationStatus.PENDING } }),
      this.prisma.resumeTranslation.aggregate({
        _sum: { totalTokens: true },
        where: { totalTokens: { not: null } },
      }),
      this.prisma.resumeTranslation.groupBy({
        by: ['language'],
        _count: { _all: true },
        where: { status: TranslationStatus.COMPLETED },
        orderBy: { _count: { language: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalTranslations,
      completedTranslations,
      failedTranslations,
      pendingTranslations,
      successRate: totalTranslations > 0 
        ? (completedTranslations / totalTranslations) * 100 
        : 0,
      totalTokens: totalTokens._sum.totalTokens || 0,
      topLanguages: topLanguages.map(lang => ({
        language: lang.language,
        count: lang._count._all,
      })),
    };
  }

  /**
   * Cleanup old jobs and failed translations - FIXED
   */
  async cleanupOldJobs(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const [deletedJobs, deletedTranslations] = await Promise.all([
      this.prisma.resumeTranslationJob.deleteMany({
        where: {
          OR: [
            { status: TranslationStatus.FAILED, updatedAt: { lt: cutoffDate } },
            { status: TranslationStatus.COMPLETED, updatedAt: { lt: cutoffDate } },
          ],
        },
      }),
      this.prisma.resumeTranslation.deleteMany({
        where: {
          status: TranslationStatus.FAILED,
          updatedAt: { lt: cutoffDate },
          attemptCount: { gte: 3 }, // Only delete after max attempts
        },
      }),
    ]);

    return {
      deletedJobs: deletedJobs.count,
      deletedTranslations: deletedTranslations.count,
      total: deletedJobs.count + deletedTranslations.count,
    };
  }

  /**
   * Helper methods
   */
  private isLanguageSupported(language: string): boolean {
    return this.SUPPORTED_LANGUAGES.some(l => l.code === language);
  }

  private getPreferredModel(): string {
    if (this.groqApiKey) return 'llama-3.3-70b-versatile';
    if (this.openaiApiKey) return 'gpt-4-turbo-preview';
    throw new Error('No AI API key configured');
  }

  private getCacheKey(resumeId: string, language: string): string {
    return `${resumeId}:${language}`;
  }

  private calculateQualityScore(confidence: number): number {
    // Convert 0-1 confidence to 1-5 score
    return Math.min(5, Math.max(1, Math.ceil(confidence * 5)));
  }

  private generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}