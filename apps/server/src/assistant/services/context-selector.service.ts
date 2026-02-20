// services/context-selector.service.ts (FULLY INTEGRATED - FIXED)
import { Injectable, Logger } from '@nestjs/common'; // ✅ ADD Logger
import { IntentAnalysis, IntentType, ContextSelection } from '../interfaces/intent.types';
import { MemoryService } from './memory.service';
import { GoalService } from './goal.service';
import { IdentityFramerService } from './identity-framer.service';
import { ArticleSelectorService } from './article-selector.service';
import { EmotionalIntelligenceService } from './emotional.service';
import { DecisionEngineService } from './decision.service';
import { FutureSimulationService } from './future-simulation.service';
import { LifeDashboardService } from './life-dashboard.service';
import { CacheService } from '../../redis/cache.service'; // ✅ ADD CacheService import

@Injectable()
export class ContextSelectorService {
  private readonly logger = new Logger(ContextSelectorService.name); // ✅ ADD logger

  constructor(
    private memoryService: MemoryService,
    private goalService: GoalService,
    private identityFramer: IdentityFramerService,
    private articleSelector: ArticleSelectorService,
    private emotionalService: EmotionalIntelligenceService,
    private decisionService: DecisionEngineService,
    private simulationService: FutureSimulationService,
    private lifeDashboard: LifeDashboardService,
    private cacheService: CacheService // ✅ ADD CacheService
  ) {}

  async selectContext(
    userId: string,
    intent: IntentAnalysis,
    contextSelection: ContextSelection,
    currentMessage: string,
    conversationId?: string
  ): Promise<any> {
    const context: any = {
      intent: intent.primary,
      intentConfidence: intent.confidence,
      emotionalTone: intent.emotionalTone,
      requiresUrgency: intent.requiresUrgency,
      timestamp: new Date().toISOString()
    };

    const promises = [];

    // ✅ MEMORIES - Always fetch but with timeout
    promises.push(
      Promise.race([
        this.memoryService.getRelevantMemoriesForContext(userId, currentMessage, 3)
          .catch(err => {
            this.logger.error('Memory fetch error:', err);
            return [];
          }),
        new Promise<any[]>((resolve) => {
          setTimeout(() => {
            this.logger.warn('Memory fetch timeout');
            resolve([]);
          }, 500);
        })
      ]).then(memories => {
        if (memories && memories.length > 0) {
          context.memories = memories;
        }
      })
    );

    // ✅ GOALS - Only if needed and with timeout
    if (contextSelection.goals) {
      promises.push(
        Promise.race([
          this.goalService.getGoalsForContext(userId, intent.primary, 2, intent.requiresUrgency)
            .catch(err => {
              this.logger.error('Goals fetch error:', err);
              return [];
            }),
          new Promise<any[]>((resolve) => {
            setTimeout(() => {
              this.logger.warn('Goals fetch timeout');
              resolve([]);
            }, 300);
          })
        ]).then(goals => {
          if (goals && goals.length > 0) context.goals = goals;
        })
      );
    }

    // ✅ IDENTITY - Cache this heavily (it doesn't change often)
    if (contextSelection.identity) {
      // Try cache first
      try {
        const cachedIdentity = await this.cacheService.getCachedData(`identity:${userId}`);
        if (cachedIdentity) {
          context.identity = cachedIdentity;
        } else {
          promises.push(
            this.identityFramer.getIdentitySummary(userId, intent)
              .then(identity => {
                if (identity) {
                  context.identity = identity;
                  // Cache for 1 hour (3600 seconds)
                  return this.cacheService.cacheData(`identity:${userId}`, identity, 3600);
                }
              })
              .catch(err => this.logger.error('Identity fetch error:', err))
          );
        }
      } catch (error) {
        this.logger.error('Cache error for identity:', error);
        // Fallback to direct fetch
        promises.push(
          this.identityFramer.getIdentitySummary(userId, intent)
            .then(identity => {
              if (identity) context.identity = identity;
            })
            .catch(err => this.logger.error('Identity fetch error:', err))
        );
      }
    }

    // ✅ ARTICLES - Only for specific intents, with timeout
    if (contextSelection.articles && this.shouldFetchArticles(intent.primary)) {
  promises.push(
    Promise.race([
      this.articleSelector.getRelevantArticles(userId, intent.primary, 3, intent)
        .then(articles => {
          if (articles && articles.length > 0) {
            context.articles = articles; // Now includes formatted field
          }
        })
        .catch(err => this.logger.error('Article fetch error:', err)),
      new Promise(resolve => setTimeout(resolve, 400))
    ])
  );
}

    // ✅ EMOTIONAL - Only for relevant intents
    if (this.needsEmotionalAnalysis(intent.primary)) {
      promises.push(
        this.emotionalService.analyzeEmotionalState(
          userId,
          currentMessage,
          conversationId,
          undefined,
          intent.primary
        ).then(emotional => {
          if (emotional) {
            context.emotional = {
              state: emotional.primaryState,
              intensity: emotional.intensity,
              analysis: emotional.analysis
            };
          }
        }).catch(err => this.logger.error('Emotional analysis error:', err))
      );
    }

    // ✅ DECISION DATA - ONLY for decision intents
    if (intent.primary === IntentType.DECISION_HELP || 
        intent.primary === IntentType.OPTION_COMPARISON) {
      promises.push(
        this.decisionService.getPastDecisions(userId)
          .then(decisions => {
            if (decisions && decisions.length > 0) {
              context.pastDecisions = decisions.slice(0, 3);
            }
          })
          .catch(err => this.logger.error('Past decisions fetch error:', err))
      );
    }

    // ✅ WEEKLY SUMMARY - ONLY when asked
    if (intent.primary === IntentType.WEEKLY_REVIEW) {
      promises.push(
        this.lifeDashboard.getLatestSummary(userId)
          .then(summary => {
            if (summary) {
              context.weeklySummary = {
                highlights: summary.highlights,
                challenges: summary.challenges,
                focus: summary.recommendedFocus
              };
            }
          })
          .catch(err => this.logger.error('Weekly summary fetch error:', err))
      );
    }

    // Wait for all promises, but don't let any single one block too long
    await Promise.allSettled(promises);
    
    return this.formatForPrompt(context, intent);
  }

