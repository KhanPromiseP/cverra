// components/articles/PremiumPaywall.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  Modal, 
  Card, 
  Button, 
  Typography, 
  Space, 
  Divider, 
  Avatar,
  Tag,
  Grid,
  message,
  Rate,
  Spin
} from 'antd';
import { 
  CrownOutlined, 
  LockOutlined, 
  CheckCircleOutlined,
  EyeOutlined,
  WalletOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  StarOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  ArrowRightOutlined,
  CreditCardOutlined,
  MobileOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { useAuthStore } from '@/client/stores/auth';
import { useWallet } from '../../hooks/useWallet';
import articleApi, { Article } from '../../services/articleApi';
import { CoinConfirmPopover } from '../../components/modals/coin-confirm-modal';
import { useNavigate } from 'react-router';
import { t, Trans } from "@lingui/macro";
import api from '@/client/api/axios';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

interface PremiumPaywallProps {
  article: Article;
  visible?: boolean;
  onClose?: () => void;
  onPurchaseSuccess?: () => void;
  onPurchaseError?: (error: string) => void;
  showInline?: boolean;
}

interface PaymentProvider {
  id: string;
  name: string;
  icon: typeof CreditCardOutlined | typeof MobileOutlined;
  description: string;
  popular?: boolean;
  color: string;
  darkColor: string;
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
    canAfford, 
    deductCoinsWithRollback, 
    completeTransaction, 
    refundTransaction, 
    fetchBalance 
  } = useWallet(userId || '');
  
  const [loading, setLoading] = useState<string | null>(null);
  const [showCoinPopover, setShowCoinPopover] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'subscription' | 'coins'>('coins');
  const purchaseButtonRef = useRef<HTMLButtonElement>(null);
  
  // Calculate coin price dynamically based on reading time
  const coinPrice = (article as any).coinPrice || Math.max(10, Math.floor(article.readingTime * 2));
  const canAffordPurchase = balance >= coinPrice;

  // Payment providers with enhanced dark mode colors
  const paymentProviders: PaymentProvider[] = [
    {
      id: 'STRIPE',
      name: 'Stripe',
      icon: CreditCardOutlined,
      description: 'Credit/Debit cards, Apple Pay, Google Pay',
      popular: true,
      color: 'from-blue-500 to-blue-600',
      darkColor: 'dark:from-blue-600 dark:to-blue-700'
    },
    {
      id: 'TRANZAK',
      name: 'Tranzak',
      icon: MobileOutlined,
      description: 'Mobile money, UBA, Local payments',
      color: 'from-green-500 to-emerald-600',
      darkColor: 'dark:from-green-600 dark:to-emerald-700'
    }
  ];

  const generateTransactionId = (): string => {
    return `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleCoinPurchase = async () => {
    console.log('🔹 handleCoinPurchase called');
    console.log('🔹 User:', user);
    console.log('🔹 Coin price:', coinPrice);
    console.log('🔹 Current balance:', balance);
    
    if (!user) {
      console.log('🔹 No user, redirecting to login');
      message.error(t`Please login to purchase`);
      navigate('/login');
      return;
    }

    // Show loading state on the button
    setLoading('checking');
    
    try {
      console.log('🔹 Checking if can afford:', coinPrice);
      const affordable = await canAfford(coinPrice);
      console.log('🔹 Can afford?', affordable);
      
      if (!affordable) {
        console.log('🔹 Cannot afford, showing coin popover');
        setShowCoinPopover(true);
        setLoading(null);
        return;
      }

      console.log('🔹 Can afford, processing coin payment');
      await processCoinPayment();
    } catch (error) {
      console.error('🔹 Error checking affordability:', error);
      setLoading(null);
      message.error(t`Failed to check balance`);
    }
  };

  const processCoinPayment = async () => {
    if (!user || !article) return;

    const transactionId = generateTransactionId();
    let transactionSuccess = false;
    
    setLoading('coin');

    try {
      // Step 1: Reserve coins
      console.log('🔹 Reserving coins with transaction ID:', transactionId);
      const transactionResult = await deductCoinsWithRollback(
        coinPrice,
        t`Purchase - ${article.title}`,
        { transactionId, articleId: article.id }
      );

      if (!transactionResult.success) {
        throw new Error(t`Failed to reserve coins`);
      }

      transactionSuccess = true;
      message.info(t`Processing payment...`, 2);

      // Step 2: Unlock the article
      console.log('🔹 Calling purchaseArticle API for article:', article.id);
      const purchaseResponse = await articleApi.purchaseArticle(article.id);
      console.log('🔹 Purchase response:', purchaseResponse);
      
      // Get the actual response data
      const responseData = purchaseResponse.data;
      console.log('🔹 Response data:', responseData);

      // Check if purchase was successful
      let purchaseSuccessful = false;
      
      if (responseData && typeof responseData === 'object') {
        if ('success' in responseData && responseData.success === true) {
          purchaseSuccessful = true;
          console.log('✅ Purchase successful based on root success flag');
        }
        else if ('data' in responseData && 
                 responseData.data && 
                 typeof responseData.data === 'object' && 
                 'purchased' in responseData.data && 
                 responseData.data.purchased === true) {
          purchaseSuccessful = true;
          console.log('✅ Purchase successful based on data.purchased flag');
        }
      }

      if (!purchaseSuccessful) {
        console.error('❌ Purchase failed - response:', responseData);
        
        let errorMessage = t`Failed to unlock article`;
        if (responseData && typeof responseData === 'object') {
          if ('message' in responseData && responseData.message) {
            errorMessage = String(responseData.message);
          } else if ('error' in responseData && responseData.error) {
            errorMessage = String(responseData.error);
          }
        }
        
        throw new Error(errorMessage);
      }

      // Step 3: Complete the transaction
      console.log('✅ Purchase successful, completing transaction');
      await completeTransaction(transactionId, { 
        result: 'success'
      });
      
      // Step 4: Refresh balance
      await fetchBalance();

      // Show success message
      message.success({
        content: (
          <div>
            <div className="font-medium">
              <Trans>Article unlocked successfully!</Trans>
            </div>
            <div className="text-xs text-green-600">
              <Trans>Used {coinPrice} coins</Trans>
            </div>
          </div>
        ),
        duration: 3,
      });

      // Call parent success callback
      if (onPurchaseSuccess) {
        onPurchaseSuccess();
      }

      // Close modals
      setShowPaymentModal(false);
      setShowCoinPopover(false);
      
      // Close paywall after short delay
      setTimeout(() => {
        if (onClose) onClose();
        setLoading(null);
      }, 1500);

    } catch (error: any) {
      console.error("❌ Purchase failed:", error);
      
      // Handle insufficient balance error specifically
      if (error.response?.data?.message?.includes('Insufficient balance') || 
          error.message?.includes('Insufficient balance')) {
        console.log('🔹 Insufficient balance, showing coin popover');
        setShowCoinPopover(true);
        setLoading(null);
        return;
      }
      
      // ONLY refund if we had successfully reserved coins BUT the purchase failed for other reasons
      if (transactionSuccess) {
        console.log('🔹 Refunding transaction:', transactionId);
        await refundTransaction(transactionId, error.message);
        await fetchBalance();
        message.info(t`Coins refunded`, 2);
      }

      const errorMessage = error.response?.data?.message || error.message || t`Purchase failed`;
      message.error(errorMessage);
      if (onPurchaseError) onPurchaseError(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  // Handle buying coins through payment gateway
  const handleBuyCoinsThroughGateway = async (providerId: string) => {
    if (!user) {
      message.error(t`Please login to purchase coins`);
      navigate('/login');
      return;
    }

    setLoading(providerId);

    try {
      const shortage = coinPrice - balance;
      const usdAmountNeeded = Math.ceil((shortage / 10) * 100) / 100;
      const minimumAmount = Math.max(usdAmountNeeded, 1.00);

      const response = await api.post('/payments/initiate', {
        userId: user.id,
        amount: parseFloat(minimumAmount.toFixed(2)),
        provider: providerId,
        currency: 'USD',
        metadata: {
          type: 'COIN_PURCHASE',
          coins: shortage,
          returnToArticle: article.slug
        },
        returnUrl: `${window.location.origin}/dashboard/article/${article.slug}?coin_purchase=success`,
        cancelUrl: `${window.location.origin}/dashboard/article/${article.slug}?coin_purchase=cancelled`
      });

      const redirectUrl = response.data.redirectUrl || response.data.initiation?.redirectUrl;
      
      if (redirectUrl) {
        message.info(t`Redirecting to payment gateway...`, 2);
        
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1500);
        return;
      }

      throw new Error(t`Failed to initiate payment`);

    } catch (error: any) {
      console.error('Payment initiation error:', error);
      
      const errorMessage = error.response?.data?.message || error.message || t`Payment failed. Please try again.`;
      message.error(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const handleSubscriptionRedirect = () => {
    if (!user) {
      message.error(t`Please login to subscribe`);
      navigate('/login');
      return;
    }

    // Save article context for return after subscription
    sessionStorage.setItem('returnToArticle', article.slug);
    sessionStorage.setItem('purchaseIntent', 'subscription');
    
    // Close paywall and redirect to pricing
    onClose?.();
    navigate('/dashboard/pricing', { 
      state: { 
        fromArticle: article.slug,
        articleTitle: article.title 
      } 
    });
  };

  const confirmCoinPurchase = async () => {
    setLoading('confirm');
    try {
      const affordable = await canAfford(coinPrice);
      if (!affordable) {
        message.error(t`Not enough coins`);
        setShowCoinPopover(false);
        setLoading(null);
        return;
      }
      setShowCoinPopover(false);
      await processCoinPayment();
    } catch (error) {
      console.error('Error in confirmCoinPurchase:', error);
      setLoading(null);
    }
  };

  const handleBuyCoins = (subscribe?: boolean) => {
    setShowCoinPopover(false);
    onClose?.();
    
    if (subscribe) {
      // Redirect to subscription page
      navigate('/dashboard/pricing', { 
        state: { 
          fromArticle: article.slug,
          action: 'subscribe',
          requiredCoins: coinPrice,
          currentBalance: balance
        } 
      });
    } else {
      // Open payment modal to buy coins
      setShowPaymentModal(true);
    }
  };

  // Check for return from payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const purchaseStatus = urlParams.get('purchase');
    const coinPurchaseStatus = urlParams.get('coin_purchase');
    
    if (purchaseStatus === 'success') {
      const pendingTx = sessionStorage.getItem('pendingTransaction');
      if (pendingTx) {
        const tx = JSON.parse(pendingTx);
        
        // Complete the purchase
        articleApi.purchaseArticle(tx.articleId)
          .then(() => {
            message.success(t`Article unlocked!`);
            if (onPurchaseSuccess) onPurchaseSuccess();
            sessionStorage.removeItem('pendingTransaction');
            
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
          })
          .catch(console.error);
      }
    } else if (purchaseStatus === 'cancelled') {
      message.info(t`Purchase cancelled`);
      sessionStorage.removeItem('pendingTransaction');
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Handle coin purchase return
    if (coinPurchaseStatus === 'success') {
      message.success(t`Coins purchased successfully! You can now unlock the article.`);
      // Refresh balance
      fetchBalance();
      window.history.replaceState({}, '', window.location.pathname);
      
      // Re-check if user can now afford the article
      setTimeout(async () => {
        const affordable = await canAfford(coinPrice);
        if (affordable) {
          message.info(t`You now have enough coins to unlock this article.`);
        }
      }, 1000);
      
    } else if (coinPurchaseStatus === 'cancelled') {
      message.info(t`Coin purchase cancelled`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Payment Modal - For buying coins
  const PaymentModal = () => (
    <Modal
      title={null}
      open={showPaymentModal}
      onCancel={() => setShowPaymentModal(false)}
      footer={null}
      width={450}
      centered
      closeIcon={<CloseOutlined className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />}
      className="dark:bg-gray-800"
      styles={{
        content: {
          backgroundColor: 'inherit',
          padding: 0,
          overflow: 'hidden'
        }
      }}
      maskClosable={true}
      keyboard={true}
      destroyOnClose={false}
    >
      <div className="bg-white dark:bg-gray-800">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-700 dark:to-blue-700 p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <WalletOutlined className="text-white text-2xl" />
          </div>
          <Title level={4} className="!mb-1 text-white">
            {t`Buy Coins`}
          </Title>
          <Text className="text-white/80 text-sm">
            {t`Purchase coins to unlock this article`}
          </Text>
        </div>

        {/* Purchase Summary */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <Text className="text-gray-600 dark:text-gray-400">{t`You need`}</Text>
              <Text strong className="text-lg text-blue-600 dark:text-blue-400">
                {coinPrice - balance} coins
              </Text>
            </div>
            <div className="flex justify-between items-center">
              <Text className="text-gray-600 dark:text-gray-400">{t`Your balance`}</Text>
              <Text className={balance >= coinPrice ? 'text-green-600' : 'text-red-500'}>
                {balance} coins
              </Text>
            </div>
            <Divider className="my-3" />
            <div className="flex justify-between items-center">
              <Text strong>{t`Total to pay`}</Text>
              <Text strong className="text-lg">
                ${Math.max(Math.ceil(((coinPrice - balance) / 10) * 100) / 100, 1.00).toFixed(2)}
              </Text>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="p-5 space-y-4">
          {paymentProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleBuyCoinsThroughGateway(provider.id)}
              disabled={loading === provider.id}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                provider.popular
                  ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
              } ${loading === provider.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${provider.color} ${provider.darkColor} flex items-center justify-center`}>
                    {React.createElement(provider.icon, { className: 'text-white text-lg' })}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      {provider.name}
                      {provider.popular && (
                        <Tag color="purple" className="text-xs m-0 dark:bg-purple-900 dark:text-purple-100">
                          Popular
                        </Tag>
                      )}
                    </div>
                    <Text type="secondary" className="text-xs">
                      {provider.description}
                    </Text>
                  </div>
                </div>
                {loading === provider.id ? (
                  <Spin indicator={<LoadingOutlined spin />} size="small" />
                ) : (
                  <ArrowRightOutlined className="text-gray-400 dark:text-gray-500" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 text-center border-t border-gray-100 dark:border-gray-700">
          <Text type="secondary" className="text-xs flex items-center justify-center gap-1">
            <SafetyCertificateOutlined className="text-green-500 dark:text-green-400" />
            <Trans>Secure payment • Instant delivery</Trans>
          </Text>
        </div>
      </div>
    </Modal>
  );

  // Inline version (compact, dark mode optimized)
  const renderInline = () => (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border-2 border-purple-200 dark:border-purple-800 overflow-hidden shadow-lg dark:shadow-purple-900/10">
      {/* Header */}
      <div className="p-4 text-center border-b border-purple-100 dark:border-purple-900">
        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 flex items-center justify-center shadow-md">
          <CrownOutlined className="text-white text-base" />
        </div>
        <Title level={5} className="!mb-0 text-gray-900 dark:text-white">
          {t`Premium Article`}
        </Title>
        <Text type="secondary" className="text-xs dark:text-gray-400">
          {t`Unlock full access`}
        </Text>
      </div>

      {/* Review Stats - Compact */}
      {article.reviewStats && article.reviewStats.totalReviews > 0 && (
        <div className="px-4 py-2 bg-white/50 dark:bg-gray-900/50 border-b border-purple-100 dark:border-purple-900">
          <div className="flex items-center justify-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <StarOutlined className="text-yellow-500 dark:text-yellow-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {article.reviewStats.averageRating.toFixed(1)}
              </span>
            </div>
            <Divider type="vertical" className="bg-purple-200 dark:bg-purple-800" />
            <span className="text-gray-600 dark:text-gray-400">
              {article.reviewStats.totalReviews} {t`reviews`}
            </span>
            <Divider type="vertical" className="bg-purple-200 dark:bg-purple-800" />
            <span className="text-gray-600 dark:text-gray-400">
              <ClockCircleOutlined className="mr-1" />{article.readingTime}m
            </span>
          </div>
        </div>
      )}

      {/* Options */}
      <div className="p-4 space-y-3">
        {/* Coin Purchase Option */}
        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <WalletOutlined className="text-blue-600 dark:text-blue-400 text-sm" />
            </div>
            <div>
              <Text strong className="text-sm dark:text-white">{t`One-time`}</Text>
              <Text type="secondary" className="text-xs block dark:text-gray-400">
                {t`Permanent access`}
              </Text>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Text strong className="text-blue-600 dark:text-blue-400 text-sm">
              <Trans>{coinPrice} coins</Trans>
            </Text>
            <Button 
              type="primary"
              size="small"
              onClick={handleCoinPurchase}
              loading={loading === 'coin' || loading === 'checking'}
              icon={loading === 'checking' ? <LoadingOutlined /> : null}
              ref={purchaseButtonRef}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 text-xs h-7 px-3 dark:from-blue-600 dark:to-blue-700"
              disabled={loading !== null}
            >
              {loading === 'checking' ? t`Checking...` : (user ? t`Unlock` : t`Login`)}
            </Button>
          </div>
        </div>

        {/* Subscription Option */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-600 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <CrownOutlined className="text-purple-600 dark:text-purple-400 text-sm" />
            </div>
            <div>
              <Text strong className="text-sm dark:text-white">{t`Subscribe`}</Text>
              <Text type="secondary" className="text-xs block dark:text-gray-400">
                {t`All premium articles`}
              </Text>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Text strong className="text-purple-600 dark:text-purple-400 text-sm">
              {t`$9.99/month`}
            </Text>
            <Button 
              size="small"
              onClick={handleSubscriptionRedirect}
              className="text-xs h-7 px-3 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30"
            >
              {t`View`}
            </Button>
          </div>
        </div>

        {/* Balance info */}
        {user && (
          <div className="text-center mt-2">
            <Text type="secondary" className="text-xs dark:text-gray-400">
              <WalletOutlined className="mr-1" />
              {t`Balance:`} 
              <span className={canAffordPurchase ? 'text-green-600 dark:text-green-400 font-medium ml-1' : 'text-red-500 dark:text-red-400 font-medium ml-1'}>
                {balance} coins
              </span>
              {!canAffordPurchase && (
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => setShowPaymentModal(true)} 
                  className="text-xs ml-2 p-0 h-auto text-purple-600 dark:text-purple-400"
                  disabled={loading !== null}
                >
                  {t`Buy coins`}
                </Button>
              )}
            </Text>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 text-center">
        <Text type="secondary" className="text-xs dark:text-gray-500 flex items-center justify-center gap-1">
          <SafetyCertificateOutlined className="text-green-500 dark:text-green-400" />
          {t`24-hour refund guarantee`}
        </Text>
      </div>
    </div>
  );

  if (showInline) {
    return (
      <>
        {renderInline()}
        <PaymentModal />
        <CoinConfirmPopover
          open={showCoinPopover}
          onClose={() => setShowCoinPopover(false)}
          required={coinPrice}
          balance={balance}
          onConfirm={confirmCoinPurchase}
          onBuyCoins={handleBuyCoins}
          title={t`Unlock Premium Article`}
          description={t`Unlock "${article.title}" for ${coinPrice} coins`}
          actionType="premium"
          triggerRef={purchaseButtonRef}
          userId={userId}
          metadata={{
            template: article.category?.name,
            templateName: article.category?.name,
            languageName: article.language || 'en',
            cost: coinPrice,
            action: 'purchase_article'
          }}
        />
      </>
    );
  }

  // Modal version
  return (
    <>
      <Modal
        title={null}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={450}
        centered
        closeIcon={<CloseOutlined className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />}
        className="dark:bg-gray-800"
        styles={{
          content: {
            backgroundColor: 'inherit',
            padding: 0,
            overflow: 'hidden'
          }
        }}
      >
        <div className="bg-white dark:bg-gray-800">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-700 dark:to-blue-700 p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <CrownOutlined className="text-white text-2xl" />
            </div>
            <Title level={4} className="!mb-1 text-white">{t`Premium Article`}</Title>
            <Text className="text-white/80 text-sm">{t`Unlock to continue reading`}</Text>
          </div>

          {/* Article Preview */}
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Avatar 
                size={48} 
                src={article.author.picture} 
                icon={<UserOutlined />}
                className="border-2 border-purple-200 dark:border-purple-800"
              >
                {article.author.name.charAt(0)}
              </Avatar>
              <div className="flex-1 min-w-0">
                <Text strong className="text-base block truncate dark:text-white">
                  {article.title}
                </Text>
                <Text type="secondary" className="text-xs">by {article.author.name}</Text>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm">
              <div className="flex items-center gap-1">
                <EyeOutlined className="text-blue-500 dark:text-blue-400" />
                <span className="dark:text-gray-300">{article.viewCount}</span>
              </div>
              <Divider type="vertical" className="bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-1">
                <StarOutlined className="text-yellow-500 dark:text-yellow-400" />
                <span className="dark:text-gray-300">
                  {article.reviewStats?.averageRating.toFixed(1) || '0'} ({article.reviewStats?.totalReviews || 0})
                </span>
              </div>
              <Divider type="vertical" className="bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-1">
                <ClockCircleOutlined className="text-amber-500 dark:text-amber-400" />
                <span className="dark:text-gray-300">{article.readingTime} min</span>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="px-5 pb-5 space-y-3">
            {/* Coin Purchase */}
            <button
              onClick={handleCoinPurchase}
              disabled={loading !== null}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                loading !== null 
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50' 
                  : 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center`}>
                    {loading === 'coin' || loading === 'checking' ? (
                      <Spin indicator={<LoadingOutlined spin />} className="text-white" />
                    ) : (
                      <WalletOutlined className="text-white text-lg" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {loading === 'checking' ? t`Checking Balance...` : 
                       loading === 'coin' ? t`Processing...` : 
                       t`Pay with Coins`}
                    </div>
                    <Text type="secondary" className="text-xs">
                      {coinPrice} coins • {t`Permanent access`}
                    </Text>
                  </div>
                </div>
                {loading === null && (
                  <ArrowRightOutlined className="text-blue-600 dark:text-blue-400" />
                )}
              </div>
            </button>

            {/* Subscription */}
            <button
              onClick={handleSubscriptionRedirect}
              disabled={loading !== null}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                loading !== null
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                  : 'border-purple-500 dark:border-purple-400 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 dark:from-purple-600 dark:to-blue-600 flex items-center justify-center">
                    <CrownOutlined className="text-white text-lg" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      {t`Subscribe`}
                      <Tag color="purple" className="text-xs m-0 dark:bg-purple-900 dark:text-purple-100">
                        Recommended
                      </Tag>
                    </div>
                    <Text type="secondary" className="text-xs">
                      $9.99/month • {t`All premium articles`}
                    </Text>
                  </div>
                </div>
                {loading === null && (
                  <ArrowRightOutlined className="text-purple-600 dark:text-purple-400" />
                )}
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 text-center border-t border-gray-100 dark:border-gray-700">
            <Text type="secondary" className="text-xs flex items-center justify-center gap-1">
              <SafetyCertificateOutlined className="text-green-500 dark:text-green-400" />
              <Trans>Secure payment • Instant access</Trans>
            </Text>
            {user && (
              <Text type="secondary" className="text-xs mt-2 block">
                <WalletOutlined className="mr-1" />
                {t`Your balance:`} <span className={canAffordPurchase ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-500 dark:text-red-400'}>
                  {balance} coins
                </span>
              </Text>
            )}
          </div>
        </div>
      </Modal>

      <PaymentModal />

      <CoinConfirmPopover
        open={showCoinPopover}
        onClose={() => setShowCoinPopover(false)}
        required={coinPrice}
        balance={balance}
        onConfirm={confirmCoinPurchase}
        onBuyCoins={handleBuyCoins}
        title={t`Unlock Premium Article`}
        description={t`Unlock "${article.title}" for ${coinPrice} coins`}
        actionType="premium"
        triggerRef={purchaseButtonRef}
        userId={userId}
        metadata={{
          template: article.category?.name,
          templateName: article.category?.name,
          languageName: article.language || 'en',
          cost: coinPrice,
          action: 'purchase_article'
        }}
      />
    </>
  );
};

export default PremiumPaywall;