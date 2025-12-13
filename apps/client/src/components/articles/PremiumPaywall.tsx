// components/articles/PremiumPaywall.tsx
import React, { useState, useRef } from 'react';
import { 
  Modal, 
  Card, 
  Button, 
  Typography, 
  Space, 
  List, 
  Divider, 
  Statistic,
  Progress,
  message,
  Badge,
  Alert,
  Row,
  Col,
  Tooltip,
  Avatar,
  Tag
} from 'antd';
import { 
  CrownOutlined, 
  LockOutlined, 
  CheckCircleOutlined,
  StarOutlined,
  EyeOutlined,
  TeamOutlined,
  RocketOutlined,
  GiftOutlined,
  WalletOutlined,
  CreditCardOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  LoadingOutlined,
  UserOutlined,
  ReadOutlined,
  HeartOutlined,
  MessageOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useAuthStore } from '@/client/stores/auth';
import { useWallet } from '../../hooks/useWallet';
import articleApi, { Article } from '../../services/articleApi';
import { CoinConfirmPopover } from '../../components/modals/coin-confirm-modal';
import { useNavigate } from 'react-router';

const { Title, Text, Paragraph } = Typography;

interface PremiumPaywallProps {
  article: Article;
  visible?: boolean;
  onClose?: () => void;
  onPurchaseSuccess?: () => void;
  onPurchaseError?: (error: string) => void;
  showInline?: boolean;
}