  // Helper to decide if we need articles
  private shouldFetchArticles(intent: IntentType): boolean {
    const articleIntents = [
      IntentType.ARTICLE_RECOMMENDATION,
      IntentType.LEARNING_PATH,
      IntentType.CONTENT_CLARIFICATION,
      IntentType.GENERAL_QUESTION
    ];
    return articleIntents.includes(intent);
  }

  private needsEmotionalAnalysis(intent: IntentType): boolean {
    const emotionalIntents = [
      IntentType.EMOTIONAL_SUPPORT,
      IntentType.STRESS_EXPRESSION,
      IntentType.MOTIVATION_SEEKING,
      IntentType.GOAL_STALLED
    ];
    return emotionalIntents.includes(intent);
  }

  private formatForPrompt(context: any, intent: IntentAnalysis): any {
    const formatted: any = {};

    // Goals
    if (context.goals?.length) {
      formatted.focus = context.goals
        .map((g: any) => g.message)
        .join('\n');
    }

    // Identity
    if (context.identity) {
      formatted.identity = context.identity;
    }

    // Memories
    if (context.memories?.length) {
      formatted.recall = context.memories
        .map((m: any) => `📌 ${m.topic}: ${m.summary}`)
        .join('\n');
    }

    // Articles
    if (context.articles?.length) {
      // Use conversational format if available
      formatted.reading = context.articles
        .map((a: any) => {
          if (a.conversational) return a.conversational;
          return `[${a.category}] ${a.title}${a.rating ? ` ⭐${a.rating}` : ''}`;
        })
        .join('\n');
    }

    // Emotional (if present)
    if (context.emotional) {
      formatted.mood = `Feeling: ${context.emotional.state} (${context.emotional.intensity}/10)`;
    }

    // Past decisions (if present)
    if (context.pastDecisions?.length) {
      formatted.patterns = `Past choices: ${context.pastDecisions
        .map((d: any) => d.chosenOption)
        .filter(Boolean)
        .join(', ')}`;
    }

    // Weekly summary (if present)
    if (context.weeklySummary) {
      formatted.week = `Last week: ${context.weeklySummary.focus}`;
    }

    return formatted;
  }
}