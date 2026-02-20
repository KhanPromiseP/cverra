// // pages/dashboard/assistant/assistantdashboard.tsx
// import React, { useState, useEffect } from 'react';
// import { AssistantChat } from '../../../components/assistant/AssistantChat';
// import { MemoryPanel } from '../../../components/assistant/MemoryPanel';
// import { 
//   MessageSquare, 
//   Brain, 
//   BarChart3,
//   PanelLeft,
//   MessageCircle,
//   Maximize2,
//   Minimize2,
//   X,
//   Loader2
// } from 'lucide-react';
// import { t } from "@lingui/macro";
// import { useAuthStore } from '@/client/stores/auth';

// // Import the shared types
// import { Conversation } from '../../../types/assistant';

// interface Memory {
//   id: string;
//   topic: string;
//   summary: string;
//   importance: number;
//   contextType: string;
//   tags: string[];
//   updatedAt: string;
//   lastAccessed: string;
// }

// const AssistantDashboard = () => {
//   const [showMemoryPopup, setShowMemoryPopup] = useState(false);
//   const [showChatPopup, setShowChatPopup] = useState(false);
//   const [isChatExpanded, setIsChatExpanded] = useState(false);
//   const [memories, setMemories] = useState<Memory[]>([]);
//   const [conversations, setConversations] = useState<Conversation[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
//   const [stats, setStats] = useState({
//     totalMessages: 0,
//     totalTokens: 0,
//     conversations: 0,
//     memories: 0,
//   });
  
//   const user = useAuthStore((state) => state.user);

//   // Fetch memories and conversations
//   const fetchData = async () => {
//     if (!user) return;

//     setIsLoading(true);
//     try {
//       const [memoriesRes, conversationsRes, analyticsRes] = await Promise.all([
//         fetch('/api/assistant/memories'),
//         fetch('/api/assistant/conversations'),
//         fetch('/api/assistant/analytics'),
//       ]);

//       let conversationsData: Conversation[] = [];
//       let memoriesData: Memory[] = [];

//       if (memoriesRes.ok) {
//         const data = await memoriesRes.json();
//         memoriesData = data.data || [];
//         setMemories(memoriesData);
//       }

//       if (conversationsRes.ok) {
//         const data = await conversationsRes.json();
        
//         // Get the actual conversations array
//         const conversationsArray = data.data?.conversations || data.data || [];
        
//         // Ensure all required fields exist with defaults
//         conversationsData = conversationsArray.map((conv: any): Conversation => ({
//           id: conv.id || '',
//           title: conv.title || 'Untitled Conversation',
//           mode: conv.mode || 'GENERAL_ASSISTANT',
//           messageCount: conv.messageCount || conv.totalMessages || conv._count?.messages || 0,
//           createdAt: conv.createdAt || new Date().toISOString(),
//           updatedAt: conv.updatedAt || conv.lastMessageAt || conv.createdAt || new Date().toISOString(),
//           lastMessage: conv.lastMessage || conv.preview || undefined,
//         }));
//         setConversations(conversationsData);
//       }
//       if (analyticsRes.ok) {
//         const analyticsData = await analyticsRes.json();
//         setStats({
//           totalMessages: analyticsData.totalMessages || 0,
//           totalTokens: analyticsData.totalTokens || 0,
//           conversations: conversationsData.length || 0,
//           memories: memoriesData.length || 0,
//         });
//       }
//     } catch (error) {
//       console.error('Failed to fetch assistant data:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Prevent body scroll when popups are open
//   useEffect(() => {
//     if (showMemoryPopup || showChatPopup || isChatExpanded) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'unset';
//     }
    
//     return () => {
//       document.body.style.overflow = 'unset';
//     };
//   }, [showMemoryPopup, showChatPopup, isChatExpanded]);

//   // Close popups when chat is expanded
//   useEffect(() => {
//     if (isChatExpanded) {
//       setShowMemoryPopup(false);
//       setShowChatPopup(false);
//     }
//   }, [isChatExpanded]);

//   // Load data on component mount
//   useEffect(() => {
//     fetchData();
//   }, [user]);

//   const handleSelectConversation = (conversation: Conversation) => {
//     console.log('Selected conversation:', conversation);
//     setSelectedConversation(conversation);
//     setShowMemoryPopup(false);