const PremiumPaywall: React.FC<PremiumPaywallProps> = ({
  article,
  visible = false,
  onClose,
  onPurchaseSuccess,
  onPurchaseError,
  showInline = false,
}) => {
  const { user } = useAuthStore();
  const userId = user?.id;
  const navigate = useNavigate();
  const { 
    balance, 
    isLoading: walletLoading, 
    canAfford, 
    deductCoinsWithRollback, 
    completeTransaction, 
    refundTransaction, 
    fetchBalance 
  } = useWallet(userId || '');
  
  const [loading, setLoading] = useState(false);
  const [showCoinPopover, setShowCoinPopover] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const purchaseButtonRef = useRef<HTMLButtonElement>(null);
  
  // Calculate coin price based on article metrics
  const calculateCoinPrice = (): number => {
    const basePrice = 10;
    const readingTimeMultiplier = Math.max(1, Math.floor(article.readingTime / 5));
    const popularityMultiplier = Math.min(3, Math.log10(article.viewCount + 1));
    const premiumMultiplier = article.accessType === 'PREMIUM' ? 1.5 : 1;
    
    return Math.round(basePrice * readingTimeMultiplier * popularityMultiplier * premiumMultiplier);
  };

  const coinPrice = article.coinPrice || calculateCoinPrice();
  const canAffordPurchase = balance >= coinPrice;

  // Generate unique transaction ID
  const generateTransactionId = (): string => {
    return `article_purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handlePurchaseArticle = async () => {
    if (!user) {
      message.error('Please login to purchase premium content');
      navigate('/login');
      return;
    }

    if (!article) {
      message.error('Article not found');
      return;
    }

    // First check if user can afford
    const affordable = await canAfford(coinPrice);
    
    if (!affordable) {
      setShowCoinPopover(true);
      return;
    }

    // Purchase immediately if user can afford
    await processArticlePurchase();
  };

  const processArticlePurchase = async () => {
    if (!user || !article) return;

    const transactionId = generateTransactionId();
    let transactionSuccess = false;
    
    setLoading(true);

    try {
      // Step 1: Reserve coins
      const transactionResult = await deductCoinsWithRollback(
        coinPrice,
        `Article Purchase - ${article.title}`,
        { 
          transactionId, 
          articleId: article.id,
          articleSlug: article.slug,
          authorId: article.author.id,
          action: 'article_purchase'
        }
      );

      if (!transactionResult.success) {
        throw new Error('Failed to reserve coins for article purchase');
      }

      transactionSuccess = true;

      // Step 2: Show loading message
      message.info('Unlocking article...', 2);

      // Step 3: Purchase article using articleApi
      console.log('Calling purchase endpoint for article:', article.id);
      const purchaseResponse = await articleApi.purchaseArticle(article.id);

      console.log('Purchase response:', purchaseResponse);

      // Accept success OR if response has data.purchased = true
      if (!purchaseResponse.success && !(purchaseResponse.data?.purchased === true)) {
        throw new Error(purchaseResponse.message || 'Failed to unlock article');
      }

      console.log('Purchase successful, proceeding...');

      // Step 4: Mark transaction as completed
      await completeTransaction(transactionId, {
        result: 'success',
        articleTitle: article.title,
        authorName: article.author.name,
        purchasedAt: new Date().toISOString()
      });

      // Refresh wallet balance
      await fetchBalance();

      // Show success message
      message.success({
        content: (
          <div>
            <div className="font-medium">Article unlocked successfully!</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <CrownOutlined className="mr-1" />
              Used {coinPrice} coins • Full access granted
            </div>
          </div>
        ),
        duration: 3000,
      });

      setShowCoinPopover(false);

      // Notify parent component
      onPurchaseSuccess?.();

      // Auto-close after success
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);

    } catch (error: any) {
      console.error("Article purchase failed:", error);
      
      // Step 5: Refund coins if transaction was successful
      if (transactionSuccess) {
        try {
          await refundTransaction(transactionId, error.message || 'Article purchase failed');
          await fetchBalance();
          console.log(`Refunded ${coinPrice} coins`);
          
          message.info('Coins refunded due to purchase failure', 2000);
        } catch (refundError) {
          console.error('Failed to refund coins:', refundError);
        }
      }

      const errorMessage = error.response?.data?.message || error.message || 'Failed to purchase article';
      message.error('Purchase failed: ' + errorMessage, {
        duration: 3000,
      });

      onPurchaseError?.(errorMessage);
      setShowCoinPopover(false);
    } finally {
      setLoading(false);
    }
  };

  const confirmArticlePurchase = async () => {
    try {
      const affordable = await canAfford(coinPrice);

      if (!affordable) {
        message.error("Not enough coins");
        setShowCoinPopover(false);
        return;
      }

      if (!article) {
        message.error("Article not found");
        setShowCoinPopover(false);
        return;
      }

      await processArticlePurchase();

    } catch (error) {
      console.error("Article purchase preparation failed:", error);
      message.error("Failed to prepare article purchase");
      setShowCoinPopover(false);
    }
  };

  const handleBuyCoins = (goSubscription = false) => {
    setShowCoinPopover(false);
    if (goSubscription) {
      navigate("/dashboard/pricing");
    } else {
      navigate(`/dashboard/coins?needed=${coinPrice - balance}`);
    }
  };

  const handleSubscription = () => {
  if (!user) {
    message.error('Please login to subscribe');
    navigate('/login');
    return;
  }

  // Close the paywall modal
  if (onClose) {
    onClose();
  }
  
  // Redirect to pricing/subscription page
  navigate('/dashboard/pricing', { 
    state: { 
      fromArticle: article.id,
      articleTitle: article.title 
    } 
  });
  
  // Optional: Show a message
  message.info('Redirecting to subscription plans...', 1.5);
};

  const benefits = [
    { 
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />, 
      text: 'Access all premium articles',
      premiumOnly: true
    },
  
    { 
      icon: <EyeOutlined style={{ color: '#1890ff' }} />, 
      text: 'No ads, distraction-free reading',
      premiumOnly: true
    },
    { 
      icon: <TeamOutlined style={{ color: '#722ed1' }} />, 
      text: 'Exclusive community access',
      premiumOnly: true
    },
    { 
      icon: <RocketOutlined style={{ color: '#13c2c2' }} />, 
      text: 'Priority support',
      premiumOnly: true
    },
    { 
      icon: <GiftOutlined style={{ color: '#eb2f96' }} />, 
      text: 'Free monthly coins for subscribers',
      premiumOnly: true
    },
  ];

  const coinPurchaseBenefits = [
    'Unlock this specific article',
    'Permanent access to this article',
    'Directly support the author',
    'No subscription required',
    'Instant access after purchase',
  ];

  const renderCoinPurchaseCard = () => (
    <Card
      hoverable
      style={{ 
        width: '100%',
        borderColor: '#1890ff',
        borderWidth: 2,
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(24, 144, 255, 0.1)'
      }}
      styles={{ padding: 24 }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <CrownOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
          <Title level={4} style={{ margin: '12px 0 4px' }}>
            One-Time Purchase
          </Title>
          <div style={{ marginBottom: 16 }}>
            <Statistic
              value={coinPrice}
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
              suffix="coins"
              valueStyle={{ 
                color: '#1890ff',
                fontSize: '28px',
                fontWeight: 'bold'
              }}
            />
          </div>
        </div>

        <List
          dataSource={coinPurchaseBenefits}
          renderItem={item => (
            <List.Item style={{ padding: '8px 0', border: 'none' }}>
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <Text>{item}</Text>
              </Space>
            </List.Item>
          )}
          style={{ marginBottom: 16 }}
        />

        <div>
          <Button
            type="primary"
            block
            size="large"
            onClick={handlePurchaseArticle}
            loading={loading}
            disabled={!user || !article}
            icon={<WalletOutlined />}
            ref={purchaseButtonRef}
            style={{ 
              height: '48px',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            {!user ? 'Login to Purchase' : 
             canAffordPurchase ? `Unlock for ${coinPrice} Coins` : 'Buy Coins to Unlock'}
          </Button>
          
          {user && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <Space size={4}>
                <WalletOutlined style={{ color: '#666' }} />
                <Text type="secondary">Balance:</Text>
                <Text strong style={{ 
                  color: canAffordPurchase ? '#52c41a' : '#ff4d4f',
                  fontSize: '15px'
                }}>
                  {balance} coins
                </Text>
                {!canAffordPurchase && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    (Need {coinPrice - balance} more)
                  </Text>
                )}
              </Space>
            </div>
          )}
        </div>
      </Space>
    </Card>
  );

  const renderSubscriptionCard = () => (
    <Card
      hoverable
      style={{ 
        width: '100%',
        borderColor: '#722ed1',
        borderWidth: 2,
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(114, 46, 209, 0.1)',
        background: 'linear-gradient(135deg, #f9f0ff 0%, #f0f5ff 100%)'
      }}
      styles={{ padding: 24 }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <Badge.Ribbon text="Recommended" color="purple">
            <div style={{ paddingTop: 24 }}>
              <CrownOutlined style={{ fontSize: '32px', color: '#722ed1' }} />
              <Title level={4} style={{ margin: '12px 0 4px' }}>
                Premium Subscription
              </Title>
              <div style={{ marginBottom: 16 }}>
                <Statistic
                  value={9.99}
                  prefix="$"
                  suffix="/month"
                  valueStyle={{ 
                    color: '#722ed1',
                    fontSize: '28px',
                    fontWeight: 'bold'
                  }}
                />
              </div>
            </div>
          </Badge.Ribbon>
        </div>

        <List
          dataSource={benefits}
          renderItem={(item, index) => (
            <List.Item style={{ padding: '8px 0', border: 'none' }}>
              <Space align="start">
                {item.icon}
                <div>
                  <Text>{item.text}</Text>
                  {item.premiumOnly && (
                    <Badge 
                      count="Premium" 
                      style={{ 
                        marginLeft: 8,
                        backgroundColor: '#722ed1',
                        fontSize: '10px'
                      }} 
                    />
                  )}
                </div>
              </Space>
            </List.Item>
          )}
          style={{ marginBottom: 16 }}
        />

        <div>
          <Button
            type="primary"
            block
            size="large"
            onClick={handleSubscription}  // Changed from setShowSubscriptionModal(true)
            loading={loading}
            disabled={!user}
            icon={<SafetyCertificateOutlined />}
            style={{ 
              height: '48px',
              fontSize: '16px',
              fontWeight: '500',
              background: 'linear-gradient(135deg, #722ed1 0%, #1890ff 100%)',
              border: 'none',
            }}
          >
            {user ? 'View Subscription Plans' : 'Login to Subscribe'} 
          </Button>
     
        </div>
      </Space>
    </Card>
  );

  const renderArticleStats = () => (
    <Card
      style={{ 
        marginTop: 24,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%)'
      }}
      styles={{ padding: 16 }}
    >
      <Title level={5} style={{ marginBottom: 16, textAlign: 'center' }}>
        Why readers love this article
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Statistic 
            title="Reading Time" 
            value={article.readingTime} 
            suffix="min"
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic 
            title="Views" 
            value={article.viewCount.toLocaleString()}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic 
            title="Likes" 
            value={article.likeCount.toLocaleString()}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic 
            title="Claps" 
            value={article.clapCount?.toLocaleString() || '0'}
            valueStyle={{ color: '#faad14' }}
          />
        </Col>
      </Row>
    </Card>
  );

  const renderArticleInfo = () => (
    <Card
      style={{ 
        marginBottom: 24,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #fff7e6 0%, #fff1f0 100%)'
      }}
      styles={{ padding: 16 }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar 
              size="large" 
              src={article.author.picture}
              style={{ backgroundColor: '#1890ff' }}
            >
              {article.author.name.charAt(0)}
            </Avatar>
            <div>
              <Text strong style={{ fontSize: '16px' }}>{article.author.name}</Text>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Published {new Date(article.publishedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div>
            <Tag color="purple" icon={<CrownOutlined />}>
              Premium Article
            </Tag>
          </div>
        </div>
        
        <Divider />
        
        <div>
          <Title level={4} style={{ marginBottom: 8 }}>{article.title}</Title>
          <Paragraph type="secondary">{article.excerpt}</Paragraph>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="middle">
            <Space size="small">
              <EyeOutlined style={{ color: '#666' }} />
              <Text type="secondary">{article.viewCount.toLocaleString()} views</Text>
            </Space>
            <Space size="small">
              <HeartOutlined style={{ color: '#666' }} />
              <Text type="secondary">{article.likeCount.toLocaleString()} likes</Text>
            </Space>
            <Space size="small">
              <MessageOutlined style={{ color: '#666' }} />
              <Text type="secondary">{article.commentCount} comments</Text>
            </Space>
          </Space>
          {article.availableLanguages?.length > 1 && (
            <Tooltip title={`Available in ${article.availableLanguages.length} languages`}>
              <Tag icon={<GlobalOutlined />}>{article.availableLanguages.length} languages</Tag>
            </Tooltip>
          )}
        </div>
      </Space>
    </Card>
  );

  const modalContent = (
    <div style={{ padding: '8px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #722ed1 0%, #1890ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <CrownOutlined style={{ fontSize: '32px', color: 'white' }} />
          </div>
          <Title level={3} style={{ marginBottom: 8 }}>
            Premium Article
          </Title>
          <Paragraph type="secondary" style={{ fontSize: '16px', marginBottom: 0 }}>
            Unlock this premium article to continue reading
          </Paragraph>
        </div>

        <Divider />

        {/* Article Info */}
        {renderArticleInfo()}

        {/* Purchase Options */}
        <Row gutter={[32, 32]}>
          <Col xs={24} md={12}>
            {renderCoinPurchaseCard()}
          </Col>
          <Col xs={24} md={12}>
            {renderSubscriptionCard()}
          </Col>
        </Row>

        <Divider />

        {/* Article Stats */}
        {renderArticleStats()}

        {/* Additional Info */}
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            <SafetyCertificateOutlined style={{ marginRight: 4 }} />
            All purchases are secure and refundable within 24 hours if unsatisfied.
          </Text>
        </div>
      </Space>
    </div>
  );

  // Subscription Modal
  // Optional: Simplified subscription modal
const subscriptionModal = (
  <Modal
    title="Choose a Subscription Plan"
    open={showSubscriptionModal}
    onCancel={() => setShowSubscriptionModal(false)}
    footer={null}
    width={400}
    centered
  >
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '16px 0' }}>
      <div style={{ textAlign: 'center' }}>
        <CrownOutlined style={{ fontSize: '48px', color: '#722ed1' }} />
        <Title level={3} style={{ margin: '16px 0 8px' }}>
          Go Premium
        </Title>
        <Paragraph type="secondary">
          Choose the plan that works best for you
        </Paragraph>
      </div>

      <List
        dataSource={[
          'Unlimited access to all premium articles',
          'Ad-free reading experience',
          'Exclusive content and early access',
          'Priority customer support',
          'Monthly coins allocation'
        ]}
        renderItem={item => (
          <List.Item style={{ padding: '8px 0', border: 'none' }}>
            <Space align="start">
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text>{item}</Text>
            </Space>
          </List.Item>
        )}
      />

      <Button
        type="primary"
        block
        size="large"
        onClick={handleSubscription}
        loading={loading}
        icon={<SafetyCertificateOutlined />}
        style={{ 
          marginTop: '16px',
          background: 'linear-gradient(135deg, #722ed1 0%, #1890ff 100%)',
          border: 'none',
          height: '48px',
          fontSize: '16px'
        }}
      >
        View All Plans & Pricing
      </Button>

      <div style={{ textAlign: 'center' }}>
        <Button
          type="link"
          onClick={() => setShowSubscriptionModal(false)}
        >
          Maybe Later
        </Button>
      </div>
    </Space>
  </Modal>
);

  if (onClose) {
    return (
      <>
        <Modal
          title={null}
          open={visible}
          onCancel={onClose}
          footer={null}
          width={900}
          centered
          closable={true}
          maskClosable={true}
          style={{ top: 20 }}
          styles={{ padding: '24px' }}
        >
          {modalContent}
        </Modal>

        {/* Coin Confirm Popover */}
        <CoinConfirmPopover
          open={showCoinPopover}
          onClose={() => setShowCoinPopover(false)}
          required={coinPrice}
          balance={balance}
          onConfirm={confirmArticlePurchase}
          onBuyCoins={handleBuyCoins}
          title="Unlock Premium Article"
          description={`Unlock "${article.title}" by ${article.author.name} to continue reading`}
          actionType="premium"
          triggerRef={purchaseButtonRef}
          userId={userId}
        />

        {/* Subscription Modal */}
        {subscriptionModal}
      </>
    );
  }

  // Inline version for article preview
  return (
    <div style={{
      margin: '48px 0',
      padding: '40px 24px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <LockOutlined style={{ fontSize: '48px', color: 'white', marginBottom: 16 }} />
          <Title level={2} style={{ color: 'white', marginBottom: 8 }}>
            Continue Reading
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
            This is a preview of the article. Unlock the full content to continue reading.
          </Paragraph>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {modalContent}
        </div>
      </div>

      {/* Coin Confirm Popover for inline version */}
      <CoinConfirmPopover
        open={showCoinPopover}
        onClose={() => setShowCoinPopover(false)}
        required={coinPrice}
        balance={balance}
        onConfirm={confirmArticlePurchase}
        onBuyCoins={handleBuyCoins}
        title="Unlock Premium Article"
        description={`Unlock "${article.title}" by ${article.author.name} to continue reading`}
        actionType="premium"
        triggerRef={purchaseButtonRef}
        userId={userId}
      />

      {/* Subscription Modal for inline version */}
      {subscriptionModal}
    </div>
  );
};

export default PremiumPaywall;