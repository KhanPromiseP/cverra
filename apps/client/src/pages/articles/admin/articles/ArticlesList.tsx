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
  Form,
  Switch,
  Descriptions,
  Empty,
  Divider,
  Typography,
  Input as AntdInput,
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
  UploadOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  FileTextOutlined,
  SoundOutlined,
  RobotOutlined,
  UserOutlined
} from '@ant-design/icons';
import { getArticles, deleteArticle, updateArticleStatus, getArticleAvailableLanguages, getTranslationStatus, triggerArticleTranslation, getTranslations, updateTranslation, regenerateTranslation } from '../../../../services/article.service';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = AntdInput;
const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  accessType: 'FREE' | 'PREMIUM';
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isFeatured: boolean;
  isTrending: boolean;
  publishedAt?: string;
  author: {
    name: string;
    picture?: string;
  };
  category: {
    name: string;
    color?: string;
  };
  autoTranslate?: boolean;
  targetLanguages?: string[];
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
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);
  const [editTranslationModal, setEditTranslationModal] = useState(false);
  const [editForm] = Form.useForm();
  const [generateLoading, setGenerateLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [translationStatus, setTranslationStatus] = useState<any>(null);

  useEffect(() => {
    fetchArticles();
  }, [pagination.current, filters]);

  // Navigation helper function
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

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

      const data = await getArticles(params);
      setArticles(data.articles || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
      }));
    } catch (error) {
      console.error('Failed to load articles:', error);
      message.error(t`Failed to load articles`);
    } finally {
      setLoading(false);
    }
  };