//     if (window.innerWidth < 768) {
//       setShowChatPopup(true);
//     }
//   };

//   const handleClearConversation = () => {
//     // This would be handled by the AssistantChat component
//     console.log('Clear conversation from dashboard');
//   };

//   const handleRefresh = () => {
//     fetchData();
//   };

//   const handleConversationLoaded = () => {
//     // Reset after conversation is loaded
//     setSelectedConversation(null);
//   };

//   return (
//     <div className="min-h-screen bg-background text-foreground">
//       {/* Memory Panel Popup for Mobile */}
//       {showMemoryPopup && (
//         <div 
//           className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/10 backdrop-blur-xl animate-in fade-in duration-200 md:hidden"
//           onClick={(e) => {
//             if (e.target === e.currentTarget) {
//               setShowMemoryPopup(false);
//             }
//           }}
//         >
//           <div className="relative w-full h-full max-h-[90vh] bg-card rounded-xl shadow-2xl border border-border animate-in slide-in-from-bottom duration-300">
//             <MemoryPanel 
//               memories={memories}
//               conversations={conversations}
//               onSelectMemory={(memory) => {
//                 console.log('Selected memory:', memory);
//                 setShowMemoryPopup(false);
//               }}
//               onSelectConversation={handleSelectConversation}
//               onClose={() => setShowMemoryPopup(false)}
//             />
//           </div>
//         </div>
//       )}

//       {/* Chat Popup for Mobile */}
//       {showChatPopup && (
//         <div 
//           className="fixed inset-0 z-50 bg-black/10 backdrop-blur-xl animate-in fade-in duration-200 md:hidden"
//           onClick={(e) => {
//             if (e.target === e.currentTarget) {
//               setShowChatPopup(false);
//             }
//           }}
//         >
//           <div className="absolute inset-0 flex flex-col p-2">
//             <div className="relative flex-1 bg-card rounded-xl shadow-2xl border border-border animate-in slide-in-from-bottom duration-300 overflow-hidden">
//               {/* Chat container */}
//               <div className="h-[calc(100%-60px)]">
//                 <AssistantChat 
//                   isMobilePopup={true}
//                   memories={memories}
//                   conversations={conversations}
//                   selectedConversation={selectedConversation}
//                   onConversationLoaded={handleConversationLoaded}
//                   onClearConversation={handleClearConversation}
//                   onClose={() => setShowChatPopup(false)}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Main Content */}
//       <main className="w-full h-full px-2 py-1 sm:px-4 sm:py-4 lg:container lg:mx-auto lg:px-6 lg:py-2">
//         <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
//           <div>
//             <h1 className="text-2xl md:text-3xl font-bold mb-1">{t`AI Assistant`}</h1>
//             <p className="text-sm md:text-base text-muted-foreground">
//               {t`Your intelligent assistant that remembers conversations, understands context, and helps you achieve your goals.`}
//             </p>
//           </div>
          
//           {/* Mobile Controls */}
//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => setShowMemoryPopup(true)}
//               className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-card/80 border border-border rounded-lg text-sm md:hidden"
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <Loader2 className="w-4 h-4 animate-spin" />
//               ) : (
//                 <PanelLeft className="w-4 h-4" />
//               )}
//               <span>{t`Memories`}</span>
//             </button>
            
//             <button
//               onClick={() => setShowChatPopup(true)}
//               className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground border border-primary rounded-lg text-sm md:hidden"
//             >
//               <MessageSquare className="w-4 h-4" />
//               <span>{t`Start Chat`}</span>
//             </button>
//           </div>
//         </div>

//         <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100vh-140px)] md:h-[calc(100vh-160px)]">
//           {/* Left Sidebar - Memory Panel (Desktop only) */}
//           <div className="hidden lg:block lg:w-1/4">
//             <div className="h-full bg-card rounded-xl overflow-hidden">
//               <MemoryPanel 
//                 memories={memories}
//                 conversations={conversations}
//                 onSelectMemory={(memory) => {
//                   console.log('Selected memory:', memory);
//                 }}
//                 onSelectConversation={handleSelectConversation}
//               />
//             </div>
//           </div>

