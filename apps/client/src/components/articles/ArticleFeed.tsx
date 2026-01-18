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
  Progress,
  Statistic,
  Rate,
  Carousel,
  Image,
  Alert,
  Popover,
  Grid
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
  UnlockOutlined,
  TeamOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
  LineChartOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  EditOutlined,
  CheckOutlined,
  ThunderboltFilled,
  UserOutlined,
  CalendarOutlined,
  FolderOutlined,
  TagOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  SyncOutlined,
  AimOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  SolutionOutlined,
  ApiOutlined,
  DeploymentUnitOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  PartitionOutlined,
  ClusterOutlined,
  RightCircleOutlined,
  LeftCircleOutlined,
  PlayCircleOutlined,
  CustomerServiceOutlined,
  HighlightOutlined,
  ContainerOutlined,
  ScheduleOutlined,
  LaptopOutlined,
  SolutionOutlined as SolutionIcon,
  SlidersOutlined,
  ControlOutlined,
  PauseOutlined,
  LeftOutlined,
  RightOutlined,
  ExperimentOutlined as ExperimentIcon,
  CoffeeOutlined as CoffeeIcon
} from '@ant-design/icons';
import { cn } from "@reactive-resume/utils";
import { useLingui } from '@lingui/react';
import { t, Trans } from "@lingui/macro"; // Added Lingui macro
import { useNavigate } from 'react-router-dom';
import articleApi, { Article, FilterParams, ArticleListDto } from '../../services/articleApi';
import { useAuthStore } from '@/client/stores/auth';
import './ArticleFeed.css';
import ArticleCard from './ArticleCard';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

interface ArticleFeedProps {
  showPersonalization?: boolean;
  initialTab?: 'featured' | 'recent' | 'trending' | 'short' | 'premium' | 'all' | 'editors-pick';
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

  const { i18n } = useLingui();
  const currentLocale = i18n.locale; // e.g., 'fr', 'en', etc.

  console.log('🌐 Current UI locale in ArticleFeed:', currentLocale);
  
  const screens = useBreakpoint();
  let navigate: ReturnType<typeof useNavigate> | ((path: string) => void);
  
