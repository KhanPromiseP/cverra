// import { t, Trans } from "@lingui/macro";
// import { useState, useEffect, useRef } from 'react';
// import { 
//   Button, 
//   Input, 
//   Label, 
//   Select, 
//   SelectTrigger, 
//   SelectValue, 
//   SelectContent, 
//   SelectItem,
// } from "@reactive-resume/ui";
// import { 
//   Settings, 
//   Type, 
//   Palette, 
//   Layout, 
//   Wand2, 
//   RefreshCw, 
//   AlignLeft,
//   AlignCenter,
//   AlignRight,
//   AlignJustify,
//   Paintbrush,
//   TextCursor,
//   Move,
//   Expand,
//   Minus,
//   Plus,
//   ArrowLeft,
//   ArrowRight,
//   ArrowUp,
//   ArrowDown,
//   RotateCcw,
//   Bold,
//   Italic,
//   Underline,
//   MousePointerClick,
//   Zap,
//   Sparkles,
//   Target,
//   Navigation,
//   Compass,
//   Box,
//   Layers,
//   Square,
//   CheckCircle2, 
//   XCircle,
//   AlertCircle,
//   Lightbulb,
//   MessageCircle,
//   Coins,
//   Crown,
//   Loader2,
//   Globe, 
//   BookOpen, 
//   FileText,
//   Languages
// } from "lucide-react";
// import { Textarea } from "../../../ui/textarea";

// import { useCoverLetterStore } from "../../../../../stores/cover-letter";
// import { coverLetterService } from "@/client/services/cover-letter.service";
// import { useAuthStore } from '@/client/stores/auth';
// import { useWallet } from '@/client/hooks/useWallet';
// import { CoinConfirmPopover } from '@/client/components/modals/coin-confirm-modal';
// import { toast } from "sonner";

// type ProcessState = 'idle' | 'reserving' | 'processing' | 'success' | 'error';
// type ProcessType = 'enhance' | 'regenerate' | 'quick-enhance' | 'regenerate-complete' | 'translate';

// interface ProcessStatus {
//   state: ProcessState;
//   type?: ProcessType;
//   message?: string;
//   instructions?: string;
//   transactionId?: string;
// }

// export const AISection = () => {
//   const [enhanceInstructions, setEnhanceInstructions] = useState('');
//   const [processStatus, setProcessStatus] = useState<ProcessStatus>({ state: 'idle' });
//   const [lastFailedInstructions, setLastFailedInstructions] = useState<string>('');
//   const [showCoinPopover, setShowCoinPopover] = useState(false);
//   const [pendingAction, setPendingAction] = useState<{ type: ProcessType; instructions?: string } | null>(null);
  
//   const { coverLetter, selectedBlock, setCoverLetter } = useCoverLetterStore();
//   const { user } = useAuthStore();
//   const { balance, canAfford, deductCoinsWithRollback, completeTransaction, refundTransaction, fetchBalance } = useWallet(user?.id || '');

//   const [regenerateInstructions, setRegenerateInstructions] = useState('');
//   const [translationLanguage, setTranslationLanguage] = useState('');
//   const [isTranslating, setIsTranslating] = useState(false);


  

//   // Refs for popover positioning
//   const quickEnhanceRef = useRef<HTMLDivElement>(null);
//   const regenerateRef = useRef<HTMLButtonElement>(null);
//   const customEnhanceRef = useRef<HTMLButtonElement>(null);

//   // AI enhancement costs
//   const enhancementCosts = {
//     'quick-enhance': 1,
//     'enhance': 3,
//     'regenerate': 2,
//     'regenerate-complete': 5, 
//     'translate': 4 
//   };

//   // supported languages
//   const SUPPORTED_LANGUAGES = [
//     { code: 'es', name: t`Spanish`, native: 'Español' },
//     { code: 'fr', name: t`French`, native: 'Français' },
//     { code: 'de', name: t`German`, native: 'Deutsch' },
//     { code: 'it', name: t`Italian`, native: 'Italiano' },
//     { code: 'pt', name: t`Portuguese`, native: 'Português' },
//     { code: 'ru', name: t`Russian`, native: 'Русский' },
//     { code: 'zh', name: t`Chinese`, native: '中文' },
//     { code: 'ja', name: t`Japanese`, native: '日本語' },
//     { code: 'ko', name: t`Korean`, native: '한국어' },
//     { code: 'ar', name: t`Arabic`, native: 'العربية' },
//     { code: 'hi', name: t`Hindi`, native: 'हिन्दी' },
//   ];

//   const selectedBlockData = selectedBlock 
//     ? coverLetter?.content?.blocks?.find((block: any) => block.id === selectedBlock) || null
//     : null;

//   const generateTransactionId = (type: ProcessType): string => {
//     return `ai_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//   };

//   const handleProcess = async (type: ProcessType, instructions?: string, ref?: React.RefObject<HTMLElement>) => {
//     if (!coverLetter?.id || !selectedBlock) {
//       toast.error(t`Please select a block to enhance`);
//       return;
//     }

//     // For block-specific operations, check selectedBlock
//     if ((type === 'enhance' || type === 'regenerate' || type === 'quick-enhance') && !selectedBlock) {
//       toast.error(t`Please select a block to enhance`);
//       return;
//     }
    
//     // For letter-level operations, check coverLetter.id
//     if (!coverLetter?.id) {
//       toast.error(t`No cover letter selected`);
//       return;
//     }

//     if (!user) {
//       toast.error(t`Please sign in to use AI features`);
//       return;
//     }

//     // Check if user can afford the action
//     const cost = enhancementCosts[type];
//     const affordable = await canAfford(cost);

//     if (!affordable) {
//       // Store the action and show coin popover
//       setPendingAction({ type, instructions });
//       setShowCoinPopover(true);
//       return;
//     }

//     // Proceed with AI enhancement if they can afford
//     await executeAIProcess(type, instructions, cost);
//   };

//   const executeAIProcess = async (type: ProcessType, instructions?: string, cost?: number) => {
//     if (!coverLetter?.id || !user) return;

//     // For block operations, require selectedBlock
//     if ((type === 'enhance' || type === 'regenerate' || type === 'quick-enhance') && !selectedBlock) {
//       toast.error(t`Please select a block for this operation`);
//       return;
//     }

//     // Generate unique transaction ID
//     const transactionId = generateTransactionId(type);

//     if (instructions) {
//       setLastFailedInstructions(instructions);
//     }

//     setProcessStatus({ 
//       state: 'reserving', 
//       type,
//       message: getProcessingMessage(type, 'reserving'),
//       instructions,
//       transactionId
//     });

//     let transactionSuccess = false;
//     let finalResult: any = null;

//     try {
//       const transactionResult = await deductCoinsWithRollback(
//         cost || 0,
//         `AI ${type} - Complete Letter`,
//         {
//           transactionId,
//           actionType: type,
//           coverLetterId: coverLetter.id,
//           instructions
//         }
//       );

//       if (!transactionResult.success) {
//         throw new Error(t`Failed to reserve coins for this action`);
//       }

//       transactionSuccess = true;

//       setProcessStatus(prev => ({ 
//         ...prev, 
//         state: 'processing',
//         message: getProcessingMessage(type, 'processing')
//       }));

//       let result;
      
//       // Handle different process types
//       if (type === 'regenerate-complete' && instructions) {
//         result = await coverLetterService.regenerateCompleteLetter(
//           coverLetter.id,
//           instructions,
//           { transactionId }
//         );
//       } else if (type === 'translate' && instructions) {
//         result = await coverLetterService.translateLetter(
//           coverLetter.id,
//           instructions,
//           { transactionId }
//         );
//       } else if (type === 'enhance' && instructions && selectedBlock) {
//         result = await coverLetterService.enhanceBlock(
//           coverLetter.id, 
//           selectedBlock, 
//           instructions,
//           { transactionId }
//         );
//       } else if (type === 'regenerate' && selectedBlock) {
//         result = await coverLetterService.regenerateBlock(
//           coverLetter.id, 
//           selectedBlock,
//           { transactionId }
//         );
//       } else if (type === 'quick-enhance' && instructions && selectedBlock) {
//         result = await coverLetterService.enhanceBlock(
//           coverLetter.id, 
//           selectedBlock, 
//           instructions,
//           { transactionId }
//         );
//       } else {
//         throw new Error(t`Invalid operation parameters`);
//       }

