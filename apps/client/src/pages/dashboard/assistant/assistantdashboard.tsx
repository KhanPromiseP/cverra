// pages/dashboard/assistant/assistantdashboard.tsx
import React, { useState, useEffect } from 'react';
import { AssistantChat } from '../../../components/assistant/AssistantChat';
import { MemoryPanel } from '../../../components/assistant/MemoryPanel';
import { 
  MessageSquare, 
  Brain, 
  BarChart3,
  PanelLeft,
  MessageCircle,
  Maximize2,
  Minimize2,
  X,
  Loader2
} from 'lucide-react';
import { t } from "@lingui/macro";
import { useAuthStore } from '@/client/stores/auth';

// Import the shared types
import { Conversation } from '../../../types/assistant';

interface Memory {
  id: string;
  topic: string;
  summary: string;
  importance: number;
  contextType: string;
  tags: string[];
  updatedAt: string;
  lastAccessed: string;
}

const AssistantDashboard = () => {
  const [showMemoryPopup, setShowMemoryPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalTokens: 0,
    conversations: 0,
    memories: 0,
  });
  
  const user = useAuthStore((state) => state.user);

  // Fetch memories and conversations
  const fetchData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [memoriesRes, conversationsRes, analyticsRes] = await Promise.all([
        fetch('/api/assistant/memories'),
        fetch('/api/assistant/conversations'),
        fetch('/api/assistant/analytics'),
      ]);

      let conversationsData: Conversation[] = [];
      let memoriesData: Memory[] = [];

      if (memoriesRes.ok) {
        const data = await memoriesRes.json();
        memoriesData = data.data || [];
        setMemories(memoriesData);
      }

      if (conversationsRes.ok) {
        const data = await conversationsRes.json();
        
        // Get the actual conversations array
        const conversationsArray = data.data?.conversations || data.data || [];
        
        // Ensure all required fields exist with defaults
        conversationsData = conversationsArray.map((conv: any): Conversation => ({
          id: conv.id || '',
          title: conv.title || 'Untitled Conversation',
          mode: conv.mode || 'GENERAL_ASSISTANT',
          messageCount: conv.messageCount || conv.totalMessages || conv._count?.messages || 0,
          createdAt: conv.createdAt || new Date().toISOString(),
          updatedAt: conv.updatedAt || conv.lastMessageAt || conv.createdAt || new Date().toISOString(),
          lastMessage: conv.lastMessage || conv.preview || undefined,
        }));
        setConversations(conversationsData);
      }
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setStats({
          totalMessages: analyticsData.totalMessages || 0,
          totalTokens: analyticsData.totalTokens || 0,
          conversations: conversationsData.length || 0,
          memories: memoriesData.length || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch assistant data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent body scroll when popups are open
  useEffect(() => {
    if (showMemoryPopup || showChatPopup || isChatExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMemoryPopup, showChatPopup, isChatExpanded]);

  // Close popups when chat is expanded
  useEffect(() => {
    if (isChatExpanded) {
      setShowMemoryPopup(false);
      setShowChatPopup(false);
    }
  }, [isChatExpanded]);

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSelectConversation = (conversation: Conversation) => {
    console.log('Selected conversation:', conversation);
    setSelectedConversation(conversation);
    setShowMemoryPopup(false);

    if (window.innerWidth < 768) {
      setShowChatPopup(true);
    }
  };

  const handleClearConversation = () => {
    // This would be handled by the AssistantChat component
    console.log('Clear conversation from dashboard');
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleConversationLoaded = () => {
    // Reset after conversation is loaded
    setSelectedConversation(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Memory Panel Popup for Mobile */}
      {showMemoryPopup && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/10 backdrop-blur-xl animate-in fade-in duration-200 md:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMemoryPopup(false);
            }
          }}
        >
          <div className="relative w-full h-full max-h-[90vh] bg-card rounded-xl shadow-2xl border border-border animate-in slide-in-from-bottom duration-300">
            <MemoryPanel 
              memories={memories}
              conversations={conversations}
              onSelectMemory={(memory) => {
                console.log('Selected memory:', memory);
                setShowMemoryPopup(false);
              }}
              onSelectConversation={handleSelectConversation}
              onClose={() => setShowMemoryPopup(false)}
            />
          </div>
        </div>
      )}

      {/* Chat Popup for Mobile */}
      {showChatPopup && (
        <div 
          className="fixed inset-0 z-50 bg-black/10 backdrop-blur-xl animate-in fade-in duration-200 md:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowChatPopup(false);
            }
          }}
        >
          <div className="absolute inset-0 flex flex-col p-2">
            <div className="relative flex-1 bg-card rounded-xl shadow-2xl border border-border animate-in slide-in-from-bottom duration-300 overflow-hidden">
              {/* Chat container */}
              <div className="h-[calc(100%-60px)]">
                <AssistantChat 
                  isMobilePopup={true}
                  memories={memories}
                  conversations={conversations}
                  selectedConversation={selectedConversation}
                  onConversationLoaded={handleConversationLoaded}
                  onClearConversation={handleClearConversation}
                  onClose={() => setShowChatPopup(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full h-full px-2 py-1 sm:px-4 sm:py-4 lg:container lg:mx-auto lg:px-6 lg:py-2">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{t`AI Assistant`}</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {t`Your intelligent assistant that remembers conversations, understands context, and helps you achieve your goals.`}
            </p>
          </div>
          
          {/* Mobile Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMemoryPopup(true)}
              className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-card/80 border border-border rounded-lg text-sm md:hidden"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PanelLeft className="w-4 h-4" />
              )}
              <span>{t`Memories`}</span>
            </button>
            
            <button
              onClick={() => setShowChatPopup(true)}
              className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground border border-primary rounded-lg text-sm md:hidden"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t`Start Chat`}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100vh-140px)] md:h-[calc(100vh-160px)]">
          {/* Left Sidebar - Memory Panel (Desktop only) */}
          <div className="hidden lg:block lg:w-1/4">
            <div className="h-full bg-card rounded-xl overflow-hidden">
              <MemoryPanel 
                memories={memories}
                conversations={conversations}
                onSelectMemory={(memory) => {
                  console.log('Selected memory:', memory);
                }}
                onSelectConversation={handleSelectConversation}
              />
            </div>
          </div>

          {/* Main Content - Assistant */}
          <div className="flex-1 lg:w-3/4 overflow-hidden">
            {/* Assistant Chat (Desktop only) */}
            <div className="hidden md:block h-full bg-card rounded-xl overflow-hidden">
              <AssistantChat 
                memories={memories}
                conversations={conversations}
                selectedConversation={selectedConversation}
                onConversationLoaded={handleConversationLoaded}
              />
            </div>
            
            {/* Mobile empty state */}
            <div className="md:hidden flex flex-col items-center justify-center mt-20 py-20 h-100vh text-center p-8 bg-card rounded-xl border border-border overflow-hidden">
              <MessageSquare className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-bold mb-2">{t`Start a Conversation`}</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {t`Click "Start Chat" above to begin chatting with your AI assistant.`}
              </p>
              <button
                onClick={() => setShowChatPopup(true)}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
              >
                {t`Start Chat`}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssistantDashboard;