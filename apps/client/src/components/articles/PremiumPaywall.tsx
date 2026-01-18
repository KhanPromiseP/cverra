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
  Row,
  Col,
  Tooltip,
  Avatar,
  Tag,
  Grid,
  Badge,
  message
} from 'antd';
import { 
  CrownOutlined, 
  LockOutlined, 
  CheckCircleOutlined,
  EyeOutlined,
  TeamOutlined,
  RocketOutlined,
  GiftOutlined,
  WalletOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  UserOutlined,
  HeartOutlined,
  MessageOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useAuthStore } from '@/client/stores/auth';
import { useWallet } from '../../hooks/useWallet';
import articleApi, { Article } from '../../services/articleApi';
import { CoinConfirmPopover } from '../../components/modals/coin-confirm-modal';
import { useNavigate } from 'react-router';
import { t, Trans } from "@lingui/macro"; // Added Lingui macro

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

interface PremiumPaywallProps {
  article: Article;
  visible?: boolean;
  onClose?: () => void;
  onPurchaseSuccess?: () => void;
  onPurchaseError?: (error: string) => void;
  showInline?: boolean;
  onPurchase?: () => void;
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
  const screens = useBreakpoint();
  
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

  interface ArticleWithCoinPrice extends Article {
    coinPrice?: number;
  }

  const articleWithPrice = article as ArticleWithCoinPrice;
  const coinPrice = articleWithPrice.coinPrice || calculateCoinPrice();
  const canAffordPurchase = balance >= coinPrice;

