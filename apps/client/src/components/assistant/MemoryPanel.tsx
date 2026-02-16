// components/assistant/MemoryPanel.tsx
import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Calendar, 
  Tag, 
  Star, 
  Clock,
  Search,
  BookOpen,
  Briefcase,
  FileText,
  X,
  History,
  MessageSquare,
  RefreshCw,
  Pin,
  Archive,
  Trash2,
  MoreVertical,
  Download,
  Edit2,
  Copy,
  Check,
} from 'lucide-react';
import { t } from "@lingui/macro";
import { useAuthStore } from '@/client/stores/auth';
import { Loader2 } from 'lucide-react';
import { Conversation } from '../../types/assistant';

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


interface MemoryPanelProps {
  memories: Memory[];
  conversations?: Conversation[];
  onSelectMemory: (memory: Memory) => void;
  onSelectConversation?: (conversation: Conversation) => void; // Remove async
  onClose?: () => void;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({ 
  memories = [], 
  conversations = [], // ADD DEFAULT VALUE
  onSelectMemory,
  onSelectConversation,
  onClose 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'memories' | 'history'>('memories');
  const [fetchedConversations, setFetchedConversations] = useState<Conversation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [showMenuFor, setShowMenuFor] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);


  const menuRef = React.useRef<HTMLDivElement>(null);

  const getContextIcon = (type: string) => {
    switch (type) {
      case 'career_advice': return <Briefcase className="w-4 h-4" />;
      case 'learning_path': return <BookOpen className="w-4 h-4" />;
      case 'content_creation': return <FileText className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getContextColor = (type: string) => {
    switch (type) {
      case 'career_advice': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'learning_path': return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'content_creation': return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default: return 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    }
  };

  const getImportanceStars = (importance: number) => {
    const stars = Math.min(Math.max(Math.ceil(importance / 2), 1), 5);
    return (
      <div className="flex gap-0.5">
        {'★'.repeat(stars).split('').map((_, i) => (
          <span key={i} className="text-amber-500 dark:text-amber-400">★</span>
        ))}
        {'☆'.repeat(5 - stars).split('').map((_, i) => (
          <span key={i} className="text-gray-300 dark:text-gray-600">☆</span>
        ))}
      </div>
    );
  };

  const toggleMemoryExpand = (memoryId: string) => {
    if (expandedMemoryId === memoryId) {
      setExpandedMemoryId(null);
    } else {
      setExpandedMemoryId(memoryId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t`Today`;
    if (diffDays === 1) return t`Yesterday`;
    if (diffDays < 7) return t`${diffDays} days ago`;
    if (diffDays < 30) return t`${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const fetchConversations = async () => {
  if (!user) {
    setFetchedConversations([]);
    return;
  }

  setIsLoadingHistory(true);
  setHistoryError(null);

  try {
    const response = await fetch('/api/assistant/conversations');

    if (response.ok) {
      const data = await response.json();
      const formattedConversations: Conversation[] = (data.data?.conversations || data.data || []).map((conv: any) => ({
        id: conv.id,
        title: conv.title || conv.mode || t`Conversation`,
        mode: conv.mode || 'GENERAL_ASSISTANT',
        messageCount: conv.messageCount || conv._count?.messages || 0,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt || conv.lastMessageAt || conv.createdAt,
        lastMessage: conv.lastMessageContent || conv.preview,
        // Add the new properties
        isStarred: conv.isStarred || false,
        isPinned: conv.isPinned || false,
        isArchived: conv.isArchived || false,
        isDeleted: conv.isDeleted || false,
      }));
      
      // Sort by updatedAt (most recent first)
      formattedConversations.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      setFetchedConversations(formattedConversations);
    } else {
      setHistoryError(t`Failed to load conversations`);
    }
  } catch (err: any) {
    console.error('Failed to fetch conversations:', err);
    setHistoryError(
      err.response?.data?.message || 
      err.message || 
      t`Failed to load chat history`
    );
    setFetchedConversations([]);
  } finally {
    setIsLoadingHistory(false);
  }
};


  const handleClearConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!window.confirm(t`Are you sure you want to delete this conversation? This cannot be undone.`)) {
      return;
    }

    try {
      await fetch(`/api/assistant/conversations/${conversationId}/clear`, { method: 'POST' });
      // Update both local and fetched conversations
      setFetchedConversations(prev => prev.filter(c => c.id !== conversationId));
    } catch (err: any) {
      console.error('Failed to clear conversation:', err);
      alert(t`Failed to delete conversation. Please try again.`);
    }
  };

  const handleStarConversation = async (conversationId: string, star: boolean) => {
  try {
    await fetch(`/api/assistant/conversations/${conversationId}/star`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ conversationId, star }),
    });
    
    // Update local state
    setFetchedConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, isStarred: star }
          : conv
      )
    );
  } catch (err: any) {
    console.error('Failed to star conversation:', err);
    alert(t`Failed to update conversation`);
  }
};

const handlePinConversation = async (conversationId: string, pin: boolean) => {
  try {
    await fetch(`/api/assistant/conversations/${conversationId}/pin`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ conversationId, pin }),
    });
    
    // Update local state
    setFetchedConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, isPinned: pin }
          : conv
      )
    );
  } catch (err: any) {
    console.error('Failed to pin conversation:', err);
    alert(t`Failed to update conversation`);
  }
};

const handleArchiveConversation = async (conversationId: string, archive: boolean) => {
  try {
    await fetch(`/api/assistant/conversations/${conversationId}/archive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ conversationId, archive }),
    });
    
    // Update local state
    setFetchedConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, isArchived: archive }
          : conv
      )
    );
  } catch (err: any) {
    console.error('Failed to archive conversation:', err);
    alert(t`Failed to update conversation`);
  }
};

