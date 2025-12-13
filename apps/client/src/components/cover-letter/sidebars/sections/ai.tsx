// client/components/cover-letter/sidebars/sections/ai.tsx
import { useState, useRef } from 'react';
import { Button, Label } from "@reactive-resume/ui";
import { Textarea } from '@/client/components/ui/textarea';
import { 
  Wand2, 
  RefreshCw, 
  Zap, 
  Sparkles, 
  Target, 
  Clock, 
  Languages, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Lightbulb,
  MessageCircle,
  Coins,
  Crown,
  Loader2
} from 'lucide-react';
import { t } from "@lingui/macro";

import { useCoverLetterStore } from "../../../../../stores/cover-letter";
import { coverLetterService } from "@/client/services/cover-letter.service";
import { useAuthStore } from '@/client/stores/auth';
import { useWallet } from '@/client/hooks/useWallet';
import { CoinConfirmPopover } from '@/client/components/modals/coin-confirm-modal';
import { toast } from "sonner";

type ProcessState = 'idle' | 'reserving' | 'processing' | 'success' | 'error';
type ProcessType = 'enhance' | 'regenerate' | 'quick-enhance';

interface ProcessStatus {
  state: ProcessState;
  type?: ProcessType;
  message?: string;
  instructions?: string;
  transactionId?: string;
}

