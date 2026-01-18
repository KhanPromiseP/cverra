// components/articles/AllArticlesPage.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Tag,
  Space,
  Badge,
  Divider,
  Checkbox,
  Radio,
  Slider,
  Switch,
  Drawer,
  Dropdown,
  Menu,
  Progress,
  Tooltip,
  Modal,
  Alert,
  Statistic,
  notification,
  Spin,
  Popover,
  InputNumber,
  DatePicker
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
  BookOutlined,
  RocketOutlined,
  BulbOutlined,
  ReadOutlined,
  ArrowUpOutlined,
  CompassOutlined,
  ArrowRightOutlined,
  CoffeeOutlined,
  LockOutlined,
  UnlockOutlined,
  TeamOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
  LineChartOutlined,
  FileTextOutlined,
  FolderOutlined,
  TagOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  SyncOutlined,
  AimOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  SolutionOutlined,
  DeploymentUnitOutlined,
  AppstoreOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  CloseCircleOutlined,
  CheckCircleFilled,
  StarFilled,
  FireFilled,
  CrownFilled,
  BulbFilled,
  TagFilled,
  UpOutlined,
  DownOutlined,
  ArrowDownOutlined,
  ExportOutlined,
  ImportOutlined,
  ColumnWidthOutlined,
  OrderedListOutlined,
  AppstoreAddOutlined,
  FilterFilled,
  ThunderboltOutlined,
  CalendarOutlined,
  UserOutlined,
  PercentageOutlined,
  CheckOutlined,
  CloseOutlined,
  MoreOutlined,
  ContainerOutlined,
  SlidersOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router';
import articleApi, { Article, FilterParams, Category } from '../../services/articleApi';
import { useAuthStore } from '@/client/stores/auth';
import ArticleCard from './ArticleCard';
import debounce from 'lodash/debounce';
import './AllArticlesPage.css';
import dayjs, { Dayjs } from 'dayjs';

import { useLingui } from "@lingui/react";
import { t, Trans } from "@lingui/macro";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface AllArticlesPageProps {
  showHero?: boolean;
}

interface FilterState {
  // Core filters
  search: string;
  category: string;
  sort: 'recent' | 'popular' | 'trending' | 'reading_time';
  accessType: 'all' | 'free' | 'premium';
  readingTime: 'any' | 'short' | 'medium' | 'long';
  
  // Extended filters
  tags: string[];
  authors: string[];
  language: string;
  featured: boolean | null;
  minViews: number;
  dateRange: [Dayjs | null, Dayjs | null];
  // UI state
  viewMode: 'grid' | 'list' | 'compact';
  itemsPerPage: 12 | 24 | 36 | 48;
  showAdvanced: boolean;
}

interface ArticleStats {
  total: number;
  free: number;
  premium: number;
  featured: number;
  trending: number;
  averageRating: number;
  totalViews: number;
  totalLikes: number;
  categories: Array<{
    id: string;
    name: string;
    count: number;
  }>;
}

