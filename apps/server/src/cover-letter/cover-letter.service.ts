


// import { Injectable, Logger, NotFoundException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { PrismaService } from 'nestjs-prisma';
// import { CoverLetter, CoverLetterStyle } from '@prisma/client';

// import { CreateCoverLetterDto } from './dto/create-cover-letter.dto';
// import { EnhanceBlockDto } from './dto/enhance-block.dto';
// import { UpdateCoverLetterDto } from './dto/update-cover-letter.dto';
// import { TemplateService } from './templates/template.service';
// import { TemplateLayoutGenerator } from './utils/template-layouts';
// import { EnhancedPromptBuilder } from './utils/enhanced-prompt-builder';
// import { LetterFlowType, getLetterFlow } from './utils/letter-flows';

// // Type guard to check if a string is a valid CoverLetterStyle
// function isCoverLetterStyle(style: string): style is CoverLetterStyle {
//   return Object.values(CoverLetterStyle).includes(style as CoverLetterStyle);
// }

// // Helper function to ensure JSON serializability
// function ensureJsonSerializable(obj: any): any {
//   return JSON.parse(JSON.stringify(obj));
// }

// @Injectable()
// export class CoverLetterService {
//   private readonly logger = new Logger(CoverLetterService.name);
//   private gemini: GoogleGenerativeAI;

//   constructor(
//     private config: ConfigService,
//     private prisma: PrismaService,
//     private templateService: TemplateService
//   ) {
//     const key = this.config.get('GEMINI_API_KEY');
//     if (!key) throw new Error('GEMINI_API_KEY is not set in .env');
//     this.gemini = new GoogleGenerativeAI(key);
//   }

//   private getModel() {
//     return this.gemini.getGenerativeModel({
//       model: 'models/gemini-2.5-pro',
//     });
//   }

//   private getStyleInstructions(style: CoverLetterStyle): string {
//     const styles: Record<CoverLetterStyle, string> = {
//       [CoverLetterStyle.Modern]: "Use a contemporary, clean layout with professional but approachable language. Focus on achievements and impact.",
//       [CoverLetterStyle.Traditional]: "Use a classic, formal structure with conservative language. Emphasize experience and qualifications.",
//       [CoverLetterStyle.Executive]: "Use sophisticated, strategic language focusing on leadership and business impact. More formal and results-oriented.",
//       [CoverLetterStyle.Creative]: "Use innovative language and structure. Can be more personal and story-driven. Good for design/creative roles.",
//       [CoverLetterStyle.Minimalist]: "Use concise, direct language with clean structure. Focus on essential information only.",
//       [CoverLetterStyle.Professional]: "Balanced approach - professional but not too formal. Emphasizes skills and value proposition.",
//       [CoverLetterStyle.Academic]: "Formal academic tone emphasizing research, publications, and academic achievements.",
//       [CoverLetterStyle.Technical]: "Structured approach focusing on technical skills, projects, and specific technologies."
//     };
    
//     return styles[style] || styles[CoverLetterStyle.Professional];
//   }

//   // Category-specific prompt builders
//   private buildCategorySpecificPrompt(category: string, data: any): string {
//     const categoryPrompts: Record<string, string> = {
//       // Job Application
//       'Job Application': `JOB APPLICATION CONTEXT:
// - Position: ${data.position || 'Not specified'}
// - Company: ${data.company || 'Not specified'}
// - Hiring Manager: ${data.hiringManager || 'Hiring Manager'}
// - Job Description: ${data.jobDescription || 'Not provided'}

// Focus on: Professional qualifications, relevant experience, skills matching the job requirements, enthusiasm for the role and company, and clear call to action for next steps.`,

//       // Internship Application
//       'Internship Application': `INTERNSHIP APPLICATION CONTEXT:
// - Position: ${data.position || 'Internship Position'}
// - Company: ${data.company || 'Not specified'}
// - Department: ${data.department || 'Not specified'}
// - Academic Level: ${data.academicLevel || 'Not specified'}

// Focus on: Academic achievements, relevant coursework, eagerness to learn, transferable skills, enthusiasm for the industry, and willingness to contribute.`,

//       // Scholarship/Academic Request
//       'Scholarship/Academic Request': `SCHOLARSHIP/ACADEMIC REQUEST CONTEXT:
// - Scholarship/Program: ${data.programName || 'Not specified'}
// - Institution: ${data.institution || 'Not specified'}
// - Field of Study: ${data.fieldOfStudy || 'Not specified'}
// - Academic Achievements: ${data.academicAchievements || 'Not provided'}

// Focus on: Academic excellence, research interests, career goals, financial need (if applicable), contributions to academic community, and alignment with program objectives.`,

//       // Business Partnership Proposal
//       'Business Partnership Proposal': `BUSINESS PARTNERSHIP PROPOSAL CONTEXT:
// - Company/Organization: ${data.company || 'Not specified'}
// - Partnership Type: ${data.partnershipType || 'Strategic Partnership'}
// - Proposed Collaboration: ${data.collaborationDetails || 'Not specified'}

// Focus on: Mutual benefits, strategic alignment, value proposition, proposed terms, success metrics, and next steps for discussion.`,

