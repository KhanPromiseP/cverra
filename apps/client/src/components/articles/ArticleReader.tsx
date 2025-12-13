// components/articles/ArticleReader.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Card, 
  Space, 
  Button, 
  Typography, 
  Divider, 
  Tag, 
  Avatar,
  Breadcrumb,
  Dropdown,
  Menu,
  Badge,
  Skeleton,
  Modal,
  notification,
  Row,
  Col,
  Tooltip,
  Progress,
  Select
} from 'antd';
import { 
  HeartOutlined, 
  HeartFilled,
  ShareAltOutlined,
  BookOutlined,
  BookFilled,
  CommentOutlined,
  FlagOutlined,
  GlobalOutlined,
  CrownOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
  MoreOutlined,
  CaretRightOutlined,
  ReadOutlined,
  StarOutlined,
  FireOutlined
} from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import articleApi, { Article, Comment } from '../../services/articleApi';
import CommentsSection from './CommentsSection';
import LanguageSwitcher from './LanguageSwitcher';
import PremiumPaywall from './PremiumPaywall';
import RelatedArticles from './RelatedArticles';
import ReadingProgress from './ReadingProgress';
import ClapButton from './ClapButton';
import { useAuthStore } from '@/client/stores/auth';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

interface ArticleReaderProps {
  slug?: string;
  showReadingProgress?: boolean;
}

interface ContentNode {
  type: string;
  attrs?: Record<string, any>;
  content?: ContentNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
}

// Safe navigation hook
const useSafeNavigate = () => {
  try {
    const navigate = useNavigate();
    const location = useLocation();
    return { navigate, location, isRouterReady: true };
  } catch (error) {
    console.warn('Router context not available, using fallback navigation');
    return {
      navigate: (path: string) => {
        window.location.href = path;
      },
      location: { pathname: window.location.pathname, state: null },
      isRouterReady: false
    };
  }
};

