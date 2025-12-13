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
  Tabs
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
  MoreOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications 
} from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

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
  const navigate = useNavigate();
  const ws = useWebSocket();
  const notificationSoundRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to real-time notifications
    if (ws) {
      ws.on('notification', handleNewNotification);
    }

    // Play sound for new notifications
    if (notificationSoundRef.current) {
      notificationSoundRef.current.volume = 0.3;
    }

    return () => {
      if (ws) {
        ws.off('notification', handleNewNotification);
      }
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Play notification sound
    if (notificationSoundRef.current) {
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play().catch(console.error);
    }

    // Show desktop notification if permitted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: notification.actor?.picture,
        tag: notification.id,
      });
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === id);
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
      switch (notification.target.type) {
        case 'article':
          navigate(`/article/${notification.target.slug}`);
          break;
        case 'comment':
          navigate(`/article/${notification.target.slug}#comment-${notification.target.id}`);
          break;
        case 'user':
          navigate(`/profile/${notification.target.id}`);
          break;
      }
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

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread') return !notification.read;
    if (activeTab === 'mentions') return ['comment', 'reply'].includes(notification.type);
    return true;
  });

  const notificationContent = (
    <div style={{ width: 400, maxHeight: 500, overflow: 'hidden' }}>
      <div style={{ padding: '16px 16px 0' }}>
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
        style={{ padding: '0 16px' }}
        items={[
          { key: 'all', label: 'All' },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'mentions', label: 'Mentions' },
        ]}
      />

      <Divider style={{ margin: '8px 0' }} />

      <div style={{ maxHeight: 350, overflowY: 'auto' }}>
        {loading ? (
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
                  <div style={{ position: 'relative' }}>
                    {notification.actor ? (
                      <Avatar src={notification.actor.picture} size={40}>
                        {notification.actor.name.charAt(0)}
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

                  <div style={{ flex: 1 }}>
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Text style={{ fontSize: '14px', lineHeight: 1.3 }}>
                        <span style={{ fontWeight: '500' }}>
                          {notification.actor?.name || 'System'}
                        </span>
                        {' '}{notification.message}
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
                    style={{ opacity: 0.6 }}
                  />
                </Space>
              </List.Item>
            )}
          />
        )}
      </div>

      {filteredNotifications.length > 0 && (
        <div style={{ padding: '12px 16px', textAlign: 'center' }}>
          <Button type="link" onClick={() => navigate('/notifications')}>
            View all notifications
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Dropdown
        overlay={notificationContent}
        trigger={['click']}
        placement="bottomRight"
        overlayStyle={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
      >
        <Badge count={unreadCount} overflowCount={99} style={{ cursor: 'pointer' }}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: '18px' }} />}
            style={{ padding: '4px 8px' }}
          />
        </Badge>
      </Dropdown>

      {/* Hidden audio element for notification sound */}
      <audio ref={notificationSoundRef} preload="auto">
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
      </audio>
    </>
  );
};

export default NotificationCenter;