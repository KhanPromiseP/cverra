import { t, Trans } from "@lingui/macro";
import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout,
  Card,
  List,
  Typography,
  Space,
  Button,
  Avatar,
  Tag,
  Divider,
  Spin,
  Empty,
  Tabs,
  Badge,
  Switch,
  Modal,
  Pagination,
  DatePicker,
  Select,
  Input,
  Row,
  Col,
  Drawer,
  App,
  ConfigProvider,
  theme
} from 'antd';
import {
  BellOutlined,
  CommentOutlined,
  HeartOutlined,
  UserAddOutlined,
  CrownOutlined,
  TrophyOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  DeleteOutlined,
  CheckOutlined,
  FilterOutlined,
  ExportOutlined,
  ReloadOutlined,
  StarOutlined,
  FireOutlined,
  BookOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  getNotificationStats,
  type Notification as ApiNotification
} from '../services/notificationApi';
import { NotificationContent } from '../components/NotificationContent';

import { toast } from 'sonner';



import { convertToFrontendNotification, type FrontendNotification } from '../types/notifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isBetween from 'dayjs/plugin/isBetween'; 

dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);
dayjs.extend(isBetween);

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

// Helper function for date sorting
const sortByDate = (a: any, b: any, field: 'createdAt' = 'createdAt') => {
  const dateA = new Date(a[field]).getTime();
  const dateB = new Date(b[field]).getTime();
  return dateB - dateA; // Descending (newest first)
};

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<FrontendNotification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<FrontendNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [notificationTypes, setNotificationTypes] = useState<string[]>([]);
  const [readStatus, setReadStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [totalUnread, setTotalUnread] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());


  const navigate = useNavigate();
  // const { notification: antNotification } = App.useApp();
  const { token } = theme.useToken();

  // Detect dark mode from document
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  // Colors based on theme
  const colors = {
    background: isDarkMode ? '#141414' : '#ffffff',
    border: isDarkMode ? '#303030' : '#f0f0f0',
    text: isDarkMode ? '#ffffffd9' : '#000000',
    textSecondary: isDarkMode ? '#ffffffa6' : '#666666',
    hoverBg: isDarkMode ? '#ffffff14' : '#fafafa',
    cardBg: isDarkMode ? '#1f1f1f' : '#ffffff',
    headerBg: isDarkMode ? '#141414' : '#ffffff',
    unreadBg: isDarkMode ? '#1890ff1a' : '#f0f9ff',
  };

  const notificationTypeOptions = [
    { value: 'like', label: t`Likes`, color: '#ff4d4f', icon: <HeartOutlined /> },
    { value: 'comment', label: t`Comments`, color: '#1890ff', icon: <CommentOutlined /> },
    { value: 'reply', label: t`Replies`, color: '#52c41a', icon: <CommentOutlined /> },
    { value: 'follow', label: t`Follows`, color: '#fa8c16', icon: <UserAddOutlined /> },
    { value: 'achievement', label: t`Achievements`, color: '#faad14', icon: <TrophyOutlined /> },
    { value: 'premium', label: t`Premium`, color: '#722ed1', icon: <CrownOutlined /> },
    { value: 'system', label: t`System`, color: '#666666', icon: <MessageOutlined /> },
    { value: 'digest', label: t`Digests`, color: '#13c2c2', icon: <BookOutlined /> },
    { value: 'reading_milestone', label: t`Milestones`, color: '#f5222d', icon: <FireOutlined /> },
    { value: 'recommendation', label: t`Recommendations`, color: '#eb2f96', icon: <StarOutlined /> },
  ];

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [notifications, searchQuery, dateRange, notificationTypes, readStatus, sortBy, activeTab]);

  // fetchAllData error handling:
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchNotifications(),
        fetchStats(),
        fetchSettings()
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error(t`Failed to load notifications`, {
        description: t`Please try again later`,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (pageNum: number = 1) => {
  try {
    const params: any = {
      page: pageNum,
      limit: 100,
    };

    if (activeTab === 'unread') {
      params.unreadOnly = true;
    }

    const data = await getNotifications(params);
    
    // API returns { success: true, data: { notifications: [...] } }
    const apiData = data;
    const apiNotifications = Array.isArray(apiData?.notifications) 
      ? apiData.notifications 
      : (Array.isArray(data) ? data : []);
    
    const converted = apiNotifications.map(convertToFrontendNotification);
    setNotifications(converted);
    setTotalNotifications(apiData?.total || converted.length || 0);
    setTotalUnread(apiData?.unreadCount || 0);
    setPage(pageNum);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    throw error;
  }
};

  const fetchStats = async () => {
    try {
      const data = await getNotificationStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await getNotificationSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const applyFilters = useCallback(() => {
  let filtered = [...notifications];

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(notif =>
      (notif.title?.toLowerCase() || '').includes(query) ||
      (notif.message?.toLowerCase() || '').includes(query) ||
      (notif.actor?.name?.toLowerCase() || '').includes(query) ||
      (notif.target?.title?.toLowerCase() || '').includes(query)
    );
  }

  // Apply date range filter with safe date handling
  if (dateRange && dateRange[0] && dateRange[1]) {
    const [start, end] = dateRange;
    filtered = filtered.filter(notif => {
      try {
        const date = dayjs(notif.createdAt);
        return date.isValid() && date.isBetween(start, end, 'day', '[]');
      } catch (error) {
        console.error('Error filtering by date:', error);
        return false;
      }
    });
  }

  // Apply type filter
  if (notificationTypes.length > 0) {
    filtered = filtered.filter(notif =>
      notificationTypes.includes(notif.type)
    );
  }

  // Apply read status filter
  if (readStatus !== 'all') {
    filtered = filtered.filter(notif =>
      readStatus === 'read' ? notif.read : !notif.read
    );
  }

  // Apply active tab filter
  if (activeTab === 'unread') {
    filtered = filtered.filter(notif => !notif.read);
  } else if (activeTab === 'mentions') {
    filtered = filtered.filter(notif =>
      ['comment', 'reply', 'reading_milestone'].includes(notif.type)
    );
  }

  // Apply sorting with safe date handling
  if (sortBy === 'newest') {
    filtered.sort((a, b) => {
      try {
        const dateA = dayjs(a.createdAt);
        const dateB = dayjs(b.createdAt);
        if (!dateA.isValid()) return 1;
        if (!dateB.isValid()) return -1;
        return dateB.valueOf() - dateA.valueOf();
      } catch (error) {
        return 0;
      }
    });
  } else if (sortBy === 'oldest') {
    filtered.sort((a, b) => {
      try {
        const dateA = dayjs(a.createdAt);
        const dateB = dayjs(b.createdAt);
        if (!dateA.isValid()) return 1;
        if (!dateB.isValid()) return -1;
        return dateA.valueOf() - dateB.valueOf();
      } catch (error) {
        return 0;
      }
    });
  } else if (sortBy === 'type') {
    filtered.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
  }

  setFilteredNotifications(filtered);
}, [notifications, searchQuery, dateRange, notificationTypes, readStatus, sortBy, activeTab]);

  
// handleMarkAsRead:
const handleMarkAsRead = async (id: string) => {
  try {
    await markAsRead(id);
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setSelectedNotifications(prev => prev.filter(selectedId => selectedId !== id));
    toast.success(t`Marked as read`, {
      duration: 2000,
    });
  } catch (error) {
    console.error('Failed to mark as read:', error);
    toast.error(t`Failed to mark as read`);
  }
};

// toggling
const toggleNotificationExpand = (id: string) => {
  setExpandedNotifications(prev => {
    const newSet = new Set(prev);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    return newSet;
  });
};


// handleMarkAllAsRead:
const handleMarkAllAsRead = async () => {
  try {
    await markAllAsRead();
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setTotalUnread(0);
    toast.success(t`All notifications marked as read`, {
      duration: 2000,
    });
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    toast.error(t`Failed to mark all as read`);
  }
};

// handleDelete:
const handleDelete = async (id: string) => {
  try {
    await deleteNotification(id);
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    setSelectedNotifications(prev => prev.filter(selectedId => selectedId !== id));
    toast.success(t`Notification deleted`, {
      duration: 2000,
    });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    toast.error(t`Failed to delete notification`);
  }
};

// handleBulkMarkAsRead:
const handleBulkMarkAsRead = async () => {
  if (selectedNotifications.length === 0) return;
  
  setBulkActionLoading(true);
  try {
    await Promise.all(
      selectedNotifications.map(id => markAsRead(id))
    );
    setNotifications(prev =>
      prev.map(notif =>
        selectedNotifications.includes(notif.id) ? { ...notif, read: true } : notif
      )
    );
    setSelectedNotifications([]);
    toast.success(t`${selectedNotifications.length} notifications marked as read`, {
      duration: 2000,
    });
  } catch (error) {
    console.error('Failed to bulk mark as read:', error);
    toast.error(t`Failed to mark notifications as read`);
  } finally {
    setBulkActionLoading(false);
  }
};

// handleBulkDelete:
const handleBulkDelete = async () => {
  if (selectedNotifications.length === 0) return;
  
  setBulkActionLoading(true);
  try {
    await Promise.all(
      selectedNotifications.map(id => deleteNotification(id))
    );
    setNotifications(prev =>
      prev.filter(notif => !selectedNotifications.includes(notif.id))
    );
    setSelectedNotifications([]);
    toast.success(t`${selectedNotifications.length} notifications deleted`, {
      duration: 2000,
    });
  } catch (error) {
    console.error('Failed to bulk delete:', error);
    toast.error(t`Failed to delete notifications`);
  } finally {
    setBulkActionLoading(false);
  }
};

// handleClearAll:
const handleClearAll = async () => {
  try {
    await clearAllNotifications();
    setNotifications([]);
    setFilteredNotifications([]);
    setTotalNotifications(0);
    setTotalUnread(0);
    setSelectedNotifications([]);
    setClearModalVisible(false);
    toast.success(t`All notifications cleared`, {
      duration: 2000,
    });
  } catch (error) {
    console.error('Failed to clear all:', error);
    toast.error(t`Failed to clear notifications`);
  }
};

// handleNotificationClick:
const handleNotificationClick = (notification: FrontendNotification) => {
  console.log('Notification clicked:', notification);

  if (!notification.read) {
    handleMarkAsRead(notification.id);
  }

  try {
    if (notification.target) {
      console.log('Target data:', notification.target);
      
      switch (notification.target.type) {
        case 'article':
          if (notification.target.slug) {
            navigate(`/dashboard/article/${notification.target.slug}`);
          } else if (notification.target.id) {
            navigate(`/dashboard/article/${notification.target.id}`);
          } else {
            console.warn('Article notification missing slug and id');
            toast.info(notification.title, {
              description: notification.message,
              duration: 3000,
            });
          }
          break;
          
        case 'comment':
          if (notification.target.slug && notification.target.id) {
            navigate(`/dashboard/article/${notification.target.slug}#comment-${notification.target.id}`);
          } else if (notification.target.slug) {
            navigate(`/dashboard/article/${notification.target.slug}`);
          } else {
            console.warn('Comment notification missing required data');
          }
          break;
          
        case 'user':
          if (notification.target.id) {
            navigate(`/dashboard/profile/${notification.target.id}`);
          } else if (notification.actor?.id) {
            navigate(`/dashboard/profile/${notification.actor.id}`);
          } else {
            console.warn('User notification missing user ID');
          }
          break;
          
        // Add welcome notification targets
        case 'dashboard':
          navigate('/dashboard');
          break;
          
        case 'wallet':
          navigate('/dashboard/wallet');
          break;
          
        case 'features':
          navigate('/dashboard/features');
          break;
          
        case 'guide':
          navigate('/dashboard/guide/getting-started');
          break;
          
        case 'welcome':
          navigate('/dashboard/welcome');
          break;
          
        default:
          console.log('No navigation for notification type:', notification.target.type);
          toast.info(notification.title, {
            description: notification.message,
            duration: 3000,
          });
      }
    } else {
      console.log('Notification has no target - showing details');
      toast.info(notification.title || t`Notification`, {
        description: notification.message,
        duration: 3000,
      });
    }
  } catch (error) {
    console.error('Navigation failed:', error);
    toast.error(t`Could not open notification`, {
      description: t`Please try again`,
    });
  }
};


  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(notif => notif.id));
    }
  };

  const handleSelectNotification = (id: string) => {
    setSelectedNotifications(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const getNotificationIcon = (type: string) => {
    const option = notificationTypeOptions.find(opt => opt.value === type);
    return option?.icon || <BellOutlined />;
  };

  const getNotificationColor = (type: string) => {
    const option = notificationTypeOptions.find(opt => opt.value === type);
    return option?.color || '#666666';
  };

  const getNotificationLabel = (type: string) => {
    const option = notificationTypeOptions.find(opt => opt.value === type);
    return option?.label || t`Notification`;
  };

  const formatDate = (dateString: string) => {
  if (!dateString) return t`Unknown date`;
  
  try {
    const date = dayjs(dateString);
    if (!date.isValid()) {
      // Try to parse as ISO string or timestamp
      const parsedDate = dayjs(new Date(dateString));
      if (!parsedDate.isValid()) return t`Invalid date`;
      
      if (parsedDate.isSame(dayjs(), 'day')) {
        return t`Today, ${parsedDate.format('h:mm A')}`;
      } else if (parsedDate.isSame(dayjs().subtract(1, 'day'), 'day')) {
        return t`Yesterday, ${parsedDate.format('h:mm A')}`;
      } else if (parsedDate.isSame(dayjs(), 'year')) {
        return parsedDate.format('MMM D, h:mm A');
      }
      return parsedDate.format('MMM D, YYYY, h:mm A');
    }
    
    if (date.isSame(dayjs(), 'day')) {
      return t`Today, ${date.format('h:mm A')}`;
    } else if (date.isSame(dayjs().subtract(1, 'day'), 'day')) {
      return t`Yesterday, ${date.format('h:mm A')}`;
    } else if (date.isSame(dayjs(), 'year')) {
      return date.format('MMM D, h:mm A');
    }
    return date.format('MMM D, YYYY, h:mm A');
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return t`Invalid date`;
  }
};

  const groupNotificationsByDate = () => {
    const groups: { [key: string]: FrontendNotification[] } = {};
    
    filteredNotifications.forEach(notif => {
      if (!notif.createdAt) return;
      
      try {
        const date = dayjs(notif.createdAt);
        if (!date.isValid()) return;
        
        let key: string;
        
        if (date.isSame(dayjs(), 'day')) {
          key = t`Today`;
        } else if (date.isSame(dayjs().subtract(1, 'day'), 'day')) {
          key = t`Yesterday`;
        } else if (date.isSame(dayjs(), 'week')) {
          key = t`This Week`;
        } else if (date.isSame(dayjs(), 'month')) {
          key = t`This Month`;
        } else {
          key = date.format('MMMM YYYY');
        }
        
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(notif);
      } catch (error) {
        console.error('Error grouping notification by date:', error);
      }
    });
    
    return groups;
  };

  const handleExport = async () => {
    if (filteredNotifications.length === 0) return;
    
    setExportLoading(true);
    try {
      // Create CSV content
      const headers = [t`Date`, t`Type`, t`Title`, t`Message`, t`From`, t`Status`, t`Read At`];
      const rows = filteredNotifications.map(notif => {
        const date = notif.createdAt ? dayjs(notif.createdAt).format('YYYY-MM-DD HH:mm:ss') : '';
        return [
          date,
          getNotificationLabel(notif.type),
          notif.title || '',
          notif.message || '',
          notif.actor?.name || t`System`,
          notif.read ? t`Read` : t`Unread`,
          notif.read ? date : ''
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', t`notifications_${dayjs().format('YYYY-MM-DD')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

       toast.success(t`Notifications exported successfully`, {
      duration: 2000,
    });
  } catch (error) {
    console.error('Failed to export:', error);
    toast.error(t`Failed to export notifications`);
  } finally {
    setExportLoading(false);
  }
};

  // updateSetting:
const updateSetting = async (key: string, value: boolean | string) => {
  if (!settings) return;
  
  try {
    const updatedSettings = { ...settings, [key]: value };
    await updateNotificationSettings({ [key]: value });
    setSettings(updatedSettings);
    toast.success(t`Settings updated`, {
      duration: 2000,
    });
  } catch (error) {
    console.error('Failed to update setting:', error);
    toast.error(t`Failed to update setting`);
  }
};

  const renderNotificationItem = (notification: FrontendNotification) => {
  const isExpanded = expandedNotifications.has(notification.id);
  
    return (
      <List.Item
        style={{
          padding: '16px',
          margin: '8px 0',
          backgroundColor: notification.read ? colors.cardBg : colors.unreadBg,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
        }}
        className={`notification-item ${!notification.read ? 'notification-unread' : ''}`}
        onClick={() => handleNotificationClick(notification)}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div className="flex items-start w-full">
          {/* Checkbox for selection */}
          <div className="mr-3 mt-1">
            <input
              type="checkbox"
              checked={selectedNotifications.includes(notification.id)}
              onChange={(e) => {
                e.stopPropagation();
                handleSelectNotification(notification.id);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 cursor-pointer"
            />
          </div>

        {/* Notification content */}
        <div className="flex-1 min-w-0">
          <div className="space-y-3 w-full">
            {/* Header with type and date */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getNotificationColor(notification.type) }}
                />
                <Tag
                  color={isDarkMode ? 'default' : 'blue'}
                  icon={getNotificationIcon(notification.type)}
                  className="m-0 border-none"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : `${getNotificationColor(notification.type)}20`,
                    color: getNotificationColor(notification.type),
                  }}
                >
                  {getNotificationLabel(notification.type)}
                </Tag>
                {!notification.read && (
                  <Badge
                    dot
                    color="#1890ff"
                    className="ml-1"
                  />
                )}
              </div>
              <Text type="secondary" className="text-xs">
                <ClockCircleOutlined /> {formatDate(notification.createdAt)}
              </Text>
            </div>

            {/* Use NotificationContent component here */}
            <NotificationContent 
                notification={notification}
                isDarkMode={isDarkMode}
                isExpanded={isExpanded}
                onToggleExpand={(e) => {
                  e?.stopPropagation();
                  toggleNotificationExpand(notification.id);
                }}
                isPreview={false}
              />

            {/* Actor and target info */}
            {(notification.actor || notification.target) && (
              <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-gray-200 dark:border-gray-700">
                {notification.actor && (
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={notification.actor.picture}
                      size="small"
                      style={{ border: `2px solid ${getNotificationColor(notification.type)}` }}
                    >
                      {notification.actor.name?.charAt(0) || 'U'}
                    </Avatar>
                    <Text type="secondary" className="text-sm">
                      {notification.actor.name}
                    </Text>
                  </div>
                )}

                {notification.target && (
                  <>
                    {notification.actor && (
                      <Divider type="vertical" style={{ margin: 0, height: 16 }} />
                    )}
                    <div className="flex items-center gap-2">
                      <Text type="secondary" className="text-sm">
                        {notification.target.type === 'article' && '📄'}
                        {notification.target.type === 'comment' && '💬'}
                        {notification.target.type === 'user' && '👤'}
                        {notification.target.type === 'dashboard' && '🏠'}
                        {notification.target.type === 'wallet' && '💰'}
                        {notification.target.type === 'features' && '✨'}
                        {notification.target.type === 'guide' && '📚'}
                        {notification.target.type === 'welcome' && '🎉'}
                      </Text>
                      <Text
                        type="secondary"
                        className="text-sm truncate max-w-[200px]"
                        title={notification.target.title || notification.target.id}
                      >
                        {notification.target.title || notification.target.id}
                      </Text>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 mt-2">
              {!notification.read && (
                <Button
                  size="small"
                  type="text"
                  icon={<CheckOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsRead(notification.id);
                  }}
                  style={{ color: token.colorPrimary }}
                >
                  {t`Mark read`}
                </Button>
              )}
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(notification.id);
                }}
              >
                {t`Delete`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </List.Item>
  );
};

  const renderSettingsDrawer = () => (
    <Drawer
      title={t`Notification Settings`}
      placement="right"
      onClose={() => setShowSettingsDrawer(false)}
      open={showSettingsDrawer}
      width={400}
      styles={{
        body: { backgroundColor: colors.cardBg, color: colors.text },
        header: { backgroundColor: colors.cardBg, borderBottom: `1px solid ${colors.border}` },
        mask: { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.45)' }
      }}
    >
      {settings ? (
        <div className="space-y-6">
          <div>
            <Title level={5} style={{ color: colors.text }}>{t`Email Notifications`}</Title>
            <div className="space-y-4 mt-4">
              {[
                { key: 'emailArticleLikes', label: t`Article Likes` },
                { key: 'emailArticleComments', label: t`Article Comments` },
                { key: 'emailCommentReplies', label: t`Comment Replies` },
                { key: 'emailAchievements', label: t`Achievements` },
                { key: 'emailRecommendations', label: t`Recommendations` },
                { key: 'emailSystemAnnouncements', label: t`System Announcements` },
              ].map(({ key, label }) => (
                <div key={key} className="flex justify-between items-center">
                  <Text style={{ color: colors.text }}>{label}</Text>
                  <Switch
                    checked={settings[key]}
                    onChange={(checked) => updateSetting(key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Divider style={{ borderColor: colors.border }} />

          <div>
            <Title level={5} style={{ color: colors.text }}>{t`Reading Digest`}</Title>
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <Text style={{ color: colors.text }}>{t`Email Reading Digest`}</Text>
                <Switch
                  checked={settings.emailReadingDigest}
                  onChange={(checked) => updateSetting('emailReadingDigest', checked)}
                />
              </div>
              <div>
                <Text style={{ display: 'block', marginBottom: 8, color: colors.text }}>
                  {t`Digest Frequency`}
                </Text>
                <Select
                  value={settings.digestFrequency}
                  onChange={(value) => updateSetting('digestFrequency', value)}
                  className="w-full"
                  style={{ backgroundColor: colors.cardBg }}
                >
                  <Option value="NEVER">{t`Never`}</Option>
                  <Option value="DAILY">{t`Daily`}</Option>
                  <Option value="WEEKLY">{t`Weekly`}</Option>
                  <Option value="MONTHLY">{t`Monthly`}</Option>
                </Select>
              </div>
            </div>
          </div>

          <Divider style={{ borderColor: colors.border }} />

          <div>
            <Title level={5} style={{ color: colors.text }}>{t`Quiet Hours`}</Title>
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <Text style={{ color: colors.text }}>{t`Start Hour`}</Text>
                <Select
                  value={settings.quietStartHour}
                  onChange={(value) => updateSetting('quietStartHour', value)}
                  className="w-[100px]"
                  style={{ backgroundColor: colors.cardBg }}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <Option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00
                    </Option>
                  ))}
                </Select>
              </div>
              <div className="flex justify-between items-center">
                <Text style={{ color: colors.text }}>{t`End Hour`}</Text>
                <Select
                  value={settings.quietEndHour}
                  onChange={(value) => updateSetting('quietEndHour', value)}
                  className="w-[100px]"
                  style={{ backgroundColor: colors.cardBg }}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <Option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00
                    </Option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      )}
    </Drawer>
  );

  const renderFiltersDrawer = () => (
    <Drawer
      title={t`Filter Notifications`}
      placement="right"
      onClose={() => setShowFiltersDrawer(false)}
      open={showFiltersDrawer}
      width={400}
      styles={{
        body: { backgroundColor: colors.cardBg },
        header: { backgroundColor: colors.cardBg, borderBottom: `1px solid ${colors.border}` },
        mask: { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.45)' }
      }}
    >
      <div className="space-y-6">
        <div>
          <Text strong className="block mb-2" style={{ color: colors.text }}>
            {t`Search`}
          </Text>
          <Search
            placeholder={t`Search notifications...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={applyFilters}
            allowClear
            style={{ backgroundColor: colors.cardBg }}
          />
        </div>

        <div>
          <Text strong className="block mb-2" style={{ color: colors.text }}>
            {t`Date Range`}
          </Text>
          <RangePicker
            className="w-full"
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            format="MMM D, YYYY"
          />
        </div>

        <div>
          <Text strong className="block mb-2" style={{ color: colors.text }}>
            {t`Notification Types`}
          </Text>
          <Select
            mode="multiple"
            placeholder={t`Select types`}
            value={notificationTypes}
            onChange={setNotificationTypes}
            className="w-full"
            allowClear
            style={{ backgroundColor: colors.cardBg }}
          >
            {notificationTypeOptions.map(option => (
              <Option key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <span style={{ color: option.color }}>{option.icon}</span>
                  <span style={{ color: colors.text }}>{option.label}</span>
                </div>
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <Text strong className="block mb-2" style={{ color: colors.text }}>
            {t`Read Status`}
          </Text>
          <Select
            value={readStatus}
            onChange={setReadStatus}
            className="w-full"
            style={{ backgroundColor: colors.cardBg }}
          >
            <Option value="all">{t`All`}</Option>
            <Option value="unread">{t`Unread Only`}</Option>
            <Option value="read">{t`Read Only`}</Option>
          </Select>
        </div>

        <div>
          <Text strong className="block mb-2" style={{ color: colors.text }}>
            {t`Sort By`}
          </Text>
          <Select
            value={sortBy}
            onChange={setSortBy}
            className="w-full"
            style={{ backgroundColor: colors.cardBg }}
          >
            <Option value="newest">{t`Newest First`}</Option>
            <Option value="oldest">{t`Oldest First`}</Option>
            <Option value="type">{t`By Type`}</Option>
          </Select>
        </div>

        <div>
          <Button
            type="primary"
            icon={<FilterOutlined />}
            onClick={applyFilters}
            className="w-full"
          >
            {t`Apply Filters`}
          </Button>
          <Button
            type="text"
            icon={<ClearOutlined />}
            onClick={() => {
              setSearchQuery('');
              setDateRange(null);
              setNotificationTypes([]);
              setReadStatus('all');
              setSortBy('newest');
            }}
            className="w-full mt-2"
          >
            {t`Clear All Filters`}
          </Button>
        </div>
      </div>
    </Drawer>
  );

  if (loading && notifications.length === 0) {
    return (
      <Layout style={{ minHeight: '100vh', backgroundColor: colors.background }}>
        <Content className="flex justify-center items-center p-6">
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  const notificationGroups = groupNotificationsByDate();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          colorBgContainer: colors.cardBg,
          colorBgElevated: colors.headerBg,
          colorBorder: colors.border,
          colorText: colors.text,
          colorTextSecondary: colors.textSecondary,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', backgroundColor: colors.background }}>
        <Header className="px-6" style={{ 
          backgroundColor: colors.headerBg,
          borderBottom: `1px solid ${colors.border}`,
          height: 64,
          lineHeight: '64px',
        }}>
          <Row justify="space-between" align="middle">
            <Col>
              <div className="flex items-center gap-3">
                <BellOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                <Title level={3} style={{ margin: 0, color: colors.text }}>
                  {t`Notifications`}
                </Title>
                {totalUnread > 0 && (
                  <Badge
                    count={totalUnread}
                    style={{ 
                      backgroundColor: token.colorPrimary,
                      marginLeft: 8,
                    }}
                  />
                )}
              </div>
            </Col>
            <Col>
              <div className="flex items-center gap-2">
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setShowSettingsDrawer(true)}
                >
                  {t`Settings`}
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchAllData}
                  loading={loading}
                >
                  {t`Refresh`}
                </Button>
              </div>
            </Col>
          </Row>
        </Header>

        <Content className="p-6 max-w-7xl mx-auto w-full">
          {/* Stats Card */}
          {stats && (
            <Card
              className="mb-6"
              style={{ backgroundColor: colors.cardBg }}
              bodyStyle={{ padding: 16 }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <div className="flex flex-col items-center w-full">
                    <Text strong style={{ fontSize: 32, color: token.colorPrimary }}>
                      {totalNotifications}
                    </Text>
                    <Text type="secondary">{t`Total Notifications`}</Text>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div className="flex flex-col items-center w-full">
                    <Text strong style={{ fontSize: 32, color: '#52c41a' }}>
                      {totalUnread}
                    </Text>
                    <Text type="secondary">{t`Unread`}</Text>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div className="flex flex-col items-center w-full">
                    <Text strong style={{ fontSize: 32, color: '#faad14' }}>
                      {stats.readPercentage || 0}%
                    </Text>
                    <Text type="secondary">{t`Read Rate`}</Text>
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          {/* Main Content Card */}
          <Card
            style={{ backgroundColor: colors.cardBg }}
            bodyStyle={{ padding: 0 }}
          >
            {/* Toolbar */}
            <div className="p-4 border-b" style={{ borderColor: colors.border }}>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                      { key: 'all', label: t`All (${totalNotifications})` },
                      { key: 'unread', label: t`Unread (${totalUnread})` },
                      { key: 'mentions', label: t`Mentions` },
                    ]}
                    style={{ color: colors.text }}
                  />
                  
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => setShowFiltersDrawer(true)}
                  >
                    {t`Filters`}
                  </Button>

                  {selectedNotifications.length > 0 && (
                    <div className="flex items-center gap-3">
                      <Text type="secondary">
                        {t`${selectedNotifications.length} selected`}
                      </Text>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={handleBulkMarkAsRead}
                        loading={bulkActionLoading}
                      >
                        {t`Mark as read`}
                      </Button>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleBulkDelete}
                        loading={bulkActionLoading}
                      >
                        {t`Delete`}
                      </Button>
                      <Button
                        type="text"
                        onClick={() => setSelectedNotifications([])}
                      >
                        {t`Clear selection`}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="primary"
                    ghost
                    icon={<CheckOutlined />}
                    onClick={handleMarkAllAsRead}
                    disabled={totalUnread === 0}
                  >
                    {t`Mark all read`}
                  </Button>
                  <Button
                    icon={<ExportOutlined />}
                    onClick={handleExport}
                    loading={exportLoading}
                    disabled={filteredNotifications.length === 0}
                  >
                    {t`Export`}
                  </Button>
                  <Button
                    danger
                    icon={<ClearOutlined />}
                    onClick={() => setClearModalVisible(true)}
                    disabled={notifications.length === 0}
                  >
                    {t`Clear all`}
                  </Button>
                  <Button
                    onClick={handleSelectAll}
                  >
                    {selectedNotifications.length === filteredNotifications.length ? t`Deselect all` : t`Select all`}
                  </Button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="p-4">
              {filteredNotifications.length === 0 ? (
                <Empty
                  description={
                    <div className="space-y-4">
                      <Text style={{ fontSize: 16, color: colors.textSecondary }}>
                        {t`No notifications found`}
                      </Text>
                      {(searchQuery || dateRange || notificationTypes.length > 0 || readStatus !== 'all') ? (
                        <Button
                          type="primary"
                          onClick={() => {
                            setSearchQuery('');
                            setDateRange(null);
                            setNotificationTypes([]);
                            setReadStatus('all');
                          }}
                        >
                          {t`Clear filters`}
                        </Button>
                      ) : (
                        <Text type="secondary">
                          {t`You're all caught up! New notifications will appear here.`}
                        </Text>
                      )}
                    </div>
                  }
                  className="py-12"
                />
              ) : (
                Object.entries(notificationGroups).map(([date, groupNotifications]) => (
                  <div key={date} className="mb-8">
                    <Title level={4} style={{ color: colors.text, marginBottom: 16 }}>
                      {date} ({groupNotifications.length})
                    </Title>
                    <List
                      dataSource={groupNotifications}
                      renderItem={renderNotificationItem}
                      locale={{ emptyText: t`No notifications` }}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {filteredNotifications.length > 0 && (
              <div className="p-4 border-t flex justify-center" style={{ borderColor: colors.border }}>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={filteredNotifications.length}
                  onChange={(pageNum, pageSizeNum) => {
                    setPage(pageNum);
                    setPageSize(pageSizeNum);
                  }}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) => t`${range[0]}-${range[1]} of ${total} notifications`}
                />
              </div>
            )}
          </Card>
        </Content>

        {/* Modals and Drawers */}
        <Modal
          title={t`Clear All Notifications`}
          open={clearModalVisible}
          onOk={handleClearAll}
          onCancel={() => setClearModalVisible(false)}
          okText={t`Clear All`}
          cancelText={t`Cancel`}
          okButtonProps={{ danger: true }}
          styles={{
            content: { backgroundColor: colors.cardBg },
            header: { backgroundColor: colors.cardBg, borderBottom: `1px solid ${colors.border}`, color: colors.text },
            body: { color: colors.text }
          }}
        >
          <div className="space-y-4">
            <Text>
              {t`Are you sure you want to clear all notifications? This action cannot be undone.`}
            </Text>
            <Card size="small" style={{ backgroundColor: colors.cardBg }}>
              <div className="space-y-1">
                <Text type="secondary">{t`Summary:`}</Text>
                <Text>{t`• Total notifications: ${notifications.length}`}</Text>
                <Text>{t`• Unread notifications: ${totalUnread}`}</Text>
              </div>
            </Card>
          </div>
        </Modal>

        {renderSettingsDrawer()}
        {renderFiltersDrawer()}
      </Layout>

      <style>{`
        .notification-unread {
          animation: pulse 2s infinite;
          border-left: 4px solid #1890ff !important;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.95; }
          100% { opacity: 1; }
        }

        .ant-list-item:hover {
          background-color: ${colors.hoverBg} !important;
        }

        @media (max-width: 768px) {
          .ant-layout-header {
            padding: 0 16px !important;
          }
          
          .ant-card-body {
            padding: 12px !important;
          }
        }
      `}</style>
    </ConfigProvider>
  );
};

export default NotificationsPage;