// components/articles/ArticleFeed.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Input, 
  Select, 
  Avatar,
  Skeleton,
  Empty,
  Tabs,
  Divider,
  Tooltip,
  notification,
  Dropdown,
  Menu,
  FloatButton,
  Badge,
  Tag,
  Space,
  Progress
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined,
  FireOutlined,
  StarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  HeartOutlined,
  CommentOutlined,
  CrownOutlined,
  GlobalOutlined,
  HistoryOutlined,
  HeartFilled,
  BookOutlined,
  BookFilled,
  MoreOutlined,
  RocketOutlined,
  BulbOutlined,
  ReadOutlined,
  ArrowUpOutlined,
  CompassOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  CoffeeOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import articleApi, { Article, FilterParams } from '../../services/articleApi';
import { useAuthStore } from '@/client/stores/auth';
import './ArticleFeed.css';
import ArticleCard from './ArticleCard';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

interface ArticleFeedProps {
  showPersonalization?: boolean;
  initialTab?: 'featured' | 'recent' | 'trending' | 'short' | 'premium' | 'all';
  hideFilters?: boolean;
}

interface FiltersState {
  category: string;
  tag: string;
  sort: 'recent' | 'popular' | 'trending' | 'reading_time';
  search: string;
  language?: string;
  readingTime?: 'short' | 'medium' | 'long';
}

