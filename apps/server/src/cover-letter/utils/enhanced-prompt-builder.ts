// server/cover-letter/utils/enhanced-prompt-builder.ts
import { LetterFlowType, LetterFlow } from './letter-flows';
import { CATEGORY_CONTENT_GUIDES } from './category-content-guides';

// Type definitions for better type safety
interface UserData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  skills?: string[];
  experience?: string[];
  [key: string]: any;
}

interface JobData {
  position?: string;
  company?: string;
  hiringManager?: string;
  jobDescription?: string;
  department?: string;
  partnershipType?: string;
  collaborationDetails?: string;
  relationship?: string;
  personalContext?: string;
  emotionalTone?: string;
  travelPurpose?: string;
  destination?: string;
  duration?: string;
  [key: string]: any;
}

interface ResumeData {
  basics?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
  skills?: string[];
  experience?: Array<{
    position?: string;
    company?: string;
    startDate?: string;
    endDate?: string;
    summary?: string;
    highlights?: string[];
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    area?: string;
    startDate?: string;
    endDate?: string;
  }>;
  projects?: Array<{
    name?: string;
    description?: string;
    highlights?: string[];
  }>;
  achievements?: Array<{
    title?: string;
    awarder?: string;
    date?: string;
    summary?: string;
  }>;
  certifications?: string[];
}

export class EnhancedPromptBuilder {
  private static readonly STYLE_TONES: Record<string, string> = {
    'Professional': 'Balanced, respectful, business-appropriate',
    'Modern': 'Contemporary, direct, engaging',
    'Traditional': 'Formal, respectful, conventional',
    'Executive': 'Strategic, authoritative, results-focused',
    'Creative': 'Innovative, engaging, expressive',
    'Minimalist': 'Concise, direct, essential information only',
    'Academic': 'Formal, evidence-based, scholarly',
    'Technical': 'Precise, detailed, expertise-focused'
  };

  private static readonly CATEGORY_REQUIREMENTS: Record<string, string> = {
    'Job Application': 'Focus on qualifications, experience alignment, and value proposition',
    'Internship Application': 'Emphasize learning goals, academic preparation, and enthusiasm',
    'Business Partnership Proposal': 'Highlight mutual benefits, strategic alignment, and proposed value',
    'Letter to Parent/Relative': 'Focus on personal connection, emotional tone, and relationship',
    'Appreciation Letter': 'Be specific about gratitude, genuine in tone, and personal',
    'Apology Letter': 'Show sincerity, take responsibility, and offer resolution',
    'Visa Request / Embassy Letter': 'Be formal, complete, and compliance-focused'
  };

  static buildCategoryAwarePrompt(
  category: string,
  userData: UserData,
  jobData: JobData,
  style: string,
  flow: LetterFlow,
  resumeData?: ResumeData
): string {
  const categoryGuide = CATEGORY_CONTENT_GUIDES[category] || {};
  
  const promptParts = [
    // 🔥 CRITICAL: Strong opening instructions
    `🚨 STRICT INSTRUCTIONS - VIOLATIONS WILL CAUSE FAILURE:
1. OUTPUT ONLY THE LETTER TEXT WITH SECTION MARKERS
2. NO explanations, reasoning, commentary, or thought process
3. NO formatting tool text (like "✓ Editing", "Ctrl+Enter")
4. NO discussions about template decisions
5. If uncertain about structure, make silent decisions

ABSOLUTELY PROHIBITED:
- "According to the template..."
- "However, to follow..."
- "I have placed..."
- "Should be placed..."
- Any text explaining your choices
- Any commentary on formatting`,
    
    this.buildHeader(category, flow),
    this.buildSectionInstructions(flow, categoryGuide),
    this.buildUserContext(userData),
    this.buildResumeContext(resumeData),
    this.buildRecipientContext(category, jobData),
    this.buildStyleAndRequirements(category, style, flow),
    this.buildFormattingRules(flow),
    this.buildFooter(category, flow.type)
  ];

  return promptParts.filter(part => part.trim().length > 0).join('\n\n');
}

  private static buildHeader(category: string, flow: LetterFlow): string {
  return `You are an expert letter writer creating a ${category.toLowerCase()}. 

CRITICAL LANGUAGE RULE: Write the ENTIRE letter in the SAME LANGUAGE as the user input data below.
- ALL sections same language (contact info, date, greeting, body, closing, signature)
- Never mix languages within the letter

CATEGORY: ${category}
FLOW TYPE: ${flow.type.toUpperCase()}

REQUIRED SECTIONS (in this exact order):
${flow.sections.join(' → ')}`;
}

