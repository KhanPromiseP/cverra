import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  List,
  Avatar,
  Typography,
  Tag,
  Button,
  Space,
  Timeline,
  Empty,
  Badge,
  Tooltip,
  Divider,
  Col,
  Row,
  notification,
} from 'antd';

import {
  EyeOutlined,
  HeartOutlined,
  HeartFilled,
  BookOutlined,
  BookFilled,
  CommentOutlined,
  ShareAltOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  FireOutlined,
  StarOutlined,
  CrownOutlined,
  ReadOutlined,
  LikeOutlined,
  MessageOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { apiClient } from '@/client/services/api-client';
import './RecentActivity.css';

const { Title, Text, Paragraph } = Typography;

interface ActivityItem {
  id: string;
  type: 'VIEW' | 'LIKE' | 'SAVE' | 'COMMENT' | 'ACHIEVEMENT' | 'SHARE' | 'READING_SESSION';
  article?: {
    id: string;
    title: string;
    slug: string;
    coverImage?: string;
    category?: {
      name: string;
      color: string;
    };
  };
  achievement?: {
    title: string;
    description: string;
    points: number;
    rarity: string;
  };
  timestamp: string;
  duration?: number; // For reading sessions in minutes
  metadata?: {
    comment?: string;
    likes?: number;
    sharePlatform?: string;
  };
}

interface ReadingStats {
  today: {
    articlesRead: number;
    readingTime: number;
    likesGiven: number;
    commentsMade: number;
  };
  week: {
    streakDays: number;
    totalArticles: number;
    totalTime: number;
    progress: number;
  };
  topCategories: Array<{
    name: string;
    count: number;
    color: string;
  }>;
}

const RecentActivity: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

// Fetch recent activity
const { data: activitiesData, isLoading } = useQuery({
    queryKey: ['/articles/user/activity/recent'],
    queryFn: async () => {
        const response = await apiClient.get('/articles/user/activity/recent', {
        params: { limit: 20 }
        });
        return response.data;
    },
});

// Fetch reading stats
const { data: readingStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/articles/user/reading/stats'],
    queryFn: async () => {
        const response = await apiClient.get('/articles/user/reading/stats');
        return response.data;
    },
});


  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'VIEW': <EyeOutlined style={{ color: '#3B82F6' }} />,
      'LIKE': <HeartFilled style={{ color: '#EF4444' }} />,
      'SAVE': <BookFilled style={{ color: '#8B5CF6' }} />,
      'COMMENT': <CommentOutlined style={{ color: '#10B981' }} />,
      'ACHIEVEMENT': <TrophyOutlined style={{ color: '#F59E0B' }} />,
      'SHARE': <ShareAltOutlined style={{ color: '#EC4899' }} />,
      'READING_SESSION': <ReadOutlined style={{ color: '#06B6D4' }} />
    };
    return icons[type] || <HistoryOutlined />;
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      'VIEW': '#3B82F6',
      'LIKE': '#EF4444',
      'SAVE': '#8B5CF6',
      'COMMENT': '#10B981',
      'ACHIEVEMENT': '#F59E0B',
      'SHARE': '#EC4899',
      'READING_SESSION': '#06B6D4'
    };
    return colors[type] || '#6B7280';
  };

  const getActivityVerb = (type: string) => {
    const verbs: Record<string, string> = {
      'VIEW': 'viewed',
      'LIKE': 'liked',
      'SAVE': 'saved',
      'COMMENT': 'commented on',
      'ACHIEVEMENT': 'unlocked achievement',
      'SHARE': 'shared',
      'READING_SESSION': 'read'
    };
    return verbs[type] || 'interacted with';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return past.toLocaleDateString();
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredActivities = activitiesData?.filter((activity: ActivityItem) => {
    if (activeFilter === 'all') return true;
    return activity.type === activeFilter;
  });

  const renderActivityItem = (activity: ActivityItem) => {
    const isExpanded = expandedItems.has(activity.id);
    const activityColor = getActivityColor(activity.type);

    return (
      <List.Item className="activity-item" key={activity.id}>
        <div className="activity-content">
          <div className="activity-header">
            <Avatar
              size={40}
              style={{ 
                backgroundColor: activityColor + '20',
                color: activityColor
              }}
              icon={getActivityIcon(activity.type)}
            />
            <div className="activity-info">
              <div className="activity-title">
                <Text strong>
                  {activity.type === 'ACHIEVEMENT' 
                    ? `Unlocked: ${activity.achievement?.title}`
                    : `${getActivityVerb(activity.type)} ${activity.article?.title}`
                  }
                </Text>
                <Text type="secondary" className="activity-time">
                  {formatTimeAgo(activity.timestamp)}
                </Text>
              </div>
              
              {activity.type === 'READING_SESSION' && activity.duration && (
                <div className="activity-duration">
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  <Text type="secondary">{activity.duration} minutes</Text>
                </div>
              )}
              
              {activity.type === 'ACHIEVEMENT' && (
                <div className="achievement-details">
                  <Tag color="gold" style={{ marginRight: 8 }}>
                    +{activity.achievement?.points} points
                  </Tag>
                  <Text type="secondary">{activity.achievement?.description}</Text>
                </div>
              )}
              
              {activity.metadata?.comment && (
                <div className="activity-comment">
                  <Paragraph italic className="comment-text">
                    "{activity.metadata.comment}"
                  </Paragraph>
                </div>
              )}
              
              {activity.article && (
                <div className="article-preview">
                  <div 
                    className="article-cover"
                    style={{
                      backgroundImage: `url(${activity.article.coverImage})`,
                      backgroundColor: activity.article.category?.color + '20'
                    }}
                  />
                  <div className="article-info">
                    <Text strong className="article-title">
                      {activity.article.title}
                    </Text>
                    {activity.article.category && (
                      <Tag 
                        color={activity.article.category.color}
                        style={{ marginTop: 4 }}
                      >
                        {activity.article.category.name}
                      </Tag>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="activity-actions">
            {activity.article && (
              <Button
                type="link"
                size="small"
                icon={<ArrowRightOutlined />}
                onClick={() => window.location.href = `/dashboard/article/${activity.article?.slug}`}
              >
                Read Again
              </Button>
            )}
            <Button
              type="text"
              size="small"
              onClick={() => toggleExpand(activity.id)}
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </Button>
          </div>
        </div>
      </List.Item>
    );
  };

  if (isLoading || statsLoading) {
    return (
      <Card className="recent-activity-card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <HistoryOutlined style={{ fontSize: 32, color: '#6B7280' }} />
          <Text>Loading activity...</Text>
        </div>
      </Card>
    );
  }

  // Use real data with fallback to mock
const displayActivities = activitiesData || [];
const displayStats = readingStatsData || [];

  const activityFilters = [
    { key: 'all', label: 'All Activity', icon: <HistoryOutlined /> },
    { key: 'READING_SESSION', label: 'Reading', icon: <ReadOutlined /> },
    { key: 'LIKE', label: 'Likes', icon: <HeartOutlined /> },
    { key: 'COMMENT', label: 'Comments', icon: <CommentOutlined /> },
    { key: 'SAVE', label: 'Saves', icon: <BookOutlined /> },
    { key: 'ACHIEVEMENT', label: 'Achievements', icon: <TrophyOutlined /> }
  ];

  return (
    <Card 
      className="recent-activity-card"
      title={
        <Space>
          <HistoryOutlined />
          <span>Recent Activity</span>
          <Badge 
            count={displayActivities.length} 
            style={{ backgroundColor: '#3B82F6' }}
          />
        </Space>
      }
    >
      {/* Stats Overview */}
      <div className="stats-overview">
        <Row gutter={[16, 16]} className="stats-grid">
          <Col xs={12} sm={6}>
            <div className="stat-item today-stat">
              <div className="stat-icon">
                <EyeOutlined />
              </div>
              <div className="stat-content">
                <Text strong>{displayStats.today.articlesRead}</Text>
                <Text type="secondary">Today's Reads</Text>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item today-stat">
              <div className="stat-icon">
                <ClockCircleOutlined />
              </div>
              <div className="stat-content">
                <Text strong>{displayStats.today.readingTime} min</Text>
                <Text type="secondary">Reading Time</Text>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item week-stat">
              <div className="stat-icon">
                <FireOutlined />
              </div>
              <div className="stat-content">
                <Text strong>{displayStats.week.streakDays} days</Text>
                <Text type="secondary">Current Streak</Text>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item week-stat">
              <div className="stat-icon">
                <BookOutlined />
              </div>
              <div className="stat-content">
                <Text strong>{displayStats.week.totalArticles}</Text>
                <Text type="secondary">This Week</Text>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Weekly Progress */}
      <div className="weekly-progress">
        <div className="progress-header">
          <Text strong>Weekly Reading Goal</Text>
          <Text type="secondary">{displayStats.week.progress}% complete</Text>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${displayStats.week.progress}%` }}
          />
        </div>
      </div>

      {/* Activity Filters */}
      <div className="activity-filters">
        <Space wrap style={{ marginBottom: 16 }}>
          {activityFilters.map(filter => (
            <Button
              key={filter.key}
              type={activeFilter === filter.key ? 'primary' : 'default'}
              icon={filter.icon}
              onClick={() => setActiveFilter(filter.key)}
              size="small"
            >
              {filter.label}
            </Button>
          ))}
        </Space>
      </div>

      {/* Activity Timeline */}
      <div className="activity-timeline">
        {filteredActivities.length > 0 ? (
          <List
            dataSource={filteredActivities}
            renderItem={renderActivityItem}
            className="activity-list"
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text>No activity found for this filter</Text>
                <br />
                <Button 
                  type="link" 
                  onClick={() => setActiveFilter('all')}
                >
                  View all activity
                </Button>
              </div>
            }
          />
        )}
      </div>

      {/* Top Categories */}
      {displayStats.topCategories.length > 0 && (
        <div className="top-categories">
          <Divider orientation="left">
            <Text strong>Top Categories This Week</Text>
          </Divider>
          <Space wrap>
            {displayStats.topCategories.map((category: any, index: any) => (
              <Tag
                key={index}
                color={category.color}
                style={{ padding: '8px 12px', fontSize: '13px' }}
              >
                <Space>
                  <div 
                    className="category-dot"
                    style={{ backgroundColor: category.color }}
                  />
                  <Text strong>{category.name}</Text>
                  <Badge 
                    count={category.count}
                    style={{ 
                      backgroundColor: category.color + '40',
                      color: category.color
                    }}
                  />
                </Space>
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* Shareable Insights */}
      <div className="shareable-insights">
        <Divider orientation="left">
          <Text strong>Share Your Progress</Text>
        </Divider>
        <Card size="small" className="insight-card">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>
              📊 You've read <Text strong>{displayStats.week.totalArticles} articles</Text> this week with{' '}
              <Text strong>{displayStats.week.totalTime} minutes</Text> of focused reading!
            </Text>
            <Text>
              🎯 Keep going! You're on a <Text strong>{displayStats.week.streakDays}-day streak</Text>.
            </Text>
            <Button
              type="primary"
              ghost
              icon={<ShareAltOutlined />}
              onClick={() => {
                const shareText = `I've read ${displayStats.week.totalArticles} articles this week on Cverra! 📚 Join me in discovering life-changing insights! ${window.location.origin}/dashboard/articles`;
                navigator.clipboard.writeText(shareText);
                notification.success({
                  message: 'Copied!',
                  description: 'Share message copied to clipboard',
                  duration: 2
                });
              }}
            >
              Copy Progress Summary
            </Button>
          </Space>
        </Card>
      </div>
    </Card>
  );
};

export default RecentActivity;
export { RecentActivity };