const ArticleFeed: React.FC<ArticleFeedProps> = ({ 
  showPersonalization = true,
  initialTab = 'featured',
  hideFilters = false
}) => {
  // Use a conditional hook call or wrap in try-catch
  let navigate: ReturnType<typeof useNavigate> | ((path: string) => void);
  
  try {
    // Try to use the hook, but provide a fallback if Router context is not available
    navigate = useNavigate();
  } catch (error) {
    // Fallback navigation function
    console.warn('Router context not available, using fallback navigation');
    navigate = (path: string) => {
      // Use window.location for navigation when router is not available
      window.location.href = path;
    };
  }

  const [activeTab, setActiveTab] = useState(initialTab);
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [shortArticles, setShortArticles] = useState<Article[]>([]);
  const [premiumArticles, setPremiumArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [filters, setFilters] = useState<FiltersState>({
    category: '',
    tag: '',
    sort: 'recent',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalArticles, setTotalArticles] = useState(0);
  const [userHasPremium, setUserHasPremium] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuthStore();

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await articleApi.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch analytics data to get user count
const fetchAnalyticsData = async () => {
  try {
    // Use the same endpoint as AdminAnalytics component
    const response = await articleApi.getAnalytics('30d'); // Default to 30 days
    if (response.data) {
      // Sum up user growth data to get total users
      const userCount = response.data.userGrowth?.reduce(
        (sum: number, day: any) => sum + (day._count?._all || 0), 
        0
      ) || 0;
      setTotalUsers(userCount);
    }
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    // Fallback: set a reasonable default
    setTotalUsers(14000);
  }
};

  // Check user premium status
  const checkPremiumStatus = async () => {
    if (user) {
      try {
        // You'll need to implement this in your auth store or API
        setUserHasPremium(user.subscription?.status === 'ACTIVE' || false);
      } catch (error) {
        console.error('Failed to check premium status:', error);
      }
    }
  };

  // Add a function to handle "View All" navigation
  const handleViewAll = (variant: 'featured' | 'short' | 'premium' | 'all') => {
    switch (variant) {
      case 'featured':
        setActiveTab('featured');
        break;
      case 'short':
        setActiveTab('short');
        break;
      case 'premium':
        setActiveTab('premium');
        break;
      default:
        setActiveTab('all');
    }
    
    // Reset filters when switching to a specific view
    const baseFilters: FiltersState = {
      category: '',
      tag: '',
      sort: 'recent',
      search: '',
    };

    // Apply specific filters based on the variant
    switch (variant) {
      case 'featured':
        setFilters({ ...baseFilters });
        break;
      case 'short':
        setFilters({ 
          ...baseFilters, 
          readingTime: 'short',
          sort: 'reading_time' 
        });
        break;
      case 'premium':
        setFilters({ 
          ...baseFilters, 
          // Note: accessType filter will be applied in fetchArticles
        });
        break;
      default:
        setFilters(baseFilters);
    }
    
    // Scroll to the main content area
    setTimeout(() => {
      document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchArticles = useCallback(async (reset = false) => {
    if (loading) return;
    
    const currentPage = reset ? 1 : page;
    
    setLoading(true);
    try {
      const params: FilterParams = {
        page: currentPage,
        limit: 12,
        ...filters,
      };

      // Adjust params based on active tab
      switch (activeTab) {
        case 'featured':
          params.featured = true;
          break;
        case 'trending':
          params.trending = true;
          params.sort = 'trending';
          break;
        case 'short':
          params.readingTime = 'short';
          params.sort = 'reading_time';
          break;
        case 'premium':
          params.accessType = 'PREMIUM';
          break;
        case 'recent':
          params.sort = 'recent';
          break;
      }

      // Clean up empty params
      Object.keys(params).forEach(key => {
        if (params[key as keyof FilterParams] === '' || params[key as keyof FilterParams] === undefined) {
          delete params[key as keyof FilterParams];
        }
      });

      const response = await articleApi.getArticles(params);

      // Handle response structure
      let newArticles: Article[] = [];
      let newTotal = 0;
      let newHasMore = false;

      if (response.data) {
        if (Array.isArray(response.data)) {
          newArticles = response.data;
          newTotal = response.data.length;
        } else if (response.data.articles && Array.isArray(response.data.articles)) {
          newArticles = response.data.articles;
          newTotal = response.data.total || response.data.articles.length;
          newHasMore = response.data.hasMore || false;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          newArticles = response.data.data;
          newTotal = response.data.total || response.data.data.length;
          newHasMore = response.data.hasMore || false;
        }
      }

      if (reset || currentPage === 1) {
        setArticles(newArticles);
      } else {
        setArticles(prev => [...prev, ...newArticles]);
      }
      
      setTotalArticles(newTotal);
      setHasMore(newHasMore);
      
      if (reset) {
        setPage(1);
      }
    } catch (error: any) {
      console.error('Failed to load articles:', error);
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to load articles. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, page, loading, user, showPersonalization]);

  // Fetch specialized article sets
  const fetchSpecializedArticles = async () => {
    try {
      // Fetch featured articles
      const featuredResponse = await articleApi.getArticles({ featured: true, limit: 4 });
      if (featuredResponse.data?.articles) {
        setFeaturedArticles(featuredResponse.data.articles);
      }

      // Fetch short articles (reading time < 5 min)
      const shortResponse = await articleApi.getArticles({ readingTime: 'short', limit: 4 });
      if (shortResponse.data?.articles) {
        setShortArticles(shortResponse.data.articles);
      }

      // Fetch premium articles
      const premiumResponse = await articleApi.getArticles({ accessType: 'PREMIUM', limit: 4 });
      if (premiumResponse.data?.articles) {
        setPremiumArticles(premiumResponse.data.articles);
      }
    } catch (error) {
      console.error('Failed to load specialized articles:', error);
    }
  };

  useEffect(() => {
    fetchArticles(true);
    fetchCategories();
    checkPremiumStatus();
    fetchSpecializedArticles();
    fetchAnalyticsData();
  }, [activeTab, filters]);

  useEffect(() => {
    if (page > 1) {
      fetchArticles(false);
    }
  }, [page]);

  useEffect(() => {
    // Setup intersection observer for infinite scroll
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading]);

  const handleFilterChange = (key: keyof FiltersState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleLikeArticle = async (articleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await articleApi.likeArticle(articleId);
      
      if (response.data?.liked) {
        updateArticleState(articleId, {
          likeCount: (prev: number) => prev + 1,
          isLiked: true,
        });
        
        notification.success({
          message: 'Success',
          description: 'Article liked!',
        });
      }
    } catch (error: any) {
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to like article',
      });
    }
  };

  const handleSaveArticle = async (articleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await articleApi.saveArticle(articleId);
      
      if (response.data?.saved) {
        updateArticleState(articleId, {
          isSaved: true,
        });
        
        notification.success({
          message: 'Success',
          description: 'Article saved!',
        });
      }
    } catch (error: any) {
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to save article',
      });
    }
  };

  const updateArticleState = (articleId: string, updates: any) => {
    const updateFunction = (articles: Article[]) =>
      articles.map(article => {
        if (article.id === articleId) {
          return {
            ...article,
            ...Object.keys(updates).reduce((acc, key) => {
              const update = updates[key];
              acc[key] = typeof update === 'function' ? update(article[key]) : update;
              return acc;
            }, {} as any),
          };
        }
        return article;
      });

    setArticles(updateFunction);
    setFeaturedArticles(updateFunction);
    setShortArticles(updateFunction);
    setPremiumArticles(updateFunction);
  };

  const renderArticleCard = (article: Article, variant: 'default' | 'featured' | 'short' | 'premium' = 'default') => {
    const cardVariant = variant === 'featured' ? 'featured' : 'default';
  
    return (
      <Col 
        xs={24} 
        sm={variant === 'featured' ? 24 : 12} 
        lg={variant === 'featured' ? 24 : 8} 
        xl={variant === 'featured' ? 24 : 6} 
        key={article.id}
      >
        <ArticleCard
          article={article}
          variant={cardVariant}
          onLike={async (articleId) => {
            try {
              const response = await articleApi.likeArticle(articleId);
              if (response.data?.liked) {
                updateArticleState(articleId, {
                  likeCount: (prev: number) => prev + 1,
                  isLiked: true,
                });
              }
            } catch (error: any) {
              notification.error({
                message: 'Error',
                description: error.response?.data?.message || 'Failed to like article',
              });
            }
          }}
          onSave={async (articleId) => {
            try {
              const response = await articleApi.saveArticle(articleId);
              if (response.data?.saved) {
                updateArticleState(articleId, {
                  isSaved: true,
                });
              }
            } catch (error: any) {
              notification.error({
                message: 'Error',
                description: error.response?.data?.message || 'Failed to save article',
              });
            }
          }}
          onShare={(articleId) => {
            // Implement share functionality
            console.log('Share article:', articleId);
          }}
          onReport={(articleId) => {
            // Implement report functionality
            console.log('Report article:', articleId);
          }}
        />
      </Col>
    );
  };

  const tabs = [
    {
      key: 'featured',
      label: (
        <div className="flex items-center gap-2">
          <StarOutlined />
          <span>Featured</span>
        </div>
      ),
      condition: true,
    },
    {
      key: 'recent',
      label: (
        <div className="flex items-center gap-2">
          <HistoryOutlined />
          <span>Recent</span>
        </div>
      ),
      condition: true,
    },
    {
      key: 'trending',
      label: (
        <div className="flex items-center gap-2">
          <FireOutlined />
          <span>Trending</span>
        </div>
      ),
      condition: true,
    },
    {
      key: 'short',
      label: (
        <div className="flex items-center gap-2">
          <CoffeeOutlined />
          <span>Quick Reads</span>
        </div>
      ),
      condition: true,
    },
    {
      key: 'premium',
      label: (
        <div className="flex items-center gap-2">
          <CrownOutlined />
          <span>Premium</span>
        </div>
      ),
      condition: true,
    },
    {
      key: 'all',
      label: (
        <div className="flex items-center gap-2">
          <CompassOutlined />
          <span>Explore All</span>
        </div>
      ),
      condition: true,
    },
  ].filter(tab => tab.condition);

  const renderSection = (title: string, articles: Article[], variant: 'featured' | 'short' | 'premium' = 'featured') => (
    articles.length > 0 && (
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <Title level={2} className="text-2xl font-bold text-foreground dark:text-white">
            {title}
          </Title>
          <Button 
            type="primary"
            ghost
            className="text-primary dark:text-blue-400 border-primary dark:border-blue-400 hover:bg-primary/10"
            icon={<ArrowRightOutlined />}
            onClick={() => handleViewAll(variant)}
          >
            View All
          </Button>
        </div>
        <Row gutter={[24, 24]}>
          {articles.map(article => renderArticleCard(article, variant === 'featured' ? 'featured' : 'default'))}
        </Row>
      </div>
    )
  );

  return (
    <div className="p-4 md:p-6 space-y-6 dark:bg-gray-900 min-h-screen">
      {/* Enhanced Hero Section */}
      <div className="relative mb-12 rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-700 shadow-2xl dark:from-indigo-800 dark:via-blue-700 dark:to-indigo-900">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
        <div className="relative z-10 px-6 py-16 md:px-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm bg-white/10 mb-8">
            <BookOutlined className="text-white" />
            <span className="text-white font-medium">Welcome to Cverra Articles</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Discover Knowledge That Transforms
          </h1>

          <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto">
            Join {totalUsers.toLocaleString()}+ professionals learning with us. 
            Explore insights, strategies, and stories that shape tomorrow's leaders.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="large"
              type="primary"
              className="h-12 px-8 bg-white text-indigo-600 hover:bg-white/90 rounded-xl font-semibold text-lg shadow-lg hover:scale-105 flex items-center justify-center gap-3"
              onClick={() => {
                handleViewAll('all');
              }}
            >
              <ReadOutlined />
              Start Reading Now
            </Button>
            {!userHasPremium && (
              <Button
                size="large"
                className="h-12 px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:scale-105 flex items-center justify-center gap-3"
                onClick={() => handleViewAll('premium')}
              >
                <CrownOutlined />
                Explore Premium
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { icon: <RocketOutlined />, value: `${totalArticles}+`, label: 'Articles', color: 'text-blue-300' },
              { icon: <FireOutlined />, value: '24/7', label: 'Fresh Content', color: 'text-red-300' },
              { icon: <StarOutlined />, value: '98%', label: 'Satisfaction', color: 'text-yellow-300' },
              { icon: <GlobalOutlined />, value: '10+', label: 'Languages', color: 'text-green-300' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="flex items-center justify-center gap-2 text-white/80">
                  {stat.icon}
                  <span>{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content area with ID for scrolling */}
      <div id="main-content">
        {/* Category Tabs */}
        <div className="mb-8">
          <Title level={3} className="mb-4 text-xl font-semibold text-foreground dark:text-white">
            Browse by Category
          </Title>
          <div className="flex flex-wrap gap-2">
            {loadingCategories ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton.Button key={i} active size="large" style={{ width: 100 }} />
              ))
            ) : (
              <>
                <Button
                  type={filters.category === '' ? 'primary' : 'default'}
                  className={`${
                    filters.category === '' 
                      ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-0' 
                      : 'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                  }`}
                  onClick={() => handleFilterChange('category', '')}
                >
                  All Topics
                </Button>
                {categories.map(category => (
                  <Button
                    key={category.id}
                    type={filters.category === category.slug ? 'primary' : 'default'}
                    className={`${
                      filters.category === category.slug 
                        ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-0' 
                        : 'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                    }`}
                    onClick={() => handleFilterChange('category', category.slug)}
                  >
                    {category.name}
                  </Button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Featured Articles Section */}
        {renderSection('Featured Articles', featuredArticles, 'featured')}

        {/* Quick Reads Section */}
        {renderSection('Quick Reads (Under 5 min)', shortArticles, 'short')}

        {/* Premium Articles Section */}
        {userHasPremium && renderSection('Your Premium Content', premiumArticles, 'premium')}
        {!userHasPremium && premiumArticles.length > 0 && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <div>
                <Title level={2} className="text-2xl font-bold text-foreground dark:text-white">
                  Premium Articles
                </Title>
                <Text className="text-muted-foreground dark:text-gray-400">
                  Unlock exclusive content with premium access
                </Text>
              </div>
              <Button 
                type="primary"
                ghost
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-600 hover:bg-purple-600/10"
                icon={<ArrowRightOutlined />}
                onClick={() => handleViewAll('premium')}
              >
                Explore Premium
              </Button>
            </div>
            <Row gutter={[24, 24]}>
              {premiumArticles.map(article => renderArticleCard(article))}
            </Row>
          </div>
        )}

        {/* Main Content Tabs - Only show when there are articles or active tab is selected */}
        {(articles.length > 0 || activeTab !== 'featured') && (
          <>
            <div className="flex items-center justify-between mb-6">
              <Title level={2} className="text-2xl font-bold text-foreground dark:text-white">
                {activeTab === 'featured' ? 'Featured Articles' :
                 activeTab === 'recent' ? 'Recent Articles' :
                 activeTab === 'trending' ? 'Trending Articles' :
                 activeTab === 'short' ? 'Quick Reads' :
                 activeTab === 'premium' ? 'Premium Articles' :
                 'All Articles'}
              </Title>
              <div className="flex items-center gap-2">
                <Text className="text-sm text-muted-foreground dark:text-gray-400">
                  {articles.length} articles
                </Text>
              </div>
            </div>

            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              className="mb-8 dark:[&_.ant-tabs-tab]:text-gray-300 dark:[&_.ant-tabs-tab-active]:text-white"
              items={tabs.map(tab => ({
                key: tab.key,
                label: tab.label,
              }))}
            />
          </>
        )}

        {/* Filters */}
        {!hideFilters && (
          <div className="bg-card dark:bg-gray-800 text-card-foreground dark:text-gray-200 p-6 rounded-xl border dark:border-gray-700 shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <div className="flex-1 w-full lg:w-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Search
                    placeholder="Search articles..."
                    allowClear
                    enterButton={<SearchOutlined />}
                    onSearch={handleSearch}
                    className="w-full sm:w-64 dark:[&_input]:bg-gray-700 dark:[&_input]:text-white dark:[&_input]:border-gray-600"
                    size="large"
                    addonAfter={null} 
                  />
                  
                  <Select
                    placeholder="Category"
                    allowClear
                    className="w-full sm:w-40 dark:[&_.ant-select-selector]:bg-gray-700 dark:[&_.ant-select-selector]:text-white dark:[&_.ant-select-selector]:border-gray-600"
                    size="large"
                    onChange={(value) => handleFilterChange('category', value)}
                    value={filters.category || undefined}
                    popupClassName="dark:bg-gray-800 dark:text-white"
                  >
                    {categories.map(category => (
                      <Option key={category.id} value={category.slug}>
                        {category.name}
                      </Option>
                    ))}
                  </Select>
                  
                  <Select
                    placeholder="Sort by"
                    className="w-full sm:w-44 dark:[&_.ant-select-selector]:bg-gray-700 dark:[&_.ant-select-selector]:text-white dark:[&_.ant-select-selector]:border-gray-600"
                    size="large"
                    onChange={(value) => handleFilterChange('sort', value)}
                    value={filters.sort}
                    popupClassName="dark:bg-gray-800 dark:text-white"
                  >
                    <Option value="recent">Most Recent</Option>
                    <Option value="popular">Most Popular</Option>
                    <Option value="trending">Trending</Option>
                    <Option value="reading_time">Reading Time</Option>
                  </Select>
                  
                  <Select
                    placeholder="Reading Time"
                    className="w-full sm:w-40 dark:[&_.ant-select-selector]:bg-gray-700 dark:[&_.ant-select-selector]:text-white dark:[&_.ant-select-selector]:border-gray-600"
                    size="large"
                    onChange={(value) => handleFilterChange('readingTime', value)}
                    value={filters.readingTime}
                    popupClassName="dark:bg-gray-800 dark:text-white"
                    allowClear
                  >
                    <Option value="short">Quick Reads (Under 5 min)</Option>
                    <Option value="medium">Medium (5-10 min)</Option>
                    <Option value="long">Long Reads (10+ min)</Option>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results summary */}
        {articles.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Showing {articles.length} of {totalArticles} articles
              </p>
              {filters.readingTime && (
                <Badge 
                  count={filters.readingTime === 'short' ? 'Quick Reads' : 
                         filters.readingTime === 'medium' ? 'Medium Reads' : 'Long Reads'}
                  className="dark:bg-blue-600"
                />
              )}
              {filters.category && categories.find(c => c.slug === filters.category) && (
                <Badge 
                  count={categories.find(c => c.slug === filters.category)?.name}
                  className="dark:bg-indigo-600"
                />
              )}
            </div>
            {filters.search && (
              <p className="text-sm text-foreground dark:text-gray-300">
                Search results for: <span className="font-semibold">"{filters.search}"</span>
              </p>
            )}
          </div>
        )}

        {/* Articles Grid */}
        <Row gutter={[24, 24]}>
          {articles.map(article => renderArticleCard(article))}
        </Row>

        {/* Loading Skeletons */}
        {loading && (
          <Row gutter={[24, 24]} className="mt-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Col xs={24} sm={12} lg={8} xl={6} key={i}>
                <Card className="h-full bg-card dark:bg-gray-800 border dark:border-gray-700 shadow-sm">
                  <Skeleton 
                    active 
                    avatar 
                    paragraph={{ rows: 3 }} 
                    title={false} 
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Empty State */}
        {!loading && articles.length === 0 && (
          <div className="my-16 p-12 rounded-xl text-center bg-card dark:bg-gray-800 text-card-foreground dark:text-gray-200 border dark:border-gray-700 shadow-sm">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <h3 className="text-xl font-semibold text-foreground dark:text-white mb-4">
                    No articles found
                  </h3>
                  <p className="max-w-md mx-auto mb-6 text-muted-foreground dark:text-gray-400">
                    {activeTab === 'featured' 
                      ? 'No featured articles available at the moment. Check back soon!' 
                      : activeTab === 'premium'
                      ? userHasPremium 
                        ? 'No premium articles available. Explore our other content!'
                        : 'Upgrade to premium to access exclusive articles!'
                      : filters.search 
                      ? `No articles match "${filters.search}". Try different keywords or filters.`
                      : 'No articles found. Try exploring different categories or filters.'
                    }
                  </p>
                  {(filters.category || filters.tag || filters.search || filters.readingTime) && (
                    <Button 
                      type="primary"
                      className="mt-4 bg-gradient-to-r from-indigo-500 to-blue-500 border-0"
                      onClick={() => {
                        setFilters({
                          category: '',
                          tag: '',
                          sort: 'recent',
                          search: '',
                          readingTime: undefined,
                        });
                        setActiveTab('all');
                      }}
                    >
                      Clear all filters
                    </Button>
                  )}
                  {activeTab === 'premium' && !userHasPremium && (
                    <Button 
                      type="primary"
                      className="mt-4 ml-4 bg-gradient-to-r from-purple-600 to-blue-600 border-0"
                      onClick={() => {
                        try {
                          if (typeof navigate === 'function') {
                            navigate('/dashboard/subscription');
                          } else {
                            window.location.href = '/dashboard/subscription';
                          }
                        } catch (error) {
                          window.location.href = '/dashboard/subscription';
                        }
                      }}
                    >
                      Upgrade to Premium
                    </Button>
                  )}
                </div>
              }
            />
          </div>
        )}

        {/* Load More Trigger - Only show if we're in a tab view */}
        {hasMore && !loading && articles.length > 0 && (
          <div 
            ref={loadMoreRef} 
            className="my-12 flex justify-center"
          >
            <div className="px-6 py-3 rounded-lg text-muted-foreground dark:text-gray-400 text-sm">
              <Progress percent={Math.min((articles.length / totalArticles) * 100, 90)} showInfo={false} />
              <p className="mt-2">Loading more articles...</p>
            </div>
          </div>
        )}

        {!hasMore && articles.length > 0 && (
          <div className="my-12 pt-8 text-center border-t dark:border-gray-700">
            <p className="text-lg text-muted-foreground dark:text-gray-400">
              🎉 You've reached the end! Keep exploring our other collections.
            </p>
            <Button 
              type="link" 
              className="mt-4 text-primary dark:text-blue-400"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Back to top <ArrowUpOutlined />
            </Button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <FloatButton.BackTop 
        icon={<ArrowUpOutlined />}
        className="dark:bg-gray-700 dark:text-white"
      />
    </div>
  );
};

export default ArticleFeed;