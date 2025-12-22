// import { t } from "@lingui/macro";
// import {
//   CaretDown,
//   ChatTeardropText,
//   CircleNotch,
//   Exam,
//   MagicWand,
//   PenNib,
// } from "@phosphor-icons/react";
// import {
//   Badge,
//   Button,
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@reactive-resume/ui";
// import { cn } from "@reactive-resume/utils";
// import { useState } from "react";

// import { toast } from "../hooks/use-toast";
// import { changeTone } from "../services/openai/change-tone";
// import { fixGrammar } from "../services/openai/fix-grammar";
// import { improveWriting } from "../services/openai/improve-writing";
// // import { useOpenAiStore } from "../stores/openai";

// type Action = "improve" | "fix" | "tone";
// type Mood = "casual" | "professional" | "confident" | "friendly";

// type Props = {
//   value: string;
//   onChange: (value: string) => void;
//   className?: string;
// };

// export const AiActions = ({ value, onChange, className }: Props) => {
//   const [loading, setLoading] = useState<Action | false>(false);
//   // const aiEnabled = useOpenAiStore((state) => !!state.apiKey);

//   // if (!aiEnabled) return null;

//   const onClick = async (action: Action, mood?: Mood) => {
//     try {
//       setLoading(action);

//       let result = value;

//       if (action === "improve") result = await improveWriting(value);
//       if (action === "fix") result = await fixGrammar(value);
//       if (action === "tone" && mood) result = await changeTone(value, mood);

//       onChange(result);
//     } catch (error) {
//       toast({
//         variant: "error",
//         title: t`Oops, the server returned an error.`,
//         description: (error as Error).message,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div
//       className={cn(
//         "relative mt-4 rounded bg-secondary-accent/50 p-3 outline outline-secondary-accent",
//         "flex flex-wrap items-center justify-center gap-2",
//         className,
//       )}
//     >


//       <Button size="sm" className=" border border-gray-700" variant="outline" disabled={!!loading} onClick={() => onClick("improve")}>
//         {loading === "improve" ? <CircleNotch className="animate-spin" /> : <PenNib />}
//         <span className="ml-2  text-xs">{t`Improve Writing`}</span>
//       </Button>

//       <Button size="sm" className=" border border-gray-700" variant="outline" disabled={!!loading} onClick={() => onClick("fix")}>
//         {loading === "fix" ? <CircleNotch className="animate-spin" /> : <Exam />}
//         <span className="ml-2 text-xs">{t`Fix Spelling & Grammar`}</span>
//       </Button>

//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button size="sm" className=" border border-gray-700" variant="outline" disabled={!!loading}>
//             {loading === "tone" ? <CircleNotch className="animate-spin" /> : <ChatTeardropText />}
//             <span className="mx-2 text-xs">{t`Change Tone`}</span>
//             <CaretDown />
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent>
//           <DropdownMenuItem onClick={() => onClick("tone", "casual")}>
//             <span role="img" aria-label={t`Casual`}>
//               🙂
//             </span>
//             <span className="ml-2">{t`Casual`}</span>
//           </DropdownMenuItem>
//           <DropdownMenuItem onClick={() => onClick("tone", "professional")}>
//             <span role="img" aria-label={t`Professional`}>
//               💼
//             </span>
//             <span className="ml-2">{t`Professional`}</span>
//           </DropdownMenuItem>
//           <DropdownMenuItem onClick={() => onClick("tone", "confident")}>
//             <span role="img" aria-label={t`Confident`}>
//               😎
//             </span>
//             <span className="ml-2">{t`Confident`}</span>
//           </DropdownMenuItem>
//           <DropdownMenuItem onClick={() => onClick("tone", "friendly")}>
//             <span role="img" aria-label={t`Friendly`}>
//               😊
//             </span>
//             <span className="ml-2">{t`Friendly`}</span>
//           </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>
//     </div>
//   );
// };


