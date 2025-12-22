// pages/admin/TranslationManagement.tsx
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
  Dropdown
} from 'antd';
import { 
  SearchOutlined, 
  SyncOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TranslationOutlined,
  MoreOutlined,
  EditOutlined
} from '@ant-design/icons';
import { getTranslations, regenerateTranslation, updateTranslation } from '../../../services/article.service';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

interface Translation {
  id: string;
  article: {
    title: string;
    slug: string;
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
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    language: '',
    status: '',
    needsReview: false,
  });

  useEffect(() => {
    fetchTranslations();
  }, [filters]);

  const fetchTranslations = async () => {
  setLoading(true);
  try {
    const params: any = {};
    if (filters.language) params.language = filters.language;
    if (filters.status) params.status = filters.status;
    if (filters.needsReview) params.needsReview = true;

    // Call the service
    const result = await getTranslations(params);
    
    console.log('Translation data received:', result);
    
    // Handle response structure
    if (result && result.data) {
      // If data is nested inside a data property
      const translationsData = Array.isArray(result.data.data) ? result.data.data : result.data;
      
      const translations: Translation[] = translationsData.map((item: any) => ({
        id: item.id,
        article: {
          title: item.article?.title || 'Unknown Article',
          slug: item.article?.slug || '',
          id: item.article?.id || item.id,
        },
        language: item.language,
        status: item.status,
        confidence: item.confidence,
        needsReview: item.needsReview,
        qualityScore: item.qualityScore,
        lastAccessed: item.lastAccessed,
        accessCount: item.accessCount,
        translatedBy: item.translatedBy,
        createdAt: item.createdAt,
      }));
      
      setTranslations(translations);
    } else {
      console.warn('Unexpected response structure:', result);
      setTranslations([]);
    }
  } catch (error) {
    console.error('Failed to load translations:', error);
    message.error('Failed to load translations');
    setTranslations([]);
  } finally {
    setLoading(false);
  }
};

const handleRegenerate = async (translationId: string, language: string) => {
  Modal.confirm({
    title: 'Regenerate Translation',
    content: `Regenerate ${language.toUpperCase()} translation? This will replace the current translation.`,
    onOk: async () => {
      try {
        const result = await regenerateTranslation(translationId);
        
        if (result && result.success !== false) {
          message.success(result.message || 'Translation regeneration started');
          fetchTranslations();
        } else {
          message.error(result?.error || 'Failed to regenerate translation');
        }
      } catch (error: any) {
        console.error('Regenerate error:', error);
        message.error(error.response?.data?.message || 'Failed to regenerate translation');
      }
    },
  });
};

