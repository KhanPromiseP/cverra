import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../../../tools/prisma/prisma.service';
import { GroqService } from './groq.service';
import { EmotionalState } from '@prisma/client';
import { IntentType } from '../interfaces/intent.types';

interface EmotionalAnalysis {
  primaryState: EmotionalState;
  secondaryStates: EmotionalState[];
  intensity: number;
  trigger?: string;
  keywords: string[];
  confidence: number;
  analysis: string;
  isPattern?: boolean;
}

@Injectable()
export class EmotionalIntelligenceService {
  private readonly logger = new Logger(EmotionalIntelligenceService.name);

  // Keywords that indicate certain emotional states
  private readonly stateIndicators: Partial<Record<EmotionalState, string[]>> = {
    [EmotionalState.TIRED]: ['tired', 'exhausted', 'sleepy', 'fatigue', 'drained', 'burnt out'],
    [EmotionalState.CONFUSED]: ['confused', 'don\'t understand', 'unclear', 'complicated', 'lost'],
    [EmotionalState.FRUSTRATED]: ['frustrated', 'annoying', 'why won\'t', 'stuck', 'not working'],
    [EmotionalState.OVERWHELMED]: ['overwhelmed', 'too much', 'can\'t handle', 'stressed'],
    [EmotionalState.MOTIVATED]: ['motivated', 'excited to', 'ready to', 'let\'s do this'],
    [EmotionalState.ANXIOUS]: ['anxious', 'worried', 'nervous', 'afraid', 'scared'],
    [EmotionalState.DISCOURAGED]: ['discouraged', 'hopeless', 'pointless', 'why bother'],
  };

