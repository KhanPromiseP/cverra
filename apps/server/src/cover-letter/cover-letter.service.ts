

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from 'nestjs-prisma';
import { CoverLetter, CoverLetterStyle } from '@prisma/client';
import { lastValueFrom } from 'rxjs';

import { CreateCoverLetterDto,  TranslateLetterDto, TranslationMethod, TranslationPreservation, TranslationStatus  } from './dto/create-cover-letter.dto';
import { EnhanceBlockDto } from './dto/enhance-block.dto';
import { UpdateCoverLetterDto } from './dto/update-cover-letter.dto';
import { TemplateService } from './templates/template.service';
import { TemplateLayoutGenerator } from './utils/template-layouts';
import { EnhancedPromptBuilder } from './utils/enhanced-prompt-builder';
import { LetterFlowType, getLetterFlow } from './utils/letter-flows';

// Type guard to check if a string is a valid CoverLetterStyle
function isCoverLetterStyle(style: string): style is CoverLetterStyle {
  return Object.values(CoverLetterStyle).includes(style as CoverLetterStyle);
}

// Helper function to ensure JSON serializability
function ensureJsonSerializable(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

@Injectable()
export class CoverLetterService {
  private readonly logger = new Logger(CoverLetterService.name);
  private readonly groqApiKey: string;
  private readonly groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private templateService: TemplateService,
    private httpService: HttpService
  ) {
    const key = this.config.get('GROQ_API_KEY');
    if (!key) throw new Error('GROQ_API_KEY is not set in .env');
    this.groqApiKey = key;
  }

  private async generateContent(prompt: string): Promise<string> {
    try {
      this.logger.log('Sending request to Groq API...');
      
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
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 4000,
            top_p: 1,
            stream: false,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.groqApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 second timeout
          }
        )
      );

      const content = response.data.choices[0]?.message?.content || '';
      this.logger.log('Successfully received response from Groq API');
      return content;
    } catch (error) {
      this.logger.error('Groq API error:', error.response?.data || error.message);
      throw new Error(`Failed to generate content: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private getStyleInstructions(style: CoverLetterStyle): string {
    const styles: Record<CoverLetterStyle, string> = {
      [CoverLetterStyle.Modern]: "Use a contemporary, clean layout with professional but approachable language. Focus on achievements and impact.",
      [CoverLetterStyle.Traditional]: "Use a classic, formal structure with conservative language. Emphasize experience and qualifications.",
      [CoverLetterStyle.Executive]: "Use sophisticated, strategic language focusing on leadership and business impact. More formal and results-oriented.",
      [CoverLetterStyle.Creative]: "Use innovative language and structure. Can be more personal and story-driven. Good for design/creative roles.",
      [CoverLetterStyle.Minimalist]: "Use concise, direct language with clean structure. Focus on essential information only.",
      [CoverLetterStyle.Professional]: "Balanced approach - professional but not too formal. Emphasizes skills and value proposition.",
      [CoverLetterStyle.Academic]: "Formal academic tone emphasizing research, publications, and academic achievements.",
      [CoverLetterStyle.Technical]: "Structured approach focusing on technical skills, projects, and specific technologies."
    };
    
    return styles[style] || styles[CoverLetterStyle.Professional];
  }

  // Category-specific prompt builders
  private buildCategorySpecificPrompt(category: string, data: any): string {
    const categoryPrompts: Record<string, string> = {
      // Job Application
      'Job Application': `JOB APPLICATION CONTEXT:
- Position: ${data.position || 'Not specified'}
- Company: ${data.company || 'Not specified'}
- Hiring Manager: ${data.hiringManager || 'Sir/Mme'}
- Job Description: ${data.jobDescription || 'Not provided'}

Focus on: Professional qualifications, relevant experience, skills matching the job requirements, enthusiasm for the role and company, and clear call to action for next steps.`,

      // Internship Application
      'Internship Application': `INTERNSHIP APPLICATION CONTEXT:
- Position: ${data.position || 'Internship Position'}
- Company: ${data.company || 'Not specified'}
- Department: ${data.department || 'Not specified'}
- Academic Level: ${data.academicLevel || 'Not specified'}

Focus on: Academic achievements, relevant coursework, eagerness to learn, transferable skills, enthusiasm for the industry, and willingness to contribute.`,

      // Scholarship/Academic Request
      'Scholarship/Academic Request': `SCHOLARSHIP/ACADEMIC REQUEST CONTEXT:
- Scholarship/Program: ${data.programName || 'Not specified'}
- Institution: ${data.institution || 'Not specified'}
- Field of Study: ${data.fieldOfStudy || 'Not specified'}
- Academic Achievements: ${data.academicAchievements || 'Not provided'}

Focus on: Academic excellence, research interests, career goals, financial need (if applicable), contributions to academic community, and alignment with program objectives.`,

      // Business Partnership Proposal
      'Business Partnership Proposal': `BUSINESS PARTNERSHIP PROPOSAL CONTEXT:
- Company/Organization: ${data.company || 'Not specified'}
- Partnership Type: ${data.partnershipType || 'Strategic Partnership'}
- Proposed Collaboration: ${data.collaborationDetails || 'Not specified'}

Focus on: Mutual benefits, strategic alignment, value proposition, proposed terms, success metrics, and next steps for discussion.`,

      // Contract / Offer Negotiation
      'Contract / Offer Negotiation': `CONTRACT/OFFER NEGOTIATION CONTEXT:
- Position: ${data.position || 'Not specified'}
- Company: ${data.company || 'Not specified'}
- Current Offer: ${data.currentOffer || 'Not specified'}
- Negotiation Points: ${data.negotiationPoints || 'Not provided'}

Focus on: Professional tone, clear rationale for requests, value proposition, flexibility, and maintaining positive relationship.`,

      // Recommendation Request
      'Recommendation Request': `RECOMMENDATION REQUEST CONTEXT:
- Purpose: ${data.purpose || 'Not specified (e.g., job, scholarship, program)'}
- Relationship: ${data.relationship || 'Not specified'}
- Key Points to Highlight: ${data.keyPoints || 'Not provided'}

Focus on: Respectful tone, clear request, relevant context about the opportunity, suggested talking points, and appreciation for their time.`,

      // Apology Letter
      'Apology Letter': `APOLOGY LETTER CONTEXT:
- Situation: ${data.situation || 'Not specified'}
- Impact: ${data.impact || 'Not specified'}
- Resolution: ${data.resolution || 'Steps being taken to address the issue'}

Focus on: Sincere apology, acknowledgment of impact, taking responsibility, corrective actions, and commitment to improvement.`,

      // Appreciation Letter
      'Appreciation Letter': `APPRECIATION LETTER CONTEXT:
- Recipient: ${data.recipient || 'Not specified'}
- Reason for Appreciation: ${data.reason || 'Not specified'}
- Impact: ${data.impact || 'How their actions helped you'}

Focus on: Genuine gratitude, specific examples, emotional tone, and lasting impact of their actions.`,

      // Letter to Parent/Relative
      'Letter to Parent/Relative': `PERSONAL LETTER CONTEXT:
- Relationship: ${data.relationship || 'Family member/Relative'}
- Purpose: ${data.purpose || 'Personal update, sharing news, etc.'}
- Personal Context: ${data.personalContext || 'Not specified'}

Focus on: Warm, personal tone, emotional connection, family updates, and genuine care. Use appropriate level of formality based on relationship.`,

      // Visa Request / Embassy Letter
      'Visa Request / Embassy Letter': `OFFICIAL EMBASSY/VISA REQUEST CONTEXT:
- Purpose of Travel: ${data.travelPurpose || 'Not specified'}
- Destination: ${data.destination || 'Not specified'}
- Duration: ${data.duration || 'Not specified'}
- Supporting Documents: ${data.supportingDocs || 'Not specified'}

Focus on: Formal, respectful tone, clear purpose, compliance with requirements, supporting evidence, and professional presentation.`,

      // Complaint Letter
      'Complaint Letter': `COMPLAINT LETTER CONTEXT:
- Issue: ${data.issue || 'Not specified'}
- Product/Service: ${data.productService || 'Not specified'}
- Desired Resolution: ${data.desiredResolution || 'Not specified'}

Focus on: Professional tone, clear description of issue, specific facts, reasonable requests, and desired outcome.`,

      // General Official Correspondence
      'General Official Correspondence': `GENERAL OFFICIAL CORRESPONDENCE CONTEXT:
- Purpose: ${data.purpose || 'Not specified'}
- Recipient: ${data.recipient || 'Not specified'}
- Key Information: ${data.keyInformation || 'Not specified'}

Focus on: Professional tone, clear communication, appropriate formality, and specific purpose.`
    };

    return categoryPrompts[category] || categoryPrompts['General Official Correspondence'];
  }

  // Get user resume data
  private async getUserResumeData(userId: string): Promise<any> {
    try {
      const resume = await this.prisma.resume.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      });

      if (!resume || !resume.data) {
        return null;
      }

      const resumeData = resume.data as any;
      
      // Extract key information from resume
      return {
        skills: resumeData.skills || [],
        experience: resumeData.experience || [],
        education: resumeData.education || [],
        certifications: resumeData.certifications || [],
        projects: resumeData.projects || [],
        achievements: resumeData.achievements || []
      };
    } catch (error) {
      this.logger.warn('Could not fetch resume data for user:', userId);
      return null;
    }
  }

  // Enhanced prompt builder with category awareness
private async buildEnhancedPrompt(params: {
  userData: any;
  jobData: any;
  style: CoverLetterStyle;
  layout?: string;
  structure?: any;
  customInstructions?: string;
  category: string;
  userId: string;
  selectedResumeId?: string;
  language?: string;
}): Promise<string> {
  const { userData, jobData, style, layout, structure, customInstructions, category, userId, selectedResumeId, language } = params;
  
  const flow = getLetterFlow(category);
  
  const resumeData = selectedResumeId 
    ? await this.getResumeById(userId, selectedResumeId)
    : await this.getUserResumeData(userId);

  // Use the enhanced prompt builder
  const prompt = EnhancedPromptBuilder.buildPromptWithLanguageOverride(
    category,
    userData,
    jobData,
    style,
    flow,
    resumeData,
    customInstructions,
    language
  );

  const templateInstructions = layout ? 
    `TEMPLATE: ${layout}\nSTRUCTURE: ${JSON.stringify(structure)}` : '';

  const resumeContext = this.buildResumeContext(resumeData);

  // 🔥 CRITICAL FIX: Add STRICT output instructions
  return `🚨 STRICT OUTPUT RULES:
1. OUTPUT ONLY the final letter text with section markers
2. NEVER include explanations, reasoning, or commentary
3. NEVER include formatting tool text like "✓ Editing", "Ctrl+Enter", "Esc to revert"
4. NEVER include your thought process or decisions
5. If unsure about structure, make silent decisions and output the correct format

📌 LANGUAGE REQUIREMENT: ${language ? `Write ENTIRE letter in ${language.toUpperCase()}` : 'Match the language of user inputs'}

${prompt}

${templateInstructions}
${resumeContext}

🎯 FINAL OUTPUT FORMAT:
- Use EXACT section markers: [CONTACT_INFO], [DATE], etc.
- NO extra text before or after markers
- NO explanations within sections
- Clean, professional letter only

⚠️ VIOLATION WARNING: Any explanations, reasoning, or commentary in your response will cause the entire generation to fail.`;
}

// Build resume context for prompt

private buildResumeContext(resumeData: any): string {
  if (!resumeData) {
    return 'RESUME CONTEXT: No resume data available';
  }

  const basics = resumeData.basics || {};
  const skills = resumeData.skills || [];
  const experience = resumeData.experience || [];
  const education = resumeData.education || [];
  const projects = resumeData.projects || [];
  const achievements = resumeData.achievements || [];

  // Format experience for prompt
  const formattedExperience = experience.slice(0, 3).map((exp: any) => {
    const period = exp.startDate && exp.endDate 
      ? `(${exp.startDate} - ${exp.endDate})`
      : exp.startDate 
      ? `(${exp.startDate} - Present)`
      : '';
    
    return `${exp.position} at ${exp.company} ${period}${exp.summary ? `: ${exp.summary}` : ''}`;
  }).join('; ');

  // Format education for prompt
  const formattedEducation = education.slice(0, 2).map((edu: any) => 
    `${edu.degree} in ${edu.area} from ${edu.institution}`
  ).join('; ');

  // Format achievements
  const formattedAchievements = achievements.slice(0, 3).map((ach: any) => 
    `${ach.title}${ach.awarder ? ` from ${ach.awarder}` : ''}${ach.date ? ` (${ach.date})` : ''}`
  ).join('; ');

  // Format projects
  const formattedProjects = projects.slice(0, 2).map((proj: any) => 
    `${proj.name}: ${proj.description}`
  ).join('; ');

  return `RESUME CONTEXT:
- Name: ${basics.name || 'Not specified'}
- Email: ${basics.email || 'Not specified'}
- Phone: ${basics.phone || 'Not specified'}
- Location: ${basics.location || 'Not specified'}
- Professional Summary: ${basics.summary || 'Not specified'}
- Key Skills: ${skills.slice(0, 15).join(', ')}
- Recent Experience: ${formattedExperience || 'None'}
- Education: ${formattedEducation || 'None'}
- Key Projects: ${formattedProjects || 'None'}
- Achievements: ${formattedAchievements || 'None'}`;
}

// Fetch resume by ID
private async getResumeById(userId: string, resumeId: string): Promise<any> {
  try {
    const resume = await this.prisma.resume.findFirst({
      where: { 
        id: resumeId,
        userId 
      }
    });

    if (!resume || !resume.data) {
      this.logger.warn(`Resume ${resumeId} not found for user ${userId}`);
      return null;
    }

    const resumeData = resume.data as any;
    const basics = resumeData.basics || {};
    
    // Extract skills properly - handle both array of strings and array of objects
    const skills = (resumeData.skills || []).map((skill: any) => 
      typeof skill === 'string' ? skill : skill.name || ''
    ).filter(Boolean);

    // Extract work experience properly
    const workExperience = resumeData.work || [];
    const experience = workExperience.map((job: any) => ({
      position: job.position || job.name || '',
      company: job.company || job.employer || '',
      startDate: job.startDate || '',
      endDate: job.endDate || 'Present',
      summary: job.summary || '',
      highlights: job.highlights || []
    }));

    // Extract education
    const education = (resumeData.education || []).map((edu: any) => ({
      institution: edu.institution || edu.school || '',
      degree: edu.degree || edu.studyType || '',
      area: edu.area || edu.field || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || ''
    }));

    // Extract projects
    const projects = (resumeData.projects || []).map((project: any) => ({
      name: project.name || '',
      description: project.description || '',
      highlights: project.highlights || []
    }));

    // Extract awards/achievements
    const awards = (resumeData.awards || []).map((award: any) => ({
      title: award.title || '',
      awarder: award.awarder || '',
      date: award.date || '',
      summary: award.summary || ''
    }));

    return {
      basics: {
        name: basics.name || '',
        email: basics.email || '',
        phone: basics.phone || '',
        location: basics.location || '',
        summary: basics.summary || ''
      },
      skills,
      experience,
      education,
      projects,
      achievements: awards,
      certifications: resumeData.certifications || []
    };
  } catch (error) {
    this.logger.error(`Error fetching resume ${resumeId} for user ${userId}:`, error);
    return null;
  }
}

/**
 * Get all available templates for the frontend
 */
async getTemplates() {
  return this.templateService.getAllTemplates();
}

/**
 * Get templates by category for the frontend
 */
async getTemplatesByCategory(category: string) {
  return this.templateService.getTemplatesByCategory(category as any);
}

/**
 * Get template by ID for the frontend
 */
async getTemplateById(id: string) {
  const template = this.templateService.getTemplateById(id);
  if (!template) {
    throw new NotFoundException(`Template with id ${id} not found`);
  }
  return template;
}

/**
 * Get all template categories for the frontend
 */
async getTemplateCategories() {
  return this.templateService.getCategories();
}

/**
 * Apply a template to a cover letter
 * This is the backend implementation for the frontend applyTemplate call
 */
async applyTemplateToCoverLetter(userId: string, coverLetterId: string, templateId: string) {
  // Verify the cover letter exists and belongs to the user
  const coverLetter = await this.prisma.coverLetter.findFirst({
    where: { id: coverLetterId, userId }
  });

  if (!coverLetter) {
    throw new NotFoundException('Cover letter not found');
  }

  // Get the template
  const template = this.templateService.getTemplateById(templateId);
  if (!template) {
    throw new NotFoundException('Template not found');
  }

  // Update the cover letter with the new template
  const updatedCoverLetter = await this.prisma.coverLetter.update({
    where: { id: coverLetterId },
    data: {
      style: template.style,
      layout: template.id,
      content: {
        ...(coverLetter.content as object),
        layoutType: template.layout,
        structure: ensureJsonSerializable(template.structure),
        style: template.style,
        lastSaved: new Date().toISOString()
      },
      updatedAt: new Date()
    }
  });

  return {
    success: true,
    coverLetter: updatedCoverLetter,
    template: template
  };
}

/**
 * Search templates by query for the frontend
 */
async searchTemplates(query: string) {
  return this.templateService.searchTemplates(query);
}

/**
 * Get featured templates for the frontend
 */
async getFeaturedTemplates() {
  return this.templateService.getFeaturedTemplates();
}

/**
 * Get popular templates for the frontend
 */
async getPopularTemplates() {
  return this.templateService.getPopularTemplates();
}

/**
 * Get template statistics for the frontend
 */
async getTemplateStats() {
  return this.templateService.getTemplateStats();
}

  

  async applyTemplate(userId: string, coverLetterId: string, templateId: string) {
    const template = this.templateService.getTemplateById(templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    
    const currentCoverLetter = await this.findOne(userId, coverLetterId);
    
    const updatedCoverLetter = await this.update(userId, coverLetterId, {
      style: template.style,
      layout: template.id,
      content: {
        ...(currentCoverLetter.content as object),
        layoutType: template.layout,
        structure: ensureJsonSerializable(template.structure),
        style: template.style,
        lastSaved: new Date().toISOString()
      }
    } as any);

    return {
      success: true,
      coverLetter: updatedCoverLetter,
      template: template
    };
  }

  async regenerateBlock(userId: string, id: string, blockId: string, transactionId?: string) {
  // Log transaction ID if provided
  if (transactionId) {
    this.logger.log(`Processing AI regeneration with transaction ID: ${transactionId}`);
  }

  const coverLetter = await this.prisma.coverLetter.findFirst({
    where: { id, userId }
  });

  if (!coverLetter) {
    throw new NotFoundException('Cover letter not found');
  }

  const content = coverLetter.content as any;
  const block = content.blocks.find((b: any) => b.id === blockId);

  if (!block) {
    throw new NotFoundException('Block not found');
  }

  const userData = this.extractUserDataFromContent(content);
  const jobData = this.extractJobDataFromContent(content);
  const category = content.category || 'Job Application';

  const regeneratedContent = await this.regenerateSection(
    block,
    coverLetter.style,
    userData,
    jobData,
    category,
    userId,
    transactionId // Pass transaction ID to AI service if needed
  );

  const updatedBlocks = content.blocks.map((b: any) =>
    b.id === blockId ? { ...b, content: regeneratedContent } : b
  );

  const updatedCoverLetter = await this.prisma.coverLetter.update({
    where: { id },
    data: {
      content: {
        ...content,
        blocks: updatedBlocks,
        lastSaved: new Date().toISOString()
      }
    }
  });

  return {
    success: true,
    block: { id: blockId, content: regeneratedContent },
    coverLetter: updatedCoverLetter,
    transactionId // Return transaction ID in response
  };
}

 private async regenerateSection(
  block: any, 
  style: CoverLetterStyle, 
  userData: any, 
  jobData: any,
  category: string,
  userId: string,
  transactionid?: string
): Promise<string> {
  
  const blockTypeInstructions: Record<string, string> = {
    'contact_info': 'Generate a professional contact information section with name and relevant details based on the letter category. Maintain the same key information but improve formatting and presentation.',
    'date': 'Generate current date in proper format that matches the letter style.',
    'greeting': `Generate an appropriate greeting for a ${category.toLowerCase()} that maintains professionalism while being engaging.`,
    'intro_paragraph': `Generate a compelling introduction paragraph for a ${category.toLowerCase()} that grabs attention while maintaining relevance to the context.`,
    'body_paragraph': `Generate a body paragraph for a ${category.toLowerCase()} that develops the key points effectively while maintaining flow and coherence.`,
    'closing_paragraph': 'Generate a professional closing paragraph that reinforces the main message and includes appropriate next steps.',
    'signature': 'Generate a professional signature block with appropriate closing and contact information.'
  };

  const resumeData = await this.getUserResumeData(userId);
  const resumeContext = resumeData ? `RESUME CONTEXT AVAILABLE: Yes (${resumeData.skills?.length || 0} skills, ${resumeData.experience?.length || 0} experiences)` : 'RESUME CONTEXT AVAILABLE: No';

  // Enhanced prompt with current content context
  const prompt = `You are regenerating and improving a specific section of a ${category.toLowerCase()} letter. 

CRITICAL CONTEXT - CURRENT SECTION CONTENT:
"${block.content}"

SECTION TYPE: ${block.type}
SECTION PURPOSE: ${blockTypeInstructions[block.type] || 'Professional content appropriate for the letter category'}

CATEGORY: ${category}
${this.buildCategorySpecificPrompt(category, { ...userData, ...jobData })}

USER INFORMATION:
- Name: ${userData.name || 'Sender'}
- Contact: ${userData.email || 'Not provided'}
${resumeContext}

STYLE: ${style}
${this.getStyleInstructions(style)}

LANGUAGE REQUIREMENT: Maintain the exact same language as the current section content. Do not change the language.

REGENERATION GUIDELINES:
1. PRESERVE CORE CONTENT: Maintain the essential information and key points from the current section
2. MAINTAIN LANGUAGE: Keep the exact same language as the original (do not translate)
3. IMPROVE QUALITY: Enhance language, clarity, and impact while keeping the same meaning
4. MAINTAIN LENGTH: Keep similar length (neither significantly longer nor shorter)
5. STYLE CONSISTENCY: Ensure the regenerated content matches the ${style} style
6. CONTEXT AWARENESS: Keep relevance to the ${category} context and user information
7. FLOW PRESERVATION: Ensure the regenerated section flows naturally with the rest of the letter

IMPORTANT: 
- Return ONLY the regenerated section content without any markers, explanations, or additional text
- Maintain the same language and key information points but express them more effectively
- Keep the tone appropriate for the category and style
- Ensure the content length is comparable to the original`;

  return await this.generateContent(prompt);
}


/**
 * Extract blocks from content, handling different structures
 */
private extractBlocksFromContent(content: any): any[] {
  if (!content) return [];
  
  console.log('🔍 extractBlocksFromContent:', {
    contentType: typeof content,
    contentKeys: Object.keys(content || {})
  });
  
  // Method 1: Direct blocks
  if (content.blocks && Array.isArray(content.blocks)) {
    console.log('✅ Found blocks directly');
    return content.blocks;
  }
  
  // Method 2: Nested in data
  if (content.data?.blocks && Array.isArray(content.data.blocks)) {
    console.log('✅ Found blocks in data');
    return content.data.blocks;
  }
  
  // Method 3: Parse from layout
  if (content.layout?.blocks && Array.isArray(content.layout.blocks)) {
    console.log('✅ Found blocks in layout');
    return content.layout.blocks;
  }
  
  // Method 4: Try to parse from document structure
  if (content.document?.blocks && Array.isArray(content.document.blocks)) {
    console.log('✅ Found blocks in document');
    return content.document.blocks;
  }
  
  // Method 5: Content might be stored as JSON string
  if (typeof content === 'string') {
    try {
      console.log('🔄 Parsing content as JSON string');
      const parsed = JSON.parse(content);
      return this.extractBlocksFromContent(parsed);
    } catch (e) {
      console.log('❌ Not a JSON string');
    }
  }
  
  // Method 6: Check for Prisma set property
  if (content && typeof content === 'object' && 'set' in content) {
    console.log('🔄 Found Prisma set property');
    return this.extractBlocksFromContent(content.set);
  }
  
  console.warn('⚠️ No blocks found in content');
  return [];
}


  private extractUserDataFromContent(content: any): any {
    // const headerBlock = content.blocks.find((b: any) => b.type === 'header');
    const contactBlock = content.blocks.find((b: any) => b.type === 'contact_info');
    
    return {
      name: this.extractNameFromHeader(contactBlock?.content),
      email: this.extractEmailFromContact(contactBlock?.content),
      phone: this.extractPhoneFromContact(contactBlock?.content),
      address: this.extractAddressFromContact(contactBlock?.content)
    };
  }

  private extractJobDataFromContent(content: any): any {
    return {
      position: content.jobData?.position || 'the position',
      company: content.jobData?.company || 'the company',
      hiringManager: content.jobData?.hiringManager || 'Recipient'
    };
  }

  private extractNameFromHeader(headerContent: string): string {
    if (!headerContent) return 'Sender';
    const lines = headerContent.split('\n').filter(line => line.trim());
    return lines[0]?.trim() || 'Sender';
  }

  private extractEmailFromContact(contactContent: string): string {
    if (!contactContent) return '';
    const emailMatch = contactContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return emailMatch ? emailMatch[0] : '';
  }

  private extractPhoneFromContact(contactContent: string): string {
    if (!contactContent) return '';
    const phoneMatch = contactContent.match(/[\+]?[1-9][\d]{0,15}/);
    return phoneMatch ? phoneMatch[0] : '';
  }

  private extractAddressFromContact(contactContent: string): string {
    if (!contactContent) return '';
    // Simple address extraction - look for multi-line content
    const lines = contactContent.split('\n').filter(line => line.trim());
    if (lines.length > 2) {
      return lines.slice(1, 3).join(', ');
    }
    return '';
  }

  private parseContentToBlocks(content: string): any[] {
    const blocks = [];
    const sectionRegex = /\[(\w+)\]([\s\S]*?)(?=\[\w+\]|$)/g;
    let match;

    while ((match = sectionRegex.exec(content)) !== null) {
      const [, type, text] = match;
      blocks.push({
        id: `${type.toLowerCase()}-${Date.now()}`,
        type: type.toLowerCase(),
        content: text.trim(),
        formatting: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: this.getDefaultFontSize(type),
          alignment: 'left'
        }
      });
    }

    if (blocks.length === 0) {
      blocks.push({
        id: 'content-1',
        type: 'content',
        content: content,
        formatting: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: '14px',
          alignment: 'left'
        }
      });
    }

    return blocks;
  }

  private getDefaultFontSize(type: string): string {
    const sizes: Record<string, string> = {
      // header: '24px',
      contact_info: '14px',
      date: '14px',
      greeting: '16px',
      body_paragraph_1: '14px',
      body_paragraph_2: '14px', 
      body_paragraph_3: '14px',
      closing: '14px',
      signature: '16px'
    };
    return sizes[type] || '14px';
  }

  private generateSlug(title: string, userId?: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  
  // Add timestamp and random string for uniqueness
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  
  return `${baseSlug}-${timestamp}${random}`;
}

private validateTemplate(layout: string): string {
  const template = this.templateService.getTemplateById(layout);
  if (!template) {
    this.logger.warn(`Template ${layout} not found, using default`);
    return 'modern-professional'; // Your default template ID
  }
  return layout;
}



async generateCoverLetter(userId: string, createCoverLetterDto: CreateCoverLetterDto) {
  try {
    this.logger.log(`Generating cover letter for user ${userId}`);
    
    // Extract language from DTO (frontend will send this)
    const languageOverride = (createCoverLetterDto as any).language;
    const selectedResumeId = (createCoverLetterDto as any).selectedResumeId;
    
    // Log language info
    if (languageOverride) {
      this.logger.log(`Language override detected: ${languageOverride}`);
    } else {
      this.logger.log(`No language override - using auto-detection from inputs`);
    }
    
    const style = isCoverLetterStyle(createCoverLetterDto.style) 
      ? createCoverLetterDto.style 
      : CoverLetterStyle.Professional;

    const layout = this.validateTemplate((createCoverLetterDto as any).layout || 'modern-professional');
    const template = this.templateService.getTemplateById(layout);
    
    if (!template) {
      this.logger.warn(`Template ${layout} not found, using default 'modern-professional'`);
      const defaultLayout = 'modern-professional';
      const template = this.templateService.getTemplateById(defaultLayout);
      if (!template) {
        throw new Error(`Default template ${defaultLayout} not found`);
      }
    }
    
    const structure = template?.structure || this.templateService.getTemplateStructure(layout);
    const category = (createCoverLetterDto as any).category || 'Job Application';

    const prompt = await this.buildEnhancedPrompt({
      ...createCoverLetterDto,
      style,
      layout,
      structure,
      category,
      userId,
      selectedResumeId,
      language: languageOverride  // Pass language to prompt builder
    });
    
    const content = await this.generateContent(prompt);
    
    // 🔥 CRITICAL: Clean AI reasoning from content
    const cleanedContent = this.cleanAIGeneratedContent(content);
    
    const blocks = this.parseContentToBlocks(cleanedContent);
    const enhancedLayout = TemplateLayoutGenerator.generateLayout(structure, blocks);
    

    const serializableContent = {
      blocks: ensureJsonSerializable(blocks),
      layout: ensureJsonSerializable(enhancedLayout),
      style: createCoverLetterDto.style,
      layoutType: layout,
      structure: ensureJsonSerializable(structure),
      category: category,
      lastSaved: new Date().toISOString(),
      resumeUsed: selectedResumeId || null,
      language: languageOverride || 'auto-detected'  // Store language info
    };

    const coverLetter = await this.prisma.coverLetter.create({
      data: {
        title: createCoverLetterDto.title,
        slug: this.generateSlug(createCoverLetterDto.title),
        content: serializableContent,
        style: style,
        layout: layout,
        userId,
        isPublic: false
      }
    });

    return {
      success: true,
      coverLetter,
      blocks,
      layout: enhancedLayout,
      template: template,
      language: languageOverride || 'auto-detected'
    };
  } catch (error) {
    this.logger.error('Cover letter generation failed:', error);
    throw new Error('Failed to generate cover letter: ' + error.message);
  }
}


private cleanAIGeneratedContent(content: string): string {
  const cleanupPatterns = [
    // Remove tool interface text
    /✓ Editing • Ctrl\+Enter to save • Esc to revert/gi,
    /Click to edit.*|Double-click to edit.*/gi,
    /Press Enter to save.*|Press Esc to cancel.*/gi,
    
    // Remove AI reasoning/commentary
    /according to (the|this) template/gi,
    /however.*(to|the|since)/gi,
    /to follow the template (to the letter|exactly)/gi,
    /I have placed.*(according|because|since)/gi,
    /should be placed.*(after|before)/gi,
    /following.*(conventional|general) knowledge/gi,
    /since the template.*(has|specifies)/gi,
    /to correct this.*(I|according)/gi,
    
    // Remove decision explanations
    /\[.*?decision.*?\]/gi,
    /\(Note:.*?\)/gi,
    /\*\*Reasoning:\*\*.*?(\n\n|$)/gis,
    /\*\*Note:\*\*.*?(\n\n|$)/gis,
    
    // Remove markdown formatting instructions
    /\*\*.*?\*\*/g,
    /\[.*?\]\(.*?\)/g,
    /#{1,6}\s.*/g,
    
    // Remove multiple blank lines
    /\n\s*\n\s*\n/g,
  ];

  let cleaned = content;
  
  // Apply cleanup patterns
  cleanupPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Remove lines that are clearly AI reasoning
  const lines = cleaned.split('\n').filter(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return true; // Keep empty lines
    
    const lowerLine = trimmedLine.toLowerCase();
    const isReasoning = 
      lowerLine.startsWith('however') ||
      lowerLine.startsWith('according to') ||
      lowerLine.startsWith('to follow') ||
      lowerLine.startsWith('since the') ||
      lowerLine.startsWith('in this template') ||
      lowerLine.includes('template structure') ||
      lowerLine.includes('should be placed') ||
      lowerLine.includes('i have placed') ||
      lowerLine.includes('according to general');
    
    return !isReasoning;
  });

  // Ensure we have proper section markers
  const hasSectionMarkers = lines.some(line => line.match(/^\[[A-Z_]+\]$/));
  if (!hasSectionMarkers) {
    this.logger.warn('No section markers found in cleaned content');
    // Try to extract just the letter part
    const letterStartIndex = lines.findIndex(line => 
      line.match(/^(Dear|To|\[CONTACT_INFO\])/i)
    );
    if (letterStartIndex > 0) {
      return lines.slice(letterStartIndex).join('\n');
    }
  }

  return lines.join('\n').trim();
}




  async findAll(userId: string): Promise<CoverLetter[]> {
    return this.prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async findOne(userId: string, id: string): Promise<CoverLetter> {
    const coverLetter = await this.prisma.coverLetter.findFirst({
      where: { id, userId },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true, // This should be properly serialized
        style: true,
        layout: true,
        language: true,
        originalId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        isPublic: true,
        visibility: true
      }
    });

    if (!coverLetter) {
      throw new NotFoundException('Cover letter not found');
    }

    // Ensure content is properly formatted
    if (coverLetter.content && typeof coverLetter.content === 'object' && 'set' in coverLetter.content) {
      // Fix the Prisma JSON issue
      coverLetter.content = coverLetter.content.set || coverLetter.content;
    }

    return coverLetter;
  }

  async update(userId: string, id: string, updateCoverLetterDto: UpdateCoverLetterDto): Promise<CoverLetter> {
  const coverLetter = await this.prisma.coverLetter.findFirst({
    where: { id, userId }
  });

  if (!coverLetter) {
    throw new NotFoundException('Cover letter not found');
  }

  console.log('📝 Backend updating cover letter:', {
    id,
    hasContent: !!updateCoverLetterDto.content,
    hasStructure: !!updateCoverLetterDto.structure,
    contentBlocks: updateCoverLetterDto.content?.blocks?.length,
    updateDataKeys: Object.keys(updateCoverLetterDto)
  });

  const updateData: any = {
    updatedAt: new Date()
  };

  // CRITICAL FIX: Always update content if provided
  if (updateCoverLetterDto.content !== undefined) {
    updateData.content = updateCoverLetterDto.content;
    
    // Ensure content has lastSaved timestamp
    if (typeof updateData.content === 'object' && updateData.content !== null) {
      updateData.content = {
        ...updateData.content,
        lastSaved: new Date().toISOString()
      };
    }
  }

  // Update title if provided
  if (updateCoverLetterDto.title !== undefined) {
    updateData.title = updateCoverLetterDto.title;
  }
  
  // Update style if provided
  if (updateCoverLetterDto.style !== undefined) {
    updateData.style = isCoverLetterStyle(updateCoverLetterDto.style) 
      ? updateCoverLetterDto.style 
      : CoverLetterStyle.Professional;
  }

  // Update layout if provided
  if (updateCoverLetterDto.layout !== undefined) {
    updateData.layout = updateCoverLetterDto.layout;
    
    // If we're updating layout, also update content structure if it doesn't have one
    if (updateData.content && updateCoverLetterDto.structure) {
      updateData.content = {
        ...updateData.content,
        structure: updateCoverLetterDto.structure
      };
    }
  }
  
  // Update structure in content if provided
  if (updateCoverLetterDto.structure !== undefined && updateData.content) {
    updateData.content = {
      ...updateData.content,
      structure: updateCoverLetterDto.structure
    };
  }

  console.log('💾 Backend saving to database:', {
    updateDataKeys: Object.keys(updateData),
    hasContent: !!updateData.content,
    contentBlocks: updateData.content?.blocks?.length,
    contentStructure: updateData.content?.structure ? 'Yes' : 'No'
  });

  const result = await this.prisma.coverLetter.update({
    where: { id },
    data: updateData
  });

  console.log('✅ Backend update successful:', {
    id: result.id,
    updatedAt: result.updatedAt,
    contentBlocks: (result.content as any)?.blocks?.length,
    contentStructure: (result.content as any)?.structure ? 'Yes' : 'No'
  });

  return result;
}

  async remove(userId: string, id: string): Promise<CoverLetter> {
    const coverLetter = await this.prisma.coverLetter.findFirst({
      where: { id, userId }
    });

    if (!coverLetter) {
      throw new NotFoundException('Cover letter not found');
    }

    return this.prisma.coverLetter.delete({
      where: { id }
    });
  }

  /**
   * Quick duplicate without AI regeneration
   */
  // In cover-letter.service.ts
async duplicateQuick(userId: string, coverLetterId: string, newName?: string): Promise<CoverLetter> {
  try {
    this.logger.log(`Quick duplicating cover letter ${coverLetterId} for user ${userId}`);

    // 1. Get the original cover letter
    const original = await this.findOne(userId, coverLetterId);
    
    // 2. Determine the duplicate title
    let duplicateTitle: string;
    
    if (newName && newName.trim()) {
      // Use the custom name provided by the user
      duplicateTitle = newName.trim();
    } else {
      // Generate default duplicate title
      duplicateTitle = original.title;
      
      // Remove any existing "(Copy)" suffix
      duplicateTitle = duplicateTitle.replace(/\s*\(Copy\)(\s*\(Copy\))*\s*$/, '').trim();
      
      // Add single "(Copy)" suffix
      duplicateTitle = `${duplicateTitle} (Copy)`;
    }
    
    // 3. Extract original content
    const originalContent = original.content as any;
    
    // 4. Create duplicate content with updated metadata
    const duplicateContent = {
      ...originalContent,
      // Update the title in the content as well
      title: duplicateTitle,
      originalId: coverLetterId,
      duplicatedFrom: coverLetterId,
      duplicatedAt: new Date().toISOString(),
      lastSaved: new Date().toISOString()
    };

    // 5. Generate a unique slug for the duplicate
    const duplicateSlug = this.generateSlug(`copy-of-${original.slug}-${Date.now()}`);

    // 6. Create the duplicate directly in database
    const duplicate = await this.prisma.coverLetter.create({
      data: {
        title: duplicateTitle,
        slug: duplicateSlug,
        content: duplicateContent,
        style: original.style,
        layout: original.layout,
        userId,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    this.logger.log(`Successfully quick-duplicated cover letter ${coverLetterId} to ${duplicate.id} for user ${userId}`);
    
    return duplicate;
    
  } catch (error) {
    this.logger.error(`Failed to quick-duplicate cover letter ${coverLetterId} for user ${userId}:`, error.stack);
    
    if (error instanceof NotFoundException) {
      throw error;
    }
    
    throw new Error(`Failed to duplicate cover letter: ${error.message}`);
  }
}

  async enhanceBlock(userId: string, id: string, enhanceBlockDto: EnhanceBlockDto) {
    const coverLetter = await this.prisma.coverLetter.findFirst({
      where: { id, userId }
    });

    if (!coverLetter) {
      throw new NotFoundException('Cover letter not found');
    }

    const content = coverLetter.content as any;
    const block = content.blocks.find((b: any) => b.id === enhanceBlockDto.blockId);

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    // Add transactionId extraction
    const transactionId = (enhanceBlockDto as any).metadata?.transactionId;
    
    // Pass transactionId to enhanceSection if needed
    const enhancedContent = await this.enhanceSection(
      block.content,
      enhanceBlockDto.instructions,
      coverLetter.style,
      content.category || 'Job Application',
      transactionId // Add this parameter
    );

    const updatedBlocks = content.blocks.map((b: any) =>
      b.id === enhanceBlockDto.blockId ? { ...b, content: enhancedContent } : b
    );

    const updatedCoverLetter = await this.prisma.coverLetter.update({
      where: { id },
      data: {
        content: {
          ...content,
          blocks: updatedBlocks,
          lastSaved: new Date().toISOString()
        }
      }
    });

    return {
      success: true,
      block: { id: enhanceBlockDto.blockId, content: enhancedContent },
      coverLetter: updatedCoverLetter
    };
  }

  private async enhanceSection(
  sectionContent: string, 
  instructions: string, 
  style: CoverLetterStyle,
  category: string,
  transactionId?: string
): Promise<string> {
  const prompt = `You are enhancing a specific section of a ${category.toLowerCase()}.

Original Section Content:
${sectionContent}

Enhancement Instructions: ${instructions}
Category: ${category}
Style to Maintain: ${style}

LANGUAGE REQUIREMENT: Maintain the exact same language as the original section content.

Please return ONLY the enhanced section content without any markers, explanations, or additional text. Ensure it maintains the appropriate tone for the category and the same language as the original.`;

  return await this.generateContent(prompt);
}

  // New method to get user's resume data for frontend
  async getUserResumeContext(userId: string) {
    const resumeData = await this.getUserResumeData(userId);
    
    if (!resumeData) {
      return { available: false };
    }

    return {
      available: true,
      skills: resumeData.skills || [],
      experience: resumeData.experience?.slice(0, 5) || [], // Limit to recent 5
      education: resumeData.education || [],
      certifications: resumeData.certifications || [],
      projects: resumeData.projects?.slice(0, 3) || [] // Limit to top 3
    };
  }

  // Complete letter regeneration with custom instructions
  async regenerateCompleteLetter(
  userId: string, 
  coverLetterId: string, 
  instructions: string,
  transactionId?: string
) {
  if (transactionId) {
    this.logger.log(`Processing complete letter regeneration with transaction ID: ${transactionId}`);
  }

  const coverLetter = await this.prisma.coverLetter.findFirst({
    where: { id: coverLetterId, userId }
  });

  if (!coverLetter) {
    throw new NotFoundException('Cover letter not found');
  }

  // Extract data from existing cover letter
  const content = coverLetter.content as any;
  const userData = this.extractUserDataFromContent(content);
  const jobData = this.extractJobDataFromContent(content);
  const category = content.category || 'Job Application';
  const style = coverLetter.style;
  
  // Fix: layout can be null, so provide a default
  const layout = coverLetter.layout || 'modern-professional';
  const template = this.templateService.getTemplateById(layout);
  const structure = template?.structure || this.templateService.getTemplateStructure(layout);

  // Get resume data if available
  const resumeUsed = content.resumeUsed;
  const resumeData = resumeUsed 
    ? await this.getResumeById(userId, resumeUsed)
    : await this.getUserResumeData(userId);

  // Build enhanced prompt for complete regeneration
  const prompt = await this.buildCompleteRegenerationPrompt({
    userData,
    jobData,
    style,
    layout,
    structure,
    customInstructions: instructions,
    category,
    userId,
    resumeData,
    originalContent: content
  });

  const regeneratedContent = await this.generateContent(prompt);
  const blocks = this.parseContentToBlocks(regeneratedContent);
  const enhancedLayout = TemplateLayoutGenerator.generateLayout(structure, blocks);

  const serializableContent = {
    blocks: ensureJsonSerializable(blocks),
    layout: ensureJsonSerializable(enhancedLayout),
    style: style,
    layoutType: layout,
    structure: ensureJsonSerializable(structure),
    category: category,
    lastSaved: new Date().toISOString(),
    resumeUsed: resumeUsed || null,
    regenerationHistory: [
      ...(content.regenerationHistory || []),
      {
        timestamp: new Date().toISOString(),
        instructions: instructions,
        transactionId
      }
    ]
  };

  const updatedCoverLetter = await this.prisma.coverLetter.update({
    where: { id: coverLetterId },
    data: {
      content: serializableContent,
      updatedAt: new Date()
    }
  });

  return {
    success: true,
    coverLetter: updatedCoverLetter,
    blocks,
    layout: enhancedLayout,
    transactionId
  };
}


async translateLetterPreservingStructure(
    userId: string,
    coverLetterId: string,
    dto: TranslateLetterDto
  ): Promise<any> {
    const transactionId = dto.metadata?.transactionId || this.generateTransactionId();
    
    this.logger.log(`Translating letter ${coverLetterId} to ${dto.targetLanguage}`, {
      userId,
      method: dto.method,
      transactionId
    });

    // 1. Get original cover letter
    const originalCoverLetter = await this.prisma.coverLetter.findFirst({
      where: { id: coverLetterId, userId }
    });

    if (!originalCoverLetter) {
      throw new NotFoundException('Cover letter not found');
    }

    const originalContent = originalCoverLetter.content as any;
    const originalBlocks = this.extractBlocksFromContent(originalContent);

    console.log('📊 Extracted blocks:', {
      extractedCount: originalBlocks.length,
      extractionMethod: 'extractBlocksFromContent'
    });
    const originalLayout = originalContent.layout;
    const originalStructure = originalContent.structure;
    const category = originalContent.category || 'Job Application';

    // 2. Determine language codes
    const targetLanguageCode = this.normalizeLanguageCode(dto.targetLanguage);
    const targetLanguageName = this.getLanguageDisplayName(targetLanguageCode);
    const sourceLanguageCode = dto.sourceLanguage || originalContent.currentLanguage || 'en';

    // 3. Check if translation already exists
    const existingTranslation = await this.prisma.coverLetter.findFirst({
      where: {
        originalId: coverLetterId,
        language: targetLanguageCode,
        userId
      }
    });

    if (existingTranslation && !dto.createNewVersion) {
      this.logger.log(`Existing translation found: ${existingTranslation.id}`);
      return {
        success: true,
        exists: true,
        coverLetter: existingTranslation,
        targetLanguage: targetLanguageCode
      };
    }

    // 4. Prepare for translation based on method
    let translatedBlocks: any[];
    let translationMetadata: any;

    switch (dto.method) {
      case TranslationMethod.SECTION_BY_SECTION:
        ({ blocks: translatedBlocks, metadata: translationMetadata } = 
          await this.translateSectionBySection(originalBlocks, dto, transactionId));
        break;
      
      case TranslationMethod.COMPLETE:
        ({ blocks: translatedBlocks, metadata: translationMetadata } = 
          await this.translateCompleteLetter(originalBlocks, dto, transactionId));
        break;
      
      case TranslationMethod.PRESERVE_STRUCTURE:
      default:
        ({ blocks: translatedBlocks, metadata: translationMetadata } = 
          await this.translateWithStructurePreservation(originalBlocks, dto, transactionId));
        break;
    }

    // Add this before creating translatedContent
console.log('🔍 Translation debug:', {
  originalBlocksCount: originalBlocks.length,
  translatedBlocksCount: translatedBlocks.length,
  translatedBlocksIsArray: Array.isArray(translatedBlocks),
  translatedBlocksFirstFew: translatedBlocks.slice(0, 2),
  translationMetadata: translationMetadata
});

// 5. Create translated content with EXACT same structure
const translatedContent = this.buildTranslatedContent(
  originalContent,
  translatedBlocks,
  originalLayout,
  originalStructure,
  {
    sourceLanguage: sourceLanguageCode,
    targetLanguage: targetLanguageCode,
    targetLanguageName,
    method: dto.method,
    preservation: dto.preservation,
    transactionId,
    ...translationMetadata
  }
);

// Add logging after building content
console.log('🔍 Built translated content:', {
  contentHasBlocks: !!translatedContent.blocks,
  blocksCount: translatedContent.blocks?.length || 0,
  blocksIsArray: Array.isArray(translatedContent.blocks),
  contentKeys: Object.keys(translatedContent)
});

    // 6. Create or update translation record
    let resultCoverLetter;
    
    if (dto.createNewVersion) {
      const translatedTitle = this.generateTranslatedTitle(
        originalCoverLetter.title,
        targetLanguageName,
        dto.versionName
      );

      const translatedSlug = this.generateTranslatedSlug(
        originalCoverLetter.slug,
        targetLanguageCode
      );

      resultCoverLetter = await this.prisma.coverLetter.create({
        data: {
          title: translatedTitle,
          slug: translatedSlug,
          content: translatedContent,
          style: originalCoverLetter.style,
          layout: originalCoverLetter.layout,
          language: targetLanguageCode,
          originalId: originalCoverLetter.id,
          userId,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      this.logger.log(`Created new translation: ${resultCoverLetter.id}`);
    } else {
      // Update original with translation
      resultCoverLetter = await this.prisma.coverLetter.update({
        where: { id: coverLetterId },
        data: {
          content: translatedContent,
          language: targetLanguageCode,
          updatedAt: new Date()
        }
      });
    }

    // 7. Store translation relationship
    await this.storeTranslationRelationship(
      userId,
      coverLetterId,
      resultCoverLetter.id,
      targetLanguageCode,
      translationMetadata
    );

    // 8. Get all translations for response
    const allTranslations = await this.getLetterTranslations(userId, coverLetterId);

    return {
      success: true,
      coverLetter: resultCoverLetter,
      targetLanguage: targetLanguageCode,
      targetLanguageName,
      method: dto.method,
      preservation: dto.preservation,
      blocks: translatedBlocks,
      allTranslations,
      transactionId,
      metadata: translationMetadata
    };
  }

  /**
   * Translate section by section with perfect structure preservation
   */
private async translateSectionBySection(
  originalBlocks: any[],
  dto: TranslateLetterDto,
  transactionId: string
): Promise<{ blocks: any[]; metadata: any }> {
  const translatedBlocks: any[] = [];
  const translationErrors: any[] = [];
  const startTime = Date.now();

  // Provide default value for preservation
  const preservation = dto.preservation || TranslationPreservation.ALL;
  const preserveNames = dto.preserveNames !== false; // default to true
  const preserveDates = dto.preserveDates !== false; // default to true
  const preserveTerms = dto.preserveTerms || [];

  for (let i = 0; i < originalBlocks.length; i++) {
    const originalBlock = originalBlocks[i];
    
    try {
      // Check if this block should be translated or preserved
      const shouldTranslate = this.shouldTranslateBlock(
        originalBlock,
        preservation, // Now guaranteed to be TranslationPreservation
        preserveNames,
        preserveDates,
        preserveTerms
      );

      if (!shouldTranslate) {
        // Copy block exactly as-is
        translatedBlocks.push(this.cloneBlock(originalBlock));
        continue;
      }

      // Build translation prompt for this specific section
      const translationPrompt = this.buildSectionTranslationPrompt(
        originalBlock,
        dto.targetLanguage,
        preservation, // Pass the resolved preservation
        dto
      );

      // Generate translation
      const translatedContent = await this.generateContent(translationPrompt);

      // Create translated block with EXACT same structure
      const translatedBlock = this.createTranslatedBlock(
        originalBlock,
        translatedContent,
        {
          targetLanguage: dto.targetLanguage,
          method: 'section-by-section',
          originalContent: originalBlock.content,
          sectionIndex: i,
          transactionId
        }
      );

      translatedBlocks.push(translatedBlock);

      // Add small delay to avoid rate limiting
      if (i < originalBlocks.length - 1) {
        await this.delay(200);
      }

    } catch (error) {
      this.logger.warn(`Failed to translate block ${i} (${originalBlock.type}):`, error.message);
      
      // Fallback to original block
      translatedBlocks.push(this.cloneBlock(originalBlock));
      
      translationErrors.push({
        blockIndex: i,
        blockType: originalBlock.type,
        error: error.message,
        content: originalBlock.content?.substring(0, 100)
      });
    }
  }

  const duration = Date.now() - startTime;

  return {
    blocks: translatedBlocks,
    metadata: {
      method: 'section-by-section',
      blockCount: originalBlocks.length,
      translatedCount: translatedBlocks.length,
      errors: translationErrors,
      duration,
      averageTimePerBlock: duration / originalBlocks.length
    }
  };
}

  /**
   * Translate complete letter with structure parsing
   */
  private async translateCompleteLetter(
  originalBlocks: any[],
  dto: TranslateLetterDto,
  transactionId: string
): Promise<{ blocks: any[]; metadata: any }> {
  try {
    // 1. Build structured text with markers
    const structuredText = this.buildStructuredText(originalBlocks);
    
    // 2. Build translation prompt - pass resolved preservation
    const translationPrompt = this.buildCompleteTranslationPrompt(
      structuredText,
      dto.targetLanguage,
      dto.preservation || TranslationPreservation.ALL, // Handle undefined
      dto
    );

    // 3. Generate translation
    const translatedText = await this.generateContent(translationPrompt);

    // 4. Parse back into blocks using original structure
    const parsedBlocks = this.parseTranslatedBlocks(
      translatedText,
      originalBlocks,
      dto.targetLanguage
    );

    return {
      blocks: parsedBlocks,
      metadata: {
        method: 'complete',
        blockCount: originalBlocks.length,
        parsedCount: parsedBlocks.length,
        structurePreserved: parsedBlocks.length === originalBlocks.length
      }
    };

  } catch (error) {
    this.logger.error('Complete translation failed, falling back to section-by-section:', error);
    
    // Fallback to section-by-section
    return await this.translateSectionBySection(originalBlocks, dto, transactionId);
  }
}

  /**
   * Hybrid approach - best structure preservation
   */
  private async translateWithStructurePreservation(
  originalBlocks: any[],
  dto: TranslateLetterDto,
  transactionId: string
): Promise<{ blocks: any[]; metadata: any }> {
  const translatedBlocks: any[] = [];
  const blockMetadata: any[] = [];

  // Provide defaults for optional parameters
  const resolvedDto = {
    ...dto,
    preservation: dto.preservation || TranslationPreservation.ALL,
    preserveNames: dto.preserveNames !== false,
    preserveDates: dto.preserveDates !== false,
    preserveNumbers: dto.preserveNumbers !== false,
    preserveUrls: dto.preserveUrls !== false,
    preserveEmailAddresses: dto.preserveEmailAddresses !== false,
    preserveTerms: dto.preserveTerms || []
  };

  // Group blocks by type for better translation
  const blocksByType = this.groupBlocksByType(originalBlocks);

  for (const [blockType, blocks] of Object.entries(blocksByType)) {
    try {
      // Translate similar blocks together for consistency
      const translatedTypeBlocks = await this.translateBlocksOfType(
        blocks as any[],
        blockType,
        resolvedDto, // Use resolved DTO
        transactionId
      );

      translatedBlocks.push(...translatedTypeBlocks);
      blockMetadata.push({
        type: blockType,
        count: (blocks as any[]).length,
        success: true
      });

    } catch (error) {
      this.logger.warn(`Failed to translate ${blockType} blocks:`, error.message);
      
      // Fallback to individual translation
      for (const block of blocks as any[]) {
        try {
          const translatedBlock = await this.translateSingleBlock(
            block,
            resolvedDto, // Use resolved DTO
            transactionId
          );
          translatedBlocks.push(translatedBlock);
        } catch (innerError) {
          // Last resort: preserve original
          translatedBlocks.push(this.cloneBlock(block));
          blockMetadata.push({
            type: blockType,
            error: innerError.message,
            preserved: true
          });
        }
      }
    }
  }

  // Ensure blocks are in exact same order
  const orderedBlocks = this.restoreOriginalOrder(originalBlocks, translatedBlocks);

  return {
    blocks: orderedBlocks,
    metadata: {
      method: 'preserve-structure',
      blockGroups: blockMetadata,
      orderPreserved: true
    }
  };
}

  /**
   * Build structured text with clear markers
   */
  private buildStructuredText(blocks: any[]): string {
    const sections = blocks.map((block, index) => {
      const blockId = block.id || `block-${index}`;
      const blockType = block.type || 'content';
      
      return `--- BLOCK_START: ${blockId} | TYPE: ${blockType.toUpperCase()} ---
${block.content}
--- BLOCK_END: ${blockId} ---`;
    });

    return sections.join('\n\n');
  }

  /**
   * Build section-specific translation prompt
   */
  private buildSectionTranslationPrompt(
  block: any,
  targetLanguage: string,
  preservation: TranslationPreservation, // Change from optional to required
  dto: TranslateLetterDto
): string {
  const languageName = this.getLanguageDisplayName(targetLanguage);
  const languageCode = this.normalizeLanguageCode(targetLanguage);
  
  const blockType = block.type || 'content';
  const content = block.content || '';
  const sectionInstructions = this.getSectionTranslationInstructions(blockType);

  const preservationRules = this.buildPreservationRules(dto);

  return `You are a professional business translator.

TRANSLATION TASK:
Translate a specific section of a business letter from its original language to ${languageName} (${languageCode}).

SECTION DETAILS:
- Type: ${blockType}
- Position: ${sectionInstructions.position}
- Purpose: ${sectionInstructions.purpose}

PRESERVATION LEVEL: ${preservation.toUpperCase()}

CRITICAL PRESERVATION RULES:
${preservationRules}

TRANSLATION REQUIREMENTS:
1. Translate content accurately while maintaining original meaning
2. Preserve ALL formatting, spacing, and line breaks exactly
3. Maintain professional tone appropriate for business correspondence
4. Keep numbers, dates, names, and contact information unchanged unless specified
5. Adapt cultural references appropriately for ${languageName} readers
6. Ensure grammatical correctness in ${languageName}

IMPORTANT: 
- Return ONLY the translated section content
- Do NOT add any explanations, markers, or extra text
- Preserve the exact structure and formatting of the original

ORIGINAL SECTION CONTENT:
${content}

TRANSLATED SECTION IN ${languageName.toUpperCase()}:`;
}


  /**
   * Build complete translation prompt
   */
  private buildCompleteTranslationPrompt(
  structuredText: string,
  targetLanguage: string,
  preservation: TranslationPreservation, // Change from optional to required
  dto: TranslateLetterDto
): string {
  const languageName = this.getLanguageDisplayName(targetLanguage);
  const languageCode = this.normalizeLanguageCode(targetLanguage);
  
  const preservationRules = this.buildPreservationRules(dto);

  return `You are a professional translator for business correspondence.

TASK: Translate a complete business letter while preserving its exact structure.

PRESERVATION LEVEL: ${preservation.toUpperCase()}

STRUCTURE PRESERVATION REQUIREMENTS:
1. PRESERVE ALL BLOCK MARKERS: Keep "--- BLOCK_START:" and "--- BLOCK_END:" markers exactly as they are
2. PRESERVE BLOCK IDs: Keep block IDs (like "block-0", "contact_info-123") unchanged
3. PRESERVE BLOCK TYPES: Keep TYPE declarations (TYPE: CONTACT_INFO, TYPE: GREETING, etc.)
4. PRESERVE FORMATTING: Maintain all line breaks, spacing, and formatting within blocks
5. PRESERVE ORDER: Keep blocks in the exact same order

${preservationRules}

ADDITIONAL REQUIREMENTS:
1. Translate content within blocks while maintaining meaning
2. Adapt tone appropriately for ${languageName} business culture
3. Keep professional terminology consistent
4. Do not modify block structure or markers in any way

ORIGINAL LETTER WITH STRUCTURE MARKERS:
${structuredText}

TRANSLATED LETTER IN ${languageName.toUpperCase()} WITH PRESERVED STRUCTURE:`;
}

  /**
   * Parse translated text back into blocks
   */
  private parseTranslatedBlocks(
    translatedText: string,
    originalBlocks: any[],
    targetLanguage: string
  ): any[] {
    const blocks: any[] = [];
    const lines = translatedText.split('\n');
    
    let currentBlock: any = null;
    let currentContent: string[] = [];
    let inBlock = false;

    for (const line of lines) {
      // Check for block start marker
      const blockStartMatch = line.match(/--- BLOCK_START: (\S+) \| TYPE: (\w+) ---/);
      
      if (blockStartMatch) {
        // Save previous block if exists
        if (currentBlock && currentContent.length > 0) {
          currentBlock.content = currentContent.join('\n').trim();
          blocks.push(currentBlock);
        }
        
        // Start new block
        const [, blockId, blockType] = blockStartMatch;
        const originalBlock = originalBlocks.find(b => b.id === blockId) || 
                              originalBlocks.find(b => b.type === blockType.toLowerCase());
        
        currentBlock = originalBlock ? this.cloneBlock(originalBlock) : {
          id: blockId,
          type: blockType.toLowerCase(),
          formatting: this.getDefaultFormatting(blockType.toLowerCase())
        };
        
        currentContent = [];
        inBlock = true;
        continue;
      }
      
      // Check for block end marker
      const blockEndMatch = line.match(/--- BLOCK_END: (\S+) ---/);
      if (blockEndMatch && currentBlock) {
        currentBlock.content = currentContent.join('\n').trim();
        blocks.push(currentBlock);
        
        // Add translation metadata
        currentBlock.translation = {
          language: targetLanguage,
          parsedFromStructure: true,
          originalId: blockEndMatch[1]
        };
        
        currentBlock = null;
        currentContent = [];
        inBlock = false;
        continue;
      }
      
      // Add content to current block
      if (inBlock && currentBlock) {
        currentContent.push(line);
      }
    }
    
    // Handle any remaining content
    if (currentBlock && currentContent.length > 0) {
      currentBlock.content = currentContent.join('\n').trim();
      blocks.push(currentBlock);
    }

    // If parsing failed, fallback to original structure
    if (blocks.length === 0) {
      this.logger.warn('Structure parsing failed, preserving original blocks');
      return originalBlocks.map(block => this.cloneBlock(block));
    }

    // Ensure we have the same number of blocks
    if (blocks.length !== originalBlocks.length) {
      this.logger.warn(`Block count mismatch: ${blocks.length} vs ${originalBlocks.length}`);
      
      // Merge or split to match original count
      return this.adjustBlockCount(blocks, originalBlocks);
    }

    return blocks;
  }

  /**
   * Build translated content structure
   */
  private buildTranslatedContent(
    originalContent: any,
    translatedBlocks: any[],
    originalLayout: any,
    originalStructure: any,
    translationInfo: any
  ): any {
    return {
      // Preserve all original structure
      blocks: translatedBlocks,
      layout: originalLayout,
      structure: originalStructure,
      style: originalContent.style,
      layoutType: originalContent.layoutType,
      category: originalContent.category,
      
      // Add translation metadata
      translationInfo: {
        ...translationInfo,
        translatedAt: new Date().toISOString(),
        originalVersion: originalContent.translationInfo?.originalVersion || originalContent.id,
        version: `translated-${Date.now()}`
      },
      
      // Keep original metadata
      ...(originalContent.metadata && { metadata: originalContent.metadata }),
      
      // Timestamps
      lastSaved: new Date().toISOString(),
      createdFromTranslation: true,
      
      // Track both languages
      languages: {
        original: translationInfo.sourceLanguage,
        current: translationInfo.targetLanguage,
        available: [
          translationInfo.sourceLanguage,
          translationInfo.targetLanguage
        ]
      }
    };
  }

  /**
   * Helper: Build preservation rules
   */
  private buildPreservationRules(dto: TranslateLetterDto): string {
    const rules: string[] = [];
    
    if (dto.preserveNames !== false) {
      rules.push('• PRESERVE NAMES: Do not translate personal names, company names, or proper nouns');
    }
    
    if (dto.preserveDates !== false) {
      rules.push('• PRESERVE DATES: Keep date formats as-is (translators may adapt format to local conventions)');
    }
    
    if (dto.preserveNumbers !== false) {
      rules.push('• PRESERVE NUMBERS: Keep all numbers, measurements, and statistics unchanged');
    }
    
    if (dto.preserveUrls !== false) {
      rules.push('• PRESERVE URLs: Do not translate website addresses or links');
    }
    
    if (dto.preserveEmailAddresses !== false) {
      rules.push('• PRESERVE EMAILS: Keep email addresses exactly as they are');
    }
    
    if (dto.preserveTerms && dto.preserveTerms.length > 0) {
      rules.push(`• PRESERVE TERMS: Do not translate these specific terms: ${dto.preserveTerms.join(', ')}`);
    }
    
    return rules.length > 0 ? rules.join('\n') : '• Translate all content as appropriate for the target language';
  }

  /**
 * Helper: Should translate block?
 */
private shouldTranslateBlock(
  block: any,
  preservation: TranslationPreservation, // Make this required
  preserveNames: boolean,
  preserveDates: boolean,
  preserveTerms: string[]
): boolean {
  const blockType = block.type || 'content';
  const content = block.content || '';
  
  // Never translate certain block types
  const nonTranslatableTypes = ['contact_info', 'date', 'signature'];
  if (nonTranslatableTypes.includes(blockType)) {
    return false;
  }
  
  // Check content for preservation triggers
  if (preserveNames && this.containsNames(content)) {
    return false;
  }
  
  if (preserveDates && this.containsDates(content)) {
    return false;
  }
  
  if (preserveTerms.some(term => content.toLowerCase().includes(term.toLowerCase()))) {
    return false;
  }
  
  return true;
}

  /**
   * Helper: Clone block exactly
   */
  private cloneBlock(block: any): any {
    return JSON.parse(JSON.stringify(block));
  }

  /**
   * Helper: Generate translated title
   */
  private generateTranslatedTitle(
    originalTitle: string,
    languageName: string,
    customName?: string
  ): string {
    if (customName) {
      return customName;
    }
    
    // Remove any existing language suffix
    const cleanTitle = originalTitle.replace(/\s*\([^)]+\)\s*$/, '').trim();
    
    // Add language suffix
    return `${cleanTitle} (${languageName})`;
  }

  /**
 * Helper: Generate translated slug with uniqueness
 */
  private generateTranslatedSlug(originalSlug: string, languageCode: string): string {
    // Remove any existing language suffix
    const baseSlug = originalSlug.replace(/-[a-z]{2}(-\w+)?$/, '');
    
    // Generate timestamp and random string for uniqueness
    const timestamp = Date.now().toString(36); // Base36 for shorter string
    const random = Math.random().toString(36).substring(2, 6); // 4 random chars
    
    return `${baseSlug}-${languageCode}-${timestamp}${random}`;
  }

  /**
   * Helper: Normalize language code
   */
  private normalizeLanguageCode(language: string): string {
    const languageMap: Record<string, string> = {
      'english': 'en',
      'french': 'fr',
      'spanish': 'es',
      'german': 'de',
      'italian': 'it',
      'portuguese': 'pt',
      'russian': 'ru',
      'chinese': 'zh',
      'japanese': 'ja',
      'korean': 'ko',
      'arabic': 'ar',
      'hindi': 'hi',
      'dutch': 'nl',
      'swedish': 'sv',
      'norwegian': 'no',
      'danish': 'da',
      'finnish': 'fi',
      'polish': 'pl',
      'turkish': 'tr',
      'greek': 'el',
      'hebrew': 'he',
      'thai': 'th',
      'vietnamese': 'vi',
      'indonesian': 'id',
      'malay': 'ms'
    };
    
    const normalized = language.toLowerCase().trim();
    return languageMap[normalized] || language.substring(0, 2).toLowerCase() || 'en';
  }

  /**
   * Helper: Get language display name
   */
  private getLanguageDisplayName(languageCode: string): string {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'fr': 'French',
      'es': 'Spanish',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'no': 'Norwegian',
      'da': 'Danish',
      'fi': 'Finnish',
      'pl': 'Polish',
      'tr': 'Turkish',
      'el': 'Greek',
      'he': 'Hebrew',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'id': 'Indonesian',
      'ms': 'Malay'
    };
    
    return languageNames[languageCode] || 
           languageCode.charAt(0).toUpperCase() + languageCode.slice(1).toLowerCase();
  }

  /**
   * Helper: Get section translation instructions
   */
  private getSectionTranslationInstructions(blockType: string): {
    position: string;
    purpose: string;
  } {
    const instructions: Record<string, { position: string; purpose: string }> = {
      'contact_info': {
        position: 'Header section',
        purpose: 'Contact information - preserve names, addresses, phone numbers, emails'
      },
      'date': {
        position: 'Date line',
        purpose: 'Date formatting - adapt to local conventions if needed'
      },
      'greeting': {
        position: 'Opening salutation',
        purpose: 'Formal greeting - use appropriate cultural equivalents'
      },
      'intro_paragraph': {
        position: 'First paragraph',
        purpose: 'Introduction - maintain professional tone and intent'
      },
      'body_paragraph': {
        position: 'Main content',
        purpose: 'Body text - translate while preserving argument flow'
      },
      'closing_paragraph': {
        position: 'Closing section',
        purpose: 'Conclusion - maintain call to action and professionalism'
      },
      'signature': {
        position: 'Signature block',
        purpose: 'Closing and signature - preserve names, adapt closing phrases'
      }
    };
    
    return instructions[blockType] || {
      position: 'Content section',
      purpose: 'General content - translate while preserving meaning and formatting'
    };
  }

  /**
   * Helper: Check if content contains names
   */
  private containsNames(content: string): boolean {
    // Simple check for capitalized words that might be names
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/;
    return namePattern.test(content);
  }

  /**
   * Helper: Check if content contains dates
   */
  private containsDates(content: string): boolean {
    const datePattern = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})\b/i;
    return datePattern.test(content);
  }

  /**
   * Helper: Delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Helper: Generate transaction ID
   */
  private generateTransactionId(): string {
    return `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store translation relationship
   */
  private async storeTranslationRelationship(
    userId: string,
    originalId: string,
    translatedId: string,
    language: string,
    metadata: any
  ): Promise<void> {
    try {
      // You might want to create a separate table for translation relationships
      // For now, we'll store it in the content metadata
      await this.prisma.coverLetter.update({
        where: { id: translatedId },
        data: {
          content: {
            set: (await this.prisma.coverLetter.findUnique({ 
              where: { id: translatedId } 
            }))?.content as any
          }
        }
      });
    } catch (error) {
      this.logger.warn('Failed to store translation relationship:', error);
    }
  }

  /**
 * Get all translations for a letter
 */
async getLetterTranslations(userId: string, letterId: string): Promise<any[]> {
  const translations = await this.prisma.coverLetter.findMany({
    where: {
      OR: [
        { id: letterId },
        { originalId: letterId }
      ],
      userId
    },
    select: {
      id: true,
      title: true,
      slug: true,
      language: true,
      originalId: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { createdAt: 'asc' }
  });
  
  // If you need content metadata, fetch it separately
  const translationsWithContent = await Promise.all(
    translations.map(async (translation) => {
      const fullLetter = await this.prisma.coverLetter.findUnique({
        where: { id: translation.id },
        select: {
          content: true
        }
      });
      
      return {
        ...translation,
        content: fullLetter?.content
      };
    })
  );
  
  return translationsWithContent;
}
  /**
   * Switch to specific language version
   */
async switchToLanguage(
  userId: string,
  letterId: string,
  languageCode: string
): Promise<any> {
  try {
    this.logger.log(`🔍 Switching language for letter ${letterId} to ${languageCode} for user ${userId}`);

    // 1. Get the current letter
    const currentLetter = await this.prisma.coverLetter.findFirst({
      where: { id: letterId, userId }
    });

    this.logger.debug(`Current letter found:`, {
      found: !!currentLetter,
      id: currentLetter?.id,
      title: currentLetter?.title,
      language: currentLetter?.language,
      originalId: currentLetter?.originalId
    });

    if (!currentLetter) {
      throw new NotFoundException(`Cover letter not found`);
    }

    // 2. Determine the original letter ID
    const originalId = currentLetter.originalId || currentLetter.id;
    this.logger.debug(`Original ID determined: ${originalId}`);

    // 3. Check if current letter already has this language
    if (currentLetter.language === languageCode) {
      this.logger.log(`Letter ${letterId} already in language ${languageCode}`);
      return {
        success: true,
        coverLetter: currentLetter,
        language: languageCode,
        message: 'Already in requested language'
      };
    }

    // 4. Find translation with this language for the original
    const translation = await this.prisma.coverLetter.findFirst({
      where: {
        OR: [
          { id: originalId, language: languageCode }, // The original might have this language
          { originalId: originalId, language: languageCode } // Or a translation
        ],
        userId
      }
    });

    this.logger.debug(`Translation search result:`, {
      found: !!translation,
      translationId: translation?.id,
      translationLanguage: translation?.language,
      translationOriginalId: translation?.originalId
    });

    if (!translation) {
      const errorMsg = `Translation to ${languageCode} not found. Please create a translation first.`;
      this.logger.error(errorMsg);
      throw new NotFoundException(errorMsg);
    }

    this.logger.log(`✅ Found translation: ${translation.id} for language ${languageCode}`);

    // 5. Load full content for the translation
    const fullTranslation = await this.prisma.coverLetter.findUnique({
      where: { id: translation.id }
    });

    if (!fullTranslation) {
      throw new NotFoundException('Translation not found after search');
    }

    this.logger.debug(`Full translation loaded:`, {
      id: fullTranslation.id,
      title: fullTranslation.title,
      hasContent: !!fullTranslation.content
    });

    return {
      success: true,
      coverLetter: fullTranslation,
      language: languageCode,
      message: 'Language switched successfully'
    };
  } catch (error) {
    this.logger.error(`❌ Failed to switch language for letter ${letterId}:`, error);
    this.logger.error(`Error stack:`, error.stack);
    throw error;
  }
}


/**
 * Find all translations for a letter (including the original)
 */
async findAllTranslationsForLetter(
  userId: string,
  letterId: string
): Promise<CoverLetter[]> {
  // Find the current letter
  const currentLetter = await this.prisma.coverLetter.findFirst({
    where: { id: letterId, userId }
  });

  if (!currentLetter) {
    return [];
  }

  // Determine the original ID
  const originalId = currentLetter.originalId || currentLetter.id;

  // Find all translations (including the original)
  const translations = await this.prisma.coverLetter.findMany({
    where: {
      OR: [
        { id: originalId }, // The original
        { originalId: originalId } // All translations
      ],
      userId
    },
    orderBy: { createdAt: 'asc' }
  });

  return translations;
}







  // Translation to different languages
  async translateLetter(
  userId: string,
  coverLetterId: string,
  targetLanguage: string,
  transactionId?: string
) {
  if (transactionId) {
    this.logger.log(`Processing translation with transaction ID: ${transactionId}`);
  }

  const coverLetter = await this.prisma.coverLetter.findFirst({
    where: { id: coverLetterId, userId }
  });

  if (!coverLetter) {
    throw new NotFoundException('Cover letter not found');
  }

  const content = coverLetter.content as any;
  const blocks = content.blocks || [];
  
  // Combine all blocks content for translation
  const fullText = blocks.map((block: any) => block.content).join('\n\n');
  
  // Translate the complete letter
  const translatedContent = await this.translateText(fullText, targetLanguage);
  
  // Parse translated content back into blocks
  const translatedBlocks = this.parseContentToBlocks(translatedContent);
  
  // Get layout or use default
  const layout = coverLetter.layout || 'modern-professional';
  const template = this.templateService.getTemplateById(layout);
  const structure = template?.structure || this.templateService.getTemplateStructure(layout);
  const enhancedLayout = TemplateLayoutGenerator.generateLayout(structure, translatedBlocks);
  
  // Update content with translated blocks
  const updatedContent = {
    ...content,
    blocks: ensureJsonSerializable(translatedBlocks),
    layout: ensureJsonSerializable(enhancedLayout),
    lastSaved: new Date().toISOString(),
    translationHistory: [
      ...(content.translationHistory || []),
      {
        timestamp: new Date().toISOString(),
        targetLanguage: targetLanguage,
        transactionId
      }
    ],
    currentLanguage: targetLanguage
  };

  const updatedCoverLetter = await this.prisma.coverLetter.update({
    where: { id: coverLetterId },
    data: {
      content: updatedContent,
      updatedAt: new Date()
    }
  });

  return {
    success: true,
    coverLetter: updatedCoverLetter,
    blocks: translatedBlocks,
    targetLanguage,
    transactionId
  };
}

  // Helper method for complete regeneration prompt
  private async buildCompleteRegenerationPrompt(params: {
    userData: any;
    jobData: any;
    style: CoverLetterStyle;
    layout: string;
    structure?: any;
    customInstructions: string;
    category: string;
    userId: string;
    resumeData?: any;
    originalContent?: any;
  }): Promise<string> {
    const { 
      userData, 
      jobData, 
      style, 
      layout, 
      structure, 
      customInstructions, 
      category, 
      userId,
      resumeData,
      originalContent 
    } = params;

    const flow = getLetterFlow(category);
    
    // Extract original blocks for context
    const originalBlocks = originalContent?.blocks || [];
    const originalSections = originalBlocks.map((block: any) => 
      `[${block.type}]: ${block.content.substring(0, 150)}${block.content.length > 150 ? '...' : ''}`
    ).join('\n');

    const basePrompt = EnhancedPromptBuilder.buildCategoryAwarePrompt(
      category,
      userData,
      jobData,
      style,
      flow,
      resumeData
    );

    const templateInstructions = layout ? 
      `TEMPLATE: ${layout}\nSTRUCTURE: ${JSON.stringify(structure)}` : '';

    const resumeContext = this.buildResumeContext(resumeData);

    return `COMPLETE LETTER REGENERATION REQUEST

  You are completely regenerating an existing ${category.toLowerCase()} letter based on custom instructions.

  ORIGINAL LETTER CONTEXT:
  ${originalSections}

  CUSTOM REGENERATION INSTRUCTIONS:
  ${customInstructions}

  ${basePrompt}

  ${templateInstructions}
  ${resumeContext}

  IMPORTANT REGENERATION RULES:
  1. Start fresh based on instructions, don't just modify the original
  2. Maintain the same ${category} context and structure
  3. Keep user and job information consistent
  4. Apply ${style} writing style
  5. Use the exact same section markers as the template
  6. Ensure all essential information from the original is preserved
  7. Make significant improvements based on the instructions

  Generate the complete regenerated letter now:`;
  }

  // Helper method for translation
  private async translateText(text: string, targetLanguage: string): Promise<string> {
    const prompt = `Translate the following text to ${targetLanguage}. 

  IMPORTANT TRANSLATION RULES:
  1. Maintain the exact same meaning and intent
  2. Keep professional tone and formatting
  3. Preserve all names, dates, numbers, and technical terms
  4. Maintain proper letter structure and section markers
  5. Ensure cultural appropriateness for ${targetLanguage}
  6. Keep the same level of formality

  ORIGINAL TEXT:
  ${text}

  Translated text in ${targetLanguage}:`;

    return await this.generateContent(prompt);
  }


















  // Add these methods to the CoverLetterService class

/**
 * Helper: Get default formatting for block type
 */
private getDefaultFormatting(sectionType: string): any {
  const defaults: Record<string, any> = {
    'contact_info': {
      bold: false,
      italic: false,
      underline: false,
      fontSize: '12px',
      alignment: 'left'
    },
    'date': {
      bold: false,
      italic: false,
      underline: false,
      fontSize: '12px',
      alignment: 'right'
    },
    'greeting': {
      bold: false,
      italic: false,
      underline: false,
      fontSize: '14px',
      alignment: 'left'
    },
    'intro_paragraph': {
      bold: false,
      italic: false,
      underline: false,
      fontSize: '12px',
      alignment: 'left'
    },
    'body_paragraph': {
      bold: false,
      italic: false,
      underline: false,
      fontSize: '12px',
      alignment: 'left'
    },
    'closing_paragraph': {
      bold: false,
      italic: false,
      underline: false,
      fontSize: '12px',
      alignment: 'left'
    },
    'signature': {
      bold: true,
      italic: false,
      underline: false,
      fontSize: '14px',
      alignment: 'left'
    }
  };
  
  return defaults[sectionType] || {
    bold: false,
    italic: false,
    underline: false,
    fontSize: '12px',
    alignment: 'left'
  };
}

/**
 * Helper: Adjust block count to match original
 */
private adjustBlockCount(translatedBlocks: any[], originalBlocks: any[]): any[] {
  // If we have fewer blocks than original, merge some
  if (translatedBlocks.length < originalBlocks.length) {
    const mergedBlocks = [...translatedBlocks];
    const lastBlock = mergedBlocks[mergedBlocks.length - 1];
    
    // Add missing blocks by combining content
    while (mergedBlocks.length < originalBlocks.length) {
      const originalIndex = mergedBlocks.length;
      if (originalIndex < originalBlocks.length) {
        const originalBlock = originalBlocks[originalIndex];
        if (lastBlock) {
          // Append to last block
          lastBlock.content += '\n\n' + originalBlock.content;
        } else {
          mergedBlocks.push(originalBlock);
        }
      }
    }
    
    return mergedBlocks;
  }
  
  // If we have more blocks than original, split some
  if (translatedBlocks.length > originalBlocks.length) {
    const adjustedBlocks = [];
    
    for (let i = 0; i < originalBlocks.length; i++) {
      if (i < translatedBlocks.length) {
        adjustedBlocks.push(translatedBlocks[i]);
      } else {
        // Use original block if we ran out of translations
        adjustedBlocks.push(originalBlocks[i]);
      }
    }
    
    return adjustedBlocks;
  }
  
  return translatedBlocks;
}

/**
 * Helper: Group blocks by type
 */
private groupBlocksByType(blocks: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  
  for (const block of blocks) {
    const type = block.type || 'content';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(block);
  }
  
  return groups;
}

/**
 * Translate blocks of same type together for consistency
 */
private async translateBlocksOfType(
  blocks: any[],
  blockType: string,
  dto: TranslateLetterDto,
  transactionId: string
): Promise<any[]> {
  const translatedBlocks: any[] = [];
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const translatedBlock = await this.translateSingleBlock(
      block,
      dto,
      transactionId
    );
    translatedBlocks.push(translatedBlock);
  }
  
  return translatedBlocks;
}

/**
 * Translate a single block
 */
private async translateSingleBlock(
  block: any,
  dto: TranslateLetterDto,
  transactionId: string
): Promise<any> {
  // Build translation prompt
  const translationPrompt = this.buildSectionTranslationPrompt(
    block,
    dto.targetLanguage,
    dto.preservation || TranslationPreservation.ALL,
    dto
  );

  // Generate translation
  const translatedContent = await this.generateContent(translationPrompt);

  return this.createTranslatedBlock(
    block,
    translatedContent,
    {
      targetLanguage: dto.targetLanguage,
      method: dto.method || TranslationMethod.PRESERVE_STRUCTURE,
      originalContent: block.content,
      sectionIndex: 0,
      transactionId
    }
  );
}

/**
 * Restore original block order
 */
private restoreOriginalOrder(originalBlocks: any[], translatedBlocks: any[]): any[] {
  const orderedBlocks: any[] = [];
  
  for (let i = 0; i < originalBlocks.length; i++) {
    const originalBlock = originalBlocks[i];
    const translatedBlock = translatedBlocks[i];
    
    if (translatedBlock) {
      // Keep the translated block
      orderedBlocks.push({
        ...translatedBlock,
        id: originalBlock.id, // Preserve original ID
        type: originalBlock.type // Preserve original type
      });
    } else {
      // If no translation found, use original
      orderedBlocks.push(this.cloneBlock(originalBlock));
    }
  }
  
  return orderedBlocks;
}

/**
 * Create a translated block with metadata
 */
private createTranslatedBlock(
  originalBlock: any,
  translatedContent: string,
  metadata: {
    targetLanguage: string;
    method: string;
    originalContent: string;
    sectionIndex: number;
    transactionId: string;
  }
): any {
  return {
    ...originalBlock,
    content: translatedContent,
    originalContent: metadata.originalContent,
    translationInfo: {
      translatedAt: new Date().toISOString(),
      targetLanguage: metadata.targetLanguage,
      method: metadata.method,
      sectionIndex: metadata.sectionIndex,
      transactionId: metadata.transactionId,
      originalLength: originalBlock.content?.length || 0,
      translatedLength: translatedContent.length
    },
    formatting: originalBlock.formatting || this.getDefaultFormatting(originalBlock.type)
  };
}

/**
 * Enhanced translation method with settings
 */
async translateLetterEnhanced(
  userId: string,
  coverLetterId: string,
  dto: TranslateLetterDto
): Promise<any> {
  const transactionId = dto.metadata?.transactionId || this.generateTransactionId();
  
  this.logger.log(`Enhanced translation for ${coverLetterId} to ${dto.targetLanguage}`, {
    userId,
    method: dto.method,
    preservation: dto.preservation,
    transactionId
  });

  // Get original cover letter
  const originalCoverLetter = await this.prisma.coverLetter.findFirst({
    where: { id: coverLetterId, userId }
  });

  if (!originalCoverLetter) {
    throw new NotFoundException('Cover letter not found');
  }

  const originalContent = originalCoverLetter.content as any;
  const originalBlocks = originalContent.blocks || [];
  const originalLayout = originalContent.layout;
  const originalStructure = originalContent.structure;
  const category = originalContent.category || 'Job Application';

  // CRITICAL FIX: Check if original has blocks
  console.log('🔍 Original content check:', {
    id: coverLetterId,
    title: originalCoverLetter.title,
    hasContent: !!originalContent,
    blocksCount: originalBlocks.length,
    contentKeys: originalContent ? Object.keys(originalContent) : []
  });

  if (!originalBlocks || originalBlocks.length === 0) {
    console.error('❌ Original letter has no blocks to translate!', {
      id: coverLetterId,
      title: originalCoverLetter.title,
      contentType: typeof originalContent,
      contentStructure: originalContent
    });
    
    throw new Error('The original letter has no content to translate. Please ensure the letter has been saved and has content.');
  }

  // Set defaults for optional parameters
  const resolvedDto = {
    ...dto,
    preservation: dto.preservation || TranslationPreservation.ALL,
    method: dto.method || TranslationMethod.PRESERVE_STRUCTURE,
    preserveNames: dto.preserveNames !== false,
    preserveDates: dto.preserveDates !== false,
    preserveNumbers: dto.preserveNumbers !== false,
    preserveUrls: dto.preserveUrls !== false,
    preserveEmailAddresses: dto.preserveEmailAddresses !== false,
    preserveTerms: dto.preserveTerms || []
  };

  console.log('✅ Starting translation with:', {
    originalBlocks: originalBlocks.length,
    targetLanguage: resolvedDto.targetLanguage,
    method: resolvedDto.method
  });

  let translatedBlocks: any[];
  let translationMetadata: any;

  // Choose translation method
  switch (resolvedDto.method) {
    case TranslationMethod.SECTION_BY_SECTION:
      ({ blocks: translatedBlocks, metadata: translationMetadata } = 
        await this.translateSectionBySection(originalBlocks, resolvedDto, transactionId));
      break;
    
    case TranslationMethod.COMPLETE:
      ({ blocks: translatedBlocks, metadata: translationMetadata } = 
        await this.translateCompleteLetter(originalBlocks, resolvedDto, transactionId));
      break;
    
    case TranslationMethod.PRESERVE_STRUCTURE:
    default:
      ({ blocks: translatedBlocks, metadata: translationMetadata } = 
        await this.translateWithStructurePreservation(originalBlocks, resolvedDto, transactionId));
      break;
  }

  // Build translated content
  const translatedContent = this.buildTranslatedContent(
    originalContent,
    translatedBlocks,
    originalLayout,
    originalStructure,
    {
      sourceLanguage: 'en', // Default to English
      targetLanguage: resolvedDto.targetLanguage,
      targetLanguageName: this.getLanguageDisplayName(resolvedDto.targetLanguage),
      method: resolvedDto.method,
      preservation: resolvedDto.preservation,
      transactionId,
      ...translationMetadata
    }
  );

  let resultCoverLetter;
  
  if (resolvedDto.createNewVersion) {
    const translatedTitle = this.generateTranslatedTitle(
      originalCoverLetter.title,
      this.getLanguageDisplayName(resolvedDto.targetLanguage),
      resolvedDto.versionName
    );

    const translatedSlug = this.generateTranslatedSlug(
      originalCoverLetter.slug,
      this.normalizeLanguageCode(resolvedDto.targetLanguage)
    );

    resultCoverLetter = await this.prisma.coverLetter.create({
      data: {
        title: translatedTitle,
        slug: translatedSlug,
        content: translatedContent,
        style: originalCoverLetter.style,
        layout: originalCoverLetter.layout,
        language: this.normalizeLanguageCode(resolvedDto.targetLanguage),
        originalId: originalCoverLetter.id,
        userId,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } else {
    // Update original
    resultCoverLetter = await this.prisma.coverLetter.update({
      where: { id: coverLetterId },
      data: {
        content: translatedContent,
        language: this.normalizeLanguageCode(resolvedDto.targetLanguage),
        updatedAt: new Date()
      }
    });
  }

  // Get all translations for response
  const allTranslations = await this.getLetterTranslations(userId, coverLetterId);

  return {
    success: true,
    coverLetter: resultCoverLetter,
    targetLanguage: resolvedDto.targetLanguage,
    method: resolvedDto.method,
    preservation: resolvedDto.preservation,
    createNewVersion: resolvedDto.createNewVersion,
    allTranslations,
    transactionId,
    metadata: translationMetadata
  };
}


/**
 * New method for frontend to call enhanced translation
 */
async translateLetterEnhancedCall(userId: string, coverLetterId: string, dto: TranslateLetterDto): Promise<any> {
  try {
    return await this.translateLetterEnhanced(userId, coverLetterId, dto);
  } catch (error) {
    this.logger.error('Enhanced translation failed:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

}