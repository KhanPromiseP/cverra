
import { Conversation } from '../types/assistant';

export interface ConversationFilter {
  filter?: 'all' | 'active' | 'archived' | 'deleted' | 'starred' | 'pinned';
  limit?: number;
  offset?: number;
  search?: string;
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

class ConversationService {
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    };
  }

  // Get conversations with filtering
  async getConversations(params?: ConversationFilter) {
    const queryParams = new URLSearchParams();
    if (params?.filter) queryParams.append('filter', params.filter);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.search) queryParams.append('search', params.search);

    const response = await fetch(`/api/assistant/conversations${queryParams.toString() ? `?${queryParams}` : ''}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
  }

  // Get single conversation
  async getConversation(id: string) {
    const response = await fetch(`/api/assistant/conversations/${id}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch conversation');
    return response.json();
  }

  // Clear conversation messages
  async clearConversation(id: string) {
    const response = await fetch(`/api/assistant/conversations/${id}/clear`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ conversationId: id }),
    });
    if (!response.ok) throw new Error('Failed to clear conversation');
    return response.json();
  }

  // Delete conversation
  async deleteConversation(id: string, permanent: boolean = false) {
    const response = await fetch(`/api/assistant/conversations/${id}/delete`, { // ✅ Fixed endpoint
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ conversationId: id, permanent }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to delete conversation');
    }
    return response.json();
  }

  // Restore conversation
  async restoreConversation(id: string) {
    const response = await fetch(`/api/assistant/conversations/${id}/restore`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ conversationId: id }),
    });
    if (!response.ok) throw new Error('Failed to restore conversation');
    return response.json();
  }

  // Archive/Unarchive conversation
  async archiveConversation(id: string, archive: boolean = true) {
    const response = await fetch(`/api/assistant/conversations/${id}/archive`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ conversationId: id, archive }),
    });
    if (!response.ok) throw new Error('Failed to archive conversation');
    return response.json();
  }

  // Star/Unstar conversation
  async starConversation(id: string, star: boolean) {
    const response = await fetch(`/api/assistant/conversations/${id}/star`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ conversationId: id, star }),
    });
    if (!response.ok) throw new Error('Failed to star conversation');
    return response.json();
  }

  // Pin/Unpin conversation
  async pinConversation(id: string, pin: boolean) {
    const response = await fetch(`/api/assistant/conversations/${id}/pin`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ conversationId: id, pin }),
    });
    if (!response.ok) throw new Error('Failed to pin conversation');
    return response.json();
  }

  // Update conversation title
  async updateConversationTitle(id: string, title: string) {
    const response = await fetch(`/api/assistant/conversations/${id}/title`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error('Failed to update title');
    return response.json();
  }

  // Get deleted conversations
  async getDeletedConversations(limit: number = 20, offset: number = 0) {
    const response = await fetch(`/api/assistant/conversations/trash?limit=${limit}&offset=${offset}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch deleted conversations');
    return response.json();
  }

  // Empty trash
  async emptyTrash() {
    const response = await fetch('/api/assistant/conversations/trash/empty', {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ confirm: true }),
    });
    if (!response.ok) throw new Error('Failed to empty trash');
    return response.json();
  }

  // Get analytics
  async getAnalytics(timeframe: 'day' | 'week' | 'month' | 'year' = 'month') {
    const response = await fetch(`/api/assistant/conversations/analytics?timeframe=${timeframe}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  }

  // Export conversation
  async exportConversation(id: string, format: 'json' | 'txt' | 'md' = 'json') {
    const response = await fetch(`/api/assistant/conversations/${id}/export?format=${format}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to export conversation');
    
    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `conversation-${id}.${format}`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) filename = filenameMatch[1];
    }
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { filename, format };
  }
}

export default new ConversationService();