  private static buildSectionInstructions(flow: LetterFlow, categoryGuide: any): string {
    return `SECTION-BY-SECTION INSTRUCTIONS:

${flow.sections.map((section: string) => {
  const generalInstruction = flow.sectionInstructions[section];
  const categorySpecific = categoryGuide[section];
  
  return `[${section}]
General: ${generalInstruction}
${categorySpecific ? `Category Specific: ${categorySpecific}` : ''}
---`;
}).join('\n\n')}`;
  }

  private static buildUserContext(userData: UserData): string {
    const userInfo = [
      `- Name: ${userData.name}`,
      `- Email: ${userData.email}`,
      userData.phone && `- Phone: ${userData.phone}`,
      userData.address && `- Address: ${userData.address}`,
      userData.skills?.length && `- Skills: ${userData.skills.join(', ')}`,
      userData.experience?.length && `- Experience: ${userData.experience.join('; ')}`
    ].filter(Boolean).join('\n');

    return `USER INFORMATION:
${userInfo}`;
  }

  private static buildResumeContext(resumeData?: ResumeData): string {
    if (!resumeData) return '';

    const resumeParts = [];

    // Add professional summary if available
    if (resumeData.basics?.summary) {
      resumeParts.push(`PROFESSIONAL SUMMARY: ${resumeData.basics.summary}`);
    }

    // Add skills
    if (resumeData.skills?.length) {
      resumeParts.push(`KEY SKILLS: ${resumeData.skills.slice(0, 15).join(', ')}`);
    }

    // Add recent experience
    if (resumeData.experience?.length) {
      const recentExperience = resumeData.experience.slice(0, 3).map(exp => 
        `${exp.position} at ${exp.company} (${exp.startDate || ''} - ${exp.endDate || 'Present'})${exp.summary ? `: ${exp.summary}` : ''}`
      ).join('; ');
      resumeParts.push(`RECENT EXPERIENCE: ${recentExperience}`);
    }

    // Add education
    if (resumeData.education?.length) {
      const education = resumeData.education.slice(0, 2).map(edu =>
        `${edu.degree} in ${edu.area} from ${edu.institution}`
      ).join('; ');
      resumeParts.push(`EDUCATION: ${education}`);
    }

    // Add key projects
    if (resumeData.projects?.length) {
      const projects = resumeData.projects.slice(0, 2).map(proj =>
        `${proj.name}: ${proj.description}`
      ).join('; ');
      resumeParts.push(`KEY PROJECTS: ${projects}`);
    }

    // Add achievements
    if (resumeData.achievements?.length) {
      const achievements = resumeData.achievements.slice(0, 3).map(ach =>
        `${ach.title}${ach.awarder ? ` from ${ach.awarder}` : ''}${ach.date ? ` (${ach.date})` : ''}`
      ).join('; ');
      resumeParts.push(`ACHIEVEMENTS: ${achievements}`);
    }

    return resumeParts.length > 0 
      ? `RESUME-BASED QUALIFICATIONS:\n${resumeParts.join('\n')}`
      : '';
  }

  private static buildRecipientContext(category: string, jobData: JobData): string {
    const contextBuilders: Record<string, () => string> = {
      'Job Application': () => `POSITION CONTEXT:
- Position: ${jobData.position || 'Not specified'}
- Company: ${jobData.company || 'Not specified'}
- Hiring Manager: ${jobData.hiringManager || 'Not specified'}
- Job Description: ${this.truncateText(jobData.jobDescription, 200) || 'Not provided'}`,

      'Internship Application': () => `INTERNSHIP CONTEXT:
- Position: ${jobData.position || 'Internship'}
- Company: ${jobData.company || 'Not specified'}
- Department: ${jobData.department || 'Not specified'}`,

      'Business Partnership Proposal': () => `PARTNERSHIP CONTEXT:
- Company: ${jobData.company || 'Not specified'}
- Collaboration Type: ${jobData.partnershipType || 'Strategic partnership'}
- Proposed Details: ${jobData.collaborationDetails || 'Not specified'}`,

      'Letter to Parent/Relative': () => `RELATIONSHIP CONTEXT:
- Relationship: ${jobData.relationship || 'Family'}
- Personal Context: ${jobData.personalContext || 'General update'}
- Emotional Tone: ${jobData.emotionalTone || 'Warm and caring'}`,

      'Visa Request / Embassy Letter': () => `TRAVEL CONTEXT:
- Purpose: ${jobData.travelPurpose || 'Not specified'}
- Destination: ${jobData.destination || 'Not specified'}
- Duration: ${jobData.duration || 'Not specified'}`
    };

    const contextBuilder = contextBuilders[category];
    return contextBuilder ? contextBuilder() : 'RECIPIENT CONTEXT: Professional correspondence';
  }

