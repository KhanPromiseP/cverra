import { t, Trans } from "@lingui/macro";
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Input, 
  Select, 
  Tag, 
  Badge,
  Dropdown, 
  Modal, 
  message,
  Tooltip,
  Avatar,
  Popconfirm,
  Drawer,
  Tabs,
  Alert,
  Rate,
  Row,
  Col,
  Statistic,
  Empty,
  Typography,
  Progress,
  List
} from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  FilterOutlined,
  ExportOutlined,
  CopyOutlined,
  TranslationOutlined,
  CrownOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
  WarningOutlined,
  EyeInvisibleOutlined,
  EditFilled,
  CheckOutlined,
  DownloadOutlined,
  LoadingOutlined,
  RobotOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { getArticles, deleteArticle, updateArticleStatus, getArticleAvailableLanguages, getTranslationStatus, triggerArticleTranslation, getTranslations, updateTranslation, regenerateTranslation } from '../../../../services/article.service';
import { getAdminArticles } from '../../../../services/articleApi';
import dayjs from 'dayjs';
import ArticleAdminNavbar from '../ArticleAdminSidebar';
const { Search } = Input;

const { Option } = Select;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  accessType: 'FREE' | 'PREMIUM' | 'SUBSCRIPTION';
  viewCount: number;
  likeCount: number;
  commentCount?: number; // Keep for backward compatibility
  reviewCount?: number; // Add this
  averageRating?: number; // Add this
  isFeatured: boolean;
  isTrending: boolean;
  publishedAt?: string;
  author: {
    name: string;
    picture?: string;
    id: string;
  };
  category: {
    name: string;
    color?: string;
  };
  autoTranslate?: boolean;
  targetLanguages?: string[];
  reviewStats?: {
    totalCount: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
  };
}

interface Translation {
  id: string;
  language: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  confidence?: number;
  needsReview: boolean;
  qualityScore?: number;
  translatedBy: 'AI' | 'HUMAN' | string;
  createdAt: string;
  updatedAt: string;
  article?: {
    id: string;
    title: string;
    slug: string;
  };
  translatedTitle?: string;
  translatedContent?: string;
  translatedExcerpt?: string;
}

interface TranslationStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  needsReview: number;
}

interface AvailableLanguage {
  language: string;
  isOriginal: boolean;
  qualityScore: number;
  confidence: number;
}

