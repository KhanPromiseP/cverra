// components/articles/SimpleArticleReader.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  Progress
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
  CommentOutlined,
  ShareAltOutlined,
  SendOutlined,
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
  CalendarOutlined
} from '@ant-design/icons';
import articleApi, { Article, Author, Category, Comment } from '../../services/articleApi';
import { apiClient } from '../../services/api-client';
import AuthModal from '../common/AuthModal';
import { useUser } from "@/client/services/user";
import PremiumPaywall from './PremiumPaywall';



// Font size options
const FONT_SIZES = [12, 14, 16, 18, 20, 22, 24];
const LINE_HEIGHTS = [1.4, 1.6, 1.8, 2.0, 2.2];
const FONT_FAMILIES = [
  { label: 'System', value: 'system-ui' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Sans', value: 'Arial, sans-serif' },
  { label: 'Monospace', value: 'Monaco, monospace' },
  { label: 'Open Dyslexic', value: 'OpenDyslexic, sans-serif' },
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
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'comments' | 'related' | 'trending'>('comments');
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<'like' | 'comment' | 'save' | 'premium' | 'share' | 'reply'>('like');
  const { user, loading: userLoading } = useUser();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [visibleComments, setVisibleComments] = useState(2);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);

  const [displayedComments, setDisplayedComments] = useState<Comment[]>([]);
  // Add a new state for showing all comments
  const [showAllComments, setShowAllComments] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [userHasAccess, setUserHasAccess] = useState(false);

  const [showReadingSettings, setShowReadingSettings] = useState(false);

    
  // Refs for view tracking control
  const isMountedRef = useRef(true);
  const viewTrackedRef = useRef(false);
  const fetchInProgressRef = useRef(false);
  const scrollTrackingEnabledRef = useRef(false);
  const articleIdRef = useRef<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});


  const [fontSize, setFontSize] = useState<number>(18); // Default 18px
  const [lineHeight, setLineHeight] = useState<number>(1.8);
  const [fontFamily, setFontFamily] = useState<string>('system-ui');



  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['en']);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  useEffect(() => {
  const loadAvailableLanguages = async () => {
    if (article?.id) {
      try {
        const response = await articleApi.getArticleAvailableLanguages(article.id);
        if (response?.languages) {
          const languages = response.languages.map((lang: any) => lang.language);
          setAvailableLanguages(languages);
        }
      } catch (error) {
        console.error('Failed to load available languages:', error);
        setAvailableLanguages(['en']);
      }
    }
  };
  
  loadAvailableLanguages();
}, [article?.id]);

  const handleLanguageChange = async (language: string) => {
  if (!article || language === currentLanguage) return;
  
  console.log('🌐 Switching language to:', language);
  console.log('📚 Available languages:', article.availableLanguages);
  
  if (article.availableLanguages && article.availableLanguages.includes(language)) {
    setCurrentLanguage(language);
    
    setIsTranslating(true);
    try {
      console.log('📡 Making API request with params:', { language });
      const response = await articleApi.getArticle(article.slug, { language });
      
      console.log('✅ API Response:', {
        status: response.status,
        data: response.data,
        isTranslated: response.data?.isTranslated,
        title: response.data?.title,
      });
      
      if (response.data) {
        const articleData = response.data.data || response.data;
        
        // Update article with translated content
        setArticle(prev => prev ? {
          ...prev,
          title: articleData.title || prev.title,
          content: articleData.content || prev.content,
          excerpt: articleData.excerpt || prev.excerpt,
          language: language,
          availableLanguages: articleData.availableLanguages || prev.availableLanguages,
          translationQuality: articleData.translationQuality || prev.translationQuality
        } : null);
        
        notification.success({
          message: `Switched to ${getLanguageName(language)}`,
          description: 'Article content has been updated.',
          duration: 2,
        });
      }
    } catch (error) {
      console.error('Failed to switch language:', error);
      notification.error({
        message: 'Language Switch Failed',
        description: 'Could not load the translated version.',
        duration: 3,
      });
    } finally {
      setIsTranslating(false);
    }
  }
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

  // Helper function to get time ago
const getTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (error) {
    return 'Recently';
  }
};

// Helper function to get engagement label
const getEngagementLabel = (score: number): { label: string; color: string } => {
  if (score >= 80) return { label: '🔥 Hot', color: '#fa541c' };
  if (score >= 60) return { label: '📈 Trending', color: '#fa8c16' };
  if (score >= 40) return { label: '👍 Popular', color: '#52c41a' };
  if (score >= 20) return { label: '📚 Good read', color: '#1890ff' };
  return { label: '📖 New', color: '#8c8c8c' };
};

// Helper function to get reading time text
const getReadingTimeText = (minutes: number): string => {
  if (minutes < 1) return 'Less than 1 min';
  if (minutes === 1) return '1 min';
  return `${minutes} mins`;
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
    // Use the new access check endpoint first
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
    
    // Fallback to old method
    try {
      console.log('Trying fallback purchase check...');
      const response = await articleApi.purchaseArticle(article.id);
      console.log('Fallback purchase response:', response);
      
      if (response.success === true || response.data?.purchased === true) {
        console.log('Purchase successful via fallback');
        setUserHasAccess(true);
        return true;
      }
      
      setUserHasAccess(false);
      return false;
      
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      setUserHasAccess(false);
      return false;
    }
  }
};


// Function to check if user has access and update state
const checkAndSetAccess = async () => {
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
};

  

  const checkAuth = (action: 'like' | 'comment' | 'save' | 'premium' | 'share' | 'reply'): boolean => {
    if (!user) {
      setAuthAction(action);
      setShowAuthModal(true);
      return false;
    }
    return true;
  };


  // Handle edit comment
const handleEditComment = (comment: Comment) => {
  setEditingComment(comment.id);
  setEditCommentText(comment.content);
};


// Function to check if current user owns the comment
const isCurrentUserComment = (comment: any): boolean => {
  try {
    // Check if user is logged in
    if (!user) return false;
    
    // Get current user ID
    const currentUserId = user.id || user._id;
    if (!currentUserId) return false;
    
    // Get author from comment (handles both author and user fields)
    const author = comment.author || comment.user;
    const commentAuthorId = author?.id || author?._id;
    
    // Also check if comment already has isOwn flag
    return commentAuthorId === currentUserId || comment.isOwn === true;
  } catch (error) {
    console.error('Error checking comment ownership:', error);
    return false;
  }
};


// Add this simple function near your other helper functions
const renderPremiumContentPlaceholder = () => {
  return (
    <div className="bg-blue-100 dark:bg-gray-900 my-8 p-6 text-center">
      <div className="mb-4">
        <CrownOutlined className="text-3xl text-purple-500 mb-2" />
        <Title level={4} className="!mb-2 text-foreground dark:text-white">
          Premium Content
        </Title>
        <Paragraph className="text-lg text-muted-foreground dark:text-gray-300 mb-6">
                This article is part of our premium collection. Unlock it to access exclusive insights, 
                expert analysis, and in-depth content that's not available anywhere else.
              </Paragraph>
      </div>
      
      <Button
        type="primary"
        icon={<LockOutlined />}
        onClick={() => setShowPaywall(true)}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0"
      >
        Unlock Article
      </Button>
    </div>
  );
};


// Function to save edited comment
const handleSaveEdit = async (commentId: string) => {
  if (!editCommentText.trim()) return;
  
  try {
    // Save original comment for rollback
    const findOriginalComment = (comments: any[]): any => {
      for (const comment of comments) {
        if (comment.id === commentId) return comment;
        if (comment.replies?.length) {
          const found = findOriginalComment(comment.replies);
          if (found) return found;
        }
      }
      return null;
    };
    
    const originalComment = findOriginalComment(comments);
    
    // OPTIMISTIC UPDATE
    const updateCommentContent = (comments: any[]): any[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            content: editCommentText,
            updatedAt: new Date().toISOString(),
            isEdited: true
          };
        }
        
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateCommentContent(comment.replies)
          };
        }
        
        return comment;
      });
    };
    
    setComments(prev => updateCommentContent(prev));
    setDisplayedComments(prev => updateCommentContent(prev));
    setEditingComment(null);
    setEditCommentText('');
    
    // Make API call
    await articleApi.updateComment(commentId, { content: editCommentText });
    
    notification.success({ 
      message: 'Comment updated!',
      placement: 'top',
      duration: 2
    });
    
  } catch (error) {
    console.error('Failed to update comment:', error);
    
    // Revert optimistic update on error
    if (originalComment) {
      const revertUpdate = (comments: any[]): any[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return originalComment;
          }
          
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: revertUpdate(comment.replies)
            };
          }
          
          return comment;
        });
      };
      
      setComments(prev => revertUpdate(prev));
      setDisplayedComments(prev => revertUpdate(prev));
    }
    
    notification.error({ 
      message: 'Failed to update comment',
      placement: 'top',
      duration: 3
    });
  }
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

