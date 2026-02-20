import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';


export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  count?: number;
}

export interface Translation {
  id: string;
  article: {
    id: string;
    title: string;
    slug: string;
  };
  language: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  confidence?: number;
  needsReview: boolean;
  qualityScore?: number;
  lastAccessed?: string;
  accessCount: number;
  translatedBy: 'AI' | 'HUMAN';
  createdAt: string;
}

export interface CategoryTranslation {
  id: string;
  categoryId?: string;
  language: string;
  name: string;
  description?: string;
  slug: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  qualityScore?: number;
  confidence?: number;
  needsReview: boolean;
  translatedBy: 'AI' | 'HUMAN' | string;
  createdAt: string | Date;
  updatedAt: string | Date;
  accessCount?: number;
  lastAccessed?: string;
  article?: {
    id: string;
    title: string;
    slug: string;
  };
}

// ensure consistent response handling
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}



const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // THIS IS CRITICAL - sends cookies automatically
});

// REMOVE the entire token interceptor - we don't need it!
// The browser will automatically send the session cookie with withCredentials: true

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message,
    });
    
    // Redirect to login on 401
    if (error.response?.status === 401) {
      console.warn('Unauthorized (401). User needs to login.');
      window.location.href = '/auth/login';
    }
    
    return Promise.reject({
      message: error.response?.data?.message || 'An error occurred',
      statusCode: error.response?.status,
      data: error.response?.data,
    });
  }
);


// An interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);


// Article APIs
export const getArticle = async (identifier: string, params?: any): Promise<any> => {
  try {
    console.log('📞 getArticle called with:', { identifier, params });
    
    // REMOVE THIS ENTIRE CHECK - it's causing the error
    // const token = localStorage.getItem('token');
    // if (!token) {
    //   console.error('❌ No authentication token found');
    //   throw new Error('You must be logged in to view this article');
    // }
    
    // Also remove the Authorization header - cookies handle this
    const response = await api.get(`/articles/${identifier}`, { 
      params
      // Remove headers.Authorization
    });
    
    console.log('📦 Raw API Response:', response);
    
    // Handle response formats
    let articleData;
    
    if (response.data && response.data.success === true && response.data.data) {
      articleData = response.data.data;
      console.log('✅ Using new format data from response.data.data');
    }
    else if (response.data && (response.data.title || response.data.id)) {
      articleData = response.data;
      console.log('✅ Using old format data directly from response.data');
    }
    
    console.log('📦 Final article data:', {
      title: articleData?.title,
      hasContent: !!articleData?.content,
      contentLength: articleData?.content?.length,
      contentType: typeof articleData?.content,
      isSuperAdminView: articleData?.isSuperAdminView,
      hasAccess: articleData?.hasAccess
    });
    
    return articleData;
    
  } catch (error: any) {
    console.error('❌ Error in getArticle:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    // Don't throw a custom error, let the API error propagate
    throw error;
  }
};

export const getArticles = (params?: any): Promise<any> => 
  api.get('/articles', { params });

// export const getArticle = (id: string): Promise<any> => 
//   api.get(`/articles/${id}`);

export const createArticle = (data: any): Promise<any> => 
  api.post('/articles', data);

// export const updateArticle = (id: string, data: any): Promise<any> => 
//   api.put(`/articles/${id}`, data);

export const updateArticle = async (identifier: string, data: any) => {
  try {
    console.log('updateArticle called with identifier:', identifier);
    
    // Remove the duplicate /api prefix - your axios instance already has it
    const endpoint = `/articles/${identifier}`; // Just /articles/ not /api/articles/
    
    console.log('Using endpoint:', endpoint);
    
    const response = await api.put(endpoint, data);
    
    console.log('Update response:', response.data);
    
    // Handle different response formats
    if (response.data?.data) {
      return { success: true, data: response.data.data };
    }
    
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Error updating article:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
    };
  }
};


export const deleteArticle = (id: string): Promise<any> => 
  api.delete(`/articles/${id}`);

export const updateArticleStatus = (id: string, data: any): Promise<any> => 
  api.patch(`/articles/${id}/status`, data);

// Category APIs
export const getCategories = (): Promise<any[]> => 
  api.get('/articles/categories/all');

export const createCategory = (data: any): Promise<any> => 
  api.post('/articles/categories/create', data);

export const updateCategory = (id: string, data: any): Promise<any> => 
  api.put(`/articles/categories/${id}`, data);

export const deleteCategory = (id: string): Promise<any> => 
  api.delete(`/articles/categories/${id}`);

export const updateCategoryOrder = (data: any[]): Promise<any> => 
  api.put('/articles/categories/order', data);

// Dashboard APIs
export const getDashboardStats = (params?: any): Promise<any> => 
  api.get('/articles/admin/dashboard/stats', { params });

export const getRecentArticles = (): Promise<any> => 
  api.get('/articles/admin/articles/recent');

export const getTopArticles = (): Promise<any> => 
  api.get('/articles/admin/articles/top');

export const getSystemStats = async () => {
  const response = await api.get('/articles/admin/system/stats');
  return response.data;
};

export const getAllUsers = async (page: number = 1, limit: number = 20) => {
  const response = await api.get(`/articles/admin/users/all?page=${page}&limit=${limit}`);
  return response.data;
};

export const getFinancialOverview = async () => {
  const response = await api.get('/articles/admin/financial/overview');
  return response.data;
};



export const getAuditLogs = async (page: number = 1, limit: number = 50) => {
  const response = await api.get(`/articles/admin/audit/logs?page=${page}&limit=${limit}`);
  return response.data;
};



// Category Translation APIs

export const updateCategoryTranslation = async (translationId: string, data: any) => {
  try {
    const response = await api.put(`/articles/translations/category/${translationId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating translation:', error);
    throw error;
  }
};

export const regenerateCategoryTranslation = async (translationId: string) => {
  try {
    const response = await api.post(`/articles/translations/category/${translationId}/regenerate`);
    return response.data;
  } catch (error) {
    console.error('Error regenerating translation:', error);
    throw error;
  }
};

export const getCategoryTranslations = async (categoryId: string): Promise<CategoryTranslation[]> => {
  try {
    console.log(`📥 Fetching translations for category: ${categoryId}`);
    
    // Cast to ApiResponse type
    const response = await api.get<ApiResponse<CategoryTranslation[]>>(
      `/articles/categories/${categoryId}/translations`
    ) as unknown as ApiResponse<CategoryTranslation[]>;
    
    console.log('📦 Category translations response:', response);
    
    if (response && response.success === true) {
      const translations = response.data || [];
      console.log(`📊 Found ${translations.length} translations`);
      return translations;
    }
    
    console.log('⚠️ No translations found or unexpected response format');
    return [];
  } catch (error: any) {
    console.error('❌ Error fetching category translations:', error);
    throw error;
  }
};


export const generateCategoryTranslations = async (categoryId: string): Promise<any> => {
  try {
    console.log(`🚀 Generating translations for category: ${categoryId}`);
    
    const response = await api.post(`/articles/categories/${categoryId}/generate-translations`);
    
    console.log('📦 Generate translations response:', response);
    
    return response;
  } catch (error: any) {
    console.error('❌ Error generating translations:', error);
    throw error;
  }
};




// Translation APIs
// Get translations with proper endpoint
export const getTranslations = async (params?: {
  language?: string;
  status?: string;
  needsReview?: boolean;
  page?: number;
  limit?: number;
}): Promise<any> => {
  const queryParams = new URLSearchParams();
  
  if (params?.language) queryParams.append('language', params.language);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.needsReview !== undefined) queryParams.append('needsReview', params.needsReview.toString());
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  
  // Use the correct endpoint from your controller
  const url = `/articles/translations/all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  console.log('Fetching translations from:', url);
  
  try {
    const response = await api.get(url);
    console.log('Translations response:', response);
    
    // Return the response as-is (the interceptor already returns response.data)
    return response;
  } catch (error: any) {
    console.error('Error fetching translations:', error);
    throw error;
  }
};

// Regenerate translation with proper endpoint
export const regenerateTranslation = async (id: string): Promise<any> => {
  console.log('Regenerating translation:', id);
  
  try {
    const response = await api.post(`/articles/translations/${id}/regenerate`);
    console.log('Regenerate response:', response);
    return response;
  } catch (error: any) {
    console.error('Error regenerating translation:', error);
    throw error;
  }
};

// Update translation with proper endpoint
export const updateTranslation = async (id: string, data: { needsReview?: boolean }): Promise<any> => {
  console.log('Updating translation:', { id, data });
  
  try {
    const response = await api.put(`/articles/translations/${id}`, data);
    console.log('Update translation response:', response);
    return response;
  } catch (error: any) {
    console.error('Error updating translation:', error);
    throw error;
  }
};
// Add this new function to trigger translation for an article
export const triggerArticleTranslation = (articleId: string, targetLanguage: string, force?: boolean): Promise<any> => 
  api.post(`/articles/${articleId}/translate`, { targetLanguage, force });

// Add this function to get available languages for an article
export const getArticleAvailableLanguages = (articleId: string): Promise<any> => 
  api.get(`/articles/${articleId}/languages`);

// Add this function to get article info by ID (for your getArticle helper)
export const getArticleInfo = (id: string): Promise<any> => 
  api.get(`/articles/info/${id}`);

// Add this function to get translation status
export const getTranslationStatus = (articleId: string): Promise<any> => 
  api.get(`/articles/translations/status/${articleId}`);

// Upload APIs
export const uploadImage = (formData: FormData): Promise<any> => 
  api.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });






// ========== DRAFT MANAGEMENT ENDPOINTS ==========

// Get drafts with filters
export interface DraftParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  authorId?: string;
  category?: string;
}

export interface DraftResponse {
  drafts: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getDrafts = async (params: DraftParams = {}): Promise<DraftResponse> => {
  try {
    console.log('Fetching drafts with params:', params);
    
    // Use type assertion
    const data = await api.get('/articles/admin/drafts', { params }) as DraftResponse;
    
    console.log('Drafts API data:', data);
    
    return data;
    
  } catch (error: any) {
    console.error('Error fetching drafts:', error);
    throw error;
  }
};


// Submit draft for review
export const submitDraftForReview = async (draftId: string): Promise<any> => {
  try {
    console.log('Submitting draft for review:', draftId);
    
    const response = await api.post(`/articles/admin/drafts/${draftId}/submit-for-review`);
    
    console.log('Submit for review response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error submitting draft for review:', error);
    throw error;
  }
};

// Update draft status (approve/reject/request revision)
export interface UpdateDraftStatusData {
  status: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'PUBLISHED';
  message?: string;
}

export const updateDraftStatus = async (
  draftId: string, 
  data: UpdateDraftStatusData
): Promise<any> => {
  try {
    console.log('Updating draft status:', { draftId, data });
    
    const response = await api.put(`/articles/admin/drafts/${draftId}/status`, data);
    
    console.log('Update draft status response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error updating draft status:', error);
    throw error;
  }
};

// Get validation messages for a draft
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

export const getDraftValidationMessages = async (draftId: string): Promise<ValidationMessage[]> => {
  try {
    console.log('Fetching validation messages for draft:', draftId);
    
    // Add proper typing
    const response = await api.get<ValidationMessage[]>(`/articles/admin/drafts/${draftId}/validation-messages`);
    
    console.log('Validation messages response:', response.data);
    
    // Return the data property
    return response.data || [];
    
  } catch (error: any) {
    console.error('Error fetching validation messages:', error);
    throw error;
  }
};

// Add validation message
export interface AddValidationMessageData {
  message: string;
  type: 'ERROR' | 'WARNING' | 'SUGGESTION' | 'REJECTION';
  section?: string;
  lineNumber?: number;
}

export const addValidationMessage = async (
  draftId: string,
  data: AddValidationMessageData
): Promise<any> => {
  try {
    console.log('Adding validation message:', { draftId, data });
    
    const response = await api.post(`/articles/admin/drafts/${draftId}/validation-messages`, data);
    
    console.log('Add validation message response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error adding validation message:', error);
    throw error;
  }
};

// Mark validation message as resolved
export const markValidationMessageResolved = async (messageId: string): Promise<any> => {
  try {
    console.log('Marking validation message as resolved:', messageId);
    
    const response = await api.put(`/articles/admin/validation-messages/${messageId}/resolve`);
    
    console.log('Mark message resolved response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error marking validation message as resolved:', error);
    throw error;
  }
};

// Delete draft
export const deleteDraft = async (draftId: string): Promise<any> => {
  try {
    console.log('Deleting draft:', draftId);
    
    const response = await api.delete(`/articles/admin/drafts/${draftId}`);
    
    console.log('Delete draft response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting draft:', error);
    throw error;
  }
};

// Additional draft management functions

// Get draft statistics (optional - if you have this endpoint)
export const getDraftStats = async (): Promise<any> => {
  try {
    const response = await api.get('/articles/admin/drafts/stats');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching draft stats:', error);
    throw error;
  }
};

// Get my drafts (for regular admins)
export const getMyDrafts = async (params?: DraftParams): Promise<DraftResponse> => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    throw new Error('User ID not found in localStorage');
  }
  
  return getDrafts({
    ...params,
    authorId: userId,
  });
};

// Get drafts for review (for super admins)
export const getDraftsForReview = async (params?: Omit<DraftParams, 'status'>): Promise<DraftResponse> => {
  return getDrafts({
    ...params,
    status: 'UNDER_REVIEW',
  });
};

// Get approved drafts
export const getApprovedDrafts = async (params?: Omit<DraftParams, 'status'>): Promise<DraftResponse> => {
  return getDrafts({
    ...params,
    status: 'APPROVED',
  });
};

// Get rejected drafts
export const getRejectedDrafts = async (params?: Omit<DraftParams, 'status'>): Promise<DraftResponse> => {
  return getDrafts({
    ...params,
    status: 'REJECTED',
  });
};

// Get drafts needing revision
export const getDraftsNeedingRevision = async (params?: Omit<DraftParams, 'status'>): Promise<DraftResponse> => {
  return getDrafts({
    ...params,
    status: 'NEEDS_REVISION',
  });
};

// Bulk update draft status (if you have this endpoint)
export const bulkUpdateDraftStatus = async (draftIds: string[], status: string): Promise<any> => {
  try {
    const response = await api.post('/articles/admin/drafts/bulk-status', {
      draftIds,
      status,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error bulk updating draft status:', error);
    throw error;
  }
};

// Add comment to draft (if you have this endpoint)
export const addDraftComment = async (draftId: string, comment: string): Promise<any> => {
  try {
    const response = await api.post(`/articles/admin/drafts/${draftId}/comments`, {
      comment,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error adding draft comment:', error);
    throw error;
  }
};

// Get draft activity log (if you have this endpoint)
export const getDraftActivityLog = async (draftId: string): Promise<any> => {
  try {
    const response = await api.get(`/articles/admin/drafts/${draftId}/activity`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching draft activity:', error);
    throw error;
  }
};



  

export default api;