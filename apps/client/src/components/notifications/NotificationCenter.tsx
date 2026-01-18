import { t, Trans } from "@lingui/macro";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Badge, 
  Dropdown, 
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
  Drawer,
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
  CloseOutlined,
  CheckOutlined,
  CaretDownOutlined,
  CaretUpOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead,
  deleteNotification,
  type Notification as ApiNotification
} from '../../services/notificationApi';
import { useWebSocket } from '../../hooks/useWebSocket';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { toast } from 'sonner';

dayjs.extend(relativeTime);
const { Text } = Typography;

// Define your component's Notification type
interface ComponentNotification {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'achievement' | 'premium' | 'system' | 'digest' | 'reading_milestone' | 'recommendation';
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    picture?: string;
  };
  target?: {
    type: 'article' | 'comment' | 'user' | 'wallet' | 'features' | 'guide' | 'welcome' | 'dashboard';
    id: string;
    title?: string;
    slug?: string;
  };
}

// Helper function to convert API notification to component notification
const convertApiNotification = (apiNotif: ApiNotification): ComponentNotification => {
  const typeMap: Record<string, ComponentNotification['type']> = {
    'LIKE': 'like',
    'like': 'like',
    'COMMENT': 'comment',
    'comment': 'comment',
    'COMMENT_REPLY': 'reply',
    'REPLY': 'reply',
    'reply': 'reply',
    'ACHIEVEMENT': 'achievement',
    'achievement': 'achievement',
    'RECOMMENDATION': 'recommendation',
    'recommendation': 'recommendation',
    'SYSTEM': 'system',
    'system': 'system',
    'DIGEST': 'digest',
    'digest': 'digest',
    'READING_MILESTONE': 'reading_milestone',
    'reading_milestone': 'reading_milestone',
    'PREMIUM': 'premium',
    'premium': 'premium',
    'ARTICLE_PUBLISHED': 'system',
    'MENTION': 'comment',
  };

  const normalizedType = apiNotif.type.toUpperCase();
  const componentType = typeMap[normalizedType] || 'system';

  let targetType: 'article' | 'comment' | 'wallet' | 'features' | 'guide' | 'welcome' | 'dashboard' | 'user' = 'article';
  if (apiNotif.target?.type) {
    const normalizedTargetType = apiNotif.target.type.toLowerCase();
    if (['article', 'comment', 'user', 'wallet', 'features', 'guide', 'welcome', 'dashboard' ].includes(normalizedTargetType)) {
      targetType = normalizedTargetType as 'article' | 'comment' | 'user' | 'wallet' | 'features' | 'guide' | 'welcome' | 'dashboard';
    }
  }

  return {
    id: apiNotif.id,
    type: componentType,
    title: apiNotif.title || '',
    message: apiNotif.message || '',
    data: apiNotif.data || {},
    read: apiNotif.read || false,
    createdAt: apiNotif.createdAt,
    actor: apiNotif.actor ? {
      id: apiNotif.actor.id,
      name: apiNotif.actor.name || 'User',
      picture: apiNotif.actor.picture,
    } : undefined,
    target: apiNotif.target ? {
      type: targetType,
      id: apiNotif.target.id,
      title: apiNotif.target.title,
      slug: apiNotif.target.slug,
    } : undefined,
  };
};

