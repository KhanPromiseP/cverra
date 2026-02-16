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
  Breadcrumb,
  Tabs,
  Descriptions,
  Badge,
  Modal,
  Tooltip,
  theme
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
  ReloadOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  TeamOutlined,
  LineChartOutlined,
  DatabaseOutlined,
  SettingOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  HistoryOutlined,
  BankOutlined,
  SecurityScanOutlined,
  CloudOutlined
} from '@ant-design/icons';
import ArticleAdminNavbar from './admin/ArticleAdminSidebar';
import { 
  getDashboardStats, 
  getRecentArticles, 
 getTopArticles,
  getSystemStats,
  getAllUsers,
  getFinancialOverview,
  getAuditLogs 
} from '../../services/article.service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';

dayjs.extend(relativeTime);
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

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
  isAdminView?: boolean;
}

interface SystemStats {
  users: {
    total: number;
    admins: number;
    superAdmins: number;
    dailyActive: number;
    monthlyActive: number;
    growthRate: number;
  };
  content: {
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    premiumArticles: number;
    totalTranslations: number;
  };
  financial: {
    totalRevenue: number;
    activeSubscriptions: number;
    monthlyRecurringRevenue: number;
    averageTransactionValue: number;
    topEarningArticles: Array<any>;
  };
  engagement: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalSaves: number;
    averageEngagementRate: number;
  };
  system: {
    health: any;
    storage: any;
    performance: any;
    serverTime: string;
    uptime: number;
    memoryUsage: any;
  };
  recentActivity: {
    newUsers: Array<any>;
    newArticles: Array<any>;
    systemAlerts: Array<any>;
  };
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const [topArticles, setTopArticles] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [financialData, setFinancialData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [systemLoading, setSystemLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userRole, setUserRole] = useState<string>('ADMIN');
  const [showSystemStats, setShowSystemStats] = useState(false);

  useEffect(() => {
    // Check user role from localStorage or API
    const role = localStorage.getItem('userRole') || 'ADMIN';
    setUserRole(role);
    fetchDashboardData();
  }, [timeRange]);

  useEffect(() => {
    if (activeTab === 'system' && userRole === 'SUPER_ADMIN') {
      fetchSystemStats();
    } else if (activeTab === 'system' && userRole !== 'SUPER_ADMIN') {
      setActiveTab('overview');
    }
  }, [activeTab, userRole]);

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

  const fetchSystemStats = async () => {
    if (userRole !== 'SUPER_ADMIN') return;
    
    setSystemLoading(true);
    try {
      const [systemData, usersData, financialData, logsData] = await Promise.all([
        getSystemStats(),
        getAllUsers(1, 10),
        getFinancialOverview(),
        getAuditLogs(1, 10)
      ]);
      setSystemStats(systemData);
      setAllUsers(usersData?.users || []);
      setFinancialData(financialData);
      setAuditLogs(logsData?.logs || []);
    } catch (error: any) {
      console.error('Failed to load system stats:', error);
      setError(error.message || t`Failed to load system statistics`);
    } finally {
      setSystemLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    navigate(path);
  };

  const openArticle = (slug: string) => {
    window.open(`/article/${slug}`, '_blank');
  };

  // Stat cards with theme support
  const statCards = [
    {
      title: t`Total Articles`,
      value: stats?.totalArticles || 0,
      icon: <FileTextOutlined />,
      color: 'blue',
      trend: stats?.monthlyGrowth || 0,
      adminOnly: false,
    },
    {
      title: t`Published`,
      value: stats?.publishedArticles || 0,
      icon: <EyeOutlined />,
      color: 'green',
      subtitle: `${stats?.publishedArticles || 0} / ${stats?.totalArticles || 0}`,
      adminOnly: false,
    },
    {
      title: t`Premium Articles`,
      value: stats?.premiumArticles || 0,
      icon: <RiseOutlined />,
      color: 'purple',
      adminOnly: false,
    },
    {
      title: t`Total Views`,
      value: stats?.totalViews ? stats.totalViews.toLocaleString() : '0',
      icon: <EyeOutlined />,
      color: 'orange',
      adminOnly: false,
    },
    {
      title: t`Total Likes`,
      value: stats?.totalLikes ? stats.totalLikes.toLocaleString() : '0',
      icon: <LikeOutlined />,
      color: 'pink',
      adminOnly: false,
    },
    {
      title: t`Total Comments`,
      value: stats?.totalComments ? stats.totalComments.toLocaleString() : '0',
      icon: <MessageOutlined />,
      color: 'cyan',
      adminOnly: false,
    },
  ];

  const systemStatCards = [
    {
      title: t`Total Users`,
      value: systemStats?.users?.total || 0,
      icon: <TeamOutlined />,
      color: 'blue',
      trend: systemStats?.users?.growthRate || 0,
      superAdminOnly: true,
    },
    {
      title: t`Active Users`,
      value: systemStats?.users?.monthlyActive || 0,
      icon: <UserOutlined />,
      color: 'green',
      subtitle: `${systemStats?.users?.dailyActive || 0} daily active`,
      superAdminOnly: true,
    },
    {
      title: t`Monthly Revenue`,
      value: systemStats?.financial?.monthlyRecurringRevenue 
        ? `$${systemStats.financial.monthlyRecurringRevenue.toFixed(2)}` 
        : '$0',
      icon: <DollarOutlined />,
      color: 'purple',
      superAdminOnly: true,
    },
    {
      title: t`Engagement Rate`,
      value: systemStats?.engagement?.averageEngagementRate 
        ? `${systemStats.engagement.averageEngagementRate.toFixed(1)}%` 
        : '0%',
      icon: <LineChartOutlined />,
      color: 'orange',
      superAdminOnly: true,
    },
    {
      title: t`System Health`,
      value: systemStats?.system?.health?.status === 'HEALTHY' ? t`Healthy` : t`Issues`,
      icon: systemStats?.system?.health?.status === 'HEALTHY' 
        ? <CheckCircleOutlined /> 
        : <ExclamationCircleOutlined />,
      color: systemStats?.system?.health?.status === 'HEALTHY' ? 'green' : 'red',
      superAdminOnly: true,
    },
    {
      title: t`Server Uptime`,
      value: systemStats?.system?.uptime 
        ? `${(systemStats.system.uptime / 3600).toFixed(1)}h` 
        : '0h',
      icon: <ClockCircleOutlined />,
      color: 'cyan',
      superAdminOnly: true,
    },
  ];

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Spin size="large" tip={t`Loading dashboard data...`} />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6"
    >
      {/* Article Admin Navbar */}
      <ArticleAdminNavbar 
        currentPath={window.location.pathname}
        title={userRole === 'SUPER_ADMIN' ? t`Super Admin Dashboard` : t`Article Dashboard`}
      />

      {/* Breadcrumb */}
      <Breadcrumb 
        className="mb-6 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        items={[
          { 
            title: (
              <button 
                onClick={() => navigateTo('/dashboard')}
                className="cursor-pointer text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <DashboardOutlined /> {t`Dashboard`}
              </button>
            ) 
          },
          { 
            title: (
              <button 
                onClick={() => navigateTo('/dashboard/article-admin')}
                className="cursor-pointer text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {userRole === 'SUPER_ADMIN' ? t`Super Admin` : t`Article Admin`}
              </button>
            ) 
          },
          { 
            title: (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {t`Overview`}
              </span>
            ) 
          },
        ]}
      />

      {/* Role Indicator */}
      <Alert
        message={
          <Space>
            <span>
              {userRole === 'SUPER_ADMIN' 
                ? t`You are viewing system-wide statistics as Super Administrator`
                : t`You are viewing your own article statistics as Administrator`
              }
            </span>
            {userRole === 'SUPER_ADMIN' && (
              <Badge 
                count={t`Super Admin`} 
                className="bg-purple-600 font-bold"
              />
            )}
          </Space>
        }
        type={userRole === 'SUPER_ADMIN' ? 'warning' : 'info'}
        showIcon
        className="mb-6 rounded-lg border-none bg-blue-50 dark:bg-blue-900/20"
        icon={userRole === 'SUPER_ADMIN' ? <CrownOutlined /> : <SafetyCertificateOutlined />}
      />

      {error && (
        <Alert
          message={t`Error`}
          description={error}
          type="error"
          showIcon
          closable
          className="mb-6 rounded-lg border-none bg-red-50 dark:bg-red-900/20"
          onClose={() => setError(null)}
        />
      )}

      {/* Main Tabs */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="mb-6"
        items={[
          {
            key: 'overview',
            label: (
              <span className="flex items-center">
                <AppstoreOutlined />
                <span className="ml-2">{t`Overview`}</span>
              </span>
            ),
            children: null,
          },
          ...(userRole === 'SUPER_ADMIN' ? [{
            key: 'system',
            label: (
              <span className="flex items-center">
                <DatabaseOutlined />
                <span className="ml-2">{t`System`}</span>
                <Badge 
                  count="SUPER" 
                  size="small" 
                  className="ml-2 bg-purple-600 text-xs"
                />
              </span>
            ),
            children: null,
          }] : []),
        ]}
        tabBarStyle={{
          background: 'var(--ant-color-bg-container)',
          padding: '0 16px',
          borderRadius: '8px 8px 0 0',
          margin: 0,
          border: '1px solid var(--ant-color-border)',
          borderBottom: 'none'
        }}
      />

      {activeTab === 'overview' ? (
        <>
          {/* Time Range Selector */}
          <motion.div variants={itemVariants}>
            <Card 
              className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
              bodyStyle={{ padding: '16px 24px' }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Space className="flex-wrap">
                  <Select
                    value={timeRange}
                    onChange={setTimeRange}
                    className="w-[140px]"
                    size="middle"
                    suffixIcon={<ClockCircleOutlined />}
                    disabled={loading}
                  >
                    <Option value="7days">{t`Last 7 days`}</Option>
                    <Option value="30days">{t`Last 30 days`}</Option>
                    <Option value="90days">{t`Last 90 days`}</Option>
                    <Option value="year">{t`This Year`}</Option>
                  </Select>
                  <RangePicker disabled={loading} />
                </Space>
                <div className="flex items-center gap-2">
                  {userRole === 'SUPER_ADMIN' && (
                    <Tooltip title={t`System Management`}>
                      <Button 
                        onClick={() => setShowSystemStats(true)}
                        icon={<SettingOutlined />}
                        type="primary"
                        ghost
                      >
                        {t`System`}
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip title={t`Refresh data`}>
                    <Button 
                      onClick={fetchDashboardData} 
                      loading={loading}
                      icon={<ReloadOutlined />}
                      type="primary"
                    >
                      {t`Refresh`}
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Stats Cards Grid */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6"
          >
            {statCards.map((card, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                  loading={loading}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {card.title}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                        {card.value}
                      </div>
                      {card.subtitle && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {card.subtitle}
                        </div>
                      )}
                    </div>
                    
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                      ${card.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                        card.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        card.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                        card.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                        card.color === 'pink' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' :
                        'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'}
                    `}>
                      {card.icon}
                    </div>
                  </div>
                  
                  {card.trend !== undefined && (
                    <div className="mt-4">
                      <div className="flex items-center gap-1">
                        {card.trend > 0 ? (
                          <ArrowUpOutlined className="text-green-500 text-xs" />
                        ) : (
                          <ArrowDownOutlined className="text-red-500 text-xs" />
                        )}
                        <span className={`
                          text-sm font-semibold
                          ${card.trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
                        `}>
                          {card.trend > 0 ? '+' : ''}{card.trend}%
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                          {t`this month`}
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Recent Articles & Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Recent Articles - 2 columns */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card 
                title={
                  <div className="flex items-center gap-2">
                    <FileTextOutlined />
                    <span className="text-lg font-semibold">{t`Recent Articles`}</span>
                  </div>
                }
                extra={
                  <Button 
                    type="link" 
                    onClick={() => navigateTo('/dashboard/article-admin/articles')}
                    size="small"
                    className="text-blue-600 dark:text-blue-400"
                  >
                    {t`View All`}
                  </Button>
                }
                loading={loading}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                bodyStyle={{ padding: 0 }}
              >
                <Table
                  dataSource={recentArticles}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                  loading={loading}
                  scroll={{ x: 600 }}
                  className="rounded-lg overflow-hidden"
                  columns={[
                    {
                      title: t`Article`,
                      dataIndex: 'title',
                      width: 300,
                      render: (text, record) => (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            {record.thumbnail ? (
                              <img 
                                src={record.thumbnail} 
                                alt={text}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                {text?.charAt(0) || 'A'}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {text}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <ClockCircleOutlined />
                              {dayjs(record.publishedAt).fromNow()}
                            </div>
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: t`Author`,
                      dataIndex: 'author',
                      width: 150,
                      render: (author) => (
                        <div className="flex items-center gap-2">
                          <Avatar 
                            size="small" 
                            src={author?.picture}
                            className="bg-blue-500"
                          >
                            {author?.name?.charAt(0) || 'U'}
                          </Avatar>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {author?.name || t`Unknown`}
                          </span>
                        </div>
                      ),
                    },
                    {
                      title: t`Status`,
                      dataIndex: 'status',
                      width: 100,
                      render: (status) => (
                        <Tag 
                          color={
                            status === 'PUBLISHED' ? 'success' :
                            status === 'DRAFT' ? 'default' : 'processing'
                          }
                          className="rounded-md px-2 py-0.5 font-medium"
                        >
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
                          className="text-blue-600 dark:text-blue-400"
                        >
                          {t`Edit`}
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            </motion.div>

            {/* Top Categories */}
            <motion.div variants={itemVariants}>
              <Card 
                title={
                  <div className="flex items-center gap-2">
                    <BarChartOutlined />
                    <span className="text-lg font-semibold">{t`Top Categories`}</span>
                  </div>
                }
                extra={
                  <Button 
                    type="link" 
                    onClick={() => navigateTo('/dashboard/article-admin/categories')}
                    size="small"
                    className="text-blue-600 dark:text-blue-400"
                  >
                    {t`Manage`}
                  </Button>
                }
                loading={loading}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                bodyStyle={{ padding: '16px 0' }}
              >
                <List
                  dataSource={stats?.topCategories || []}
                  loading={loading}
                  size="small"
                  className="divide-y divide-gray-200 dark:divide-gray-700"
                  renderItem={(item, index) => (
                    <List.Item className="px-6 py-3">
                      <div className="w-full">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <Tag className="rounded-md px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700">
                              {item.count} {t`articles`}
                            </Tag>
                            <Tag 
                              color={item.growth > 0 ? 'success' : 'error'}
                              className="rounded-md px-2 py-0.5 text-xs font-medium min-w-[48px] text-center"
                            >
                              {item.growth > 0 ? '+' : ''}{item.growth}%
                            </Tag>
                          </div>
                        </div>
                        <Progress
                          percent={Math.round((item.count / (stats?.totalArticles || 1)) * 100)}
                          size="small"
                          showInfo={false}
                          strokeColor="#1890ff"
                          trailColor="#e2e8f0"
                          className="dark:[&_.ant-progress-bg]:bg-blue-500 dark:[&_.ant-progress-trail]:bg-gray-700"
                        />
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </motion.div>
          </div>

          {/* Top Articles & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Articles */}
            <motion.div variants={itemVariants}>
              <Card 
                title={
                  <div className="flex items-center gap-2">
                    <RiseOutlined />
                    <span className="text-lg font-semibold">{t`Top Performing Articles`}</span>
                  </div>
                }
                extra={
                  <Button 
                    type="link" 
                    onClick={() => navigateTo('/dashboard/article-admin/articles')}
                    size="small"
                    className="text-blue-600 dark:text-blue-400"
                  >
                    {t`See More`}
                  </Button>
                }
                loading={loading}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <List
                  dataSource={topArticles}
                  loading={loading}
                  className="divide-y divide-gray-200 dark:divide-gray-700"
                  renderItem={(article, index) => (
                    <List.Item
                      className="py-3"
                      actions={[
                        <Tooltip title={t`View article`} key="view">
                          <Button 
                            type="text" 
                            icon={<EyeOutlined />}
                            onClick={() => openArticle(article.slug)}
                            size="small"
                            className="text-gray-600 dark:text-gray-400"
                          />
                        </Tooltip>,
                        <Tooltip title={t`Edit article`} key="edit">
                          <Button 
                            type="text" 
                            icon={<EditOutlined />}
                            onClick={() => navigateTo(`/dashboard/article-admin/articles/edit/${article.slug}`)}
                            size="small"
                            className="text-blue-600 dark:text-blue-400"
                          />
                        </Tooltip>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            size="large" 
                            className="bg-blue-500 font-bold text-white"
                          >
                            {index + 1}
                          </Avatar>
                        }
                        title={
                          <a 
                            href={`/article/${article.slug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                          >
                            {article.title}
                          </a>
                        }
                        description={
                          <Space size="small" className="mt-1">
                            <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <EyeOutlined className="text-xs" />
                              {article.viewCount?.toLocaleString() || 0}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <LikeOutlined className="text-xs" />
                              {article.likeCount || 0}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <MessageOutlined className="text-xs" />
                              {article.commentCount || 0}
                            </span>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={itemVariants}>
              <Card 
                title={
                  <div className="flex items-center gap-2">
                    <HistoryOutlined />
                    <span className="text-lg font-semibold">{t`Recent Activity`}</span>
                  </div>
                }
                loading={loading}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <Timeline
                  className="ml-2"
                  items={stats?.recentActivity?.map((activity) => ({
                    color: activity.action === 'PUBLISH' ? 'green' :
                           activity.action === 'UPDATE' ? 'blue' :
                           activity.action === 'COMMENT' ? 'cyan' : 'magenta',
                    children: (
                      <div className="ml-2">
                        <div className="font-medium text-gray-900 dark:text-white mb-1">
                          {activity.user} {activity.action?.toLowerCase()}ed {activity.target}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <ClockCircleOutlined />
                          {dayjs(activity.time).fromNow()}
                        </div>
                      </div>
                    ),
                  }))}
                />
              </Card>
            </motion.div>
          </div>
        </>
      ) : (
        /* SYSTEM STATS TAB - SUPER_ADMIN ONLY */
        <div>
          {!userRole || userRole !== 'SUPER_ADMIN' ? (
            <Alert
              message={t`Access Denied`}
              description={t`You need SUPER_ADMIN privileges to access system statistics.`}
              type="error"
              showIcon
              className="mb-6"
            />
          ) : systemLoading ? (
            <div className="flex justify-center items-center min-h-[200px] rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Spin size="large" tip={t`Loading system statistics...`} />
            </div>
          ) : systemStats ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* System Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {systemStatCards.map((card, index) => (
                  card.superAdminOnly && userRole === 'SUPER_ADMIN' ? (
                    <motion.div key={index} variants={itemVariants}>
                      <Card className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                        <Statistic
                          title={
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                              {card.title}
                            </div>
                          }
                          value={card.value}
                          prefix={card.icon}
                          valueStyle={{ 
                            color: `var(--ant-color-${card.color}-6)`,
                            fontSize: '1.75rem',
                            fontWeight: 700
                          }}
                          suffix={
                            card.trend !== undefined && card.trend !== 0 && (
                              <Tag color={card.trend > 0 ? 'success' : 'error'} className="ml-2">
                                {card.trend > 0 ? '+' : ''}{card.trend}%
                              </Tag>
                            )
                          }
                        />
                        {card.subtitle && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {card.subtitle}
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  ) : null
                ))}
              </div>

              {/* Detailed System Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <motion.div variants={itemVariants}>
                  <Card 
                    title={
                      <div className="flex items-center gap-2">
                        <SecurityScanOutlined />
                        <span>{t`System Health`}</span>
                      </div>
                    }
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
                    <Descriptions 
                      column={1} 
                      size="middle"
                      labelStyle={{ 
                        fontWeight: 500,
                        color: 'var(--ant-color-text-secondary)',
                        width: 150
                      }}
                      contentStyle={{ 
                        fontWeight: 500,
                        color: 'var(--ant-color-text)'
                      }}
                    >
                      <Descriptions.Item label={t`Status`}>
                        <Badge 
                          status={systemStats.system.health.status === 'HEALTHY' ? 'success' : 'error'} 
                          text={
                            <span className={
                              systemStats.system.health.status === 'HEALTHY' 
                                ? 'text-green-600 dark:text-green-400 font-semibold'
                                : 'text-red-600 dark:text-red-400 font-semibold'
                            }>
                              {systemStats.system.health.status}
                            </span>
                          }
                        />
                      </Descriptions.Item>
                      <Descriptions.Item label={t`Database`}>
                        {systemStats.system.health.database?.status || 'UNKNOWN'}
                      </Descriptions.Item>
                      <Descriptions.Item label={t`Storage`}>
                        {systemStats.system.storage.total} {systemStats.system.storage.unit}
                      </Descriptions.Item>
                      <Descriptions.Item label={t`Memory Usage`}>
                        {Math.round(systemStats.system.memoryUsage.heapUsed / 1024 / 1024)}MB / {Math.round(systemStats.system.memoryUsage.heapTotal / 1024 / 1024)}MB
                      </Descriptions.Item>
                      <Descriptions.Item label={t`Uptime`}>
                        {(systemStats.system.uptime / 3600).toFixed(1)} hours
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card 
                    title={
                      <div className="flex items-center gap-2">
                        <BankOutlined />
                        <span>{t`Financial Overview`}</span>
                      </div>
                    }
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
                    <Descriptions 
                      column={1} 
                      size="middle"
                      labelStyle={{ 
                        fontWeight: 500,
                        color: 'var(--ant-color-text-secondary)',
                        width: 150
                      }}
                      contentStyle={{ 
                        fontWeight: 500,
                        color: 'var(--ant-color-text)'
                      }}
                    >
                      <Descriptions.Item label={t`Total Revenue`}>
                        ${systemStats.financial.totalRevenue.toFixed(2)}
                      </Descriptions.Item>
                      <Descriptions.Item label={t`Active Subscriptions`}>
                        {systemStats.financial.activeSubscriptions}
                      </Descriptions.Item>
                      <Descriptions.Item label={t`Monthly Recurring Revenue`}>
                        ${systemStats.financial.monthlyRecurringRevenue.toFixed(2)}
                      </Descriptions.Item>
                      <Descriptions.Item label={t`Average Transaction`}>
                        ${systemStats.financial.averageTransactionValue.toFixed(2)}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </motion.div>
              </div>

              {/* Users and Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                  <Card 
                    title={t`Recent Users`}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
                    <List
                      dataSource={allUsers.slice(0, 5)}
                      className="divide-y divide-gray-200 dark:divide-gray-700"
                      renderItem={(user) => (
                        <List.Item className="py-3">
                          <List.Item.Meta
                            avatar={
                              <Avatar src={user.picture} className="bg-blue-500">
                                {user.name?.charAt(0) || 'U'}
                              </Avatar>
                            }
                            title={
                              <span className="font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </span>
                            }
                            description={
                              <Space>
                                <Tag className="bg-gray-100 dark:bg-gray-700">
                                  {user.role}
                                </Tag>
                                <span className="text-gray-500 dark:text-gray-400">
                                  {dayjs(user.createdAt).fromNow()}
                                </span>
                              </Space>
                            }
                          />
                          <Button 
                            type="link" 
                            onClick={() => navigateTo(`/dashboard/article-admin/users/${user.id}`)}
                            className="text-blue-600 dark:text-blue-400"
                          >
                            {t`View`}
                          </Button>
                        </List.Item>
                      )}
                    />
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card 
                    title={t`Recent Audit Logs`}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
                    <List
                      dataSource={auditLogs.slice(0, 5)}
                      className="divide-y divide-gray-200 dark:divide-gray-700"
                      renderItem={(log) => (
                        <List.Item className="py-3">
                          <List.Item.Meta
                            title={
                              <span className="font-medium text-gray-900 dark:text-white">
                                {log.action}
                              </span>
                            }
                            description={
                              <div className="space-y-1">
                                <span className="block text-gray-600 dark:text-gray-300">
                                  {log.user?.name}
                                </span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400">
                                  {dayjs(log.createdAt).fromNow()}
                                </span>
                              </div>
                            }
                          />
                          <Tag color={
                            log.severity === 'ERROR' ? 'error' :
                            log.severity === 'WARNING' ? 'warning' : 'default'
                          } className="rounded-md">
                            {log.severity}
                          </Tag>
                        </List.Item>
                      )}
                    />
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <Alert
              message={t`No Data Available`}
              description={t`System statistics could not be loaded. Please try again.`}
              type="warning"
              showIcon
              className="mb-6"
            />
          )}
        </div>
      )}

      {/* System Settings Modal */}
      {showSystemStats && userRole === 'SUPER_ADMIN' && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              <DatabaseOutlined />
              <span>{t`System Management`}</span>
              <Badge count="SUPER" className="ml-2 bg-purple-600" />
            </div>
          }
          open={showSystemStats}
          onCancel={() => setShowSystemStats(false)}
          width={800}
          footer={null}
          className="[&_.ant-modal-body]:bg-white dark:[&_.ant-modal-body]:bg-gray-800 [&_.ant-modal-body]:rounded-lg"
        >
          <Tabs
            defaultActiveKey="users"
            className="bg-white dark:bg-gray-800"
          >
            <TabPane tab={t`Users`} key="users">
              <Button 
                type="primary" 
                onClick={() => navigateTo('/dashboard/article-admin/users')}
                className="mb-4"
              >
                {t`Manage All Users`}
              </Button>
              <Table
                dataSource={allUsers}
                columns={[
                  { 
                    title: t`Name`, 
                    dataIndex: 'name',
                    render: (text) => (
                      <span className="font-medium text-gray-900 dark:text-white">
                        {text}
                      </span>
                    )
                  },
                  { title: t`Email`, dataIndex: 'email' },
                  { title: t`Role`, dataIndex: 'role', render: (role) => (
                    <Tag color={role === 'SUPER_ADMIN' ? 'purple' : role === 'ADMIN' ? 'blue' : 'default'}>
                      {role}
                    </Tag>
                  )},
                  { title: t`Joined`, dataIndex: 'createdAt', render: (date) => dayjs(date).format('YYYY-MM-DD') },
                ]}
                pagination={false}
                className="rounded-lg overflow-hidden"
              />
            </TabPane>
            <TabPane tab={t`Financial`} key="financial">
              {financialData && (
                <Descriptions column={1} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <Descriptions.Item label={t`Total Revenue`} className="pb-3">
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ${financialData.summary.totalRevenue.toFixed(2)}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label={t`Monthly Revenue`} className="pb-3">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      ${financialData.summary.monthlyRevenue.toFixed(2)}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label={t`Subscription Revenue`}>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      ${financialData.breakdown.bySource.subscriptions.toFixed(2)}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              )}
            </TabPane>
            <TabPane tab={t`Audit Logs`} key="audit">
              <Button 
                type="primary" 
                onClick={() => navigateTo('/dashboard/article-admin/audit-logs')}
                className="mb-4"
              >
                {t`View All Audit Logs`}
              </Button>
              <Table
                dataSource={auditLogs}
                columns={[
                  { title: t`Action`, dataIndex: 'action' },
                  { title: t`User`, dataIndex: ['user', 'name'] },
                  { title: t`Severity`, dataIndex: 'severity', render: (severity) => (
                    <Tag color={severity === 'ERROR' ? 'error' : severity === 'WARNING' ? 'warning' : 'default'}>
                      {severity}
                    </Tag>
                  )},
                  { title: t`Time`, dataIndex: 'createdAt', render: (date) => dayjs(date).fromNow() },
                ]}
                pagination={false}
                className="rounded-lg overflow-hidden"
              />
            </TabPane>
          </Tabs>
        </Modal>
      )}
    </motion.div>
  );
};

export default Dashboard;