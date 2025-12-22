// components/articles/AllArticlesPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Collapse,
  Drawer,
  Tabs,
  Dropdown,
  Menu,
  Progress,
  Tooltip,
  Modal,
  Alert,
  Statistic,
  Rate
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
  SlidersOutlined,
  ControlOutlined,
  PauseOutlined,
  LeftOutlined,
  RightOutlined,
  ExperimentOutlined as ExperimentIcon,
  CoffeeOutlined as CoffeeIcon,
  SortAscendingOutlined,
  SortDescendingOutlined,
  ReloadOutlined,
  SaveOutlined,
  DownloadOutlined as DownloadIcon,
  UploadOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  CheckCircleFilled,
  StarFilled,
  FireFilled,
  CrownFilled,
  BulbFilled,
  RocketFilled,
  TagFilled,
  TrophyFilled,
  SafetyCertificateFilled,
  PieChartFilled,
  UpOutlined,
  DownOutlined,
  ArrowDownOutlined
  

} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router';
import articleApi, { Article, FilterParams } from '../../services/articleApi';
import { useAuthStore } from '@/client/stores/auth';
import ArticleCard from './ArticleCard';
import './AllArticlesPage.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Panel } = Collapse;

interface AllArticlesPageProps {
  initialFilters?: {
    category?: string;
    tag?: string;
    sort?: string;
    search?: string;
    readingTime?: string;
    accessType?: string;
    status?: string;
    authorId?: string;
    featured?: boolean;
    trending?: boolean;
    language?: string;
  };
  showHero?: boolean;
}

interface FilterState {
  // Basic filters
  category: string;
  tag: string;
  sort: 'recent' | 'popular' | 'trending' | 'reading_time' | 'title_asc' | 'title_desc' | 'most_commented' | 'most_saved';
  search: string;
  readingTime?: 'short' | 'medium' | 'long' | 'any';
  
  // Advanced filters
  accessType: 'all' | 'free' | 'premium';
  contentType: 'all' | 'standard' | 'guide' | 'tutorial' | 'research' | 'opinion';
  readingLevel: 'all' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  publicationDate: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';
  minRating: number;
  minViews: number;
  minLikes: number;
  languages: string[];
  authors: string[];
  tags: string[];
  categories: string[];
  
  // Display options
  viewMode: 'grid' | 'list' | 'compact';
  itemsPerPage: 12 | 24 | 36 | 48;
  showAdvancedFilters: boolean;
}