  try {
    navigate = useNavigate();
  } catch (error) {
    console.warn('Router context not available, using fallback navigation');
    navigate = (path: string) => window.location.href = path;
  }

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [shortArticles, setShortArticles] = useState<Article[]>([]);
  const [premiumArticles, setPremiumArticles] = useState<Article[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [editorsPickArticles, setEditorsPickArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const carouselRef = useRef<any>(null);
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
  const [platformStats, setPlatformStats] = useState({
    totalArticles: 0,
    totalAuthors: 0,
    totalLanguages: 0,
    totalReads: 0
  });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const [activeCarousel, setActiveCarousel] = useState(0);

  // Special article collections
  const [specialCollections, setSpecialCollections] = useState<Array<{
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  articlesCount: number;
  link: string;
}>>([]);

// Add this function
const fetchSpecialCollections = async () => {
  try {
    // Get popular categories to use as collections
    const categoriesResponse = await articleApi.getCategories();
    
    if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
      // Get top 4 categories by article count
      const topCategories = categoriesResponse.data
        .filter((cat: any) => cat.articleCount > 0)
        .sort((a: any, b: any) => (b.articleCount || 0) - (a.articleCount || 0))
        .slice(0, 4);
      
      // Map to collections with appropriate icons and colors
      const collectionColors = [
        "from-blue-500 to-cyan-500",
        "from-purple-500 to-pink-500",
        "from-green-500 to-emerald-500",
        "from-amber-500 to-orange-500"
      ];
      
      const collectionIcons = [
        <RocketOutlined />,
        <TrophyOutlined />,
        <BulbOutlined />,
        <ExperimentIcon />
      ];
      
      const collections = topCategories.map((category: any, index: number) => ({
        title: category.name,
        description: category.description || t`Explore ${category.name.toLowerCase()} insights`,
        icon: collectionIcons[index] || <RocketOutlined />,
        color: collectionColors[index] || "from-blue-500 to-cyan-500",
        articlesCount: category.articleCount || 0,
        link: `/dashboard/articles/all?cat=${category.slug}`
      }));

      setSpecialCollections(collections);
    }
  } catch (error) {
    console.error('Failed to fetch special collections:', error);
  }
};


  const knowledgePillars = [
    {
      title: t`Practical Wisdom`,
      description: t`Actionable insights you can apply immediately`,
      icon: <SolutionIcon />,
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      title: t`Research-Backed`,
      description: t`Evidence-based strategies, not just opinions`,
      icon: <ExperimentIcon />,
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      title: t`Expert-Curated`,
      description: t`Vetted by industry leaders and subject experts`,
      icon: <SafetyCertificateOutlined />,
      color: "text-green-600 dark:text-green-400"
    },
    {
      title: t`Time-Optimized`,
      description: t`Respect your time with focused, valuable content`,
      icon: <CoffeeIcon />,
      color: "text-amber-600 dark:text-amber-400"
    }
  ];

  const handleTabChange = (key: string) => {
    const validKeys = ['featured', 'recent', 'trending', 'short', 'premium', 'all', 'editors-pick'];
    if (validKeys.includes(key as any)) {
      setActiveTab(key as typeof activeTab);
    }
  };

const fetchCategories = async () => {
  try {
    setLoadingCategories(true);
    
    // Get current UI language code (e.g., 'en', 'fr')
    const languageCode = currentLocale.split('-')[0];
    console.log('🌐 Fetching categories in UI language:', languageCode);
    
    // Pass language to API - this will get categories in the current UI language
    const response = await articleApi.getCategories(languageCode) as any;
    
    console.log('Full categories response:', response);
    
    let categoriesArray = [];
    
    if (Array.isArray(response)) {
      // If response is already an array
      categoriesArray = response;
    } else if (response && response.data) {
      // If response has data property
      if (Array.isArray(response.data)) {
        categoriesArray = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // If nested data.data structure
        categoriesArray = response.data.data;
      }
    }
    
    console.log(`📊 Categories loaded in ${languageCode}:`, categoriesArray.length);
    setCategories(categoriesArray);
    
  } catch (error) {
    console.error('Failed to load categories:', error);
    setCategories([]);
  } finally {
    setLoadingCategories(false);
  }
};
 

  const checkPremiumStatus = async () => {
    if (user) {
      try {
        setUserHasPremium(user.subscription?.status === 'ACTIVE' || false);
      } catch (error) {
        console.error('Failed to check premium status:', error);
      }
    }
  };



  const handleViewAll = (variant: 'featured' | 'short' | 'premium' | 'all' | 'trending' | 'authors' | 'categories' | 'editors-pick' | string) => {
    if (variant === 'authors') {
      navigate('/dashboard/authors');
    } else if (variant === 'categories') {
      navigate('/dashboard/categories');
    } else if (variant.startsWith('collection-')) {
      const collectionId = variant.replace('collection-', '');
      navigate(`/dashboard/collections/${collectionId}`);
    } else {
      setActiveTab(variant as any);
      const baseFilters: FiltersState = { category: '', tag: '', sort: 'recent', search: '' };
      
      switch (variant) {
        case 'featured':
          setFilters({ ...baseFilters });
          break;
        case 'short':
          setFilters({ ...baseFilters, readingTime: 'short', sort: 'reading_time' });
          break;
        case 'premium':
          setFilters({ ...baseFilters });
          break;
        case 'trending':
          setFilters({ ...baseFilters, sort: 'trending' });
          break;
        case 'editors-pick':
          setFilters({ ...baseFilters });
          break;
        default:
          setFilters(baseFilters);
      }
    }
    
    setTimeout(() => {
      document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };



 const fetchArticles = useCallback(async (reset = false) => {
  if (loading) return;
  
  const currentPage = reset ? 1 : page;
  setLoading(true);
  
  try {
    const languageCode = currentLocale.split('-')[0]; // Extract language code
    
    const params: FilterParams = {
      page: currentPage,
      limit: 12,
      language: languageCode, // Add language parameter with language code
      ...filters,
    };

    console.log('📡 Fetching articles with language:', languageCode, 'from locale:', currentLocale);
    
    switch (activeTab) {
      case 'featured': params.featured = true; break;
      case 'trending': params.trending = true; params.sort = 'trending'; break;
      case 'short': params.sort = 'reading_time'; params.limit = 16; break;
      case 'premium': params.accessType = 'PREMIUM'; break;
      case 'editors-pick': params.featured = true; params.sort = 'popular'; break;
      case 'recent': params.sort = 'recent'; break;
    }

    // Clean up empty params
    Object.keys(params).forEach(key => {
      if (params[key as keyof FilterParams] === '' || params[key as keyof FilterParams] === undefined) {
        delete params[key as keyof FilterParams];
      }
    });

    console.log('📡 Final API params:', params);

    const response = await articleApi.getArticles(params);
    
    // Debug log
    console.log('📥 Articles response for', languageCode, ':', {
      count: response.data?.articles?.length || 0,
      sampleTitle: response.data?.articles?.[0]?.title || 'None',
      hasTranslations: response.data?.articles?.[0]?.translations ? 'Yes' : 'No',
      availableLanguages: response.data?.articles?.[0]?.availableLanguages || []
    });

    let newArticles: Article[] = [];
    let newTotal = 0;
    let newHasMore = false;

    if (response.data) {
      if (Array.isArray(response.data)) {
        newArticles = response.data;
      } else if (response.data.articles && Array.isArray(response.data.articles)) {
        newArticles = response.data.articles;
        newTotal = response.data.total || response.data.articles.length;
        newHasMore = response.data.hasMore || false;
      }
    }

    if (activeTab === 'short') {
      newArticles = newArticles.filter(article => {
        const readingTime = article.readingTime || 5;
        return readingTime <= 10;
      });
      newHasMore = newArticles.length > 0 && currentPage < 3;
    }

    if (reset || currentPage === 1) {
      setArticles(newArticles);
    } else {
      setArticles(prev => [...prev, ...newArticles]);
    }
    
    setTotalArticles(newTotal);
    setHasMore(newHasMore);
    if (reset) setPage(1);
    
  } catch (error: any) {
    console.error('Failed to load articles:', error);
    
    // Try fallback without language parameter
    if (error.message.includes('language') || error.response?.status === 400) {
      console.log('🔄 Trying fallback without language parameter...');
      
      const fallbackParams = { ...filters, page: currentPage, limit: 12 };
      // Remove language from params
      delete fallbackParams.language;
      
      try {
        const fallbackResponse = await articleApi.getArticles(fallbackParams);
        
        if (fallbackResponse.data?.articles) {
          const newArticles = Array.isArray(fallbackResponse.data) 
            ? fallbackResponse.data 
            : fallbackResponse.data.articles;
          
          if (reset || currentPage === 1) {
            setArticles(newArticles);
          } else {
            setArticles(prev => [...prev, ...newArticles]);
          }
          
          setTotalArticles(newArticles.length);
          setHasMore(false);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        notification.error({
          message: t`Error`,
          description: t`Failed to load articles. Please try again.`,
        });
      }
    } else {
      notification.error({
        message: t`Error`,
        description: error.response?.data?.message || t`Failed to load articles.`,
      });
    }
  } finally {
    setLoading(false);
  }
}, [activeTab, filters, page, loading, user, showPersonalization, currentLocale]);


 const fetchSpecializedArticles = async () => {
  try {
    console.log('🌐 Fetching specialized articles with language:', currentLocale);
    
    // Extract language code (e.g., 'fr' from 'fr-FR')
    const languageCode = currentLocale.split('-')[0];
    
    // IMPORTANT: Use languageCode (not full locale) for filtering
    const [featuredRes, shortRes, premiumRes, trendingRes, editorsPickRes] = await Promise.all([
      articleApi.getArticles({ 
        featured: true, 
        limit: 12, // Get more to ensure we get enough after filtering
        language: languageCode  // Use 'language' parameter with languageCode
      }),
      articleApi.getArticles({ 
        limit: 30,  // Get more for filtering
        sort: 'reading_time',
        language: languageCode
      }),
      articleApi.getArticles({ 
        accessType: 'PREMIUM', 
        limit: 12,
        language: languageCode
      }),
      articleApi.getArticles({ 
        trending: true, 
        limit: 12,
        language: languageCode
      }),
      articleApi.getArticles({ 
        featured: true, 
        sort: 'popular', 
        limit: 8,
        language: languageCode
      })
    ]);

    console.log('📊 API Responses (language:', languageCode, '):', {
      featuredCount: featuredRes.data?.articles?.length || 0,
      premiumCount: premiumRes.data?.articles?.length || 0,
      trendingCount: trendingRes.data?.articles?.length || 0,
      editorsPickCount: editorsPickRes.data?.articles?.length || 0,
      shortCount: shortRes.data?.articles?.length || 0
    });

    // Helper function to apply translations from the service response
    const processArticles = (articles: any[] | undefined, limit: number) => {
      if (!articles || articles.length === 0) return [];
      
      return articles
        .map(article => {
          // Check if article has translation data from backend
          if (article.translations && languageCode !== 'en') {
            const translation = article.translations[languageCode] || 
                               article.translations[currentLocale];
            
            if (translation) {
              return {
                ...article,
                title: translation.title || article.title,
                excerpt: translation.excerpt || article.excerpt,
                language: languageCode,
                isTranslated: true,
              };
            }
          }
          return article;
        })
        .slice(0, limit);
    };

    // Process and set articles
    if (featuredRes.data?.articles) {
      const processedFeatured = processArticles(featuredRes.data.articles, 6);
      console.log('🌟 Processed featured articles:', {
        original: featuredRes.data.articles.length,
        processed: processedFeatured.length,
        sample: processedFeatured[0]?.title
      });
      setFeaturedArticles(processedFeatured);
    }
    
    if (premiumRes.data?.articles) {
      const processedPremium = processArticles(premiumRes.data.articles, 6);
      setPremiumArticles(processedPremium);
    }
    
    if (trendingRes.data?.articles) {
      const processedTrending = processArticles(trendingRes.data.articles, 6);
      setTrendingArticles(processedTrending);
    }
    
    if (editorsPickRes.data?.articles) {
      const processedEditorsPick = processArticles(editorsPickRes.data.articles, 4);
      setEditorsPickArticles(processedEditorsPick);
    }

    if (shortRes.data?.articles) {
      // First apply language, then filter by reading time
      const languageProcessed = processArticles(shortRes.data.articles, 20);
      
      const actualShortArticles = languageProcessed
        .filter(article => (article.readingTime || 5) <= 10)
        .slice(0, 6);
      
      console.log('⏱️ Short articles:', {
        original: shortRes.data.articles.length,
        languageFiltered: languageProcessed.length,
        readingTimeFiltered: actualShortArticles.length
      });
      
      setShortArticles(actualShortArticles);
    }

    console.log('✅ fetchSpecializedArticles completed successfully');
  } catch (error) {
    console.error('❌ Failed to load specialized articles:', error);
    
    // Fallback: Try without language parameter
    console.log('🔄 Trying fallback (no language filter)...');
    
    try {
      const [featuredRes] = await Promise.all([
        articleApi.getArticles({ featured: true, limit: 6 }),
      ]);
      
      if (featuredRes.data?.articles) {
        setFeaturedArticles(featuredRes.data.articles.slice(0, 6));
        console.log('🔄 Fallback succeeded with', featuredRes.data.articles.length, 'articles');
      }
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
    }
  }
};


// Add this useEffect to your component
useEffect(() => {
  console.log('🌐 Language changed! Refetching articles...', {
    oldLocale: currentLocale,
    newLocale: i18n.locale,
    shouldRefetch: true
  });
  
  // Refetch all articles with new language
  fetchArticles(true);
  fetchSpecializedArticles();
  
  // Also refetch categories if they have translations
  fetchCategories();
}, [currentLocale]); // This will run whenever the language changes

useEffect(() => {
  fetchArticles(true);
  fetchCategories();
  checkPremiumStatus();
  fetchSpecializedArticles();
}, [activeTab, filters, currentLocale]); // ← Add currentLocale here

// Also update this useEffect
useEffect(() => {
  if (page > 1) {
    fetchArticles(false);
  }
}, [page, currentLocale]); // ← Add currentLocale here


// Add this useEffect to monitor language changes 
  useEffect(() => {
    const handleLanguageChange = () => {
      console.log('🔄 Lingui language changed:', {
        locale: i18n.locale, // Use .locale instead of .language
        time: new Date().toISOString()
      });
    };
    
    // Log when the component re-renders with new locale
    console.log('🔄 ArticleFeed re-rendered with locale:', currentLocale);
  }, [currentLocale, i18n.locale]); // Add dependencies

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.5 }
    );
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading]);