  private static buildStyleAndRequirements(category: string, style: string, flow: LetterFlow): string {
    const baseTone = this.STYLE_TONES[style] || 'Professional and appropriate';
    const flowTone = flow.type === LetterFlowType.FORMAL 
      ? `${baseTone} with formal business conventions`
      : `${baseTone} with personal, conversational approach`;

    return `WRITING STYLE: ${style}
${flowTone}

SPECIFIC CATEGORY REQUIREMENTS:
${this.CATEGORY_REQUIREMENTS[category] || 'Professional and appropriate for the context'}`;
  }

  private static buildFormattingRules(flow: LetterFlow): string {
    return `FORMATTING RULES:
- Use exact section markers: [SECTION_NAME]
- One section per marker
- Maintain proper formatting within each section
- Follow flow type conventions (${flow.type})
- ${flow.formattingRules.join('\n- ')}`;
  }

private static buildFooter(category: string, flowType: LetterFlowType): string {
  return `🚨 ABSOLUTE OUTPUT RULES:
• OUTPUT ONLY THE LETTER - NO explanations, thoughts, or commentary
• NO "✓ Editing • Ctrl+Enter to save • Esc to revert" or similar tool text
• NO reasoning about template decisions
• NO "According to..." or "However..." explanations
• NO "I have placed..." or "Should be placed..." commentary

🎯 REQUIRED OUTPUT:
- Clean letter with section markers only
- Professional tone appropriate for ${category}
- All sections in consistent language
- Follow ${flowType} structure exactly

🚫 STRICTLY PROHIBITED:
- Any text explaining your decisions
- Any commentary on the template
- Any tool interface text
- Any markdown or formatting instructions
- Any text that isn't part of the actual letter

📝 GENERATE THE LETTER NOW (section markers only):`;
}

  private static truncateText(text: string | undefined, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  // Additional utility method for building prompts with custom instructions
  static buildCustomPrompt(
    category: string,
    userData: UserData,
    jobData: JobData,
    style: string,
    flow: LetterFlow,
    resumeData?: ResumeData,
    customInstructions?: string
  ): string {
    const basePrompt = this.buildCategoryAwarePrompt(category, userData, jobData, style, flow, resumeData);
    
    if (!customInstructions?.trim()) {
      return basePrompt;
    }

    return `${basePrompt}

  CUSTOM INSTRUCTIONS:
  ${customInstructions.trim()}

  NOTE: While following these custom instructions, ensure the letter maintains proper ${category} structure, professional standards and should be in the language that the inputs are given in unless a new language is specified. `;
  }


  static buildPromptWithLanguageOverride(
    category: string,
    userData: UserData,
    jobData: JobData,
    style: string,
    flow: LetterFlow,
    resumeData?: ResumeData,
    customInstructions?: string,
    languageOverride?: string
  ): string {
    let prompt = this.buildCustomPrompt(category, userData, jobData, style, flow, resumeData, customInstructions);
    
    // Add language override instructions if provided
    if (languageOverride && languageOverride.trim()) {
      const languageInstruction = `
  LANGUAGE OVERRIDE INSTRUCTION:
  IMPORTANT: Regardless of the language detected in the input data, generate the entire letter in ${languageOverride.trim()}.
  - Use proper grammar, syntax, and cultural conventions for ${languageOverride.trim()}
  - Maintain the same meaning and content as specified in the user inputs
  - Ensure all dates, addresses, and formatting follow ${languageOverride.trim()} conventions
  - Do not mix languages - write entirely in ${languageOverride.trim()}`;
      
      prompt = prompt.replace(
        'NOTE: While following these custom instructions, ensure the letter maintains',
        `${languageInstruction}

  NOTE: While following these custom instructions, ensure the letter maintains`
      );
    }
    
    return prompt;
  }
}