//       if (result && result.coverLetter) {
//         setCoverLetter(result.coverLetter);
//         finalResult = result;

//         await completeTransaction(transactionId, {
//           result: 'success',
//           actionType: type,
//           coverLetterId: coverLetter.id
//         });

//         const successMessage = getSuccessMessage(type);
        
//         toast.success(
//           <div className="space-y-1">
//             <div className="font-medium">{successMessage}</div>
//             <div className="text-xs text-green-600 flex items-center gap-1">
//               <Coins className="w-3 h-3" />
//               {t`Used ${cost} coins`} • {t`Transaction:`} {transactionId.slice(-8)}
//             </div>
//           </div>,
//           { duration: 10000 }
//         );

//         setProcessStatus({ 
//           state: 'success', 
//           type,
//           message: successMessage,
//           transactionId
//         });

//         // Clear inputs on success
//         if (type === 'regenerate-complete') {
//           setRegenerateInstructions('');
//         } else if (type === 'translate') {
//           setTranslationLanguage('');
//         } else if (type === 'enhance') {
//           setEnhanceInstructions('');
//         }

//         setLastFailedInstructions('');

//         setTimeout(() => {
//           setProcessStatus(prev => prev.state === 'success' ? { state: 'idle' } : prev);
//         }, 10000);

//       } else {
//         throw new Error(t`AI processing returned no result`);
//       }

//     } catch (error: any) {
//       console.error(`${type} failed:`, error);
      
//       if (transactionSuccess) {
//         try {
//           const refundReason = error.message || t`AI processing failed`;
//           await refundTransaction(transactionId, refundReason);
//           await fetchBalance();
//         } catch (refundError) {
//           console.error(t`Failed to refund coins:`, refundError);
//         }
//       }

//       const errorMessage = getErrorMessage(type, error, transactionSuccess);
      
//       toast.error(errorMessage, {
//         duration: 20000,
//         icon: <XCircle className="w-4 h-4 text-red-500" />,
//         action: (processStatus.instructions || instructions) ? {
//           label: t`Retry`,
//           onClick: () => handleRetry()
//         } : undefined
//       });

//       setProcessStatus({ 
//         state: 'error', 
//         type,
//         message: errorMessage,
//         instructions: instructions || lastFailedInstructions,
//         transactionId
//       });

//       // Keep instructions for retry
//       if (type === 'regenerate-complete' && instructions) {
//         setRegenerateInstructions(instructions);
//       } else if (type === 'translate' && instructions) {
//         setTranslationLanguage(instructions);
//       } else if (type === 'enhance' && instructions) {
//         setEnhanceInstructions(instructions);
//       }

//       setTimeout(() => {
//         setProcessStatus(prev => prev.state === 'error' ? { state: 'idle' } : prev);
//       }, 20000);
//     }
//   };

//   const handleCoinConfirm = async () => {
//     if (pendingAction) {
//       const cost = enhancementCosts[pendingAction.type];
//       await executeAIProcess(pendingAction.type, pendingAction.instructions, cost);
//       setPendingAction(null);
//       setShowCoinPopover(false);
//     }
//   };

//   const handleBuyCoins = (goSubscription = false) => {
//     setShowCoinPopover(false);
//     setPendingAction(null);
//     // Navigate to coins or subscription page
//     if (goSubscription) {
//       window.location.href = "/dashboard/pricing";
//     } else {
//       const cost = pendingAction ? enhancementCosts[pendingAction.type] : enhancementCosts.enhance;
//       window.location.href = `/dashboard/coins?needed=${cost - balance}`;
//     }
//   };

//   const getProcessingMessage = (type: ProcessType, stage: string): string => {
//     const messages = {
//       reserving: t`Reserving coins...`,
//       processing: {
//         enhance: t`Improving your text with advanced language processing...`,
//         regenerate: t`Rewriting this section with enhanced wording...`,
//         'quick-enhance': t`Applying style and clarity improvements...`,
//         'regenerate-complete': t`Creating a completely new version of your letter...`,
//         translate: t`Translating while preserving tone and meaning...`
//       }[type] || t`Processing...`
//     };
//     return stage === 'reserving' ? messages.reserving : messages.processing;
//   };

//   const getSuccessMessage = (type: ProcessType): string => {
//     const messages = {
//       enhance: t`Content enhanced successfully!`,
//       regenerate: t`Block regenerated successfully!`,
//       'quick-enhance': t`Quick enhancement applied!`,
//       'regenerate-complete': t`Complete letter regenerated successfully!`,
//       translate: t`Letter translated successfully!`
//     };
//     return messages[type] || t`Operation completed successfully!`;
//   };

//   const getErrorMessage = (type: ProcessType, error: any, wasCharged: boolean): string => {
//     const messages = {
//       enhance: wasCharged 
//         ? t`Failed to enhance content. Your coins have been refunded.`
//         : t`Failed to enhance content. Please try again.`,
//       regenerate: wasCharged
//         ? t`Failed to regenerate block. Your coins have been refunded.`
//         : t`Failed to regenerate block. Please try again.`,
//       'quick-enhance': wasCharged
//         ? t`Failed to apply enhancement. Your coins have been refunded.`
//         : t`Failed to apply enhancement. Please try again.`,
//       'regenerate-complete': wasCharged
//         ? t`Failed to regenerate complete letter. Your coins have been refunded.`
//         : t`Failed to regenerate complete letter. Please try again.`,
//       translate: wasCharged
//         ? t`Failed to translate letter. Your coins have been refunded.`
//         : t`Failed to translate letter. Please try again.`
//     };
    
//     return messages[type] || t`AI processing failed. ${wasCharged ? t`Your coins have been refunded.` : ''}`;
//   };

//   const quickEnhance = (action: string) => {
//     const instructionsMap: Record<string, string> = {
//       professional: t`Make this more professional and business-appropriate`,
//       concise: t`Make this more concise and to the point`,
//       impactful: t`Make this more impactful with stronger action verbs`,
//       friendly: t`Make this more friendly and approachable`,
//       formal: t`Make this more formal and traditional`,
//       modern: t`Update with contemporary language`,
//       persuasive: t`Make this more persuasive and compelling`,
//       confident: t`Make this more confident and authoritative`
//     };
    
//     const instructions = instructionsMap[action];
//     if (instructions) {
//       handleProcess('quick-enhance', instructions, quickEnhanceRef);
//     }
//   };

//   const handleCustomEnhance = () => {
//     if (enhanceInstructions.trim()) {
//       handleProcess('enhance', enhanceInstructions, customEnhanceRef);
//     }
//   };

//   const handleRetry = () => {
//     if (processStatus.instructions) {
//       handleProcess(processStatus.type || 'enhance', processStatus.instructions);
//     }
//   };

//   const handleClearError = () => {
//     setProcessStatus({ state: 'idle' });
//     setLastFailedInstructions('');
//   };

//   // Status Display Component
//   const StatusDisplay = () => {
//     if (processStatus.state === 'idle') return null;

//     const statusConfig = {
//       reserving: {
//         icon: Loader2,
//         color: 'text-yellow-500',
//         bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
//         borderColor: 'border-yellow-200 dark:border-yellow-800',
//         spin: true
//       },
//       processing: {
//         icon: Loader2,
//         color: 'text-blue-500',
//         bgColor: 'bg-blue-50 dark:bg-blue-900/20',
//         borderColor: 'border-blue-200 dark:border-blue-800',
//         spin: true
//       },
//       success: {
//         icon: CheckCircle2,
//         color: 'text-green-500',
//         bgColor: 'bg-green-50 dark:bg-green-900/20',
//         borderColor: 'border-green-200 dark:border-green-800',
//         spin: false
//       },
//       error: {
//         icon: XCircle,
//         color: 'text-red-500',
//         bgColor: 'bg-red-50 dark:bg-red-900/20',
//         borderColor: 'border-red-200 dark:border-red-800',
//         spin: false
//       }
//     };

//     const config = statusConfig[processStatus.state];
//     const IconComponent = config.icon;

