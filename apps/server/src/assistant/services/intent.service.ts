import { Injectable, Logger } from '@nestjs/common';
import { IntentType, IntentAnalysis, ContextSelection } from '../interfaces/intent.types';

@Injectable()
export class IntentService {
  private readonly logger = new Logger(IntentService.name);
  
  // Cache for intent patterns (loaded once)
  private readonly intentPatterns: Map<IntentType, RegExp[]> = new Map();
  private readonly intentKeywords: Map<IntentType, string[]> = new Map();
  
  // Service requirements per intent
  private readonly serviceRequirements: Record<IntentType, Partial<ContextSelection>> = {
    // Basic intents - minimal context
    [IntentType.GREETING]: { goals: false, identity: false, emotional: false, memories: false, articles: false, decisions: false, brainItems: false, weeklySummary: false },
    [IntentType.FAREWELL]: { goals: false, identity: false, emotional: false, memories: false, articles: false, decisions: false, brainItems: false, weeklySummary: false },
    [IntentType.GRATITUDE]: { goals: false, identity: false, emotional: false, memories: false, articles: false, decisions: false, brainItems: false, weeklySummary: false },
    [IntentType.SMALL_TALK]: { goals: false, identity: false, emotional: false, memories: false, articles: false, decisions: false, brainItems: false, weeklySummary: false },
    
    // Goal intents - need goals, memories
    [IntentType.GOAL_DISCUSSION]: { goals: true, identity: true, memories: true, emotional: false, articles: false, decisions: false, brainItems: false, weeklySummary: false },
    [IntentType.GOAL_UPDATE]: { goals: true, identity: false, memories: true, emotional: false, articles: false, decisions: false, brainItems: false, weeklySummary: false },
    [IntentType.GOAL_STALLED]: { goals: true, identity: false, memories: true, emotional: true, articles: false, decisions: false, brainItems: false, weeklySummary: false },
    
    // Emotional intents - need emotional, memories
    [IntentType.EMOTIONAL_SUPPORT]: { goals: false, identity: true, emotional: true, memories: true, articles: false, decisions: false, brainItems: false, weeklySummary: false },
    [IntentType.STRESS_EXPRESSION]: { goals: false, identity: false, emotional: true, memories: true, articles: false, decisions: false, brainItems: false, weeklySummary: false },
    [IntentType.MOTIVATION_SEEKING]: { goals: true, identity: true, emotional: true, memories: true, articles: true, decisions: false, brainItems: false, weeklySummary: false },
    
    // Decision intents - need decisions, goals, identity
    [IntentType.DECISION_HELP]: { goals: true, identity: true, emotional: false, memories: true, articles: false, decisions: true, brainItems: false, weeklySummary: false },
    [IntentType.OPTION_COMPARISON]: { goals: true, identity: true, emotional: false, memories: true, articles: false, decisions: true, brainItems: false, weeklySummary: false },
    
    // Content intents - need articles, memories
    [IntentType.ARTICLE_RECOMMENDATION]: { goals: true, identity: true, emotional: false, memories: true, articles: true, decisions: false, brainItems: false, weeklySummary: false },
    [IntentType.LEARNING_PATH]: { goals: true, identity: true, emotional: false, memories: true, articles: true, decisions: false, brainItems: false, weeklySummary: false },
    [IntentType.CONTENT_CLARIFICATION]: { goals: false, identity: false, emotional: false, memories: true, articles: true, decisions: false, brainItems: false, weeklySummary: false },
    
    // Career intents - need identity, goals, memories
    [IntentType.CAREER_ADVICE]: { goals: true, identity: true, emotional: false, memories: true, articles: true, decisions: false, brainItems: false, weeklySummary: false },
    [IntentType.RESUME_FEEDBACK]: { goals: true, identity: true, emotional: false, memories: true, articles: true, decisions: false, brainItems: false, weeklySummary: false },
    [IntentType.INTERVIEW_PREP]: { goals: true, identity: true, emotional: false, memories: true, articles: true, decisions: false, brainItems: false, weeklySummary: false },
    
    // Brain intents - need brainItems, memories
    [IntentType.BRAIN_STORM]: { goals: false, identity: false, emotional: false, memories: true, articles: false, decisions: false, brainItems: true, weeklySummary: false },
    [IntentType.IDEA_CAPTURE]: { goals: false, identity: false, emotional: false, memories: true, articles: false, decisions: false, brainItems: true, weeklySummary: false },
    [IntentType.PROJECT_PLANNING]: { goals: true, identity: false, emotional: false, memories: true, articles: false, decisions: false, brainItems: true, weeklySummary: false },
    
    // Identity intents - need identity, memories
    [IntentType.IDENTITY_EXPLORATION]: { goals: true, identity: true, emotional: false, memories: true, articles: false, decisions: false, brainItems: false, weeklySummary: false },
    [IntentType.VALUE_CLARIFICATION]: { goals: true, identity: true, emotional: false, memories: true, articles: false, decisions: false, brainItems: false, weeklySummary: false },
    
    // Future intents - need goals, identity, memories
    [IntentType.SIMULATION_REQUEST]: { goals: true, identity: true, emotional: false, memories: true, articles: false, decisions: false, brainItems: false, weeklySummary: false },
    [IntentType.PATH_COMPARISON]: { goals: true, identity: true, emotional: false, memories: true, articles: false, decisions: false, brainItems: false, weeklySummary: false },
    
    // Weekly review
    [IntentType.WEEKLY_REVIEW]: { goals: true, identity: false, emotional: true, memories: true, articles: false, decisions: false, brainItems: false, weeklySummary: true },
    
    // Default
    [IntentType.GENERAL_QUESTION]: { goals: false, identity: false, emotional: false, memories: true, articles: true, decisions: false, brainItems: false, weeklySummary: false },
    [IntentType.UNKNOWN]: { goals: false, identity: false, emotional: false, memories: false, articles: false, decisions: false, brainItems: false, weeklySummary: false },
  };

