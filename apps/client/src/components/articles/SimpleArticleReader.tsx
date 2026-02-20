import { t, Trans } from "@lingui/macro";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Card, 
  Typography, 
  Divider, 
  Tag, 
  Avatar,
  Space,
  Button,
  Skeleton,
  notification,
  Image,
  Input,
  List,
  Tooltip,
  Dropdown,
  Modal,
  Form,
  Rate,
  Badge,
  Spin,
  Progress,
  Alert,
  
} from 'antd';
import { 
  HeartOutlined, 
  HeartFilled,
  BookOutlined,
  BookFilled,
  ClockCircleOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  GlobalOutlined,
  CrownOutlined,
  StarOutlined,
  FireOutlined,
  UserOutlined,
  ShareAltOutlined,
  LikeOutlined,
  LikeFilled,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  FlagOutlined,
  TranslationOutlined,
  TagsOutlined,
  ReadOutlined,
  FolderOutlined,
  LockOutlined,
  LinkOutlined,
  PictureOutlined,
  CalendarOutlined,
  CheckOutlined,
  InfoCircleOutlined, 
  CloseOutlined,
  PlusOutlined,
  CopyrightOutlined,
  CheckCircleOutlined
  
} from '@ant-design/icons';
import { Fragment } from "react"; 
import { Menu, Transition } from "@headlessui/react";
import articleApi, { Article, Author, Category, Comment } from '../../services/articleApi';
import { apiClient } from '../../services/api-client';
import AuthModal from '../common/AuthModal';
import { useUser } from "@/client/services/user";
import PremiumPaywall from './PremiumPaywall';
import { useLingui } from '@lingui/react';
import './SimpleArticleReader.css';
import SimpleReviewSection from './SimpleReviewSection';
import { useWallet } from '../../hooks/useWallet'; 



// Font size options
const FONT_SIZES = [12, 14, 16, 18, 20, 22, 24];
const LINE_HEIGHTS = [1.4, 1.6, 1.8, 2.0, 2.2];
const FONT_FAMILIES = [
  { label: t`System`, value: 'system-ui' },
  { label: t`Serif`, value: 'Georgia, serif' },
  { label: t`Sans`, value: 'Arial, sans-serif' },
  { label: t`Monospace`, value: 'Monaco, monospace' },
  { label: t`Open Dyslexic`, value: 'OpenDyslexic, sans-serif' },
];



const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface SimpleArticleReaderProps {
  slug: string;
  showReadingProgress?: boolean;
}

interface RelatedArticle extends Article {
  engagementScore?: number;
}


const SimpleArticleReader: React.FC<SimpleArticleReaderProps> = ({ 
  slug, 
  showReadingProgress = true 

  
}) => {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  const checkingAccessRef = useRef(false);

  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  const [activeTab, setActiveTab] = useState<'comments' | 'related' | 'trending'>('comments');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<'like' | 'comment' | 'save' | 'premium' | 'translate' | 'share' | 'reply'>('like');
  const { user, loading: userLoading } = useUser();
  const [showPaywall, setShowPaywall] = useState(false);
  const [userHasAccess, setUserHasAccess] = useState(false);

  const [showReadingSettings, setShowReadingSettings] = useState(false);
  // Add these with your other useState declarations
  const [languageSwitching, setLanguageSwitching] = useState(false);
  const [contentKey, setContentKey] = useState<string>('');
  const [reloadingContent, setReloadingContent] = useState(false);
 
  const { i18n } = useLingui();
  const currentLocale = i18n.locale; // e.g., 'fr', 'en', etc.

  const [lastManualLanguageChange, setLastManualLanguageChange] = useState<number | null>(null);
  // Add this state to track when to check for auto-sync
  const [checkAutoSync, setCheckAutoSync] = useState(0);

  const [uiLanguage, setUiLanguage] = useState<string>('en');
  const [articleLanguage, setArticleLanguage] = useState<string>('en');
  const [userManuallyChangedArticleLanguage, setUserManuallyChangedArticleLanguage] = useState<boolean>(false);
  const [articleLanguageFromStorage, setArticleLanguageFromStorage] = useState<string | null>(null);

  const displayLanguage = article?.language || articleLanguage || uiLanguage;


    
  // Refs for view tracking control
  const isMountedRef = useRef(true);
  const viewTrackedRef = useRef(false);
  const fetchInProgressRef = useRef(false);
  const scrollTrackingEnabledRef = useRef(false);
  const articleIdRef = useRef<string | null>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const [fontSize, setFontSize] = useState<number>(18); // Default 18px
  const [lineHeight, setLineHeight] = useState<number>(1.8);
  const [fontFamily, setFontFamily] = useState<string>('system-ui');

  const { balance, fetchBalance } = useWallet(user?.id || '');

  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['en']);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);


// At the top of your SimpleArticleReader component
console.log('🔄 SimpleArticleReader rendering', {
  articleId: article?.id,
  user: user?.id,
  availableLanguages,
  currentLanguage
});





// In your useEffect that loads article
useEffect(() => {
  console.log('📥 useEffect triggered for slug:', slug);
  // ... rest of code
}, [slug]);

useEffect(() => {
  console.log('🔄 State changed:', {
    articleId: article?.id,
    userId: user?.id,
    availableLanguages,
    currentLanguage,
    userHasAccess,
    showPaywall
  });
}, [article?.id, user?.id, availableLanguages, currentLanguage, userHasAccess, showPaywall]);



// In your useUser hook (if you have access to it)
console.log('👤 useUser result:', { user, loading: userLoading });



  useEffect(() => {
  const loadAvailableLanguages = async () => {
    if (article?.id) {
      try {
        const response = await articleApi.getArticleAvailableLanguages(article.id);
        if (response?.data.languages) {
          const languages = response.data.languages.map((lang: any) => lang.language);
          setAvailableLanguages(languages);
          
          // This might be causing the loop - don't update article if it's the same
          setArticle(prev => {
            if (!prev) return null;
            if (JSON.stringify(prev.availableLanguages) === JSON.stringify(languages)) {
              return prev; // No change, return same object
            }
            return {
              ...prev,
              availableLanguages: languages
            };
          });
        }
      } catch (error) {
        console.error('Failed to load available languages:', error);
      }
    }
  };
  
  loadAvailableLanguages();
}, [article?.id]); // Should only run when article.id changes



useEffect(() => {
  // Update UI language when i18n.locale changes
  const uiLanguageCode = i18n.locale.split('-')[0];
  
  if (uiLanguage !== uiLanguageCode) {
    console.log('🌐 UI language changed:', uiLanguageCode);
    setUiLanguage(uiLanguageCode);
    
    // Only auto-switch article language if:
    // 1. User hasn't manually changed article language (or saved preference)
    // 2. Current article language differs from new UI language  
    // 3. Article is available in the UI language
    // 4. No saved preference from localStorage
    if (!userManuallyChangedArticleLanguage && 
        !articleLanguageFromStorage &&
        articleLanguage !== uiLanguageCode &&
        availableLanguages.includes(uiLanguageCode)) {
      console.log('🔄 Auto-switching article to UI language');
      handleArticleLanguageChange(uiLanguageCode, false); // false = not manual
    } else if (article?.id) {
      // Even if we don't switch article language, reload related articles
      // to show them in the new UI language for display
      console.log('🔄 UI language changed, reloading related articles for display');
      setTimeout(() => {
        loadRelatedArticles(article.id, true);
      }, 300);
    }
  }
}, [i18n.locale]);


useEffect(() => {
  // Just log when UI language is different from article language
  if (article && i18n.locale.split('-')[0] !== currentLanguage.split('-')[0]) {
    console.log('🌐 UI language differs from article language:', {
      ui: i18n.locale,
      article: currentLanguage
    });
    // Don't auto-sync - let user decide
  }
}, [i18n.locale, article?.id, currentLanguage]);




useEffect(() => {
  console.log('🔍 🔍🔍🔍🔍🔍🔍🔍Auto-sync debug - Article state:', {
    hasArticle: !!article,
    articleId: article?.id,
    articleLanguage: article?.language,
    currentLanguage,
    uiLanguage: i18n.locale,
    languagesDifferent: article && i18n.locale !== currentLanguage
  });
  
  if (article && i18n.locale !== currentLanguage) {
    const uiLanguageCode = i18n.locale.split('-')[0];
    const currentLanguageCode = currentLanguage.split('-')[0];
    
    console.log('🔍 Language codes:', { uiLanguageCode, currentLanguageCode });
    
    if (uiLanguageCode !== currentLanguageCode) {
      console.log('🔄 TRIGGERING auto-sync');
      handleLanguageChange(uiLanguageCode);
    }
  }
}, [i18n.locale]);




useEffect(() => {
  if (article?.id && !languageSwitching) {
    console.log('🔄 Language state updated, reloading related articles:', {
      currentLanguage,
      uiLocale: i18n.locale
    });
    
    // Small delay to ensure state is settled
    const timer = setTimeout(() => {
      loadRelatedArticles(article.id, true);
    }, 300);
    
    return () => clearTimeout(timer);
  }
}, [currentLanguage, languageSwitching]);


  // Function to update available languages
  const updateAvailableLanguages = (newLanguages: string[]) => {
    setAvailableLanguages(newLanguages);
    // Also update article state
    setArticle(prev => prev ? {
      ...prev,
      availableLanguages: newLanguages
    } : null);
  };


  // Add this function inside your SimpleArticleReader component
const refreshArticleData = useCallback(async () => {
  if (!slug || !article?.id) return; // Add null check for article
  
  try {
    const params = currentLanguage !== 'en' ? { language: currentLanguage } : undefined;
    const response = await articleApi.getArticle(slug, params);
    
    if (response?.data) {
      let articleData;
      if (typeof response.data === 'object' && 'success' in response.data) {
        const apiResponse = response.data as any;
        if (apiResponse.success && apiResponse.data) {
          articleData = apiResponse.data;
        }
      } else {
        articleData = response.data;
      }
      
      if (articleData && articleData.id) {
        // Update the article with new data (including updated review stats)
        setArticle(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            ...articleData,
            reviewStats: articleData.reviewStats || prev.reviewStats
          };
        });
      }
    }
  } catch (error) {
    console.error('Failed to refresh article data:', error);
  }
}, [slug, currentLanguage, article?.id]);



  // Helper function to safely access review stats
const getReviewStats = (article: Article | null) => {
  if (!article?.reviewStats) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recentReviews: []
    };
  }
  return article.reviewStats;
};

// Add this function to fetch and update review stats
const fetchAndUpdateReviewStats = useCallback(async (articleId: string) => {
  try {
    const response = await apiClient.get(`/articles/${articleId}/reviews/summary`);
    if (response.data) {
      console.log('📊 Fetched review stats:', response.data);
      
      // Update the local reviewStats state
      setReviewStats(response.data);
      
      // Also update the article object with the review stats
      setArticle(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          reviewStats: response.data
        };
      });
      
      return response.data;
    }
  } catch (error) {
    console.error('Failed to fetch review stats:', error);
  }
}, []);

const handleStatsUpdate = (stats: any) => {
  console.log('📊 Stats update received from review section:', stats);
  setReviewStats(stats);
  setArticle(prev => {
    if (!prev) return prev;
    return {
      ...prev,
      reviewStats: stats
    };
  });
};


const handleArticleLanguageChange = async (language: string, isManualChange: boolean = true) => {
  if (!article || language === articleLanguage || isTranslating || languageSwitching) return;
  
  console.log('🔄 Article language change:', {
    language,
    isManualChange,
    currentArticleLanguage: articleLanguage,
    uiLanguage
  });
  
  // Track if this is a manual change by user
  if (isManualChange) {
    setUserManuallyChangedArticleLanguage(true);
    
    // Save to localStorage for persistence
    if (article.id) {
      saveArticleLanguagePreference(article.id, language);
    }
  }
  
  setLanguageSwitching(true);
  
  try {
    notification.info({
      message: t`Loading ${getLanguageName(language)} version...`,
      duration: 2,
      key: 'language-switch',
    });
    
    // Update article language state
    console.log('🔄 Setting articleLanguage to:', language);
    setArticleLanguage(language);
    
    // Set a new content key to force re-render
    const newKey = `lang-${language}-${Date.now()}`;
    setContentKey(newKey);
    
    // Re-fetch the article with new language
    const params = language !== 'en' ? { language } : undefined;
    console.log('🔄 Re-fetching article with params:', params, 'slug:', slug);
    
    const response = await articleApi.getArticle(slug, params);
    
    console.log('🔄 Article API response:', {
      responseData: response?.data,
      success: response?.success,
      hasData: !!response?.data
    });
    
    if (response?.data) {
      let articleData;
      
      // Handle different response formats
      if (typeof response.data === 'object') {
        // Check for success wrapper pattern
        if ('success' in response.data && response.data.success) {
          articleData = response.data.data;
          console.log('✅ Success wrapper found, data:', articleData);
        } 
        // Check for direct data pattern
        else if ('id' in response.data || 'slug' in response.data) {
          articleData = response.data;
          console.log('✅ Direct data found');
        }
        // Check for API response pattern
        else if ('data' in response.data && response.data.data) {
          articleData = response.data.data;
          console.log('✅ Nested data found');
        }
      }
      
      if (articleData) {
        console.log('✅ Processing article data:', {
          id: articleData.id,
          title: articleData.title,
          language: articleData.language
        });
        
        // Helper function to fix image URLs
        const fixImageUrl = (url: string): string => {
          if (!url || url.trim() === '') return '';
          
          // Don't use Unsplash URLs
          if (url.includes('images.unsplash.com')) {
            return '';
          }
          
          // If it's already a full URL with localhost, keep it
          if (url.includes('localhost:3000')) {
            return url;
          }
          
          // If it's already a full URL (not localhost), it might be wrong
          if (url.startsWith('http://') || url.startsWith('https://')) {
            // Extract just the filename from the URL
            const filename = url.split('/').pop();
            if (filename) {
              return `http://localhost:3000/articles/${filename}`;
            }
            return '';
          }
          
          // If it's just a filename, prepend the correct path
          const baseUrl = 'http://localhost:3000';
          
          // Remove any leading slashes or uploads/ prefix
          let cleanUrl = url;
          if (cleanUrl.startsWith('/')) cleanUrl = cleanUrl.substring(1);
          if (cleanUrl.startsWith('uploads/')) cleanUrl = cleanUrl.replace('uploads/', '');
          if (cleanUrl.startsWith('articles/')) cleanUrl = cleanUrl.replace('articles/', '');
          
          // Add cache-busting parameter
          return `${baseUrl}/articles/${cleanUrl}?t=${Date.now()}`;
        };

        // Helper function to fix images in content
        const fixImagesInContent = (content: any): any => {
          if (!content) return content;
          
          if (typeof content === 'string') {
            // Fix image URLs in HTML string content
            return content.replace(
              /src="([^"]*\/uploads\/[^"]*)"/g, 
              (match, url) => `src="${fixImageUrl(url)}"`
            );
          }
          
          if (typeof content === 'object' && content.type === 'doc') {
            // Deep clone and fix TipTap JSON content
            const fixedContent = JSON.parse(JSON.stringify(content));
            
            const fixNodeImages = (node: any) => {
              if (node.type === 'image' && node.attrs?.src) {
                node.attrs.src = fixImageUrl(node.attrs.src);
              }
              
              if (node.content && Array.isArray(node.content)) {
                node.content.forEach(fixNodeImages);
              }
              
              return node;
            };
            
            if (fixedContent.content) {
              fixedContent.content.forEach(fixNodeImages);
            }
            
            return fixedContent;
          }
          
          return content;
        };
        
        // Map the article data
        const mappedArticle: Article = {
          id: articleData.id,
          slug: articleData.slug,
          title: articleData.title,
          excerpt: articleData.excerpt || articleData.metaDescription || '',
          content: fixImagesInContent(articleData.content),
          plainText: articleData.plainText || '',
          coverImage: fixImageUrl(articleData.coverImage || articleData.featuredImage || ''),
          readingTime: articleData.readingTime || 1,
          viewCount: articleData.viewCount || 0,
          likeCount: articleData.likeCount || 0,
          reviewStats: articleData.reviewStats || {
            totalCount: 0,
            averageRating: 0,
            ratingDistribution: {}
          },
          clapCount: articleData.clapCount || 0,
          shareCount: articleData.shareCount || 0,
          isFeatured: articleData.isFeatured || false,
          isTrending: articleData.isTrending || false,
          isLiked: articleData.isLiked || false,
          isSaved: articleData.isSaved || false,
          isPremium: articleData.accessType === 'PREMIUM',
          isPreview: articleData.isPreview || false,
          accessType: articleData.accessType || 'FREE',
          status: articleData.status || 'PUBLISHED',
          publishedAt: articleData.publishedAt || articleData.createdAt,
          createdAt: articleData.createdAt,
          updatedAt: articleData.updatedAt,
          author: {
            id: articleData.author?.id || '',
            name: articleData.author?.name || 'Anonymous',
            picture: articleData.author?.picture,
            bio: articleData.author?.bio,
            isVerified: articleData.author?.isVerified || false,
            followersCount: articleData.author?.followersCount || 0
          } as Author,
          category: {
            id: articleData.category?.id || '',
            name: articleData.category?.name || 'Uncategorized',
            slug: articleData.category?.slug || 'uncategorized',
            color: articleData.category?.color,
            description: articleData.category?.description
          } as Category,
          tags: articleData.tags || [],
          availableLanguages: articleData.availableLanguages || availableLanguages,
          language: articleData.language || language,
          translationQuality: articleData.translationQuality,
          recommendationScore: articleData.recommendationScore
        };
        
        console.log('✅ Setting article with language:', mappedArticle.language);
        setArticle(mappedArticle);

         // Fetch review stats separately
        await fetchAndUpdateReviewStats(mappedArticle.id);
        
        // Update available languages if provided
        if (articleData.availableLanguages) {
          setAvailableLanguages(articleData.availableLanguages);
        }
        
        // Check premium access if needed
        if (mappedArticle.accessType === 'PREMIUM' && user) {
          checkAndSetAccess();
        } else if (mappedArticle.accessType === 'FREE') {
          setUserHasAccess(true);
          setShowPaywall(false);
        }
        
        // Update like and save states
        setLiked(mappedArticle.isLiked || false);
        setSaved(mappedArticle.isSaved || false);
        
        notification.success({
          message: t`Switched to ${getLanguageName(language)}`,
          description: isManualChange 
            ? t`Article is now in ${getLanguageName(language)}.` 
            : t`Article auto-switched to match UI language.`,
          duration: 3,
        });
        
        console.log('✅ Article language switch completed');
        
        // Load related articles with the new language
        setTimeout(() => {
          loadRelatedArticles(mappedArticle.id, true);
        }, 300);
        
      } else {
        console.error('❌ No article data found in response');
        throw new Error(t`Could not load the ${getLanguageName(language)} version`);
      }
    } else {
      console.error('❌ No response data');
      throw new Error(t`Could not load the ${getLanguageName(language)} version`);
    }
  } catch (error: any) {
    console.error('❌ Failed to switch article language:', error);
    
    // Revert to previous language on error
    if (article) {
      setArticle(article); // Restore original article
      setArticleLanguage(article.language || 'en');
    }
    
    // Reset manual change flag if this was a manual change that failed
    if (isManualChange) {
      setUserManuallyChangedArticleLanguage(false);
    }
    
    notification.error({
      message: t`Language Switch Failed`,
      description: error.response?.data?.message || error.message || t`Could not load the translated version.`,
      duration: 3,
    });
  } finally {
    setLanguageSwitching(false);
    setLoading(false);
  }
};