useEffect(() => {
  // Re-check access when user logs in/out
  if (article && article.accessType === 'PREMIUM') {
    checkAndSetAccess();
  }
}, [user, article]);

  // Load article and related data
  useEffect(() => {
    if (!slug) return;
    
    const loadArticleData = async () => {
      if (fetchInProgressRef.current) return;
      
      fetchInProgressRef.current = true;
      setLoading(true);
    
      try {
        
        // Load main article
        const params = currentLanguage !== 'en' ? { language: currentLanguage } : undefined;
        const response = await articleApi.getArticle(slug, params);
        
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
          articleIdRef.current = articleData.id;
          
          console.log('Mapping article data:', articleData);

          


        // In the fixImageUrl function, change:
        const fixImageUrl = (url: string): string => {
          if (!url || url.trim() === '') return '';
          
          console.log('🔧 Fixing image URL:', url);
          
          // Don't use Unsplash URLs
          if (url.includes('images.unsplash.com')) {
            console.log('🚫 Skipping Unsplash URL:', url);
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
            commentCount: articleData.commentCount || 0,
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
            language: articleData.language || 'en',
            translationQuality: articleData.translationQuality,
            recommendationScore: articleData.recommendationScore
          };
          
          setArticle(mappedArticle);

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
              try {
                const accessResponse = await articleApi.purchaseArticle(mappedArticle.id);
                setUserHasAccess(accessResponse.success === true);
              } catch (error) {
                console.error('Failed to check premium access:', error);
                setUserHasAccess(false);
              }
            } else if (mappedArticle.accessType === 'FREE') {
              setUserHasAccess(true);
            }
          
          // Load related data in parallel
          await Promise.all([
            loadComments(mappedArticle.id),
            loadComments(articleData.id),
            loadComments(slug),
            loadRelatedArticles(mappedArticle.id),
            loadTrendingArticles(),
            loadCategories()
          ]);
          
          // Log for debugging
          console.log('Article loaded:', {
            title: mappedArticle.title,
            coverImage: mappedArticle.coverImage,
            contentType: typeof mappedArticle.content,
            hasComments: mappedArticle.commentCount > 0
          });
          
        } else {
          throw new Error('Invalid article data structure');
        }
      } catch (error: any) {
        console.error('Failed to load article:', error);
        notification.error({
          message: 'Error Loading Article',
          description: error.response?.data?.message || error.message || 'Failed to load article. Please try again.',
          duration: 5,
        });
      } finally {
        fetchInProgressRef.current = false;
        setLoading(false);
      }
    };
    
    loadArticleData();
  }, [slug]);


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
        title="Reading Settings"
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
            Reset to Default
          </Button>,
          <Button key="close" type="primary" onClick={onClose}>
            Apply Settings
          </Button>
        ]}
      >
      <div className="space-y-6">
        {/* Font Size */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Title level={5} className="!mb-0">Font Size</Title>
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
                {FONT_SIZES.map(size => ( // Use FONT_SIZES constant
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
            <Title level={5} className="!mb-0">Line Height</Title>
            <Text className="text-lg font-bold">{lineHeight}</Text>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {LINE_HEIGHTS.map(height => ( // Use LINE_HEIGHTS constant
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
          <Title level={5} className="!mb-4">Font Family</Title>
          <div className="grid grid-cols-2 gap-2">
            {FONT_FAMILIES.map(font => ( // Use FONT_FAMILIES constant
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
          <Text className="mb-2 text-sm text-gray-500 dark:text-gray-400">Preview:</Text>
          <div 
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
              fontFamily: fontFamily,
            }}
            className="text-foreground"
          >
            This is how your article will look with these settings.
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
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
}> = ({ 
  availableLanguages, 
  currentLanguage, 
  onLanguageChange, 
  isLoading = false,
  articleId 
}) => {
  const [isManualTranslating, setIsManualTranslating] = useState(false);

  const handleManualTranslate = async (targetLanguage: string) => {
    if (!articleId) return;
    
    setIsManualTranslating(true);
    try {
      // Call backend to generate translation
      const response = await articleApi.translateArticle(articleId, targetLanguage);
      
      if (response.success) {
        notification.success({
          message: 'Translation Started',
          description: `${getLanguageName(targetLanguage)} translation is being generated.`,
          duration: 3,
        });
        
        // Refresh available languages
        setTimeout(() => {
          onLanguageChange(targetLanguage);
        }, 3000);
      }
    } catch (error) {
      notification.error({
        message: 'Translation Failed',
        description: 'Could not generate translation at this time.',
        duration: 3,
      });
    } finally {
      setIsManualTranslating(false);
    }
  };

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

  // Add "Translate to..." options for common languages not yet available
  const suggestedLanguages = ['fr', 'es', 'de', 'pt', 'ar', 'hi', 'zh', 'ja', 'ru']
    .filter(lang => !availableLanguages.includes(lang))
    .map(lang => ({
      key: `translate-${lang}`,
      label: (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getLanguageFlag(lang)}</span>
            <span>Translate to {getLanguageName(lang)}</span>
          </div>
          {isManualTranslating && <Spin size="small" />}
        </div>
      ),
      onClick: () => handleManualTranslate(lang),
      disabled: isManualTranslating,
    }));

  const allItems = [...languageItems];
  
  if (suggestedLanguages.length > 0) {
    allItems.push({ type: 'divider' });
    allItems.push(...suggestedLanguages);
  }

  return (
    <Dropdown
      menu={{ items: allItems }}
      trigger={['click']}
      placement="bottomRight"
      overlayClassName="w-48"
    >
      <Button
        type="text"
        icon={<GlobalOutlined />}
        size="large"
        className="text-muted-foreground hover:text-primary flex items-center gap-2"
        loading={isLoading}
      >
        <span className="hidden sm:inline">
          {getLanguageFlag(currentLanguage)} {getLanguageName(currentLanguage)}
        </span>
        <span className="sm:hidden">
          {getLanguageFlag(currentLanguage)}
        </span>
      </Button>
    </Dropdown>
  );
};
  
  // Function to organize comments with nested replies
const organizeCommentsWithReplies = (comments: Comment[]): Comment[] => {
  const commentMap = new Map<string, Comment>();
  const rootComments: Comment[] = [];
  
  // First pass: create a map of all comments with normalized author/user
  comments.forEach(comment => {
    // Normalize the author/user field
    const normalizedComment: Comment = {
      ...comment,
      // Use user if author is not present
      author: comment.author || comment.user,
      likesCount: comment.likesCount || comment.likeCount || 0,
      replies: []
    };
    
    commentMap.set(comment.id, normalizedComment);
  });
  
  // Second pass: build the tree
  comments.forEach(comment => {
    const mappedComment = commentMap.get(comment.id)!;
    
    if (comment.parentId) {
      // This is a reply, add it to parent's replies
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        if (!parent.replies) parent.replies = [];
        parent.replies.push(mappedComment);
      }
    } else {
      // This is a root comment
      rootComments.push(mappedComment);
    }
  });
  
  // Recursively sort replies by date (newest first)
  const sortComments = (commentList: Comment[]): Comment[] => {
    return commentList.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).map(comment => ({
      ...comment,
      replies: comment.replies ? sortComments(comment.replies) : []
    }));
  };
  
  return sortComments(rootComments);
};

const loadComments = async (articleId?: string, page = 1, loadAll = false) => {
  const articleIdToUse = articleId || article?.id;
  
  if (!articleIdToUse) return;
  
  // Prevent duplicate loading
  if (commentsLoading) return;
  
  setCommentsLoading(true);
  try {
    const limit = 10;
    
    console.log('Loading comments for article:', articleIdToUse, 'page:', page);
    
    const response = await apiClient.get(`/articles/${articleIdToUse}/comments`, {
      params: { 
        page, 
        limit,
        depth: 2,
      }
    });
    
    console.log('Comments API Response:', {
      page,
      limit,
      loaded: response.data?.comments?.length,
      total: response.data?.meta?.total,
      hasMore: response.data?.meta?.hasMore
    });
    
    if (response.data?.comments) {
      const loadedComments = response.data.comments;
      
      // Process comments
      const processedComments = loadedComments.map(comment => ({
        ...comment,
        isLiked: comment.isLiked || false,
        likesCount: comment.likesCount || comment.likeCount || 0,
        replies: comment.replies?.map(reply => ({
          ...reply,
          isLiked: reply.isLiked || false,
          likesCount: reply.likesCount || reply.likeCount || 0
        })) || []
      }));
      
      if (page > 1) {
        // Load more pagination
        const updatedComments = [...comments, ...processedComments];
        setComments(updatedComments);
        setDisplayedComments(updatedComments);
      } else {
        // First load
        setComments(processedComments);
        // Always show only 2 initially
        setDisplayedComments(processedComments.slice(0, 2));
      }
      
      setHasMoreComments(response.data.meta?.hasMore || false);
      setCommentPage(page);
    }
  } catch (error) {
    console.error('Failed to load comments:', error);
  } finally {
    setCommentsLoading(false);
  }
};
// Function to show all comments
const handleShowAllComments = async () => {
  // If we haven't loaded all parent comments yet, load them
  if (hasMoreComments && comments.length < 10) {
    await loadComments(article?.id, 1, true);
  }
  // Show all loaded comments
  setDisplayedComments(comments);
};

// Function to show fewer comments (collapse)
const handleShowFewerComments = () => {
  setDisplayedComments(comments.slice(0, 2));
};

// New function to load all comments
const loadAllComments = async () => {
  await loadComments(article?.id, 1, true);
};



const loadMoreReplies = async (commentId: string) => {
  try {
    const response = await apiClient.get(`/articles/comments/${commentId}/replies`, {
      params: {
        page: 1,
        limit: 10,
      }
    });
    
    if (response.data?.replies) {
      // Update the specific comment with its replies
      const updateCommentWithReplies = (comments: any[]): any[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), ...response.data.replies],
              hasMoreReplies: response.data.meta?.hasMore || false
            };
          }
          
          // Recursively check nested replies
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateCommentWithReplies(comment.replies)
            };
          }
          
          return comment;
        });
      };
      
      setComments(prev => updateCommentWithReplies(prev));
      setDisplayedComments(prev => updateCommentWithReplies(prev));
    }
  } catch (error) {
    console.error('Failed to load replies:', error);
    notification.error({ message: 'Failed to load replies' });
  }
};

 // Load related articles with engagement score
