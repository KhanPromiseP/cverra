// components/articles/RelatedArticles.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Space, 
  Tag, 
  Button, 
  Skeleton,
  Tooltip,
  Badge,
  Avatar,
  Divider
} from 'antd';
import { 
  ArrowRightOutlined, 
  FireOutlined, 
  StarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  HeartOutlined,
  CrownOutlined,
  BookOutlined,
  CommentOutlined,
  ReadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import articleApi, { Article, FilterParams } from '../../services/articleApi';
import { useLingui } from '@lingui/react';
import { t, Trans } from "@lingui/macro"; // Added Lingui macro

const { Title, Text, Paragraph } = Typography;

interface RelatedArticlesProps {
  articleId: string;
  categoryId?: string;
  tags?: string[];
  limit?: number;
  style?: React.CSSProperties;
  showHeader?: boolean;
  title?: string;
  compact?: boolean;
  excludeCurrent?: boolean;
}

const RelatedArticles: React.FC<RelatedArticlesProps> = ({
  articleId,
  categoryId,
  tags = [],
  limit = 4,
  style,
  showHeader = true,
  title = "Related Articles You Might Like",
  compact = false,
  excludeCurrent = true,
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { i18n } = useLingui(); // Get current language
  const currentLanguage = i18n.locale.split('-')[0]; // Extract language code

  const fetchRelatedArticles = useCallback(async () => {
    if (!articleId) {
      setArticles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Prepare parameters for related articles with language support
      const params: FilterParams = {
        limit,
        language: currentLanguage, // Add current language
        ...(categoryId && { category: categoryId }),
        ...(tags.length > 0 && { tags: tags.slice(0, 3).join(',') }),
      };

      const response = await articleApi.getRelatedArticles(articleId, params);
      
      if (response.success && response.data) {
        // Process articles with translations
        const processedArticles = (response.data.data || []).map(article => {
          // Apply translations if available
          if (article.translations && currentLanguage !== 'en') {
            const translation = article.translations[currentLanguage] || 
                               article.translations[i18n.locale];
            
            if (translation) {
              return {
                ...article,
                title: translation.title || article.title,
                excerpt: translation.excerpt || article.excerpt,
              };
            }
          }
          return article;
        });
        
        setArticles(processedArticles);
      } else {
        throw new Error(response.message || t`Failed to load related articles`);
      }
    } catch (error: any) {
      console.error('Failed to load related articles:', error);
      setError(error.response?.data?.message || t`Failed to load related articles`);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [articleId, categoryId, tags, limit, excludeCurrent, currentLanguage, i18n.locale]);

  useEffect(() => {
    fetchRelatedArticles();
  }, [fetchRelatedArticles]);

  const handleArticleClick = (article: Article) => {
    navigate(`/article/${article.slug}`);
  };

  const handleCategoryClick = (categoryName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/articles?category=${categoryName.toLowerCase()}&lang=${currentLanguage}`);
  };

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/articles?tag=${tag}&lang=${currentLanguage}`);
  };

  const handleViewMore = () => {
    if (categoryId) {
      navigate(`/articles?category=${categoryId}&lang=${currentLanguage}`);
    } else if (tags.length > 0) {
      navigate(`/articles?tag=${tags[0]}&lang=${currentLanguage}`);
    } else {
      navigate('/articles');
    }
  };

  const renderCompactArticle = (article: Article) => (
    <Card
      hoverable
      onClick={() => handleArticleClick(article)}
      style={{ 
        height: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative'
      }}
      bodyStyle={{ padding: 16 }}
    >
      {/* Article Type Badges */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
        <Space direction="vertical" size={4}>
          {article.accessType === 'PREMIUM' && (
            <Badge 
              count={<CrownOutlined style={{ color: 'white', fontSize: '10px' }} />}
              style={{ 
                backgroundColor: '#722ed1',
                boxShadow: '0 2px 4px rgba(114, 46, 209, 0.3)'
              }}
            />
          )}
          {article.isFeatured && (
            <Badge 
              count={<StarOutlined style={{ color: 'white', fontSize: '10px' }} />}
              style={{ 
                backgroundColor: '#faad14',
                boxShadow: '0 2px 4px rgba(250, 173, 20, 0.3)'
              }}
            />
          )}
          {article.isTrending && (
            <Badge 
              count={<FireOutlined style={{ color: 'white', fontSize: '10px' }} />}
              style={{ 
                backgroundColor: '#ff4d4f',
                boxShadow: '0 2px 4px rgba(255, 77, 79, 0.3)'
              }}
            />
          )}
        </Space>
      </div>

      {/* Article Header */}
      <div style={{ marginBottom: 12 }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <div>
            <Tag 
              color={article.category?.color || 'blue'} 
              onClick={(e) => handleCategoryClick(article.category?.name || '', e)}
              style={{ 
                margin: 0,
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '11px',
                padding: '2px 8px'
              }}
            >
              {article.category?.name}
            </Tag>
          </div>
          <Title 
            level={5} 
            style={{ 
              margin: 0,
              lineHeight: 1.3,
              fontSize: '14px',
              fontWeight: 600,
              height: '2.8em',
              overflow: 'hidden'
            }}
          >
            {article.title}
          </Title>
        </Space>
      </div>

      {/* Article Excerpt */}
      <Paragraph 
        type="secondary" 
        style={{ 
          marginBottom: 12,
          fontSize: '12px',
          lineHeight: 1.4,
          height: '3.6em',
          overflow: 'hidden'
        }}
      >
        {article.excerpt}
      </Paragraph>

      {/* Article Footer */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: 'auto'
      }}>
        <Space size="middle" split={<Divider type="vertical" />}>
          <Tooltip title={t`${article.readingTime} min read`}>
            <Space size={4}>
              <ClockCircleOutlined style={{ fontSize: '11px', color: '#666' }} />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {article.readingTime}m
              </Text>
            </Space>
          </Tooltip>
          
          <Tooltip title={t`${article.viewCount.toLocaleString()} views`}>
            <Space size={4}>
              <EyeOutlined style={{ fontSize: '11px', color: '#666' }} />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {article.viewCount > 1000 ? `${(article.viewCount / 1000).toFixed(1)}k` : article.viewCount}
              </Text>
            </Space>
          </Tooltip>
        </Space>

        {article.author && (
          <Tooltip title={t`By ${article.author.name}`}>
            <Avatar 
              size={24} 
              src={article.author.picture}
              style={{ 
                backgroundColor: article.category?.color || '#1890ff',
                cursor: 'pointer'
              }}
              onClick={(e:any) => {
                e.stopPropagation();
                navigate(`/author/${article.author.id}`);
              }}
            >
              {article.author.name?.charAt(0)}
            </Avatar>
          </Tooltip>
        )}
      </div>
    </Card>
  );

  const renderFullArticle = (article: Article) => (
    <Col xs={24} sm={12} lg={6} key={article.id}>
      <Card
        hoverable
        onClick={() => handleArticleClick(article)}
        style={{ 
          height: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
        bodyStyle={{ padding: 20 }}
        cover={
          <div style={{ 
            height: '180px', 
            background: article.coverImage 
              ? `url(${article.coverImage})`
              : `linear-gradient(135deg, ${article.category?.color || '#1890ff'} 0%, #52c41a 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}>
            {!article.coverImage && (
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                opacity: 0.8,
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {article.title.charAt(0)}
              </div>
            )}
            
            {/* Overlay gradient */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))'
            }} />
            
            {/* Category badge */}
            <div style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
            }}>
              <Tag 
                color={article.category?.color || 'blue'} 
                onClick={(e) => handleCategoryClick(article.category?.name || '', e)}
                style={{ 
                  margin: 0,
                  cursor: 'pointer',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '12px',
                  padding: '4px 12px',
                  backdropFilter: 'blur(4px)',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white'
                }}
              >
                {article.category?.name}
              </Tag>
            </div>
            
            {/* Premium badge */}
            {article.accessType === 'PREMIUM' && (
              <div style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: 'linear-gradient(135deg, #722ed1 0%, #1890ff 100%)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                backdropFilter: 'blur(4px)',
                boxShadow: '0 2px 8px rgba(114, 46, 209, 0.3)'
              }}>
                <CrownOutlined /> <Trans>PREMIUM</Trans>
              </div>
            )}
          </div>
        }
      >
        {/* Article Title */}
        <Title 
          level={5} 
          style={{ 
            marginBottom: 12,
            lineHeight: 1.3,
            fontSize: '16px',
            fontWeight: 600,
            height: '3.2em',
            overflow: 'hidden'
          }}
        >
          {article.title}
        </Title>
        
        {/* Article Excerpt */}
        <Paragraph 
          type="secondary" 
          style={{ 
            marginBottom: 16,
            fontSize: '13px',
            lineHeight: 1.5,
            height: '3.9em',
            overflow: 'hidden'
          }}
        >
          {article.excerpt}
        </Paragraph>
        
        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <Space wrap style={{ marginBottom: 16 }}>
            {article.tags.slice(0, 2).map(tag => (
              <Tag 
                key={tag} 
                onClick={(e) => handleTagClick(tag, e)}
                style={{ 
                  fontSize: '10px',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  margin: 0
                }}
              >
                #{tag}
              </Tag>
            ))}
          </Space>
        )}
        
        {/* Article Stats */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: 'auto'
        }}>
          <Space size="middle" split={<Divider type="vertical" />}>
            <Tooltip title={t`${article.readingTime} min read`}>
              <Space size={4}>
                <ClockCircleOutlined style={{ fontSize: '12px', color: '#666' }} />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {article.readingTime}m
                </Text>
              </Space>
            </Tooltip>
            
            <Tooltip title={t`${article.viewCount.toLocaleString()} views`}>
              <Space size={4}>
                <EyeOutlined style={{ fontSize: '12px', color: '#666' }} />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {article.viewCount.toLocaleString()}
                </Text>
              </Space>
            </Tooltip>
            
            <Tooltip title={t`${article.likeCount.toLocaleString()} likes`}>
              <Space size={4}>
                <HeartOutlined style={{ fontSize: '12px', color: '#666' }} />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {article.likeCount > 1000 ? `${(article.likeCount / 1000).toFixed(1)}k` : article.likeCount}
                </Text>
              </Space>
            </Tooltip>
          </Space>
          
          {/* Author */}
          {article.author && (
            <Tooltip title={t`By ${article.author.name}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar 
                  size={28} 
                  src={article.author.picture}
                  style={{ 
                    backgroundColor: article.category?.color || '#1890ff',
                    cursor: 'pointer'
                  }}
                  onClick={(e:any) => {
                    e.stopPropagation();
                    navigate(`/author/${article.author.id}`);
                  }}
                >
                  {article.author.name?.charAt(0)}
                </Avatar>
                <Text 
                  style={{ 
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/author/${article.author.id}`);
                  }}
                >
                  {article.author.name}
                </Text>
              </div>
            </Tooltip>
          )}
        </div>
      </Card>
    </Col>
  );

  if (loading) {
    return (
      <div style={style}>
        {showHeader && (
          <Title level={3} style={{ marginBottom: 24 }}>
            {title}
          </Title>
        )}
        <Row gutter={[24, 24]}>
          {[1, 2, 3, 4].map(i => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  if (error) {
    return (
      <div style={style}>
        {showHeader && (
          <Title level={3} style={{ marginBottom: 24 }}>
            {title}
          </Title>
        )}
        <div style={{ 
          textAlign: 'center', 
          padding: '32px',
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: '8px'
        }}>
          <Text type="danger">{error}</Text>
          <Button 
            type="link" 
            onClick={fetchRelatedArticles}
            style={{ marginTop: 8 }}
          >
            <Trans>Try Again</Trans>
          </Button>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <div style={style}>
      {/* Header */}
      {showHeader && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 24 
        }}>
          <Title level={3} style={{ margin: 0 }}>
            <Space>
              <FireOutlined style={{ color: '#ff4d4f' }} />
              <span>{title}</span>
            </Space>
          </Title>
          {articles.length >= limit && (
            <Button 
              type="link" 
              onClick={handleViewMore}
              icon={<ArrowRightOutlined />}
              style={{ 
                fontWeight: 500,
                fontSize: '14px'
              }}
            >
              <Trans>View More</Trans>
            </Button>
          )}
        </div>
      )}

      {/* Articles Grid */}
      <Row gutter={compact ? [16, 16] : [24, 24]}>
        {articles.map(article => (
          compact ? renderCompactArticle(article) : renderFullArticle(article)
        ))}
      </Row>


      <style>{`
          @media (max-width: 768px) {
            .related-articles-mobile-button {
              display: flex !important;
            }
          }
          @media (min-width: 769px) {
            .related-articles-mobile-button {
              display: none !important;
            }
          }
      `}</style>


      {/* View All Button (for mobile) */}
      {articles.length >= limit && (
        <div 
            className="related-articles-mobile-button"
            style={{ 
              justifyContent: 'center', 
              marginTop: 24 
            }}
          >
          <Button 
            type="primary" 
            onClick={handleViewMore}
            icon={<ArrowRightOutlined />}
            style={{ 
              borderRadius: '20px',
              padding: '8px 24px'
            }}
          >
            <Trans>View More Articles</Trans>
          </Button>
        </div>
      )}

      {/* Divider */}
      {!compact && <Divider style={{ marginTop: 48 }} />}
    </div>
  );
};

export default RelatedArticles;