//     return (
//       <div className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} animate-in slide-in-from-bottom-2 duration-300`}>
//         <div className="flex items-start space-x-2">
//           <IconComponent className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.color} ${config.spin ? 'animate-spin' : ''}`} />
//           <div className="flex-1 min-w-0">
//             <p className="text-sm font-medium text-gray-900 dark:text-white">
//               {processStatus.message}
//             </p>
//             {processStatus.state === 'error' && (
//               <div className="mt-2 space-y-2">
//                 {processStatus.instructions && (
//                   <p className="text-xs text-gray-600 dark:text-gray-400">
//                     {t`Your instructions:`} "{processStatus.instructions}"
//                   </p>
//                 )}
//                 <div className="flex space-x-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={handleRetry}
//                     className="text-xs h-7"
//                   >
//                     <RefreshCw className="w-3 h-3 mr-1" />
//                     {t`Try Again`}
//                   </Button>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={handleClearError}
//                     className="text-xs h-7"
//                   >
//                     {t`Dismiss`}
//                   </Button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Complete Regeneration Section
//   const CompleteRegenerationSection = () => (
//     <div className="space-y-3 pt-4 border-t">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center space-x-2">
//           <RefreshCw className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
//           <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t`Complete Letter Regeneration`}</h3>
//         </div>
//         <div className="flex items-center space-x-1 text-xs text-indigo-600 dark:text-indigo-400">
//           <div>{t`Cost:`}</div>
//           <Coins className="w-3 h-3" />
//           <span>{enhancementCosts['regenerate-complete']}</span>
//         </div>
//       </div>
      
//       <div className="space-y-2">
//         <Textarea
//           value={regenerateInstructions}
//           onChange={(e) => setRegenerateInstructions(e.target.value)}
//           placeholder={t`Instruction on how to regenerate the entire letter...`}
//           className="min-h-[80px] resize-none text-sm border-indigo-200 dark:border-indigo-800 focus:border-indigo-300 dark:focus:border-indigo-600 transition-colors"
//           disabled={processStatus.state === 'processing' || processStatus.state === 'reserving'}
//         />
        
//         <div className="grid grid-cols-2 gap-2">
//           <Button
//             onClick={() => handleProcess('regenerate-complete', regenerateInstructions)}
//             disabled={processStatus.state === 'processing' || processStatus.state === 'reserving' || !regenerateInstructions.trim()}
//             className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
//             size="sm"
//           >
//             <FileText className="w-4 h-4 mr-2" />
//             {processStatus.state === 'processing' || processStatus.state === 'reserving' ? t`Regenerating...` : t`Regenerate All`}
//           </Button>
          
//           <Button
//             variant="outline"
//             onClick={() => setRegenerateInstructions('')}
//             disabled={processStatus.state === 'processing' || processStatus.state === 'reserving' || !regenerateInstructions.trim()}
//             className="border-indigo-200 dark:border-indigo-800"
//             size="sm"
//           >
//             {t`Clear`}
//           </Button>
//         </div>
//       </div>
      
//       <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-100 dark:border-indigo-800">
//         <p className="text-xs text-indigo-700 dark:text-indigo-300">
//           <span className="font-medium">{t`Note:`}</span> {t`This will regenerate the entire letter from scratch based on your instructions.`}
//         </p>
//       </div>
//     </div>
//   );

//   // Translation Section
//   const TranslationSection = () => (
//     <div className="space-y-3 pt-4 border-t">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center space-x-2">
//           <Globe className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
//           <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t`Translate Letter`}</h3>
//         </div>
//         <div className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400">
//           <div>{t`Cost:`}</div>
//           <Coins className="w-3 h-3" />
//           <span>{enhancementCosts['translate']}</span>
//         </div>
//       </div>
      
//       <div className="space-y-2">
//         <div className="grid grid-cols-2 gap-2">
//           <select
//             value={translationLanguage}
//             onChange={(e) => setTranslationLanguage(e.target.value)}
//             className="col-span-2 px-3 py-2 text-sm border border-emerald-200 dark:border-emerald-800 rounded-lg bg-white dark:bg-gray-800 focus:border-emerald-300 dark:focus:border-emerald-600"
//             disabled={processStatus.state === 'processing' || processStatus.state === 'reserving'}
//           >
//             <option value="">{t`Select target language...`}</option>
//             {SUPPORTED_LANGUAGES.map((lang) => (
//               <option key={lang.code} value={lang.code}>
//                 {lang.name} ({lang.native})
//               </option>
//             ))}
//           </select>
          
//           <Button
//             onClick={() => handleProcess('translate', translationLanguage)}
//             disabled={processStatus.state === 'processing' || processStatus.state === 'reserving' || !translationLanguage}
//             className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
//             size="sm"
//           >
//             <Languages className="w-4 h-4 mr-2" />
//             {processStatus.state === 'processing' || processStatus.state === 'reserving' ? t`Translating...` : t`Translate`}
//           </Button>
          
//           <Button
//             variant="outline"
//             onClick={() => setTranslationLanguage('')}
//             disabled={processStatus.state === 'processing' || processStatus.state === 'reserving' || !translationLanguage}
//             className="border-emerald-200 dark:border-emerald-800"
//             size="sm"
//           >
//             {t`Clear`}
//           </Button>
//         </div>
//       </div>
      
//       <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded border border-emerald-100 dark:border-emerald-800">
//         <p className="text-xs text-emerald-700 dark:text-emerald-300">
//           <span className="font-medium">{t`Note:`}</span> {t`This will translate the entire letter while maintaining formatting and structure.`}
//         </p>
//       </div>
//     </div>
//   );

//   const isProcessing = processStatus.state === 'processing' || processStatus.state === 'reserving';
//   const currentActionCost = pendingAction ? enhancementCosts[pendingAction.type] : enhancementCosts.enhance;

//   if (!selectedBlock) {
//     return (
//       <section id="ai" className="space-y-4">
//         <div className="flex items-center space-x-2">
//           <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
//           <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t`AI Assistant`}</h2>
//         </div>

//         <div className="p-6 text-center text-gray-500 dark:text-gray-400 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-lg border border-dashed border-purple-200 dark:border-purple-800">
//           <Sparkles className="w-8 h-8 mx-auto mb-3 text-purple-400 dark:text-purple-500" />
//           <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">
//             {t`AI Magic Awaits`}
//           </p>
//           <p className="text-xs text-purple-600 dark:text-purple-400">
//             {t`Select a text block to unlock AI enhancement features`}
//           </p>
//         </div>
//       </section>
//     );
//   }

//   return (
//     <section id="ai" className="space-y-8">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center space-x-2">
//           <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
//           <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t`Content Enhancer`}</h2>
//         </div>
//         {isProcessing && (
//           <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
//             <Loader2 className="w-3 h-3 animate-spin" />
//             <span>{t`Processing request...`}</span>
//           </div>
//         )}
//       </div>

//       {/* Status Display */}
//       <StatusDisplay />

//       {/* Selected Block Info */}
//       <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
//         <div className="flex items-center justify-between">
//           <div>
//             <h3 className="text-xs font-medium text-purple-900 dark:text-purple-100 uppercase tracking-wide">
//               {t`Editing Block`}
//             </h3>
//             <p className="text-sm text-purple-700 dark:text-purple-300 capitalize">
//               {selectedBlockData?.type?.toLowerCase() || t`content`}
//             </p>
//           </div>
//           <Target className="w-4 h-4 text-purple-500 dark:text-purple-400" />
//         </div>
//       </div>

//       {/* Coin Balance */}
//       <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-2">
//             <Coins className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
//             <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{t`Your Coins`}</span>
//           </div>
//           <div className="flex items-center space-x-2">
//             <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{balance}</span>
//             <Crown className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
//           </div>
//         </div>
//       </div>

//       {/* Quick Enhance Buttons */}
//       <div ref={quickEnhanceRef} className="space-y-3">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-2">
//             <Zap className="w-4 h-4 text-orange-500 dark:text-orange-400" />
//             <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t`Quick Enhance`}</h3>
//           </div>
//           <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
//             <div>{t`Cost per enhancement:`}</div>
//             <Coins className="w-3 h-3" />
//             <span>{enhancementCosts['quick-enhance']}</span>
//           </div>
//         </div>
        
