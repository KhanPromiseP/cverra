import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';


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
// In your article.service.ts - update the getArticle function:
export const getArticle = async (identifier: string, params?: any): Promise<any> => {
  try {
    console.log('getArticle called with:', identifier, 'params:', params);
    
    const response = await api.get(`/articles/${identifier}`, { params });
    
    console.log('API Response:', {
      status: response.status,
      data: response.data,
      dataStructure: response.data ? Object.keys(response.data) : 'no data'
    });
    
    // Handle different response formats
    let articleData;
    
    // Format 1: New format { success: true, data: {...}, message: '...' }
    if (response.data && response.data.success === true && response.data.data) {
      articleData = response.data.data;
      console.log('✅ Using new format data from response.data.data');
    }
    // Format 2: Data directly in response.data (old format)
    else if (response.data && (response.data.title || response.data.id)) {
      articleData = response.data;
      console.log('✅ Using old format data directly from response.data');
    }
    
    
    console.log('📦 Article data extracted:', {
      title: articleData?.title,
      hasContent: !!articleData?.content,
      contentType: typeof articleData?.content
    });
    
    return articleData;
    
  } catch (error: any) {
    console.error('Error fetching article:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
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





  

export default api;