import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/client/stores/auth';
import { t } from '@lingui/macro';
import { Conversation } from '../types/assistant';

interface PaginationData {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface ConversationAnalytics {
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

interface UseAssistantHistoryReturn {
  // State
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  analytics: ConversationAnalytics | null;
  pagination: PaginationData;
  
  // Basic CRUD
  fetchConversations: (params?: {
    filter?: 'all' | 'active' | 'archived' | 'deleted' | 'starred' | 'pinned';
    limit?: number;
    offset?: number;
    search?: string;
  }) => Promise<{ conversations: Conversation[]; pagination: PaginationData }>;
  
  fetchConversation: (conversationId: string) => Promise<Conversation>;
  fetchConversationMessages: (conversationId: string) => Promise<any[]>;
  getConversationStats: (conversationId: string) => Promise<any>;
  
  // Conversation Management
  clearConversation: (conversationId: string) => Promise<{ clearedMessages: number }>;
  deleteConversation: (conversationId: string, permanent?: boolean) => Promise<void>;
  restoreConversation: (conversationId: string) => Promise<void>;
  archiveConversation: (conversationId: string, archive?: boolean) => Promise<void>;
  starConversation: (conversationId: string, star: boolean) => Promise<void>;
  pinConversation: (conversationId: string, pin: boolean) => Promise<void>;
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>;
  
  // Trash Management
  fetchDeletedConversations: (limit?: number, offset?: number) => Promise<{ conversations: Conversation[]; total: number }>;
  emptyTrash: () => Promise<{ deletedCount: number }>;
  
  // Analytics
  fetchConversationAnalytics: (timeframe?: 'day' | 'week' | 'month' | 'year') => Promise<ConversationAnalytics>;
  
  // Export
  exportConversation: (conversationId: string, format?: 'json' | 'txt' | 'md') => Promise<{ data: string; filename: string; format: string }>;
}

export const useAssistantHistory = (): UseAssistantHistoryReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ConversationAnalytics | null>(null);


  // Define default pagination
  const defaultPagination = {
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  };

  // Initialize state with default
  const [pagination, setPagination] = useState<PaginationData>(defaultPagination);

  const user = useAuthStore((state) => state.user);
  const isLoggedIn = !!user;

  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    };
  }, []);

  // Fetch conversations with filtering - FIXED VERSION
