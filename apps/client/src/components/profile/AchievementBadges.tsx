import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  Badge, 
  Tooltip, 
  Button, 
  Modal, 
  Typography, 
  Row, 
  Col,
  Progress,
  notification,
  Avatar,
  Space,
  Tag
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

  // Mock achievements data (replace with your actual data structure)
  // const mockAchievements: Achievement[] = [
  //   {
  //     id: '1',
  //     title: 'Article Explorer',
  //     description: 'Read your first 10 articles',
  //     icon: 'book',
  //     badgeColor: '#3B82F6',
  //     progress: 8,
  //     totalRequired: 10,
  //     unlocked: false,
  //     rarity: 'COMMON',
  //     category: 'READING',
  //     points: 50,
  //     shareable: true,
  //     shareText: 'I just explored 10 amazing articles on Cverra! 📚 Check out these life-changing insights!',
  //     shareUrl: '/dashboard/articles'
  //   },
  //   {
  //     id: '2',
  //     title: 'Reading Marathon',
  //     description: 'Read for 100 hours total',
  //     icon: 'clock',
  //     badgeColor: '#10B981',
  //     progress: 75,
  //     totalRequired: 100,
  //     unlocked: false,
  //     rarity: 'RARE',
  //     category: 'READING',
  //     points: 150,
  //     shareable: true,
  //     shareText: 'Completed 100 hours of reading on Cverra! 🏃‍♂️ Knowledge is power!',
  //     shareUrl: '/dashboard/articles'
  //   },
  //   {
  //     id: '3',
  //     title: 'Community Champion',
  //     description: 'Get 50 likes on your comments',
  //     icon: 'heart',
  //     badgeColor: '#EC4899',
  //     progress: 30,
  //     totalRequired: 50,
  //     unlocked: false,
  //     rarity: 'EPIC',
  //     category: 'COMMUNITY',
  //     points: 300,
  //     shareable: true,
  //     shareText: 'Became a Community Champion on Cverra! 🤝 Join the conversation!',
  //     shareUrl: '/dashboard/articles'
  //   },
  //   {
  //     id: '4',
  //     title: 'Premium Pioneer',
  //     description: 'Subscribe to premium for 3 months',
  //     icon: 'crown',
  //     badgeColor: '#F59E0B',
  //     progress: 2,
  //     totalRequired: 3,
  //     unlocked: false,
  //     rarity: 'LEGENDARY',
  //     category: 'PREMIUM',
  //     points: 500,
  //     shareable: true,
  //     shareText: 'Unlocked Premium Pioneer status on Cverra! 👑 Exclusive content unlocked!',
  //     shareUrl: '/dashboard/subscription'
  //   },
  //   {
  //     id: '5',
  //     title: 'Trend Setter',
  //     description: 'Read 5 trending articles',
  //     icon: 'fire',
  //     badgeColor: '#EF4444',
  //     progress: 5,
  //     totalRequired: 5,
  //     unlocked: true,
  //     unlockedAt: new Date().toISOString(),
  //     rarity: 'COMMON',
  //     category: 'ENGAGEMENT',
  //     points: 100,
  //     shareable: true,
  //     shareText: 'Just became a Trend Setter on Cverra! 🔥 Reading what everyone is talking about!',
  //     shareUrl: '/dashboard/articles?filter=trending'
  //   },
  //   {
  //     id: '6',
  //     title: 'Knowledge Seeker',
  //     description: 'Read articles from 10 different categories',
  //     icon: 'compass',
  //     badgeColor: '#8B5CF6',
  //     progress: 10,
  //     totalRequired: 10,
  //     unlocked: true,
  //     unlockedAt: new Date(Date.now() - 86400000).toISOString(),
  //     rarity: 'RARE',
  //     category: 'READING',
  //     points: 200,
  //     shareable: true,
  //     shareText: 'Achieved Knowledge Seeker status on Cverra! 🌟 Exploring diverse topics daily!',
  //     shareUrl: '/dashboard/articles'
  //   },
  //   {
  //     id: '7',
  //     title: 'Weekly Warrior',
  //     description: 'Read 7 days in a row',
  //     icon: 'calendar',
  //     badgeColor: '#06B6D4',
  //     progress: 7,
  //     totalRequired: 7,
  //     unlocked: true,
  //     unlockedAt: new Date(Date.now() - 172800000).toISOString(),
  //     rarity: 'EPIC',
  //     category: 'MILESTONE',
  //     points: 350,
  //     shareable: true,
  //     shareText: 'Maintained a 7-day reading streak on Cverra! ⚔️ Consistency is key to growth!',
  //     shareUrl: '/dashboard/articles'
  //   },
  //   {
  //     id: '8',
  //     title: 'Article Connoisseur',
  //     description: 'Save 25 articles to read later',
  //     icon: 'bookmark',
  //     badgeColor: '#6366F1',
  //     progress: 18,
  //     totalRequired: 25,
  //     unlocked: false,
  //     rarity: 'COMMON',
  //     category: 'ENGAGEMENT',
  //     points: 75,
  //     shareable: true,
  //     shareText: 'Building my knowledge library on Cverra! 📖 Curating the best content!',
  //     shareUrl: '/dashboard/profile?tab=saved'
  //   }
  // ];

  // const mockStats: UserAchievementStats = {
  //   totalPoints: 1250,
  //   unlockedAchievements: 3,
  //   totalAchievements: 15,
  //   nextMilestone: {
  //     name: 'Master Reader',
  //     pointsNeeded: 250,
  //     progress: 83
  //   },
  //   topCategories: [
  //     { category: 'Reading', count: 4, color: '#3B82F6' },
  //     { category: 'Engagement', count: 3, color: '#10B981' },
  //     { category: 'Community', count: 2, color: '#EC4899' }
  //   ],
  //   recentUnlocks: mockAchievements.filter(a => a.unlocked).slice(0, 3)
  // };

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

  const generateShareUrl = (achievement?: Achievement) => {
    const baseUrl = window.location.origin;
    if (achievement) {
      return `${baseUrl}/achievement/${achievement.id}`;
    }
    return `${baseUrl}/dashboard/profile`;
  };

  const generateShareText = (achievement?: Achievement) => {
    if (achievement) {
      return `${achievement.shareText}\n\nCheck out Cverra for life-changing articles that transform your career and mindset! 🚀\n\n${generateShareUrl(achievement)}`;
    }
    // return `I've unlocked ${mockStats.unlockedAchievements} achievements with ${mockStats.totalPoints} points on Cverra! 📚\n\nJoin me in exploring amazing articles that can change your life! ✨\n\n${generateShareUrl()}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      notification.success({
        message: 'Copied!',
        description: 'Share link copied to clipboard',
        duration: 2
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareOnPlatform = (platform: string) => {
    const shareText = generateShareText(selectedAchievement || undefined);
    const shareUrl = generateShareUrl(selectedAchievement || undefined);
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      instagram: `https://www.instagram.com/`
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
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
              <Text strong>{achievement.points} pts</Text>
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

  const renderShareModal = () => (
    <Modal
      title={
        <Space>
          <ShareAltOutlined />
          {shareType === 'achievement' 
            ? `Share Achievement: ${selectedAchievement?.title}`
            : 'Share Your Achievement Profile'
          }
        </Space>
      }
      open={shareModalVisible}
      onCancel={() => setShareModalVisible(false)}
      footer={null}
      width={600}
    >
      {/* Share Preview */}
      <Card className="share-preview-card">
        <div className="share-preview">
          <div className="share-preview-header">
            <Avatar 
              size={64}
              icon={<TrophyFilled />}
              style={{ 
                backgroundColor: selectedAchievement?.badgeColor || '#3B82F6',
                marginRight: 16
              }}
            />
            <div>
              <Title level={4} className="preview-title">
                {shareType === 'achievement' 
                  ? selectedAchievement?.title
                  : 'My Cverra Achievements'
                }
              </Title>
              <Text>
                {shareType === 'achievement' 
                  ? selectedAchievement?.description : []
                  // : `Unlocked ${mockStats.unlockedAchievements} achievements with ${mockStats.totalPoints} points`
                }
              </Text>
            </div>
          </div>
          
          <div className="share-preview-body">
            <Paragraph className="share-message">
              {generateShareText(selectedAchievement || undefined)}
            </Paragraph>
            
            <div className="share-link">
              <Text code className="link-text">
                {generateShareUrl(selectedAchievement || undefined)}
              </Text>
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(generateShareUrl(selectedAchievement || undefined))}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Social Share Buttons */}
      <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
        Share on Social Media
      </Title>
      
      <Row gutter={[16, 16]} justify="center">
        <Col>
          <Button
            type="primary"
            icon={<TwitterOutlined />}
            style={{ backgroundColor: '#1DA1F2' }}
            onClick={() => shareOnPlatform('twitter')}
            size="large"
          >
            Twitter
          </Button>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<FacebookOutlined />}
            style={{ backgroundColor: '#1877F2' }}
            onClick={() => shareOnPlatform('facebook')}
            size="large"
          >
            Facebook
          </Button>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<LinkedinOutlined />}
            style={{ backgroundColor: '#0A66C2' }}
            onClick={() => shareOnPlatform('linkedin')}
            size="large"
          >
            LinkedIn
          </Button>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<WhatsAppOutlined />}
            style={{ backgroundColor: '#25D366' }}
            onClick={() => shareOnPlatform('whatsapp')}
            size="large"
          >
            WhatsApp
          </Button>
        </Col>
      </Row>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Text type="secondary">
          When people click your link, they'll be taken directly to {shareType === 'achievement' ? 'this achievement' : 'your profile'} on Cverra!
        </Text>
      </div>
    </Modal>
  );

  if (isLoading || statsLoading) {
    return (
      <Card className="achievement-badges-card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Progress type="circle" percent={0} />
          <Text>Loading achievements...</Text>
        </div>
      </Card>
    );
  }

  // Use real data with fallback to mock