const handleUpdateTitle = async (conversationId: string, title: string) => {
  if (!title.trim()) {
    alert(t`Title cannot be empty`);
    return;
  }

  try {
    await fetch(`/api/assistant/conversations/${conversationId}/title`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ title }),
    });
    
    // Update local state
    setFetchedConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, title: title.trim() }
          : conv
      )
    );
    
    setEditingTitleId(null);
    setEditTitleValue('');
  } catch (err: any) {
    console.error('Failed to update title:', err);
    alert(t`Failed to update title`);
  }
};

const handleExportConversation = async (conversationId: string) => {
  try {
    console.log('🔍 Starting export with conversationId:', conversationId);
    
    // Build the URL
    const url = `/api/assistant/conversations/${conversationId}/export?format=json`;
    console.log('🌐 Making request to:', url);
    
    // IMPORTANT: Use credentials: 'include' to send HTTP-only cookies
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ← CRITICAL: Sends cookies
    });
    
    console.log('📡 Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        
        if (errorText) {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorText;
          } catch {
            errorMessage = errorText.substring(0, 200);
          }
        }
      } catch (e) {
        console.error('Could not read error response:', e);
      }
      
      // Handle specific status codes
      if (response.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        // Redirect to login
        window.location.href = '/auth/login';
      } else if (response.status === 404) {
        errorMessage = 'Conversation not found.';
      } else if (response.status === 400) {
        errorMessage = `Bad request: ${errorMessage}`;
      }
      
      throw new Error(errorMessage);
    }
    
    // Get content disposition for filename
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `conversation-${conversationId}.json`;
    
    if (contentDisposition) {
      // Match filename from Content-Disposition header
      const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (matches && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
        console.log('📝 Filename from headers:', filename);
      }
    }
    
    // Create and download the file
    const blob = await response.blob();
    console.log('📦 Blob received:', {
      size: blob.size,
      type: blob.type,
    });
    
    const urlObject = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = urlObject;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlObject);
    }, 100);
    
    console.log('✅ Export successful!');
    
    // Show success message
    alert('Conversation exported successfully!');
    
  } catch (err: any) {
    console.error('❌ Export failed with details:', {
      name: err.name,
      message: err.message,
      conversationId,
    });
    
    // User-friendly error messages
    let userMessage = 'Failed to export conversation.';
    
    if (err.message.includes('Session expired') || err.message.includes('401')) {
      userMessage = 'Your session has expired. Please log in again.';
      window.location.href = '/auth/login';
    } else if (err.message.includes('not found') || err.message.includes('404')) {
      userMessage = 'Conversation not found. It may have been deleted.';
    } else if (err.message.includes('Bad request') || err.message.includes('400')) {
      userMessage = 'Invalid request. Please try again.';
    } else if (err.message.includes('network') || err.message.includes('fetch')) {
      userMessage = 'Network error. Please check your connection.';
    }
    
    alert(userMessage);
  }
};

