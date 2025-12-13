import { Controller, Post, Body } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Controller('openai')
export class OpenAiController {
  private readonly groqApiKey: string;
  private readonly groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(
    private config: ConfigService,
    private httpService: HttpService
  ) {
    const key = this.config.get('GROQ_API_KEY');
    if (!key) throw new Error('GROQ_API_KEY is not set in .env');
    this.groqApiKey = key;
  }

  private async generateContent(prompt: string): Promise<string> {
    try {
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
            max_tokens: 2000,
            top_p: 1,
            stream: false,
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

      return response.data.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`Failed to generate content: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  @Post('fix-grammar')
  async fixGrammar(@Body('text') text: string) {
    const result = await this.generateContent(
      `You are an AI writing assistant specialized in writing copy for resumes and cover letters.
      Do not return anything else except the text you improved. It should not begin with a newline. It should not have any prefix or suffix text.
      Just fix the spelling and grammar of the following paragraph, do not change the meaning and returns in the language of the text:\n\n${text}`
    );
    return { result: result.trim() };
  }

  @Post('improve-writing')
  async improveWriting(@Body('text') text: string) {
    const result = await this.generateContent(
      `You are an AI writing assistant specialized in writing copy for resumes and cover letters.
  Do not return anything else except the text you improved. It should not begin with a newline. It should not have any prefix or suffix text.
  Improve the writing of the following paragraph and returns in the language of the text:\n\n${text}`
    );
    return { result: result.trim() };
  }

  @Post('change-tone')
  async changeTone(@Body() body: { text: string; mood: string }) {
    const { text, mood } = body;
    const result = await this.generateContent(
      `You are an AI writing assistant specialized in writing copy for resumes and cover letters.
  Do not return anything else except the text you improved. It should not begin with a newline. It should not have any prefix or suffix text.
  Change the tone of the following paragraph to be ${mood} tone for a cover letter. Return only the rewritten in the language of the text:\n\n${text}`
    );
    return { result: result.trim() };
  }

  @Post('enhance-section')
  async enhanceSection(@Body() body: { text: string; instructions: string; context?: string }) {
    const { text, instructions, context } = body;
    
    const prompt = `You are an AI writing assistant specialized in professional cover letters.

Current text:
${text}

User instructions: ${instructions}
${context ? `Additional context: ${context}` : ''}

Please improve the text according to the user's specific instructions. Return only the improved text without any explanations or markdown formatting.`;

    const result = await this.generateContent(prompt);
    return { result: result.trim() };
  }
}