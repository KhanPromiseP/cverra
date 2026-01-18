// @/client/components/WelcomePopup.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  XMarkIcon, 
  GiftIcon, 
  SparklesIcon, 
  CurrencyDollarIcon,
  CheckCircleIcon,
  TrophyIcon,
  UserCircleIcon,
  ArrowRightIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { useWelcomeBonus } from '@/client/hooks/useWelcomeBonus';
import { useNavigate } from 'react-router';

export const WelcomePopup: React.FC = () => {
  const { 
    showWelcome, 
    setShowWelcome, 
    claimBonus, 
    isClaiming, 
    userName,
    viewPricingPage 
  } = useWelcomeBonus();
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimedSuccess, setClaimedSuccess] = useState(false);
  const [coinsAnimation, setCoinsAnimation] = useState(false);
  const [successTimer, setSuccessTimer] = useState<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (showWelcome) {
      const coinsTimer = setTimeout(() => setCoinsAnimation(true), 500);
      return () => clearTimeout(coinsTimer);
    } else {
      setShowConfetti(false);
      setClaimedSuccess(false);
      setCoinsAnimation(false);
      if (successTimer) clearTimeout(successTimer);
    }
  }, [showWelcome]);

  const handleClaim = async () => {
    const claimed = await claimBonus();
    if (claimed) {
      setClaimedSuccess(true);
      setShowConfetti(true);
      
      // Show success for 8 seconds (longer duration)
      const timer = setTimeout(() => {
        setShowConfetti(false);
        setShowWelcome();
      }, 8000);
      setSuccessTimer(timer);
    }
  };

  const handleClose = () => {
    setShowWelcome();
    if (successTimer) clearTimeout(successTimer);
  };

  const handleViewPricing = () => {
    setShowWelcome();
    if (successTimer) clearTimeout(successTimer);
    viewPricingPage();
  };

  if (!showWelcome) return null;

  return (
    <>
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 z-[9997] pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-sm animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Main Popup */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
          {/* Top Gradient */}
          <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>
          
          {/* Header */}
          <div className="relative p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="text-center">
              {/* Personalized Greeting */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <UserCircleIcon className="w-6 h-6 text-purple-500" />
                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {userName ? `Hey ${userName}!` : 'Welcome!'}
                </span>
              </div>

              {/* Animated Gift */}
              <div className={`relative inline-block mb-1 mt-3 ${coinsAnimation ? 'animate-bounce' : ''}`}>
                <div className="relative w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl">
                  <GiftIcon className="w-10 h-10 text-white" />
                </div>
                <CurrencyDollarIcon className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-ping" />
              </div>

              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Welcome to Inlirah!
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400">
                Your journey to career success starts here
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!claimedSuccess ? (
              <>
                {/* Bonus Card */}
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <TrophyIcon className="w-5 h-5 text-yellow-500" />
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Welcome Gift</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">For joining our community</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">100</div>
                      <div className="text-sm text-gray-500">coins</div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-2">
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Use your coins to unlock:
                  </p>
                  <div className="space-y-2">
                    {[
                      { icon: '🚀', text: 'AI Resume Builder' },
                      { icon: '📚', text: 'Premium Articles' },
                      { icon: '✉️', text: 'Smart Letter Crafting' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-gray-700 dark:text-gray-300">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Claim Button */}
                <button
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isClaiming ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Claiming...</span>
                    </>
                  ) : (
                    <>
                      <GiftIcon className="w-5 h-5" />
                      <span>Claim Your 100 Coins</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              /* SUCCESS STATE - LONGER DURATION */
              <div className="text-center py-4">
                <div className="relative inline-block mb-4">
                  <div className="relative w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                    <CheckCircleIcon className="w-8 h-8 text-white" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-3">
                  🎉 Bonus Claimed Successfully!
                </h2>
                
                {/* Bonus Card */}
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700 animate-pulse">
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
                    +100
                  </div>
                  <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Coins Added to Your Wallet!
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {userName ? `Enjoy your coins, ${userName}! 🚀` : 'Enjoy your coins! 🚀'}
                  </div>
                </div>

                {/* Next Steps */}
                <div className="mb-8">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    <strong>What's next?</strong> Use your coins to explore Inlirah features:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-700 dark:text-gray-300">AI Resume Builder</span>
                      </div>
                      <span className="text-sm text-blue-600 dark:text-blue-400">-10 coins</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-700 dark:text-gray-300">Premium Articles</span>
                      </div>
                      <span className="text-sm text-purple-600 dark:text-purple-400">-5 coins</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleViewPricing}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <CreditCardIcon className="w-5 h-5" />
                    View Bonuses on Pricing Page
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={handleClose}
                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-xl transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Continue to Dashboard
                  </button>
                </div>

                {/* Countdown Timer */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>This message will auto-close in 8 seconds</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fall Animation */}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
    </>
  );
};