import { t } from "@lingui/macro";
import {
  CaretDown,
  ChatTeardropText,
  CircleNotch,
  Exam,
  MagicWand,
  PenNib,
  Coins,
} from "@phosphor-icons/react";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { useState, useRef } from "react";
import { useNavigate } from "react-router";

import { toast } from "../hooks/use-toast";
import { changeTone } from "../services/openai/change-tone";
import { fixGrammar } from "../services/openai/fix-grammar";
import { improveWriting } from "../services/openai/improve-writing";
import { useAuthStore } from "@/client/stores/auth";
import { useWallet } from "@/client/hooks/useWallet";
import { CoinConfirmPopover } from "@/client/components/modals/coin-confirm-modal";


type Action = "improve" | "fix" | "tone";
type Mood = "casual" | "professional" | "confident" | "friendly";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export const AiActions = ({ value, onChange, className }: Props) => {
  const [loading, setLoading] = useState<Action | false>(false);
  const [showCoinPopover, setShowCoinPopover] = useState(false);
  const [pendingAction, setPendingAction] = useState<{action: Action, mood?: Mood} | null>(null);
  
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // Wallet and coin management
  const { 
    balance, 
    canAfford, 
    deductCoinsWithRollback, 
    completeTransaction, 
    refundTransaction, 
    fetchBalance 
  } = useWallet(user?.id || '');
  
  const improveButtonRef = useRef<HTMLButtonElement>(null);
  const fixButtonRef = useRef<HTMLButtonElement>(null);
  const toneButtonRef = useRef<HTMLButtonElement>(null);
  
  const AI_ACTION_COST = 3; // 3 coins per AI action

  const generateTransactionId = (action: string): string => {
    return `ai_action_${action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAiAction = async (action: Action, mood?: Mood) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use AI features",
        variant: "error",
      });
      return;
    }

    if (!value || value.trim().length === 0) {
      toast({
        title: "Text Required",
        description: "Please enter some text to use AI features",
        variant: "error",
      });
      return;
    }

    // Check if user can afford
    const affordable = await canAfford(AI_ACTION_COST);
    
    if (!affordable) {
      setPendingAction({ action, mood });
      setShowCoinPopover(true);
      return;
    }

    // Proceed with AI action
    await processAiAction(action, mood);
  };

  const processAiAction = async (action: Action, mood?: Mood) => {
    const transactionId = generateTransactionId(action);
    let transactionSuccess = false;
    
    setLoading(action);

    // Show loading toast
    const loadingToast = toast({
      title: `Processing ${getActionName(action, mood)}`,
      description: `Applying AI enhancement (Cost: ${AI_ACTION_COST} coins)...`,
      variant: "default",
    });

    try {
      // Reserve coins
      const transactionResult = await deductCoinsWithRollback(
        AI_ACTION_COST,
        `AI ${getActionName(action, mood)}`,
        { 
          transactionId, 
          action: `ai_${action}`,
          mood: mood,
          textLength: value.length
        }
      );

      if (!transactionResult.success) {
        throw new Error('Failed to reserve coins for AI action');
      }

      transactionSuccess = true;

      // Process AI action
      let result = value;

      if (action === "improve") result = await improveWriting(value);
      if (action === "fix") result = await fixGrammar(value);
      if (action === "tone" && mood) result = await changeTone(value, mood);

      // Dismiss loading toast
      if (loadingToast && typeof loadingToast.dismiss === 'function') {
        loadingToast.dismiss();
      }
      
      onChange(result);
      
      // Mark transaction as completed
      await completeTransaction(transactionId, {
        result: 'success',
        action: `ai_${action}`,
        mood: mood,
        textLength: value.length,
        processedAt: new Date().toISOString()
      });

      toast({
        title: "AI Enhancement Applied!",
        description: `Your text has been enhanced. ${AI_ACTION_COST} coins deducted.`,
        variant: "success",
      });

      setShowCoinPopover(false);
      setPendingAction(null);

    } catch (error: any) {
      console.error("AI action failed:", error);
      
      // Dismiss loading toast
      if (loadingToast && typeof loadingToast.dismiss === 'function') {
        loadingToast.dismiss();
      }
      
      // Refund coins if transaction was successful
      if (transactionSuccess) {
        try {
          await refundTransaction(transactionId, error.message || 'AI action failed');
          await fetchBalance();
          
          toast({
            title: "Action Failed",
            description: `${AI_ACTION_COST} coins refunded`,
            variant: "info",
          });
        } catch (refundError) {
          console.error('Failed to refund coins:', refundError);
        }
      }

      toast({
        variant: "error",
        title: t`Oops, the server returned an error.`,
        description: (error as Error).message,
      });

      setShowCoinPopover(false);
      setPendingAction(null);
    } finally {
      setLoading(false);
    }
  };

  const confirmAiAction = async () => {
    try {
      if (!pendingAction) return;

      const affordable = await canAfford(AI_ACTION_COST);

      if (!affordable) {
        toast({
          title: "Insufficient Coins",
          description: "You don't have enough coins for this AI action",
          variant: "error",
        });
        setShowCoinPopover(false);
        setPendingAction(null);
        return;
      }

      await processAiAction(pendingAction.action, pendingAction.mood);

    } catch (error: any) {
      console.error("AI action preparation failed:", error);
      toast({
        title: "Action Failed",
        description: "Failed to prepare AI action",
        variant: "error",
      });
      setShowCoinPopover(false);
      setPendingAction(null);
    }
  };

  const handleBuyCoins = (goSubscription = false) => {
    setShowCoinPopover(false);
    setPendingAction(null);
    if (goSubscription) {
      navigate("/dashboard/pricing");
    } else {
      const shortage = AI_ACTION_COST - balance;
      navigate(`/dashboard/coins?needed=${shortage > 0 ? shortage : AI_ACTION_COST}`);
    }
  };

  const getActionName = (action: Action, mood?: Mood): string => {
    switch (action) {
      case "improve":
        return "Writing Improvement";
      case "fix":
        return "Grammar Fix";
      case "tone":
        return mood ? `Tone Change (${mood})` : "Tone Change";
      default:
        return "AI Enhancement";
    }
  };

  const getActionDescription = (action: Action, mood?: Mood): string => {
    switch (action) {
      case "improve":
        return "Enhance your writing with AI-powered improvements for better clarity and impact.";
      case "fix":
        return "Fix spelling and grammar errors to ensure professional communication.";
      case "tone":
        const toneDescriptions = {
          casual: "Make your text more casual and conversational.",
          professional: "Give your text a formal, business-appropriate tone.",
          confident: "Make your writing more assertive and self-assured.",
          friendly: "Add warmth and approachability to your text."
        };
        return mood ? toneDescriptions[mood] : "Adjust the tone of your writing.";
      default:
        return "Apply AI enhancement to your text.";
    }
  };

  // Get current trigger ref based on pending action
  const getTriggerRef = () => {
    if (!pendingAction) return undefined;
    
    switch (pendingAction.action) {
      case "improve":
        return improveButtonRef;
      case "fix":
        return fixButtonRef;
      case "tone":
        return toneButtonRef;
      default:
        return undefined;
    }
  };

  // if (!aiEnabled) return null;

  return (
    <>
      <div
        className={cn(
          "relative mt-4 rounded bg-secondary-accent/50 p-3 outline outline-secondary-accent",
          "flex flex-wrap items-center justify-center gap-2",
          className,
        )}
      >
        {/* User balance display */}
        {user && (
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/30 rounded-full border border-yellow-200 dark:border-yellow-800">
              <Coins size={12} className="text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs font-medium text-yellow-800 dark:text-yellow-300">{balance}</span>
            </div>
          </div>
        )}

        <Button 
          ref={improveButtonRef}
          size="sm" 
          className="border border-gray-700 relative group" 
          variant="outline" 
          disabled={!!loading || !user}
          onClick={() => handleAiAction("improve")}
        >
          {loading === "improve" ? (
            <CircleNotch className="animate-spin" />
          ) : (
            <>
              <PenNib />
              <span className="ml-2 text-xs">{t`Improve Writing`}</span>
              {/* Coin badge */}
              <div className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-yellow-500 text-white text-[8px] font-bold shadow-sm">
                {AI_ACTION_COST}
              </div>
            </>
          )}
        </Button>

        <Button 
          ref={fixButtonRef}
          size="sm" 
          className="border border-gray-700 relative group" 
          variant="outline" 
          disabled={!!loading || !user}
          onClick={() => handleAiAction("fix")}
        >
          {loading === "fix" ? (
            <CircleNotch className="animate-spin" />
          ) : (
            <>
              <Exam />
              <span className="ml-2 text-xs">{t`Fix Spelling & Grammar`}</span>
              {/* Coin badge */}
              <div className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-yellow-500 text-white text-[8px] font-bold shadow-sm">
                {AI_ACTION_COST}
              </div>
            </>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              ref={toneButtonRef}
              size="sm" 
              className="border border-gray-700 relative group" 
              variant="outline" 
              disabled={!!loading || !user}
            >
              {loading === "tone" ? (
                <CircleNotch className="animate-spin" />
              ) : (
                <>
                  <ChatTeardropText />
                  <span className="mx-2 text-xs">{t`Change Tone`}</span>
                  {/* Coin badge */}
                  <div className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-yellow-500 text-white text-[8px] font-bold shadow-sm">
                    {AI_ACTION_COST}
                  </div>
                  <CaretDown />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleAiAction("tone", "casual")}>
              <span role="img" aria-label={t`Casual`}>
                🙂
              </span>
              <span className="ml-2">{t`Casual`}</span>
              <div className="ml-auto flex items-center gap-1 text-xs text-yellow-600">
                <Coins size={10} />
                {AI_ACTION_COST}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAiAction("tone", "professional")}>
              <span role="img" aria-label={t`Professional`}>
                💼
              </span>
              <span className="ml-2">{t`Professional`}</span>
              <div className="ml-auto flex items-center gap-1 text-xs text-yellow-600">
                <Coins size={10} />
                {AI_ACTION_COST}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAiAction("tone", "confident")}>
              <span role="img" aria-label={t`Confident`}>
                😎
              </span>
              <span className="ml-2">{t`Confident`}</span>
              <div className="ml-auto flex items-center gap-1 text-xs text-yellow-600">
                <Coins size={10} />
                {AI_ACTION_COST}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAiAction("tone", "friendly")}>
              <span role="img" aria-label={t`Friendly`}>
                😊
              </span>
              <span className="ml-2">{t`Friendly`}</span>
              <div className="ml-auto flex items-center gap-1 text-xs text-yellow-600">
                <Coins size={10} />
                {AI_ACTION_COST}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Info text */}
        <div className="w-full text-center mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Each AI action costs {AI_ACTION_COST} coins
          </p>
        </div>
      </div>

      {/* Coin Confirmation Popover */}
      <CoinConfirmPopover
        open={showCoinPopover}
        onClose={() => {
          setShowCoinPopover(false);
          setPendingAction(null);
        }}
        required={AI_ACTION_COST}
        balance={balance}
        onConfirm={confirmAiAction}
        onBuyCoins={handleBuyCoins}
        title={pendingAction ? getActionName(pendingAction.action, pendingAction.mood) : "AI Enhancement"}
        description={pendingAction ? getActionDescription(pendingAction.action, pendingAction.mood) : "Apply AI enhancement to your text."}
        actionType="enhance"
        triggerRef={getTriggerRef()}
        userId={user?.id}
        metadata={{
          action: pendingAction?.action,
          mood: pendingAction?.mood,
          costBreakdown: `AI Action: ${AI_ACTION_COST} coins`,
          textLength: value?.length || 0,
        }}
      />
    </>
  );
};