const loadRelatedArticles = async (articleId: string) => {
  try {
    setRelatedLoading(true);
    
    // Use the correct endpoint that supports both ID and slug
    const response = await apiClient.get(`/articles/${articleId}/related`, {
      params: { limit: 3 }
    });
    
    console.log('📊 Related Articles Response:', {
      identifier: articleId,
      articles: response.data,
      count: response.data?.length
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
        engagementScore: calculateEngagementScore({
          viewCount: article._count?.views || 0,
          likeCount: article._count?.likes || 0,
          commentCount: article._count?.comments || 0
        })
      }));
      
      setRelatedArticles(articlesWithScore);
    } else {
      // Fallback to get related articles using the article service
      const fallbackResponse = await articleApi.getRelatedArticles(articleId, { limit: 3 });
      if (fallbackResponse?.data?.data) {
        const articlesWithScore: RelatedArticle[] = fallbackResponse.data.data.map((article: Article) => ({
          ...article,
          engagementScore: calculateEngagementScore(article)
        }));
        setRelatedArticles(articlesWithScore);
      }
    }
  } catch (error: any) {
    console.error('Failed to load related articles:', error);
    
    // Show user-friendly error message but don't crash
    if (error.response?.status !== 404) {
      notification.warning({
        message: 'Could not load related articles',
        description: 'Showing recent articles instead',
        duration: 3,
      });
    }
    
    // Fallback: Load recent articles
    try {
      const fallbackResponse = await articleApi.getArticles({ limit: 3 });
      if (fallbackResponse?.data?.data) {
        const articlesWithScore: RelatedArticle[] = fallbackResponse.data.data.map((article: Article) => ({
          ...article,
          engagementScore: calculateEngagementScore(article)
        }));
        setRelatedArticles(articlesWithScore);
      }
    } catch (fallbackError) {
      console.error('Failed to load fallback articles:', fallbackError);
      setRelatedArticles([]); // Set empty array to avoid errors
    }
  } finally {
    setRelatedLoading(false);
  }
};