//       // Contract / Offer Negotiation
//       'Contract / Offer Negotiation': `CONTRACT/OFFER NEGOTIATION CONTEXT:
// - Position: ${data.position || 'Not specified'}
// - Company: ${data.company || 'Not specified'}
// - Current Offer: ${data.currentOffer || 'Not specified'}
// - Negotiation Points: ${data.negotiationPoints || 'Not provided'}

// Focus on: Professional tone, clear rationale for requests, value proposition, flexibility, and maintaining positive relationship.`,

//       // Recommendation Request
//       'Recommendation Request': `RECOMMENDATION REQUEST CONTEXT:
// - Purpose: ${data.purpose || 'Not specified (e.g., job, scholarship, program)'}
// - Relationship: ${data.relationship || 'Not specified'}
// - Key Points to Highlight: ${data.keyPoints || 'Not provided'}

// Focus on: Respectful tone, clear request, relevant context about the opportunity, suggested talking points, and appreciation for their time.`,

//       // Apology Letter
//       'Apology Letter': `APOLOGY LETTER CONTEXT:
// - Situation: ${data.situation || 'Not specified'}
// - Impact: ${data.impact || 'Not specified'}
// - Resolution: ${data.resolution || 'Steps being taken to address the issue'}

// Focus on: Sincere apology, acknowledgment of impact, taking responsibility, corrective actions, and commitment to improvement.`,

//       // Appreciation Letter
//       'Appreciation Letter': `APPRECIATION LETTER CONTEXT:
// - Recipient: ${data.recipient || 'Not specified'}
// - Reason for Appreciation: ${data.reason || 'Not specified'}
// - Impact: ${data.impact || 'How their actions helped you'}

// Focus on: Genuine gratitude, specific examples, emotional tone, and lasting impact of their actions.`,

//       // Letter to Parent/Relative
//       'Letter to Parent/Relative': `PERSONAL LETTER CONTEXT:
// - Relationship: ${data.relationship || 'Family member/Relative'}
// - Purpose: ${data.purpose || 'Personal update, sharing news, etc.'}
// - Personal Context: ${data.personalContext || 'Not specified'}

// Focus on: Warm, personal tone, emotional connection, family updates, and genuine care. Use appropriate level of formality based on relationship.`,

//       // Visa Request / Embassy Letter
//       'Visa Request / Embassy Letter': `OFFICIAL EMBASSY/VISA REQUEST CONTEXT:
// - Purpose of Travel: ${data.travelPurpose || 'Not specified'}
// - Destination: ${data.destination || 'Not specified'}
// - Duration: ${data.duration || 'Not specified'}
// - Supporting Documents: ${data.supportingDocs || 'Not specified'}

// Focus on: Formal, respectful tone, clear purpose, compliance with requirements, supporting evidence, and professional presentation.`,

//       // Complaint Letter
//       'Complaint Letter': `COMPLAINT LETTER CONTEXT:
// - Issue: ${data.issue || 'Not specified'}
// - Product/Service: ${data.productService || 'Not specified'}
// - Desired Resolution: ${data.desiredResolution || 'Not specified'}

// Focus on: Professional tone, clear description of issue, specific facts, reasonable requests, and desired outcome.`,

//       // General Official Correspondence
//       'General Official Correspondence': `GENERAL OFFICIAL CORRESPONDENCE CONTEXT:
// - Purpose: ${data.purpose || 'Not specified'}
// - Recipient: ${data.recipient || 'Not specified'}
// - Key Information: ${data.keyInformation || 'Not specified'}

// Focus on: Professional tone, clear communication, appropriate formality, and specific purpose.`
//     };

//     return categoryPrompts[category] || categoryPrompts['General Official Correspondence'];
//   }

//   // Get user resume data
//   private async getUserResumeData(userId: string): Promise<any> {
//     try {
//       const resume = await this.prisma.resume.findFirst({
//         where: { userId },
//         orderBy: { updatedAt: 'desc' }
//       });

//       if (!resume || !resume.data) {
//         return null;
//       }

//       const resumeData = resume.data as any;
      
//       // Extract key information from resume
//       return {
//         skills: resumeData.skills || [],
//         experience: resumeData.experience || [],
//         education: resumeData.education || [],
//         certifications: resumeData.certifications || [],
//         projects: resumeData.projects || [],
//         achievements: resumeData.achievements || []
//       };
//     } catch (error) {
//       this.logger.warn('Could not fetch resume data for user:', userId);
//       return null;
//     }
//   }

//   // Enhanced prompt builder with category awareness
//   private async buildEnhancedPrompt(params: {
//   userData: any;
//   jobData: any;
//   style: CoverLetterStyle;
//   layout?: string;
//   structure?: any;
//   customInstructions?: string;
//   category: string;
//   userId: string;
//   selectedResumeId?: string; // Add this parameter
// }): Promise<string> {
//   const { userData, jobData, style, layout, structure, customInstructions, category, userId, selectedResumeId } = params;
  
//   // Get the appropriate letter flow
//   const flow = getLetterFlow(category);
  
//   // Get resume data - use selectedResumeId if provided, otherwise get latest
//   const resumeData = selectedResumeId 
//     ? await this.getResumeById(userId, selectedResumeId)
//     : await this.getUserResumeData(userId);

