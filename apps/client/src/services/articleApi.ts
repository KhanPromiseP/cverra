

// import { apiClient } from './api-client';


// // Interfaces
// export interface Author {
//   id: string;
//   name: string;
//   picture?: string;
//   bio?: string;
//   isVerified: boolean;
//   followersCount: number;
// }

// export interface Category {
//   id: string;
//   name: string;
//   slug: string;
//   color?: string;
//   description?: string;
// }

// export interface Article {
//   id: string;
//   slug: string;
//   title: string;
//   excerpt: string;
//   content?: any;
//   plainText?: string;
//   coverImage?: string;
//   readingTime: number;
//   viewCount: number;
//   likeCount: number;
//   commentCount: number;
//   clapCount?: number;
//   shareCount?: number;
//   isFeatured: boolean;
//   isTrending: boolean;
//   isLiked?: boolean;
//   isSaved?: boolean;
//   isPremium: boolean;
//   isPreview?: boolean;
//   accessType: 'FREE' | 'PREMIUM' | 'SUBSCRIPTION';
//   status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
//   publishedAt: string;
//   createdAt: string;
//   updatedAt: string;
//   author: Author;
//   category: Category;
//   tags: string[];
//   availableLanguages: string[];
//   language?: string;
//   translationQuality?: number;
//   recommendationScore?: number;
  
//   // ADD THIS: Translations property
//   translations?: Record<string, { title: string; excerpt: string }>;
  
//   // OR if your translations come as an array from backend:
//   // translations?: Array<{
//   //   language: string;
//   //   title: string;
//   //   excerpt: string;
//   //   [key: string]: any;
//   // }>;
// }

// export interface PaginatedResponse<T> {
//   data: T[];
//   total: number;
//   page: number;
//   limit: number;
//   totalPages: number;
//   hasMore: boolean;
// }


// export interface ArticleListDto {
//   articles: Article[];
//   total: number;
//   page: number;
//   limit: number;
//   hasMore: boolean;
//   totalPages?: number;
//   filters?: {
//     category?: string;
//     tag?: string;
//     status?: string;
//     accessType?: string;
//     featured?: boolean;
//     trending?: boolean;
//   };
// }

// export interface ApiResponse<T> {
//   success: boolean;
//   data: T;
//   message?: string;
//   error?: string;
// }

// export interface Comment {
//   id: string;
//   content: string;
//   createdAt: string;
//   updatedAt: string;
//   likesCount?: number;
//   likeCount?: number; // Some APIs use likeCount instead of likesCount
//   isLiked?: boolean;
//   isOwn?: boolean;
//   isEdited?: boolean;
//   isFeatured?: boolean;
//   isPinned?: boolean;
//   replyCount?: number;
//   language?: string;
//   author?: Author; // Some APIs use 'user' instead of 'author'
//   user?: Author;   // Add this to support both
//   replies?: Comment[];
//   parentId?: string;
// }
// export interface ReadingProfile {
//   preferredCategories: string[];
//   readingLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
//   preferredReadingTime: number;
//   interests: string[];
//   readingStreak: number;
//   totalArticlesRead: number;
//   totalReadingTime: number;
// }

// export interface FilterParams {
//   page?: number;
//   limit?: number;
//   category?: string;
//   tag?: string;
//   sort?: 'recent' | 'popular' | 'trending' | 'reading_time';
//   search?: string;
//   language?: string;
//   author?: string;
//   status?: string;
//   featured?: boolean;
//   trending?: boolean;
//   accessType?: 'FREE' | 'PREMIUM' | 'ALL';
//   readingTime?: 'short' | 'medium' | 'long';
// }






// export interface ClapRequest {
//   count: number;
//   language?: string;
// }

// export interface ShareRequest {
//   platform: string;
//   language?: string;
// }