const displayAchievements = achievementsData?.achievements || [];
const displayStats = statsData || [];

  return (
    <>
      <Card 
        className="achievement-badges-card"
        title={
          <Space>
            <TrophyOutlined />
            <span>Achievements & Badges</span>
            <Badge 
              count={displayStats.unlockedAchievements} 
              style={{ backgroundColor: '#10B981' }}
            />
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<ShareAltOutlined />}
            onClick={handleShareProfile}
          >
            Share Profile
          </Button>
        }
      >
        {/* Stats Summary */}
        <Row gutter={[16, 16]} className="stats-summary">
          <Col xs={24} sm={8}>
            <Card className="stat-card" size="small">
              <Space direction="vertical" align="center" style={{ width: '250px' }}>
                <TrophyFilled style={{ fontSize: 24, color: '#F59E0B' }} />
                <Text strong>{displayStats.totalPoints}</Text>
                <Text type="secondary">Total Points</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card" size="small">
              <Space direction="vertical" align="center" style={{ width: '250px' }}>
                <CheckCircleOutlined style={{ fontSize: 24, color: '#10B981' }} />
                <Text strong>{displayStats.unlockedAchievements}/{displayStats.totalAchievements}</Text>
                <Text type="secondary">Achievements</Text>
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
                <Text type="secondary">{displayStats.nextMilestone.pointsNeeded} pts to next</Text>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Category Breakdown */}
        <div style={{ marginTop: 24, marginBottom: 24 }}>
          <Title level={5}>Progress by Category</Title>
          <Row gutter={[18, 18]}>
            {displayStats.topCategories.map((cat, index) => (
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
            <Title level={5}>Recently Unlocked</Title>
            <Row gutter={[16, 16]}>
              {displayStats.recentUnlocks.map((achievement) => (
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
                        <Text type="secondary">{achievement.points} points</Text>
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
          All Achievements
        </Title>
        
        <Row gutter={[16, 16]} justify="center" className="achievements-grid">
          {displayAchievements.map(renderAchievementBadge)}
        </Row>

        {/* Legend */}
        <div className="achievement-legend"  style={{ marginTop: 24, textAlign: 'center' }}>
          <Space size="large">
            <Space>
              <div className="legend-dot common"></div>
              <Text>Common</Text>
            </Space>
            <Space>
              <div className="legend-dot rare"></div>
              <Text>Rare</Text>
            </Space>
            <Space>
              <div className="legend-dot epic"></div>
              <Text>Epic</Text>
            </Space>
            <Space>
              <div className="legend-dot legendary"></div>
              <Text>Legendary</Text>
            </Space>
          </Space>
        </div>
      </Card>

      {renderShareModal()}
    </>
  );
};

export default AchievementBadges;
export { AchievementBadges };