// src/modules/assistant/services/identity.service.ts
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { GroqService } from './groq.service';
import { MessageBufferService } from './message-buffer.service';

interface IdentityExtraction {
  statements: string[];
  careerIdentity?: string;
  learningIdentity?: string;
  values: string[];
  confidence: number;
}

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);
  
  // Track last extraction time per user to avoid too frequent updates
  private lastExtractionTime: Map<string, number> = new Map();
  private readonly MIN_EXTRACTION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => GroqService)) private groqService: GroqService,
    private messageBuffer: MessageBufferService, // Add buffer service
  ) {}

  /**
   * Batch process identity extraction from buffer (called by cron)
   */
  async batchProcessIdentityExtraction(userId: string): Promise<void> {
    try {
      // Check if we should process (rate limiting)
      const lastExtraction = this.lastExtractionTime.get(userId) || 0;
      if (Date.now() - lastExtraction < this.MIN_EXTRACTION_INTERVAL) {
        this.logger.debug(`Skipping identity extraction for user ${userId} - too soon`);
        return;
      }

      // Get recent messages from database
      const recentMessages = await this.prisma.assistantMessage.findMany({
        where: {
          conversation: {
            userId,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50, // Analyze last 50 messages
        select: {
          role: true,
          content: true,
          createdAt: true,
        },
      });

      if (recentMessages.length < 10) {
        this.logger.debug(`Not enough messages for identity extraction: ${recentMessages.length}`);
        return;
      }

      // Extract identity from batch
      const extraction = await this.extractIdentityFromBatch(userId, recentMessages);
      
      if (extraction && (extraction.statements.length > 0 || extraction.values.length > 0)) {
        await this.updateUserIdentity(userId, extraction);
        this.lastExtractionTime.set(userId, Date.now());
        this.logger.log(`✅ Identity updated for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Batch identity extraction failed for user ${userId}:`, error);
    }
  }

  /**
   * Extract identity from a batch of messages (ONE API call)
   */
  private async extractIdentityFromBatch(
    userId: string,
    messages: any[],
  ): Promise<IdentityExtraction | null> {
    try {
      const conversationText = messages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n')
        .slice(0, 10000); // Limit token length

      const prompt = `
Analyze this conversation history and extract statements about who the user is or wants to become.
Look for patterns and repeated themes about their identity, career, learning style, and values.

Key things to identify:
- Career identity (e.g., "backend developer", "team lead")
- Learning identity (e.g., "self-taught", "visual learner")
- Core values (e.g., "autonomy", "growth", "impact")
- Identity statements ("I am...", "I want to become...")

Conversation History:
${conversationText}

Return a JSON object with:
{
  "statements": ["array of 3-5 key identity statements"],
  "careerIdentity": "their career identity if clear",
  "learningIdentity": "their learning style if clear",
  "values": ["3-5 core values"],
  "confidence": 0.8 (overall confidence 0-1)
}

Only include high-confidence insights. If unclear, return empty arrays.
`;

      const response = await this.groqService.chatCompletion(
        [{ 
          role: 'user', 
          content: prompt,
        }],
        { user: { id: userId } },
        'IDENTITY_ANALYSIS',
        { 
          temperature: 0.3,
          maxTokens: 800
        }
      );

      if (response.isFallback || !response.content) return null;

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const extraction = JSON.parse(jsonMatch[0]) as IdentityExtraction;
      
      // Validate and clean
      return {
        statements: Array.isArray(extraction.statements) ? extraction.statements.slice(0, 5) : [],
        careerIdentity: extraction.careerIdentity || undefined,
        learningIdentity: extraction.learningIdentity || undefined,
        values: Array.isArray(extraction.values) ? extraction.values.slice(0, 5) : [],
        confidence: Math.min(1, Math.max(0, extraction.confidence || 0.5)),
      };
    } catch (error) {
      this.logger.error('Batch identity extraction failed:', error);
      return null;
    }
  }

  /**
   * Update user identity in database (merge new with existing)
   */
  private async updateUserIdentity(
    userId: string,
    extraction: IdentityExtraction,
  ): Promise<void> {
    try {
      const existing = await this.prisma.assistantIdentity.findUnique({
        where: { userId },
      });

      if (existing) {
        // Parse existing data safely
        const existingStatements = this.parseJsonArray(existing.statements);
        const existingValues = existing.values || [];

        // Merge with new data (deduplicate)
        const mergedStatements = Array.from(new Set([
          ...existingStatements,
          ...extraction.statements,
        ]));

        const mergedValues = Array.from(new Set([
          ...existingValues,
          ...extraction.values,
        ]));

        // Update confidence (weighted average)
        const newConfidence = (existing.confidence + extraction.confidence) / 2;

        await this.prisma.assistantIdentity.update({
          where: { userId },
          data: {
            statements: mergedStatements,
            careerIdentity: extraction.careerIdentity || existing.careerIdentity,
            learningIdentity: extraction.learningIdentity || existing.learningIdentity,
            values: mergedValues,
            lastReinforced: new Date(),
            confidence: newConfidence,
          },
        });
      } else {
        await this.prisma.assistantIdentity.create({
          data: {
            userId,
            statements: extraction.statements,
            careerIdentity: extraction.careerIdentity,
            learningIdentity: extraction.learningIdentity,
            values: extraction.values,
            confidence: extraction.confidence,
            lastReinforced: new Date(),
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to update identity:', error);
    }
  }

  /**
   * Safely parse JSON array from Prisma
   */
  private parseJsonArray(json: any): string[] {
    if (!json) return [];
    if (Array.isArray(json)) return json.filter(item => typeof item === 'string');
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }

  /**
   * Get user identity with confidence (for real-time use)
   */
  async getUserIdentity(userId: string): Promise<any | null> {
    const identity = await this.prisma.assistantIdentity.findUnique({
      where: { userId },
      include: {
        goals: {
          where: { status: 'ACTIVE' },
          take: 5,
          select: {
            description: true,
            progress: true,
            category: true,
          },
        },
      },
    });

    if (!identity) return null;

    return {
      statements: this.parseJsonArray(identity.statements),
      careerIdentity: identity.careerIdentity,
      learningIdentity: identity.learningIdentity,
      values: identity.values || [],
      confidence: identity.confidence || 0.5,
      alignedGoals: identity.goals || [],
      lastReinforced: identity.lastReinforced,
    };
  }

  /**
   * Evolve identity based on recent conversations (called by cron)
   */
  async evolveIdentity(userId: string): Promise<boolean> {
    try {
      this.logger.debug(`Evolving identity for user ${userId}`);
      
      // Get messages from last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const recentMessages = await this.prisma.assistantMessage.findMany({
        where: {
          conversation: { userId },
          createdAt: { gte: sevenDaysAgo },
          role: 'user',
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { content: true, createdAt: true },
      });

      if (recentMessages.length < 5) return false;

      // Extract identity from recent messages
      const extraction = await this.extractIdentityFromBatch(userId, recentMessages);
      
      if (extraction && (extraction.statements.length > 0 || extraction.values.length > 0)) {
        await this.updateUserIdentity(userId, extraction);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Identity evolution failed:', error);
      return false;
    }
  }

  /**
   * Check if action aligns with identity (lightweight, no API call)
   */
  async checkIdentityAlignment(
    userId: string,
    action: string,
  ): Promise<{ aligns: boolean; reason: string; confidence: number }> {
    const identity = await this.getUserIdentity(userId);
    
    if (!identity || identity.confidence < 0.5) {
      return { aligns: true, reason: 'Identity not yet established', confidence: 0.5 };
    }

    // Simple keyword-based alignment (no API call)
    const actionLower = action.toLowerCase();
    const statements = identity.statements || [];
    const values = identity.values || [];

    // Check if action contains identity keywords
    const matchingStatements = statements.filter((s:any) => 
      actionLower.includes(s.toLowerCase().split(' ').slice(0, 3).join(' '))
    );

    const matchingValues = values.filter((v:any) => 
      actionLower.includes(v.toLowerCase())
    );

    if (matchingStatements.length > 0 || matchingValues.length > 0) {
      return {
        aligns: true,
        reason: `This aligns with your ${matchingStatements[0] || 'values'}`,
        confidence: 0.7,
      };
    }

    // If no match, return neutral with low confidence
    return {
      aligns: true,
      reason: 'No clear alignment or conflict detected',
      confidence: 0.5,
    };
  }

  /**
   * Generate identity-based coaching response (lightweight)
   */
  async generateIdentityBasedResponse(
    userId: string,
    userMessage: string,
    assistantResponse: string,
  ): Promise<string> {
    const identity = await this.getUserIdentity(userId);
    
    if (!identity || identity.confidence < 0.6) {
      return assistantResponse;
    }

    // Simple template-based personalization (no API call)
    const primaryStatement = identity.statements[0];
    const career = identity.careerIdentity;
    
    if (primaryStatement) {
      // Add identity-based framing
      const framing = `\n\nAs someone who ${primaryStatement.toLowerCase()}, you might find this particularly relevant. `;
      return assistantResponse + framing;
    }

    if (career) {
      const framing = `\n\nThinking about your journey as a ${career}, here's how this applies: `;
      return assistantResponse + framing;
    }

    return assistantResponse;
  }
}