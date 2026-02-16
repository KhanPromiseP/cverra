import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '@/client/api/axios';
import { useWallet } from '@/client/hooks/useWallet';
import { toast } from 'sonner';
import { useUser } from '@/client/services/user';
import { 
  CheckIcon, 
  StarIcon, 
  ShieldCheckIcon, 
  CurrencyDollarIcon, 
  CreditCardIcon, 
  DevicePhoneMobileIcon, 
  XMarkIcon,
  PlusIcon,
  BanknotesIcon,
  ArrowRightIcon,
  LockClosedIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { InformationCircleIcon, ExclamationTriangleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface Plan {
  id: string;
  name: string;
  coins: number;
  price: number | string;
  interval: 'MONTHLY' | 'YEARLY';
  description?: string;
  features?: string[];
  popular?: boolean;
  usdPrice?: number | string;
}

interface PaymentProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  supportedMethods: string[];
  currencies: string[];
  popular?: boolean;
}

interface UserSubscription {
  id: string;
  status: 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PENDING';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: Plan;
}

export const SubscriptionPage = () => {
  const { user } = useUser();
  const userId = user?.id;
  const { balance, fetchBalance } = useWallet(userId || '');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [fetchingPlans, setFetchingPlans] = useState(true);
  const [fetchingSubscription, setFetchingSubscription] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBuyCoinsModal, setShowBuyCoinsModal] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [calculatedCoins, setCalculatedCoins] = useState<number>(0);
  const [coinBreakdown, setCoinBreakdown] = useState<any>(null);
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Payment providers configuration - ONLY STRIPE AND TRANZAK
  const paymentProviders: PaymentProvider[] = [
    {
      id: 'STRIPE',
      name: 'Stripe',
      description: 'Pay with credit/debit cards, Apple Pay, Google Pay',
      icon: CreditCardIcon,
      supportedMethods: ['Credit Cards', 'Debit Cards', 'Apple Pay', 'Google Pay', 'Bank Transfers'],
      currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      popular: true
    },
    {
      id: 'TRANZAK',
      name: 'Tranzak',
      description: 'Mobile money and local payment methods',
      icon: DevicePhoneMobileIcon,
      supportedMethods: ['Mobile Money', 'UBA', 'Visa/Mastercard'],
      currencies: ['XAF', 'USD', 'EUR'],
      popular: true
    }
  ];

  // Quick amount buttons for coin purchases
  const quickAmounts = [5, 10, 20, 50, 100];

  useEffect(() => {
    fetchPlans();
    
    if (userId) {
      fetchUserSubscription();
      fetchCoinBreakdown();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      const interval = setInterval(() => {
        fetchBalance();
        fetchUserSubscription();
        fetchCoinBreakdown();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchPlans = async () => {
    setFetchingPlans(true);
    try {
      const res = await api.get('/subscriptions/plans');
      
      let plansData: Plan[] = [];
      
      if (Array.isArray(res.data)) {
        plansData = res.data;
      } else if (Array.isArray(res.data.data)) {
        plansData = res.data.data;
      } else if (Array.isArray(res.data.plans)) {
        plansData = res.data.plans;
      } else {
        console.warn('Unexpected response structure:', res.data);
        plansData = [];
      }
      
      const enhancedPlans = plansData.map((plan: Plan, index: number) => {
        const price = typeof plan.price === 'string' ? parseFloat(plan.price) : Number(plan.price);
        const coins = typeof plan.coins === 'number' ? plan.coins : parseInt(plan.coins as any);
        
        const baseFeatures = [
          `${coins.toLocaleString()} coins per ${plan.interval.toLowerCase()}`,
          '50% better value than regular purchases',
          'Instant coin delivery',
          'Priority support',
          'Cancel anytime',
          plan.interval === 'MONTHLY' ? 'Monthly billing' : 'Annual billing (2 months free)',
          ...(plan.features || [])
        ];

        if (plan.interval === 'YEARLY') {
          baseFeatures.push('Best value - Save with annual billing');
        }
        
        return {
          ...plan,
          price,
          coins,
          usdPrice: price,
          features: baseFeatures,
          popular: index === 1
        };
      });
      
      setPlans(enhancedPlans);
    } catch (err) {
      console.error('Failed to fetch plans', err);
      toast.error('Failed to load subscription plans');
    } finally {
      setFetchingPlans(false);
    }
  };

  const fetchCoinBreakdown = async () => {
    if (!userId) return;
    
    try {
      const res = await api.get(`/wallet/enhanced-balance?userId=${userId}`);
      setCoinBreakdown(res.data);
    } catch (err) {
      console.error('Failed to fetch coin breakdown', err);
    }
  };

  const fetchUserSubscription = async () => {
    if (!userId) return;
    
    setFetchingSubscription(true);
    try {
      const res = await api.get('/subscriptions/my-subscription');
      setUserSubscription(res.data);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error('Failed to fetch user subscription', err);
      }
      setUserSubscription(null);
    } finally {
      setFetchingSubscription(false);
    }
  };

  // Calculate coins based on amount (1 USD = 10 coins)
  const calculateCoins = (amount: number) => {
    return Math.floor(amount * 10);
  };

  // Handle custom amount input
  const handleAmountChange = (value: string) => {
    setCustomAmount(value);
    const amount = parseFloat(value) || 0;
    setCalculatedCoins(calculateCoins(amount));
  };

  // Handle subscription payment
  const handlePayment = async (provider: string) => {
    if (!selectedPlan || !userId) {
      toast.error('Please select a plan and ensure you are logged in');
      return;
    }

    setLoading(provider);
    try {
      const endpoint = userSubscription?.status === 'ACTIVE' 
        ? '/subscriptions/change-plan' 
        : '/subscriptions/subscribe';

      const res = await api.post(endpoint, {
        userId,
        planId: selectedPlan.id,
        provider: provider
      });

      console.log('Subscription response:', res.data);

      const redirectUrl = res.data.redirectUrl || res.data.initiation?.redirectUrl;
      
      if (redirectUrl) {
        toast.info(`Redirecting to ${provider}...`);
        window.location.href = redirectUrl;
        return;
      }

      if (res.data.status === 'success') {
        const action = userSubscription ? 'changed' : 'activated';
        toast.success(`🎉 Subscription ${action}! ${res.data.coinsGranted} coins added to your wallet`);
        await fetchBalance();
        await fetchUserSubscription();
        setShowPaymentModal(false);
        setSelectedPlan(null);
      } else if (res.data.status === 'pending') {
        toast.info('Subscription processing started. You will receive your coins shortly.');
        setShowPaymentModal(false);
        setSelectedPlan(null);
      }

    } catch (err: any) {
      console.error('Subscription error:', err);
      
      if (err.response) {
        if (err.response.data?.message?.includes('ENOTFOUND') || err.response.data?.message?.includes('tranzak')) {
          toast.error('Payment service temporarily unavailable. Please try again later.');
          return;
        }
      }
      
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error 
        || `Subscription failed: ${err.message}`;
      
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  // Handle coin purchase
  const handleCoinPurchase = async (provider: string, amount?: number) => {
    const purchaseAmount = amount || parseFloat(customAmount);
    
    if (!purchaseAmount || purchaseAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!userId) {
      toast.error('Please log in to purchase coins');
      return;
    }

    setLoading(provider);
    try {
      const res = await api.post('/payments/initiate', {
        userId,
        amount: purchaseAmount,
        provider: provider,
        currency: 'USD',
        metadata: {
          type: 'COIN_PURCHASE',
          coins: calculateCoins(purchaseAmount)
        }
      });

      console.log('Coin purchase response:', res.data);

      const redirectUrl = res.data.redirectUrl || res.data.initiation?.redirectUrl;
      
      if (redirectUrl) {
        toast.info(`Redirecting to ${provider}...`);
        window.location.href = redirectUrl;
        return;
      }

      if (res.data.status === 'success') {
        toast.success(`🎉 Purchase completed! ${calculateCoins(purchaseAmount)} coins added to your wallet`);
        await fetchBalance();
        await fetchCoinBreakdown();
        setShowBuyCoinsModal(false);
        setCustomAmount('');
      } else if (res.data.status === 'pending') {
        toast.info('Payment processing started. You will receive your coins shortly.');
        setShowBuyCoinsModal(false);
        setCustomAmount('');
      }

    } catch (err: any) {
      console.error('Coin purchase error:', err);
      
      if (err.response) {
        if (err.response.data?.message?.includes('ENOTFOUND') || err.response.data?.message?.includes('tranzak')) {
          toast.error('Payment service temporarily unavailable. Please try again later.');
          return;
        }
      }
      
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error 
        || `Purchase failed: ${err.message}`;
      
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const handleSubscribeClick = (plan: Plan) => {
    if (!userId) {
      setSelectedPlan(plan);
      setShowLoginPrompt(true);
      return;
    }

    // Allow switching plans if user has active subscription
    if (userSubscription && userSubscription.status === 'ACTIVE') {
      if (userSubscription.plan.id === plan.id) {
        toast.info('You are already subscribed to this plan');
        return;
      }
      // Show upgrade/downgrade confirmation
      if (!window.confirm(`Switch from ${userSubscription.plan.name} to ${plan.name}? Your subscription will be updated immediately.`)) {
        return;
      }
    }

    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleCancelSubscription = async () => {
    if (!userSubscription || !userId) return;

    if (!window.confirm('Are you sure you want to cancel your subscription? You will keep your current coins but won\'t receive future payments.')) {
      return;
    }

    try {
      await api.delete(`/subscriptions/cancel/${userSubscription.id}`, {
        data: { userId }
      });
      toast.success('Subscription will be canceled at the end of the billing period');
      await fetchUserSubscription();
    } catch (err: any) {
      console.error('Cancel subscription error:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  const getPriceDisplay = (plan: Plan) => {
    let price: number;
    
    if (typeof plan.price === 'string') {
      price = parseFloat(plan.price);
    } else if (typeof plan.price === 'number') {
      price = plan.price;
    } else {
      price = 0;
    }
    
    if (isNaN(price)) {
      console.warn('Invalid price value:', plan.price);
      return '$0.00';
    }
    
    return `$${price.toFixed(2)}/${plan.interval === 'MONTHLY' ? 'month' : 'year'}`;
  };

  const getCoinValue = (coins: number) => {
    const coinsNumber = typeof coins === 'number' ? coins : parseInt(coins as any) || 0;
    return `${coinsNumber.toLocaleString()} coins`;
  };

  const getSavingsPercentage = (plan: Plan, allPlans: Plan[]) => {
    if (plan.interval === 'YEARLY') {
      const monthlyPlan = allPlans.find(p => p.name === plan.name && p.interval === 'MONTHLY');
      if (monthlyPlan) {
        const monthlyPrice = typeof monthlyPlan.price === 'string' ? parseFloat(monthlyPlan.price) : monthlyPlan.price;
        const yearlyPrice = typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price;
        
        const monthlyEquivalent = yearlyPrice / 12;
        const savings = ((monthlyPrice - monthlyEquivalent) / monthlyPrice) * 100;
        return Math.round(savings);
      }
    }
    return 0;
  };

  // Login Prompt Modal
  const LoginPromptModal = () => {
    // Determine if it's for a subscription plan or direct coin purchase
    const isForSubscription = !!selectedPlan;
    const isForCoinPurchase = !selectedPlan && showLoginPrompt;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {isForSubscription ? 'Sign In to Subscribe' : 'Sign In to Buy Coins'}
            </h3>
            <button
              onClick={() => {
                setShowLoginPrompt(false);
                setSelectedPlan(null);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <LockClosedIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {isForSubscription ? 'Sign in to subscribe' : 'Sign in to purchase coins'}
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                {isForSubscription 
                  ? `You need to create an account or sign in to subscribe to ${selectedPlan?.name}`
                  : 'You need to create an account or sign in to purchase coins'
                }
              </p>
            </div>

            {/* Preview Section */}
            {isForSubscription && selectedPlan ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">{selectedPlan.name}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getPriceDisplay(selectedPlan)} • {getCoinValue(selectedPlan.coins)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {getCoinValue(selectedPlan.coins)}
                    </p>
                  </div>
                </div>
              </div>
            ) : isForCoinPurchase && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <BanknotesIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <h5 className="font-medium text-gray-900 dark:text-white">Direct Coin Purchase</h5>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Buy coins instantly and use them for all premium features
                  </p>
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                    Choose any amount from ${quickAmounts[0]} to ${quickAmounts[quickAmounts.length - 1]}
                  </div>
                </div>
              </div>
            )}

            {/* Login/Register Options */}
            <div className="space-y-3">
              <Link
                to="/auth/login"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                onClick={() => setShowLoginPrompt(false)}
              >
                <UserCircleIcon className="h-5 w-5" />
                Sign In to Existing Account
              </Link>
              
              <Link
                to="/auth/register"
                className="block w-full bg-green-600 hover:bg-green-700 text-white text-center font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                onClick={() => setShowLoginPrompt(false)}
              >
                <PlusIcon className="h-5 w-5" />
                Create New Account
              </Link>
              
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  setSelectedPlan(null);
                  // If it's for coin purchase, show the coin purchase modal after login/register
                  if (isForCoinPurchase) {
                    // You can store this intent in state or localStorage
                    localStorage.setItem('pendingAction', 'buyCoins');
                  }
                }}
                className="block w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-center font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {isForSubscription ? 'Continue Browsing Plans' : 'Continue Browsing'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Buy Coins Modal Component
  const BuyCoinsModal = () => {
    if (!userId) {
      setShowBuyCoinsModal(false);
      setShowLoginPrompt(true);
      return null;
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Purchase Coins
            </h3>
            <button
              onClick={() => {
                setShowBuyCoinsModal(false);
                setCustomAmount('');
                setCalculatedCoins(0);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Amount Selection */}
          <div className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Enter Amount (USD)
              </label>
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleAmountChange(amount.toString())}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      customAmount === amount.toString()
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="relative mb-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400">$</span>
                </div>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="Enter custom amount"
                  className="block w-full pl-8 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  min="1"
                  step="0.01"
                />
              </div>

              {/* Minimum amount hint */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Minimum amount: $1.00
              </p>

              {/* Validation Error Message */}
              {!customAmount || parseFloat(customAmount) <= 0 ? (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Please enter an amount above $0 to proceed with payment
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Coin Calculation Display */}
              {calculatedCoins > 0 && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700 animate-fadeIn">
                  <div className="text-center">
                    <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                      You'll receive
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {calculatedCoins.toLocaleString()} coins
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ${customAmount} = {calculatedCoins} coins
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Providers */}
            <div className="space-y-3">
              {paymentProviders.map((provider) => {
                const isDisabled = !customAmount || parseFloat(customAmount) <= 0;
                
                return (
                  <div
                    key={provider.id}
                    className={`border-2 rounded-xl p-4 transition-all duration-200 ${
                      isDisabled 
                        ? 'opacity-60 cursor-not-allowed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                        : `cursor-pointer ${
                            provider.popular 
                              ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`
                    }`}
                    onClick={() => {
                      if (isDisabled) {
                        // Show shake animation for feedback
                        const element = document.activeElement;
                        if (element) {
                          element.classList.add('shake-animation');
                          setTimeout(() => {
                            element.classList.remove('shake-animation');
                          }, 500);
                        }
                        
                        // Focus on the input field
                        const input = document.querySelector('input[type="number"]');
                        if (input) {
                          (input as HTMLInputElement).focus();
                        }
                        
                        // Show toast notification
                        toast.info('Please enter an amount first', {
                          icon: '💰',
                          duration: 3000,
                        });
                        return;
                      }
                      handleCoinPurchase(provider.id);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isDisabled 
                            ? 'bg-gray-100 dark:bg-gray-700 opacity-60'
                            : provider.popular 
                              ? 'bg-blue-100 dark:bg-blue-800' 
                              : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <provider.icon className={`h-6 w-6 ${
                            isDisabled 
                              ? 'text-gray-400 dark:text-gray-500'
                              : provider.popular 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-600 dark:text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <h5 className={`font-semibold ${
                            isDisabled ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                          }`}>
                            {provider.name}
                            {provider.popular && !isDisabled && (
                              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                                Popular
                              </span>
                            )}
                          </h5>
                          <p className={`text-sm mt-1 ${
                            isDisabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {provider.description}
                          </p>
                          
                          {/* Disabled helper text */}
                          {isDisabled && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                              <ExclamationCircleIcon className="h-3 w-3" />
                              Enter amount to enable
                            </p>
                          )}
                        </div>
                      </div>
                      {loading === provider.id && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Help Text */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <InformationCircleIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">How it works:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Enter an amount (minimum $1)</li>
                    <li>Select your preferred payment method</li>
                    <li>Complete the payment process</li>
                    <li>Coins are added to your account instantly</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Payment Modal Component (for subscriptions)
  const PaymentModal = () => {
    if (!selectedPlan) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {userSubscription ? `Change to ${selectedPlan.name}` : `Subscribe to ${selectedPlan.name}`}
            </h3>
            <button
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedPlan(null);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Selected Plan Info */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700">
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 dark:text-white">{selectedPlan.name}</h4>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {getCoinValue(selectedPlan.coins)}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {getPriceDisplay(selectedPlan)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {selectedPlan.interval === 'MONTHLY' 
                  ? 'Recurring monthly payment' 
                  : 'Recurring annual payment'}
              </p>
            </div>
          </div>

          {/* Payment Providers */}
          <div className="p-6 space-y-4">
            {paymentProviders.map((provider) => (
              <div
                key={provider.id}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                  provider.popular 
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => handlePayment(provider.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      provider.popular 
                        ? 'bg-blue-100 dark:bg-blue-800' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <provider.icon className={`h-6 w-6 ${
                        provider.popular 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-white">
                        {provider.name}
                        {provider.popular && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                            Popular
                          </span>
                        )}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {provider.description}
                      </p>
                    </div>
                  </div>
                  {loading === provider.id && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Subscription Notice */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
              <ShieldCheckIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                This is a recurring subscription. You can cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleReactivateSubscription = async () => {
    if (!userSubscription || !userId) return;

    try {
      await api.post(`/subscriptions/reactivate/${userSubscription.id}`, {
        userId
      });
      toast.success('Subscription reactivated!');
      await fetchUserSubscription();
    } catch (err: any) {
      console.error('Reactivate subscription error:', err);
      toast.error(err.response?.data?.message || 'Failed to reactivate subscription');
    }
  };

  // Main Header Component for Logged Out Users
  const LoggedOutHeader = () => (
    <div className="mb-12">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Subscription Plans
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Choose a subscription plan for best Inlirah discount offer or buy coins directly
        </p>
      </div>
      
      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto">
        {/* Sign Up Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-5 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="md:flex-1 mb-4 md:mb-0 md:mr-6">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Ready to get started?
              </h3>
              <p className="text-blue-100 text-sm md:text-base">
                Create an account to unlock all features and manage your subscription
              </p>
            </div>
            <div className="flex flex-col xs:flex-row gap-2">
              <Link
                to="/auth/register"
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow hover:shadow-md flex items-center justify-center"
              >
                Sign Up Free
              </Link>
              <Link
                to="/auth/login"
                className="bg-transparent border border-white hover:bg-white/10 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
        
        {/* Buy Coins Card */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-5 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="md:flex-1 mb-4 md:mb-0 md:mr-6">
              <div className="flex items-center gap-3 mb-2">
                <BanknotesIcon className="h-8 w-8 text-white" />
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  Need Coins Now?
                </h3>
              </div>
              <p className="text-emerald-100 text-sm md:text-base">
                Buy coins instantly and use them right away
              </p>
              <div className="mt-3">
                <span className="text-xs text-emerald-200">
                  Quick amounts: ${quickAmounts.slice(0, 3).join(', $')}...
                </span>
              </div>
            </div>
            <div>
              <button
                onClick={() => setShowBuyCoinsModal(true)}
                className="bg-white text-green-600 hover:bg-gray-50 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow hover:shadow-md flex items-center justify-center gap-1 w-full md:w-auto"
              >
                <PlusIcon className="h-4 w-4" />
                Buy Coins
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main Header Component for Logged In Users
  const LoggedInHeader = () => (
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Subscription Plans
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
        Choose a subscription plan for best Inlirah discount offer or buy coins directly
      </p>
      
      {/* Enhanced Wallet & Subscription Overview - Only for logged in users */}
      <div className="mt-8">
        {/* Top Row: Balance + Coin Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-4">
          {/* Available Coins Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Available Coins
                </span>
              </div>
              <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-3">
                {balance?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Ready to use for all features
              </div>
              {coinBreakdown && (
                <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  ({coinBreakdown.breakdown?.fromSubscriptions || 0} from subscriptions, {coinBreakdown.breakdown?.fromPurchases || 0} from purchases)
                </div>
              )}
            </div>
          </div>

          {/* Coin Sources Card */}
          {coinBreakdown?.breakdown && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
                Coin Sources
              </h4>
              <div className="space-y-4">
                {/* Subscription Coins */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Subscriptions</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {coinBreakdown.breakdown.fromSubscriptions?.toLocaleString() || '0'}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({coinBreakdown.breakdown.subscriptionPercentage || 0}%)
                    </span>
                  </div>
                </div>
                
                {/* Purchase Coins */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Purchases</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {coinBreakdown.breakdown.fromPurchases?.toLocaleString() || '0'}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({coinBreakdown.breakdown.purchasePercentage || 0}%)
                    </span>
                  </div>
                </div>

                {/* Progress Bar Visualization */}
                <div className="pt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-l-full transition-all duration-500"
                      style={{ width: `${coinBreakdown.breakdown.subscriptionPercentage || 0}%` }}
                    ></div>
                    <div 
                      className="bg-green-500 h-3 -mt-3 transition-all duration-500"
                      style={{ 
                        width: `${coinBreakdown.breakdown.purchasePercentage || 0}%`,
                        marginLeft: `${coinBreakdown.breakdown.subscriptionPercentage || 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Action Card */}
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="text-center h-full flex flex-col justify-between">
              <div>
                <BanknotesIcon className="h-8 w-8 mx-auto mb-2" />
                <h3 className="text-xl font-bold mb-1">Need More Coins?</h3>
                <p className="text-emerald-100 mb-2">
                  Buy coins instantly and use them right away
                </p>
              </div>
              <button
                onClick={() => setShowBuyCoinsModal(true)}
                className="bg-white text-green-600 hover:bg-gray-50 px-6 py-3 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 justify-center"
              >
                <PlusIcon className="h-5 w-5" />
                Buy Coins Now
              </button>
              <p className="text-xs text-emerald-200 mt-3">
                Quick amounts: ${quickAmounts.join(', $')}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Status Row - Only show if user has subscription */}
        {userSubscription && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Subscription Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-lg border border-gray-200 dark:border-gray-700">
              {userSubscription?.status === 'ACTIVE' ? (
                // Active Subscription View
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <CurrencyDollarIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {userSubscription.plan.name}
                      </h3>
                      <p className="text-green-600 dark:text-green-400 font-semibold">
                        {userSubscription.plan.coins.toLocaleString()} coins every {userSubscription.plan.interval.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* Current Plan Details */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Billing Status
                        </span>
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        {userSubscription.cancelAtPeriodEnd ? 'Cancels on' : 'Renews on'} {new Date(userSubscription.currentPeriodEnd).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                        {userSubscription.cancelAtPeriodEnd ? 'Final payment' : 'Auto-renewal active'}
                      </div>
                    </div>

                    {/* Next Refresh */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-2 border border-purple-200 dark:border-purple-700">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                          Next Coins
                        </span>
                      </div>
                      <div className="text-sm text-purple-600 dark:text-purple-400">
                        {new Date(userSubscription.currentPeriodEnd).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                        {userSubscription.plan.coins.toLocaleString()} coins
                      </div>
                    </div>
                  </div>

                  {/* Billing Progress */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Current period progress
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {Math.ceil((new Date().getTime() - new Date(userSubscription.currentPeriodStart).getTime()) / (1000 * 60 * 60 * 24))} of{' '}
                        {Math.ceil((new Date(userSubscription.currentPeriodEnd).getTime() - new Date(userSubscription.currentPeriodStart).getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            ((new Date().getTime() - new Date(userSubscription.currentPeriodStart).getTime()) / 
                            (new Date(userSubscription.currentPeriodEnd).getTime() - new Date(userSubscription.currentPeriodStart).getTime())) * 100,
                            100
                          )}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg font-medium transition-colors"
                    >
                      Change Plan
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // No Subscription View (but user is logged in)
                <div className="text-center py-2">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CurrencyDollarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Get Recurring Coins
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Subscribe to receive coins automatically every billing period
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                    <div className="flex flex-col items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mb-1" />
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Auto-renewal</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mb-1" />
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Best value</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mb-1" />
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Cancel anytime</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    View Subscription Plans
                  </button>
                </div>
              )}
            </div>

            {/* Status Indicators & Additional Info - Only for logged in users */}
            <div className="space-y-6">
              {/* Status Badges */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Account Status
                </h4>
                <div className="flex flex-wrap gap-3">
                  {userSubscription?.status === 'ACTIVE' && (
                    <>
                      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-full border border-green-200 dark:border-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Active Subscription</span>
                      </div>
                      
                      {userSubscription.cancelAtPeriodEnd && (
                        <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-4 py-2 rounded-full border border-yellow-200 dark:border-yellow-700">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm font-medium">Ending Soon</span>
                        </div>
                      )}
                    </>
                  )}

                  {userSubscription?.status === 'EXPIRED' && (
                    <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full border border-orange-200 dark:border-orange-700">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium">Subscription Expired</span>
                    </div>
                  )}

                  {!userSubscription && (
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-sm font-medium">No Active Subscription</span>
                    </div>
                  )}

                  {/* Always show coin balance status */}
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-700">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">{balance?.toLocaleString() || '0'} Coins Available</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats - Only for logged in users */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Quick Stats
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {coinBreakdown?.breakdown?.fromSubscriptions || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Subscription Coins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {coinBreakdown?.breakdown?.fromPurchases || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Purchase Coins</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (fetchingPlans) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Show different header based on login status */}
        {userId ? <LoggedInHeader /> : <LoggedOutHeader />}

        {/* Billing Interval Toggle - Show for everyone */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 mb-3">
            <div className="flex">
              <button
                onClick={() => setBillingInterval('MONTHLY')}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  billingInterval === 'MONTHLY'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('YEARLY')}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  billingInterval === 'YEARLY'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
          
          {/* Savings message */}
          {billingInterval === 'YEARLY' && (
            <div className="text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                <StarIcon className="h-4 w-4 mr-1" />
                Save up to 50% with yearly billing
              </span>
            </div>
          )}
        </div>

        {/* Subscription Plans Grid - Show for everyone */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans
            .filter(plan => plan.interval === billingInterval)
            .map((plan, index) => {
              const savings = getSavingsPercentage(plan, plans);
              
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl dark:shadow-gray-900/50 ${
                    plan.popular 
                      ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-opacity-50 dark:ring-opacity-60 border-0' 
                      : 'border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="bg-gradient-to-r mt-8 from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white px-6 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1">
                        <StarIcon className="h-4 w-4" />
                        Best Value
                      </div>
                    </div>
                  )}

                  {savings > 0 && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Save {savings}%
                      </div>
                    </div>
                  )}

                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                      <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                        plan.interval === 'MONTHLY' 
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                          : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                      }`}>
                        {plan.interval}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {getPriceDisplay(plan)}
                        </span>
                      </div>
                      <p className="text-green-600 dark:text-green-400 font-semibold text-lg mt-1">
                        {getCoinValue(plan.coins)}
                      </p>
                    </div>

                    <ul className="space-y-4 mb-8">
                      {plan.features?.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3">
                          <CheckIcon className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSubscribeClick(plan)}
                      className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                        userId 
                          ? (userSubscription?.status === 'ACTIVE' && userSubscription.plan.id === plan.id
                            ? 'bg-blue-600 text-white cursor-default'
                            : plan.popular
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 hover:from-blue-600 hover:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800 text-white shadow-lg hover:shadow-xl'
                            : 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white')
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                      } flex items-center justify-center gap-2`}
                    >
                      <CurrencyDollarIcon className="h-5 w-5" />
                      {userId 
                        ? (userSubscription?.status === 'ACTIVE' && userSubscription.plan.id === plan.id 
                          ? 'Current Plan' 
                          : 'Subscribe Now')
                        : 'Sign Up to Subscribe'
                      }
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* How It Works - Show for everyone */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Choose Your Option</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Subscribe for recurring coins or buy coins instantly</p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 dark:text-green-400 font-bold text-lg">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Complete Payment</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Use your preferred payment method securely</p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Get Coins Instantly</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Coins are added to your wallet immediately</p>
            </div>
          </div>
        </div>

        {/* Trust Indicators - Show for everyone */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <ShieldCheckIcon className="h-8 w-8 text-green-500 dark:text-green-400 mb-2" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Cancel Anytime</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">No long-term commitment required</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <CheckIcon className="h-8 w-8 text-blue-500 dark:text-blue-400 mb-2" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Instant Delivery</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Coins added immediately after payment</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <StarIcon className="h-8 w-8 text-yellow-500 dark:text-yellow-400 mb-2" />
              <h4 className="font-semibold text-gray-900 dark:text-white">24/7 Support</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">We're here to help anytime</p>
            </div>
          </div>
        </div>

        {/* Final CTA for logged out users */}
        {!userId && (
          <div className="max-w-4xl mx-auto mt-16 text-center">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-green-100 mb-6">
                Join thousands of users who trust our platform for their needs
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/auth/register"
                  className="bg-white text-green-600 hover:bg-green-50 px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <UserCircleIcon className="h-5 w-5" />
                  Start Free Trial
                </Link>
                <Link
                  to="/auth/login"
                  className="bg-transparent border-2 border-white hover:bg-white/10 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowRightIcon className="h-5 w-5" />
                  Sign In to Your Account
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showLoginPrompt && <LoginPromptModal />}
      {showPaymentModal && <PaymentModal />}
      {showBuyCoinsModal && <BuyCoinsModal />}
    </div>
  );
};