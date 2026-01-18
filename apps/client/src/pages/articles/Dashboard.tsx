import { t, Trans } from "@lingui/macro";
import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Table, 
  Tag, 
  Space, 
  Button,
  Progress,
  Timeline,
  Select,
  DatePicker,
  Avatar,
  List,
  Alert,
  Spin,
  Breadcrumb
} from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  ShareAltOutlined,
  RiseOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EditOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import ArticleAdminNavbar from './admin/ArticleAdminSidebar';
import { getDashboardStats, getRecentArticles, getTopArticles } from '../../services/article.service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
const { RangePicker } = DatePicker;
const { Option } = Select;

interface DashboardStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  premiumArticles: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  monthlyGrowth: number;
  topCategories: Array<{ name: string; count: number; growth: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    user: string;
    target: string;
    time: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const [topArticles, setTopArticles] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, recentData, topData] = await Promise.all([
        getDashboardStats({ timeRange }),
        getRecentArticles(),
        getTopArticles(),
      ]);
      setStats(statsData);
      setRecentArticles(recentData);
      setTopArticles(topData);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      setError(error.message || t`Failed to load dashboard data`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function for navigation
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  // Helper function to open article in new tab
  const openArticle = (slug: string) => {
    window.open(`/article/${slug}`, '_blank');
  };

  const statCards = [
  {
    title: t`Total Articles`,
    value: stats?.totalArticles || 0,
    icon: <FileTextOutlined />,
    color: '#1890ff',
    trend: stats?.monthlyGrowth || 0,
  },
  {
    title: t`Published`,
    value: stats?.publishedArticles || 0,
    icon: <EyeOutlined />,
    color: '#52c41a',
    subtitle: `${stats?.publishedArticles || 0} / ${stats?.totalArticles || 0}`,
  },
  {
    title: t`Premium Articles`,
    value: stats?.premiumArticles || 0,
    icon: <RiseOutlined />,
    color: '#722ed1',
  },
  {
    title: t`Total Views`,
    value: stats?.totalViews ? stats.totalViews.toLocaleString() : '0',
    icon: <EyeOutlined />,
    color: '#fa8c16',
  },
  {
    title: t`Total Likes`,
    value: stats?.totalLikes ? stats.totalLikes.toLocaleString() : '0',
    icon: <LikeOutlined />,
    color: '#f5222d',
  },
  {
    title: t`Total Comments`,
    value: stats?.totalComments ? stats.totalComments.toLocaleString() : '0',
    icon: <MessageOutlined />,
    color: '#13c2c2',
  },
];

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip={t`Loading dashboard data...`} />
      </div>
    );
  }

  return (
    <div>
      {/* Article Admin Navbar */}
      <ArticleAdminNavbar 
        currentPath={window.location.pathname}
        title={t`Article Management`}
      />

      {/* Breadcrumb */}
      <Breadcrumb 
        style={{ marginBottom: 16 }}
        items={[
          { title: t`Dashboard`, onClick: () => navigateTo('/dashboard') },
          { title: t`Article Admin`, onClick: () => navigateTo('/dashboard/article-admin') },
          { title: t`Overview` },
        ]}
      />

      {error && (
        <Alert
          message={t`Error`}
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}
      
      {/* Time Range Selector */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 120 }}
              disabled={loading}
            >
              <Option value="7days">{t`Last 7 days`}</Option>
              <Option value="30days">{t`Last 30 days`}</Option>
              <Option value="90days">{t`Last 90 days`}</Option>
              <Option value="year">{t`This Year`}</Option>
            </Select>
            <RangePicker disabled={loading} />
          </Space>
          <Button 
            onClick={fetchDashboardData} 
            loading={loading}
            icon={<ReloadOutlined />}
          >
            {t`Refresh`}
          </Button>
        </div>
      </Card>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={8} xl={4} key={index}>
            <Card size="small" loading={loading}>
              <Statistic
                title={card.title}
                value={card.value}
                prefix={card.icon}
                valueStyle={{ color: card.color }}
                suffix={
                  card.trend !== undefined && (
                    <Tag color={card.trend > 0 ? 'success' : 'error'}>
                      {card.trend > 0 ? '+' : ''}{card.trend}%
                    </Tag>
                  )
                }
              />
              {card.subtitle && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>
                  {card.subtitle}
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* Recent Articles & Categories */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card 
            title={t`Recent Articles`} 
            extra={
              <Button 
                type="link" 
                onClick={() => navigateTo('/dashboard/article-admin/articles')}
              >
                {t`View All`}
              </Button>
            }
            loading={loading}
          >
            <Table
              dataSource={recentArticles}
              rowKey="id"
              pagination={false}
              size="small"
              loading={loading}
              columns={[
                {
                  title: t`Article`,
                  dataIndex: 'title',
                  render: (text, record) => (
                    <div>
                      <div style={{ fontWeight: '500' }}>{text}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {dayjs(record.publishedAt).fromNow()}
                      </div>
                    </div>
                  ),
                },
                {
                  title: t`Author`,
                  dataIndex: 'author',
                  width: 120,
                  render: (author) => (
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
                  width: 100,
                  render: (status) => (
                    <Tag color={
                      status === 'PUBLISHED' ? 'success' :
                      status === 'DRAFT' ? 'default' : 'processing'
                    }>
                      {status}
                    </Tag>
                  ),
                },
                {
                  title: t`Actions`,
                  width: 100,
                  render: (_, record) => (
                    <Button 
                      type="link" 
                      icon={<EditOutlined />}
                      onClick={() => navigateTo(`/dashboard/article-admin/articles/edit/${record.id}`)}
                      size="small"
                    >
                      {t`Edit`}
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={t`Top Categories`}
            extra={
              <Button 
                type="link" 
                onClick={() => navigateTo('/dashboard/article-admin/categories')}
              >
                {t`Manage`}
              </Button>
            }
            loading={loading}
          >
            <List
              dataSource={stats?.topCategories || []}
              loading={loading}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span style={{ fontWeight: '500' }}>{item.name}</span>
                        <Tag>{item.count} {t`articles`}</Tag>
                      </Space>
                    }
                    description={
                      <Progress
                        percent={Math.round((item.count / (stats?.totalArticles || 1)) * 100)}
                        size="small"
                        showInfo={false}
                      />
                    }
                  />
                  <Tag color={item.growth > 0 ? 'success' : 'error'}>
                    {item.growth > 0 ? '+' : ''}{item.growth}%
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Top Articles & Recent Activity */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card 
            title={t`Top Performing Articles`}
            extra={
              <Button 
                type="link" 
                onClick={() => navigateTo('/dashboard/article-admin/articles')}
              >
                {t`See More`}
              </Button>
            }
            loading={loading}
          >
            <List
              dataSource={topArticles}
              loading={loading}
              renderItem={(article, index) => (
                <List.Item
                  actions={[
                    <Button 
                      type="text" 
                      icon={<EyeOutlined />}
                      onClick={() => openArticle(article.slug)}
                    />,
                    <Button 
                      type="text" 
                      icon={<EditOutlined />}
                      onClick={() => navigateTo(`/dashboard/article-admin/articles/edit/${article.slug}`)}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar size="large" style={{ backgroundColor: '#1890ff' }}>
                        {index + 1}
                      </Avatar>
                    }
                    title={
                      <a 
                        href={`/article/${article.slug}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ fontWeight: 500 }}
                      >
                        {article.title}
                      </a>
                    }
                    description={
                      <Space size="small">
                        <span>👁️ {article.viewCount?.toLocaleString() || 0}</span>
                        <span>❤️ {article.likeCount || 0}</span>
                        <span>💬 {article.commentCount || 0}</span>
                        <span>↗️ {article.shareCount || 0}</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t`Recent Activity`} loading={loading}>
            <Timeline>
              {stats?.recentActivity?.map((activity) => (
                <Timeline.Item
                  key={activity.id}
                  dot={
                    activity.action === 'PUBLISH' ? <FileTextOutlined /> :
                    activity.action === 'UPDATE' ? <EditOutlined /> :
                    activity.action === 'COMMENT' ? <MessageOutlined /> :
                    <UserOutlined />
                  }
                  color={
                    activity.action === 'PUBLISH' ? 'green' :
                    activity.action === 'UPDATE' ? 'blue' :
                    activity.action === 'COMMENT' ? 'purple' : 'gray'
                  }
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>
                      {activity.user} {activity.action?.toLowerCase()}ed {activity.target}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {dayjs(activity.time).fromNow()}
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;