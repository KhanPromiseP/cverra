// components/assistant/AssistantChat.tsx - ENHANCED VERSION
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  BookOpen, 
  Briefcase,
  Brain,
  Clock,
  Zap,
  Loader2,
  X,
  Maximize2,
  Minimize2,
  Settings,
  History,
  RefreshCw,
  MessageCircle,
  Copy,
  Check,
  MoreVertical,
  Star,
  Pin,
  Crown,
  AlertTriangle,
  ArrowUpRight,
  Scale,      
  Heart,     
  Network,    
  LineChart,  
  Lock     
} from 'lucide-react';
import { useAssistant } from '../../hooks/useAssistant';
import { useAssistantHistory } from '../../hooks/useAssistantHistory';
import { AssistantMode, AssistantMessage, Conversation } from '../../types/assistant';
import { t, Trans } from "@lingui/macro";
import { MemoryPanel } from './MemoryPanel';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router';
import { useUser } from '@/client/services/user';

// RateLimitMessage Component - FIXED VERSION
const RateLimitMessage: React.FC<{ 
  message: AssistantMessage; 
  onUpgradeClick?: () => void;
}> = ({ message, onUpgradeClick }) => {
  const navigate = useNavigate(); // Add this
  
  const metadata = message.metadata as any;
  const upgradeLink = metadata?.upgradeLink || '/dashboard/pricing';
  const remaining = metadata?.remainingMessages || 0;
  const limit = metadata?.limit || 10;
  const resetTime = metadata?.resetTime ? new Date(metadata.resetTime) : null;
  
  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      navigate(upgradeLink); // Changed from window.open to navigate
    }
  };

  
  
  return (
    <div className="rate-limit-message rounded-lg p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-300" />
        </div>
        <div className="flex-1">
          <div className="markdown-content prose dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                a: ({ node, href, children, ...props }) => {
                  // Handle links with React Router
                  const isInternalLink = href?.startsWith('/');
                  
                  if (isInternalLink && href) { // Add null check for href
                    return (
                      <a 
                        href={href}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(href); // href is guaranteed to be string here
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  }
                  
                  // External links or fallback
                  return (
                    <a 
                      href={href || '#'}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
                p: ({ node, ...props }) => <p className="my-2" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleUpgradeClick}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Premium
              <ArrowUpRight className="w-3 h-3" />
            </button>
            
          </div>
          <div className="mt-3 text-sm text-amber-700 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {remaining > 0 
                  ? `${remaining} messages remaining today`
                  : `Limit resets ${resetTime ? `at ${resetTime.toLocaleTimeString()}` : 'tomorrow'}`
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AssistantChatProps {
  isMobilePopup?: boolean;
  memories?: any[];
  conversations?: Conversation[];
  selectedConversation?: Conversation | null;
  onConversationLoaded?: () => void;
  onClearConversation?: () => void;
  onClose?: () => void;
  mode?: AssistantMode;
  onModeChange?: (mode: AssistantMode) => void;
  canAccessPremium?: boolean;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({ 
  isMobilePopup = false,
  memories = [],
  conversations = [],
  selectedConversation = null,
  onConversationLoaded,
  onClearConversation,
  onClose,
  onModeChange,
  canAccessPremium = false
}) => {
  const { user } = useUser();
  const navigate = useNavigate(); 
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const [showUpgradeTooltip, setShowUpgradeTooltip] = useState(false);
  
  const [isLoadingInitialChat, setIsLoadingInitialChat] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedLockedMode, setSelectedLockedMode] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // IMPORTANT: Make sure useAssistant hook returns userTier and rateLimitInfo
  const {
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
    userTier = 'FREE', // Default to FREE if not provided
    rateLimitInfo = null, // Default to null if not provided
    getAuthHeaders
  } = useAssistant();

  const {
    conversations: fetchedConversations,
    isLoading: isLoadingHistory,
    error: historyError,
    fetchConversations,
    fetchConversationMessages,
    clearConversation: clearConversationApi,
    getConversationStats,
  } = useAssistantHistory();

  // Check for free tier and low messages on mount
  useEffect(() => {
    if (userTier === 'FREE' && rateLimitInfo && rateLimitInfo.remaining <= 2) {
      // Show upgrade tooltip after 2 seconds
      const timer = setTimeout(() => {
        setShowUpgradeTooltip(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [userTier, rateLimitInfo]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMessageMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadSelectedConversation = async () => {
      if (selectedConversation) {
        console.log('Loading selected conversation from parent:', selectedConversation);
        await handleSelectConversation(selectedConversation);
        
        if (onConversationLoaded) {
          onConversationLoaded();
        }
      }
    };
    
    loadSelectedConversation();
  }, [selectedConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages, shouldAutoScroll]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      setShouldAutoScroll(false);
      inputRef.current.style.height = 'auto';
      const newHeight = Math.min(inputRef.current.scrollHeight, 150);
      inputRef.current.style.height = `${newHeight}px`;
      setTimeout(() => setShouldAutoScroll(true), 50);
    }
  }, [input]);

  // Prevent body scroll
  useEffect(() => {
    if (showHistoryPopup || isExpanded) {
      document.body.style.overflow = 'hidden';
    } else if (!isMobilePopup) {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      if (!isMobilePopup) document.body.style.overflow = 'unset';
    };
  }, [showHistoryPopup, isExpanded, isMobilePopup]);

 
  
 useEffect(() => {
  // Only check on initial mount
  if (messages.length === 0 && user && !isLoadingInitialChat) {
    console.log('🔍 Checking for existing conversation...');
    
    // The useAssistant hook should have already loaded messages
    // Just show loading briefly if it's still empty
    const timer = setTimeout(() => {
      setIsLoadingInitialChat(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }
}, [messages.length, user, isLoadingInitialChat]);


  // Handle user scroll behavior
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    }
  }, []);

  // Copy message to clipboard
  const handleCopyMessage = useCallback(async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast.success(t`Message copied to clipboard`);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedMessageId(messageId);
      toast.success(t`Message copied to clipboard`);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
    setShowMessageMenu(null);
  }, []);

  // Format time
  const formatTime = useCallback((date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  }, []);

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    const currentScrollTop = messagesContainerRef.current?.scrollTop || 0;
    
    setInput('');
    
    try {
      await sendMessage(message);
      
      // If this is a new conversation, refresh the list
      if (messages.length === 0) {
        fetchConversations();
      }
      
      // Scroll handling
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = currentScrollTop;
        setTimeout(() => {
          if (shouldAutoScroll && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ 
              behavior: 'smooth',
              block: 'end'
            });
          }
        }, 100);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error(t`Failed to send message`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = useCallback(async (conversation: Conversation) => {
    console.log('Selected conversation:', conversation);
    
    try {
      // Fetch messages for this conversation
      const headers = getAuthHeaders();
      const response = await fetch(`/api/assistant/conversations/${conversation.id}/messages`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const messages: AssistantMessage[] = result.data.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt || msg.updatedAt || Date.now()),
          metadata: msg.metadata || {},
        }));
        
        loadConversation(messages, conversation.mode as AssistantMode);
        setShowHistoryPopup(false);
        toast.success(t`Loaded conversation from ${new Date(conversation.updatedAt).toLocaleDateString()}`);
      } else {
        toast.error(t`No messages found in this conversation`);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
      toast.error(t`Failed to load conversation`);
    }
  }, [loadConversation, getAuthHeaders]);

  // Clear conversation
  const handleClearConversation = useCallback(async () => {
    // Show confirmation with option to save current conversation
    if (messages.length > 0) {
      const shouldSave = window.confirm(
        t`Do you want to save this conversation before clearing? You can access it later from history.`
      );
      
      if (shouldSave) {
        // Ensure conversation is saved
        toast.success(t`Conversation saved to history`);
      }
    }
    
    // Rest of clearing logic remains the same
    if (currentConversationId) {
      try {
        await clearConversationApi(currentConversationId);
        toast.success(t`Conversation cleared`);
      } catch (err) {
        console.error('Failed to clear conversation from backend:', err);
        toast.error(t`Failed to clear conversation from server`);
      }
    }
    
    clearConversation();
    
    // Start fresh conversation
    try {
      await startNewConversation();
    } catch (err) {
      console.error('Failed to start new conversation:', err);
    }
    
    if (onClearConversation) onClearConversation();
  }, [currentConversationId, clearConversationApi, clearConversation, startNewConversation, onClearConversation, messages.length]);



  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleSwitchMode = (newMode: AssistantMode) => {
  switchMode(newMode);
  
  // Only clear local state, don't create new conversation
  clearConversation(); // This should clear without hitting API
  
  // DON'T call startNewConversation() here
  // The conversation will be created when user sends first message
  
  fetchConversations();
};

  // Pin message (future feature placeholder)
  const handlePinMessage = (messageId: string) => {
    console.log('Pin message:', messageId);
    toast.info(t`Pinning messages will be available soon`);
    setShowMessageMenu(null);
  };

  // Star message (future feature placeholder)
  const handleStarMessage = (messageId: string) => {
    console.log('Star message:', messageId);
    toast.info(t`Starring messages will be available soon`);
    setShowMessageMenu(null);
  };

  // Handle upgrade click
  const handleUpgradeClick = () => {
    // Close tooltip if it's open
    setShowUpgradeTooltip(false);
    
    // Navigate to pricing page
    navigate('/dashboard/pricing');
    
    // Optional: Close chat if it's a mobile popup
    if (isMobilePopup && onClose) {
      onClose();
    }
  };

  const selectedMode = MODES.find(m => m.id === mode);
  const displayConversations = fetchedConversations.length > 0 ? fetchedConversations : conversations;

  // Simple markdown renderer
  const renderMarkdown = useCallback((content: string) => {
    return (
      <ReactMarkdown
        components={{
          // Customize link rendering
          a: ({ node, href, children, ...props }) => {
            const isArticleLink = href?.includes('/dashboard/article/') || 
                                  href?.includes('/article/');
            
            if (!isArticleLink || !href) { // Add !href check
              return (
                <a href={href} {...props}>
                  {children}
                </a>
              );
            }
            
            const isDarkMode = typeof document !== 'undefined' && 
                              document.documentElement.classList.contains('dark');
            
            const lightColor = '#2563eb';
            const darkColor = '#60a5fa';
            const lightHoverColor = '#1d4ed8';
            const darkHoverColor = '#93c5fd';
            
            const baseColor = isDarkMode ? darkColor : lightColor;
            const hoverColor = isDarkMode ? darkHoverColor : lightHoverColor;
            const borderColor = isDarkMode ? 'rgba(96, 165, 250, 0.3)' : 'rgba(37, 99, 235, 0.3)';
            const hoverBorderColor = isDarkMode ? darkHoverColor : lightHoverColor;
            const hoverBgColor = isDarkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.05)';
            
            return (
              <a 
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Article clicked:', href);
                  // Use navigate for internal routing instead of window.open
                  // href is guaranteed to be string here because of the !href check above
                  navigate(href);
                }}
                style={{
                  color: baseColor,
                  textDecoration: 'none',
                  fontWeight: '500',
                  borderBottom: `1px solid ${borderColor}`,
                  paddingBottom: '1px',
                  display: 'inline-block',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = hoverColor;
                  e.currentTarget.style.borderBottomColor = hoverBorderColor;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.backgroundColor = hoverBgColor;
                  e.currentTarget.style.borderRadius = '2px';
                  e.currentTarget.style.padding = '0 2px';
                  e.currentTarget.style.margin = '0 -2px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = baseColor;
                  e.currentTarget.style.borderBottomColor = borderColor;
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.borderRadius = '';
                  e.currentTarget.style.padding = '0';
                  e.currentTarget.style.paddingBottom = '1px';
                  e.currentTarget.style.margin = '0';
                }}
                {...props}
              >
                {children}
                <span style={{
                  fontSize: '0.75em',
                  opacity: 0.7,
                  marginLeft: '2px',
                }}>
                  🔗
                </span>
              </a>
            );
          },
          // Customize heading rendering
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-2 mb-1" {...props} />,
          // Make lists look better
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2" {...props} />,
          li: ({ node, ...props }) => <li className="my-1" {...props} />,
          // Style code blocks
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !className || !match;
            
            if (isInline) {
              return (
                <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              );
            }
            
            return (
              <div className="relative my-3">
                <div className="absolute top-0 right-0 px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded-bl">
                  {match ? match[1] : 'code'}
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          // Style blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 italic" {...props} />
          ),
          // Style paragraphs to handle article links better
          p: ({ node, children, ...props }) => {
            const hasArticleLink = React.Children.toArray(children).some(child => 
              React.isValidElement(child) && 
              child.type === 'a' && 
              child.props.href?.includes('/dashboard/article/')
            );
            
            return (
              <p 
                className={hasArticleLink ? "article-paragraph" : ""}
                {...props}
              >
                {children}
              </p>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }, []);

  // Check if input should be disabled (premium mode locked)
  const isInputDisabled = useCallback((): boolean => {
    const currentMode = MODES.find(m => m.id === mode);
    return !canAccessPremium && !!currentMode?.isPremium;
  }, [mode, canAccessPremium]);

  // Get dynamic placeholder
  const getInputPlaceholder = useCallback((): string => {
    if (isInputDisabled()) {
      return t`Upgrade to premium to start chatting in this mode`;
    }
    return selectedMode?.description || t`Ask me anything...`;
  }, [isInputDisabled, selectedMode]);

  // Calculate progress percentage for rate limit bar
 const getProgressPercentage = () => {
  if (!rateLimitInfo) return 0;
  if (rateLimitInfo.remaining === 0) return 100; // Full bar when limit reached
  return Math.max(5, (rateLimitInfo.remaining / rateLimitInfo.limit) * 100);
};

  // Get progress bar color based on remaining messages
 const getProgressBarColor = () => {
  if (!rateLimitInfo) return 'bg-gradient-to-r from-blue-500 to-indigo-600';
  
  if (rateLimitInfo.remaining === 0) {
    return 'bg-gradient-to-r from-red-600 to-red-500';
  } else if (rateLimitInfo.remaining <= 2) {
    return 'bg-gradient-to-r from-red-500 to-pink-600';
  } else if (rateLimitInfo.remaining <= 5) {
    return 'bg-gradient-to-r from-amber-500 to-orange-600';
  } else {
    return 'bg-gradient-to-r from-blue-500 to-indigo-600';
  }
};

    const getWelcomeMessage = (mode: AssistantMode): string => {
  const modeConfig = MODES.find(m => m.id === mode);
  
  // If it's a premium mode and user can't access
  if (modeConfig?.isPremium && !canAccessPremium) {
    switch(mode) {
      case 'DECISION_ARCHITECT':
        return t`✨ Preview: Decision Architect helps you analyze choices with pros/cons, goal alignment, and regret prediction. Upgrade to start making better decisions.`;
      case 'LIFE_COACH':
        return t`✨ Preview: Life Coach helps you understand emotional patterns, track personal growth, and become who you want to be. Upgrade to begin your journey.`;
      case 'SECOND_BRAIN':
        return t`✨ Preview: Second Brain organizes your thoughts, ideas, and knowledge into a connected network. Upgrade to start building your knowledge graph.`;
      case 'FUTURE_SIMULATOR':
        return t`✨ Preview: Future Simulator lets you explore possible paths and compare outcomes. Upgrade to see where your choices could lead.`;
      default:
        return t`✨ This is a premium feature. Upgrade to unlock full access.`;
    }
  }
  
  // Regular welcome message for free modes or premium users
  return modeConfig?.description || t`How can I help you today?`;
};


  return (
    <>
      {/* History/Memory Popup */}
      {showHistoryPopup && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowHistoryPopup(false);
            }
          }}
        >
          <div className="relative w-full max-w-4xl h-full max-h-[90vh] bg-card rounded-xl shadow-2xl border border-border animate-in slide-in-from-bottom duration-300">
            <button
              onClick={() => setShowHistoryPopup(false)}
              className="absolute -top-4 -right-4 md:-top-4 text-destructive md:-right-4 z-50 p-2 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:bg-destructive/90 transition-colors"
              aria-label={t`Close history`}
              title={t`Close`}
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            
            <MemoryPanel 
              memories={memories} 
              conversations={displayConversations}
              onSelectMemory={(memory) => {
                console.log('Selected memory:', memory);
                setShowHistoryPopup(false);
              }}
              onSelectConversation={handleSelectConversation}
              onClose={() => setShowHistoryPopup(false)}
            />
          </div>
        </div>
      )}

      {/* Expanded Mode Backdrop */}
      {isExpanded && !isMobilePopup && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xl animate-in fade-in duration-300" />
      )}

      {/* Upgrade Tooltip for low messages */}
      {showUpgradeTooltip && userTier === 'FREE' && rateLimitInfo && rateLimitInfo.remaining <= 2 && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5" />
              <span className="font-bold">Upgrade Now!</span>
            </div>
            <p className="text-sm mb-3">
              Only {rateLimitInfo.remaining} message{rateLimitInfo.remaining === 1 ? '' : 's'} left. 
              Upgrade to Premium for unlimited access!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpgradeClick}
                className="flex-1 bg-white text-purple-600 hover:bg-gray-100 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Upgrade Now
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowUpgradeTooltip(false)}
                className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Container */}
      <div 
        className={`
          flex flex-col h-full bg-card text-foreground
          overflow-hidden transition-all duration-300
          ${isExpanded && !isMobilePopup 
            ? 'fixed inset-4 md:inset-8 lg:inset-12 xl:inset-16 z-50 rounded-2xl shadow-2xl' 
            : 'h-full rounded-xl shadow-lg'
          }
          ${isMobilePopup ? 'rounded-none shadow-none' : 'md:rounded-xl md:shadow-lg'}
        `}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-3 md:p-4 border-b border-border bg-card ${isExpanded && !isMobilePopup ? 'rounded-t-2xl' : ''}`}>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative mr-2">
              <div className={`
                w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-border
                flex items-center justify-center
                ${selectedMode?.color} ${selectedMode?.darkColor}
              `}>
                <img 
                  src="/assets/assistant.jpeg" 
                  alt="Assistant"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-card"></div>
            </div>
            <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm md:text-lg font-semibold">{t`Assistant`}</h2>
                  {selectedMode?.isPremium && (
                    <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      {t`Premium`}
                    </span>
                  )}
                  {userTier === 'FREE' && !selectedMode?.isPremium && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                      {t`Free`}
                    </span>
                  )}
                  {userTier === 'PREMIUM' && (
                    <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      {t`Premium`}
                    </span>
                  )}
                </div>
                {!isMobilePopup && (
                  <p className="hidden md:block text-xs md:text-sm text-muted-foreground mt-0.5">
                    {selectedMode?.description || t`Your personalized AI assistant`}
                  </p>
                )}
              </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
            {!isMobilePopup && (
              <button
                type="button"
                onClick={() => toast.info(t`Settings coming soon`)}
                className="p-1.5 md:p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                aria-label={t`Open assistant settings`}
                title={t`Settings`}
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}
            
            {!isMobilePopup && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 md:p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title={isExpanded ? t`Minimize` : t`Expand`}
                aria-label={isExpanded ? t`Minimize chat` : t`Expand chat`}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
            )}
            
            <button
              onClick={handleClearConversation}
              disabled={isLoading}
              className="p-1.5 md:p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              title={t`Clear conversation`}
              aria-label={t`Clear conversation`}
            >
              <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            {isMobilePopup && onClose && (
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title={t`Close chat`}
                aria-label={t`Close chat`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mode Selector - ALL modes clickable, premium show paywall */}
<div className="px-3 md:px-4 py-2 md:py-3 border-b border-border bg-muted/30 overflow-x-auto scrollbar-thin">
  <div className="flex gap-1 md:gap-2">
    {MODES.map((m) => {
      const isPremiumLocked = m.isPremium && !canAccessPremium;
      
      return (
        <button
          key={m.id}
          onClick={() => {
            // Always switch mode - even for locked premium
            handleSwitchMode(m.id);
          }}
          className={`
            flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2.5 rounded-lg transition-all whitespace-nowrap text-sm md:text-base relative
            ${mode === m.id
              ? `bg-gradient-to-r ${m.color} ${m.darkColor} text-white shadow-sm`
              : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
            }
            ${isPremiumLocked ? 'opacity-90' : ''}
          `}
          aria-label={`${m.label} mode`}
        >
          {m.icon}
          <span className="font-medium">{m.label}</span>
          
          {/* Premium badge for locked modes */}
          {isPremiumLocked && (
            <span className="ml-1 flex items-center gap-0.5 text-amber-300">
              <Crown className="w-3 h-3" />
              <span className="text-[10px] font-semibold">PRO</span>
            </span>
          )}
        </button>
      );
    })}
  </div>
</div>

{/* Premium Paywall Banner - Shows when free user selects premium mode */}
{!canAccessPremium && mode !== 'GENERAL_ASSISTANT' && mode !== 'TUTOR' && 
 mode !== 'CAREER_COACH' && mode !== 'CONTENT_GUIDE' && (
  <div className="mx-3 md:mx-4 my-2 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
    <div className="flex items-start gap-3">
      <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
        <Crown className="w-5 h-5 text-amber-600 dark:text-amber-300" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
          Unlock {MODES.find(m => m.id === mode)?.label} Mode
        </h4>
        <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
          This is a premium feature. Upgrade to get unlimited access to all premium modes and dashboards.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/dashboard/pricing')}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Crown className="w-4 h-4" />
            Upgrade Now
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              // Switch back to a free mode
              const freeMode = MODES.find(m => !m.isPremium);
              if (freeMode) handleSwitchMode(freeMode.id);
            }}
            className="px-4 py-2 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-lg text-sm font-medium hover:bg-amber-300 dark:hover:bg-amber-700 transition"
          >
            Try Free Mode
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{canAccessPremium && mode !== 'GENERAL_ASSISTANT' && mode !== 'TUTOR' && 
 mode !== 'CAREER_COACH' && mode !== 'CONTENT_GUIDE' && (
  <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b border-purple-200 dark:border-purple-800">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
        <Sparkles className="w-4 h-4" />
        <span>
          Your {MODES.find(m => m.id === mode)?.label} insights appear in the dashboard
        </span>
      </div>
      <button
        onClick={() => {
          const modeConfig = MODES.find(m => m.id === mode);
          if (modeConfig?.dashboardPath) {
            navigate(modeConfig.dashboardPath);
          } else {
            navigate('/dashboard/assistant?tab=life-dashboard');
          }
        }}
        className="text-xs px-3 py-1 bg-purple-200 dark:bg-purple-800 hover:bg-purple-300 dark:hover:bg-purple-700 rounded-full transition flex items-center gap-1"
      >
        View Dashboard
        <ArrowUpRight className="w-3 h-3" />
      </button>
    </div>
  </div>
)}

{/* Enhanced Rate Limit Status Bar - CORRECTED VERSION */}
{userTier === 'FREE' && rateLimitInfo && (
  <div className="px-3 md:px-4 py-2 border-b border-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
    <div className="flex flex-col gap-2">
      {/* Top Row: Status and Upgrade Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${rateLimitInfo.remaining === 0 ? 'bg-red-500 animate-pulse' : rateLimitInfo.remaining <= 2 ? 'bg-red-500' : rateLimitInfo.remaining <= 5 ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
          <span className="font-medium text-blue-700 dark:text-blue-300 text-xs md:text-sm">
            {t`Free Plan`}
          </span>
          {/* Always show upgrade button for free users */}
          <button
            onClick={handleUpgradeClick}
            className="ml-2 px-3 py-1 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
          >
            <Crown className="w-3 h-3" />
            {t`Upgrade`}
          </button>
        </div>
        
        <div className={`text-xs md:text-sm font-medium ${rateLimitInfo.remaining === 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
          {rateLimitInfo.remaining === 0 ? (
            <>
              <span className="line-through">{rateLimitInfo.limit}/{rateLimitInfo.limit}</span>
              <span className="ml-1">{t`messages - Limit Reached!`}</span>
            </>
          ) : (
            `${rateLimitInfo.remaining}/${rateLimitInfo.limit} ${t`messages`}`
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-2 bg-blue-100 dark:bg-blue-900 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${getProgressBarColor()}`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
      
      {/* Messages Warning - Handle 0 remaining case */}
      {rateLimitInfo.remaining <= 5 && (
        <div className={`text-xs ${rateLimitInfo.remaining === 0 ? 'text-red-600 dark:text-red-400 animate-pulse' : rateLimitInfo.remaining <= 2 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {rateLimitInfo.remaining === 0 ? (
                <>
                  {t`Daily limit reached! `}
                  {rateLimitInfo.resetTime && (
                    <span className="text-xs opacity-80">
                      {t`Resets ${new Date(rateLimitInfo.resetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                  )}
                </>
              ) : rateLimitInfo.remaining <= 2 ? (
                t`Last ${rateLimitInfo.remaining} message${rateLimitInfo.remaining === 1 ? '' : 's'}!`
              ) : (
                t`Only ${rateLimitInfo.remaining} messages left`
              )}
            </span>
            <button
              onClick={handleUpgradeClick}
              className="underline hover:no-underline font-medium flex items-center gap-1"
            >
              {rateLimitInfo.remaining === 0 ? t`Unlock Now` : t`Upgrade Now`}
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}

        {/* Messages Container */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-card"
        >
          {isLoadingInitialChat ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 md:py-12">
              <div className="w-16 h-16 rounded-full aspect-square bg-gradient-to-r from-purple-500/10 to-blue-600/30 dark:from-purple-600/10 dark:to-blue-700/30 flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-purple-500 dark:text-purple-400 animate-spin" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2">
                {t`Loading your last chat...`}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t`Please wait while we retrieve your conversation`}
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 md:py-12">
              {/* Add upgrade banner for free users in empty state */}
              {userTier === 'FREE' && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800 max-w-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                    <h4 className="font-bold text-purple-700 dark:text-purple-300">
                      {t`Upgrade to Premium`}
                    </h4>
                  </div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mb-3">
                    {t`Get unlimited conversations, deep real life assistance tailord to your present situation and past conversations!`}
                  </p>
                  <button
                    onClick={handleUpgradeClick}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t`Upgrade Now`}
                  </button>
                </div>
              )}
              
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full aspect-square bg-gradient-to-r from-purple-500/10 to-blue-600/30 dark:from-purple-600/10 dark:to-blue-700/30 flex items-center justify-center mb-3 md:mb-4">
                <MessageCircle className="w-8 h-8 md:w-12 md:h-12 text-purple-500 dark:text-purple-400" />
              </div>
              <h3 className="text-lg md:text-3xl font-bold mb-2 md:mb-4">
                {user?.name 
                  ? t`Hello ${user.name}! I'm your Personal Assistant @Inlirah`
                  : user?.email
                    ? (() => {
                        // Extract username from email (before @)
                        const username = user.email.split('@')[0];
                        return t`Hello ${username}! I'm your Personal Assistant @Inlirah`;
                      })()
                    : t`Hello! I'm your Personal Assistant @Inlirah`
                }
              </h3>
              {/* <p className="text-sm md:text-lg text-muted-foreground mb-4 md:mb-6 max-w-sm md:max-w-lg">
                {selectedMode?.description || t`How can I help you today?`}
              </p> */}
              <p className="text-sm md:text-lg text-muted-foreground mb-4 md:mb-6 max-w-sm md:max-w-lg">
                {getWelcomeMessage(mode)}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 md:gap-2 max-w-xs md:max-w-md">
                {[
                  t`Help me improve my resume`,
                  t`Explain a programming concept`,
                  t`Suggest articles to read`,
                  t`Career path guidance`,
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="p-2 md:p-3 text-left bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm md:text-base text-secondary-foreground hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isRateLimitMessage = message.metadata?.isRateLimitMessage;
                
                if (isRateLimitMessage) {
                  return (
                    <div key={message.id} className="flex justify-start">
                      <RateLimitMessage 
                        message={message}
                        onUpgradeClick={handleUpgradeClick}
                      />
                    </div>
                  );
                }

            
                
                return (
                  <div
                    key={message.id}
                    data-message-id={message.id}
                    className={`flex group ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`
                        max-w-[85%] md:max-w-[75%] xl:max-w-[65%] rounded-xl p-3 md:p-4 relative
                        ${message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                          : 'bg-secondary text-secondary-foreground'
                        }
                        transition-all duration-200 hover:shadow-md
                      `}
                    >
                      <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className={`
                            p-1.5 md:p-2 rounded-lg
                            ${message.role === 'user' 
                              ? 'bg-blue-600/80' 
                              : 'bg-purple-500/80 dark:bg-purple-600/80'
                            }
                          `}>
                            {message.role === 'user' ? (
                              <User className="w-3 h-3 md:w-4 md:h-4" />
                            ) : (
                              <Bot className="w-3 h-3 md:w-4 md:h-4" />
                            )}
                          </div>
                          <span className="text-sm md:text-base font-medium">
                            {message.role === 'user' ? t`You` : t`Assistant`}
                          </span>
                          <span className="text-xs md:text-sm opacity-80">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        
                        <div className="relative" ref={menuRef}>
                          <button
                            onClick={() => setShowMessageMenu(
                              showMessageMenu === message.id ? null : message.id
                            )}
                            className={`
                              p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100
                              ${message.role === 'user' 
                                ? 'text-white/70 hover:text-white hover:bg-white/20' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              }
                            `}
                            title={t`More options`}
                            aria-label={t`Message options`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {showMessageMenu === message.id && (
                            <div className="absolute right-0 top-full mt-1 z-10 w-48 bg-background border border-border rounded-lg shadow-lg animate-in fade-in zoom-in-95">
                              <div className="py-1">
                                <button
                                  onClick={() => handleCopyMessage(message.content, message.id)}
                                  className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-center gap-2"
                                >
                                  {copiedMessageId === message.id ? (
                                    <>
                                      <Check className="w-5 h-5" />
                                      <span>{t`Copied!`}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-5 h-5" />
                                      <span>{t`Copy message`}</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handlePinMessage(message.id)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                >
                                  <Pin className="w-4 h-4" />
                                  <span>{t`Pin message`}</span>
                                </button>
                                <button
                                  onClick={() => handleStarMessage(message.id)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                >
                                  <Star className="w-4 h-4" />
                                  <span>{t`Star message`}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="markdown-content text-base md:text-lg leading-relaxed select-text cursor-text">
                        {renderMarkdown(message.content)}
                      </div>
                      
                      {/* Quick copy button on hover */}
                      <button
                        onClick={() => handleCopyMessage(message.content, message.id)}
                        className={`
                          absolute -bottom-2 right-3 p-1.5 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100
                          ${message.role === 'user' 
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : 'bg-purple-500 text-white hover:bg-purple-600'
                          }
                          transform translate-y-2 group-hover:translate-y-0
                        `}
                        title={t`Copy message`}
                        aria-label={t`Copy message`}
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] md:max-w-[75%] xl:max-w-[65%] rounded-xl p-4 bg-secondary animate-pulse">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-500 dark:text-purple-400" />
                      <span className="text-base text-muted-foreground">{t`Thinking...`}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="flex justify-center animate-in fade-in slide-in-from-top-5">
                  <div className="max-w-md bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-lg p-4 text-sm flex flex-col gap-2">
                    <div className="font-medium">{t`Something went wrong`}</div>
                    <div>{error}</div>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-sm underline hover:text-red-800 dark:hover:text-red-300"
                    >
                      {t`Reload chat`}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="h-4 md:h-8" />
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className={`border-t border-border lg:mb-12 p-3 bg-card ${isExpanded && !isMobilePopup ? 'rounded-b-2xl' : ''}`}>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedMode?.description || t`Ask me anything...`}
                className="
                  w-full bg-secondary border border-gray-400 border-border rounded-lg p-3 pr-12
                  text-foreground placeholder:text-muted-foreground resize-none 
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed text-base
                  max-h-32 min-h-[44px] leading-relaxed
                  transition-all duration-200
                "
                rows={1}
                disabled={isLoading || isInputDisabled()}
                aria-label={t`Message input`}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isInputDisabled()}
                className={`
                  absolute right-2 bottom-1 p-2 rounded-lg transition-all
                  ${!input.trim() || isLoading || isInputDisabled()
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : `bg-gradient-to-r ${selectedMode?.color} ${selectedMode?.darkColor} text-white hover:opacity-90 hover:shadow-md active:scale-95`
                  }
                  min-w-[44px] min-h-[44px] flex items-center justify-center
                  disabled:transform-none
                `}
                aria-label={t`Send message`}
                title={t`Send message (Enter)`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span className="hidden md:inline">{t`Personalized responses`}</span>
                  <span className="md:hidden">{t`Personalized`}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="hidden md:inline">{t`Remembers context`}</span>
                  <span className="md:hidden">{t`Remembers context`}</span>
                </span>
              </div>
              
              <button
                onClick={() => setShowHistoryPopup(true)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors hover:shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t`Show chat history`}
              >
                <History className="w-4 h-4" />
                <span className="font-medium">
                  {t`History`} 
                  <span className="ml-2 text-muted-foreground">
                    ({displayConversations.length})
                  </span>
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedLockedMode && (
        <UpgradeModal
          mode={selectedLockedMode}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => {
            setShowUpgradeModal(false);
            navigate('/dashboard/pricing');
          }}
        />
      )}
    </>
    
  );


  
};

// MODES array at the bottom - ALL 8 modes
const MODES: Array<{
  id: AssistantMode;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  darkColor: string;
  isPremium: boolean;
  dashboardPath?: string; // Link to related dashboard
}> = [
  // FREE modes
  {
    id: 'GENERAL_ASSISTANT',
    label: t`General`,
    icon: <Brain className="w-4 h-4" />,
    description: t`Your personal assistant`,
    color: 'from-purple-500 to-indigo-600',
    darkColor: 'dark:from-purple-600 dark:to-indigo-700',
    isPremium: false,
  },
  {
    id: 'TUTOR',
    label: t`Tutor`,
    icon: <BookOpen className="w-4 h-4" />,
    description: t`Learn concepts deeply`,
    color: 'from-emerald-500 to-teal-600',
    darkColor: 'dark:from-emerald-600 dark:to-teal-700',
    isPremium: false,
  },
  {
    id: 'CAREER_COACH',
    label: t`Career`,
    icon: <Briefcase className="w-4 h-4" />,
    description: t`Resume & interview help`,
    color: 'from-blue-500 to-cyan-600',
    darkColor: 'dark:from-blue-600 dark:to-cyan-700',
    isPremium: false,
  },
  {
    id: 'CONTENT_GUIDE',
    label: t`Content`,
    icon: <Sparkles className="w-4 h-4" />,
    description: t`Articles & writing`,
    color: 'from-amber-500 to-orange-600',
    darkColor: 'dark:from-amber-600 dark:to-orange-700',
    isPremium: false,
  },
  
  // PREMIUM modes (visible but locked)
  {
    id: 'DECISION_ARCHITECT',
    label: t`Decision`,
    icon: <Scale className="w-4 h-4" />,
    description: t`Strategic decisions`,
    color: 'from-violet-500 to-purple-600',
    darkColor: 'dark:from-violet-600 dark:to-purple-700',
    isPremium: true,
    dashboardPath: '/dashboard/assistant?tab=decision-journal'
  },
  {
    id: 'LIFE_COACH',
    label: t`Life Coach`,
    icon: <Heart className="w-4 h-4" />,
    description: t`Personal growth`,
    color: 'from-rose-500 to-pink-600',
    darkColor: 'dark:from-rose-600 dark:to-pink-700',
    isPremium: true,
    dashboardPath: '/dashboard/assistant?tab=life-dashboard'
  },
  {
    id: 'SECOND_BRAIN',
    label: t`Brain`,
    icon: <Network className="w-4 h-4" />,
    description: t`Organize thoughts`,
    color: 'from-sky-500 to-blue-600',
    darkColor: 'dark:from-sky-600 dark:to-blue-700',
    isPremium: true,
    dashboardPath: '/dashboard/assistant?tab=brain-dashboard'
  },
  {
    id: 'FUTURE_SIMULATOR',
    label: t`Future`,
    icon: <LineChart className="w-4 h-4" />,
    description: t`Path simulation`,
    color: 'from-indigo-500 to-blue-600',
    darkColor: 'dark:from-indigo-600 dark:to-blue-700',
    isPremium: true,
    dashboardPath: '/dashboard/assistant?tab=growth-analytics'
  },
];


// Upgrade Modal Component
const UpgradeModal: React.FC<{
  mode: typeof MODES[0];
  onClose: () => void;
  onUpgrade: () => void;
}> = ({ mode, onClose, onUpgrade }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card rounded-xl shadow-2xl border border-border animate-in zoom-in-95 duration-300">
        <div className={`p-6 rounded-t-xl bg-gradient-to-r ${mode.color} ${mode.darkColor} text-white`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 rounded-xl">
              {mode.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold">{mode.label} Mode</h3>
              <p className="text-white/80 text-sm">{mode.description}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Crown className="w-5 h-5" />
            <span className="font-semibold">Premium Feature</span>
          </div>
          
          <p className="text-muted-foreground">
            Unlock {mode.label} mode and all premium features including:
          </p>
          
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>Strategic decision analysis with pros/cons</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>Emotional intelligence and life coaching</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>Second Brain knowledge management</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>Future path simulation and comparison</span>
            </li>
            <li className="flex items-center gap-2 text-sm font-medium text-primary">
              <Check className="w-4 h-4" />
              <span>All dashboards: Life, Brain, Decisions, Growth</span>
            </li>
          </ul>
          
          <div className="pt-4 flex gap-3">
            <button
              onClick={onUpgrade}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Upgrade Now
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition"
            >
              Maybe Later
            </button>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};














// // components/assistant/AssistantChat.tsx - COMPLETE WORKING VERSION
// import React, { useState, useRef, useEffect, useCallback } from 'react';
// import { 
//   Send, 
//   Bot, 
//   User, 
//   Sparkles, 
//   BookOpen, 
//   Briefcase,
//   Brain,
//   Clock,
//   Zap,
//   Loader2,
//   X,
//   Maximize2,
//   Minimize2,
//   Settings,
//   History,
//   RefreshCw,
//   MessageCircle,
//   Copy,
//   Check,
//   MoreVertical,
//   Star,
//   Pin,
//   Mic,
//   MicOff,
//   Volume2,
//   VolumeX
// } from 'lucide-react';
// import { useAssistant } from '../../hooks/useAssistant';
// import { useAssistantHistory } from '../../hooks/useAssistantHistory';
// import { AssistantMode, AssistantMessage, Conversation } from '../../types/assistant';
// import { t } from "@lingui/macro";
// import { MemoryPanel } from './MemoryPanel';
// import { toast } from 'sonner';
// import ReactMarkdown from 'react-markdown';



// // Add the RateLimitMessage component HERE (outside the main component)
// const RateLimitMessage: React.FC<{ 
//   message: AssistantMessage; 
//   onUpgradeClick?: () => void;
// }> = ({ message, onUpgradeClick }) => {
//   const metadata = message.metadata as any;
//   const upgradeLink = metadata?.upgradeLink || '/dashboard/pricing';
//   const remaining = metadata?.remainingMessages || 0;
//   const limit = metadata?.limit || 20;
//   const resetTime = metadata?.resetTime ? new Date(metadata.resetTime) : null;
  
//   const handleUpgradeClick = () => {
//     if (onUpgradeClick) {
//       onUpgradeClick();
//     } else {
//       window.open(upgradeLink, '_blank');
//     }
//   };
  
//   return (
//     <div className="rate-limit-message rounded-lg p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700">
//       <div className="flex items-start gap-3">
//         <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
//           <span className="text-amber-600 dark:text-amber-300">⚠️</span>
//         </div>
//         <div className="flex-1">
//           <div className="markdown-content prose dark:prose-invert max-w-none">
//             <ReactMarkdown
//               components={{
//                 a: ({ node, href, children, ...props }) => (
//                   <a 
//                     href={href}
//                     className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     {...props}
//                   >
//                     {children}
//                   </a>
//                 ),
//                 p: ({ node, ...props }) => <p className="my-2" {...props} />,
//                 strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
//               }}
//             >
//               {message.content}
//             </ReactMarkdown>
//           </div>
//           <div className="mt-4 flex flex-wrap gap-3">
//             <button
//               onClick={handleUpgradeClick}
//               className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
//             >
//               <Sparkles className="w-4 h-4" />
//               Upgrade to Premium
//             </button>
//             <button
//               onClick={() => window.location.reload()}
//               className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
//             >
//               Try Again
//             </button>
//           </div>
//           <div className="mt-3 text-sm text-amber-700 dark:text-amber-300">
//             <div className="flex items-center gap-2">
//               <Clock className="w-4 h-4" />
//               <span>
//                 {remaining > 0 
//                   ? `${remaining} messages remaining today`
//                   : `Limit resets ${resetTime ? `at ${resetTime.toLocaleTimeString()}` : 'tomorrow'}`
//                 }
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // VOICE OUTPUT: Speaking indicator component
// const SpeakingIndicator: React.FC<{ isSpeaking: boolean }> = ({ isSpeaking }) => {
//   if (!isSpeaking) return null;
  
//   return (
//     <div className="flex items-center gap-1 ml-2" title="Assistant is speaking">
//       <div className="flex items-center justify-center space-x-[2px]">
//         <div className="w-[2px] h-2 bg-blue-500 dark:bg-blue-400 animate-[pulse_0.6s_ease-in-out_infinite] rounded-full"></div>
//         <div className="w-[2px] h-3 bg-blue-500 dark:bg-blue-400 animate-[pulse_0.6s_ease-in-out_infinite_0.1s] rounded-full"></div>
//         <div className="w-[2px] h-2 bg-blue-500 dark:bg-blue-400 animate-[pulse_0.6s_ease-in-out_infinite_0.2s] rounded-full"></div>
//         <div className="w-[2px] h-3 bg-blue-500 dark:bg-blue-400 animate-[pulse_0.6s_ease-in-out_infinite_0.3s] rounded-full"></div>
//         <div className="w-[2px] h-2 bg-blue-500 dark:bg-blue-400 animate-[pulse_0.6s_ease-in-out_infinite_0.4s] rounded-full"></div>
//       </div>
//       <span className="text-xs text-muted-foreground ml-1">Speaking</span>
//     </div>
//   );
// };

// interface AssistantChatProps {
//   isMobilePopup?: boolean;
//   memories?: any[];
//   conversations?: Conversation[];
//   selectedConversation?: Conversation | null;
//   onConversationLoaded?: () => void;
//   onClearConversation?: () => void;
//   onClose?: () => void;
// }

// export const AssistantChat: React.FC<AssistantChatProps> = ({ 
//   isMobilePopup = false,
//   memories = [],
//   conversations = [],
//   selectedConversation = null,
//   onConversationLoaded,
//   onClearConversation,
//   onClose
// }) => {
//   const [input, setInput] = useState('');
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [showHistoryPopup, setShowHistoryPopup] = useState(false);
//   const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
//   const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
//   const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  
//   // VOICE INPUT & OUTPUT STATE
//   const [isListening, setIsListening] = useState(false);
//   const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [interimTranscript, setInterimTranscript] = useState('');
//   const [voiceSupported, setVoiceSupported] = useState<{
//     input: boolean;
//     output: boolean;
//   }>({ input: false, output: false });
  
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLTextAreaElement>(null);
//   const messagesContainerRef = useRef<HTMLDivElement>(null);
//   const menuRef = useRef<HTMLDivElement>(null);
  
//   // VOICE INPUT & OUTPUT REFS
//   const recognitionRef = useRef<any>(null);
//   const synthesisRef = useRef<SpeechSynthesis | null>(null);
//   const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
//   const {
//     messages,
//     sendMessage,
//     isLoading,
//     error,
//     mode,
//     switchMode,
//     clearConversation,
//     loadConversation,
//     currentConversationId,
//     startNewConversation,
//     userTier,
//     rateLimitInfo,
//     getAuthHeaders
//   } = useAssistant();

//   const {
//     conversations: fetchedConversations,
//     isLoading: isLoadingHistory,
//     error: historyError,
//     fetchConversations,
//     fetchConversationMessages,
//     clearConversation: clearConversationApi,
//     getConversationStats,
//   } = useAssistantHistory();

//   // VOICE OUTPUT: Initialize voice synthesis and check support
//   useEffect(() => {
//     // Check browser support with safe type checking
//     const inputSupported = (
//       typeof window !== 'undefined' && 
//       (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window))
//     );
    
//     const outputSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    
//     setVoiceSupported({ 
//       input: inputSupported, 
//       output: outputSupported 
//     });
    
//     if (outputSupported) {
//       synthesisRef.current = window.speechSynthesis;
      
//       // Get available voices - define loadVoices here to fix the error
//       const loadVoices = () => {
//         const voices = synthesisRef.current?.getVoices();
//         if (voices && voices.length > 0) {
//           console.log('Available TTS voices:', voices.length);
//         }
//       };
      
//       // Chrome loads voices asynchronously
//       if (synthesisRef.current?.getVoices().length > 0) {
//         loadVoices();
//       } else {
//         synthesisRef.current?.addEventListener('voiceschanged', loadVoices);
//       }
      
//       // Cleanup function
//       return () => {
//         if (synthesisRef.current) {
//           synthesisRef.current.removeEventListener('voiceschanged', loadVoices);
//           synthesisRef.current.cancel();
//         }
//       };
//     }
    
//     return () => {
//       // Clean up voice synthesis
//       if (synthesisRef.current) {
//         synthesisRef.current.cancel();
//       }
//     };
//   }, []);

//   // VOICE OUTPUT: Speak assistant messages automatically
//   useEffect(() => {
//     if (!voiceSupported.output || !isVoiceEnabled) return;
    
//     // Get the latest assistant message
//     const lastMessage = messages[messages.length - 1];
//     if (!lastMessage || lastMessage.role !== 'assistant') return;
    
//     // Don't speak if it's a rate limit message
//     if (lastMessage.metadata?.isRateLimitMessage) return;
    
//     // Don't speak the same message twice
//     if (lastMessage.content === currentUtteranceRef.current?.text) return;
    
//     // Speak the message
//     speakMessage(lastMessage.content);
    
//     return () => {
//       // Clean up on unmount or before new speech
//       if (synthesisRef.current && isSpeaking) {
//         synthesisRef.current.cancel();
//       }
//     };
//   }, [messages, isVoiceEnabled, voiceSupported.output, isSpeaking]);

//   // VOICE INPUT: Initialize speech recognition with proper error handling
//   useEffect(() => {
//     if (!voiceSupported.input || typeof window === 'undefined') return;
    
//     try {
//       // Safely access SpeechRecognition with proper type handling
//       const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
//       if (!SpeechRecognition) {
//         console.warn('SpeechRecognition API not available');
//         setVoiceSupported(prev => ({ ...prev, input: false }));
//         return;
//       }
      
//       recognitionRef.current = new SpeechRecognition();
//       recognitionRef.current.continuous = false;
//       recognitionRef.current.interimResults = true;
//       recognitionRef.current.maxAlternatives = 1;
      
//       // Try multiple language codes
//       const tryLanguages = ['en-US', 'en-GB', 'en'];
//       let langSet = false;
      
//       for (const lang of tryLanguages) {
//         try {
//           recognitionRef.current.lang = lang;
//           langSet = true;
//           console.log(`Speech recognition language set to: ${lang}`);
//           break;
//         } catch (e) {
//           console.log(`Language ${lang} not supported`);
//         }
//       }
      
//       if (!langSet) {
//         recognitionRef.current.lang = 'en-US'; // Default fallback
//       }
      
//       recognitionRef.current.onstart = () => {
//         console.log('Speech recognition started');
//         setIsListening(true);
//         setInterimTranscript('');
//       };
      
//       recognitionRef.current.onresult = (event: any) => {
//         let interim = '';
//         let final = '';
        
//         for (let i = event.resultIndex; i < event.results.length; i++) {
//           const result = event.results[i];
//           if (result[0]?.transcript) {
//             const transcript = result[0].transcript;
//             if (result.isFinal) {
//               final += transcript;
//             } else {
//               interim += transcript;
//             }
//           }
//         }
        
//         if (interim) {
//           setInterimTranscript(interim);
//         }
        
//         if (final) {
//           console.log('Speech recognition final result:', final);
//           handleVoiceInput(final);
//         }
//       };
      
//       recognitionRef.current.onerror = (event: any) => {
//         console.error('Speech recognition error:', event.error, event.message);
//         setIsListening(false);
//         setInterimTranscript('');
        
//         // Handle specific errors
//         switch (event.error) {
//           case 'network':
//             console.warn('Network error - speech recognition requires internet connection');
//             toast.error(
//               t`Voice recognition requires internet connection. Please check your connection and try again.`,
//               {
//                 duration: 5000,
//               }
//             );
//             break;
            
//           case 'not-allowed':
//           case 'permission-denied':
//             toast.error(
//               t`Microphone permission denied. Please allow microphone access in your browser settings.`,
//               {
//                 action: {
//                   label: 'Guide',
//                   onClick: () => window.open('https://support.google.com/chrome/answer/2693767', '_blank')
//                 }
//               }
//             );
//             break;
            
//           case 'audio-capture':
//             toast.error(t`No microphone detected. Please connect a microphone.`);
//             break;
            
//           case 'no-speech':
//             toast.error(t`No speech detected. Please speak clearly.`);
//             break;
            
//           case 'aborted':
//             // User manually stopped, no need to show error
//             break;
            
//           default:
//             console.warn(`Speech recognition error: ${event.error}`);
//             toast.error(t`Voice input unavailable. Please try typing instead.`);
//         }
//       };
      
//       recognitionRef.current.onend = () => {
//         console.log('Speech recognition ended');
//         setIsListening(false);
//         setInterimTranscript('');
//       };
      
//       // Add nomatch event handler
//       recognitionRef.current.onnomatch = () => {
//         console.log('No speech recognized');
//         toast.info(t`Could not recognize speech. Please try again.`);
//       };
      
//     } catch (error) {
//       console.error('Failed to initialize speech recognition:', error);
//       setVoiceSupported(prev => ({ ...prev, input: false }));
//       toast.error(t`Voice input not supported in this browser.`);
//     }
    
//     return () => {
//       if (recognitionRef.current) {
//         try {
//           recognitionRef.current.stop();
//         } catch (error) {
//           // Silent cleanup
//         }
//       }
//     };
//   }, [voiceSupported.input]);

//   // VOICE INPUT: Handle successful speech recognition
//   const handleVoiceInput = useCallback(async (text: string) => {
//     if (!text.trim()) return;
    
//     const trimmedText = text.trim();
//     setInput(trimmedText);
    
//     // Send the message after a brief pause
//     setTimeout(async () => {
//       try {
//         await sendMessage(trimmedText);
//       } catch (err) {
//         console.error('Failed to send voice message:', err);
//         toast.error(t`Failed to send voice message`);
//       }
//     }, 300);
//   }, [sendMessage]);

//   // VOICE INPUT: Start listening with network check
//   const startVoiceInput = useCallback(() => {
//     if (!voiceSupported.input) {
//       toast.error(t`Voice input is not supported in your browser`);
//       return;
//     }
    
//     if (isListening) {
//       stopVoiceInput();
//       return;
//     }
    
//     // Check network connectivity
//     if (!navigator.onLine) {
//       toast.error(
//         t`You're offline. Voice recognition requires an internet connection.`,
//         { duration: 4000 }
//       );
//       return;
//     }
    
//     try {
//       if (recognitionRef.current) {
//         recognitionRef.current.start();
        
//         // Show immediate feedback
//         toast.info(t`Listening... Speak now`, {
//           duration: 2000,
//           icon: '🎤',
//         });
        
//         // Auto-stop after 10 seconds if no speech detected
//         const timeoutId = setTimeout(() => {
//           if (isListening && !interimTranscript) {
//             stopVoiceInput();
//             toast.info(t`Listening timed out. Click the mic to try again.`);
//           }
//         }, 10000);
        
//         // Clean up timeout
//         return () => clearTimeout(timeoutId);
//       }
//     } catch (error: any) {
//       console.error('Error starting voice input:', error);
      
//       // Handle specific startup errors
//       if (error instanceof DOMException) {
//         switch (error.name) {
//           case 'NotAllowedError':
//             toast.error(
//               t`Microphone access blocked. Please allow microphone access in your browser settings.`,
//               { duration: 6000 }
//             );
//             break;
//           case 'NotFoundError':
//             toast.error(t`No microphone found. Please connect a microphone.`);
//             break;
//           case 'NetworkError':
//             toast.error(t`Network error. Please check your internet connection.`);
//             break;
//           default:
//             toast.error(t`Could not start voice input: ${error.message || 'Unknown error'}`);
//         }
//       } else {
//         toast.error(t`Voice input failed to start. Please try again.`);
//       }
//     }
//   }, [voiceSupported.input, isListening, interimTranscript]);

//   // VOICE INPUT: Stop listening
//   const stopVoiceInput = useCallback(() => {
//     if (recognitionRef.current && isListening) {
//       try {
//         recognitionRef.current.stop();
//       } catch (error) {
//         console.error('Error stopping voice input:', error);
//       }
//     }
//   }, [isListening]);

//   // VOICE OUTPUT: Speak text
//   const speakMessage = useCallback((text: string) => {
//     if (!voiceSupported.output || !isVoiceEnabled || !synthesisRef.current) return;
    
//     // Cancel any ongoing speech
//     if (synthesisRef.current.speaking) {
//       synthesisRef.current.cancel();
//     }
    
//     // Create utterance
//     const utterance = new SpeechSynthesisUtterance(text);
//     currentUtteranceRef.current = utterance;
    
//     // Configure voice
//     const voices = synthesisRef.current.getVoices();
//     const preferredVoices = voices.filter(voice => 
//       voice.name.includes('Google') || 
//       voice.name.includes('Natural') || 
//       voice.name.includes('Samantha') ||
//       voice.name.includes('Microsoft')
//     );
    
//     if (preferredVoices.length > 0) {
//       utterance.voice = preferredVoices[0];
//     }
    
//     // Configure settings for assistant-like speech
//     utterance.rate = 1.0; // Normal speed
//     utterance.pitch = 1.0; // Normal pitch
//     utterance.volume = 0.9; // Slightly lower volume for better UX
    
//     // Event handlers
//     utterance.onstart = () => {
//       setIsSpeaking(true);
//     };
    
//     utterance.onend = () => {
//       setIsSpeaking(false);
//       currentUtteranceRef.current = null;
//     };
    
//     utterance.onerror = (event: any) => {
//       console.error('Speech synthesis error:', event);
//       setIsSpeaking(false);
//       currentUtteranceRef.current = null;
//     };
    
//     // Speak
//     synthesisRef.current.speak(utterance);
//   }, [voiceSupported.output, isVoiceEnabled]);

//   // VOICE OUTPUT: Stop speaking
//   const stopSpeaking = useCallback(() => {
//     if (synthesisRef.current && synthesisRef.current.speaking) {
//       synthesisRef.current.cancel();
//       setIsSpeaking(false);
//       currentUtteranceRef.current = null;
//     }
//   }, []);

//   // VOICE OUTPUT: Toggle voice output
//   const toggleVoiceOutput = useCallback(() => {
//     if (!voiceSupported.output) {
//       toast.error(t`Voice output is not supported in your browser`);
//       return;
//     }
    
//     if (isSpeaking) {
//       stopSpeaking();
//     }
    
//     const newVoiceEnabled = !isVoiceEnabled;
//     setIsVoiceEnabled(newVoiceEnabled);
    
//     toast.success(
//       newVoiceEnabled 
//         ? t`Voice output enabled` 
//         : t`Voice output disabled`
//     );
//   }, [voiceSupported.output, isVoiceEnabled, isSpeaking, stopSpeaking]);

//   // Close menu when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
//         setShowMessageMenu(null);
//       }
//     };
    
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   useEffect(() => {
//     const loadSelectedConversation = async () => {
//       if (selectedConversation) {
//         console.log('Loading selected conversation from parent:', selectedConversation);
//         await handleSelectConversation(selectedConversation);
        
//         if (onConversationLoaded) {
//           onConversationLoaded();
//         }
//       }
//     };
    
//     loadSelectedConversation();
//   }, [selectedConversation]);

//   // Auto-scroll to bottom
//   useEffect(() => {
//     if (shouldAutoScroll && messagesEndRef.current) {
//       messagesEndRef.current.scrollIntoView({ 
//         behavior: 'smooth',
//         block: 'end'
//       });
//     }
//   }, [messages, shouldAutoScroll]);

//   // Auto-resize textarea
//   useEffect(() => {
//     if (inputRef.current) {
//       setShouldAutoScroll(false);
//       inputRef.current.style.height = 'auto';
//       const newHeight = Math.min(inputRef.current.scrollHeight, 150);
//       inputRef.current.style.height = `${newHeight}px`;
//       setTimeout(() => setShouldAutoScroll(true), 50);
//     }
//   }, [input]);

//   // Prevent body scroll
//   useEffect(() => {
//     if (showHistoryPopup || isExpanded) {
//       document.body.style.overflow = 'hidden';
//     } else if (!isMobilePopup) {
//       document.body.style.overflow = 'unset';
//     }
    
//     return () => {
//       if (!isMobilePopup) document.body.style.overflow = 'unset';
//     };
//   }, [showHistoryPopup, isExpanded, isMobilePopup]);

//   // Handle user scroll behavior
//   const handleScroll = useCallback(() => {
//     if (messagesContainerRef.current) {
//       const container = messagesContainerRef.current;
//       const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
//       setShouldAutoScroll(isNearBottom);
//     }
//   }, []);

//   // Copy message to clipboard
//   const handleCopyMessage = useCallback(async (content: string, messageId: string) => {
//     try {
//       await navigator.clipboard.writeText(content);
//       setCopiedMessageId(messageId);
//       toast.success(t`Message copied to clipboard`);
//       setTimeout(() => setCopiedMessageId(null), 2000);
//     } catch (err) {
//       console.error('Failed to copy:', err);
//       const textArea = document.createElement('textarea');
//       textArea.value = content;
//       document.body.appendChild(textArea);
//       textArea.select();
//       document.execCommand('copy');
//       document.body.removeChild(textArea);
//       setCopiedMessageId(messageId);
//       toast.success(t`Message copied to clipboard`);
//       setTimeout(() => setCopiedMessageId(null), 2000);
//     }
//     setShowMessageMenu(null);
//   }, []);

//   // Format time
//   const formatTime = useCallback((date: Date) => {
//     return new Date(date).toLocaleTimeString([], { 
//       hour: '2-digit', 
//       minute: '2-digit'
//     });
//   }, []);

//   // Handle message submission
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!input.trim() || isLoading) return;

//     const message = input.trim();
//     const currentScrollTop = messagesContainerRef.current?.scrollTop || 0;
    
//     setInput('');
    
//     try {
//       await sendMessage(message);
      
//       if (messages.length === 0) {
//         fetchConversations();
//       }
      
//       if (messagesContainerRef.current) {
//         messagesContainerRef.current.scrollTop = currentScrollTop;
//         setTimeout(() => {
//           if (shouldAutoScroll && messagesEndRef.current) {
//             messagesEndRef.current.scrollIntoView({ 
//               behavior: 'smooth',
//               block: 'end'
//             });
//           }
//         }, 100);
//       }
//     } catch (err) {
//       console.error('Failed to send message:', err);
//       toast.error(t`Failed to send message`);
//     }
//   };

//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
//       e.preventDefault();
//       handleSubmit(e);
//     }
//   };

//   const handleSelectConversation = useCallback(async (conversation: Conversation) => {
//     console.log('Selected conversation:', conversation);
    
//     try {
//       const headers = getAuthHeaders();
//       const response = await fetch(`/api/assistant/conversations/${conversation.id}/messages`, {
//         headers,
//       });
      
//       if (!response.ok) {
//         throw new Error('Failed to fetch messages');
//       }
      
//       const result = await response.json();
      
//       if (result.success && result.data) {
//         const messages: AssistantMessage[] = result.data.map((msg: any) => ({
//           id: msg.id,
//           role: msg.role,
//           content: msg.content,
//           timestamp: new Date(msg.createdAt || msg.updatedAt || Date.now()),
//           metadata: msg.metadata || {},
//         }));
        
//         loadConversation(messages, conversation.mode as AssistantMode);
        
//         setShowHistoryPopup(false);
//         toast.success(t`Loaded conversation from ${new Date(conversation.updatedAt).toLocaleDateString()}`);
//       } else {
//         toast.error(t`No messages found in this conversation`);
//       }
//     } catch (err) {
//       console.error('Failed to load conversation:', err);
//       toast.error(t`Failed to load conversation`);
//     }
//   }, [loadConversation, getAuthHeaders]);

//   // Clear conversation
//   const handleClearConversation = useCallback(async () => {
//     if (currentConversationId) {
//       try {
//         await clearConversationApi(currentConversationId);
//         toast.success(t`Conversation cleared`);
//       } catch (err) {
//         console.error('Failed to clear conversation from backend:', err);
//         toast.error(t`Failed to clear conversation from server`);
//       }
//     }
    
//     clearConversation();
    
//     try {
//       await startNewConversation();
//     } catch (err) {
//       console.error('Failed to start new conversation:', err);
//     }
    
//     if (onClearConversation) onClearConversation();
//   }, [currentConversationId, clearConversationApi, clearConversation, startNewConversation, onClearConversation]);

//   const handleClose = () => {
//     if (onClose) onClose();
//   };

//   const handleSwitchMode = (newMode: AssistantMode) => {
//     switchMode(newMode);
//     clearConversation();
//     startNewConversation();
//     fetchConversations();
//   };

//   const handlePinMessage = (messageId: string) => {
//     console.log('Pin message:', messageId);
//     toast.info(t`Pinning messages will be available soon`);
//     setShowMessageMenu(null);
//   };

//   const handleStarMessage = (messageId: string) => {
//     console.log('Star message:', messageId);
//     toast.info(t`Starring messages will be available soon`);
//     setShowMessageMenu(null);
//   };

//   const renderMarkdown = useCallback((content: string) => {
//     return (
//       <ReactMarkdown
//         components={{
//           a: ({ node, href, children, ...props }) => {
//             const isArticleLink = href?.includes('/dashboard/article/') || 
//                                 href?.includes('/article/');
            
//             if (!isArticleLink) {
//               return (
//                 <a href={href} {...props}>
//                   {children}
//                 </a>
//               );
//             }
            
//             const isDarkMode = typeof document !== 'undefined' && 
//                               document.documentElement.classList.contains('dark');
            
//             const lightColor = '#2563eb';
//             const darkColor = '#60a5fa';
//             const lightHoverColor = '#1d4ed8';
//             const darkHoverColor = '#93c5fd';
            
//             const baseColor = isDarkMode ? darkColor : lightColor;
//             const hoverColor = isDarkMode ? darkHoverColor : lightHoverColor;
//             const borderColor = isDarkMode ? 'rgba(96, 165, 250, 0.3)' : 'rgba(37, 99, 235, 0.3)';
//             const hoverBorderColor = isDarkMode ? darkHoverColor : lightHoverColor;
//             const hoverBgColor = isDarkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.05)';
            
//             return (
//               <a 
//                 href={href}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 onClick={(e) => {
//                   e.preventDefault();
//                   console.log('Article clicked:', href);
//                   window.open(href, '_blank');
//                 }}
//                 style={{
//                   color: baseColor,
//                   textDecoration: 'none',
//                   fontWeight: '500',
//                   borderBottom: `1px solid ${borderColor}`,
//                   paddingBottom: '1px',
//                   display: 'inline-block',
//                   position: 'relative',
//                   transition: 'all 0.2s ease',
//                   cursor: 'pointer',
//                 }}
//                 onMouseEnter={(e) => {
//                   e.currentTarget.style.color = hoverColor;
//                   e.currentTarget.style.borderBottomColor = hoverBorderColor;
//                   e.currentTarget.style.transform = 'translateY(-1px)';
//                   e.currentTarget.style.backgroundColor = hoverBgColor;
//                   e.currentTarget.style.borderRadius = '2px';
//                   e.currentTarget.style.padding = '0 2px';
//                   e.currentTarget.style.margin = '0 -2px';
//                 }}
//                 onMouseLeave={(e) => {
//                   e.currentTarget.style.color = baseColor;
//                   e.currentTarget.style.borderBottomColor = borderColor;
//                   e.currentTarget.style.transform = '';
//                   e.currentTarget.style.backgroundColor = '';
//                   e.currentTarget.style.borderRadius = '';
//                   e.currentTarget.style.padding = '0';
//                   e.currentTarget.style.paddingBottom = '1px';
//                   e.currentTarget.style.margin = '0';
//                 }}
//                 {...props}
//               >
//                 {children}
//                 <span style={{
//                   fontSize: '0.75em',
//                   opacity: 0.7,
//                   marginLeft: '2px',
//                 }}>
//                   🔗
//                 </span>
//               </a>
//             );
//           },
//           h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
//           h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
//           h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-2 mb-1" {...props} />,
//           ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2" {...props} />,
//           ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2" {...props} />,
//           li: ({ node, ...props }) => <li className="my-1" {...props} />,
//           code: ({ node, className, children, ...props }) => {
//             const match = /language-(\w+)/.exec(className || '');
//             const isInline = !className || !match;
            
//             if (isInline) {
//               return (
//                 <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm" {...props}>
//                   {children}
//                 </code>
//               );
//             }
            
//             return (
//               <div className="relative my-3">
//                 <div className="absolute top-0 right-0 px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded-bl">
//                   {match ? match[1] : 'code'}
//                 </div>
//                 <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
//                   <code className={className} {...props}>
//                     {children}
//                   </code>
//                 </pre>
//               </div>
//             );
//           },
//           blockquote: ({ node, ...props }) => (
//             <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 italic" {...props} />
//           ),
//           p: ({ node, children, ...props }) => {
//             const hasArticleLink = React.Children.toArray(children).some(child => 
//               React.isValidElement(child) && 
//               child.type === 'a' && 
//               child.props.href?.includes('/dashboard/article/')
//             );
            
//             return (
//               <p 
//                 className={hasArticleLink ? "article-paragraph" : ""}
//                 {...props}
//               >
//                 {children}
//               </p>
//             );
//           },
//         }}
//       >
//         {content}
//       </ReactMarkdown>
//     );
//   }, []);

//   const selectedMode = MODES.find(m => m.id === mode);
//   const displayConversations = fetchedConversations.length > 0 ? fetchedConversations : conversations;

//   return (
//     <>
//       {/* History/Memory Popup */}
//       {showHistoryPopup && (
//         <div 
//           className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
//           onClick={(e) => {
//             if (e.target === e.currentTarget) {
//               setShowHistoryPopup(false);
//             }
//           }}
//         >
//           <div className="relative w-full max-w-4xl h-full max-h-[90vh] bg-card rounded-xl shadow-2xl border border-border animate-in slide-in-from-bottom duration-300">
//             <button
//               onClick={() => setShowHistoryPopup(false)}
//               className="absolute -top-4 -right-4 md:-top-4 text-destructive md:-right-4 z-50 p-2 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:bg-destructive/90 transition-colors"
//               aria-label={t`Close history`}
//               title={t`Close`}
//             >
//               <X className="w-4 h-4 md:w-5 md:h-5" />
//             </button>
            
//             <MemoryPanel 
//               memories={memories} 
//               conversations={displayConversations}
//               onSelectMemory={(memory) => {
//                 console.log('Selected memory:', memory);
//                 setShowHistoryPopup(false);
//               }}
//               onSelectConversation={handleSelectConversation}
//               onClose={() => setShowHistoryPopup(false)}
//             />
//           </div>
//         </div>
//       )}

//       {/* Expanded Mode Backdrop */}
//       {isExpanded && !isMobilePopup && (
//         <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xl animate-in fade-in duration-300" />
//       )}

//       {/* Main Chat Container */}
//       <div 
//         className={`
//           flex flex-col h-full bg-card text-foreground
//           overflow-hidden transition-all duration-300
//           ${isExpanded && !isMobilePopup 
//             ? 'fixed inset-4 md:inset-8 lg:inset-12 xl:inset-16 z-50 rounded-2xl shadow-2xl' 
//             : 'h-full rounded-xl shadow-lg'
//           }
//           ${isMobilePopup ? 'rounded-none shadow-none' : 'md:rounded-xl md:shadow-lg'}
//         `}
//       >
//         {/* Header */}
//         <div className={`flex items-center justify-between p-3 md:p-4 border-b border-border bg-card ${isExpanded && !isMobilePopup ? 'rounded-t-2xl' : ''}`}>
//           <div className="flex items-center gap-2 md:gap-3">
//             <div className="relative mr-2">
//               <div className={`
//                 w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-border
//                 flex items-center justify-center
//                 ${selectedMode?.color} ${selectedMode?.darkColor}
//               `}>
//                 <img 
//                   src="/assets/assistant.jpeg" 
//                   alt="Assistant"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-card"></div>
//             </div>
//             <div>
//               <h2 className="text-sm md:text-lg font-semibold">{t`Assistant`}</h2>
//               {!isMobilePopup && (
//                 <p className="hidden md:block text-xs md:text-sm text-muted-foreground mt-0.5">
//                   {selectedMode?.description || t`Your personalized AI assistant`}
//                 </p>
//               )}
//             </div>
            
//             {/* VOICE OUTPUT: Speaking indicator in header */}
//             {isSpeaking && (
//               <SpeakingIndicator isSpeaking={isSpeaking} />
//             )}
//           </div>
          
//           <div className="flex items-center gap-1 md:gap-2">
//             {/* VOICE OUTPUT: Toggle button */}
//             {voiceSupported.output && (
//               <button
//                 onClick={toggleVoiceOutput}
//                 className={`
//                   p-1.5 md:p-2 rounded-lg transition-colors relative
//                   ${isVoiceEnabled 
//                     ? 'text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30' 
//                     : 'text-muted-foreground hover:bg-muted hover:text-foreground'
//                   }
//                 `}
//                 title={isVoiceEnabled ? t`Voice output enabled` : t`Voice output disabled`}
//                 aria-label={isVoiceEnabled ? t`Disable voice output` : t`Enable voice output`}
//               >
//                 {isVoiceEnabled ? (
//                   <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
//                 ) : (
//                   <VolumeX className="w-4 h-4 md:w-5 md:h-5" />
//                 )}
//                 {isVoiceEnabled && (
//                   <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
//                 )}
//               </button>
//             )}
            
//             {!isMobilePopup && (
//               <button
//                 type="button"
//                 onClick={() => toast.info(t`Settings coming soon`)}
//                 className="p-1.5 md:p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
//                 aria-label={t`Open assistant settings`}
//                 title={t`Settings`}
//               >
//                 <Settings className="w-4 h-4 md:w-5 md:h-5" />
//               </button>
//             )}
            
//             {!isMobilePopup && (
//               <button
//                 onClick={() => setIsExpanded(!isExpanded)}
//                 className="p-1.5 md:p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
//                 title={isExpanded ? t`Minimize` : t`Expand`}
//                 aria-label={isExpanded ? t`Minimize chat` : t`Expand chat`}
//               >
//                 {isExpanded ? <Minimize2 className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />}
//               </button>
//             )}
            
//             <button
//               onClick={handleClearConversation}
//               disabled={isLoading}
//               className="p-1.5 md:p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
//               title={t`Clear conversation`}
//               aria-label={t`Clear conversation`}
//             >
//               <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isLoading ? 'animate-spin' : ''}`} />
//             </button>
            
//             {isMobilePopup && onClose && (
//               <button
//                 onClick={handleClose}
//                 className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
//                 title={t`Close chat`}
//                 aria-label={t`Close chat`}
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Mode Selector */}
//         <div className="px-3 md:px-4 py-2 md:py-3 border-b border-border bg-muted/30 overflow-x-auto scrollbar-thin">
//           <div className="flex gap-1 md:gap-3">
//             {MODES.map((m) => (
//               <button
//                 key={m.id}
//                 onClick={() => handleSwitchMode(m.id)}
//                 className={`
//                   flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2.5 rounded-lg transition-all whitespace-nowrap text-sm md:text-base
//                   ${mode === m.id
//                     ? `bg-gradient-to-r ${m.color} ${m.darkColor} text-white shadow-sm`
//                     : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
//                   }
//                 `}
//                 aria-label={`Switch to ${m.label} mode`}
//                 aria-pressed={mode === m.id}
//               >
//                 {m.icon}
//                 <span className="font-medium">{m.label}</span>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Rate Limit Status Bar */}
//         {userTier === 'FREE' && rateLimitInfo && (
//           <div className="px-3 md:px-4 py-1.5 border-b border-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
//             <div className="flex items-center justify-between text-xs md:text-sm">
//               <div className="flex items-center gap-2">
//                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
//                 <span className="font-medium text-blue-700 dark:text-blue-300">
//                   Free Tier
//                 </span>
//               </div>
//               <div className="flex items-center gap-3">
//                 <div className="text-blue-600 dark:text-blue-400">
//                   {rateLimitInfo.remaining}/{rateLimitInfo.limit} messages today
//                 </div>
//                 <div className="w-24 h-1.5 bg-blue-100 dark:bg-blue-900 rounded-full overflow-hidden">
//                   <div 
//                     className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
//                     style={{ 
//                       width: `${Math.max(5, (rateLimitInfo.remaining / rateLimitInfo.limit) * 100)}%` 
//                     }}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Messages Container */}
//         <div 
//           ref={messagesContainerRef}
//           onScroll={handleScroll}
//           className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-card"
//         >
//           {messages.length === 0 ? (
//             <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 md:py-12">
//               <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-600/30 dark:from-purple-600/10 dark:to-blue-700/30 flex items-center justify-center mb-4 md:mb-6">
//                 <MessageCircle className="w-8 h-8 md:w-12 md:h-12 text-purple-500 dark:text-purple-400" />
//               </div>
//               <h3 className="text-lg md:text-3xl font-bold mb-2 md:mb-4">{t`Hello! I'm your Personal Assistant @Inlirah`}</h3>
//               <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-sm md:max-w-lg">
//                 {selectedMode?.description || t`How can I help you today?`}
//               </p>
              
//               {/* VOICE INPUT: Feature introduction */}
//               {voiceSupported.input && (
//                 <div className="mb-6 md:mb-8 max-w-md">
//                   <div className="flex flex-col items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
//                     <div className="flex items-center gap-2">
//                       <div className={`p-2 rounded-full ${isListening ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
//                         <Mic className={`w-5 h-5 ${isListening ? 'text-red-500 dark:text-red-400' : 'text-blue-500 dark:text-blue-400'}`} />
//                       </div>
//                       <span className="font-medium text-blue-700 dark:text-blue-300">
//                         Try voice input
//                       </span>
//                     </div>
//                     <p className="text-sm text-blue-600 dark:text-blue-400 text-center">
//                       Click the mic button to speak instead of typing
//                     </p>
//                     <div className="text-xs text-blue-500/70 dark:text-blue-400/70">
//                       Requires internet connection & microphone permission
//                     </div>
//                   </div>
//                 </div>
//               )}
              
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 max-w-xs md:max-w-md">
//                 {[
//                   t`Help me improve my resume`,
//                   t`Explain a programming concept`,
//                   t`Suggest articles to read`,
//                   t`Career path guidance`,
//                 ].map((suggestion, i) => (
//                   <button
//                     key={i}
//                     onClick={() => setInput(suggestion)}
//                     className="p-2 md:p-3 text-left bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm md:text-base text-secondary-foreground hover:scale-[1.02] active:scale-[0.98]"
//                   >
//                     {suggestion}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           ) : (
//             <>
//               {messages.map((message) => {
//                 const isRateLimitMessage = message.metadata?.isRateLimitMessage;
                
//                 if (isRateLimitMessage) {
//                   return (
//                     <div key={message.id} className="flex justify-start">
//                       <RateLimitMessage 
//                         message={message}
//                         onUpgradeClick={() => window.open('/dashboard/pricing', '_blank')}
//                       />
//                     </div>
//                   );
//                 }
                
//                 return (
//                   <div
//                     key={message.id}
//                     data-message-id={message.id}
//                     className={`flex group ${
//                       message.role === 'user' ? 'justify-end' : 'justify-start'
//                     }`}
//                   >
//                     <div
//                       className={`
//                         max-w-[85%] md:max-w-[75%] xl:max-w-[65%] rounded-xl p-3 md:p-4 relative
//                         ${message.role === 'user'
//                           ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
//                           : 'bg-secondary text-secondary-foreground'
//                         }
//                         transition-all duration-200 hover:shadow-md
//                       `}
//                     >
//                       <div className="flex items-center justify-between mb-2 md:mb-3">
//                         <div className="flex items-center gap-2 md:gap-3">
//                           <div className={`
//                             p-1.5 md:p-2 rounded-lg
//                             ${message.role === 'user' 
//                               ? 'bg-blue-600/80' 
//                               : 'bg-purple-500/80 dark:bg-purple-600/80'
//                             }
//                           `}>
//                             {message.role === 'user' ? (
//                               <User className="w-3 h-3 md:w-4 md:h-4" />
//                             ) : (
//                               <Bot className="w-3 h-3 md:w-4 md:h-4" />
//                             )}
//                           </div>
//                           <div className="flex items-center gap-1">
//                             <span className="text-sm md:text-base font-medium">
//                               {message.role === 'user' ? t`You` : t`Assistant`}
//                             </span>
//                             {/* VOICE OUTPUT: Speaking indicator on assistant messages */}
//                             {message.role === 'assistant' && isSpeaking && (
//                               <div className="flex items-center ml-1">
//                                 <div className="w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
//                               </div>
//                             )}
//                           </div>
//                           <span className="text-xs md:text-sm opacity-80">
//                             {formatTime(message.timestamp)}
//                           </span>
//                         </div>
                        
//                         <div className="relative" ref={menuRef}>
//                           <button
//                             onClick={() => setShowMessageMenu(
//                               showMessageMenu === message.id ? null : message.id
//                             )}
//                             className={`
//                               p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100
//                               ${message.role === 'user' 
//                                 ? 'text-white/70 hover:text-white hover:bg-white/20' 
//                                 : 'text-muted-foreground hover:text-foreground hover:bg-muted'
//                               }
//                             `}
//                             title={t`More options`}
//                             aria-label={t`Message options`}
//                           >
//                             <MoreVertical className="w-4 h-4" />
//                           </button>
                          
//                           {showMessageMenu === message.id && (
//                             <div className="absolute right-0 top-full mt-1 z-10 w-48 bg-background border border-border rounded-lg shadow-lg animate-in fade-in zoom-in-95">
//                               <div className="py-1">
//                                 <button
//                                   onClick={() => handleCopyMessage(message.content, message.id)}
//                                   className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-center gap-2"
//                                 >
//                                   {copiedMessageId === message.id ? (
//                                     <>
//                                       <Check className="w-5 h-5" />
//                                       <span>{t`Copied!`}</span>
//                                     </>
//                                   ) : (
//                                     <>
//                                       <Copy className="w-5 h-5" />
//                                       <span>{t`Copy message`}</span>
//                                     </>
//                                   )}
//                                 </button>
//                                 {message.role === 'assistant' && voiceSupported.output && (
//                                   <button
//                                     onClick={() => speakMessage(message.content)}
//                                     className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
//                                   >
//                                     <Volume2 className="w-4 h-4" />
//                                     <span>{t`Read aloud`}</span>
//                                   </button>
//                                 )}
//                                 <button
//                                   onClick={() => handlePinMessage(message.id)}
//                                   className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
//                                 >
//                                   <Pin className="w-4 h-4" />
//                                   <span>{t`Pin message`}</span>
//                                 </button>
//                                 <button
//                                   onClick={() => handleStarMessage(message.id)}
//                                   className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
//                                 >
//                                   <Star className="w-4 h-4" />
//                                   <span>{t`Star message`}</span>
//                                 </button>
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                       </div>
                      
//                       <div className="markdown-content text-base md:text-lg leading-relaxed select-text cursor-text">
//                         {renderMarkdown(message.content)}
//                       </div>
                      
//                       {/* Quick copy button on hover */}
//                       <button
//                         onClick={() => handleCopyMessage(message.content, message.id)}
//                         className={`
//                           absolute -bottom-2 right-3 p-1.5 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100
//                           ${message.role === 'user' 
//                             ? 'bg-blue-500 text-white hover:bg-blue-600' 
//                             : 'bg-purple-500 text-white hover:bg-purple-600'
//                           }
//                           transform translate-y-2 group-hover:translate-y-0
//                         `}
//                         title={t`Copy message`}
//                         aria-label={t`Copy message`}
//                       >
//                         {copiedMessageId === message.id ? (
//                           <Check className="w-5 h-5" />
//                         ) : (
//                           <Copy className="w-5 h-5" />
//                         )}
//                       </button>
//                     </div>
//                   </div>
//                 );
//               })}
              
//               {isLoading && (
//                 <div className="flex justify-start">
//                   <div className="max-w-[85%] md:max-w-[75%] xl:max-w-[65%] rounded-xl p-4 bg-secondary animate-pulse">
//                     <div className="flex items-center gap-3">
//                       <Loader2 className="w-5 h-5 animate-spin text-purple-500 dark:text-purple-400" />
//                       <span className="text-base text-muted-foreground">{t`Thinking...`}</span>
//                     </div>
//                   </div>
//                 </div>
//               )}
              
//               {error && (
//                 <div className="flex justify-center animate-in fade-in slide-in-from-top-5">
//                   <div className="max-w-md bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-lg p-4 text-sm flex flex-col gap-2">
//                     <div className="font-medium">{t`Something went wrong`}</div>
//                     <div>{error}</div>
//                     <button
//                       onClick={() => window.location.reload()}
//                       className="text-sm underline hover:text-red-800 dark:hover:text-red-300"
//                     >
//                       {t`Reload chat`}
//                     </button>
//                   </div>
//                 </div>
//               )}
              
//               <div className="h-4 md:h-8" />
//               <div ref={messagesEndRef} />
//             </>
//           )}
//         </div>

//         {/* Input Area */}
//         <div className={`border-t border-border lg:mb-12 p-3 bg-card ${isExpanded && !isMobilePopup ? 'rounded-b-2xl' : ''}`}>
//           <form onSubmit={handleSubmit} className="space-y-2">
//             <div className="relative">
//               {/* VOICE INPUT: Interim transcript display */}
//               {isListening && interimTranscript && (
//                 <div className="absolute -top-10 left-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm rounded-lg p-2 animate-in slide-in-from-top-5 fade-in">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                       <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
//                       <span className="font-medium">Listening...</span>
//                     </div>
//                     <span className="opacity-90 truncate max-w-xs">{interimTranscript}</span>
//                   </div>
//                 </div>
//               )}
              
//               <textarea
//                 ref={inputRef}
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 placeholder={selectedMode?.description || t`Ask me anything...`}
//                 className="
//                   w-full bg-secondary border border-border rounded-lg p-3 pr-24
//                   text-foreground placeholder:text-muted-foreground resize-none 
//                   focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
//                   disabled:opacity-50 disabled:cursor-not-allowed text-base
//                   max-h-32 min-h-[44px] leading-relaxed
//                   transition-all duration-200
//                 "
//                 rows={1}
//                 disabled={isLoading || isListening}
//                 aria-label={t`Message input`}
//               />
              
//               <div className="absolute right-2 bottom-1 flex items-center gap-1">
//                 {/* VOICE INPUT: Mic button */}
//                 {voiceSupported.input && (
//                   <button
//                     type="button"
//                     onClick={startVoiceInput}
//                     disabled={isLoading}
//                     className={`
//                       p-2 rounded-lg transition-all relative
//                       ${isListening
//                         ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg animate-pulse'
//                         : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted'
//                       }
//                       disabled:opacity-50 disabled:cursor-not-allowed
//                       min-w-[44px] min-h-[44px] flex items-center justify-center
//                     `}
//                     aria-label={isListening ? t`Stop listening` : t`Start voice input`}
//                     title={isListening ? t`Stop listening` : t`Speak to assistant`}
//                   >
//                     {isListening ? (
//                       <>
//                         <MicOff className="w-5 h-5" />
//                         {/* Listening animation rings */}
//                         <div className="absolute inset-0 rounded-lg border-2 border-red-400 animate-ping opacity-30"></div>
//                       </>
//                     ) : (
//                       <Mic className="w-5 h-5" />
//                     )}
//                   </button>
//                 )}
                
//                 <button
//                   type="submit"
//                   disabled={!input.trim() || isLoading || isListening}
//                   className={`
//                     p-2 rounded-lg transition-all
//                     ${!input.trim() || isLoading || isListening
//                       ? 'bg-muted text-muted-foreground cursor-not-allowed'
//                       : `bg-gradient-to-r ${selectedMode?.color} ${selectedMode?.darkColor} text-white hover:opacity-90 hover:shadow-md active:scale-95`
//                     }
//                     min-w-[44px] min-h-[44px] flex items-center justify-center
//                     disabled:transform-none
//                   `}
//                   aria-label={t`Send message`}
//                   title={t`Send message (Enter)`}
//                 >
//                   {isLoading ? (
//                     <Loader2 className="w-5 h-5 animate-spin" />
//                   ) : (
//                     <Send className="w-5 h-5" />
//                   )}
//                 </button>
//               </div>
//             </div>
            
//             <div className="flex items-center justify-between text-sm text-muted-foreground">
//               <div className="flex items-center gap-4">
//                 <span className="flex items-center gap-2">
//                   <Zap className="w-4 h-4" />
//                   <span className="hidden md:inline">{t`Personalized responses`}</span>
//                   <span className="md:hidden">{t`Personalized`}</span>
//                 </span>
//                 <span className="flex items-center gap-2">
//                   <Clock className="w-4 h-4" />
//                   <span className="hidden md:inline">{t`Remembers context`}</span>
//                   <span className="md:hidden">{t`Remembers context`}</span>
//                 </span>
                
//                 {/* Voice support indicators */}
//                 {voiceSupported.input && (
//                   <span className="flex items-center gap-2" title="Voice input supported">
//                     <Mic className="w-4 h-4" />
//                     <span className="hidden md:inline">{t`Voice input`}</span>
//                     <span className="md:hidden">{t`Voice`}</span>
//                   </span>
//                 )}
//               </div>
              
//               <button
//                 onClick={() => setShowHistoryPopup(true)}
//                 disabled={isLoading}
//                 className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors hover:shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
//                 aria-label={t`Show chat history`}
//               >
//                 <History className="w-4 h-4" />
//                 <span className="font-medium">
//                   {t`History`} 
//                   <span className="ml-2 text-muted-foreground">
//                     ({displayConversations.length})
//                   </span>
//                 </span>
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </>
//   );
// };

// // Add MODES array at the bottom
// const MODES: Array<{
//   id: AssistantMode;
//   label: string;
//   icon: React.ReactNode;
//   description: string;
//   color: string;
//   darkColor: string;
// }> = [
//   {
//     id: 'GENERAL_ASSISTANT',
//     label: t`General Assistant`,
//     icon: <Brain className="w-4 h-4" />,
//     description: t`Your personal assistant for everything`,
//     color: 'from-purple-500 to-indigo-600',
//     darkColor: 'dark:from-purple-600 dark:to-indigo-700',
//   },
//   {
//     id: 'TUTOR',
//     label: t`Tutor Mode`,
//     icon: <BookOpen className="w-4 h-4" />,
//     description: t`Learn and understand concepts deeply`,
//     color: 'from-emerald-500 to-teal-600',
//     darkColor: 'dark:from-emerald-600 dark:to-teal-700',
//   },
//   {
//     id: 'CAREER_COACH',
//     label: t`Career Coach`,
//     icon: <Briefcase className="w-4 h-4" />,
//     description: t`Resume, interview, and career guidance`,
//     color: 'from-blue-500 to-cyan-600',
//     darkColor: 'dark:from-blue-600 dark:to-cyan-700',
//   },
//   {
//     id: 'CONTENT_GUIDE',
//     label: t`Content Guide`,
//     icon: <Sparkles className="w-4 h-4" />,
//     description: t`Article recommendations and writing help`,
//     color: 'from-amber-500 to-orange-600',
//     darkColor: 'dark:from-amber-600 dark:to-orange-700',
//   },
// ];