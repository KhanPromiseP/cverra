// hooks/useAssistant.tsx - CORRECTED WITH PROPER TYPES
import { useState, useCallback, useEffect, useRef } from 'react';
import { AssistantMessage, AssistantMode } from '../types/assistant';
import { useAuthStore } from '@/client/stores/auth';
import { t, Trans } from '@lingui/macro';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

// Define API response types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number;
}

interface AssistantResponse {
  content: string;
  conversationId?: string;
  messageId?: string;
  mode?: AssistantMode;
  tokensUsed?: number;
  responseTime?: number;
  userTier?: 'FREE' | 'PREMIUM' | 'ADMIN';
  memoryCreated?: boolean;
  memoryId?: string;
  features?: any;
  model?: string;
  timestamp?: string;
  rateLimitInfo?: {
    remaining: number;
    limit: number;
    resetTime: string;
  };
  referencedArticles?: any[];
  limitExceeded?: boolean;
  upgradeLink?: string;
  remainingMessages?: number;
  limit?: number;
  resetTime?: string;
}

interface RateLimitErrorData {
  message?: string;
  upgradeLink?: string;
  remainingMessages?: number;
  limit?: number;
  resetTime?: string;
  error?: string;
  statusCode?: number;
}

// FIXED: Added undefined as union type for resetTime
interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetTime?: string; // Changed to optional
}

interface UserInfoResponse {
  userId: string;
  userTier: 'FREE' | 'PREMIUM' | 'ADMIN';
  features: any;
  rateLimitInfo?: RateLimitInfo; // Use the fixed type
  analytics?: {
    dailyUsage: number;
  };
  timestamp: string;
}