//   // Build category-aware prompt with resume data
//   const basePrompt = EnhancedPromptBuilder.buildCategoryAwarePrompt(
//     category,
//     userData,
//     jobData,
//     style,
//     flow,
//     resumeData // Pass resume data to the prompt builder
//   );

//   // Add template-specific instructions
//   const templateInstructions = layout ? 
//     `TEMPLATE: ${layout}\nSTRUCTURE: ${JSON.stringify(structure)}` : '';

//   // Enhanced resume context
//   const resumeContext = this.buildResumeContext(resumeData);

//   return `${basePrompt}

// ${templateInstructions}
// ${resumeContext}

// CUSTOM INSTRUCTIONS: ${customInstructions || 'None'}

// FINAL OUTPUT REQUIREMENTS:
// - Use EXACT section markers as specified
// - Follow ${flow.type} letter conventions strictly
// - Maintain consistent formatting
// - Tailor content to ${category} context
// - Apply ${style} writing style appropriately
// - Incorporate relevant skills and experience from resume: ${resumeData ? 'Yes' : 'No'}

// Generate the complete letter now:`;
// }





// // Build resume context for prompt

// private buildResumeContext(resumeData: any): string {
//   if (!resumeData) {
//     return 'RESUME CONTEXT: No resume data available';
//   }

//   const basics = resumeData.basics || {};
//   const skills = resumeData.skills || [];
//   const experience = resumeData.experience || [];
//   const education = resumeData.education || [];
//   const projects = resumeData.projects || [];
//   const achievements = resumeData.achievements || [];

//   // Format experience for prompt
//   const formattedExperience = experience.slice(0, 3).map((exp: any) => {
//     const period = exp.startDate && exp.endDate 
//       ? `(${exp.startDate} - ${exp.endDate})`
//       : exp.startDate 
//       ? `(${exp.startDate} - Present)`
//       : '';
    
//     return `${exp.position} at ${exp.company} ${period}${exp.summary ? `: ${exp.summary}` : ''}`;
//   }).join('; ');

//   // Format education for prompt
//   const formattedEducation = education.slice(0, 2).map((edu: any) => 
//     `${edu.degree} in ${edu.area} from ${edu.institution}`
//   ).join('; ');

//   // Format achievements
//   const formattedAchievements = achievements.slice(0, 3).map((ach: any) => 
//     `${ach.title}${ach.awarder ? ` from ${ach.awarder}` : ''}${ach.date ? ` (${ach.date})` : ''}`
//   ).join('; ');

//   // Format projects
//   const formattedProjects = projects.slice(0, 2).map((proj: any) => 
//     `${proj.name}: ${proj.description}`
//   ).join('; ');

//   return `RESUME CONTEXT:
// - Name: ${basics.name || 'Not specified'}
// - Email: ${basics.email || 'Not specified'}
// - Phone: ${basics.phone || 'Not specified'}
// - Location: ${basics.location || 'Not specified'}
// - Professional Summary: ${basics.summary || 'Not specified'}
// - Key Skills: ${skills.slice(0, 15).join(', ')}
// - Recent Experience: ${formattedExperience || 'None'}
// - Education: ${formattedEducation || 'None'}
// - Key Projects: ${formattedProjects || 'None'}
// - Achievements: ${formattedAchievements || 'None'}`;
// }

// // Fetch resume by ID
// private async getResumeById(userId: string, resumeId: string): Promise<any> {
//   try {
//     const resume = await this.prisma.resume.findFirst({
//       where: { 
//         id: resumeId,
//         userId 
//       }
//     });

//     if (!resume || !resume.data) {
//       this.logger.warn(`Resume ${resumeId} not found for user ${userId}`);
//       return null;
//     }

//     const resumeData = resume.data as any;
//     const basics = resumeData.basics || {};
    
//     // Extract skills properly - handle both array of strings and array of objects
//     const skills = (resumeData.skills || []).map((skill: any) => 
//       typeof skill === 'string' ? skill : skill.name || ''
//     ).filter(Boolean);

//     // Extract work experience properly
//     const workExperience = resumeData.work || [];
//     const experience = workExperience.map((job: any) => ({
//       position: job.position || job.name || '',
//       company: job.company || job.employer || '',
//       startDate: job.startDate || '',
//       endDate: job.endDate || 'Present',
//       summary: job.summary || '',
//       highlights: job.highlights || []
//     }));

//     // Extract education
//     const education = (resumeData.education || []).map((edu: any) => ({
//       institution: edu.institution || edu.school || '',
//       degree: edu.degree || edu.studyType || '',
//       area: edu.area || edu.field || '',
//       startDate: edu.startDate || '',
//       endDate: edu.endDate || ''
//     }));

//     // Extract projects
//     const projects = (resumeData.projects || []).map((project: any) => ({
//       name: project.name || '',
//       description: project.description || '',
//       highlights: project.highlights || []
//     }));

//     // Extract awards/achievements
//     const awards = (resumeData.awards || []).map((award: any) => ({
//       title: award.title || '',
//       awarder: award.awarder || '',
//       date: award.date || '',
//       summary: award.summary || ''
//     }));

