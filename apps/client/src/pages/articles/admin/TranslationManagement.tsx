import { t, Trans } from "@lingui/macro";
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Tag, 
  Space, 
  Button, 
  Input, 
  Select, 
  Progress,
  Modal,
  message,
  Badge,
  Tooltip,
  Dropdown,
  Typography
} from 'antd';
import { 
  SearchOutlined, 
  SyncOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TranslationOutlined,
  MoreOutlined,
  EditOutlined,
  UserOutlined,
  CrownOutlined,
  RobotOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { getTranslations, regenerateTranslation, updateTranslation } from '../../../services/article.service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNavigate } from 'react-router';
import ArticleAdminNavbar from './ArticleAdminSidebar';

dayjs.extend(relativeTime);

const { Option } = Select;
const { Search } = Input;
const { Text } = Typography;

interface Translation {
  id: string;
  article: {
    title: string;
    slug: string;
    id: string;
    authorId?: string;
  };
  language: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  confidence?: number;
  needsReview: boolean;
  qualityScore?: number;
  lastAccessed?: string;
  accessCount: number;
  translatedBy: 'AI' | 'HUMAN';
  createdAt: string;
}

const TranslationManagement: React.FC = () => {
  const navigate = useNavigate();
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [filteredTranslations, setFilteredTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    language: '',
    status: '',
    needsReview: false,
    search: '',
  });
  const [userRole, setUserRole] = useState<string>('ADMIN');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    // Get user role and ID from localStorage or auth context
    const role = localStorage.getItem('userRole') || 'ADMIN';
    const userId = localStorage.getItem('userId') || '';
    setUserRole(role);
    setCurrentUserId(userId);
    fetchTranslations();
  }, [filters.language, filters.status, filters.needsReview]);

  useEffect(() => {
    // Apply search filter and role-based filtering
    let result = [...translations];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(translation => 
        translation.article.title.toLowerCase().includes(searchLower) ||
        translation.language.toLowerCase().includes(searchLower) ||
        translation.translatedBy.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply role-based filtering (only for ADMIN)
    if (userRole === 'ADMIN') {
      result = result.filter(translation => 
        translation.article.authorId === currentUserId
      );
    }
    
    setFilteredTranslations(result);
  }, [translations, filters.search, userRole, currentUserId]);

  const fetchTranslations = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.language) params.language = filters.language;
      if (filters.status) params.status = filters.status;
      if (filters.needsReview) params.needsReview = true;
      
      // If admin, fetch all and we'll filter client-side by authorId
      const result = await getTranslations(params);
      
      console.log('Translation data received:', result);
      
      if (result && result.data) {
        const translationsData = Array.isArray(result.data.data) ? result.data.data : result.data;
        
        const fetchedTranslations: Translation[] = translationsData.map((item: any) => ({
          id: item.id,
          article: {
            title: item.article?.title || t`Unknown Article`,
            slug: item.article?.slug || '',
            id: item.article?.id || '',
            authorId: item.article?.author?.id || item.authorId || '',
          },
          language: item.language,
          status: item.status,
          confidence: item.confidence,
          needsReview: item.needsReview,
          qualityScore: item.qualityScore,
          lastAccessed: item.lastAccessed,
          accessCount: item.accessCount || 0,
          translatedBy: item.translatedBy || 'AI',
          createdAt: item.createdAt,
        }));
        
        setTranslations(fetchedTranslations);
      } else {
        console.warn('Unexpected response structure:', result);
        setTranslations([]);
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
      message.error(t`Failed to load translations`);
      setTranslations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (translationId: string, language: string) => {
    Modal.confirm({
      title: t`Regenerate Translation`,
      content: t`Regenerate ${language.toUpperCase()} translation? This will replace the current translation.`,
      onOk: async () => {
        try {
          const result = await regenerateTranslation(translationId);
          
          if (result && result.success !== false) {
            message.success(result.message || t`Translation regeneration started`);
            fetchTranslations();
          } else {
            message.error(result?.error || t`Failed to regenerate translation`);
          }
        } catch (error: any) {
          console.error('Regenerate error:', error);
          message.error(error.response?.data?.message || t`Failed to regenerate translation`);
        }
      },
    });
  };

  const handleReview = async (translationId: string) => {
    Modal.confirm({
      title: t`Mark as Reviewed`,
      content: t`Mark this translation as reviewed?`,
      onOk: async () => {
        try {
          const result = await updateTranslation(translationId, { needsReview: false });
          
          if (result) {
            message.success(t`Translation marked as reviewed`);
            fetchTranslations();
          } else {
            message.error(t`Failed to update translation`);
          }
        } catch (error: any) {
          console.error('Review error:', error);
          message.error(error.response?.data?.message || t`Failed to update translation`);
        }
      },
    });
  };

  const handleEditTranslation = (translation: Translation) => {
    const params = new URLSearchParams({
      translationId: translation.id,
      language: translation.language,
      step: '4'
    });
    navigate(`/dashboard/article-admin/articles/edit/${translation.article.slug}?${params.toString()}`);
  };

  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      fr: t`French`,
      es: t`Spanish`,
      de: t`German`,
      pt: t`Portuguese`,
      ar: t`Arabic`,
      en: t`English`,
      zh: t`Chinese`,
      ja: t`Japanese`,
      ru: t`Russian`,
      it: t`Italian`,
    };
    return languages[code] || code.toUpperCase();
  };

  const getLanguageFlag = (code: string) => {
    const flags: Record<string, string> = {
      fr: '🇫🇷',
      es: '🇪🇸',
      de: '🇩🇪',
      pt: '🇵🇹',
      ar: '🇸🇦',
      en: '🇺🇸',
      zh: '🇨🇳',
      ja: '🇯🇵',
      ru: '🇷🇺',
      it: '🇮🇹',
    };
    return flags[code] || '🌐';
  };

  const columns = [
    {
      title: t`Article`,
      dataIndex: 'article',
      key: 'article',
      render: (article: any) => (
        <div className="dark:text-gray-100">
          <div className="font-medium mb-1">
            <a 
              href={`/dashboard/article/${article.slug}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              {article.title}
            </a>
          </div>
          <Text type="secondary" className="text-xs dark:text-gray-400">
            /{article.slug}
          </Text>
        </div>
      ),
    },
    {
      title: t`Language`,
      dataIndex: 'language',
      key: 'language',
      width: 120,
      render: (language: string) => (
        <Space className="dark:text-gray-300">
          <span className="text-xl">{getLanguageFlag(language)}</span>
          <div>
            <div className="font-medium">{getLanguageName(language)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{language.toUpperCase()}</div>
          </div>
        </Space>
      ),
    },
    {
      title: t`Status`,
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string, record: Translation) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
          PENDING: { color: 'default', icon: <SyncOutlined spin />, text: t`Pending` },
          PROCESSING: { color: 'processing', icon: <SyncOutlined spin />, text: t`Processing` },
          COMPLETED: { color: 'success', icon: <CheckCircleOutlined />, text: t`Completed` },
          FAILED: { color: 'error', icon: <ExclamationCircleOutlined />, text: t`Failed` },
        };
        const config = statusConfig[status] || { color: 'default', icon: null, text: status };
        
        return (
          <Space>
            <Tag 
              color={config.color} 
              icon={config.icon}
              className={`
                ${config.color === 'success' ? 'dark:bg-green-900 dark:text-green-200 dark:border-green-700' : ''}
                ${config.color === 'error' ? 'dark:bg-red-900 dark:text-red-200 dark:border-red-700' : ''}
                ${config.color === 'processing' ? 'dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700' : ''}
                ${config.color === 'default' ? 'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600' : ''}
              `}
            >
              {config.text}
            </Tag>
            {record.needsReview && (
              <Badge 
                count={t`Review`} 
                style={{ backgroundColor: '#faad14' }}
                className="dark:bg-yellow-600 dark:text-yellow-100"
              />
            )}
          </Space>
        );
      },
    },
    {
      title: t`Quality`,
      key: 'quality',
      width: 180,
      render: (_: any, record: Translation) => {
        if (record.confidence) {
          return (
            <div className="dark:text-gray-300">
              <Progress
                percent={Math.round(record.confidence * 100)}
                size="small"
                strokeColor={
                  record.confidence > 0.8 ? '#52c41a' :
                  record.confidence > 0.6 ? '#faad14' : '#f5222d'
                }
                className="dark:[&_.ant-progress-bg]:bg-opacity-80"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t`AI Confidence: ${Math.round(record.confidence * 100)}%`}
                {record.qualityScore && ` • ${t`Score: ${record.qualityScore}/5`}`}
              </div>
            </div>
          );
        }
        return <span className="text-gray-400 dark:text-gray-500">-</span>;
      },
    },
    {
      title: t`Metrics`,
      key: 'metrics',
      width: 120,
      render: (_: any, record: Translation) => (
        <div className="text-sm dark:text-gray-300">
          <div className="flex items-center gap-1">
            <EyeOutlined className="text-gray-500 dark:text-gray-400" />
            <span>{record.accessCount || 0} {t`views`}</span>
          </div>
          {record.lastAccessed && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              📅 {dayjs(record.lastAccessed).fromNow()}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t`Source`,
      dataIndex: 'translatedBy',
      key: 'translatedBy',
      width: 100,
      render: (source: string) => (
        <Tag 
          color={source === 'AI' ? 'blue' : 'green'}
          className={`
            ${source === 'AI' ? 'dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700' : ''}
            ${source === 'HUMAN' ? 'dark:bg-green-900 dark:text-green-200 dark:border-green-700' : ''}
          `}
        >
          {source === 'AI' ? <RobotOutlined className="mr-1" /> : <UserOutlined className="mr-1" />}
          {source}
        </Tag>
      ),
    },
    {
      title: t`Created`,
      key: 'created',
      width: 120,
      render: (_: any, record: Translation) => (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {dayjs(record.createdAt).format('MMM D, YYYY')}
        </div>
      ),
    },
    {
      title: t`Actions`,
      key: 'actions',
      width: 120,
      render: (_: any, record: Translation) => (
        <Space>
          <Tooltip title={t`Preview`}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/dashboard/article/${record.article.slug}?lang=${record.language}`)}
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  icon: <EditOutlined />,
                  label: t`Edit Translation`,
                  onClick: () => handleEditTranslation(record),
                },
                {
                  key: 'regenerate',
                  icon: <SyncOutlined />,
                  label: t`Regenerate`,
                  onClick: () => handleRegenerate(record.id, record.language),
                  disabled: record.status === 'PROCESSING',
                },
                ...(record.needsReview ? [{
                  key: 'review',
                  icon: <CheckCircleOutlined />,
                  label: t`Mark as Reviewed`,
                  onClick: () => handleReview(record.id),
                }] : []),
              ],
            }}
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

  const needsReviewCount = translations.filter(t => t.needsReview).length;