//         <div className="grid grid-cols-2 gap-2">
//           {[
//             { key: 'professional', label: t`Professional`, icon: Languages },
//             { key: 'concise', label: t`Concise`, icon: RefreshCw },
//             { key: 'impactful', label: t`Impactful`, icon: Sparkles },
//             { key: 'friendly', label: t`Friendly`, icon: MessageCircle },
//             { key: 'formal', label: t`Formal`, icon: Languages },
//             { key: 'modern', label: t`Modern`, icon: Sparkles },
//             { key: 'persuasive', label: t`Persuasive`, icon: Target },
//             { key: 'confident', label: t`Confident`, icon: Zap }
//           ].map(({ key, label, icon: Icon }) => (
//             <Button
//               key={key}
//               variant="outline"
//               onClick={() => quickEnhance(key)}
//               disabled={isProcessing}
//               size="sm"
//               className="h-9 text-xs justify-start border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
//             >
//               <Icon className="w-3 h-3 mr-1.5 text-orange-500 dark:text-orange-400" />
//               {label}
//             </Button>
//           ))}
//         </div>
//       </div>

//       {/* Regenerate Button */}
//       <div className="flex items-center justify-between p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg border border-green-200 dark:border-green-800">
//         <Button
//           ref={regenerateRef}
//           variant="outline"
//           onClick={() => handleProcess('regenerate', undefined, regenerateRef)}
//           disabled={isProcessing}
//           className="flex-1 justify-center border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
//           size="sm"
//         >
//           <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
//           {isProcessing ? t`Regenerating...` : t`AI Regeneration block`}
//         </Button>
//         <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400 ml-2">
//           <div>{t`Cost:`}</div>
//           <Coins className="w-3 h-3" />
//           <span>{enhancementCosts.regenerate}</span>
//         </div>
//       </div>

//       {/* Custom Instructions */}
//       <div className="space-y-3 pt-2 border-t">
//         <div className="flex items-center justify-between">
//           <Label htmlFor="ai-instructions" className="text-sm font-medium text-gray-900 dark:text-white">
//             {t`Custom Instructions`}
//           </Label>
//           <div className="flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400">
//             <div>{t`Cost:`}</div>
//             <Coins className="w-3 h-3" />
//             <span>{enhancementCosts.enhance}</span>
//           </div>
//         </div>
        
//         <div className="space-y-2">
//           <Textarea
//             id="ai-instructions"
//             value={enhanceInstructions}
//             onChange={(e) => setEnhanceInstructions(e.target.value)}
//             placeholder={t`Instruct exactly this block should be improved...`}
//             className="min-h-[80px] resize-none text-sm border-purple-200 dark:border-purple-800 focus:border-purple-300 dark:focus:border-purple-600 transition-colors"
//             disabled={isProcessing}
//           />
          
//           <div className="flex space-x-2">
//             <Button
//               ref={customEnhanceRef}
//               onClick={handleCustomEnhance}
//               disabled={isProcessing || !enhanceInstructions.trim()}
//               className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
//               size="sm"
//             >
//               <Wand2 className="w-4 h-4 mr-2" />
//               {isProcessing ? t`Enhancing...` : t`Enhance`}
//             </Button>
            
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setEnhanceInstructions('');
//                 setLastFailedInstructions('');
//               }}
//               disabled={isProcessing || !enhanceInstructions.trim()}
//               className="border-purple-200 dark:border-purple-800"
//               size="sm"
//             >
//               {t`Clear`}
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Complete Regeneration Section */}
//       <CompleteRegenerationSection />

//       {/* Translation Section */}
//       <TranslationSection />

//       {/* Tips */}
//       <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
//         <div className="flex items-center space-x-2 mb-2">
//           <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
//           <h4 className="text-xs font-medium text-amber-900 dark:text-amber-100">{t`Pro Instructions Tips`}</h4>
//         </div>
//         <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
//           <li className="flex items-start space-x-2">
//             <span className="text-amber-500 mt-0.5">•</span>
//             <span>{t`Be specific about tone and style you want`}</span>
//           </li>
//           <li className="flex items-start space-x-2">
//             <span className="text-amber-500 mt-0.5">•</span>
//             <span>{t`Mention target audience if applicable`}</span>
//           </li>
//           <li className="flex items-start space-x-2">
//             <span className="text-amber-500 mt-0.5">•</span>
//             <span>{t`Specify length or key points to include`}</span>
//           </li>
//           <li className="flex items-start space-x-2">
//             <span className="text-amber-500 mt-0.5">•</span>
//             <span>{t`Give clear, actionable instructions`}</span>
//           </li>
//         </ul>
//       </div>

//       {/* Coin Confirmation Popover */}
//       <CoinConfirmPopover
//         open={showCoinPopover}
//         onClose={() => {
//           setShowCoinPopover(false);
//           setPendingAction(null);
//         }}
//         required={currentActionCost}
//         balance={balance}
//         onConfirm={handleCoinConfirm}
//         onBuyCoins={handleBuyCoins}
//         title={t`AI Enhancement - Coin Confirmation`}
//         description={pendingAction?.type === 'regenerate' 
//           ? t`Regenerate this block with AI for a complete rewrite.`
//           : t`Enhance your content with AI-powered improvements.`}
//         actionType="enhance"
//         triggerRef={
//           pendingAction?.type === 'quick-enhance' ? quickEnhanceRef : 
//           pendingAction?.type === 'regenerate' ? regenerateRef : 
//           customEnhanceRef
//         }
//       />
//     </section>
//   );
// };


import { t, Trans } from "@lingui/macro";
import { useState, useEffect, useRef } from 'react';
import { 
  Button, 
  Input, 
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Switch,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Separator,
  Slider,
} from "@reactive-resume/ui";
import { 
  Wand2, 
  RefreshCw, 
  Coins,
  Crown,
  Loader2,
  Globe, 
  FileText,
  Languages,
  Sparkles,
  Target,
  Zap,
  MessageCircle,
  Lightbulb,
  XCircle,
  CheckCircle2,
  Info,
  Settings,
  ChevronDown,
  ChevronUp,
  Lock,
  Shield,
  Download,
  Copy,
  Share2,
  Star,
  BookOpen,
  TrendingUp,
  Users,
  Clock,
  Eye,
  BarChart3,
  Filter,
  Grid,
  List,
  Maximize2,
  Minimize2,
  PanelLeft,
  PanelRight,
  Pin,
 
} from "lucide-react";
import { Textarea } from "../../../ui/textarea";

import { useCoverLetterStore } from "../../../../../stores/cover-letter";
import { coverLetterService } from "@/client/services/cover-letter.service";
import { useAuthStore } from '@/client/stores/auth';
import { useWallet } from '@/client/hooks/useWallet';
import { CoinConfirmPopover } from '@/client/components/modals/coin-confirm-modal';
import { toast } from "sonner";
import { TranslationVersion } from '@/client/services/cover-letter.service';
// Types
type ProcessState = 'idle' | 'reserving' | 'processing' | 'success' | 'error';
type ProcessType = 'enhance' | 'regenerate' | 'quick-enhance' | 'regenerate-complete' | 'translate';

interface ProcessStatus {
  state: ProcessState;
  type?: ProcessType;
  message?: string;
  instructions?: string;
  transactionId?: string;
}

// Translation Types
type TranslationMethod = 'preserve-structure' | 'section-by-section' | 'complete';
type TranslationPreservation = 'all' | 'formatting-only' | 'structure-only' | 'none';

interface TranslationSettings {
  method: TranslationMethod;
  preservation: TranslationPreservation;
  preserveNames: boolean;
  preserveDates: boolean;
  preserveNumbers: boolean;
  preserveUrls: boolean;
  preserveEmailAddresses: boolean;
  preserveTerms: string[];
  createNewVersion: boolean;
  versionName?: string;
}

