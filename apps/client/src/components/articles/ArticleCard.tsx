import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, Avatar, Typography, Tag, Button, Dropdown, Menu, Tooltip, Badge } from 'antd';
import {
  StarOutlined,
  FireOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  HeartOutlined,
  HeartFilled,
  BookOutlined,
  BookFilled,
  MoreOutlined,
  CrownOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  ArrowRightOutlined,
  CoffeeOutlined
} from '@ant-design/icons';
import { Article } from '@/client/services/articleApi';
import { useAuthStore } from '@/client/stores/auth';
import './ArticleCard.css';

const { Title, Paragraph } = Typography;

export interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'featured' | 'compact' | 'minimal';
  showActions?: boolean;
  showCategory?: boolean;
  showTags?: boolean;
  showAuthor?: boolean;
  showStats?: boolean;
  onClick?: (article: Article) => void;
  onLike?: (articleId: string) => Promise<void>;
  onSave?: (articleId: string) => Promise<void>;
  onShare?: (articleId: string) => void;
  onReport?: (articleId: string) => void;
  className?: string;
}

// Helper function to truncate text with ellipsis
const truncateText = (text: string | undefined, maxLength: number = 120): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Helper function to extract plain text from TipTap JSON or other formats
const extractPlainText = (content: any): string => {
  if (!content) return '';
  
  if (typeof content === 'string') {
    return content;
  }
  
  if (typeof content === 'object') {
    // Handle TipTap JSON format
    if (content.type === 'doc' && content.content) {
      const extractTextFromNodes = (nodes: any[]): string => {
        let text = '';
        for (const node of nodes) {
          if (node.type === 'text' && node.text) {
            text += node.text + ' ';
          }
          if (node.content && Array.isArray(node.content)) {
            text += extractTextFromNodes(node.content);
          }
        }
        return text.trim();
      };
      return extractTextFromNodes(content.content);
    }
    
    // Handle plain object with text property
    if (content.text) return content.text;
    
    // Try to stringify as last resort
    try {
      return JSON.stringify(content);
    } catch (error) {
      return '';
    }
  }
  
  return String(content);
};