export const useAssistant = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AssistantMode>('GENERAL_ASSISTANT');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<'FREE' | 'PREMIUM' | 'ADMIN'>('FREE');
  const [hasLoadedLastChat, setHasLoadedLastChat] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    limit: number;
    resetTime: Date | null;
  } | null>(null);
  
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = !!user;
  const isInitialMount = useRef(true);

  // Generate auth headers
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const token = localStorage.getItem('token') || 
                  sessionStorage.getItem('token') || 
                  (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || '');
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }, []);

  // Fetch user info with rate limit
  const fetchUserInfo = useCallback(async (): Promise<UserInfoResponse | null> => {
    if (!isLoggedIn) {
      // Return default for non-logged in users
      const defaultResponse: UserInfoResponse = {
        userId: '',
        userTier: 'FREE',
        features: {},
        rateLimitInfo: {
          remaining: 10,
          limit: 10,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
      return defaultResponse;
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/assistant/user-info', {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const userInfo = result.data as UserInfoResponse;
          
          // Update state
          setUserTier(userInfo.userTier);
          localStorage.setItem('assistantUserTier', userInfo.userTier);

          // Update rate limit info if provided
          if (userInfo.rateLimitInfo) {
            const rateLimitData = {
              remaining: userInfo.rateLimitInfo.remaining || 0,
              limit: userInfo.rateLimitInfo.limit || 10,
              resetTime: userInfo.rateLimitInfo.resetTime 
                ? new Date(userInfo.rateLimitInfo.resetTime) 
                : null,
            };
            setRateLimitInfo(rateLimitData);
            
            // Save to localStorage
            localStorage.setItem('assistantRateLimit', JSON.stringify({
              ...rateLimitData,
              lastUpdated: new Date().toISOString(),
              userTier: userInfo.userTier,
            }));
          } else if (userInfo.userTier === 'FREE') {
            // Default for FREE users
            const defaultRateLimit = {
              remaining: 10,
              limit: 10,
              resetTime: null,
            };
            setRateLimitInfo(defaultRateLimit);
            localStorage.setItem('assistantRateLimit', JSON.stringify({
              ...defaultRateLimit,
              lastUpdated: new Date().toISOString(),
              userTier: 'FREE',
            }));
          } else {
            // Premium/Admin - no rate limits
            setRateLimitInfo(null);
            localStorage.removeItem('assistantRateLimit');
          }

          return userInfo;
        }
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }

    // Fallback: Use localStorage or defaults
    const savedTier = localStorage.getItem('assistantUserTier') as 'FREE' | 'PREMIUM' | 'ADMIN';
    const savedRateLimit = localStorage.getItem('assistantRateLimit');
    
    const defaultTier = savedTier || 'FREE';
    setUserTier(defaultTier);

    let defaultRateLimit = null;
    if (defaultTier === 'FREE') {
      if (savedRateLimit) {
        try {
          const parsed = JSON.parse(savedRateLimit);
          // Check if data is less than 1 hour old
          const lastUpdated = parsed.lastUpdated ? new Date(parsed.lastUpdated) : null;
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          
          if (!lastUpdated || lastUpdated > oneHourAgo) {
            defaultRateLimit = {
              remaining: parsed.remaining || 10,
              limit: parsed.limit || 10,
              resetTime: parsed.resetTime ? new Date(parsed.resetTime) : null,
            };
          }
        } catch (e) {
          console.error('Failed to parse saved rate limit:', e);
        }
      }
      
      if (!defaultRateLimit) {
        defaultRateLimit = {
          remaining: 10,
          limit: 10,
          resetTime: null,
        };
      }
      setRateLimitInfo(defaultRateLimit);
    } else {
      setRateLimitInfo(null);
    }

    // FIXED: Properly handle optional resetTime
    const fallbackResponse: UserInfoResponse = {
      userId: user?.id || '',
      userTier: defaultTier,
      features: {},
      rateLimitInfo: defaultRateLimit ? {
        remaining: defaultRateLimit.remaining,
        limit: defaultRateLimit.limit,
        resetTime: defaultRateLimit.resetTime?.toISOString(), // This is now optional
      } : undefined,
      timestamp: new Date().toISOString(),
    };
    
    return fallbackResponse;
  }, [isLoggedIn, getAuthHeaders, user?.id]);

   // Save state to localStorage
  const saveToLocalStorage = useCallback((
    msgs: AssistantMessage[], 
    convId: string | null, 
    tier: 'FREE' | 'PREMIUM' | 'ADMIN' = 'FREE'
  ) => {
    try {
      localStorage.setItem('assistantMessages', JSON.stringify(msgs));
      localStorage.setItem('assistantMode', mode);
      if (tier) {
        localStorage.setItem('assistantUserTier', tier);
      }
      if (convId) {
        localStorage.setItem('currentConversationId', convId);
      } else {
        localStorage.removeItem('currentConversationId');
      }
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }, [mode]);

  // Clear local storage helper
  const clearLocalStorage = () => {
    localStorage.removeItem('assistantMessages');
    localStorage.removeItem('assistantMode');
    localStorage.removeItem('currentConversationId');
    localStorage.removeItem('assistantUserTier');
    localStorage.removeItem('assistantRateLimit');
  };


  // Save state when messages change
  useEffect(() => {
    if (!isInitialMount.current) {
      saveToLocalStorage(messages, currentConversationId, userTier);
    }
  }, [messages, currentConversationId, userTier, saveToLocalStorage]);

 // Create rate limit message
const createRateLimitMessage = (errorData: RateLimitErrorData, userName?: string): AssistantMessage => {
  const resetTime = errorData.resetTime ? new Date(errorData.resetTime) : null;
  const upgradeLink = errorData.upgradeLink || '/dashboard/pricing';
  const remaining = errorData.remainingMessages || 0;
  const limit = errorData.limit || 10;
  
  // Get user's name from multiple possible sources
  let displayName = 'there';
  
  // Check if userName was passed directly
  if (userName) {
    displayName = userName;
  } 
  // Check user object from auth store
  else if (user) {
    // Try different possible name fields
    displayName = user.name || user.username || user.email?.split('@')[0] || 'there';
  }
  
  // Format reset time nicely - check if it's midnight
  let resetTimeText = 'tomorrow';
  if (resetTime) {
    const hours = resetTime.getHours();
    const minutes = resetTime.getMinutes();
    
    // Check if it's midnight (12:00 AM)
    if (hours === 0 && minutes === 0) {
      resetTimeText = 'at 12:00 AM';
    } else {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes.toString().padStart(2, '0');
      resetTimeText = `at ${formattedHours}:${formattedMinutes} ${ampm}`;
    }
  }
  
  return {
    id: `rate-limit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: 'assistant',
    content: `
Hello ${displayName},

You've reached your daily limit of ${limit} messages on Inlirah's Free plan. Your next message will be available ${resetTimeText}.

**Upgrade to Inlirah Premium** to continue chatting uninterrupted:

• **Unlimited messages** — no daily caps
• **Priority responses** for faster answers
• **Advanced memory** across all conversations
• **Priority support** when you need assistance

[**Upgrade to Premium →**](${upgradeLink})

I'll be here when you're ready to continue.

Best regards,
Your Inlirah Assistant`,
    timestamp: new Date(),
    metadata: {
      isRateLimitMessage: true,
      upgradeLink,
      remainingMessages: remaining,
      limit,
      resetTime: resetTime?.toISOString(),
      timestamp: new Date().toISOString(),
      userName: displayName,
    },
  };
};


 const startNewConversation = useCallback(async (newMode?: AssistantMode, forceCreate: boolean = false) => {
  // Only create in database if we have messages or forceCreate is true
  if (!isLoggedIn) return null;

  // Check if we actually need to create a conversation
  // Only create if we have messages or forceCreate is explicitly set
  if (messages.length === 0 && !forceCreate) {
    // Just use a local ID without hitting the API
    const localConvId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentConversationId(localConvId);
    setMode(newMode || mode);
    saveToLocalStorage([], localConvId, userTier);
    return localConvId;
  }

  // Only create in database if we have content or explicitly asked for it
  try {
    const headers = getAuthHeaders();
    const response = await fetch('/api/assistant/conversations', {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        mode: newMode || mode,
        title: `Conversation ${new Date().toLocaleDateString()}`,
      }),
    });

    if (response.ok) {
      const result = await response.json() as ApiResponse<{ id: string }>;
      
      if (result.success && result.data?.id) {
        const newConvId = result.data.id;
        setCurrentConversationId(newConvId);
        setMode(newMode || mode);
        saveToLocalStorage(messages, newConvId, userTier);
        return newConvId;
      }
    }
  } catch (err) {
    console.error('Failed to create conversation:', err);
    // Fallback to local
    const localConvId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentConversationId(localConvId);
    saveToLocalStorage(messages, localConvId, userTier);
    return localConvId;
  }
  return null;
}, [mode, isLoggedIn, getAuthHeaders, saveToLocalStorage, userTier, messages.length]);

  // Helper function to load conversation
  const handleLoadConversation = useCallback(async (conversation: any) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/assistant/conversations/${conversation.id}/messages`, {
        headers,
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const messages: AssistantMessage[] = result.data.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.createdAt || msg.updatedAt || Date.now()),
            metadata: msg.metadata || {},
          }));
          
          setCurrentConversationId(conversation.id);
          setMessages(messages);
          setMode(conversation.mode || 'GENERAL_ASSISTANT');
          
          // Save to localStorage
          saveToLocalStorage(messages, conversation.id, userTier);
          
          console.log('Loaded conversation with', messages.length, 'messages');
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
    return false;
  }, [getAuthHeaders, saveToLocalStorage, userTier]);

  // Load saved conversation on mount - FIXED VERSION
useEffect(() => {
  const loadLastChat = async () => {
    if (!isLoggedIn) {
      // Clear any existing messages when user is not logged in
      setMessages([]);
      setCurrentConversationId(null);
      setHasLoadedLastChat(true);
      return;
    }

    console.log('🔍 Loading last chat for user:', user?.id);
    
    try {
      const headers = getAuthHeaders();
      
      // IMPORTANT: Make sure the API endpoint is user-specific
      // The backend should filter by the authenticated user's ID
      const response = await fetch('/api/assistant/latest-conversation', {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const result = await response.json();
        
        // Check if we have a valid conversation WITH MESSAGES
        if (result.success && 
            result.data && 
            result.data.id && 
            result.data.messages && 
            result.data.messages.length > 0) {
          
          console.log('✅ Found conversation with messages for user');
          
          const messages: AssistantMessage[] = result.data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.createdAt || Date.now()),
            metadata: {
              conversationId: result.data.id,
              tokens: msg.tokens,
              model: msg.model,
              ...(msg.metadata || {}),
            },
          }));
          
          setCurrentConversationId(result.data.id);
          setMessages(messages);
          setMode(result.data.mode || 'GENERAL_ASSISTANT');
          
          // Save to localStorage
          localStorage.setItem('assistantMessages', JSON.stringify(messages));
          localStorage.setItem('currentConversationId', result.data.id);
          
        } else {
          console.log('ℹ️ No conversations with messages found for this user');
          
          // IMPORTANT: Clear any existing messages that might be from another user
          setMessages([]);
          setCurrentConversationId(null);
          
          // Clear localStorage for this user
          localStorage.removeItem('assistantMessages');
          localStorage.removeItem('currentConversationId');
        }
      } else {
        console.log('❌ Failed to fetch conversation for user');
        
        // Clear any existing messages on error
        setMessages([]);
        setCurrentConversationId(null);
        localStorage.removeItem('assistantMessages');
        localStorage.removeItem('currentConversationId');
      }
      
    } catch (error) {
      console.error('❌ Error loading last chat:', error);
      
      // Clear messages on error
      setMessages([]);
      setCurrentConversationId(null);
      localStorage.removeItem('assistantMessages');
      localStorage.removeItem('currentConversationId');
      
    } finally {
      setHasLoadedLastChat(true);
    }
  };

  // Reset state when user changes
  if (isLoggedIn && user?.id) {
    // Only load if we haven't loaded yet OR if user changed
    // You might want to add user.id to dependency array
    if (!hasLoadedLastChat) {
      loadLastChat();
    }
  } else if (!isLoggedIn) {
    // Clear everything when logged out
    setMessages([]);
    setCurrentConversationId(null);
    setHasLoadedLastChat(true);
    localStorage.removeItem('assistantMessages');
    localStorage.removeItem('currentConversationId');
  }
  
}, [isLoggedIn, user?.id, hasLoadedLastChat]); // Added user?.id to dependencies

