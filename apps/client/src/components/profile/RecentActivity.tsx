import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { t, Trans } from "@lingui/macro";
import {
  Card,
  List,
  Avatar,
  Typography,
  Tag,
  Button,
  Space,
  Empty,
  Badge,
  Divider,
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
  HistoryOutlined,
  ReadOutlined,
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
  const { data: readingStatsData, isLoading: statsLoading } = useQuery<ReadingStats>({
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
      'VIEW': t`viewed`,
      'LIKE': t`liked`,
      'SAVE': t`saved`,
      'COMMENT': t`commented on`,
      'ACHIEVEMENT': t`unlocked achievement`,
      'SHARE': t`shared`,
      'READING_SESSION': t`read`
    };
    return verbs[type] || t`interacted with`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t`Just now`;
    if (diffMins < 60) return t`{diffMins, plural, one {# minute ago} other {# minutes ago}}`;
    if (diffHours < 24) return t`{diffHours, plural, one {# hour ago} other {# hours ago}}`;
    if (diffDays < 7) return t`{diffDays, plural, one {# day ago} other {# days ago}}`;
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
                    ? <Trans>Unlocked: {activity.achievement?.title}</Trans>
                    : <Trans>{getActivityVerb(activity.type)} {activity.article?.title}</Trans>
                  }
                </Text>
                <Text type="secondary" className="activity-time">
                  {formatTimeAgo(activity.timestamp)}
                </Text>
              </div>
              
              {activity.type === 'READING_SESSION' && activity.duration && (
                <div className="activity-duration">
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  <Text type="secondary">
                    <Trans>{activity.duration} minutes</Trans>
                  </Text>
                </div>
              )}
              
              {activity.type === 'ACHIEVEMENT' && (
                <div className="achievement-details">
                  <Tag color="gold" style={{ marginRight: 8 }}>
                    <Trans>+{activity.achievement?.points} points</Trans>
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
                <Trans>Read Again</Trans>
              </Button>
            )}
            <Button
              type="text"
              size="small"
              onClick={() => toggleExpand(activity.id)}
            >
              {isExpanded ? t`Show Less` : t`Show More`}
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
          <Text>{t`Loading activity...`}</Text>
        </div>
      </Card>
    );
  }

  // Use real data with fallback to mock
  const displayActivities = activitiesData || [];
  const displayStats = readingStatsData || {
    today: {
      articlesRead: 0,
      readingTime: 0,
      likesGiven: 0,
      commentsMade: 0
    },
    week: {
      streakDays: 0,
      totalArticles: 0,
      totalTime: 0,
      progress: 0
    },
    topCategories: []
  };

  const activityFilters = [
    { key: 'all', label: t`All Activity`, icon: <HistoryOutlined /> },
    { key: 'READING_SESSION', label: t`Reading`, icon: <ReadOutlined /> },
    { key: 'LIKE', label: t`Likes`, icon: <HeartOutlined /> },
    { key: 'COMMENT', label: t`Comments`, icon: <CommentOutlined /> },
    { key: 'SAVE', label: t`Saves`, icon: <BookOutlined /> },
    { key: 'ACHIEVEMENT', label: t`Achievements`, icon: <TrophyOutlined /> }
  ];

  return (
    <Card 
      className="recent-activity-card"
      title={
        <Space>
          <HistoryOutlined />
          <span>{t`Recent Activity`}</span>
          <Badge 
            count={displayActivities.length} 
            style={{ backgroundColor: '#3B82F6' }}
          />
        </Space>
      }
    >
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
        {filteredActivities && filteredActivities.length > 0 ? (
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
                <Text>{t`No activity found for this filter`}</Text>
                <br />
                <Button 
                  type="link" 
                  onClick={() => setActiveFilter('all')}
                >
                  {t`View all activity`}
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
            <Text strong>{t`Top Categories This Week`}</Text>
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
    </Card>
  );
};

export default RecentActivity;
export { RecentActivity };