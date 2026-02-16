import { useState, useCallback } from 'react';
import conversationService from '../services/conversationService';
import { Conversation } from '../types/assistant';
import { ConversationListResponse, ConversationAnalytics } from '../types/conversation';

interface UseConversationsReturn {
  // State
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  analytics: ConversationAnalytics | null;
  
  // Conversation management
  loadConversations: (params?: any) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  clearConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string, permanent?: boolean) => Promise<void>;
  restoreConversation: (id: string) => Promise<void>;
  archiveConversation: (id: string, archive?: boolean) => Promise<void>;
  starConversation: (id: string, star: boolean) => Promise<void>;
  pinConversation: (id: string, pin: boolean) => Promise<void>;
  updateTitle: (id: string, title: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  loadAnalytics: (timeframe?: 'day' | 'week' | 'month' | 'year') => Promise<void>;
  exportConversation: (id: string, format?: 'json' | 'txt' | 'md') => Promise<{ filename: string; format: string }>;
  
  // Pagination
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  
  // Refresh
  refresh: () => Promise<void>;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ConversationAnalytics | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  const loadConversations = useCallback(async (params?: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await conversationService.getConversations(params);
      
      if (response.success) {
        setConversations(response.data.conversations);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to load conversations');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await conversationService.getConversation(id);
      
      if (response.success) {
        setCurrentConversation(response.data);
      } else {
        setError('Failed to load conversation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearConversation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await conversationService.clearConversation(id);
      
      if (response.success) {
        // Update local state
        setConversations(prev => prev.filter(conv => conv.id !== id));
        if (currentConversation?.id === id) {
          setCurrentConversation(null);
        }
      } else {
        setError('Failed to clear conversation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to clear conversation');
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation]);

  const deleteConversation = useCallback(async (id: string, permanent: boolean = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await conversationService.deleteConversation(id, permanent);
      
      if (response.success) {
        if (permanent) {
          // Remove from state
          setConversations(prev => prev.filter(conv => conv.id !== id));
          if (currentConversation?.id === id) {
            setCurrentConversation(null);
          }
        } else {
          // Mark as deleted in state
          setConversations(prev => prev.map(conv => 
            conv.id === id ? { ...conv, isDeleted: true } : conv
          ));
        }
      } else {
        setError('Failed to delete conversation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete conversation');
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation]);

  const restoreConversation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await conversationService.restoreConversation(id);
      
      if (response.success) {
        // Update in state
        setConversations(prev => prev.map(conv => 
          conv.id === id ? { ...conv, isDeleted: false } : conv
        ));
      } else {
        setError('Failed to restore conversation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to restore conversation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const archiveConversation = useCallback(async (id: string, archive: boolean = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await conversationService.archiveConversation(id, archive);
      
      if (response.success) {
        // Update in state
        setConversations(prev => prev.map(conv => 
          conv.id === id ? { ...conv, isArchived: archive } : conv
        ));
      } else {
        setError('Failed to archive conversation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to archive conversation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const starConversation = useCallback(async (id: string, star: boolean) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await conversationService.starConversation(id, star);
      
      if (response.success) {
        // Update in state
        setConversations(prev => prev.map(conv => 
          conv.id === id ? { ...conv, isStarred: star } : conv
        ));
        
        if (currentConversation?.id === id) {
          setCurrentConversation(prev => prev ? { ...prev, isStarred: star } : null);
        }
      } else {
        setError('Failed to star conversation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to star conversation');
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation]);

  const pinConversation = useCallback(async (id: string, pin: boolean) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await conversationService.pinConversation(id, pin);
      
      if (response.success) {
        // Update in state
        setConversations(prev => prev.map(conv => 
          conv.id === id ? { ...conv, isPinned: pin } : conv
        ));
        
        if (currentConversation?.id === id) {
          setCurrentConversation(prev => prev ? { ...prev, isPinned: pin } : null);
        }
      } else {
        setError('Failed to pin conversation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to pin conversation');
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation]);

  const updateTitle = useCallback(async (id: string, title: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await conversationService.updateConversationTitle(id, title);
      
      if (response.success) {
        // Update in state
        setConversations(prev => prev.map(conv => 
          conv.id === id ? { ...conv, title } : conv
        ));
        
        if (currentConversation?.id === id) {
          setCurrentConversation(prev => prev ? { ...prev, title } : null);
        }
      } else {
        setError('Failed to update title');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update title');
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation]);

  const emptyTrash = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await conversationService.emptyTrash();
      
      if (response.success) {
        // Remove deleted conversations from state
        setConversations(prev => prev.filter(conv => !conv.isDeleted));
      } else {
        setError('Failed to empty trash');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to empty trash');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async (timeframe: 'day' | 'week' | 'month' | 'year' = 'month') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await conversationService.getAnalytics(timeframe);
      
      if (response.success) {
        setAnalytics(response.data);
      } else {
        setError('Failed to load analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportConversation = useCallback(async (id: string, format: 'json' | 'txt' | 'md' = 'json') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await conversationService.exportConversation(id, format);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to export conversation');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadConversations({
      limit: pagination.limit,
      offset: 0,
    });
  }, [loadConversations, pagination.limit]);

  return {
    // State
    conversations,
    currentConversation,
    isLoading,
    error,
    analytics,
    
    // Methods
    loadConversations,
    loadConversation,
    clearConversation,
    deleteConversation,
    restoreConversation,
    archiveConversation,
    starConversation,
    pinConversation,
    updateTitle,
    emptyTrash,
    loadAnalytics,
    exportConversation,
    
    // Pagination
    pagination,
    
    // Refresh
    refresh,
  };
}