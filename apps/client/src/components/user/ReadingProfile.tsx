// components/user/ReadingProfile.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Space, 
  Progress, 
  Tag, 
  Row, 
  Col,
  Button,
  Statistic,
  List,
  Avatar,
  Badge
} from 'antd';
import { 
  BookOutlined, 
  ClockCircleOutlined,
  FireOutlined,
  StarOutlined,
  TrophyOutlined,
  CalendarOutlined,
  EyeOutlined,
  HeartOutlined,
  CommentOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { getReadingProfile, getReadingHistory, getUserAchievements } from '../../services/article.service';

const { Title, Text, Paragraph } = Typography;

const ReadingProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileData, historyData, achievementsData] = await Promise.all([
        getReadingProfile(),
        getReadingHistory(),
        getUserAchievements(),
      ]);
      setProfile(profileData);
      setHistory(historyData);
      setAchievements(achievementsData);
    } catch (error) {
      console.error('Failed to load reading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card style={{ textAlign: 'center', padding: '48px 0' }}>
        <Title level={4}>Please login to view your reading profile</Title>
      </Card>
    );
  }

  if (loading) {
    return <Card loading />;
  }

  const stats = [
    {
      title: 'Articles Read',
      value: profile?.articlesRead || 0,
      icon: <BookOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Reading Streak',
      value: profile?.readingStreak || 0,
      icon: <FireOutlined />,
      color: '#ff4d4f',
      suffix: 'days',
    },
    {
      title: 'Total Reading Time',
      value: Math.round((profile?.totalReadingTime || 0) / 60),
      icon: <ClockCircleOutlined />,
      color: '#52c41a',
      suffix: 'hours',
    },
    {
      title: 'Achievements',
      value: achievements?.length || 0,
      icon: <TrophyOutlined />,
      color: '#faad14',
    },
  ];

  const favoriteCategories = profile?.favoriteCategories || [];
  const readingGoals = profile?.readingGoals || {};

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        Your Reading Journey
      </Title>

      {/* Stats Overview */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                suffix={stat.suffix}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]}>
        {/* Reading Progress */}
        <Col xs={24} lg={16}>
          <Card title="Reading Progress" style={{ height: '100%' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>
                  This Week's Goal
                </Text>
                <Progress
                  percent={Math.round((profile?.weeklyProgress || 0) * 100)}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <Text type="secondary" style={{ fontSize: '12px', marginTop: 4 }}>
                  {profile?.weeklyProgress || 0} of {readingGoals.weekly || 5} articles
                </Text>
              </div>

              <div>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>
                  Favorite Categories
                </Text>
                <Space wrap>
                  {favoriteCategories.map((category: any) => (
                    <Tag 
                      key={category.id}
                      color={category.color}
                      style={{ padding: '4px 12px', fontSize: '14px' }}
                    >
                      {category.name}
                    </Tag>
                  ))}
                </Space>
              </div>

              <div>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>
                  Recent Reading History
                </Text>
                <List
                  dataSource={history.slice(0, 5)}
                  renderItem={(item: any) => (
                    <List.Item
                      actions={[
                        <Text type="secondary">{item.progress}% read</Text>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <a href={`/article/${item.article.slug}`}>
                            {item.article.title}
                          </a>
                        }
                        description={
                          <Space>
                            <ClockCircleOutlined style={{ fontSize: '12px' }} />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {new Date(item.lastReadAt).toLocaleDateString()}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            </Space>
          </Card>
        </Col>

        {/* Achievements */}
        <Col xs={24} lg={8}>
          <Card title="Achievements" style={{ height: '100%' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <List
                dataSource={achievements.slice(0, 5)}
                renderItem={(achievement: any) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Badge count={achievement.points} offset={[-8, 8]}>
                          <Avatar
                            size="large"
                            src={achievement.icon}
                            style={{ backgroundColor: '#faad14' }}
                          >
                            <TrophyOutlined />
                          </Avatar>
                        </Badge>
                      }
                      title={achievement.name}
                      description={
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {achievement.description}
                        </Text>
                      }
                    />
                    {achievement.completedAt && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(achievement.completedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </List.Item>
                )}
              />

              <div style={{ textAlign: 'center' }}>
                <Button type="link" onClick={() => window.location.href = '/achievements'}>
                  View All Achievements
                </Button>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Reading Goals */}
      {readingGoals && (
        <Card title="Reading Goals" style={{ marginTop: 24 }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card size="small">
                <Statistic
                  title="Daily Goal"
                  value={readingGoals.daily || 3}
                  prefix={<CalendarOutlined />}
                  suffix="articles/day"
                />
                <Progress
                  percent={Math.round((profile?.dailyProgress || 0) / (readingGoals.daily || 3) * 100)}
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small">
                <Statistic
                  title="Weekly Goal"
                  value={readingGoals.weekly || 15}
                  prefix={<CalendarOutlined />}
                  suffix="articles/week"
                />
                <Progress
                  percent={Math.round((profile?.weeklyProgress || 0) / (readingGoals.weekly || 15) * 100)}
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small">
                <Statistic
                  title="Monthly Goal"
                  value={readingGoals.monthly || 60}
                  prefix={<CalendarOutlined />}
                  suffix="articles/month"
                />
                <Progress
                  percent={Math.round((profile?.monthlyProgress || 0) / (readingGoals.monthly || 60) * 100)}
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default ReadingProfile;