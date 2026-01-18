import { t, Trans } from "@lingui/macro";
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
  Progress,
  notification,
} from 'antd';

import {
  TrophyOutlined,
  ShareAltOutlined,
  StarOutlined,
  FireOutlined,
  BookOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  RocketOutlined,
  GlobalOutlined,
  EyeOutlined,
  HeartOutlined,
  TeamOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  TrophyFilled,
  CopyOutlined,
  TwitterOutlined,
  FacebookOutlined,
  LinkedinOutlined,
  WhatsAppOutlined,
  InstagramOutlined
} from '@ant-design/icons';
import { apiClient } from '@/client/services/api-client';
import './AchievementBadges.css';

const { Title, Text, Paragraph } = Typography;

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  badgeColor: string;
  progress: number;
  totalRequired: number;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  category: 'READING' | 'ENGAGEMENT' | 'COMMUNITY' | 'PREMIUM' | 'MILESTONE';
  points: number;
  shareable?: boolean;
  shareImage?: string;
  shareText?: string;
  shareUrl?: string;
}

interface UserAchievementStats {
  totalPoints: number;
  unlockedAchievements: number;
  totalAchievements: number;
  nextMilestone: {
    name: string;
    pointsNeeded: number;
    progress: number;
  };
  topCategories: Array<{
    category: string;
    count: number;
    color: string;
  }>;
  recentUnlocks: Achievement[];
}