const fetchConversations = useCallback(async (params?: {
  filter?: 'all' | 'active' | 'archived' | 'deleted' | 'starred' | 'pinned';
  limit?: number;
  offset?: number;
  search?: string;
}) => {
  if (!isLoggedIn) {
    setConversations([]);
    return { conversations: [], pagination: defaultPagination };
  }

  setIsLoading(true);
  setError(null);

  try {
    const queryParams = new URLSearchParams();
    if (params?.filter && params.filter !== 'all') queryParams.append('filter', params.filter);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.search) queryParams.append('search', params.search);

    const url = `/api/assistant/conversations${queryParams.toString() ? `?${queryParams}` : ''}`;
    
    console.log('📡 Fetching conversations:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '5';
        const waitTime = parseInt(retryAfter) * 1000;
        
        console.warn(`⏳ Rate limited, waiting ${retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Retry once
        return fetchConversations(params);
      }
      
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to fetch conversations: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('📡 Response data:', result);

    if (result?.success) {
      const formatted: Conversation[] = (result.data?.conversations || result.data || []).map((conv: any) => ({
        id: conv.id,
        title: conv.title || conv.mode || t`Conversation`,
        mode: conv.mode || 'GENERAL_ASSISTANT',
        messageCount: conv.messageCount || conv._count?.messages || 0,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt || conv.lastMessageAt || conv.createdAt,
        lastMessage: conv.lastMessageContent || conv.preview,
        isStarred: conv.isStarred || false,
        isPinned: conv.isPinned || false,
        isArchived: conv.isArchived || false,
        isDeleted: conv.isDeleted || false,
      }));

      // Sort by pinned first, then updatedAt
      formatted.sort((a, b) => {
        // Pinned conversations first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        // Then by updatedAt (most recent first)
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      setConversations(formatted);
      
      const paginationData = result.data?.pagination || {
        total: formatted.length,
        limit: params?.limit || 20,
        offset: params?.offset || 0,
        hasMore: false,
      };
      
      setPagination(paginationData);
      
      return {
        conversations: formatted,
        pagination: paginationData,
      };
    } else {
      throw new Error(result?.message || t`Failed to fetch conversations`);
    }
  } catch (err: any) {
    console.error('❌ Failed to fetch conversations:', err);
    setError(err.message || t`Failed to load chat history`);
    setConversations([]);
    throw err;
  } finally {
    setIsLoading(false);
  }
}, [isLoggedIn, getAuthHeaders]); // REMOVE 'pagination' from dependencies


  // Fetch single conversation
  const fetchConversation = useCallback(async (conversationId: string) => {
    if (!isLoggedIn) {
      throw new Error(t`User not authenticated`);
    }

    try {
      const response = await fetch(`/api/assistant/conversations/${conversationId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.statusText}`);
      }

      const result = await response.json();

      if (result?.success) {
        const conv = result.data;
        return {
          id: conv.id,
          title: conv.title || conv.mode || t`Conversation`,
          mode: conv.mode || 'GENERAL_ASSISTANT',
          messageCount: conv.messageCount || conv._count?.messages || 0,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt || conv.lastMessageAt || conv.createdAt,
          lastMessage: conv.lastMessageContent || conv.preview,
          isStarred: conv.isStarred || false,
          isPinned: conv.isPinned || false,
          isArchived: conv.isArchived || false,
          isDeleted: conv.isDeleted || false,
        } as Conversation;
      } else {
        throw new Error(result?.message || t`Failed to fetch conversation`);
      }
    } catch (err: any) {
      console.error('Failed to fetch conversation:', err);
      throw err;
    }
  }, [isLoggedIn, getAuthHeaders]);

  // Fetch conversation messages
  const fetchConversationMessages = useCallback(async (conversationId: string) => {
    if (!isLoggedIn) return [];

    try {
      const response = await fetch(`/api/assistant/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const result = await response.json();
      return result?.success ? result.data || [] : [];
    } catch (err: any) {
      console.error('Failed to fetch conversation messages:', err);
      throw err;
    }
  }, [isLoggedIn, getAuthHeaders]);

  // Clear conversation messages
  const clearConversation = useCallback(async (conversationId: string) => {
    if (!isLoggedIn) {
      throw new Error(t`User not authenticated`);
    }

    try {
      const response = await fetch(`/api/assistant/conversations/${conversationId}/clear`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ conversationId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to clear conversation: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result?.success) {
        // Update local state
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, messageCount: 0, lastMessage: undefined }
              : conv
          )
        );
        
        return result.data;
      } else {
        throw new Error(result?.message || t`Failed to clear conversation`);
      }
    } catch (err: any) {
      console.error('Failed to clear conversation:', err);
      throw err;
    }
  }, [isLoggedIn, getAuthHeaders]);

  // Delete conversation (soft or hard)
  const deleteConversation = useCallback(async (conversationId: string, permanent: boolean = false) => {
  if (!isLoggedIn) {
    throw new Error(t`User not authenticated`);
  }

  try {
    // CHANGE THIS URL:
    const response = await fetch(`/api/assistant/conversations/${conversationId}/delete`, {
      method: 'DELETE', // Keep as DELETE
      headers: getAuthHeaders(),
      body: JSON.stringify({ conversationId, permanent }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete conversation: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result?.success) {
      // Update local state
      if (permanent) {
        // Remove from state
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      } else {
        // Mark as deleted
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, isDeleted: true }
              : conv
          )
        );
      }
    } else {
      throw new Error(result?.message || t`Failed to delete conversation`);
    }
  } catch (err: any) {
    console.error('Failed to delete conversation:', err);
    throw err;
  }
}, [isLoggedIn, getAuthHeaders]);

  // Restore conversation from trash
  const restoreConversation = useCallback(async (conversationId: string) => {
    if (!isLoggedIn) {
      throw new Error(t`User not authenticated`);
    }

    try {
      const response = await fetch(`/api/assistant/conversations/${conversationId}/restore`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ conversationId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to restore conversation: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result?.success) {
        // Update local state
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, isDeleted: false }
              : conv
          )
        );
      } else {
        throw new Error(result?.message || t`Failed to restore conversation`);
      }
    } catch (err: any) {
      console.error('Failed to restore conversation:', err);
      throw err;
    }
  }, [isLoggedIn, getAuthHeaders]);

  // Archive/Unarchive conversation
  const archiveConversation = useCallback(async (conversationId: string, archive: boolean = true) => {
    if (!isLoggedIn) {
      throw new Error(t`User not authenticated`);
    }

    try {
      const response = await fetch(`/api/assistant/conversations/${conversationId}/archive`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ conversationId, archive }),
      });

      if (!response.ok) {
        throw new Error(`Failed to archive conversation: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result?.success) {
        // Update local state
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, isArchived: archive }
              : conv
          )
        );
      } else {
        throw new Error(result?.message || t`Failed to archive conversation`);
      }
    } catch (err: any) {
      console.error('Failed to archive conversation:', err);
      throw err;
    }
  }, [isLoggedIn, getAuthHeaders]);

  // Star/Unstar conversation
  const starConversation = useCallback(async (conversationId: string, star: boolean) => {
    if (!isLoggedIn) {
      throw new Error(t`User not authenticated`);
    }

    try {
      const response = await fetch(`/api/assistant/conversations/${conversationId}/star`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ conversationId, star }),
      });

      if (!response.ok) {
        throw new Error(`Failed to star conversation: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result?.success) {
        // Update local state
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, isStarred: star }
              : conv
          )
        );
      } else {
        throw new Error(result?.message || t`Failed to star conversation`);
      }
    } catch (err: any) {
      console.error('Failed to star conversation:', err);
      throw err;
    }
  }, [isLoggedIn, getAuthHeaders]);

  // Pin/Unpin conversation
  const pinConversation = useCallback(async (conversationId: string, pin: boolean) => {
    if (!isLoggedIn) {
      throw new Error(t`User not authenticated`);
    }

    try {
      const response = await fetch(`/api/assistant/conversations/${conversationId}/pin`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ conversationId, pin }),
      });

      if (!response.ok) {
        throw new Error(`Failed to pin conversation: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result?.success) {
        // Update local state
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, isPinned: pin }
              : conv
          )
        );
      } else {
        throw new Error(result?.message || t`Failed to pin conversation`);
      }
    } catch (err: any) {
      console.error('Failed to pin conversation:', err);
      throw err;
    }
  }, [isLoggedIn, getAuthHeaders]);

  // Update conversation title
  const updateConversationTitle = useCallback(async (conversationId: string, title: string) => {
    if (!isLoggedIn) {
      throw new Error(t`User not authenticated`);
    }

    if (!title.trim()) {
      throw new Error(t`Title cannot be empty`);
    }

    try {
      const response = await fetch(`/api/assistant/conversations/${conversationId}/title`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update title: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result?.success) {
        // Update local state
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, title: title.trim() }
              : conv
          )
        );
      } else {
        throw new Error(result?.message || t`Failed to update title`);
      }
    } catch (err: any) {
      console.error('Failed to update conversation title:', err);
      throw err;
    }
  }, [isLoggedIn, getAuthHeaders]);

  // Get deleted conversations (trash)
  const fetchDeletedConversations = useCallback(async (limit: number = 20, offset: number = 0) => {
    if (!isLoggedIn) {
      return { conversations: [], total: 0 };
    }

    try {
      const response = await fetch(`/api/assistant/conversations/trash?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch trash: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result?.success) {
        const formatted: Conversation[] = (result.data?.conversations || []).map((conv: any) => ({
          id: conv.id,
          title: conv.title || conv.mode || t`Conversation`,
          mode: conv.mode || 'GENERAL_ASSISTANT',
          messageCount: conv.messageCount || conv._count?.messages || 0,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt || conv.lastMessageAt || conv.createdAt,
          lastMessage: conv.lastMessageContent || conv.preview,
          isStarred: conv.isStarred || false,
          isPinned: conv.isPinned || false,
          isArchived: conv.isArchived || false,
          isDeleted: conv.isDeleted || true,
        }));

        return {
          conversations: formatted,
          total: result.data?.total || formatted.length,
        };
      } else {
        throw new Error(result?.message || t`Failed to fetch trash`);
      }
    } catch (err: any) {
      console.error('Failed to fetch deleted conversations:', err);
      throw err;
    }
  }, [isLoggedIn, getAuthHeaders]);

  // Empty trash
  const emptyTrash = useCallback(async () => {
    if (!isLoggedIn) {
      throw new Error(t`User not authenticated`);
    }

    try {
      const response = await fetch('/api/assistant/conversations/trash/empty', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ confirm: true }),
      });

      if (!response.ok) {
        throw new Error(`Failed to empty trash: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result?.success) {
        // Remove deleted conversations from local state
        setConversations(prev => prev.filter(conv => !conv.isDeleted));
        return result.data;
      } else {
        throw new Error(result?.message || t`Failed to empty trash`);
      }
    } catch (err: any) {
      console.error('Failed to empty trash:', err);
      throw err;
    }
  }, [isLoggedIn, getAuthHeaders]);

  // Get conversation analytics
  const fetchConversationAnalytics = useCallback(async (timeframe: 'day' | 'week' | 'month' | 'year' = 'month') => {
    if (!isLoggedIn) {
      throw new Error(t`User not authenticated`);
    }

    try {
      const response = await fetch(`/api/assistant/conversations/analytics?timeframe=${timeframe}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result?.success) {
        const analyticsData = result.data;
        setAnalytics(analyticsData);
        return analyticsData;
      } else {
        throw new Error(result?.message || t`Failed to fetch analytics`);
      }
    } catch (err: any) {
      console.error('Failed to fetch conversation analytics:', err);
      throw err;
    }
  }, [isLoggedIn, getAuthHeaders]);

  // Get conversation stats (keep original)
  const getConversationStats = useCallback(async (conversationId: string) => {
    if (!isLoggedIn) return null;

    try {
      const response = await fetch(`/api/assistant/conversations/${conversationId}/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get stats: ${response.statusText}`);
      }

      const result = await response.json();
      return result?.success ? result.data : null;
    } catch (err: any) {
      console.error('Failed to get conversation stats:', err);
      throw err;
    }
  }, [isLoggedIn, getAuthHeaders]);

  // Export conversation
  const exportConversation = useCallback(async (conversationId: string, format: 'json' | 'txt' | 'md' = 'json') => {
    if (!isLoggedIn) {
      throw new Error(t`User not authenticated`);
    }

    try {
      const response = await fetch(`/api/assistant/conversations/${conversationId}/export?format=${format}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to export conversation: ${response.statusText}`);
      }

      // Handle file download
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `conversation-${conversationId}.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return {
        data: await blob.text(),
        filename,
        format,
      };
    } catch (err: any) {
      console.error('Failed to export conversation:', err);
      throw err;
    }
  }, [isLoggedIn, getAuthHeaders]);

  // Load conversations on mount
  useEffect(() => {
    if (isLoggedIn) {
      fetchConversations();
    }
  }, [isLoggedIn, fetchConversations]);

  return {
    // State
    conversations,
    isLoading,
    error,
    analytics,
    pagination,
    
    // Basic CRUD
    fetchConversations,
    fetchConversation,
    fetchConversationMessages,
    getConversationStats,
    
    // Conversation Management
    clearConversation,
    deleteConversation,
    restoreConversation,
    archiveConversation,
    starConversation,
    pinConversation,
    updateConversationTitle,
    
    // Trash Management
    fetchDeletedConversations,
    emptyTrash,
    
    // Analytics
    fetchConversationAnalytics,
    
    // Export
    exportConversation,
  };
};