export const AISection = () => {
  const [enhanceInstructions, setEnhanceInstructions] = useState('');
  const [processStatus, setProcessStatus] = useState<ProcessStatus>({ state: 'idle' });
  const [lastFailedInstructions, setLastFailedInstructions] = useState<string>('');
  const [showCoinPopover, setShowCoinPopover] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: ProcessType; instructions?: string } | null>(null);
  
  const { coverLetter, selectedBlock, setCoverLetter } = useCoverLetterStore();
  const { user } = useAuthStore();
  const { balance, canAfford, deductCoinsWithRollback, completeTransaction, refundTransaction, fetchBalance } = useWallet(user?.id || '');

  // Refs for popover positioning
  const quickEnhanceRef = useRef<HTMLDivElement>(null);
  const regenerateRef = useRef<HTMLButtonElement>(null);
  const customEnhanceRef = useRef<HTMLButtonElement>(null);

  // AI enhancement costs
  const enhancementCosts = {
    'quick-enhance': 1,
    'enhance': 3,
    'regenerate': 2
  };

  const selectedBlockData = coverLetter?.content?.blocks?.find((block: any) => block.id === selectedBlock) || null;

  const generateTransactionId = (type: ProcessType): string => {
    return `ai_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleProcess = async (type: ProcessType, instructions?: string, ref?: React.RefObject<HTMLElement>) => {
    if (!coverLetter?.id || !selectedBlock) {
      toast.error('Please select a block to enhance');
      return;
    }

    if (!user) {
      toast.error('Please sign in to use AI features');
      return;
    }

    // Check if user can afford the action
    const cost = enhancementCosts[type];
    const affordable = await canAfford(cost);

    if (!affordable) {
      // Store the action and show coin popover
      setPendingAction({ type, instructions });
      setShowCoinPopover(true); // THIS SHOULD SHOW POPOVER
      return;
    }

    // Proceed with AI enhancement if they can afford
    await executeAIProcess(type, instructions, cost);
  };

  const executeAIProcess = async (type: ProcessType, instructions?: string, cost?: number) => {
  if (!coverLetter?.id || !selectedBlock || !user) return;

  // Generate unique transaction ID
  const transactionId = generateTransactionId(type);

  // Store instructions in case of failure
  if (instructions) {
    setLastFailedInstructions(instructions);
  }

  setProcessStatus({ 
    state: 'reserving', 
    type,
    message: getProcessingMessage(type, 'reserving'),
    instructions,
    transactionId
  });

  let transactionSuccess = false;
  let finalResult: any = null;

  try {
    // Step 1: Reserve coins (deduct with rollback capability)
    setProcessStatus(prev => ({ 
      ...prev, 
      state: 'reserving',
      message: getProcessingMessage(type, 'reserving')
    }));


    // In your AI section, use this format (3 arguments):
    const transactionResult = await deductCoinsWithRollback(
      cost || 0, // amount
      `AI ${type} - ${selectedBlockData?.type || 'block'}`, // description
      { // metadata (as 3rd argument)
        transactionId, // Include transactionId here
        actionType: type, 
        blockId: selectedBlock,
        coverLetterId: coverLetter.id
      }
    );

    if (!transactionResult.success) {
      throw new Error('Failed to reserve coins for this action');
    }

    transactionSuccess = true;

    // Step 2: Proceed with AI processing
    setProcessStatus(prev => ({ 
      ...prev, 
      state: 'processing',
      message: getProcessingMessage(type, 'processing')
    }));

    let result;
    
    if (type === 'enhance' && instructions) {
      result = await coverLetterService.enhanceBlock(
        coverLetter.id, 
        selectedBlock, 
        instructions,
        { transactionId }
      );
    } else if (type === 'regenerate') {
      result = await coverLetterService.regenerateBlock(
        coverLetter.id, 
        selectedBlock,
        { transactionId }
      );
    } else if (type === 'quick-enhance' && instructions) {
      result = await coverLetterService.enhanceBlock(
        coverLetter.id, 
        selectedBlock, 
        instructions,
        { transactionId }
      );
    }

    if (result && result.coverLetter) {
      // Update cover letter with AI result
      setCoverLetter(result.coverLetter);
      
      finalResult = result;

      // Get the enhanced content from the block
      const enhancedContent = result.block?.content;
      
      // Step 3: Mark transaction as completed
      await completeTransaction(transactionId, {
        result: 'success',
        blockType: selectedBlockData?.type,
        enhancedContent: enhancedContent?.substring(0, 100) || 'Enhanced successfully'
      });

      const successMessage = getSuccessMessage(type);
      
      // Show success toast with coin usage info
      toast.success(
        <div className="space-y-1">
          <div className="font-medium">{successMessage}</div>
          <div className="text-xs text-green-600 flex items-center gap-1">
            <Coins className="w-3 h-3" />
            Used {cost} coins • Transaction: {transactionId.slice(-8)}
          </div>
        </div>,
        { duration: 10000 }
      );

      setProcessStatus({ 
        state: 'success', 
        type,
        message: successMessage,
        transactionId
      });

      // Clear instructions on success
      if (type === 'enhance') {
        setEnhanceInstructions('');
        setLastFailedInstructions('');
      }

      // Auto-clear success message after 10 seconds
      setTimeout(() => {
        setProcessStatus(prev => prev.state === 'success' ? { state: 'idle' } : prev);
      }, 10000);

    } else {
      throw new Error('AI processing returned no result');
    }

  } catch (error: any) {
    console.error(`${type} failed:`, error);
    
    // Step 4: Handle failure - refund coins if transaction was successful
    if (transactionSuccess) {
      try {
        const refundReason = error.message || 'AI processing failed';
        await refundTransaction(transactionId, refundReason);
        
        // Refresh balance after refund
        await fetchBalance();
        
        console.log(`Refunded ${cost} coins due to process failure: ${refundReason}`);
        
      } catch (refundError) {
        console.error('Failed to refund coins:', refundError);
        // Still show error to user, but log refund failure
      }
    }

    const errorMessage = getErrorMessage(type, error, transactionSuccess);
    
    // Show error toast with detailed message
    toast.error(errorMessage, {
      duration: 20000,
      icon: <XCircle className="w-4 h-4 text-red-500" />,
      action: (processStatus.instructions || instructions) ? {
        label: 'Retry',
        onClick: () => handleRetry()
      } : undefined
    });

    setProcessStatus({ 
      state: 'error', 
      type,
      message: errorMessage,
      instructions: instructions || lastFailedInstructions,
      transactionId
    });

    // Keep instructions in input field for retry
    if (type === 'enhance' && instructions) {
      setEnhanceInstructions(instructions);
    }

    // Auto-clear error message after 10 seconds
    setTimeout(() => {
      setProcessStatus(prev => prev.state === 'error' ? { state: 'idle' } : prev);
    }, 20000);
  }
};

  const handleCoinConfirm = async () => {
    if (pendingAction) {
      const cost = enhancementCosts[pendingAction.type];
      await executeAIProcess(pendingAction.type, pendingAction.instructions, cost);
      setPendingAction(null);
      setShowCoinPopover(false);
    }
  };

  const handleBuyCoins = (goSubscription = false) => {
    setShowCoinPopover(false);
    setPendingAction(null);
    // Navigate to coins or subscription page
    if (goSubscription) {
      window.location.href = "/dashboard/pricing";
    } else {
      const cost = pendingAction ? enhancementCosts[pendingAction.type] : enhancementCosts.enhance;
      window.location.href = `/dashboard/coins?needed=${cost - balance}`;
    }
  };

  const getProcessingMessage = (type: ProcessType, stage: string): string => {
    const messages = {
      'reserving': t`Reserving coins...`,
      'processing': {
        'enhance': t`AI is enhancing your content...`,
        'regenerate': t`AI is regenerating this block...`,
        'quick-enhance': t`AI is applying quick enhancement...`
      }[type]
    };
    return stage === 'reserving' ? messages.reserving : messages.processing;
  };

  const getSuccessMessage = (type: ProcessType): string => {
    const messages = {
      'enhance': t`Content enhanced successfully!`,
      'regenerate': t`Block regenerated successfully!`,
      'quick-enhance': t`Quick enhancement applied!`
    };
    return messages[type];
  };

  const getErrorMessage = (type: ProcessType, error: any, wasCharged: boolean): string => {
    // Check for specific error types
    if (error?.response?.status === 402) {
      return t`Payment required. Please check your coin balance.`;
    }
    
    if (error?.message?.includes('network') || error?.message?.includes('fetch') || error?.code === 'ECONNABORTED') {
      return wasCharged 
        ? t`Network error. Your coins have been refunded. Please check your connection and try again.`
        : t`Network error. Please check your connection and try again.`;
    }
    
    if (error?.message?.includes('timeout')) {
      return wasCharged
        ? t`Request timed out. Your coins have been refunded. Please try again.`
        : t`Request timed out. Please try again.`;
    }
    
    if (error?.message?.includes('insufficient') || error?.message?.includes('balance')) {
      return t`Insufficient coins. Please add more coins to continue.`;
    }

    // Default error messages
    const messages = {
      'enhance': wasCharged 
        ? t`Failed to enhance content. Your coins have been refunded.`
        : t`Failed to enhance content. Please try again.`,
      'regenerate': wasCharged
        ? t`Failed to regenerate block. Your coins have been refunded.`
        : t`Failed to regenerate block. Please try again.`,
      'quick-enhance': wasCharged
        ? t`Failed to apply enhancement. Your coins have been refunded.`
        : t`Failed to apply enhancement. Please try again.`
    };
    
    return messages[type] || t`AI processing failed. ${wasCharged ? 'Your coins have been refunded.' : ''}`;
  };

  const quickEnhance = (action: string) => {
    const instructionsMap: Record<string, string> = {
      'professional': t`Make this more professional and business-appropriate`,
      'concise': t`Make this more concise and to the point`,
      'impactful': t`Make this more impactful with stronger action verbs`,
      'friendly': t`Make this more friendly and approachable`,
      'formal': t`Make this more formal and traditional`,
      'modern': t`Update with contemporary language`,
      'persuasive': t`Make this more persuasive and compelling`,
      'confident': t`Make this more confident and authoritative`
    };
    
    const instructions = instructionsMap[action];
    if (instructions) {
      handleProcess('quick-enhance', instructions, quickEnhanceRef);
    }
  };

  const handleCustomEnhance = () => {
    if (enhanceInstructions.trim()) {
      handleProcess('enhance', enhanceInstructions, customEnhanceRef);
    }
  };

  const handleRetry = () => {
    if (processStatus.instructions) {
      handleProcess(processStatus.type || 'enhance', processStatus.instructions);
    }
  };

  const handleClearError = () => {
    setProcessStatus({ state: 'idle' });
    setLastFailedInstructions('');
  };

  // Status Display Component
  const StatusDisplay = () => {
    if (processStatus.state === 'idle') return null;

    const statusConfig = {
      reserving: {
        icon: Loader2,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        spin: true
      },
      processing: {
        icon: Loader2,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        spin: true
      },
      success: {
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        spin: false
      },
      error: {
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        spin: false
      }
    };

    const config = statusConfig[processStatus.state];
    const IconComponent = config.icon;

    return (
      <div className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} animate-in slide-in-from-bottom-2 duration-300`}>
        <div className="flex items-start space-x-2">
          <IconComponent className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.color} ${config.spin ? 'animate-spin' : ''}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {processStatus.message}
            </p>
            {processStatus.state === 'error' && (
              <div className="mt-2 space-y-2">
                {processStatus.instructions && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t`Your instructions: "${processStatus.instructions}"`}
                  </p>
                )}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="text-xs h-7"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    {t`Try Again`}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearError}
                    className="text-xs h-7"
                  >
                    {t`Dismiss`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!selectedBlock) {
    return (
      <section id="ai" className="space-y-4">
        <div className="flex items-center space-x-2">
          <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t`AI Assistant`}</h2>
        </div>

        <div className="p-6 text-center text-gray-500 dark:text-gray-400 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-lg border border-dashed border-purple-200 dark:border-purple-800">
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-purple-400 dark:text-purple-500" />
          <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">
            {t`AI Magic Awaits`}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            {t`Select a text block to unlock AI enhancement features`}
          </p>
        </div>
      </section>
    );
  }

  const isProcessing = processStatus.state === 'processing' || processStatus.state === 'reserving';
  const currentActionCost = pendingAction ? enhancementCosts[pendingAction.type] : enhancementCosts.enhance;

  return (
    <section id="ai" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t`AI Assistant`}</h2>
        </div>
        {isProcessing && (
          <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{t`AI Working...`}</span>
          </div>
        )}
      </div>

      {/* Status Display */}
      <StatusDisplay />

      {/* Selected Block Info */}
      <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-medium text-purple-900 dark:text-purple-100 uppercase tracking-wide">
              {t`Editing Block`}
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300 capitalize">
              {selectedBlockData?.type?.toLowerCase() || 'content'}
            </p>
          </div>
          <Target className="w-4 h-4 text-purple-500 dark:text-purple-400" />
        </div>
      </div>

      {/* Coin Balance */}
      <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Your Coins</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{balance}</span>
            <Crown className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Quick Enhance Buttons */}
      <div ref={quickEnhanceRef} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t`Quick Enhance`}</h3>
            
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
            <div>{t`Cost per enhancement:`}</div>
            <Coins className="w-3 h-3" />
            <span>{enhancementCosts['quick-enhance']}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'professional', label: t`Professional`, icon: Languages },
            { key: 'concise', label: t`Concise`, icon: RefreshCw },
            { key: 'impactful', label: t`Impactful`, icon: Sparkles },
            { key: 'friendly', label: t`Friendly`, icon: MessageCircle },
            { key: 'formal', label: t`Formal`, icon: Languages },
            { key: 'modern', label: t`Modern`, icon: Sparkles },
            { key: 'persuasive', label: t`Persuasive`, icon: Target },
            { key: 'confident', label: t`Confident`, icon: Zap }
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant="outline"
              onClick={() => quickEnhance(key)}
              disabled={isProcessing}
              size="sm"
              className="h-9 text-xs justify-start border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
            >
              <Icon className="w-3 h-3 mr-1.5 text-orange-500 dark:text-orange-400" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Regenerate Button */}
      <div className="flex items-center justify-between p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg border border-green-200 dark:border-green-800">
        <Button
          ref={regenerateRef}
          variant="outline"
          onClick={() => handleProcess('regenerate', undefined, regenerateRef)}
          disabled={isProcessing}
          className="flex-1 justify-center border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
          {isProcessing ? t`Regenerating...` : t`AI Regeneration block`}
        </Button>
        <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400 ml-2">
          <div>{t`Cost:`}</div>
          <Coins className="w-3 h-3" />
          <span>{enhancementCosts.regenerate}</span>
        </div>
      </div>

      {/* Custom Instructions */}
      <div className="space-y-3 pt-2 border-t">
        <div className="flex items-center justify-between">
          <Label htmlFor="ai-instructions" className="text-sm font-medium text-gray-900 dark:text-white">
            {t`Custom Instructions`}
          </Label>
          <div className="flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400">
            <div>{t`Cost:`}</div>
            <Coins className="w-3 h-3" />
            <span>{enhancementCosts.enhance}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Textarea
            id="ai-instructions"
            value={enhanceInstructions}
            onChange={(e) => setEnhanceInstructions(e.target.value)}
            placeholder={t`Tell AI exactly how to improve this block...`}
            className="min-h-[80px] resize-none text-sm border-purple-200 dark:border-purple-800 focus:border-purple-300 dark:focus:border-purple-600 transition-colors"
            disabled={isProcessing}
          />
          
          <div className="flex space-x-2">
            <Button
              ref={customEnhanceRef}
              onClick={handleCustomEnhance}
              disabled={isProcessing || !enhanceInstructions.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              size="sm"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {isProcessing ? t`Enhancing...` : t`Enhance`}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setEnhanceInstructions('');
                setLastFailedInstructions('');
              }}
              disabled={isProcessing || !enhanceInstructions.trim()}
              className="border-purple-200 dark:border-purple-800"
              size="sm"
            >
              {t`Clear`}
            </Button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-center space-x-2 mb-2">
          <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <h4 className="text-xs font-medium text-amber-900 dark:text-amber-100">{t`Pro Tips`}</h4>
        </div>
        <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
          <li className="flex items-start space-x-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>{t`Be specific about tone and style you want`}</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>{t`Mention target audience if applicable`}</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>{t`Specify length or key points to include`}</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>{t`Give clear, actionable instructions`}</span>
          </li>
        </ul>
      </div>

      {/* Coin Confirmation Popover */}
      <CoinConfirmPopover
        open={showCoinPopover}
        onClose={() => {
          setShowCoinPopover(false);
          setPendingAction(null);
        }}
        required={currentActionCost}
        balance={balance}
        onConfirm={handleCoinConfirm}
        onBuyCoins={handleBuyCoins}
        title="AI Enhancement - Coin Confirmation"
        description={pendingAction?.type === 'regenerate' 
          ? "Regenerate this block with AI for a complete rewrite."
          : "Enhance your content with AI-powered improvements."
        }
        actionType="enhance"
        triggerRef={
          pendingAction?.type === 'quick-enhance' ? quickEnhanceRef : 
          pendingAction?.type === 'regenerate' ? regenerateRef : 
          customEnhanceRef
        }
      />
    </section>
  );
};