//     return {
//       basics: {
//         name: basics.name || '',
//         email: basics.email || '',
//         phone: basics.phone || '',
//         location: basics.location || '',
//         summary: basics.summary || ''
//       },
//       skills,
//       experience,
//       education,
//       projects,
//       achievements: awards,
//       certifications: resumeData.certifications || []
//     };
//   } catch (error) {
//     this.logger.error(`Error fetching resume ${resumeId} for user ${userId}:`, error);
//     return null;
//   }
// }



// /**
//  * Get all available templates for the frontend
//  */
// async getTemplates() {
//   return this.templateService.getAllTemplates();
// }

// /**
//  * Get templates by category for the frontend
//  */
// async getTemplatesByCategory(category: string) {
//   return this.templateService.getTemplatesByCategory(category as any);
// }

// /**
//  * Get template by ID for the frontend
//  */
// async getTemplateById(id: string) {
//   const template = this.templateService.getTemplateById(id);
//   if (!template) {
//     throw new NotFoundException(`Template with id ${id} not found`);
//   }
//   return template;
// }

// /**
//  * Get all template categories for the frontend
//  */
// async getTemplateCategories() {
//   return this.templateService.getCategories();
// }

// /**
//  * Apply a template to a cover letter
//  * This is the backend implementation for the frontend applyTemplate call
//  */
// async applyTemplateToCoverLetter(userId: string, coverLetterId: string, templateId: string) {
//   // Verify the cover letter exists and belongs to the user
//   const coverLetter = await this.prisma.coverLetter.findFirst({
//     where: { id: coverLetterId, userId }
//   });

//   if (!coverLetter) {
//     throw new NotFoundException('Cover letter not found');
//   }

//   // Get the template
//   const template = this.templateService.getTemplateById(templateId);
//   if (!template) {
//     throw new NotFoundException('Template not found');
//   }

//   // Update the cover letter with the new template
//   const updatedCoverLetter = await this.prisma.coverLetter.update({
//     where: { id: coverLetterId },
//     data: {
//       style: template.style,
//       layout: template.id,
//       content: {
//         ...(coverLetter.content as object),
//         layoutType: template.layout,
//         structure: ensureJsonSerializable(template.structure),
//         style: template.style,
//         lastSaved: new Date().toISOString()
//       },
//       updatedAt: new Date()
//     }
//   });

//   return {
//     success: true,
//     coverLetter: updatedCoverLetter,
//     template: template
//   };
// }

// /**
//  * Search templates by query for the frontend
//  */
// async searchTemplates(query: string) {
//   return this.templateService.searchTemplates(query);
// }

// /**
//  * Get featured templates for the frontend
//  */
// async getFeaturedTemplates() {
//   return this.templateService.getFeaturedTemplates();
// }

// /**
//  * Get popular templates for the frontend
//  */
// async getPopularTemplates() {
//   return this.templateService.getPopularTemplates();
// }

// /**
//  * Get template statistics for the frontend
//  */
// async getTemplateStats() {
//   return this.templateService.getTemplateStats();
// }

  

//   async applyTemplate(userId: string, coverLetterId: string, templateId: string) {
//     const template = this.templateService.getTemplateById(templateId);
//     if (!template) {
//       throw new NotFoundException('Template not found');
//     }
    
//     const currentCoverLetter = await this.findOne(userId, coverLetterId);
    
//     const updatedCoverLetter = await this.update(userId, coverLetterId, {
//       style: template.style,
//       layout: template.id,
//       content: {
//         ...(currentCoverLetter.content as object),
//         layoutType: template.layout,
//         structure: ensureJsonSerializable(template.structure),
//         style: template.style,
//         lastSaved: new Date().toISOString()
//       }
//     } as any);

//     return {
//       success: true,
//       coverLetter: updatedCoverLetter,
//       template: template
//     };
//   }

//   async regenerateBlock(userId: string, id: string, blockId: string) {
//     const coverLetter = await this.prisma.coverLetter.findFirst({
//       where: { id, userId }
//     });

//     if (!coverLetter) {
//       throw new NotFoundException('Cover letter not found');
//     }

//     const content = coverLetter.content as any;
//     const block = content.blocks.find((b: any) => b.id === blockId);

//     if (!block) {
//       throw new NotFoundException('Block not found');
//     }

//     const userData = this.extractUserDataFromContent(content);
//     const jobData = this.extractJobDataFromContent(content);
//     const category = content.category || 'Job Application';

//     const regeneratedContent = await this.regenerateSection(
//       block,
//       coverLetter.style,
//       userData,
//       jobData,
//       category,
//       userId
//     );

//     const updatedBlocks = content.blocks.map((b: any) =>
//       b.id === blockId ? { ...b, content: regeneratedContent } : b
//     );

//     const updatedCoverLetter = await this.prisma.coverLetter.update({
//       where: { id },
//       data: {
//         content: {
//           ...content,
//           blocks: updatedBlocks,
//           lastSaved: new Date().toISOString()
//         }
//       }
//     });

//     return {
//       success: true,
//       block: { id: blockId, content: regeneratedContent },
//       coverLetter: updatedCoverLetter
//     };
//   }