// // Search interfaces
// export interface SearchFilters {
//   category?: string[];
//   tags?: string[];
//   readingTime?: [number, number];
//   publishedDate?: [string, string] | null;
//   accessType?: string[];
//   sortBy?: 'relevance' | 'recent' | 'popular' | 'reading_time';
// }

// // Main API object
// export const articleApi = {
//   // Get articles with pagination and filters
//  getArticles: (params?: FilterParams): Promise<ApiResponse<ArticleListDto>> => 
//     apiClient.get('/articles', { params }),
  
  
//   // In article.service.ts, update getArticle function:
// // getArticle: async (identifier: string, params?: { language?: string }): Promise<any> => {
// //   const queryParams = new URLSearchParams();
// //   if (params?.language) {
// //     queryParams.append('language', params.language);
// //   }
  
// //   const url = `/articles/${identifier}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
// //   // Make sure to return the full axios response
// //   const response = await apiClient.get(url);
  
// //   // Return as ApiResponse structure
// //   return {
// //     success: true,
// //     data: response.data,
// //     status: response.status,
// //   };
// // },

// getArticle: async (identifier: string, params?: { language?: string }): Promise<any> => {
//   console.log('📡 Frontend getArticle called:', { identifier, params });
  
//   const queryParams = new URLSearchParams();
//   if (params?.language) {
//     queryParams.append('language', params.language);
//     console.log('🌐 Language parameter added:', params.language);
//   }
  
//   const url = `/articles/${identifier}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
//   console.log('🌐 Making request to:', url);
  
//   try {
//     const response = await apiClient.get(url);
    
//     console.log('📥 Article response received:', {
//       title: response.data?.title,
//       hasTranslations: !!response.data?.translations,
//       translationKeys: response.data?.translations ? Object.keys(response.data.translations) : [],
//       availableLanguages: response.data?.availableLanguages,
//       language: response.data?.language
//     });
    
//     if (response.data?.translations) {
//       console.log('🔤 Translations object:', response.data.translations);
//       console.log('🇫🇷 French title exists:', !!response.data.translations['fr']);
//       if (response.data.translations['fr']) {
//         console.log('🇫🇷 French title:', response.data.translations['fr'].title);
//       }
//     }
    
//     return {
//       success: true,
//       data: response.data,
//       status: response.status,
//     };
//   } catch (error: any) {
//     console.error('❌ Error fetching article:', error);
//     return {
//       success: false,
//       error: error.message,
//       status: error.response?.status,
//     };
//   }
// },


// // get all users via Admin analytics
// getAnalytics: (timeframe: string) => {
//   return apiClient.get(`/admin/analytics?timeframe=${timeframe}`);
// },

// // Add function to get available languages
// getArticleAvailableLanguages:(articleId: string): Promise<any> => 
//   apiClient.get(`/articles/${articleId}/languages`),


// // Translate article
// translateArticle: async (articleId: string, targetLanguage: string): Promise<any> => {
//   console.log('📤 Sending translation request to:', `/articles/${articleId}/translate`);
//   console.log('Request payload:', { targetLanguage });
  
//   try {
//     const response = await apiClient.post(`/articles/${articleId}/translate`, { 
//       targetLanguage 
//     });
    
//     console.log('📥 Translation response received:', {
//       status: response.status,
//       statusText: response.statusText,
//       data: response.data
//     });
    
//     // Handle different response formats
//     const responseData = response.data;
    
//     // If it's already in ApiResponse format, return as-is
//     if (responseData && typeof responseData === 'object') {
//       if ('success' in responseData || 'data' in responseData) {
//         return responseData;
//       }
//       // If it's the raw ArticleTranslation object, wrap it
//       return {
//         success: true,
//         data: responseData,
//         message: 'Translation requested successfully',
//         status: response.status
//       };
//     }
    
//     // Default wrapper
//     return {
//       success: response.status >= 200 && response.status < 300,
//       data: responseData,
//       status: response.status,
//       message: 'Translation processing started'
//     };
    