//           {/* Main Content - Assistant */}
//           <div className="flex-1 lg:w-3/4 overflow-hidden">
//             {/* Assistant Chat (Desktop only) */}
//             <div className="hidden md:block h-full bg-card rounded-xl overflow-hidden">
//               <AssistantChat 
//                 memories={memories}
//                 conversations={conversations}
//                 selectedConversation={selectedConversation}
//                 onConversationLoaded={handleConversationLoaded}
//               />
//             </div>
            
//             {/* Mobile empty state */}
//             <div className="md:hidden flex flex-col items-center justify-center mt-20 py-20 h-100vh text-center p-8 bg-card rounded-xl border border-border overflow-hidden">
//               <MessageSquare className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
//               <h3 className="text-lg font-bold mb-2">{t`Start a Conversation`}</h3>
//               <p className="text-sm text-muted-foreground mb-6 max-w-sm">
//                 {t`Click "Start Chat" above to begin chatting with your AI assistant.`}
//               </p>
//               <button
//                 onClick={() => setShowChatPopup(true)}
//                 className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
//               >
//                 {t`Start Chat`}
//               </button>
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default AssistantDashboard;


// pages/dashboard/assistant/assistantdashboard.tsx (ENHANCED VERSION)
import React, { useState, useEffect } from 'react';
import { AssistantChat } from '../../../components/assistant/AssistantChat';
import { MemoryPanel } from '../../../components/assistant/MemoryPanel';
import { LifeDashboard } from '../../../components/assistant/LifeDashboard';
import { SecondBrain } from '../../../components/assistant/SecondBrain';
import { DecisionJournal } from '../../../components/assistant/DecisionJournal';
import { GrowthAnalytics } from '../../../components/assistant/GrowthAnalytics';
import { ModeSelector } from '../../../components/assistant/ModeSelector';
import { LifeDashboardSidebar } from '../../../components/assistant/sidebars/LifeDashboardSidebar';
import { SecondBrainSidebar } from '../../../components/assistant/sidebars/SecondBrainSidebar';
import { DecisionSidebar } from '../../../components/assistant/sidebars/DecisionSidebar';
import { GrowthSidebar } from '../../../components/assistant/sidebars/GrowthSidebar';
import { BrainDumpModal } from '../../../components/assistant/BrainDumpModal';
import { 
  MessageSquare, 
  Brain, 
  BarChart3,
  PanelLeft,
  MessageCircle,
  Maximize2,
  Minimize2,
  X,
  Loader2,
  LayoutDashboard,
  Network,
  Scale,
  TrendingUp,
  Menu,
  Home,
  ChevronRight,
  Crown,
  Briefcase,
  LineChart,
  BookOpen,
  Sparkles,
  Heart
} from 'lucide-react';
import { t } from "@lingui/macro";
import { useAuthStore } from '@/client/stores/auth';
import { useAssistant } from '../../../hooks/useAssistant';
import { AssistantMode } from '../../../types/assistant';

// Import the shared types
import { Conversation } from '../../../types/assistant';
import { useNavigate } from 'react-router';



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

// Dashboard tabs
type DashboardTab = 'chat' | 'life' | 'brain' | 'decisions' | 'growth';