  const handleFilterChange = (key: keyof FiltersState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Render a featured article card (larger, more prominent)
  const renderFeaturedArticle = (article: Article, index: number) => (
    <div key={article.id} className="relative h-full">
      <Card
        hoverable
        className="h-full border-0 hover:shadow-xl transition-all duration-500 text-gray-900"
        onClick={() => navigate(`/dashboard/article/${article.slug}`)}
        cover={
          article.coverImage ? (
            <div className="relative h-[354px] overflow-hidden">
              <Image
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                preview={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
              <div className="absolute top-4 left-4">
                <Badge color="blue" className="font-semibold bg-blue-200 rounded-xl px-2">
                  <Trans>Featured</Trans>
                </Badge>
              </div>
            </div>
          ) : null
        }
      >
        <div className="p-2">
          <div className="flex items-center gap-2 mb-2">
            <Avatar 
              src={article.author?.picture} 
              size="small"
              icon={!article.author?.picture && <UserOutlined />}
            />
            <div>
              <Text className="text-gray-900 text-sm">{article.author?.name || t`Unknown`}</Text>
              <Text className="ttext-gray-900 text-xs block">
                {new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric' 
                })}
              </Text>
            </div>
          </div>
          
          <Title level={4} className="text-white dark:text-gray-900 !mb-3 line-clamp-2">
            {article.title}
          </Title>
          
          <Paragraph className="text-gray-800 mb-4 line-clamp-3">
            {article.excerpt || t`Discover valuable insights in this featured article...`}
          </Paragraph>
          
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4 text-gray-600">
              <span className="flex items-center gap-1">
                <ClockCircleOutlined />
                <Text className="text-sm">{article.readingTime || 5} <Trans>min</Trans></Text>
              </span>
              <span className="flex items-center gap-1">
                <EyeOutlined className="text-blue-600"/>
                <Text className="text-sm">{article.viewCount || 0}</Text>
              </span>
            </div>
            <Button 
              type="primary" 
              ghost 
              size="small"
              className="border-white/30 hover:border-white/50"
            >
              <Trans>Read Article</Trans>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  // Render a regular article card
  const renderArticleCard = (article: Article, variant: 'default' | 'compact' = 'default') => {
    if (variant === 'compact') {
      return (
        <div key={article.id} className="mb-4">
          <div 
            className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer group"
            onClick={() => navigate(`/dashboard/article/${article.slug}`)}
          >
            <div className="flex-shrink-0">
              {article.coverImage ? (
                <div className="w-20 h-20 rounded-lg overflow-hidden">
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    preview={false}
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                  <BookOutlined className="text-blue-600 dark:text-blue-400 text-xl" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Text strong className="block text-foreground dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {article.title}
              </Text>
              <div className="flex items-center gap-3 text-sm text-muted-foreground dark:text-gray-400">
                <span>{article.author?.name?.split(' ')[0] || t`Author`}</span>
                <span>•</span>
                <span>{article.readingTime || 5} <Trans>min read</Trans></span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Col xs={24} sm={12} lg={8} xl={6} key={article.id}>
        <ArticleCard article={article} variant="default" />
      </Col>
    );
  };

  const tabs = [
    { key: 'featured', label: t`Featured`, icon: <StarOutlined />, condition: true },
    { key: 'trending', label: t`Trending`, icon: <FireOutlined />, condition: true },
    { key: 'editors-pick', label: t`Editor's Pick`, icon: <HighlightOutlined />, condition: true },
    { key: 'recent', label: t`Recent`, icon: <HistoryOutlined />, condition: true },
    { key: 'short', label: t`Quick Reads`, icon: <CoffeeOutlined />, condition: true },
    { key: 'premium', label: t`Premium`, icon: <CrownOutlined />, condition: true },
    { key: 'all', label: t`Articles`, icon: <CompassOutlined />, condition: true }
  ].filter(tab => tab.condition);



  // Render a special collection section
  const renderSpecialCollection = (collection: typeof specialCollections[0], index: number) => (
    <Card
      key={index}
      hoverable
      className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white dark:bg-gray-800"
      onClick={() => window.location.href = collection.link}
    >
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${collection.color} flex items-center justify-center mb-6 mx-auto`}>
        <div className="text-2xl text-white">{collection.icon}</div>
      </div>
      
      <Title level={4} className="text-center !mb-3 text-foreground dark:text-white">
        {collection.title}
      </Title>
      
      <Paragraph className="text-center text-muted-foreground dark:text-gray-400 mb-4">
        {collection.description}
      </Paragraph>
      
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Badge 
          count={`${collection.articlesCount} articles`}
          className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300"
        />
        <Button 
          type="link" 
          className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"
        >
          <Trans>Explore</Trans>
          <ArrowRightOutlined className="text-sm" />
        </Button>
      </div>
    </Card>
  );


const handleCategoryClick = (categorySlug: string) => {
  // Get current language code
  const languageCode = currentLocale.split('-')[0];
  
  // Navigate with language parameter
  navigate(`/dashboard/articles/all?cat=${categorySlug}&lang=${languageCode}`);
};
  
  // Render mixed layout section - Optimized for mobile & desktop
const renderMixedLayoutSection = (title: string, articles: Article[], variant: 'trending' | 'featured' | 'editors-pick') => {
  if (articles.length === 0) return null;
  
  const isMobile = window.innerWidth < 768;
  
  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Title level={2} className="!mb-2 text-3xl font-bold text-foreground dark:text-white">
            {title}
          </Title>
          <Text className="text-muted-foreground dark:text-gray-400">
            <Trans>Handpicked excellence from our knowledge base</Trans>
          </Text>
        </div>
        <Button 
          type="primary"
          ghost
          className="border-primary text-primary dark:border-blue-400 dark:text-blue-400 hover:bg-primary/10"
          onClick={() => handleViewAll(variant)}
        >
          <Trans>View All</Trans>
          <ArrowRightOutlined className="ml-2" />
        </Button>
      </div>
      
      {isMobile ? (
        // Mobile layout: Featured article followed by compact list
        <div className="space-y-6">
          {/* Featured article takes full width on mobile */}
          <div className='border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden'>
            {articles[0] && renderFeaturedArticle(articles[0], 0)}
          </div>
          
          {/* Compact articles list for mobile */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <Text strong className="text-gray-900 dark:text-gray-100">
                <Trans>More in this collection</Trans>
              </Text>
              <Badge count={articles.length - 1} style={{ backgroundColor: '#1890ff' }} />
            </div>
            
            {articles.slice(1, 5).map((article, index) => (
              <div key={article.id} className="mb-2">
                {renderArticleCard(article, 'compact')}
              </div>
            ))}
          </div>
          
          {/* View All Button for mobile */}
          <div className="pt-3 pb-3 border-t border-b border-blue-200 dark:border-gray-700">
            <Button 
              block 
              type="link" 
              className="text-primary dark:text-blue-400 font-medium"
              onClick={() => handleViewAll(variant)}
            >
              <Trans>View all {title.toLowerCase()}</Trans>
              <ArrowRightOutlined className="ml-2" />
            </Button>
          </div>
        </div>
      ) : (
        // Desktop layout: 2-column grid with default variant articles
        <Row gutter={[24, 24]}>
          {/* Main featured article (1/2 width) */}
          <Col xs={24} lg={12}>
            <div className='border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden'>
              {articles[0] && renderFeaturedArticle(articles[0], 0)}
            </div>
          </Col>
          
          {/* Side column with 2 default articles in a 2x1 grid (1/2 width) */}
          <Col xs={24} lg={12}>
            <div className="h-full">
              {/* Grid layout: 2 columns, each with a default ArticleCard */}
              <div className="grid grid-cols-2 gap-2 mb-8">
                {articles.slice(1, 3).map((article, index) => (
                  <div key={article.id} className="h-full">
                    {/* Using the default ArticleCard component */}
                    <ArticleCard article={article} variant="default" />
                  </div>
                ))}
              </div>
              
              {/* View All Button */}
              <div className="pt-5 border-t pb-5 border-b border-blue-200 dark:border-gray-700">
                <Button 
                  block 
                  type="link" 
                  className="text-primary dark:text-blue-600 font-medium"
                  onClick={() => handleViewAll(variant)}
                >
                  <Trans>View all {title.toLowerCase()}</Trans>
                  <ArrowRightOutlined className="ml-2" />
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
};
const renderFeaturedCarousel = () => {
  if (featuredArticles.length === 0) return null;

  const handlePrevSlide = () => carouselRef.current?.prev();
  const handleNextSlide = () => carouselRef.current?.next();

  return (
    <div className="mb-12 md:mb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center
       justify-between mb-2 md:mb-4 px-4 md:px-3">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <StarOutlined className="text-white text-sm md:text-lg" />
            </div>
            <span className="text-xs md:text-sm font-semibold text-blue-600 uppercase tracking-wider">
              <Trans>Featured Stories</Trans>
            </span>
          </div>
          <Title level={2} className="!mb-1 md:!mb-2 text-xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
            <Trans>Today's Spotlight</Trans>
          </Title>
          <Text className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            <Trans>Essential reads strategically selected for you!</Trans>
          </Text>
        </div>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              <Button
                type="text"
                shape="circle"
                icon={<LeftOutlined />}
                onClick={handlePrevSlide}
                disabled={activeCarousel === 0}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 w-10 h-10 flex items-center justify-center"
                size="middle"
              />
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {activeCarousel + 1}
                  <span className="mx-1 text-gray-400">/</span>
                  {featuredArticles.length}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400"><Trans>Slide</Trans></span>
              </div>
              <Button
                type={autoplay ? "default" : "primary"}
                shape="circle"
                icon={autoplay ? <PauseOutlined /> : <RightOutlined />}
                onClick={() => setAutoplay(!autoplay)}
                className={`w-10 h-10 flex items-center justify-center ${
                  autoplay 
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                size="middle"
              />
              <Button
                type="text"
                shape="circle"
                icon={<RightOutlined />}
                onClick={handleNextSlide}
                disabled={activeCarousel === featuredArticles.length - 1}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 w-10 h-10 flex items-center justify-center"
                size="middle"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Carousel */}
      <div className="relative">
        <Carousel
          ref={carouselRef}
          dots={false}
          effect="fade"
          afterChange={setActiveCarousel}
          autoplay={autoplay}
          autoplaySpeed={5000}
          className="rounded-lg bg-background md:rounded-2xl overflow-hidden shadow-md md:shadow-lg mx-2 md:mx-0"
        >
          {featuredArticles.map((article) => (
            <div key={article.id} className="relative">
              {/* Background Image with Gradient */}
              <div className="relative h-[280px] sm:h-[350px] md:h-[400px] lg:h-[400px] xl:h-[600px] overflow-hidden">
                <Image
                  src={article.coverImage || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=500&fit=crop'}
                  alt={article.title}
                  className="w-full h-full"
                  preview={false}
                />
                
                {/* Gradient Overlay - More prominent on mobile */}
                <div
                  className="
                    absolute inset-0
                    bg-gradient-to-t
                    from-gray-100 via-white/80 to-transparent
                    dark:from-gray-900 dark:via-gray-900/70 dark:to-transparent
                  "
                />

                {/* Content Container */}
                <div className="absolute  border border-gray-500 inset-0 flex items-end p-1 sm:p-1 md:p-2 lg:p-6">
                  <div className="w-full">
                    {/* Badge - Smaller on mobile */}
                    <div className="mb-2 md:mb-3">
                      <Badge 
                        count={t`Featured Story`}
                        color="blue"
                        className="text-xs md:text-sm font-medium px-2 md:px-3 py-0.5 md:py-1"
                        style={{ backgroundColor: 'rgba(37, 99, 235, 0.9)' }}
                      />
                    </div>
                    {/* Title - Responsive sizing */}
                    <Typography.Title 
                      level={window.innerWidth < 640 ? 5 : window.innerWidth < 768 ? 4 : 1} 
                      className="!mb-1 md:!mb-2 text-white font-bold leading-tight"
                    >
                      {article.title}
                    </Typography.Title>
                    
                    {/* Excerpt - Responsive line clamping */}
                    <Paragraph className="text-white! text-sm sm:text-base md:text-lg mb-0.5 md:mb-2 line-clamp-1 sm:line-clamp-3">
                      {article.excerpt || t`Discover valuable insights in this featured article...`}
                    </Paragraph>
                    
                    {/* Meta Information - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 md:gap-2 mb-1 md:mb-1">
                      <div className="flex items-center gap-2 md:gap-2 w-full sm:w-auto">
                        <Avatar 
                          src={article.author?.picture}
                          size={window.innerWidth < 640 ? "small" : "default"}
                          icon={!article.author?.picture && <UserOutlined />}
                          className="border border-white/30 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <Text strong className="text-white! text-sm md:text-base block truncate">
                            {article.author?.name || t`Unknown Author`}
                          </Text>
                          <div className="flex items-center gap-1 md:gap-2 text-gray-800 dark:text-white text-xs md:text-sm mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <CalendarOutlined className="text-xs" />
                              {new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: article.publishedAt?.includes('-') ? 'numeric' : undefined 
                              })}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center text-gray-800 dark:text-white gap-1 whitespace-nowrap">
                              <ClockCircleOutlined className="text-xs text-white!" />
                              {article.readingTime || 5} <Trans>min read</Trans>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 md:gap-4 sm:ml-auto">
                        <div className="flex items-center gap-1 md:gap-2 text-gray-800 dark:text-white  text-sm">
                          <EyeOutlined className="text-sm" />
                          <span className="font-medium">{(article.viewCount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 text-gray-800 dark:text-white text-sm">
                          <HeartOutlined className="text-sm" />
                          <span className="font-medium">{(article.likeCount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Call to Action - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center p-4 gap-2 md:gap-3">
                      <Button
                        type="primary"
                        size={window.innerWidth < 640 ? "middle" : "large"}
                        className="w-full sm:w-auto  border border-gray-700 py-1 bg-white text-gray-900 hover:bg-gray-100 font-semibold flex-1 sm:flex-none"
                        onClick={() => navigate(`/dashboard/article/${article.slug}`)}
                        icon={<ArrowRightOutlined />}
                      >
                        <Trans>Read Article</Trans>
                      </Button>
                     
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Carousel>

        {/* Slide Indicators - Improved for mobile */}
        <div className="mt-4 md:mt-6 px-2 md:px-0">
          {/* Progress Bar */}
          <div className="w-full max-w-xs sm:max-w-md mx-auto mb-3 md:mb-4">
            <Progress
              percent={((activeCarousel + 1) / featuredArticles.length) * 100}
              showInfo={false}
              strokeColor="#3b82f6"
              trailColor="#e5e7eb"
              className="dark:[&_.ant-progress-inner]:bg-gray-800 [&_.ant-progress-bg]:h-1.5"
              size="small"
            />
          </div>

          {/* Dots Navigation - Larger on mobile for touch */}
          <div className="flex items-center justify-center gap-2 md:gap-3">
            {featuredArticles.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveCarousel(index);
                  carouselRef.current?.goTo(index);
                }}
                className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  index === activeCarousel
                    ? 'w-6 h-2 md:w-8 md:h-2 bg-blue-600'
                    : 'w-2 h-2 md:w-2 md:h-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === activeCarousel}
              />
            ))}
          </div>

          {/* Slide Counter */}
          <div className="text-center mt-2 md:mt-3 text-xs md:text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {activeCarousel + 1}
            </span>
            <span className="mx-1 md:mx-2">/</span>
            <span>{featuredArticles.length}</span>
            <span className="ml-2 text-gray-400"><Trans>featured stories</Trans></span>
          </div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="md:hidden mt-6 px-4">
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Button
              type="text"
              shape="circle"
              icon={<LeftOutlined className="text-base" />}
              onClick={handlePrevSlide}
              disabled={activeCarousel === 0}
              size="middle"
              className="w-9 h-9 flex items-center justify-center"
            />
            <div className="flex flex-col items-center min-w-[60px]">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {activeCarousel + 1}
                <span className="mx-1">/</span>
                {featuredArticles.length}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400"><Trans>Slide</Trans></span>
            </div>
            <Button
              type="text"
              shape="circle"
              icon={<RightOutlined className="text-base" />}
              onClick={handleNextSlide}
              disabled={activeCarousel === featuredArticles.length - 1}
              size="middle"
              className="w-9 h-9 flex items-center justify-center"
            />
          </div>
          
          <Button
            type={autoplay ? "default" : "primary"}
            shape="circle"
            icon={autoplay ? <PauseOutlined /> : <PlayCircleOutlined />}
            onClick={() => setAutoplay(!autoplay)}
            className={`w-9 h-9 flex items-center justify-center ${
              autoplay 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            size="middle"
          />
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-4">
          <div className="text-center mb-4">
            <Badge 
              color="blue"
              className="mb-6 px-6 py-2 text-base font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full"
            >
              <RocketOutlined className="mr-2" />
              <Trans>Inlirah Knowledge Hub</Trans>
            </Badge>
            
            <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
              <Trans>Transform Information</Trans><br/>
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                <Trans>Into Understanding</Trans>
              </span>
            </h1>
            
            <p className="text-xl text-white/90 mb-4 max-w-3xl mx-auto">
              <Trans>Join professionals who leverage our curated knowledge 
              to stay ahead in their careers and make intelligent life decisions.</Trans>
            </p>
            
            {/* Buttons Container - Fixed */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
              <Button
                size="large"
                type="primary"
                className="h-10 px-6 bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 min-w-[170px] sm:min-w-[190px]"
                onClick={() => handleViewAll('featured')}
              >
                <ReadOutlined className="mr-2" />
                <Trans>Start Reading</Trans>
              </Button>
              
              <Button
                size="large"
                type="default"
                className="h-10 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 min-w-[180px] sm:min-w-[200px] border-0"
                onClick={() => handleViewAll('premium')}
              >
                <CrownOutlined className="mr-2" />
                <Trans>Access Premium</Trans>
              </Button>


              <Button
                size="large"
                type="primary"
                ghost
                className="border-2 h-10 px-6 hover:shadow-3xl border-white text-white hover:bg-white"
                icon={<CompassOutlined />}
                onClick={() => navigate('/dashboard/articles/all')}
              >
                <Trans>Browse All Articles</Trans>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 bg-background">
        {/* Knowledge Pillars */}
        <div className="mb-16">
          <Title level={2} className="text-center !mb-12 text-3xl font-bold text-foreground dark:text-white">
            <Trans>Why Our Knowledge Stands Out</Trans>
          </Title>
          <Row gutter={[24, 24]}>
            {knowledgePillars.map((pillar, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <div className="text-center p-6 border border-gray-200 dark:border-gray-900">
                  <div className={`w-16 h-16 rounded-2xl ${pillar.color} bg-opacity-10 flex items-center justify-center mb-4 mx-auto`}>
                    <div className={`text-2xl ${pillar.color}`}>{pillar.icon}</div>
                  </div>
                  <Title level={4} className="!mb-3 text-foreground dark:text-white">
                    {pillar.title}
                  </Title>
                  <Paragraph className="text-muted-foreground dark:text-gray-400">
                    {pillar.description}
                  </Paragraph>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Featured Carousel */}
        {featuredArticles.length > 0 && renderFeaturedCarousel()}

      
        {/* Mixed Layout: Editor's Pick */}
        {editorsPickArticles.length > 0 && renderMixedLayoutSection("Editor's Pick", editorsPickArticles, 'editors-pick')}

        {/* Trending Now Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <FireOutlined className="text-2xl text-orange-500" />
                <Title level={2} className="!mb-0 text-3xl font-bold text-foreground dark:text-white">
                  <Trans>Trending Now</Trans>
                </Title>
              </div>
              <Text className="text-muted-foreground dark:text-gray-400">
                <Trans>What the community is reading this week</Trans>
              </Text>
            </div>
            <Button 
              type="primary"
              ghost
              className="border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              onClick={() => handleViewAll('trending')}
            >
              <Trans>View all</Trans>
              <ArrowRightOutlined className="ml-2" />
            </Button>
          </div>
          
          {trendingArticles.length > 0 && (
            <Row gutter={[24, 24]}>
              {trendingArticles.slice(0, 3).map((article, index) => (
                <Col xs={24} lg={8} key={article.id}>
                  <Card
                    hoverable
                    className="h-full border border-gray-200 dark:border-black-900 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800"
                    onClick={() => navigate(`/dashboard/article/${article.slug}`)}
                  >
                    <div className="relative mb-4">
                      {article.coverImage && (
                        <div className="w-full h-48 rounded-lg overflow-hidden">
                          <Image
                            src={article.coverImage}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                            preview={false}
                          />
                        </div>
                      )}
                      <div className="absolute top-2 left-3 bg-blue-300 rounded-xl px-2">
                        <Badge 
                          color="orange" 
                          className="font-semibold px-3 py-1"
                        >
                          #{index + 1} <Trans>Trending</Trans>
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Avatar 
                            src={article.author?.picture}
                            size="small"
                            icon={!article.author?.picture && <UserOutlined />}
                          />
                          <Text className="text-sm text-muted-foreground dark:text-gray-400">
                            {article.author?.name?.split(' ')[0] || t`Author`}
                          </Text>
                        </div>
                        <Text className="text-sm text-muted-foreground dark:text-gray-400 flex items-center gap-1">
                          <EyeOutlined />
                          {article.viewCount?.toLocaleString() || '0'}
                        </Text>
                      </div>
                      
                      <Title level={4} className="!mb-3 line-clamp-2 text-foreground dark:text-white">
                        {article.title}
                      </Title>
                      
                      <Paragraph className="text-muted-foreground dark:text-gray-400 mb-4 line-clamp-2">
                        {article.excerpt || t`Read this trending article to stay informed...`}
                      </Paragraph>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                        <Text className="text-sm text-muted-foreground dark:text-gray-400 flex items-center gap-1">
                          <ClockCircleOutlined />
                          {article.readingTime || 5} <Trans>min read</Trans>
                        </Text>
                        <Button 
                          type="link" 
                          size="small"
                          className="text-blue-600 dark:text-blue-400"
                        >
                          <Trans>Read now</Trans>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>

        {/* Quick Reads Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <CoffeeOutlined className="text-2xl text-amber-500" />
             <div className="flex flex-col items-center justify-center text-center">
                <Title level={2} className="!mb-2 text-3xl font-bold text-foreground dark:text-white">
                  <Trans>Quick Reads</Trans>
                </Title>
                <Text className="text-muted-foreground dark:text-gray-400">
                  <Trans>Powerful insights under 10 minutes</Trans>
                </Text>
              </div>
            </div>
            <Button 
              type="primary"
              className="bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white hover:from-amber-600 hover:to-orange-600"
              onClick={() => handleViewAll('short')}
            >
              <Trans>Browse all</Trans>
              <ArrowRightOutlined className="ml-2" />
            </Button>
          </div>
          
          <Row gutter={[24, 24]}>
            {shortArticles.slice(0, 4).map((article, index) => (
              <Col xs={24} sm={12} lg={6} key={article.id}>
                <Card
                  hoverable
                  className="h-full border border-gray-200 dark:border-black-900 shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800"
                  onClick={() => navigate(`/dashboard/article/${article.slug}`)}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <Badge 
                        count={`${article.readingTime || 5} min`}
                        className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      />
                      {article.isPremium && (
                        <CrownOutlined className="text-amber-500" />
                      )}
                    </div>
                    
                    <Title level={4} className="!mb-3 line-clamp-3 text-foreground dark:text-white">
                      {article.title}
                    </Title>
                    
                    <Paragraph className="text-muted-foreground dark:text-gray-400 mb-4 line-clamp-2">
                      {article.excerpt || t`Quick insight you can apply immediately...`}
                    </Paragraph>
                    
                    <div className="flex items-center justify-between">
                      <Text className="text-sm text-muted-foreground dark:text-gray-400">
                        {article.author?.name?.split(' ')[0] || t`Expert`}
                      </Text>
                      <Button 
                        type="text" 
                        size="small"
                        className="text-blue-600 dark:text-blue-400"
                      >
                        <Trans>Read →</Trans>
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Main Content Area with Tabs */}
        <div className="mb-16" id="main-content">
          <div className="bg-background rounded-2xl">
            {/* Tab Navigation */}
            <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {tabs.map(tab => (
                  <Button
                    key={tab.key}
                    type={activeTab === tab.key ? "primary" : "text"}
                    className={cn(
                      "px-6 py-3 rounded-lg font-medium transition-colors",
                      "hover:text-gray-900 dark:hover:text-white",
                      activeTab === tab.key
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-600 dark:hover:bg-gray-100"
                    )}
                    onClick={() => handleTabChange(tab.key)}
                    icon={tab.icon}
                  >
                    {tab.label}
                  </Button>

                ))}
              </div>
            </div>

            {/* Advanced Search */}
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                  <Search
                    placeholder={t`Search articles, topics, or authors...`}
                    allowClear
                    enterButton={<SearchOutlined />}
                    size="large"
                    onSearch={handleSearch}
                    className="w-full"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                  <Select
                    placeholder={t`Category`}
                    allowClear
                    size="middle"
                    className="min-w-[140px]"
                    onChange={(value) => handleFilterChange('category', value)}
                    value={filters.category || undefined}
                  >
                    {categories.map(category => (
                      <Option key={category.id} value={category.slug}>
                        <div className="flex items-center gap-2">
                          <FolderOutlined />
                          <span>{category.name}</span>
                        </div>
                      </Option>
                    ))}
                  </Select>
                  
                  <Select
                    placeholder={t`Reading Time`}
                    size="middle"
                    className="min-w-[160px]"
                    onChange={(value) => handleFilterChange('readingTime', value)}
                    value={filters.readingTime}
                  >
                    <Option value="short"><Trans>Quick Reads (≤10 min)</Trans></Option>
                    <Option value="medium"><Trans>Medium (10-20 min)</Trans></Option>
                    <Option value="long"><Trans>Deep Dives (20+ min)</Trans></Option>
                  </Select>
                  
                  <Select
                    placeholder={t`Sort by`}
                    size="middle"
                    className="min-w-[140px]"
                    onChange={(value) => handleFilterChange('sort', value)}
                    value={filters.sort}
                  >
                    <Option value="recent"><Trans>Most Recent</Trans></Option>
                    <Option value="popular"><Trans>Most Popular</Trans></Option>
                    <Option value="trending"><Trans>Trending Now</Trans></Option>
                    <Option value="reading_time"><Trans>Reading Time</Trans></Option>
                  </Select>
                  
                  <Button
                    type="default"
                    icon={<FilterOutlined />}
                    onClick={() => {
                      // Reset filters
                      setFilters({ category: '', tag: '', sort: 'recent', search: '' });
                    }}
                  >
                    <Trans>Clear Filters</Trans>
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile-Optimized Header */}
            {articles.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                {/* Text Section */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      {activeTab === 'featured' && <StarOutlined className="text-blue-600 dark:text-blue-400 text-sm sm:text-base" />}
                      {activeTab === 'recent' && <HistoryOutlined className="text-blue-600 dark:text-blue-400 text-sm sm:text-base" />}
                      {activeTab === 'trending' && <FireOutlined className="text-orange-600 dark:text-orange-400 text-sm sm:text-base" />}
                      {activeTab === 'short' && <CoffeeOutlined className="text-amber-600 dark:text-amber-400 text-sm sm:text-base" />}
                      {activeTab === 'premium' && <CrownOutlined className="text-amber-600 dark:text-amber-400 text-sm sm:text-base" />}
                      {activeTab === 'editors-pick' && <HighlightOutlined className="text-purple-600 dark:text-purple-400 text-sm sm:text-base" />}
                      {activeTab === 'all' && <CompassOutlined className="text-blue-600 dark:text-blue-400 text-sm sm:text-base" />}
                    </div>
                    <div>
                      <Text strong className="text-lg sm:text-xl text-foreground dark:text-white">
                        {activeTab === 'featured' ? t`Featured` :
                        activeTab === 'recent' ? t`Latest` :
                        activeTab === 'trending' ? t`Trending` :
                        activeTab === 'short' ? t`Quick Reads` :
                        activeTab === 'premium' ? t`Premium` :
                        activeTab === 'editors-pick' ? t`Editor's Picks` :
                        t`Articles`}
                      </Text>
                      <Text className="text-sm text-muted-foreground dark:text-gray-400 block">
                        {articles.length} <Trans>articles</Trans>
                      </Text>
                    </div>
                  </div>
                </div>
                
                {/* Button - Full width on mobile, auto width on desktop */}
                <Button
                  size={window.innerWidth < 640 ? "middle" : "large"}
                  type="primary"
                  ghost
                  className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  icon={<CompassOutlined />}
                  onClick={() => navigate('/dashboard/articles/all')}
                >
                  <span className="hidden sm:inline"><Trans>Browse All Articles</Trans></span>
                  <span className="sm:hidden"><Trans>View All</Trans></span>
                </Button>
              </div>
            )}
            {/* Articles Grid */}
            {articles.length > 0 ? (
              <>
                <Row gutter={[24, 24]}>
                  {articles.map(article => renderArticleCard(article))}
                </Row>
                
                {/* Load More */}
                {hasMore && !loading && (
                  <div ref={loadMoreRef} className="mt-12 text-center">
                    <Button 
                      type="dashed" 
                      size="large"
                      className="px-12"
                      loading={loading}
                      onClick={() => setPage(prev => prev + 1)}
                    >
                      <Trans>Load More Articles</Trans>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              !loading && (
                <div className="py-16 text-center">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div>
                        <Title level={4} className="!mb-4 text-foreground dark:text-white">
                          <Trans>No articles found</Trans>
                        </Title>
                        <Paragraph className="text-muted-foreground dark:text-gray-400 mb-8">
                          {filters.search 
                            ? t`No results for "${filters.search}". Try different keywords.`
                            : t`No articles match your current filters. Try adjusting your criteria.`}
                        </Paragraph>
                        <div className="flex gap-4 justify-center">
                          <Button 
                            type="primary"
                            onClick={() => {
                              setFilters({ category: '', tag: '', sort: 'recent', search: '' });
                              setActiveTab('all');
                            }}
                          >
                            <Trans>Clear Filters</Trans>
                          </Button>
                          <Button onClick={() => navigate('/dashboard/categories')}>
                            <Trans>Browse Categories</Trans>
                          </Button>
                        </div>
                      </div>
                    }
                  />
                </div>
              )
            )}

            {/* Loading State */}
            {loading && (
              <Row gutter={[24, 24]} className="mt-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={i}>
                    <Card className="border-0 shadow-sm">
                      <Skeleton active avatar paragraph={{ rows: 3 }} />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </div>

        {/* Enhanced Category Explorer */}
        <div className="mb-20">
          {/* Centered Header */}
          <div className="mb-14 text-center px-4">
          {/* Icon + Title */}
          <div className="flex flex-col items-center gap-4 mb-5">
            <div className="flex items-center justify-center w-14 h-14 rounded-full
                            bg-blue-100 dark:bg-blue-900/40 shadow-sm">
              <CompassOutlined className="text-blue-600 dark:text-blue-400 text-2xl" />
            </div>

            <Title
              level={2}
              className="!mb-0 text-3xl sm:text-4xl font-bold
                        text-gray-900 dark:text-white"
            >
              <Trans>Knowledge Topics</Trans>
            </Title>
          </div>

          {/* Description */}
          <Text
            className="block text-base sm:text-lg
                      text-gray-600 dark:text-gray-400
                      max-w-2xl mx-auto leading-relaxed"
          >
            <Trans>On Inlirah, every knowledge domain is intentionally engineered by experts to reshape thinking, unlock career clarity, and drive meaningful progress.</Trans>
          </Text>
        </div>


          {/* Larger Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.slice(0, 8).map(category => {
              const categoryColor = category.color || '#3b82f6';
              
              return (
                <Card
                  key={category.id}
                  hoverable
                  className="h-full border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  onClick={() => handleCategoryClick(category.slug)}  // Use the new function
                >
                  {/* Color accent using stored color */}
                  <div 
                    className="h-3 w-full mb-6 rounded-t-lg"
                    style={{ backgroundColor: categoryColor }}
                  />
                  
                  <div className="text-center px-4 py-2">
                    {/* Icon with subtle glow */}
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-md"
                      style={{ 
                        backgroundColor: `${categoryColor}15`,
                        color: categoryColor
                      }}
                    >
                      <FolderOutlined className="text-xl" />
                    </div>
                    
                    {/* Category name with color */}
                    <Title 
                      level={4} 
                      className="!mb-2 text-xl font-bold"
                      style={{ color: categoryColor }}
                    >
                      {category.name}
                    </Title>
                    
                    {/* Brief description if available */}
                    {category.description && (
                      <Text className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {category.description}
                      </Text>
                    )}
                  
                    
                    {/* Explore button - updated to prevent event bubbling */}
                    <Button 
                      type="link" 
                      className="p-0 font-medium text-blue-600 hover:text-blue-800"
                      icon={<ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click event
                        handleCategoryClick(category.slug);
                      }}
                    >
                      <Trans>Explore Topic</Trans>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Centered View All Button */}
          <div className="mt-12 flex flex-col items-center text-center">
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/dashboard/categories')}
              icon={<CompassOutlined />}
              className="
                relative flex items-center gap-3
                px-10 py-6 text-lg font-semibold
                rounded-2xl shadow-lg
                hover:shadow-xl transition-all
              "
            >
              <Trans>View All Categories</Trans>

              {/* Badge */}
              <span
                className="
                  ml-2 inline-flex items-center justify-center
                  min-w-[28px] h-7 px-2
                  rounded-full text-sm font-bold
                  bg-white text-blue-600
                  dark:bg-gray-900 dark:text-blue-400
                "
              >
                {categories.length}
              </span>
            </Button>

            <Text className="mt-4 max-w-md text-sm sm:text-base text-gray-500 dark:text-gray-400">
              <Trans>Dive deeper into {categories.length} expertly curated knowledge domains on Inlirah</Trans>
            </Text>
          </div>

        </div>

{/* Premium Section */}
{!userHasPremium && (
  <div className="mb-16">
    <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900 rounded-2xl p-4 text-white shadow-2xl">
      <div className="text-center max-w-3xl mx-auto">
        <CrownOutlined className="text-4xl text-yellow-300 mb-6" />
        <Title level={2} className="!text-white !mb-6">
          <Trans>Unlock Premium Knowledge</Trans>
        </Title>
        <Paragraph className="text-xl text-purple-100 mb-10">
          <Trans>Step into premium knowledge - exclusive insights, expert voices, and in-depth research built to move your career forward with clarity and confidence.</Trans>
        </Paragraph>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="large"
            type="primary"
            className="bg-white text-purple-900 hover:bg-gray-100 font-bold px-4"
            onClick={() => navigate('/dashboard/articles/all?access=premium')}
          >
            <Trans>Access Premium Articles</Trans>
          </Button>
        
        </div>
      </div>
    </div>
  </div>
)}

{/* Final CTA */}
<div className="text-center mb-16">
  <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-12 text-white shadow-2xl">
    <Title level={2} className="!text-white !mb-6">
      <Trans>Ready to Accelerate Your Learning?</Trans>
    </Title>
    <Paragraph className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
      <Trans>Join thousands of professionals who use our knowledge hub to stay ahead. 
      Whether you're building expertise, leading teams, or transforming industries.</Trans>
    </Paragraph>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      {/* SIMPLIFY: Use only access parameter */}
      <Button
        size="large"
        type="primary"
        className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-8"
        onClick={() => navigate('/dashboard/articles/all?access=free')}
        
      >
        <Trans>Start Reading Free</Trans>
      </Button>
      {/* For trending, use only tab parameter */}
      <Button
        size="large"
        type="default"
        className="bg-transparent text-white border-2 border-white/30 hover:border-white/50"
        onClick={() => navigate('/dashboard/articles/all?tab=trending')}
      >
        <FireOutlined className="mr-2" />
        <Trans>Trending Articles</Trans>
      </Button>
      {/* For featured, use only tab parameter */}
      <Button
        size="large"
        type="default"
        className="bg-transparent text-white border-2 border-white/30 hover:border-white/50"
        onClick={() => navigate('/dashboard/articles/all?tab=featured')}
      >
        <StarOutlined className="mr-2" />
        <Trans>Featured Articles</Trans>
      </Button>
    </div>
  </div>
</div>
      </div>

      {/* Floating Actions */}
      <FloatButton.Group shape="circle" style={{ right: 24, bottom: 100 }}>
        <FloatButton.BackTop icon={<ArrowUpOutlined />} />
        <FloatButton 
          icon={<SearchOutlined />}
          onClick={() => document.getElementById('main-content')?.scrollIntoView()}
          tooltip={<Trans>Search Articles</Trans>}
        />
        <FloatButton 
          icon={<BookOutlined />}
          onClick={() => navigate('/dashboard/myarticles')}
          tooltip={<Trans>My Library</Trans>}
        />
        <FloatButton 
          icon={<CompassOutlined />}
          onClick={() => navigate('/dashboard/articles/all')}
          tooltip={<Trans>Explore All</Trans>}
        />
      </FloatButton.Group>
    </div>
  );
};

export default ArticleFeed;