// Notification Content Component (Embedded)
const NotificationContent: React.FC<{
  notification: ComponentNotification;
  isDarkMode: boolean;
  isExpanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
  isPreview?: boolean;
}> = ({ notification, isDarkMode, isExpanded, onToggleExpand, isPreview = false }) => {
  const navigate = useNavigate();
  const metadata = notification.data || {};
  const tips = metadata.tips || [];
  const features = metadata.features || [];
  const actions = metadata.actions || [];
  const coins = metadata.coins;

  const handleActionClick = (url?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!url) return;
    if (url.startsWith('/')) {
      navigate(url);
    } else if (url.startsWith('http')) {
      window.open(url, '_blank');
    }
  };

  // Check if notification has rich content
  const hasRichContent = tips.length > 0 || features.length > 0 || coins || actions.length > 0;

  return (
    <div className="space-y-1">
      {/* Title */}
      <Text strong style={{ 
        fontSize: isPreview ? '14px' : '15px', 
        display: 'block', 
        color: isDarkMode ? '#ffffffd9' : '#000000',
        lineHeight: 1.4
      }}>
        {notification.title}
      </Text>
      
      {/* Message */}
      {notification.message && (
        <Text style={{ 
          fontSize: isPreview ? '12px' : '13px', 
          display: 'block',
          color: isDarkMode ? '#ffffffa6' : '#666666',
          lineHeight: 1.4,
          marginTop: 2
        }}>
          {notification.message}
        </Text>
      )}
      
      {/* Expand/Collapse button for rich content */}
      {hasRichContent && isPreview && (
        <Button
          type="link"
          size="small"
          onClick={onToggleExpand}
          className="p-0 h-auto text-xs flex items-center gap-1 mt-1"
          style={{ color: isDarkMode ? '#1890ff' : '#1890ff' }}
        >
          {isExpanded ? <CaretUpOutlined /> : <CaretDownOutlined />}
          {isExpanded ? t`Show less` : t`Show details`}
        </Button>
      )}
      
      {/* Expanded content (only shown when expanded) */}
      {isExpanded && hasRichContent && (
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
          {/* Tips Section */}
          {metadata.type === 'TIPS' && tips.length > 0 && (
            <div>
              <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: 6 }}>
                <strong>📋 <Trans>Quick Tips:</Trans></strong>
              </Text>
              <ul className="space-y-1 pl-3">
                {tips.map((tip: string, index: number) => (
                  <li key={index} className="text-xs" style={{ color: isDarkMode ? '#ffffffa6' : '#666666' }}>
                    <span className="mr-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Features Section */}
          {metadata.type === 'FEATURE_INTRO' && features.length > 0 && (
            <div>
              <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: 6 }}>
                <strong>✨ <Trans>Features:</Trans></strong>
              </Text>
              <div className="space-y-2">
                {features.map((feature: any, index: number) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <span className="text-sm mt-0.5">{feature.icon}</span>
                    <div>
                      <Text strong className="text-xs block">
                        {feature.name}
                      </Text>
                      <Text type="secondary" className="text-xs block">
                        {feature.description}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Bonus Coins */}
          {metadata.type === 'BONUS_AWARDED' && coins && (
            <div>
              <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs" 
                   style={{ 
                     backgroundColor: isDarkMode ? 'rgba(250, 173, 20, 0.2)' : 'rgba(250, 173, 20, 0.1)',
                     border: `1px solid ${isDarkMode ? 'rgba(250, 173, 20, 0.3)' : 'rgba(250, 173, 20, 0.2)'}`
                   }}>
                <span>💰</span>
                <Text strong className="text-xs" style={{ color: '#faad14' }}>
                  +{coins} {t`coins`}
                </Text>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {actions.map((action: any, index: number) => (
                <Button
                  key={index}
                  type="default"
                  size="small"
                  onClick={(e) => handleActionClick(action.url, e)}
                  className="flex items-center gap-1 text-xs"
                  style={{ 
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    padding: '0px 6px',
                    height: '22px'
                  }}
                >
                  <span>{action.icon}</span>
                  <span>{action.text}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<ComponentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [hoveredNotification, setHoveredNotification] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
  
  const navigate = useNavigate();
  const ws = useWebSocket();
  const notificationSoundRef = useRef<HTMLAudioElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  const screens = useBreakpoint();
  const isMobile = screens.xs || screens.sm;

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    
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

  // Improved notification sound
  const playNotificationSound = () => {
    if (notificationSoundRef.current) {
      try {
        notificationSoundRef.current.currentTime = 0;
        notificationSoundRef.current.volume = 0.3;
        notificationSoundRef.current.play().catch(error => {
          console.warn('Failed to play notification sound:', error);
          playFallbackSound();
        });
      } catch (error) {
        console.warn('Failed to play notification sound:', error);
        playFallbackSound();
      }
    } else {
      playFallbackSound();
    }
  };

  const playFallbackSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  };

  // Toggle notification expansion
  const toggleNotificationExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // WebSocket and polling setup
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    pollInterval = setInterval(fetchNotifications, 30000);
    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications();
      
      const apiNotifications: ApiNotification[] = Array.isArray(data?.notifications) 
        ? data.notifications 
        : [];
      
      const convertedNotifications = apiNotifications.map(convertApiNotification);
      const safeUnreadCount = typeof data?.unreadCount === 'number' 
        ? data.unreadCount 
        : 0;
      
      setNotifications(convertedNotifications);
      setUnreadCount(safeUnreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError(t`Failed to load notifications`);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleNewNotification = (notification: ComponentNotification) => {
    if (!notification || typeof notification !== 'object') {
      console.error('Invalid notification received:', notification);
      return;
    }

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Play notification sound
    playNotificationSound();

    if (Notification.permission === 'granted') {
      try {
        new Notification(notification.title || t`New Notification`, {
          body: notification.message || t`You have a new notification`,
          icon: notification.actor?.picture,
          tag: notification.id,
        });
      } catch (error) {
        console.error('Failed to show desktop notification:', error);
      }
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      console.log('Marked as read on server:', id);
    } catch (error) {
      console.error('Failed to mark as read on server:', error);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, read: false } : notification
        )
      );
      setUnreadCount(prev => prev + 1);
      
      toast.error(t`Failed to mark as read`, {
        description: t`Please try again`,
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
      toast.success(t`All notifications marked as read`, {
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      const notificationToDelete = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      
      if (notificationToDelete && !notificationToDelete.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notif: ComponentNotification) => {
    console.log('NotificationCenter click:', notif);

    // Immediately update UI state for instant feedback
    if (!notif.read) {
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notif.id ? { ...notification, read: true } : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Call API to mark as read in background
      handleMarkAsRead(notif.id);
    }

    try {
      if (notif.target) {
        console.log('Target data:', notif.target);
        
        let path = '';
        
        switch (notif.target.type) {
          case 'article':
            if (notif.target.slug) {
              path = `/dashboard/article/${notif.target.slug}`;
            } else if (notif.target.id) {
              path = `/dashboard/article/${notif.target.id}`;
            }
            break;
            
          case 'comment':
            if (notif.target.slug && notif.target.id) {
              path = `/dashboard/article/${notif.target.slug}#comment-${notif.target.id}`;
            } else if (notif.target.slug) {
              path = `/dashboard/article/${notif.target.slug}`;
            }
            break;
            
          case 'user':
            if (notif.target.id) {
              path = `/dashboard/profile/${notif.target.id}`;
            }
            break;
            
          case 'dashboard':
            path = '/dashboard';
            break;
            
          case 'wallet':
            path = '/dashboard/wallet';
            break;
            
          case 'features':
            path = '/dashboard/features';
            break;
            
          case 'guide':
            path = '/dashboard/guide/getting-started';
            break;
            
          case 'welcome':
            path = '/dashboard/welcome';
            break;
            
          default:
            console.warn('Unknown target type:', notif.target.type);
        }

        if (path && !path.includes('undefined') && !path.includes('null')) {
          console.log('Navigating to:', path);
          navigate(path);
        } else {
          console.warn('Invalid navigation path:', path);
          toast.info(notif.title, {
            description: notif.message,
            duration: 3000,
          });
        }
        
      } else {
        console.log('Notification has no target - showing details');
        toast.info(notif.title || t`Notification`, {
          description: notif.message,
          duration: 3000,
        });
      }
      
    } catch (error) {
      console.error('Navigation failed:', error);
      toast.error(t`Could not open notification`, {
        description: t`Please try again`,
      });
    }

    // Close UI elements
    if (isMobile) {
      setDrawerVisible(false);
    } else {
      setDropdownVisible(false);
    }
  };

  const getNotificationIcon = (type: ComponentNotification['type']) => {
    switch (type) {
      case 'like':
        return <HeartOutlined style={{ color: '#ff4d4f' }} />;
      case 'comment':
        return <CommentOutlined style={{ color: '#1890ff' }} />;
      case 'reply':
        return <CommentOutlined style={{ color: '#52c41a' }} />;
      case 'follow':
        return <UserAddOutlined style={{ color: '#52c41a' }} />;
      case 'achievement':
        return <TrophyOutlined style={{ color: '#faad14' }} />;
      case 'premium':
        return <CrownOutlined style={{ color: '#722ed1' }} />;
      case 'system':
      case 'digest':
      case 'reading_milestone':
      case 'recommendation':
        return <MessageOutlined style={{ color: '#666' }} />;
      default:
        return <BellOutlined />;
    }
  };

  const getNotificationColor = (type: ComponentNotification['type']) => {
    switch (type) {
      case 'like':
        return isDarkMode ? '#2a1215' : '#fff1f0';
      case 'comment':
        return isDarkMode ? '#111d2c' : '#f0f5ff';
      case 'reply':
        return isDarkMode ? '#162312' : '#f6ffed';
      case 'follow':
        return isDarkMode ? '#162312' : '#f6ffed';
      case 'achievement':
        return isDarkMode ? '#2b1d11' : '#fff7e6';
      case 'premium':
        return isDarkMode ? '#1a1325' : '#f9f0ff';
      case 'system':
      case 'digest':
      case 'reading_milestone':
      case 'recommendation':
        return isDarkMode ? '#262626' : '#fafafa';
      default:
        return isDarkMode ? '#1f1f1f' : '#fff';
    }
  };

  const getNotificationTypeLabel = (type: ComponentNotification['type']) => {
    switch (type) {
      case 'like':
        return t`Like`;
      case 'comment':
        return t`Comment`;
      case 'reply':
        return t`Reply`;
      case 'follow':
        return t`Follow`;
      case 'achievement':
        return t`Achievement`;
      case 'premium':
        return t`Premium`;
      case 'system':
        return t`System`;
      case 'digest':
        return t`Digest`;
      case 'reading_milestone':
        return t`Milestone`;
      case 'recommendation':
        return t`Recommendation`;
      default:
        return t`Notification`;
    }
  };

  // Safely filter notifications
  const filteredNotifications = (() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter(notification => !notification.read);
      case 'mentions':
        return notifications.filter(notification => 
          ['comment', 'reply', 'reading_milestone'].includes(notification.type)
        );
      default:
        return notifications;
    }
  })();

  // Mobile drawer content
  const renderMobileDrawer = () => (
    <Drawer
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Space>
            <BellOutlined style={{ color: colors.text }} />
            <Text strong style={{ fontSize: '18px', color: colors.text }}>
              {t`Notifications`}
            </Text>
            {unreadCount > 0 && (
              <Badge count={unreadCount} style={{ marginLeft: 8 }} />
            )}
          </Space>
          <Button 
            type="text" 
            icon={<CloseOutlined />}
            onClick={() => setDrawerVisible(false)}
            style={{ color: colors.text }}
          />
        </div>
      }
      placement="right"
      onClose={() => setDrawerVisible(false)}
      open={drawerVisible}
      width="100%"
      style={{ maxWidth: 420 }}
      styles={{
        body: { backgroundColor: colors.background, padding: 0 },
        header: { 
          backgroundColor: colors.cardBg, 
          borderBottom: `1px solid ${colors.border}`,
          padding: '16px 20px'
        },
        mask: { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.45)' }
      }}
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Tabs */}
        <div style={{ 
          padding: '0 20px', 
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.cardBg
        }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="middle"
            style={{ margin: 0 }}
            items={[
              { key: 'all', label: 'All' },
              { key: 'unread', label: `Unread (${unreadCount})` },
              { key: 'mentions', label: 'Mentions' },
            ]}
            tabBarStyle={{ color: colors.text }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ 
          padding: '12px 20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: colors.cardBg
        }}>
          <Space>
            <Button 
              type="text" 
              size="small"
              icon={<SettingOutlined />}
              onClick={() => navigate('/settings/notifications')}
              style={{ color: colors.text }}
            />
            {unreadCount > 0 && (
              <Button 
                type="link" 
                size="small" 
                onClick={handleMarkAllAsRead}
                style={{ color: colors.text }}
              >
                {t`Mark all as read`}
              </Button>
            )}
          </Space>
          <Button 
            type="link" 
            size="small"
            onClick={fetchNotifications}
            loading={loading}
            style={{ color: colors.text }}
          >
            {t`Refresh`}
          </Button>
        </div>

        {/* Notifications list */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          backgroundColor: colors.background
        }}>
          {error ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Text type="danger">{error}</Text>
              <div style={{ marginTop: 16 }}>
                <Button type="link" onClick={fetchNotifications}>
                  {t`Retry`}
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Empty
              description={
                <Text type="secondary" style={{ color: colors.textSecondary }}>
                  {t`No notifications yet`}
                </Text>
              }
              style={{ padding: '60px 0' }}
              imageStyle={{ filter: isDarkMode ? 'invert(1)' : 'none' }}
            />
          ) : (
            <List
              dataSource={filteredNotifications.slice(0, 20)}
              renderItem={(notif: ComponentNotification) => {
                const isExpanded = expandedNotifications.has(notif.id);
                const metadata = notif.data || {};
                const hasRichContent = metadata.tips?.length > 0 || metadata.features?.length > 0 || metadata.coins || metadata.actions?.length > 0;
                
                return (
                  <List.Item
                    style={{
                      padding: '16px 20px',
                      cursor: 'pointer',
                      backgroundColor: notif.read ? colors.cardBg : getNotificationColor(notif.type),
                      borderBottom: `1px solid ${colors.border}`,
                      transition: 'background-color 0.2s',
                      WebkitTapHighlightColor: 'transparent',
                      borderLeft: notif.read ? 'none' : '4px solid #1890ff',
                    }}
                    onClick={() => handleNotificationClick(notif)}
                    onTouchStart={(e) => {
                      e.currentTarget.style.backgroundColor = notif.read 
                        ? colors.hoverBg 
                        : getNotificationColor(notif.type);
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.backgroundColor = notif.read 
                        ? colors.cardBg 
                        : getNotificationColor(notif.type);
                    }}
                  >
                    <Space align="start" style={{ width: '100%' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        {notif.actor ? (
                          <Avatar src={notif.actor.picture} size={48}>
                            {notif.actor.name?.charAt(0) || 'U'}
                          </Avatar>
                        ) : (
                          <Avatar 
                            size={48}
                            style={{ 
                              backgroundColor: notif.type === 'achievement' ? '#faad14' : '#1890ff',
                              fontSize: '18px'
                            }}
                          >
                            {getNotificationIcon(notif.type)}
                          </Avatar>
                        )}
                        {!notif.read && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              width: 10,
                              height: 10,
                              backgroundColor: '#1890ff',
                              borderRadius: '50%',
                              border: '2px solid white',
                            }}
                          />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text 
                              strong={!notif.read}
                              style={{ 
                                fontSize: '15px', 
                                lineHeight: 1.4,
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                color: notif.read ? colors.textSecondary : colors.text,
                                fontWeight: notif.read ? 'normal' : '600',
                                marginRight: '12px',
                              }}
                            >
                              {notif.title}
                            </Text>
                            
                            {/* Action buttons container */}
                            <div style={{ 
                              display: 'flex', 
                              gap: '8px', 
                              flexShrink: 0,
                              alignItems: 'center' 
                            }}>
                              {/* For unread notifications: Show both Mark as Read and Delete buttons */}
                              {!notif.read && (
                                <>
                                  <Button
                                    type="text"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNotifications(prev =>
                                        prev.map(notification =>
                                          notification.id === notif.id ? { ...notification, read: true } : notification
                                        )
                                      );
                                      setUnreadCount(prev => Math.max(0, prev - 1));
                                      handleMarkAsRead(notif.id);
                                    }}
                                    style={{ 
                                      color: '#52c41a',
                                      backgroundColor: isDarkMode ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.08)',
                                      border: `1px solid ${isDarkMode ? 'rgba(82, 196, 26, 0.3)' : 'rgba(82, 196, 26, 0.2)'}`,
                                      borderRadius: '4px',
                                      padding: '2px 8px',
                                      height: '24px',
                                      fontSize: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      minWidth: '80px',
                                    }}
                                    title={t`Mark as read`}
                                  >
                                    <CheckOutlined style={{ fontSize: '12px' }} />
                                    <span>{t`Mark read`}</span>
                                  </Button>
                                  
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => handleDelete(notif.id, e)}
                                    style={{ 
                                      color: '#ff4d4f',
                                      backgroundColor: isDarkMode ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.08)',
                                      border: `1px solid ${isDarkMode ? 'rgba(255, 77, 79, 0.3)' : 'rgba(255, 77, 79, 0.2)'}`,
                                      borderRadius: '4px',
                                      padding: '2px 6px',
                                      height: '24px',
                                      width: '24px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                    title={t`Delete`}
                                  />
                                </>
                              )}
                              
                              {/* For read notifications: Show only Delete button */}
                              {notif.read && (
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={(e) => handleDelete(notif.id, e)}
                                  style={{ 
                                    color: '#ff4d4f',
                                    backgroundColor: isDarkMode ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.08)',
                                    border: `1px solid ${isDarkMode ? 'rgba(255, 77, 79, 0.3)' : 'rgba(255, 77, 79, 0.2)'}`,
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    height: '24px',
                                    width: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  title={t`Delete`}
                                />
                              )}
                            </div>
                          </div>
                          
                          {/* Use NotificationContent for message and expandable content */}
                          <NotificationContent 
                            notification={notif}
                            isDarkMode={isDarkMode}
                            isExpanded={isExpanded}
                            onToggleExpand={(e) => toggleNotificationExpand(notif.id, e)}
                            isPreview={true}
                          />
                          
                          {notif.actor?.name && (
                            <Text style={{ fontSize: '12px', color: colors.textSecondary }}>
                              {t`From:`} {notif.actor.name}
                            </Text>
                          )}
                          
                          {notif.target && (
                            <div className="flex items-center gap-2">
                              <Text type="secondary" className="text-xs">
                                {notif.target.type === 'article' && '📄'}
                                {notif.target.type === 'comment' && '💬'}
                                {notif.target.type === 'user' && '👤'}
                                {notif.target.type === 'dashboard' && '🏠'}
                                {notif.target.type === 'wallet' && '💰'}
                                {notif.target.type === 'features' && '✨'}
                                {notif.target.type === 'guide' && '📚'}
                                {notif.target.type === 'welcome' && '🎉'}
                              </Text>
                              <Text
                                type="secondary"
                                className="text-xs truncate max-w-[150px]"
                              >
                                {notif.target.title || notif.target.id}
                              </Text>
                            </div>
                          )}
                          
                          <Space size="small" style={{ marginTop: 4, flexWrap: 'wrap' }}>
                            <Tag style={{ 
                              margin: 0,
                              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.02)',
                              color: colors.text,
                              fontSize: '11px'
                            }}>
                              {getNotificationIcon(notif.type)}
                              {' '}
                              {getNotificationTypeLabel(notif.type)}
                            </Tag>
                            <Text style={{ fontSize: '11px', color: colors.textSecondary }}>
                              <ClockCircleOutlined /> {dayjs(notif.createdAt).fromNow()}
                            </Text>
                          </Space>
                        </Space>
                      </div>
                    </Space>
                  </List.Item>
                );
              }}
            />
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div style={{ 
            padding: '16px 20px',
            borderTop: `1px solid ${colors.border}`,
            backgroundColor: colors.cardBg
          }}>
            <Button 
              type="link" 
              onClick={() => {
                setDrawerVisible(false);
                navigate('/dashboard/notifications');
              }}
              style={{ width: '100%', textAlign: 'center', color: colors.text }}
            >
              {t`View all notifications`}
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );

  // Desktop dropdown content
  const notificationContent = (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <div style={{ 
        width: 400, 
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.cardBg,
        color: colors.text,
      }}>
        <div style={{ 
          padding: '16px 16px 0', 
          flexShrink: 0,
          backgroundColor: colors.cardBg 
        }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text strong style={{ fontSize: '16px', color: colors.text }}>
              {t`Notifications`}
            </Text>
            <Space>
              {unreadCount > 0 && (
                <Button 
                  type="link" 
                  size="small" 
                  onClick={handleMarkAllAsRead}
                  style={{ color: colors.text }}
                >
                  {t`Mark all as read`}
                </Button>
              )}
              <Button 
                type="text" 
                size="small" 
                icon={<SettingOutlined />}
                onClick={() => navigate('/settings/notifications')}
                style={{ color: colors.text }}
              />
            </Space>
          </Space>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          style={{ 
            padding: '0 16px', 
            flexShrink: 0,
            backgroundColor: colors.cardBg 
          }}
          items={[
            { key: 'all', label: t`All` },
            { key: 'unread', label: t`Unread (${unreadCount})` },
            { key: 'mentions', label: t`Mentions` },
          ]}
          tabBarStyle={{ color: colors.text }}
        />

        <Divider style={{ 
          margin: '8px 0', 
          flexShrink: 0,
          backgroundColor: colors.border 
        }} />

        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          minHeight: 200,
          maxHeight: 400,
          backgroundColor: colors.background
        }}>
          {error ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="danger">{error}</Text>
              <div style={{ marginTop: 16 }}>
                <Button type="link" onClick={fetchNotifications}>
                  {t`Retry`}
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Empty
              description={
                <Text type="secondary" style={{ color: colors.textSecondary }}>
                  {t`No notifications yet`}
                </Text>
              }
              style={{ padding: '40px 0' }}
              imageStyle={{ filter: isDarkMode ? 'invert(1)' : 'none' }}
            />
          ) : (
            <List
              dataSource={filteredNotifications.slice(0, 20)}
              renderItem={(notif: ComponentNotification) => {
                const isExpanded = expandedNotifications.has(notif.id);
                const metadata = notif.data || {};
                const hasRichContent = metadata.tips?.length > 0 || metadata.features?.length > 0 || metadata.coins || metadata.actions?.length > 0;
                
                return (
                  <List.Item
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      backgroundColor: notif.read ? colors.cardBg : getNotificationColor(notif.type),
                      borderBottom: `1px solid ${colors.border}`,
                      borderLeft: notif.read ? 'none' : '4px solid #1890ff',
                    }}
                    onClick={() => handleNotificationClick(notif)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = notif.read 
                        ? colors.hoverBg 
                        : getNotificationColor(notif.type);
                      setHoveredNotification(notif.id);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = notif.read 
                        ? colors.cardBg 
                        : getNotificationColor(notif.type);
                      setHoveredNotification(null);
                    }}
                  >
                    <Space align="start" style={{ width: '100%' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        {notif.actor ? (
                          <Avatar src={notif.actor.picture} size={40}>
                            {notif.actor.name?.charAt(0) || 'U'}
                          </Avatar>
                        ) : (
                          <Avatar 
                            size={40}
                            style={{ 
                              backgroundColor: notif.type === 'achievement' ? '#faad14' : '#1890ff' 
                            }}
                          >
                            {getNotificationIcon(notif.type)}
                          </Avatar>
                        )}
                        {!notif.read && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              width: 8,
                              height: 8,
                              backgroundColor: '#1890ff',
                              borderRadius: '50%',
                              border: '2px solid white',
                            }}
                          />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Space direction="vertical" size={2} style={{ width: '100%' }}>
                          <NotificationContent 
                            notification={notif}
                            isDarkMode={isDarkMode}
                            isExpanded={isExpanded}
                            onToggleExpand={(e) => toggleNotificationExpand(notif.id, e)}
                            isPreview={true}
                          />
                          
                          {/* Show "Mark as read" button on hover for unread notifications */}
                          {!notif.read && hoveredNotification === notif.id && (
                            <Button
                              type="link"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNotifications(prev =>
                                  prev.map(notification =>
                                    notification.id === notif.id ? { ...notification, read: true } : notification
                                  )
                                );
                                setUnreadCount(prev => Math.max(0, prev - 1));
                                handleMarkAsRead(notif.id);
                              }}
                              style={{ 
                                padding: 0,
                                fontSize: '11px',
                                height: 'auto',
                                color: '#1890ff'
                              }}
                            >
                              <CheckOutlined /> {t`Mark as read`}
                            </Button>
                          )}
                          
                          {notif.actor?.name && (
                            <Text style={{ fontSize: '11px', color: colors.textSecondary }}>
                              {t`From:`} {notif.actor.name}
                            </Text>
                          )}
                          
                          {notif.target && (
                            <div className="flex items-center gap-1">
                              <Text type="secondary" className="text-xs">
                                {notif.target.type === 'article' && '📄'}
                                {notif.target.type === 'comment' && '💬'}
                                {notif.target.type === 'user' && '👤'}
                                {notif.target.type === 'dashboard' && '🏠'}
                                {notif.target.type === 'wallet' && '💰'}
                                {notif.target.type === 'features' && '✨'}
                                {notif.target.type === 'guide' && '📚'}
                                {notif.target.type === 'welcome' && '🎉'}
                              </Text>
                              <Text style={{ fontSize: '11px', color: colors.textSecondary }}>
                                {notif.target.title || notif.target.id}
                              </Text>
                            </div>
                          )}
                          
                          <Space size="small" style={{ marginTop: 2 }}>
                            <Text style={{ fontSize: '10px', color: colors.textSecondary }}>
                              {getNotificationIcon(notif.type)}
                              {' '}
                              {getNotificationTypeLabel(notif.type)}
                            </Text>
                            <Text style={{ fontSize: '10px', color: colors.textSecondary }}>
                              <ClockCircleOutlined /> {dayjs(notif.createdAt).fromNow()}
                            </Text>
                          </Space>
                        </Space>
                      </div>

                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => handleDelete(notif.id, e)}
                        style={{ 
                          opacity: 0.6, 
                          flexShrink: 0,
                          color: colors.textSecondary
                        }}
                      />
                    </Space>
                  </List.Item>
                );
              }}
            />
          )}
        </div>

        {filteredNotifications.length > 0 && (
          <div style={{ 
            padding: '12px 16px', 
            textAlign: 'center',
            borderTop: `1px solid ${colors.border}`,
            flexShrink: 0,
            backgroundColor: colors.cardBg
          }}>
            <Button 
              type="link" 
              onClick={() => navigate('/dashboard/notifications')}
              style={{ color: colors.text }}
            >
              {t`View all notifications`}
            </Button>
          </div>
        )}
      </div>
    </ConfigProvider>
  );

  return (
    <>
      {isMobile ? (
        <>
          <Badge 
            count={unreadCount} 
            overflowCount={99} 
            style={{ cursor: 'pointer' }}
            onClick={() => setDrawerVisible(true)}
          >
            <Button
              type="text"
              icon={
                <BellOutlined
                  style={{
                    fontSize: '18px',
                    color: colors.text,
                  }}
                />
              }
              style={{ padding: '4px 8px' }}
            />
          </Badge>
          {renderMobileDrawer()}
        </>
      ) : (
        <Dropdown
          open={dropdownVisible}
          onOpenChange={setDropdownVisible}
          trigger={['click']}
          placement="bottomRight"
          dropdownRender={() => notificationContent}
        >
          <Badge count={unreadCount} overflowCount={99} style={{ cursor: 'pointer' }}>
            <Button type="text">
              <span style={{ color: colors.text }}>
                <BellOutlined style={{ fontSize: "18px" }} />
              </span>
            </Button>
          </Badge>
        </Dropdown>
      )}

      {/* Hidden audio element for notification sound */}
      <audio ref={notificationSoundRef} preload="auto" style={{ display: 'none' }}>
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
        <source src="/sounds/notification.ogg" type="audio/ogg" />
        <source src="/sounds/notification.wav" type="audio/wav" />
        {/* Fallback to simple beep sound */}
        <source src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==" type="audio/wav" />
      </audio>
    </>
  );
};

export default NotificationCenter;
export { NotificationCenter };