//   } catch (error: any) {
//     // Log real technical error to console
//     console.error('❌ Translation API error (Technical):', {
//       message: error.message,
//       response: error.response?.data,
//       status: error.response?.status,
//       stack: error.stack // For debugging
//     });
    
//     // Return user-friendly error message from FRONTEND
//     return {
//       success: false,
//       error: 'Translation service is temporarily unavailable. Please try again in a moment.',
//       // Keep technical details for debugging
//       technicalError: error.response?.data?.message || error.message || 'Translation request failed',
//       status: error.response?.status || 500,
//       message: 'Translation service unavailable' // User-friendly
//     };
//   }
// },

//    // Get categories with optional language parameter
//   getCategories: async (language?: string): Promise<ApiResponse<Category[]>> => {
//     try {
//       const params = new URLSearchParams();
//       if (language) {
//         params.append('language', language);
//       }

//       const response = await apiClient.get(`/articles/categories/all?${params.toString()}`);
//       return {
//         success: true,
//         data: response.data,
//         status: response.status,
//       };
//     } catch (error: any) {
//       console.error('Error fetching categories:', error);
//       return {
//         success: false,
//         error: error.message,
//         data: [],
//         status: error.response?.status,
//       };
//     }
//   },

//   // Get single category with language
//   getCategory: async (slug: string, language?: string): Promise<ApiResponse<Category>> => {
//     try {
//       const params = new URLSearchParams();
//       if (language) {
//         params.append('language', language);
//       }
      
//       const response = await apiClient.get(`/articles/category/${slug}?${params.toString()}`);
//       return {
//         success: true,
//         data: response.data,
//         status: response.status,
//       };
//     } catch (error: any) {
//       console.error('Error fetching category:', error);
//       return {
//         success: false,
//         error: error.message,
//         data: null,
//         status: error.response?.status,
//       };
//     }
//   },


//   // Get single article
//   // getArticle: (slug: string, language?: string): Promise<ApiResponse<Article>> => 
//   //   apiClient.get(`/articles/${slug}`, { params: { language } }),
  
//   // Personalized feed
//   getPersonalizedFeed: (params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => 
//     apiClient.get('/articles/feed/personalized', { params }),
  
//   // Trending articles
//   getTrendingArticles: (params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => 
//     apiClient.get('/articles/feed/trending', { params }),
  
//   // Recommended articles
//   getRecommendedArticles: (params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => 
//     apiClient.get('/articles/feed/recommended', { params }),
  
//   // Related articles
//   getRelatedArticles: (articleId: string, params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => 
//     apiClient.get(`/articles/${articleId}/related`, { params }),
  
//   // Engagement actions
//   likeArticle: (articleId: string, language?: string): Promise<ApiResponse<{ liked: boolean }>> => 
//     apiClient.post(`/articles/${articleId}/like`, { language }),
  
//   saveArticle: (articleId: string, language?: string): Promise<ApiResponse<{ saved: boolean }>> => 
//     apiClient.post(`/articles/${articleId}/save`, { language }),
  
//   clapArticle: (articleId: string, count: number, language?: string): Promise<ApiResponse<{ claps: number }>> => 
//     apiClient.post(`/articles/${articleId}/clap`, { count, language }),
  
//   shareArticle: (articleId: string, platform: string, language?: string): Promise<ApiResponse<{ shared: boolean }>> => 
//     apiClient.post(`/articles/${articleId}/share`, { platform, language }),
  
//   // Comments
//   getComments: (articleId: string, params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Comment>>> => 
//     apiClient.get(`/articles/${articleId}/comments`, { params }),
  
//   addComment: (articleId: string, data: { content: string; parentId?: string }): Promise<ApiResponse<Comment>> => 
//     apiClient.post(`/articles/${articleId}/comments`, data),


//   updateComment: (commentId: string, data: { content: string }): Promise<ApiResponse<Comment>> =>
//     apiClient.put(`/articles/comments/${commentId}`, data),

  
//   likeComment: (commentId: string): Promise<ApiResponse<{ liked: boolean }>> => 
//     apiClient.post(`/articles/comments/${commentId}/like`),
  
