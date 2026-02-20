// interfaces/intent.types.ts
export enum IntentType {
  GREETING = 'GREETING',
  FAREWELL = 'FAREWELL',
  GRATITUDE = 'GRATITUDE',
  
  // Goal Related
  GOAL_DISCUSSION = 'GOAL_DISCUSSION',
  GOAL_UPDATE = 'GOAL_UPDATE',
  GOAL_STALLED = 'GOAL_STALLED',
  
  // Emotional
  EMOTIONAL_SUPPORT = 'EMOTIONAL_SUPPORT',
  STRESS_EXPRESSION = 'STRESS_EXPRESSION',
  MOTIVATION_SEEKING = 'MOTIVATION_SEEKING',
  
  // Decision
  DECISION_HELP = 'DECISION_HELP',
  OPTION_COMPARISON = 'OPTION_COMPARISON',
  
  // Content
  ARTICLE_RECOMMENDATION = 'ARTICLE_RECOMMENDATION',
  LEARNING_PATH = 'LEARNING_PATH',
  CONTENT_CLARIFICATION = 'CONTENT_CLARIFICATION',
  
  // Career
  CAREER_ADVICE = 'CAREER_ADVICE',
  RESUME_FEEDBACK = 'RESUME_FEEDBACK',
  INTERVIEW_PREP = 'INTERVIEW_PREP',
  
  // Brain
  BRAIN_STORM = 'BRAIN_STORM',
  IDEA_CAPTURE = 'IDEA_CAPTURE',
  PROJECT_PLANNING = 'PROJECT_PLANNING',
  
  // Identity
  IDENTITY_EXPLORATION = 'IDENTITY_EXPLORATION',
  VALUE_CLARIFICATION = 'VALUE_CLARIFICATION',
  
  // Future
  SIMULATION_REQUEST = 'SIMULATION_REQUEST',
  PATH_COMPARISON = 'PATH_COMPARISON',
  
  // Weekly Review
  WEEKLY_REVIEW = 'WEEKLY_REVIEW',
  
  // General
  GENERAL_QUESTION = 'GENERAL_QUESTION',
  SMALL_TALK = 'SMALL_TALK',
  UNKNOWN = 'UNKNOWN'
}

export interface IntentAnalysis {
  primary: IntentType;
  secondary: IntentType[];
  confidence: number;
  keywords: string[];
  requiresUrgency: boolean;
  emotionalTone: 'positive' | 'neutral' | 'negative' | 'urgent';
  suggestedContextKeys: string[];
  entities?: {
    topics?: string[];
    options?: string[];
    timeframes?: string[];
    categories?: string[];
  };
}

export interface ContextSelection {
  goals: boolean;
  identity: boolean;
  emotional: boolean;
  memories: boolean;
  articles: boolean;
  decisions: boolean;
  brainItems: boolean;
  weeklySummary: boolean;
  limit: {
    goals: number;
    memories: number;
    articles: number;
    emotional: number;
    decisions: number;
    brainItems: number;
    weeklySummary: number;
  };
}