const AllArticlesPage: React.FC<AllArticlesPageProps> = ({ 
  showHero = true 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const { i18n } = useLingui(); // Add Lingui hook
  
  // Get current UI language
  const currentLanguage = i18n.locale.split('-')[0];
  
  // State management
  const [articles, setArticles] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]); // Store all fetched articles
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [stats, setStats] = useState<ArticleStats | null>(null);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    sort: 'recent',
    accessType: 'all',
    readingTime: 'any',
    tags: [],
    authors: [],
    language: 'all',
    featured: null,
    minViews: 0,
    dateRange: [null, null],
    viewMode: 'grid',
    itemsPerPage: 24,
    showAdvanced: false
  });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalArticles, setTotalArticles] = useState(0);
  
  // UI state
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  
  // Refs
  const filtersRef = useRef<FilterState>(filters); // Keep reference to current filters
  const allArticlesRef = useRef<Article[]>([]); // Keep reference to all articles

  // Keep refs updated
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    allArticlesRef.current = allArticles;
  }, [allArticles]);

  // ========== URL HANDLING ==========
  const updateURL = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams();
    
    // Only include non-default values
    if (newFilters.search) params.set('q', newFilters.search);
    if (newFilters.category) params.set('cat', newFilters.category);
    if (newFilters.sort !== 'recent') params.set('sort', newFilters.sort);
    if (newFilters.accessType !== 'all') params.set('access', newFilters.accessType);
    if (newFilters.readingTime !== 'any') params.set('time', newFilters.readingTime);
    if (newFilters.language !== 'all') params.set('lang', newFilters.language);
    if (newFilters.featured !== null) params.set('featured', newFilters.featured.toString());
    if (newFilters.minViews > 0) params.set('views', newFilters.minViews.toString());
    if (newFilters.tags.length > 0) params.set('tags', newFilters.tags.join(','));
    
    
    // Update URL without page reload
    const newUrl = `${location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [location.pathname]);

  const parseURL = useCallback(() => {
  const params = new URLSearchParams(location.search);
  const newFilters: Partial<FilterState> = {};
  
  console.log('📱 Parsing URL:', location.search);
  
  // Parse URL parameters - ORDER MATTERS!
  
  // Handle tab parameter FIRST (it might override other params)
  const tab = params.get('tab');
  if (tab) {
    console.log('🎯 Found tab parameter:', tab);
    switch (tab) {
      case 'featured':
        newFilters.sort = 'popular';
        newFilters.featured = true;
        break;
      case 'trending':
        newFilters.sort = 'trending';
        break;
      case 'short':
        newFilters.readingTime = 'short';
        break;
      case 'premium':
        newFilters.accessType = 'premium';
        break;
    }
  }
  
  // Now parse individual parameters
  // access parameter should override tab=premium if both exist
  if (params.get('access')) {
    newFilters.accessType = params.get('access') as any;
    console.log('🔓 Overriding accessType from access param:', newFilters.accessType);
  }
  
  // Other parameters
  if (params.get('q')) newFilters.search = params.get('q') || '';
  if (params.get('cat')) newFilters.category = params.get('cat') || '';
  if (params.get('sort')) newFilters.sort = params.get('sort') as any || 'recent';
  if (params.get('time')) newFilters.readingTime = params.get('time') as any || 'any';
  if (params.get('lang')) newFilters.language = params.get('lang') || 'all';
  if (params.get('featured')) newFilters.featured = params.get('featured') === 'true';
  if (params.get('views')) newFilters.minViews = Number(params.get('views')) || 0;
  if (params.get('tags')) newFilters.tags = params.get('tags')?.split(',') || [];
  
  console.log('📋 Final parsed filters:', {
    accessType: newFilters.accessType,
    featured: newFilters.featured,
    sort: newFilters.sort,
    tab: tab
  });
  
  return newFilters;
}, [location.search]);

  // ========== CLIENT-SIDE FILTERING FUNCTIONS ==========
  const applyClientSideFilters = useCallback((articles: Article[], activeFilters: FilterState) => {
    if (articles.length === 0) return [];
    
    console.log('🔄 Applying client-side filters to', articles.length, 'articles');
    
    let filtered = [...articles];
    
    // 1. Reading Time Filter - CLIENT-SIDE
    if (activeFilters.readingTime !== 'any') {
      console.log('📊 Applying reading time filter:', activeFilters.readingTime);
      filtered = filtered.filter(article => {
        const readingTime = article.readingTime || 5;
        
        switch (activeFilters.readingTime) {
          case 'short':
            return readingTime < 10; // Less than 10 minutes
          case 'medium':
            return readingTime >= 10 && readingTime <= 20; // 10-20 minutes
          case 'long':
            return readingTime > 20; // More than 20 minutes
          default:
            return true;
        }
      });
      console.log('✅ After reading time filter:', filtered.length, 'articles');
    }
    
    // 2. Minimum Views Filter - CLIENT-SIDE
    if (activeFilters.minViews > 0) {
      console.log('👁️ Applying min views filter:', activeFilters.minViews);
      filtered = filtered.filter(
        article => (article.viewCount || 0) >= activeFilters.minViews
      );
      console.log('✅ After min views filter:', filtered.length, 'articles');
    }
    
    // 3. Date Range Filter - CLIENT-SIDE
    if (activeFilters.dateRange[0] && activeFilters.dateRange[1]) {
      console.log('📅 Applying date range filter:', activeFilters.dateRange);
      
      // Convert Dayjs to Date properly
      const startDate = activeFilters.dateRange[0].toDate(); // Use .toDate() method
      const endDate = activeFilters.dateRange[1].toDate();   // Use .toDate() method
      endDate.setHours(23, 59, 59, 999); // Include entire end day
      
      filtered = filtered.filter(article => {
        const articleDate = new Date(article.publishedAt || article.createdAt);
        return articleDate >= startDate && articleDate <= endDate;
      });
      console.log('✅ After date range filter:', filtered.length, 'articles');
    }
    
    // 4. Featured Filter - CLIENT-SIDE
    if (activeFilters.featured !== null) {
      console.log('⭐ Applying featured filter:', activeFilters.featured);
      filtered = filtered.filter(article => 
        activeFilters.featured ? article.isFeatured : !article.isFeatured
      );
      console.log('✅ After featured filter:', filtered.length, 'articles');
    }
    
    // 5. Access Type Filter - CLIENT-SIDE
    if (activeFilters.accessType !== 'all') {
      console.log('🔓 Applying access type filter:', activeFilters.accessType);
      const accessTypeMap = {
        'free': 'FREE',
        'premium': 'PREMIUM'
      };
      const targetAccessType = accessTypeMap[activeFilters.accessType];
      
      if (targetAccessType) {
        filtered = filtered.filter(
          article => article.accessType === targetAccessType
        );
      }
      console.log('✅ After access type filter:', filtered.length, 'articles');
    }
    
    // 6. Tags Filter - CLIENT-SIDE
    if (activeFilters.tags.length > 0) {
      console.log('🏷️ Applying tags filter:', activeFilters.tags);
      filtered = filtered.filter(article => {
        if (!article.tags || !Array.isArray(article.tags)) return false;
        return activeFilters.tags.some(tag => article.tags.includes(tag));
      });
      console.log('✅ After tags filter:', filtered.length, 'articles');
    }
    
    // 7. Apply sorting - CLIENT-SIDE
    console.log('🔢 Applying sort:', activeFilters.sort);
    filtered.sort((a, b) => {
      switch (activeFilters.sort) {
        case 'recent':
          return new Date(b.publishedAt || b.createdAt).getTime() - 
                 new Date(a.publishedAt || a.createdAt).getTime();
        
        case 'popular':
          return (b.viewCount || 0) - (a.viewCount || 0);
        
        case 'trending':
          // Combine view count and recency for trending
          const bScore = (b.viewCount || 0) + 
                        (b.isTrending ? 1000 : 0) +
                        (new Date().getTime() - new Date(b.publishedAt || b.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          const aScore = (a.viewCount || 0) + 
                        (a.isTrending ? 1000 : 0) +
                        (new Date().getTime() - new Date(a.publishedAt || a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return bScore - aScore;
        
        case 'reading_time':
          return (a.readingTime || 5) - (b.readingTime || 5);
        
        default:
          return 0;
      }
    });
    
    console.log('🎉 Final filtered count:', filtered.length, 'articles');
    return filtered;
  }, []);

  // ========== REAL-TIME CLIENT-SIDE FILTERING ==========
  // This is the KEY FIX: Apply filters immediately when they change
  const applyFiltersImmediately = useCallback(() => {
    if (allArticlesRef.current.length === 0) {
      console.log('⚠️ No articles to filter');
      return;
    }
    
    console.log('🚀 Applying filters IMMEDIATELY with:', {
      readingTime: filtersRef.current.readingTime,
      accessType: filtersRef.current.accessType,
      minViews: filtersRef.current.minViews,
      featured: filtersRef.current.featured,
      tags: filtersRef.current.tags,
      dateRange: filtersRef.current.dateRange,
      sort: filtersRef.current.sort
    });
    
    const filtered = applyClientSideFilters(allArticlesRef.current, filtersRef.current);
    const startIndex = (page - 1) * filtersRef.current.itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + filtersRef.current.itemsPerPage);
    
    setArticles(paginated);
    setTotalArticles(filtered.length);
    setHasMore((page * filtersRef.current.itemsPerPage) < filtered.length);
    
  }, [page, applyClientSideFilters]);

  // Watch for client-side filter changes and apply immediately
  useEffect(() => {
    const clientSideFilters = [
      filters.readingTime,
      filters.accessType,
      filters.minViews,
      filters.featured,
      filters.tags,
      filters.dateRange[0]?.toString(),
      filters.dateRange[1]?.toString(),
      filters.sort
    ];
    
    if (allArticles.length === 0) return;
    
    console.log('🎯 Client-side filter changed, applying immediately');
    applyFiltersImmediately();
    
  }, [
    filters.readingTime,
    filters.accessType,
    filters.minViews,
    filters.featured,
    filters.tags,
    filters.dateRange[0],
    filters.dateRange[1],
    filters.sort,
    allArticles.length,
    page,
    applyFiltersImmediately
  ]);

  // ========== DATA FETCHING ==========
  const fetchArticles = useCallback(async (reset = false, customFilters?: FilterState) => {
    if (loading) return;
    
    // Always use the most up-to-date filters
    const activeFilters = customFilters || filtersRef.current;
    const currentPage = reset ? 1 : page;
    
    setLoading(true);
    
    try {
      // Build API params for SERVER-SIDE filters only
      const apiParams: any = {
        page: currentPage,
        limit: 100, // Fetch more for client-side filtering
      };
      
      // Only send filters that work server-side
      if (activeFilters.search) apiParams.search = activeFilters.search;
      if (activeFilters.category) apiParams.category = activeFilters.category;
      
      // Sort - server-side if possible
      if (activeFilters.sort) apiParams.sort = activeFilters.sort;
      
      console.log('📡 Fetching articles with server filters:', {
        search: activeFilters.search,
        category: activeFilters.category,
        sort: activeFilters.sort
      });
      
      const response = await articleApi.getArticles(apiParams);
      
      let newArticles: Article[] = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          newArticles = response.data;
        } else if (response.data.articles && Array.isArray(response.data.articles)) {
          newArticles = response.data.articles;
        }
      }
      
      // Store all fetched articles
      if (reset || currentPage === 1) {
        setAllArticles(newArticles);
      } else {
        setAllArticles(prev => [...prev, ...newArticles]);
      }
      
      // Apply ALL client-side filters immediately
      const filteredArticles = applyClientSideFilters(newArticles, activeFilters);
      
      // Apply pagination
      const startIndex = (currentPage - 1) * activeFilters.itemsPerPage;
      const paginatedArticles = filteredArticles.slice(
        startIndex, 
        startIndex + activeFilters.itemsPerPage
      );
      
      if (reset || currentPage === 1) {
        setArticles(paginatedArticles);
      } else {
        setArticles(prev => [...prev, ...paginatedArticles]);
      }
      
      setTotalArticles(filteredArticles.length);
      
      // Determine if there are more articles
      const displayedCount = (reset ? 0 : articles.length) + paginatedArticles.length;
      setHasMore(displayedCount < filteredArticles.length);
      
      if (reset) setPage(currentPage);
      
      // Update URL
      updateURL(activeFilters);
      
    } catch (error) {
      console.error('Failed to load articles:', error);
      notification.error({
        message: t`Error`,
        description: t`Failed to load articles. Please try again.`,
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [page, loading, updateURL, articles.length, applyClientSideFilters]);

 const fetchCategories = async () => {
  try {
    console.log('📡 Fetching categories in language:', currentLanguage);
    
    // Pass currentLanguage to the API
    const response = await articleApi.getCategories(currentLanguage) as any;
    
    console.log('Full API response:', response);
    
    // Try different possible structures
    let categoriesArray: Category[] = [];
    
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
    
    console.log('Categories loaded in', currentLanguage, ':', categoriesArray.length);
    setCategories(categoriesArray);
    
  } catch (error) {
    console.error('Failed to load categories:', error);
    setCategories([]);
  }
};

  const fetchStats = async () => {
    try {
      const response = await articleApi.getArticleOverviewStats();
      if (response?.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await articleApi.getArticles({ limit: 100 });
      if (response.data?.articles) {
        const allTags = new Set<string>();
        response.data.articles.forEach((article: Article) => {
          if (article.tags && Array.isArray(article.tags)) {
            article.tags.forEach(tag => allTags.add(tag));
          }
        });
        setTags(Array.from(allTags));
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  
  // ========== INITIAL LOAD ==========
  useEffect(() => {
    const urlFilters = parseURL();
    console.log('🔄 Initial URL filters:', urlFilters);
    
    // Create complete filters object with URL params
    const initialFilters: FilterState = {
      search: urlFilters.search || '',
      category: urlFilters.category || '',
      sort: urlFilters.sort || 'recent',
      // FIX: Use URL accessType, fallback to 'all' if not specified
      accessType: urlFilters.accessType || 'all',
      // FIX: Use URL readingTime, fallback to 'any'
      readingTime: urlFilters.readingTime || 'any',
      tags: urlFilters.tags || [],
      authors: [],
      // FIX: Use URL language, fallback to 'all'
      language: urlFilters.language || 'all',
      featured: urlFilters.featured !== undefined ? urlFilters.featured : null,
      minViews: urlFilters.minViews || 0,
      dateRange: [null, null] as [Dayjs | null, Dayjs | null],
      viewMode: 'grid',
      itemsPerPage: 24,
      showAdvanced: false
    };
    
    console.log('🎯 Setting initial filters with URL values:', initialFilters);
    
    // Set filters immediately
    setFilters(initialFilters);
    
    // Also update the ref immediately
    filtersRef.current = initialFilters;
    
    fetchCategories();
    fetchStats();
    fetchTags();
    
    // Fetch articles with the URL filters
    setTimeout(() => {
      console.log('📡 Fetching with URL filters - accessType:', initialFilters.accessType);
      fetchArticles(true, initialFilters);
    }, 100);
  }, [currentLanguage]);

  // ========== FILTER HANDLING ==========
  // Unified filter handler for ALL filters
  const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
    console.log('🎛️ Filter changed:', key, '=', value);
    
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset to page 1 when filters change (except UI-only filters)
      if (key !== 'viewMode' && key !== 'itemsPerPage' && key !== 'showAdvanced') {
        setPage(1);
      }
      
      // Update URL for relevant filters
      if (['search', 'category', 'sort'].includes(key)) {
        updateURL(newFilters);
      }
      
      // Check what type of filter this is
      const isServerSideFilter = ['search', 'category', 'sort'].includes(key);
      const isClientSideFilter = [
        'readingTime', 'accessType', 'minViews', 'featured', 
        'tags', 'dateRange', 'language', 'authors'
      ].includes(key);
      
      // If it's a server-side filter, fetch new data
      if (isServerSideFilter) {
        fetchArticles(true, newFilters);
      }
      // If it's a client-side filter, apply immediately
      else if (isClientSideFilter && allArticlesRef.current.length > 0) {
        // Apply filters immediately - this will trigger the useEffect
        console.log('⚡ Client-side filter, applying immediately');
      }
      
      return newFilters;
    });
  }, [updateURL, fetchArticles]);

  // Real-time search with debounce
  const handleSearchChange = useCallback(
    debounce((value: string) => {
      const newFilters = { ...filtersRef.current, search: value };
      setFilters(newFilters);
      updateURL(newFilters);
      fetchArticles(true, newFilters);
    }, 500),
    [updateURL, fetchArticles]
  );

  // Reset all filters - SINGLE CLICK FIXED
  const handleResetFilters = useCallback(() => {
  console.log('Resetting all filters');
  
  const resetFilters: FilterState = {
    search: '',
    category: '',
    sort: 'recent', 
    accessType: 'all',
    readingTime: 'any',
    tags: [],
    authors: [],
    language: 'all',
    featured: null,
    minViews: 0,
    dateRange: [null, null] as [Dayjs | null, Dayjs | null],
    viewMode: 'grid',
    itemsPerPage: 24,
    showAdvanced: false
  };
  
  // Set filters immediately
  setFilters(resetFilters);
  setPage(1);
  
  // Clear URL
  window.history.replaceState({}, '', location.pathname);
  
  // Fetch with reset filters immediately
  fetchArticles(true, resetFilters);
  
}, [location.pathname, fetchArticles]);

  // ========== SAVED FILTERS ==========
  useEffect(() => {
    loadSavedFilters();
  }, []);

  const loadSavedFilters = () => {
    const saved = localStorage.getItem('savedArticleFilters');
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved filters:', error);
      }
    }
  };

  const handleSaveFilter = () => {
    const filterName = prompt(t`Enter a name for this filter preset:`);
    if (!filterName) return;
    
    const newFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: { ...filtersRef.current },
      createdAt: new Date().toISOString(),
      articleCount: totalArticles
    };
    
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('savedArticleFilters', JSON.stringify(updated));
    
    notification.success({
      message: t`Filter Saved`,
      description: t`"${filterName}" has been saved to your presets.`,
    });
  };

  const handleLoadFilter = (filter: any) => {
    setFilters(filter.filters);
    updateURL(filter.filters);
    fetchArticles(true, filter.filters);
  };

  // ========== UI COMPONENTS ==========
  const FilterChips = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.category && (
        <Tag
          color="blue"
          closable
          onClose={() => handleFilterChange('category', '')}
          className="px-3 py-1"
        >
          <FolderOutlined className="mr-1" />
          {categories.find(c => c.slug === filters.category)?.name || filters.category}
        </Tag>
      )}
      
      {filters.accessType !== 'all' && (
        <Tag
          color={filters.accessType === 'premium' ? 'gold' : 'green'}
          closable
          onClose={() => handleFilterChange('accessType', 'all')}
          className="px-3 py-1"
        >
          {filters.accessType === 'premium' ? <CrownOutlined /> : <UnlockOutlined />}
          <span className="ml-1">{filters.accessType === 'premium' ? t`Premium` : t`Free`} Only</span>
        </Tag>
      )}
      
      {filters.readingTime !== 'any' && (
        <Tag
          color="orange"
          closable
          onClose={() => handleFilterChange('readingTime', 'any')}
          className="px-3 py-1"
        >
          <ClockCircleOutlined className="mr-1" />
          {filters.readingTime === 'short' ? t`Quick Reads` : 
           filters.readingTime === 'medium' ? t`Medium` : t`Long Reads`}
        </Tag>
      )}
      
      {filters.featured !== null && (
        <Tag
          color="purple"
          closable
          onClose={() => handleFilterChange('featured', null)}
          className="px-3 py-1"
        >
          <StarOutlined className="mr-1" />
          <Trans>Featured Only</Trans>
        </Tag>
      )}
      
      {filters.minViews > 0 && (
        <Tag
          color="red"
          closable
          onClose={() => handleFilterChange('minViews', 0)}
          className="px-3 py-1"
        >
          <EyeOutlined className="mr-1" />
          {filters.minViews.toLocaleString()}+ <Trans>views</Trans>
        </Tag>
      )}
      
      {filters.search && (
        <Tag
          color="cyan"
          closable
          onClose={() => handleFilterChange('search', '')}
          className="px-3 py-1"
        >
          <SearchOutlined className="mr-1" />
          "{filters.search}"
        </Tag>
      )}
      
      {filters.tags.length > 0 && (
        <Tag
          color="green"
          closable
          onClose={() => handleFilterChange('tags', [])}
          className="px-3 py-1"
        >
          <TagOutlined className="mr-1" />
          {filters.tags.length} <Trans>tag{filters.tags.length > 1 ? 's' : ''}</Trans>
        </Tag>
      )}
      
      {(filters.category || filters.accessType !== 'all' || filters.readingTime !== 'any' || 
        filters.featured !== null || filters.minViews > 0 || filters.search || filters.tags.length > 0) && (
        <Button
          type="default"
          size="small"
          icon={<CloseOutlined />}
          onClick={handleResetFilters}
          className="text-gray-500 hover:text-gray-700 mt-1"
        >
          <Trans>Clear All</Trans>
        </Button>
      )}
    </div>
  );

  const QuickFilters = () => (
    <div className="space-y-6">
      {/* Sort Options */}
      <div>
        <Text strong className="block mb-3 text-gray-700 dark:text-gray-300">
          <Trans>Sort By</Trans>
        </Text>
        <div className="space-y-2">
          {[
            { value: 'recent', label: t`Most Recent`, icon: <HistoryOutlined />, color: 'blue' },
            { value: 'popular', label: t`Most Popular`, icon: <FireOutlined />, color: 'orange' },
            { value: 'trending', label: t`Trending Now`, icon: <RocketOutlined />, color: 'red' },
            { value: 'reading_time', label: t`Reading Time`, icon: <ClockCircleOutlined />, color: 'green' },
          ].map(option => (
            <Button
              key={option.value}
              type={filters.sort === option.value ? 'primary' : 'default'}
              icon={option.icon}
              onClick={() => handleFilterChange('sort', option.value)}
              className={`w-full justify-start`}
              style={filters.sort === option.value ? { 
                backgroundColor: option.color === 'blue' ? '#1890ff' : 
                               option.color === 'orange' ? '#fa8c16' : 
                               option.color === 'red' ? '#f5222d' : '#52c41a',
                color: 'white',
                borderColor: 'transparent'
              } : {}}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      
      <Divider className="my-4" />
      
      {/* Access Type - CLIENT-SIDE */}
      <div>
        <Text strong className="block mb-3 text-gray-700 dark:text-gray-300">
          <Trans>Access Type</Trans>
        </Text>
        <div className="space-y-2">
          {[
            { value: 'all', label: t`All Articles`, icon: <GlobalOutlined /> },
            { value: 'free', label: t`Free Only`, icon: <UnlockOutlined /> },
            { value: 'premium', label: t`Premium Only`, icon: <CrownOutlined /> },
          ].map(option => (
            <Button
              key={option.value}
              type={filters.accessType === option.value ? 'primary' : 'default'}
              icon={option.icon}
              onClick={() => handleFilterChange('accessType', option.value)}
              className="w-full justify-start"
            >
              {option.label}
              {option.value === 'premium' && user?.subscription?.status !== 'ACTIVE' && (
                <Badge count="PRO" className="ml-2" style={{ backgroundColor: '#faad14' }} />
              )}
            </Button>
          ))}
        </div>
      </div>
      
      <Divider className="my-4" />
      
      {/* Reading Time - CLIENT-SIDE */}
      <div>
        <Text strong className="block mb-3 text-gray-700 dark:text-gray-300">
          <Trans>Reading Time</Trans>
        </Text>
        <div className="space-y-2">
          {[
            { value: 'any', label: t`Any Length`, icon: <CompassOutlined /> },
            { value: 'short', label: t`Quick Reads (<10 min)`, icon: <CoffeeOutlined /> },
            { value: 'medium', label: t`Medium (10-20 min)`, icon: <ClockCircleOutlined /> },
            { value: 'long', label: t`Deep Dives (20+ min)`, icon: <BookOutlined /> },
          ].map(option => (
            <Button
              key={option.value}
              type={filters.readingTime === option.value ? 'primary' : 'default'}
              icon={option.icon}
              onClick={() => handleFilterChange('readingTime', option.value)}
              className="w-full justify-start"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      
      <Divider className="my-4" />
      
      {/* Top Categories */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <Text strong className="text-gray-700 dark:text-gray-300">
            <Trans>Top Categories</Trans>
          </Text>
          <Badge count={categories.length} style={{ backgroundColor: '#1890ff' }} />
        </div>
        <div className="space-y-2">
          {categories.slice(0, 6).map(category => (
            <Button
              key={category.id}
              type={filters.category === category.slug ? 'primary' : 'default'}
              icon={<FolderOutlined />}
              onClick={() => handleFilterChange('category', category.slug)}
              className="w-full justify-start"
            >
              <div className="flex justify-between items-center w-full">
                <span>{category.name}</span>
              </div>
            </Button>
          ))}
          {categories.length > 4 && (
            <Button
              type="link"
              onClick={() => navigate('/dashboard/categories')}
              className="w-full !text-blue-600 hover:!text-blue-700"
            >
              <Trans>View All Categories</Trans> →
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const AdvancedFilters = () => (
    <div className="space-y-6">
      <div>
        <Text strong className="block mb-3">
          <Trans>Featured Articles</Trans>
        </Text>
        <Radio.Group 
          value={filters.featured}
          onChange={(e) => handleFilterChange('featured', e.target.value)}
          className="w-full"
        >
          <Radio.Button value={null} className="flex-1 text-center">
            <Trans>All</Trans>
          </Radio.Button>
          <Radio.Button value={true} className="flex-1 text-center">
            <Trans>Featured Only</Trans>
          </Radio.Button>
        </Radio.Group>
      </div>
      
      <div>
        <Text strong className="block mb-3">
          <Trans>Minimum Views</Trans>
        </Text>
        <Slider
          min={0}
          max={10000}
          step={100}
          value={filters.minViews}
          onChange={(value) => handleFilterChange('minViews', value)}
          marks={{ 0: '0', 2500: '2.5k', 5000: '5k', 7500: '7.5k', 10000: '10k' }}
        />
        <div className="flex justify-between mt-2">
          <Text type="secondary"><Trans>Any</Trans></Text>
          <Text strong>{filters.minViews.toLocaleString()}+ <Trans>views</Trans></Text>
          <Text type="secondary">10k+</Text>
        </div>
      </div>
      
      {tags.length > 0 && (
        <div>
          <Text strong className="block mb-3">
            <Trans>Tags</Trans>
          </Text>
          <Select
            mode="multiple"
            placeholder={t`Select tags`}
            value={filters.tags}
            onChange={(value) => handleFilterChange('tags', value)}
            className="w-full"
            maxTagCount={3}
            allowClear
          >
            {tags.map(tag => (
              <Option key={tag} value={tag}>
                <div className="flex items-center gap-2">
                  <TagOutlined />
                  <span>{tag}</span>
                </div>
              </Option>
            ))}
          </Select>
        </div>
      )}
      
      <div>
        <Text strong className="block mb-3">
          <Trans>Publication Date</Trans>
        </Text>
        <RangePicker
          className="w-full"
          value={filters.dateRange}
          onChange={(dates) => handleFilterChange('dateRange', dates || [null, null])}
        />
      </div>
    </div>
  );

  const renderArticlesGrid = () => {
    if (filters.viewMode === 'list') {
      return (
        <div className="space-y-4">
          {articles.map(article => (
            <Card 
              key={article.id}
              className="hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/dashboard/article/${article.slug}`)}
            >
              <Row gutter={16} align="middle">
                <Col xs={24} md={18}>
                  <div className="flex items-start gap-4">
                    {article.coverImage && (
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={article.coverImage} 
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          color={article.accessType === 'PREMIUM' ? 'gold' : 'blue'}
                          text={article.accessType === 'PREMIUM' ? t`Premium` : t`Free`}
                        />
                        {article.isFeatured && <Badge color="purple" text={t`Featured`} />}
                      </div>
                      <Title level={4} className="!mb-2 line-clamp-2">
                        {article.title}
                      </Title>
                      <Paragraph className="!mb-3 line-clamp-2 text-gray-600">
                        {article.excerpt}
                      </Paragraph>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <UserOutlined />
                          {article.author?.name || t`Unknown`}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockCircleOutlined />
                          {article.readingTime || 5} <Trans>min read</Trans>
                        </span>
                        <span className="flex items-center gap-1">
                          <EyeOutlined />
                          {article.viewCount?.toLocaleString() || 0} <Trans>views</Trans>
                        </span>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          ))}
        </div>
      );
    }
    
    if (filters.viewMode === 'compact') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map(article => (
            <Card 
              key={article.id}
              className="hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/dashboard/article/${article.slug}`)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {article.accessType === 'PREMIUM' && (
                      <CrownOutlined className="text-amber-500" />
                    )}
                    <Text strong className="line-clamp-2">
                      {article.title}
                    </Text>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{article.category?.name}</span>
                    <span>•</span>
                    <span>{article.readingTime || 5} <Trans>min</Trans></span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }
    
    // Default grid view - Always 3 cards per row on desktop
    return (
      <Row gutter={[24, 24]}>
        {articles.map(article => (
          <Col 
            key={article.id} 
            xs={24}      // 1 card on mobile
            sm={12}      // 2 cards on tablet
            md={8}       // 3 cards on desktop (768px+)
            className="cursor-pointer"
            onClick={() => navigate(`/dashboard/article/${article.slug}`)}
          >
            <ArticleCard article={article} variant="default" />
          </Col>
        ))}
      </Row>
    );
  };

  const ResultsSummary = () => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <Text strong className="text-lg">
          {totalArticles.toLocaleString()} <Trans>articles found</Trans>
        </Text>
        {filters.search && (
          <Text type="secondary" className="block">
            <Trans>Searching for</Trans>: "{filters.search}"
          </Text>
        )}
        {/* Show active filters */}
        <div className="flex flex-wrap gap-1 mt-1">
          {filters.readingTime !== 'any' && (
            <Tag color="orange" className="text-xs">
              <ClockCircleOutlined /> {filters.readingTime} <Trans>reads</Trans>
            </Tag>
          )}
          {filters.accessType !== 'all' && (
            <Tag color={filters.accessType === 'premium' ? 'gold' : 'green'} className="text-xs">
              {filters.accessType === 'premium' ? <CrownOutlined /> : <UnlockOutlined />}
              {filters.accessType === 'premium' ? t`Premium` : t`Free`}
            </Tag>
          )}
          {filters.minViews > 0 && (
            <Tag color="red" className="text-xs">
              <EyeOutlined /> {filters.minViews.toLocaleString()}+ <Trans>views</Trans>
            </Tag>
          )}
          {filters.featured !== null && (
            <Tag color="purple" className="text-xs">
              <StarOutlined /> <Trans>Featured</Trans>
            </Tag>
          )}
          {filters.tags.length > 0 && (
            <Tag color="green" className="text-xs">
              <TagOutlined /> {filters.tags.length} <Trans>tag{filters.tags.length > 1 ? 's' : ''}</Trans>
            </Tag>
          )}
        </div>
      </div>
    </div>
  );

  // ========== MAIN RENDER ==========
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      {showHero && (
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 dark:from-blue-800 dark:via-blue-700 dark:to-indigo-800">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
          <div className="relative max-w-7xl mx-auto px-6 py-4">
            <div className="text-center">
              <Badge 
                color="blue"
                className="mb-3 px-4 py-1 text-sm font-semibold bg-white/20 text-white border border-white/30 rounded-full"
              >
                <CompassOutlined className="mr-2" />
                <Trans>Article Explorer</Trans>
              </Badge>
              
              <Title level={1} className="!text-white !mb-2">
                <Trans>Discover All Articles</Trans>
              </Title>
              
              <Paragraph className="text-xl text-white/90 mb-2 max-w-3xl mx-auto">
                <Trans>Browse our complete knowledge base articles.</Trans> 
                <Trans>Use filters to find exactly what you need.</Trans>
              </Paragraph>
              
              <div className="flex justify-center gap-4">
                <Button
                  type="primary"
                  size="large"
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                  icon={<ThunderboltOutlined />}
                  onClick={() => handleFilterChange('sort', 'trending')}
                >
                  <Trans>Trending Now</Trans>
                </Button>
                
                <Button
                  size="large"
                  className="bg-transparent text-white border-2 border-white/30 hover:border-white/50"
                  icon={<StarOutlined />}
                  onClick={() => handleFilterChange('featured', true)}
                >
                  <Trans>Featured</Trans>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="">
        {/* Search Bar */}
        <div className="p-2 z-50 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search
              placeholder={t`Search articles by title, content, or keywords...`}
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={filters.search}
              onChange={(e) => {
                const value = e.target.value;
                setFilters(prev => ({ ...prev, search: value }));
                handleSearchChange(value);
              }}
              className="w-full"
              prefix={<StarFilled className="text-gray-400" />}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Button
                type="text"
                icon={<FilterFilled />}
                onClick={() => setFilterDrawerVisible(true)}
                className="md:hidden"
              />
            </div>
          </div>
          
          <FilterChips />
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Text strong><Trans>View:</Trans></Text>
                <Radio.Group 
                  value={filters.viewMode}
                  onChange={(e) => handleFilterChange('viewMode', e.target.value)}
                  buttonStyle="solid"
                  size="small"
                >
                  <Radio.Button value="grid">
                    <AppstoreOutlined />
                  </Radio.Button>
                  <Radio.Button value="list">
                    <ContainerOutlined />
                  </Radio.Button>
                  <Radio.Button value="compact">
                    <SlidersOutlined />
                  </Radio.Button>
                </Radio.Group>
              </div>
            </div>
          
            <div className="flex items-center gap-2">
              <Button 
                icon={<FilterOutlined />}
                onClick={() => setFilterDrawerVisible(true)}
              >
                <Trans>Filters</Trans>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">          
          <div className="articles-layout-container mb-8">
            {/* Sidebar - Sticky on desktop */}
            <div className="hidden lg:block fixed-sidebar-container mb-8">
              <Card className="h-full">
                <div className="p-2">
                  <div className="flex items-center justify-between">
                    <Text strong className="text-lg">
                      <Trans>Filters</Trans>
                    </Text>
                    <Button
                      type="text"
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={handleResetFilters}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Trans>Reset</Trans>
                    </Button>
                  </div>
                  
                  <QuickFilters />
                  
                  <Divider className="my-6" />
                  
                  <div className="mb-4">
                    <Button
                      type="text"
                      icon={filters.showAdvanced ? <UpOutlined /> : <DownOutlined />}
                      onClick={() => handleFilterChange('showAdvanced', !filters.showAdvanced)}
                      className="w-full !text-blue-600 hover:!text-blue-700"
                    >
                      {filters.showAdvanced ? t`Hide Advanced` : t`Show Advanced`}
                    </Button>
                  </div>
                  
                  {filters.showAdvanced && <AdvancedFilters />}
                  
                  <Divider className="my-6" />
                  
                  {/* Saved Filters */}
                  {savedFilters.length > 0 && (
                    <div>
                      <Text strong className="block mb-3">
                        <Trans>Saved Presets</Trans>
                      </Text>
                      <div className="space-y-2">
                        {savedFilters.map(filter => (
                          <Tag
                            key={filter.id}
                            color="blue"
                            closable
                            onClose={(e) => {
                              e.preventDefault();
                              const updated = savedFilters.filter(f => f.id !== filter.id);
                              setSavedFilters(updated);
                              localStorage.setItem('savedArticleFilters', JSON.stringify(updated));
                            }}
                            className="cursor-pointer px-3 py-1 w-full justify-between"
                            onClick={() => handleLoadFilter(filter)}
                          >
                            <div className="flex items-center gap-2">
                              <SaveOutlined />
                              <span>{filter.name}</span>
                            </div>
                            <Badge count={filter.articleCount} style={{ backgroundColor: '#52c41a' }} />
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    type="dashed"
                    icon={<SaveOutlined />}
                    onClick={handleSaveFilter}
                    className="w-full mt-4"
                  >
                    <Trans>Save Current Filters</Trans>
                  </Button>
                </div>
              </Card>
            </div>
            
            {/* Main Content Area */}
            <div className="main-content-with-fixed-sidebar">
              <div className="">
                <ResultsSummary />
                
                {initialLoading ? (
                  <div className="py-20 text-center">
                    <Spin size="large" />
                    <Text className="block mt-4 text-gray-500">
                      <Trans>Loading articles...</Trans>
                    </Text>
                  </div>
                ) : articles.length > 0 ? (
                  <>
                    {renderArticlesGrid()}
                    
                    {/* Load More */}
                    {hasMore && !loading && (
                      <div className="text-center mt-12">
                        <Button 
                          type="dashed" 
                          size="large"
                          onClick={() => {
                            setPage(prev => prev + 1);
                            fetchArticles(false);
                          }}
                          icon={<ArrowDownOutlined />}
                          className="px-12"
                          loading={loading}
                        >
                          <Trans>Load More Articles</Trans>
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div className="max-w-md mx-auto">
                        <Title level={4} className="!mb-4">
                          <Trans>No articles found</Trans>
                        </Title>
                        <Paragraph className="mb-6">
                          {filters.search 
                            ? t`No results for "${filters.search}". Try different keywords.`
                            : t`No articles match your current filters. Try adjusting your criteria.`}
                        </Paragraph>
                        <div className="flex gap-4 justify-center">
                          <Button 
                            type="primary"
                            onClick={handleResetFilters}
                            icon={<ReloadOutlined />}
                          >
                            <Trans>Reset All Filters</Trans>
                          </Button>
                          <Button onClick={() => navigate('/dashboard/categories')}>
                            <Trans>Browse Categories</Trans>
                          </Button>
                        </div>
                      </div>
                    }
                  />
                )}
                
                {/* Loading indicator for infinite scroll */}
                {loading && articles.length > 0 && (
                  <div className="text-center py-8">
                    <Spin />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer
        title={
          <div className="flex items-center dark:text-white dark:bg-gray-800 justify-between">
            <span><Trans>Filters</Trans></span>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={handleResetFilters}
              size="small"
              className="dark:text-white dark:bg-gray-800"

            >
              <Trans>Reset</Trans>
            </Button>
          </div>
        }
        placement="right"
        onClose={() => setFilterDrawerVisible(false)}
        visible={filterDrawerVisible}
        width={320}
        className="filter-drawer dark:text-white dark:bg-gray-800"
         
      >
        <div className="space-y-6 mb-[108px]">
          <QuickFilters />
          <Divider />
          <AdvancedFilters />
        </div>
      </Drawer>

      
    </div>
  );
};

export default AllArticlesPage;