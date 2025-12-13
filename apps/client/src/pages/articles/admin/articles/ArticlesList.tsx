// pages/admin/articles/ArticlesList.tsx - FIXED VERSION
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
  Popconfirm
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
  CrownOutlined
} from '@ant-design/icons';
import { getArticles, deleteArticle, updateArticleStatus } from '../../../../services/article.service';
import dayjs from 'dayjs';

const { Option } = Select;

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
      setArticles(data.articles);
      setPagination(prev => ({
        ...prev,
        total: data.total,
      }));
    } catch (error) {
      console.error('Failed to load articles:', error);
      message.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteArticle(id);
      message.success('Article deleted successfully');
      fetchArticles();
    } catch (error: any) {
      console.error('Delete error:', error);
      message.error(error.message || 'Failed to delete article');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateArticleStatus(id, { status });
      message.success('Status updated successfully');
      fetchArticles();
    } catch (error: any) {
      console.error('Status change error:', error);
      message.error(error.message || 'Failed to update status');
    }
  };

  const handleDuplicate = async (article: Article) => {
    Modal.confirm({
      title: 'Duplicate Article',
      content: `Create a copy of "${article.title}"?`,
      onOk: async () => {
        try {
          // API call to duplicate article
          message.success('Article duplicated successfully');
          fetchArticles();
        } catch (error) {
          message.error('Failed to duplicate article');
        }
      },
    });
  };

  const handleEdit = (article: Article) => {
    // Use the slug instead of ID
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

  const columns = [
    {
      title: 'Title',
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
                Featured
              </Tag>
            )}
            {record.isTrending && (
              <Tag color="volcano" style={{ marginLeft: 4 }}>
                Trending
              </Tag>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.excerpt?.substring(0, 100) || 'No excerpt'}...
          </div>
          <div style={{ marginTop: 4 }}>
            <Tag color={record.category?.color || 'blue'}>
              {record.category?.name || 'Uncategorized'}
            </Tag>
            {record.accessType === 'PREMIUM' && (
              <Tag icon={<CrownOutlined />} color="purple">
                Premium
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Author',
      dataIndex: 'author',
      key: 'author',
      width: 150,
      render: (author: any) => (
        <Space>
          <Avatar size="small" src={author?.picture}>
            {author?.name?.charAt(0) || 'U'}
          </Avatar>
          <span>{author?.name || 'Unknown'}</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
          DRAFT: { color: 'default', text: 'Draft' },
          PUBLISHED: { color: 'success', text: 'Published' },
          SCHEDULED: { color: 'processing', text: 'Scheduled' },
          ARCHIVED: { color: 'error', text: 'Archived' },
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Stats',
      key: 'stats',
      width: 200,
      render: (_: any, record: Article) => (
        <Space direction="vertical" size="small" style={{ fontSize: '12px' }}>
          <div>
            👁️ {(record.viewCount || 0).toLocaleString()} views
          </div>
          <div>
            ❤️ {record.likeCount || 0} likes • 💬 {record.commentCount || 0} comments
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
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: Article) => (
        <Space>
          <Tooltip title="Preview">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record.slug)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}  // ✅ FIXED: Pass the whole article
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'duplicate',
                  icon: <CopyOutlined />,
                  label: 'Duplicate',
                  onClick: () => handleDuplicate(record),
                },
                {
                  key: 'translate',
                  icon: <TranslationOutlined />,
                  label: 'Manage Translations',
                },
                {
                  key: 'status',
                  label: 'Change Status',
                  children: [
                    {
                      key: 'publish',
                      label: 'Publish',
                      disabled: record.status === 'PUBLISHED',
                      onClick: () => handleStatusChange(record.id, 'PUBLISHED'),
                    },
                    {
                      key: 'draft',
                      label: 'Move to Draft',
                      disabled: record.status === 'DRAFT',
                      onClick: () => handleStatusChange(record.id, 'DRAFT'),
                    },
                    {
                      key: 'archive',
                      label: 'Archive',
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
                      title="Delete Article"
                      description="Are you sure you want to delete this article?"
                      onConfirm={() => handleDelete(record.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <span style={{ color: '#ff4d4f' }}>Delete</span>
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
    <Card>
      <div style={{ marginBottom: 24 }}>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="Search articles..."
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
              placeholder="Status"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <Option value="DRAFT">Draft</Option>
              <Option value="PUBLISHED">Published</Option>
              <Option value="SCHEDULED">Scheduled</Option>
              <Option value="ARCHIVED">Archived</Option>
            </Select>
            <Select
              placeholder="Access Type"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => setFilters(prev => ({ ...prev, accessType: value }))}
            >
              <Option value="FREE">Free</Option>
              <Option value="PREMIUM">Premium</Option>
            </Select>
            <Button icon={<FilterOutlined />}>
              More Filters
            </Button>
          </Space>
          <Space>
            <Button icon={<ExportOutlined />}>
              Export
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleNewArticle}
            >
              New Article
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
            `${range[0]}-${range[1]} of ${total} articles`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />
    </Card>
  );
};

export default ArticlesList;