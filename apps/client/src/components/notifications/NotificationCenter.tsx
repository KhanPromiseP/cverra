// components/notifications/NotificationCenter.tsx
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
  App
} from 'antd';
import { 
  BellOutlined, 
  CommentOutlined, 
  HeartOutlined,
  ShareAltOutlined,
  UserAddOutlined,
  CrownOutlined,
  TrophyOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReadOutlined,
  SettingOutlined,
  DeleteOutlined,
  MoreOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications 
} from '../../services/notificationApi';
import { useWebSocket } from '../../hooks/useWebSocket';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useBreakpoint } from '../../hooks/useBreakpoint';

dayjs.extend(relativeTime);
const { Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'achievement' | 'premium' | 'system';
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
    type: 'article' | 'comment' | 'user';
    id: string;
    title?: string;
    slug?: string;
  };
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const navigate = useNavigate();
  const ws = useWebSocket();
  const notificationSoundRef = useRef<HTMLAudioElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { notification } = App.useApp();
  const screens = useBreakpoint();
  
  // Check if mobile
  const isMobile = screens.xs || screens.sm;

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // WebSocket and polling setup
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let wsCleanup: (() => void) | undefined;

    // Set up polling as fallback
    pollInterval = setInterval(fetchNotifications, 30000);

    // Subscribe to real-time notifications via WebSocket
    // if (ws) {
    //   wsCleanup = ws.on('notification', handleNewNotification);
    // }

    return () => {
      clearInterval(pollInterval);
      wsCleanup?.();
    };
  }, [ws]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications();
      // Ensure notifications is always an array, even if API returns undefined/null
      const safeNotifications = Array.isArray(data?.notifications) 
        ? data.notifications 
        : [];
      const safeUnreadCount = typeof data?.unreadCount === 'number' 
        ? data.unreadCount 
        : 0;
      
      setNotifications(safeNotifications);
      setUnreadCount(safeUnreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError('Failed to load notifications');
      // Set default values on error
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleNewNotification = (notification: Notification) => {
    // Validate notification object
    if (!notification || typeof notification !== 'object') {
      console.error('Invalid notification received:', notification);
      return;
    }

    setNotifications(prev => {
      // Ensure prev is always an array
      const safePrev = Array.isArray(prev) ? prev : [];
      return [notification, ...safePrev];
    });
    setUnreadCount(prev => prev + 1);
    
    // Play notification sound
    if (notificationSoundRef.current) {
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play().catch(error => {
        console.warn('Failed to play notification sound:', error);
      });
    }

    // Show desktop notification if permitted
    if (Notification.permission === 'granted') {
      try {
        new Notification(notification.title || 'New Notification', {
          body: notification.message || 'You have a new notification',
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
      setNotifications(prev => {
        // Ensure prev is always an array
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        );
      });
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => {
        // Ensure prev is always an array
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.map(notif => ({ ...notif, read: true }));
      });
      setUnreadCount(0);
      notification.success({
        message: 'All notifications marked as read',
        duration: 2,
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => {
        // Ensure prev is always an array
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.filter(notif => notif.id !== id);
      });
      setUnreadCount(prev => {
        // Find the notification to check if it was unread
        const safeNotifications = Array.isArray(notifications) ? notifications : [];
        const notification = safeNotifications.find(n => n.id === id);
        return notification && !notification.read ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    if (notification.target) {
      try {
        switch (notification.target.type) {
          case 'article':
            navigate(`/article/${notification.target.slug || notification.target.id}`);
            break;
          case 'comment':
            navigate(`/article/${notification.target.slug}#comment-${notification.target.id}`);
            break;
          case 'user':
            navigate(`/profile/${notification.target.id}`);
            break;
        }
      } catch (error) {
        console.error('Failed to navigate:', error);
      }
    }
    
    // Close drawer on mobile after click
    if (isMobile) {
      setDrawerVisible(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <HeartOutlined style={{ color: '#ff4d4f' }} />;
      case 'comment':
      case 'reply':
        return <CommentOutlined style={{ color: '#1890ff' }} />;
      case 'follow':
        return <UserAddOutlined style={{ color: '#52c41a' }} />;
      case 'achievement':
        return <TrophyOutlined style={{ color: '#faad14' }} />;
      case 'premium':
        return <CrownOutlined style={{ color: '#722ed1' }} />;
      case 'system':
        return <MessageOutlined style={{ color: '#666' }} />;
      default:
        return <BellOutlined />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'like':
        return '#fff1f0';
      case 'comment':
      case 'reply':
        return '#f0f5ff';
      case 'follow':
        return '#f6ffed';
      case 'achievement':
        return '#fff7e6';
      case 'premium':
        return '#f9f0ff';
      case 'system':
        return '#fafafa';
      default:
        return '#fff';
    }
  };

  // Safely filter notifications - always ensure we're working with an array
  const filteredNotifications = (() => {
    const safeNotifications = Array.isArray(notifications) ? notifications : [];
    
    switch (activeTab) {
      case 'unread':
        return safeNotifications.filter(notification => !notification.read);
      case 'mentions':
        return safeNotifications.filter(notification => ['comment', 'reply'].includes(notification.type));
      default:
        return safeNotifications;
    }
  })();

  // Mobile drawer content
  const renderMobileDrawer = () => (
    <Drawer
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Space>
            <BellOutlined />
            <Text strong style={{ fontSize: '18px' }}>Notifications</Text>
            {unreadCount > 0 && (
              <Badge count={unreadCount} style={{ marginLeft: 8 }} />
            )}
          </Space>
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            onClick={() => setDrawerVisible(false)}
          />
        </div>
      }
      placement="right"
      onClose={() => setDrawerVisible(false)}
      open={drawerVisible}
      width="100%"
      style={{ maxWidth: 420 }}
      bodyStyle={{ padding: 0 }}
      headerStyle={{ padding: '16px 20px' }}
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Tabs */}
        <div style={{ padding: '0 20px', borderBottom: '1px solid #f0f0f0' }}>
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
          />
        </div>

        {/* Action buttons */}
        <div style={{ 
          padding: '12px 20px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Space>
            <Button 
              type="text" 
              size="small"
              icon={<SettingOutlined />}
            />
            {unreadCount > 0 && (
              <Button 
                type="link" 
                size="small" 
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </Space>
          <Button 
            type="link" 
            size="small"
            onClick={fetchNotifications}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Notifications list */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
        }}>
          {error ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Text type="danger">{error}</Text>
              <div style={{ marginTop: 16 }}>
                <Button type="link" onClick={fetchNotifications}>
                  Retry
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
                <Text type="secondary">No notifications yet</Text>
              }
              style={{ padding: '60px 0' }}
            />
          ) : (
            <List
              dataSource={filteredNotifications.slice(0, 20)}
              renderItem={(notification) => (
                <List.Item
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    backgroundColor: notification.read ? 'white' : getNotificationColor(notification.type),
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.2s',
                    WebkitTapHighlightColor: 'transparent', // Remove tap highlight on iOS
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  onTouchStart={(e) => {
                    e.currentTarget.style.backgroundColor = notification.read 
                      ? '#f5f5f5' 
                      : getNotificationColor(notification.type);
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.backgroundColor = notification.read 
                      ? 'white' 
                      : getNotificationColor(notification.type);
                  }}
                >
                  <Space align="start" style={{ width: '100%' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {notification.actor ? (
                        <Avatar src={notification.actor.picture} size={48}>
                          {notification.actor.name?.charAt(0) || 'U'}
                        </Avatar>
                      ) : (
                        <Avatar 
                          size={48}
                          style={{ 
                            backgroundColor: notification.type === 'achievement' ? '#faad14' : '#1890ff',
                            fontSize: '18px'
                          }}
                        >
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      )}
                      {!notification.read && (
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

                    <div style={{ flex: 1, minWidth: 0 }}> {/* minWidth: 0 for text truncation */}
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Text 
                            style={{ 
                              fontSize: '15px', 
                              lineHeight: 1.4,
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            <span style={{ fontWeight: '500' }}>
                              {notification.actor?.name || 'System'}
                            </span>
                            {' '}{notification.message || 'New notification'}
                          </Text>
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => handleDelete(notification.id, e)}
                            style={{ 
                              opacity: 0.6,
                              marginLeft: 8,
                              flexShrink: 0
                            }}
                          />
                        </div>
                        
                        {notification.target?.title && (
                          <Text 
                            type="secondary" 
                            style={{ 
                              fontSize: '13px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            "{notification.target.title}"
                          </Text>
                        )}
                        
                        <Space size="small" style={{ marginTop: 4, flexWrap: 'wrap' }}>
                          <Tag  style={{ margin: 0 }}>
                            {getNotificationIcon(notification.type)}
                            {' '}
                            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            <ClockCircleOutlined /> {dayjs(notification.createdAt).fromNow()}
                          </Text>
                        </Space>
                      </Space>
                    </div>
                  </Space>
                </List.Item>
              )}
            />
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div style={{ 
            padding: '16px 20px',
            borderTop: '1px solid #f0f0f0',
            backgroundColor: '#fafafa'
          }}>
            <Button 
              type="link" 
              onClick={() => {
                setDrawerVisible(false);
                navigate('/notifications');
              }}
              style={{ width: '100%', textAlign: 'center' }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );

  // Desktop dropdown content
  const notificationContent = (
    <div style={{ 
      width: 400, 
      maxWidth: '90vw',
      maxHeight: '80vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong style={{ fontSize: '16px' }}>
            Notifications
          </Text>
          <Space>
            {unreadCount > 0 && (
              <Button type="link" size="small" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
            <Button type="text" size="small" icon={<SettingOutlined />} />
          </Space>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="small"
        style={{ padding: '0 16px', flexShrink: 0 }}
        items={[
          { key: 'all', label: 'All' },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'mentions', label: 'Mentions' },
        ]}
      />

      <Divider style={{ margin: '8px 0', flexShrink: 0 }} />

      <div style={{ 
        flex: 1,
        overflowY: 'auto',
        minHeight: 200,
        maxHeight: 400
      }}>
        {error ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="danger">{error}</Text>
            <div style={{ marginTop: 16 }}>
              <Button type="link" onClick={fetchNotifications}>
                Retry
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
              <Text type="secondary">No notifications yet</Text>
            }
            style={{ padding: '40px 0' }}
          />
        ) : (
          <List
            dataSource={filteredNotifications.slice(0, 20)}
            renderItem={(notification) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: notification.read ? 'white' : getNotificationColor(notification.type),
                  borderBottom: '1px solid #f0f0f0',
                }}
                onClick={() => handleNotificationClick(notification)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = notification.read 
                    ? '#fafafa' 
                    : getNotificationColor(notification.type);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = notification.read 
                    ? 'white' 
                    : getNotificationColor(notification.type);
                }}
              >
                <Space align="start" style={{ width: '100%' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {notification.actor ? (
                      <Avatar src={notification.actor.picture} size={40}>
                        {notification.actor.name?.charAt(0) || 'U'}
                      </Avatar>
                    ) : (
                      <Avatar 
                        size={40}
                        style={{ 
                          backgroundColor: notification.type === 'achievement' ? '#faad14' : '#1890ff' 
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    )}
                    {!notification.read && (
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
                      <Text style={{ fontSize: '14px', lineHeight: 1.3 }}>
                        <span style={{ fontWeight: '500' }}>
                          {notification.actor?.name || 'System'}
                        </span>
                        {' '}{notification.message || 'New notification'}
                      </Text>
                      
                      {notification.target?.title && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          "{notification.target.title}"
                        </Text>
                      )}
                      
                      <Space size="small" style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {getNotificationIcon(notification.type)}
                          {' '}
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          <ClockCircleOutlined /> {dayjs(notification.createdAt).fromNow()}
                        </Text>
                      </Space>
                    </Space>
                  </div>

                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => handleDelete(notification.id, e)}
                    style={{ opacity: 0.6, flexShrink: 0 }}
                  />
                </Space>
              </List.Item>
            )}
          />
        )}
      </div>

      {filteredNotifications.length > 0 && (
        <div style={{ 
          padding: '12px 16px', 
          textAlign: 'center',
          borderTop: '1px solid #f0f0f0',
          flexShrink: 0
        }}>
          <Button type="link" onClick={() => navigate('/notifications')}>
            View all notifications
          </Button>
        </div>
      )}
    </div>
  );

  // Mobile trigger handler
  const handleNotificationClickMobile = () => {
    if (isMobile) {
      setDrawerVisible(true);
    }
  };

  return (
    <>
      {isMobile ? (
        <>
          <Badge 
            count={unreadCount} 
            overflowCount={99} 
            style={{ cursor: 'pointer' }}
            onClick={handleNotificationClickMobile}
          >
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: '18px' }} />}
              style={{ padding: '4px 8px' }}
            />
          </Badge>
          {renderMobileDrawer()}
        </>
      ) : (
        <Dropdown
          menu={{
            items: [
              {
                key: 'notification-content',
                label: notificationContent,
                style: { padding: 0, border: 'none' }
              }
            ]
          }}
          trigger={['click']}
          placement="bottomRight"
          overlayStyle={{ 
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            maxWidth: '90vw'
          }}
          dropdownRender={(menu) => (
            <div onClick={(e) => e.stopPropagation()}>
              {menu}
            </div>
          )}
        >
          <Badge count={unreadCount} overflowCount={99} style={{ cursor: 'pointer' }}>
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: '18px' }} />}
              style={{ padding: '4px 8px' }}
            />
          </Badge>
        </Dropdown>
      )}

      {/* Hidden audio element for notification sound */}
      <audio ref={notificationSoundRef} preload="auto">
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
        {/* Fallback to a simple beep */}
        <source src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==" type="audio/wav" />
      </audio>
    </>
  );
};

export default NotificationCenter;

export { NotificationCenter };