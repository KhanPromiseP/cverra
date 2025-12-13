import { Button } from "@reactive-resume/ui";
import { Coins, Download, Zap, Crown, X, ChevronUp, CreditCard, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from 'sonner';
import api from '@/client/api/axios'; // Import your API client

interface CoinConfirmPopoverProps {
  open: boolean;
  onClose: () => void;
  required: number;
  balance: number;
  onConfirm: () => void;
  onBuyCoins: (subscribe?: boolean) => void;
  title?: string;
  description?: string;
  actionType?: "export" | "enhance" | "premium" | "custom";
  triggerRef?: React.RefObject<HTMLElement>;
  userId?: string;
}

export function CoinConfirmPopover({
  open,
  onClose,
  required,
  balance,
  onConfirm,
  onBuyCoins,
  title = "Coin Confirmation",
  description = "This action requires coins to complete.",
  actionType = "export",
  triggerRef,
  userId
}: CoinConfirmPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, arrowLeft: 50 });
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const shortage = required - balance;
  const hasEnough = shortage <= 0;

  // Calculate USD amount needed with 2 decimal places
  const usdAmountNeeded = Math.ceil((shortage / 10) * 100) / 100;
  const minimumAmount = Math.max(usdAmountNeeded, 5.00); // Minimum $5.00

  // Format currency with 2 decimal places
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Payment providers - REMOVED MOCK PROVIDER
  const paymentProviders = [
    {
      id: 'STRIPE',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, Amex, Apple Pay, Google Pay',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      id: 'TRANZAK',
      name: 'Mobile Money',
      icon: Smartphone,
      description: 'MTN, Orange, Express Union, UBA',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800'
    }
  ];

  // Position the popover
  useEffect(() => {
    if (open && triggerRef?.current && popoverRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = showPaymentOptions ? 400 : 380;
      const popoverHeight = showPaymentOptions ? 500 : 400;
      
      let top = triggerRect.bottom + 10;
      let left = triggerRect.left + (triggerRect.width / 2) - (popoverWidth / 2);
      
      if (left < 20) left = 20;
      if (left + popoverWidth > window.innerWidth - 20) {
        left = window.innerWidth - popoverWidth - 20;
      }
      
      if (top + popoverHeight > window.innerHeight - 20) {
        top = triggerRect.top - popoverHeight - 10;
      }
      
      const arrowLeft = Math.max(
        20, 
        Math.min(
          80,
          ((triggerRect.left + triggerRect.width / 2 - left) / popoverWidth) * 100
        )
      );

      setPosition({
        top,
        left,
        arrowLeft
      });
    }
  }, [open, triggerRef, showPaymentOptions]);

  // Close handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        open && 
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
        setShowPaymentOptions(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (open && event.key === 'Escape') {
        onClose();
        setShowPaymentOptions(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose, triggerRef]);

  // Get action-specific content
  const getActionConfig = () => {
    switch (actionType) {
      case "export":
        return {
          icon: Download,
          primaryColor: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-800",
          defaultTitle: "Export PDF",
          defaultDescription: "Export as high-quality PDF"
        };
      case "enhance":
        return {
          icon: Zap,
          primaryColor: "text-purple-600 dark:text-purple-400",
          bgColor: "bg-purple-50 dark:bg-purple-900/20",
          borderColor: "border-purple-200 dark:border-purple-800",
          defaultTitle: "AI Enhancement",
          defaultDescription: "Enhance with AI"
        };
      case "premium":
        return {
          icon: Crown,
          primaryColor: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          defaultTitle: "Premium Feature",
          defaultDescription: "Access premium features"
        };
      default:
        return {
          icon: Coins,
          primaryColor: "text-indigo-600 dark:text-indigo-400",
          bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
          borderColor: "border-indigo-200 dark:border-indigo-800",
          defaultTitle: title,
          defaultDescription: description
        };
    }
  };

  // Handle payment directly - FIXED VERSION
  const handleDirectPayment = async (providerId: string) => {
    if (!userId) {
      toast.error('Please sign in to purchase coins');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Use your actual API endpoint
      const response = await api.post('/payments/initiate', {
        userId,
        amount: parseFloat(minimumAmount.toFixed(2)),
        provider: providerId,
        currency: 'USD',
        metadata: {
          type: 'COIN_PURCHASE',
          coins: shortage
        }
      });

      console.log('Payment initiation response:', response.data);

      const redirectUrl = response.data.redirectUrl || response.data.initiation?.redirectUrl;
      
      if (redirectUrl) {
        toast.info(`Redirecting to ${providerId} payment...`);
        // Redirect to payment gateway
        window.location.href = redirectUrl;
        return;
      }

      if (response.data.status === 'success' || response.data.success) {
        toast.success(
          <div className="space-y-1">
            <div className="font-medium">Purchase Successful!</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <Coins className="w-3 h-3" />
              {shortage} coins added to your wallet
            </div>
          </div>,
          { duration: 5000 }
        );
        
        // Close popovers
        setShowPaymentOptions(false);
        onClose();
        
        // Call onConfirm if user now has enough coins
        if (hasEnough) {
          onConfirm();
        }
        
      } else if (response.data.status === 'pending') {
        toast.info('Payment processing started. You will receive your coins shortly.');
        setShowPaymentOptions(false);
        onClose();
      } else {
        throw new Error(response.data.message || 'Payment failed');
      }
      
    } catch (error: any) {
      console.error('Payment error:', error);
      
      // Handle specific errors
      if (error.response?.data?.message?.includes('ENOTFOUND') || 
          error.response?.data?.message?.includes('tranzak')) {
        toast.error('Payment service temporarily unavailable. Please try again later or use a different payment method.');
      } else {
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.error 
          || error.message 
          || 'Payment failed. Please try again.';
        
        toast.error(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const actionConfig = getActionConfig();
  const ActionIcon = actionConfig.icon;
  const displayTitle = title === "Coin Confirmation" ? actionConfig.defaultTitle : title;
  const displayDescription = description === "This action requires coins to complete." ? actionConfig.defaultDescription : description;

  if (!open) return null;

  const arrowDirection = position.top < (triggerRef?.current?.getBoundingClientRect().top || 0) 
    ? 'down' 
    : 'up';

  // Payment Options View
  if (showPaymentOptions) {
    return (
      <>
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => {
            setShowPaymentOptions(false);
            onClose();
          }}
        />
        
        <div 
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 50,
          }}
          className="w-[400px] animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Arrow */}
          <div 
            style={{ left: `${position.arrowLeft}%` }}
            className={`absolute ${arrowDirection === 'up' ? '-top-2' : '-bottom-2'} transform -translate-x-1/2`}
          >
            {arrowDirection === 'up' ? (
              <ChevronUp className="w-5 h-5 text-white dark:text-gray-900" />
            ) : (
              <ChevronUp className="w-5 h-5 text-white dark:text-gray-900 rotate-180" />
            )}
          </div>

          {/* Payment Options Content */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-800">
                    <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Buy {shortage} Coins
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {formatCurrency(minimumAmount)} • Choose payment method
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentOptions(false)}
                  className="h-7 w-7 p-0 hover:bg-white/50 dark:hover:bg-gray-800/50"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Purchase Summary */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">You'll get</div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {shortage} coins
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Cost</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(minimumAmount)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  ≈ 10 coins per $1 • Instant delivery
                </div>
              </div>

              {/* Payment Providers */}
              <div className="space-y-3">
                {paymentProviders.map((provider) => {
                  const ProviderIcon = provider.icon;
                  return (
                    <button
                      key={provider.id}
                      onClick={() => handleDirectPayment(provider.id)}
                      disabled={isProcessing}
                      className={`w-full p-4 rounded-xl border-2 ${provider.borderColor} ${provider.bgColor} hover:opacity-90 transition-all duration-200 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${provider.bgColor}`}>
                          <ProviderIcon className={`w-5 h-5 ${provider.color}`} />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {provider.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {provider.description}
                          </div>
                        </div>
                      </div>
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      ) : (
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Pay {formatCurrency(minimumAmount)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Back Button */}
              <Button
                onClick={() => setShowPaymentOptions(false)}
                variant="outline"
                className="w-full rounded-lg py-2.5 text-sm"
              >
                Back to Options
              </Button>

              {/* Help Text */}
              <div className="text-center pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💡 Coins are added instantly after successful payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Original View (Coin Confirmation)
  return (
    <>
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      <div 
        ref={popoverRef}
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 50,
        }}
        className="w-[380px] animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div 
          style={{ left: `${position.arrowLeft}%` }}
          className={`absolute ${arrowDirection === 'up' ? '-top-2' : '-bottom-2'} transform -translate-x-1/2`}
        >
          {arrowDirection === 'up' ? (
            <ChevronUp className="w-5 h-5 text-white dark:text-gray-900" />
          ) : (
            <ChevronUp className="w-5 h-5 text-white dark:text-gray-900 rotate-180" />
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className={`p-4 ${actionConfig.bgColor} ${actionConfig.borderColor} border-b`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${actionConfig.bgColor}`}>
                  <ActionIcon className={`w-4 h-4 ${actionConfig.primaryColor}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {displayTitle}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {displayDescription}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-7 w-7 p-0 hover:bg-white/50 dark:hover:bg-gray-800/50"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Coin Information */}
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Action Cost</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{required}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-gray-600 dark:text-gray-400">Your Balance</div>
                <div className={`text-lg font-bold ${hasEnough ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {balance}
                </div>
              </div>
            </div>

            {/* Shortage Warning */}
            {!hasEnough && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span>
                    Need <strong>{shortage} more coins</strong> (≈ {formatCurrency(usdAmountNeeded)})
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {hasEnough ? (
                <>
                  <Button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className="w-full rounded-lg py-2.5 text-sm font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Use {required} Coins
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full rounded-lg py-2.5 text-sm"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  {/* Buy Coins Button - Now opens payment options */}
                  <Button
                    onClick={() => setShowPaymentOptions(true)}
                    variant="outline"
                    className="w-full rounded-lg py-2.5 text-sm font-medium border border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Buy {shortage} Coins ({formatCurrency(minimumAmount)})
                  </Button>

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-2 bg-white dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400">
                        or
                      </span>
                    </div>
                  </div>

                  {/* Subscription Button - Still redirects */}
                  <Button
                    onClick={() => {
                      onBuyCoins(true);
                      onClose();
                    }}
                    className="w-full rounded-lg py-2.5 text-sm font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Subscribe & Save 50%
                  </Button>

                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="w-full rounded-lg py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Maybe Later
                  </Button>
                </>
              )}
            </div>

            {/* Help Text */}
            <div className="text-center pt-2 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 Best discount with subscription!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}