const handleLanguageChange = async (language: string) => {
  if (!article || language === currentLanguage || isTranslating || languageSwitching) return;
  
  console.log('🔄 START Switching language to:', language, {
    currentArticleId: article.id,
    currentArticleLanguage: article.language
  });
  

  
  
    // Mark as manual change with timestamp
  setLastManualLanguageChange(Date.now());
  
  setLanguageSwitching(true);
  
  try {
    // Show loading notification
    notification.info({
      message: t`Loading ${getLanguageName(language)} version...`,
      duration: 2,
      key: 'language-switch',
    });
    
    // 1. Clear current article to show loading state
    setArticle(null);
    setLoading(true);
    
    // 2. Update the currentLanguage state IMMEDIATELY
    console.log('🔄 Setting currentLanguage to:', language);
    setCurrentLanguage(language);
    
    // 3. Set a new content key to force re-render
    const newKey = `lang-${language}-${Date.now()}`;
    setContentKey(newKey);
    
    // 4. CRITICAL: Re-fetch the article with new language
    // Use language parameter only if it's NOT the default language
    const params = language !== 'en' ? { language } : undefined;
    console.log('🔄 Re-fetching article with params:', params, 'slug:', slug);
    
    const response = await articleApi.getArticle(slug, params);
    
    console.log('🔄 Article API response:', {
      responseData: response?.data,
      success: response?.success,
      hasData: !!response?.data
    });
    
    if (response?.data) {
      let articleData;
      
      // Handle different response formats
      if (typeof response.data === 'object') {
        // Check for success wrapper pattern
        if ('success' in response.data && response.data.success) {
          articleData = response.data.data;
          console.log('✅ Success wrapper found, data:', articleData);
        } 
        // Check for direct data pattern
        else if ('id' in response.data || 'slug' in response.data) {
          articleData = response.data;
          console.log('✅ Direct data found');
        }
        // Check for API response pattern
        else if ('data' in response.data && response.data.data) {
          articleData = response.data.data;
          console.log('✅ Nested data found');
        }
      }
      
      if (articleData) {
        console.log('✅ Processing article data:', {
          id: articleData.id,
          title: articleData.title,
          language: articleData.language
        });
        
        // Map the article data
        const mappedArticle: Article = {
          id: articleData.id,
          slug: articleData.slug,
          title: articleData.title,
          excerpt: articleData.excerpt || articleData.metaDescription || '',
          content: articleData.content,
          plainText: articleData.plainText || '',
          coverImage: articleData.coverImage || articleData.featuredImage || '',
          readingTime: articleData.readingTime || 1,
          viewCount: articleData.viewCount || 0,
          likeCount: articleData.likeCount || 0,
          reviewStats: articleData.reviewStats || {
            totalCount: 0,
            averageRating: 0,
            ratingDistribution: {}
          },
          clapCount: articleData.clapCount || 0,
          shareCount: articleData.shareCount || 0,
          isFeatured: articleData.isFeatured || false,
          isTrending: articleData.isTrending || false,
          isLiked: articleData.isLiked || false,
          isSaved: articleData.isSaved || false,
          isPremium: articleData.accessType === 'PREMIUM',
          isPreview: articleData.isPreview || false,
          accessType: articleData.accessType || 'FREE',
          status: articleData.status || 'PUBLISHED',
          publishedAt: articleData.publishedAt || articleData.createdAt,
          createdAt: articleData.createdAt,
          updatedAt: articleData.updatedAt,
          author: {
            id: articleData.author?.id || '',
            name: articleData.author?.name || 'Anonymous',
            picture: articleData.author?.picture,
            bio: articleData.author?.bio,
            isVerified: articleData.author?.isVerified || false,
            followersCount: articleData.author?.followersCount || 0
          } as Author,
          category: {
            id: articleData.category?.id || '',
            name: articleData.category?.name || 'Uncategorized',
            slug: articleData.category?.slug || 'uncategorized',
            color: articleData.category?.color,
            description: articleData.category?.description
          } as Category,
          tags: articleData.tags || [],
          availableLanguages: articleData.availableLanguages || availableLanguages, // Use existing if not provided
          language: articleData.language || language, // Fallback to requested language
          translationQuality: articleData.translationQuality,
          recommendationScore: articleData.recommendationScore
        };
        
        console.log('✅ Setting article with language:', mappedArticle.language);
        setArticle(mappedArticle);
        
        // Update available languages if provided
        if (articleData.availableLanguages) {
          setAvailableLanguages(articleData.availableLanguages);
        }
        
        notification.success({
          message: t`Switched to ${getLanguageName(language)}`,
          description: t`Article content has been updated.`,
          duration: 3,
        });
        
        console.log(' Language switch and article reload completed');
      } else {
        console.error(' No article data found in response');
        throw new Error(t`Could not load the ${getLanguageName(language)} version`);
      }
    } else {
      console.error(' No response data');
      throw new Error(t`Could not load the ${getLanguageName(language)} version`);
    }
  } catch (error: any) {
    console.error(' Failed to switch language:', error);
    
    // Revert to previous language on error
    if (article) {
      setArticle(article); // Restore original article
      setCurrentLanguage(article.language || 'en');
    }
    
    notification.error({
      message: t`Language Switch Failed`,
      description: error.response?.data?.message || error.message || t`Could not load the translated version.`,
      duration: 3,
    });
  } finally {
    setLanguageSwitching(false);
    setLoading(false);
  }
};


const MobileLanguageSelector: React.FC<{
  currentLanguage: string;
  availableLanguages: string[];
  isTranslating: boolean;
  onLanguageChange: (lang: string) => Promise<void>;
  onTranslateRequest: (lang: string) => Promise<void>;
  articleId?: string;
  onLanguagesUpdated?: (newLanguages: string[]) => void;
  user?: any;  
  onAuthRequired?: () => void; 
}> = ({ 
  currentLanguage, 
  availableLanguages, 
  isTranslating, 
  onLanguageChange, 
  onTranslateRequest,
  articleId,
  onLanguagesUpdated
}) => {
  const [showFullLanguageModal, setShowFullLanguageModal] = useState(false);
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [selectedLangForTranslate, setSelectedLangForTranslate] = useState<string | null>(null);
  const [translateProgress, setTranslateProgress] = useState(0);
  const [isMobileTranslating, setIsMobileTranslating] = useState(false);
  const [translationStatus, setTranslationStatus] = useState<'idle' | 'progress' | 'complete'>('idle');

  // Progress interval refs
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup intervals
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

useEffect(() => {
  console.log(' Language changed to:', i18n.locale);
  
  // Extract language code
  const uiLanguageCode = i18n.locale.split('-')[0];
  const currentLanguageCode = currentLanguage.split('-')[0];
  
  // Only update if language code is different
  if (uiLanguageCode !== currentLanguageCode) {
    console.log(' UI language differs from article language, triggering update');
    
    // Clear related articles cache
    setRelatedArticles([]);
    
    // Update current language state
    setCurrentLanguage(uiLanguageCode);
    
    // Re-fetch related articles with new language
    if (article?.id) {
      // Use a small delay to ensure language state is updated
      setTimeout(() => {
        loadRelatedArticles(article.id, true);
      }, 100);
    }
  }
}, [i18n.locale]);
 
 
  useEffect(() => {
  const startTranslation = async () => {
    if (showTranslationModal && selectedLangForTranslate && !isMobileTranslating && translationStatus === 'idle') {
      console.log(' Auto-starting translation for:', selectedLangForTranslate);
      await handleMobileTranslate(selectedLangForTranslate);
    }
  };
  
  // Add a debounce or run only once
  if (showTranslationModal && selectedLangForTranslate) {
    startTranslation();
  }
}, [showTranslationModal, selectedLangForTranslate, isMobileTranslating, translationStatus]);




  const checkTranslationExists = async (targetLanguage: string): Promise<boolean> => {
    if (!articleId) return false;
    
    try {
      const languagesResponse = await articleApi.getArticleAvailableLanguages(articleId);
      console.log(' Mobile: Checking existing languages:', languagesResponse);
      
      let languages;
      if (languagesResponse?.data.languages) {
        languages = languagesResponse.data.languages;
      } else if (languagesResponse?.data?.languages) {
        languages = languagesResponse.data.languages;
      } else if (Array.isArray(languagesResponse)) {
        languages = languagesResponse;
      } else if (Array.isArray(languagesResponse?.data)) {
        languages = languagesResponse.data;
      }
      
      const exists = Array.isArray(languages) && languages.some((lang: any) => 
        (lang.language || lang.code || lang) === targetLanguage
      );
      
      console.log(' Mobile: Language exists?', exists, 'for', targetLanguage);
      return exists;
    } catch (error) {
      console.error('Error checking translation existence:', error);
      return false;
    }
  };

  // Handle translation request
const handleMobileTranslate = useCallback(async (langCode: string) => {
  // Check authentication before allowing translation
  if (!user) {
    // Show auth modal for translation
    setAuthAction('translate');
    setShowAuthModal(true);
    return;
  }

  // Check if the language is already available FIRST
  const isAlreadyAvailable = availableLanguages.includes(langCode);
  if (isAlreadyAvailable) {
    // If already available, just switch to it
    notification.info({
      message: t`Language Already Available`,
      description: t`${getLanguageName(langCode)} is already available. Switching now...`,
      duration: 3,
    });
    await onLanguageChange(langCode);
    return;
  }

  if (!articleId || isMobileTranslating) return;
  
  console.log('📱 Mobile: Starting translation for language:', langCode);
  
  setIsMobileTranslating(true);
  setTranslationStatus('progress');
  setTranslateProgress(0);
  
  try {
    // Make the API call to backend
    console.log('📱 Mobile: Calling articleApi.translateArticle...');
    const response = await articleApi.translateArticle(articleId, langCode);
    
    console.log('📱 Mobile: Translation API response:', response);
    
    // Check if response indicates success
    const isSuccess = 
      response?.success === true ||
      response?.status === 201 ||
      response?.status === 200 ||
      (response?.data && (
        typeof response.data === 'object' && 
        ('id' in response.data || 'articleId' in response.data)
      ));
    
    if (isSuccess) {
      console.log(' Mobile: Translation request successful');
      
      // Show success notification
      notification.success({
        message: t`Translation Started! `,
        description: t`Converting your content to ${getLanguageName(langCode)}. Hang tight - this usually takes seconds to a minute!`,
        duration: 4,
      });
      
      // Start progress simulation
      let simulatedProgress = 0;
      progressIntervalRef.current = setInterval(() => {
        simulatedProgress += Math.random() * 8 + 3;
        if (simulatedProgress >= 95) {
          setTranslateProgress(95);
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
        } else {
          setTranslateProgress(Math.floor(simulatedProgress));
        }
      }, 1000);
      
      // Start polling for completion
      startPollingForTranslation(langCode);
      
    } else {
      // Log technical error to console
      console.error(' Mobile: Translation API returned non-success (Technical):', response?.message || response?.error);
      
      // Throw user-friendly error from FRONTEND
      throw new Error(t`Translation service is temporarily busy. Please try again shortly.`);
    }
    
  } catch (error: any) {
    // Log technical error to console
    console.error(' Mobile: Translation request failed (Technical):', {
      message: error.message,
      stack: error.stack
    });
    
    // Clean up intervals
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Show user-friendly error message from FRONTEND
    notification.error({
      message: t`Translation Unavailable`,
      description: t`We couldn't start the translation right now. Please try again in a moment.`,
      duration: 4,
    });
    
    // Reset state
    setIsMobileTranslating(false);
    setSelectedLangForTranslate(null);
    setTranslateProgress(0);
    setTranslationStatus('idle');
    setShowTranslationModal(false);
  }
}, [user, articleId, isMobileTranslating]);

  // Polling function
  const startPollingForTranslation = (targetLanguage: string) => {
    let checkCount = 0;
    const maxChecks = 40;
    
    const poll = async () => {
      if (checkCount >= maxChecks || translationStatus === 'complete') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        if (checkCount >= maxChecks && translationStatus !== 'complete') {
        notification.info({
          message: t`Translation Taking Longer`,
          description: t`Translation is still processing. It will appear automatically when ready.`,
          duration: 5,
        });
}
        return;
      }
      
      checkCount++;
      console.log(`obile: Polling attempt ${checkCount}/${maxChecks} for ${targetLanguage}`);
      
      try {
        const alreadyTranslated = await checkTranslationExists(targetLanguage);
        if (alreadyTranslated) {
          setTranslateProgress(100);
          setTranslationStatus('complete');
          
          // Clean up intervals
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          
          // Show SUCCESS MESSAGE (same as desktop)
          setTimeout(() => {
            const userName = user?.name || 'Reader';
            showTranslationSuccess(userName, targetLanguage);
            
            // Update available languages
            if (onLanguagesUpdated) {
              const newLanguages = [...availableLanguages, targetLanguage];
              onLanguagesUpdated(newLanguages);
            }
            
            // Automatically switch to the new language
            onLanguageChange(targetLanguage);
            
            // Reset state
            setIsMobileTranslating(false);
            setSelectedLangForTranslate(null);
            setTranslateProgress(0);
            setTranslationStatus('idle');
            setShowTranslationModal(false);
          }, 2000);
          
          return;
        }
        
        // Continue polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        pollingIntervalRef.current = setTimeout(poll, 3000);
        
      } catch (error) {
        console.error('Mobile: Error polling translation:', error);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        pollingIntervalRef.current = setTimeout(poll, 5000);
      }
    };
    
    // Start polling
    poll();
  };
