import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIGenerationParams {
  userData: {
    name: string;
    email: string;
    phone?: string;
    skills: string[];
    experience: string[];
    achievements: string[];
  };
  jobData: {
    position: string;
    company: string;
    hiringManager?: string;
    jobDescription?: string;
  };
  style: string;
  customInstructions?: string;
}

export class CoverLetterAIService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private getStyleInstructions(style: string): string {
    const styles = {
      Modern: "Use a contemporary, clean layout with professional but approachable language. Focus on achievements and impact.",
      Traditional: "Use a classic, formal structure with conservative language. Emphasize experience and qualifications.",
      Executive: "Use sophisticated, strategic language focusing on leadership and business impact. More formal and results-oriented.",
      Creative: "Use innovative language and structure. Can be more personal and story-driven. Good for design/creative roles.",
      Minimalist: "Use concise, direct language with clean structure. Focus on essential information only.",
      Professional: "Balanced approach - professional but not too formal. Emphasizes skills and value proposition."
    };
    return styles[style] || styles.Professional;
  }

  async generateCoverLetter(params: AIGenerationParams): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = this.buildPrompt(params);
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return this.parseAIContent(response.text());
    } catch (error) {
      console.error('AI Generation Error:', error);
      throw new Error('Failed to generate cover letter');
    }
  }

  private buildPrompt(params: AIGenerationParams): string {
    const { userData, jobData, style, customInstructions } = params;
    
    return `You are an expert cover letter writer. Create a professional cover letter with the following structure and style.

STYLE: ${style}
${this.getStyleInstructions(style)}

USER INFORMATION:
- Name: ${userData.name}
- Email: ${userData.email}
- Phone: ${userData.phone || 'Not provided'}
- Key Skills: ${userData.skills.join(', ')}
- Experience: ${userData.experience.join('; ')}
- Achievements: ${userData.achievements.join('; ')}

JOB INFORMATION:
- Position: ${jobData.position}
- Company: ${jobData.company}
- Hiring Manager: ${jobData.hiringManager || 'Hiring Manager'}
- Job Description: ${jobData.jobDescription || 'Not provided'}

CUSTOM INSTRUCTIONS: ${customInstructions || 'None'}

IMPORTANT FORMATTING RULES:
1. Return the cover letter with clear section markers
2. Each section should be marked with [SECTION_NAME] tags
3. Preserve line breaks and spacing exactly as shown
4. Do not add any explanations or notes
5. Maintain the professional tone throughout

REQUIRED SECTIONS:
[HEADER]
[CONTACT_INFO]
[DATE]
[GREETING]
[BODY_PARAGRAPH]
[CLOSING]
[SIGNATURE]

Generate the cover letter now:`;
  }

  private parseAIContent(content: string): string {
    // Ensure all sections are properly formatted
    const sections = [
      'HEADER', 'CONTACT_INFO', 'DATE', 'GREETING', 
      'BODY_PARAGRAPH',
      'CLOSING', 'SIGNATURE'
    ];

    let parsedContent = content;
    
    // Add missing section markers if needed
    sections.forEach(section => {
      if (!parsedContent.includes(`[${section}]`)) {
        // Simple heuristic to add missing markers
        // In production, you'd want more sophisticated parsing
      }
    });

    return parsedContent;
  }

  async enhanceSection(sectionContent: string, instructions: string, style: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are enhancing a specific section of a cover letter.

Original Section Content:
${sectionContent}

Enhancement Instructions: ${instructions}
Style to Maintain: ${style}

Please return ONLY the enhanced section content without any markers, explanations, or additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text().trim();
  }
}