const handleEditTranslation = (translation: Translation) => {
  console.log('🔄 Edit Translation clicked:', {
    translationId: translation.id,
    language: translation.language,
    articleSlug: translation.article?.slug
  });

  if (translation.article?.slug) {
    // Navigate to article editor WITH translation parameters
    const params = new URLSearchParams({
      translationId: translation.id,
      language: translation.language,
      step: '4'  // Step index 4 = Translations step (zero-based)
    });
    
    navigateTo(`/dashboard/article-admin/articles/edit/${translation.article.slug}?${params.toString()}`);
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
    console.log('📝 Edit clicked:', {
      id: article.id,
      slug: article.slug,
      title: article.title
    });
    navigateTo(`/dashboard/article-admin/articles/edit/${article.slug}`);
  };

  const handleNewArticle = () => {
    navigateTo('/dashboard/article-admin/articles/new');
  };

  const handlePreview = (slug: string) => {
    window.open(`/article/${slug}`, '_blank');
  };

  // ========== TRANSLATION MANAGEMENT FUNCTIONS ==========

  const handleManageTranslations = async (article: Article) => {
    setSelectedArticle(article);
    setTranslationLoading(true);
    
    try {
      // Fetch available languages
      const langData = await getArticleAvailableLanguages(article.id);
      setAvailableLanguages(langData.languages || []);
      
      // Fetch translation status
      const statusData = await getTranslationStatus(article.id);
      setTranslationStatus(statusData);
      
      // Fetch translations
      const translationsData = await getTranslations({
        page: 1,
        limit: 50,
      });
      
      // Filter translations for this article
      const articleTranslations = Array.isArray(translationsData.data) 
        ? translationsData.data.filter((t: Translation) => t.article?.id === article.id)
        : [];
      
      setTranslations(articleTranslations);
      
      // Calculate stats
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
      
      // Refresh after delay
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
    {
      key: 'download',
      label: t`Download Translation`,
      icon: <DownloadOutlined />,
      onClick: () => {
        // Implement download logic
        message.info(t`Download feature coming soon`);
      },
    },
  ];

  const columns = [
    {
      title: t`Title`,
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Article) => (
        <div>
          <div style={{ fontWeight: '500', marginBottom: 4 }}>
            <a 
              onClick={() => handleEdit(record)}
              style={{ cursor: 'pointer', color: '#1890ff' }}
            >
              {text}
            </a>
            {record.isFeatured && (
              <Tag color="gold" style={{ marginLeft: 8 }}>
                {t`Featured`}
              </Tag>
            )}
            {record.isTrending && (
              <Tag color="volcano" style={{ marginLeft: 4 }}>
                {t`Trending`}
              </Tag>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.excerpt?.substring(0, 100) || t`No excerpt`}...
          </div>
          <div style={{ marginTop: 4 }}>
            <Tag color={record.category?.color || 'blue'}>
              {record.category?.name || t`Uncategorized`}
            </Tag>
            {record.accessType === 'PREMIUM' && (
              <Tag icon={<CrownOutlined />} color="purple">
                {t`Premium`}
              </Tag>
            )}
            {record.autoTranslate && (
              <Tooltip title={t`Auto-translation enabled`}>
                <Tag icon={<GlobalOutlined />} color="cyan">
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
          <Avatar size="small" src={author?.picture}>
            {author?.name?.charAt(0) || 'U'}
          </Avatar>
          <span>{author?.name || t`Unknown`}</span>
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
        return <Tag color={config.color}>{config.text}</Tag>;
      },
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
              <Tag color={hasTranslations ? 'blue' : 'default'}>
                {hasTranslations ? `${targetLanguages.length} langs` : 'Manual'}
              </Tag>
            </Tooltip>
            <Tooltip title={t`Manage Translations`}>
              <Button
                type="text"
                icon={<TranslationOutlined />}
                onClick={() => handleManageTranslations(record)}
                size="small"
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
        <Space direction="vertical" size="small" style={{ fontSize: '12px' }}>
          <div>
            👁️ {(record.viewCount || 0).toLocaleString()} {t`views`}
          </div>
          <div>
            ❤️ {record.likeCount || 0} {t`likes`} • 💬 {record.commentCount || 0} {t`comments`}
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
            />
          </Tooltip>
          <Tooltip title={t`Edit`}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
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
                {
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
                },
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
                      <span style={{ color: '#ff4d4f' }}>{t`Delete`}</span>
                    </Popconfirm>
                  ),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Input
                placeholder={t`Search articles...`}
                allowClear
                suffix={<SearchOutlined />}
                onChange={(e) => {
                  const value = e.target.value;
                  // Debounce search
                  const timer = setTimeout(() => {
                    setFilters(prev => ({ ...prev, search: value }));
                  }, 500);
                  return () => clearTimeout(timer);
                }}
                style={{ width: 300 }}
              />
              <Select
                placeholder={t`Status`}
                allowClear
                style={{ width: 120 }}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <Option value="DRAFT">{t`Draft`}</Option>
                <Option value="PUBLISHED">{t`Published`}</Option>
                <Option value="SCHEDULED">{t`Scheduled`}</Option>
                <Option value="ARCHIVED">{t`Archived`}</Option>
              </Select>
              <Select
                placeholder={t`Access Type`}
                allowClear
                style={{ width: 120 }}
                onChange={(value) => setFilters(prev => ({ ...prev, accessType: value }))}
              >
                <Option value="FREE">{t`Free`}</Option>
                <Option value="PREMIUM">{t`Premium`}</Option>
              </Select>
              <Button icon={<FilterOutlined />}>
                {t`More Filters`}
              </Button>
            </Space>
            <Space>
              <Button icon={<ExportOutlined />}>
                {t`Export`}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleNewArticle}
              >
                {t`New Article`}
              </Button>
            </Space>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={articles}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              t`${range[0]}-${range[1]} of ${total} articles`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Translation Management Drawer */}
      <Drawer
        title={
          <Space>
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
                // Regenerate all failed translations
                const failedTranslations = translations.filter(t => t.status === 'FAILED');
                if (failedTranslations.length > 0) {
                  failedTranslations.forEach(t => handleRegenerateTranslation(t.id));
                }
              }}
              disabled={!translations.some(t => t.status === 'FAILED')}
            >
              {t`Retry Failed`}
            </Button>
            <Button onClick={() => setTranslationDrawerVisible(false)}>
              {t`Close`}
            </Button>
          </Space>
        }
      >
        {translationLoading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <LoadingOutlined spin style={{ fontSize: 24 }} />
            <div>{t`Loading translations...`}</div>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <Card size="small" style={{ marginBottom: 20 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title={t`Total`}
                    value={translationStats.total}
                    prefix={<GlobalOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={t`Completed`}
                    value={translationStats.completed}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={t`Needs Review`}
                    value={translationStats.needsReview}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<WarningOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={t`Failed`}
                    value={translationStats.failed}
                    valueStyle={{ color: '#cf1322' }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Col>
              </Row>
            </Card>

         

            {/* Translations Table */}
            <Tabs defaultActiveKey="all">
              <TabPane tab={t`All Translations`} key="all">
                {translations.length === 0 ? (
                  <Empty
                    description={t`No translations available`}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    {selectedArticle?.autoTranslate ? (
                      <Button 
                        type="primary"
                        onClick={() => {
                          selectedArticle.targetLanguages?.forEach(lang => {
                            handleGenerateTranslation(lang);
                          });
                        }}
                      >
                        {t`Generate All Translations`}
                      </Button>
                    ) : (
                      <Alert
                        message={t`Auto-translation is disabled`}
                        description={t`Enable auto-translation in article settings to generate translations automatically.`}
                        type="info"
                        showIcon
                      />
                    )}
                  </Empty>
                ) : (
                  <List
                    dataSource={translations}
                    renderItem={(translation) => (
                      <List.Item
                        key={translation.id}
                        actions={[
                          <Dropdown
                            key="actions"
                            menu={{ items: getTranslationActions(translation) }}
                            trigger={['click']}
                          >
                            <Button type="text" icon={<MoreOutlined />} size="small" />
                          </Dropdown>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <div style={{ fontSize: '24px' }}>
                              {getLanguageFlag(translation.language)}
                            </div>
                          }
                          title={
                            <Space>
                              <Text strong>{translation.language.toUpperCase()}</Text>
                              {getStatusBadge(translation.status)}
                              {translation.translatedBy === 'HUMAN' && (
                                <Tag icon={<UserOutlined />} color="green">{t`Human`}</Tag>
                              )}
                              {translation.translatedBy === 'AI' && (
                                <Tag icon={<RobotOutlined />} color="blue">{t`AI`}</Tag>
                              )}
                            </Space>
                          }
                          description={
                            <Space direction="vertical" size={2} style={{ width: '100%' }}>
                              <div>
                                <Rate 
                                  disabled 
                                  value={translation.qualityScore} 
                                  count={5} 
                                  style={{ fontSize: 12 }}
                                />
                                {translation.confidence && (
                                  <Progress
                                    percent={Math.round(translation.confidence * 100)}
                                    size="small"
                                    style={{ width: 100, marginLeft: 8 }}
                                  />
                                )}
                              </div>
                              <div>
                                {translation.needsReview ? (
                                  <Badge status="warning" text={t`Needs Review`} />
                                ) : (
                                  <Badge status="success" text={t`Reviewed`} />
                                )}
                                <Text type="secondary" style={{ marginLeft: 8 }}>
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
                  />
                ) : (
                  <List
                    dataSource={translations.filter(t => t.needsReview)}
                    renderItem={(translation) => (
                      <List.Item
                        key={translation.id}
                        actions={[
                          <Button
                            key="approve"
                            type="primary"
                            icon={<CheckOutlined />}
                            onClick={() => handleMarkReviewed(translation.id)}
                            size="small"
                          >
                            {t`Approve`}
                          </Button>,
                          <Button
                            key="edit"
                            icon={<EditFilled />}
                            onClick={() => handleEditTranslation(translation)}
                            size="small"
                          >
                            {t`Open in Editor`}
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <div style={{ fontSize: '24px' }}>
                              {getLanguageFlag(translation.language)}
                            </div>
                          }
                          title={
                            <Space>
                              <Text strong>{translation.language.toUpperCase()}</Text>
                              {getStatusBadge(translation.status)}
                            </Space>
                          }
                          description={
                            <Space direction="vertical" size={4}>
                              <Text strong>{translation.translatedTitle || t`No title`}</Text>
                              {translation.translatedExcerpt && (
                                <Text type="secondary">{translation.translatedExcerpt}</Text>
                              )}
                              <div>
                                <Rate 
                                  disabled 
                                  value={translation.qualityScore} 
                                  count={5} 
                                  style={{ fontSize: 12 }}
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
                  />
                ) : (
                  <List
                    dataSource={translations.filter(t => t.status === 'FAILED')}
                    renderItem={(translation) => (
                      <List.Item
                        key={translation.id}
                        actions={[
                          <Button
                            key="retry"
                            type="primary"
                            icon={<SyncOutlined />}
                            onClick={() => handleRegenerateTranslation(translation.id)}
                            size="small"
                          >
                            {t`Retry`}
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <div style={{ fontSize: '24px' }}>
                              {getLanguageFlag(translation.language)}
                            </div>
                          }
                          title={<Text strong>{translation.language.toUpperCase()}</Text>}
                          description={
                            <Space direction="vertical" size={2}>
                              <Text type="secondary">
                                {t`Last attempt`}: {dayjs(translation.updatedAt).format('MMM D, YYYY h:mm A')}
                              </Text>
                              <Text type="danger">
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