// Supported languages with flags and metadata
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: t`English`, native: 'English', flag: '🇺🇸', difficulty: 'Easy' },
  { code: 'es', name: t`Spanish`, native: 'Español', flag: '🇪🇸', difficulty: 'Easy' },
  { code: 'fr', name: t`French`, native: 'Français', flag: '🇫🇷', difficulty: 'Medium' },
  { code: 'de', name: t`German`, native: 'Deutsch', flag: '🇩🇪', difficulty: 'Medium' },
  { code: 'it', name: t`Italian`, native: 'Italiano', flag: '🇮🇹', difficulty: 'Medium' },
  { code: 'pt', name: t`Portuguese`, native: 'Português', flag: '🇵🇹', difficulty: 'Medium' },
  { code: 'ru', name: t`Russian`, native: 'Русский', flag: '🇷🇺', difficulty: 'Hard' },
  { code: 'zh', name: t`Chinese`, native: '中文', flag: '🇨🇳', difficulty: 'Hard' },
  { code: 'ja', name: t`Japanese`, native: '日本語', flag: '🇯🇵', difficulty: 'Hard' },
  { code: 'ko', name: t`Korean`, native: '한국어', flag: '🇰🇷', difficulty: 'Hard' },
  { code: 'ar', name: t`Arabic`, native: 'العربية', flag: '🇸🇦', difficulty: 'Hard' },
  { code: 'hi', name: t`Hindi`, native: 'हिन्दी', flag: '🇮🇳', difficulty: 'Medium' },
  { code: 'nl', name: t`Dutch`, native: 'Nederlands', flag: '🇳🇱', difficulty: 'Medium' },
  { code: 'sv', name: t`Swedish`, native: 'Svenska', flag: '🇸🇪', difficulty: 'Easy' },
  { code: 'pl', name: t`Polish`, native: 'Polski', flag: '🇵🇱', difficulty: 'Hard' },
  { code: 'tr', name: t`Turkish`, native: 'Türkçe', flag: '🇹🇷', difficulty: 'Medium' },
];