return (
  <div>
    {/* Article Admin Navbar */}
    <ArticleAdminNavbar 
      currentPath={window.location.pathname}
      title={userRole === 'SUPER_ADMIN' ? t`Super Admin Dashboard` : t`Article Dashboard`}
    />
    {/* Custom Header */}
    <Card className="mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col gap-4">
        {/* Title Row */}
        <div className="flex items-center justify-between">
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
                bg-gray-200
                dark:bg-gray-600
              "
            >
              Back
            </Button>
            <TranslationOutlined />
            <span className="font-medium">{t`Translation Management`}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Tag color="blue" className="dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
              {filteredTranslations.length} {t`translations`}
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
          <Select
            placeholder={t`Language`}
            allowClear
            className="w-full dark:[&_.ant-select-selector]:bg-gray-700 dark:[&_.ant-select-selector]:border-gray-600 dark:[&_.ant-select-selection-item]:text-white"
            onChange={(value) => setFilters(prev => ({ ...prev, language: value }))}
            dropdownClassName="dark:bg-gray-800 dark:border-gray-700"
          >
            <Option value="fr">🇫🇷 {t`French`}</Option>
            <Option value="es">🇪🇸 {t`Spanish`}</Option>
            <Option value="de">🇩🇪 {t`German`}</Option>
            <Option value="pt">🇵🇹 {t`Portuguese`}</Option>
            <Option value="ar">🇸🇦 {t`Arabic`}</Option>
          </Select>
          
          <Select
            placeholder={t`Status`}
            allowClear
            className="w-full dark:[&_.ant-select-selector]:bg-gray-700 dark:[&_.ant-select-selector]:border-gray-600 dark:[&_.ant-select-selection-item]:text-white"
            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            dropdownClassName="dark:bg-gray-800 dark:border-gray-700"
          >
            <Option value="PENDING">{t`Pending`}</Option>
            <Option value="PROCESSING">{t`Processing`}</Option>
            <Option value="COMPLETED">{t`Completed`}</Option>
            <Option value="FAILED">{t`Failed`}</Option>
          </Select>
          
          <Search
            placeholder={t`Search translations...`}
            onSearch={(value) => setFilters(prev => ({ ...prev, search: value }))}
            className="w-full dark:[&_.ant-input]:bg-gray-700 dark:[&_.ant-input]:border-gray-600 dark:[&_.ant-input]:text-white"
            allowClear
          />
          
          <div className="flex gap-2">
            <Button
              type={filters.needsReview ? 'primary' : 'default'}
              onClick={() => setFilters(prev => ({ ...prev, needsReview: !prev.needsReview }))}
              className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
              icon={filters.needsReview ? <CheckCircleOutlined /> : null}
            >
              {t`Review`}
              {filters.needsReview && needsReviewCount > 0 && (
                <Badge count={needsReviewCount} size="small" className="ml-1" />
              )}
            </Button>
            
            <Tooltip title={t`Refresh`}>
              <Button
                icon={<SyncOutlined />}
                onClick={fetchTranslations}
                className="dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
              />
            </Tooltip>
          </div>
        </div>
      </div>
    </Card>

    {/* Table Card */}
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <Table
        columns={columns}
        dataSource={filteredTranslations}
        rowKey="id"
        loading={loading}
        pagination={{ 
          pageSize: 20,
          className: "dark:[&_.ant-pagination-item]:bg-gray-800 dark:[&_.ant-pagination-item]:border-gray-600 dark:[&_.ant-pagination-item_a]:text-gray-300",
          responsive: true,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => t`${range[0]}-${range[1]} of ${total} translations`
        }}
        scroll={{ x: 'max-content' }}
        className="
          [&_.ant-table-thead]:bg-gray-50 
          dark:[&_.ant-table-thead]:bg-gray-800 
          [&_.ant-table-cell]:dark:bg-gray-800 
          [&_.ant-table-cell]:dark:text-gray-200
          [&_.ant-table-tbody_>_tr:hover]:dark:bg-gray-700
          [&_.ant-table-tbody_>_tr:hover_.ant-table-cell]:dark:bg-gray-700
        "
      />
    </Card>
  </div>
);
};

export default TranslationManagement;