//   deleteComment: (commentId: string): Promise<ApiResponse<{ deleted: boolean }>> => 
//     apiClient.delete(`/articles/comments/${commentId}`),
  

//   // Premium content
//   purchaseArticle: (articleId: string): Promise<ApiResponse<{ purchased: boolean }>> => 
//     apiClient.post(`/articles/${articleId}/purchase`),
  
//   // Reading profile
//   getReadingProfile: (): Promise<ApiResponse<ReadingProfile>> => 
//     apiClient.get('/user/reading-profile'),
  
//   getReadingHistory: (params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => 
//     apiClient.get('/user/reading-history', { params }),
  
//   // getUserAchievements: (): Promise<ApiResponse<any>> => 
//   //   apiClient.get('/user/achievements'),
  
//   updateReadingProfile: (data: Partial<ReadingProfile>): Promise<ApiResponse<ReadingProfile>> => 
//     apiClient.put('/user/reading-profile', data),
  
//   // Categories

//   getCategories: (): Promise<ApiResponse<Category[]>> => 
//     apiClient.get('/articles/categories/all'),

//   getCategoryArticles: (slug: string, params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => 
//     apiClient.get(`/articles/category/${slug}`, { params }), 


//   // Search
//   // searchArticles: (query: string, params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => 
//   //   apiClient.get('/search/articles', { params: { q: query, ...params } }),

//   // View tracking
//   trackArticleView: (articleId: string, duration?: number): Promise<ApiResponse<{ tracked: boolean }>> =>
//     apiClient.post(`/articles/${articleId}/view`, { duration }),

//   // Bulk operations
//   bulkLikeArticles: (articleIds: string[]): Promise<ApiResponse<{ success: boolean }>> =>
//     apiClient.post('/articles/bulk/like', { articleIds }),

//   bulkSaveArticles: (articleIds: string[]): Promise<ApiResponse<{ success: boolean }>> =>
//     apiClient.post('/articles/bulk/save', { articleIds }),


//    // Search functions (updated without language)
//   searchArticles: async (query: string, filters?: SearchFilters): Promise<ApiResponse<PaginatedResponse<Article>>> => {
//     const params: any = { q: query };
    
//     if (filters) {
//       if (filters.category?.length) params.category = filters.category.join(',');
//       if (filters.tags?.length) params.tags = filters.tags.join(',');
//       if (filters.readingTime) {
//         params.minReadingTime = filters.readingTime[0];
//         params.maxReadingTime = filters.readingTime[1];
//       }
//       if (filters.publishedDate) {
//         params.publishedFrom = filters.publishedDate[0];
//         params.publishedTo = filters.publishedDate[1];
//       }
//       if (filters.accessType?.length) params.accessType = filters.accessType.join(',');
//       if (filters.sortBy) params.sortBy = filters.sortBy;
//     }
    
//     return apiClient.get('/search/articles', { params });
//   },

//   getSearchSuggestions: async (query: string): Promise<string[]> => {
//     try {
//       const response = await apiClient.get('/search/suggestions', { 
//         params: { q: query, limit: 10 }
//       });
//       return response.data?.data || [];
//     } catch (error) {
//       console.error('Failed to fetch suggestions:', error);
//       return [];
//     }
//   },

//   getTrendingSearches: async (): Promise<string[]> => {
//     try {
//       const response = await apiClient.get('/search/trending');
//       return response.data?.data || [];
//     } catch (error) {
//       console.error('Failed to fetch trending searches:', error);
//       return ['productivity tips', 'career growth', 'mindfulness', 'leadership'];
//     }
//   },



//   // Like a comment
//   // likeComment: async (commentId: string) => {
//   //   try {
//   //     const response = await apiClient.post(`/comments/${commentId}/like`);
//   //     return response.data;
//   //   } catch (error) {
//   //     throw error;
//   //   }
//   // },