const handleReview = async (translationId: string) => {
  Modal.confirm({
    title: 'Mark as Reviewed',
    content: 'Mark this translation as reviewed?',
    onOk: async () => {
      try {
        const result = await updateTranslation(translationId, { needsReview: false });
        
        if (result) {
          message.success('Translation marked as reviewed');
          fetchTranslations();
        } else {
          message.error('Failed to update translation');
        }
      } catch (error: any) {
        console.error('Review error:', error);
        message.error(error.response?.data?.message || 'Failed to update translation');
      }
    },
  });
};

  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      fr: 'French',
      es: 'Spanish',
      de: 'German',
      pt: 'Portuguese',
      ar: 'Arabic',
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
    };
    return flags[code] || '🌐';
  };

  const columns = [
    {
      title: 'Article',
      dataIndex: 'article',
      key: 'article',
      render: (article: any) => (
        <div>
          <div style={{ fontWeight: '500' }}>
            <a href={`/article/${article.slug}`} target="_blank" rel="noopener noreferrer">
              {article.title}
            </a>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            /{article.slug}
          </div>
        </div>
      ),
    },
    {
      title: 'Language',
      dataIndex: 'language',
      key: 'language',
      width: 120,
      render: (language: string) => (
        <Space>
          <span style={{ fontSize: '20px' }}>{getLanguageFlag(language)}</span>
          <div>
            <div>{getLanguageName(language)}</div>
            <div style={{ fontSize: '11px', color: '#666' }}>{language.toUpperCase()}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string, record: Translation) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
          PENDING: { color: 'default', icon: <SyncOutlined spin />, text: 'Pending' },
          PROCESSING: { color: 'processing', icon: <SyncOutlined spin />, text: 'Processing' },
          COMPLETED: { color: 'success', icon: <CheckCircleOutlined />, text: 'Completed' },
          FAILED: { color: 'error', icon: <ExclamationCircleOutlined />, text: 'Failed' },
        };
        const config = statusConfig[status] || { color: 'default', icon: null, text: status };
        
        return (
          <Space>
            <Tag color={config.color} icon={config.icon}>
              {config.text}
            </Tag>
            {record.needsReview && (
              <Badge count="Review" style={{ backgroundColor: '#faad14' }} />
            )}
          </Space>
        );
      },
    },
    {
      title: 'Quality',
      key: 'quality',
      width: 150,
      render: (_: any, record: Translation) => {
        if (record.confidence) {
          return (
            <div>
              <Progress
                percent={Math.round(record.confidence * 100)}
                size="small"
                strokeColor={
                  record.confidence > 0.8 ? '#52c41a' :
                  record.confidence > 0.6 ? '#faad14' : '#f5222d'
                }
              />
              <div style={{ fontSize: '11px', color: '#666', marginTop: 2 }}>
                AI Confidence: {Math.round(record.confidence * 100)}%
                {record.qualityScore && ` • Score: ${record.qualityScore}/5`}
              </div>
            </div>
          );
        }
        return '-';
      },
    },
    {
      title: 'Metrics',
      key: 'metrics',
      width: 120,
      render: (_: any, record: Translation) => (
        <div style={{ fontSize: '12px' }}>
          <div>👁️ {record.accessCount} views</div>
          {record.lastAccessed && (
            <div>📅 {dayjs(record.lastAccessed).format('MMM D')}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'translatedBy',
      key: 'translatedBy',
      width: 100,
      render: (source: string) => (
        <Tag color={source === 'AI' ? 'blue' : 'green'}>
          {source}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: Translation) => (
        <Space>
          <Tooltip title="Preview">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => window.open(`/article/${record.article.slug}?lang=${record.language}`, '_blank')}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  icon: <EditOutlined />,
                  label: 'Edit Translation',
                },
                {
                  key: 'regenerate',
                  icon: <SyncOutlined />,
                  label: 'Regenerate',
                  onClick: () => handleRegenerate(record.id, record.language),
                },
                // Conditional item - check if needsReview is true
                ...(record.needsReview ? [{
                  key: 'review',
                  icon: <CheckCircleOutlined />,
                  label: 'Mark as Reviewed',
                  onClick: () => handleReview(record.id),
                }] : []),
                {
                  key: 'stats',
                  label: 'View Statistics',
                },
              ],
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <TranslationOutlined />
          <span>Translation Management</span>
          <Tag color="blue">{translations.length} translations</Tag>
        </Space>
      }
      extra={
        <Space>
          <Select
            placeholder="Language"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => setFilters(prev => ({ ...prev, language: value }))}
          >
            <Option value="fr">🇫🇷 French</Option>
            <Option value="es">🇪🇸 Spanish</Option>
            <Option value="de">🇩🇪 German</Option>
            <Option value="pt">🇵🇹 Portuguese</Option>
          </Select>
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <Option value="PENDING">Pending</Option>
            <Option value="PROCESSING">Processing</Option>
            <Option value="COMPLETED">Completed</Option>
            <Option value="FAILED">Failed</Option>
          </Select>
          <Button
            type={filters.needsReview ? 'primary' : 'default'}
            onClick={() => setFilters(prev => ({ ...prev, needsReview: !prev.needsReview }))}
          >
            Needs Review {filters.needsReview && `(${translations.filter(t => t.needsReview).length})`}
          </Button>
          <Search
            placeholder="Search translations..."
            onSearch={(value) => console.log(value)}
            style={{ width: 200 }}
          />
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={translations}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1200 }}
      />
    </Card>
  );
};

export default TranslationManagement;