//   private async regenerateSection(
//     block: any, 
//     style: CoverLetterStyle, 
//     userData: any, 
//     jobData: any,
//     category: string,
//     userId: string
//   ): Promise<string> {
//     const model = this.getModel();

//     const blockTypeInstructions: Record<string, string> = {
//       // 'header': 'Generate a professional header section with name and contact information appropriate for the letter category',
//       'contact_info': 'Generate a professional contact information section with name relevant details based on the letter category',
//       'date': 'Generate current date in proper format',
//       'greeting': `Generate an appropriate greeting for a ${category.toLowerCase()}`,
//       'body_paragraph': `Generate content appropriate for a ${category.toLowerCase()}, focusing on relevant information and tone`,
//       'closing': 'Generate an appropriate closing paragraph',
//       'signature': 'Generate a professional signature block'
//     };

//     const resumeData = await this.getUserResumeData(userId);
//     const resumeContext = resumeData ? `RESUME CONTEXT AVAILABLE: Yes (${resumeData.skills?.length || 0} skills, ${resumeData.experience?.length || 0} experiences)` : 'RESUME CONTEXT AVAILABLE: No';

//     const prompt = `You are regenerating a specific section of a ${category.toLowerCase()}.

// SECTION TYPE: ${block.type}
// SECTION PURPOSE: ${blockTypeInstructions[block.type] || 'Professional content appropriate for the letter category'}

// CATEGORY: ${category}
// ${this.buildCategorySpecificPrompt(category, { ...userData, ...jobData })}

// USER INFORMATION:
// - Name: ${userData.name || 'Sender'}
// - Contact: ${userData.email || 'Not provided'}
// ${resumeContext}

// STYLE: ${style}
// ${this.getStyleInstructions(style)}

// IMPORTANT: Return ONLY the regenerated section content without any markers, explanations, or additional text. Make it appropriate for the category and context.`;

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
    
//     return response.text().trim();
//   }

//   private extractUserDataFromContent(content: any): any {
//     // const headerBlock = content.blocks.find((b: any) => b.type === 'header');
//     const contactBlock = content.blocks.find((b: any) => b.type === 'contact_info');
    
//     return {
//       name: this.extractNameFromHeader(contactBlock?.content),
//       email: this.extractEmailFromContact(contactBlock?.content),
//       phone: this.extractPhoneFromContact(contactBlock?.content),
//       address: this.extractAddressFromContact(contactBlock?.content)
//     };
//   }

//   private extractJobDataFromContent(content: any): any {
//     return {
//       position: content.jobData?.position || 'the position',
//       company: content.jobData?.company || 'the company',
//       hiringManager: content.jobData?.hiringManager || 'Recipient'
//     };
//   }

//   private extractNameFromHeader(headerContent: string): string {
//     if (!headerContent) return 'Sender';
//     const lines = headerContent.split('\n').filter(line => line.trim());
//     return lines[0]?.trim() || 'Sender';
//   }

//   private extractEmailFromContact(contactContent: string): string {
//     if (!contactContent) return '';
//     const emailMatch = contactContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
//     return emailMatch ? emailMatch[0] : '';
//   }

//   private extractPhoneFromContact(contactContent: string): string {
//     if (!contactContent) return '';
//     const phoneMatch = contactContent.match(/[\+]?[1-9][\d]{0,15}/);
//     return phoneMatch ? phoneMatch[0] : '';
//   }

//   private extractAddressFromContact(contactContent: string): string {
//     if (!contactContent) return '';
//     // Simple address extraction - look for multi-line content
//     const lines = contactContent.split('\n').filter(line => line.trim());
//     if (lines.length > 2) {
//       return lines.slice(1, 3).join(', ');
//     }
//     return '';
//   }

//   private parseContentToBlocks(content: string): any[] {
//     const blocks = [];
//     const sectionRegex = /\[(\w+)\]([\s\S]*?)(?=\[\w+\]|$)/g;
//     let match;

//     while ((match = sectionRegex.exec(content)) !== null) {
//       const [, type, text] = match;
//       blocks.push({
//         id: `${type.toLowerCase()}-${Date.now()}`,
//         type: type.toLowerCase(),
//         content: text.trim(),
//         formatting: {
//           bold: false,
//           italic: false,
//           underline: false,
//           fontSize: this.getDefaultFontSize(type),
//           alignment: 'left'
//         }
//       });
//     }

//     if (blocks.length === 0) {
//       blocks.push({
//         id: 'content-1',
//         type: 'content',
//         content: content,
//         formatting: {
//           bold: false,
//           italic: false,
//           underline: false,
//           fontSize: '14px',
//           alignment: 'left'
//         }
//       });
//     }

//     return blocks;
//   }

//   private getDefaultFontSize(type: string): string {
//     const sizes: Record<string, string> = {
//       // header: '24px',
//       contact_info: '14px',
//       date: '14px',
//       greeting: '16px',
//       body_paragraph_1: '14px',
//       body_paragraph_2: '14px', 
//       body_paragraph_3: '14px',
//       closing: '14px',
//       signature: '16px'
//     };
//     return sizes[type] || '14px';
//   }