//   // Unlike a comment
//   unlikeComment: async (commentId: string) => {
//     try {
//       const response = await apiClient.post(`/comments/${commentId}/unlike`);
//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },


//   // User profile endpoints
// getUserSavedArticles: (params?: { page?: number; limit?: number }): Promise<any> => 
//   apiClient.get('/articles/user/saved', { params }),

// removeSavedArticle: (articleId: string): Promise<any> => 
//   apiClient.delete(`/articles/user/saved/${articleId}`),

// getUserPremiumAccess: (): Promise<any> => 
//   apiClient.get('/articles/user/premium-access'),

// getUserReadingStats: (): Promise<any> => 
//   apiClient.get('/articles/user/reading/stats'),

// getUserReadingProfile: (): Promise<any> => 
//   apiClient.get('/articles/user/reading-profile'),

// updateUserReadingProfile: (data: any): Promise<any> => 
//   apiClient.put('/articles/user/reading-profile', data),

// getRecommendationStats: (): Promise<any> => 
//   apiClient.get('/articles/recommendations/stats'),

// exportArticlePDF: (articleId: string): Promise<Blob> => 
//   apiClient.get(`/articles/${articleId}/export/pdf`, { 
//     responseType: 'blob' 
//   }),


//   // All articles page endpoints
// getFilterOptions: (): Promise<any> =>
//   apiClient.get('/articles/all/filters'),

// getFilteredArticles: (params: {
//   page?: number;
//   limit?: number;
//   category?: string | string[];
//   tag?: string;
//   accessType?: 'all' | 'free' | 'premium';
//   featured?: boolean;
//   trending?: boolean;
//   search?: string;
//   sort?: string;
//   readingTime?: 'short' | 'medium' | 'long' | 'any';
//   authors?: string[];
//   languages?: string[];
//   tags?: string[];
//   categories?: string[];
// }): Promise<any> =>
//   apiClient.post('/articles/all/filtered', params),

// getArticleOverviewStats: (): Promise<any> =>
//   apiClient.get('/articles/stats/overview'),

// // Bulk operations for All Articles page
// bulkToggleSaveArticles: (articleIds: string[], save: boolean): Promise<any> =>
//   apiClient.post('/articles/bulk/save-toggle', { articleIds, save }),

// bulkToggleLikeArticles: (articleIds: string[], like: boolean): Promise<any> =>
//   apiClient.post('/articles/bulk/like-toggle', { articleIds, like }),

// // Export functionality
// exportFilteredArticles: (params: any): Promise<Blob> =>
//   apiClient.post('/articles/export/filtered', params, { 
//     responseType: 'blob' 
//   }),

// // Advanced search
// advancedSearch: (params: {
//   query: string;
//   categoryIds?: string[];
//   tagIds?: string[];
//   authorIds?: string[];
//   minReadingTime?: number;
//   maxReadingTime?: number;
//   publishedAfter?: string;
//   publishedBefore?: string;
//   sortBy?: string;
//   page?: number;
//   limit?: number;
// }): Promise<any> =>
//   apiClient.post('/articles/search/advanced', params),

// // Save/Load filter presets
// saveFilterPreset: (preset: {
//   name: string;
//   filters: any;
// }): Promise<any> =>
//   apiClient.post('/articles/filters/save', preset),

// getSavedFilterPresets: (): Promise<any> =>
//   apiClient.get('/articles/filters/saved'),

// deleteFilterPreset: (presetId: string): Promise<any> =>
//   apiClient.delete(`/articles/filters/${presetId}`),



//   // User achievements
// getUserAchievements: (): Promise<any> => 
//   apiClient.get('/articles/user/achievements'),

// getAchievementStats: (): Promise<any> => 
//   apiClient.get('/articles/user/achievements/stats'),

