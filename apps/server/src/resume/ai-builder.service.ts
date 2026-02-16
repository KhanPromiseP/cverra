import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from "nestjs-prisma";
import { AIBuilderSource, AIBuilderStatus } from '@prisma/client';
import { lastValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';


export interface AIBuilderResult {
  success: boolean;
  resumeData: any;
  confidence: number;
  needsReview: boolean;
  totalTokens?: number;
  cost: number;
  originalText?: string;
  extractedSections?: {
    basics: boolean;
    work: boolean;
    education: boolean;
    skills: boolean;
    projects: boolean;
    languages: boolean;
    certifications: boolean;
    awards: boolean;
    volunteer: boolean;
    publications: boolean;
    interests: boolean;
    references: boolean;
    profiles: boolean;
    customSections: number;
  };
  analysis?: {
    summaryQuality: string;
    sectionsFound: string[];
    missingInformation: string[];
    suggestions: string[];
    targetRoles: string[];
    strengths: string[];
    areasForImprovement: string[];
    recommendedTemplate: string;
  };
}

export interface AIBuilderOptions {
  source: AIBuilderSource;
  aiModel?: string;
  enhanceWithAI?: boolean;
  includeSuggestions?: boolean;
  targetTemplate?: string;
  metadata?: Record<string, any>;
}

export interface TextExtractionResult {
  text: string;
  format: 'markdown' | 'plain' | 'structured';
  confidence: number;
}

@Injectable()
export class AIResumeBuilderService implements OnModuleInit {
  private readonly logger = new Logger(AIResumeBuilderService.name);
  private readonly groqApiKey: string;
  private readonly openaiApiKey: string;
  private readonly groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly openaiApiUrl = 'https://api.openai.com/v1/chat/completions';
  

  // default avatar - using a data URL with a simple SVG
  private readonly DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'128\' height=\'128\' viewBox=\'0 0 128 128\'%3E%3Crect width=\'128\' height=\'128\' fill=\'%233b82f6\'/%3E%3Ccircle cx=\'64\' cy=\'48\' r=\'24\' fill=\'%23ffffff\'/%3E%3Ccircle cx=\'48\' cy=\'42\' r=\'4\' fill=\'%23333\'/%3E%3Ccircle cx=\'80\' cy=\'42\' r=\'4\' fill=\'%23333\'/%3E%3Cpath d=\'M48 64 Q64 80 80 64\' stroke=\'%23ffffff\' stroke-width=\'4\' fill=\'none\'/%3E%3C/svg%3E';

  // Cost configuration
  private readonly COSTS = {
    TEXT_EXTRACTION: 0,
    AI_BUILDING: 30,
    PDF_PROCESSING: 0,
    DOC_PROCESSING: 0,
    // ENHANCEMENT: 0,
    // SUGGESTIONS: 0,
  };

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
   * Main AI Resume Builder method
   */
  async buildResumeFromSource(
    userId: string,
    sourceData: string | Buffer,
    options: AIBuilderOptions,
  ): Promise<AIBuilderResult> {
    const startTime = Date.now();
    const requestId = uuidv4().substring(0, 8);
    
    this.logger.log(`[${requestId}] Starting AI resume building for user ${userId}`);

    try {
      let extractedText: string;
      let textExtractionResult: TextExtractionResult;
      let processingCost = this.COSTS.TEXT_EXTRACTION;

      // Extract text based on source type
      switch (options.source) {
        case AIBuilderSource.TEXT:
          extractedText = sourceData as string;
          textExtractionResult = {
            text: extractedText,
            format: this.detectTextFormat(extractedText),
            confidence: 0.95,
          };
          break;

        case AIBuilderSource.PDF:
          processingCost += this.COSTS.PDF_PROCESSING;
          textExtractionResult = await this.extractTextFromPDF(sourceData as Buffer, requestId);
          extractedText = textExtractionResult.text;
          break;

        case AIBuilderSource.DOC:
          processingCost += this.COSTS.DOC_PROCESSING;
          textExtractionResult = await this.extractTextFromDOC(sourceData as Buffer, requestId);
          extractedText = textExtractionResult.text;
          break;

        case AIBuilderSource.LINKEDIN:
          textExtractionResult = await this.extractFromLinkedIn(sourceData as string, requestId);
          extractedText = textExtractionResult.text;
          break;

        default:
          throw new Error(`Unsupported source type: ${options.source}`);
      }

      if (!extractedText.trim()) {
        throw new Error('No text could be extracted from the source');
      }

      // AI Resume Building cost
      const aiCost = this.COSTS.AI_BUILDING
                    // (options.enhanceWithAI ? this.COSTS.ENHANCEMENT : 0) +
                    // (options.includeSuggestions ? this.COSTS.SUGGESTIONS : 0);
      
      const totalCost = processingCost + aiCost;

      this.logger.log(`[${requestId}] Extracted text (${extractedText.length} chars), building with AI...`);

      // Build resume with AI
      const aiResult = await this.buildResumeWithAI(
        extractedText,
        options,
        textExtractionResult.format,
        requestId,
      );

      // Create job record
      await this.prisma.resumeBuilderJob.create({
        data: {
          userId,
          requestId,
          sourceType: options.source,
          textLength: extractedText.length,
          aiModel: options.aiModel || this.getPreferredModel(),
          cost: totalCost,
          status: AIBuilderStatus.COMPLETED,
          completedAt: new Date(),
          metadata: {
            ...(options.metadata || {}),
            processingTime: Date.now() - startTime,
            extractionConfidence: textExtractionResult.confidence,
          } as any,
        },
      });

      const duration = Date.now() - startTime;
      this.logger.log(`[${requestId}] AI Resume building completed in ${duration}ms, cost: ${totalCost} coins`);

      return {
        success: true,
        resumeData: aiResult.resumeData,
        confidence: aiResult.confidence,
        needsReview: aiResult.needsReview,
        totalTokens: aiResult.totalTokens,
        cost: totalCost,
        originalText: extractedText,
        extractedSections: aiResult.extractedSections,
      };



      

    } catch (error) {
      this.logger.error(`[${requestId}] AI Resume building failed:`, error);
      
      // Record failed job
      try {
        await this.prisma.resumeBuilderJob.create({
          data: {
            userId,
            requestId,
            sourceType: options.source,
            status: AIBuilderStatus.FAILED,
            errorMessage: (error as Error).message.substring(0, 500),
            cost: 0,
            metadata: {
              errorStack: (error as Error).stack?.substring(0, 1000),
            } as any,
          },
        });
      } catch (prismaError) {
        this.logger.error(`[${requestId}] Failed to record job failure:`, prismaError);
      }

      throw error;
    }
  }



   
  /**
   * Build resume using AI with intelligent extraction
   */
  private async buildResumeWithAI(
  text: string,
  options: AIBuilderOptions,
  format: string,
  requestId: string,
): Promise<{
  resumeData: any;
  confidence: number;
  needsReview: boolean;
  totalTokens?: number;
  extractedSections: any;
}> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      this.logger.log(`[${requestId}] AI building attempt ${attempt}/${maxRetries}`);

      const prompt = this.buildIntelligentExtractionPrompt(text, options, format);
      const aiModel = options.aiModel || this.getPreferredModel();
      
      let apiResponse;
      
      if (aiModel.includes('groq') || aiModel.includes('llama') || aiModel.includes('mixtral')) {
        apiResponse = await this.callGroqAPI(prompt, aiModel, requestId);
      } else if (aiModel.includes('gpt')) {
        apiResponse = await this.callOpenAIAPI(prompt, aiModel, requestId);
      } else {
        apiResponse = await this.callGroqAPI(prompt, this.getPreferredModel(), requestId);
      }

      // LOG THE RAW RESPONSE
      console.log(`[${requestId}] Raw AI Response (first 500 chars):`, apiResponse.substring(0, 500));
      
      // Parse and fix response
      const parsedResponse = this.parseAIResponse(apiResponse, requestId);
      
      // LOG THE PARSED RESPONSE
      console.log(`[${requestId}] Parsed response sections:`, {
        hasResumeData: !!parsedResponse.resumeData,
        hasSections: !!parsedResponse.resumeData?.sections,
        sectionTypes: parsedResponse.resumeData?.sections ? 
          Object.entries(parsedResponse.resumeData.sections).map(([key, value]) => ({
            key,
            type: Array.isArray(value) ? 'ARRAY' : typeof value
          })) : []
      });
      
      // Convert extracted data to exact schema format
      const resumeData = this.createExactSchemaFromExtractedData(parsedResponse, options);
      
      // CRITICAL: Validate the FINAL structure
      console.log(`[${requestId}] Final structure validation:`);
      this.validateStructure(resumeData, requestId);
      
      // Validate and complete structure
      this.validateAndCompleteResumeStructure(resumeData);

      const confidence = Math.min(Math.max(parsedResponse.confidence || 0.85, 0), 1);
      const needsReview = parsedResponse.needsReview !== undefined ? parsedResponse.needsReview : true;
      const totalTokens = parsedResponse.usage?.total_tokens;
      
      // Generate extracted sections report
      const extractedSections = {
        basics: !!resumeData.basics?.name,
        work: resumeData.sections?.experience?.items?.length > 0,
        education: resumeData.sections?.education?.items?.length > 0,
        skills: resumeData.sections?.skills?.items?.length > 0,
        projects: resumeData.sections?.projects?.items?.length > 0,
      };

      return {
        resumeData,
        confidence,
        needsReview,
        totalTokens,
        extractedSections,
      };

    } catch (error) {
      lastError = error as Error;
      this.logger.warn(`[${requestId}] Attempt ${attempt} failed: ${error.message}`);
      
      // Log the full error for debugging
      console.error(`[${requestId}] Full error:`, error);
      
      if (attempt < maxRetries) {
        await this.sleep(1000 * Math.pow(2, attempt - 1));
        continue;
      }
    }
  }

  throw new Error(`AI resume building failed after ${maxRetries} attempts: ${lastError?.message}`);
}

private validateStructure(data: any, requestId: string): void {
  if (!data) {
    console.error(`[${requestId}] Data is null!`);
    return;
  }
  
  if (!data.sections) {
    console.error(`[${requestId}] No sections object!`);
    return;
  }
  
  const criticalSections = ['education', 'experience', 'skills', 'projects'];
  
  criticalSections.forEach(section => {
    const sectionData = data.sections[section];
    if (Array.isArray(sectionData)) {
      console.error(`[${requestId}] ❌ CRITICAL: ${section} is still an array!`);
    } else if (sectionData && typeof sectionData === 'object') {
      console.log(`[${requestId}] ✅ ${section} is an object`);
      if (!Array.isArray(sectionData.items)) {
        console.error(`[${requestId}] ❌ ${section}.items is not an array`);
      }
    } else {
      console.error(`[${requestId}] ❌ ${section} is missing or invalid`);
    }
  });
}

 // Language detection patterns
  private readonly languagePatterns = {
    'French': {
      words: ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'est', 'et', 'à', 'au', 'aux', 'dans', 'pour', 'que', 'qui', 'ce', 'cette', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'avec', 'son', 'sa', 'ses'],
      threshold: 0.08,
      commonPhrases: ['expérience professionnelle', 'compétences', 'formation', 'langues', 'projets', 'références']
    },
    'English': {
      words: ['the', 'and', 'to', 'of', 'a', 'in', 'is', 'it', 'you', 'that', 'for', 'on', 'with', 'as', 'be', 'this', 'by', 'from', 'at', 'or', 'an', 'but', 'not', 'are', 'was', 'we', 'they', 'have', 'has'],
      threshold: 0.08,
      commonPhrases: ['professional experience', 'skills', 'education', 'languages', 'projects', 'references']
    },
    'Spanish': {
      words: ['el', 'la', 'los', 'las', 'de', 'y', 'en', 'que', 'por', 'con', 'para', 'como', 'pero', 'más', 'todo', 'este', 'esta', 'eso', 'esa', 'un', 'una', 'unos', 'unas', 'lo', 'le', 'se', 'me', 'te'],
      threshold: 0.08,
      commonPhrases: ['experiencia profesional', 'habilidades', 'educación', 'idiomas', 'proyectos', 'referencias']
    },
    'German': {
      words: ['der', 'die', 'das', 'und', 'oder', 'zu', 'von', 'mit', 'auf', 'für', 'ist', 'sind', 'nicht', 'ein', 'eine', 'auch', 'als', 'wie', 'im', 'am', 'um', 'aus', 'bei', 'nach', 'über'],
      threshold: 0.08,
      commonPhrases: ['berufserfahrung', 'fähigkeiten', 'bildung', 'sprachen', 'projekte', 'referenzen']
    },
    'Italian': {
      words: ['il', 'la', 'lo', 'i', 'gli', 'le', 'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'è', 'sono', 'che', 'non', 'si', 'una', 'uno', 'del', 'della', 'dei', 'delle'],
      threshold: 0.08,
      commonPhrases: ['esperienza professionale', 'competenze', 'istruzione', 'lingue', 'progetti', 'referenze']
    },
    'Portuguese': {
      words: ['o', 'a', 'os', 'as', 'de', 'do', 'da', 'em', 'no', 'na', 'por', 'para', 'com', 'como', 'que', 'se', 'não', 'mais', 'um', 'uma', 'uns', 'umas', 'este', 'esta', 'isso'],
      threshold: 0.08,
      commonPhrases: ['experiência profissional', 'habilidades', 'educação', 'idiomas', 'projetos', 'referências']
    }
  };

  private detectPrimaryLanguage(text: string): string {
    if (!text || text.trim().length < 50) {
      return 'English'; // Default for very short texts
    }

    // Prepare text for analysis
    const cleanText = text.toLowerCase()
      .replace(/[^\p{L}\s]/gu, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    const words = cleanText.split(/\s+/).filter(word => word.length > 1);
    
    if (words.length < 20) {
      return 'English'; // Not enough content for reliable detection
    }

    const scores: Record<string, { wordScore: number, phraseScore: number, total: number }> = {};

    // Calculate scores for each language
    for (const [language, patterns] of Object.entries(this.languagePatterns)) {
      let wordMatches = 0;
      let phraseMatches = 0;
      
      // Count word matches
      for (const word of patterns.words) {
        if (words.includes(word)) {
          wordMatches++;
        }
      }
      
      // Count phrase matches (strong indicator)
      for (const phrase of patterns.commonPhrases) {
        if (cleanText.includes(phrase)) {
          phraseMatches++;
        }
      }
      
      const wordScore = wordMatches / patterns.words.length;
      const phraseScore = phraseMatches / patterns.commonPhrases.length;
      const totalScore = (wordScore * 0.7) + (phraseScore * 0.3); // Weighted score
      
      scores[language] = {
        wordScore,
        phraseScore,
        total: totalScore
      };
    }

    // Find best match
    let bestLanguage = 'English';
    let highestScore = 0;
    
  for (const [language, score] of Object.entries(scores)) {
    if (score.total > highestScore && score.total > this.languagePatterns[language as keyof typeof this.languagePatterns].threshold) {
      highestScore = score.total;
      bestLanguage = language;
    }
  }

    // Log detection for debugging
    console.log(`Language detection results:`, Object.entries(scores)
      .map(([lang, score]) => `${lang}: ${(score.total * 100).toFixed(1)}%`)
      .join(', '));
    
    console.log(`Selected language: ${bestLanguage} (confidence: ${(highestScore * 100).toFixed(1)}%)`);
    
    return bestLanguage;
  }

  /**
   * Intelligent extraction prompt for AI
   */
  private buildIntelligentExtractionPrompt(
    text: string,
    options: AIBuilderOptions,
    format: string,
  ): string {
    const detectedLanguage = this.detectPrimaryLanguage(text);
    
    // Get language-specific section names
    const sectionNames = this.getLocalizedSectionNames(detectedLanguage);
    
    
 
  
  return `You are a world-class professional resume analyst with 20+ years of experience. 
  Analyze this text and extract ALL relevant information to create the BEST possible resume.


     
  CRITICAL LANGUAGE REQUIREMENT:
  1. The entire output MUST be in ${detectedLanguage} language only.
  2. Do NOT mix languages, translate words, or use any other language.
  3. All field names, labels, summaries, and content MUST be in ${detectedLanguage}.
  4. If the input text has mixed languages, use ONLY ${detectedLanguage} for output.
  5. Maintain professional terminology appropriate for ${detectedLanguage} resumes.
  
  LOCALIZED SECTION NAMES (use these in output):
  ${Object.entries(sectionNames).map(([key, name]) => `- ${key}: ${name}`).join('\n    ')}
  
  SOURCE-AWARE EXTRACTION RULES
  1. The input text may be narrative, paragraph-based, or unstructured.
  2. Extract information ONLY when it is clearly and explicitly stated.
  3. Do NOT promote descriptive sentences into achievements.
  4. If information cannot be cleanly mapped to a field, leave it empty.
  5. Preserve meaning and intent in ${detectedLanguage}.


  SOURCE-AWARE EXTRACTION RULES

1. The input text may be narrative, paragraph-based, or unstructured (e.g., pasted PDFs, biographies).
2. Extract information ONLY when it is clearly and explicitly stated, even if embedded in paragraphs.
3. Do NOT require headings, bullet points, or labels to recognize valid information.
4. Do NOT promote descriptive sentences into achievements unless they are explicite enough.
5. If information cannot be cleanly mapped to a field, do NOT force it — leave the field empty.
6. Preserve meaning and intent; do not rewrite to sound more professional.
7. Treat descriptive paragraphs as CONTEXT, not FACTS, unless explicitly factual.

  STRUCTURING & CUSTOM SECTION CONTROL

1. Attempt to map extracted information to standard sections FIRST.
2. Create a custom section ONLY when:
   a) The text explicitly names a section, OR
   b) Multiple related items exist that clearly do not fit any standard section.
3. Do NOT create custom sections from general descriptions or interests.
4. Use EXACT wording from the source text for section names.
5. Each custom section must include:
   - sourceText that triggered it
   - a confidence score based on clarity
6. If the section intent is broad or philosophical, do NOT create a section.

  CRITICAL: Return ONLY a JSON object with this EXACT structure:
  {
    "extractedData": {
      "personal": {
        "name": "string or empty - ONLY if explicitly stated",
        "email": "string or empty - ONLY if explicitly stated", 
        "phone": "string or empty - ONLY if explicitly stated",
        "location": "string or empty - ONLY if explicitly stated",
        "headline": "string or empty - ONLY if explicitly stated",
        "summary": "string or empty - ONLY if explicitly stated",
        "website": "string or empty - ONLY if explicitly stated",
        "linkedin": "string or empty - ONLY if explicitly stated",
        "github": "string or empty - ONLY if explicitly stated"
      },
      "experience": [
        {
          "company": "string - ONLY if explicitly stated",
          "position": "string - ONLY if explicitly stated",
          "startDate": "string or empty - ONLY if explicitly stated",
          "endDate": "string or empty - ONLY if explicitly stated",
          "location": "string or empty - ONLY if explicitly stated",
          "description": "string or empty - ONLY if explicitly stated",
          "achievements": ["string"] - ONLY achievements explicitly listed as bullet points
        }
      ],
      "education": [
        {
          "institution": "string - ONLY if explicitly stated", 
          "degree": "string or empty - ONLY if explicitly stated",
          "fieldOfStudy": "string or empty - ONLY if explicitly stated",
          "startDate": "string or empty - ONLY if explicitly stated",
          "endDate": "string or empty - ONLY if explicitly stated",
          "location": "string or empty - ONLY if explicitly stated",
          "gpa": "string or empty - ONLY if explicitly stated"
        }
      ],
      "skills": ["string"] - ONLY skills explicitly mentioned
      "projects": [
        {
          "name": "string - ONLY if explicitly stated",
          "description": "string or empty - ONLY if explicitly stated",
          "technologies": ["string"] - ONLY technologies explicitly mentioned
        }
      ],
      "languages": [
        {
          "name": "string - ONLY if explicitly stated",
          "level": "string or empty - ONLY if explicitly stated"
        }
      ],
      "certifications": [
        {
          "name": "string - ONLY if explicitly stated",
          "issuer": "string or empty - ONLY if explicitly stated",
          "date": "string or empty - ONLY if explicitly stated"
        }
      ],
      "awards": [
        {
          "name": "string - ONLY if explicitly stated",
          "issuer": "string or empty - ONLY if explicitly stated",
          "date": "string or empty - ONLY if explicitly stated"
        }
      ],
      "volunteer": [
        {
          "organization": "string - ONLY if explicitly stated",
          "position": "string or empty - ONLY if explicitly stated",
          "description": "string or empty - ONLY if explicitly stated"
        }
      ],
      "publications": [
        {
          "title": "string - ONLY if explicitly stated",
          "publisher": "string or empty - ONLY if explicitly stated",
          "date": "string or empty - ONLY if explicitly stated"
        }
      ],
      "interests": ["string"] - ONLY interests explicitly mentioned
      "profiles": [
        {
          "network": "string - ONLY if explicitly stated",
          "username": "string - ONLY if explicitly stated",
          "url": "string - ONLY if explicitly stated and must start with https:// and if not present, make sure to include it"
        }
      ],
      "customSections": [
        {
          "sectionName": "string - EXACT wording found in text",
          "confidence": "number between 0 and 1 indicating clarity of section",
          "sourceText": "string - exact snippet that triggered this section",
          "items": [
            {
              "title": "string",
              "description": "string or empty",
              "date": "string or empty",
              "details": ["string"]
            }
          ]
        }
      ]
    },
    "analysis": {
        "summaryQuality": "string in ${detectedLanguage}",
        "sectionsFound": ["string in ${detectedLanguage}"],
        "missingInformation": ["string in ${detectedLanguage}"],
        "suggestions": ["string in ${detectedLanguage}"],
        "confidence": "number",
        "recommendedTemplate": "string",
        "targetRoles": ["string in ${detectedLanguage}"],
        "strengths": ["string in ${detectedLanguage}"],
        "areasForImprovement": ["string in ${detectedLanguage}"],
        "detectedLanguage": "${detectedLanguage}"
      }
    }

  LINGUISTIC CONSISTENCY ENFORCEMENT:
  1. ALL field values, section names, and analysis content MUST be in ${detectedLanguage}.
  2. Do NOT translate any content to another language.
  3. Preserve the original terminology and phrasing style of the input text.
  4. If generating summaries or descriptions, use ${detectedLanguage} professional terminology.
  5. Section names like "Experience", "Education", etc. should be in ${detectedLanguage} equivalents.

  TEXT TO ANALYZE:
  ${text.substring(0, 6000)} ${text.length > 6000 ? '...[text truncated]' : ''}

  ANALYSIS & SUMMARY SYNTHESIS RULES

  1. analysis may reason ONLY over extractedData and high-confidence narrative patterns.
  2. analysis must NEVER add, modify, or backfill extractedData fields.
  3. Synthesis is allowed: combine related extracted facts to form higher-level insights.
  4. Do NOT invent roles, companies, dates, achievements, or metrics.
  5. Experience duration may be estimated ONLY when explicit dates exist.
  6. Career direction and target roles must be phrased as suggestions, not factual claims.
  7. A professional summary MAY be generated even if none exists in the source text.
  8. The generated summary must:
     a) Be fully grounded in extractedData
     b) Avoid exaggeration or seniority inflation
     c) Reflect the user's dominant skills, interests, and working style
     d) Use professional, ATS-friendly language in ${detectedLanguage}
     e) Be medium-length (not short, not verbose)
  9. The summary must be clearly marked as AI-generated.
  10. Confidence reflects data completeness and clarity, not writing quality alone.

  ATS & PROFESSIONAL QUALITY RULES

  1. Output must be ATS-safe, clear, and professionally neutral.
  2. Never exaggerate seniority, scope, or ownership.
  3. Never convert learning, interest, or exposure into expertise.
  4. Prefer omission over assumption.
  5. Avoid buzzwords unless they appear in the source text.
  6. Language must reflect credibility, not marketing.
  7. Resume must look believable in real hiring pipelines.

  Date Rule: If only a single date or year is provided, display it exactly as given and never convert it into a date range or add words like “to”, “from”, “–”, or “present”.


  IMPORTANT: Return ONLY the JSON object. No explanations, no markdown, no extra text.`;
}


  private getLocalizedSectionNames(language: string): Record<string, string> {
    const localizations: Record<string, Record<string, string>> = {
      'French': {
        'summary': 'Résumé',
        'experience': 'Expérience Professionnelle',
        'education': 'Éducation',
        'skills': 'Compétences',
        'projects': 'Projets',
        'languages': 'Langues',
        'certifications': 'Certifications',
        'awards': 'Récompenses',
        'volunteer': 'Bénévolat',
        'publications': 'Publications',
        'interests': 'Centres d\'intérêt',
        'references': 'Références',
        'profiles': 'Profils'
      },
      'English': {
        'summary': 'Summary',
        'experience': 'Professional Experience',
        'education': 'Education',
        'skills': 'Skills',
        'projects': 'Projects',
        'languages': 'Languages',
        'certifications': 'Certifications',
        'awards': 'Awards',
        'volunteer': 'Volunteering',
        'publications': 'Publications',
        'interests': 'Interests',
        'references': 'References',
        'profiles': 'Profiles'
      },
      'Spanish': {
        'summary': 'Resumen',
        'experience': 'Experiencia Profesional',
        'education': 'Educación',
        'skills': 'Habilidades',
        'projects': 'Proyectos',
        'languages': 'Idiomas',
        'certifications': 'Certificaciones',
        'awards': 'Premios',
        'volunteer': 'Voluntariado',
        'publications': 'Publicaciones',
        'interests': 'Intereses',
        'references': 'Referencias',
        'profiles': 'Perfiles'
      },
      'German': {
        'summary': 'Zusammenfassung',
        'experience': 'Berufserfahrung',
        'education': 'Bildung',
        'skills': 'Fähigkeiten',
        'projects': 'Projekte',
        'languages': 'Sprachen',
        'certifications': 'Zertifizierungen',
        'awards': 'Auszeichnungen',
        'volunteer': 'Ehrenamt',
        'publications': 'Veröffentlichungen',
        'interests': 'Interessen',
        'references': 'Referenzen',
        'profiles': 'Profile'
      },
      'Italian': {
        'summary': 'Riepilogo',
        'experience': 'Esperienza Professionale',
        'education': 'Istruzione',
        'skills': 'Competenze',
        'projects': 'Progetti',
        'languages': 'Lingue',
        'certifications': 'Certificazioni',
        'awards': 'Premi',
        'volunteer': 'Volontariato',
        'publications': 'Pubblicazioni',
        'interests': 'Interessi',
        'references': 'Referenze',
        'profiles': 'Profili'
      },
      'Portuguese': {
        'summary': 'Resumo',
        'experience': 'Experiência Profissional',
        'education': 'Educação',
        'skills': 'Habilidades',
        'projects': 'Projetos',
        'languages': 'Idiomas',
        'certifications': 'Certificações',
        'awards': 'Prêmios',
        'volunteer': 'Voluntariado',
        'publications': 'Publicações',
        'interests': 'Interesses',
        'references': 'Referências',
        'profiles': 'Perfis'
      }
    };

    return localizations[language] || localizations['English'];
  }


  /**
   * Get sample resume schema (matching your exact structure)
   */
  private getSampleResumeSchema(): any {
  return {
    basics: {
      name: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      url: {
        label: "",
        href: ""
      },
      customFields: [],
      picture: {
        url: this.DEFAULT_AVATAR,
        size: 128,
        aspectRatio: 1,
        borderRadius: 0,
        effects: {
          hidden: false,
          border: false,
          grayscale: false
        }
      }
    },
    sections: {
      summary: {
        name: "Summary",
        columns: 1,
        separateLinks: true,
        visible: true,
        id: "summary",
        content: "<p>Professional summary based on experience.</p>"
      },
      awards: {
        name: "Awards",
        columns: 1,
        separateLinks: true,
        visible: false,
        id: "awards",
        items: []
      },
      certifications: {
        name: "Certifications",
        columns: 1,
        separateLinks: true,
        visible: false,
        id: "certifications",
        items: []
      },
      education: {
        name: "Education",
        columns: 1,
        separateLinks: true,
        visible: true,
        id: "education",
        items: []
      },
      experience: {
        name: "Experience",
        columns: 1,
        separateLinks: true,
        visible: true,
        id: "experience",
        items: []
      },
      volunteer: {
        name: "Volunteering",
        columns: 1,
        separateLinks: true,
        visible: false,
        id: "volunteer",
        items: []
      },
      interests: {
        name: "Interests",
        columns: 1,
        separateLinks: true,
        visible: false,
        id: "interests",
        items: []
      },
      languages: {
        name: "Languages",
        columns: 1,
        separateLinks: true,
        visible: false,
        id: "languages",
        items: []
      },
      profiles: {
        name: "Profiles",
        columns: 1,
        separateLinks: true,
        visible: true,
        id: "profiles",
        items: []
      },
      projects: {
        name: "Projects",
        columns: 1,
        separateLinks: true,
        visible: true,
        id: "projects",
        items: []
      },
      publications: {
        name: "Publications",
        columns: 1,
        separateLinks: true,
        visible: false,
        id: "publications",
        items: []
      },
      references: {
        name: "References",
        columns: 1,
        separateLinks: true,
        visible: false,
        id: "references",
        items: []
      },
      skills: {
        name: "Skills",
        columns: 1,
        separateLinks: true,
        visible: true,
        id: "skills",
        items: []
      },
      custom: {}
    },
    metadata: {
      template: "meridian",
      layout: [
        [
          ["summary", "experience", "education", "references"],
          [
            "profiles",
            "skills",
            "certifications",
            "projects",
            "interests",
            "languages",
            "awards",
            "volunteer",
            "publications"
          ]
        ]
      ],
      css: {
        value: "",
        visible: false
      },
      page: {
        margin: 18,
        format: "a4",
        options: {
          breakLine: true,
          pageNumbers: true
        }
      },
      theme: {
        background: "#ffffff",
        text: "#000000",
        primary: "#3b82f6"
      },
      typography: {
        font: {
          family: "Inter",
          subset: "latin",
          variants: ["400", "500", "600", "700"],
          size: 13
        },
        lineHeight: 1.5,
        hideIcons: false,
        underlineLinks: true
      },
      notes: "",
      aiGenerated: true,
      aiGeneratedAt: new Date().toISOString(),
      needsReview: true,
      confidence: 0.85
    }
  };
}

  /**
   * Parse AI response
   */
  private parseAIResponse(response: string, requestId: string): any {
  try {
    let cleanedResponse = response.trim();
    
    // Remove markdown code blocks
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, '');
    cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
    cleanedResponse = cleanedResponse.trim();
    
    // Extract JSON from response
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      this.logger.error(`[${requestId}] No JSON found in response: ${cleanedResponse.substring(0, 200)}`);
      throw new Error('No JSON found in AI response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    this.logger.log(`[${requestId}] Successfully parsed AI response`);
    
    // Validate required fields
    if (!parsed.resumeData && !parsed.extractedData) {
      this.logger.warn(`[${requestId}] AI response missing required fields, creating default`);
      return {
        extractedData: {},
        resumeData: this.getSampleResumeSchema(),
        confidence: 0.7,
        needsReview: true,
        analysis: {
          summaryQuality: "Low",
          sectionsFound: ["basics"],
          missingInformation: ["experience", "education", "skills"],
          suggestions: ["Add more detailed information"]
        }
      };
    }
    
    return parsed;
    
  } catch (error) {
    this.logger.error(`[${requestId}] Failed to parse AI response:`, error);
    this.logger.error(`[${requestId}] Raw response:`, response.substring(0, 500));
    
    // Return minimal valid structure
    return {
      extractedData: {},
      resumeData: this.getSampleResumeSchema(),
      confidence: 0.5,
      needsReview: true,
      analysis: {
        summaryQuality: "Low",
        sectionsFound: ["basics"],
        missingInformation: ["experience", "education", "skills", "projects"],
        suggestions: ["The AI response could not be parsed. Please try again."]
      }
    };
  }
}


// Add this method to your AIResumeBuilderService
private createCompatibleResumeStructure(aiResponse: any, options: AIBuilderOptions): any {
  console.log('🔧 Creating compatible resume structure');
  
  const extractedData = aiResponse.extractedData || {};
  
  // Start with default structure that matches your frontend expectations
  const resumeData: any = {
    basics: {},
    sections: {},
    metadata: {
      template: "meridian",
      aiGenerated: true,
      aiGeneratedAt: new Date().toISOString(),
      needsReview: true,
      confidence: Math.min(Math.max(aiResponse.confidence || 0.85, 0), 1),
    }
  };

  // Populate basics
  if (extractedData.personal) {
    const personal = extractedData.personal;
    resumeData.basics = {
      name: personal.name || "",
      headline: personal.headline || "",
      email: personal.email || "",
      phone: personal.phone || "",
      location: personal.location || "",
      url: { label: "", href: personal.website || "" },
      picture: { url: this.DEFAULT_AVATAR, size: 128, aspectRatio: 1, borderRadius: 0 },
    };
  }

  // Populate sections as arrays (frontend expects arrays)
  if (extractedData.education && Array.isArray(extractedData.education)) {
    resumeData.sections.education = extractedData.education.map((edu: any, index: number) => ({
      id: this.generateCuid2(),
      visible: true,
      institution: edu.institution || edu.school || `Education ${index + 1}`,
      studyType: edu.studyType || edu.degree || "Degree",
      area: edu.area || edu.location || edu.fieldOfStudy || "",
      score: edu.score || edu.gpa || "",
      date: this.formatDateRange(edu.startDate, edu.endDate),
      summary: edu.summary || edu.description || "",
      url: { label: "", href: edu.website || edu.url || "" }
    }));
  }

  if (extractedData.experience && Array.isArray(extractedData.experience)) {
    resumeData.sections.experience = extractedData.experience.map((exp: any, index: number) => ({
      id: this.generateCuid2(),
      visible: true,
      company: exp.company || exp.employer || `Company ${index + 1}`,
      position: exp.position || exp.title || `Role ${index + 1}`,
      location: exp.location || exp.area || "",
      date: this.formatDateRange(exp.startDate, exp.endDate),
      summary: this.formatExperienceSummary(exp),
      url: { label: "", href: exp.website || exp.url || "" }
    }));
  }

  if (extractedData.skills && Array.isArray(extractedData.skills)) {
    resumeData.sections.skills = extractedData.skills.map((skill: any, index: number) => ({
      id: this.generateCuid2(),
      visible: true,
      name: typeof skill === 'string' ? skill : (skill.name || `Skill ${index + 1}`),
      level: typeof skill === 'object' ? (skill.level || 3) : 3,
      keywords: typeof skill === 'object' && skill.keywords ? skill.keywords : []
    }));
  }

  if (extractedData.projects && Array.isArray(extractedData.projects)) {
    resumeData.sections.projects = extractedData.projects.map((project: any, index: number) => ({
      id: this.generateCuid2(),
      visible: true,
      name: project.name || project.title || `Project ${index + 1}`,
      description: project.description || "",
      date: project.date || project.duration || "",
      summary: project.summary || "",
      url: { label: "", href: project.website || project.url || "" }
    }));
  }

  // Add summary section
  if (extractedData.personal?.summary) {
    resumeData.sections.summary = [
      {
        id: this.generateCuid2(),
        visible: true,
        content: `<p>${extractedData.personal.summary}</p>`
      }
    ];
  }

  console.log('✅ Created compatible resume structure');
  return resumeData;
}


   private createExactSchemaFromExtractedData(aiResponse: any, options: AIBuilderOptions): any {
    console.log('🔄 Building resume from AI response');
    
    const analysis = aiResponse.analysis || {};
    const detectedLanguage = analysis.detectedLanguage || 'English';
    const localizedNames = this.getLocalizedSectionNames(detectedLanguage);
    
    console.log(`Using language: ${detectedLanguage}`);
    
    // Start with EXACT sample schema
    const resumeData = this.getSampleResumeSchema();
    
    // Apply localized section names
    Object.entries(localizedNames).forEach(([key, name]) => {
      if (resumeData.sections[key]) {
        resumeData.sections[key].name = name;
      }
    });
  
  
  const extractedData = aiResponse.extractedData || {};
 
  
  console.log('Intelligent Analysis:', {
    sectionsFound: analysis.sectionsFound || [],
    recommendedTemplate: analysis.recommendedTemplate,
    confidence: analysis.confidence,
    targetRoles: analysis.targetRoles || []
  });
  
  // 1. Intelligent Basics Population
  if (extractedData.personal) {
    const personal = extractedData.personal;
    
    // Extract name intelligently
    if (personal.name) {
      const nameParts = personal.name.trim().split(' ');
      if (nameParts.length >= 2) {
        resumeData.basics.name = personal.name;
      } else {
        // Try to infer full name from other context
        resumeData.basics.name = personal.name || "Professional Candidate";
      }
    }
    
    // Intelligent headline generation
    if (personal.headline) {
      resumeData.basics.headline = personal.headline;
    } else if (extractedData.experience?.length > 0) {
      // Generate headline from most recent role
      const latestExp = extractedData.experience[0];
      const totalExp = this.calculateTotalExperience(extractedData.experience);
      const primaryRole = this.getPrimaryRole(extractedData.experience);
      resumeData.basics.headline = `${totalExp}+ Years ${primaryRole} | ${latestExp.position || "Professional"}`;
    }
    
    // Contact information
    resumeData.basics.email = personal.email || "";
    resumeData.basics.phone = personal.phone || "";
    resumeData.basics.location = personal.location || "";
    
    // Intelligent URL handling
    const urls = [];
    if (personal.website) urls.push({ label: "Portfolio", href: personal.website });
    if (personal.linkedin) urls.push({ label: "LinkedIn", href: personal.linkedin });
    if (personal.github) urls.push({ label: "GitHub", href: personal.github });
    
    if (urls.length > 0) {
      // Use first URL as primary
      resumeData.basics.url = urls[0];
      // Add others to profiles section
      extractedData.profiles = extractedData.profiles || [];
      urls.slice(1).forEach(url => {
        extractedData.profiles.push({
          network: url.label,
          username: url.label,
          url: url.href
        });
      });
    }
    
    // Generate professional summary if not provided
    if (personal.summary) {
      resumeData.sections.summary.content = `<p>${personal.summary}</p>`;
    } else {
      resumeData.sections.summary.content = `<p>${this.generateIntelligentSummary(extractedData, analysis)}</p>`;
    }
  }
  
  // 2. Intelligent Experience Population with Achievements
  if (extractedData.experience && Array.isArray(extractedData.experience)) {
    resumeData.sections.experience.items = extractedData.experience.map((exp: any, index: number) => {
      // Extract achievements and metrics
      const achievements = exp.achievements || [];
      const responsibilities = exp.responsibilities || [];
      const technologies = exp.technologies || [];
      
      let summary = "";
      
      // Prioritize achievements over responsibilities
      if (achievements.length > 0) {
        summary += "<ul>";
        achievements.slice(0, 4).forEach((achievement: string) => {
          if (achievement.trim()) {
            // Enhance achievement with metrics detection
            const enhancedAchievement = this.enhanceAchievement(achievement, technologies);
            summary += `<li><p>${enhancedAchievement}</p></li>`;
          }
        });
        summary += "</ul>";
      } else if (responsibilities.length > 0) {
        summary += "<ul>";
        responsibilities.slice(0, 3).forEach((responsibility: string) => {
          if (responsibility.trim()) {
            summary += `<li><p>${responsibility}</p></li>`;
          }
        });
        summary += "</ul>";
      } else if (exp.description) {
        summary += `<p>${exp.description}</p>`;
      }
      
      // Add technologies if mentioned
      if (technologies.length > 0) {
        summary += `<p><strong>Technologies:</strong> ${technologies.slice(0, 5).join(', ')}</p>`;
      }
      
      return {
        id: this.generateCuid2(),
        visible: true,
        company: this.safeString(exp.company || exp.employer || `Company ${index + 1}`),
        position: this.safeString(exp.position || exp.title || `Role ${index + 1}`),
        location: this.safeString(exp.location || exp.area || ""),
        date: this.formatDateRange(exp.startDate, exp.endDate),
        summary: summary,
        url: {
          label: "",
          href: this.safeString(exp.website || exp.url || "")
        }
      };
    });
    
    // Sort by date (most recent first)
    resumeData.sections.experience.items.sort((a: any, b: any) => {
      const dateA = this.parseDateForSorting(a.date);
      const dateB = this.parseDateForSorting(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    resumeData.sections.experience.visible = resumeData.sections.experience.items.length > 0;
  }
  
  // 3. Intelligent Education Population
  if (extractedData.education && Array.isArray(extractedData.education)) {
    resumeData.sections.education.items = extractedData.education.map((edu: any, index: number) => {
      let summary = "";
      
      if (edu.honors && edu.honors.length > 0) {
        summary += `<p><strong>Honors:</strong> ${edu.honors.join(', ')}</p>`;
      }
      
      if (edu.gpa) {
        summary += `<p><strong>GPA:</strong> ${edu.gpa}</p>`;
      }
      
      if (edu.courses && edu.courses.length > 0) {
        summary += `<p><strong>Relevant Courses:</strong> ${edu.courses.slice(0, 5).join(', ')}</p>`;
      }
      
      if (edu.description) {
        summary += `<p>${edu.description}</p>`;
      }
      
      return {
        id: this.generateCuid2(),
        visible: true,
        institution: this.safeString(edu.institution || edu.school || `Education ${index + 1}`),
        studyType: this.safeString(edu.studyType || edu.degree || "Degree"),
        area: this.safeString(edu.area || edu.location || edu.fieldOfStudy || ""),
        score: this.safeString(edu.score || edu.gpa || ""),
        date: this.formatDateRange(edu.startDate, edu.endDate),
        summary: summary,
        url: {
          label: "",
          href: this.safeString(edu.website || edu.url || "")
        }
      };
    });
    
    // Sort by date (most recent first)
    resumeData.sections.education.items.sort((a: any, b: any) => {
      const dateA = this.parseDateForSorting(a.date);
      const dateB = this.parseDateForSorting(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    resumeData.sections.education.visible = resumeData.sections.education.items.length > 0;
  }
  
  // 4. SUPER Intelligent Skills Categorization
  if (extractedData.skills && Array.isArray(extractedData.skills)) {
    const categorizedSkills = this.categorizeSkillsIntelligently(extractedData.skills);
    
    resumeData.sections.skills.items = categorizedSkills.map((category: any, index: number) => {
      // Determine proficiency level based on context
      let proficiency = "Intermediate";
      if (category.keywords.some((kw: string) => kw.toLowerCase().includes('expert') || kw.toLowerCase().includes('advanced'))) {
        proficiency = "Advanced";
      } else if (category.keywords.some((kw: string) => kw.toLowerCase().includes('beginner') || kw.toLowerCase().includes('basic'))) {
        proficiency = "Beginner";
      }
      
      return {
        id: this.generateCuid2(),
        visible: true,
        name: this.safeString(category.category || `Skills ${index + 1}`),
        description: this.safeString(category.description || `${proficiency} proficiency in ${category.category.toLowerCase()}`),
        level: this.skillCategoryToLevel(category.category, proficiency),
        keywords: category.keywords.slice(0, 12) // Limit to 12 per category
      };
    });
    
    resumeData.sections.skills.visible = resumeData.sections.skills.items.length > 0;
  }
  
  // 5. Intelligent Projects with Impact
  if (extractedData.projects && Array.isArray(extractedData.projects)) {
    resumeData.sections.projects.items = extractedData.projects.map((project: any, index: number) => {
      let summary = `<p>${project.description || ""}</p>`;
      
      if (project.achievements && project.achievements.length > 0) {
        summary += "<ul>";
        project.achievements.slice(0, 3).forEach((achievement: string) => {
          if (achievement.trim()) {
            summary += `<li><p>${achievement}</p></li>`;
          }
        });
        summary += "</ul>";
      }
      
      if (project.technologies && project.technologies.length > 0) {
        summary += `<p><strong>Technologies:</strong> ${project.technologies.slice(0, 8).join(', ')}</p>`;
      }
      
      return {
        id: this.generateCuid2(),
        visible: true,
        name: this.safeString(project.name || project.title || `Project ${index + 1}`),
        description: this.safeString(project.role || project.position || ""),
        date: this.safeString(project.date || project.duration || this.formatDateRange(project.startDate, project.endDate)),
        summary: summary,
        keywords: Array.isArray(project.technologies) ? project.technologies.slice(0, 10) : [],
        url: {
          label: "",
          href: this.safeString(project.website || project.url || project.link || "")
        }
      };
    });
    
    resumeData.sections.projects.visible = resumeData.sections.projects.items.length > 0;
  }
  
  // 6. Languages with intelligent level detection
  if (extractedData.languages && Array.isArray(extractedData.languages)) {
    resumeData.sections.languages.items = extractedData.languages.map((lang: any, index: number) => {
      const level = this.detectLanguageLevelIntelligently(lang);
      
      return {
        id: this.generateCuid2(),
        visible: true,
        name: this.safeString(lang.name || lang.language || `Language ${index + 1}`),
        description: this.safeString(lang.proficiency || level),
        level: this.getLanguageLevel(level),
        keywords: []
      };
    });
    
    // Show languages section only if relevant (2+ languages or multilingual role)
    const hasMultipleLanguages = resumeData.sections.languages.items.length >= 2;
    const hasLanguageSkills = extractedData.skills?.some((skill: any) => 
      typeof skill === 'string' ? skill.toLowerCase().includes('language') : 
      skill.name?.toLowerCase().includes('language')
    );
    
    resumeData.sections.languages.visible = hasMultipleLanguages || hasLanguageSkills;
  }
  
  // 7. Certifications with validation
  if (extractedData.certifications && Array.isArray(extractedData.certifications)) {
    resumeData.sections.certifications.items = extractedData.certifications.map((cert: any, index: number) => {
      return {
        id: this.generateCuid2(),
        visible: true,
        name: this.safeString(cert.name || `Certification ${index + 1}`),
        issuer: this.safeString(cert.issuer || ""),
        date: this.safeString(cert.date || ""),
        summary: this.safeString(cert.description || ""),
        url: {
          label: "",
          href: this.safeString(cert.url || "")
        }
      };
    });
    
    // Show certifications if any exist
    resumeData.sections.certifications.visible = resumeData.sections.certifications.items.length > 0;
  }
  
  // 8. Awards with importance ranking
  if (extractedData.awards && Array.isArray(extractedData.awards)) {
    resumeData.sections.awards.items = extractedData.awards.map((award: any, index: number) => {
      return {
        id: this.generateCuid2(),
        visible: true,
        title: this.safeString(award.name || `Award ${index + 1}`),
        awarder: this.safeString(award.issuer || ""),
        date: this.safeString(award.date || ""),
        summary: this.safeString(award.description || ""),
        url: {
          label: "",
          href: ""
        }
      };
    });
    
    // Show awards only if prestigious or relevant
    const hasPrestigiousAwards = extractedData.awards.some((award: any) => 
      award.name?.toLowerCase().includes('award') || 
      award.name?.toLowerCase().includes('recognition') ||
      award.name?.toLowerCase().includes('honor')
    );
    
    resumeData.sections.awards.visible = hasPrestigiousAwards || resumeData.sections.awards.items.length > 0;
  }
  
  // 9. Volunteer experience
  if (extractedData.volunteer && Array.isArray(extractedData.volunteer)) {
    resumeData.sections.volunteer.items = extractedData.volunteer.map((vol: any, index: number) => {
      return {
        id: this.generateCuid2(),
        visible: true,
        organization: this.safeString(vol.organization || `Volunteer ${index + 1}`),
        position: this.safeString(vol.position || ""),
        date: this.formatDateRange(vol.startDate, vol.endDate),
        summary: this.safeString(vol.description || ""),
        url: {
          label: "",
          href: ""
        }
      };
    });
    
    resumeData.sections.volunteer.visible = resumeData.sections.volunteer.items.length > 0;
  }
  
  // 10. Publications
  if (extractedData.publications && Array.isArray(extractedData.publications)) {
    resumeData.sections.publications.items = extractedData.publications.map((pub: any, index: number) => {
      return {
        id: this.generateCuid2(),
        visible: true,
        name: this.safeString(pub.title || `Publication ${index + 1}`),
        publisher: this.safeString(pub.publisher || ""),
        date: this.safeString(pub.date || ""),
        summary: "",
        url: {
          label: "",
          href: this.safeString(pub.url || "")
        }
      };
    });
    
    resumeData.sections.publications.visible = resumeData.sections.publications.items.length > 0;
  }
  
  // 11. Interests (curated, not just listed)
  if (extractedData.interests && Array.isArray(extractedData.interests)) {
    // Filter and curate interests
    const curatedInterests = this.curateInterests(extractedData.interests, extractedData.skills);
    
    resumeData.sections.interests.items = curatedInterests.map((interest: string, index: number) => {
      return {
        id: this.generateCuid2(),
        visible: true,
        name: interest,
        keywords: []
      };
    });
    
    // Show interests only if they add value (professional or unique)
    resumeData.sections.interests.visible = resumeData.sections.interests.items.length > 0 && 
      resumeData.sections.interests.items.length <= 8; // Don't show if too many
  }
  
  // 12. Profiles (social media)
  if (extractedData.profiles && Array.isArray(extractedData.profiles)) {
    resumeData.sections.profiles.items = extractedData.profiles.map((profile: any) => {
      return {
        id: this.generateCuid2(),
        visible: true,
        network: this.safeString(profile.network || profile.platform || ""),
        username: this.safeString(profile.username || profile.handle || ""),
        icon: this.getProfileIcon(profile.network || profile.platform || ""),
        url: {
          label: "",
          href: this.safeString(profile.url || profile.link || "")
        }
      };
    }).filter((p: any) => p.network && p.network.trim());
    
    resumeData.sections.profiles.visible = resumeData.sections.profiles.items.length > 0;
  }
  
  // 13. References (handle carefully)
  if (extractedData.references && Array.isArray(extractedData.references)) {
    resumeData.sections.references.items = extractedData.references.map((ref: any, index: number) => {
      return {
        id: this.generateCuid2(),
        visible: true,
        name: this.safeString(ref.name || `Reference ${index + 1}`),
        position: this.safeString(ref.position || ""),
        company: this.safeString(ref.company || ""),
        summary: this.safeString(ref.contact || "Available upon request"),
        url: {
          label: "",
          href: ""
        }
      };
    });
    
    // Typically hide references or show only if explicitly provided
    resumeData.sections.references.visible = false; // Usually hidden by default
  }
  
  // 14. INTELLIGENT CUSTOM SECTIONS
  if (extractedData.customSections && Array.isArray(extractedData.customSections)) {
  // Initialize custom sections object
  resumeData.sections.custom = {};
  
  extractedData.customSections.forEach((customSection: any) => {
    if (customSection.sectionName && customSection.items && Array.isArray(customSection.items)) {
      const sectionKey = customSection.sectionName.toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      
      if (!sectionKey || sectionKey === 'custom') return; // Skip invalid keys
      
      // Create the custom section structure
      resumeData.sections.custom[sectionKey] = {
        name: customSection.sectionName,
        columns: 1,
        separateLinks: true,
        visible: true,
        id: sectionKey,
        items: customSection.items.map((item: any, idx: number) => ({
          id: this.generateCuid2(),
          visible: true,
          name: this.safeString(item.title || `${customSection.sectionName} Item ${idx + 1}`),
          description: "",
          date: this.safeString(item.date || ""),
          summary: this.formatCustomItemSummary(item),
          keywords: Array.isArray(item.details) ? item.details.slice(0, 5) : [],
          url: { label: "", href: "" }
        }))
      };
      
      console.log(`✅ Created custom section: ${customSection.sectionName} with ${customSection.items.length} items`);
    }
  });
  
  // If no valid custom sections, ensure custom is an empty object
  if (Object.keys(resumeData.sections.custom).length === 0) {
    resumeData.sections.custom = {};
  }
}
  
  // 15. INTELLIGENT METADATA based on analysis
  resumeData.metadata.aiGenerated = true;
  resumeData.metadata.aiGeneratedAt = new Date().toISOString();
  resumeData.metadata.needsReview = aiResponse.needsReview !== false;
  resumeData.metadata.confidence = Math.min(Math.max(aiResponse.confidence || analysis.confidence || 0.85, 0), 1);
  
  // Set template based on analysis
  if (analysis.recommendedTemplate) {
    resumeData.metadata.template = analysis.recommendedTemplate;
  } else {
    // Choose template based on content
    const hasManyProjects = resumeData.sections.projects.items.length >= 3;
    const hasPublications = resumeData.sections.publications.items.length > 0;
    const isAcademic = resumeData.sections.education.items.length >= 2 || hasPublications;
    
    if (isAcademic) {
      resumeData.metadata.template = "academic";
    } else if (hasManyProjects) {
      resumeData.metadata.template = "portfolio";
    } else {
      resumeData.metadata.template = "modern";
    }
  }
  
  // Adjust layout based on content
  resumeData.metadata.layout = this.generateIntelligentLayout(resumeData);
  
  // CRITICAL: Ensure all sections are proper objects
  console.log('🔧 Applying comprehensive structure fix...');
  const finalResumeData = this.validateAndFixResumeStructureCompletely(resumeData);
  
  console.log('✅ SUPER intelligent resume built:', {
    totalSections: Object.keys(finalResumeData.sections).length,
    customSections: Object.keys(finalResumeData.sections.custom || {}),
    itemsCount: {
      experience: finalResumeData.sections.experience.items.length,
      education: finalResumeData.sections.education.items.length,
      skills: finalResumeData.sections.skills.items.length,
      projects: finalResumeData.sections.projects.items.length,
      languages: finalResumeData.sections.languages.items.length,
      certifications: finalResumeData.sections.certifications.items.length
    },
    template: finalResumeData.metadata.template,
    confidence: finalResumeData.metadata.confidence
  });
  
  return finalResumeData;
}


private formatCustomItemSummary(item: any): string {
  let summary = "";
  
  // Add description if provided
  if (item.description && item.description.trim()) {
    summary += `<p>${this.escapeHtml(item.description)}</p>`;
  }
  
  // Add details as bullet points if provided
  if (item.details && Array.isArray(item.details) && item.details.length > 0) {
    if (summary) summary += "<br/>";
    summary += "<ul>";
    item.details.slice(0, 3).forEach((detail: string) => {
      if (detail && detail.trim()) {
        summary += `<li><p>${this.escapeHtml(detail)}</p></li>`;
      }
    });
    summary += "</ul>";
  }
  
  // If no content, return minimal placeholder
  if (!summary.trim()) {
    summary = "<p>Details available upon request.</p>";
  }
  
  return summary;
}

private escapeHtml(text: string): string {
  if (!text) return "";
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>');
}


// Add these new intelligent helper methods to your class:

private generateIntelligentSummary(extractedData: any, analysis: any): string {
  const personal = extractedData.personal || {};
  const experience = extractedData.experience || [];
  const skills = extractedData.skills || [];
  const education = extractedData.education || [];
  
  let summary = "";
  
  // Years of experience
  const totalExp = this.calculateTotalExperience(experience);
  if (totalExp !== "0") {
    summary += `Results-driven professional with ${totalExp}+ years of experience `;
  } else {
    summary += `Motivated professional `;
  }
  
  // Primary role/industry
  const primaryRole = this.getPrimaryRole(experience);
  const industry = this.detectIndustry(experience, skills);
  
  if (primaryRole && industry) {
    summary += `in ${industry} as a ${primaryRole}. `;
  } else if (primaryRole) {
    summary += `specializing in ${primaryRole}. `;
  } else if (industry) {
    summary += `in ${industry}. `;
  } else {
    summary += `seeking new opportunities. `;
  }
  
  // Key achievements/strengths
  const topAchievements = this.extractTopAchievements(experience, 2);
  if (topAchievements.length > 0) {
    summary += `Proven track record of ${topAchievements.join(' and ').toLowerCase()}. `;
  }
  
  // Key skills
  const keySkills = this.getTopSkills(skills, 3);
  if (keySkills.length > 0) {
    summary += `Expertise in ${keySkills.join(', ')}. `;
  }
  
  // Education highlight
  if (education.length > 0) {
    const highestDegree = education.reduce((highest: any, current: any) => {
      const currentLevel = this.getEducationLevel(current.degree);
      const highestLevel = this.getEducationLevel(highest.degree);
      return currentLevel > highestLevel ? current : highest;
    });
    
    if (highestDegree && highestDegree.institution) {
      summary += `Holds a ${highestDegree.degree || 'degree'} from ${highestDegree.institution}. `;
    }
  }
  
  // Closing statement
  summary += `Committed to delivering exceptional results and driving organizational success.`;
  
  return summary;
}

private categorizeSkillsIntelligently(skills: any[]): any[] {
  if (!Array.isArray(skills) || skills.length === 0) {
    return [{
      category: "Core Competencies",
      description: "Professional skills and expertise",
      keywords: ["Problem Solving", "Communication", "Teamwork"]
    }];
  }
  
  // Advanced categorization based on skill type
  const categories: Record<string, { description: string, keywords: string[] }> = {
    "Technical Expertise": { description: "Core technical skills and programming languages", keywords: [] },
    "Tools & Technologies": { description: "Frameworks, libraries, and development tools", keywords: [] },
    "Cloud & Infrastructure": { description: "Cloud platforms and infrastructure management", keywords: [] },
    "Methodologies & Practices": { description: "Development methodologies and best practices", keywords: [] },
    "Leadership & Management": { description: "Team leadership and project management", keywords: [] },
    "Communication & Collaboration": { description: "Interpersonal and communication skills", keywords: [] },
    "Analytical & Problem Solving": { description: "Analytical thinking and problem-solving abilities", keywords: [] },
    "Industry-Specific": { description: "Domain-specific knowledge and expertise", keywords: [] }
  };
  
  // Process each skill
  skills.forEach(skill => {
    if (!skill) return;
    
    const skillName = this.extractSkillName(skill);
    if (!skillName) return;
    
    const lowerName = skillName.toLowerCase();
    
    // Intelligent categorization
    if (lowerName.includes('javascript') || lowerName.includes('python') || lowerName.includes('java') || 
        lowerName.includes('c++') || lowerName.includes('c#') || lowerName.includes('go') || 
        lowerName.includes('rust') || lowerName.includes('swift') || lowerName.includes('kotlin')) {
      categories["Technical Expertise"].keywords.push(skillName);
    } else if (lowerName.includes('react') || lowerName.includes('angular') || lowerName.includes('vue') || 
               lowerName.includes('node') || lowerName.includes('express') || lowerName.includes('django') || 
               lowerName.includes('spring') || lowerName.includes('.net')) {
      categories["Tools & Technologies"].keywords.push(skillName);
    } else if (lowerName.includes('aws') || lowerName.includes('azure') || lowerName.includes('gcp') || 
               lowerName.includes('docker') || lowerName.includes('kubernetes') || lowerName.includes('terraform') || 
               lowerName.includes('jenkins') || lowerName.includes('ci/cd')) {
      categories["Cloud & Infrastructure"].keywords.push(skillName);
    } else if (lowerName.includes('agile') || lowerName.includes('scrum') || lowerName.includes('devops') || 
               lowerName.includes('tdd') || lowerName.includes('bdd') || lowerName.includes('clean code')) {
      categories["Methodologies & Practices"].keywords.push(skillName);
    } else if (lowerName.includes('leadership') || lowerName.includes('management') || lowerName.includes('mentoring') || 
               lowerName.includes('project') || lowerName.includes('team') || lowerName.includes('strategic')) {
      categories["Leadership & Management"].keywords.push(skillName);
    } else if (lowerName.includes('communication') || lowerName.includes('collaboration') || lowerName.includes('presentation') || 
               lowerName.includes('writing') || lowerName.includes('stakeholder')) {
      categories["Communication & Collaboration"].keywords.push(skillName);
    } else if (lowerName.includes('analytical') || lowerName.includes('problem') || lowerName.includes('critical') || 
               lowerName.includes('research') || lowerName.includes('data analysis')) {
      categories["Analytical & Problem Solving"].keywords.push(skillName);
    } else if (lowerName.includes('finance') || lowerName.includes('healthcare') || lowerName.includes('education') || 
               lowerName.includes('retail') || lowerName.includes('manufacturing') || lowerName.includes('ecommerce')) {
      categories["Industry-Specific"].keywords.push(skillName);
    } else {
      // Default to Technical Expertise
      categories["Technical Expertise"].keywords.push(skillName);
    }
  });
  
  // Convert to array, filter empty, and limit keywords
  return Object.entries(categories)
    .filter(([_, data]) => data.keywords.length > 0)
    .map(([category, data]) => ({
      category,
      description: data.description,
      keywords: [...new Set(data.keywords)].slice(0, 10) // Remove duplicates, limit to 10
    }));
}

private detectLanguageLevelIntelligently(lang: any): string {
  if (!lang || !lang.level) return "Intermediate";
  
  const level = lang.level.toLowerCase();
  
  if (level.includes('native') || level.includes('fluent') || level === '5') {
    return "Native/Fluent";
  } else if (level.includes('advanced') || level.includes('professional') || level === '4') {
    return "Advanced";
  } else if (level.includes('intermediate') || level.includes('conversational') || level === '3') {
    return "Intermediate";
  } else if (level.includes('basic') || level.includes('beginner') || level.includes('elementary') || level === '2' || level === '1') {
    return "Basic";
  }
  
  return "Intermediate";
}

private curateInterests(interests: string[], skills: any[]): string[] {
  if (!Array.isArray(interests) || interests.length === 0) {
    return [];
  }
  
  const curated: string[] = [];
  const seen = new Set<string>();
  
  // Professional interests first
  const professionalKeywords = ['technology', 'coding', 'development', 'design', 'research', 'innovation', 'startup', 'entrepreneur'];
  
  interests.forEach(interest => {
    if (!interest || typeof interest !== 'string') return;
    
    const lowerInterest = interest.toLowerCase().trim();
    
    // Skip generic interests
    if (lowerInterest.length < 3 || 
        lowerInterest === 'reading' || 
        lowerInterest === 'music' || 
        lowerInterest === 'movies' ||
        lowerInterest === 'travel') {
      return;
    }
    
    // Capitalize first letter
    const formatted = interest.charAt(0).toUpperCase() + interest.slice(1).toLowerCase();
    
    if (!seen.has(formatted)) {
      seen.add(formatted);
      curated.push(formatted);
    }
  });
  
  // Limit to 6 interests max
  return curated.slice(0, 6);
}

private generateIntelligentLayout(resumeData: any): string[][][] {
  const hasExperience = resumeData.sections.experience.items.length > 0;
  const hasEducation = resumeData.sections.education.items.length > 0;
  const hasSkills = resumeData.sections.skills.items.length > 0;
  const hasProjects = resumeData.sections.projects.items.length > 0;
  const hasCertifications = resumeData.sections.certifications.items.length > 0;
  const hasLanguages = resumeData.sections.languages.items.length > 0;
  const hasAwards = resumeData.sections.awards.items.length > 0;
  
  // Default layout
  let leftColumn = ["summary"];
  let rightColumn = ["profiles"];
  
  if (hasExperience) leftColumn.push("experience");
  if (hasEducation) leftColumn.push("education");
  
  if (hasSkills) rightColumn.push("skills");
  if (hasProjects) leftColumn.push("projects");
  if (hasCertifications) rightColumn.push("certifications");
  if (hasLanguages) rightColumn.push("languages");
  if (hasAwards) rightColumn.push("awards");
  
  // Add volunteer if significant
  if (resumeData.sections.volunteer.items.length >= 2) {
    rightColumn.push("volunteer");
  }
  
  // Add interests if curated
  if (resumeData.sections.interests.items.length > 0 && resumeData.sections.interests.items.length <= 5) {
    rightColumn.push("interests");
  }
  
  // Always include references (usually hidden)
  rightColumn.push("references");
  
  return [[leftColumn, rightColumn]];
}

private enhanceAchievement(achievement: string, technologies: string[]): string {
  let enhanced = achievement.trim();
  
  // Add metrics emphasis
  const metricRegex = /(\d+%)|(\$\d+)|(\d+\+)/g;
  const metrics = achievement.match(metricRegex);
  
  if (metrics && metrics.length > 0) {
    // Already has metrics, ensure they're emphasized
    enhanced = enhanced.replace(metricRegex, '<strong>$&</strong>');
  }
  
  // Add technology context
  if (technologies && technologies.length > 0) {
    // Check if technologies are mentioned
    const mentionedTech = technologies.filter(tech => 
      achievement.toLowerCase().includes(tech.toLowerCase())
    );
    
    if (mentionedTech.length === 0 && technologies.length > 0) {
      // Add primary technology if not mentioned
      enhanced += ` using ${technologies[0]}`;
    }
  }
  
  return enhanced;
}

private detectIndustry(experience: any[], skills: any[]): string {
  // Simple industry detection based on keywords
  const allText = [
    ...experience.map(exp => `${exp.company} ${exp.position} ${exp.description}`).join(' '),
    ...skills.map(skill => typeof skill === 'string' ? skill : skill.name).join(' ')
  ].join(' ').toLowerCase();
  
  if (allText.includes('software') || allText.includes('developer') || allText.includes('engineer')) {
    return "Software Development";
  } else if (allText.includes('data') || allText.includes('analyst') || allText.includes('science')) {
    return "Data Science & Analytics";
  } else if (allText.includes('design') || allText.includes('ux') || allText.includes('ui')) {
    return "Design & User Experience";
  } else if (allText.includes('cloud') || allText.includes('devops') || allText.includes('infrastructure')) {
    return "Cloud & DevOps";
  } else if (allText.includes('product') || allText.includes('manager') || allText.includes('pm')) {
    return "Product Management";
  } else if (allText.includes('finance') || allText.includes('bank') || allText.includes('investment')) {
    return "Finance & Banking";
  } else if (allText.includes('health') || allText.includes('medical') || allText.includes('care')) {
    return "Healthcare";
  } else if (allText.includes('education') || allText.includes('university') || allText.includes('school')) {
    return "Education";
  }
  
  return "Technology";
}

private extractTopAchievements(experience: any[], limit: number = 2): string[] {
  const achievements: string[] = [];
  
  experience.forEach(exp => {
    if (exp.achievements && Array.isArray(exp.achievements)) {
      exp.achievements.forEach((achievement: string) => {
        if (achievement && typeof achievement === 'string') {
          // Look for quantifiable achievements
          if (achievement.match(/(\d+%)|(\$\d+)|(\d+\+)|(increase)|(reduce)|(improve)|(save)/i)) {
            achievements.push(achievement);
          }
        }
      });
    }
  });
  
  // Return top achievements by length (assuming longer = more detailed)
  return achievements
    .sort((a, b) => b.length - a.length)
    .slice(0, limit)
    .map(ach => {
      // Clean up the achievement
      return ach.replace(/^[\s\-•*]+/, '').trim();
    });
}

private parseDateForSorting(dateString: string): Date {
  if (!dateString) return new Date(0); // Very old date
  
  // Try to parse various date formats
  const now = new Date();
  const yearMatch = dateString.match(/\b(19|20)\d{2}\b/);
  
  if (yearMatch) {
    const year = parseInt(yearMatch[0]);
    return new Date(year, 0, 1);
  }
  
  return now; // Default to current date
}

private getEducationLevel(degree: string): number {
  if (!degree) return 0;
  
  const lowerDegree = degree.toLowerCase();
  
  if (lowerDegree.includes('phd') || lowerDegree.includes('doctor')) return 5;
  if (lowerDegree.includes('master')) return 4;
  if (lowerDegree.includes('bachelor') || lowerDegree.includes('bs') || lowerDegree.includes('ba')) return 3;
  if (lowerDegree.includes('associate') || lowerDegree.includes('diploma')) return 2;
  if (lowerDegree.includes('certificate') || lowerDegree.includes('certification')) return 1;
  
  return 0;
}

private skillCategoryToLevel(category: string, proficiency: string): number {
  const proficiencyMap: Record<string, number> = {
    'Advanced': 4,
    'Intermediate': 3,
    'Beginner': 2,
    'Basic': 1
  };
  
  // Certain categories get higher default levels
  const categoryBoost: Record<string, number> = {
    'Technical Expertise': 1,
    'Leadership & Management': 1,
    'Industry-Specific': 1
  };
  
  const baseLevel = proficiencyMap[proficiency] || 3;
  const boost = categoryBoost[category] || 0;
  
  return Math.min(4, baseLevel + boost);
}

// Add this validation method
private validateFinalStructure(resumeData: any): void {
  console.log('🔍 Validating final structure...');
  
  if (!resumeData) {
    console.error('❌ Resume data is null!');
    return;
  }
  
  if (!resumeData.sections || typeof resumeData.sections !== 'object') {
    console.error('❌ Sections is not an object!');
    return;
  }
  
  // Check critical sections
  const criticalSections = ['education', 'experience', 'skills', 'projects'];
  
  criticalSections.forEach(section => {
    const sectionData = resumeData.sections[section];
    
    if (!sectionData) {
      console.error(`❌ Missing section: ${section}`);
    } else if (Array.isArray(sectionData)) {
      console.error(`❌ CRITICAL: ${section} is still an array!`);
    } else if (typeof sectionData === 'object') {
      console.log(`✅ ${section} is an object`);
      
      // Check for required properties
      if (!sectionData.id) {
        console.warn(`⚠️  ${section} missing id property`);
      }
      if (!Array.isArray(sectionData.items)) {
        console.error(`❌ ${section}.items is not an array`);
      }
    } else {
      console.error(`❌ ${section} is invalid type: ${typeof sectionData}`);
    }
  });
  
  console.log('✅ Final structure validation complete');
}

// HELPER METHODS
private safeString(value: any): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

private formatDateRange(startDate: any, endDate: any): string {
  const start = this.safeString(startDate);
  const end = this.safeString(endDate);
  
  if (!start && !end) return "";
  if (!end || end.toLowerCase() === 'present') return `${start} to Present`;
  return `${start} to ${end}`;
}

private formatExperienceSummary(exp: any): string {
  const responsibilities = exp.responsibilities || exp.description || exp.duties || [];
  const achievements = exp.achievements || exp.accomplishments || [];
  
  let html = "";
  
  // Use achievements if available
  if (Array.isArray(achievements) && achievements.length > 0) {
    html += "<ul>";
    achievements.slice(0, 3).forEach((achievement: string) => {
      if (typeof achievement === 'string' && achievement.trim()) {
        html += `<li><p>${achievement}</p></li>`;
      }
    });
    html += "</ul>";
  }
  // Otherwise use responsibilities
  else if (Array.isArray(responsibilities) && responsibilities.length > 0) {
    html += "<ul>";
    responsibilities.slice(0, 3).forEach((responsibility: string) => {
      if (typeof responsibility === 'string' && responsibility.trim()) {
        html += `<li><p>${responsibility}</p></li>`;
      }
    });
    html += "</ul>";
  }
  // Fallback
  else if (typeof exp.summary === 'string' && exp.summary.trim()) {
    html += `<p>${exp.summary}</p>`;
  } else {
    html += "<p>Responsible for key deliverables and project success.</p>";
  }
  
  return html;
}

private groupSkillsByCategory(skills: any[]): any[] {
  if (!Array.isArray(skills) || skills.length === 0) {
    return [{
      category: "Skills",
      description: "Professional competencies",
      keywords: ["Skills", "Expertise", "Capabilities"]
    }];
  }
  
  const categories: Record<string, { keywords: string[] }> = {
    "Technical Skills": { keywords: [] },
    "Web Technologies": { keywords: [] },
    "Tools & Frameworks": { keywords: [] },
    "Soft Skills": { keywords: [] },
    "Languages": { keywords: [] }
  };
  
  // Process each skill
  skills.forEach(skill => {
    if (!skill) return;
    
    const skillName = this.extractSkillName(skill);
    if (!skillName) return;
    
    const lowerName = skillName.toLowerCase();
    
    // Categorize
    if (lowerName.includes('javascript') || lowerName.includes('python') || lowerName.includes('java') || 
        lowerName.includes('c++') || lowerName.includes('php') || lowerName.includes('ruby')) {
      categories["Technical Skills"].keywords.push(skillName);
    } else if (lowerName.includes('react') || lowerName.includes('angular') || lowerName.includes('vue') || 
               lowerName.includes('node') || lowerName.includes('html') || lowerName.includes('css')) {
      categories["Web Technologies"].keywords.push(skillName);
    } else if (lowerName.includes('git') || lowerName.includes('docker') || lowerName.includes('aws') || 
               lowerName.includes('jenkins') || lowerName.includes('jira') || lowerName.includes('webpack')) {
      categories["Tools & Frameworks"].keywords.push(skillName);
    } else if (lowerName.includes('leadership') || lowerName.includes('communication') || 
               lowerName.includes('teamwork') || lowerName.includes('problem')) {
      categories["Soft Skills"].keywords.push(skillName);
    } else if (lowerName.includes('english') || lowerName.includes('french') || lowerName.includes('spanish') || 
               lowerName.includes('german') || lowerName.includes('chinese')) {
      categories["Languages"].keywords.push(skillName);
    } else {
      categories["Technical Skills"].keywords.push(skillName);
    }
  });
  
  // Convert to array and filter empty categories
  return Object.entries(categories)
    .filter(([_, data]) => data.keywords.length > 0)
    .map(([category, data]) => ({
      category,
      description: `${category} proficiency`,
      keywords: data.keywords.slice(0, 10) // Limit to 10 per category
    }));
}

private extractSkillName(skill: any): string {
  if (typeof skill === 'string') return skill;
  if (skill && typeof skill === 'object') {
    if (typeof skill.name === 'string') return skill.name;
    if (typeof skill.skill === 'string') return skill.skill;
  }
  return "";
}


private addMissingIdsToAllItems(resumeData: any): void {
  const sectionsWithItems = ['education', 'experience', 'skills', 'projects', 'profiles', 
                             'awards', 'certifications', 'languages', 'interests', 
                             'publications', 'references', 'volunteer'];
  
  sectionsWithItems.forEach(sectionName => {
    const section = resumeData.sections[sectionName];
    if (section && Array.isArray(section.items)) {
      section.items = section.items.map((item: any, index: number) => {
        if (!item || typeof item !== 'object') {
          return {
            id: this.generateCuid2(),
            visible: true,
            name: `${sectionName} Item ${index + 1}`
          };
        }
        
        // Add missing ID
        if (!item.id || typeof item.id !== 'string' || !item.id.startsWith('c')) {
          return {
            ...item,
            id: item.id || this.generateCuid2(),
            visible: item.visible !== undefined ? item.visible : true
          };
        }
        
        return item;
      });
    }
  });
}


/**
 * Get skill level description
 */
private getSkillLevelDescription(skills: any[]): string {
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    return "Intermediate";
  }

  const levels: Record<string, number> = {};
  
  skills.forEach(skill => {
    if (typeof skill === 'object' && skill.level) {
      const level = skill.level.toString().toLowerCase();
      levels[level] = (levels[level] || 0) + 1;
    } else if (typeof skill === 'string') {
      levels['intermediate'] = (levels['intermediate'] || 0) + 1;
    } else {
      levels['intermediate'] = (levels['intermediate'] || 0) + 1;
    }
  });

  // Find most common level
  let mostCommon = 'intermediate';
  let maxCount = 0;
  
  for (const [level, count] of Object.entries(levels)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = level;
    }
  }

  // Capitalize first letter
  return mostCommon.charAt(0).toUpperCase() + mostCommon.slice(1);
}


/**
 * Fix section structure - ensure sections are objects with proper structure
 */
private fixSectionStructure(resumeData: any): void {
  if (!resumeData.sections) {
    resumeData.sections = {};
    return;
  }

  // Define all expected sections with their default structure
  const sectionTemplates: Record<string, any> = {
    summary: {
      name: "Summary",
      columns: 1,
      visible: true,
      id: "summary",
      content: "<p>Professional summary based on experience.</p>"
    },
    awards: {
      name: "Awards",
      columns: 1,
      visible: false,
      id: "awards",
      items: []
    },
    certifications: {
      name: "Certifications",
      columns: 1,
      visible: false,
      id: "certifications",
      items: []
    },
    education: {
      name: "Education",
      columns: 1,
      visible: true,
      id: "education",
      items: []
    },
    experience: {
      name: "Experience",
      columns: 1,
      visible: true,
      id: "experience",
      items: []
    },
    volunteer: {
      name: "Volunteering",
      columns: 1,
      visible: false,
      id: "volunteer",
      items: []
    },
    interests: {
      name: "Interests",
      columns: 1,
      visible: false,
      id: "interests",
      items: []
    },
    languages: {
      name: "Languages",
      columns: 1,
      visible: false,
      id: "languages",
      items: []
    },
    profiles: {
      name: "Profiles",
      columns: 1,
      visible: true,
      id: "profiles",
      items: []
    },
    projects: {
      name: "Projects",
      columns: 1,
      visible: true,
      id: "projects",
      items: []
    },
    publications: {
      name: "Publications",
      columns: 1,
      visible: false,
      id: "publications",
      items: []
    },
    references: {
      name: "References",
      columns: 1,
      visible: false,
      id: "references",
      items: []
    },
    skills: {
      name: "Skills",
      columns: 1,
      visible: true,
      id: "skills",
      items: []
    },
    custom: {}
  };

  // Process each section
  for (const [sectionName, sectionTemplate] of Object.entries(sectionTemplates)) {
    const currentSection = resumeData.sections[sectionName];
    
    if (!currentSection) {
      // Section doesn't exist, create it with template
      resumeData.sections[sectionName] = { ...sectionTemplate };
    } else if (Array.isArray(currentSection)) {
      // Section is an array, convert to object with items
      resumeData.sections[sectionName] = {
        ...sectionTemplate,
        items: currentSection,
        visible: currentSection.length > 0 && sectionTemplate.visible
      };
    } else if (typeof currentSection === 'object') {
      // Section is an object, ensure it has required fields
      resumeData.sections[sectionName] = {
        ...sectionTemplate,
        ...currentSection,
        id: sectionName,
        name: currentSection.name || sectionTemplate.name,
        columns: currentSection.columns || sectionTemplate.columns,
        visible: currentSection.visible !== undefined ? currentSection.visible : sectionTemplate.visible,
        items: currentSection.items || []
      };
    }
  }

  // Ensure we have items array for sections that should have it
  const itemSections = ['awards', 'certifications', 'education', 'experience', 'volunteer', 
                       'interests', 'languages', 'profiles', 'projects', 'publications', 
                       'references', 'skills'];
  
  itemSections.forEach(sectionName => {
    if (resumeData.sections[sectionName] && !Array.isArray(resumeData.sections[sectionName].items)) {
      resumeData.sections[sectionName].items = [];
    }
  });

  // Handle custom section
  if (!resumeData.sections.custom || typeof resumeData.sections.custom !== 'object') {
    resumeData.sections.custom = {};
  }
}

  /**
   * Intelligently populate resume data based on extracted information
   */
  
  /**
 * Ensure all sections are objects before populating
 */
private ensureSectionObjects(resumeData: any): void {
  if (!resumeData.sections) {
    resumeData.sections = {};
  }
  
  const sections = ['summary', 'awards', 'certifications', 'education', 'experience', 
                   'volunteer', 'interests', 'languages', 'profiles', 'projects', 
                   'publications', 'references', 'skills'];
  
  sections.forEach(sectionName => {
    if (!resumeData.sections[sectionName] || typeof resumeData.sections[sectionName] !== 'object') {
      // Create default section object
      resumeData.sections[sectionName] = {
        name: sectionName.charAt(0).toUpperCase() + sectionName.slice(1),
        columns: 1,
        visible: ['summary', 'experience', 'education', 'skills', 'profiles', 'projects'].includes(sectionName),
        id: sectionName,
        items: []
      };
    } else if (Array.isArray(resumeData.sections[sectionName])) {
      // Convert array to object with items
      const items = resumeData.sections[sectionName];
      resumeData.sections[sectionName] = {
        name: sectionName.charAt(0).toUpperCase() + sectionName.slice(1),
        columns: 1,
        visible: items.length > 0,
        id: sectionName,
        items: items
      };
    }
    
    // Ensure items array exists
    if (!resumeData.sections[sectionName].items) {
      resumeData.sections[sectionName].items = [];
    }
  });
  
  // Ensure custom section exists
  if (!resumeData.sections.custom || typeof resumeData.sections.custom !== 'object') {
    resumeData.sections.custom = {};
  }
}

  /**
   * Helper methods for intelligent data handling
   */
  private generateProfessionalSummary(extractedData: any): string {
  const personal = extractedData.personal || {};
  const experience = extractedData.experience || [];
  const skills = extractedData.skills || [];
  
  // If we have a summary from the extracted data, use it
  if (personal.summary && typeof personal.summary === 'string') {
    return personal.summary;
  }
  
  // Generate summary based on extracted data
  let summary = "";
  
  // Add years of experience if available
  if (experience.length > 0) {
    const years = this.calculateTotalExperience(experience);
    if (years !== "0") {
      summary += `Experienced professional with ${years} years of experience. `;
    } else {
      summary += "Professional with relevant experience. ";
    }
  } else {
    summary += "Professional seeking new opportunities. ";
  }
  
  // Add primary role if available
  const primaryRole = this.getPrimaryRole(experience);
  summary += `${primaryRole}. `;
  
  // Add key skills if available
  const keySkills = this.getTopSkills(skills, 3);
  if (keySkills.length > 0) {
    summary += `Specializes in ${keySkills.join(', ')}. `;
  }
  
  // Add closing statement
  summary += "Proven track record of delivering high-quality results and achieving measurable outcomes.";
  
  return summary;
}

  private formatExperienceDescription(exp: any): string {
  if (!exp) return "<p>Responsible for key deliverables and project success.</p>";
  
  const responsibilities = exp.responsibilities || exp.description || exp.duties || [];
  const achievements = exp.achievements || exp.accomplishments || [];
  
  let html = "";
  
  if (Array.isArray(achievements) && achievements.length > 0) {
    html += "<ul>";
    achievements.forEach((achievement: string) => {
      if (achievement && typeof achievement === 'string') {
        html += `<li><p>${achievement}</p></li>`;
      }
    });
    html += "</ul>";
  } else if (Array.isArray(responsibilities) && responsibilities.length > 0) {
    html += "<ul>";
    responsibilities.slice(0, 5).forEach((responsibility: string) => {
      if (responsibility && typeof responsibility === 'string') {
        html += `<li><p>${responsibility}</p></li>`;
      }
    });
    html += "</ul>";
  } else if (typeof responsibilities === 'string' && responsibilities.trim()) {
    html += `<p>${responsibilities}</p>`;
  } else if (exp.summary && typeof exp.summary === 'string') {
    html += `<p>${exp.summary}</p>`;
  } else {
    html += "<p>Responsible for key deliverables and project success.</p>";
  }
  
  return html;
}

  private groupSkillsIntelligently(skills: any[]): any[] {
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    return [{
      category: "Skills",
      skills: ["Professional competencies"],
      description: "Skills and expertise"
    }];
  }

  const categories = {
    'Technical Skills': ['javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'typescript'],
    'Web Technologies': ['html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'laravel', 'spring', 'asp.net'],
    'Databases': ['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'oracle', 'sql server'],
    'Cloud & DevOps': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible', 'git', 'ci/cd'],
    'Tools & Frameworks': ['git', 'webpack', 'babel', 'jest', 'mocha', 'selenium', 'jira', 'confluence', 'slack'],
    'Soft Skills': ['leadership', 'communication', 'teamwork', 'problem-solving', 'creativity', 'adaptability', 'time management'],
    'Languages': ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean']
  };
  
  const grouped: Record<string, { skills: any[], description: string }> = {};
  
  // Initialize groups
  Object.keys(categories).forEach(category => {
    grouped[category] = { skills: [], description: '' };
  });
  
  // Group skills with safe access
  skills.forEach(skill => {
    if (!skill) return;
    
    const skillName = (skill.name || skill || "").toString().toLowerCase();
    if (!skillName) return;
    
    let matched = false;
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => skillName.includes(keyword))) {
        grouped[category].skills.push(skill);
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      if (!grouped['Other Skills']) {
        grouped['Other Skills'] = { skills: [], description: 'Additional skills and competencies' };
      }
      grouped['Other Skills'].skills.push(skill);
    }
  });
  
  // Convert to array and remove empty groups
  return Object.entries(grouped)
    .filter(([_, group]) => group.skills.length > 0)
    .map(([category, group]) => ({
      category,
      skills: group.skills,
      description: group.description || `${category} proficiency and expertise`
    }));
}

  private getSkillLevel(level: string | number | undefined): number {
  if (level === undefined || level === null) return 2; // Default to intermediate
  
  if (typeof level === 'number') {
    return Math.min(Math.max(level, 0), 4); // Clamp between 0-4
  }
  
  if (typeof level !== 'string') return 2;
  
  const levelMap: Record<string, number> = {
    'expert': 4,
    'advanced': 3,
    'intermediate': 2,
    'beginner': 1,
    'novice': 0
  };
  
  const lowerLevel = level.toLowerCase();
  return levelMap[lowerLevel] || 2;
}

// Fix the getProfileIcon method to handle undefined:
private getProfileIcon(network: string | undefined): string {
  if (!network) return 'globe';
  
  const iconMap: Record<string, string> = {
    'linkedin': 'linkedin',
    'github': 'github',
    'twitter': 'twitter',
    'facebook': 'facebook',
    'instagram': 'instagram',
    'website': 'globe',
    'portfolio': 'globe',
    'gitlab': 'gitlab',
    'stackoverflow': 'stackoverflow',
    'medium': 'medium',
    'behance': 'behance',
    'dribbble': 'dribbble'
  };
  
  return iconMap[network.toLowerCase()] || 'globe';
}

  private calculateAverageLevel(skills: any[]): number {
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    return 2; // Default intermediate
  }

  const levelMap: Record<string, number> = {
    'expert': 4,
    'advanced': 3,
    'intermediate': 2,
    'beginner': 1,
    'novice': 0
  };

  let total = 0;
  let count = 0;

  skills.forEach(skill => {
    let levelValue = 2; // Default intermediate
    
    if (typeof skill === 'object' && skill.level) {
      if (typeof skill.level === 'number') {
        levelValue = Math.min(Math.max(skill.level, 0), 4);
      } else if (typeof skill.level === 'string') {
        levelValue = levelMap[skill.level.toLowerCase()] || 2;
      }
    } else if (typeof skill === 'string') {
      // Try to extract level from string
      const lowerSkill = skill.toLowerCase();
      if (lowerSkill.includes('expert')) levelValue = 4;
      else if (lowerSkill.includes('advanced')) levelValue = 3;
      else if (lowerSkill.includes('intermediate')) levelValue = 2;
      else if (lowerSkill.includes('beginner')) levelValue = 1;
      else if (lowerSkill.includes('novice')) levelValue = 0;
    }
    
    total += levelValue;
    count++;
  });

  return count > 0 ? Math.round(total / count) : 2;
}


  
  private getLanguageLevel(level: string): number {
    const levelMap: Record<string, number> = {
      'native': 5,
      'fluent': 4,
      'advanced': 3,
      'intermediate': 2,
      'basic': 1,
      'beginner': 0
    };
    
    return levelMap[level.toLowerCase()] || 2;
  }

  private calculateTotalExperience(experience: any[]): string {
  if (!experience || !Array.isArray(experience) || experience.length === 0) {
    return "0";
  }
  
  let totalMonths = 0;
  const now = new Date();
  
  experience.forEach(exp => {
    if (!exp) return;
    
    let startDate: Date | null = null;
    let endDate: Date | null = now; // Default to current date
    
    // Parse start date
    if (exp.startDate) {
      try {
        startDate = new Date(exp.startDate);
      } catch {
        // If date parsing fails, try to extract year
        const yearMatch = exp.startDate.toString().match(/\d{4}/);
        if (yearMatch) {
          startDate = new Date(parseInt(yearMatch[0]), 0, 1);
        }
      }
    }
    
    // Parse end date
    if (exp.endDate && exp.endDate !== 'Present' && exp.endDate !== 'present') {
      try {
        endDate = new Date(exp.endDate);
      } catch {
        const yearMatch = exp.endDate.toString().match(/\d{4}/);
        if (yearMatch) {
          endDate = new Date(parseInt(yearMatch[0]), 11, 31);
        }
      }
    }
    
    if (startDate && endDate && startDate instanceof Date && !isNaN(startDate.getTime())) {
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                    (endDate.getMonth() - startDate.getMonth());
      totalMonths += Math.max(0, months);
    }
  });
  
  const years = Math.floor(totalMonths / 12);
  return years > 0 ? `${years}+` : "1";
}

  private getPrimaryRole(experience: any[]): string {
  if (!experience || !Array.isArray(experience) || experience.length === 0) {
    return "Professional";
  }
  
  const roles: Record<string, number> = {};
  
  experience.forEach(exp => {
    if (!exp) return;
    
    const role = exp.position || exp.title || "";
    if (role && typeof role === 'string') {
      roles[role] = (roles[role] || 0) + 1;
    }
  });
  
  if (Object.keys(roles).length === 0) {
    return "Experienced Professional";
  }
  
  // Find most common role
  let mostCommon = "";
  let maxCount = 0;
  
  for (const [role, count] of Object.entries(roles)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = role;
    }
  }
  
  return mostCommon || "Experienced Professional";
}

  private getTopSkills(skills: any[], count: number): string[] {
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    return ["key competencies", "professional skills", "relevant expertise"];
  }
  
  const topSkills: string[] = [];
  
  for (let i = 0; i < Math.min(skills.length, count); i++) {
    const skill = skills[i];
    if (typeof skill === 'string') {
      topSkills.push(skill);
    } else if (skill && typeof skill === 'object' && skill.name) {
      topSkills.push(skill.name);
    }
  }
  
  // Fill with generic terms if we don't have enough
  const genericTerms = ["professional skills", "technical expertise", "key competencies"];
  while (topSkills.length < count && genericTerms.length > 0) {
    topSkills.push(genericTerms.shift()!);
  }
  
  return topSkills;
}

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
  const output = Object.assign({}, target);
  
  if (this.isObject(target) && this.isObject(source)) {
    Object.keys(source).forEach(key => {
      if (this.isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = this.deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

  private isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}



// Add this method to your AIResumeBuilderService
private validateAndFixResumeStructureCompletely(data: any): any {
  console.log('🔍 Comprehensive structure validation and fix...');
  
  if (!data) {
    return this.getSampleResumeSchema();
  }
  
  const fixed = JSON.parse(JSON.stringify(data));
  
  // 1. Ensure basics exists with all required properties
  if (!fixed.basics || typeof fixed.basics !== 'object') {
    fixed.basics = {};
  }
  
  // Required basics properties
  const requiredBasics = ['name', 'headline', 'email', 'phone', 'location', 'url', 'picture', 'customFields'];
  requiredBasics.forEach(prop => {
    if (fixed.basics[prop] === undefined) {
      if (prop === 'url') fixed.basics.url = { label: "", href: "" };
      else if (prop === 'picture') fixed.basics.picture = { uurl: this.DEFAULT_AVATAR, size: 128, aspectRatio: 1, borderRadius: 0, effects: { hidden: false, border: false, grayscale: false } };
      else if (prop === 'customFields') fixed.basics.customFields = [];
      else fixed.basics[prop] = "";
    }
  });
  
  // 2. Ensure sections exists
  if (!fixed.sections || typeof fixed.sections !== 'object') {
    fixed.sections = {};
  }
  
  // 3. Define all standard sections with their structure
  const standardSections = [
    'summary', 'awards', 'certifications', 'education', 'experience',
    'volunteer', 'interests', 'languages', 'profiles', 'projects',
    'publications', 'references', 'skills', 'custom'
  ];
  
  standardSections.forEach(sectionName => {
    if (!fixed.sections[sectionName]) {
      // Create section with proper structure
      fixed.sections[sectionName] = {
        name: sectionName.charAt(0).toUpperCase() + sectionName.slice(1),
        columns: 1,
        separateLinks: true,
        visible: ['summary', 'experience', 'education', 'skills', 'profiles', 'projects'].includes(sectionName),
        id: sectionName,
        items: [],
        content: sectionName === 'summary' ? '<p>Professional summary</p>' : undefined
      };
    } else if (Array.isArray(fixed.sections[sectionName])) {
      // Convert array to object
      fixed.sections[sectionName] = {
        name: sectionName.charAt(0).toUpperCase() + sectionName.slice(1),
        columns: 1,
        separateLinks: true,
        visible: fixed.sections[sectionName].length > 0,
        id: sectionName,
        items: fixed.sections[sectionName]
      };
    } else if (typeof fixed.sections[sectionName] === 'object') {
      // Ensure object has all required properties
      fixed.sections[sectionName] = {
        name: fixed.sections[sectionName].name || sectionName.charAt(0).toUpperCase() + sectionName.slice(1),
        columns: fixed.sections[sectionName].columns || 1,
        separateLinks: fixed.sections[sectionName].separateLinks !== false,
        visible: fixed.sections[sectionName].visible !== false,
        id: fixed.sections[sectionName].id || sectionName,
        items: fixed.sections[sectionName].items || [],
        content: fixed.sections[sectionName].content
      };
    }
    
    // Ensure items is an array
    if (!Array.isArray(fixed.sections[sectionName].items)) {
      fixed.sections[sectionName].items = [];
    }
    
    // Add IDs to items if missing
    fixed.sections[sectionName].items = fixed.sections[sectionName].items.map((item: any, index: number) => ({
      ...item,
      id: item.id || this.generateCuid2(),
      visible: item.visible !== false
    }));
  });
  
  // 4. Ensure metadata exists
  if (!fixed.metadata || typeof fixed.metadata !== 'object') {
    fixed.metadata = {};
  }
  
  // Required metadata properties
  fixed.metadata = {
    template: fixed.metadata.template || "meridian",
    layout: fixed.metadata.layout || [
      [
        ["summary", "experience", "education", "references"],
        [
          "profiles",
          "skills",
          "certifications",
          "projects",
          "interests",
          "languages",
          "awards",
          "volunteer",
          "publications"
        ]
      ]
    ],
    css: fixed.metadata.css || { value: "", visible: false },
    page: fixed.metadata.page || {
      margin: 18,
      format: "a4",
      options: { breakLine: true, pageNumbers: true }
    },
    theme: fixed.metadata.theme || {
      background: "#ffffff",
      text: "#000000",
      primary: "#3b82f6"
    },
    typography: fixed.metadata.typography || {
      font: {
        family: "Inter",
        subset: "latin",
        variants: ["400", "500", "600", "700"],
        size: 13
      },
      lineHeight: 1.5,
      hideIcons: false,
      underlineLinks: true
    },
    notes: fixed.metadata.notes || "",
    aiGenerated: true,
    aiGeneratedAt: fixed.metadata.aiGeneratedAt || new Date().toISOString(),
    needsReview: fixed.metadata.needsReview !== false,
    confidence: typeof fixed.metadata.confidence === 'number' ? fixed.metadata.confidence : 0.85
  };
  
  console.log('✅ Comprehensive structure fix complete');
  return fixed;
}

  /**
   * Validate and complete resume structure
   */
  private validateAndCompleteResumeStructure(resumeData: any): void {
  console.log('🔧 Validating and completing resume structure...');
  
  // First, ensure all sections are proper objects
  this.ensureSectionObjectStructure(resumeData);
  
  // Ensure all required fields exist
  if (!resumeData.basics) resumeData.basics = {};
  if (!resumeData.sections) resumeData.sections = {};
  if (!resumeData.metadata) resumeData.metadata = {};
  
  // Add missing IDs for all items
  const sections = ['education', 'experience', 'skills', 'projects', 'profiles', 'certifications', 
                   'awards', 'languages', 'interests', 'publications', 'references', 'volunteer'];
  
  sections.forEach(section => {
    if (resumeData.sections[section]?.items && Array.isArray(resumeData.sections[section].items)) {
      resumeData.sections[section].items = resumeData.sections[section].items.map((item: any) => ({
        ...item,
        id: item.id || this.generateCuid2(),
        visible: item.visible !== undefined ? item.visible : true
      }));
    }
  });
  
  console.log('✅ Resume structure validated and completed');
}

private ensureSectionObjectStructure(resumeData: any): any {
  console.log('🔧 Ensuring all sections are proper objects...');
  
  if (!resumeData.sections || typeof resumeData.sections !== 'object') {
    resumeData.sections = {};
  }
  
  // Define the exact structure each section should have
  const sectionTemplates: Record<string, any> = {
    summary: {
      name: "Summary",
      columns: 1,
      separateLinks: true,
      visible: true,
      id: "summary",
      content: "<p>Professional summary based on experience.</p>"
    },
    awards: {
      name: "Awards",
      columns: 1,
      separateLinks: true,
      visible: false,
      id: "awards",
      items: []
    },
    certifications: {
      name: "Certifications",
      columns: 1,
      separateLinks: true,
      visible: false,
      id: "certifications",
      items: []
    },
    education: {
      name: "Education",
      columns: 1,
      separateLinks: true,
      visible: true,
      id: "education",
      items: []
    },
    experience: {
      name: "Experience",
      columns: 1,
      separateLinks: true,
      visible: true,
      id: "experience",
      items: []
    },
    volunteer: {
      name: "Volunteering",
      columns: 1,
      separateLinks: true,
      visible: false,
      id: "volunteer",
      items: []
    },
    interests: {
      name: "Interests",
      columns: 1,
      separateLinks: true,
      visible: false,
      id: "interests",
      items: []
    },
    languages: {
      name: "Languages",
      columns: 1,
      separateLinks: true,
      visible: false,
      id: "languages",
      items: []
    },
    profiles: {
      name: "Profiles",
      columns: 1,
      separateLinks: true,
      visible: true,
      id: "profiles",
      items: []
    },
    projects: {
      name: "Projects",
      columns: 1,
      separateLinks: true,
      visible: true,
      id: "projects",
      items: []
    },
    publications: {
      name: "Publications",
      columns: 1,
      separateLinks: true,
      visible: false,
      id: "publications",
      items: []
    },
    references: {
      name: "References",
      columns: 1,
      separateLinks: true,
      visible: false,
      id: "references",
      items: []
    },
    skills: {
      name: "Skills",
      columns: 1,
      separateLinks: true,
      visible: true,
      id: "skills",
      items: []
    },
    custom: {}
  };
  
  // Process each section to ensure it's an object
  Object.entries(sectionTemplates).forEach(([sectionName, template]) => {
    const currentSection = resumeData.sections[sectionName];
    
    if (currentSection === undefined || currentSection === null) {
      // Section doesn't exist, create it with template
      resumeData.sections[sectionName] = { ...template };
      console.log(`  Created missing section: ${sectionName}`);
    } else if (Array.isArray(currentSection)) {
      // Section is an array - CRITICAL: Convert to object
      console.log(`  Converting array to object for section: ${sectionName}`);
      resumeData.sections[sectionName] = {
        ...template,
        items: currentSection,
        visible: currentSection.length > 0 && template.visible
      };
    } else if (typeof currentSection === 'object') {
      // Section is an object - ensure it has all required properties
      resumeData.sections[sectionName] = {
        ...template,
        ...currentSection,
        id: currentSection.id || sectionName,
        name: currentSection.name || template.name,
        columns: currentSection.columns || template.columns,
        visible: currentSection.visible !== undefined ? currentSection.visible : template.visible,
        items: currentSection.items || template.items,
        content: currentSection.content || template.content,
      };
      
      // Ensure items is an array
      if (!Array.isArray(resumeData.sections[sectionName].items)) {
        resumeData.sections[sectionName].items = [];
      }
    }
  });
  
  console.log('✅ All sections are now proper objects');
  return resumeData;
}

/**
 * Generate CUID2-compatible ID
 */
private generateCuid2(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'c';
  for (let i = 0; i < 25; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
   * Add missing IDs to all items
   */
  private addMissingIds(resumeData: any): void {
    // Add IDs to section items
    const sections = ['education', 'experience', 'skills', 'projects', 'profiles', 'certifications'];
    
    sections.forEach(section => {
      if (resumeData.sections[section]?.items) {
        resumeData.sections[section].items = resumeData.sections[section].items.map((item: any) => ({
          ...item,
          id: item.id || uuidv4(),
          visible: item.visible !== undefined ? item.visible : true
        }));
      }
    });
  }

  /**
   * Text extraction methods (same as before)
   */
  private async extractTextFromPDF(buffer: Buffer, requestId: string): Promise<TextExtractionResult> {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      
      return {
        text: data.text || '',
        format: this.detectTextFormat(data.text || ''),
        confidence: data.text ? 0.9 : 0.3,
      };
    } catch (error: any) {
      this.logger.error(`[${requestId}] PDF extraction failed:`, error.message);
      
      try {
        const text = buffer.toString('utf-8', 0, 10000);
        return {
          text: text,
          format: 'plain',
          confidence: text.length > 100 ? 0.5 : 0.1,
        };
      } catch {
        throw new Error(`PDF extraction failed: ${error.message}`);
      }
    }
  }

  private async extractTextFromDOC(buffer: Buffer, requestId: string): Promise<TextExtractionResult> {
    try {
      const mammoth = (await import('mammoth')).default;
      const result = await mammoth.extractRawText({ buffer });
      
      return {
        text: result.value,
        format: this.detectTextFormat(result.value),
        confidence: 0.85,
      };
    } catch (error) {
      this.logger.error(`[${requestId}] DOC extraction failed:`, error);
      throw new Error(`Failed to extract text from DOC: ${(error as Error).message}`);
    }
  }

  private async extractFromLinkedIn(data: string, requestId: string): Promise<TextExtractionResult> {
    try {
      const parsed = JSON.parse(data);
      let text = '';
      
      if (parsed.Profile) {
        text += `Name: ${parsed.Profile.FirstName || ''} ${parsed.Profile.LastName || ''}\n`;
        text += `Headline: ${parsed.Profile.Headline || ''}\n`;
        text += `Summary: ${parsed.Profile.Summary || ''}\n\n`;
      }
      
      if (parsed.Positions && Array.isArray(parsed.Positions.values)) {
        text += "WORK EXPERIENCE:\n";
        parsed.Positions.values.forEach((pos: any) => {
          text += `${pos.title} at ${pos.companyName} (${pos.startDate?.year || ''} - ${pos.endDate?.year || 'Present'})\n`;
          text += `${pos.summary || ''}\n\n`;
        });
      }
      
      if (parsed.Educations && Array.isArray(parsed.Educations.values)) {
        text += "EDUCATION:\n";
        parsed.Educations.values.forEach((edu: any) => {
          text += `${edu.degree || ''} in ${edu.fieldOfStudy || ''} at ${edu.schoolName || ''}\n`;
          text += `${edu.startDate?.year || ''} - ${edu.endDate?.year || ''}\n\n`;
        });
      }
      
      if (parsed.Skills && Array.isArray(parsed.Skills.values)) {
        text += "SKILLS:\n";
        parsed.Skills.values.forEach((skill: any) => {
          text += `${skill.name || ''}\n`;
        });
      }
      
      return {
        text,
        format: 'structured',
        confidence: 0.95,
      };
    } catch (error) {
      this.logger.error(`[${requestId}] LinkedIn extraction failed:`, error);
      throw new Error(`Failed to parse LinkedIn data: ${(error as Error).message}`);
    }
  }

  /**
   * Detect text format
   */
  private detectTextFormat(text: string): 'markdown' | 'plain' | 'structured' {
    if (!text) return 'plain';
    
    const lines = text.split('\n');
    
    // Check for markdown
    if (text.includes('# ') || text.includes('## ') || text.includes('* ') || text.includes('- ')) {
      return 'markdown';
    }
    
    // Check for structured format
    const hasSections = text.includes('EXPERIENCE') || text.includes('EDUCATION') || 
                       text.includes('SKILLS') || text.includes('WORK');
    if (hasSections) {
      return 'structured';
    }
    
    return 'plain';
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
      throw new Error('GROQ_API_KEY not configured in environment variables');
    }

    try {
      const response = await lastValueFrom(
        this.httpService.post(
          this.groqApiUrl,
          {
            messages: [{ role: 'user', content: prompt }],
            model: model,
            temperature: 0.3,
            max_tokens: 8000, // Increased for complex processing
            top_p: 0.9,
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              'Authorization': `Bearer ${this.groqApiKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Reactive-Resume-AI-Builder/1.0',
            },
            timeout: 45000,
            validateStatus: () => true,
          }
        )
      );

      if (response.status !== 200) {
        this.logger.error(`[${requestId}] Groq API error response:`, response.data);
        throw new Error(`Groq API error ${response.status}: ${JSON.stringify(response.data)}`);
      }

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from Groq API');
      }

      return content;

    } catch (error: any) {
      this.logger.error(`[${requestId}] Groq API call failed:`, error.message);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Groq API request timed out after 45 seconds');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid Groq API key. Please check your configuration.');
      }
      
      throw new Error(`Groq API call failed: ${error.message || 'Unknown error'}`);
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
            temperature: 0.3,
            max_tokens: 8000,
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 45000,
          }
        )
      );

      return response.data.choices[0]?.message?.content || '';
    } catch (error: any) {
      this.logger.error(`[${requestId}] OpenAI API error:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Calculate cost
   */
  calculateCost(options: AIBuilderOptions, textLength: number): number {
    let cost = this.COSTS.TEXT_EXTRACTION;

    if (options.source === AIBuilderSource.PDF) cost += this.COSTS.PDF_PROCESSING;
    if (options.source === AIBuilderSource.DOC) cost += this.COSTS.DOC_PROCESSING;

    cost += this.COSTS.AI_BUILDING;

    // if (options.enhanceWithAI) cost += this.COSTS.ENHANCEMENT;
    // if (options.includeSuggestions) cost += this.COSTS.SUGGESTIONS;

    if (textLength > 5000) cost += 5;
    if (textLength > 10000) cost += 10;

    return cost;
  }




  /**
   * Get user's AI builder history
   */
  async getUserHistory(userId: string, limit: number = 10) {
    return this.prisma.resumeBuilderJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get AI builder statistics
   */
  async getStatistics(userId?: string) {
    const where = userId ? { userId } : {};
    
    const popularSourcesRaw = await this.prisma.resumeBuilderJob.groupBy({
      by: ['sourceType'],
      where: { ...where, status: AIBuilderStatus.COMPLETED },
      _count: {
        _all: true,
      },
    });

    const popularSources = popularSourcesRaw.map(source => ({
      sourceType: source.sourceType,
      count: source._count._all,
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    const [
      totalJobs,
      completedJobs,
      failedJobs,
      totalCost,
    ] = await Promise.all([
      this.prisma.resumeBuilderJob.count({ where }),
      this.prisma.resumeBuilderJob.count({ where: { ...where, status: AIBuilderStatus.COMPLETED } }),
      this.prisma.resumeBuilderJob.count({ where: { ...where, status: AIBuilderStatus.FAILED } }),
      this.prisma.resumeBuilderJob.aggregate({
        where: { ...where, status: AIBuilderStatus.COMPLETED },
        _sum: { cost: true },
      }),
    ]);

    return {
      totalJobs,
      completedJobs,
      failedJobs,
      successRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      totalCost: totalCost._sum?.cost || 0,
      popularSources,
    };
  }

  /**
   * Helper methods
   */
  private getPreferredModel(): string {
    if (this.groqApiKey) return 'llama-3.3-70b-versatile';
    if (this.openaiApiKey) return 'gpt-4-turbo-preview';
    throw new Error('No AI API key configured');
  }

  private generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async cleanupOldJobs(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const deleted = await this.prisma.resumeBuilderJob.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return { deleted: deleted.count };
  }
}