// Also add this effect to handle user changes
useEffect(() => {
  // When user changes (login/logout/switch), reset the loaded flag
  setHasLoadedLastChat(false);
}, [user?.id]);


  // Fetch rate limit info
  const fetchRateLimitInfo = useCallback(async () => {
    if (!isLoggedIn || userTier !== 'FREE') {
      return null;
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/assistant/rate-limit', {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const rateInfo = {
            remaining: result.data.remaining || 0,
            limit: result.data.limit || 10,
            resetTime: result.data.resetTime ? new Date(result.data.resetTime) : null,
          };
          setRateLimitInfo(rateInfo);
          
          // Save to localStorage
          localStorage.setItem('assistantRateLimit', JSON.stringify({
            ...rateInfo,
            lastUpdated: new Date().toISOString(),
            userTier: userTier,
          }));
          
          return rateInfo;
        }
      }
    } catch (error) {
      console.error('Failed to fetch rate limit info:', error);
    }
    
    // Return default if fetch fails
    const defaultInfo = {
      remaining: 10,
      limit: 10,
      resetTime: null,
    };
    setRateLimitInfo(defaultInfo);
    return defaultInfo;
  }, [isLoggedIn, userTier, getAuthHeaders]);

  // Refresh user info
  const refreshUserInfo = useCallback(async () => {
    return await fetchUserInfo();
  }, [fetchUserInfo]);


  // Add to useAssistant hook
const fetchRateLimitStatus = useCallback(async () => {
  if (!isLoggedIn || userTier !== 'FREE') {
    return null;
  }

  try {
    const headers = getAuthHeaders();
    const response = await fetch('/api/assistant/rate-limit/status', {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        const status = result.data;
        
        setRateLimitInfo({
          remaining: status.remaining,
          limit: status.limit,
          resetTime: status.resetTime ? new Date(status.resetTime) : null,
        });
        
        return status;
      }
    }
  } catch (error) {
    console.error('Failed to fetch rate limit status:', error);
  }
  
  return null;
}, [isLoggedIn, userTier, getAuthHeaders]);

// Call this periodically or when switching modes
useEffect(() => {
  if (isLoggedIn && userTier === 'FREE') {
    fetchRateLimitStatus();
    
    // Set up interval to refresh every minute
    const interval = setInterval(() => {
      fetchRateLimitStatus();
    }, 60000);
    
    return () => clearInterval(interval);
  }
}, [isLoggedIn, userTier, fetchRateLimitStatus]);