// Show success notification
  const showTranslationSuccess = (userName: string, language: string) => {
    notification.success({
    message: (
      <div className="flex items-center gap-2">
        <div className="text-lg">🎉</div>
        <div>
          <div className="font-bold">{t`Excellent news, ${userName}!`}</div>
          <div className="text-sm text-gray-600">{t`Your ${getLanguageName(language)} translation is ready`}</div>
        </div>
      </div>
    ),
    description: (
      <div className="space-y-2">
        <div className="text-sm">
          {t`You can now enjoy the outstanding knowledge of Inlirah in ${getLanguageName(language)} for best understanding.`}
        </div>
        <div className="text-xs text-gray-500">
          {t`Inlirah is committed to making knowledge accessible to everyone. Thank you for your patience!`}
        </div>
        <div className="mt-2 text-xs text-blue-600">
          <strong>{t`Note:`}</strong> {t`Once translated by one person, the language becomes available for everyone!`}
        </div>
      </div>
    ),
    duration: 8,
    placement: 'topRight',
    className: 'translation-success-notification',
    style: {
      background: 'linear-gradient(135deg, #f6ffed 0%, #f0f5ff 100%)',
      border: '2px solid #52c41a',
      borderRadius: '8px',
    }
  });
  };

  // All supported languages
  const allLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ];

  // Group languages
  const availableLangs = allLanguages.filter(lang => 
    availableLanguages.includes(lang.code)
  );
  
  const suggestedLangs = allLanguages.filter(lang => 
    !availableLanguages.includes(lang.code)
  );

  return (
    <>
      {/* Compact Language Display */}
      <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
        <div className="px-3 py-2">
          {/* Current Language */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-base">{getLanguageFlag(currentLanguage)}</span>
              </div>
              <div>
               <div className="text-xs text-gray-500 dark:text-gray-400">
                {t`Current Language`}
               </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {getLanguageName(currentLanguage)}
                </div>
              </div>
            </div>
            <CheckOutlined className="text-green-500" />
          </div>

          {/* Available Languages */}
          <div className="mb-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-between">
            <span>{t`Available`} ({availableLangs.length})</span>
            <button
              onClick={() => setShowFullLanguageModal(true)}
              className="text-blue-500 hover:text-blue-600 text-xs"
            >
              {t`See all`}
            </button>
          </div>
            
            <div className="flex flex-wrap gap-1">
              {availableLangs.slice(0, 4).map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.code);
                  }}
                  disabled={isTranslating || lang.code === currentLanguage}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all ${
                    lang.code === currentLanguage
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  } ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-sm">{lang.flag}</span>
                  <span className="max-w-[60px] truncate">{lang.name}</span>
                </button>
              ))}
              {availableLangs.length > 4 && (
                <button
                  onClick={() => setShowFullLanguageModal(true)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span>+{availableLangs.length - 4}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Translate */}
          {suggestedLangs.length > 0 && !isMobileTranslating && (
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {t`Request Translation`}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {suggestedLangs.slice(0, 3).map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    console.log(t`Mobile: Language selected for translation:`, lang.code);
                    setSelectedLangForTranslate(lang.code);
                    setShowTranslationModal(true); // This will trigger the useEffect
                  }}
                  disabled={isMobileTranslating}
                  className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-lg mb-1">{lang.flag}</span>
                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate w-full text-center">
                    {lang.name}
                  </span>
                </button>
              ))}
              {suggestedLangs.length > 3 && (
                <button
                  onClick={() => setShowFullLanguageModal(true)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-lg mb-1">🌐</span>
                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate w-full text-center">
                    {t`More...`}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

          {/* Translation in Progress */}
          {isMobileTranslating && selectedLangForTranslate && (
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <Spin size="small" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-300">
                        {translateProgress}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {t`Translating to ${getLanguageName(selectedLangForTranslate)}`}
                  </div>
                  <Progress 
                    percent={translateProgress}
                    size="small"
                    strokeColor={{
                      '0%': '#1890ff',
                      '50%': '#722ed1',
                      '100%': '#52c41a',
                    }}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULL Translation Modal (SAME AS DESKTOP) */}
      <Modal
  title={
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
        <TranslationOutlined className="text-white" />
      </div>
      <span>
        {translationStatus === 'complete' ? t`Translation Complete!` : t`Generating Translation`}
      </span>
    </div>
  }
  open={showTranslationModal && !!selectedLangForTranslate}
  closable={translationStatus === 'complete'}
  onCancel={() => {
    if (translationStatus === 'complete') {
      setIsMobileTranslating(false);
      setSelectedLangForTranslate(null);
      setTranslateProgress(0);
      setTranslationStatus('idle');
      setShowTranslationModal(false);
    }
  }}
  footer={translationStatus === 'complete' ? [
    <Button 
      key="close" 
      type="primary" 
      onClick={() => {
        setIsMobileTranslating(false);
        setSelectedLangForTranslate(null);
        setTranslateProgress(0);
        setTranslationStatus('idle');
        setShowTranslationModal(false);
      }}
    >
      {t`Close`}
    </Button>
  ] : null}
  width="100%"
  style={{ 
    maxWidth: '500px',
    margin: '16px',
    top: '16px',
    position: 'relative'
  }}
>
  <div className="space-y-6">
    {translationStatus === 'complete' ? (
      // Success state (SAME AS DESKTOP)
      <div className="text-center animate-fadeIn">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
          <CheckOutlined className="text-white text-3xl" />
        </div>
        <Title level={3} className="!mb-2 text-green-600">
          {t`Translation Complete!`}
        </Title>
        <Paragraph className="text-lg mb-4">
          {t`Your article is now available in ${getLanguageName(selectedLangForTranslate || '')}`}
        </Paragraph>
        <div className="flex items-center justify-center gap-2 text-lg">
          <Spin size="small" />
          <Text type="secondary">
            {t`Switching to ${getLanguageName(selectedLangForTranslate || '')}...`}
          </Text>
        </div>
      </div>
    ) : (
      // Progress state (SAME AS DESKTOP)
      <>
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <div className="relative">
                <Spin size="large" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-300">
                    {translateProgress}%
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
              <span className="text-white text-lg">🚀</span>
            </div>
          </div>
          
          <div className="mb-2">
            <Title level={3} className="!mb-1">
              {t`Translating to ${getLanguageName(selectedLangForTranslate || '')}`}
            </Title>
            <Text type="secondary">
              {translateProgress < 30 ? t`Analyzing content structure...` :
               translateProgress < 60 ? t`Processing translation with AI...` :
               translateProgress < 85 ? t`Reviewing translation quality...` :
               t`Finalizing translation...`}
            </Text>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Text>{t`Progress`}</Text>
            <Text strong>{translateProgress}%</Text>
          </div>
          <Progress 
            percent={translateProgress}
            status="active"
            strokeColor={{
              '0%': '#1890ff',
              '100%': '#722ed1',
            }}
            strokeWidth={6}
          />
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg border transition-all ${translateProgress > 20 ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${translateProgress > 20 ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {translateProgress > 20 ? '✓' : '1'}
                </div>
                <Text strong className={translateProgress > 20 ? 'text-green-600' : ''}>
                  {t`Content Analysis`}
                </Text>
              </div>
              <Text type="secondary" className="text-xs">
                {t`Parsing original structure`}
              </Text>
            </div>
            
            <div className={`p-3 rounded-lg border transition-all ${translateProgress > 50 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${translateProgress > 50 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {translateProgress > 50 ? '✓' : '2'}
                </div>
                <Text strong className={translateProgress > 50 ? 'text-blue-600' : ''}>
                  {t`AI Translation`}
                </Text>
              </div>
              <Text type="secondary" className="text-xs">
                {t`Advanced LLM processing`}
              </Text>
            </div>
            
            <div className={`p-3 rounded-lg border transition-all ${translateProgress > 80 ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${translateProgress > 80 ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {translateProgress > 80 ? '✓' : '3'}
                </div>
                <Text strong className={translateProgress > 80 ? 'text-purple-600' : ''}>
                  {t`Quality Review`}
                </Text>
              </div>
              <Text type="secondary" className="text-xs">
                {t`Ensuring accuracy`}
              </Text>
            </div>
            
            <div className={`p-3 rounded-lg border transition-all ${translateProgress >= 95 ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${translateProgress >= 95 ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {translateProgress >= 95 ? '✓' : '4'}
                </div>
                <Text strong className={translateProgress >= 95 ? 'text-orange-600' : ''}>
                  {t`Finalizing`}
                </Text>
              </div>
              <Text type="secondary" className="text-xs">
                {t`Making available`}
              </Text>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">⏳</span>
            </div>
            <div>
              <Text strong className="block mb-1">
                {translateProgress < 50 ? t`Starting translation process...` :
                 translateProgress < 85 ? t`AI is working on your translation...` :
                 t`Almost done! Finalizing...`}
              </Text>
              <Text type="secondary" className="text-sm">
                {t`Your request helps make this outstanding Inlirah knowledge accessible to more people in their preferred language. Once complete, ${getLanguageName(selectedLangForTranslate || '')} will be automatically available for everyone!`}
              </Text>
            </div>
          </div>
        </div>
      </>
    )}
  </div>
</Modal>

      {/* Full Languages Modal */}
<Modal
  title={
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
        <GlobalOutlined className="text-blue-600 dark:text-blue-400 text-lg" />
      </div>
      <div className="flex-1">
        <div className="font-bold text-gray-900 dark:text-white text-base">
          {t`All Languages`}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {t`${availableLangs.length} available • ${suggestedLangs.length} suggested for translation`}
        </div>
      </div>
    </div>
  }
  open={showFullLanguageModal}
  onCancel={() => setShowFullLanguageModal(false)}
  width="100%"
  wrapClassName="dark:bg-gray-900"
  className="[&_.ant-modal-content]:bg-white [&_.ant-modal-content]:dark:bg-gray-900 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-gray-200 [&_.ant-modal-header]:dark:border-gray-700 [&_.ant-modal-header]:bg-white [&_.ant-modal-header]:dark:bg-gray-900"
  style={{ 
    maxWidth: '520px',
    margin: '16px',
    top: '20px',
    borderRadius: '12px',
    overflow: 'hidden'
  }}
  bodyStyle={{ 
    maxHeight: '60vh',
    overflowY: 'auto',
    padding: '0',
    backgroundColor: 'inherit'
  }}
  footer={null}
  closeIcon={<CloseOutlined className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />}
>
  <div className="divide-y divide-gray-100 dark:divide-gray-800">
    {/* Available Languages Section */}
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {t`Available Languages`}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t`Select your preferred language`}
          </div>
        </div>
        <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
          {availableLangs.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {availableLangs.map(lang => (
          <button
            key={lang.code}
            onClick={() => {
              onLanguageChange(lang.code);
              setShowFullLanguageModal(false);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
              lang.code === currentLanguage 
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-gray-200 dark:ring-gray-700">
                  <span className="text-2xl">{lang.flag}</span>
                </div>
                {lang.code === currentLanguage && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                    <CheckOutlined className="text-white text-xs" />
                  </div>
                )}
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-white text-sm">
                  {lang.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t`${lang.name} • ${lang.code.toUpperCase()}`}
                </div>
              </div>
            </div>
            {lang.code === currentLanguage ? (
              <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold">
                {t`Active`}
              </div>
            ) : (
              <CopyrightOutlined className="text-gray-400 dark:text-gray-500" />
            )}
          </button>
        ))}
      </div>
    </div>

    {/* Suggested for Translation Section */}
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {t`Request Translation`}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t`Help us translate into these languages`}
          </div>
        </div>
        <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
          {suggestedLangs.length}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {suggestedLangs.map(lang => (
          <button
            key={lang.code}
            onClick={() => {
              setSelectedLangForTranslate(lang.code);
              setShowTranslationModal(true);
              setShowFullLanguageModal(false);
            }}
            className="group flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md dark:hover:shadow-blue-900/10 hover:shadow-blue-100 dark:hover:shadow-blue-900/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <div className="relative mb-3">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-gray-200 dark:ring-gray-600 group-hover:ring-blue-200 dark:group-hover:ring-blue-800 transition-all">
                <span className="text-3xl">{lang.flag}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 dark:bg-amber-600 rounded-full flex items-center justify-center">
                <PlusOutlined className="text-white text-xs" />
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5 truncate w-full">
                {lang.name}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                {lang.code.toUpperCase()}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer Note */}
      {/* <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
          <InfoCircleOutlined className="mt-0.5 flex-shrink-0" />
          <span>
            {t`Can't find your language?`}{' '}
            <button className="text-blue-600 dark:text-blue-400 font-medium hover:underline focus:outline-none">
              {t`Request a new language`}
            </button>{' '}
            {t`to be added.`}
          </span>
        </div>
      </div> */}
    </div>
  </div>
</Modal>
    </>
  );
};

const getLanguageName = (code: string): string => {
  const languages: Record<string, string> = {
    'en': 'English',
    'fr': 'Français',
    'es': 'Español',
    'de': 'Deutsch',
    'pt': 'Português',
    'ar': 'العربية',
    'hi': 'हिन्दी',
    'zh': '中文',
    'ja': '日本語',
    'ru': 'Русский',
  };
  return languages[code] || code.toUpperCase();
};

const getLanguageFlag = (code: string): string => {
  const flags: Record<string, string> = {
    'en': '🇺🇸',
    'fr': '🇫🇷',
    'es': '🇪🇸',
    'de': '🇩🇪',
    'pt': '🇵🇹',
    'ar': '🇸🇦',
    'hi': '🇮🇳',
    'zh': '🇨🇳',
    'ja': '🇯🇵',
    'ru': '🇷🇺',
  };
  return flags[code] || '🌐';
};


// Add this function to show translation success notification
const showTranslationSuccess = (userName: string, language: string) => {
  const languageName = getLanguageName(language);
  
  notification.success({
    message: (
      <div className="flex items-center gap-2">
        <div className="text-lg">🎉</div>
        <div>
          <div className="font-bold">
            <Trans>Excellent news, {userName}!</Trans>
          </div>
          <div className="text-sm text-gray-600">
            <Trans>
              Your <strong>{languageName}</strong> translation is ready
            </Trans>
          </div>
        </div>
      </div>
    ),
    description: (
      <div className="space-y-2">
        <div className="text-sm">
          <Trans>
            You can now enjoy the outstanding knowledge of Inlirah in <strong>{languageName}</strong> for best understanding.
          </Trans>
        </div>
        <div className="text-xs text-gray-500">
          {t`Inlirah is committed to making knowledge accessible to everyone. Enjoy your reading!`}
        </div>
        <div className="mt-2 text-xs text-blue-600">
          <Trans>
            <strong>Note:</strong> Once translated by one person, the language becomes available for everyone!
          </Trans>
        </div>
      </div>
    ),
    duration: 8,
    placement: 'topRight',
    className: 'translation-success-notification',
    style: {
      background: 'linear-gradient(135deg, #f6ffed 0%, #f0f5ff 100%)',
      border: '2px solid #52c41a',
      borderRadius: '8px',
    }
  });
};

 // Helper function to get time ago
const getTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return t`Just now`;
    if (seconds < 3600) return t`${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return t`${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return t`${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return t`${Math.floor(seconds / 604800)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (error) {
    return t`Recently`;
  }
};


// Helper function to get engagement label
const getEngagementLabel = (score: number): { label: string; color: string } => {
  if (score >= 80) return { label: t`Hot`, color: '#fa541c' };
  if (score >= 60) return { label: t`Trending`, color: '#fa8c16' };
  if (score >= 40) return { label: t`Popular`, color: '#52c41a' };
  if (score >= 20) return { label: t`Good read`, color: '#1890ff' };
  return { label: t`New`, color: '#8c8c8c' };
};

// Helper function to get reading time text with proper pluralization
const getReadingTimeText = (minutes: number): string => {
  if (minutes < 1) return t`Less than a minute`;
  if (minutes === 1) return t`1 minute`;
  return t`${minutes} minutes`;
};


const checkPremiumAccess = async (): Promise<boolean> => {
  if (!article || article.accessType !== 'PREMIUM') {
    console.log('Article is not premium, allowing access');
    return true;
  }
  
  if (!user) {
    console.log('No user, showing auth modal for premium');
    setAuthAction('premium');
    setShowAuthModal(true);
    return false;
  }
  
  console.log('Checking premium access for user:', user.id, 'article:', article.id);
  
  try {
    // Use the access check endpoint first
    console.log('Checking /access endpoint...');
    const accessResponse = await apiClient.get(`/articles/${article.id}/access`);
    console.log('Access check response:', accessResponse.data);
    
    if (accessResponse.data?.hasAccess === true) {
      console.log('User already has access to this article. Reason:', accessResponse.data.reason);
      setUserHasAccess(true);
      return true;
    }
    
    console.log('User does not have access. Reason:', accessResponse.data?.reason);
    console.log('Will show paywall for purchase');
    setUserHasAccess(false);
    return false;
    
  } catch (error: any) {
    console.error('Failed to check article access:', error);
    console.log('Error response:', error.response?.data);
    
    // IMPORTANT: REMOVE THIS FALLBACK PURCHASE CALL!
    // This is what's causing the auto-purchase on refresh
    // Just return false and show paywall
    setUserHasAccess(false);
    return false;
  }
};


// Function to check if user has access and update state
const checkAndSetAccess = async () => {
  if (checkingAccessRef.current) return; // Prevent concurrent checks
  checkingAccessRef.current = true;
  
  try {
    if (!article || article.accessType !== 'PREMIUM' || !user) {
      return;
    }
    
    console.log('Checking and setting access...');
    const hasAccess = await checkPremiumAccess();
    setUserHasAccess(hasAccess);
    
    if (!hasAccess) {
      console.log('Showing paywall...');
      setShowPaywall(true);
    } else {
      console.log('User has access, not showing paywall');
      setShowPaywall(false);
    }
  } finally {
    checkingAccessRef.current = false;
  }
};


// Wrap checkAuth with useCallback to prevent recreation
const checkAuth = useCallback((action: 'like' | 'comment' | 'save' | 'premium' | 'share' | 'reply' | 'translate'): boolean => {
  if (!user) {
    setAuthAction(action);
    setShowAuthModal(true);
    return false;
  }
  return true;
}, [user]); // Add user as dependency


const refreshAvailableLanguages = async () => {
  if (!article?.id) return;
  
  try {
    const response = await articleApi.getArticleAvailableLanguages(article.id);
    if (response?.data.languages) {
      const languages = response.data.languages.map((lang: any) => lang.language);
      setAvailableLanguages(languages);
      
      // Update article state for consistency
      setArticle(prev => prev ? {
        ...prev,
        availableLanguages: languages
      } : null);
    }
  } catch (error) {
    console.error('Failed to refresh available languages:', error);
  }
};


// Add this simple function near your other helper functions
const renderPremiumContentPlaceholder = () => {
  return (
    <div className="bg-blue-100 dark:bg-gray-900 my-8 p-6 text-center">
      <div className="mb-4">
        <CrownOutlined className="text-3xl text-purple-500 mb-2" />
        <Title level={4} className="!mb-2 text-foreground dark:text-white">
          {t`Premium Content`}
        </Title>
        <Paragraph className="text-lg text-muted-foreground dark:text-gray-300 mb-6">
          {t`This article is part of our premium collection. Unlock it to access exclusive insights, expert analysis, and in-depth content that's not available anywhere else.`}
        </Paragraph>
      </div>
      
      <Button
        type="primary"
        icon={<LockOutlined />}
        onClick={() => setShowPaywall(true)}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0"
      >
        {t`Unlock Article`}
      </Button>
    </div>
  );
};


  // Session-based view tracking
  const hasViewedInSession = (articleId: string): boolean => {
    const sessionKey = `viewed_${articleId}`;
    return sessionStorage.getItem(sessionKey) === 'true';
  };

  const markAsViewedInSession = (articleId: string): void => {
    const sessionKey = `viewed_${articleId}`;
    sessionStorage.getItem(sessionKey) || sessionStorage.setItem(sessionKey, 'true');
  };

  // Enhanced view tracking with conditions
  const trackViewWithConditions = async (articleId: string, authorId?: string): Promise<void> => {
    if (!articleId || viewTrackedRef.current) return;
    
    if (hasViewedInSession(articleId)) {
      console.log('Article already viewed in this session');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (!isMountedRef.current) return;
      
      await articleApi.trackArticleView(articleId);
      
      viewTrackedRef.current = true;
      markAsViewedInSession(articleId);
      
      console.log('View successfully tracked for article:', articleId);
    } catch (error) {
      console.debug('View tracking failed (non-critical):', error);
    }
  };

  // Scroll to comments section
  const scrollToComments = () => {
    const commentsSection = document.getElementById('comments-section');
    if (commentsSection) {
      commentsSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      setTimeout(() => {
        const commentInput = document.querySelector('#comments-section textarea');
        if (commentInput) {
          (commentInput as HTMLElement).focus();
        }
      }, 500);
    }
  };

  // Initialize component
  useEffect(() => {
  isMountedRef.current = true;
  
  return () => {
    isMountedRef.current = false;
    viewTrackedRef.current = false;
    scrollTrackingEnabledRef.current = false;
    articleIdRef.current = null;
    fetchInProgressRef.current = false; // Add this line
  };
}, []);


useEffect(() => {
  // Load saved preferences
  const savedFontSize = localStorage.getItem('article-reader-font-size');
  const savedLineHeight = localStorage.getItem('article-reader-line-height');
  const savedFontFamily = localStorage.getItem('article-reader-font-family');
  
  if (savedFontSize) setFontSize(parseInt(savedFontSize));
  if (savedLineHeight) setLineHeight(parseFloat(savedLineHeight));
  if (savedFontFamily) setFontFamily(savedFontFamily);
}, []);

// Save preferences when they change
useEffect(() => {
  localStorage.setItem('article-reader-font-size', fontSize.toString());
  localStorage.setItem('article-reader-line-height', lineHeight.toString());
  localStorage.setItem('article-reader-font-family', fontFamily);
}, [fontSize, lineHeight, fontFamily]);

// useEffect(() => {
//   // Re-check access when user logs in/out
//   if (article && article.accessType === 'PREMIUM') {
//     checkAndSetAccess();
//   }
// }, [user, article]);

useEffect(() => {
  // Only run if article and user have actually changed
  if (article && article.accessType === 'PREMIUM' && user) {
    checkAndSetAccess();
  }
}, [user?.id, article?.id]); 




useEffect(() => {
  // This will run when slug changes OR component unmounts
  return () => {
    console.log('🧹 Cleaning up component for slug change');
    fetchInProgressRef.current = false;
    // Don't reset other states here - let the new useEffect handle it
  };
}, [slug]);


// Save article language preference
const saveArticleLanguagePreference = (articleId: string, language: string) => {
  try {
    const preferences = JSON.parse(localStorage.getItem('articleLanguagePreferences') || '{}');
    preferences[articleId] = {
      language,
      timestamp: Date.now()
    };
    localStorage.setItem('articleLanguagePreferences', JSON.stringify(preferences));
    console.log('Saved article language preference:', { articleId, language });
  } catch (error) {
    console.error('Failed to save article language preference:', error);
  }
};

// Load article language preference
const loadArticleLanguagePreference = (articleId: string): string | null => {
  try {
    const preferences = JSON.parse(localStorage.getItem('articleLanguagePreferences') || '{}');
    const preference = preferences[articleId];
    
    // Check if preference is recent (within 30 days)
    if (preference && preference.timestamp) {
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      const isRecent = Date.now() - preference.timestamp < thirtyDaysInMs;
      
      if (isRecent && preference.language) {
        console.log('💾 Loaded article language preference:', { articleId, language: preference.language });
        return preference.language;
      }
    }
  } catch (error) {
    console.error('Failed to load article language preference:', error);
  }
  return null;
};

// Clear old preferences (optional cleanup)
const cleanupOldPreferences = () => {
  try {
    const preferences = JSON.parse(localStorage.getItem('articleLanguagePreferences') || '{}');
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    const cleanedPreferences = Object.entries(preferences).reduce((acc, [key, value]: any) => {
      if (now - value.timestamp < thirtyDaysInMs) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    localStorage.setItem('articleLanguagePreferences', JSON.stringify(cleanedPreferences));
  } catch (error) {
    console.error('Failed to cleanup preferences:', error);
  }
};

// Call cleanup on component mount
useEffect(() => {
  cleanupOldPreferences();
}, []);

/// Load article and related data
useEffect(() => {
  if (!slug) return;
  
  console.log(' Loading article for slug:', slug, 'UI language:', i18n.locale);
  
  let isActive = true;
  
  const loadArticleData = async () => {
    if (fetchInProgressRef.current) {
      console.log('🔄 Fetch already in progress, skipping');
      return;
    }
    
    fetchInProgressRef.current = true;
    setLoading(true);
    
    // Clear previous data for this new slug
    if (isActive) {
      setRelatedArticles([]);
      setTrendingArticles([]);
      setCategories([]);
    }
  
    try {
      // Get UI language from i18n (system/browser language)
      const uiLanguageCode = i18n.locale.split('-')[0];
      
      // ALWAYS set UI language on load
      console.log('🌐 Setting UI language to:', uiLanguageCode);
      setUiLanguage(uiLanguageCode);
      
      // IMPORTANT: Always start with UI language for article on page load/reload
      // Only use saved preference if user has manually changed language DURING CURRENT SESSION
      console.log(' Article will load in UI language on page load:', uiLanguageCode);
      
      // Check for session-based manual change (not localStorage)
      const sessionManualChange = sessionStorage.getItem(`article_manual_lang_${slug}`);
      
      let languageToLoad = uiLanguageCode; // Default to UI language
      let isManualFromSession = false;
      
      if (sessionManualChange) {
        // User changed language during this session
        languageToLoad = sessionManualChange;
        isManualFromSession = true;
        console.log('Using session-based manual language change:', languageToLoad);
      }
      
      // Set article language state IMMEDIATELY
      console.log(' Setting articleLanguage to:', languageToLoad);
      setArticleLanguage(languageToLoad);
      
      if (isManualFromSession) {
        setUserManuallyChangedArticleLanguage(true);
      } else {
        setUserManuallyChangedArticleLanguage(false);
        // Clear any stored preferences for fresh page load
        setArticleLanguageFromStorage(null);
      }

      console.log(' Fetching article for slug:', slug, 'in language:', languageToLoad);
      
      // Fetch article in the determined language
      const params = languageToLoad !== 'en' ? { language: languageToLoad } : undefined;
      const response = await articleApi.getArticle(slug, params);
      
      // Check if component is still mounted
      if (!isActive) {
        console.log(' Component unmounted, aborting');
        return;
      }
      
      let articleData;
      if (response?.data) {
        if (typeof response.data === 'object' && 'success' in response.data) {
          const apiResponse = response.data as any;
          if (apiResponse.success && apiResponse.data) {
            articleData = apiResponse.data;
          } else {
            throw new Error(apiResponse.message || 'Article not found in response');
          }
        } else {
          articleData = response.data;
        }
      } else {
        throw new Error('No data received from server');
      }

      if (articleData && articleData.id) {
        console.log(' Article loaded in language:', languageToLoad, {
          id: articleData.id,
          title: articleData.title,
          availableLanguages: articleData.availableLanguages || ['en']
        });
        
        // Fix image URLs
        const fixImageUrl = (url: string): string => {
          if (!url || url.trim() === '') return '';
          
          if (url.includes('images.unsplash.com')) {
            return '';
          }
          
          if (url.includes('localhost:3000')) {
            return url;
          }
          
          if (url.startsWith('http://') || url.startsWith('https://')) {
            const filename = url.split('/').pop();
            if (filename) {
              return `http://localhost:3000/articles/${filename}`;
            }
            return '';
          }
          
          const baseUrl = 'http://localhost:3000';
          let cleanUrl = url;
          if (cleanUrl.startsWith('/')) cleanUrl = cleanUrl.substring(1);
          if (cleanUrl.startsWith('uploads/')) cleanUrl = cleanUrl.replace('uploads/', '');
          if (cleanUrl.startsWith('articles/')) cleanUrl = cleanUrl.replace('articles/', '');
          
          return `${baseUrl}/articles/${cleanUrl}?t=${Date.now()}`;
        };

        const fixImagesInContent = (content: any): any => {
          if (!content) return content;
          
          if (typeof content === 'string') {
            return content.replace(
              /src="([^"]*\/uploads\/[^"]*)"/g, 
              (match, url) => `src="${fixImageUrl(url)}"`
            );
          }
          
          if (typeof content === 'object' && content.type === 'doc') {
            const fixedContent = JSON.parse(JSON.stringify(content));
            
            const fixNodeImages = (node: any) => {
              if (node.type === 'image' && node.attrs?.src) {
                node.attrs.src = fixImageUrl(node.attrs.src);
              }
              
              if (node.content && Array.isArray(node.content)) {
                node.content.forEach(fixNodeImages);
              }
              
              return node;
            };
            
            if (fixedContent.content) {
              fixedContent.content.forEach(fixNodeImages);
            }
            
            return fixedContent;
          }
          
          return content;
        };

        const mappedArticle: Article = {
          id: articleData.id,
          slug: articleData.slug,
          title: articleData.title,
          excerpt: articleData.excerpt || articleData.metaDescription || '',
          content: fixImagesInContent(articleData.content),
          plainText: articleData.plainText || '',
          coverImage: fixImageUrl(articleData.coverImage || articleData.featuredImage || ''),
          readingTime: articleData.readingTime || 1,
          viewCount: articleData.viewCount || 0,
          likeCount: articleData.likeCount || 0,
          clapCount: articleData.clapCount || 0,
          shareCount: articleData.shareCount || 0,
          isFeatured: articleData.isFeatured || false,
          isTrending: articleData.isTrending || false,
          isLiked: articleData.isLiked || false,
          isSaved: articleData.isSaved || false,
          isPremium: articleData.accessType === 'PREMIUM',
          isPreview: articleData.isPreview || false,
          accessType: articleData.accessType || 'FREE',
          status: articleData.status || 'PUBLISHED',
          publishedAt: articleData.publishedAt || articleData.createdAt,
          createdAt: articleData.createdAt,
          updatedAt: articleData.updatedAt,
          author: {
            id: articleData.author?.id || '',
            name: articleData.author?.name || 'Anonymous',
            picture: articleData.author?.picture,
            bio: articleData.author?.bio,
            isVerified: articleData.author?.isVerified || false,
            followersCount: articleData.author?.followersCount || 0
          } as Author,
          category: {
            id: articleData.category?.id || '',
            name: articleData.category?.name || 'Uncategorized',
            slug: articleData.category?.slug || 'uncategorized',
            color: articleData.category?.color,
            description: articleData.category?.description
          } as Category,
          tags: articleData.tags || [],
          availableLanguages: articleData.availableLanguages || ['en'],
          language: articleData.language || languageToLoad,
          translationQuality: articleData.translationQuality,
          recommendationScore: articleData.recommendationScore
        };

        if (!isActive) return;

        // Set available languages
        setAvailableLanguages(mappedArticle.availableLanguages);
        
        // Set article
        setArticle(mappedArticle);
        
        // Set initial content key
        const initialKey = `init-${mappedArticle.id}-${languageToLoad}-${Date.now()}`;
        setContentKey(initialKey);
        
        console.log(' Article state set on page load:', {
          articleLanguage: languageToLoad,
          uiLanguage: uiLanguageCode,
          isManualFromSession,
          title: mappedArticle.title
        });

        // Check premium access
        if (mappedArticle.accessType === 'PREMIUM' && user) {
          checkAndSetAccess();
        } else if (mappedArticle.accessType === 'FREE') {
          setUserHasAccess(true);
          setShowPaywall(false);
        }

        setLiked(mappedArticle.isLiked || false);
        setSaved(mappedArticle.isSaved || false);
        articleIdRef.current = mappedArticle.id;
        viewTrackedRef.current = false;
        scrollTrackingEnabledRef.current = false;

        if (mappedArticle.accessType === 'PREMIUM' && user) {
          checkAndSetAccess();
        } else if (mappedArticle.accessType === 'FREE') {
          setUserHasAccess(true);
          setShowPaywall(false);
        }
        
        // Load related data
        if (isActive) {
          await loadReviews();
          await Promise.allSettled([
            loadRelatedArticles(mappedArticle.id).catch(err => 
              console.log('Related articles load skipped:', err.message)
            ),
            loadTrendingArticles().catch(err => 
              console.log('Trending articles load skipped:', err.message)
            ),
            loadCategories().catch(err => 
              console.log('Categories load skipped:', err.message)
            )
          ]);
        }
        
        if (isActive) {
          console.log(' Article fully loaded in language:', languageToLoad);
        }
        
      } else {
        throw new Error('Invalid article data structure');
      }
    } catch (error: any) {
      if (isActive) {
        console.error(' Failed to load article:', error);
        notification.error({
          message: 'Error Loading Article',
          description: error.response?.data?.message || error.message || t`Failed to load article. Please try again.`,
          duration: 5,
        });
      }
    } finally {
      if (isActive) {
        fetchInProgressRef.current = false;
        setLoading(false);
      }
    }
  };
  
  loadArticleData();
  
  return () => {
    console.log('🧹 Cleaning up article fetch for slug:', slug);
    isActive = false;
    fetchInProgressRef.current = false;
  };
}, [slug]); // Only depend on slug


const ReadingSettingsModal = React.memo(({ 
  visible, 
  onClose, 
  fontSize, 
  setFontSize, 
  lineHeight, 
  setLineHeight, 
  fontFamily, 
  setFontFamily 
}: {
  visible: boolean;
  onClose: () => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  lineHeight: number;
  setLineHeight: (height: number) => void;
  fontFamily: string;
  setFontFamily: (family: string) => void;
}) => {
  return (
    <Modal
  title={t`Reading Settings`}
  open={visible}
  onCancel={onClose}
  destroyOnClose={false} // Prevents unmounting when closed
  forceRender // Keeps the modal in DOM even when not visible
  transitionName="" // Disable animations
  maskTransitionName=""
  footer={[
    <Button key="reset" onClick={() => {
      setFontSize(18);
      setLineHeight(1.8);
      setFontFamily('system-ui');
    }}>
      {t`Reset to Default`}
    </Button>,
    <Button key="close" type="primary" onClick={onClose}>
      {t`Apply Settings`}
    </Button>
  ]}
>
  <div className="space-y-6">
    {/* Font Size */}
    <div>
      <div className="flex items-center justify-between mb-4">
        <Title level={5} className="!mb-0">{t`Font Size`}</Title>
        <Text className="text-lg font-bold">{fontSize}px</Text>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          type="text" 
          size="small"
          onClick={() => setFontSize(Math.max(12, fontSize - 1))}
          disabled={fontSize <= 12}
        >
          A-
        </Button>
        <div className="flex-1">
          <div className="grid grid-cols-7 gap-2">
            {FONT_SIZES.map(size => (
              <Button
                key={size}
                type={fontSize === size ? 'primary' : 'default'}
                size="small"
                onClick={() => setFontSize(size)}
                className="flex items-center justify-center"
              >
                <span style={{ fontSize: `${size}px` }}>A</span>
              </Button>
            ))}
          </div>
        </div>
        <Button 
          type="text" 
          size="small"
          onClick={() => setFontSize(Math.min(24, fontSize + 1))}
          disabled={fontSize >= 24}
        >
          A+
        </Button>
      </div>
    </div>

    {/* Line Height */}
    <div>
      <div className="flex items-center justify-between mb-4">
        <Title level={5} className="!mb-0">{t`Line Height`}</Title>
        <Text className="text-lg font-bold">{lineHeight}</Text>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {LINE_HEIGHTS.map(height => (
          <Button
            key={height}
            type={lineHeight === height ? 'primary' : 'default'}
            size="small"
            onClick={() => setLineHeight(height)}
            className="flex items-center justify-center"
          >
            <div style={{ 
              width: '100%',
              height: '20px',
              background: 'repeating-linear-gradient(to bottom, #ccc, #ccc 1px, transparent 1px, transparent 10px)',
              backgroundSize: '100% 10px',
              transform: `scaleY(${height})`,
              transformOrigin: 'center'
            }} />
          </Button>
        ))}
      </div>
    </div>

    {/* Font Family */}
    <div>
      <Title level={5} className="!mb-4">{t`Font Family`}</Title>
      <div className="grid grid-cols-2 gap-2">
        {FONT_FAMILIES.map(font => (
          <Button
            key={font.value}
            type={fontFamily === font.value ? 'primary' : 'default'}
            onClick={() => setFontFamily(font.value)}
            className="text-left h-auto py-3"
            style={{ fontFamily: font.value }}
          >
            <div className="text-center">
              <div className="text-lg">{font.label}</div>
              <div className="text-xs opacity-75">Aa</div>
            </div>
          </Button>
        ))}
      </div>
    </div>

    {/* Preview */}
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
      <Text className="mb-2 text-sm text-gray-500 dark:text-gray-400">
        {t`Preview:`}
      </Text>
      <div 
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
          fontFamily: fontFamily,
        }}
        className="text-foreground"
      >
        {t`This is how your article will look with these settings. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`}
      </div>
    </div>
  </div>
</Modal>
  );
});


const LanguageSwitcher: React.FC<{
  availableLanguages: string[];
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  isLoading?: boolean;
  articleId?: string;
  onLanguagesUpdated?: (newLanguages: string[]) => void;
  checkAuth?: (action: 'like' | 'comment' | 'save' | 'premium' | 'share' | 'reply' | 'translate') => boolean;

}> = ({ 
  availableLanguages, 
  currentLanguage, 
  onLanguageChange, 
  isLoading = false,
  articleId,
  onLanguagesUpdated,
  checkAuth,

  
}) => {
  const [isManualTranslating, setIsManualTranslating] = useState(false);
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [translationProgress, setTranslationProgress] = useState<number>(0);
  const [translationStatus, setTranslationStatus] = useState<'idle' | 'progress' | 'complete'>('idle');
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useUser();

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      cleanupIntervals();
    };
  }, []);

  const cleanupIntervals = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Check if translation is already available when modal opens
  useEffect(() => {
    const checkIfAlreadyTranslated = async () => {
      if (isManualTranslating && selectedLanguage && articleId) {
        try {
          const alreadyExists = await checkTranslationExists(selectedLanguage);
          if (alreadyExists) {
            handleTranslationComplete();
          }
        } catch (error) {
          console.error('Error checking initial translation status:', error);
        }
      }
    };
    
    if (isManualTranslating && translationStatus === 'idle') {
      checkIfAlreadyTranslated();
    }
  }, [isManualTranslating, selectedLanguage, articleId, translationStatus]);

  // Handle translation completion when progress reaches 100%
  useEffect(() => {
    if (translationProgress === 100 && translationStatus === 'progress') {
      handleTranslationComplete();
    }
  }, [translationProgress, translationStatus]);

  const checkTranslationExists = async (targetLanguage: string): Promise<boolean> => {
  if (!articleId) return false;
  
  try {
    const languagesResponse = await articleApi.getArticleAvailableLanguages(articleId);
    
    // Handle different response formats
    let languages;
    if (languagesResponse?.data.languages) {
      languages = languagesResponse.data.languages;
    } else if (languagesResponse?.data?.languages) {
      languages = languagesResponse.data.languages;
    } else if (Array.isArray(languagesResponse)) {
      languages = languagesResponse;
    } else if (Array.isArray(languagesResponse?.data)) {
      languages = languagesResponse.data;
    }
    
    if (languages && Array.isArray(languages)) {
      return languages.some((lang: any) => 
        (lang.language || lang.code || lang) === targetLanguage
      );
    }
    
    return false;
  } catch (error) {
    console.error('Error checking translation existence:', error);
    return false;
  }
};

  const handleTranslationComplete = () => {
  setTranslationStatus('complete');
  cleanupIntervals();
  
  // Show completion for 2 seconds before closing and switching
  setTimeout(() => {
    if (selectedLanguage && articleId) {
      const userName = user?.name || t`Reader`;
      showTranslationSuccess(userName, selectedLanguage);
      
      // IMPORTANT: Instead of just changing language, refresh the article data
      onLanguageChange(selectedLanguage);
    }
    
    // Reset state
    setTimeout(() => {
      setIsManualTranslating(false);
      setSelectedLanguage(null);
      setTranslationProgress(0);
      setTranslationStatus('idle');
    }, 500);
  }, 2000);
};

  const showTranslationSuccess = (userName: string, language: string) => {
    notification.success({
      message: (
        <div className="flex items-center gap-2">
          <div className="text-lg">🎉</div>
          <div>
            <div className="font-bold">{t`Excellent news, ${userName}!`}</div>
            <div className="text-sm text-gray-600">{t`Your ${getLanguageName(language)} translation is ready`}</div>
          </div>
        </div>
      ),
      description: (
        <div className="space-y-2">
          <div className="text-sm">
            {t`You can now enjoy the outstanding knowledge of Inlirah in ${getLanguageName(language)} for best understanding.`}
          </div>
          <div className="text-xs text-gray-500">
            {t`Inlirah is committed to making knowledge accessible to everyone. Thank you for helping us expand our reach!`}
          </div>
          <div className="mt-2 text-xs text-blue-600">
            <strong>{t`Note:`}</strong> {t`Once translated by one person, the language becomes available for everyone!`}
          </div>
        </div>
      ),
      duration: 8,
      placement: 'topRight',
      className: 'translation-success-notification',
      style: {
        background: 'linear-gradient(135deg, #f6ffed 0%, #f0f5ff 100%)',
        border: '2px solid #52c41a',
        borderRadius: '8px',
      }
    });
  };

   const handleManualTranslate = async (targetLanguage: string) => {
  // Check authentication
  if (checkAuth && !checkAuth('translate')) {
    return; // Parent will show auth modal
  }
  
  if (!articleId) return;
  
  console.log(' Starting manual translation for language:', targetLanguage);
  
  // Check if translation already exists first
  try {
    const alreadyTranslated = await checkTranslationExists(targetLanguage);
    if (alreadyTranslated) {
      console.log('Translation already exists, switching language');
      notification.info({
        message: t`Translation Already Available`,
        description: t`The ${getLanguageName(targetLanguage)} translation already exists! Switching now...`,
        duration: 3,
      });
      onLanguageChange(targetLanguage);
      return;
    }
  } catch (error) {
    console.error('Error checking existing translation:', error);
  }
  
  // Start new translation process
  setSelectedLanguage(targetLanguage);
  setIsManualTranslating(true);
  setTranslationProgress(0);
  setTranslationStatus('progress');
  
  // Clear any existing intervals
  cleanupIntervals();
  
  try {
    console.log(' Calling translateArticle API...');
    
    // Make the API call
    const response = await articleApi.translateArticle(articleId, targetLanguage);
    
    console.log(' Translation API raw response:', response);
    
    // Check if response indicates success
    const isSuccess = 
      response?.success === true ||
      response?.status === 201 ||
      response?.status === 200 ||
      (response?.data && (
        typeof response.data === 'object' && 
        ('id' in response.data || 'articleId' in response.data)
      ));
    
    if (isSuccess) {
      console.log(' Translation request successful');
      
      // Show success notification
      notification.success({
        message: t`Translation Started!`,
        description: t`AI is now generating a ${getLanguageName(targetLanguage)} translation. This may take 1-2 minutes.`,
        duration: 4,
      });
      
      // Start progress simulation
      startProgressSimulation();
      
      // Start polling for completion
      startPollingForTranslation(targetLanguage);
      
    } else {
      // Log technical error to console
      console.error(' Translation API returned non-success (Technical):', response?.message || response?.error);
      
      // Throw user-friendly error from FRONTEND
      throw new Error(t`Translation service is temporarily busy. Please try again in a moment.`);
    }
    
  } catch (error: any) {
    console.error(' Translation request failed (Technical):', {
      message: error.message,
      stack: error.stack
    });
    
    // Reset state
    setIsManualTranslating(false);
    setSelectedLanguage(null);
    setTranslationProgress(0);
    setTranslationStatus('idle');
    cleanupIntervals();
    
    // Show user-friendly error message
    if (error.message?.includes(t`already exists`) || error.message?.includes(t`already translated`)) {
      notification.info({
        message: t`Translation Already Exists`,
        description: t`This translation already exists! Switching to ${getLanguageName(targetLanguage)}...`,
        duration: 3,
      });
      onLanguageChange(targetLanguage);
    } else {
      // Show frontend user-friendly message
      notification.error({
        message: t`Translation Unavailable`,
        description: t`We couldn't start the translation right now. Please try again in a few moments.`,
        duration: 4,
      });
    }
  }
};

// Helper function for progress simulation
const startProgressSimulation = () => {
  let simulatedProgress = 0;
  progressIntervalRef.current = setInterval(() => {
    simulatedProgress += Math.random() * 8 + 3; // 3-11% increments
    if (simulatedProgress >= 95) {
      setTranslationProgress(95);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    } else {
      setTranslationProgress(Math.floor(simulatedProgress));
    }
  }, 1000);
};

// Helper function for polling
const startPollingForTranslation = (targetLanguage: string) => {
    let checkCount = 0;
    const maxChecks = 40; // Check for up to 2 minutes (40 * 3s = 120s)
    
    const poll = async () => {
      if (checkCount >= maxChecks) {
        console.log(' Polling timeout reached');
        notification.info({
          message: t`Translation Taking Longer`,
          description: t`Translation is still processing. It will appear automatically when ready.`,
          duration: 5,
        });
        return;
      }
      
      checkCount++;
      console.log(` Polling attempt ${checkCount}/${maxChecks} for ${targetLanguage}`);
      
      try {
        const alreadyTranslated = await checkTranslationExists(targetLanguage);
        if (alreadyTranslated) {
          console.log('✅ Translation found during polling!');
          setTranslationProgress(100);
          
          // Show the SAME success message as desktop
          setTimeout(() => {
            const userName = user?.name || t`Reader`;
            showTranslationSuccess(userName, targetLanguage);
            
            // CRITICAL: Update the available languages list
            if (onLanguagesUpdated) {
              const newLanguages = [...availableLanguages, targetLanguage];
              onLanguagesUpdated(newLanguages);
            }
            
            // Switch to the new language automatically
            onLanguageChange(targetLanguage);
            
            // Reset state
            setIsManualTranslating(false);
            setSelectedLanguage(null);
            setTranslationProgress(0);
            setTranslationStatus('idle');
            cleanupIntervals();
          }, 2000);
          
          return;
        }
        
        // Continue polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        pollingIntervalRef.current = setTimeout(poll, 3000);
        
      } catch (error) {
        console.error('Error polling translation:', error);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        pollingIntervalRef.current = setTimeout(poll, 5000);
      }
    };
    
    // Start polling
    poll();
  };



  // Language items for existing translations
  const languageItems = availableLanguages.map(lang => ({
    key: lang,
    label: (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getLanguageFlag(lang)}</span>
          <span>{getLanguageName(lang)}</span>
        </div>
        {lang === currentLanguage && (
          <span className="text-green-500 text-xs">✓</span>
        )}
      </div>
    ),
    onClick: () => onLanguageChange(lang),
  }));

  // Suggested languages for translation
  const suggestedLanguages = ['fr', 'es', 'de', 'pt', 'ar', 'hi', 'zh', 'ja', 'ru']
    .filter(lang => !availableLanguages.includes(lang))
    .map(lang => ({
      key: `translate-${lang}`,
      label: (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getLanguageFlag(lang)}</span>
            <span>{t`Translate to`}{getLanguageName(lang)}</span>
          </div>
          {isManualTranslating && selectedLanguage === lang && (
            <Spin size="small" />
          )}
        </div>
      ),
      onClick: () => handleManualTranslate(lang),
      disabled: isManualTranslating,
    }));

  // Create menu items with proper structure
  const menuItems = [
    // Existing languages
    ...languageItems,
    
    // Divider (if there are suggested languages)
    ...(suggestedLanguages.length > 0 ? [
      {
        type: 'divider' as const,
        key: 'divider-1',
      },
      // Suggested languages for translation
      ...suggestedLanguages,
    ] : []),
    
    // Divider for "Other Languages" section
    {
      type: 'divider' as const,
      key: 'divider-other',
    },
    
    // Request other languages option
    // {
    //   key: 'other-languages',
    //   label: (
    //     <div className="flex items-center gap-2">
    //       <span className="text-lg">🌐</span>
    //       <span>Request another language</span>
    //     </div>
    //   ),
    //   onClick: () => setShowTranslationModal(true),
    // }
  ];

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomRight"
        overlayClassName="w-56"
      
      >
        <Button
            type="text"
            icon={<GlobalOutlined />}
            size="large"
            className="text-muted-foreground hover:text-primary text-foreground hover:text-primary flex items-center gap-2"
            loading={isTranslating || languageSwitching}
            disabled={isTranslating || languageSwitching}
          >
            <span className="hidden sm:inline">
              {getLanguageFlag(currentLanguage)} {getLanguageName(currentLanguage)}
            </span>
            <span className="sm:hidden">
              {getLanguageFlag(currentLanguage)}
            </span>
            {(isTranslating || languageSwitching) && (
              <span className="animate-pulse text-xs text-blue-500">{t`Loading...`}</span>
            )}
          </Button>
      </Dropdown>



    {/* Translation Request Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <TranslationOutlined className="text-blue-600 dark:text-blue-300" />
            </div>
            <span>{t`Request Translation`}</span>
          </div>
        }
        open={showTranslationModal}
        onCancel={() => setShowTranslationModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowTranslationModal(false)}>
            {t`Cancel`}
          </Button>,
          <Button 
            key="close" 
            type="primary" 
            onClick={() => setShowTranslationModal(false)}
          >
            {t`Got it`}
          </Button>
        ]}
      >
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                <span className="text-2xl">🌍</span>
              </div>
              <div>
                <Title level={5} className="!mb-2">{t`Make Knowledge Accessible`}</Title>
                <Text type="secondary">
                  {t`Request translations to help make Inlirah content available in more languages.`}
                </Text>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 dark:text-green-300 text-sm">1</span>
              </div>
              <div>
                <Text strong>{t`Select a language`}</Text>
                <Text type="secondary" className="text-sm">
                  {t`Choose from the dropdown menu above to request translation`}
                </Text>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 dark:text-blue-300 text-sm">2</span>
              </div>
              <div>
                <Text strong>{t`AI-powered translation`}</Text>
                <Text type="secondary" className="text-sm">
                  {t`Our advanced AI translates with quality review (1-3 minutes)`}
                </Text>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 dark:text-purple-300 text-sm">3</span>
              </div>
              <div>
                <Text strong>{t`Quality assurance`}</Text>
                <Text type="secondary" className="text-sm">
                  {t`System verifies it's a real translation, not a mock`}
                </Text>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 dark:text-orange-300 text-sm">4</span>
              </div>
              <div>
                <Text strong>{t`Available for everyone`}</Text>
                <Text type="secondary" className="text-sm">
                  {t`Once translated, the language is automatically added for all users`}
                </Text>
              </div>
            </div>
          </div>
          
          <Alert
            type="info"
            showIcon
            message={t`Community Contribution`}
            description={
              <div className="space-y-1">
                <div>{t`Your translation request helps the entire community!`}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {t`Inlirah is dedicated to outstanding knowledge accessibility for all.`}
                </div>
              </div>
            }
          />
        </div>
      </Modal>

      {/* Translation Progress Modal - Professionally Corrected */}
      <Modal
  title={
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
        <TranslationOutlined className="text-white" />
      </div>
      <span>
        {translationStatus === 'complete' ? t`Translation Complete!` : t`Generating Translation`}
      </span>
    </div>
  }
  open={isManualTranslating}
  closable={translationStatus === 'complete'}
  onCancel={() => {
    if (translationStatus === 'complete') {
      setIsManualTranslating(false);
      setSelectedLanguage(null);
      setTranslationProgress(0);
      setTranslationStatus('idle');
      cleanupIntervals();
    }
  }}
  footer={translationStatus === 'complete' ? [
    <Button 
      key="close" 
      type="primary" 
      onClick={() => {
        setIsManualTranslating(false);
        setSelectedLanguage(null);
        setTranslationProgress(0);
        setTranslationStatus('idle');
        cleanupIntervals();
      }}
    >
      {t`Close`}
    </Button>
  ] : null}
  width={500}
>
  <div className="space-y-6">
    {translationStatus === 'complete' ? (
      // Success state
      <div className="text-center animate-fadeIn">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
          <CheckOutlined className="text-white text-3xl" />
        </div>
        <Title level={3} className="!mb-2 text-green-600">
          {t`Translation Complete!`}
        </Title>
        <Paragraph className="text-lg mb-4">
          {t`Your article is now available in ${getLanguageName(selectedLanguage || '')}`}
        </Paragraph>
        <div className="flex items-center justify-center gap-2 text-lg">
          <Spin size="small" />
          <Text type="secondary">
            {t`Switching to ${getLanguageName(selectedLanguage || '')}...`}
          </Text>
        </div>
      </div>
    ) : (
      // Progress state
      <>
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <div className="relative">
                <Spin size="large" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-300">
                    {translationProgress}%
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
              <span className="text-white text-lg">🚀</span>
            </div>
          </div>
          
          <div className="mb-2">
            <Title level={3} className="!mb-1">
              {t`Translating to ${getLanguageName(selectedLanguage || '')}`}
            </Title>
            <Text type="secondary">
              {translationProgress < 30 ? t`Analyzing content structure...` :
               translationProgress < 60 ? t`Processing translation with AI...` :
               translationProgress < 85 ? t`Reviewing translation quality...` :
               t`Finalizing translation...`}
            </Text>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Text>{t`Progress`}</Text>
            <Text strong>{translationProgress}%</Text>
          </div>
          <Progress 
            percent={translationProgress}
            status="active"
            strokeColor={{
              '0%': '#1890ff',
              '100%': '#722ed1',
            }}
            strokeWidth={6}
          />
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg border transition-all ${translationProgress > 20 ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${translationProgress > 20 ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {translationProgress > 20 ? '✓' : '1'}
                </div>
                <Text strong className={translationProgress > 20 ? 'text-green-600' : ''}>
                  {t`Content Analysis`}
                </Text>
              </div>
              <Text type="secondary" className="text-xs">
                {t`Parsing original structure`}
              </Text>
            </div>
            
            <div className={`p-3 rounded-lg border transition-all ${translationProgress > 50 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${translationProgress > 50 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {translationProgress > 50 ? '✓' : '2'}
                </div>
                <Text strong className={translationProgress > 50 ? 'text-blue-600' : ''}>
                  {t`AI Translation`}
                </Text>
              </div>
              <Text type="secondary" className="text-xs">
                {t`Advanced LLM processing`}
              </Text>
            </div>
            
            <div className={`p-3 rounded-lg border transition-all ${translationProgress > 80 ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${translationProgress > 80 ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {translationProgress > 80 ? '✓' : '3'}
                </div>
                <Text strong className={translationProgress > 80 ? 'text-purple-600' : ''}>
                  {t`Quality Review`}
                </Text>
              </div>
              <Text type="secondary" className="text-xs">
                {t`Ensuring accuracy`}
              </Text>
            </div>
            
            <div className={`p-3 rounded-lg border transition-all ${translationProgress >= 95 ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${translationProgress >= 95 ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {translationProgress >= 95 ? '✓' : '4'}
                </div>
                <Text strong className={translationProgress >= 95 ? 'text-orange-600' : ''}>
                  {t`Finalizing`}
                </Text>
              </div>
              <Text type="secondary" className="text-xs">
                {t`Making available`}
              </Text>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">⏳</span>
            </div>
            <div>
              <Text strong className="block mb-1">
                {translationProgress < 50 ? t`Starting translation process...` :
                 translationProgress < 85 ? t`Translation in progress...` :
                 t`Almost done! Finalizing...`}
              </Text>
              <Text type="secondary" className="text-sm">
                {t`Your request helps make this outstanding Inlirah knowledge accessible to more people in their preferred language. Once complete, ${getLanguageName(selectedLanguage || '')} will be automatically available for everyone!`}
              </Text>
            </div>
          </div>
        </div>
      </>
    )}
  </div>
</Modal>
    </>
  );
};
  

const loadReviews = async () => {
  if (!article?.id) return;
  
  setReviewsLoading(true);
  try {
    const response = await apiClient.get(`/articles/${article.id}/reviews`);
    if (response.data) {
      setReviews(response.data.reviews || []);
      
      const stats = response.data.stats || {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
      
      setReviewStats(stats);
      
      // Update article with latest review stats
      setArticle(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          reviewStats: stats
        };
      });
    }
  } catch (error) {
    console.error('Failed to load reviews:', error);
  } finally {
    setReviewsLoading(false);
  }
};



// Load related articles with engagement score
const loadRelatedArticles = async (articleId: string, forceRefresh = false) => {
  // Don't reload if we already have articles AND not forcing refresh
  if (!forceRefresh && relatedArticles.length > 0 && !relatedLoading) {
    console.log(' Related articles already loaded, skipping');
    return;
  }
  
  // Clear cache if forcing refresh
  if (forceRefresh) {
    console.log(' Force refreshing related articles');
    setRelatedArticles([]);
  }
  
  try {
    setRelatedLoading(true);
    
    // ALWAYS use the current UI language from i18n
    const currentLocale = i18n.locale;
    const languageCode = currentLocale.split('-')[0];
    
    console.log(' Loading related articles in language:', {
      currentLocale,
      languageCode,
      articleId,
      forceRefresh,
      // Log the current state for debugging
      currentArticleLanguage: article?.language,
      currentStateLanguage: currentLanguage
    });
    
    // Use the correct endpoint that supports both ID and slug
    const response = await apiClient.get(`/articles/${articleId}/related`, {
      params: { 
        limit: 3,
        language: languageCode // Add language parameter
      }
    });
    
    console.log(' Related Articles Response:', {
      identifier: articleId,
      language: languageCode,
      articles: response.data,
      count: response.data?.length,
      responseStatus: response.status
    });
    
    if (response.data && Array.isArray(response.data)) {
      // Add engagement score to each article
      const articlesWithScore: RelatedArticle[] = response.data.map((article: any) => ({
        ...article,
        // Map the data to match your Article interface
        id: article.id,
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt || article.metaDescription || '',
        coverImage: article.coverImage || article.featuredImage || '',
        readingTime: article.readingTime || 1,
        viewCount: article._count?.views || article.viewCount || 0,
        likeCount: article._count?.likes || article.likeCount || 0,
        commentCount: article._count?.comments || article.commentCount || 0,
        isFeatured: article.isFeatured || false,
        isTrending: article.isTrending || false,
        isPremium: article.accessType === 'PREMIUM',
        accessType: article.accessType || 'FREE',
        publishedAt: article.publishedAt || article.createdAt,
        author: {
          id: article.author?.id || '',
          name: article.author?.name || 'Anonymous',
          picture: article.author?.picture,
          username: article.author?.username,
          isVerified: article.author?.isVerified || false
        },
        category: article.category ? {
          id: article.category.id,
          name: article.category.name,
          slug: article.category.slug,
          color: article.category.color
        } : undefined,
        availableLanguages: article.availableLanguages || ['en'],
        language: article.language || 'en',
        engagementScore: calculateEngagementScore({
          viewCount: article._count?.views || 0,
          likeCount: article._count?.likes || 0,
          commentCount: article._count?.comments || 0
        })
      }));
      
      setRelatedArticles(articlesWithScore);
    } else {
      console.warn('No related articles data in response');
      setRelatedArticles([]); // Set empty array to avoid showing stale data
    }
  } catch (error: any) {
    console.error('Failed to load related articles:', error);
    
    // Show user-friendly error message but don't crash
    if (error.response?.status !== 404) {
      notification.warning({
        message: t`Could not load related articles`,
        description: t`Showing recent articles instead`,
        duration: 3,
      });
    }
    
    // Fallback: Load recent articles WITH language parameter
    try {
      const currentLocale = i18n.locale;
      const languageCode = currentLocale.split('-')[0];
      
      const fallbackResponse = await articleApi.getArticles({ 
        limit: 3,
        language: languageCode
      });
      
      if (fallbackResponse?.data?.articles) {
        const articlesWithScore: RelatedArticle[] = fallbackResponse.data.articles.map((article: Article) => ({
          ...article,
          engagementScore: calculateEngagementScore(article)
        }));
        setRelatedArticles(articlesWithScore);
      } else {
        setRelatedArticles([]);
      }
    } catch (fallbackError) {
      console.error('Failed to load fallback articles:', fallbackError);
      setRelatedArticles([]);
    }
  } finally {
    setRelatedLoading(false);
  }
};

// Engagement score calculation

const calculateEngagementScore = (article: any): number => {
  const views = article.viewCount || article._count?.views || 0;
  const likes = article.likeCount || article._count?.likes || 0;
  const comments = article.commentCount || article._count?.comments || 0;
  const shares = article.shareCount || 0;
  
  // Weighted engagement calculation with time decay
  const baseScore = (views * 0.1) + (likes * 0.3) + (comments * 0.4) + (shares * 0.2);
  
  // Normalize score to 0-100
  const maxPossibleScore = 1000; // Adjust based on your typical numbers
  const normalizedScore = Math.min((baseScore / maxPossibleScore) * 100, 100);
  
  return Math.round(normalizedScore * 10) / 10; // Round to 1 decimal
};



  // Load trending articles
  const loadTrendingArticles = async () => {
    try {
      setTrendingLoading(true);
      const response = await articleApi.getTrendingArticles({ limit: 6 });
      if (response?.data?.data) {
        setTrendingArticles(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load trending articles:', error);
    } finally {
      setTrendingLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
  try {
    // Use the correct endpoint
    const response = await apiClient.get('/articles/categories/all');
    if (response?.data) {
      setCategories(response.data.slice(0, 8));
    }
  } catch (error) {
    console.error('Failed to load categories:', error);
   
  }
};

  // View tracking effect
  useEffect(() => {
    if (!article?.id || viewTrackedRef.current) return;
    
    let timer: NodeJS.Timeout;
    
    timer = setTimeout(() => {
      if (isMountedRef.current && !viewTrackedRef.current) {
        trackViewWithConditions(article.id, article.author?.id);
      }
    }, 5000);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [article?.id, article?.author?.id]);

  // Scroll-based tracking
  useEffect(() => {
    if (!article?.id || viewTrackedRef.current || scrollTrackingEnabledRef.current) return;
    
    const handleScrollForTracking = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      if (scrollPercentage > 30 && !viewTrackedRef.current) {
        scrollTrackingEnabledRef.current = true;
        trackViewWithConditions(article.id, article.author?.id);
        window.removeEventListener('scroll', handleScrollForTracking);
      }
    };
    
    window.addEventListener('scroll', handleScrollForTracking);
    
    return () => {
      window.removeEventListener('scroll', handleScrollForTracking);
    };
  }, [article?.id, article?.author?.id]);

  // Reading progress tracking
  useEffect(() => {
    const handleScroll = () => {
      if (!showReadingProgress || !isMountedRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setReadingProgress(Math.min(scrollPercentage, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showReadingProgress]);

  // Handle like (simpler version with type assertions)
const handleLike = async () => {
  if (article?.accessType === 'PREMIUM' && !userHasAccess) {
    setShowPaywall(true);
    return;
  }

  if (!checkAuth('like')) return;
  if (!article || !article.id) return;
  
  const previousState = liked;
  const previousCount = article.likeCount || 0;
  
  // Optimistic update
  setLiked(!liked);
  setArticle({
    ...article,
    likeCount: liked ? (article.likeCount || 0) - 1 : (article.likeCount || 0) + 1,
    isLiked: !liked
  });
  
  try {
    const response = await articleApi.likeArticle(article.id) as any; // Type assertion
    
    let success = false;
    if (typeof response === 'object') {
      if ('success' in response) {
        success = response.success;
      } else if ('data' in response && response.data && typeof response.data === 'object' && 'success' in response.data) {
        success = response.data.success;
      } else {
        success = true; // Assume success if response exists
      }
    }
    
    if (success) {
      notification.success({
        message: liked ? t`Article unliked` : t`Article liked!`,
        duration: 2,
      });
    } else {
      throw new Error(t`Like operation failed`);
    }
  } catch (error: any) {
    // Revert on error
    setLiked(previousState);
    setArticle({
      ...article,
      likeCount: previousCount,
      isLiked: previousState
    });
    
    notification.error({
      message: 'Error',
      description: error.response?.data?.message || error.message || t`Failed to update like status.`,
      duration: 3,
    });
  }
};

// Handle save (simpler version with type assertions)
const handleSave = async () => {
  if (!article || !article.id) return;
  
  const previousState = saved;
  
  // Optimistic update
  setSaved(!saved);
  setArticle({
    ...article,
    isSaved: !saved
  });
  
  try {
    const response = await articleApi.saveArticle(article.id) as any; // Type assertion
    
    let success = false;
    if (typeof response === 'object') {
      if ('success' in response) {
        success = response.success;
      } else if ('data' in response && response.data && typeof response.data === 'object' && 'success' in response.data) {
        success = response.data.success;
      } else {
        success = true; // Assume success if response exists
      }
    }
    
    if (success) {
      notification.success({
        message: saved ? t`Removed from saved articles` : t`Article saved!`,
        duration: 2,
      });
    } else {
      throw new Error('Save operation failed');
    }
  } catch (error: any) {
    // Revert on error
    setSaved(previousState);
    setArticle({
      ...article,
      isSaved: previousState
    });
    
    notification.error({
      message: 'Error',
      description: error.response?.data?.message || error.message || t`Failed to save article.`,
      duration: 3,
    });
  }
};

  // Handle share
  const handleShare = () => {
    if (!article) return;
    
    const shareUrl = window.location.href;
    const shareTitle = article.title;
    const shareText = article.excerpt || t`Check out this article!`;
    
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      })
      .then(() => {
        notification.success({ message: t`Article shared successfully!`, duration: 2 });
        if (article.id) {
          articleApi.shareArticle(article.id, 'native').catch(console.error);
        }
      })
      .catch(console.error);
    } else {
      navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`)
        .then(() => {
          notification.success({ message: t`Link copied to clipboard!`, duration: 2 });
        })
        .catch(() => {
          const textArea = document.createElement('textarea');
          textArea.value = `${shareTitle}\n${shareText}\n${shareUrl}`;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          notification.success({ message: t`Link copied to clipboard!`, duration: 2 });
        });
    }
  }; 

  

  // Enhanced content rendering with proper image and link handling
  const shouldShowPaywall = article?.accessType === 'PREMIUM' && !userHasAccess;
 const renderContent = () => {
  // Show loading state if switching languages
  if (languageSwitching) {
    return (
      <div className="text-center py-12">
        <Spin size="large" />
        <Paragraph className="mt-4 text-muted-foreground">
          {t`Loading ${getLanguageName(currentLanguage)} content...`}
        </Paragraph>
      </div>
    );
  }
  
  if (!article?.content) {
    return (
      <div className="article-content">
        <Paragraph className="whitespace-pre-wrap leading-relaxed text-foreground">
          {article?.plainText || renderPremiumContentPlaceholder()}
        </Paragraph>
      </div>
    );
  }

  // Use a unique key that forces re-render
  const uniqueKey = `content-${article.id}-${currentLanguage}-${contentKey || 'default'}`;
  console.log(' Rendering content with key:', uniqueKey);
  
  // Handle string content
  if (typeof article.content === 'string') {
    if (article.content.includes('<') && article.content.includes('>')) {
      // HTML content
      return (
        <div 
          key={uniqueKey}
          className="article-content animate-fadeIn"
          dangerouslySetInnerHTML={{ __html: article.content }} 
        />
      );
    } else {
      // Plain text
      return (
        <div key={uniqueKey} className="article-content animate-fadeIn">
          {article.content.split('\n').map((paragraph, index) => (
            <Paragraph key={index} className="text-foreground leading-relaxed mb-6">
              {paragraph}
            </Paragraph>
          ))}
        </div>
      );
    }
  }

  // Handle TipTap JSON content
  if (typeof article.content === 'object' && article.content.type === 'doc') {
    try {
      return (
        <div key={uniqueKey} className="article-content space-y-6 animate-fadeIn">
          {renderTipTapContent(article.content)}
        </div>
      );
    } catch (error) {
      console.error('Error rendering TipTap content:', error);
      return (
        <div key={uniqueKey} className="article-content">
          <Paragraph className="whitespace-pre-wrap leading-relaxed text-foreground">
            {article.plainText || article.excerpt || t`Content could not be rendered.`}
          </Paragraph>
        </div>
      );
    }
  }

  // Fallback
  return (
    <div key={uniqueKey} className="article-content">
      <Paragraph className="whitespace-pre-wrap leading-relaxed text-foreground">
        {article.plainText || article.excerpt || t`No content available.`}
      </Paragraph>
    </div>
  );
};

  // Enhanced TipTap content renderer
  const renderTipTapContent = (content: any) => {
    if (!content || !content.content) return null;

    const renderNode = (node: any, index: number, depth: number = 0): React.ReactNode => {
      if (!node) return null;

      switch (node.type) {
        case 'paragraph':
          return (
            <Paragraph key={index} className={`text-foreground leading-relaxed mb-6 ${depth > 0 ? 'ml-4' : ''}`}>
              {node.content?.map((textNode: any, textIndex: number) => {
                if (textNode.type === 'text') {
                  let textElement = textNode.text;
                  if (textNode.marks) {
                    textNode.marks.forEach((mark: any) => {
                      if (mark.type === 'bold') {
                        textElement = <strong key={textIndex} className="font-bold">{textElement}</strong>;
                      } else if (mark.type === 'italic') {
                        textElement = <em key={textIndex} className="italic">{textElement}</em>;
                      } else if (mark.type === 'underline') {
                        textElement = <u key={textIndex} className="underline">{textElement}</u>;
                      } else if (mark.type === 'link') {
                        textElement = (
                          <a 
                            key={textIndex} 
                            href={mark.attrs.href} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="article-link"
                          >
                            {textElement}
                          </a>
                        );
                      } else if (mark.type === 'code') {
                        textElement = <code key={textIndex} className="article-code">{textElement}</code>;
                      }
                    });
                  }
                  return textElement;
                }
                if (textNode.type === 'hardBreak') {
                  return <br key={textIndex} />;
                }
                return renderNode(textNode, textIndex, depth + 1);
              })}
            </Paragraph>
          );

        case 'heading':
          const level = node.attrs?.level || 2;
          const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
          const headingClasses = [
            'article-heading',
            'font-bold',
            level === 1 ? 'text-4xl mt-8 mb-6' :
            level === 2 ? 'text-3xl mt-8 mb-6' :
            level === 3 ? 'text-2xl mt-6 mb-4' :
            level === 4 ? 'text-xl mt-6 mb-4' :
            'text-lg mt-4 mb-3'
          ].join(' ');

          return (
            <HeadingTag key={index} className={headingClasses}>
              {node.content?.map((textNode: any, textIndex: number) => {
                if (textNode.type === 'text') {
                  let textElement = textNode.text;
                  if (textNode.marks) {
                    textNode.marks.forEach((mark: any) => {
                      if (mark.type === 'link') {
                        textElement = (
                          <a 
                            key={textIndex} 
                            href={mark.attrs.href} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="article-link"
                          >
                            {textElement}
                          </a>
                        );
                      }
                    });
                  }
                  return textElement;
                }
                return null;
              })}
            </HeadingTag>
          );

        case 'image':
          const imageSrc = node.attrs?.src;
          
          const getFullImageUrl = (url: string): string => {
            if (!url) return '';
            
            // Already a full URL
            if (url.startsWith('http://') || url.startsWith('https://')) {
              return url;
            }
            
            // Data URL (base64)
            if (url.startsWith('data:')) {
              return url;
            }
            
            // Always use localhost:3000 for development
            const baseUrl = 'http://localhost:3000';
            
            // Clean up the URL
            let cleanUrl = url;
            if (cleanUrl.startsWith('/')) {
              cleanUrl = cleanUrl.substring(1);
            }
            
            // For uploads, use the correct endpoint
            if (cleanUrl.includes('uploads/') || cleanUrl.includes('articles/')) {
              return `${baseUrl}/${cleanUrl}`;
            }
            
            // Default: prepend the base URL
            return `${baseUrl}/uploads/articles/${cleanUrl}`;
          };

          return (
            <div key={index} className="my-8 text-center">
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                {/* Use a wrapper div for fallback instead of Image component's fallback prop */}
                <div className="relative w-full h-auto max-h-[600px]">
                  <Image
                    src={getFullImageUrl(imageSrc)}
                    alt={node.attrs?.alt || article?.title}
                    className="w-full h-auto max-h-[600px] object-contain"
                    // Remove fallback prop since it expects string URL
                    placeholder={
                      <div className="w-full h-64 flex items-center justify-center">
                        <Spin size="large" />
                      </div>
                    }
                    preview={{
                      src: getFullImageUrl(imageSrc),
                      visible: false,
                    }}
                    onError={(e) => {
                      console.warn('Image failed to load, showing fallback');
                      // Hide the broken image and show fallback via CSS
                      const imgElement = e.target as HTMLImageElement;
                      imgElement.style.display = 'none';
                      
                      // Create fallback element
                      const parent = imgElement.parentElement;
                      if (parent) {
                        const fallbackDiv = document.createElement('div');
                        fallbackDiv.className = 'w-full h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800';
                        fallbackDiv.innerHTML = `
                          <div class="text-center">
                            <PictureOutlined class="text-4xl text-gray-300 mb-2" />
                            <p class="text-gray-500 text-sm">Image failed to load</p>
                          </div>
                        `;
                        parent.appendChild(fallbackDiv);
                      }
                    }}
                  />
                </div>
              </div>
              {(node.attrs?.title || node.attrs?.alt) && (
                <Text type="secondary" className="block mt-3 text-sm italic text-center">
                  {node.attrs.title || node.attrs.alt}
                </Text>
              )}
            </div>
          );

        case 'bulletList':
        case 'orderedList':
          const ListTag = node.type === 'bulletList' ? 'ul' : 'ol';
          const listClass = node.type === 'bulletList' ? 'list-disc' : 'list-decimal';
          
          return (
            <ListTag 
              key={index} 
              className={`${listClass} ml-8 my-6 space-y-2`}
            >
              {node.content?.map((item: any, itemIndex: number) =>
                renderNode(item, itemIndex, depth + 1)
              )}
            </ListTag>
          );

        case 'listItem':
          return (
            <li key={index} className="mb-2">
              {node.content?.map((item: any, itemIndex: number) =>
                renderNode(item, itemIndex, depth + 1)
              )}
            </li>
          );

        case 'blockquote':
          return (
            <blockquote 
              key={index} 
              className="border-l-4 border-primary pl-6 my-8 py-4 bg-gradient-to-r from-primary/5 to-transparent"
            >
              {node.content?.map((item: any, itemIndex: number) =>
                renderNode(item, itemIndex, depth + 1)
              )}
            </blockquote>
          );

        case 'codeBlock':
          return (
            <pre key={index} className="article-pre my-6">
              <code className="article-code-block">
                {node.content?.map((textNode: any) => textNode.text).join('')}
              </code>
            </pre>
          );

        case 'horizontalRule':
          return <Divider key={index} className="my-8" />;

        default:
        // Recursively render nested content
        if (node.content && Array.isArray(node.content)) {
          return node.content.map((child: any, childIndex: number) =>
            renderNode(child, childIndex, depth + 1) 
          );
        }
        return null;
      }
    };

    return (
      <div ref={contentContainerRef} className="article-content space-y-6">
        {content.content.map((node: any, index: number) => renderNode(node, index))}
      </div>
    );
  };


// Render related article card - FIXED VERSION
const renderArticleCard = useCallback((item: RelatedArticle) => {
  
  // Make sure we have valid data for engagement score calculation
  const calculateEngagementScore = (article: any): number => {
    const views = article.viewCount || article._count?.views || 0;
    const likes = article.likeCount || article._count?.likes || 0;
    const comments = article.commentCount || article._count?.comments || 0;
    
    // Simple calculation that always gives a reasonable score
    let score = 0;
    
    if (views > 0) score += Math.min(views * 0.5, 30); // Max 30% from views
    if (likes > 0) score += Math.min(likes * 3, 40);   // Max 40% from likes
    if (comments > 0) score += Math.min(comments * 10, 30); // Max 30% from comments
    
    // Ensure it's between 10 and 100
    score = Math.max(10, Math.min(score, 100));
    
    return Math.round(score);
  };
  
  // Get review stats for this specific article
  const articleReviewStats = item.reviewStats || {
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
  
  const engagementScore = item.engagementScore || calculateEngagementScore(item);
  const engagementLabel = getEngagementLabel(engagementScore);
  const engagementPercentage = Math.min(Math.round(engagementScore), 100);
  
  // Format view count
  const formatViewCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };
  
  // Get stats from item, with fallbacks
  const viewCount = item.viewCount || 0;
  const likeCount = item.likeCount || 0;

  return (
    <Card
      key={item.id}
      hoverable
      className="h-full border hover:shadow-xl transition-all duration-300 group bg-white dark:bg-gray-800"
      onClick={() => {
        window.location.href = `/dashboard/article/${item.slug}`;
      }}
      styles={{
        body: { padding: 0 }
      }}
    >
      <div className="space-y-3 p-4">
        {/* Cover Image */}
        <div className="h-48 rounded-lg overflow-hidden relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-900">
          {item.coverImage ? (
            <div className="relative w-full h-full">
              <Image
                src={item.coverImage}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                preview={false}
                onError={(e) => {
                  console.warn('Related article image failed to load');
                  const imgElement = e.target as HTMLImageElement;
                  imgElement.style.display = 'none';
                  
                  // Create fallback element
                  const parent = imgElement.parentElement;
                  if (parent) {
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-900';
                    fallbackDiv.innerHTML = `
                      <div class="text-center">
                        <ReadOutlined class="text-4xl text-gray-300 dark:text-gray-600" />
                        <p class="text-gray-500 text-sm mt-2">Image not available</p>
                      </div>
                    `;
                    parent.appendChild(fallbackDiv);
                  }
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
              <ReadOutlined className="text-4xl text-primary/40" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {item.isPremium && (
              <Tag color="purple" icon={<CrownOutlined />} className="m-0 px-2 py-1 text-xs">
                {t`Premium`}
              </Tag>
            )}
            {item.isFeatured && (
              <Tag color="gold" icon={<StarOutlined />} className="m-0 px-2 py-1 text-xs">
                {t`Featured`}
              </Tag>
            )}
          </div>
          
          {/* Engagement Badge */}
          {engagementScore > 40 && (
            <div className="absolute top-2 right-2">
              <Tag 
                color={engagementLabel.color} 
                className="m-0 px-2 py-1 text-xs font-semibold"
                style={{ 
                  backgroundColor: engagementLabel.color,
                  color: 'white',
                  border: 'none'
                }}
              >
                {engagementLabel.label}
              </Tag>
            </div>
          )}
          
          {/* Category Badge */}
          {item.category && (
            <div className="absolute bottom-2 left-2">
              <Tag 
                color={item.category.color || 'blue'} 
                icon={<FolderOutlined />}
                className="m-0 px-2 py-1 text-xs backdrop-blur-sm bg-white/80 dark:bg-gray-800/80"
              >
                {item.category.name}
              </Tag>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="space-y-3">
          {/* Title */}
          <Title 
            level={5} 
            className="!mb-0 !mt-0 line-clamp-2 text-foreground group-hover:text-primary transition-colors min-h-[3.5rem]"
            style={{ fontSize: '1rem', lineHeight: 1.4 }}
          >
            {item.title}
          </Title>
          
          {/* Excerpt */}
          {item.excerpt && (
            <Paragraph className="text-muted-foreground text-sm line-clamp-2 min-h-[2.5rem]">
              {item.excerpt}
            </Paragraph>
          )}
          
          {/* Author & Metadata */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Avatar 
                size="small" 
                src={item.author?.picture}
                icon={!item.author?.picture && <UserOutlined />}
                className="border border-gray-200 dark:border-gray-600"
              >
                {item.author?.name?.charAt(0)}
              </Avatar>
              <div className="max-w-[120px]">
                <Text 
                  className="text-xs font-medium text-foreground truncate block"
                  title={item.author?.name}
                >
                  {item.author?.name?.split(' ')[0]}
                </Text>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <Tooltip title={t`Reading time`}>
                <Space size={4}>
                  <ClockCircleOutlined className="text-amber-500 dark:text-amber-400" />
                  <span>{getReadingTimeText(item.readingTime || 1)}</span>
                </Space>
              </Tooltip>
            </div>
          </div>

          {/* Stats & Engagement */}
          <div className="pt-2 space-y-2">
            {/* Stats */}
            <div className="flex items-center justify-between text-xs">
              <Tooltip title={t`Views`}>
                <Space size={4} className="text-gray-600 dark:text-gray-300">
                  <EyeOutlined className="text-blue-500 dark:text-blue-400" />
                  <span>{formatViewCount(item.viewCount || 0)}</span>
                </Space>
              </Tooltip>

              <Tooltip title={t`Likes`}>
                <Space size={4} className="text-gray-600 dark:text-gray-300">
                  <HeartOutlined className="text-red-500 dark:text-red-400" />
                  <span>{formatViewCount(item.likeCount || 0)}</span>
                </Space>
              </Tooltip>

              <Tooltip title={t`Reviews`}>
                <Space size={4} className="text-gray-600 dark:text-gray-300">
                  <StarOutlined className="text-yellow-500 dark:text-yellow-400" />
                  <span>
                    {articleReviewStats.totalReviews > 0 
                      ? `${articleReviewStats.totalReviews} (${articleReviewStats.averageRating.toFixed(1)})` 
                      : '0'}
                  </span>
                </Space>
              </Tooltip>
            </div>

            {/* Engagement Progress Bar */}
            {(viewCount > 0 || likeCount > 0 || articleReviewStats.totalReviews > 0) && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Text className="text-xs text-gray-600 dark:text-gray-300">
                    {t`Engagement`}
                  </Text>
                  <Text
                    className="text-xs font-medium"
                    style={{ color: engagementLabel.color }}
                  >
                    {engagementPercentage}%
                  </Text>
                </div>
                <Progress
                  percent={engagementPercentage}
                  size="small"
                  showInfo={false}
                  strokeColor={engagementLabel.color}
                  trailColor="rgba(0,0,0,0.06)"
                  className="dark:[&_.ant-progress-bg]:opacity-90 dark:[&_.ant-progress-inner]:bg-gray-700"
                />
              </div>
            )}

            {/* Publish Date */}
            {item.publishedAt && (
              <div className="text-right pt-2">
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {getTimeAgo(item.publishedAt)}
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}, []);




  if (loading) {
    return <ArticleSkeleton />;
  }

  if (!article) {
    return (
     <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <Title level={2} className="!mb-4 text-foreground">
          {t`Article Not Found`}
        </Title>
        <Paragraph className="text-muted-foreground mb-6">
          {t`The article "${slug}" could not be loaded or doesn't exist.`}
        </Paragraph>
        <Space>
          <Button type="primary" onClick={() => window.history.back()}>
            {t`Go Back`}
          </Button>
          <Button onClick={() => window.location.href = '/dashboard/articles'}>
            {t`Browse Articles`}
          </Button>
        </Space>
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Reading Progress Bar */}
      {showReadingProgress && (
        <div className="fixed top-1 left-0 w-full h-1 z-50">
          <div 
            className="h-full bg-gradient-to-r from-primary via-primary/80 to-secondary transition-all duration-300"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      )}

      {/* Header */}
<div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 sm:backdrop-blur-sm border-b shadow-sm">
  <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">

    {/* Back Button */}
    <Button 
      type="link" 
      icon={<ArrowLeftOutlined />} 
      onClick={() => window.history.back()}
      className="text-foreground hover:text-primary hover:no-underline flex items-center gap-2"
    >
      {t`Back`}
    </Button>

    {/* Controls */}
    <div className="flex items-center gap-2">

      {/* Desktop: show buttons inline */}
      <div className="hidden sm:flex items-center gap-2">
        <Tooltip title={liked ? "Unlike" : "Like"}>
          <Button
            type="text"
            icon={liked ? <HeartFilled className="text-red-500" /> : <HeartOutlined className="text-red-500" />}
            onClick={handleLike}
            className="text-foreground hover:text-red-500"
          >
            <span className="ml-1">{article.likeCount || 0}</span>
          </Button>
        </Tooltip>

        <Tooltip title={t`Reviews`}>
          <Button
            type="default"
            icon={<StarOutlined />}
            onClick={() => {
              document.getElementById('reviews-section')?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
              });
            }}
            size="large"
            className="flex items-center gap-2 shadow-sm"
          >
            {t`Reviews`} 
            {article?.reviewStats?.totalReviews ? (
              <Badge 
                count={article.reviewStats.totalReviews} 
                style={{ backgroundColor: '#1890ff' }}
                className="ml-1"
              />
            ) : null}
          </Button>
        </Tooltip>
        <Tooltip title="Share">
          <Button
            type="text"
            icon={<ShareAltOutlined />}
            onClick={handleShare}
            className="text-foreground hover:text-primary"
          >
            {t`Share`}
          </Button>
        </Tooltip>

        <Tooltip title="Reading Settings">
          <Button
            type="text"
            icon={<ReadOutlined />}
            onClick={() => setShowReadingSettings(true)}
            className="text-foreground hover:text-primary"
          >
            {t`Fonts`}
          </Button>
        </Tooltip>

        {availableLanguages.length > 0 && (
          <LanguageSwitcher
            availableLanguages={availableLanguages} 
            currentLanguage={displayLanguage}
            onLanguageChange={handleLanguageChange}
             isLoading={isTranslating || languageSwitching}
            articleId={article.id}
            onLanguagesUpdated={updateAvailableLanguages} 
            checkAuth={checkAuth}
           
          />
        )}
      </div>

  {/* Mobile Menu */}
<div className="sm:hidden">
  <Menu as="div" className="relative inline-block text-left">
    <Menu.Button className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none transition-colors">
      <MoreOutlined />
    </Menu.Button>

    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl bg-white dark:bg-gray-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-[80vh] overflow-y-auto">
        <div className="py-2">
          {/* Reviews Button with Stats */}
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => {
                  document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`flex items-center w-full px-4 py-3 text-sm ${
                  active ? 'bg-gray-50 dark:bg-gray-800' : ''
                }`}
                disabled={!article}
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                  <StarOutlined className="text-yellow-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {t`Reviews`}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {article?.reviewStats?.totalReviews ? (
                      <>
                        {article.reviewStats.totalReviews} {t`reviews`} • 
                        {article.reviewStats.averageRating.toFixed(1)} {t`avg`}
                      </>
                    ) : (
                      t`No reviews yet`
                    )}
                  </div>
                </div>
              </button>
            )}
          </Menu.Item>
          {/* Like Button */}
          <Menu.Item>
            
            {({ active }) => (
              <button
                onClick={handleLike}
                className={`flex items-center w-full px-4 py-3 text-sm ${
                  active ? 'bg-gray-50 dark:bg-gray-800' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  liked ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  {liked ? (
                    <HeartFilled className="text-red-500" />
                  ) : (
                    <HeartOutlined className="text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {liked ? t`Liked` : t`Like`} {t`Article`}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t`${article?.likeCount || 0} likes`}
                  </div>
                </div>
              </button>
            )}
          </Menu.Item>

         
          {/* Share Button */}
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleShare}
                className={`flex items-center w-full px-4 py-3 text-sm ${
                  active ? 'bg-gray-50 dark:bg-gray-800' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                  <ShareAltOutlined className="text-gray-500 dark:text-gray-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {t`Share Article`}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t`Share with others`}
                  </div>
                </div>
              </button>
            )}
          </Menu.Item>

          {/* Reading Settings Button */}
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => setShowReadingSettings(true)}
                className={`flex items-center w-full px-4 py-3 text-sm ${
                  active ? 'bg-gray-50 dark:bg-gray-800' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                  <ReadOutlined className="text-gray-500 dark:text-gray-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {t`Reading Settings`}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t`Font size, style, etc.`}
                  </div>
                </div>
              </button>
            )}
          </Menu.Item>

          {/* Language Section using the new component */}
          <MobileLanguageSelector
            currentLanguage={displayLanguage}
            availableLanguages={availableLanguages}
            isTranslating={isTranslating || languageSwitching} 
            onLanguageChange={handleLanguageChange}
            onTranslateRequest={async (lang) => {
              if (!article?.id) return;
              setIsTranslating(true);
              try {
                await articleApi.translateArticle(article.id, lang);
              } catch (error) {
                console.error('Translation failed:', error);
                setIsTranslating(false);
              }
            }}
            articleId={article?.id}
            onLanguagesUpdated={updateAvailableLanguages}
          />
        </div>
      </Menu.Items>
    </Transition>
  </Menu>
</div>

    </div>
  </div>
</div>


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card 
          className="border-none shadow-none bg-transparent"
          styles={{ body: { padding: 0 } }}
        >
          {/* Article Header */}
          <div className="mb-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-1">
              {article.isFeatured && (
                <Tag color="gold" icon={<StarOutlined />} className="m-0">
                  {t`Featured`}
                </Tag>
              )}
              {article.isTrending && (
                <Tag color="volcano" icon={<FireOutlined />} className="m-0">
                  {t`Trending`}
                </Tag>
              )}
              {article.accessType === 'PREMIUM' && (
                <Tag color="purple" icon={<CrownOutlined />} className="m-0">
                  {t`Premium`}
                </Tag>
              )}
              {article.category && (
                <Tag 
                  color={article.category.color || 'blue'} 
                  icon={<FolderOutlined />}
                  className="m-0"
                >
                  {article.category.name}
                </Tag>
              )}
            </div>

            {/* Title */}
            <Title 
              level={1} 
              className="!mb-6 text-foreground leading-tight font-bold"
              style={{ fontSize: '2.5rem', lineHeight: 1.2 }}
            >
              {article.title}
            </Title>

            {/* Excerpt */}
            {article.excerpt && (
              <Paragraph className="text-xl text-muted-foreground mb-8 leading-relaxed font-light">
                {article.excerpt}
              </Paragraph>
            )}

            {/* Author and Metadata */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 p-4 bg-card rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <Avatar 
                  size={56}
                  src={article.author?.picture}
                  icon={!article.author?.picture && <UserOutlined />}
                  className="border-2 border-primary/20 bg-primary/10"
                >
                  {article.author?.name?.charAt(0) || 'A'}
                </Avatar>
                <div>
                  <Text strong className="block text-foreground text-lg">
                    {article.author?.name || t`Anonymous`}
                    {article.author?.isVerified && (
                      <Badge count="✓" color="green" className="ml-2" />
                    )}
                  </Text>
                  <Text type="secondary" className="text-sm">
                    {t`Published`} {new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                <Tooltip title={t`Reading time`}>
                  <Space>
                    <ClockCircleOutlined />
                    <Text>{article.readingTime || 5} {t`min read`}</Text>
                  </Space>
                </Tooltip>
                <Tooltip title={t`Views`}>
                  <Space>
                    <EyeOutlined className="text-blue-500"/>
                    <Text>{(article.viewCount || 0).toLocaleString()}</Text>
                  </Space>
                </Tooltip>
                <Tooltip title={t`Likes`}>
                  <Space>
                    <HeartFilled className="text-red-500"/>
                    <Text>{(article.likeCount || 0).toLocaleString()}</Text>
                  </Space>
                </Tooltip>
                <Tooltip title={t`Reviews`}>
                  <Button
                    type="link"
                    icon={<StarOutlined className="text-yellow-500" />}
                    onClick={() => {
                      document.getElementById('reviews-section')?.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }}
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                  >
                    <span className="ml-1">
                      {article?.reviewStats?.totalReviews || 0}
                      {article?.reviewStats?.averageRating ? 
                        ` (${article.reviewStats.averageRating.toFixed(1)} ★)` : ''
                      }
                    </span>
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>


          {/* Cover Image */}
          {/* {article.coverImage && (
            <div className="mb-10 rounded-2xl overflow-hidden shadow-xl relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  fallback={
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center">
                      <ReadOutlined className="text-6xl text-primary/30" />
                    </div>
                  }
                  placeholder={
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center">
                      <Spin size="large" />
                    </div>
                  }
                  preview={{
                    src: article.coverImage,
                    visible: false,
                  }}
                  onError={(e) => {
                    console.warn('Cover image failed, using fallback');
                    // Use a simple placeholder
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600/cccccc/969696?text=Image+Not+Found';
                  }}
                />
              </div>
            </div>
          )} */}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-10">
              <TagsOutlined className="text-muted-foreground mr-2" />
              {article.tags.map((tag: string, index: number) => (
                <Tag 
                  key={index} 
                  className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-all px-3 py-1 rounded-full border"
                  onClick={() => {
                    window.location.href = `/dashboard/articles?tag=${encodeURIComponent(tag)}`;
                  }}
                >
                  #{tag}
                </Tag>
              ))}
            </div>
          )}

          {/* Article Content */}
          <div className="mb-12">
            {article?.accessType === 'PREMIUM' && !userHasAccess ? (
              renderPremiumContentPlaceholder()
            ) : (
              <div 
                key={`article-wrapper-${article?.id}-${currentLanguage}-${contentKey || 'default'}`}
                id="article-content-wrapper"
                className="article-content-wrapper"
              >
                {renderContent()}
              </div>
            )}
          </div>

          <Divider />

          {/* Action Bar */}
         <div className="mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Button
                type={liked ? "primary" : "default"}
                icon={liked ? <HeartFilled className="text-red-500"/> : <HeartOutlined className="text-red-500"/>}
                onClick={handleLike}
                size="large"
                className={`flex items-center gap-2 min-w-[120px] shadow-sm ${
                  liked ? 'border-blue-500' : ''
                }`}
                style={liked ? {
                  color: '#1890ff',
                  borderColor: '#1890ff',
                  backgroundColor: 'rgba(24, 144, 255, 0.1)'
                } : {}}
              >
                {liked ? t`Liked` : t`Like`} ({article.likeCount || 0})
              </Button>
              
              <Button
                type={saved ? "primary" : "default"}
                icon={saved ? <BookFilled /> : <BookOutlined />}
                onClick={handleSave}
                size="large"
                className="flex items-center gap-2 min-w-[120px] shadow-sm"
              >
                {saved ? t`Saved` : t`Save`}
              </Button>
              
              <Button
                type="default"
                icon={<StarOutlined />}
                onClick={() => {
                  document.getElementById('reviews-section')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
                size="large"
                className="flex items-center gap-2 shadow-sm"
                disabled={!article} // Disable if no article
              >
                {t`Reviews`} 
                {article?.reviewStats?.totalReviews ? (
                  <Badge 
                    count={article.reviewStats.totalReviews} 
                    style={{ backgroundColor: '#1890ff' }}
                    className="ml-1"
                  />
                ) : null}
              </Button>
              
              <Button
                type="default"
                icon={<ShareAltOutlined />}
                onClick={handleShare}
                size="large"
                className="flex items-center gap-2 shadow-sm"
              >
                {t`Share`}
              </Button>
            </div>
          </div>
        </div>

          {/* Author Bio */}
          {/* {(article.author?.bio || article.author?.name) && (
            <div className="mb-10 p-8 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-2xl border">
              <div className="flex flex-col sm:flex-row items-start gap-8">
                <Avatar 
                  size={96}
                  src={article.author.picture}
                  icon={!article.author.picture && <UserOutlined />}
                  className="border-4 border-white shadow-lg flex-shrink-0"
                >
                  {article.author.name?.charAt(0) || 'A'}
                </Avatar>
                <div className="flex-1">
                  <Title level={3} className="!mb-4 text-foreground">
                    {t`About ${article.author.name}`}
                  </Title>
                  {article.author.bio && (
                    <Paragraph className="text-muted-foreground mb-6 leading-relaxed text-base">
                      {article.author.bio}
                    </Paragraph>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {article.author.isVerified && (
                      <Tag color="green" icon={<StarOutlined />} className="px-3 py-1">
                        {t`Verified Author`}
                      </Tag>
                    )}
                    <Tag className="px-3 py-1">
                      <UserOutlined className="mr-2" />
                      {article.author.followersCount === 1 
                        ? t`1 follower` 
                        : t`${article.author.followersCount?.toLocaleString() || 0} followers`
                      }
                    </Tag>
                  </div>
                </div>
              </div>
            </div>
          )} */}

          {/* Reviews Section */}
          {article && article.reviewStats && article.reviewStats.totalReviews > 0 && (
  <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold text-yellow-600">
            {article.reviewStats.averageRating.toFixed(1)}
          </div>
          <Rate 
            disabled 
            defaultValue={article.reviewStats.averageRating} 
            allowHalf 
            className="text-sm"
          />
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t`Based on ${article.reviewStats.totalReviews} review${
            article.reviewStats.totalReviews !== 1 ? 's' : ''
          }`}
        </div>
      </div>
      
      {/* Quick distribution preview */}
      {article.reviewStats.totalReviews >= 5 && (
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <span className="font-medium">
              {Math.round(
                ((article.reviewStats.ratingDistribution[5] + 
                  article.reviewStats.ratingDistribution[4]) / 
                  article.reviewStats.totalReviews) * 100
              )}%
            </span>
            <span className="text-gray-500 ml-1">{t`recommend`}</span>
          </div>
          <Tag color="blue" icon={<CheckCircleOutlined />}>
            {t`Community Trusted`}
          </Tag>
        </div>
      )}
    </div>
  </div>
)}

{/* Reviews Section - Using your SimpleReviewSection */}
<div id="reviews-section" className="scroll-mt-20">
  {article && (
    <SimpleReviewSection 
      articleId={article.id}
      articleTitle={article.title}
      onReviewAdded={() => {
        refreshArticleData();
        fetchAndUpdateReviewStats(article.id); 
        loadReviews();
      }}
      onReviewUpdated={() => {
        refreshArticleData();
        fetchAndUpdateReviewStats(article.id); 
        loadReviews();
      }}
      onStatsUpdate={handleStatsUpdate} 
    />
  )}
</div>

          
        {/* Related Articles Section */}
<div className="mt-12 mb-12">
  <div className="flex items-center justify-between mb-6">
    <Title level={3} className="!mb-0 text-foreground flex items-center gap-3">
      <ReadOutlined className="text-primary" />
      {t`Related Articles`}
      {relatedArticles.length > 0 && !relatedLoading && (
        <Tag color="blue" className="ml-2">
          {relatedArticles.length}
        </Tag>
      )}
    </Title>
    
    {article?.category && !relatedLoading && (
      <Button
        type="link"
        onClick={() => {
          window.location.href = `/dashboard/articles?category=${article.category?.slug}`;
        }}
        className="text-primary hover:text-primary/80 flex items-center gap-1"
        size="small"
      >
        {t`View all in ${article.category.name}`}
        <ArrowLeftOutlined className="ml-1 rotate-180" />
      </Button>
    )}
  </div>
  
  {relatedLoading ? (
    <div className="text-center py-12">
      <Spin size="large" />
      <Paragraph className="mt-4 text-muted-foreground">
        {t`Loading related articles in ${getLanguageName(currentLanguage)}...`}
      </Paragraph>
    </div>
  ) : relatedArticles.length > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Render actual article cards */}
      {relatedArticles.map((articleItem) => (
        <div 
          key={articleItem.id} 
          className="transform transition-all duration-300 hover:-translate-y-1"
        >
          {renderArticleCard(articleItem)}
        </div>
      ))}
      
      {/* Empty slots on the same line with matching height */}
      {relatedArticles.length < 3 && (
        <>
          {[...Array(3 - relatedArticles.length)].map((_, i) => (
            <div 
              key={`empty-${i}`} 
              className="hidden md:block h-full"
            >
              <Card 
                className="border-2 border-dashed border-gray-200 dark:border-gray-700 h-full flex flex-col justify-center items-center bg-gray-50/50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 transition-colors min-h-[400px]"
              >
                <div className="text-center p-6 space-y-4 flex-1 flex flex-col justify-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                      <ReadOutlined className="text-2xl text-gray-400 dark:text-gray-600" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <Text className="text-xs text-gray-500">?</Text>
                    </div>
                  </div>
                  
                  <div>
                    <Title level={5} className="!mb-2 text-gray-400 dark:text-gray-500">
                      {(() => {
                        const messages = [
                          t`More Coming Soon`,
                          t`Discover More Articles`,
                          t`Explore Further`
                        ];
                        return messages[i] || t`More Articles`;
                      })()}
                    </Title>
                    
                    <Paragraph className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-[200px] mx-auto">
                      {(() => {
                        const descriptions = [
                          t`We're working on more related content for you.`,
                          t`Check back soon for more articles on this topic.`,
                          t`Browse all articles to discover more great content.`
                        ];
                        return descriptions[i] || t`No related articles found.`;
                      })()}
                    </Paragraph>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      type="default" 
                      size="small"
                      onClick={() => window.location.href = '/dashboard/articles'}
                      className="text-xs"
                    >
                      {t`Browse All Articles`}
                    </Button>
                    
                    <Paragraph className="text-xs text-gray-400 dark:text-gray-500">
                      {relatedArticles.length === 0 ? (
                        t`No articles found in this category yet.`
                      ) : (
                        t`Found ${relatedArticles.length} related article${relatedArticles.length !== 1 ? 's' : ''}`
                      )}
                    </Paragraph>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </>
      )}
      
      {/* For mobile, show a single empty card */}
      {relatedArticles.length === 0 && (
        <div className="md:hidden col-span-1">
          <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700 h-full">
            <div className="text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto">
                <ReadOutlined className="text-3xl text-gray-400 dark:text-gray-600" />
              </div>
              
              <div>
                <Title level={5} className="!mb-2 text-gray-400 dark:text-gray-500">
                  {t`No Related Articles`}
                </Title>
                
                <Paragraph className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t`We couldn't find articles related to this one. Check out trending articles or browse by category.`}
                </Paragraph>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => loadTrendingArticles()}
                >
                  {t`View Trending`}
                </Button>
                <Button 
                  type="default" 
                  size="small"
                  onClick={() => window.location.href = '/dashboard/articles'}
                >
                  {t`Browse All`}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  ) : (
    <div className="text-center py-12 border rounded-xl bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <ReadOutlined className="text-5xl text-muted-foreground mb-4" />
      <Title level={4} className="!mb-3 text-foreground">
        {t`No Related Articles Found`}
      </Title>
      <Paragraph className="text-muted-foreground mb-6 max-w-md mx-auto">
        {t`We couldn't find any articles related to this one in ${getLanguageName(currentLanguage)}. Try browsing by category or check out trending articles.`}
      </Paragraph>
      <Space>
        <Button 
          type="primary"
          onClick={() => loadTrendingArticles()}
        >
          {t`View Trending Articles`}
        </Button>
        <Button 
          type="default"
          onClick={() => window.location.href = '/dashboard/articles'}
        >
          {t`Browse All Articles`}
        </Button>
      </Space>
    </div>
  )}
</div>
          {/* Categories Section */}
          {categories.length > 0 && (
           <div className="mb-10">
            <Title level={3} className="!mb-6 text-foreground flex items-center gap-3">
              <FolderOutlined className="text-primary" />
              {t`Explore Categories`}
            </Title>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {categories.map(category => (
                <Card
                  key={category.id}
                  hoverable
                  className="text-center border hover:shadow-md transition-all duration-300 group"
                  onClick={() => {
                    window.location.href = `/dashboard/articles?category=${category.slug}`;
                  }}
                >
                  <div className="space-y-4">
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center mx-auto transition-transform group-hover:scale-110"
                      style={{ 
                        backgroundColor: category.color ? `${category.color}20` : '#3b82f620',
                        color: category.color || '#3b82f6'
                      }}
                    >
                      <FolderOutlined style={{ fontSize: '24px' }} />
                    </div>
                    <div>
                      <Text strong className="block text-foreground text-lg mb-1">
                        {category.name}
                      </Text>
                      {category.description && (
                        <Text type="secondary" className="text-sm line-clamp-2">
                          {category.description}
                        </Text>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          )}

          {/* Trending Articles */}
          {trendingArticles.length > 0 && (
            <div className="mb-10">
              <Title level={3} className="!mb-6 text-foreground flex items-center gap-3">
                <FireOutlined className="text-orange-500" />
                {t`Trending Now`}
              </Title>
              
              {trendingLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Card key={i} className="border">
                      <Skeleton active avatar paragraph={{ rows: 2 }} />
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendingArticles.map(article => renderArticleCard(article))}
                </div>
              )}
            </div>
          )}

          {/* Footer CTA */}



   
            <div className="mt-12 text-center">
            <div className="p-10 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-3xl border">
              <div className="max-w-2xl mx-auto">
                {/* Dynamic title with user name and article context */}
                <Title level={3} className="!mb-4 text-foreground">
                  {user ? (
                    <>
                      {(() => {
                        const firstName = user.name?.split(' ')[0] || 'Knowledge Seeker';
                        
                        return (
                          <>
                            {article.accessType === 'PREMIUM' ? t`Excellent choice, ` : t`Great read, `}
                            <span className="bg-gradient-to-r pl-2 from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent font-bold">
                              {firstName}
                            </span>
                            {t`!`}
                          </>
                        );
                      })()}
                      <br />
                      <span className="text-primary">
                        {article.accessType === 'PREMIUM' 
                          ? t`You're accessing premium insights!` 
                          : t`Enjoyed "${article.title}"?`}
                      </span>
                    </>
                  ) : (
                    t`Enjoyed this article?`
                  )}
                </Title>
                
                {/* Structured message based on article access type and user auth */}
                <Paragraph className="text-muted-foreground mb-8 text-lg">
                  {(() => {
                    // For logged-in users
                    if (user) {
                      if (article.accessType === 'PREMIUM') {
                        return (
                          <>
                            <strong className="text-foreground">{t`You're reading premium content!`}</strong>{' '}
                            {t`As a valued reader, you have access to exclusive insights like "${article.title}". Continue exploring our premium collection for expert analysis, in-depth research, and advanced knowledge unavailable elsewhere.`}
                          </>
                        );
                      } else {
                        return (
                          <>
                            <strong className="text-foreground">{t`You just read "${article.title}"!`}</strong>{' '}
                            {t`This is just the beginning. Imagine what you could learn with our premium articles featuring exclusive insights, expert breakdowns, and advanced analysis.`}
                          </>
                        );
                      }
                    }
                    
                    // For non-logged users
                    return article.accessType === 'PREMIUM' 
                      ? t`You're previewing premium content. Join thousands of readers who access exclusive insights, save their favorite articles, and never miss expert updates.`
                      : t`Join thousands of readers who get personalized recommendations, save their favorite articles, and never miss an update from our best writers.`;
                  })()}
                </Paragraph>
                
                {/* Action buttons based on user and article type */}
                <Space wrap className="justify-center gap-4">
                  {/* Main CTA - Different based on article type */}
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={() => window.location.href = article.accessType === 'PREMIUM' 
                      ? '/dashboard/articles/all?access=premium' 
                      : '/dashboard/articles/all'}
                    icon={article.accessType === 'PREMIUM' ? <CrownOutlined /> : <ReadOutlined />}
                    className="px-8"
                  >
                    {article.accessType === 'PREMIUM' 
                      ? (user ? t`More Premium` : t`Explore Premium`) 
                      : (user ? t`Discover More` : t`Explore Articles`)}
                  </Button>
                  
                  {/* Secondary CTA for FREE articles - Premium upgrade */}
                  {user && article.accessType !== 'PREMIUM' && (
                    <Button 
                      size="large"
                      onClick={() => window.location.href = '/dashboard/articles/all?access=premium'}
                      className="px-8 bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white hover:from-purple-700 hover:to-pink-700"
                      icon={<CrownOutlined />}
                    >
                      {t`Access Premium`}
                    </Button>
                  )}
                  
                  {/* Join button for non-logged users */}
                  {!user && (
                    <Button 
                      size="large"
                      onClick={() => window.location.href = '/auth/register'}
                      className="px-8"
                    >
                      {t`Join Free Today`}
                    </Button>
                  )}
                </Space>
                
                {/* Footer message with clear value proposition */}
                <Paragraph className="text-muted-foreground mt-6 text-sm">
                  {(() => {
                    if (user) {
                      if (article.accessType === 'PREMIUM') {
                        return (
                          <>
                            {t`As a premium content reader, you get:`}{' '}
                            <strong className="text-foreground">
                              {t`Exclusive insights • Expert analysis • Advanced knowledge`}
                            </strong>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <div className="inline-flex items-center gap-1">
                              <span className="text-muted-foreground">{t`Access more from`}</span>
                              <Button 
                                type="link" 
                                onClick={() => window.location.href = `/dashboard/articles/all?cat=${article.category?.slug || 'all'}`}
                                className="p-0 font-bold text-primary hover:text-primary/80"
                              >
                                {article.category ? t`${article.category.name}` : t`Expert`}
                              </Button>
                              <span className="text-muted-foreground">{t`category on Inlirah!`}</span>
                              
                            </div>
                          </>
                        );
                      }
                    } else {
                      return (
                        <>
                          {t`Already have an account?`}{' '}
                          <Button 
                            type="link" 
                            onClick={() => window.location.href = '/auth/login'} 
                            className="p-0"
                          >
                            {t`Sign in to ${article.accessType === 'PREMIUM' ? 'access premium' : 'save articles'}`}
                          </Button>
                        </>
                      );
                    }
                  })()}
                </Paragraph>
                
                {/* Premium badge for premium articles */}
                {article.accessType === 'PREMIUM' && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full">
                    <CrownOutlined className="text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-medium text-purple-800 dark:text-purple-300">
                      {user 
                        ? t`You have access to premium content`
                        : t`You're previewing premium content`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>


      {/* CSS styles */}
      <style>{`
        .article-content {
          font-size: ${fontSize}px !important;
          line-height: ${lineHeight} !important;
          font-family: ${fontFamily} !important;
          color: var(--foreground) !important;
        }
        
        /* Making sure paragraphs have proper dark mode support */
        .article-content p,
        .article-content .ant-typography {
          font-size: ${fontSize}px !important;
          line-height: ${lineHeight} !important;
          font-family: ${fontFamily} !important;
          margin-bottom: 1.75rem !important;
          color: var(--foreground) !important;
        }
      `}</style>
      
      <AuthModal
        visible={showAuthModal}
        onCancel={() => setShowAuthModal(false)}
        action={authAction}
      />

      <PremiumPaywall
  article={article}
  visible={showPaywall}
  onClose={() => setShowPaywall(false)}
  onPurchaseSuccess={() => {
    setUserHasAccess(true);
    setShowPaywall(false);
    
    // Calculate coin price
    const coinPrice = (article as any).coinPrice || Math.max(10, Math.floor(article.readingTime * 2));
    
    notification.success({
      message: (
        <div>
          <div className="font-bold text-base">{t`✨ Article Unlocked!`}</div>
          <div className="flex items-center gap-1 mt-1 text-sm">
            <span className="text-yellow-600 font-medium">{coinPrice} coins</span>
            <span>{t`used`}</span>
          </div>
        </div>
      ),
      description: t`Enjoy your premium content!`,
      duration: 4,
      className: 'premium-unlock-toast',
      style: {
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e6f7e6 100%)',
        border: '1px solid #10b981',
      }
    });
    
    refreshArticleData();
    fetchBalance();
    setContentKey(`purchased-${Date.now()}`);
  }}
/>


    <ReadingSettingsModal
      visible={showReadingSettings}
      onClose={() => setShowReadingSettings(false)}
      fontSize={fontSize}
      setFontSize={setFontSize}
      lineHeight={lineHeight}
      setLineHeight={setLineHeight}
      fontFamily={fontFamily}
      setFontFamily={setFontFamily}
    />
    </div>
  );
};

// Enhanced Skeleton Loader
const ArticleSkeleton: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <Card className="border-none shadow-none bg-transparent">
      {/* Header Skeleton */}
      <div className="mb-10">
        <div className="flex gap-2 mb-4">
          <Skeleton.Button active size="small" className="!w-20" />
          <Skeleton.Button active size="small" className="!w-16" />
          <Skeleton.Button active size="small" className="!w-24" />
          <Skeleton.Button active size="small" className="!w-20" />
        </div>
        <Skeleton active title={{ width: '90%' }} paragraph={{ rows: 0 }} className="!mb-4" />
        <Skeleton active paragraph={{ rows: 2, width: '80%' }} className="!mb-8" />
        
        {/* Author Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 p-4 bg-card rounded-lg">
          <div className="flex items-center gap-4">
            <Skeleton.Avatar active size={56} />
            <div>
              <Skeleton active paragraph={{ rows: 1, width: '40%' }} title={false} />
              <Skeleton active paragraph={{ rows: 1, width: '30%' }} title={false} />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Skeleton.Button active size="small" className="!w-20" />
            <Skeleton.Button active size="small" className="!w-20" />
            <Skeleton.Button active size="small" className="!w-20" />
            <Skeleton.Button active size="small" className="!w-20" />
          </div>
        </div>
      </div>

      {/* Cover Image Skeleton */}
      <Skeleton.Image active className="!w-full !h-64 !mb-10 rounded-2xl" />

      {/* Content Skeleton */}
      <div className="space-y-6 mb-12">
        <Skeleton active paragraph={{ rows: 3 }} />
        <Skeleton active paragraph={{ rows: 4 }} />
        <Skeleton active paragraph={{ rows: 2 }} />
        <Skeleton.Image active className="!w-full !h-48" />
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>

      <Skeleton active paragraph={{ rows: 1 }} className="!mb-10" />
      
      {/* Action Buttons Skeleton */}
      <div className="flex flex-wrap gap-4 mb-10">
        <Skeleton.Button active size="large" className="!w-32" />
        <Skeleton.Button active size="large" className="!w-32" />
        <Skeleton.Button active size="large" className="!w-32" />
        <Skeleton.Button active size="large" className="!w-24" />
      </div>

      {/* Comments Skeleton */}
      <div className="mb-10">
        <Skeleton active paragraph={{ rows: 1, width: '30%' }} className="!mb-6" />
        <div className="space-y-8">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton.Avatar active size={40} />
              <div className="flex-1">
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related Articles Skeleton */}
      <div className="mb-10">
        <Skeleton active paragraph={{ rows: 1, width: '40%' }} className="!mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border">
              <Skeleton active avatar paragraph={{ rows: 3 }} />
            </Card>
          ))}
        </div>
      </div>

      {/* Categories Skeleton */}
      <div className="mb-10">
        <Skeleton active paragraph={{ rows: 1, width: '40%' }} className="!mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border">
              <Skeleton active avatar paragraph={{ rows: 2 }} />
            </Card>
          ))}
        </div>
      </div>

      {/* Trending Articles Skeleton */}
      <div className="mb-10">
        <Skeleton active paragraph={{ rows: 1, width: '40%' }} className="!mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border">
              <Skeleton active avatar paragraph={{ rows: 2 }} />
            </Card>
          ))}
        </div>
      </div>
    </Card>
  </div>
);

export default SimpleArticleReader;