// pages/CategoriesPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Input, 
  Tag,
  Empty,
  Skeleton
} from 'antd';
import { 
  SearchOutlined,
  FolderOutlined,
  StarOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  CompassOutlined,
  SortAscendingOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import articleApi from '../../services/articleApi';
import './CategoriesPage.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// Define a more specific type for category
interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  color?: string;
  description?: string;
  articleCount?: number;
  featured?: boolean;
  trending?: boolean;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

const CategoriesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular');

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await articleApi.getCategories();
      const categoriesData = response.data || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort categories
  const filteredCategories = categories
    .filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.tags?.some(tag => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.articleCount || 0) - (a.articleCount || 0);
        case 'recent':
          const dateA = a.updatedAt || a.createdAt || '';
          const dateB = b.updatedAt || b.createdAt || '';
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const handleCategoryClick = (categorySlug: string) => {
    navigate(`/dashboard/articles?category=${categorySlug}`);
  };

  // Render category card
  const renderCategoryCard = (category: CategoryItem) => {
    const categoryColor = category.color || '#3b82f6';
    const articleCount = category.articleCount || 0;

    return (
      <Col xs={24} sm={12} lg={8} xl={6} key={category.id}>
        <Card
          hoverable
          className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group cursor-pointer"
          onClick={() => handleCategoryClick(category.slug)}
        >
          {/* Color accent bar */}
          <div 
            className="h-2 w-full mb-6 rounded-t-lg transition-all duration-300 group-hover:h-3"
            style={{ backgroundColor: categoryColor }}
          />

          <div className="p-4">
            {/* Icon and Name */}
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ 
                  backgroundColor: `${categoryColor}20`,
                  color: categoryColor
                }}
              >
                <FolderOutlined className="text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <Title level={4} className="!mb-1 line-clamp-1">
                  {category.name}
                </Title>
                {category.description && (
                  <Text className="text-gray-500 text-sm line-clamp-2">
                    {category.description}
                  </Text>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileTextOutlined className="text-gray-400" />
                  <span className="font-medium">{articleCount} articles</span>
                </div>
                {category.featured && (
                  <Tag color="gold" icon={<StarOutlined />}>
                    Featured
                  </Tag>
                )}
              </div>

              {/* Tags */}
              {category.tags && category.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {category.tags.slice(0, 3).map((tag: string, index: number) => (
                    <Tag key={index} className="text-xs">
                      {tag}
                    </Tag>
                  ))}
                  {category.tags.length > 3 && (
                    <Tag className="text-xs">+{category.tags.length - 3}</Tag>
                  )}
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <Button 
                type="link" 
                className="p-0 font-medium text-blue-600 hover:text-blue-800"
                icon={<ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCategoryClick(category.slug);
                }}
              >
                Explore Topic
              </Button>
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <CompassOutlined className="text-2xl" />
              </div>
              <Title level={1} className="!text-white !mb-0 text-4xl md:text-5xl">
                Knowledge Library
              </Title>
            </div>
            <Paragraph className="text-xl text-white/90 max-w-3xl mx-auto">
              Explore our curated collection of topics. Each category is a gateway to specialized knowledge, 
              expert insights, and actionable content designed to accelerate your learning journey.
            </Paragraph>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full">
              <Search
                placeholder="Search topics, descriptions, or tags..."
                allowClear
                size="large"
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <Button
                type={sortBy === 'popular' ? 'primary' : 'default'}
                icon={<SearchOutlined />}
                onClick={() => setSortBy('popular')}
              >
                Most Popular
              </Button>
              <Button
                type={sortBy === 'recent' ? 'primary' : 'default'}
                icon={<ClockCircleOutlined />}
                onClick={() => setSortBy('recent')}
              >
                Recently Updated
              </Button>
              <Button
                type={sortBy === 'name' ? 'primary' : 'default'}
                icon={<SortAscendingOutlined />}
                onClick={() => setSortBy('name')}
              >
                A to Z
              </Button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6 flex items-center justify-between">
          <Text className="text-gray-600 dark:text-gray-400">
            {searchTerm 
              ? `Found ${filteredCategories.length} topics matching "${searchTerm}"`
              : `Showing all ${categories.length} topics`}
          </Text>
          {searchTerm && (
            <Button
              type="link"
              onClick={() => setSearchTerm('')}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear Search
            </Button>
          )}
        </div>

        {/* Categories Grid */}
        {loading ? (
          <Row gutter={[24, 24]}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Col xs={24} sm={12} lg={8} xl={6} key={i}>
                <Card className="border-0 shadow-lg">
                  <Skeleton active avatar paragraph={{ rows: 3 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : filteredCategories.length > 0 ? (
          <>
            <Row gutter={[24, 24]}>
              {filteredCategories.map(renderCategoryCard)}
            </Row>
            
            {/* Show load more if we have more categories to display */}
            {filteredCategories.length < categories.length && (
              <div className="text-center mt-12">
                <Button 
                  type="dashed" 
                  size="large"
                  className="px-12"
                  onClick={() => {
                    // Currently showing all categories, but you could implement pagination here
                    console.log('Load more clicked - implement pagination if needed');
                  }}
                >
                  Show All Topics
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-16">
            <Empty
              description={
                <div className="text-center">
                  <Title level={4} className="!mb-4">
                    No topics found
                  </Title>
                  <Paragraph className="text-gray-500 mb-8">
                    {searchTerm 
                      ? `No topics match "${searchTerm}". Try different keywords.`
                      : 'No topics available at the moment.'}
                  </Paragraph>
                  {searchTerm && (
                    <Button 
                      type="primary"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              }
            />
          </div>
        )}

        {/* Featured Categories Section */}
        {categories.filter(c => c.featured).length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <Title level={2} className="!mb-2">
                  <StarOutlined className="text-yellow-500 mr-3" />
                  Featured Topics
                </Title>
                <Text className="text-gray-600 dark:text-gray-400">
                  Handpicked categories our editors recommend
                </Text>
              </div>
            </div>
            <Row gutter={[24, 24]}>
              {categories
                .filter(c => c.featured)
                .slice(0, 4)
                .map(category => (
                  <Col xs={24} lg={12} key={category.id}>
                    <Card
                      hoverable
                      className="h-full border-0 shadow-xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900"
                      onClick={() => handleCategoryClick(category.slug)}
                    >
                      <div className="flex items-start gap-6">
                        <div 
                          className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ 
                            backgroundColor: `${category.color || '#3b82f6'}20`,
                            color: category.color || '#3b82f6'
                          }}
                        >
                          <FolderOutlined className="text-2xl" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Title level={4} className="!mb-0">
                              {category.name}
                            </Title>
                            <Tag color="gold" icon={<StarOutlined />}>
                              Featured
                            </Tag>
                          </div>
                          <Paragraph className="text-gray-600 dark:text-gray-400 mb-4">
                            {category.description || 'Explore this featured topic for premium content.'}
                          </Paragraph>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-gray-500">
                                <FileTextOutlined className="mr-1" />
                                {category.articleCount || 0} articles
                              </span>
                            </div>
                            <Button 
                              type="primary" 
                              ghost
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCategoryClick(category.slug);
                              }}
                            >
                              Explore Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
            </Row>
          </div>
        )}

        {/* Empty State Suggestions */}
        {!loading && categories.length === 0 && (
          <div className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto">
              <Title level={3} className="!mb-4">No Categories Available</Title>
              <Paragraph className="text-gray-600 mb-6">
                It looks like no categories have been created yet. Categories help organize content and make it easier for users to find what they're looking for.
              </Paragraph>
              <Button 
                type="primary" 
                size="large"
                icon={<FolderOutlined />}
                onClick={() => {
                  // You could navigate to an admin page or refresh
                  fetchCategories();
                }}
              >
                Check Again
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;