  // Default limits per intent type
  private readonly intentLimits: Record<string, ContextSelection['limit']> = {
    default: { goals: 2, memories: 3, articles: 3, emotional: 1, decisions: 3, brainItems: 2, weeklySummary: 1 },
    urgent: { goals: 1, memories: 2, articles: 2, emotional: 1, decisions: 2, brainItems: 1, weeklySummary: 1 },
    deep: { goals: 3, memories: 5, articles: 5, emotional: 2, decisions: 5, brainItems: 3, weeklySummary: 1 },
  };

  constructor() {
    this.initializePatterns();
  }

  /**
   * Initialize regex patterns for intent detection
   */
  private initializePatterns(): void {
    // GREETING
    this.intentPatterns.set(IntentType.GREETING, [
      /^(hi|hello|hey|howdy|greetings|good morning|good afternoon|good evening)/i,
      /^what'?s up/i,
      /^sup$/i,
    ]);
    this.intentKeywords.set(IntentType.GREETING, ['hi', 'hello', 'hey', 'morning', 'afternoon', 'evening']);

    // FAREWELL
    this.intentPatterns.set(IntentType.FAREWELL, [
      /^(bye|goodbye|see you|talk later|catch you later|take care)/i,
      /^(have a good (day|night|weekend))/i,
      /^cya$/i,
      /^later$/i,
    ]);
    this.intentKeywords.set(IntentType.FAREWELL, ['bye', 'goodbye', 'later', 'care']);

    // GRATITUDE
    this.intentPatterns.set(IntentType.GRATITUDE, [
      /^(thanks|thank you|appreciate it|that helps|good advice)/i,
      /^you'?re (the best|amazing|helpful)/i,
    ]);
    this.intentKeywords.set(IntentType.GRATITUDE, ['thanks', 'thank', 'appreciate', 'helpful']);

    // GOAL DISCUSSION
    this.intentPatterns.set(IntentType.GOAL_DISCUSSION, [
      /\b(goal|want to|plan to|aim to|trying to|working on)\b/i,
      /\b(achieve|accomplish|make progress|get better at)\b/i,
      /\b(how (can|do) I (learn|become|get|improve))\b/i,
    ]);
    this.intentKeywords.set(IntentType.GOAL_DISCUSSION, ['goal', 'want', 'plan', 'achieve', 'progress', 'improve']);

    // GOAL STALLED
    this.intentPatterns.set(IntentType.GOAL_STALLED, [
      /\b(stuck|can't progress|not making progress|falling behind)\b/i,
      /\b(lost motivation|procrastinating|not started|haven't started)\b/i,
      /\b(struggling with|difficulty|hard to)\b.*\b(goal|task|project)\b/i,
    ]);
    this.intentKeywords.set(IntentType.GOAL_STALLED, ['stuck', 'progress', 'motivation', 'procrastinate', 'struggling']);

    // EMOTIONAL SUPPORT
    this.intentPatterns.set(IntentType.EMOTIONAL_SUPPORT, [
      /\b(feel|feeling)\b.*\b(overwhelmed|stressed|anxious|burned out|tired)\b/i,
      /\b(having a hard time|struggling|difficult week|rough day)\b/i,
      /\b(not okay|not good|need support|need help)\b/i,
    ]);
    this.intentKeywords.set(IntentType.EMOTIONAL_SUPPORT, ['feel', 'overwhelmed', 'stressed', 'anxious', 'struggling']);

    // STRESS EXPRESSION
    this.intentPatterns.set(IntentType.STRESS_EXPRESSION, [
      /\b(stressed?|stress(ed|ing)|pressure|too much|can't handle)\b/i,
      /\b(overwhelmed|drowning|burnt out|burnout)\b/i,
    ]);
    this.intentKeywords.set(IntentType.STRESS_EXPRESSION, ['stress', 'pressure', 'overwhelm', 'burnout']);

    // MOTIVATION SEEKING
    this.intentPatterns.set(IntentType.MOTIVATION_SEEKING, [
      /\b(motivation|motivated|inspired|inspire)\b/i,
      /\b(how to stay|keep going|keep at it)\b/i,
      /\b(lost (motivation|inspiration|drive))\b/i,
    ]);
    this.intentKeywords.set(IntentType.MOTIVATION_SEEKING, ['motivation', 'inspired', 'drive', 'keep going']);

    // DECISION HELP
    this.intentPatterns.set(IntentType.DECISION_HELP, [
      /\b(decide between|choice between|option [12]|option a|option b)\b/i,
      /\b(should I (do|take|choose|pick|go with))\b/i,
      /\b(pros and cons|weighing|considering|thinking about)\b/i,
      /\b(which is better|what'?s better|compare)\b/i,
    ]);
    this.intentKeywords.set(IntentType.DECISION_HELP, ['decide', 'choice', 'option', 'pros', 'cons', 'compare']);

    // OPTION COMPARISON
    this.intentPatterns.set(IntentType.OPTION_COMPARISON, [
      /\b(compare|versus|vs)\b.*\b(and|or)\b/i,
      /\b(difference between)\b.*\b(and)\b/i,
      /\b(which one (is better|should I choose))\b/i,
    ]);
    this.intentKeywords.set(IntentType.OPTION_COMPARISON, ['compare', 'versus', 'vs', 'difference']);

    // ARTICLE RECOMMENDATION
    this.intentPatterns.set(IntentType.ARTICLE_RECOMMENDATION, [
      /\b(article|read|reading)\b.*\b(recommend|suggest|good|best|helpful)\b/i,
      /\b(what should I (read|learn|study))\b/i,
      /\b(any (articles|content) (on|about))\b/i,
      /\b(recommend me|suggest me)\b.*\b(article|post|content)\b/i,
    ]);
    this.intentKeywords.set(IntentType.ARTICLE_RECOMMENDATION, ['article', 'read', 'recommend', 'suggest', 'content']);

    // LEARNING PATH
    this.intentPatterns.set(IntentType.LEARNING_PATH, [
      /\b(learning path|roadmap|curriculum|what to learn next)\b/i,
      /\b(how to become (a|an) (developer|designer|engineer|expert))\b/i,
      /\b(path to|steps to|guide to)\b.*\b(learning|mastering)\b/i,
    ]);
    this.intentKeywords.set(IntentType.LEARNING_PATH, ['learning path', 'roadmap', 'become', 'steps']);

    // CAREER ADVICE
    this.intentPatterns.set(IntentType.CAREER_ADVICE, [
      /\b(career|job|position|role|interview|promotion)\b/i,
      /\b(resume|CV|cover letter|application)\b/i,
      /\b(salary|negotiate|offer)\b/i,
      /\b(career change|switch careers|new field)\b/i,
    ]);
    this.intentKeywords.set(IntentType.CAREER_ADVICE, ['career', 'job', 'resume', 'interview', 'promotion']);

    // BRAIN STORM
    this.intentPatterns.set(IntentType.BRAIN_STORM, [
      /\b(idea|ideas|brainstorm|thinking about)\b/i,
      /\b(what if|imagine|consider this)\b/i,
      /\b(creative|innovative|new way to)\b/i,
    ]);
    this.intentKeywords.set(IntentType.BRAIN_STORM, ['idea', 'brainstorm', 'creative', 'imagine']);

    // IDEA CAPTURE
    this.intentPatterns.set(IntentType.IDEA_CAPTURE, [
      /\b(just had an idea|got an idea|thought occurred|random thought)\b/i,
      /\b(write this down|note to self|remember this)\b/i,
    ]);
    this.intentKeywords.set(IntentType.IDEA_CAPTURE, ['idea', 'thought', 'note']);

    // IDENTITY EXPLORATION
    this.intentPatterns.set(IntentType.IDENTITY_EXPLORATION, [
      /\b(who am I|what am I|my identity|sense of self)\b/i,
      /\b(values|beliefs|principles|what matters to me)\b/i,
      /\b(purpose|meaning|direction in life)\b/i,
      /\b(version of myself|the person I want to be)\b/i,
    ]);
    this.intentKeywords.set(IntentType.IDENTITY_EXPLORATION, ['identity', 'values', 'purpose', 'meaning']);

    // SIMULATION REQUEST
    this.intentPatterns.set(IntentType.SIMULATION_REQUEST, [
      /\b(what if|simulate|imagine)\b.*\b(6 months|year|future)\b/i,
      /\b(where will I be if|what happens if I)\b/i,
      /\b(predict|forecast|project)\b.*\b(path|learning|career)\b/i,
    ]);
    this.intentKeywords.set(IntentType.SIMULATION_REQUEST, ['simulate', 'predict', 'future', 'what if']);

    // WEEKLY REVIEW
    this.intentPatterns.set(IntentType.WEEKLY_REVIEW, [
      /\b(weekly review|weekly summary|how was my week|week in review)\b/i,
      /\b(how did I do this week|show me my week)\b/i,
      /\b(what happened this week|week recap)\b/i,
    ]);
    this.intentKeywords.set(IntentType.WEEKLY_REVIEW, ['weekly', 'review', 'summary', 'recap', 'week']);

    // GENERAL QUESTION
    this.intentPatterns.set(IntentType.GENERAL_QUESTION, [
      /\?$/,
      /\b(what|why|how|when|where|who)\b.*\?/i,
    ]);
    this.intentKeywords.set(IntentType.GENERAL_QUESTION, ['what', 'why', 'how', 'when', 'where', 'who']);

    // SMALL TALK
    this.intentPatterns.set(IntentType.SMALL_TALK, [
      /\b(how are you|how'?s it going|what'?s up|what'?s new)\b/i,
      /\b(nice weather|beautiful day|how'?s your day)\b/i,
    ]);
    this.intentKeywords.set(IntentType.SMALL_TALK, ['how are you', 'going', 'weather']);
  }

  /**
   * Main method: Detect intent from user message - PURELY PATTERN-BASED
   */
  async detectIntent(
    message: string,
    history: any[] = [],
    userId?: string
  ): Promise<IntentAnalysis> {
    const normalized = message.toLowerCase().trim();
    
    // Quick check for empty/very short messages
    if (normalized.length < 2) {
      return this.createBasicIntent(IntentType.GREETING, ['empty'], 1.0);
    }

    // Pattern-based detection only - NO AI CALLS
    const result = this.detectByPatterns(normalized);
    
    // Apply conversation context
    return this.applyConversationContext(result, history);
  }

  /**
   * Fast pattern-based intent detection
   */
  private detectByPatterns(message: string): IntentAnalysis {
    const scores = new Map<IntentType, { score: number; keywords: string[] }>();
    
    // Check each intent's patterns
    for (const [intent, patterns] of this.intentPatterns.entries()) {
      const matches: string[] = [];
      let matchCount = 0;
      
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          matchCount++;
          const match = message.match(pattern);
          if (match) {
            matches.push(match[0]);
          }
        }
      }
      
      if (matchCount > 0) {
        const confidence = matchCount / patterns.length;
        scores.set(intent, {
          score: confidence,
          keywords: matches.slice(0, 3)
        });
      }
    }

    // Check keyword-based detection (fallback)
    if (scores.size === 0) {
      for (const [intent, keywords] of this.intentKeywords.entries()) {
        const matches = keywords.filter(k => message.includes(k.toLowerCase()));
        if (matches.length > 0) {
          const confidence = matches.length / keywords.length * 0.7;
          scores.set(intent, {
            score: confidence,
            keywords: matches
          });
        }
      }
    }

    // No matches - classify
    if (scores.size === 0) {
      if (message.includes('?')) {
        return this.createBasicIntent(IntentType.GENERAL_QUESTION, ['question'], 0.5);
      }
      return this.createBasicIntent(IntentType.UNKNOWN, [], 0.3);
    }

    // Get top intents
    const sorted = Array.from(scores.entries())
      .sort((a, b) => b[1].score - a[1].score);

    const primary = sorted[0];
    const secondary = sorted.slice(1, 3).map(([type]) => type);

    // Detect emotional tone
    const emotionalTone = this.detectEmotionalTone(message);
    
    // Detect urgency
    const requiresUrgency = this.detectUrgency(message);

    return {
      primary: primary[0],
      secondary,
      confidence: primary[1].score,
      keywords: primary[1].keywords,
      requiresUrgency,
      emotionalTone,
      suggestedContextKeys: this.getContextKeys(primary[0])
    };
  }

  /**
   * Apply conversation context to refine intent
   */
  private applyConversationContext(intent: IntentAnalysis, history: any[]): IntentAnalysis {
    if (history.length === 0) return intent;

    // Get last 2 messages
    const recent = history.slice(-2);
    
    // Check if same intent appears multiple times
    const intentCount = history.filter((h: any) => 
      h.role === 'user' && h.intent === intent.primary
    ).length;

    // Boost confidence if pattern continues
    if (intentCount > 1) {
      intent.confidence = Math.min(1, intent.confidence + 0.1);
    }

    return intent;
  }

  /**
   * Create basic intent (for fallbacks)
   */
  private createBasicIntent(
    primary: IntentType,
    keywords: string[],
    confidence: number
  ): IntentAnalysis {
    return {
      primary,
      secondary: [],
      confidence,
      keywords,
      requiresUrgency: false,
      emotionalTone: 'neutral',
      suggestedContextKeys: this.getContextKeys(primary)
    };
  }

  /**
   * Detect emotional tone from message
   */
  private detectEmotionalTone(message: string): 'positive' | 'neutral' | 'negative' | 'urgent' {
    const positive = /\b(great|good|happy|excited|love|awesome|thank|thanks|appreciate)\b/i;
    const negative = /\b(bad|sad|upset|angry|frustrated|stuck|struggling|hard|difficult)\b/i;
    const urgent = /\b(urgent|asap|quick|immediately|right now|help|emergency)\b/i;
    
    if (urgent.test(message)) return 'urgent';
    if (positive.test(message)) return 'positive';
    if (negative.test(message)) return 'negative';
    return 'neutral';
  }

  /**
   * Detect urgency in message
   */
  private detectUrgency(message: string): boolean {
    const urgent = /\b(urgent|asap|quick|immediately|right now|help|emergency)\b/i;
    return urgent.test(message);
  }

  /**
   * Get context keys for an intent
   */
  private getContextKeys(intent: IntentType): string[] {
    const requirement = this.serviceRequirements[intent] || this.serviceRequirements[IntentType.UNKNOWN];
    return Object.entries(requirement)
      .filter(([_, value]) => value === true)
      .map(([key]) => key);
  }

  /**
   * Get context selection for an intent
   */
  getContextSelection(intent: IntentAnalysis): ContextSelection {
    const requirements = this.serviceRequirements[intent.primary] || this.serviceRequirements[IntentType.UNKNOWN];
    
    const limitType = intent.requiresUrgency ? 'urgent' : 
                      (intent.confidence > 0.8 ? 'deep' : 'default');
    const limits = this.intentLimits[limitType] || this.intentLimits.default;

    return {
      goals: requirements.goals || false,
      identity: requirements.identity || false,
      emotional: requirements.emotional || false,
      memories: requirements.memories || false,
      articles: requirements.articles || false,
      decisions: requirements.decisions || false,
      brainItems: requirements.brainItems || false,
      weeklySummary: requirements.weeklySummary || false,
      limit: {
        goals: limits.goals,
        memories: limits.memories,
        articles: limits.articles,
        emotional: limits.emotional,
        decisions: limits.decisions,
        brainItems: limits.brainItems,
        weeklySummary: limits.weeklySummary
      }
    };
  }

  /**
   * Get required services for intent
   */
  getRequiredServices(intent: IntentType): string[] {
    const selection = this.serviceRequirements[intent] || this.serviceRequirements[IntentType.UNKNOWN];
    return Object.entries(selection)
      .filter(([_, value]) => value === true)
      .map(([key]) => key);
  }
}