export const AISection = () => {
  // Core states
  const [enhanceInstructions, setEnhanceInstructions] = useState('');
  const [processStatus, setProcessStatus] = useState<ProcessStatus>({ state: 'idle' });
  const [lastFailedInstructions, setLastFailedInstructions] = useState<string>('');
  const [showCoinPopover, setShowCoinPopover] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: ProcessType; instructions?: string; data?: any } | null>(null);
  
  const { coverLetter, selectedBlock, setCoverLetter } = useCoverLetterStore();
  const { user } = useAuthStore();
  const { balance, canAfford, deductCoinsWithRollback, completeTransaction, refundTransaction, fetchBalance } = useWallet(user?.id || '');

  // Regeneration states
  const [regenerateInstructions, setRegenerateInstructions] = useState('');
  const [regenerateIntensity, setRegenerateIntensity] = useState(50); // 0-100 slider

  // Translation states
  const [translationLanguage, setTranslationLanguage] = useState('');
  const [showAdvancedTranslation, setShowAdvancedTranslation] = useState(false);
  const [translationSettings, setTranslationSettings] = useState<TranslationSettings>({
    method: 'preserve-structure',
    preservation: 'all',
    preserveNames: true,
    preserveDates: true,
    preserveNumbers: true,
    preserveUrls: true,
    preserveEmailAddresses: true,
    preserveTerms: [],
    createNewVersion: true,
    versionName: '',
  });
  const [preserveTermsInput, setPreserveTermsInput] = useState('');
  
  // Language versions state

  const [availableTranslations, setAvailableTranslations] = useState<TranslationVersion[]>([]);
  const [loadingTranslations, setLoadingTranslations] = useState(false);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'enhance' | 'translate' | 'versions'>('enhance');

  // Refs for popover positioning
  const quickEnhanceRef = useRef<HTMLDivElement>(null);
  const regenerateRef = useRef<HTMLButtonElement>(null);
  const customEnhanceRef = useRef<HTMLButtonElement>(null);
  const translateRef = useRef<HTMLDivElement>(null);

  // AI enhancement costs
  const enhancementCosts = {
    'quick-enhance': 1,
    'enhance': 3,
    'regenerate': 2,
    'regenerate-complete': 5, 
    'translate': 4 
  };

  const selectedBlockData = selectedBlock 
    ? coverLetter?.content?.blocks?.find((block: any) => block.id === selectedBlock) || null
    : null;

  // Load available translations
  useEffect(() => {
    if (coverLetter?.id && user) {
      loadTranslations();
    }
  }, [coverLetter?.id, user]);

 const loadTranslations = async () => {
  if (!coverLetter?.id) return;
  
  try {
    setLoadingTranslations(true);
    const response = await coverLetterService.getLetterTranslations(coverLetter.id);
    
    console.log('Translations API response:', response);
    
    // response is already typed as TranslationVersion[] from the service
    setAvailableTranslations(response);
    
  } catch (error) {
    console.error('Failed to load translations:', error);
    setAvailableTranslations([]);
  } finally {
    setLoadingTranslations(false);
  }
};

  const generateTransactionId = (type: ProcessType): string => {
    return `ai_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleProcess = async (type: ProcessType, instructions?: string, data?: any, ref?: React.RefObject<HTMLElement>) => {
    if (!coverLetter?.id) {
      toast.error(t`No cover letter selected`);
      return;
    }

    // For block-specific operations, check selectedBlock
    if ((type === 'enhance' || type === 'regenerate' || type === 'quick-enhance') && !selectedBlock) {
      toast.error(t`Please select a block to enhance`);
      return;
    }

    if (!user) {
      toast.error(t`Please sign in to use AI features`);
      return;
    }

    // Check if user can afford the action
    const cost = enhancementCosts[type];
    const affordable = await canAfford(cost);

    if (!affordable) {
      // Store the action and show coin popover
      setPendingAction({ type, instructions, data });
      setShowCoinPopover(true);
      return;
    }

    // Proceed with AI enhancement if they can afford
    await executeAIProcess(type, instructions, cost, data);
  };

  const executeAIProcess = async (type: ProcessType, instructions?: string, cost?: number, data?: any) => {
    if (!coverLetter?.id || !user) return;

    // For block operations, require selectedBlock
    if ((type === 'enhance' || type === 'regenerate' || type === 'quick-enhance') && !selectedBlock) {
      toast.error(t`Please select a block for this operation`);
      return;
    }

    // Generate unique transaction ID
    const transactionId = generateTransactionId(type);

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
      const transactionResult = await deductCoinsWithRollback(
        cost || 0,
        `AI ${type} - Complete Letter`,
        {
          transactionId,
          actionType: type,
          coverLetterId: coverLetter.id,
          instructions,
          ...data
        }
      );

      if (!transactionResult.success) {
        throw new Error(t`Failed to reserve coins for this action`);
      }

      transactionSuccess = true;

      setProcessStatus(prev => ({ 
        ...prev, 
        state: 'processing',
        message: getProcessingMessage(type, 'processing')
      }));

      let result;
      
      // Handle different process types
     if (type === 'regenerate-complete' && instructions) {

        let result;
        result = await coverLetterService.regenerateCompleteLetter(
          coverLetter.id,
          instructions,
          { transactionId }
        );
        
        
        if (result && result.coverLetter) {
          // Show success and redirect to the new letter
          toast.success(
            <div className="space-y-1">
              <div className="font-medium">{t`New letter created: ${result.coverLetter.title}`}</div>
              <div className="text-xs text-green-600 flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {t`Used ${cost} coins`}
              </div>
            </div>,
            { 
              duration: 8000,
              action: {
                label: t`Open New Letter`,
                onClick: () => {
                  // Navigate to the new standalone letter
                  window.location.href = `/dashboard/cover-letter/${result.coverLetter.id}`;
                }
              }
            }
          );
          
          // Don't update current letter - keep current page as is
          // User can click "Open New Letter" to see it
          
          // Complete transaction
          await completeTransaction(transactionId, {
            result: 'success',
            actionType: type,
            coverLetterId: coverLetter.id,
            newCoverLetterId: result.coverLetter.id
          });

          // Clear input
          setRegenerateInstructions('');
          
          // Rest of success handling...
        }


      } else if (type === 'translate' && data) {
        // Enhanced translation with settings
        result = await coverLetterService.translateLetterEnhanced(
          coverLetter.id,
          {
            targetLanguage: data.targetLanguage,
            method: data.method,
            preservation: data.preservation,
            preserveNames: data.preserveNames,
            preserveDates: data.preserveDates,
            preserveNumbers: data.preserveNumbers,
            preserveUrls: data.preserveUrls,
            preserveEmailAddresses: data.preserveEmailAddresses,
            preserveTerms: data.preserveTerms,
            createNewVersion: data.createNewVersion,
            versionName: data.versionName,
            metadata: { transactionId }
          }
        );
      } else if (type === 'enhance' && instructions && selectedBlock) {
        result = await coverLetterService.enhanceBlock(
          coverLetter.id, 
          selectedBlock, 
          instructions,
          { transactionId }
        );
      } else if (type === 'regenerate' && selectedBlock) {
        result = await coverLetterService.regenerateBlock(
          coverLetter.id, 
          selectedBlock,
          { transactionId }
        );
      } else if (type === 'quick-enhance' && instructions && selectedBlock) {
        result = await coverLetterService.enhanceBlock(
          coverLetter.id, 
          selectedBlock, 
          instructions,
          { transactionId }
        );
      } else {
        throw new Error(t`Invalid operation parameters`);
      }

      if (result && result.coverLetter) {
        if (type === 'translate' && (result as any).createNewVersion) {
          // For new translations, open the new version
          toast.success(
            <div className="space-y-1">
              <div className="font-medium">{t`Translation created successfully!`}</div>
              <div className="text-xs text-green-600 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {t`New version: ${result.coverLetter.title}`}
              </div>
            </div>,
            { 
              duration: 10000,
              action: {
                label: t`Open`,
                onClick: () => {
                  // Navigate to the translated version
                  window.location.href = `/dashboard/cover-letter/${result.coverLetter.id}`;
                }
              }
            }
          );
          
          // Reload translations list
          loadTranslations();
        } else {
          // Update current letter
          setCoverLetter(result.coverLetter);
        }
        
        finalResult = result;

        await completeTransaction(transactionId, {
          result: 'success',
          actionType: type,
          coverLetterId: coverLetter.id
        });

        const successMessage = getSuccessMessage(type, data);
        
        toast.success(
          <div className="space-y-1">
            <div className="font-medium">{successMessage}</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <Coins className="w-3 h-3" />
              {t`Used ${cost} coins`} • {t`Transaction:`} {transactionId.slice(-8)}
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

        // Clear inputs on success
        if (type === 'regenerate-complete') {
          setRegenerateInstructions('');
        } else if (type === 'translate') {
          setTranslationLanguage('');
          setPreserveTermsInput('');
          setTranslationSettings({
            ...translationSettings,
            versionName: '',
          });
        } else if (type === 'enhance') {
          setEnhanceInstructions('');
        }

        setLastFailedInstructions('');

        setTimeout(() => {
          setProcessStatus(prev => prev.state === 'success' ? { state: 'idle' } : prev);
        }, 10000);

      } else {
        throw new Error(t`AI processing returned no result`);
      }

    } catch (error: any) {
      console.error(`${type} failed:`, error);
      
      if (transactionSuccess) {
        try {
          const refundReason = error.message || t`AI processing failed`;
          await refundTransaction(transactionId, refundReason);
          await fetchBalance();
        } catch (refundError) {
          console.error(t`Failed to refund coins:`, refundError);
        }
      }

      const errorMessage = getErrorMessage(type, error, transactionSuccess, data);
      
      toast.error(errorMessage, {
        duration: 20000,
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        action: (processStatus.instructions || instructions) ? {
          label: t`Retry`,
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

      // Keep instructions for retry
      if (type === 'regenerate-complete' && instructions) {
        setRegenerateInstructions(instructions);
      } else if (type === 'translate' && data) {
        setTranslationLanguage(data.targetLanguage);
      } else if (type === 'enhance' && instructions) {
        setEnhanceInstructions(instructions);
      }

      setTimeout(() => {
        setProcessStatus(prev => prev.state === 'error' ? { state: 'idle' } : prev);
      }, 20000);
    }
  };

  const handleEnhancedTranslation = async () => {
  if (!coverLetter?.id || !translationLanguage) {
    toast.error(t`Please select a target language`);
    return;
  }

  console.log('Starting enhanced translation:', {
    letterId: coverLetter.id,
    targetLanguage: translationLanguage,
    settings: translationSettings
  });

  const terms = preserveTermsInput.split(',').map(t => t.trim()).filter(Boolean);

  const translationData = {
    targetLanguage: translationLanguage,
    method: translationSettings.method,
    preservation: translationSettings.preservation,
    preserveNames: translationSettings.preserveNames,
    preserveDates: translationSettings.preserveDates,
    preserveNumbers: translationSettings.preserveNumbers,
    preserveUrls: translationSettings.preserveUrls,
    preserveEmailAddresses: translationSettings.preserveEmailAddresses,
    preserveTerms: [...translationSettings.preserveTerms, ...terms],
    createNewVersion: translationSettings.createNewVersion,
    versionName: translationSettings.versionName || undefined,
  };

  console.log('Translation data:', translationData);
  
  await handleProcess('translate', undefined, translationData, translateRef);
};

const handleSwitchLanguage = async (languageCode: string) => {
  try {
    console.log('🔄 Starting language switch:', {
      currentLetterId: coverLetter!.id,
      currentTitle: coverLetter!.title,
      currentLanguage: (coverLetter as any).language,
      targetLanguage: languageCode
    });

    const result = await coverLetterService.switchToLanguage(
      coverLetter!.id,
      languageCode
    );

    console.log('✅ Switch language API response:', result);

    if (result.success) {
      // ALWAYS reload the cover letter to ensure we have full content
      console.log('🔄 Reloading cover letter after switch:', result.coverLetter.id);
      const reloadedLetter = await coverLetterService.findOne(result.coverLetter.id);
      
      console.log('✅ Reloaded letter content:', {
        id: reloadedLetter.id,
        title: reloadedLetter.title,
        hasContent: !!reloadedLetter.content,
        blocksCount: reloadedLetter.content?.blocks?.length
      });
      
      // Update store with reloaded letter
      setCoverLetter(reloadedLetter);
      
      // Update URL
      window.history.pushState({}, '', `/dashboard/cover-letter/${reloadedLetter.id}`);
      
      toast.success(`Switched to ${result.language || languageCode} version`);
      
      // Reload translations list
      await loadTranslations();
    } else {
      toast.error(result.message || t`Failed to switch language`);
    }
  } catch (error: any) {
    console.error('❌ Language switch error:', error);
    
    // Show specific error message
    let errorMessage = t`Failed to switch language`;
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message?.includes('not found')) {
      errorMessage = t`No translation available in this language. Please create a translation first.`;
    }
    
    toast.error(errorMessage);
    
    // Optionally, offer to create a translation
    if (error.message?.includes('not found')) {
      setTimeout(() => {
        toast.info(
          <div className="space-y-1">
            <div className="font-medium">{t`No ${languageCode} translation found`}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Pre-fill translation form
                setTranslationLanguage(languageCode);
                setActiveTab('translate');
              }}
              className="mt-2"
            >
              <Globe className="w-3 h-3 mr-1" />
              {t`Create Translation`}
            </Button>
          </div>,
          { duration: 8000 }
        );
      }, 1000);
    }
  }
};

  const handleCoinConfirm = async () => {
    if (pendingAction) {
      const cost = enhancementCosts[pendingAction.type];
      await executeAIProcess(pendingAction.type, pendingAction.instructions, cost, pendingAction.data);
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
      reserving: t`Reserving coins...`,
      processing: {
        enhance: t`Improving your text with advanced language processing...`,
        regenerate: t`Rewriting this section with enhanced wording...`,
        'quick-enhance': t`Applying style and clarity improvements...`,
        'regenerate-complete': t`Creating a completely new version of your letter...`,
        translate: t`Translating while preserving structure and formatting...`
      }[type] || t`Processing...`
    };
    return stage === 'reserving' ? messages.reserving : messages.processing;
  };

  const getSuccessMessage = (type: ProcessType, data?: any): string => {
    const messages = {
      enhance: t`Content enhanced successfully!`,
      regenerate: t`Block regenerated successfully!`,
      'quick-enhance': t`Quick enhancement applied!`,
      'regenerate-complete': t`Complete letter regenerated successfully!`,
      translate: data?.createNewVersion ? t`New translation version created!` : t`Letter translated successfully!`
    };
    return messages[type] || t`Operation completed successfully!`;
  };

  const getErrorMessage = (type: ProcessType, error: any, wasCharged: boolean, data?: any): string => {
    const messages = {
      enhance: wasCharged 
        ? t`Failed to enhance content. Your coins have been refunded.`
        : t`Failed to enhance content. Please try again.`,
      regenerate: wasCharged
        ? t`Failed to regenerate block. Your coins have been refunded.`
        : t`Failed to regenerate block. Please try again.`,
      'quick-enhance': wasCharged
        ? t`Failed to apply enhancement. Your coins have been refunded.`
        : t`Failed to apply enhancement. Please try again.`,
      'regenerate-complete': wasCharged
        ? t`Failed to regenerate complete letter. Your coins have been refunded.`
        : t`Failed to regenerate complete letter. Please try again.`,
      translate: wasCharged
        ? t`Failed to translate letter. Your coins have been refunded.`
        : t`Failed to translate letter. Please try again.`
    };
    
    return messages[type] || t`AI processing failed. ${wasCharged ? t`Your coins have been refunded.` : ''}`;
  };

  const quickEnhance = (action: string) => {
    const instructionsMap: Record<string, string> = {
      professional: t`Make this more professional and business-appropriate`,
      concise: t`Make this more concise and to the point`,
      impactful: t`Make this more impactful with stronger action verbs`,
      friendly: t`Make this more friendly and approachable`,
      formal: t`Make this more formal and traditional`,
      modern: t`Update with contemporary language`,
      persuasive: t`Make this more persuasive and compelling`,
      confident: t`Make this more confident and authoritative`
    };
    
    const instructions = instructionsMap[action];
    if (instructions) {
      handleProcess('quick-enhance', instructions, undefined, quickEnhanceRef);
    }
  };

  const handleCustomEnhance = () => {
    if (enhanceInstructions.trim()) {
      handleProcess('enhance', enhanceInstructions, undefined, customEnhanceRef);
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
                    {t`Your instructions:`} "{processStatus.instructions}"
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

  // Complete Regeneration Section Component
const CompleteRegenerationSection = () => (
  <div className="space-y-4 pt-4 border-t">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <RefreshCw className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          {t`Complete Letter Regeneration`}
        </h3>
      </div>
      <div className="flex items-center space-x-1 text-xs text-indigo-600 dark:text-indigo-400">
        <div>{t`Cost:`}</div>
        <Coins className="w-3 h-3" />
        <span>{enhancementCosts['regenerate-complete']}</span>
      </div>
    </div>

    <div className="space-y-3">
      {/* Regeneration Intensity Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t`Regeneration Intensity`}
          </Label>
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            {regenerateIntensity}%
          </span>
        </div>
        <Slider
          value={[regenerateIntensity]}
          onValueChange={(value) => setRegenerateIntensity(value[0])}
          min={10}
          max={100}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{t`Minor tweaks`}</span>
          <span>{t`Complete rewrite`}</span>
        </div>
      </div>

      {/* Instructions Textarea */}
      <div className="space-y-2">
        <Label htmlFor="regenerate-instructions" className="text-xs font-medium">
          {t`Regeneration Instructions`}
        </Label>
        <Textarea
          id="regenerate-instructions"
          value={regenerateInstructions}
          onChange={(e) => setRegenerateInstructions(e.target.value)}
          placeholder={t`Example: Make it more formal, focus on leadership skills, add specific metrics, use a more confident tone...`}
          className="min-h-[100px] resize-none text-sm border-indigo-200 dark:border-indigo-800 focus:border-indigo-300 dark:focus:border-indigo-600 transition-colors"
          disabled={isProcessing}
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => handleProcess('regenerate-complete', regenerateInstructions)}
          disabled={isProcessing || !regenerateInstructions.trim()}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          size="sm"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t`Regenerating...`}
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              {t`Regenerate All`}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            setRegenerateInstructions('');
            setRegenerateIntensity(50);
          }}
          disabled={isProcessing || (!regenerateInstructions.trim() && regenerateIntensity === 50)}
          className="border-indigo-200 dark:border-indigo-800"
          size="sm"
        >
          {t`Clear`}
        </Button>
      </div>
    </div>

    {/* Help Text */}
    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
      <div className="flex items-start space-x-2">
        <Lightbulb className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-indigo-900 dark:text-indigo-100">
            {t`What is Complete Regeneration?`}
          </p>
          <p className="text-xs text-indigo-700 dark:text-indigo-300">
            {t`This creates a completely new version of your entire letter based on your instructions with "(Regenerated)" suffix. Your original letter remains unchanged. It will maintain the same structure but rewrite all content from scratch.`}
          </p>
        </div>
      </div>
    </div>

    {/* Intensity Presets */}
    <div className="space-y-2">
      <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
        {t`Quick Presets`}
      </Label>
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRegenerateIntensity(30);
            setRegenerateInstructions(t`Improve wording and phrasing while keeping the same structure`);
          }}
          className="text-xs h-8 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
        >
          {t`Refine`}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRegenerateIntensity(60);
            setRegenerateInstructions(t`Rewrite with more impact and stronger action verbs`);
          }}
          className="text-xs h-8 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
        >
          {t`Enhance`}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRegenerateIntensity(90);
            setRegenerateInstructions(t`Complete rewrite with fresh perspective and modern language`);
          }}
          className="text-xs h-8 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
        >
          {t`Rewrite`}
        </Button>
      </div>
    </div>
  </div>
);

  // Translation Settings Section
  const TranslationSettingsSection = () => (
    <div className="space-y-4 mt-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
          {t`Translation Settings`}
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedTranslation(!showAdvancedTranslation)}
          className="h-7 px-2"
        >
          {showAdvancedTranslation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span className="ml-1 text-xs">{t`Advanced`}</span>
        </Button>
      </div>

      {showAdvancedTranslation && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t`Translation Method`}</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={(translationSettings.method === 'preserve-structure' ? 'default' : 'outline') as any}
                  onClick={() => setTranslationSettings({...translationSettings, method: 'preserve-structure'})}
                  className="h-9 text-xs"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  {t`Preserve`}
                </Button>
                <Button
                  type="button"
                  variant={(translationSettings.method === 'section-by-section' ? 'default' : 'outline') as any}
                  onClick={() => setTranslationSettings({...translationSettings, method: 'section-by-section'})}
                  className="h-9 text-xs"
                >
                  <PanelLeft className="w-3 h-3 mr-1" />
                  {t`Sections`}
                </Button>
                <Button
                  type="button"
                  variant={(translationSettings.method === 'complete' ? 'default' : 'outline') as any}
                  onClick={() => setTranslationSettings({...translationSettings, method: 'complete'})}
                  className="h-9 text-xs"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  {t`Complete`}
                </Button>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {translationSettings.method === 'preserve-structure' && t`Best for preserving layout and formatting`}
                {translationSettings.method === 'section-by-section' && t`Translates each section independently`}
                {translationSettings.method === 'complete' && t`Translates entire letter as one piece`}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">{t`Preservation Level`}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={(translationSettings.preservation === 'all' ? 'default' : 'outline') as any}
                  onClick={() => setTranslationSettings({...translationSettings, preservation: 'all'})}
                  className="h-9 text-xs"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  {t`Preserve All`}
                </Button>
                <Button
                  type="button"
                  variant={(translationSettings.preservation === 'formatting-only' ? 'default' : 'outline') as any}
                  onClick={() => setTranslationSettings({...translationSettings, preservation: 'formatting-only'})}
                  className="h-9 text-xs"
                >
                  <Grid className="w-3 h-3 mr-1" />
                  {t`Formatting Only`}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">{t`Preserve Specific Elements`}</Label>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  {Object.values(translationSettings).filter(v => v === true).length} {t`enabled`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={translationSettings.preserveNames}
                    onCheckedChange={(checked) => setTranslationSettings({...translationSettings, preserveNames: checked})}
                  />
                  <Label className="text-xs">{t`Names`}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={translationSettings.preserveDates}
                    onCheckedChange={(checked) => setTranslationSettings({...translationSettings, preserveDates: checked})}
                  />
                  <Label className="text-xs">{t`Dates`}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={translationSettings.preserveNumbers}
                    onCheckedChange={(checked) => setTranslationSettings({...translationSettings, preserveNumbers: checked})}
                  />
                  <Label className="text-xs">{t`Numbers`}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={translationSettings.preserveUrls}
                    onCheckedChange={(checked) => setTranslationSettings({...translationSettings, preserveUrls: checked})}
                  />
                  <Label className="text-xs">{t`URLs`}</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">{t`Terms to Preserve (comma-separated)`}</Label>
              <Input
                value={preserveTermsInput}
                onChange={(e) => setPreserveTermsInput(e.target.value)}
                placeholder="e.g., Google, PhD, CEO, $100"
                className="text-sm border-emerald-200 dark:border-emerald-800"
              />
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {t`These terms will not be translated`}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={translationSettings.createNewVersion}
                  onCheckedChange={(checked) => setTranslationSettings({...translationSettings, createNewVersion: checked})}
                />
                <Label className="text-xs">{t`Create New Version`}</Label>
              </div>
              
              {translationSettings.createNewVersion && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t`Version Name (Optional)`}</Label>
                  <Input
                    value={translationSettings.versionName || ''}
                    onChange={(e) => setTranslationSettings({...translationSettings, versionName: e.target.value})}
                    placeholder="e.g., French Version, Español"
                    className="text-sm border-emerald-200 dark:border-emerald-800"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Language Versions Section
  const LanguageVersionsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t`Available Translations`}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadTranslations}
          disabled={loadingTranslations}
          className="h-7"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${loadingTranslations ? 'animate-spin' : ''}`} />
          {t`Refresh`}
        </Button>
      </div>

      {loadingTranslations ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      ) : availableTranslations.length === 0 ? (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-lg border border-dashed border-emerald-200 dark:border-emerald-800">
          <Globe className="w-8 h-8 mx-auto mb-3 text-emerald-400 dark:text-emerald-500" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-1">
            {t`No Translations Yet`}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            {t`Create your first translation to see it here`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {availableTranslations.map((version) => {
            const languageInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === version.language);
            const isCurrent = coverLetter?.id === version.id;
            
            return (
              <div
                key={version.id}
                className={`p-3 rounded-lg border ${isCurrent ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg">{languageInfo?.flag || '🌐'}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {version.title}
                        </h4>
                        {isCurrent && (
                          <Badge variant="success" className="text-xs">
                            {t`Current`}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {languageInfo?.name || version.language}
                        </span>
                        {languageInfo?.difficulty && (
                          <Badge variant="outline" className="text-xs">
                            {languageInfo.difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (version.language) {
                            handleSwitchLanguage(version.language);
                          } else {
                            toast.error(t`Cannot switch to undefined language`);
                          }
                        }}
                        className="h-7 text-xs border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        {t`Switch`}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/cover-letter/${version.id}`}
                      className="h-7 w-7 p-0"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const isProcessing = processStatus.state === 'processing' || processStatus.state === 'reserving';
  const currentActionCost = pendingAction ? enhancementCosts[pendingAction.type] : enhancementCosts.enhance;

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

  return (
    <section id="ai" className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t`Content Enhancer`}</h2>
        </div>
        {isProcessing && (
          <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{t`Processing request...`}</span>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="enhance" className="text-xs">
            <Sparkles className="w-3 h-3 mr-2" />
            {t`Enhance`}
          </TabsTrigger>
          <TabsTrigger value="translate" className="text-xs">
            <Globe className="w-3 h-3 mr-2" />
            {t`Translate`}
          </TabsTrigger>
          <TabsTrigger value="versions" className="text-xs">
            <Languages className="w-3 h-3 mr-2" />
            {t`Versions`}
            {availableTranslations.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-4 px-1 text-[10px]">
                {availableTranslations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Status Display */}
        <div className="mt-4">
          <StatusDisplay />
        </div>

        {/* Enhance Tab */}
        <TabsContent value="enhance" className="space-y-6 mt-4">
          {/* Selected Block Info */}
          <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-medium text-purple-900 dark:text-purple-100 uppercase tracking-wide">
                  {t`Editing Block`}
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-300 capitalize">
                  {selectedBlockData?.type?.toLowerCase() || t`content`}
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
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{t`Your Coins`}</span>
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
                <div>{t`Cost:`}</div>
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
              onClick={() => handleProcess('regenerate', undefined, undefined, regenerateRef)}
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
                placeholder={t`Instruct exactly this block should be improved...`}
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

          {/* Complete Regeneration Section */}
          <CompleteRegenerationSection />

        </TabsContent>

        {/* Translate Tab */}
        <TabsContent value="translate" className="space-y-4 mt-4">
          <div ref={translateRef} className="space-y-4">
            {/* Language Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                {t`Select Target Language`}
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <Button
                    key={lang.code}
                    type="button"
                    variant={(translationLanguage === lang.code ? 'default' : 'outline') as any}
                    onClick={() => setTranslationLanguage(lang.code)}
                    className="h-auto py-3 justify-start border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700"
                  >
                    <div className="flex items-center space-x-2 w-full">
                      <span className="text-lg">{lang.flag}</span>
                      <div className="text-left flex-1">
                        <div className="font-medium text-sm">{lang.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {lang.native}
                        </div>
                      </div>
                      {lang.difficulty === 'Hard' && (
                        <Badge variant="destructive" className="text-[10px]">
                          {t`Hard`}
                        </Badge>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Translation Settings */}
            <TranslationSettingsSection />

            {/* Cost and Action */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    {t`Translation Cost`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {enhancementCosts.translate}
                  </span>
                  <span className="text-sm text-emerald-600 dark:text-emerald-400">{t`coins`}</span>
                </div>
              </div>

              <Button
                onClick={handleEnhancedTranslation}
                disabled={isProcessing || !translationLanguage}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                size="lg"
              >
                <Globe className="w-4 h-4 mr-2" />
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t`Translating...`}
                  </>
                ) : (
                  <>
                    {translationSettings.createNewVersion ? t`Create Translation` : t`Translate Current Letter`}
                  </>
                )}
              </Button>
              
              <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 mt-2">
                {translationSettings.method === 'preserve-structure' && 
                  t`✓ Perfect structure preservation`}
                {translationSettings.method === 'section-by-section' && 
                  t`✓ Section-by-section translation`}
                {translationSettings.method === 'complete' && 
                  t`✓ Complete document translation`}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Versions Tab */}
        <TabsContent value="versions" className="space-y-4 mt-4">
          <LanguageVersionsSection />
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-center space-x-2 mb-2">
          <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <h4 className="text-xs font-medium text-amber-900 dark:text-amber-100">{t`Pro Tips`}</h4>
        </div>
        <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
          {activeTab === 'enhance' && (
            <>
              <li className="flex items-start space-x-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{t`Be specific about tone and style you want`}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{t`Mention target audience if applicable`}</span>
              </li>
            </>
          )}
          {activeTab === 'translate' && (
            <>
              <li className="flex items-start space-x-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{t`Use "Preserve Structure" for perfect layout retention`}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{t`Create new versions to keep both original and translation`}</span>
              </li>
            </>
          )}
          {activeTab === 'versions' && (
            <>
              <li className="flex items-start space-x-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{t`Switch between language versions instantly`}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{t`Each translation maintains perfect formatting`}</span>
              </li>
            </>
          )}
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
        title={t`AI Enhancement - Coin Confirmation`}
        description={
          pendingAction?.type === 'translate' 
            ? t`Create a perfect translation that preserves all formatting and structure.`
            : pendingAction?.type === 'regenerate' 
            ? t`Regenerate this block with AI for a complete rewrite.`
            : t`Enhance your content with AI-powered improvements.`
        }
        actionType={pendingAction?.type || 'enhance'}
        triggerRef={
          pendingAction?.type === 'quick-enhance' ? quickEnhanceRef : 
          pendingAction?.type === 'regenerate' ? regenerateRef : 
          pendingAction?.type === 'translate' ? translateRef : 
          customEnhanceRef
        }
      />
    </section>
  );
};