// Enhanced engagement score calculation
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
    // Try alternative endpoint
    try {
      const fallbackResponse = await apiClient.get('/articles/categories/all');
      if (fallbackResponse?.data) {
        setCategories(fallbackResponse.data.slice(0, 8));
      }
    } catch (fallbackError) {
      console.error('Failed to load categories from fallback:', fallbackError);
    }
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

  // Handle like
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
      const response = await articleApi.likeArticle(article.id);
      
      let success = false;
      if (typeof response === 'object') {
        if ('success' in response) {
          success = response.success;
        } else if ('data' in response && typeof response.data === 'object' && 'success' in response.data) {
          success = response.data.success;
        } else {
          success = true;
        }
      }
      
      if (success) {
        notification.success({
          message: liked ? 'Article unliked' : 'Article liked!',
          duration: 2,
        });
      } else {
        throw new Error('Like operation failed');
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
        description: error.response?.data?.message || 'Failed to update like status.',
        duration: 3,
      });
    }

  };

  // Handle save
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
      const response = await articleApi.saveArticle(article.id);
      
      let success = false;
      if (typeof response === 'object') {
        if ('success' in response) {
          success = response.success;
        } else if ('data' in response && typeof response.data === 'object' && 'success' in response.data) {
          success = response.data.success;
        } else {
          success = true;
        }
      }
      
      if (success) {
        notification.success({
          message: saved ? 'Removed from saved articles' : 'Article saved!',
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
        description: error.response?.data?.message || 'Failed to save article.',
        duration: 3,
      });
    }
  };

  // Handle share
  const handleShare = () => {
    if (!article) return;
    
    const shareUrl = window.location.href;
    const shareTitle = article.title;
    const shareText = article.excerpt || 'Check out this article!';
    
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      })
      .then(() => {
        notification.success({ message: 'Article shared successfully!', duration: 2 });
        if (article.id) {
          articleApi.shareArticle(article.id, 'native').catch(console.error);
        }
      })
      .catch(console.error);
    } else {
      navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`)
        .then(() => {
          notification.success({ message: 'Link copied to clipboard!', duration: 2 });
        })
        .catch(() => {
          const textArea = document.createElement('textarea');
          textArea.value = `${shareTitle}\n${shareText}\n${shareUrl}`;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          notification.success({ message: 'Link copied to clipboard!', duration: 2 });
        });
    }
  };

  // Handle comment submission
 const handleCommentSubmit = async () => {
  if (article?.accessType === 'PREMIUM' && !userHasAccess) {
    setShowPaywall(true);
    return;
  }
  if (!checkAuth('comment')) return;
  if (!article?.id || !commentText.trim()) return;
  
  setCommenting(true);
  try {
    const response = await articleApi.addComment(article.id, {
      content: commentText,
    });
    
    if (response?.data) {
      notification.success({ 
        message: 'Comment added successfully!', 
        duration: 2,
        placement: 'top'
      });
      
      // Create the new comment object
      const newComment = {
        id: response.data.id || Date.now().toString(),
        content: commentText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likesCount: 0,
        isLiked: false,
        author: user ? {
          id: user.id,
          name: user.name || user.username,
          picture: user.picture || user.avatar,
          username: user.username
        } : { 
          id: 'temp-user',
          name: 'You',
          username: 'you'
        },
        replies: [],
        replyCount: 0,
        isOwn: true,
        isEdited: false,
        isPinned: false,
        isFeatured: false,
        language: 'en',
        user: user ? {
          id: user.id,
          name: user.name || user.username,
          picture: user.picture || user.avatar,
          username: user.username
        } : null
      };
      
      // IMMEDIATELY ADD TO COMMENTS STATE
      setComments(prev => {
        // Add new comment at the beginning
        const updated = [newComment, ...prev];
        return updated;
      });
      
      // Also update displayed comments
      setDisplayedComments(prev => {
        if (prev.length <= 2) {
          // If showing only 2 comments, keep showing them but update the list
          return [newComment, ...prev.slice(0, 1)];
        } else {
          // If showing all, add to beginning
          return [newComment, ...prev];
        }
      });
      
      // Update comment count on article
      setArticle(prev => prev ? {
        ...prev,
        commentCount: (prev.commentCount || 0) + 1
      } : null);
      
      // Clear the input
      setCommentText('');
      
      // Scroll to show the new comment
      setTimeout(() => {
        const newCommentElement = document.getElementById(`comment-${newComment.id}`);
        if (newCommentElement) {
          newCommentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  } catch (error: any) {
    console.error('Comment submission error:', error);
    notification.error({
      message: 'Error',
      description: error.response?.data?.message || 'Failed to add comment.',
      duration: 3,
      placement: 'top'
    });
  } finally {
    setCommenting(false);
  }
};

  // Replace your handleCommentLike function with this debug version:
const handleCommentLike = async (commentId: string) => {
  if (!checkAuth('like')) return;
  
  console.log('🔵 Like button clicked for comment:', commentId);
  
  // Prevent multiple simultaneous requests
  if (fetchInProgressRef.current) {
    console.log('⏳ Request already in progress, skipping...');
    return;
  }
  
  fetchInProgressRef.current = true;
  
  try {
    // Find the comment to get current like status
    const findComment = (comments: any[]): any => {
      for (const comment of comments) {
        if (comment.id === commentId) {
          return comment;
        }
        if (comment.replies && comment.replies.length > 0) {
          const found = findComment(comment.replies);
          if (found) return found;
        }
      }
      return null;
    };
    
    const comment = findComment(comments);
    if (!comment) {
      console.log('❌ Comment not found:', commentId);
      return;
    }
    
    const previousLiked = comment.isLiked || false;
    const previousCount = comment.likesCount || comment.likeCount || 0;
    
    console.log('📊 Previous state:', { previousLiked, previousCount });
    
    // OPTIMISTIC UPDATE: Update UI immediately
    const updateCommentLikes = (comments: any[]): any[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likesCount: previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1,
            likeCount: previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1,
            isLiked: !previousLiked,
          };
        }
        
        // Check replies
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateCommentLikes(comment.replies),
          };
        }
        
        return comment;
      });
    };
    
    setComments(prev => updateCommentLikes(prev));
    
    // Update displayed comments as well
    setDisplayedComments(prev => updateCommentLikes(prev));
    
    console.log('📡 Making API call to like/unlike comment...');
    
    // Make API call - the endpoint should handle both like and unlike
    const response = await articleApi.likeComment(commentId);
    
    console.log('📦 API Response:', response);
    
    // Check if response is successful
    const isSuccess = 
      response?.success === true || 
      response?.status === 201 || 
      response?.status === 200 ||
      (response?.data && (response.data.success === true || response.data.liked !== undefined));
    
    console.log('✅ Is success?', isSuccess);
    
    if (!isSuccess) {
      console.log('❌ API call failed, reverting optimistic update');
      
      const revertUpdate = (comments: any[]): any[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likesCount: previousCount,
              likeCount: previousCount,
              isLiked: previousLiked,
            };
          }
          
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: revertUpdate(comment.replies),
            };
          }
          
          return comment;
        });
      };
      
      setComments(prev => revertUpdate(prev));
      setDisplayedComments(prev => revertUpdate(prev));
      
      notification.error({
        message: 'Error',
        description: response?.error || 'Failed to like comment',
      });
    } else {
      console.log('✅ Action successful!');
      
      // Update with server response if available
      if (response.data?.liked !== undefined || response.data?.isLiked !== undefined) {
        const serverLiked = response.data.liked || response.data.isLiked;
        const serverLikesCount = response.data.likesCount || response.data.likeCount;
        
        const updateWithServerData = (comments: any[]): any[] => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                likesCount: serverLikesCount !== undefined ? serverLikesCount : (previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1),
                likeCount: serverLikesCount !== undefined ? serverLikesCount : (previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1),
                isLiked: serverLiked,
              };
            }
            
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateWithServerData(comment.replies),
              };
            }
            
            return comment;
          });
        };
        
        setComments(prev => updateWithServerData(prev));
        setDisplayedComments(prev => updateWithServerData(prev));
      }
      
      // Show success notification
      notification.success({
        message: previousLiked ? 'Comment unliked!' : 'Comment liked!',
        duration: 1,
        placement: 'top'
      });
    }
  } catch (error) {
    console.error('🚨 Failed to like comment:', error);
    
    notification.error({
      message: 'Error',
      description: 'Failed to like comment',
    });
  } finally {
    fetchInProgressRef.current = false;
  }
};

  // Handle comment reply
  const handleReply = (commentId: string) => {
    if (!checkAuth('reply')) return;

    setReplyTo(commentId);
    setShowCommentModal(true);
  };

  // Handle comment delete
  const handleCommentDelete = async (commentId: string) => {
    Modal.confirm({
      title: 'Delete Comment',
      content: 'Are you sure you want to delete this comment? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await articleApi.deleteComment(commentId);
          notification.success({ message: 'Comment deleted successfully!', duration: 2 });
          if (article?.id) {
            await loadComments(article.id);
            // Update comment count
            setArticle({
              ...article,
              commentCount: Math.max(0, (article.commentCount || 0) - 1)
            });
          }
        } catch (error) {
          notification.error({
            message: 'Error',
            description: 'Failed to delete comment.',
            duration: 3,
          });
        }
      }
    });
  };

  // Enhanced content rendering with proper image and link handling
  const shouldShowPaywall = article?.accessType === 'PREMIUM' && !userHasAccess;
  const renderContent = () => {
    if (!article?.content) {
      return (
        <div className="article-content">
        <Paragraph className="whitespace-pre-wrap leading-relaxed text-foreground">
          {article?.plainText || article?.excerpt || 'No content available.'}
        </Paragraph>
        </div>
      );
      
    }
    if (typeof article.content === 'string') {
      // Check if it's HTML content
      if (article.content.includes('<') && article.content.includes('>')) {
        // Process HTML content for better styling
        const processedContent = article.content
          .replace(/<a\s+href="([^"]+)"[^>]*>/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="article-link">')
          .replace(/<img([^>]+)>/g, '<img$1 class="article-image" />')
          .replace(/<h1/g, '<h1 class="article-heading"')
          .replace(/<h2/g, '<h2 class="article-heading"')
          .replace(/<h3/g, '<h3 class="article-heading"')
          .replace(/<h4/g, '<h4 class="article-heading"')
          .replace(/<h5/g, '<h5 class="article-heading"')
          .replace(/<h6/g, '<h6 class="article-heading"')
          .replace(/<blockquote/g, '<blockquote class="article-blockquote"')
          .replace(/<pre/g, '<pre class="article-pre"')
          .replace(/<code/g, '<code class="article-code"');
        
        return (
          <div 
            className="article-content"
            dangerouslySetInnerHTML={{ __html: processedContent }} 
          />
        );
      } else {
        // Plain text content
        return (
          <div className="article-content">
            {article.content.split('\n').map((paragraph, index) => (
              <Paragraph key={index} className="text-foreground leading-relaxed mb-6">
                {paragraph}
              </Paragraph>
            ))}
          </div>
        );
      }
    }

    if (typeof article.content === 'object' && article.content.type === 'doc') {
      try {
        return renderTipTapContent(article.content);
      } catch (error) {
        console.error('Error rendering TipTap content:', error);
        return (
          <Paragraph className="whitespace-pre-wrap leading-relaxed text-foreground">
            {article.plainText || article.excerpt || 'Content could not be rendered.'}
          </Paragraph>
        );
      }
    }

    // Fallback
    return (
      <Paragraph className="whitespace-pre-wrap leading-relaxed text-foreground">
        {article.plainText || article.excerpt || 'No content available.'}
      </Paragraph>
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
  
  // Fix the image URL if it's relative
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
  
  // Simple fix: always use localhost:3000 for development
  // You can also use window.location.origin for production
  const baseUrl = 'http://localhost:3000';
  
  // Clean up the URL
  let cleanUrl = url;
  if (cleanUrl.startsWith('/')) {
    cleanUrl = cleanUrl.substring(1);
  }
  
  // Check if it's already in the correct format
  if (cleanUrl.includes('localhost:3000')) {
    return `http://${cleanUrl}`;
  }
  
  // For uploads, use the correct endpoint
  if (cleanUrl.startsWith('uploads/') || cleanUrl.startsWith('articles/')) {
    return `${baseUrl}/${cleanUrl}`;
  }
  
  // Default: prepend the base URL
  return `${baseUrl}/uploads/articles/${cleanUrl}`;
};

  return (
    <div key={index} className="my-8 text-center">
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Image
          src={getFullImageUrl(imageSrc)}
          alt={node.attrs?.alt || article?.title}
          className="w-full h-auto max-h-[600px] object-contain"
          fallback={
            <div className="w-full h-64 flex items-center justify-center">
              <PictureOutlined className="text-4xl text-gray-300" />
            </div>
          }
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
            console.warn('Image failed to load, using fallback');
            
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600/cccccc/969696?text=Image+Not+Found';
          }}
        />
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
              renderNode(child, `${index}-${childIndex}`, depth + 1)
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

  // Render related article card