const ArticlesList: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    accessType: '',
    search: '',
  });
  const [userRole, setUserRole] = useState<string>('ADMIN');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Translation management states
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [translationDrawerVisible, setTranslationDrawerVisible] = useState(false);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<AvailableLanguage[]>([]);
  const [translationStats, setTranslationStats] = useState<TranslationStats>({
    total: 0,
    completed: 0,
    failed: 0,
    pending: 0,
    needsReview: 0,
  });
  const [generateLoading, setGenerateLoading] = useState(false);

  useEffect(() => {
    // Get user role and ID from localStorage or auth context
    const role = localStorage.getItem('userRole') || 'ADMIN';
    const userId = localStorage.getItem('userId') || '';
    setUserRole(role);
    setCurrentUserId(userId);
    fetchArticles();
  }, [pagination.current, filters]);

  const fetchArticles = async () => {
  setLoading(true);
  try {
    const params: any = {
      page: pagination.current,
      limit: pagination.pageSize,
    };
    
    if (filters.status) params.status = filters.status;
    if (filters.accessType) params.accessType = filters.accessType;
    if (filters.search) params.search = filters.search;
    
    console.log('📡 Fetching admin articles...');
    
    const data = await getAdminArticles(params);
    
    console.log('📦 Received data:', {
      articlesCount: data?.articles?.length,
      total: data?.total,
    });
    
    // Map the API response to match your local interface
    const mappedArticles = data?.articles?.map((article: any) => ({
      ...article,
      reviewStats: article.reviewStats ? {
        totalCount: article.reviewStats.totalReviews, // Map totalReviews to totalCount
        averageRating: article.reviewStats.averageRating,
        ratingDistribution: article.reviewStats.ratingDistribution
      } : undefined,
      // Also map these for backward compatibility
      reviewCount: article.reviewStats?.totalReviews || article.reviewCount,
      averageRating: article.reviewStats?.averageRating || article.averageRating
    })) || [];
    
    setArticles(mappedArticles);
    setPagination(prev => ({
      ...prev,
      total: data?.total || 0,
    }));
    
  } catch (error) {
    console.error('Failed to load articles:', error);
    message.error(t`Failed to load articles`);
    setArticles([]);
  } finally {
    setLoading(false);
  }
};

  const handleEditTranslation = (translation: Translation) => {
    if (translation.article?.slug) {
      const params = new URLSearchParams({
        translationId: translation.id,
        language: translation.language,
        step: '4'
      });
      
      navigate(`/dashboard/article-admin/articles/edit/${translation.article.slug}?${params.toString()}`);
    } else {
      message.error(t`Cannot edit translation: Article information missing`);
    }
  };


  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteArticle(id);
      message.success(t`Article deleted successfully`);
      fetchArticles();
    } catch (error: any) {
      console.error('Delete error:', error);
      message.error(error.message || t`Failed to delete article`);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateArticleStatus(id, { status });
      message.success(t`Status updated successfully`);
      fetchArticles();
    } catch (error: any) {
      console.error('Status change error:', error);
      message.error(error.message || t`Failed to update status`);
    }
  };

  const handleDuplicate = async (article: Article) => {
    Modal.confirm({
      title: t`Duplicate Article`,
      content: t`Create a copy of "${article.title}"?`,
      onOk: async () => {
        try {
          // API call to duplicate article
          message.success(t`Article duplicated successfully`);
          fetchArticles();
        } catch (error) {
          message.error(t`Failed to duplicate article`);
        }
      },
    });
  };

  const handleEdit = (article: Article) => {
    navigate(`/dashboard/article-admin/articles/edit/${article.slug}`);
  };

  const handleNewArticle = () => {
    navigate('/dashboard/article-admin/articles/new');
  };

  const handlePreview = (slug: string) => {
    window.open(`/dashboard/article/${slug}`, '_blank');
  };

  const handleManageTranslations = async (article: Article) => {
    setSelectedArticle(article);
    setTranslationLoading(true);
    
    try {
      const langData = await getArticleAvailableLanguages(article.id);
      setAvailableLanguages(langData.languages || []);
      
      const statusData = await getTranslationStatus(article.id);
      
      const translationsData = await getTranslations({
        page: 1,
        limit: 50,
      });
      
      const articleTranslations = Array.isArray(translationsData.data) 
        ? translationsData.data.filter((t: Translation) => t.article?.id === article.id)
        : [];
      
      setTranslations(articleTranslations);
      
      const stats: TranslationStats = {
        total: articleTranslations.length,
        completed: articleTranslations.filter((t: any) => t.status === 'COMPLETED').length,
        failed: articleTranslations.filter((t: any) => t.status === 'FAILED').length,
        pending: articleTranslations.filter((t: any) => t.status === 'PENDING' || t.status === 'PROCESSING').length,
        needsReview: articleTranslations.filter((t: any) => t.needsReview).length,
      };
      
      setTranslationStats(stats);
      setTranslationDrawerVisible(true);
      
    } catch (error: any) {
      console.error('Error loading translation data:', error);
      message.error(t`Failed to load translation data: ${error.message}`);
    } finally {
      setTranslationLoading(false);
    }
  };

  const handleGenerateTranslation = async (language: string, force: boolean = false) => {
    if (!selectedArticle) return;
    
    setGenerateLoading(true);
    try {
      await triggerArticleTranslation(selectedArticle.id, language, force);
      message.success(t`Translation started for ${language.toUpperCase()}. This may take a few moments.`);
      
      setTimeout(() => {
        handleManageTranslations(selectedArticle);
      }, 2000);
      
    } catch (error: any) {
      console.error('Error generating translation:', error);
      message.error(t`Failed to generate translation: ${error.message}`);
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleRegenerateTranslation = async (translationId: string) => {
    try {
      await regenerateTranslation(translationId);
      message.success(t`Translation regeneration started`);
      
      if (selectedArticle) {
        setTimeout(() => {
          handleManageTranslations(selectedArticle);
        }, 2000);
      }
    } catch (error: any) {
      message.error(t`Failed to regenerate translation: ${error.message}`);
    }
  };

  const handleMarkReviewed = async (translationId: string) => {
    try {
      await updateTranslation(translationId, { needsReview: false });
      message.success(t`Translation marked as reviewed`);
      
      if (selectedArticle) {
        handleManageTranslations(selectedArticle);
      }
    } catch (error: any) {
      message.error(t`Failed to update translation: ${error.message}`);
    }
  };

  const handleMarkForReview = async (translationId: string) => {
    try {
      await updateTranslation(translationId, { needsReview: true });
      message.success(t`Translation marked for review`);
      
      if (selectedArticle) {
        handleManageTranslations(selectedArticle);
      }
    } catch (error: any) {
      message.error(t`Failed to update translation: ${error.message}`);
    }
  };

  const getLanguageFlag = (language: string) => {
    const flags: Record<string, string> = {
      'en': '🇺🇸',
      'fr': '🇫🇷',
      'es': '🇪🇸',
      'de': '🇩🇪',
      'pt': '🇵🇹',
      'ar': '🇸🇦',
      'zh': '🇨🇳',
      'ja': '🇯🇵',
      'ru': '🇷🇺',
      'it': '🇮🇹',
      'ko': '🇰🇷',
    };
    return flags[language] || '🌐';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge status="success" text={t`Completed`} />;
      case 'PENDING':
        return <Badge status="default" text={t`Pending`} />;
      case 'PROCESSING':
        return <Badge status="processing" text={t`Processing`} />;
      case 'FAILED':
        return <Badge status="error" text={t`Failed`} />;
      default:
        return <Badge status="default" text={status} />;
    }
  };

  const getTranslationActions = (record: Translation) => [
    {
      key: 'edit',
      label: t`Edit Translation`,
      icon: <EditOutlined />,
      onClick: () => handleEditTranslation(record),
    },
    {
      key: 'regenerate',
      label: t`Regenerate with AI`,
      icon: <SyncOutlined />,
      onClick: () => handleRegenerateTranslation(record.id),
      disabled: record.status === 'PROCESSING',
    },
    {
      key: 'mark_reviewed',
      label: t`Mark as Reviewed`,
      icon: <CheckCircleOutlined />,
      onClick: () => handleMarkReviewed(record.id),
      disabled: !record.needsReview,
    },
    {
      key: 'mark_for_review',
      label: t`Mark for Review`,
      icon: <EyeInvisibleOutlined />,
      onClick: () => handleMarkForReview(record.id),
      disabled: record.needsReview,
    },
  ];

  // Helper function to get review display text
  const getReviewDisplay = (record: Article) => {
    const reviewCount = record.reviewStats?.totalCount || record.reviewCount || 0;
    const avgRating = record.reviewStats?.averageRating || record.averageRating || 0;
    
    if (reviewCount === 0) {
      return <span className="text-gray-400 dark:text-gray-500">{t`No reviews`}</span>;
    }
    
    return (
      <Tooltip title={t`${reviewCount} reviews with ${avgRating.toFixed(1)} average rating`}>
        <span>
          <Rate 
            disabled 
            value={avgRating} 
            allowHalf 
            className="text-sm [&_.ant-rate-star]:mr-0.5 [&_.ant-rate-star]:dark:text-yellow-500" 
          />
          <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
            ({reviewCount})
          </span>
        </span>
      </Tooltip>
    );
  };

  const columns = [
    {
      title: t`Title`,
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Article) => (
        <div className="dark:text-white">
          <div className="font-medium mb-1 dark:text-gray-100">
            <a 
              onClick={() => handleEdit(record)}
              className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              {text}
            </a>
            {record.isFeatured && (
              <Tag color="gold" className="ml-2 dark:bg-yellow-900 dark:text-yellow-200">
                {t`Featured`}
              </Tag>
            )}
            {record.isTrending && (
              <Tag color="volcano" className="ml-1 dark:bg-orange-900 dark:text-orange-200">
                {t`Trending`}
              </Tag>
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {record.excerpt?.substring(0, 100) || t`No excerpt`}...
          </div>
          <div className="space-x-1">
            <Tag color={record.category?.color || 'blue'} className="dark:bg-opacity-20">
              {record.category?.name || t`Uncategorized`}
            </Tag>
            {record.accessType === 'PREMIUM' && (
              <Tag icon={<CrownOutlined />} color="purple" className="dark:bg-purple-900 dark:text-purple-200">
                {t`Premium`}
              </Tag>
            )}
            {record.autoTranslate && (
              <Tooltip title={t`Auto-translation enabled`}>
                <Tag icon={<GlobalOutlined />} color="cyan" className="dark:bg-cyan-900 dark:text-cyan-200">
                  {t`Auto-translate`}
                </Tag>
              </Tooltip>
            )}
          </div>
        </div>
      ),
    },
    {
      title: t`Author`,
      dataIndex: 'author',
      key: 'author',
      width: 150,
      render: (author: any) => (
        <Space>
          <Avatar size="small" src={author?.picture} className="bg-blue-500 dark:bg-blue-600">
            {author?.name?.charAt(0) || 'U'}
          </Avatar>
          <span className="dark:text-gray-300">{author?.name || t`Unknown`}</span>
        </Space>
      ),
    },
    {
      title: t`Status`,
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
          DRAFT: { color: 'default', text: t`Draft` },
          PUBLISHED: { color: 'success', text: t`Published` },
          SCHEDULED: { color: 'processing', text: t`Scheduled` },
          ARCHIVED: { color: 'error', text: t`Archived` },
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return (
          <Tag 
            color={config.color} 
            className={`dark:bg-opacity-20 ${
              config.color === 'success' ? 'dark:bg-green-900 dark:text-green-200' :
              config.color === 'error' ? 'dark:bg-red-900 dark:text-red-200' :
              config.color === 'processing' ? 'dark:bg-blue-900 dark:text-blue-200' :
              'dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: t`Reviews`,
      key: 'reviews',
      width: 150,
      render: (_: any, record: Article) => getReviewDisplay(record),
    },
    {
      title: t`Translations`,
      key: 'translations',
      width: 120,
      render: (_: any, record: Article) => {
        const targetLanguages = record.targetLanguages || [];
        const hasTranslations = record.autoTranslate && targetLanguages.length > 0;
        
        return (
          <Space>
            <Tooltip title={hasTranslations ? t`${targetLanguages.length} target languages configured` : t`No auto-translation`}>
              <Tag color={hasTranslations ? 'blue' : 'default'} className="dark:bg-opacity-20">
                {hasTranslations ? `${targetLanguages.length} langs` : 'Manual'}
              </Tag>
            </Tooltip>
            <Tooltip title={t`Manage Translations`}>
              <Button
                type="text"
                icon={<TranslationOutlined />}
                onClick={() => handleManageTranslations(record)}
                size="small"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              />
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: t`Stats`,
      key: 'stats',
      width: 200,
      render: (_: any, record: Article) => (
        <Space direction="vertical" size="small" className="text-xs dark:text-gray-400">
          <div>
            👁️ {(record.viewCount || 0).toLocaleString()} {t`views`}
          </div>
          <div>
            ❤️ {record.likeCount || 0} {t`likes`}
          </div>
          <div>
            ⭐ {record.reviewStats?.totalCount || record.reviewCount || 0} {t`reviews`}
          </div>
          {record.publishedAt && (
            <div>
              📅 {dayjs(record.publishedAt).format('MMM D, YYYY')}
            </div>
          )}
        </Space>
      ),
    },
    {
  title: t`Actions`,
  key: 'actions',
  width: 120,
  render: (_: any, record: Article) => (
    <Space>
      <Tooltip title={t`Preview`}>
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => handlePreview(record.slug)}
          className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        />
      </Tooltip>
      <Tooltip title={t`Edit`}>
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        />
      </Tooltip>
      <Dropdown
        menu={{
          items: [
            {
              key: 'duplicate',
              icon: <CopyOutlined />,
              label: t`Duplicate`,
              onClick: () => handleDuplicate(record),
            },
            {
              key: 'translate',
              icon: <TranslationOutlined />,
              label: t`Manage Translations`,
              onClick: () => handleManageTranslations(record),
            },
            // Only show status change for SUPER_ADMIN
            ...(userRole === 'SUPER_ADMIN' ? [{
              key: 'status',
              label: t`Change Status`,
              children: [
                {
                  key: 'publish',
                  label: t`Publish`,
                  disabled: record.status === 'PUBLISHED',
                  onClick: () => handleStatusChange(record.id, 'PUBLISHED'),
                },
                {
                  key: 'draft',
                   label: t`Move to Draft`,
                  disabled: record.status === 'DRAFT',
                  onClick: () => handleStatusChange(record.id, 'DRAFT'),
                },
                {
                  key: 'archive',
                  label: t`Archive`,
                  disabled: record.status === 'ARCHIVED',
                  onClick: () => handleStatusChange(record.id, 'ARCHIVED'),
                },
              ],
            }] : []),
            {
              type: 'divider',
            },
            {
              key: 'delete',
              icon: <DeleteOutlined />,
              label: (
                <Popconfirm
                  title={t`Delete Article`}
                  description={t`Are you sure you want to delete this article?`}
                  onConfirm={() => handleDelete(record.id)}
                  okText={t`Yes`}
                  cancelText={t`No`}
                >
                  <span className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer">
                    {t`Delete`}
                  </span>
                </Popconfirm>
              ),
            },
          ],
        }}
        trigger={['click']}
      >
        <Button 
          type="text" 
          icon={<MoreOutlined />} 
          className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        />
      </Dropdown>
    </Space>
  ),
},
  ];

  return (
  <>
   {/* Article Admin Navbar */}
    <ArticleAdminNavbar 
      currentPath={window.location.pathname}
      title={userRole === 'SUPER_ADMIN' ? t`Super Admin Dashboard` : t`Article Dashboard`}
    />
    
    {/* Header Card */}
    <Card className="mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col gap-4">
        {/* Title Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 dark:text-white">
            <Button 
              type="text"
              icon={<ArrowLeftOutlined />} 
              onClick={() => window.history.back()}
              className="
                !text-gray-600 
                hover:!text-blue-600 
                dark:!text-gray-200 
                dark:hover:!text-blue-300
                hover:!bg-gray-100 
                dark:hover:!bg-gray-700
                !transition-colors 
                !duration-200
                rounded
              "
            >
              Back
            </Button>
            <div>
              <div className="font-semibold text-lg">
                {userRole === 'SUPER_ADMIN' ? t`All Articles` : t`My Articles`}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {userRole === 'SUPER_ADMIN' 
                  ? t`View and manage all articles in the system`
                  : t`View and manage your articles`
                }
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Tag color="blue" className="dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
              {articles.length} {t`articles`}
            </Tag>
            {userRole === 'SUPER_ADMIN' && (
              <Tag icon={<CrownOutlined />} color="purple" className="dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700">
                {t`All`}
              </Tag>
            )}
            {userRole === 'ADMIN' && (
              <Tag icon={<UserOutlined />} color="green" className="dark:bg-green-900 dark:text-green-200 dark:border-green-700">
                {t`My`}
              </Tag>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Search
            placeholder={t`Search articles...`}
            onSearch={(value: any) => setFilters(prev => ({ ...prev, search: value }))}
            className="w-full dark:[&_.ant-input]:bg-gray-700 dark:[&_.ant-input]:border-gray-600 dark:[&_.ant-input]:text-white"
            allowClear
            suffix={<SearchOutlined />}
          />
          
          <Select
            placeholder={t`Status`}
            allowClear
            className="w-full dark:[&_.ant-select-selector]:bg-gray-700 dark:[&_.ant-select-selector]:border-gray-600 dark:[&_.ant-select-selection-item]:text-white"
            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            dropdownClassName="dark:bg-gray-800 dark:border-gray-700"
          >
            <Option value="DRAFT">{t`Draft`}</Option>
            <Option value="PUBLISHED">{t`Published`}</Option>
            <Option value="SCHEDULED">{t`Scheduled`}</Option>
            <Option value="ARCHIVED">{t`Archived`}</Option>
          </Select>
          
          <Select
            placeholder={t`Access Type`}
            allowClear
            className="w-full dark:[&_.ant-select-selector]:bg-gray-700 dark:[&_.ant-select-selector]:border-gray-600 dark:[&_.ant-select-selection-item]:text-white"
            onChange={(value) => setFilters(prev => ({ ...prev, accessType: value }))}
            dropdownClassName="dark:bg-gray-800 dark:border-gray-700"
          >
            <Option value="FREE">{t`Free`}</Option>
            <Option value="PREMIUM">{t`Premium`}</Option>
            <Option value="SUBSCRIPTION">{t`Subscription`}</Option>
          </Select>
          
          <div className="flex gap-2">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleNewArticle}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border-0"
            >
              {t`New Article`}
            </Button>
            
            <Tooltip title={t`Export`}>
              <Button
                icon={<ExportOutlined />}
                className="dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                {t`Export`}
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </Card>

    {/* Table Card */}
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <Table
        columns={columns}
        dataSource={articles}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          className: "dark:[&_.ant-pagination-item]:bg-gray-800 dark:[&_.ant-pagination-item]:border-gray-600 dark:[&_.ant-pagination-item_a]:text-gray-300",
          responsive: true,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            t`${range[0]}-${range[1]} of ${total} articles`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
        className="
          [&_.ant-table-thead]:bg-gray-50 
          dark:[&_.ant-table-thead]:bg-gray-800 
          [&_.ant-table-cell]:dark:bg-gray-800 
          [&_.ant-table-cell]:dark:text-gray-200
          [&_.ant-table-tbody_>_tr:hover]:dark:bg-gray-700
          [&_.ant-table-tbody_>_tr:hover_.ant-table-cell]:dark:bg-gray-700
          [&_.ant-table-tbody_>_tr.ant-table-row-selected]:dark:bg-gray-900
          [&_.ant-table-tbody_>_tr.ant-table-row-selected_.ant-table-cell]:dark:bg-gray-900
          [&_.ant-table-tbody_>_tr.ant-table-row-selected:hover]:dark:bg-gray-600
          [&_.ant-table-tbody_>_tr.ant-table-row-selected:hover_.ant-table-cell]:dark:bg-gray-600
        "
      />
    </Card>

    {/* Translation Management Drawer */}
    <Drawer
      title={
        <Space className="dark:text-white">
          <TranslationOutlined />
          <span>
            {t`Translations for`} "{selectedArticle?.title}"
          </span>
        </Space>
      }
      placement="right"
      width={800}
      onClose={() => setTranslationDrawerVisible(false)}
      open={translationDrawerVisible}
      extra={
        <Space>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            onClick={() => {
              const failedTranslations = translations.filter(t => t.status === 'FAILED');
              if (failedTranslations.length > 0) {
                failedTranslations.forEach(t => handleRegenerateTranslation(t.id));
              }
            }}
            disabled={!translations.some(t => t.status === 'FAILED')}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border-0"
          >
            {t`Retry Failed`}
          </Button>
          <Button 
            onClick={() => setTranslationDrawerVisible(false)}
            className="dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            {t`Close`}
          </Button>
        </Space>
      }
      className="dark:bg-gray-800 [&_.ant-drawer-header]:dark:bg-gray-800 [&_.ant-drawer-header]:dark:border-gray-700"
      styles={{
        header: { backgroundColor: 'var(--ant-color-bg-container)' },
        body: { backgroundColor: 'var(--ant-color-bg-container)' }
      }}
    >
      {translationLoading ? (
        <div className="text-center py-12">
          <LoadingOutlined spin className="text-2xl text-blue-500 dark:text-blue-400" />
          <div className="mt-4 text-gray-600 dark:text-gray-400">{t`Loading translations...`}</div>
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <Card size="small" className="mb-6 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title={t`Total`}
                  value={translationStats.total}
                  prefix={<GlobalOutlined />}
                  className="dark:text-gray-300 [&_.ant-statistic-content]:dark:text-gray-300"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={t`Completed`}
                  value={translationStats.completed}
                  prefix={<CheckCircleOutlined />}
                  className="[&_.ant-statistic-content]:text-green-600 dark:[&_.ant-statistic-content]:text-green-400"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={t`Needs Review`}
                  value={translationStats.needsReview}
                  prefix={<WarningOutlined />}
                  className="[&_.ant-statistic-content]:text-yellow-600 dark:[&_.ant-statistic-content]:text-yellow-400"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={t`Failed`}
                  value={translationStats.failed}
                  prefix={<CloseCircleOutlined />}
                  className="[&_.ant-statistic-content]:text-red-600 dark:[&_.ant-statistic-content]:text-red-400"
                />
              </Col>
            </Row>
          </Card>

          {/* Translations Table */}
          <Tabs 
            defaultActiveKey="all" 
            className="[&_.ant-tabs-tab]:dark:text-gray-300 [&_.ant-tabs-tab-active]:dark:text-blue-400"
          >
            <TabPane tab={t`All Translations`} key="all">
              {translations.length === 0 ? (
                <Empty
                  description={t`No translations available`}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  className="dark:text-gray-400"
                >
                  {selectedArticle?.autoTranslate ? (
                    <Button 
                      type="primary"
                      onClick={() => {
                        selectedArticle.targetLanguages?.forEach(lang => {
                          handleGenerateTranslation(lang);
                        });
                      }}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border-0"
                    >
                      {t`Generate All Translations`}
                    </Button>
                  ) : (
                    <Alert
                      message={t`Auto-translation is disabled`}
                      description={t`Enable auto-translation in article settings to generate translations automatically.`}
                      type="info"
                      showIcon
                      className="dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-200"
                    />
                  )}
                </Empty>
              ) : (
                <List
                  dataSource={translations}
                  className="dark:text-gray-300"
                  renderItem={(translation) => (
                    <List.Item
                      key={translation.id}
                      className="border-b border-gray-200 dark:border-gray-700 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      actions={[
                        <Dropdown
                          key="actions"
                          menu={{ items: getTranslationActions(translation) }}
                          trigger={['click']}
                        >
                          <Button 
                            type="text" 
                            icon={<MoreOutlined />} 
                            size="small"
                            className="!text-gray-600 hover:!text-blue-600 dark:!text-gray-400 dark:hover:!text-blue-400"
                          />
                        </Dropdown>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div className="text-2xl">
                            {getLanguageFlag(translation.language)}
                          </div>
                        }
                        title={
                          <Space>
                            <Text strong className="dark:text-white">{translation.language.toUpperCase()}</Text>
                            {getStatusBadge(translation.status)}
                            {translation.translatedBy === 'HUMAN' && (
                              <Tag icon={<UserOutlined />} color="green" className="dark:bg-green-900 dark:text-green-200 dark:border-green-700">
                                {t`Human`}
                              </Tag>
                            )}
                            {translation.translatedBy === 'AI' && (
                              <Tag icon={<RobotOutlined />} color="blue" className="dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
                                {t`AI`}
                              </Tag>
                            )}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={2} className="w-full">
                            <div>
                              <Rate 
                                disabled 
                                value={translation.qualityScore} 
                                count={5} 
                                className="text-sm [&_.ant-rate-star]:dark:text-yellow-500"
                              />
                              {translation.confidence && (
                                <Progress
                                  percent={Math.round(translation.confidence * 100)}
                                  size="small"
                                  className="w-32 ml-3 [&_.ant-progress-bg]:bg-blue-500 dark:[&_.ant-progress-bg]:bg-blue-600"
                                />
                              )}
                            </div>
                            <div>
                              {translation.needsReview ? (
                                <Badge status="warning" text={t`Needs Review`} className="dark:[&_.ant-badge-status-dot]:bg-yellow-500" />
                              ) : (
                                <Badge status="success" text={t`Reviewed`} className="dark:[&_.ant-badge-status-dot]:bg-green-500" />
                              )}
                              <Text type="secondary" className="ml-3 dark:text-gray-400">
                                {dayjs(translation.updatedAt).fromNow()}
                              </Text>
                            </div>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </TabPane>
            
            <TabPane tab={t`Needs Review`} key="needsReview">
              {translations.filter(t => t.needsReview).length === 0 ? (
                <Alert
                  message={t`No translations need review`}
                  type="success"
                  showIcon
                  className="dark:bg-green-900/50 dark:border-green-800 dark:text-green-200"
                />
              ) : (
                <List
                  dataSource={translations.filter(t => t.needsReview)}
                  className="dark:text-gray-300"
                  renderItem={(translation) => (
                    <List.Item
                      key={translation.id}
                      className="border-b border-gray-200 dark:border-gray-700 py-4"
                      actions={[
                        <Button
                          key="approve"
                          type="primary"
                          icon={<CheckOutlined />}
                          onClick={() => handleMarkReviewed(translation.id)}
                          size="small"
                          className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 border-0"
                        >
                          {t`Approve`}
                        </Button>,
                        <Button
                          key="edit"
                          icon={<EditFilled />}
                          onClick={() => handleEditTranslation(translation)}
                          size="small"
                          className="!text-blue-600 hover:!text-blue-800 dark:!text-blue-400 dark:hover:!text-blue-300"
                        >
                          {t`Edit`}
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div className="text-2xl">
                            {getLanguageFlag(translation.language)}
                          </div>
                        }
                        title={
                          <Space>
                            <Text strong className="dark:text-white">{translation.language.toUpperCase()}</Text>
                            {getStatusBadge(translation.status)}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={4}>
                            <Text strong className="dark:text-gray-300">
                              {translation.translatedTitle || t`No title`}
                            </Text>
                            {translation.translatedExcerpt && (
                              <Text type="secondary" className="dark:text-gray-400">
                                {translation.translatedExcerpt}
                              </Text>
                            )}
                            <div>
                              <Rate 
                                disabled 
                                value={translation.qualityScore} 
                                count={5} 
                                className="text-sm [&_.ant-rate-star]:dark:text-yellow-500"
                              />
                            </div>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </TabPane>
            
            <TabPane tab={t`Failed`} key="failed">
              {translations.filter(t => t.status === 'FAILED').length === 0 ? (
                <Alert
                  message={t`No failed translations`}
                  type="success"
                  showIcon
                  className="dark:bg-green-900/50 dark:border-green-800 dark:text-green-200"
                />
              ) : (
                <List
                  dataSource={translations.filter(t => t.status === 'FAILED')}
                  className="dark:text-gray-300"
                  renderItem={(translation) => (
                    <List.Item
                      key={translation.id}
                      className="border-b border-gray-200 dark:border-gray-700 py-4"
                      actions={[
                        <Button
                          key="retry"
                          type="primary"
                          icon={<SyncOutlined />}
                          onClick={() => handleRegenerateTranslation(translation.id)}
                          size="small"
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border-0"
                        >
                          {t`Retry`}
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div className="text-2xl">
                            {getLanguageFlag(translation.language)}
                          </div>
                        }
                        title={<Text strong className="dark:text-white">{translation.language.toUpperCase()}</Text>}
                        description={
                          <Space direction="vertical" size={2}>
                            <Text type="secondary" className="dark:text-gray-400">
                              {t`Last attempt`}: {dayjs(translation.updatedAt).format('MMM D, YYYY h:mm A')}
                            </Text>
                            <Text type="danger" className="dark:text-red-400">
                              {t`Translation failed. Click retry to try again.`}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </TabPane>
          </Tabs>
        </>
      )}
    </Drawer>
  </>
);
};

export default ArticlesList;