const handleDeleteConversation = async (conversationId: string, permanent: boolean = false) => {
  const message = permanent 
    ? t`Are you sure you want to permanently delete this conversation? This cannot be undone.`
    : t`Are you sure you want to move this conversation to trash?`;
  
  if (!window.confirm(message)) {
    return;
  }

  try {
    // CHANGE THIS URL:
    await fetch(`/api/assistant/conversations/${conversationId}/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ conversationId, permanent }),
    });
    
    if (permanent) {
      // Remove from state
      setFetchedConversations(prev => prev.filter(c => c.id !== conversationId));
    } else {
      // Mark as deleted
      setFetchedConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, isDeleted: true }
            : conv
        )
      );
    }
  } catch (err: any) {
    console.error('Failed to delete conversation:', err);
    alert(t`Failed to delete conversation. Please try again.`);
  }
};

  const filteredMemories = memories.filter(memory => {
    const matchesSearch = !searchQuery || 
      memory.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'important' && memory.importance >= 8) ||
      (selectedFilter === 'career' && memory.contextType === 'career_advice') ||
      (selectedFilter === 'learning' && memory.contextType === 'learning_path') ||
      (selectedFilter === 'content' && memory.contextType === 'content_creation');
    
    return matchesSearch && matchesFilter;
  });

  const filters = [
    { id: 'all', label: t`All` },
    { id: 'important', label: t`Important`, icon: <Star className="w-3 h-3" /> },
    { id: 'career', label: t`Career`, icon: <Briefcase className="w-3 h-3" /> },
    { id: 'learning', label: t`Learning`, icon: <BookOpen className="w-3 h-3" /> },
    { id: 'content', label: t`Content`, icon: <FileText className="w-3 h-3" /> },
  ];

  // Use passed conversations or fetch them
  const displayConversations = conversations.length > 0 ? conversations : fetchedConversations;

  // Fetch conversations on tab switch if no conversations were passed
  useEffect(() => {
    if (activeTab === 'history' && user && conversations.length === 0) {
      fetchConversations();
    }
  }, [activeTab, user, conversations.length]);


  // Add this useEffect to handle outside clicks and Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If menu is open and click is outside the menu, close it
      if (showMenuFor) {
        const menuElement = document.querySelector(`[data-menu-id="${showMenuFor}"]`);
        const menuButton = document.querySelector(`[data-menu-button="${showMenuFor}"]`);
        
        if (menuElement && menuButton) {
          const target = event.target as Node;
          
          // Check if click is NOT inside the menu or menu button
          if (!menuElement.contains(target) && !menuButton.contains(target)) {
            setShowMenuFor(null);
          }
        }
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showMenuFor) {
        setShowMenuFor(null);
      }
    };

    // Add event listeners when menu is open
    if (showMenuFor) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      
      // Prevent body scroll when menu is open (optional)
      document.body.style.overflow = 'hidden';
    }

    // Clean up event listeners
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [showMenuFor]);

  return (
    <div className="h-full bg-card flex flex-col">
      {/* Header with close button for mobile */}
      <div className="p-3 md:p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            <h2 className="text-base md:text-lg font-semibold">{t`Assistant Memory`}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm text-muted-foreground">
              {activeTab === 'memories' 
                ? `${filteredMemories.length}/${memories.length}`
                : `${displayConversations.length}`
              }
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-1 hover:bg-muted rounded"
                aria-label={t`Close memory panel`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-border mb-3">
          <button
            onClick={() => setActiveTab('memories')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'memories'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Brain className="w-4 h-4" />
              {t`Memories`}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <History className="w-4 h-4" />
              {t`History`}
            </div>
          </button>
        </div>
        
        {/* Search and Filters - Only show for memories tab */}
        {activeTab === 'memories' && (
          <>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t`Search memories...`}
                className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                aria-label={t`Search memories`}
              />
            </div>
            
            <div className="flex gap-1 md:gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`
                    flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 text-xs rounded-full whitespace-nowrap transition-all
                    ${selectedFilter === filter.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                    }
                  `}
                  aria-pressed={selectedFilter === filter.id}
                >
                  {filter.icon && <span className="opacity-80">{filter.icon}</span>}
                  {filter.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto md:pb-20 lg:pb-30 p-3 md:p-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-card">
        {activeTab === 'memories' ? (
          // Memories Tab
          filteredMemories.length === 0 ? (
            <div className="text-center py-8 md:py-12 text-muted-foreground">
              <Brain className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-40" />
              <p className="font-medium mb-1 text-sm md:text-base">{t`No memories found`}</p>
              <p className="text-xs md:text-sm">
                {t`${searchQuery ? 'Try a different search' : 'The assistant will remember important conversations here'}`}
              </p>
            </div>
          ) : (
          <div className="space-y-2 md:space-y-3">
            {filteredMemories.map((memory) => {
              const isExpanded = expandedMemoryId === memory.id;
              
              return (
                <div
                  key={memory.id}
                  className="w-full text-left bg-secondary border border-border rounded-lg p-3 md:p-4 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {/* Clickable header to toggle expand */}
                  <button
                    onClick={() => toggleMemoryExpand(memory.id)}
                    className="w-full text-left cursor-pointer"
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} memory: ${memory.topic}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${getContextColor(memory.contextType).split(' ')[0]}`}>
                          {getContextIcon(memory.contextType)}
                        </div>
                        <h3 className="font-semibold text-sm md:text-base line-clamp-1">{memory.topic}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {getImportanceStars(memory.importance)}
                        {/* Expand/Collapse Icon */}
                        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Summary - Show limited or full based on expanded state */}
                    <p className={`text-xs md:text-sm text-muted-foreground mb-3 ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {memory.summary}
                    </p>
                  </button>
                  
                  {/* Expanded details section */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border animate-in slide-in-from-top-2">
                      <div className="space-y-3">
                        {/* Full summary */}
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">
                            {t`Full Summary`}
                          </h4>
                          <p className="text-sm text-foreground bg-background/50 rounded p-2 border border-border">
                            {memory.summary}
                          </p>
                        </div>
                        
                        {/* Tags section */}
                        {memory.tags.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground mb-1">
                              {t`Tags`}
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {memory.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full border border-primary/20"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{formatDate(memory.lastAccessed)}</div>
                            </div>
                          </div>
                            <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => toggleMemoryExpand(memory.id)}
                              className="px-3 bg-background py-2 text-xs bg-secondary hover:bg-secondary/30 rounded-lg transition-colors"
                            >
                              {t`Show Less`}
                            </button>
                          </div>
                        </div>
                        
                        
                      </div>
                    </div>
                  )}
                  
                  {/* Footer (only shows when not expanded) */}
                  {!isExpanded && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(memory.updatedAt)}</span>
                        </span>
                        
                        {memory.tags.length > 0 && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Tag className="w-3 h-3" />
                            <span className="max-w-[100px] md:max-w-[120px] truncate">
                              {memory.tags.slice(0, 2).join(', ')}
                            </span>
                            {memory.tags.length > 2 && (
                              <span className="text-muted-foreground/70">+{memory.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <span className={`
                        px-2 py-1 rounded-full text-[10px] md:text-xs font-medium border self-start
                        ${getContextColor(memory.contextType)}
                      `}>
                        {memory.contextType.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )
        ) : (
          // History Tab
          <div className="space-y-3">
            {/* History Header with Refresh */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t`Recent Conversations`}
              </h3>
              <button
                onClick={fetchConversations}
                disabled={isLoadingHistory}
                className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
                aria-label={t`Refresh history`}
              >
                {isLoadingHistory ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
            </div>

            {isLoadingHistory && conversations.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-3 text-sm text-muted-foreground">
                  {t`Loading conversations...`}
                </span>
              </div>
            ) : historyError && conversations.length === 0 ? (
              <div className="text-center py-8 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="w-10 h-10 mx-auto mb-3 text-destructive">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-destructive mb-2">{t`Failed to load history`}</p>
                <p className="text-xs text-muted-foreground mb-4">{historyError}</p>
                <button
                  onClick={fetchConversations}
                  className="px-3 py-1.5 text-xs bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                >
                  {t`Try Again`}
                </button>
              </div>
            ) : displayConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-1">{t`No conversations yet`}</p>
                <p className="text-xs">
                  {t`Start chatting to see your history here`}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="group relative bg-secondary border border-border rounded-lg p-3 transition-all hover:shadow-md"
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => onSelectConversation?.(conversation)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                          <MessageSquare className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingTitleId === conversation.id ? (
                            <div className="flex items-center gap-2 mb-1">
                              <input
                                type="text"
                                value={editTitleValue}
                                onChange={(e) => setEditTitleValue(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateTitle(conversation.id, editTitleValue);
                                  } else if (e.key === 'Escape') {
                                    setEditingTitleId(null);
                                    setEditTitleValue('');
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleUpdateTitle(conversation.id, editTitleValue)}
                                className="p-1 text-green-500 hover:bg-green-500/10 rounded"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingTitleId(null);
                                  setEditTitleValue('');
                                }}
                                className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-sm line-clamp-1">
                                {conversation.title}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(conversation.updatedAt)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                              {conversation.mode.toLowerCase().replace('_', ' ')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {conversation.messageCount} {t`messages`}
                            </span>
                            {conversation.isStarred && (
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            )}
                            {conversation.isPinned && (
                              <Pin className="w-3 h-3 text-blue-500" />
                            )}
                            {conversation.isArchived && (
                              <Archive className="w-3 h-3 text-gray-500" />
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {conversation.lastMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                    
                    {/* Action Menu */}
                    <div className="absolute top-2 right-2">
                      <button
                        data-menu-button={conversation.id} // Add this data attribute
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent event bubbling
                          setShowMenuFor(showMenuFor === conversation.id ? null : conversation.id);
                        }}
                        className="p-1 mt-8 hover:bg-muted rounded transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {showMenuFor === conversation.id && (
                        <div 
                          data-menu-id={conversation.id} // Add this data attribute
                          className="absolute right-0 top-full mt-1 z-50 w-48 bg-background border border-border rounded-lg shadow-lg shadow-black/20" // Changed z-10 to z-50
                        >
                          <div className="py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Add this
                                setEditingTitleId(conversation.id);
                                setEditTitleValue(conversation.title || t`Untitled Conversation`);
                                setShowMenuFor(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors" // Added transition
                            >
                              <Edit2 className="w-4 h-4" />
                              <span>{t`Rename`}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Add this
                                handleStarConversation(conversation.id, !conversation.isStarred);
                                setShowMenuFor(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors" // Added transition
                            >
                              <Star className={`w-4 h-4 ${conversation.isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                              <span>{conversation.isStarred ? t`Unstar` : t`Star`}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Add this
                                handlePinConversation(conversation.id, !conversation.isPinned);
                                setShowMenuFor(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors" // Added transition
                            >
                              <Pin className={`w-4 h-4 ${conversation.isPinned ? 'text-blue-500' : ''}`} />
                              <span>{conversation.isPinned ? t`Unpin` : t`Pin`}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Add this
                                handleArchiveConversation(conversation.id, !conversation.isArchived);
                                setShowMenuFor(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors" // Added transition
                            >
                              <Archive className="w-4 h-4" />
                              <span>{conversation.isArchived ? t`Unarchive` : t`Archive`}</span>
                            </button>
                            
                            {/* Add Export button before the divider */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportConversation(conversation.id);
                                setShowMenuFor(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              <span>{t`Export`}</span>
                            </button>
                            
                            <div className="border-t my-1"></div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Add this
                                handleDeleteConversation(conversation.id, false);
                                setShowMenuFor(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-500 transition-colors" // Added transition
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>{t`Delete`}</span>
                            </button>
                            
                            {/* Add Permanent Delete option */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(conversation.id, true);
                                setShowMenuFor(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>{t`Permanent Delete`}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Footer - Only for memories tab */}
      {activeTab === 'memories' && (
        <div className="p-1 md:p-2 mb-14 border-t border-border bg-card/50">
          <div className="grid grid-cols-3 gap-2 md:gap-3 text-center">
            <div className="flex flex-col items-center">
              <div className="text-lg md:text-xl font-bold text-purple-500 dark:text-purple-400">
                {memories.filter(m => m.importance >= 8).length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{t`Important`}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-lg md:text-xl font-bold text-blue-500 dark:text-blue-400">
                {memories.filter(m => m.contextType === 'career_advice').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{t`Career`}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-lg md:text-xl font-bold text-emerald-500 dark:text-emerald-400">
                {memories.filter(m => m.contextType === 'learning_path').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{t`Learning`}</div>
            </div>
          </div>
          <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              {t`Last updated`}: {formatDate(memories[0]?.updatedAt || new Date().toISOString())}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};