//   private generateSlug(title: string): string {
//     return title
//       .toLowerCase()
//       .replace(/[^a-z0-9]+/g, '-')
//       .replace(/(^-|-$)+/g, '');
//   }

//   async generateCoverLetter(userId: string, createCoverLetterDto: CreateCoverLetterDto) {
//     try {
//     this.logger.log(`Generating cover letter for user ${userId}`);
//     this.logger.log(`Selected resume ID: ${(createCoverLetterDto as any).selectedResumeId}`);
    
//     const selectedResumeId = (createCoverLetterDto as any).selectedResumeId;
    
//     // Debug: Check if we're getting the resume data
//     if (selectedResumeId) {
//       const resumeData = await this.getResumeById(userId, selectedResumeId);
//       this.logger.log(`Resume data found: ${!!resumeData}`);
//       if (resumeData) {
//         this.logger.log(`Resume basics: ${JSON.stringify(resumeData.basics)}`);
//         this.logger.log(`Skills count: ${resumeData.skills?.length}`);
//       }
//     }

//     // Rest of your existing code...
//   } catch (error) {
//     this.logger.error('Cover letter generation failed:', error);
//     throw new Error('Failed to generate cover letter: ' + error.message);
//   }
//   try {
    
//     const model = this.getModel();
    
//     const style = isCoverLetterStyle(createCoverLetterDto.style) 
//       ? createCoverLetterDto.style 
//       : CoverLetterStyle.Professional;

//     const layout = (createCoverLetterDto as any).layout || 'modern-professional';
//     const template = this.templateService.getTemplateById(layout);
//     const structure = template?.structure || this.templateService.getTemplateStructure(layout);
//     const category = (createCoverLetterDto as any).category || 'Job Application';
//     const selectedResumeId = (createCoverLetterDto as any).selectedResumeId; // Get selected resume ID

//     const prompt = await this.buildEnhancedPrompt({
//       ...createCoverLetterDto,
//       style,
//       layout,
//       structure,
//       category,
//       userId,
//       selectedResumeId // Pass to prompt builder
//     });
    
//     // Rest of the method remains the same...
//     const result = await model.generateContent(prompt);
//     const content = result.response.text();
    
//     const blocks = this.parseContentToBlocks(content);
//     const enhancedLayout = TemplateLayoutGenerator.generateLayout(structure, blocks);

//     const serializableContent = {
//       blocks: ensureJsonSerializable(blocks),
//       layout: ensureJsonSerializable(enhancedLayout),
//       style: createCoverLetterDto.style,
//       layoutType: layout,
//       structure: ensureJsonSerializable(structure),
//       category: category,
//       lastSaved: new Date().toISOString(),
//       resumeUsed: selectedResumeId || null // Track which resume was used
//     };

//     const coverLetter = await this.prisma.coverLetter.create({
//       data: {
//         title: createCoverLetterDto.title,
//         slug: this.generateSlug(createCoverLetterDto.title),
//         content: serializableContent,
//         style: style,
//         layout: layout,
//         userId,
//         isPublic: false
//       }
//     });

//     return {
//       success: true,
//       coverLetter,
//       blocks,
//       layout: enhancedLayout,
//       template: template
//     };
//   } catch (error) {
//     this.logger.error('Cover letter generation failed:', error);
//     throw new Error('Failed to generate cover letter: ' + error.message);
//   }
// }

//   async findAll(userId: string): Promise<CoverLetter[]> {
//     return this.prisma.coverLetter.findMany({
//       where: { userId },
//       orderBy: { updatedAt: 'desc' }
//     });
//   }

//   async findOne(userId: string, id: string): Promise<CoverLetter> {
//     const coverLetter = await this.prisma.coverLetter.findFirst({
//       where: { id, userId }
//     });

//     if (!coverLetter) {
//       throw new NotFoundException('Cover letter not found');
//     }

//     return coverLetter;
//   }

//   async update(userId: string, id: string, updateCoverLetterDto: UpdateCoverLetterDto): Promise<CoverLetter> {
//     const coverLetter = await this.prisma.coverLetter.findFirst({
//       where: { id, userId }
//     });

//     if (!coverLetter) {
//       throw new NotFoundException('Cover letter not found');
//     }

//     const updateData: any = {
//       updatedAt: new Date()
//     };

//     if (updateCoverLetterDto.title !== undefined) {
//       updateData.title = updateCoverLetterDto.title;
//     }
//     if (updateCoverLetterDto.content !== undefined) {
//       updateData.content = updateCoverLetterDto.content;
//     }
//     if (updateCoverLetterDto.style !== undefined) {
//       updateData.style = isCoverLetterStyle(updateCoverLetterDto.style) 
//         ? updateCoverLetterDto.style 
//         : CoverLetterStyle.Professional;
//     }

//     if (updateCoverLetterDto.layout !== undefined) {
//       updateData.layout = updateCoverLetterDto.layout;
      
//       if (coverLetter.content && typeof coverLetter.content === 'object') {
//         const currentContent = coverLetter.content as any;
//         const newStructure = this.templateService.getTemplateStructure(updateCoverLetterDto.layout);
        
//         updateData.content = {
//           ...currentContent,
//           layoutType: updateCoverLetterDto.layout,
//           structure: ensureJsonSerializable(newStructure),
//           lastSaved: new Date().toISOString()
//         };
//       }
//     }

//     return this.prisma.coverLetter.update({
//       where: { id },
//       data: updateData
//     });
//   }

//   async remove(userId: string, id: string): Promise<CoverLetter> {
//     const coverLetter = await this.prisma.coverLetter.findFirst({
//       where: { id, userId }
//     });

//     if (!coverLetter) {
//       throw new NotFoundException('Cover letter not found');
//     }

//     return this.prisma.coverLetter.delete({
//       where: { id }
//     });
//   }

//   async enhanceBlock(userId: string, id: string, enhanceBlockDto: EnhanceBlockDto) {
//     const coverLetter = await this.prisma.coverLetter.findFirst({
//       where: { id, userId }
//     });

//     if (!coverLetter) {
//       throw new NotFoundException('Cover letter not found');
//     }

//     const content = coverLetter.content as any;
//     const block = content.blocks.find((b: any) => b.id === enhanceBlockDto.blockId);

//     if (!block) {
//       throw new NotFoundException('Block not found');
//     }

//     const enhancedContent = await this.enhanceSection(
//       block.content,
//       enhanceBlockDto.instructions,
//       coverLetter.style,
//       content.category || 'Job Application'
//     );

//     const updatedBlocks = content.blocks.map((b: any) =>
//       b.id === enhanceBlockDto.blockId ? { ...b, content: enhancedContent } : b
//     );

//     const updatedCoverLetter = await this.prisma.coverLetter.update({
//       where: { id },
//       data: {
//         content: {
//           ...content,
//           blocks: updatedBlocks,
//           lastSaved: new Date().toISOString()
//         }
//       }
//     });

//     return {
//       success: true,
//       block: { id: enhanceBlockDto.blockId, content: enhancedContent },
//       coverLetter: updatedCoverLetter
//     };
//   }

//   private async enhanceSection(
//     sectionContent: string, 
//     instructions: string, 
//     style: CoverLetterStyle,
//     category: string
//   ): Promise<string> {
//     const model = this.getModel();

//     const prompt = `You are enhancing a specific section of a ${category.toLowerCase()}.

// Original Section Content:
// ${sectionContent}

// Enhancement Instructions: ${instructions}
// Category: ${category}
// Style to Maintain: ${style}

// Please return ONLY the enhanced section content without any markers, explanations, or additional text. Ensure it maintains the appropriate tone for the category.`;

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
    
//     return response.text().trim();
//   }

//   // New method to get user's resume data for frontend
//   async getUserResumeContext(userId: string) {
//     const resumeData = await this.getUserResumeData(userId);
    
//     if (!resumeData) {
//       return { available: false };
//     }

//     return {
//       available: true,
//       skills: resumeData.skills || [],
//       experience: resumeData.experience?.slice(0, 5) || [], // Limit to recent 5
//       education: resumeData.education || [],
//       certifications: resumeData.certifications || [],
//       projects: resumeData.projects?.slice(0, 3) || [] // Limit to top 3
//     };
//   }
// }



import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from 'nestjs-prisma';
import { CoverLetter, CoverLetterStyle } from '@prisma/client';
import { lastValueFrom } from 'rxjs';