  // Cache for recent analyses to prevent duplicate work
  private analysisCache: Map<string, { analysis: EmotionalAnalysis; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => GroqService)) private groqService: GroqService, // ADD forwardRef
  ) {}

  /**
   * Analyze emotional state - ONLY when needed
   */
  async analyzeEmotionalState(
    userId: string,
    message: string,
    conversationId?: string,
    messageId?: string,
    intent?: IntentType,
  ): Promise<EmotionalAnalysis | null> {
    try {
      // STEP 1: Check if analysis is needed based on intent
      if (!this.shouldAnalyzeEmotion(intent, message)) {
        return null;
      }

      // STEP 2: Check cache
      const cacheKey = this.getCacheKey(userId, message);
      const cached = this.analysisCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        this.logger.debug('Returning cached emotional analysis');
        return cached.analysis;
      }

      // STEP 3: Quick keyword analysis
      const quickAnalysis = this.quickEmotionalAnalysis(message);
      
      if (quickAnalysis.primaryState === EmotionalState.NEUTRAL && 
          quickAnalysis.confidence > 0.7) {
        return quickAnalysis;
      }

      // STEP 4: Use AI for non-neutral or low confidence
      if (quickAnalysis.primaryState !== EmotionalState.NEUTRAL || 
          quickAnalysis.confidence < 0.6) {
        
        const aiAnalysis = await this.analyzeWithAI(userId, message);
        
        if (aiAnalysis) {
          this.analysisCache.set(cacheKey, { analysis: aiAnalysis, timestamp: Date.now() });
          
          this.saveEmotionalSnapshot(userId, aiAnalysis, conversationId, messageId)
            .catch(err => this.logger.error('Failed to save snapshot:', err));
          
          if (Math.random() < 0.1) {
            this.detectEmotionalPatterns(userId, aiAnalysis)
              .catch(err => this.logger.error('Pattern detection failed:', err));
          }
          
          return aiAnalysis;
        }
      }

      this.analysisCache.set(cacheKey, { analysis: quickAnalysis, timestamp: Date.now() });
      return quickAnalysis;

    } catch (error) {
      this.logger.error('Emotional analysis failed:', error);
      return null;
    }
  }

  /**
   * Determine if emotional analysis is needed
   */
  private shouldAnalyzeEmotion(intent?: IntentType, message?: string): boolean {
    const emotionalIntents = [
      IntentType.EMOTIONAL_SUPPORT,
      IntentType.STRESS_EXPRESSION,
      IntentType.MOTIVATION_SEEKING,
      IntentType.GOAL_STALLED
    ];

    if (intent && emotionalIntents.includes(intent)) {
      return true;
    }

    if (message) {
      const lowerMessage = message.toLowerCase();
      const emotionalKeywords = [
        'feel', 'feeling', 'sad', 'happy', 'angry', 'frustrated',
        'stressed', 'overwhelmed', 'excited', 'worried', 'anxious'
      ];
      
      if (emotionalKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return true;
      }
    }

    return Math.random() < 0.05;
  }

  /**
   * AI-powered analysis
   */
  private async analyzeWithAI(userId: string, message: string): Promise<EmotionalAnalysis | null> {
    try {
      const prompt = `
Analyze the emotional state from this message. Be concise and accurate.

Message: "${message}"

Return a JSON object with:
- primaryState: one of [POSITIVE, NEUTRAL, NEGATIVE, FRUSTRATED, CONFUSED, ANXIOUS, MOTIVATED, TIRED, OVERWHELMED, DISCOURAGED, EXCITED, CURIOUS]
- secondaryStates: array of other states
- intensity: 1-10
- trigger: brief trigger (max 5 words)
- keywords: array of key emotional words
- confidence: 0-1
- analysis: one sentence explanation

Only return valid JSON. No other text.
`;

      const response = await this.groqService.chatCompletion(
        [{ 
          role: 'user', 
          content: prompt,
          metadata: { source: 'emotional' }
        }],
        { user: { id: userId } },
        'GENERAL_ASSISTANT',
        { 
          temperature: 0.2,
          maxTokens: 300
        }
      );

      if (response.isFallback || !response.content) {
        return null;
      }

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const analysis = JSON.parse(jsonMatch[0]) as EmotionalAnalysis;
      
      if (!analysis.primaryState || !analysis.intensity) {
        return null;
      }

      return analysis;

    } catch (error) {
      this.logger.error('AI analysis failed:', error);
      return null;
    }
  }

  /**
   * Quick keyword-based emotional analysis
   */
  private quickEmotionalAnalysis(message: string): EmotionalAnalysis {
    const lowerMessage = message.toLowerCase();
    const detected: Partial<Record<EmotionalState, boolean>> = {};
    const keywords: string[] = [];

    for (const [state, indicators] of Object.entries(this.stateIndicators)) {
      for (const indicator of indicators) {
        if (lowerMessage.includes(indicator)) {
          detected[state as EmotionalState] = true;
          keywords.push(indicator);
          break;
        }
      }
    }

    let primaryState: EmotionalState = EmotionalState.NEUTRAL;
    let intensity = 5;
    let confidence = 0.8;

    if (detected[EmotionalState.OVERWHELMED]) {
      primaryState = EmotionalState.OVERWHELMED;
      intensity = 8;
      confidence = 0.7;
    } else if (detected[EmotionalState.FRUSTRATED]) {
      primaryState = EmotionalState.FRUSTRATED;
      intensity = 7;
      confidence = 0.7;
    } else if (detected[EmotionalState.ANXIOUS]) {
      primaryState = EmotionalState.ANXIOUS;
      intensity = 7;
      confidence = 0.6;
    } else if (detected[EmotionalState.CONFUSED]) {
      primaryState = EmotionalState.CONFUSED;
      intensity = 6;
      confidence = 0.6;
    } else if (detected[EmotionalState.TIRED]) {
      primaryState = EmotionalState.TIRED;
      intensity = 6;
      confidence = 0.7;
    } else if (detected[EmotionalState.MOTIVATED]) {
      primaryState = EmotionalState.MOTIVATED;
      intensity = 7;
      confidence = 0.7;
    } else if (detected[EmotionalState.DISCOURAGED]) {
      primaryState = EmotionalState.DISCOURAGED;
      intensity = 6;
      confidence = 0.6;
    }

    const secondaryStates = Object.keys(detected)
      .filter(s => s !== primaryState)
      .map(s => s as EmotionalState);

    return {
      primaryState,
      secondaryStates,
      intensity,
      keywords,
      confidence,
      analysis: `Detected ${primaryState} based on keywords: ${keywords.slice(0, 3).join(', ')}`,
      isPattern: false,
    };
  }

  /**
   * Get cache key
   */
  private getCacheKey(userId: string, message: string): string {
    const messagePrefix = message.substring(0, 100);
    return `${userId}:${messagePrefix}`;
  }

  /**
   * Save emotional snapshot
   */
  private async saveEmotionalSnapshot(
    userId: string,
    analysis: EmotionalAnalysis,
    conversationId?: string,
    messageId?: string,
  ): Promise<void> {
    try {
      await this.prisma.assistantEmotionalSnapshot.create({
        data: {
          userId,
          primaryState: analysis.primaryState,
          secondaryStates: analysis.secondaryStates || [],
          intensity: analysis.intensity,
          conversationId,
          messageId,
          trigger: analysis.trigger?.substring(0, 200),
          keywords: analysis.keywords || [],
          confidence: analysis.confidence,
          analysis: analysis.analysis?.substring(0, 500),
          isPattern: false,
        },
      });
    } catch (error) {
      this.logger.error('Failed to save emotional snapshot:', error);
    }
  }

  /**
   * Detect emotional patterns
   */
  async detectEmotionalPatterns(
    userId: string,
    currentAnalysis?: EmotionalAnalysis,
  ): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const snapshots = await this.prisma.assistantEmotionalSnapshot.findMany({
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (snapshots.length < 5) return;
      
      // Pattern detection logic here...
      
    } catch (error) {
      this.logger.error('Pattern detection failed:', error);
    }
  }

  /**
   * Generate gentle intervention based on patterns
   */
  async generateEmotionalIntervention(
    userId: string,
    currentState?: EmotionalAnalysis,
  ): Promise<string | null> {
    try {
      const patterns = await this.prisma.assistantEmotionalPattern.findMany({
        where: {
          userId,
          lastDetected: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { severity: 'desc' },
        take: 3,
      });

      if (patterns.length === 0 && !currentState) return null;

      const interventionStates: EmotionalState[] = [
        EmotionalState.TIRED, 
        EmotionalState.OVERWHELMED, 
        EmotionalState.CONFUSED,
        EmotionalState.FRUSTRATED,
        EmotionalState.ANXIOUS,
        EmotionalState.DISCOURAGED
      ];
      
      const needsIntervention = 
        (currentState && interventionStates.includes(currentState.primaryState) && currentState.intensity >= 6) ||
        patterns.some(p => p.severity >= 7);

      if (!needsIntervention) return null;

      let context = '';
      if (patterns.length > 0) {
        context = `Recent patterns detected: ${patterns.map(p => p.description).join('; ')}. `;
      }
      if (currentState) {
        context += `Current state: ${currentState.primaryState} (intensity ${currentState.intensity}/10). `;
        if (currentState.trigger) {
          context += `Trigger: ${currentState.trigger}. `;
        }
      }

      const prompt = `
You are a compassionate assistant. Based on the user's emotional state and patterns, generate a gentle, supportive intervention.

${context}

The intervention should:
- Acknowledge their state without being pitying
- Be warm and human, not clinical
- Offer support or a simple suggestion if appropriate
- Keep it to 2-3 sentences
- Make it feel like a caring friend noticed something

Generate only the intervention text, no explanations or prefixes.
`;

      const response = await this.groqService.chatCompletion(
        [{ 
          role: 'user', 
          content: prompt,
          metadata: { source: 'emotional-intervention' }
        }],
        { user: { id: userId } },
        'GENERAL_ASSISTANT',
        { 
          temperature: 0.7,
          maxTokens: 200
        }
      );

      if (response.isFallback || !response.content) return null;

      if (patterns.length > 0) {
        for (const pattern of patterns) {
          await this.prisma.assistantEmotionalPattern.update({
            where: { id: pattern.id },
            data: {
              lastInterventionAt: new Date(),
              interventionCount: { increment: 1 },
            },
          });
        }
      }

      return response.content;
    } catch (error) {
      this.logger.error('Failed to generate emotional intervention:', error);
      return null;
    }
  }

  /**
   * Get emotional summary
   */
  async getEmotionalSummary(
    userId: string,
    days: number = 7,
  ): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshots = await this.prisma.assistantEmotionalSnapshot.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (snapshots.length === 0) {
      return this.getEmptySummary();
    }

    const stateCounts: Record<string, number> = {};
    let totalIntensity = 0;
    let changes = 0;

    snapshots.forEach((s, i) => {
      stateCounts[s.primaryState] = (stateCounts[s.primaryState] || 0) + 1;
      totalIntensity += s.intensity || 5;
      
      if (i > 0 && s.primaryState !== snapshots[i-1].primaryState) {
        changes++;
      }
    });

    const volatility = snapshots.length > 1 ? changes / (snapshots.length - 1) : 0;

    return {
      primaryEmotion: this.getDominantState(stateCounts),
      emotionalVolatility: parseFloat(volatility.toFixed(2)),
      dominantStates: Object.entries(stateCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([state, count]) => ({ 
          state, 
          count,
          percentage: Math.round((count / snapshots.length) * 100)
        })),
      averageIntensity: Math.round(totalIntensity / snapshots.length),
      totalSnapshots: snapshots.length,
      fatigueDays: this.countStates(snapshots, [EmotionalState.TIRED, EmotionalState.OVERWHELMED]),
      confusionDays: this.countStates(snapshots, [EmotionalState.CONFUSED]),
      motivationDays: this.countStates(snapshots, [EmotionalState.MOTIVATED, EmotionalState.EXCITED]),
    };
  }

  private getEmptySummary() {
    return {
      primaryEmotion: 'neutral',
      emotionalVolatility: 0,
      dominantStates: [],
      averageIntensity: 5,
      totalSnapshots: 0,
      fatigueDays: 0,
      confusionDays: 0,
      motivationDays: 0,
    };
  }

  private getDominantState(stateCounts: Record<string, number>): string {
    return Object.entries(stateCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
  }

  private countStates(snapshots: any[], states: EmotionalState[]): number {
    return snapshots.filter(s => states.includes(s.primaryState)).length;
  }
}