// Check if user can send message
const canSendMessage = useCallback(async (): Promise<boolean> => {
  if (!isLoggedIn) {
    toast.error(t`Please log in to use the assistant`);
    return false;
  }

  if (userTier !== 'FREE') {
    return true; // Premium/Admin users have no limits
  }

  // Get current rate limit info
  let currentRateLimit = rateLimitInfo;
  
  if (!currentRateLimit) {
    const fetched = await fetchRateLimitInfo();
    if (fetched) {
      currentRateLimit = fetched;
    } else {
      // Default for free users with midnight reset
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      currentRateLimit = {
        remaining: 10,
        limit: 10,
        resetTime: midnight,
      };
    }
  }

  if (currentRateLimit && currentRateLimit.remaining <= 0) {
    // Ensure resetTime is midnight if not provided
    let resetTimeISO: string;
    
    if (currentRateLimit.resetTime) {
      // Check if it's already midnight or needs to be set to midnight
      const resetDate = new Date(currentRateLimit.resetTime);
      if (resetDate.getHours() === 0 && resetDate.getMinutes() === 0) {
        resetTimeISO = resetDate.toISOString();
      } else {
        // Force to midnight
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        resetTimeISO = midnight.toISOString();
      }
    } else {
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      resetTimeISO = midnight.toISOString();
    }
    
    const finalErrorData = {
      message: 'Daily limit reached. Upgrade to premium for unlimited messages.',
      upgradeLink: '/dashboard/pricing',
      remainingMessages: 0,
      limit: currentRateLimit.limit || 10,
      resetTime: resetTimeISO,
    };
    
    // Create rate limit message
    const rateLimitMessage = createRateLimitMessage(finalErrorData);
    
    // Add rate limit message to chat
    const finalMessages = [...messages, rateLimitMessage];
    setMessages(finalMessages);
    saveToLocalStorage(finalMessages, currentConversationId, userTier);
    
    // Show toast with upgrade option
    toast.error(t`Daily limit reached`, {
      action: {
        label: t`Upgrade`,
        onClick: () => navigate('/dashboard/pricing'), 
      },
      duration: 5000,
    });
    
    return false;
  }

  return true;
}, [isLoggedIn, userTier, rateLimitInfo, messages, currentConversationId, saveToLocalStorage, navigate, fetchRateLimitInfo]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
  if (!content.trim()) {
    toast.error(t`Please enter a message`);
    return;
  }
  
  // Check if we have a conversation ID
  if (!currentConversationId) {
    // Only create conversation in database when sending first message
    const newConvId = await startNewConversation(mode, true); // forceCreate = true
    setCurrentConversationId(newConvId);
  }
 
    
    // Check if user can send message
    const canSend = await canSendMessage();
    if (!canSend) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    const userMessage: AssistantMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      const headers = getAuthHeaders();
      
      const requestBody = {
        content: content.trim(),
        mode,
        conversationId: currentConversationId,
        clientTime: new Date().toISOString(),
      };

      const response = await fetch('/api/assistant/message', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      let result: ApiResponse<AssistantResponse> | null = null;
      let errorData: RateLimitErrorData | null = null;
      
      try {
        const responseData = await response.json();
        result = responseData as ApiResponse<AssistantResponse>;
        
        // Check if there's rate limit info in the response
        if (response.status === 429 || result.data?.limitExceeded) {
          errorData = {
            message: result.message || 'Rate limit exceeded',
            upgradeLink: result.data?.upgradeLink || '/dashboard/pricing',
            remainingMessages: result.data?.remainingMessages || 0,
            limit: result.data?.limit || 10,
            resetTime: result.data?.resetTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            error: result.error,
            statusCode: response.status,
          };
        }
      } catch (parseError) {
        // Try to parse as plain text if JSON parsing fails
        const text = await response.text();
        if (response.status === 429) {
          errorData = {
            message: text || 'Rate limit exceeded',
            upgradeLink: '/dashboard/pricing',
            remainingMessages: 0,
            limit: 10,
            resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          };
        } else {
          throw new Error('Invalid response from server');
        }
      }

      // Handle rate limit error (429)
      if (response.status === 429 || errorData) {
        const finalErrorData = errorData || {
          message: 'Rate limit exceeded',
          upgradeLink: '/dashboard/pricing',
          remainingMessages: 0,
          limit: 10,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        
        // Create rate limit message
        const rateLimitMessage = createRateLimitMessage(finalErrorData);
        
        // Add rate limit message to chat
        const finalMessages = [...updatedMessages, rateLimitMessage];
        setMessages(finalMessages);
        saveToLocalStorage(finalMessages, currentConversationId, userTier);
        
        // Update rate limit info
        setRateLimitInfo({
          remaining: finalErrorData.remainingMessages || 0,
          limit: finalErrorData.limit || 10,
          resetTime: finalErrorData.resetTime ? new Date(finalErrorData.resetTime) : null,
        });
        
        // Show toast with upgrade option
        toast.error(t`Daily limit reached`, {
          action: {
            label: t`Upgrade`,
            onClick: () => window.open(finalErrorData.upgradeLink || '/dashboard/pricing', '_blank'),
          },
          duration: 5000,
        });
        
        return null;
      }

      // Handle other errors
      if (!response.ok || !result?.success) {
        const errorMessage = result?.message || result?.error || response.statusText || t`Failed to get assistant response`;
        throw new Error(errorMessage);
      }

      const assistantData = result.data;
      
      if (!assistantData?.content) {
        throw new Error(t`No content in assistant response`);
      }

      // Update user tier if changed
      if (assistantData.userTier && assistantData.userTier !== userTier) {
        setUserTier(assistantData.userTier);
        localStorage.setItem('assistantUserTier', assistantData.userTier);
      }

      // Update conversation ID if this is a new conversation
      if (assistantData.conversationId && !currentConversationId) {
        setCurrentConversationId(assistantData.conversationId);
      }

      // Prepare metadata
      const metadata: Record<string, any> = {};
      if (assistantData.conversationId) metadata.conversationId = assistantData.conversationId;
      if (assistantData.tokensUsed !== undefined) metadata.tokensUsed = assistantData.tokensUsed;
      if (assistantData.responseTime !== undefined) metadata.responseTime = assistantData.responseTime;
      if (assistantData.model) metadata.model = assistantData.model;
      if (assistantData.userTier) metadata.userTier = assistantData.userTier;
      if (assistantData.memoryCreated !== undefined) metadata.memoryCreated = assistantData.memoryCreated;
      if (assistantData.referencedArticles) metadata.referencedArticles = assistantData.referencedArticles;
      if (assistantData.memoryId) metadata.memoryId = assistantData.memoryId;
      if (assistantData.features) metadata.features = assistantData.features;

      const assistantMessage: AssistantMessage = {
        id: assistantData.messageId || `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: assistantData.content,
        timestamp: new Date(assistantData.timestamp || Date.now()),
        metadata,
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Update local storage
      saveToLocalStorage(
        finalMessages, 
        assistantData.conversationId || currentConversationId,
        assistantData.userTier || userTier
      );

      // Update rate limit info if provided
      if (assistantData.remainingMessages !== undefined || assistantData.rateLimitInfo) {
        const rateData = assistantData.rateLimitInfo || assistantData;
        const remaining = (rateData as any).remainingMessages || (rateData as any).remaining || 0;
        const limit = (rateData as any).limit || 10;
        const resetTime = (rateData as any).resetTime ? new Date((rateData as any).resetTime) : null;
        
        setRateLimitInfo({
          remaining,
          limit,
          resetTime,
        });
        
        // Save to localStorage
        localStorage.setItem('assistantRateLimit', JSON.stringify({
          remaining,
          limit,
          resetTime: resetTime?.toISOString(),
          lastUpdated: new Date().toISOString(),
          userTier: assistantData.userTier || userTier,
        }));
      } else if (userTier === 'FREE') {
        // If no rate limit info but user is FREE, decrement remaining count
        const currentRemaining = rateLimitInfo?.remaining || 10;
        const currentLimit = rateLimitInfo?.limit || 10;
        
        // Decrement only if we have valid remaining count
        if (currentRemaining > 0) {
          const newRemaining = currentRemaining - 1;
          setRateLimitInfo({
            remaining: newRemaining,
            limit: currentLimit,
            resetTime: rateLimitInfo?.resetTime || null,
          });
          
          // Save to localStorage
          localStorage.setItem('assistantRateLimit', JSON.stringify({
            remaining: newRemaining,
            limit: currentLimit,
            resetTime: rateLimitInfo?.resetTime?.toISOString(),
            lastUpdated: new Date().toISOString(),
            userTier: userTier,
          }));
        }
      }

      // Show warning toast when free user has low messages
      if (userTier === 'FREE' && rateLimitInfo && rateLimitInfo.remaining <= 3) {
        toast.warning(t`Only ${rateLimitInfo.remaining} message${rateLimitInfo.remaining === 1 ? '' : 's'} left`, {
          action: {
            label: t`Upgrade`,
            onClick: () => window.open('/dashboard/pricing', '_blank'),
          },
          duration: 5000,
        });
      }

      return assistantData;

    } catch (err: any) {
      console.error('Assistant error:', err);
      
      // Handle specific error types
      let errorMessage = err.message || t`Something went wrong. Please try again.`;
      
      if (err.message.includes('Rate limit') || 
          err.message.includes('limit reached') || 
          err.message.includes('429') ||
          err.message.includes('exceeded')) {
        errorMessage = t`Daily limit reached. Please try again tomorrow or upgrade to premium.`;
      } else if (err.message.includes('token') || 
                err.message.includes('authentication') || 
                err.message.includes('401') ||
                err.message.includes('unauthorized')) {
        errorMessage = t`Session expired. Please log in again.`;
        clearLocalStorage();
      } else if (err.message.includes('network') || 
                err.message.includes('fetch') ||
                err.message.includes('Failed to fetch')) {
        errorMessage = t`Network error. Please check your connection.`;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Revert to previous messages on error
      setMessages(messages);
      saveToLocalStorage(messages, currentConversationId, userTier);
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [messages, mode, currentConversationId, startNewConversation, isLoggedIn, getAuthHeaders, saveToLocalStorage, userTier, rateLimitInfo, clearLocalStorage, canSendMessage]);

  // Switch mode
  const switchMode = useCallback((newMode: AssistantMode) => {
    setMode(newMode);
    localStorage.setItem('assistantMode', newMode);
    
    // If we have a conversation, update it with new mode
    if (currentConversationId) {
      updateConversationMode(newMode);
    }
  }, [currentConversationId]);

  const updateConversationMode = async (newMode: AssistantMode) => {
    if (!currentConversationId) return;
    
    try {
      const headers = getAuthHeaders();
      await fetch(`/api/assistant/conversations/${currentConversationId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ mode: newMode }),
      });
    } catch (error) {
      console.error('Failed to update conversation mode:', error);
    }
  };

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setError(null);
    setRateLimitInfo(null);
    clearLocalStorage();
    
    // DON'T start a new conversation automatically
    // Just clear the state
  }, [])

  // Load conversation from history
  const loadConversation = useCallback((newMessages: AssistantMessage[], newMode?: AssistantMode) => {
    setMessages(newMessages);
    if (newMode) {
      setMode(newMode);
      localStorage.setItem('assistantMode', newMode);
    }
    saveToLocalStorage(newMessages, currentConversationId, userTier);
  }, [currentConversationId, userTier, saveToLocalStorage]);


  // Get conversation messages
  const getConversationMessages = useCallback(async (conversationId: string) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/assistant/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversation messages');
      }

      const result = await response.json() as ApiResponse<any[]>;
      
      if (result.success && result.data) {
        const messages: AssistantMessage[] = result.data.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt || msg.updatedAt || Date.now()),
          metadata: {
            tokens: msg.tokens,
            model: msg.model,
            conversationId: msg.conversationId,
            ...(msg.metadata || {})
          },
        }));
        
        return messages;
      }
    } catch (err) {
      console.error('Failed to get conversation messages:', err);
      throw err;
    }
  }, [getAuthHeaders]);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    mode,
    switchMode,
    clearConversation,
    loadConversation,
    currentConversationId,
    startNewConversation,
    getConversationMessages,
    userTier,
    rateLimitInfo,
    getAuthHeaders,
    fetchUserInfo,
    refreshUserInfo,
    canSendMessage,
    hasLoadedLastChat,
  };
};