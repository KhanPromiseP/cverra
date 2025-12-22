// components/search/SmartSearch.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Input, 
  Button, 
  Space, 
  Card, 
  Tag, 
  Typography, 
  AutoComplete,
  Dropdown,
  Slider,
  Select,
  DatePicker,
  Checkbox,
  Divider,
  Badge,
  Spin,
  Empty
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined,
  CloseOutlined,
  FireOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  ArrowRightOutlined,
  LoadingOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { articleApi } from '../../services/articleApi'; // Updated import
import type { Category } from '../../services/articleApi';
import debounce from 'lodash/debounce';

const { Text, Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Update the SearchResult interface to use the Article type
interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  category: Category;
  tags: string[];
  readingTime: number;
  viewCount: number;
  publishedAt: string;
  relevance?: number;
  highlights?: {
    title?: string[];
    content?: string[];
  };
}

const SmartSearch: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: [] as string[],
    tags: [] as string[],
    readingTime: [1, 60] as [number, number],
    publishedDate: null as any,
    accessType: [] as string[],
    sortBy: 'relevance' as 'relevance' | 'recent' | 'popular' | 'reading_time',
  });
  const [quickResults, setQuickResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const searchInputRef = useRef<any>(null);

  // Load initial data
  useEffect(() => {
    // Load recent searches
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }

    // Fetch dynamic data
    fetchCategories();
    fetchTrendingSearches();
  }, []);

  // Fetch categories dynamically
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await articleApi.getCategories();
      const data = response.data || [];
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch trending searches
  const fetchTrendingSearches = async () => {
    try {
      const data = await articleApi.getTrendingSearches();
      setTrendingSearches(data);
    } catch (error) {
      console.error('Failed to fetch trending searches:', error);
    }
  };

  // Debounced suggestions
  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const data = await articleApi.getSearchSuggestions(query);
        setSuggestions(data);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    }, 300),
    []
  );

  // Perform search
  const performSearch = async (query: string, currentFilters: typeof filters) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      // Convert filters to the expected format
      const searchFilters = {
        category: currentFilters.category,
        tags: currentFilters.tags,
        readingTime: currentFilters.readingTime,
        publishedDate: currentFilters.publishedDate,
        accessType: currentFilters.accessType,
        sortBy: currentFilters.sortBy,
      };

      const response = await articleApi.searchArticles(query, searchFilters);
      const results = response.data?.data || [];
      setQuickResults(results.slice(0, 5));
      
      // Save to recent searches
      const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
      setRecentSearches(newRecent);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (value: string, navigateToResults = false) => {
    const query = value.trim();
    if (!query) return;

    setSearchQuery(query);
    
    if (navigateToResults) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    } else {
      performSearch(query, filters);
    }
  };

  const handleQuickSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion, true);
    searchInputRef.current?.blur();
  };

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    if (searchQuery) {
      performSearch(searchQuery, newFilters);
    }
  };

  const clearFilters = () => {
  const clearedFilters = {
    category: [] as string[], // Explicit type
    tags: [] as string[],
    readingTime: [1, 60] as [number, number], // Tuple type
    publishedDate: null,
    accessType: [] as string[],
    sortBy: 'relevance' as 'relevance' | 'recent' | 'popular' | 'reading_time',
  };
  setFilters(clearedFilters);
  
  if (searchQuery) {
    performSearch(searchQuery, clearedFilters);
  }
};

  const renderHighlightedText = (text: string, highlights: string[] = []) => {
    if (!highlights.length) return text;

    const parts = [];
    let lastIndex = 0;
    
    // Sort highlights by position
    const sortedHighlights = highlights
      .map(h => ({ start: text.toLowerCase().indexOf(h.toLowerCase()), end: h.length }))
      .filter(h => h.start >= 0)
      .sort((a, b) => a.start - b.start);

    sortedHighlights.forEach((highlight, index) => {
      if (highlight.start > lastIndex) {
        parts.push(text.substring(lastIndex, highlight.start));
      }
      
      parts.push(
        <mark key={index} style={{ backgroundColor: '#fff566', padding: '0 2px' }}>
          {text.substring(highlight.start, highlight.start + highlight.end)}
        </mark>
      );
      
      lastIndex = highlight.start + highlight.end;
    });

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  const suggestionOptions = [
    {
      label: (
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong>Trending Searches</Text>
          <FireOutlined style={{ color: '#ff4d4f' }} />
        </Space>
      ),
      options: trendingSearches.map(search => ({
        value: search,
        label: (
          <Space>
            <FireOutlined style={{ color: '#ff4d4f' }} />
            <Text>{search}</Text>
          </Space>
        ),
      })),
    },
    {
      label: (
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong>Recent Searches</Text>
          <HistoryOutlined />
        </Space>
      ),
      options: recentSearches.map(search => ({
        value: search,
        label: (
          <Space>
            <HistoryOutlined />
            <Text>{search}</Text>
            <Button 
              type="text" 
              size="small" 
              icon={<CloseOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                const updated = recentSearches.filter(s => s !== search);
                setRecentSearches(updated);
                localStorage.setItem('recentSearches', JSON.stringify(updated));
              }}
            />
          </Space>
        ),
      })),
    },
    {
      label: (
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong>Suggestions</Text>
        </Space>
      ),
      options: suggestions.map(suggestion => ({
        value: suggestion,
        label: (
          <Space>
            <SearchOutlined />
            <Text>{suggestion}</Text>
          </Space>
        ),
      })),
    },
  ];

  const filterPanel = (
    <Card
      title={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong>Advanced Filters</Text>
          <Button type="link" size="small" onClick={clearFilters}>
            Clear All
          </Button>
        </Space>
      }
      style={{ width: 400 }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>Category</Text>
          {loadingCategories ? (
            <Spin size="small" />
          ) : (
            <Select
              mode="multiple"
              placeholder="Select categories"
              style={{ width: '100%' }}
              value={filters.category}
              onChange={(value) => handleFilterChange('category', value)}
              loading={loadingCategories}
            >
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.slug}>
                  <Space>
                    <div 
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: cat.color || '#666666'
                      }}
                    />
                    <span>{cat.name}</span>
                  </Space>
                </Option>
              ))}
            </Select>
          )}
        </div>

        <div>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>Reading Time</Text>
          <Slider
            range
            min={1}
            max={60}
            value={filters.readingTime}
            onChange={(value) => handleFilterChange('readingTime', value)}
            marks={{
              1: '1m',
              15: '15m',
              30: '30m',
              45: '45m',
              60: '60m+',
            }}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {filters.readingTime[0]} - {filters.readingTime[1]} minutes
          </Text>
        </div>

        <div>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>Published Date</Text>
          <RangePicker
            style={{ width: '100%' }}
            value={filters.publishedDate}
            onChange={(dates) => handleFilterChange('publishedDate', dates)}
            placeholder={['Start Date', 'End Date']}
          />
        </div>

        <div>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>Content Type</Text>
          <Checkbox.Group
            value={filters.accessType}
            onChange={(value) => handleFilterChange('accessType', value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical">
              <Checkbox value="free">
                <Space>
                  <GlobalOutlined />
                  <span>Free Articles</span>
                </Space>
              </Checkbox>
              <Checkbox value="premium">
                <Space>
                  <CrownOutlined style={{ color: '#722ed1' }} />
                  <span>Premium Articles</span>
                </Space>
              </Checkbox>
            </Space>
          </Checkbox.Group>
        </div>

        <div>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>Sort By</Text>
          <Select
            style={{ width: '100%' }}
            value={filters.sortBy}
            onChange={(value) => handleFilterChange('sortBy', value)}
          >
            <Option value="relevance">Relevance</Option>
            <Option value="recent">Most Recent</Option>
            <Option value="popular">Most Popular</Option>
            <Option value="reading_time">Reading Time</Option>
          </Select>
        </div>
      </Space>
    </Card>
  );

  return (
    <div style={{ position: 'relative' }}>
      <AutoComplete
        ref={searchInputRef}
        options={suggestionOptions}
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={(value) => {
          setSearchQuery(value);
          fetchSuggestions(value);
        }}
        onSelect={handleQuickSelect}
        style={{ width: '100%' }}
        dropdownRender={(menu) => (
          <div>
            {menu}
            {quickResults.length > 0 && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ padding: '0 12px 12px' }}>
                  <Text strong style={{ marginBottom: 8, display: 'block' }}>
                    Quick Results
                  </Text>
                  {quickResults.map(result => (
                    <div
                      key={result.id}
                      style={{
                        padding: '8px',
                        borderRadius: '4px',
                        marginBottom: '4px',
                        cursor: 'pointer',
                        backgroundColor: '#fafafa',
                      }}
                      onClick={() => navigate(`/article/${result.slug}`)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                    >
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Text strong style={{ fontSize: '14px' }}>
                          {renderHighlightedText(result.title, result.highlights?.title)}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {renderHighlightedText(result.excerpt, result.highlights?.content)}
                        </Text>
                        <Space size="small" style={{ marginTop: 4 }}>
                          <Tag 
                            color={result.category.color || 'blue'} 
                            style={{ margin: 0, fontSize: '10px' }}
                          >
                            {result.category.name}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: '10px' }}>
                            <ClockCircleOutlined /> {result.readingTime} min
                          </Text>
                        </Space>
                      </Space>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        dropdownMatchSelectWidth={600}
        dropdownStyle={{ 
          maxHeight: 400,
          overflow: 'auto',
        }}
      >
        <Input
          size="large"
          placeholder="Search for articles, topics, or authors..."
          prefix={<SearchOutlined />}
          suffix={
            <Space>
              {filters.category.length > 0 && (
                <Badge count={filters.category.length} style={{ backgroundColor: '#52c41a' }} />
              )}
              <Dropdown
                overlay={filterPanel}
                trigger={['click']}
                open={showFilters}
                onOpenChange={setShowFilters}
                placement="bottomRight"
              >
                <Button 
                  type={showFilters ? 'primary' : 'text'} 
                  icon={<FilterOutlined />}
                  size="small"
                />
              </Dropdown>
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={() => handleSearch(searchQuery, true)}
                loading={loading}
              />
            </Space>
          }
          onPressEnter={() => handleSearch(searchQuery, true)}
        />
      </AutoComplete>

      {/* Quick Actions */}
      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Text type="secondary" style={{ marginRight: 8 }}>Try:</Text>
        {trendingSearches.slice(0, 5).map((search, index) => (
          <Tag
            key={index}
            icon={index < 3 ? <FireOutlined /> : undefined}
            color={index === 0 ? 'red' : index === 1 ? 'orange' : index === 2 ? 'gold' : 'blue'}
            style={{ cursor: 'pointer' }}
            onClick={() => handleQuickSelect(search)}
          >
            {search}
          </Tag>
        ))}
      </div>
    </div>
  );
};

export default SmartSearch;