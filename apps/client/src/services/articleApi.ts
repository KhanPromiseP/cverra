// services/articleApi.ts
import { apiClient } from './api-client';


// Interfaces
export interface Author {
  id: string;
  name: string;
  picture?: string;
  bio?: string;
  isVerified: boolean;
  followersCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
  description?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: any; // Can be TipTap JSON or plain text
  plainText?: string; // Add this property
  coverImage?: string;
  readingTime: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  clapCount?: number;
  shareCount?: number;
  isFeatured: boolean;
  isTrending: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
  isPremium: boolean;
  isPreview?: boolean; // Add this property
  accessType: 'FREE' | 'PREMIUM' | 'SUBSCRIPTION';
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  author: Author;
  category: Category;
  tags: string[];
  availableLanguages: string[];
  language?: string;
  translationQuality?: number; // Add this property
  recommendationScore?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}


export interface ArticleListDto {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages?: number;
  filters?: {
    category?: string;
    tag?: string;
    status?: string;
    accessType?: string;
    featured?: boolean;
    trending?: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  likesCount?: number;
  likeCount?: number; // Some APIs use likeCount instead of likesCount
  isLiked?: boolean;
  isOwn?: boolean;
  isEdited?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
  replyCount?: number;
  language?: string;
  author?: Author; // Some APIs use 'user' instead of 'author'
  user?: Author;   // Add this to support both
  replies?: Comment[];
  parentId?: string;
}
export interface ReadingProfile {
  preferredCategories: string[];
  readingLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  preferredReadingTime: number;
  interests: string[];
  readingStreak: number;
  totalArticlesRead: number;
  totalReadingTime: number;
}

export interface FilterParams {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  sort?: 'recent' | 'popular' | 'trending' | 'reading_time';
  search?: string;
  language?: string;
  author?: string;
  status?: string;
  featured?: boolean;
  trending?: boolean;
  accessType?: 'FREE' | 'PREMIUM' | 'ALL';
  readingTime?: 'short' | 'medium' | 'long';
}


export interface ClapRequest {
  count: number;
  language?: string;
}

export interface ShareRequest {
  platform: string;
  language?: string;
}

// Search interfaces
export interface SearchFilters {
  category?: string[];
  tags?: string[];
  readingTime?: [number, number];
  publishedDate?: [string, string] | null;
  accessType?: string[];
  sortBy?: 'relevance' | 'recent' | 'popular' | 'reading_time';
}

// Main API object
export const articleApi = {
  // Get articles with pagination and filters
 getArticles: (params?: FilterParams): Promise<ApiResponse<ArticleListDto>> => 
    apiClient.get('/articles', { params }),
  
  
  // In article.service.ts, update getArticle function:
getArticle: async (identifier: string, params?: { language?: string }): Promise<any> => {
  const queryParams = new URLSearchParams();
  if (params?.language) {
    queryParams.append('language', params.language);
  }
  
  const url = `/articles/${identifier}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  // Make sure to return the full axios response
  const response = await apiClient.get(url);
  
  // Return as ApiResponse structure
  return {
    success: true,
    data: response.data,
    status: response.status,
  };
},


// get all users via Admin analytics
getAnalytics: (timeframe: string) => {
  return apiClient.get(`/admin/analytics?timeframe=${timeframe}`);
},

// Add function to get available languages
getArticleAvailableLanguages:(articleId: string): Promise<any> => 
  apiClient.get(`/articles/${articleId}/languages`),


// Translate article
translateArticle: (articleId: string, targetLanguage: string): Promise<any> => 
  apiClient.post(`/articles/${articleId}/translate`, { targetLanguage }),

  // Get single article
  // getArticle: (slug: string, language?: string): Promise<ApiResponse<Article>> => 
  //   apiClient.get(`/articles/${slug}`, { params: { language } }),
  
  // Personalized feed
  getPersonalizedFeed: (params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => 
    apiClient.get('/articles/feed/personalized', { params }),
  
  // Trending articles
  getTrendingArticles: (params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => 
    apiClient.get('/articles/feed/trending', { params }),
  
  // Recommended articles
  getRecommendedArticles: (params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => 
    apiClient.get('/articles/feed/recommended', { params }),
  
  // Related articles
  getRelatedArticles: (articleId: string, params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => 
    apiClient.get(`/articles/${articleId}/related`, { params }),
  
  // Engagement actions
  likeArticle: (articleId: string, language?: string): Promise<ApiResponse<{ liked: boolean }>> => 
    apiClient.post(`/articles/${articleId}/like`, { language }),
  
  saveArticle: (articleId: string, language?: string): Promise<ApiResponse<{ saved: boolean }>> => 
    apiClient.post(`/articles/${articleId}/save`, { language }),
  
  clapArticle: (articleId: string, count: number, language?: string): Promise<ApiResponse<{ claps: number }>> => 
    apiClient.post(`/articles/${articleId}/clap`, { count, language }),
  
  shareArticle: (articleId: string, platform: string, language?: string): Promise<ApiResponse<{ shared: boolean }>> => 
    apiClient.post(`/articles/${articleId}/share`, { platform, language }),
  
  // Comments
  getComments: (articleId: string, params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Comment>>> => 
    apiClient.get(`/articles/${articleId}/comments`, { params }),
  
  addComment: (articleId: string, data: { content: string; parentId?: string }): Promise<ApiResponse<Comment>> => 
    apiClient.post(`/articles/${articleId}/comments`, data),


  updateComment: (commentId: string, data: { content: string }): Promise<ApiResponse<Comment>> =>
    apiClient.put(`/articles/comments/${commentId}`, data),

  
  likeComment: (commentId: string): Promise<ApiResponse<{ liked: boolean }>> => 
    apiClient.post(`/articles/comments/${commentId}/like`),
  
  deleteComment: (commentId: string): Promise<ApiResponse<{ deleted: boolean }>> => 
    apiClient.delete(`/articles/comments/${commentId}`),
  

  // Premium content
  purchaseArticle: (articleId: string): Promise<ApiResponse<{ purchased: boolean }>> => 
    apiClient.post(`/articles/${articleId}/purchase`),
  
  // Reading profile
  getReadingProfile: (): Promise<ApiResponse<ReadingProfile>> => 
    apiClient.get('/user/reading-profile'),
  
  getReadingHistory: (params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => 
    apiClient.get('/user/reading-history', { params }),
  
  // getUserAchievements: (): Promise<ApiResponse<any>> => 
  //   apiClient.get('/user/achievements'),
  
  updateReadingProfile: (data: Partial<ReadingProfile>): Promise<ApiResponse<ReadingProfile>> => 
    apiClient.put('/user/reading-profile', data),
  
  // Categories

  getCategories: (): Promise<ApiResponse<Category[]>> => 
    apiClient.get('/articles/categories/all'),

  getCategoryArticles: (slug: string, params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => 
    apiClient.get(`/articles/category/${slug}`, { params }), 


  // Search
  // searchArticles: (query: string, params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => 
  //   apiClient.get('/search/articles', { params: { q: query, ...params } }),

  // View tracking
  trackArticleView: (articleId: string, duration?: number): Promise<ApiResponse<{ tracked: boolean }>> =>
    apiClient.post(`/articles/${articleId}/view`, { duration }),

  // Bulk operations
  bulkLikeArticles: (articleIds: string[]): Promise<ApiResponse<{ success: boolean }>> =>
    apiClient.post('/articles/bulk/like', { articleIds }),

  bulkSaveArticles: (articleIds: string[]): Promise<ApiResponse<{ success: boolean }>> =>
    apiClient.post('/articles/bulk/save', { articleIds }),


   // Search functions (updated without language)
  searchArticles: async (query: string, filters?: SearchFilters): Promise<ApiResponse<PaginatedResponse<Article>>> => {
    const params: any = { q: query };
    
    if (filters) {
      if (filters.category?.length) params.category = filters.category.join(',');
      if (filters.tags?.length) params.tags = filters.tags.join(',');
      if (filters.readingTime) {
        params.minReadingTime = filters.readingTime[0];
        params.maxReadingTime = filters.readingTime[1];
      }
      if (filters.publishedDate) {
        params.publishedFrom = filters.publishedDate[0];
        params.publishedTo = filters.publishedDate[1];
      }
      if (filters.accessType?.length) params.accessType = filters.accessType.join(',');
      if (filters.sortBy) params.sortBy = filters.sortBy;
    }
    
    return apiClient.get('/search/articles', { params });
  },

  getSearchSuggestions: async (query: string): Promise<string[]> => {
    try {
      const response = await apiClient.get('/search/suggestions', { 
        params: { q: query, limit: 10 }
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      return [];
    }
  },

  getTrendingSearches: async (): Promise<string[]> => {
    try {
      const response = await apiClient.get('/search/trending');
      return response.data?.data || [];
    } catch (error) {
      console.error('Failed to fetch trending searches:', error);
      return ['productivity tips', 'career growth', 'mindfulness', 'leadership'];
    }
  },



  // Like a comment
  // likeComment: async (commentId: string) => {
  //   try {
  //     const response = await apiClient.post(`/comments/${commentId}/like`);
  //     return response.data;
  //   } catch (error) {
  //     throw error;
  //   }
  // },

  // Unlike a comment
  unlikeComment: async (commentId: string) => {
    try {
      const response = await apiClient.post(`/comments/${commentId}/unlike`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },


  // User profile endpoints
getUserSavedArticles: (params?: { page?: number; limit?: number }): Promise<any> => 
  apiClient.get('/articles/user/saved', { params }),

removeSavedArticle: (articleId: string): Promise<any> => 
  apiClient.delete(`/articles/user/saved/${articleId}`),

getUserPremiumAccess: (): Promise<any> => 
  apiClient.get('/articles/user/premium-access'),

getUserReadingStats: (): Promise<any> => 
  apiClient.get('/articles/user/reading/stats'),

getUserReadingProfile: (): Promise<any> => 
  apiClient.get('/articles/user/reading-profile'),

updateUserReadingProfile: (data: any): Promise<any> => 
  apiClient.put('/articles/user/reading-profile', data),

getRecommendationStats: (): Promise<any> => 
  apiClient.get('/articles/recommendations/stats'),

exportArticlePDF: (articleId: string): Promise<Blob> => 
  apiClient.get(`/articles/${articleId}/export/pdf`, { 
    responseType: 'blob' 
  }),


  // All articles page endpoints
getFilterOptions: (): Promise<any> =>
  apiClient.get('/articles/all/filters'),

getFilteredArticles: (params: {
  page?: number;
  limit?: number;
  category?: string | string[];
  tag?: string;
  accessType?: 'all' | 'free' | 'premium';
  featured?: boolean;
  trending?: boolean;
  search?: string;
  sort?: string;
  readingTime?: 'short' | 'medium' | 'long' | 'any';
  authors?: string[];
  languages?: string[];
  tags?: string[];
  categories?: string[];
}): Promise<any> =>
  apiClient.post('/articles/all/filtered', params),

getArticleOverviewStats: (): Promise<any> =>
  apiClient.get('/articles/stats/overview'),

// Bulk operations for All Articles page
bulkToggleSaveArticles: (articleIds: string[], save: boolean): Promise<any> =>
  apiClient.post('/articles/bulk/save-toggle', { articleIds, save }),

bulkToggleLikeArticles: (articleIds: string[], like: boolean): Promise<any> =>
  apiClient.post('/articles/bulk/like-toggle', { articleIds, like }),

// Export functionality
exportFilteredArticles: (params: any): Promise<Blob> =>
  apiClient.post('/articles/export/filtered', params, { 
    responseType: 'blob' 
  }),

// Advanced search
advancedSearch: (params: {
  query: string;
  categoryIds?: string[];
  tagIds?: string[];
  authorIds?: string[];
  minReadingTime?: number;
  maxReadingTime?: number;
  publishedAfter?: string;
  publishedBefore?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}): Promise<any> =>
  apiClient.post('/articles/search/advanced', params),

// Save/Load filter presets
saveFilterPreset: (preset: {
  name: string;
  filters: any;
}): Promise<any> =>
  apiClient.post('/articles/filters/save', preset),

getSavedFilterPresets: (): Promise<any> =>
  apiClient.get('/articles/filters/saved'),

deleteFilterPreset: (presetId: string): Promise<any> =>
  apiClient.delete(`/articles/filters/${presetId}`),



  // User achievements
getUserAchievements: (): Promise<any> => 
  apiClient.get('/articles/user/achievements'),

getAchievementStats: (): Promise<any> => 
  apiClient.get('/articles/user/achievements/stats'),

getRecentActivity: (params?: { limit?: number }): Promise<any> => 
  apiClient.get('/articles/user/activity/recent', { params }),

getReadingStats: (): Promise<any> => 
  apiClient.get('/articles/user/reading/stats'),

};




export default articleApi;