// getRecentActivity: (params?: { limit?: number }): Promise<any> => 
//   apiClient.get('/articles/user/activity/recent', { params }),

// getReadingStats: (): Promise<any> => 
//   apiClient.get('/articles/user/reading/stats'),

// };




// export default articleApi;


import { apiClient } from './api-client';

// Helper to get current UI language
const getCurrentLanguage = (): string => {
  if (typeof window !== 'undefined') {
    const savedLang = localStorage.getItem('preferred-language');
    if (savedLang === 'fr' || savedLang === 'en') {
      return savedLang;
    }
    
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'fr' ? 'fr' : 'en';
  }
  return 'en';
};

// Enhanced Category interface with translation support
export interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
  description?: string;
  articleCount?: number;
  featured?: boolean;
  trending?: boolean;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  
  // Translation metadata
  isTranslated?: boolean;
  translationLanguage?: string;
  originalName?: string;
  originalDescription?: string;
  originalSlug?: string;
  translationQuality?: number;
  translationConfidence?: number;
  availableLanguages?: string[];
  language?: string;
}

// Other interfaces remain the same...
export interface Author {
  id: string;
  name: string;
  picture?: string;
  bio?: string;
  isVerified: boolean;
  followersCount: number;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: any;
  plainText?: string;
  coverImage?: string;
  readingTime: number;
  viewCount: number;
  likeCount: number;
  clapCount?: number;
  shareCount?: number;
  isFeatured: boolean;
  isTrending: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
  isPremium: boolean;
  isPreview?: boolean;
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
  translationQuality?: number;
  recommendationScore?: number;
  reviewStats?: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
    recentReviews?: Array<{
      id: string;
      rating: number;
      insightText?: string;
      user: {
        id: string;
        name: string;
        picture?: string;
      };
    }>;
  };
  
  // Translations property
  translations?: Record<string, { title: string; excerpt: string }>;
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

// Enhanced ApiResponse interface to include status