const AchievementBadges: React.FC = () => {
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [shareType, setShareType] = useState<'achievement' | 'profile'>('achievement');
  const [copied, setCopied] = useState(false);

  // Fetch user achievements
  const { data: achievementsData, isLoading } = useQuery({
    queryKey: ['/articles/user/achievements'],
    queryFn: async () => {
      const response = await apiClient.get('/articles/user/achievements');
      return response.data;
    },
  });

  // Fetch achievement stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/articles/user/achievements/stats'],
    queryFn: async () => {
      const response = await apiClient.get('/articles/user/achievements/stats');
      return response.data;
    },
  });

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'trophy': <TrophyOutlined />,
      'star': <StarOutlined />,
      'fire': <FireOutlined />,
      'book': <BookOutlined />,
      'clock': <ClockCircleOutlined />,
      'crown': <CrownOutlined />,
      'rocket': <RocketOutlined />,
      'global': <GlobalOutlined />,
      'eye': <EyeOutlined />,
      'heart': <HeartOutlined />,
      'team': <TeamOutlined />,
      'calendar': <CalendarOutlined />,
      'thunderbolt': <ThunderboltOutlined />,
      'check': <CheckCircleOutlined />
    };
    return iconMap[iconName] || <TrophyOutlined />;
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      'COMMON': '#6B7280',
      'RARE': '#3B82F6',
      'EPIC': '#8B5CF6',
      'LEGENDARY': '#F59E0B'
    };
    return colors[rarity] || '#6B7280';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'READING': <BookOutlined />,
      'ENGAGEMENT': <FireOutlined />,
      'COMMUNITY': <TeamOutlined />,
      'PREMIUM': <CrownOutlined />,
      'MILESTONE': <TrophyOutlined />
    };
    return icons[category] || <TrophyOutlined />;
  };

  const handleShareAchievement = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShareType('achievement');
    setShareModalVisible(true);
  };

  const handleShareProfile = () => {
    setShareType('profile');
    setShareModalVisible(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      notification.success({
        message: t`Copied!`,
        description: t`Share link copied to clipboard`,
        duration: 2
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const renderAchievementBadge = (achievement: Achievement) => (
    <Col xs={12} sm={8} md={6} lg={6} xl={4} key={achievement.id}>
      <Card
        className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
        hoverable
        onClick={() => achievement.unlocked && handleShareAchievement(achievement)}
      >
        <div className="achievement-icon-wrapper">
          <div 
            className="achievement-icon"
            style={{ 
              backgroundColor: achievement.badgeColor + '20',
              borderColor: achievement.badgeColor
            }}
          >
            {getIconComponent(achievement.icon)}
          </div>
          {achievement.unlocked && (
            <Badge 
              count={<CheckCircleOutlined style={{ color: '#10B981' }} />}
              className="unlock-badge"
            />
          )}
        </div>
        
        <div className="achievement-content">
          <Text strong className="achievement-title">
            {achievement.title}
          </Text>
          <Text type="secondary" className="achievement-description">
            {achievement.description}
          </Text>
          
          <div className="achievement-meta">
            <Tag 
              color={getRarityColor(achievement.rarity)}
              className="rarity-tag"
            >
              {achievement.rarity}
            </Tag>
            <div className="achievement-points">
              <TrophyFilled style={{ color: '#F59E0B' }} />
              <Text strong>{achievement.points} {t`pts`}</Text>
            </div>
          </div>
          
          {!achievement.unlocked && (
            <div className="achievement-progress">
              <Progress 
                percent={Math.round((achievement.progress / achievement.totalRequired) * 100)}
                size="small"
                strokeColor={achievement.badgeColor}
                showInfo={false}
              />
              <Text type="secondary" className="progress-text">
                {achievement.progress}/{achievement.totalRequired}
              </Text>
            </div>
          )}
          
          {achievement.unlocked && achievement.unlockedAt && (
            <div className="unlocked-date">
              <CalendarOutlined style={{ marginRight: 4 }} />
              <Text type="secondary">
                {new Date(achievement.unlockedAt).toLocaleDateString()}
              </Text>
            </div>
          )}
        </div>
      </Card>
    </Col>
  );

  if (isLoading || statsLoading) {
    return (
      <Card className="achievement-badges-card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Progress type="circle" percent={0} />
          <Text>{t`Loading achievements...`}</Text>
        </div>
      </Card>
    );
  }

  const displayAchievements = achievementsData?.achievements || [];
  const displayStats = statsData || {
    totalPoints: 0,
    unlockedAchievements: 0,
    totalAchievements: 0,
    nextMilestone: { name: "", pointsNeeded: 0, progress: 0 },
    topCategories: [],
    recentUnlocks: []
  };

  return (
    <>
      <Card 
        className="achievement-badges-card"
        title={
          <Space>
            <TrophyOutlined />
            <span>{t`Achievements & Badges`}</span>
            <Badge 
              count={displayStats.unlockedAchievements} 
              style={{ backgroundColor: '#10B981' }}
            />
          </Space>
        }
      >
        {/* Stats Summary */}
        <Row gutter={[16, 16]} className="stats-summary">
          <Col xs={24} sm={8}>
            <Card className="stat-card" size="small">
              <Space direction="vertical" align="center" style={{ width: '250px' }}>
                <TrophyFilled style={{ fontSize: 24, color: '#F59E0B' }} />
                <Text strong>{displayStats.totalPoints}</Text>
                <Text type="secondary">{t`Total Points`}</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card" size="small">
              <Space direction="vertical" align="center" style={{ width: '250px' }}>
                <CheckCircleOutlined style={{ fontSize: 24, color: '#10B981' }} />
                <Text strong>{displayStats.unlockedAchievements}/{displayStats.totalAchievements}</Text>
                <Text type="secondary">{t`Achievements`}</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card" size="small">
              <Space direction="vertical" align="center" style={{ width: '250px' }}>
                <RocketOutlined style={{ fontSize: 24, color: '#3B82F6' }} />
                <Text strong>{displayStats.nextMilestone.name}</Text>
                <Progress 
                  percent={displayStats.nextMilestone.progress}
                  size="small"
                  showInfo={false}
                />
                <Text type="secondary">{t`${displayStats.nextMilestone.pointsNeeded} pts to next`}</Text>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Category Breakdown */}
        <div style={{ marginTop: 24, marginBottom: 24 }}>
          <Title level={5}>{t`Progress by Category`}</Title>
          <Row gutter={[18, 18]}>
            {displayStats.topCategories.map((cat: any, index: any) => (
              <Col xs={8} key={index}>
                <div className="category-item">
                  <div 
                    className="category-icon"
                    style={{ backgroundColor: cat.color + '20' }}
                  >
                    {getCategoryIcon(cat.category.toUpperCase())}
                  </div>
                  <div className="category-info">
                    <Text strong>{cat.count}</Text>
                    <Text type="secondary">{cat.category}</Text>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Recent Unlocks */}
        {displayStats.recentUnlocks.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>{t`Recently Unlocked`}</Title>
            <Row gutter={[16, 16]}>
              {displayStats.recentUnlocks.map((achievement: any) => (
                <Col xs={24} sm={12} md={8} key={achievement.id}>
                  <Card size="small" hoverable>
                    <Space>
                      <Avatar 
                        size={40}
                        style={{ 
                          backgroundColor: achievement.badgeColor,
                          color: 'white'
                        }}
                      >
                        {getIconComponent(achievement.icon)}
                      </Avatar>
                      <div>
                        <Text strong>{achievement.title}</Text>
                        <br />
                        <Text type="secondary">{achievement.points} {t`points`}</Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* All Achievements Grid */}
        <Title level={5} style={{ marginBottom: 16 }}>
          {t`All Achievements`}
        </Title>
        
        <Row gutter={[16, 16]} justify="center" className="achievements-grid">
          {displayAchievements.map(renderAchievementBadge)}
        </Row>

        {/* Legend */}
        <div className="achievement-legend" style={{ marginTop: 24, textAlign: 'center' }}>
          <Space size="large">
            <Space>
              <div className="legend-dot common"></div>
              <Text>{t`Common`}</Text>
            </Space>
            <Space>
              <div className="legend-dot rare"></div>
              <Text>{t`Rare`}</Text>
            </Space>
            <Space>
              <div className="legend-dot epic"></div>
              <Text>{t`Epic`}</Text>
            </Space>
            <Space>
              <div className="legend-dot legendary"></div>
              <Text>{t`Legendary`}</Text>
            </Space>
          </Space>
        </div>
      </Card>
    </>
  );
};

export default AchievementBadges;
export { AchievementBadges };