// frontend/src/types/conversation.ts
import { Conversation } from './assistant';

export interface ConversationListResponse {
  success: boolean;
  data: {
    conversations: Conversation[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
  message?: string;
  error?: string;
}

export interface ConversationAnalytics {
  summary: {
    totalConversations: number;
    activeConversations: number;
    archivedConversations: number;
    deletedConversations: number;
    totalMessages: number;
    avgMessagesPerConversation: number;
    mostUsedMode: string;
    modeUsageCount: number;
  };
  recentActivity: Conversation[];
  timeframe: string;
  generatedAt: string;
}