const AllArticlesPage: React.FC<AllArticlesPageProps> = ({ 
  initialFilters = {},
  showHero = true 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalArticles: 0,
    freeArticles: 0,
    premiumArticles: 0,
    featuredArticles: 0,
    trendingArticles: 0,
    averageRating: 4.5,
    totalViews: 0,
    totalLikes: 0
  });
  
  const [filters, setFilters] = useState<FilterState>({
    category: initialFilters.category || '',
    tag: initialFilters.tag || '',
    sort: initialFilters.sort as any || 'recent',
    search: initialFilters.search || '',
    readingTime: initialFilters.readingTime as any || undefined,
    accessType: 'all',
    contentType: 'all',
    readingLevel: 'all',
    publicationDate: 'all',
    minRating: 0,
    minViews: 0,
    minLikes: 0,
    languages: ['en'],
    authors: [],
    tags: [],
    categories: [],
    viewMode: 'grid',
    itemsPerPage: 24,
    showAdvancedFilters: false
  });
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalArticles, setTotalArticles] = useState(0);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchArticles(true);
    fetchCategories();
    fetchTags();
    fetchAuthors();
    fetchStats();
    loadSavedFilters();
  }, []);

  // Parse URL parameters on load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlFilters: Partial<FilterState> = {};
    
    if (params.get('category')) urlFilters.category = params.get('category') || '';
    if (params.get('tag')) urlFilters.tag = params.get('tag') || '';
    if (params.get('search')) urlFilters.search = params.get('search') || '';
    if (params.get('sort')) urlFilters.sort = params.get('sort') as any || 'recent';
    if (params.get('readingTime')) urlFilters.readingTime = params.get('readingTime') as any;
    
    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }));
      fetchArticles(true);
    }
  }, [location.search]);

  const fetchArticles = useCallback(async (reset = false) => {
    if (loading) return;
    
    const currentPage = reset ? 1 : page;
    setLoading(true);
    
    try {
      // Convert filters to API params
      const params: any = {
        page: currentPage,
        limit: filters.itemsPerPage,
        search: filters.search || undefined,
        category: filters.category || undefined,
        tag: filters.tag || undefined,
        sort: filters.sort || 'recent',
      };
      
      // Add advanced filters
      if (filters.accessType !== 'all') {
        params.accessType = filters.accessType.toUpperCase();
      }
      
      if (filters.readingTime && filters.readingTime !== 'any') {
        params.readingTime = filters.readingTime;
      }
      
      if (filters.authors.length > 0) {
        params.authorId = filters.authors.join(',');
      }
      
      if (filters.languages.length > 0) {
        params.language = filters.languages.join(',');
      }
      
      // Clean up undefined params
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });
      
      const response = await articleApi.getArticles(params);
      
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
        }
      }
      
      if (reset || currentPage === 1) {
        setArticles(newArticles);
      } else {
        setArticles(prev => [...prev, ...newArticles]);
      }
      
      setTotalArticles(newTotal);
      setHasMore(newHasMore);
      if (reset) setPage(1);
      
      // Update URL with current filters
      updateURLWithFilters();
      
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, page, loading]);

  const fetchCategories = async () => {
    try {
      const response = await articleApi.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      // You'll need to implement this endpoint
      // const response = await articleApi.getTags();
      // setTags(response.data || []);
      
      // For now, extract tags from articles
      const allTags = new Set<string>();
      articles.forEach(article => {
        if (article.tags && Array.isArray(article.tags)) {
          article.tags.forEach(tag => allTags.add(tag));
        }
      });
      setTags(Array.from(allTags).map(tag => ({ name: tag, count: 0 })));
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const fetchAuthors = async () => {
    try {
      // You'll need to implement this endpoint
      // const response = await articleApi.getAuthors();
      // setAuthors(response.data || []);
    } catch (error) {
      console.error('Failed to load authors:', error);
    }
  };

  const fetchStats = async () => {
  setStatsLoading(true);
  try {
    const response = await articleApi.getArticleOverviewStats();
    
    if (response?.success && response?.data) {
      setStats(response.data);
    } else if (response?.data) {
      setStats(response.data);
    } else {
      console.warn('Invalid stats response:', response);
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  } finally {
    setStatsLoading(false);
  }
};

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

  const updateURLWithFilters = () => {
    const params = new URLSearchParams();
    
    if (filters.category) params.set('category', filters.category);
    if (filters.tag) params.set('tag', filters.tag);
    if (filters.search) params.set('search', filters.search);
    if (filters.sort !== 'recent') params.set('sort', filters.sort);
    if (filters.readingTime) params.set('readingTime', filters.readingTime);
    
    const newUrl = `${location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    fetchArticles(true);
  };

  const handleResetFilters = () => {
    setFilters({
      category: '',
      tag: '',
      sort: 'recent',
      search: '',
      readingTime: undefined,
      accessType: 'all',
      contentType: 'all',
      readingLevel: 'all',
      publicationDate: 'all',
      minRating: 0,
      minViews: 0,
      minLikes: 0,
      languages: ['en'],
      authors: [],
      tags: [],
      categories: [],
      viewMode: 'grid',
      itemsPerPage: 24,
      showAdvancedFilters: false
    });
    fetchArticles(true);
  };

  const handleSaveFilter = () => {
    const filterName = prompt('Enter a name for this filter preset:');
    if (!filterName) return;
    
    const newFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: { ...filters },
      createdAt: new Date().toISOString()
    };
    
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('savedArticleFilters', JSON.stringify(updated));
  };

  const handleLoadFilter = (filter: any) => {
    setFilters(filter.filters);
    fetchArticles(true);
  };

  const handleDeleteFilter = (id: string) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem('savedArticleFilters', JSON.stringify(updated));
  };

  const handleExportArticles = () => {
    const exportData = {
      filters: filters,
      articles: articles,
      exportedAt: new Date().toISOString(),
      totalArticles: totalArticles
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `articles-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleArticleSelect = (articleId: string) => {
    setSelectedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const handleBulkAction = (action: 'save' | 'share' | 'export' | 'addToList') => {
    if (selectedArticles.length === 0) {
      alert('Please select articles first');
      return;
    }
    
    switch (action) {
      case 'save':
        // Implement bulk save
        break;
      case 'share':
        // Implement bulk share
        break;
      case 'export':
        handleExportArticles();
        break;
      case 'addToList':
        // Implement add to reading list
        break;
    }
  };

  const sortOptions = [
    { value: 'recent', label: 'Most Recent', icon: <HistoryOutlined /> },
    { value: 'popular', label: 'Most Popular', icon: <FireOutlined /> },
    { value: 'trending', label: 'Trending Now', icon: <RocketOutlined /> },
    { value: 'reading_time', label: 'Reading Time', icon: <ClockCircleOutlined /> },
    { value: 'title_asc', label: 'Title (A-Z)', icon: <SortAscendingOutlined /> },
    { value: 'title_desc', label: 'Title (Z-A)', icon: <SortDescendingOutlined /> },
    { value: 'most_commented', label: 'Most Comments', icon: <CommentOutlined /> },
    { value: 'most_saved', label: 'Most Saved', icon: <BookOutlined /> },
  ];

  const readingTimeOptions = [
    { value: 'short', label: 'Quick Reads (≤10 min)', icon: <CoffeeIcon /> },
    { value: 'medium', label: 'Medium (10-20 min)', icon: <ClockCircleOutlined /> },
    { value: 'long', label: 'Deep Dives (20+ min)', icon: <BookOutlined /> },
    { value: 'any', label: 'Any Length', icon: <CompassOutlined /> },
  ];

  const accessTypeOptions = [
    { value: 'all', label: 'All Access', icon: <GlobalOutlined /> },
    { value: 'free', label: 'Free Only', icon: <UnlockOutlined /> },
    { value: 'premium', label: 'Premium Only', icon: <CrownOutlined /> },
  ];

  const renderStatsCards = () => (
    <Row gutter={[16, 16]} className="mb-8">
      <Col xs={24} sm={12} lg={6}>
        <Card className="text-center hover:shadow-lg transition-shadow">
          <Statistic 
            title="Total Articles" 
            value={stats.totalArticles} 
            prefix={<FileTextOutlined />}
            valueStyle={{ color: '#3f51b5' }}
          />
          <Text type="secondary" className="text-xs">In database</Text>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="text-center hover:shadow-lg transition-shadow">
          <Statistic 
            title="Free Articles" 
            value={stats.freeArticles} 
            prefix={<UnlockOutlined />}
            valueStyle={{ color: '#4caf50' }}
          />
          <Text type="secondary" className="text-xs">Open access</Text>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="text-center hover:shadow-lg transition-shadow">
          <Statistic 
            title="Premium Articles" 
            value={stats.premiumArticles} 
            prefix={<CrownOutlined />}
            valueStyle={{ color: '#ff9800' }}
          />
          <Text type="secondary" className="text-xs">Exclusive content</Text>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="text-center hover:shadow-lg transition-shadow">
          <Statistic 
            title="Featured" 
            value={stats.featuredArticles} 
            prefix={<StarOutlined />}
            valueStyle={{ color: '#9c27b0' }}
          />
          <Text type="secondary" className="text-xs">Editor's picks</Text>
        </Card>
      </Col>
    </Row>
  );

  const renderAdvancedFilters = () => (
    <Collapse 
      ghost 
      className="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg"
      expandIconPosition="end"
    >
      <Panel 
        header={
          <div className="flex items-center gap-2">
            <SlidersOutlined />
            <Text strong>Advanced Filters</Text>
            <Badge 
              count={Object.keys(filters).filter(key => 
                filters[key as keyof FilterState] !== undefined && 
                filters[key as keyof FilterState] !== '' &&
                !['viewMode', 'itemsPerPage', 'showAdvancedFilters'].includes(key)
              ).length}
              style={{ backgroundColor: '#1890ff' }}
            />
          </div>
        } 
        key="1"
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={12} md={8}>
            <div className="mb-4">
              <Text strong className="block mb-2">Access Type</Text>
              <Radio.Group 
                value={filters.accessType}
                onChange={(e) => handleFilterChange('accessType', e.target.value)}
                className="w-full"
              >
                {accessTypeOptions.map(opt => (
                  <Radio.Button 
                    key={opt.value} 
                    value={opt.value}
                    className="flex-1 text-center"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {opt.icon}
                      <span>{opt.label}</span>
                    </div>
                  </Radio.Button>
                ))}
              </Radio.Group>
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <div className="mb-4">
              <Text strong className="block mb-2">Reading Time</Text>
              <Select
                value={filters.readingTime || 'any'}
                onChange={(value) => handleFilterChange('readingTime', value)}
                className="w-full"
                placeholder="Select reading time"
              >
                {readingTimeOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      <span>{opt.label}</span>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <div className="mb-4">
              <Text strong className="block mb-2">Minimum Rating</Text>
              <div className="flex items-center gap-4">
                <Rate 
                  value={filters.minRating} 
                  onChange={(value) => handleFilterChange('minRating', value)}
                  allowHalf
                />
                <Text>{filters.minRating}+</Text>
              </div>
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <div className="mb-4">
              <Text strong className="block mb-2">Minimum Views</Text>
              <Slider
                min={0}
                max={10000}
                step={100}
                value={filters.minViews}
                onChange={(value) => handleFilterChange('minViews', value)}
                marks={{ 0: '0', 2500: '2.5k', 5000: '5k', 7500: '7.5k', 10000: '10k' }}
              />
              <div className="flex justify-between">
                <Text type="secondary">0</Text>
                <Text strong>{filters.minViews.toLocaleString()}</Text>
                <Text type="secondary">10k</Text>
              </div>
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <div className="mb-4">
              <Text strong className="block mb-2">Categories (Multiple)</Text>
              <Select
                mode="multiple"
                placeholder="Select categories"
                value={filters.categories}
                onChange={(value) => handleFilterChange('categories', value)}
                className="w-full"
                maxTagCount={2}
              >
                {categories.map(category => (
                  <Option key={category.id} value={category.slug}>
                    <div className="flex items-center gap-2">
                      <FolderOutlined />
                      <span>{category.name}</span>
                      <Badge count={category.articleCount} style={{ backgroundColor: '#52c41a' }} />
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <div className="mb-4">
              <Text strong className="block mb-2">Tags (Multiple)</Text>
              <Select
                mode="multiple"
                placeholder="Select tags"
                value={filters.tags}
                onChange={(value) => handleFilterChange('tags', value)}
                className="w-full"
                maxTagCount={3}
              >
                {tags.map(tag => (
                  <Option key={tag.name} value={tag.name}>
                    <div className="flex items-center gap-2">
                      <TagOutlined />
                      <span>{tag.name}</span>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>
        
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            onClick={handleResetFilters}
            icon={<ReloadOutlined />}
          >
            Reset All Filters
          </Button>
          <div className="flex gap-2">
            <Button 
              onClick={handleSaveFilter}
              icon={<SaveOutlined />}
              type="primary"
            >
              Save Filter Preset
            </Button>
            <Button 
              onClick={() => fetchArticles(true)}
              icon={<SyncOutlined />}
              type="primary"
              loading={loading}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Panel>
    </Collapse>
  );

  const renderSavedFilters = () => (
    savedFilters.length > 0 && (
      <div className="mb-6">
        <Text strong className="block mb-2">Saved Filter Presets</Text>
        <div className="flex flex-wrap gap-2">
          {savedFilters.map(filter => (
            <Tag
              key={filter.id}
              color="blue"
              closable
              onClose={() => handleDeleteFilter(filter.id)}
              className="cursor-pointer px-3 py-1"
              onClick={() => handleLoadFilter(filter)}
            >
              <div className="flex items-center gap-2">
                <SaveOutlined />
                <span>{filter.name}</span>
                <Badge 
                  count={new Date(filter.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  style={{ backgroundColor: '#87d068', fontSize: '10px' }}
                />
              </div>
            </Tag>
          ))}
        </div>
      </div>
    )
  );

  const renderViewControls = () => (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Text strong>View:</Text>
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
        
        <div className="flex items-center gap-2">
          <Text strong>Show:</Text>
          <Select
            value={filters.itemsPerPage}
            onChange={(value) => handleFilterChange('itemsPerPage', value)}
            size="small"
            className="w-24"
          >
            <Option value={12}>12 items</Option>
            <Option value={24}>24 items</Option>
            <Option value={36}>36 items</Option>
            <Option value={48}>48 items</Option>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Text type="secondary">
          Showing {articles.length} of {totalArticles} articles
        </Text>
        
        <Dropdown
          overlay={
            <Menu>
              {sortOptions.map(option => (
                <Menu.Item 
                  key={option.value}
                  onClick={() => handleFilterChange('sort', option.value)}
                  icon={option.icon}
                >
                  {option.label}
                </Menu.Item>
              ))}
            </Menu>
          }
          trigger={['click']}
          visible={sortDropdownVisible}
          onVisibleChange={setSortDropdownVisible}
        >
          <Button icon={<SortAscendingOutlined />}>
            Sort: {sortOptions.find(o => o.value === filters.sort)?.label}
          </Button>
        </Dropdown>
        
        <Button 
          icon={<FilterOutlined />}
          onClick={() => setFilterDrawerVisible(true)}
        >
          Filters
        </Button>
        
        <Button 
          icon={<DownloadIcon />}
          onClick={() => setExportModalVisible(true)}
        >
          Export
        </Button>
      </div>
    </div>
  );

  const renderBulkActions = () => (
    selectedArticles.length > 0 && (
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge 
              count={selectedArticles.length} 
              style={{ backgroundColor: '#1890ff' }}
            />
            <Text strong>{selectedArticles.length} articles selected</Text>
          </div>
          
          <div className="flex gap-2">
            <Button 
              icon={<SaveOutlined />}
              onClick={() => handleBulkAction('save')}
            >
              Save All
            </Button>
            <Button 
              icon={<ShareAltOutlined />}
              onClick={() => handleBulkAction('share')}
            >
              Share
            </Button>
            <Button 
              icon={<DownloadIcon />}
              onClick={() => handleBulkAction('export')}
            >
              Export
            </Button>
            <Button 
              icon={<BookOutlined />}
              onClick={() => handleBulkAction('addToList')}
            >
              Add to List
            </Button>
            <Button 
              type="text"
              danger
              onClick={() => setSelectedArticles([])}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      </div>
    )
  );

  const renderArticlesGrid = () => {
    if (filters.viewMode === 'list') {
      return (
        <div className="space-y-4">
          {articles.map(article => (
            <Card 
              key={article.id}
              className="hover:shadow-lg transition-all duration-300"
              onClick={() => navigate(`/dashboard/article/${article.slug}`)}
            >
              <Row gutter={16} align="middle">
                <Col span={1}>
                  <Checkbox 
                    checked={selectedArticles.includes(article.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArticleSelect(article.id);
                    }}
                  />
                </Col>
                <Col span={4}>
                  {article.coverImage ? (
                    <img 
                      src={article.coverImage} 
                      alt={article.title}
                      className="w-full h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                      <FileTextOutlined className="text-2xl text-gray-400" />
                    </div>
                  )}
                </Col>
                <Col span={14}>
                  <Title level={5} className="!mb-2 line-clamp-1">
                    {article.title}
                  </Title>
                  <Paragraph className="!mb-2 line-clamp-2">
                    {article.excerpt}
                  </Paragraph>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{article.author?.name}</span>
                    <span>•</span>
                    <span>{article.readingTime || 5} min read</span>
                    <span>•</span>
                    <span>{article.category?.name}</span>
                  </div>
                </Col>
                <Col span={5} className="text-right">
                  <div className="flex flex-col gap-1">
                    <Badge count={`${article.viewCount || 0} views`} />
                    <Badge count={`${article.likeCount || 0} likes`} color="green" />
                    {article.accessType === 'PREMIUM' && (
                      <Badge count="Premium" color="gold" />
                    )}
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
              className="hover:shadow-md transition-all duration-300"
              onClick={() => navigate(`/dashboard/article/${article.slug}`)}
            >
              <div className="flex gap-3">
                <Checkbox 
                  checked={selectedArticles.includes(article.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArticleSelect(article.id);
                  }}
                />
                <div className="flex-1">
                  <Title level={5} className="!mb-1 line-clamp-2">
                    {article.title}
                  </Title>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{article.category?.name}</span>
                    <span>•</span>
                    <span>{article.readingTime || 5} min</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }
    
    // Default grid view
    return (
      <Row gutter={[24, 24]}>
        {articles.map(article => (
          <Col 
            key={article.id} 
            xs={24} 
            sm={12} 
            lg={8} 
            xl={6}
            onClick={() => navigate(`/dashboard/article/${article.slug}`)}
            className="cursor-pointer"
          >
            <div className="relative">
              <Checkbox 
                checked={selectedArticles.includes(article.id)}
                onChange={() => handleArticleSelect(article.id)}
                className="absolute top-2 left-2 z-10"
                onClick={(e) => e.stopPropagation()}
              />
              <ArticleCard article={article} variant="default" />
            </div>
          </Col>
        ))}
      </Row>
    );
  };

  const renderQuickFilters = () => (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Text strong>Quick Filters:</Text>
        <Button 
          type={filters.accessType === 'free' ? 'primary' : 'default'}
          size="small"
          onClick={() => handleFilterChange('accessType', 'free')}
          icon={<UnlockOutlined />}
        >
          Free Only
        </Button>
        <Button 
          type={filters.accessType === 'premium' ? 'primary' : 'default'}
          size="small"
          onClick={() => handleFilterChange('accessType', 'premium')}
          icon={<CrownOutlined />}
        >
          Premium Only
        </Button>
        <Button 
          type={filters.readingTime === 'short' ? 'primary' : 'default'}
          size="small"
          onClick={() => handleFilterChange('readingTime', 'short')}
          icon={<CoffeeIcon />}
        >
          Quick Reads
        </Button>
        <Button 
          type={filters.sort === 'trending' ? 'primary' : 'default'}
          size="small"
          onClick={() => handleFilterChange('sort', 'trending')}
          icon={<FireOutlined />}
        >
          Trending
        </Button>
        <Button 
          type={filters.sort === 'popular' ? 'primary' : 'default'}
          size="small"
          onClick={() => handleFilterChange('sort', 'popular')}
          icon={<StarOutlined />}
        >
          Popular
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category.id}
            type={filters.category === category.slug ? 'primary' : 'default'}
            size="small"
            onClick={() => handleFilterChange('category', category.slug)}
            className="flex items-center gap-2"
          >
            <FolderOutlined />
            {category.name}
            <Badge count={category.articleCount} style={{ backgroundColor: '#52c41a' }} />
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      {showHero && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 text-white py-12 mb-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <Title level={1} className="!text-white !mb-4">
                  Explore All Articles
                </Title>
                <Paragraph className="text-xl text-white/90 mb-6 max-w-3xl">
                  Browse our complete collection of {stats?.totalArticles?.toLocaleString() || 0}+ articles. 
                  Filter by category, reading time, access type, and more to find exactly what you need.
                </Paragraph>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    type="primary" 
                    size="large"
                    className="bg-white text-blue-600 hover:bg-gray-100"
                    icon={<CompassOutlined />}
                    onClick={() => navigate('/dashboard/articles')}
                  >
                    Back to Articles Feed
                  </Button>
                  <Button 
                    size="large"
                    className="bg-transparent text-white border-2 border-white/30 hover:border-white/50"
                    icon={<DownloadIcon />}
                    onClick={handleExportArticles}
                  >
                    Export Results
                  </Button>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 min-w-[300px]">
                <Title level={4} className="!text-white !mb-4">Quick Stats</Title>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Text className="text-white/80">Total Articles</Text>
                    <Text strong className="text-white">
                      {(stats?.totalArticles || 0).toLocaleString()}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-white/80">Free Access</Text>
                    <Text strong className="text-green-300">
                      {(stats?.freeArticles || 0).toLocaleString()}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-white/80">Premium</Text>
                    <Text strong className="text-yellow-300">
                      {(stats?.premiumArticles || 0).toLocaleString()}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-white/80">Avg. Rating</Text>
                    <Rate 
                      disabled 
                      defaultValue={stats.averageRating} 
                      className="text-yellow-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        {renderStatsCards()}
        
        {/* Main Search and Filters */}
        <Card className="mb-8 shadow-sm">
          <div className="mb-6">
            <Search
              placeholder="Search articles by title, content, author, or tags..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Quick Filters */}
            <div className="lg:w-1/4">
              <div className="sticky top-6 space-y-6">
                {/* Quick Filters */}
                <div className="space-y-4">
                  <Text strong className="block">Access Type</Text>
                  {accessTypeOptions.map(option => (
                    <Button
                      key={option.value}
                      type={filters.accessType === option.value ? 'primary' : 'default'}
                      block
                      icon={option.icon}
                      onClick={() => handleFilterChange('accessType', option.value)}
                      className="text-left"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                
                <Divider />
                
                <div className="space-y-4">
                  <Text strong className="block">Reading Time</Text>
                  {readingTimeOptions.map(option => (
                    <Button
                      key={option.value}
                      type={filters.readingTime === option.value ? 'primary' : 'default'}
                      block
                      icon={option.icon}
                      onClick={() => handleFilterChange('readingTime', option.value)}
                      className="text-left"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                
                <Divider />
                
                <div className="space-y-4">
                  <Text strong className="block">Popular Categories</Text>
                  {categories.slice(0, 5).map(category => (
                    <Button
                      key={category.id}
                      type={filters.category === category.slug ? 'primary' : 'default'}
                      block
                      icon={<FolderOutlined />}
                      onClick={() => handleFilterChange('category', category.slug)}
                      className="text-left justify-start"
                    >
                      <div className="flex justify-between items-center w-full">
                        <span>{category.name}</span>
                        <Badge count={category.articleCount} />
                      </div>
                    </Button>
                  ))}
                </div>
                
                <Button 
                  block
                  type="link"
                  onClick={() => navigate('/dashboard/categories')}
                  className="!text-blue-600"
                >
                  View All Categories →
                </Button>
              </div>
            </div>
            
            {/* Right Column - Articles */}
            <div className="lg:w-3/4">
              {/* View Controls */}
              {renderViewControls()}
              
              {/* Bulk Actions */}
              {renderBulkActions()}
              
              {/* Quick Filters */}
              {renderQuickFilters()}
              
              {/* Saved Filters */}
              {renderSavedFilters()}
              
              {/* Advanced Filters Toggle */}
              <div className="mb-4">
                <Button 
                  type="text"
                  icon={filters.showAdvancedFilters ? <UpOutlined /> : <DownOutlined />}
                  onClick={() => handleFilterChange('showAdvancedFilters', !filters.showAdvancedFilters)}
                  className="!text-blue-600"
                >
                  {filters.showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
                </Button>
              </div>
              
              {/* Advanced Filters */}
              {filters.showAdvancedFilters && renderAdvancedFilters()}
              
              {/* Articles Grid/List */}
              {loading ? (
                <Row gutter={[24, 24]}>
                  {[...Array(filters.itemsPerPage)].map((_, i) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={i}>
                      <Card>
                        <Skeleton active avatar paragraph={{ rows: 3 }} />
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : articles.length > 0 ? (
                <>
                  {renderArticlesGrid()}
                  
                  {/* Load More */}
                  {hasMore && (
                    <div className="text-center mt-12">
                      <Button 
                        type="dashed" 
                        size="large"
                        loading={loading}
                        onClick={() => {
                          setPage(prev => prev + 1);
                          fetchArticles(false);
                        }}
                        icon={<ArrowDownOutlined />}
                        className="px-12"
                      >
                        Load More Articles
                      </Button>
                      <Text type="secondary" className="block mt-2">
                        Showing {articles.length} of {totalArticles} articles
                      </Text>
                    </div>
                  )}
                </>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <Title level={4} className="!mb-4">
                        No articles found
                      </Title>
                      <Paragraph className="mb-6">
                        Try adjusting your filters or search terms
                      </Paragraph>
                      <Button 
                        type="primary"
                        onClick={handleResetFilters}
                        icon={<ReloadOutlined />}
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  }
                />
              )}
              
              {/* Results Summary */}
              {articles.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                      <Text strong className="text-lg">
                        Found {totalArticles.toLocaleString()} articles matching your criteria
                      </Text>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {filters.category && (
                          <Tag color="blue" closable onClose={() => handleFilterChange('category', '')}>
                            Category: {categories.find(c => c.slug === filters.category)?.name}
                          </Tag>
                        )}
                        {filters.accessType !== 'all' && (
                          <Tag color="purple" closable onClose={() => handleFilterChange('accessType', 'all')}>
                            Access: {filters.accessType}
                          </Tag>
                        )}
                        {filters.readingTime && filters.readingTime !== 'any' && (
                          <Tag color="green" closable onClose={() => handleFilterChange('readingTime', 'any')}>
                            Reading Time: {filters.readingTime}
                          </Tag>
                        )}
                        {filters.search && (
                          <Tag color="orange" closable onClose={() => handleFilterChange('search', '')}>
                            Search: {filters.search}
                          </Tag>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        icon={<DownloadIcon />}
                        onClick={handleExportArticles}
                      >
                        Export Results
                      </Button>
                      <Button 
                        icon={<ShareAltOutlined />}
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          alert('Link copied to clipboard!');
                        }}
                      >
                        Share Search
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
        
        {/* Categories Explorer */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <Title level={3}>Browse by Category</Title>
            <Button 
              type="link"
              onClick={() => navigate('/dashboard/categories')}
              className="!text-blue-600"
            >
              View All Categories →
            </Button>
          </div>
          
          <Row gutter={[16, 16]}>
            {categories.slice(0, 8).map(category => (
              <Col xs={24} sm={12} md={8} lg={6} key={category.id}>
                <Card 
                  hoverable
                  className="h-full text-center"
                  onClick={() => {
                    handleFilterChange('category', category.slug);
                    fetchArticles(true);
                  }}
                >
                  <div className={`w-12 h-12 rounded-full ${category.color || 'bg-blue-100'} flex items-center justify-center mx-auto mb-4`}>
                    <FolderOutlined className="text-xl text-blue-600" />
                  </div>
                  <Title level={5} className="!mb-2">
                    {category.name}
                  </Title>
                  <Text type="secondary" className="block mb-3">
                    {category.description || 'Explore articles in this category'}
                  </Text>
                  <Badge 
                    count={`${category.articleCount || 0} articles`}
                    style={{ backgroundColor: '#52c41a' }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        
        {/* Help Section */}
        <Alert
          message="Need Help?"
          description={
            <div>
              <Paragraph className="!mb-2">
                Use the filters on the left to narrow down your search. You can filter by:
              </Paragraph>
              <ul className="list-disc pl-4 space-y-1">
                <li><Text strong>Access Type:</Text> Free or Premium articles</li>
                <li><Text strong>Reading Time:</Text> Quick reads or deep dives</li>
                <li><Text strong>Categories:</Text> Browse by topic</li>
                <li><Text strong>Advanced Filters:</Text> For more specific searches</li>
              </ul>
              <Paragraph className="!mt-4 !mb-0">
                Save your favorite filter combinations for quick access later!
              </Paragraph>
            </div>
          }
          type="info"
          showIcon
          className="mb-8"
        />
      </div>

      {/* Filter Drawer (Mobile) */}
      <Drawer
        title="Filter Articles"
        placement="right"
        onClose={() => setFilterDrawerVisible(false)}
        visible={filterDrawerVisible}
        width={350}
      >
        {/* Add filter options here */}
        <div className="space-y-6">
          <div>
            <Text strong className="block mb-2">Sort By</Text>
            <Select
              value={filters.sort}
              onChange={(value) => handleFilterChange('sort', value)}
              className="w-full"
            >
              {sortOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </Option>
              ))}
            </Select>
          </div>
          
          <div>
            <Text strong className="block mb-2">Access Type</Text>
            <Radio.Group 
              value={filters.accessType}
              onChange={(e) => handleFilterChange('accessType', e.target.value)}
              className="w-full"
            >
              {accessTypeOptions.map(option => (
                <Radio key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </Radio>
              ))}
            </Radio.Group>
          </div>
          
          <div>
            <Text strong className="block mb-2">Reading Time</Text>
            <Select
              value={filters.readingTime || 'any'}
              onChange={(value) => handleFilterChange('readingTime', value)}
              className="w-full"
            >
              {readingTimeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </Option>
              ))}
            </Select>
          </div>
          
          <Button 
            type="primary" 
            block 
            onClick={() => {
              fetchArticles(true);
              setFilterDrawerVisible(false);
            }}
          >
            Apply Filters
          </Button>
          
          <Button 
            block 
            onClick={handleResetFilters}
          >
            Reset All Filters
          </Button>
        </div>
      </Drawer>

      {/* Export Modal */}
      <Modal
        title="Export Articles"
        visible={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setExportModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="export" 
            type="primary" 
            onClick={handleExportArticles}
            icon={<DownloadIcon />}
          >
            Export Now
          </Button>,
        ]}
      >
        <Paragraph>
          You are about to export {articles.length} articles. The export will include:
        </Paragraph>
        <ul className="list-disc pl-5 space-y-2">
          <li>Article titles and content</li>
          <li>Author information</li>
          <li>Publication dates</li>
          <li>Reading times</li>
          <li>Current filter settings</li>
        </ul>
        <Alert
          message="Note"
          description="The export will be in JSON format. You can import it later or use it for analysis."
          type="info"
          className="mt-4"
        />
      </Modal>
    </div>
  );
};

export default AllArticlesPage;