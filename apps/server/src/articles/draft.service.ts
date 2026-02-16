import { t } from "@lingui/macro";
import { message } from 'antd';

const API_BASE = '/api';

export interface DraftParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  authorId?: string;
  category?: string;
}

export interface DraftArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  category: {
    id: string;
    name: string;
    color?: string;
  };
  author: {
    id: string;
    name: string;
    picture?: string;
  };
  createdAt: string;
  updatedAt: string;
  submittedForReviewAt?: string;
  reviewedAt?: string;
  reviewerId?: string;
  reviewerName?: string;
  validationMessages?: ValidationMessage[];
  wordCount: number;
  imagesCount: number;
  tags: string[];
  targetLanguages?: string[];
  autoTranslate?: boolean;
  accessType?: 'FREE' | 'PREMIUM';
  coinPrice?: number;
}

export interface ValidationMessage {
  id: string;
  message: string;
  type: 'ERROR' | 'WARNING' | 'SUGGESTION' | 'REJECTION';
  section?: string;
  lineNumber?: number;
  createdBy: {
    id: string;
    name: string;
    role: string;
    picture?: string;
  };
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: {
    id: string;
    name: string;
  };
}

// Get all drafts (with filters)
export const getDrafts = async (params: DraftParams = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.authorId) queryParams.append('authorId', params.authorId);
    if (params.category) queryParams.append('category', params.category);
    
    const response = await fetch(`${API_BASE}/drafts?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch drafts: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching drafts:', error);
    message.error(t`Failed to load drafts: ${error.message}`);
    return { drafts: [], total: 0, page: 1, limit: 20 };
  }
};

// Update draft status
export const updateDraftStatus = async (
  draftId: string, 
  status: DraftArticle['status'], 
  message?: string
) => {
  try {
    const response = await fetch(`${API_BASE}/drafts/${draftId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, message }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update draft status: ${response.statusText}`);
    }
    
    const result = await response.json();
   
    return result;
  } catch (error: any) {
    console.error('Error updating draft status:', error);
    
    throw error;
  }
};

// Get validation messages for a draft
export const getDraftValidationMessages = async (draftId: string) => {
  try {
    const response = await fetch(`${API_BASE}/drafts/${draftId}/validation-messages`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch validation messages: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching validation messages:', error);
    message.error(t`Failed to load validation messages: ${error.message}`);
    return [];
  }
};

// Add validation message
export const addValidationMessage = async (
  draftId: string, 
  messageData: { message: string; type: string; section?: string; lineNumber?: number }
) => {
  try {
    const response = await fetch(`${API_BASE}/drafts/${draftId}/validation-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add validation message: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error adding validation message:', error);
    message.error(t`Failed to add validation message: ${error.message}`);
    throw error;
  }
};

// Delete draft
export const deleteDraft = async (draftId: string) => {
  try {
    const response = await fetch(`${API_BASE}/drafts/${draftId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete draft: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error deleting draft:', error);
    message.error(t`Failed to delete draft: ${error.message}`);
    throw error;
  }
};

// Submit draft for review
export const submitDraftForReview = async (draftId: string) => {
  try {
    const response = await fetch(`${API_BASE}/drafts/${draftId}/submit-for-review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit for review: ${response.statusText}`);
    }
    
    const result = await response.json();
    message.success(t`Draft submitted for review`);
    return result;
  } catch (error: any) {
    console.error('Error submitting draft for review:', error);
    message.error(t`Failed to submit for review: ${error.message}`);
    throw error;
  }
};

// Mark validation message as resolved
export const markMessageResolved = async (messageId: string) => {
  try {
    const response = await fetch(`${API_BASE}/validation-messages/${messageId}/resolve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to mark message as resolved: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error marking message as resolved:', error);
    message.error(t`Failed to mark message as resolved: ${error.message}`);
    throw error;
  }
};