import { CreateCoverLetterDto } from './dto/create-cover-letter.dto';
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
- Hiring Manager: ${data.hiringManager || 'Hiring Manager'}
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
  selectedResumeId?: string; // Add this parameter
}): Promise<string> {
  const { userData, jobData, style, layout, structure, customInstructions, category, userId, selectedResumeId } = params;
  
  // Get the appropriate letter flow
  const flow = getLetterFlow(category);
  
  // Get resume data - use selectedResumeId if provided, otherwise get latest
  const resumeData = selectedResumeId 
    ? await this.getResumeById(userId, selectedResumeId)
    : await this.getUserResumeData(userId);

  // Build category-aware prompt with resume data
  const basePrompt = EnhancedPromptBuilder.buildCategoryAwarePrompt(
    category,
    userData,
    jobData,
    style,
    flow,
    resumeData // Pass resume data to the prompt builder
  );

  // Add template-specific instructions
  const templateInstructions = layout ? 
    `TEMPLATE: ${layout}\nSTRUCTURE: ${JSON.stringify(structure)}` : '';

  // Enhanced resume context
  const resumeContext = this.buildResumeContext(resumeData);

  return `${basePrompt}

${templateInstructions}
${resumeContext}

CUSTOM INSTRUCTIONS: ${customInstructions || 'None'}

FINAL OUTPUT REQUIREMENTS:
- Use EXACT section markers as specified
- Follow ${flow.type} letter conventions strictly
- Maintain consistent formatting
- Tailor content to ${category} context
- Apply ${style} writing style appropriately
- Incorporate relevant skills and experience from resume: ${resumeData ? 'Yes' : 'No'}

Generate the complete letter now:`;
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

REGENERATION GUIDELINES:
1. PRESERVE CORE CONTENT: Maintain the essential information and key points from the current section
2. IMPROVE QUALITY: Enhance language, clarity, and impact while keeping the same meaning
3. MAINTAIN LENGTH: Keep similar length (neither significantly longer nor shorter)
4. STYLE CONSISTENCY: Ensure the regenerated content matches the ${style} style
5. CONTEXT AWARENESS: Keep relevance to the ${category} context and user information
6. FLOW PRESERVATION: Ensure the regenerated section flows naturally with the rest of the letter

IMPORTANT: 
- Return ONLY the regenerated section content without any markers, explanations, or additional text
- Maintain the same key information points but express them more effectively
- Keep the tone appropriate for the category and style
- Ensure the content length is comparable to the original`;

  return await this.generateContent(prompt);
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

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  async generateCoverLetter(userId: string, createCoverLetterDto: CreateCoverLetterDto) {
    try {
    this.logger.log(`Generating cover letter for user ${userId}`);
    this.logger.log(`Selected resume ID: ${(createCoverLetterDto as any).selectedResumeId}`);
    
    const selectedResumeId = (createCoverLetterDto as any).selectedResumeId;
    
    // Debug: Check if we're getting the resume data
    if (selectedResumeId) {
      const resumeData = await this.getResumeById(userId, selectedResumeId);
      this.logger.log(`Resume data found: ${!!resumeData}`);
      if (resumeData) {
        this.logger.log(`Resume basics: ${JSON.stringify(resumeData.basics)}`);
        this.logger.log(`Skills count: ${resumeData.skills?.length}`);
      }
    }

    // Rest of your existing code...
  } catch (error) {
    this.logger.error('Cover letter generation failed:', error);
    throw new Error('Failed to generate cover letter: ' + error.message);
  }
  try {
    
    const style = isCoverLetterStyle(createCoverLetterDto.style) 
      ? createCoverLetterDto.style 
      : CoverLetterStyle.Professional;

    const layout = (createCoverLetterDto as any).layout || 'modern-professional';
    const template = this.templateService.getTemplateById(layout);
    const structure = template?.structure || this.templateService.getTemplateStructure(layout);
    const category = (createCoverLetterDto as any).category || 'Job Application';
    const selectedResumeId = (createCoverLetterDto as any).selectedResumeId; // Get selected resume ID

    const prompt = await this.buildEnhancedPrompt({
      ...createCoverLetterDto,
      style,
      layout,
      structure,
      category,
      userId,
      selectedResumeId // Pass to prompt builder
    });
    
    // Rest of the method remains the same...
    const content = await this.generateContent(prompt);
    
    const blocks = this.parseContentToBlocks(content);
    const enhancedLayout = TemplateLayoutGenerator.generateLayout(structure, blocks);

    const serializableContent = {
      blocks: ensureJsonSerializable(blocks),
      layout: ensureJsonSerializable(enhancedLayout),
      style: createCoverLetterDto.style,
      layoutType: layout,
      structure: ensureJsonSerializable(structure),
      category: category,
      lastSaved: new Date().toISOString(),
      resumeUsed: selectedResumeId || null // Track which resume was used
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
      template: template
    };
  } catch (error) {
    this.logger.error('Cover letter generation failed:', error);
    throw new Error('Failed to generate cover letter: ' + error.message);
  }
}

  async findAll(userId: string): Promise<CoverLetter[]> {
    return this.prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async findOne(userId: string, id: string): Promise<CoverLetter> {
    const coverLetter = await this.prisma.coverLetter.findFirst({
      where: { id, userId }
    });

    if (!coverLetter) {
      throw new NotFoundException('Cover letter not found');
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

    const updateData: any = {
      updatedAt: new Date()
    };

    if (updateCoverLetterDto.title !== undefined) {
      updateData.title = updateCoverLetterDto.title;
    }
    if (updateCoverLetterDto.content !== undefined) {
      updateData.content = updateCoverLetterDto.content;
    }
    if (updateCoverLetterDto.style !== undefined) {
      updateData.style = isCoverLetterStyle(updateCoverLetterDto.style) 
        ? updateCoverLetterDto.style 
        : CoverLetterStyle.Professional;
    }

    if (updateCoverLetterDto.layout !== undefined) {
      updateData.layout = updateCoverLetterDto.layout;
      
      if (coverLetter.content && typeof coverLetter.content === 'object') {
        const currentContent = coverLetter.content as any;
        const newStructure = this.templateService.getTemplateStructure(updateCoverLetterDto.layout);
        
        updateData.content = {
          ...currentContent,
          layoutType: updateCoverLetterDto.layout,
          structure: ensureJsonSerializable(newStructure),
          lastSaved: new Date().toISOString()
        };
      }
    }

    return this.prisma.coverLetter.update({
      where: { id },
      data: updateData
    });
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

    const enhancedContent = await this.enhanceSection(
      block.content,
      enhanceBlockDto.instructions,
      coverLetter.style,
      content.category || 'Job Application'
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
    category: string
  ): Promise<string> {
    const prompt = `You are enhancing a specific section of a ${category.toLowerCase()}.

Original Section Content:
${sectionContent}

Enhancement Instructions: ${instructions}
Category: ${category}
Style to Maintain: ${style}

Please return ONLY the enhanced section content without any markers, explanations, or additional text. Ensure it maintains the appropriate tone for the category.`;

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
}