const ArticleReader: React.FC<ArticleReaderProps> = ({ 
  slug: propSlug, 
  showReadingProgress = true 
}) => {
  // Get slug from props or URL params
  const params = useParams<{ slug: string }>();
  const slug = propSlug || params.slug;
  
  // Use safe navigation
  const { navigate, location, isRouterReady } = useSafeNavigate();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [language, setLanguage] = useState('en');
  const [showPaywall, setShowPaywall] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { user } = useAuthStore();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (slug) {
      fetchArticle();
      trackReadingStart();
    } else {
      setLoading(false);
    }

    return () => {
      trackReadingEnd();
    };
  }, [slug, language]);

  useEffect(() => {
    // Setup intersection observer for reading progress
    if (contentRef.current && article?.content) {
      const contentElements = contentRef.current.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
      
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const visibleEntries = entries.filter(entry => entry.isIntersecting);
          if (visibleEntries.length > 0) {
            const progress = Math.min(
              Math.round((visibleEntries.length / contentElements.length) * 100),
              100
            );
            setReadingProgress(progress);
            
            // Update reading time based on progress
            if (progress > 0 && article?.readingTime) {
              const elapsedMinutes = (Date.now() - startTimeRef.current) / 60000;
              const estimatedReadingSpeed = article.readingTime / 100;
              const estimatedTime = Math.min(elapsedMinutes / estimatedReadingSpeed * 100, article.readingTime);
              setReadingTime(Math.round(estimatedTime));
            }
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );

      contentElements.forEach(el => observerRef.current?.observe(el));
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [article, loading]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      // Check if articleApi has getArticleBySlug method
      const response = await articleApi.getArticleBySlug?.(slug!, language) || 
                       await articleApi.getArticle?.(slug!, language);
      
      if (response && response.data) {
        const articleData = response.data;
        setArticle(articleData);
        setLiked(articleData.isLiked || false);
        setSaved(articleData.isSaved || false);
        
        // Track view
        if (articleData.id) {
          articleApi.trackArticleView?.(articleData.id).catch(console.error);
        }
        
        // Check if premium content requires access
        const userHasAccess = user?.subscription?.isActive || false;
        if (articleData.accessType === 'PREMIUM' && !articleData.isPreview && !userHasAccess) {
          setShowPaywall(true);
        }
        
        // Fetch comments
        if (articleData.id) {
          fetchComments(articleData.id);
        }
      } else {
        throw new Error('Failed to load article');
      }
    } catch (error: any) {
      console.error('Failed to load article:', error);
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to load article. Please try again.',
      });
      
      // Only navigate if router is ready
      if (isRouterReady) {
        navigate('/dashboard/articles');
      } else {
        window.location.href = '/dashboard/articles';
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (articleId: string) => {
    try {
      const response = await articleApi.getComments?.(articleId, { limit: 50 });
      if (response && response.data) {
        setComments(response.data.data || response.data || []);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const trackReadingStart = () => {
    startTimeRef.current = Date.now();
  };

  const trackReadingEnd = () => {
    if (article && readingProgress > 10 && article.id) {
      const duration = Date.now() - startTimeRef.current;
      articleApi.trackArticleView?.(article.id, Math.floor(duration / 1000))
        .catch(console.error);
    }
  };

  const handleLike = async () => {
    if (!article || !article.id) return;
    
    const previousState = liked;
    const previousCount = article.likeCount || 0;
    
    // Optimistic update
    setLiked(!liked);
    setArticle(prev => prev ? {
      ...prev,
      likeCount: liked ? (prev.likeCount || 0) - 1 : (prev.likeCount || 0) + 1,
      isLiked: !liked
    } : null);
    
    try {
      const response = await articleApi.likeArticle?.(article.id, language);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to like');
      }
      
      notification.success({
        message: liked ? 'Article unliked' : 'Article liked!',
        duration: 2,
      });
    } catch (error: any) {
      // Revert optimistic update
      setLiked(previousState);
      setArticle(prev => prev ? {
        ...prev,
        likeCount: previousCount,
        isLiked: previousState
      } : null);
      
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to update like status',
      });
    }
  };

  const handleSave = async () => {
    if (!article || !article.id) return;
    
    const previousState = saved;
    
    // Optimistic update
    setSaved(!saved);
    setArticle(prev => prev ? {
      ...prev,
      isSaved: !saved
    } : null);
    
    try {
      const response = await articleApi.saveArticle?.(article.id, language);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to save');
      }
      
      notification.success({
        message: saved ? 'Removed from saved articles' : 'Article saved!',
        description: saved ? '' : 'You can find it in your reading list',
        duration: 3,
      });
    } catch (error: any) {
      // Revert optimistic update
      setSaved(previousState);
      setArticle(prev => prev ? {
        ...prev,
        isSaved: previousState
      } : null);
      
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to save article',
      });
    }
  };

  const handleShare = async (platform: string) => {
    if (!article) return;
    
    const shareUrl = window.location.href;
    const shareText = `${article.title} by ${article.author?.name || 'Unknown Author'}`;
    
    const shareConfigs: Record<string, { url: string; popup?: boolean }> = {
      twitter: {
        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        popup: true,
      },
      facebook: {
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        popup: true,
      },
      linkedin: {
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        popup: true,
      },
      whatsapp: {
        url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
        popup: false,
      },
      copy: {
        url: shareUrl,
        popup: false,
      },
    };

    try {
      if (platform === 'copy') {
        await navigator.clipboard.writeText(shareUrl);
        notification.success({
          message: 'Link copied!',
          description: 'Article link copied to clipboard',
        });
      } else {
        const config = shareConfigs[platform];
        if (config.popup) {
          window.open(config.url, '_blank', 'width=600,height=400');
        } else {
          window.location.href = config.url;
        }
        
        // Track share if article has ID
        if (article.id) {
          await articleApi.shareArticle?.(article.id, platform, language);
        }
        
        notification.success({
          message: 'Shared!',
          description: `Article shared to ${platform}`,
        });
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleClap = async (count: number) => {
    if (!article || !article.id) return;
    
    const previousCount = article.clapCount || 0;
    
    // Optimistic update
    setArticle(prev => prev ? {
      ...prev,
      clapCount: (prev.clapCount || 0) + count
    } : null);
    
    try {
      await articleApi.clapArticle?.(article.id, count, language);
    } catch (error) {
      // Revert optimistic update
      setArticle(prev => prev ? {
        ...prev,
        clapCount: previousCount
      } : null);
      console.error('Failed to clap:', error);
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    if (newLanguage === language) return;
    
    setIsTranslating(true);
    try {
      // If the article is already available in this language, fetch it
      if (article?.availableLanguages?.includes(newLanguage)) {
        setLanguage(newLanguage);
      } else {
        notification.info({
          message: 'Translation in progress',
          description: 'This article is being translated. Please wait...',
          duration: 3,
        });
        setLanguage(newLanguage);
      }
    } catch (error) {
      notification.error({
        message: 'Translation failed',
        description: 'Could not translate the article. Please try again.',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAddComment = async (content: string, parentId?: string) => {
    if (!article || !article.id) return;
    
    try {
      const response = await articleApi.addComment?.(article.id, { content, parentId });
      if (response?.success && response.data) {
        const newComment = response.data;
        setComments(prev => {
          if (parentId) {
            // Find parent comment and add reply
            return prev.map(comment => {
              if (comment.id === parentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newComment],
                };
              }
              return comment;
            });
          } else {
            return [newComment, ...prev];
          }
        });
        
        // Update article comment count
        setArticle(prev => prev ? {
          ...prev,
          commentCount: (prev.commentCount || 0) + 1
        } : null);
        
        return true;
      }
      return false;
    } catch (error: any) {
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to add comment',
      });
      return false;
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await articleApi.likeComment?.(commentId);
      if (response?.success) {
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likesCount: (comment.likesCount || 0) + (comment.isLiked ? -1 : 1),
              isLiked: !comment.isLiked,
            };
          }
          return comment;
        }));
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Modal.confirm({
      title: 'Delete Comment',
      content: 'Are you sure you want to delete this comment? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await articleApi.deleteComment?.(commentId);
          if (response?.success) {
            setComments(prev => prev.filter(comment => comment.id !== commentId));
            
            // Update article comment count
            setArticle(prev => prev ? {
              ...prev,
              commentCount: Math.max(0, (prev.commentCount || 0) - 1)
            } : null);
            
            notification.success({
              message: 'Comment deleted',
            });
          }
        } catch (error) {
          notification.error({
            message: 'Error',
            description: 'Failed to delete comment',
          });
        }
      },
    });
  };

  const handleReportComment = async (commentId: string) => {
    let selectedReason = 'inappropriate';
    
    Modal.confirm({
      title: 'Report Comment',
      content: (
        <div>
          <p>Please select a reason for reporting this comment:</p>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Select reason"
            defaultValue="inappropriate"
            onChange={(value: string) => { selectedReason = value; }}
          >
            <Option value="spam">Spam or misleading</Option>
            <Option value="harassment">Harassment or hate speech</Option>
            <Option value="inappropriate">Inappropriate content</Option>
            <Option value="other">Other</Option>
          </Select>
        </div>
      ),
      onOk: async () => {
        try {
          await articleApi.reportComment?.(commentId, selectedReason);
          notification.success({
            message: 'Comment reported',
            description: 'Thank you for helping us maintain a safe community.',
          });
        } catch (error) {
          notification.error({
            message: 'Error',
            description: 'Failed to report comment',
          });
        }
      },
    });
  };

  const renderContent = useCallback(() => {
    if (!article?.content) {
      return article?.plainText ? (
        <Paragraph style={{ marginBottom: '1.5em', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {article.plainText}
        </Paragraph>
      ) : null;
    }

    // Handle both TipTap JSON and plain text
    if (typeof article.content === 'string') {
      return (
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {article.content.split('\n\n').map((paragraph, index) => (
            <Paragraph key={index} style={{ marginBottom: '1.5em', lineHeight: 1.8 }}>
              {paragraph}
            </Paragraph>
          ))}
        </div>
      );
    }

    // Render TipTap JSON content
    const renderNode = (node: ContentNode): React.ReactNode => {
      if (!node) return null;

      switch (node.type) {
        case 'doc':
          return <div>{node.content?.map(renderNode)}</div>;
        
        case 'paragraph':
          return (
            <Paragraph style={{ marginBottom: '1.5em', lineHeight: 1.8 }}>
              {node.content?.map(renderNode)}
            </Paragraph>
          );
        
        case 'heading':
          const level = node.attrs?.level || 1;
          const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
          return (
            <Title level={level as 1 | 2 | 3 | 4 | 5} style={{ 
              marginTop: level === 1 ? '0.5em' : '1.5em',
              marginBottom: '0.5em',
              fontWeight: 600,
              scrollMarginTop: '100px'
            }}>
              {node.content?.map(renderNode)}
            </Title>
          );
        
        case 'text':
          let element = <span>{node.text}</span>;
          
          if (node.marks) {
            node.marks.forEach((mark: any) => {
              switch (mark.type) {
                case 'bold':
                  element = <strong>{element}</strong>;
                  break;
                case 'italic':
                  element = <em>{element}</em>;
                  break;
                case 'underline':
                  element = <u>{element}</u>;
                  break;
                case 'link':
                  element = (
                    <a 
                      href={mark.attrs?.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#1890ff',
                        textDecoration: 'underline',
                      }}
                    >
                      {element}
                    </a>
                  );
                  break;
                case 'code':
                  element = <code style={{ 
                    backgroundColor: '#f6f8fa',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                    fontSize: '0.9em'
                  }}>{element}</code>;
                  break;
                case 'highlight':
                  element = <mark style={{ backgroundColor: '#fffacd' }}>{element}</mark>;
                  break;
              }
            });
          }
          
          return element;
        
        case 'bulletList':
          return (
            <ul style={{ 
              marginBottom: '1.5em', 
              paddingLeft: '2em',
              listStyleType: 'disc'
            }}>
              {node.content?.map(renderNode)}
            </ul>
          );
        
        case 'orderedList':
          return (
            <ol style={{ 
              marginBottom: '1.5em', 
              paddingLeft: '2em',
              listStyleType: 'decimal'
            }}>
              {node.content?.map(renderNode)}
            </ol>
          );
        
        case 'listItem':
          return <li style={{ marginBottom: '0.5em' }}>{node.content?.map(renderNode)}</li>;
        
        case 'blockquote':
          return (
            <blockquote style={{
              borderLeft: '4px solid #1890ff',
              margin: '1.5em 0',
              paddingLeft: '1em',
              fontStyle: 'italic',
              color: '#666',
              backgroundColor: '#fafafa',
              padding: '16px',
              borderRadius: '4px',
            }}>
              {node.content?.map(renderNode)}
            </blockquote>
          );
        
        case 'image':
          return (
            <div style={{ margin: '2em 0', textAlign: 'center' }}>
              <img
                src={node.attrs?.src}
                alt={node.attrs?.alt || ''}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                loading="lazy"
              />
              {node.attrs?.alt && (
                <Paragraph type="secondary" style={{ 
                  marginTop: '8px', 
                  fontSize: '14px',
                  fontStyle: 'italic'
                }}>
                  {node.attrs.alt}
                </Paragraph>
              )}
            </div>
          );
        
        case 'horizontalRule':
          return <Divider style={{ margin: '2em 0' }} />;
        
        case 'codeBlock':
          return (
            <pre style={{
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              padding: '16px',
              borderRadius: '8px',
              overflowX: 'auto',
              margin: '1.5em 0',
              fontSize: '14px',
            }}>
              <code>{node.content?.[0]?.text || ''}</code>
            </pre>
          );
        
        default:
          console.warn('Unknown node type:', node.type);
          return null;
      }
    };

    return renderNode(article.content as ContentNode);
  }, [article]);

  if (loading) {
    return <ArticleSkeleton />;
  }

  if (!article) {
    return (
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '48px 16px',
        textAlign: 'center' 
      }}>
        <Title level={3}>Article not found</Title>
        <Paragraph type="secondary">
          The article you're looking for doesn't exist or has been removed.
        </Paragraph>
        <Button 
          type="primary" 
          onClick={() => {
            if (isRouterReady) {
              navigate('/dashboard/articles');
            } else {
              window.location.href = '/dashboard/articles';
            }
          }}
          style={{ marginTop: 16 }}
        >
          Browse Articles
        </Button>
      </div>
    );
  }

  const shareMenu = (
    <Menu>
      <Menu.Item key="twitter" onClick={() => handleShare('twitter')}>
        <span role="img" aria-label="twitter">🐦</span> Share on Twitter
      </Menu.Item>
      <Menu.Item key="facebook" onClick={() => handleShare('facebook')}>
        <span role="img" aria-label="facebook">📘</span> Share on Facebook
      </Menu.Item>
      <Menu.Item key="linkedin" onClick={() => handleShare('linkedin')}>
        <span role="img" aria-label="linkedin">💼</span> Share on LinkedIn
      </Menu.Item>
      <Menu.Item key="whatsapp" onClick={() => handleShare('whatsapp')}>
        <span role="img" aria-label="whatsapp">💬</span> Share on WhatsApp
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="copy" onClick={() => handleShare('copy')}>
        <span role="img" aria-label="copy">🔗</span> Copy Link
      </Menu.Item>
    </Menu>
  );

  const moreMenu = (
    <Menu>
      <Menu.Item key="report" icon={<FlagOutlined />} danger>
        Report Article
      </Menu.Item>
      <Menu.Item key="download" icon={<DownloadOutlined />}>
        Download PDF
      </Menu.Item>
      <Menu.Item key="audio" icon={<CaretRightOutlined />}>
        Listen to Audio
      </Menu.Item>
      {user?.id === article.author?.id && (
        <>
          <Menu.Divider />
          <Menu.Item key="edit" onClick={() => {
            if (isRouterReady) {
              navigate(`/editor/${article.id}`);
            } else {
              window.location.href = `/editor/${article.id}`;
            }
          }}>
            Edit Article
          </Menu.Item>
          <Menu.Item key="stats" onClick={() => {
            if (isRouterReady) {
              navigate(`/articles/${article.slug}/stats`);
            } else {
              window.location.href = `/articles/${article.slug}/stats`;
            }
          }}>
            View Stats
          </Menu.Item>
        </>
      )}
    </Menu>
  );

  // Check if user has subscription access
  const userHasSubscriptionAccess = user?.subscription?.isActive || false;
  const showPreviewContent = article.accessType === 'PREMIUM' && article.isPreview && !userHasSubscriptionAccess;

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      minHeight: '100vh',
      backgroundColor: '#fff'
    }}>
      {/* Reading Progress Bar */}
      {showReadingProgress && (
        <div style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
          <Progress 
            percent={readingProgress} 
            showInfo={false}
            strokeColor={{
              '0%': '#1890ff',
              '100%': '#52c41a',
            }}
            strokeWidth={2}
            style={{ 
              margin: 0,
              borderRadius: 0
            }}
          />
        </div>
      )}

      {/* Back Navigation */}
      <div style={{ padding: '16px 24px 0' }}>
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => {
            if (isRouterReady) {
              navigate(location.state?.from || '/dashboard/articles');
            } else {
              window.location.href = '/dashboard/articles';
            }
          }}
          style={{ 
            marginBottom: 16,
            paddingLeft: 0,
            color: '#666'
          }}
        >
          Back to Articles
        </Button>

        <Breadcrumb
          items={[
            { 
              title: 'Articles', 
              href: '/dashboard/articles',
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                if (isRouterReady) {
                  navigate('/dashboard/articles');
                } else {
                  window.location.href = '/dashboard/articles';
                }
              }
            },
            { 
              title: article.category?.name || 'Uncategorized', 
              href: `/dashboard/articles?category=${article.category?.slug || 'all'}`,
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                if (isRouterReady) {
                  navigate(`/dashboard/articles?category=${article.category?.slug || 'all'}`);
                } else {
                  window.location.href = `/dashboard/articles?category=${article.category?.slug || 'all'}`;
                }
              }
            },
            { title: article.title },
          ]}
          style={{ marginBottom: 24 }}
        />
      </div>

      <Card
        style={{ 
          border: 'none',
          borderRadius: '0',
          boxShadow: 'none',
          marginBottom: 48
        }}
        bodyStyle={{ padding: '0 24px 24px' }}
      >
        {/* Article Header */}
        <div style={{ marginBottom: 32 }}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* Badges */}
            <Space wrap>
              {article.isFeatured && (
                <Badge.Ribbon text="Featured" color="gold" />
              )}
              {article.isTrending && (
                <Tag color="volcano" icon={<FireOutlined />}>
                  Trending
                </Tag>
              )}
              {article.accessType === 'PREMIUM' && (
                <Tag color="purple" icon={<CrownOutlined />}>
                  Premium
                </Tag>
              )}
              {article.isLiked && (
                <Tag color="red" icon={<HeartOutlined />}>
                  You liked this
                </Tag>
              )}
              {article.isSaved && (
                <Tag color="blue" icon={<BookOutlined />}>
                  Saved
                </Tag>
              )}
            </Space>

            {/* Title */}
            <Title level={1} style={{ 
              margin: 0, 
              lineHeight: 1.2,
              fontSize: '2.5rem'
            }}>
              {article.title}
            </Title>
            
            {/* Excerpt */}
            {article.excerpt && (
              <Paragraph type="secondary" style={{ 
                fontSize: '18px', 
                margin: 0,
                color: '#666'
              }}>
                {article.excerpt}
              </Paragraph>
            )}
            
            {/* Author and Metadata */}
            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col flex="auto">
                <Space>
                  <Avatar 
                    size={48} 
                    src={article.author?.picture}
                    style={{ 
                      backgroundColor: article.category?.color || '#1890ff',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (isRouterReady) {
                        navigate(`/author/${article.author?.id}`);
                      } else {
                        window.location.href = `/author/${article.author?.id}`;
                      }
                    }}
                  >
                    {article.author?.name?.charAt(0) || 'A'}
                  </Avatar>
                  <div>
                    <Text strong style={{ fontSize: '16px', display: 'block' }}>
                      {article.author?.name || 'Anonymous'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Published {new Date(article.publishedAt || article.createdAt || Date.now()).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {article.updatedAt && article.updatedAt !== article.createdAt && (
                        <span>
                          {' • Updated '}
                          {new Date(article.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      )}
                    </Text>
                  </div>
                </Space>
              </Col>
              
              <Col>
                <Space split={<Divider type="vertical" />}>
                  <Space size={4}>
                    <ClockCircleOutlined />
                    <Text type="secondary">{article.readingTime || 5} min</Text>
                  </Space>
                  
                  <Space size={4}>
                    <EyeOutlined />
                    <Text type="secondary">{(article.viewCount || 0).toLocaleString()}</Text>
                  </Space>
                  
                  <Tooltip title={`Reading time: ${readingTime} min`}>
                    <Space size={4}>
                      <ReadOutlined />
                      <Text type="secondary">{readingProgress}%</Text>
                    </Space>
                  </Tooltip>
                </Space>
              </Col>
            </Row>
          </Space>
        </div>

        {/* Cover Image */}
        {article.coverImage && (
          <div style={{ 
            position: 'relative', 
            height: '400px', 
            overflow: 'hidden',
            marginBottom: 32,
            borderRadius: '12px'
          }}>
            <img
              src={article.coverImage}
              alt={article.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        )}

        {/* Language Switcher */}
        {article.availableLanguages && article.availableLanguages.length > 1 && (
          <div style={{ marginBottom: 24 }}>
            <LanguageSwitcher
              currentLanguage={language}
              availableLanguages={article.availableLanguages}
              onChange={handleLanguageChange}
              loading={isTranslating}
            />
          </div>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <Space wrap>
              {article.tags.map(tag => (
                <Tag 
                  key={tag} 
                  style={{ 
                    cursor: 'pointer',
                    borderRadius: '16px',
                    padding: '4px 12px'
                  }}
                  onClick={() => {
                    if (isRouterReady) {
                      navigate(`/dashboard/articles?tag=${tag}`);
                    } else {
                      window.location.href = `/dashboard/articles?tag=${tag}`;
                    }
                  }}
                >
                  #{tag}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* Fixed Action Bar */}
        <div style={{
          position: 'sticky',
          top: 70,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          padding: '12px 0',
          margin: '0 -24px 32px',
          borderBottom: '1px solid #f0f0f0',
          zIndex: 10,
        }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Space>
                <Button
                  type="text"
                  icon={liked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                  onClick={handleLike}
                  size="large"
                  style={{ minWidth: 80 }}
                >
                  <span style={{ marginLeft: 8 }}>{article.likeCount || 0}</span>
                </Button>

                <ClapButton
                  count={article.clapCount || 0}
                  onClap={handleClap}
                  size="large"
                />

                <Button
                  type="text"
                  icon={saved ? <BookFilled style={{ color: '#1890ff' }} /> : <BookOutlined />}
                  onClick={handleSave}
                  size="large"
                >
                  <span style={{ marginLeft: 8 }}>Save</span>
                </Button>

                <Dropdown overlay={shareMenu} placement="bottom">
                  <Button type="text" icon={<ShareAltOutlined />} size="large">
                    Share
                  </Button>
                </Dropdown>
              </Space>
            </Col>
            
            <Col>
              <Dropdown overlay={moreMenu} placement="bottomRight">
                <Button type="text" icon={<MoreOutlined />} size="large" />
              </Dropdown>
            </Col>
          </Row>
        </div>

        {/* Article Content */}
        <div 
          ref={contentRef}
          style={{ 
            fontSize: '18px',
            lineHeight: 1.8,
            color: '#2c3e50',
          }}
        >
          {showPreviewContent ? (
            <>
              <div style={{ marginBottom: 32 }}>
                {renderContent()}
              </div>
              <PremiumPaywall
                article={article}
                onPurchase={() => setShowPaywall(true)}
              />
            </>
          ) : (
            renderContent()
          )}
        </div>

        {/* Translation Notice */}
        {article.language && article.language !== 'en' && (
          <div style={{
            marginTop: 48,
            padding: 16,
            backgroundColor: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 8,
          }}>
            <Space>
              <GlobalOutlined />
              <Text>
                This article has been translated from English. 
                {article.translationQuality && 
                  ` Translation quality: ${article.translationQuality}/5`
                }
              </Text>
            </Space>
          </div>
        )}

        {/* Author Bio */}
        {article.author?.bio && (
          <>
            <Divider />
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              marginBottom: 32,
              padding: 24,
              backgroundColor: '#fafafa',
              borderRadius: '8px'
            }}>
              <Avatar 
                size={64} 
                src={article.author.picture}
                style={{ 
                  marginRight: 16,
                  flexShrink: 0
                }}
              >
                {article.author.name?.charAt(0) || 'A'}
              </Avatar>
              <div style={{ flex: 1 }}>
                <Title level={4} style={{ margin: '0 0 8px' }}>
                  Written by {article.author.name || 'Anonymous'}
                </Title>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  {article.author.bio}
                </Paragraph>
              </div>
            </div>
          </>
        )}

        {/* Engagement Footer */}
        <Divider />
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 32,
          padding: 32,
          backgroundColor: '#f0f8ff',
          borderRadius: '12px'
        }}>
          <Space direction="vertical" size={24}>
            <Text strong style={{ fontSize: '20px' }}>
              Enjoyed this article?
            </Text>
            <Space>
              <Button
                type="primary"
                icon={liked ? <HeartFilled /> : <HeartOutlined />}
                onClick={handleLike}
                size="large"
                style={{ minWidth: 120 }}
              >
                {liked ? 'Liked' : 'Like'} ({article.likeCount || 0})
              </Button>
              
              <ClapButton
                count={article.clapCount || 0}
                onClap={handleClap}
                showCount
                size="large"
              />
              
              <Button
                type="default"
                icon={<CommentOutlined />}
                onClick={() => {
                  const commentsSection = document.getElementById('comments');
                  if (commentsSection) {
                    commentsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                size="large"
                style={{ minWidth: 140 }}
              >
                Comment ({article.commentCount || 0})
              </Button>
            </Space>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Your engagement helps more people discover this content
            </Text>
          </Space>
        </div>

        {/* Comments Section */}
        <Divider />
        <div id="comments" style={{ marginTop: 32 }}>
          <Title level={3} style={{ marginBottom: 24 }}>
            Comments ({article.commentCount || 0})
          </Title>
          <CommentsSection
            articleId={article.id}
            comments={comments}
            onAddComment={handleAddComment}
            onLikeComment={handleLikeComment}
            onDeleteComment={handleDeleteComment}
            onReportComment={handleReportComment}
          />
        </div>
      </Card>

      {/* Related Articles */}
      {article.id && (
        <RelatedArticles 
          articleId={article.id}
          categoryId={article.category?.id}
          tags={article.tags}
          style={{ marginBottom: 48 }}
        />
      )}

      {/* Premium Paywall Modal */}
      {article.accessType === 'PREMIUM' && (
        <PremiumPaywall
          article={article}
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          onPurchaseSuccess={() => {
            setShowPaywall(false);
            fetchArticle(); // Refresh article to show full content
          }}
        />
      )}
    </div>
  );
};

const ArticleSkeleton: React.FC = () => (
  <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
    <Skeleton.Button active style={{ width: 100, marginBottom: 16 }} />
    <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 24 }} />
    
    <Card>
      <Skeleton.Image active style={{ width: '100%', height: 400, marginBottom: 32 }} />
      <Skeleton active title paragraph={{ rows: 2 }} />
      <Skeleton active paragraph={{ rows: 8 }} style={{ marginTop: 32 }} />
    </Card>
  </div>
);

export default ArticleReader;