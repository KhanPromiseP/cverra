// hooks/useArticleApi.ts
import { useCallback } from 'react';
import { 
  articleApi, 
  articleApiWithLanguage, 
  FilterParams, 
  SearchFilters,
  ApiResponse,
  PaginatedResponse,
  Article,
  Category,
  Comment,
  ReadingProfile
} from '@/client/services/articleApi';

export const useArticleApi = () => {
  // Helper to get current language
  const getCurrentLanguage = useCallback((): string => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('preferred-language');
      if (savedLang === 'fr' || savedLang === 'en') {
        return savedLang;
      }
      
      const browserLang = navigator.language.split('-')[0];
      return browserLang === 'fr' ? 'fr' : 'en';
    }
    return 'en';
  }, []);

  // ========== ARTICLES ==========
  
  // Get articles with automatic language
  const getArticles = useCallback(async (params?: FilterParams): Promise<ApiResponse<any>> => {
    return articleApiWithLanguage.getArticlesWithLanguage(params);
  }, []);

  // Get trending articles
  const getTrendingArticles = useCallback(async (params?: FilterParams): Promise<ApiResponse<any>> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getTrendingArticles({ ...params, language });
  }, [getCurrentLanguage]);

  // Get personalized feed
  const getPersonalizedFeed = useCallback(async (params?: FilterParams): Promise<ApiResponse<any>> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getPersonalizedFeed({ ...params, language });
  }, [getCurrentLanguage]);

  // Get recommended articles
  const getRecommendedArticles = useCallback(async (params?: FilterParams): Promise<ApiResponse<any>> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getRecommendedArticles({ ...params, language });
  }, [getCurrentLanguage]);

  // Get filtered articles
  const getFilteredArticles = useCallback(async (params: any): Promise<any> => {
    return articleApiWithLanguage.getFilteredArticlesWithLanguage(params);
  }, []);

  // Get category articles
  const getCategoryArticles = useCallback(async (slug: string, params?: FilterParams): Promise<ApiResponse<any>> => {
    return articleApiWithLanguage.getCategoryArticlesWithLanguage(slug, params);
  }, []);

  // Get related articles
  const getRelatedArticles = useCallback(async (articleId: string, params?: FilterParams): Promise<ApiResponse<any>> => {
    return articleApiWithLanguage.getRelatedArticlesWithLanguage(articleId, params);
  }, []);

  // Get single article
  const getArticle = useCallback(async (identifier: string, params?: { language?: string }): Promise<ApiResponse<any>> => {
    return articleApiWithLanguage.getArticleWithLanguage(identifier, params);
  }, []);

  // ========== CATEGORIES ==========
  
  // Get categories with automatic language
  const getCategories = useCallback(async (language?: string): Promise<ApiResponse<Category[]>> => {
    return articleApiWithLanguage.getCategoriesWithLanguage(language);
  }, []);

  // Get single category with language
  const getCategory = useCallback(async (slug: string, language?: string): Promise<ApiResponse<Category>> => {
    return articleApiWithLanguage.getCategoryWithLanguage(slug, language);
  }, []);

  // ========== SEARCH (No language parameter needed) ==========
  
  // Search articles - language is handled by Accept-Language header
  const searchArticles = useCallback(async (query: string, filters?: SearchFilters): Promise<ApiResponse<PaginatedResponse<Article>>> => {
    return articleApi.searchArticles(query, filters);
  }, []);

  // Get search suggestions - language is handled by Accept-Language header
  const getSearchSuggestions = useCallback(async (query: string): Promise<string[]> => {
    return articleApi.getSearchSuggestions(query);
  }, []);

  // Get trending searches - language is handled by Accept-Language header
  const getTrendingSearches = useCallback(async (): Promise<string[]> => {
    return articleApi.getTrendingSearches();
  }, []);

  // ========== ENGAGEMENT ACTIONS ==========
  
  // Like article
  const likeArticle = useCallback(async (articleId: string, language?: string): Promise<ApiResponse<{ liked: boolean }>> => {
    return articleApiWithLanguage.likeArticleWithLanguage(articleId, language);
  }, []);

  // Save article
  const saveArticle = useCallback(async (articleId: string, language?: string): Promise<ApiResponse<{ saved: boolean }>> => {
    return articleApiWithLanguage.saveArticleWithLanguage(articleId, language);
  }, []);

  // Clap article
  const clapArticle = useCallback(async (articleId: string, count: number, language?: string): Promise<ApiResponse<{ claps: number }>> => {
    const lang = language || getCurrentLanguage();
    return articleApi.clapArticle(articleId, count, lang);
  }, [getCurrentLanguage]);

  // Share article
  const shareArticle = useCallback(async (articleId: string, platform: string, language?: string): Promise<ApiResponse<{ shared: boolean }>> => {
    const lang = language || getCurrentLanguage();
    return articleApi.shareArticle(articleId, platform, lang);
  }, [getCurrentLanguage]);

  // ========== COMMENTS ==========
  
  // Get comments
  const getComments = useCallback(async (articleId: string, params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Comment>>> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getComments(articleId, { ...params, language });
  }, [getCurrentLanguage]);

  // Add comment
  const addComment = useCallback(async (articleId: string, data: { content: string; parentId?: string; language?: string }): Promise<ApiResponse<Comment>> => {
    return articleApiWithLanguage.addCommentWithLanguage(articleId, data);
  }, []);

  // Update comment
  const updateComment = useCallback(async (commentId: string, data: { content: string }): Promise<ApiResponse<Comment>> => {
    return articleApi.updateComment(commentId, data);
  }, []);

  // Like comment
  const likeComment = useCallback(async (commentId: string): Promise<ApiResponse<{ liked: boolean }>> => {
    return articleApi.likeComment(commentId);
  }, []);

  // Unlike comment
  const unlikeComment = useCallback(async (commentId: string): Promise<any> => {
    return articleApi.unlikeComment(commentId);
  }, []);

  // Delete comment
  const deleteComment = useCallback(async (commentId: string): Promise<ApiResponse<{ deleted: boolean }>> => {
    return articleApi.deleteComment(commentId);
  }, []);

  // ========== READING & USER ACTIONS ==========
  
  // Get reading history
  const getReadingHistory = useCallback(async (params?: FilterParams): Promise<ApiResponse<PaginatedResponse<Article>>> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getReadingHistory({ ...params, language });
  }, [getCurrentLanguage]);

  // Get reading profile
  const getReadingProfile = useCallback(async (): Promise<ApiResponse<ReadingProfile>> => {
    return articleApi.getReadingProfile();
  }, []);

  // Update reading profile
  const updateReadingProfile = useCallback(async (data: Partial<ReadingProfile>): Promise<ApiResponse<ReadingProfile>> => {
    return articleApi.updateReadingProfile(data);
  }, []);

  // Get user saved articles
  const getUserSavedArticles = useCallback(async (params?: { page?: number; limit?: number }): Promise<any> => {
    return articleApi.getUserSavedArticles(params);
  }, []);

  // Remove saved article
  const removeSavedArticle = useCallback(async (articleId: string): Promise<any> => {
    return articleApi.removeSavedArticle(articleId);
  }, []);

  // Get user achievements
  const getUserAchievements = useCallback(async (): Promise<any> => {
    return articleApi.getUserAchievements();
  }, []);

  // Get achievement stats
  const getAchievementStats = useCallback(async (): Promise<any> => {
    return articleApi.getAchievementStats();
  }, []);

  // Get recent activity
  const getRecentActivity = useCallback(async (params?: { limit?: number }): Promise<any> => {
    return articleApi.getRecentActivity(params);
  }, []);

  // Get reading stats
  const getReadingStats = useCallback(async (): Promise<any> => {
    return articleApi.getReadingStats();
  }, []);

  // Get user reading profile
  const getUserReadingProfile = useCallback(async (): Promise<any> => {
    return articleApi.getUserReadingProfile();
  }, []);

  // Update user reading profile
  const updateUserReadingProfile = useCallback(async (data: any): Promise<any> => {
    return articleApi.updateUserReadingProfile(data);
  }, []);

  // Get user premium access
  const getUserPremiumAccess = useCallback(async (): Promise<any> => {
    return articleApi.getUserPremiumAccess();
  }, []);

  // Get user reading stats
  const getUserReadingStats = useCallback(async (): Promise<any> => {
    return articleApi.getUserReadingStats();
  }, []);

  // ========== ANALYTICS & STATS ==========
  
  // Get analytics
  const getAnalytics = useCallback(async (timeframe: string): Promise<any> => {
    return articleApi.getAnalytics(timeframe);
  }, []);

  // Get filter options
  const getFilterOptions = useCallback(async (): Promise<any> => {
    return articleApi.getFilterOptions();
  }, []);

  // Get article overview stats
  const getArticleOverviewStats = useCallback(async (): Promise<any> => {
    return articleApi.getArticleOverviewStats();
  }, []);

  // Get recommendation stats
  const getRecommendationStats = useCallback(async (): Promise<any> => {
    return articleApi.getRecommendationStats();
  }, []);

  // ========== TRANSLATION ACTIONS ==========
  
  // Get available languages for an article
  const getArticleAvailableLanguages = useCallback(async (articleId: string): Promise<ApiResponse<any>> => {
    return articleApi.getArticleAvailableLanguages(articleId);
  }, []);

  // Translate article
  const translateArticle = useCallback(async (articleId: string, targetLanguage: string): Promise<ApiResponse<any>> => {
    return articleApi.translateArticle(articleId, targetLanguage);
  }, []);

  // ========== PREMIUM ACTIONS ==========
  
  // Purchase article
  const purchaseArticle = useCallback(async (articleId: string): Promise<ApiResponse<{ purchased: boolean }>> => {
    return articleApi.purchaseArticle(articleId);
  }, []);

  // Check article access
  const checkArticleAccess = useCallback(async (articleId: string): Promise<any> => {
    return articleApi.checkArticleAccess(articleId);
  }, []);

  // ========== TRACKING ==========
  
  // Track article view
  const trackArticleView = useCallback(async (articleId: string, duration?: number): Promise<ApiResponse<{ tracked: boolean }>> => {
    return articleApi.trackArticleView(articleId, duration);
  }, []);

  // ========== BULK OPERATIONS ==========
  
  // Bulk like articles
  const bulkLikeArticles = useCallback(async (articleIds: string[]): Promise<ApiResponse<{ success: boolean }>> => {
    return articleApi.bulkLikeArticles(articleIds);
  }, []);

  // Bulk save articles
  const bulkSaveArticles = useCallback(async (articleIds: string[]): Promise<ApiResponse<{ success: boolean }>> => {
    return articleApi.bulkSaveArticles(articleIds);
  }, []);

  // Bulk toggle save articles
  const bulkToggleSaveArticles = useCallback(async (articleIds: string[], save: boolean): Promise<any> => {
    return articleApi.bulkToggleSaveArticles(articleIds, save);
  }, []);

  // Bulk toggle like articles
  const bulkToggleLikeArticles = useCallback(async (articleIds: string[], like: boolean): Promise<any> => {
    return articleApi.bulkToggleLikeArticles(articleIds, like);
  }, []);

  // ========== EXPORT ACTIONS ==========
  
  // Export article as PDF
  const exportArticlePDF = useCallback(async (articleId: string): Promise<Blob> => {
    return articleApi.exportArticlePDF(articleId);
  }, []);

  // Export filtered articles
  const exportFilteredArticles = useCallback(async (params: any): Promise<Blob> => {
    return articleApi.exportFilteredArticles(params);
  }, []);

  // ========== ADVANCED SEARCH ==========
  
  // Advanced search
  const advancedSearch = useCallback(async (params: any): Promise<any> => {
    return articleApi.advancedSearch(params);
  }, []);

  // ========== FILTER PRESETS ==========
  
  // Save filter preset
  const saveFilterPreset = useCallback(async (preset: { name: string; filters: any }): Promise<any> => {
    return articleApi.saveFilterPreset(preset);
  }, []);

  // Get saved filter presets
  const getSavedFilterPresets = useCallback(async (): Promise<any> => {
    return articleApi.getSavedFilterPresets();
  }, []);

  // Delete filter preset
  const deleteFilterPreset = useCallback(async (presetId: string): Promise<any> => {
    return articleApi.deleteFilterPreset(presetId);
  }, []);

  // Return all methods
  return {
    // Helper
    getCurrentLanguage,
    
    // Articles
    getArticles,
    getTrendingArticles,
    getPersonalizedFeed,
    getRecommendedArticles,
    getFilteredArticles,
    getCategoryArticles,
    getRelatedArticles,
    getArticle,
    
    // Categories
    getCategories,
    getCategory,
    
    // Search - NO LANGUAGE PARAMETERS NEEDED
    searchArticles,
    getSearchSuggestions,
    getTrendingSearches,
    
    // Engagement
    likeArticle,
    saveArticle,
    clapArticle,
    shareArticle,
    
    // Comments
    getComments,
    addComment,
    updateComment,
    likeComment,
    unlikeComment,
    deleteComment,
    
    // Reading & User
    getReadingHistory,
    getReadingProfile,
    updateReadingProfile,
    getUserSavedArticles,
    removeSavedArticle,
    getUserAchievements,
    getAchievementStats,
    getRecentActivity,
    getReadingStats,
    getUserReadingProfile,
    updateUserReadingProfile,
    getUserPremiumAccess,
    getUserReadingStats,
    
    // Analytics
    getAnalytics,
    getFilterOptions,
    getArticleOverviewStats,
    getRecommendationStats,
    
    // Translation
    getArticleAvailableLanguages,
    translateArticle,
    
    // Premium
    purchaseArticle,
    checkArticleAccess,
    
    // Tracking
    trackArticleView,
    
    // Bulk operations
    bulkLikeArticles,
    bulkSaveArticles,
    bulkToggleSaveArticles,
    bulkToggleLikeArticles,
    
    // Export
    exportArticlePDF,
    exportFilteredArticles,
    
    // Advanced search
    advancedSearch,
    
    // Filter presets
    saveFilterPreset,
    getSavedFilterPresets,
    deleteFilterPreset,
  };
};

export default useArticleApi;