const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  variant = 'default',
  showActions = true,
  showCategory = true,
  showTags = true,
  showAuthor = true,
  showStats = true,
  onClick,
  onLike,
  onSave,
  onShare,
  onReport,
  className = ''
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(article.isLiked || false);
  const [isSaved, setIsSaved] = useState(article.isSaved || false);
  const [likeCount, setLikeCount] = useState(article.likeCount || 0);

  const isPremiumAccess = article.accessType === 'PREMIUM' && 
    (user?.subscription?.status === 'ACTIVE' || article.isPreview === false);

  const readingTimeColor = (article.readingTime || 5) < 3 ? 'text-green-500' :
                          (article.readingTime || 5) < 8 ? 'text-yellow-500' :
                          'text-blue-500';

  const getReadingTimeLabel = () => {
    const readingTime = article.readingTime || 5;
    if (readingTime < 3) return 'Quick Read';
    if (readingTime < 8) return 'Medium Read';
    return 'Deep Dive';
  };

  // Get article excerpt or create one from content
  const getExcerpt = (): string => {
    if (article.excerpt) {
      return truncateText(article.excerpt, 120);
    }
    
    if (article.content) {
      const plainText = extractPlainText(article.content);
      return truncateText(plainText, 120);
    }
    
    return '';
  };

  // Get short excerpt for compact/minimal views
  const getShortExcerpt = (): string => {
    if (article.excerpt) {
      return truncateText(article.excerpt, 80);
    }
    
    if (article.content) {
      const plainText = extractPlainText(article.content);
      return truncateText(plainText, 80);
    }
    
    return '';
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(article);
    } else {
      navigate(`/dashboard/article/${article.slug}`);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike) {
      try {
        await onLike(article.id);
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      } catch (error) {
        console.error('Failed to like article:', error);
      }
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSave) {
      try {
        await onSave(article.id);
        setIsSaved(!isSaved);
      } catch (error) {
        console.error('Failed to save article:', error);
      }
    }
  };

  const moreMenu = (
    <Menu>
      <Menu.Item 
        key="share" 
        icon={<GlobalOutlined />}
        onClick={(e) => {
          e.domEvent.stopPropagation();
          onShare?.(article.id);
        }}
      >
        Share
      </Menu.Item>
      <Menu.Item 
        key="report" 
        icon={<FireOutlined />}
        onClick={(e) => {
          e.domEvent.stopPropagation();
          onReport?.(article.id);
        }}
      >
        Report
      </Menu.Item>
      {article.accessType === 'PREMIUM' && !isPremiumAccess && (
        <Menu.Item 
          key="upgrade" 
          icon={<CrownOutlined />}
          onClick={(e) => {
            e.domEvent.stopPropagation();
            navigate('/dashboard/subscription');
          }}
        >
          Upgrade to Premium
        </Menu.Item>
      )}
    </Menu>
  );

  const renderFeaturedLayout = () => (
    <div className="flex flex-col md:flex-row items-stretch h-full min-h-[320px]">
      {/* Cover Image - Fixed aspect ratio */}
      <div className="md:w-1/2 h-64 md:h-full relative cursor-pointer overflow-hidden bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-xl mb-4 md:mb-0 md:mr-6">
        {article.coverImage ? (
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-blue-500/20">
            <div className="text-6xl font-bold text-indigo-500/30">
              {article.title?.charAt(0) || 'A'}
            </div>
          </div>
        )}
        
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg">
            <StarOutlined className="mr-1" /> Featured
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="md:w-1/2 flex flex-col justify-between p-4">
        <div>
          {showAuthor && (
            <div className="flex items-center gap-2 mb-3">
              <Avatar 
                size="small"
                src={article.author?.picture}
                className="border-2 border-white dark:border-gray-800"
              >
                {article.author?.name?.charAt(0) || 'A'}
              </Avatar>
              <span className="text-sm font-medium text-foreground dark:text-gray-300">
                {truncateText(article.author?.name, 20)}
              </span>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
              <span className={`text-sm font-medium ${readingTimeColor}`}>
                <ClockCircleOutlined className="mr-1" />
                {article.readingTime || 5} min • {getReadingTimeLabel()}
              </span>
            </div>
          )}

          <Title level={3} className="mb-3 text-2xl font-bold text-foreground dark:text-white line-clamp-2">
            {truncateText(article.title, 60)}
          </Title>
          
          <Paragraph className="text-muted-foreground dark:text-gray-400 mb-4 text-base line-clamp-3 min-h-[72px]">
            {getExcerpt()}
          </Paragraph>

          {showTags && article.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.slice(0, 4).map((tag: string) => (
                <Tag
                  key={tag}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    // You can add tag filter logic here
                  }}
                >
                  #{truncateText(tag, 15)}
                </Tag>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          {showStats && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <EyeOutlined className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-muted-foreground dark:text-gray-400">
                  {(article.viewCount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HeartOutlined className="text-blue-500 dark:text-blue-400" />
                <span className="text-sm text-muted-foreground dark:text-gray-400">
                  {likeCount.toLocaleString()}
                </span>
              </div>
            </div>
          )}
          
          <Button 
            type="primary"
            size="large"
            className="bg-gradient-to-r from-indigo-500 to-blue-500 border-0"
            onClick={handleCardClick}
          >
            Read Article <ArrowRightOutlined />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderDefaultLayout = () => (
    <>
      {/* Article Cover Image - Fixed height */}
      <div className="h-48 relative cursor-pointer overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-gray-800 dark:to-gray-700 mb-4 rounded-lg">
        {article.coverImage ? (
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 dark:from-gray-700 dark:to-gray-600">
            <div className="text-5xl font-bold text-primary/30 dark:text-gray-500">
              {article.title?.charAt(0) || 'A'}
            </div>
          </div>
        )}
        
        {/* Premium Badge */}
        {article.accessType === 'PREMIUM' && (
          <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm z-10 shadow-lg ${
            isPremiumAccess 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
          }`}>
            <CrownOutlined /> 
            {isPremiumAccess ? (
              <><CheckCircleOutlined className="mr-1" /> UNLOCKED</>
            ) : (
              'PREMIUM'
            )}
          </div>
        )}
        
        {/* Quick Read Badge */}
        {variant === 'compact' && article.readingTime && article.readingTime < 5 && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium bg-green-500/90 text-white">
            <CoffeeOutlined className="mr-1" /> Quick Read
          </div>
        )}
        
        {/* Category and Tags Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
          <div className="flex flex-col gap-1">
            {showCategory && article.category?.name && (
              <div>
                <span className="px-2 py-1 rounded text-xs font-medium bg-primary/20 text-primary-foreground dark:bg-gray-700 dark:text-gray-200 border border-primary/30 dark:border-gray-600">
                  {truncateText(article.category.name, 15)}
                </span>
              </div>
            )}
            <div className="flex gap-1">
              {article.isFeatured && (
                <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  <StarOutlined className="mr-1" /> Featured
                </span>
              )}
              {article.isTrending && (
                <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-300 border border-red-500/30">
                  <FireOutlined className="mr-1" /> Trending
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick actions overlay */}
        {showActions && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <button
              className="p-1.5 bg-black/50 hover:bg-black/70 dark:bg-gray-800/50 dark:hover:bg-gray-700/70 text-white rounded backdrop-blur-sm transition-colors"
              onClick={handleLike}
            >
              {isLiked ? (
                <HeartFilled className="text-red-400" />
              ) : (
                <HeartOutlined />
              )}
            </button>
            <button
              className="p-1.5 bg-black/50 hover:bg-black/70 dark:bg-gray-800/50 dark:hover:bg-gray-700/70 text-white rounded backdrop-blur-sm transition-colors"
              onClick={handleSave}
            >
              {isSaved ? (
                <BookFilled className="text-blue-400" />
              ) : (
                <BookOutlined />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Article Content */}
      <div className="mb-3 min-h-[72px] flex flex-col justify-between">
        <h3 className="font-semibold text-base mb-2 text-foreground dark:text-gray-100 line-clamp-2">
          {truncateText(article.title, 60)}
        </h3>
        {variant !== 'minimal' && (
          <p className="text-sm text-muted-foreground dark:text-gray-400 line-clamp-3 flex-grow">
            {getExcerpt()}
          </p>
        )}
      </div>
      
      {/* Tags */}
      {showTags && article.tags?.length > 0 && variant !== 'minimal' && (
        <div className="flex flex-wrap gap-1 mb-3">
          {article.tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="px-2 py-1 rounded-full text-xs cursor-pointer bg-secondary hover:bg-secondary/80 dark:bg-gray-700 dark:hover:bg-gray-600 text-secondary-foreground dark:text-gray-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                // Add tag filter logic here
              }}
            >
              #{truncateText(tag, 12)}
            </span>
          ))}
        </div>
      )}
      
      {/* Author and Reading Time */}
      <div className="flex items-center justify-between mb-3">
        {showAuthor && (
          <div className="flex items-center gap-2">
            <Avatar 
              size="small"
              src={article.author?.picture}
              className="border-2 border-background dark:border-gray-800"
            >
              {article.author?.name?.charAt(0) || 'A'}
            </Avatar>
            <span className="text-xs font-medium text-foreground dark:text-gray-300">
              {truncateText(article.author?.name, 20)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <ClockCircleOutlined className={`text-xs ${readingTimeColor}`} />
          <span className={`text-xs ${readingTimeColor}`}>
            {article.readingTime || 5} min
          </span>
        </div>
      </div>
      
      {/* Stats and Actions */}
      <div className="flex justify-between items-center mt-auto pt-3 border-t border-border dark:border-gray-700">
        {showStats && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <EyeOutlined className="text-xs text-muted-foreground text-blue-500 dark:text-blue-500" />
              <span className="text-xs text-muted-foreground dark:text-gray-500">
                {(article.viewCount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {isLiked ? (
                <HeartFilled className="text-xs text-red-500" />
              ) : (
                <HeartOutlined className="text-xs text-muted-foreground text-red-500 dark:text-red-500" />
              )}
              <span className="text-xs text-muted-foreground dark:text-gray-500">
                {likeCount.toLocaleString()}
              </span>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {article.availableLanguages?.length > 1 && (
            <Tooltip title={`Available in ${article.availableLanguages?.length || 0} languages`}>
              <GlobalOutlined className="text-blue-400 dark:text-blue-400 cursor-pointer" />
            </Tooltip>
          )}
          {showActions && (
            <Dropdown overlay={moreMenu} trigger={['click']}>
              <button 
                className="p-1 text-muted-foreground hover:text-foreground dark:text-gray-500 dark:hover:text-gray-300"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreOutlined />
              </button>
            </Dropdown>
          )}
        </div>
      </div>
      
      {/* Read Article Button */}
      {variant !== 'minimal' && (
        <button
          className={`mt-4 w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
            article.accessType === 'PREMIUM' && !isPremiumAccess
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
              : 'bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white'
          }`}
          onClick={handleCardClick}
        >
          {article.accessType === 'PREMIUM' && !isPremiumAccess ? (
            <>
              <LockOutlined />
              Unlock Premium
            </>
          ) : (
            <>
              <ArrowRightOutlined />
              Read Article
            </>
          )}
        </button>
      )}
    </>
  );

  const renderCompactLayout = () => (
    <div className="flex gap-4 items-start h-full">
      {/* Thumbnail */}
      <div className="w-24 h-20 flex-shrink-0 relative rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
        {article.coverImage ? (
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-2xl font-bold text-primary/30">
              {article.title?.charAt(0) || 'A'}
            </div>
          </div>
        )}
        
        {article.accessType === 'PREMIUM' && (
          <div className="absolute bottom-0 right-0">
            <CrownOutlined className="text-xs text-yellow-500 bg-black/50 p-0.5 rounded-tl" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
        <div>
          <h4 className="font-semibold text-sm mb-1 text-foreground dark:text-gray-100 line-clamp-2">
            {truncateText(article.title, 50)}
          </h4>
          <p className="text-xs text-muted-foreground dark:text-gray-400 line-clamp-2 mb-2">
            {getShortExcerpt()}
          </p>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground dark:text-gray-500">
            {truncateText(article.author?.name, 15)}
          </span>
          <span className="flex items-center gap-1">
            <ClockCircleOutlined className="text-gray-400" />
            {article.readingTime || 5} min
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`article-card article-card-${variant} h-full ${className}`}>
      <Card
        hoverable={variant !== 'minimal'}
        className={`h-full relative overflow-hidden transition-all duration-300 group-hover:scale-[1.02] bg-card dark:bg-gray-900 text-card-foreground dark:text-gray-100 border border-border dark:border-gray-700 shadow-sm hover:shadow-lg dark:hover:shadow-gray-800/50 ${
          variant === 'featured' ? 'featured-article-card min-h-[320px]' : 'min-h-[480px]'
        }`}
        styles={{ 
          body: { 
            padding: variant === 'featured' ? 24 : 16,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          },
        }}
        onClick={handleCardClick}
      >
        {variant === 'featured' 
          ? renderFeaturedLayout()
          : variant === 'compact' || variant === 'minimal'
          ? renderCompactLayout()
          : renderDefaultLayout()
        }
      </Card>
    </div>
  );
};

export default ArticleCard;
export { ArticleCard };