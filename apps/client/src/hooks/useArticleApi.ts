// hooks/useArticleApi.ts
import { useCallback } from 'react';
import { articleApi, FilterParams, SearchFilters } from '@/client/services/articleApi';

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

  // Get articles with automatic language
  const getArticles = useCallback(async (params?: FilterParams): Promise<any> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getArticles({ ...params, language });
  }, [getCurrentLanguage]);

  // Get trending articles with language
  const getTrendingArticles = useCallback(async (params?: FilterParams): Promise<any> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getTrendingArticles({ ...params, language });
  }, [getCurrentLanguage]);

  // Get personalized feed with language
  const getPersonalizedFeed = useCallback(async (params?: FilterParams): Promise<any> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getPersonalizedFeed({ ...params, language });
  }, [getCurrentLanguage]);

  // Get recommended articles with language
  const getRecommendedArticles = useCallback(async (params?: FilterParams): Promise<any> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getRecommendedArticles({ ...params, language });
  }, [getCurrentLanguage]);

  // Get filtered articles with language
  const getFilteredArticles = useCallback(async (params: any): Promise<any> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getFilteredArticles({ ...params, language });
  }, [getCurrentLanguage]);

  // Get category articles with language
  const getCategoryArticles = useCallback(async (slug: string, params?: FilterParams): Promise<any> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getCategoryArticles(slug, { ...params, language });
  }, [getCurrentLanguage]);

  // Get related articles with language
  const getRelatedArticles = useCallback(async (articleId: string, params?: FilterParams): Promise<any> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getRelatedArticles(articleId, { ...params, language });
  }, [getCurrentLanguage]);

  // Get single article with language
  const getArticle = useCallback(async (identifier: string, params?: { language?: string }): Promise<any> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getArticle(identifier, { language });
  }, [getCurrentLanguage]);

  // Get reading history with language
  const getReadingHistory = useCallback(async (params?: FilterParams): Promise<any> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.getReadingHistory({ ...params, language });
  }, [getCurrentLanguage]);

  // Advanced search with language
  const advancedSearch = useCallback(async (params: any): Promise<any> => {
    const language = params?.language || getCurrentLanguage();
    return articleApi.advancedSearch({ ...params, language });
  }, [getCurrentLanguage]);

  // Search articles with language
  const searchArticles = useCallback(async (query: string, filters?: SearchFilters, language?: string): Promise<any> => {
    const lang = language || getCurrentLanguage();
    return articleApi.searchArticles(query, filters, lang);
  }, [getCurrentLanguage]);

  // Get search suggestions with language
  const getSearchSuggestions = useCallback(async (query: string, language?: string): Promise<string[]> => {
    const lang = language || getCurrentLanguage();
    return articleApi.getSearchSuggestions(query, lang);
  }, [getCurrentLanguage]);

  // Get trending searches with language
  const getTrendingSearches = useCallback(async (language?: string): Promise<string[]> => {
    const lang = language || getCurrentLanguage();
    return articleApi.getTrendingSearches(lang);
  }, [getCurrentLanguage]);

  // Like article with current language
  const likeArticle = useCallback(async (articleId: string, language?: string): Promise<any> => {
    const lang = language || getCurrentLanguage();
    return articleApi.likeArticle(articleId, lang);
  }, [getCurrentLanguage]);

  // Save article with current language
  const saveArticle = useCallback(async (articleId: string, language?: string): Promise<any> => {
    const lang = language || getCurrentLanguage();
    return articleApi.saveArticle(articleId, lang);
  }, [getCurrentLanguage]);

  // Add comment with current language
  const addComment = useCallback(async (articleId: string, data: { content: string; parentId?: string; language?: string }): Promise<any> => {
    const lang = data?.language || getCurrentLanguage();
    return articleApi.addComment(articleId, { ...data, language: lang });
  }, [getCurrentLanguage]);

  // Get available languages for an article
  const getArticleAvailableLanguages = useCallback(async (articleId: string): Promise<any> => {
    return articleApi.getArticleAvailableLanguages(articleId);
  }, []);

  // Translate article
  const translateArticle = useCallback(async (articleId: string, targetLanguage: string): Promise<any> => {
    return articleApi.translateArticle(articleId, targetLanguage);
  }, []);

  // Check article access
  const checkArticleAccess = useCallback(async (articleId: string): Promise<any> => {
    return articleApi.checkArticleAccess(articleId);
  }, []);

  // Purchase article
  const purchaseArticle = useCallback(async (articleId: string): Promise<any> => {
    return articleApi.purchaseArticle(articleId);
  }, []);

  // Get reading profile
  const getReadingProfile = useCallback(async (): Promise<any> => {
    return articleApi.getReadingProfile();
  }, []);

  // Update reading profile
  const updateReadingProfile = useCallback(async (data: any): Promise<any> => {
    return articleApi.updateUserReadingProfile(data);
  }, []);

  // Get user saved articles
  const getUserSavedArticles = useCallback(async (params?: { page?: number; limit?: number }): Promise<any> => {
    return articleApi.getUserSavedArticles(params);
  }, []);

  // Get user achievements
  const getUserAchievements = useCallback(async (): Promise<any> => {
    return articleApi.getUserAchievements();
  }, []);

  // Get categories
  const getCategories = useCallback(async (): Promise<any> => {
    return articleApi.getCategories();
  }, []);

  // Track article view
  const trackArticleView = useCallback(async (articleId: string, duration?: number): Promise<any> => {
    return articleApi.trackArticleView(articleId, duration);
  }, []);

  // Clap article
  const clapArticle = useCallback(async (articleId: string, count: number, language?: string): Promise<any> => {
    const lang = language || getCurrentLanguage();
    return articleApi.clapArticle(articleId, count, lang);
  }, [getCurrentLanguage]);

  // Share article
  const shareArticle = useCallback(async (articleId: string, platform: string, language?: string): Promise<any> => {
    const lang = language || getCurrentLanguage();
    return articleApi.shareArticle(articleId, platform, lang);
  }, [getCurrentLanguage]);

  // Get comments
  const getComments = useCallback(async (articleId: string, params?: FilterParams): Promise<any> => {
    return articleApi.getComments(articleId, params);
  }, []);

  // Update comment
  const updateComment = useCallback(async (commentId: string, data: { content: string }): Promise<any> => {
    return articleApi.updateComment(commentId, data);
  }, []);

  // Like comment
  const likeComment = useCallback(async (commentId: string): Promise<any> => {
    return articleApi.likeComment(commentId);
  }, []);

  // Delete comment
  const deleteComment = useCallback(async (commentId: string): Promise<any> => {
    return articleApi.deleteComment(commentId);
  }, []);

  // Unlike comment
  const unlikeComment = useCallback(async (commentId: string): Promise<any> => {
    return articleApi.unlikeComment(commentId);
  }, []);

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

  // Return all methods
  return {
    // Language-aware methods
    getArticles,
    getTrendingArticles,
    getPersonalizedFeed,
    getRecommendedArticles,
    getFilteredArticles,
    getCategoryArticles,
    getRelatedArticles,
    getArticle,
    getReadingHistory,
    advancedSearch,
    searchArticles,
    getSearchSuggestions,
    getTrendingSearches,
    likeArticle,
    saveArticle,
    addComment,
    clapArticle,
    shareArticle,
    
    // Direct API methods (no language modification needed)
    getArticleAvailableLanguages,
    translateArticle,
    checkArticleAccess,
    purchaseArticle,
    getReadingProfile,
    updateReadingProfile,
    getUserSavedArticles,
    getUserAchievements,
    getCategories,
    trackArticleView,
    getComments,
    updateComment,
    likeComment,
    deleteComment,
    unlikeComment,
    getAnalytics,
    getFilterOptions,
    getArticleOverviewStats,
    
    // Helper methods
    getCurrentLanguage,
  };
};

export default useArticleApi;