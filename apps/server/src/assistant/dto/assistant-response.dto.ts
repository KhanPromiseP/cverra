export interface ReferencedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  accessType: 'FREE' | 'PREMIUM';
  relevance: number;
}

export interface ReferencedContent {
  type: 'ARTICLE' | 'RESUME' | 'COVER_LETTER';
  id: string;
  title: string;
  relevance: number;
}

export interface AssistantResponseDto {
  content: string;
  conversationId: string;
  messageId: string;
  mode: string;
  
  // Context awareness
  referencedArticles?: ReferencedArticle[];
  referencedContent?: ReferencedContent[];
  
  // Memory creation
  memoryCreated?: boolean;
  memoryId?: string;
  memorySummary?: string;
  
  // User tier info
  userTier: 'FREE' | 'PREMIUM' | 'ADMIN';
  
  // Features available to user
  features: {
    unlimitedMessages: boolean;
    advancedMemory: boolean;
    priorityProcessing: boolean;
    customModels: boolean;
    maxTokens: number;
    contextSize: number;
  };
  
  // Metrics
  tokensUsed: number;
  responseTime: number;
  
  // Rate limiting info
  rateLimit?: {
    remaining: number;
    reset: number;
    limit: number;
  };
  
  // AI model info
  model?: string;
  
  // Suggestions for follow-up
  suggestions?: string[];
  
  // Timestamps
  timestamp: string;
}

// For streaming responses
export interface AssistantStreamResponseDto {
  event: 'start' | 'chunk' | 'complete' | 'error';
  data?: any;
  chunk?: string;
  index?: number;
  total?: number;
  messageId?: string;
  conversationId?: string;
  error?: string;
}