  // Generate unique transaction ID
  const generateTransactionId = (): string => {
    return `article_purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handlePurchaseArticle = async () => {
    if (!user) {
      message.error(t`Please login to purchase premium content`);
      navigate('/login');
      return;
    }

    if (!article) {
      message.error(t`Article not found`);
      return;
    }

    const affordable = await canAfford(coinPrice);
    
    if (!affordable) {
      setShowCoinPopover(true);
      return;
    }

    await processArticlePurchase();
  };

  const processArticlePurchase = async () => {
    if (!user || !article) return;

    const transactionId = generateTransactionId();
    let transactionSuccess = false;
    
    setLoading(true);

    try {
      const transactionResult = await deductCoinsWithRollback(
        coinPrice,
        t`Article Purchase - ${article.title}`,
        { 
          transactionId, 
          articleId: article.id,
          articleSlug: article.slug,
          authorId: article.author.id,
          action: 'article_purchase'
        }
      );

      if (!transactionResult.success) {
        throw new Error(t`Failed to reserve coins for article purchase`);
      }

      transactionSuccess = true;

      message.info(t`Unlocking article...`, 2);

      const purchaseResponse = await articleApi.purchaseArticle(article.id);

      if (!purchaseResponse.success && !(purchaseResponse.data?.purchased === true)) {
        throw new Error(purchaseResponse.message || t`Failed to unlock article`);
      }

      await completeTransaction(transactionId, {
        result: 'success',
        articleTitle: article.title,
        authorName: article.author.name,
        purchasedAt: new Date().toISOString()
      });

      await fetchBalance();

      message.success({
        content: (
          <div>
            <div className="font-medium dark:text-white">
              <Trans>Article unlocked successfully!</Trans>
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CrownOutlined className="mr-1" />
              <Trans>Used {coinPrice} coins • Full access granted</Trans>
            </div>
          </div>
        ),
        duration: 3000,
      });

      setShowCoinPopover(false);
      onPurchaseSuccess?.();

      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);

    } catch (error: any) {
      console.error("Article purchase failed:", error);
      
      if (transactionSuccess) {
        try {
          await refundTransaction(transactionId, error.message || t`Article purchase failed`);
          await fetchBalance();
          message.info(t`Coins refunded due to purchase failure`, 2000);
        } catch (refundError) {
          console.error('Failed to refund coins:', refundError);
        }
      }

      const errorMessage = error.response?.data?.message || error.message || t`Failed to purchase article`;
      message.error(t`Purchase failed: ${errorMessage}`, 3);

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
        message.error(t`Not enough coins`);
        setShowCoinPopover(false);
        return;
      }

      if (!article) {
        message.error(t`Article not found`);
        setShowCoinPopover(false);
        return;
      }

      await processArticlePurchase();

    } catch (error) {
      console.error("Article purchase preparation failed:", error);
      message.error(t`Failed to prepare article purchase`);
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
      message.error(t`Please login to subscribe`);
      navigate('/login');
      return;
    }

    if (onClose) {
      onClose();
    }
    
    navigate('/dashboard/pricing', { 
      state: { 
        fromArticle: article.id,
        articleTitle: article.title 
      } 
    });
    
    message.info(t`Redirecting to subscription plans...`, 1.5);
  };

  const benefits = [
    { 
      icon: <CheckCircleOutlined className="text-green-500 dark:text-green-400" />, 
      text: t`Access all premium articles`,
      premiumOnly: true
    },
    { 
      icon: <EyeOutlined className="text-blue-500 dark:text-blue-400" />, 
      text: t`No ads, distraction-free reading`,
      premiumOnly: true
    },
    { 
      icon: <TeamOutlined className="text-purple-500 dark:text-purple-400" />, 
      text: t`Exclusive community access`,
      premiumOnly: true
    },
    { 
      icon: <RocketOutlined className="text-cyan-500 dark:text-cyan-400" />, 
      text: t`Priority support`,
      premiumOnly: true
    },
    { 
      icon: <GiftOutlined className="text-pink-500 dark:text-pink-400" />, 
      text: t`Free monthly coins for subscribers`,
      premiumOnly: true
    },
  ];

  const coinPurchaseBenefits = [
    t`Unlock this specific article`,
    t`Permanent access to this article`,
    t`Directly support the author`,
    t`No subscription required`,
    t`Instant access after purchase`,
  ];

  const renderCoinPurchaseCard = () => (
    <Card
      hoverable
      className="w-full border-2 border-blue-500 dark:border-blue-400 rounded-xl shadow-md dark:shadow-gray-800 dark:bg-gray-800"
      bodyStyle={{ padding: screens.xs ? '16px' : '24px' }}
    >
      <Space direction="vertical" size="middle" className="w-full">
        <div className="text-center">
          <CrownOutlined className={`${screens.xs ? 'text-2xl' : 'text-3xl'} text-blue-500 dark:text-blue-400`} />
          <Title level={screens.xs ? 5 : 4} className="!mb-1 !mt-3 dark:text-white">
            <Trans>One-Time Purchase</Trans>
          </Title>
          <div className={screens.xs ? "mb-3" : "mb-4"}>
            <Statistic
              value={coinPrice}
              prefix={<DollarOutlined className="text-yellow-500 dark:text-yellow-400" />}
              suffix={t`coins`}
              valueStyle={{ 
                color: '#1890ff',
                fontSize: screens.xs ? '22px' : '28px',
                fontWeight: 'bold'
              }}
            />
          </div>
        </div>

        <List
          dataSource={coinPurchaseBenefits}
          renderItem={item => (
            <List.Item className="!py-1 !border-none">
              <Space size={screens.xs ? 8 : 12}>
                <CheckCircleOutlined className={`${screens.xs ? 'text-sm' : 'text-base'} text-green-500 dark:text-green-400`} />
                <Text className={`${screens.xs ? 'text-sm' : 'text-base'} dark:text-gray-200`}>{item}</Text>
              </Space>
            </List.Item>
          )}
          className={screens.xs ? "mb-3" : "mb-4"}
        />

        <div>
          <Button
            type="primary"
            block
            size={screens.xs ? "middle" : "large"}
            onClick={handlePurchaseArticle}
            loading={loading}
            disabled={!user || !article}
            icon={<WalletOutlined />}
            ref={purchaseButtonRef}
            className={` ${screens.xs ? 'h-10 text-sm' : 'h-12 text-base'} font-medium`}
          >
            {!user ? t`Login to Purchase` : 
             canAffordPurchase ? <Trans>Unlock for {coinPrice} Coins</Trans> : t`Buy Coins`}
          </Button>
          
          {user && (
            <div className={`text-center ${screens.xs ? 'mt-2' : 'mt-3'}`}>
              <Space size={4}>
                <WalletOutlined className={`${screens.xs ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`} />
                <Text type="secondary" className={`${screens.xs ? 'text-xs' : 'text-sm'} dark:text-gray-400`}>
                  <Trans>Balance:</Trans>
                </Text>
                <Text strong className={`${screens.xs ? 'text-sm' : 'text-base'} ${
                  canAffordPurchase 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-500 dark:text-red-400'
                }`}>
                  {balance} <Trans>coins</Trans>
                </Text>
                {!canAffordPurchase && (
                  <Text type="secondary" className={`${screens.xs ? 'text-xs' : 'text-sm'} dark:text-gray-400`}>
                    <Trans>(Need {coinPrice - balance} more)</Trans>
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
      className="w-full border-2 border-purple-500 dark:border-purple-400 rounded-xl shadow-md dark:shadow-gray-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900"
      bodyStyle={{ padding: screens.xs ? '16px' : '24px' }}
    >
      <Space direction="vertical" size="middle" className="w-full">
        <div className="text-center relative">
          {!screens.xs ? (
            <Badge.Ribbon text={t`Recommended`} color="purple">
              <div className="pt-6">
                <CrownOutlined className="text-3xl text-purple-500 dark:text-purple-400" />
                <Title level={4} className="!mb-1 !mt-3 dark:text-white">
                  <Trans>Premium Subscription</Trans>
                </Title>
                <div className="mb-4">
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
          ) : (
            <>
              <CrownOutlined className="text-2xl text-purple-500 dark:text-purple-400" />
              <Title level={5} className="!mb-1 !mt-2 dark:text-white">
                <Trans>Premium Subscription</Trans>
              </Title>
              <div className="mb-3">
                <Statistic
                  value={9.99}
                  prefix="$"
                  suffix="/month"
                  valueStyle={{ 
                    color: '#722ed1',
                    fontSize: '22px',
                    fontWeight: 'bold'
                  }}
                />
              </div>
              <Tag color="purple" className="mb-2 dark:bg-purple-900 dark:text-purple-100">
                <Trans>Recommended</Trans>
              </Tag>
            </>
          )}
        </div>

        <List
          dataSource={benefits}
          renderItem={(item) => (
            <List.Item className="!py-1 !border-none">
              <Space align="start" size={screens.xs ? 8 : 12}>
                {React.cloneElement(item.icon, { 
                  className: `${item.icon.props.className} ${screens.xs ? 'text-sm' : 'text-base'}`
                })}
                <div>
                  <Text className={`${screens.xs ? 'text-sm' : 'text-base'} dark:text-gray-200`}>
                    {item.text}
                  </Text>
                  {item.premiumOnly && !screens.xs && (
                    <Badge 
                      count={t`Premium`} 
                      className="ml-2 text-xs bg-purple-500 dark:bg-purple-600" 
                    />
                  )}
                  {item.premiumOnly && screens.xs && (
                    <Tag color="purple" className="ml-1 dark:bg-purple-900 dark:text-purple-100">
                      <Trans>Premium</Trans>
                    </Tag>
                  )}
                </div>
              </Space>
            </List.Item>
          )}
          className={screens.xs ? "mb-3" : "mb-4"}
        />

        <div>
          <Button
            type="primary"
            block
            size={screens.xs ? "middle" : "large"}
            onClick={handleSubscription}
            loading={loading}
            disabled={!user}
            icon={<SafetyCertificateOutlined />}
            className={`${screens.xs ? 'h-10 text-sm' : 'h-12 text-base'} font-medium bg-gradient-to-r from-purple-600 to-blue-600 border-none hover:from-purple-700 hover:to-blue-700`}
          >
            {user ? t`View Plans` : t`Login to Subscribe`}
          </Button>
        </div>
      </Space>
    </Card>
  );

  const renderArticleStats = () => (
    <Card
      className={`mt-6 dark:mt-5 rounded-xl bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700`}
      bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
    >
      <Title level={5} className={`${screens.xs ? 'mb-3' : 'mb-4'} text-center dark:text-white`}>
        <Trans>Why readers love this article</Trans>
      </Title>
      <Row gutter={[screens.xs ? 8 : 16, screens.xs ? 8 : 16]}>
        <Col xs={12} sm={6}>
          <Statistic 
            title={<span className={`${screens.xs ? 'text-xs' : 'text-sm'} dark:text-gray-400`}>
              <Trans>Reading Time</Trans>
            </span>} 
            value={article.readingTime} 
            suffix={t`min`}
            valueStyle={{ 
              color: '#1890ff',
              fontSize: screens.xs ? '18px' : '24px'
            }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic 
            title={<span className={`${screens.xs ? 'text-xs' : 'text-sm'} dark:text-gray-400`}>
              <Trans>Views</Trans>
            </span>} 
            value={article.viewCount.toLocaleString()}
            valueStyle={{ 
              color: '#52c41a',
              fontSize: screens.xs ? '18px' : '24px'
            }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic 
            title={<span className={`${screens.xs ? 'text-xs' : 'text-sm'} dark:text-gray-400`}>
              <Trans>Likes</Trans>
            </span>} 
            value={article.likeCount.toLocaleString()}
            valueStyle={{ 
              color: '#ff4d4f',
              fontSize: screens.xs ? '18px' : '24px'
            }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic 
            title={<span className={`${screens.xs ? 'text-xs' : 'text-sm'} dark:text-gray-400`}>
              <Trans>Claps</Trans>
            </span>} 
            value={article.clapCount?.toLocaleString() || '0'}
            valueStyle={{ 
              color: '#faad14',
              fontSize: screens.xs ? '18px' : '24px'
            }}
          />
        </Col>
      </Row>
    </Card>
  );

  const renderArticleInfo = () => (
    <Card
      className={`mb-6 dark:mb-5 bg-background rounded-xl`}
      bodyStyle={{ padding: screens.xs ? '12px' : '16px' }}
    >
      <Space direction="vertical" size={screens.xs ? 'small' : 'middle'} className="w-full">
        <div className={`flex items-center justify-between ${
          screens.xs ? 'flex-wrap gap-2' : 'flex-nowrap'
        }`}>
          <div className="flex items-center gap-3">
            <Avatar 
              size={screens.xs ? "default" : "large"} 
              src={article.author.picture}
              className="bg-blue-500"
            >
              {article.author.name.charAt(0)}
            </Avatar>
            <div>
              <Text strong className={`${screens.xs ? 'text-sm' : 'text-base'} dark:text-white`}>
                {article.author.name}
              </Text>
              <div className={`${screens.xs ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`}>
                <Trans>Published {new Date(article.publishedAt).toLocaleDateString()}</Trans>
              </div>
            </div>
          </div>
          <div>
            <Tag 
              color="purple" 
              icon={screens.xs ? undefined : <CrownOutlined />}
              className="dark:bg-purple-900 dark:text-purple-100"
            >
              {screens.xs ? t`Premium` : t`Premium Article`}
            </Tag>
          </div>
        </div>
        
        <Divider className={`${screens.xs ? 'my-2' : 'my-4'} dark:border-gray-600`} />
        
        <div>
          <Title level={screens.xs ? 5 : 4} className={`${screens.xs ? 'mb-1' : 'mb-2'} dark:text-white`}>
            {article.title}
          </Title>
          <Paragraph 
            type="secondary" 
            className={`${screens.xs ? 'text-sm' : 'text-base'} mb-0 line-clamp-2 dark:text-gray-300`}
          >
            {article.excerpt}
          </Paragraph>
        </div>
        
        <div className={`flex justify-between items-center ${
          screens.xs ? 'flex-wrap gap-2' : 'flex-nowrap'
        }`}>
          <Space size={screens.xs ? "small" : "middle"} wrap={screens.xs}>
            <Space size="small">
              <EyeOutlined className={`${screens.xs ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`} />
              <Text type="secondary" className={`${screens.xs ? 'text-xs' : 'text-sm'} dark:text-gray-400`}>
                {article.viewCount.toLocaleString()} <Trans>views</Trans>
              </Text>
            </Space>
            <Space size="small">
              <HeartOutlined className={`${screens.xs ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`} />
              <Text type="secondary" className={`${screens.xs ? 'text-xs' : 'text-sm'} dark:text-gray-400`}>
                {article.likeCount.toLocaleString()} <Trans>likes</Trans>
              </Text>
            </Space>
            <Space size="small">
              <MessageOutlined className={`${screens.xs ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`} />
              <Text type="secondary" className={`${screens.xs ? 'text-xs' : 'text-sm'} dark:text-gray-400`}>
                {article.commentCount} <Trans>comments</Trans>
              </Text>
            </Space>
          </Space>
          {article.availableLanguages?.length > 1 && (
            <Tooltip title={<Trans>Available in {article.availableLanguages.length} languages</Trans>}>
              <Tag 
                icon={screens.xs ? undefined : <GlobalOutlined />}
                className="dark:bg-gray-700 dark:text-gray-200"
              >
                {screens.xs ? 
                  <Trans>{article.availableLanguages.length} langs</Trans> : 
                  <Trans>{article.availableLanguages.length} languages</Trans>
                }
              </Tag>
            </Tooltip>
          )}
        </div>
      </Space>
    </Card>
  );

  const modalContent = (
    <div className="p-4 bg-background">
      <Space direction="vertical" size={screens.xs ? 'middle' : 'large'} className="w-full">
        {/* Header */}
        <div className="text-center bg-background">
          <div className={`${
            screens.xs ? 'w-12 h-12' : 'w-16 h-16'
          } rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto ${
            screens.xs ? 'mb-3' : 'mb-4'
          }`}>
            <CrownOutlined className={`${
              screens.xs ? 'text-lg' : 'text-2xl'
            } text-white`} />
          </div>
          <Title level={screens.xs ? 4 : 3} className={`${
            screens.xs ? 'mb-1' : 'mb-2'
          } dark:text-white`}>
            <Trans>Premium Article</Trans>
          </Title>
          <Paragraph 
            type="secondary" 
            className={`${screens.xs ? 'text-sm' : 'text-base'} mb-0 ${
              screens.xs ? 'px-2' : ''
            } dark:text-gray-400`}
          >
            <Trans>Unlock this premium article to continue reading</Trans>
          </Paragraph>
        </div>

        <Divider className={`${screens.xs ? 'my-2' : 'my-4'} dark:border-gray-600`} />

        {/* Article Info */}
        {renderArticleInfo()}

        {/* Purchase Options */}
        <Row gutter={[screens.xs ? 16 : 32, screens.xs ? 16 : 32]}>
          <Col xs={24} md={12}>
            {renderCoinPurchaseCard()}
          </Col>
          <Col xs={24} md={12}>
            {renderSubscriptionCard()}
          </Col>
        </Row>

        <Divider className={`${screens.xs ? 'my-2' : 'my-4'} dark:border-gray-600`} />

        {/* Article Stats */}
        {renderArticleStats()}

        {/* Additional Info */}
        <div className={`text-center ${screens.xs ? 'px-2' : ''}`}>
          <Text type="secondary" className={`${screens.xs ? 'text-xs' : 'text-sm'} dark:text-gray-400`}>
            <SafetyCertificateOutlined className={`${
              screens.xs ? 'text-xs' : 'text-sm'
            } mr-1 dark:text-gray-400`} />
            <Trans>All purchases are secure and refundable within 24 hours if unsatisfied.</Trans>
          </Text>
        </div>
      </Space>
    </div>
  );

  const subscriptionModal = (
    <Modal
      title={t`Choose a Subscription Plan`}
      open={showSubscriptionModal}
      onCancel={() => setShowSubscriptionModal(false)}
      footer={null}
      width={screens.xs ? '90%' : 400}
      centered
      className="dark:bg-gray-800 dark:text-white"
      bodyStyle={{ 
        padding: screens.xs ? '16px 12px' : '24px',
        backgroundColor: 'inherit'
      }}
    >
      <Space direction="vertical" size="large" className="w-full" style={{ 
        padding: screens.xs ? '8px 0' : '16px 0'
      }}>
        <div className="text-center">
          <CrownOutlined className={`${
            screens.xs ? 'text-4xl' : 'text-5xl'
          } text-purple-600 dark:text-purple-400`} />
          <Title level={screens.xs ? 4 : 3} className={`${
            screens.xs ? 'my-3' : 'my-4'
          } dark:text-white`}>
            <Trans>Go Premium</Trans>
          </Title>
          <Paragraph type="secondary" className={`${
            screens.xs ? 'text-sm' : 'text-base'
          } dark:text-gray-400`}>
            <Trans>Choose the plan that works best for you</Trans>
          </Paragraph>
        </div>

        <List
          dataSource={[
            t`Unlimited access to all premium articles`,
            t`Ad-free reading experience`,
            t`Exclusive content and early access`,
            t`Priority customer support`,
            t`Monthly coins allocation`
          ]}
          renderItem={item => (
            <List.Item className="!py-1.5 !border-none">
              <Space align="start" size={screens.xs ? 8 : 12}>
                <CheckCircleOutlined className={`${
                  screens.xs ? 'text-sm' : 'text-base'
                } text-green-500 dark:text-green-400`} />
                <Text className={`${
                  screens.xs ? 'text-sm' : 'text-base'
                } dark:text-gray-200`}>
                  {item}
                </Text>
              </Space>
            </List.Item>
          )}
        />

        <Button
          type="primary"
          block
          size={screens.xs ? "middle" : "large"}
          onClick={handleSubscription}
          loading={loading}
          icon={<SafetyCertificateOutlined />}
          className={`${
            screens.xs ? 'mt-3 h-10 text-sm' : 'mt-4 h-12 text-base'
          } bg-gradient-to-r from-purple-600 to-blue-600 border-none hover:from-purple-700 hover:to-blue-700`}
        >
          <Trans>View All Plans & Pricing</Trans>
        </Button>

        <div className="text-center">
          <Button
            type="link"
            onClick={() => setShowSubscriptionModal(false)}
            className={`${screens.xs ? 'text-xs' : 'text-sm'} dark:text-gray-400`}
          >
            <Trans>Maybe Later</Trans>
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
          width={screens.xs ? '95%' : 900}
          centered
          closable={true}
          maskClosable={true}
          className="dark:bg-gray-800"
          style={{ 
            top: screens.xs ? 10 : 20,
            maxHeight: screens.xs ? '90vh' : 'auto',
            overflowY: 'auto'
          }}
          bodyStyle={{ 
            padding: screens.xs ? '16px 12px' : '24px',
            maxHeight: screens.xs ? 'calc(90vh - 48px)' : 'auto',
            overflowY: 'auto',
            backgroundColor: 'inherit'
          }}
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
          title={t`Unlock Premium Article`}
          description={t`Unlock "${article.title}" by ${article.author.name} to continue reading`}
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
    <div className={`
      ${screens.xs ? 'my-6 px-4 py-6' : 'my-12 px-6 py-10'} 
      bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700
      dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
      rounded-2xl text-white relative overflow-hidden
    `}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent opacity-50" />
      
      <div className="relative z-10">
        <div className={`text-center ${
          screens.xs ? 'mb-6' : 'mb-8'
        }`}>
          <LockOutlined className={`${
            screens.xs ? 'text-4xl' : 'text-5xl'
          } text-white/90 mb-4`} />
          <h2 className={`${
            screens.xs ? 'text-2xl' : 'text-3xl'
          } font-bold text-white mb-2`}>
            <Trans>Continue Reading</Trans>
          </h2>
          <p className={`${
            screens.xs ? 'text-sm px-2' : 'text-base'
          } text-white/90`}>
            <Trans>This is a preview of the article. Unlock the full content to continue reading.</Trans>
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
            {modalContent}
          </div>
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
        title={t`Unlock Premium Article`}
        description={t`Unlock "${article.title}" by ${article.author.name} to continue reading`}
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