const renderArticleCard = (item: RelatedArticle) => {
  const engagementScore = item.engagementScore || calculateEngagementScore(item);
  const engagementLabel = getEngagementLabel(engagementScore);
  const engagementPercentage = Math.min(Math.round(engagementScore), 100);
  
  // Format view count
  const formatViewCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };
  
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
            <Image
              src={item.coverImage}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <ReadOutlined className="text-4xl text-gray-300 dark:text-gray-600" />
                </div>
              }
              preview={{
                visible: false,
              }}
              onError={(e) => {
                console.warn('Related article image failed to load');
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
              <ReadOutlined className="text-4xl text-primary/40" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {item.isPremium && (
              <Tag color="purple" icon={<CrownOutlined />} className="m-0 px-2 py-1 text-xs">
                Premium
              </Tag>
            )}
            {item.isFeatured && (
              <Tag color="gold" icon={<StarOutlined />} className="m-0 px-2 py-1 text-xs">
                Featured
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
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Tooltip title="Reading time">
                <Space size={4}>
                  <ClockCircleOutlined />
                  <span>{getReadingTimeText(item.readingTime || 1)}</span>
                </Space>
              </Tooltip>
            </div>
          </div>
          
          {/* Stats & Engagement */}
          <div className="pt-2 space-y-2">
            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <Tooltip title="Views">
                <Space size={4}>
                  <EyeOutlined />
                  <span>{formatViewCount(item.viewCount || 0)}</span>
                </Space>
              </Tooltip>
              
              <Tooltip title="Likes">
                <Space size={4}>
                  <HeartOutlined />
                  <span>{formatViewCount(item.likeCount || 0)}</span>
                </Space>
              </Tooltip>
              
              <Tooltip title="Comments">
                <Space size={4}>
                  <CommentOutlined />
                  <span>{formatViewCount(item.commentCount || 0)}</span>
                </Space>
              </Tooltip>
            </div>
            
            {/* Engagement Progress */}
            {engagementScore > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Text className="text-xs text-muted-foreground">Engagement</Text>
                  <Text className="text-xs font-medium" style={{ color: engagementLabel.color }}>
                    {engagementPercentage}%
                  </Text>
                </div>
                <Progress 
                  percent={engagementPercentage} 
                  size="small" 
                  showInfo={false}
                  strokeColor={engagementLabel.color}
                  trailColor="var(--color-border)"
                />
              </div>
            )}
          </div>
          
          {/* Time ago */}
          {item.publishedAt && (
            <div className="text-right">
              <Text type="secondary" className="text-xs">
                {getTimeAgo(item.publishedAt)}
              </Text>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};


  // Render comment item with proper nested replies
const renderComment = (comment: any, depth = 0) => {
  const getAuthor = (comment: any) => comment.author || comment.user;
  const author = getAuthor(comment);
  const isOwnComment = isCurrentUserComment(comment);
  const isEditing = editingComment === comment.id;
  const isReplying = replyingTo === comment.id;
  
  // Toggle replies visibility
  const showReplies = expandedReplies[comment.id];
  
  // Calculate time ago
  const getTimeAgo = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (seconds < 60) return 'Just now';
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
      if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      return 'Recently';
    }
  };

  const isNested = depth > 0;
  const levelClass = `comment-level-${Math.min(depth, 4)}`;

  return (
    <div 
      key={comment.id} 
      id={`comment-${comment.id}`}
      className={`comment-item ${isNested ? 'comment-nested' : ''} ${levelClass}`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="relative">
          <Avatar 
            src={author?.picture}
            icon={!author?.picture && <UserOutlined />}
            size={isNested ? "small" : "default"}
            className={`comment-avatar ${isOwnComment ? 'ring-2 ring-blue-500' : ''}`}
          >
            {author?.name?.charAt(0)}
          </Avatar>
        </div>
        
        {/* Comment content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Text 
                  strong 
                  className="text-foreground text-sm cursor-pointer hover:underline"
                  onClick={() => author?.id && window.open(`/profile/${author.id}`, '_blank')}
                  title={author?.name}
                >
                  {author?.name}
                </Text>
                {isOwnComment && (
                  <Tag color="blue" size="small" className="!text-xs !m-0">You</Tag>
                )}
                <Text type="secondary" className="text-xs whitespace-nowrap">
                  {getTimeAgo(comment.createdAt)}
                  {comment.isEdited && (
                    <span className="ml-2 text-xs text-gray-400 italic">(edited)</span>
                  )}
                </Text>
              </div>
            </div>
            
            {/* Edit/Delete Menu - Only show for comment owner */}
            {(isOwnComment || comment.isOwn) && (
              <Dropdown menu={{
                items: [
                  {
                    key: 'edit',
                    label: 'Edit',
                    icon: <EditOutlined />,
                    onClick: () => handleEditComment(comment)
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => handleCommentDelete(comment.id)
                  },
                  {
                    key: 'flag',
                    label: 'Report',
                    icon: <FlagOutlined />,
                    onClick: () => {
                      notification.info({ message: 'Report feature coming soon!' });
                    }
                  }
                ]
              }} trigger={['click']}>
                <Button 
                  type="text" 
                  icon={<MoreOutlined />} 
                  size="small" 
                  className="text-muted-foreground flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                />
              </Dropdown>
            )}
          </div>
          
          {/* Comment Content - Edit or View */}
          {isEditing ? (
            <div className="mb-4">
              <TextArea
                value={editCommentText}
                onChange={(e) => setEditCommentText(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 6 }}
                className="mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="small"
                  onClick={() => handleSaveEdit(comment.id)}
                  type="primary"
                >
                  Save
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setEditingComment(null);
                    setEditCommentText('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Paragraph className="text-foreground mb-3 text-sm leading-relaxed break-words whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              {comment.content}
            </Paragraph>
          )}
          
          {/* Comment Actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 mb-4">
              <Button
                type="link"
                size="small"
                icon={comment.isLiked ? <LikeFilled className="text-blue-500" /> : <LikeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleCommentLike(comment.id);
                }}
                className={`comment-like-button flex items-center gap-1 px-2 py-1 rounded transition-all ${
                  comment.isLiked 
                    ? 'liked text-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
                disabled={fetchInProgressRef.current}
                style={{
                  fontWeight: comment.isLiked ? '600' : '400'
                }}
              >
                <span 
                  className={`text-xs font-medium ${
                    comment.isLiked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {comment.likesCount || comment.likeCount || 0}
                </span>
              </Button>
              
              <Button
                type="text"
                size="small"
                icon={<SendOutlined />}
                onClick={() => {
                  if (replyingTo === comment.id) {
                    setReplyingTo(null);
                  } else {
                    setReplyingTo(comment.id);
                    setReplyText('');
                  }
                }}
                className="flex items-center text-blue gap-1 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded"
              >
                <span className="text-xs font-medium">Reply</span>
              </Button>
              
              {/* Show/Hide Replies Button */}
              {comment.replies && comment.replies.length > 0 && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => setExpandedReplies(prev => ({
                    ...prev,
                    [comment.id]: !prev[comment.id]
                  }))}
                  className="!text-xs !px-2 !py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {showReplies ? 'Hide replies' : `View ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
                </Button>
              )}
            </div>
          )}
          
          {/* Reply Form (Facebook style - inline) */}
          {isReplying && (
            <div className="mb-4 ml-2">
              <div className="flex gap-3">
                <Avatar 
                  size="small"
                  src={user?.picture}
                  icon={<UserOutlined />}
                  className="flex-shrink-0"
                />
                <div className="flex-1">
                  <TextArea
                    placeholder={`Reply to ${author?.name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    className="mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      onClick={() => handleReplySubmit(comment.id)}
                      type="primary"
                      loading={replyLoading}
                      disabled={!replyText.trim()}
                    >
                      Reply
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Replies Section */}
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply: any) => renderComment(reply, depth + 1))}
              
              {/* Load more replies button */}
              {comment.hasMoreReplies && (
                <div className="text-center">
                  <Button
                    type="link"
                    size="small"
                    onClick={() => loadMoreReplies(comment.id)}
                    className="!text-xs"
                  >
                    Load more replies...
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};






  const handleReplySubmit = async (commentId: string) => {
  if (!checkAuth('reply')) return;
  if (!article?.id || !replyText.trim()) return;
  
  setReplyLoading(true);
  try {
    // Generate a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    
    // Create the reply object for optimistic update
    const newReply = {
      id: tempId,
      content: replyText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likesCount: 0,
      isLiked: false,
      author: user ? {
        id: user.id,
        name: user.name || user.username,
        picture: user.picture || user.avatar,
        username: user.username
      } : { 
        id: 'temp-user',
        name: 'You',
        username: 'you'
      },
      replies: [],
      replyCount: 0,
      isOwn: true,
      isEdited: false,
      isPinned: false,
      isFeatured: false,
      language: 'en',
      user: user ? {
        id: user.id,
        name: user.name || user.username,
        picture: user.picture || user.avatar,
        username: user.username
      } : null,
      parentId: commentId
    };
    
    // OPTIMISTIC UPDATE: Add reply immediately
    const addReplyToComment = (comments: any[]): any[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [newReply, ...(comment.replies || [])],
            replyCount: (comment.replyCount || 0) + 1
          };
        }
        
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: addReplyToComment(comment.replies)
          };
        }
        
        return comment;
      });
    };
    
    setComments(prev => addReplyToComment(prev));
    setDisplayedComments(prev => addReplyToComment(prev));
    
    // Expand replies for this comment
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: true
    }));
    
    // Clear reply form
    setReplyText('');
    setReplyingTo(null);
    
    // Update article comment count
    setArticle(prev => prev ? {
      ...prev,
      commentCount: (prev.commentCount || 0) + 1
    } : null);
    
    // Make API call
    const response = await articleApi.addComment(article.id, {
      content: replyText,
      parentId: commentId
    });
    
    if (response?.data) {
      // Replace temp ID with real ID from server
      const updateTempReply = (comments: any[]): any[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            const updatedReplies = comment.replies.map((reply: any) => 
              reply.id === tempId 
                ? { ...reply, id: response.data.id }
                : reply
            );
            return { ...comment, replies: updatedReplies };
          }
          
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateTempReply(comment.replies)
            };
          }
          
          return comment;
        });
      };
      
      setComments(prev => updateTempReply(prev));
      setDisplayedComments(prev => updateTempReply(prev));
      
      notification.success({ 
        message: 'Reply added successfully!', 
        duration: 2,
        placement: 'top'
      });
    }
  } catch (error: any) {
    console.error('Failed to add reply:', error);
    
    // Remove the optimistic update on error
    const removeTempReply = (comments: any[]): any[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          const filteredReplies = comment.replies.filter((reply: any) => !reply.id.includes('temp-'));
          return {
            ...comment,
            replies: filteredReplies,
            replyCount: Math.max(0, (comment.replyCount || 0) - 1)
          };
        }
        
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: removeTempReply(comment.replies)
          };
        }
        
        return comment;
      });
    };
    
    setComments(prev => removeTempReply(prev));
    setDisplayedComments(prev => removeTempReply(prev));
    
    // Restore article comment count
    setArticle(prev => prev ? {
      ...prev,
      commentCount: Math.max(0, (prev.commentCount || 0) - 1)
    } : null);
    
    notification.error({
      message: 'Error',
      description: error.response?.data?.message || 'Failed to add reply.',
      duration: 3,
    });
  } finally {
    setReplyLoading(false);
  }
};

  

  if (loading) {
    return <ArticleSkeleton />;
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <Title level={2} className="!mb-4 text-foreground">Article Not Found</Title>
          <Paragraph className="text-muted-foreground mb-6">
            The article "{slug}" could not be loaded or doesn't exist.
          </Paragraph>
          <Space>
            <Button type="primary" onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button onClick={() => window.location.href = '/dashboard/articles'}>
              Browse Articles
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
        <div className="fixed top-0 left-0 w-full h-1 z-50">
          <div 
            className="h-full bg-gradient-to-r from-primary via-primary/80 to-secondary transition-all duration-300"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button 
            type="link" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => window.history.back()}
            className="text-foreground hover:text-primary hover:no-underline flex items-center gap-2"
          >
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <Tooltip title={liked ? "Unlike" : "Like"}>
              <Button
                type="text"
                icon={liked ? <HeartFilled className="text-red-500" /> : <HeartOutlined className="text-red-500"/>}
                onClick={handleLike}
                className="text-foreground hover:text-red-500"
              >
                <span className="ml-1">{article.likeCount || 0}</span>
              </Button>
            </Tooltip>
            
            <Tooltip title="Comments">
              <Button
                type="text"
                icon={<CommentOutlined />}
                onClick={scrollToComments}
                className="text-foreground hover:text-primary"
              >
                <span className="ml-1">{article.commentCount || 0}</span>
              </Button>
            </Tooltip>
            
            <Tooltip title="Share">
              <Button
                type="text"
                icon={<ShareAltOutlined />}
                onClick={handleShare}
                className="text-foreground hover:text-primary"
              >
                Share
              </Button>
            </Tooltip>

            {/* Font Size Controls */}
            <Tooltip title="Reading Settings">
              <Button
                type="text"
                icon={<ReadOutlined />}
                onClick={() => setShowReadingSettings(true)}
                className="text-muted-foreground hover:text-primary"
              >
                Fonts
              </Button>
            </Tooltip>
            
            {/* Language Switcher */}
            {article && article.availableLanguages && article.availableLanguages.length > 0 && (
              <LanguageSwitcher
                availableLanguages={article.availableLanguages}
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
                isLoading={isTranslating}
                articleId={article.id}
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card 
          className="border-none shadow-none bg-transparent"
          styles={{ body: { padding: 0 } }}
        >
          {/* Article Header */}
          <div className="mb-10">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {article.isFeatured && (
                <Tag color="gold" icon={<StarOutlined />} className="m-0">
                  Featured
                </Tag>
              )}
              {article.isTrending && (
                <Tag color="volcano" icon={<FireOutlined />} className="m-0">
                  Trending
                </Tag>
              )}
              {article.accessType === 'PREMIUM' && (
                <Tag color="purple" icon={<CrownOutlined />} className="m-0">
                  Premium
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 p-4 bg-card rounded-xl border">
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
                    {article.author?.name || 'Anonymous'}
                    {article.author?.isVerified && (
                      <Badge count="✓" color="green" className="ml-2" />
                    )}
                  </Text>
                  <Text type="secondary" className="text-sm">
                    Published {new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                <Tooltip title="Reading time">
                  <Space>
                    <ClockCircleOutlined />
                    <Text>{article.readingTime || 5} min read</Text>
                  </Space>
                </Tooltip>
                <Tooltip title="Views">
                  <Space>
                    <EyeOutlined className="text-blue-500"/>
                    <Text>{(article.viewCount || 0).toLocaleString()}</Text>
                  </Space>
                </Tooltip>
                <Tooltip title="Likes">
                  <Space>
                    <HeartFilled className="text-red-500"/>
                    <Text >{(article.likeCount || 0).toLocaleString()}</Text>
                  </Space>
                </Tooltip>
                <Tooltip title="Comments">
                  <Space>
                    <CommentOutlined />
                    <Text>{(article.commentCount || 0).toLocaleString()}</Text>
                  </Space>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Cover Image */}
        
          {article.coverImage && (
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
)}

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
                id="article-content-wrapper"
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: lineHeight,
                  fontFamily: fontFamily,
                  color: 'var(--foreground)',
                }}
                className="article-content"
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
                  {liked ? 'Liked' : 'Like'} ({article.likeCount || 0})
                </Button>
                
                <Button
                  type={saved ? "primary" : "default"}
                  icon={saved ? <BookFilled /> : <BookOutlined />}
                  onClick={handleSave}
                  size="large"
                  className="flex items-center gap-2 min-w-[120px] shadow-sm"
                >
                  {saved ? 'Saved' : 'Save'}
                </Button>
                
                <Button
                  type="default"
                  icon={<CommentOutlined />}
                  onClick={scrollToComments}
                  size="large"
                  className="flex items-center gap-2 shadow-sm"
                >
                  Comment ({article.commentCount || 0})
                </Button>
                
                <Button
                  type="default"
                  icon={<ShareAltOutlined />}
                  onClick={handleShare}
                  size="large"
                  className="flex items-center gap-2 shadow-sm"
                >
                  Share
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
                    About {article.author.name}
                  </Title>
                  {article.author.bio && (
                    <Paragraph className="text-muted-foreground mb-6 leading-relaxed text-base">
                      {article.author.bio}
                    </Paragraph>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {article.author.isVerified && (
                      <Tag color="green" icon={<StarOutlined />} className="px-3 py-1">
                        Verified Author
                      </Tag>
                    )}
                    <Tag className="px-3 py-1">
                      <UserOutlined className="mr-2" />
                      {article.author.followersCount?.toLocaleString() || 0} followers
                    </Tag>
                  </div>
                </div>
              </div>
            </div>
          )} */}

          {/* Comments Section */}
<div id="comments-section" className="mb-10">
  <Title level={3} className="!mb-6 text-foreground flex items-center gap-3">
    <CommentOutlined className="text-primary" />
    Comments ({article?.commentCount || 0})
  </Title>
  
  {/* Add Comment Form */}
  <Card className="mb-8 shadow-sm border">
    <div className="flex gap-4">
      <Avatar 
        size="large"
        src={user?.picture}
        icon={<UserOutlined />}
        className="flex-shrink-0 border-2 border-primary/20"
      />
      <div className="flex-1">
        <TextArea
          placeholder="Share your thoughts on this article..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          autoSize={{ minRows: 3, maxRows: 6 }}
          className="mb-4 text-base"
        />
        <div className="flex justify-end">
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleCommentSubmit}
            loading={commenting}
            disabled={!commentText.trim()}
          >
            Add Comment
          </Button>
        </div>
      </div>
    </div>
  </Card>

  {/* Comments List */}
  {commentsLoading && displayedComments.length === 0 ? (
    <div className="text-center py-12">
      <Spin size="large" />
      <Paragraph className="mt-4 text-muted-foreground">Loading comments...</Paragraph>
    </div>
  ) : displayedComments.length > 0 ? (
    <div className="space-y-6">
      {/* Show comments count header */}
      <div className="flex justify-between items-center mb-4">
        <Text strong className="text-foreground">
          {displayedComments.length === comments.length ? 
            `All ${comments.length} parent comments` : 
            `Showing ${displayedComments.length} of ${comments.length} parent comments`}
          {article?.commentCount && article.commentCount > comments.length && 
            ` • ${article.commentCount} total comments`}
        </Text>
        
        {/* Show Collapse button when showing all */}
        {displayedComments.length > 2 && (
          <Button
            type="link"
            onClick={handleShowFewerComments}
            icon={<ArrowLeftOutlined rotate={90} />}
            className="text-sm"
          >
            Show Less
          </Button>
        )}
      </div>
      
      {/* Show displayed comments */}
      {displayedComments.map(comment => renderComment(comment))}
      
      {/* Action Buttons at the bottom */}
      <div className="flex flex-col gap-3 pt-6">
        {/* Show "View More Comments" button when only showing 2 */}
        {displayedComments.length === 2 && comments.length > 2 && (
          <div className="text-center">
            <Button 
              onClick={handleShowAllComments}
              loading={commentsLoading}
              type="primary"
              size="large"
              className="min-w-[200px]"
            >
              {commentsLoading ? 'Loading...' : `View ${comments.length - 2} More Comments`}
            </Button>
            <Paragraph className="text-sm text-muted-foreground mt-2">
              Showing 2 of {comments.length} parent comments
              {article?.commentCount && ` • ${article.commentCount} total comments`}
            </Paragraph>
          </div>
        )}
        
        {/* Show "Load More" button for pagination */}
        {displayedComments.length > 2 && hasMoreComments && (
          <div className="text-center">
            <Button 
              onClick={() => loadComments(article?.id, commentPage + 1)}
              loading={commentsLoading}
              type="primary"
              size="large"
              className="min-w-[200px]"
            >
              {commentsLoading ? 'Loading...' : 'Load More Comments'}
            </Button>
            <Paragraph className="text-sm text-muted-foreground mt-2">
              {comments.length} parent comments loaded
              {article?.commentCount && ` • ${article.commentCount} total comments`}
            </Paragraph>
          </div>
        )}
        
        {/* Show "Collapse Comments" button when showing many */}
        {displayedComments.length > 2 && (
          <div className="text-center">
            <Button 
              onClick={handleShowFewerComments}
              type="default"
              size="large"
              icon={<ArrowLeftOutlined rotate={90} />}
              className="min-w-[200px]"
            >
              Show Less Comments
            </Button>
            <Paragraph className="text-sm text-muted-foreground mt-2">
              Showing {displayedComments.length} of {comments.length} parent comments
            </Paragraph>
          </div>
        )}
      </div>
      
      <div ref={commentsEndRef} />
    </div>
  ) : (
    <div className="text-center py-12 border rounded-xl bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <CommentOutlined className="text-5xl text-muted-foreground mb-4" />
      <Title level={4} className="!mb-3 text-foreground">
        No comments yet
      </Title>
      <Paragraph className="text-muted-foreground mb-6 max-w-md mx-auto">
        Be the first to share your thoughts! Your comment could start an interesting discussion.
      </Paragraph>
    </div>
  )}
</div>

         {/* Related Articles Section */}
<div className="mb-12">
  <div className="flex items-center justify-between mb-6">
    <Title level={3} className="!mb-0 text-foreground flex items-center gap-3">
      <ReadOutlined className="text-primary" />
      Related Articles
      {relatedArticles.length > 0 && (
        <Tag color="blue" className="ml-2">
          {relatedArticles.length}
        </Tag>
      )}
    </Title>
    
    {article?.category && (
      <Button
        type="link"
        onClick={() => {
          window.location.href = `/dashboard/articles?category=${article.category?.slug}`;
        }}
        className="text-primary hover:text-primary/80 flex items-center gap-1"
        size="small"
      >
        View all in {article.category.name}
        <ArrowLeftOutlined className="ml-1 rotate-180" />
      </Button>
    )}
  </div>
  
  {relatedLoading ? (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <Card key={i} className="border animate-pulse h-full">
          <div className="space-y-4 p-4 h-full flex flex-col">
            {/* Skeleton Image */}
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            
            {/* Skeleton Title */}
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              
              {/* Skeleton Excerpt */}
              <div className="space-y-2 pt-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
            
            {/* Skeleton Footer */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  ) : (
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
                          "More Coming Soon",
                          "Discover More Articles",
                          "Explore Further"
                        ];
                        return messages[i] || "More Articles";
                      })()}
                    </Title>
                    
                    <Paragraph className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-[200px] mx-auto">
                      {(() => {
                        const descriptions = [
                          "We're working on more related content for you.",
                          "Check back soon for more articles on this topic.",
                          "Browse all articles to discover more great content."
                        ];
                        return descriptions[i] || "No related articles found.";
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
                      Browse All Articles
                    </Button>
                    
                    <Paragraph className="text-xs text-gray-400 dark:text-gray-500">
                      {relatedArticles.length === 0 ? (
                        "No articles found in this category yet."
                      ) : (
                        `Found ${relatedArticles.length} related article${relatedArticles.length !== 1 ? 's' : ''}`
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
                  No Related Articles
                </Title>
                
                <Paragraph className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  We couldn't find articles related to this one. 
                  Check out trending articles or browse by category.
                </Paragraph>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => loadTrendingArticles()}
                >
                  View Trending
                </Button>
                <Button 
                  type="default" 
                  size="small"
                  onClick={() => window.location.href = '/dashboard/articles'}
                >
                  Browse All
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )}
</div>
          {/* Categories Section */}
          {categories.length > 0 && (
            <div className="mb-10">
              <Title level={3} className="!mb-6 text-foreground flex items-center gap-3">
                <FolderOutlined className="text-primary" />
                Explore Categories
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
                Trending Now
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
                <Title level={3} className="!mb-4 text-foreground">
                  Enjoyed this article?
                </Title>
                <Paragraph className="text-muted-foreground mb-8 text-lg">
                  Join thousands of readers who get personalized recommendations, 
                  save their favorite articles, and never miss an update from our best writers.
                </Paragraph>
                <Space wrap className="justify-center gap-4">
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={() => window.location.href = '/dashboard/articles'}
                    icon={<ReadOutlined />}
                    className="px-8"
                  >
                    Explore More Articles
                  </Button>
                  <Button 
                    size="large"
                    onClick={() => window.location.href = '/auth/register'}
                    className="px-8"
                  >
                    Join Free Today
                  </Button>
                </Space>
                <Paragraph className="text-muted-foreground mt-6 text-sm">
                  Already have an account?{' '}
                  <Button type="link" onClick={() => window.location.href = '/auth/login'} className="p-0">
                    Sign in to save articles
                  </Button>
                </Paragraph>
              </div>
            </div>
          </div>
        </Card>
      </div>


      {/* CSS styles */}

                {/* font-size: 1.125rem;
          line-height: 1.8;
          color: var(--foreground); */}
      <style>{`
        .article-content {
          font-size: ${fontSize}px !important;
          line-height: ${lineHeight} !important;
          font-family: ${fontFamily} !important;
          color: var(--foreground) !important;
        }
        
        .article-content p,
        .article-content .ant-typography {
          font-size: ${fontSize}px !important;
          line-height: ${lineHeight} !important;
          font-family: ${fontFamily} !important;
          margin-bottom: 1.75rem !important;
        }
        
        .article-heading {
          font-weight: 700;
          margin-top: 2.5rem;
          margin-bottom: 1.5rem;
          color: var(--foreground);
          line-height: 1.3;
        }

        
        
        .article-link {
          color: var(--primary);
          text-decoration: underline;
          transition: all 0.2s;
          font-weight: 500;
        }
        
        .article-link:hover {
          color: var(--primary-dark);
          text-decoration: none;
        }
        
        .article-image {
          max-width: 100%;
          height: auto;
          border-radius: 0.75rem;
          margin: 2rem 0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        .article-blockquote {
          border-left: 4px solid var(--primary);
          padding-left: 1.75rem;
          margin: 2.5rem 0;
          font-style: italic;
          color: var(--foreground-muted);
          font-size: 1.1rem;
        }
        
        .article-pre {
          background-color: var(--background-muted);
          padding: 1.5rem;
          border-radius: 0.75rem;
          overflow-x: auto;
          margin: 2rem 0;
          font-family: 'SF Mono', Monaco, 'Cascadia Mono', 'Courier New', monospace;
          font-size: 0.95rem;
        }
        
        .article-code {
          background-color: var(--background-muted);
          padding: 0.2rem 0.5rem;
          border-radius: 0.375rem;
          font-family: monospace;
          font-size: 0.9em;
        }
        
        .article-code-block {
          display: block;
          white-space: pre;
          overflow-x: auto;
        }
        
        .tiptap-editor {
          min-height: 400px;
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          outline: none;
          font-size: 1rem;
          line-height: 1.6;
        }
        
        .tiptap-editor:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }
        
        .prose {
          color: var(--foreground);
        }
        
        .prose-lg {
          font-size: 1.125rem;
          line-height: 1.75;
        }
        
        .dark .prose-invert {
          color: #d1d5db;
        }
        
        .dark .prose-invert .article-link {
          color: #60a5fa;
        }
        
        .dark .prose-invert .article-heading {
          color: #f3f4f6;
        }
        
        .dark .article-blockquote {
          background-color: rgba(59, 130, 246, 0.05);
        }
        
        .dark .article-pre,
        .dark .article-code {
          background-color: #1f2937;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Facebook-style comment threading */
        .comment-thread {
          position: relative;
        }
        
        /* Main vertical line for nested comments */
        .comment-thread::before {
          content: '';
          position: absolute;
          left: 20px;
          top: 40px; /* Start below the avatar */
          bottom: 0;
          width: 2px;
          background-color: #e4e6eb;
        }
        
        .dark .comment-thread::before {
          background-color: #3a3b3c;
        }
        
        /* Individual comment container */
        .comment-item {
          position: relative;
          margin-bottom: 16px;
        }
        
        /* Horizontal connector line for nested comments */
        .comment-nested::before {
          content: '';
          position: absolute;
          left: -20px;
          top: 24px;
          width: 20px;
          height: 2px;
          background-color: #e4e6eb;
        }
        
        .dark .comment-nested::before {
          background-color: #3a3b3c;
        }
        
        /* Nesting levels */
        .comment-nested {
          margin-left: 40px;
          position: relative;
        }
        
        .comment-level-1 { margin-left: 40px; }
        .comment-level-2 { margin-left: 80px; }
        .comment-level-3 { margin-left: 120px; }
        .comment-level-4 { margin-left: 160px; }
        
        /* Avatar styling */
        .comment-avatar {
          position: relative;
          z-index: 2;
        }
        
        /* Comment content styling */
        .comment-content {
          background-color: rgb(243, 248, 248);
          border-radius: 18px;
          padding: 8px 12px;
          max-width: 600px;
        }
        
        .dark .comment-content {
          background-color: #3a3b3c;
        }
        
        /* Reply button styling */
        .reply-button {
          color: #65676b;
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
        }
        
        .reply-button:hover {
          background-color: #f0f2f5;
        }
        
        .dark .reply-button:hover {
          background-color: #3a3b3c;
        }
        
        /* Edit/Delete dropdown */
        .comment-actions-dropdown .ant-dropdown-menu {
          min-width: 140px;
        }
        
        /* Like button active state */
        .like-button-active {
          color: #1877f2 !important;
        }

        /* Ensure blue color for liked comments */
        .liked-comment-button .anticon {
          color: #1890ff !important;
        }
        
        .liked-comment-button span {
          color: #1890ff !important;
        }
        
        /* Comment like button states */
        .comment-like-button {
          transition: all 0.2s ease;
        }
        
        .comment-like-button.liked {
          color: #1890ff;
          background-color: rgba(24, 144, 255, 0.1);
        }
        
        .comment-like-button:hover:not(.liked) {
          color: #1890ff;
          background-color: rgba(24, 144, 255, 0.05);
        }
        
        /* Ensure icon color stays blue when liked */
        .anticon-heart-filled.text-blue-500 {
          color: #1890ff !important;
        }

        /* Comment like button - this is the most important fix */
        .comment-like-button.liked {
          color: #1890ff !important;
        }
        
        .comment-like-button.liked .anticon {
          color: #1890ff !important;
        }
        
        .comment-like-button.liked span {
          color: #1890ff !important;
        }
        
        /* Make sure the like button stays blue */
        .ant-btn:hover .anticon-heart-filled.text-blue-500,
        .ant-btn:focus .anticon-heart-filled.text-blue-500,
        .ant-btn:active .anticon-heart-filled.text-blue-500 {
          color: #1890ff !important;
        }
        
        /* Fix for Ant Design button override */
        .ant-btn-text:hover,
        .ant-btn-text:focus,
        .ant-btn-text:active {
          background-color: transparent !important;
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
        notification.success({
          message: 'Article Unlocked!',
          description: 'You now have full access to this premium article.',
          duration: 3,
        });
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

