import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { GroqService } from './groq.service';
import { GoalService } from './goal.service';
import { IdentityService } from './identity.service';

interface DecisionOption {
  description: string;
  pros: string[];
  cons: string[];
}

interface DecisionScore {
  option: string;
  score: number;
  breakdown: {
    pros: number;
    cons: number;
    goalAlignment: number;
    identityAlignment: number;
    pastPattern: number;
  };
}

interface DecisionAnalysis {
  options: DecisionOption[];
  scores: DecisionScore[];
  recommendation: string;
  confidence: number;
  tradeoffs: string[];
  questionsToConsider: string[];
}

@Injectable()
export class DecisionEngineService {
  private readonly logger = new Logger(DecisionEngineService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => GroqService)) private groqService: GroqService,
    private goalService: GoalService,
    private identityService: IdentityService,
  ) {}

  /**
   * Analyze decision for user
   */
  async analyzeDecision(
    userId: string,
    query: string,
    optionA: string,
    optionB: string,
    goals?: string[],
    constraints?: string[],
  ): Promise<DecisionAnalysis> {
    try {
      // Get user context
      const userIdentity = await this.identityService.getUserIdentity(userId);
      const userGoals = await this.goalService.getActiveGoals(userId);
      const pastDecisions = await this.getPastDecisions(userId);

      // Analyze past patterns
      const patternAnalysis = this.analyzePastDecisionPatterns(pastDecisions);

      const prompt = `
You are a strategic decision advisor. Analyze this decision:

User Query: "${query}"

Options:
A: ${optionA}
B: ${optionB}

${goals ? `User's stated goals: ${goals.join(', ')}` : ''}
${constraints ? `Constraints: ${constraints.join(', ')}` : ''}

User Identity: ${userIdentity ? JSON.stringify(userIdentity.statements) : 'Not established'}
Active Goals: ${userGoals.map(g => g.description).join(', ')}

Past Decision Patterns: ${JSON.stringify(patternAnalysis)}

Analyze this decision and return a JSON object with:

1. For each option, list pros and cons (at least 3 each)
2. Score each option (0-100) based on:
   - Pros vs cons weight
   - Alignment with their long-term goals
   - Alignment with their identity
   - Past patterns (what they usually choose)

3. Provide a recommendation (which option and why)
4. List key tradeoffs they need to consider
5. List 2-3 questions they should ask themselves

Return format:
{
  "options": [
    {
      "description": "Option A description",
      "pros": ["pro1", "pro2", ...],
      "cons": ["con1", "con2", ...]
    }
  ],
  "scores": [
    {
      "option": "Option A",
      "score": 85,
      "breakdown": {
        "pros": 40,
        "cons": -10,
        "goalAlignment": 30,
        "identityAlignment": 15,
        "pastPattern": 10
      }
    }
  ],
  "recommendation": "Based on your goals to become X and your pattern of choosing Y, Option A appears stronger because...",
  "confidence": 0.85,
  "tradeoffs": ["tradeoff1", "tradeoff2"],
  "questionsToConsider": ["question1?", "question2?"]
}
`;

      const response = await this.groqService.chatCompletion(
        [{ role: 'user', content: prompt }],
        { user: { id: userId } },
        'CAREER_COACH',
        { temperature: 0.5 }
      );

      if (response.isFallback || !response.content) {
        throw new Error('Failed to analyze decision');
      }

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const analysis = JSON.parse(jsonMatch[0]) as DecisionAnalysis;

      // Save decision for future pattern analysis
      await this.saveDecision(userId, query, optionA, optionB, analysis, goals);

      return analysis;
    } catch (error) {
      this.logger.error('Decision analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get user's past decisions
   */
  public async getPastDecisions(userId: string): Promise<any[]> {
    return this.prisma.assistantDecision.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /**
   * Analyze patterns in past decisions
   */
  private analyzePastDecisionPatterns(decisions: any[]): any {
    if (decisions.length === 0) {
      return { hasPatterns: false };
    }

    // Analyze what they prioritize
    const priorities: Record<string, number> = {};
    decisions.forEach(d => {
      if (d.scores && d.scores[0]?.breakdown) {
        const breakdown = d.scores[0].breakdown;
        Object.keys(breakdown).forEach(key => {
          priorities[key] = (priorities[key] || 0) + (breakdown[key] > 0 ? 1 : 0);
        });
      }
    });

    // Find top priority
    let topPriority = 'unknown';
    let maxCount = 0;
    Object.entries(priorities).forEach(([key, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topPriority = key;
      }
    });

    return {
      hasPatterns: true,
      topPriority,
      decisionsCount: decisions.length,
    };
  }

  /**
   * Save decision to database - FIXED JSON HANDLING
   */
  private async saveDecision(
    userId: string,
    query: string,
    optionA: string,
    optionB: string,
    analysis: DecisionAnalysis,
    goals?: string[],
  ): Promise<void> {
    try {
      // Prepare options as plain objects (already JSON-serializable)
      const options = [
        { 
          description: optionA, 
          pros: analysis.options[0]?.pros || [], 
          cons: analysis.options[0]?.cons || [] 
        },
        { 
          description: optionB, 
          pros: analysis.options[1]?.pros || [], 
          cons: analysis.options[1]?.cons || [] 
        },
      ];

      // Prepare prosCons as a plain object
      const prosCons = {
        optionA: analysis.options[0] || { description: optionA, pros: [], cons: [] },
        optionB: analysis.options[1] || { description: optionB, pros: [], cons: [] },
      };

      // Prepare scores as plain objects
      const scores = analysis.scores.map(score => ({
        option: score.option,
        score: score.score,
        breakdown: {
          pros: score.breakdown.pros,
          cons: score.breakdown.cons,
          goalAlignment: score.breakdown.goalAlignment,
          identityAlignment: score.breakdown.identityAlignment,
          pastPattern: score.breakdown.pastPattern,
        },
      }));

      // Prepare goalAlignment - ensure it's either a valid object or null
      const goalAlignment = goals && goals.length > 0 
        ? { 
            goals: goals, 
            analysis: analysis.scores.map(s => ({
              option: s.option,
              score: s.score,
              breakdown: s.breakdown
            }))
          }
        : null;

      await this.prisma.assistantDecision.create({
        data: {
          userId,
          context: query,
          options: options as any, // Cast to any for Prisma JSON
          prosCons: prosCons as any,
          scores: scores as any,
          recommendation: analysis.recommendation,
          confidence: analysis.confidence,
          goalAlignment: goalAlignment as any,
        },
      });
      
      this.logger.debug(`Saved decision analysis for user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to save decision:', error);
    }
  }

  /**
   * Predict likely regret for a decision
   */
  async predictRegret(
    userId: string,
    option: string,
    alternative: string,
  ): Promise<{ regretProbability: number; reasons: string[] }> {
    const pastDecisions = await this.getPastDecisions(userId);
    
    if (pastDecisions.length < 3) {
      return { regretProbability: 0.5, reasons: ['Not enough past decisions to analyze'] };
    }

    const prompt = `
Based on this user's past decisions, predict how likely they are to regret choosing:
Option: "${option}"
Instead of: "${alternative}"

Past decisions summary:
${JSON.stringify(pastDecisions.slice(0, 5))}

Return JSON:
{
  "regretProbability": 0.3 (0-1),
  "reasons": ["reason1", "reason2"]
}
`;

    const response = await this.groqService.chatCompletion(
      [{ role: 'user', content: prompt }],
      { user: { id: userId } },
      'CAREER_COACH',
      { temperature: 0.3 }
    );

    if (response.isFallback || !response.content) {
      return { regretProbability: 0.5, reasons: ['Prediction unavailable'] };
    }

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { regretProbability: 0.5, reasons: ['Invalid response'] };
    }

    return JSON.parse(jsonMatch[0]);
  }
}