const AssistantDashboard = () => {
  // Existing state
  const navigate = useNavigate();
  const [showMemoryPopup, setShowMemoryPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  // NEW: Tab and mode state
  const [activeTab, setActiveTab] = useState<DashboardTab>('chat');
  const [selectedMode, setSelectedMode] = useState<AssistantMode>('GENERAL_ASSISTANT');
  const [showMobileMenu, setShowMobileMenu] = useState(false);


  
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalTokens: 0,
    conversations: 0,
    memories: 0,
  });
  
  const user = useAuthStore((state) => state.user);
  const { userTier, getAuthHeaders } = useAssistant();
  const canAccessPremium = userTier === 'PREMIUM' || userTier === 'ADMIN';

  // Fetch memories and conversations (YOUR EXISTING CODE)
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
          isStarred: conv.isStarred || false,
          isPinned: conv.isPinned || false,
          isArchived: conv.isArchived || false,
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

  // Prevent body scroll when popups are open (YOUR EXISTING CODE)
  useEffect(() => {
    if (showMemoryPopup || showChatPopup || isChatExpanded || showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMemoryPopup, showChatPopup, isChatExpanded, showMobileMenu]);

  // Close popups when chat is expanded (YOUR EXISTING CODE)
  useEffect(() => {
    if (isChatExpanded) {
      setShowMemoryPopup(false);
      setShowChatPopup(false);
      setShowMobileMenu(false);
    }
  }, [isChatExpanded]);

  // Load data on component mount (YOUR EXISTING CODE)
  useEffect(() => {
    fetchData();
  }, [user]);

  // Handle conversation selection (YOUR EXISTING CODE)
  const handleSelectConversation = (conversation: Conversation) => {
    console.log('Selected conversation:', conversation);
    setSelectedConversation(conversation);
    setShowMemoryPopup(false);
    setActiveTab('chat'); // Switch to chat tab when selecting conversation

    if (window.innerWidth < 768) {
      setShowChatPopup(true);
    }
  };

  const handleClearConversation = () => {
    console.log('Clear conversation from dashboard');
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleConversationLoaded = () => {
    setSelectedConversation(null);
  };

  // Handle tab change
  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    // Close mobile menu on tab change
    if (window.innerWidth < 768) {
      setShowMobileMenu(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Premium Banner for Free Users */}
      {!canAccessPremium && activeTab !== 'chat' && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">PREMIUM</span>
              <span>Upgrade to access Life Dashboard, Second Brain, and more</span>
            </div>
            <button 
              onClick={() => navigate('/dashboard/pricing')}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition"
            >
              Learn More
            </button>
          </div>
        </div>
      )}

      {/* Memory Panel Popup for Mobile (YOUR EXISTING CODE) */}
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

      {/* Chat Popup for Mobile (YOUR EXISTING CODE) */}
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
                  mode={selectedMode}
                  onModeChange={setSelectedMode}
                  canAccessPremium={canAccessPremium}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Slide-out */}
{showMobileMenu && (
  <div 
    className="fixed inset-0 z-50 md:hidden"
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        setShowMobileMenu(false);
      }
    }}
  >
    {/* Backdrop */}
    <div className="absolute inset-0 bg-black/50 backdrop-blur-xl animate-in fade-in duration-200" />
    
    {/* Sidebar */}
    <div className="absolute left-0 top-0 h-full w-68 bg-card border-r border-border shadow-xl animate-in slide-in-from-left duration-300 z-[51]">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-bold">Menu</h2>
        <button 
          onClick={() => setShowMobileMenu(false)}
          className="p-2 hover:bg-muted rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Mobile Navigation */}
      <div className="p-2 overflow-y-auto max-h-[calc(100vh-120px)]">
        {/* Chat Mode - Always available */}
        <button
          onClick={() => {
            // setSelectedMode('GENERAL_ASSISTANT');
            // setActiveTab('chat');
            setShowMobileMenu(false);
            setShowChatPopup(true);
          }}
          className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center gap-3 mb-1 transition ${
            activeTab === 'chat' && selectedMode === 'GENERAL_ASSISTANT'
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${
            activeTab === 'chat' && selectedMode === 'GENERAL_ASSISTANT' 
              ? 'bg-white/20' 
              : 'bg-secondary'
          }`}>
            <Brain className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Start Chat</div>
            <div className="text-xs opacity-70">assistant</div>
          </div>
        </button>


        {/* <button
          onClick={() => {
            setSelectedMode('TUTOR');
            setActiveTab('chat');
            setShowMobileMenu(false);
          }}
          className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center gap-3 mb-1 transition ${
            activeTab === 'chat' && selectedMode === 'TUTOR'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' 
              : 'hover:bg-muted'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${
            activeTab === 'chat' && selectedMode === 'TUTOR' 
              ? 'bg-white/20' 
              : 'bg-secondary'
          }`}>
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Tutor</div>
            <div className="text-xs opacity-70">Learn concepts</div>
          </div>
        </button>
        */}

        {/* Career Coach Mode */}
        {/* <button
          onClick={() => {
            setSelectedMode('CAREER_COACH');
            setActiveTab('chat');
            setShowMobileMenu(false);
          }}
          className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center gap-3 mb-1 transition ${
            activeTab === 'chat' && selectedMode === 'CAREER_COACH'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white' 
              : 'hover:bg-muted'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${
            activeTab === 'chat' && selectedMode === 'CAREER_COACH' 
              ? 'bg-white/20' 
              : 'bg-secondary'
          }`}>
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Career Coach</div>
            <div className="text-xs opacity-70">Resume & interviews</div>
          </div>
        </button> */}

        {/* Content Guide Mode */}
        {/* <button
          onClick={() => {
            setSelectedMode('CONTENT_GUIDE');
            setActiveTab('chat');
            setShowMobileMenu(false);
          }}
          className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center gap-3 mb-1 transition ${
            activeTab === 'chat' && selectedMode === 'CONTENT_GUIDE'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' 
              : 'hover:bg-muted'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${
            activeTab === 'chat' && selectedMode === 'CONTENT_GUIDE' 
              ? 'bg-white/20' 
              : 'bg-secondary'
          }`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Content Guide</div>
            <div className="text-xs opacity-70">Articles & writing</div>
          </div>
        </button> */}

        {/* Premium Divider */}
        <div className="my-4 pt-2 border-t border-border">
          <div className="flex items-center gap-2 px-2 mb-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">
              Premium Modes
            </h3>
          </div>
        </div>

        {/* Decision Architect (Premium) */}
        {/* <button
          onClick={() => {
            setSelectedMode('DECISION_ARCHITECT');
            setActiveTab('chat');
            setShowMobileMenu(false);
          }}
          className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center gap-3 mb-1 transition ${
            activeTab === 'chat' && selectedMode === 'DECISION_ARCHITECT'
              ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white' 
              : 'hover:bg-muted border border-amber-200 dark:border-amber-800'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${
            activeTab === 'chat' && selectedMode === 'DECISION_ARCHITECT' 
              ? 'bg-white/20' 
              : 'bg-secondary'
          }`}>
            <Scale className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium flex items-center gap-2">
              Decision Architect
              {!canAccessPremium && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full">
                  PRO
                </span>
              )}
            </div>
            <div className="text-xs opacity-70">Strategic decisions</div>
          </div>
        </button> */}

        {/* Life Coach (Premium) */}
        {/* <button
          onClick={() => {
            setSelectedMode('LIFE_COACH');
            setActiveTab('chat');
            setShowMobileMenu(false);
          }}
          className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center gap-3 mb-1 transition ${
            activeTab === 'chat' && selectedMode === 'LIFE_COACH'
              ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white' 
              : 'hover:bg-muted border border-amber-200 dark:border-amber-800'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${
            activeTab === 'chat' && selectedMode === 'LIFE_COACH' 
              ? 'bg-white/20' 
              : 'bg-secondary'
          }`}>
            <Heart className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium flex items-center gap-2">
              Life Coach
              {!canAccessPremium && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full">
                  PRO
                </span>
              )}
            </div>
            <div className="text-xs opacity-70">Personal growth</div>
          </div>
        </button> */}

        {/* Second Brain (Premium) */}
        {/* <button
          onClick={() => {
            setSelectedMode('SECOND_BRAIN');
            setActiveTab('chat');
            setShowMobileMenu(false);
          }}
          className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center gap-3 mb-1 transition ${
            activeTab === 'chat' && selectedMode === 'SECOND_BRAIN'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white' 
              : 'hover:bg-muted border border-amber-200 dark:border-amber-800'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${
            activeTab === 'chat' && selectedMode === 'SECOND_BRAIN' 
              ? 'bg-white/20' 
              : 'bg-secondary'
          }`}>
            <Network className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium flex items-center gap-2">
              Second Brain
              {!canAccessPremium && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full">
                  PRO
                </span>
              )}
            </div>
            <div className="text-xs opacity-70">Organize thoughts</div>
          </div>
        </button> */}

        {/* Future Simulator (Premium) */}
        {/* <button
          onClick={() => {
            setSelectedMode('FUTURE_SIMULATOR');
            setActiveTab('chat');
            setShowMobileMenu(false);
          }}
          className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center gap-3 mb-1 transition ${
            activeTab === 'chat' && selectedMode === 'FUTURE_SIMULATOR'
              ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white' 
              : 'hover:bg-muted border border-amber-200 dark:border-amber-800'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${
            activeTab === 'chat' && selectedMode === 'FUTURE_SIMULATOR' 
              ? 'bg-white/20' 
              : 'bg-secondary'
          }`}>
            <LineChart className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium flex items-center gap-2">
              Future Simulator
              {!canAccessPremium && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full">
                  PRO
                </span>
              )}
            </div>
            <div className="text-xs opacity-70">Path simulation</div>
          </div>
        </button> */}

        {/* Dashboard Tabs Section */}
        {/* <div className="my-4 pt-2 border-t border-border">
          <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-2">
            Dashboards
          </h3>
        </div> */}

        {/* Life Dashboard Tab */}
        <button
          onClick={() => {
            setActiveTab('life');
            setShowMobileMenu(false);
          }}
          className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center gap-3 mb-1 transition ${
            activeTab === 'life'
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${
            activeTab === 'life' ? 'bg-white/20' : 'bg-secondary'
          }`}>
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Life Dashboard</div>
            <div className="text-xs opacity-70">Weekly summaries & emotions</div>
          </div>
          {!canAccessPremium && <Crown className="w-3 h-3 text-amber-500" />}
        </button>

        {/* Second Brain Tab */}
        <button
          onClick={() => {
            setActiveTab('brain');
            setShowMobileMenu(false);
          }}
          className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center gap-3 mb-1 transition ${
            activeTab === 'brain'
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${
            activeTab === 'brain' ? 'bg-white/20' : 'bg-secondary'
          }`}>
            <Network className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Second Brain</div>
            <div className="text-xs opacity-70">Knowledge management</div>
          </div>
          {!canAccessPremium && <Crown className="w-3 h-3 text-amber-500" />}
        </button>

        {/* Decision Journal Tab */}
        <button
          onClick={() => {
            setActiveTab('decisions');
            setShowMobileMenu(false);
          }}
          className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center gap-3 mb-1 transition ${
            activeTab === 'decisions'
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${
            activeTab === 'decisions' ? 'bg-white/20' : 'bg-secondary'
          }`}>
            <Scale className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Decision Journal</div>
            <div className="text-xs opacity-70">Track decisions</div>
          </div>
          {!canAccessPremium && <Crown className="w-3 h-3 text-amber-500" />}
        </button>

        {/* Growth Analytics Tab */}
        <button
          onClick={() => {
            setActiveTab('growth');
            setShowMobileMenu(false);
          }}
          className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center gap-3 mb-1 transition ${
            activeTab === 'growth'
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${
            activeTab === 'growth' ? 'bg-white/20' : 'bg-secondary'
          }`}>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Growth Analytics</div>
            <div className="text-xs opacity-70">Track progress</div>
          </div>
          {!canAccessPremium && <Crown className="w-3 h-3 text-amber-500" />}
        </button>
      </div>
    </div>
  </div>
)}

      {/* Main Content */}
      <main className="w-full h-full px-2 py-1 sm:px-4 sm:py-4 lg:container lg:mx-auto lg:px-6 lg:py-2">
        {/* Header with Navigation */}
        <div className="mb-4">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                {activeTab === 'chat' && t`AI Assistant`}
                {activeTab === 'life' && t`Life Dashboard`}
                {activeTab === 'brain' && t`Second Brain`}
                {activeTab === 'decisions' && t`Decision Journal`}
                {activeTab === 'growth' && t`Growth Analytics`}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                {activeTab === 'chat' && t`Your intelligent assistant that remembers conversations and helps you achieve your goals.`}
                {activeTab === 'life' && t`Weekly reflections, emotional tracking, and personal growth insights.`}
                {activeTab === 'brain' && t`Organize your thoughts, ideas, and knowledge.`}
                {activeTab === 'decisions' && t`Make better decisions with structured analysis.`}
                {activeTab === 'growth' && t`Track your progress and growth over time.`}
              </p>
            </div>
            
            {/* Desktop Tabs */}
            <div className="hidden md:flex items-center gap-1 bg-card rounded-lg p-1 border border-border">
              <TabButton 
                active={activeTab === 'chat'} 
                onClick={() => handleTabChange('chat')}
                icon={<MessageSquare className="w-4 h-4" />}
                label="Chat"
              />
              <TabButton 
                active={activeTab === 'life'} 
                onClick={() => handleTabChange('life')}
                icon={<LayoutDashboard className="w-4 h-4" />}
                label="Life"
                // isPremium={!canAccessPremium}
              />
              <TabButton 
                active={activeTab === 'brain'} 
                onClick={() => handleTabChange('brain')}
                icon={<Network className="w-4 h-4" />}
                label="Brain"
                // isPremium={!canAccessPremium}
              />
              <TabButton 
                active={activeTab === 'decisions'} 
                onClick={() => handleTabChange('decisions')}
                icon={<Scale className="w-4 h-4" />}
                label="Decisions"
                // isPremium={!canAccessPremium}
              />
              <TabButton 
                active={activeTab === 'growth'} 
                onClick={() => handleTabChange('growth')}
                icon={<TrendingUp className="w-4 h-4" />}
                label="Growth"
                // isPremium={!canAccessPremium}
              />
            </div>
            
            {/* Mobile Controls */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setShowMobileMenu(true)}
                className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-card/80 border border-border rounded-lg text-sm"
              >
                <Menu className="w-4 h-4" />
                <span>Menu</span>
              </button>
              
              <button
                onClick={() => setShowMemoryPopup(true)}
                className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-card/80 border border-border rounded-lg text-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PanelLeft className="w-4 h-4" />
                )}
                <span>{t`Memories`}</span>
              </button>
              
              {activeTab === 'chat' && (
                <button
                  onClick={() => setShowChatPopup(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground border border-primary rounded-lg text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t`Start Chat`}</span>
                </button>
              )}
            </div>
          </div>

          {/* Breadcrumb for context */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <Home className="w-3 h-3" />
            <ChevronRight className="w-3 h-3" />
            <span>Assistant</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">
              {activeTab === 'chat' && 'Chat'}
              {activeTab === 'life' && 'Life Dashboard'}
              {activeTab === 'brain' && 'Second Brain'}
              {activeTab === 'decisions' && 'Decision Journal'}
              {activeTab === 'growth' && 'Growth Analytics'}
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100vh-180px)] md:h-[calc(100vh-200px)]">
          {/* Left Sidebar - Memory Panel (Desktop only) - SHOW ONLY FOR CHAT TAB */}
          {activeTab === 'chat' && (
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
          )}

          {/* Right Sidebar - Mode Selector (Desktop only) - SHOW FOR ALL TABS */}
          {activeTab !== 'chat' && (
  <div className="hidden lg:block lg:w-1/5">
    <div className="h-full bg-card rounded-xl overflow-hidden p-4 flex flex-col">
      
      {/* Dynamic Content Based on Active Tab - Only render if user exists */}
      {user?.id ? (
        <>
          {activeTab === 'life' && (
            <LifeDashboardSidebar 
              userId={user.id} 
              getAuthHeaders={getAuthHeaders}
            />
          )}

          {activeTab === 'brain' && (
            <SecondBrainSidebar 
              userId={user.id}
              getAuthHeaders={getAuthHeaders}
            />
          )}

          {activeTab === 'decisions' && (
            <DecisionSidebar 
              userId={user.id}
              getAuthHeaders={getAuthHeaders}
            />
          )}

          {activeTab === 'growth' && (
            <GrowthSidebar 
              userId={user.id}
              getAuthHeaders={getAuthHeaders}
            />
          )}
        </>
      ) : (
        // Show loading or login prompt if no user
        <div className="py-8 text-center text-muted-foreground">
          Please log in to view your data
        </div>
      )}

      {/* Quick Stats - Always show at bottom */}
      <div className="mt-auto pt-4 border-t border-border">
        <h4 className="text-sm font-medium mb-2">Overview</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Conversations</span>
            <span className="font-medium">{stats.conversations}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Memories</span>
            <span className="font-medium">{stats.memories}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Messages</span>
            <span className="font-medium">{stats.totalMessages}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

          {/* Main Content - Dynamic based on active tab */}
          <div className={`flex-1 ${activeTab === 'chat' ? 'lg:w-3/4' : 'lg:w-4/5'} overflow-hidden`}>
            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="hidden md:block h-full bg-card rounded-xl overflow-hidden">
                <AssistantChat 
                  memories={memories}
                  conversations={conversations}
                  selectedConversation={selectedConversation}
                  onConversationLoaded={handleConversationLoaded}
                  mode={selectedMode}
                  onModeChange={setSelectedMode}
                  canAccessPremium={canAccessPremium}
                />
              </div>
            )}
            

            {/* Life Dashboard Tab */}
            {activeTab === 'life' && (
              <div className="h-full overflow-y-auto">
                {canAccessPremium ? (
                  <LifeDashboard />
                ) : (
                  <PremiumGate feature="Life Dashboard" />
                )}
              </div>
            )}

            {/* Second Brain Tab */}
            {activeTab === 'brain' && (
              <div className="h-full overflow-y-auto">
                {canAccessPremium ? (
                  <SecondBrain />
                ) : (
                  <PremiumGate feature="Second Brain" />
                )}
              </div>
            )}

            {/* Decision Journal Tab */}
            {activeTab === 'decisions' && (
              <div className="h-full overflow-y-auto">
                {canAccessPremium ? (
                  <DecisionJournal />
                ) : (
                  <PremiumGate feature="Decision Journal" />
                )}
              </div>
            )}

            {/* Growth Analytics Tab */}
            {activeTab === 'growth' && (
              <div className="h-full overflow-y-auto">
                {canAccessPremium ? (
                  <GrowthAnalytics />
                ) : (
                  // <PremiumGate feature="Growth Analytics" />
                  <GrowthAnalytics />
                )}
              </div>
            )}
            
            {/* Mobile empty state for chat (YOUR EXISTING CODE) */}
            {activeTab === 'chat' && (
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Tab Button Component
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isPremium?: boolean;
}> = ({ active, onClick, icon, label, isPremium }) => (
  <button
    onClick={onClick}
    className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
      active 
        ? 'bg-primary text-primary-foreground' 
        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
    }`}
    disabled={isPremium}
  >
    {icon}
    <span>{label}</span>
    {isPremium && (
      <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-amber-500 text-white rounded-full">
        PRO
      </span>
    )}
  </button>
);

// Mobile Navigation
const MobileNavigation: React.FC<{
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  canAccessPremium: boolean;
}> = ({ activeTab, onTabChange, canAccessPremium }) => (
  <div className="space-y-1">
    <MobileNavItem 
      active={activeTab === 'chat'} 
      onClick={() => onTabChange('chat')}
      icon={<MessageSquare className="w-4 h-4" />}
      label="Chat"
    />
    <MobileNavItem 
      active={activeTab === 'life'} 
      onClick={() => onTabChange('life')}
      icon={<LayoutDashboard className="w-4 h-4" />}
      label="Life Dashboard"
      isPremium={!canAccessPremium}
    />
    <MobileNavItem 
      active={activeTab === 'brain'} 
      onClick={() => onTabChange('brain')}
      icon={<Network className="w-4 h-4" />}
      label="Second Brain"
      isPremium={!canAccessPremium}
    />
    <MobileNavItem 
      active={activeTab === 'decisions'} 
      onClick={() => onTabChange('decisions')}
      icon={<Scale className="w-4 h-4" />}
      label="Decision Journal"
      isPremium={!canAccessPremium}
    />
    <MobileNavItem 
      active={activeTab === 'growth'} 
      onClick={() => onTabChange('growth')}
      icon={<TrendingUp className="w-4 h-4" />}
      label="Growth Analytics"
      isPremium={!canAccessPremium}
    />
  </div>
);

const MobileNavItem: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isPremium?: boolean;
}> = ({ active, onClick, icon, label, isPremium }) => (
  <button
    onClick={onClick}
    disabled={isPremium}
    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 ${
      active 
        ? 'bg-primary text-primary-foreground' 
        : isPremium
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-muted'
    }`}
  >
    <div className={`p-1.5 rounded-lg ${active ? 'bg-white/20' : 'bg-secondary'}`}>
      {icon}
    </div>
    <span className="flex-1">{label}</span>
    {isPremium && (
      <span className="text-xs px-2 py-0.5 bg-amber-500 text-white rounded-full">
        PREMIUM
      </span>
    )}
  </button>
);

// Premium Gate Component
const PremiumGate: React.FC<{ feature: string }> = ({ feature }) => {
  const navigate = useNavigate();
  
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500/20 flex items-center justify-center">
          <span className="text-3xl">✨</span>
        </div>
        <h3 className="text-2xl font-bold mb-2">{feature} is Premium</h3>
        <p className="text-muted-foreground mb-6">
          Upgrade to Premium to access {feature.toLowerCase()} and unlock your full potential with personalized insights, decision analysis, and growth tracking.
        </p>
        <div className="space-y-3">
          <button 
            onClick={() => navigate('/dashboard/pricing')}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition"
          >
            Upgrade to Premium
          </button>
          <button 
            onClick={() => window.history.back()}
            className="w-full px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistantDashboard;