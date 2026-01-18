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
  
  // Cost configuration
  private readonly COSTS = {
    TEXT_EXTRACTION: 10,
    AI_BUILDING: 30,
    PDF_PROCESSING: 10,
    DOC_PROCESSING: 10,
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

  /**
   * Intelligent extraction prompt for AI
   */
 private buildIntelligentExtractionPrompt(
  text: string,
  options: AIBuilderOptions,
  format: string,
): string {
  return `You are a professional resume analyst. Extract information from this text and return a VALID JSON object.

CRITICAL: Return ONLY a JSON object with this EXACT structure:
{
  "extractedData": {
    "personal": {
      "name": "string or empty",
      "email": "string or empty", 
      "phone": "string or empty",
      "location": "string or empty",
      "headline": "string or empty",
      "summary": "string or empty"
    },
    "experience": [
      {
        "company": "string",
        "position": "string",
        "startDate": "string",
        "endDate": "string",
        "description": "string"
      }
    ],
    "education": [
      {
        "institution": "string", 
        "degree": "string",
        "fieldOfStudy": "string",
        "startDate": "string",
        "endDate": "string"
      }
    ],
    "skills": ["string"],
    "projects": [
      {
        "name": "string",
        "description": "string",
        "technologies": ["string"]
      }
    ]
  }
}

TEXT TO ANALYZE:
${text.substring(0, 5000)} ${text.length > 5000 ? '...[text truncated]' : ''}

IMPORTANT: Return ONLY the JSON object. No explanations, no markdown, no extra text.`;
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
        url: "",
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
      template: "regal",
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
      template: "regal",
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
      picture: { url: "", size: 128, aspectRatio: 1, borderRadius: 0 },
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
  console.log('🔄 Building exact schema from AI response');
  
  // Start with EXACT sample schema
  const resumeData = this.getSampleResumeSchema();
  
  const extractedData = aiResponse.extractedData || {};
  
  console.log('Extracted data:', {
    hasPersonal: !!extractedData.personal,
    hasExperience: extractedData.experience?.length || 0,
    hasEducation: extractedData.education?.length || 0,
    hasSkills: extractedData.skills?.length || 0
  });
  
  // 1. Populate basics from extracted data
  if (extractedData.personal && typeof extractedData.personal === 'object') {
    const personal = extractedData.personal;
    
    // SAFE property access with type checking
    if (typeof personal.name === 'string') resumeData.basics.name = personal.name;
    if (typeof personal.headline === 'string') resumeData.basics.headline = personal.headline;
    if (typeof personal.email === 'string') resumeData.basics.email = personal.email;
    if (typeof personal.phone === 'string') resumeData.basics.phone = personal.phone;
    if (typeof personal.location === 'string') resumeData.basics.location = personal.location;
    
    // Summary goes to summary section
    if (typeof personal.summary === 'string' && personal.summary.trim()) {
      resumeData.sections.summary.content = `<p>${personal.summary}</p>`;
    }
    
    // Website
    if (typeof personal.website === 'string') {
      resumeData.basics.url.href = personal.website;
    }
  }
  
  // 2. Populate education (CRITICAL: Must match exact structure)
  if (extractedData.education && Array.isArray(extractedData.education)) {
    resumeData.sections.education.items = extractedData.education.map((edu: any, index: number) => {
      // Create EXACT item structure
      return {
        id: this.generateCuid2(),
        visible: true,
        institution: this.safeString(edu.institution || edu.school || `Education ${index + 1}`),
        studyType: this.safeString(edu.studyType || edu.degree || "Degree"),
        area: this.safeString(edu.area || edu.location || edu.fieldOfStudy || ""),
        score: this.safeString(edu.score || edu.gpa || ""),
        date: this.formatDateRange(edu.startDate, edu.endDate),
        summary: this.safeString(edu.summary || edu.description || ""),
        url: {
          label: "",
          href: this.safeString(edu.website || edu.url || "")
        }
      };
    });
    resumeData.sections.education.visible = resumeData.sections.education.items.length > 0;
  }
  
  // 3. Populate experience (CRITICAL: Must match exact structure)
  if (extractedData.experience && Array.isArray(extractedData.experience)) {
    resumeData.sections.experience.items = extractedData.experience.map((exp: any, index: number) => {
      // Create EXACT item structure
      return {
        id: this.generateCuid2(),
        visible: true,
        company: this.safeString(exp.company || exp.employer || `Company ${index + 1}`),
        position: this.safeString(exp.position || exp.title || `Role ${index + 1}`),
        location: this.safeString(exp.location || exp.area || ""),
        date: this.formatDateRange(exp.startDate, exp.endDate),
        summary: this.formatExperienceSummary(exp),
        url: {
          label: "",
          href: this.safeString(exp.website || exp.url || "")
        }
      };
    });
    resumeData.sections.experience.visible = resumeData.sections.experience.items.length > 0;
  }
  
  // 4. Populate skills (CRITICAL: Must match exact structure)
  if (extractedData.skills && Array.isArray(extractedData.skills)) {
    // Group skills by category
    const groupedSkills = this.groupSkillsByCategory(extractedData.skills);
    
    resumeData.sections.skills.items = groupedSkills.map((group: any, index: number) => {
      return {
        id: this.generateCuid2(),
        visible: true,
        name: this.safeString(group.category || `Skills ${index + 1}`),
        description: this.safeString(group.description || this.getSkillLevelDescription(group.skills)),
        level: 0, // Fixed at 0 as per sample
        keywords: group.keywords.slice(0, 10) // Limit to 10 keywords
      };
    });
    resumeData.sections.skills.visible = resumeData.sections.skills.items.length > 0;
  }
  
  // 5. Populate projects
  if (extractedData.projects && Array.isArray(extractedData.projects)) {
    resumeData.sections.projects.items = extractedData.projects.map((project: any, index: number) => {
      return {
        id: this.generateCuid2(),
        visible: true,
        name: this.safeString(project.name || project.title || `Project ${index + 1}`),
        description: this.safeString(project.role || project.position || ""),
        date: this.safeString(project.date || project.duration || ""),
        summary: `<p>${this.safeString(project.summary || project.description || "")}</p>`,
        keywords: Array.isArray(project.technologies) ? project.technologies : [],
        url: {
          label: "",
          href: this.safeString(project.website || project.url || project.link || "")
        }
      };
    });
    resumeData.sections.projects.visible = resumeData.sections.projects.items.length > 0;
  }
  
  // 6. Populate profiles
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
    }).filter((p: any) => p.network); // Filter out empty profiles
    resumeData.sections.profiles.visible = resumeData.sections.profiles.items.length > 0;
  }
  
  // 7. Set AI metadata
  resumeData.metadata.aiGenerated = true;
  resumeData.metadata.aiGeneratedAt = new Date().toISOString();
  resumeData.metadata.needsReview = aiResponse.needsReview !== false;
  resumeData.metadata.confidence = Math.min(Math.max(aiResponse.confidence || 0.85, 0), 1);
  
  // CRITICAL: Ensure all sections are proper objects before returning
  console.log('🔧 Final structure validation and fixing...');
  // const finalResumeData = this.ensureSectionObjectStructure(resumeData);

  console.log('🔧 Applying comprehensive structure fix...');
  const finalResumeData = this.validateAndFixResumeStructureCompletely(resumeData);
  
  
  // Validate structure
  console.log('✅ Final resume structure validation:');
  this.validateFinalStructure(finalResumeData);
  
  console.log('✅ Final resume structure built:', {
    sections: Object.keys(finalResumeData.sections),
    sectionTypes: Object.entries(finalResumeData.sections).map(([key, value]) => ({
      key,
      type: Array.isArray(value) ? 'ARRAY' : typeof value
    })),
    itemsCount: {
      education: finalResumeData.sections.education.items.length,
      experience: finalResumeData.sections.experience.items.length,
      skills: finalResumeData.sections.skills.items.length,
      projects: finalResumeData.sections.projects.items.length
    }
  });


  
  
  return finalResumeData;
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
      else if (prop === 'picture') fixed.basics.picture = { url: "", size: 128, aspectRatio: 1, borderRadius: 0, effects: { hidden: false, border: false, grayscale: false } };
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
    template: fixed.metadata.template || "regal",
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