export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  status?: number;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  likesCount?: number;
  likeCount?: number;
  isLiked?: boolean;
  isOwn?: boolean;
  isEdited?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
  replyCount?: number;
  language?: string;
  author?: Author;
  user?: Author;
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
  


  // Get single article
  getArticle: async (identifier: string, params?: { language?: string }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.language) {
      queryParams.append('language', params.language);
    }
    
    const url = `/articles/${identifier}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: null,
      };
    }
  },

  // Get analytics
  getAnalytics: (timeframe: string) => 
    apiClient.get(`/admin/analytics?timeframe=${timeframe}`),

  // Get available languages for an article
  getArticleAvailableLanguages: (articleId: string): Promise<ApiResponse<any>> => 
    apiClient.get(`/articles/${articleId}/languages`),

  // Translate article
  translateArticle: async (articleId: string, targetLanguage: string): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post(`/articles/${articleId}/translate`, { 
        targetLanguage 
      });
      
      const responseData = response.data;
      
      if (responseData && typeof responseData === 'object') {
        if ('success' in responseData || 'data' in responseData) {
          return responseData;
        }
        return {
          success: true,
          data: responseData,
          message: 'Translation requested successfully',
          status: response.status
        };
      }
      
      return {
        success: response.status >= 200 && response.status < 300,
        data: responseData,
        status: response.status,
        message: 'Translation processing started'
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: 'Translation service is temporarily unavailable. Please try again in a moment.',
        status: error.response?.status || 500,
        message: 'Translation service unavailable',
        data: null,
      };
    }
  },

  // ========== CATEGORY METHODS ==========
  
  // Get categories with optional language parameter
  getCategories: async (language?: string): Promise<ApiResponse<Category[]>> => {
    try {
      const params = new URLSearchParams();
      if (language) {
        params.append('language', language);
      }

      const response = await apiClient.get(`/articles/categories/all?${params.toString()}`);
      return {
        success: true,
        data: response.data || [],
        status: response.status,
      };
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        status: error.response?.status,
      };
    }
  },

  // Get single category with language
  getCategory: async (slug: string, language?: string): Promise<ApiResponse<Category>> => {
    try {
      const params = new URLSearchParams();
      if (language) {
        params.append('language', language);
      }
      
      const response = await apiClient.get(`/articles/category/${slug}?${params.toString()}`);
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      console.error('Error fetching category:', error);
      return {
        success: false,
        error: error.message,
        data: null as any, // Use type assertion for null
        status: error.response?.status,
      };
    }
  },

  // ========== OTHER METHODS ==========
  
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
  
  addComment: (articleId: string, data: { content: string; parentId?: string; language?: string }): Promise<ApiResponse<Comment>> => 
    apiClient.post(`/articles/${articleId}/comments`, data),

  updateComment: (commentId: string, data: { content: string }): Promise<ApiResponse<Comment>> =>
    apiClient.put(`/articles/comments/${commentId}`, data),
  
  likeComment: (commentId: string): Promise<ApiResponse<{ liked: boolean }>> => 
    apiClient.post(`/articles/comments/${commentId}/like`),
  
  deleteComment: (commentId: string): Promise<ApiResponse<{ deleted: boolean }>> => 
    apiClient.delete(`/articles/comments/${commentId}`),

  // Premium content
  purchaseArticle: (articleId: string): Promise<ApiResponse<{ 
  purchased: boolean; 
  alreadyHadAccess?: boolean;
  transactionId?: string;
  premiumAccessId?: string;
  newBalance?: number;
  accessUntil?: string;
}>> => 
  apiClient.post(`/articles/${articleId}/purchase`),
  
  // Reading profile
  getReadingProfile: (): Promise<ApiResponse<ReadingProfile>> => 
    apiClient.get('/user/reading-profile'),
  
  getReadingHistory: (params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => 
    apiClient.get('/user/reading-history', { params }),
  
  updateReadingProfile: (data: Partial<ReadingProfile>): Promise<ApiResponse<ReadingProfile>> => 
    apiClient.put('/user/reading-profile', data),
  
  // Category articles
  getCategoryArticles: (slug: string, params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => 
    apiClient.get(`/articles/category/${slug}`, { params }),

  // View tracking
  trackArticleView: (articleId: string, duration?: number): Promise<ApiResponse<{ tracked: boolean }>> =>
    apiClient.post(`/articles/${articleId}/view`, { duration }),

  // Bulk operations
  bulkLikeArticles: (articleIds: string[]): Promise<ApiResponse<{ success: boolean }>> =>
    apiClient.post('/articles/bulk/like', { articleIds }),

  bulkSaveArticles: (articleIds: string[]): Promise<ApiResponse<{ success: boolean }>> =>
    apiClient.post('/articles/bulk/save', { articleIds }),


  

  // Search functions
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

  // Check article access
  checkArticleAccess: (articleId: string): Promise<any> => 
    apiClient.get(`/articles/${articleId}/access`),
};

// Enhanced API with automatic language detection for categories
export const articleApiWithLanguage = {
  // Get current language
  getCurrentLanguage: () => getCurrentLanguage(),

  // Get categories with automatic language detection
  getCategoriesWithLanguage: async (language?: string): Promise<ApiResponse<Category[]>> => {
    const lang = language || getCurrentLanguage();
    return articleApi.getCategories(lang);
  },

  // Get category with language
  getCategoryWithLanguage: async (slug: string, language?: string): Promise<ApiResponse<Category>> => {
    const lang = language || getCurrentLanguage();
    return articleApi.getCategory(slug, lang);
  },

  // Get articles with language
  getArticlesWithLanguage: (params?: FilterParams): Promise<ApiResponse<ArticleListDto>> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getArticles({ ...params, language });
  },

  // Get single article with language
  getArticleWithLanguage: async (identifier: string, params?: { language?: string }): Promise<ApiResponse<any>> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getArticle(identifier, { language });
  },

  // Filtered articles with language
  getFilteredArticlesWithLanguage: (params: any): Promise<any> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getFilteredArticles({
      ...params,
      language
    });
  },

  // Category articles with language
  getCategoryArticlesWithLanguage: (slug: string, params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getCategoryArticles(slug, { ...params, language });
  },

  // Related articles with language
  getRelatedArticlesWithLanguage: (articleId: string, params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getRelatedArticles(articleId, { ...params, language });
  },

  // Engagement actions with language
  likeArticleWithLanguage: (articleId: string, language?: string): Promise<ApiResponse<{ liked: boolean }>> => {
    const lang = language || getCurrentLanguage();
    return articleApi.likeArticle(articleId, lang);
  },

  saveArticleWithLanguage: (articleId: string, language?: string): Promise<ApiResponse<{ saved: boolean }>> => {
    const lang = language || getCurrentLanguage();
    return articleApi.saveArticle(articleId, lang);
  },

  addCommentWithLanguage: (articleId: string, data: { content: string; parentId?: string; language?: string }): Promise<ApiResponse<Comment>> => {
    const lang = data?.language || getCurrentLanguage();
    return articleApi.addComment(articleId, { ...data, language: lang });
  },

  // Include all other methods from articleApi
  getAnalytics: articleApi.getAnalytics,
  getArticleAvailableLanguages: articleApi.getArticleAvailableLanguages,
  translateArticle: articleApi.translateArticle,
  getPersonalizedFeed: articleApi.getPersonalizedFeed,
  getTrendingArticles: articleApi.getTrendingArticles,
  getRecommendedArticles: articleApi.getRecommendedArticles,
  getComments: articleApi.getComments,
  updateComment: articleApi.updateComment,
  likeComment: articleApi.likeComment,
  deleteComment: articleApi.deleteComment,
  purchaseArticle: articleApi.purchaseArticle,
  getReadingProfile: articleApi.getReadingProfile,
  updateReadingProfile: articleApi.updateReadingProfile,
  trackArticleView: articleApi.trackArticleView,
  getUserSavedArticles: articleApi.getUserSavedArticles,
  removeSavedArticle: articleApi.removeSavedArticle,
  getUserPremiumAccess: articleApi.getUserPremiumAccess,
  getUserReadingStats: articleApi.getUserReadingStats,
  getUserReadingProfile: articleApi.getUserReadingProfile,
  updateUserReadingProfile: articleApi.updateUserReadingProfile,
  getFilterOptions: articleApi.getFilterOptions,
  getArticleOverviewStats: articleApi.getArticleOverviewStats,
  getUserAchievements: articleApi.getUserAchievements,
  getAchievementStats: articleApi.getAchievementStats,
  getRecentActivity: articleApi.getRecentActivity,
  getReadingStats: articleApi.getReadingStats,
  checkArticleAccess: articleApi.checkArticleAccess,
  searchArticles: articleApi.searchArticles,
  getSearchSuggestions: articleApi.getSearchSuggestions,
  getTrendingSearches: articleApi.getTrendingSearches,
  bulkLikeArticles: articleApi.bulkLikeArticles,
  bulkSaveArticles: articleApi.bulkSaveArticles,
  exportArticlePDF: articleApi.exportArticlePDF,
  advancedSearch: articleApi.advancedSearch,
  saveFilterPreset: articleApi.saveFilterPreset,
  getSavedFilterPresets: articleApi.getSavedFilterPresets,
  deleteFilterPreset: articleApi.deleteFilterPreset,
  bulkToggleSaveArticles: articleApi.bulkToggleSaveArticles,
  bulkToggleLikeArticles: articleApi.bulkToggleLikeArticles,
  exportFilteredArticles: articleApi.exportFilteredArticles,
};

export const getAdminArticles = (params?: FilterParams): Promise<ArticleListDto> => 
  apiClient.get('/articles/admin/articles/list', { params })
    .then(response => response.data); 

export default articleApi;