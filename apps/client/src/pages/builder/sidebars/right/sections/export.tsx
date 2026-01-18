import { t, Trans } from "@lingui/macro";
import { 
  CircleNotch, 
  FileJs, 
  FilePdf, 
  Globe, 
  Translate, 
  CheckCircle,
  Eye,
  ArrowRight,
  FileDoc,
  ChatCircleText,
  Sparkle,
  ArrowSquareOut,
  WarningCircle,
  DownloadSimple,
  Coins,
  Crown,
} from "@phosphor-icons/react";
import { 
  buttonVariants, 
  Card, 
  CardContent, 
  CardDescription, 
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
  Badge,
  Tooltip,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Separator,
} from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { saveAs } from "file-saver";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";

import { usePrintResume } from "@/client/services/resume/print";
import { useResumeStore } from "@/client/stores/resume";
import { useResumeTranslation } from "@/client/hooks/use-resume-translation";
import { useToast } from "@/client/hooks/use-toast";
import { useSaveTranslation } from "@/client/hooks/use-save-translation";
import { useAuthStore } from "@/client/stores/auth";
import { useWallet } from "@/client/hooks/useWallet";
import { CoinConfirmPopover } from "@/client/components/modals/coin-confirm-modal";

import { SectionIcon } from "../shared/section-icon";
import { 
  calculateExportCost, 
  calculateTranslationCost,
  JSON_EXPORT_COST,
  getTemplateDisplayName,
  getTemplateCategory,
  getTemplateDescription
} from "@/client/libs/resume-pricing";

const openInNewTab = (url: string) => {
  const win = window.open(url, "_blank");
  if (win) win.focus();
};

export const ExportSection = () => {
  const { printResume, loading: pdfLoading } = usePrintResume();
  const { resume } = useResumeStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
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
  
  const {
    translate,
    isTranslating,
    availableLanguages,
    isLoadingLanguages,
  } = useResumeTranslation();

  const [selectedLanguage, setSelectedLanguage] = useState<string>("es");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [recentlyTranslated, setRecentlyTranslated] = useState<Array<{
    id: string;
    title: string;
    language: string;
    languageName: string;
  }>>([]);
  
  // Coin payment states
  const [showPdfCoinPopover, setShowPdfCoinPopover] = useState(false);
  const [showJsonCoinPopover, setShowJsonCoinPopover] = useState(false);
  const [showTranslationCoinPopover, setShowTranslationCoinPopover] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [pdfExportCost, setPdfExportCost] = useState(20); // Default cost
  
  const pdfExportButtonRef = useRef<HTMLButtonElement>(null);
  const jsonExportButtonRef = useRef<HTMLButtonElement>(null);
  const translationButtonRef = useRef<HTMLButtonElement>(null);

  // Calculate PDF export cost based on template
  useEffect(() => {
    if (resume?.data?.metadata?.template) {
      const cost = calculateExportCost(resume.data.metadata.template);
      setPdfExportCost(cost);
    }
  }, [resume]);

  const { saveTranslation, isSaving } = useSaveTranslation({
    resumeId: resume.id,
    onSuccess: (data) => {
      const langInfo = availableLanguages.find(l => l.code === data.translation.language);
      const languageName = langInfo?.name || data.translation.language.toUpperCase();
      
      // Add to recently translated list
      setRecentlyTranslated(prev => [{
        id: data.translatedResume.id,
        title: data.translatedResume.title,
        language: data.translation.language,
        languageName,
      }, ...prev.slice(0, 2)]);
      
      // Enhanced success toast with action buttons
      toast({
        title: t`Translation Successfully Saved!`,
        description: t`Your resume has been translated to ${languageName} and is ready to use.`,
        variant: "success",
        action: (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/builder/${data.translatedResume.id}`)}
                className="gap-2 flex-1 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <Eye size={14} />
                {t`Open Translation`}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2 flex-1"
              >
                {t`View Workspace`}
                <ArrowRight size={14} />
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t`Remember to review the translation to ensure accuracy`}
            </p>
          </div>
        ),
      });

      // Follow-up review reminder
      setTimeout(() => {
        toast({
          title: t`Review Your Translation`,
          description: t`Please review the translated content to ensure maximum accuracy before using it professionally.`,
          variant: "info",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/builder/${data.translatedResume.id}`)}
              className="gap-2 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <Eye size={14} />
              {t`Review Now`}
            </Button>
          ),
        });
      }, 1500);
    },
  });

  const generateTransactionId = (action: string): string => {
    return `${action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // ========== PDF EXPORT HANDLERS ==========
  const handlePdfExport = async () => {
    if (!resume || !user) {
      toast({
        title: t`Authentication Required`,
        description: t`Please sign in to export your resume`,
        variant: "error",
      });
      return;
    }

    // Check if user can afford
    const affordable = await canAfford(pdfExportCost);
    
    if (!affordable) {
      toast({
        title: t`Insufficient Coins`,
        description: t`You don't have enough coins to export this resume`,
        variant: "error",
      });
      setShowPdfCoinPopover(true);
      return;
    }

    // Proceed with export
    await processPdfExport();
  };

  const processPdfExport = async () => {
  const transactionId = generateTransactionId('pdf_export');
  let transactionSuccess = false;
  
  setIsExportingPdf(true);

  // Show loading toast
  const loadingToast = toast({
    title: t`Generating PDF`,
    description: t`Processing your resume (Cost: ${pdfExportCost} coins)...`,
    variant: "default",
    duration: 3000,
  });

  try {
    // Reserve coins
    const transactionResult = await deductCoinsWithRollback(
      pdfExportCost,
      `PDF Export - ${resume.title}`,
      { 
        transactionId, 
        resumeId: resume.id,
        template: resume.data.metadata?.template || 'vertex',
        action: 'pdf_export'
      }
    );

    if (!transactionResult.success) {
      throw new Error('Failed to reserve coins for PDF export');
    }

    transactionSuccess = true;

    // Generate PDF
    try {
      const { url } = await printResume({ id: resume.id });
      
      // Dismiss loading toast
      if (loadingToast && typeof loadingToast.dismiss === 'function') {
        loadingToast.dismiss();
      }
      
      // === AUTOMATIC DOWNLOAD ===
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${resume.title.replace(/[^\w\s]/gi, '_')}_Resume.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
     
      
      // Mark transaction as completed
      await completeTransaction(transactionId, {
        result: 'success',
        resumeTitle: resume.title,
        template: resume.data.metadata?.template,
        fileType: 'PDF',
        exportedAt: new Date().toISOString()
      });

      toast({
        title: t`PDF Downloaded Successfully!`,
        description: t`"${resume.title}" has been downloaded to your device. ${pdfExportCost} coins deducted.`,
        variant: "success",
        duration: 5000,
      });

      setShowPdfCoinPopover(false);

    } catch (error: any) {
      if (loadingToast && typeof loadingToast.dismiss === 'function') {
        loadingToast.dismiss();
      }
      throw error;
    }

  } catch (error: any) {
    console.error("PDF export failed:", error);
    
    if (transactionSuccess) {
      try {
        await refundTransaction(transactionId, error.message || 'PDF export failed');
        await fetchBalance();
        
        toast({
          title: t`Export Failed`,
          description: t`${pdfExportCost} coins refunded`,
          variant: "info",
        });
      } catch (refundError) {
        console.error('Failed to refund coins:', refundError);
      }
    }

    toast({
      title: t`PDF Generation Failed`,
      description: error.message || t`Failed to generate PDF. Please try again.`,
      variant: "error",
      duration: 5000,
    });

    setShowPdfCoinPopover(false);
  } finally {
    setIsExportingPdf(false);
  }
};

  const confirmPdfExport = async () => {
    try {
      const affordable = await canAfford(pdfExportCost);

      if (!affordable) {
        toast({
          title: t`Insufficient Coins`,
          description: t`You don't have enough coins to export this resume`,
          variant: "error",
        });
        setShowPdfCoinPopover(false);
        return;
      }

      await processPdfExport();

    } catch (error: any) {
      console.error("PDF export preparation failed:", error);
      toast({
        title: t`Export Failed`,
        description: t`Failed to prepare PDF export`,
        variant: "error",
      });
      setShowPdfCoinPopover(false);
    }
  };

  // ========== JSON EXPORT HANDLERS ==========
  const handleJsonExport = async () => {
    if (!resume || !user) {
      toast({
        title: t`Authentication Required`,
        description: t`Please sign in to export your resume`,
        variant: "error",
      });
      return;
    }

    const affordable = await canAfford(JSON_EXPORT_COST);
    
    if (!affordable) {
      toast({
        title: t`Insufficient Coins`,
        description: t`You don't have enough coins to export JSON`,
        variant: "error",
      });
      setShowJsonCoinPopover(true);
      return;
    }

    await processJsonExport();
  };

  const processJsonExport = async () => {
    const transactionId = generateTransactionId('json_export');
    let transactionSuccess = false;
    
    setIsExportingJson(true);

    const loadingToast = toast({
      title: t`Exporting JSON`,
      description: t`Processing your resume data (Cost: ${JSON_EXPORT_COST} coins)...`,
      variant: "default",
    });

    try {
      const transactionResult = await deductCoinsWithRollback(
        JSON_EXPORT_COST,
        `JSON Export - ${resume.title}`,
        { 
          transactionId, 
          resumeId: resume.id,
          action: 'json_export'
        }
      );

      if (!transactionResult.success) {
        throw new Error('Failed to reserve coins for JSON export');
      }

      transactionSuccess = true;

      try {
        const filename = `reactive_resume-${resume.id}.json`;
        const resumeJSON = JSON.stringify(resume.data, null, 2);
        saveAs(new Blob([resumeJSON], { type: "application/json" }), filename);
        
        if (loadingToast && typeof loadingToast.dismiss === 'function') {
          loadingToast.dismiss();
        }
        
        await completeTransaction(transactionId, {
          result: 'success',
          resumeTitle: resume.title,
          fileType: 'JSON',
          exportedAt: new Date().toISOString()
        });

        toast({
          title: t`JSON Exported Successfully!`,
          description: t`Your resume JSON has been downloaded. ${JSON_EXPORT_COST} coins deducted.`,
          variant: "success",
        });

        setShowJsonCoinPopover(false);

      } catch (error: any) {
        if (loadingToast && typeof loadingToast.dismiss === 'function') {
          loadingToast.dismiss();
        }
        throw error;
      }

    } catch (error: any) {
      console.error("JSON export failed:", error);
      
      if (transactionSuccess) {
        try {
          await refundTransaction(transactionId, error.message || 'JSON export failed');
          await fetchBalance();
          
          toast({
            title: t`Export Failed`,
            description: t`${JSON_EXPORT_COST} coins refunded`,
            variant: "info",
          });
        } catch (refundError) {
          console.error('Failed to refund coins:', refundError);
        }
      }

      toast({
        title: t`JSON Export Failed`,
        description: error.message || t`Failed to export JSON. Please try again.`,
        variant: "error",
      });

      setShowJsonCoinPopover(false);
    } finally {
      setIsExportingJson(false);
    }
  };

  const confirmJsonExport = async () => {
    try {
      const affordable = await canAfford(JSON_EXPORT_COST);

      if (!affordable) {
        toast({
          title: t`Insufficient Coins`,
          description: t`You don't have enough coins to export JSON`,
          variant: "error",
        });
        setShowJsonCoinPopover(false);
        return;
      }

      await processJsonExport();

    } catch (error: any) {
      console.error("JSON export preparation failed:", error);
      toast({
        title: t`Export Failed`,
        description: t`Failed to prepare JSON export`,
        variant: "error",
      });
      setShowJsonCoinPopover(false);
    }
  };

  // ========== TRANSLATION HANDLERS ==========
  const handleTranslationWithCoins = async (language: string) => {
    if (!resume || !user) {
      toast({
        title: t`Authentication Required`,
        description: t`Please sign in to translate your resume`,
        variant: "error",
      });
      return;
    }

    const translationCost = calculateTranslationCost(resume.data);
    const affordable = await canAfford(translationCost);
    
    if (!affordable) {
      toast({
        title: t`Insufficient Coins`,
        description: t`You don't have enough coins for translation`,
        variant: "error",
      });
      setSelectedLanguage(language);
      setShowTranslationCoinPopover(true);
      return;
    }

    await setupTranslation(language);
  };

  const setupTranslation = async (language: string) => {
    try {
      setSelectedLanguage(language);
      
      const langInfo = availableLanguages.find(l => l.code === language);
      const defaultTitle = `${resume.title} (${langInfo?.name || language.toUpperCase()})`;
      setCustomTitle(defaultTitle);
      
      setSaveDialogOpen(true);
    } catch (error) {
      toast({
        title: t`Translation Failed`,
        description: t`Could not start translation process`,
        variant: "error",
      });
    }
  };

  const confirmSaveTranslation = async () => {
    const translationCost = calculateTranslationCost(resume.data);
    const transactionId = generateTransactionId('translation');
    let transactionSuccess = false;

    const loadingToast = toast({
      title: t`Translating Resume`,
      description: t`Processing AI translation (Cost: ${translationCost} coins)...`,
      variant: "default",
    });

    try {
      const transactionResult = await deductCoinsWithRollback(
        translationCost,
        `AI Translation - ${selectedLanguage.toUpperCase()}`,
        { 
          transactionId, 
          resumeId: resume.id,
          targetLanguage: selectedLanguage,
          action: 'ai_translation'
        }
      );

      if (!transactionResult.success) {
        throw new Error('Failed to reserve coins for translation');
      }

      transactionSuccess = true;

      await saveTranslation(selectedLanguage, customTitle);
      
      if (loadingToast && typeof loadingToast.dismiss === 'function') {
        loadingToast.dismiss();
      }
      
      await completeTransaction(transactionId, {
        result: 'success',
        resumeTitle: customTitle,
        targetLanguage: selectedLanguage,
        cost: translationCost,
        translatedAt: new Date().toISOString()
      });

      setSaveDialogOpen(false);
      setShowTranslationCoinPopover(false);

    } catch (error: any) {
      console.error("Translation failed:", error);
      
      if (loadingToast && typeof loadingToast.dismiss === 'function') {
        loadingToast.dismiss();
      }
      
      if (transactionSuccess) {
        try {
          await refundTransaction(transactionId, error.message || 'Translation failed');
          await fetchBalance();
          
          toast({
            title: t`Translation Failed`,
            description: t`${translationCost} coins refunded`,
            variant: "info",
          });
        } catch (refundError) {
          console.error('Failed to refund coins:', refundError);
        }
      }

      toast({
        title: t`Translation Failed`,
        description: error.message || t`Failed to translate resume. Please try again.`,
        variant: "error",
      });

      setSaveDialogOpen(false);
      setShowTranslationCoinPopover(false);
    }
  };

  const confirmTranslation = async () => {
    try {
      const translationCost = calculateTranslationCost(resume.data);
      const affordable = await canAfford(translationCost);

      if (!affordable) {
        toast({
          title: t`Insufficient Coins`,
          description: t`You don't have enough coins for translation`,
          variant: "error",
        });
        setShowTranslationCoinPopover(false);
        return;
      }

      await setupTranslation(selectedLanguage);

    } catch (error: any) {
      console.error("Translation preparation failed:", error);
      toast({
        title: t`Translation Failed`,
        description: t`Failed to prepare translation`,
        variant: "error",
      });
      setShowTranslationCoinPopover(false);
    }
  };

  // ========== COIN PURCHASE HANDLERS ==========
  const handleBuyCoinsForPdf = (goSubscription = false) => {
    setShowPdfCoinPopover(false);
    if (goSubscription) {
      navigate("/dashboard/pricing");
    } else {
      const shortage = pdfExportCost - balance;
      navigate(`/dashboard/coins?needed=${shortage > 0 ? shortage : pdfExportCost}`);
    }
  };

  const handleBuyCoinsForJson = (goSubscription = false) => {
    setShowJsonCoinPopover(false);
    if (goSubscription) {
      navigate("/dashboard/pricing");
    } else {
      const shortage = JSON_EXPORT_COST - balance;
      navigate(`/dashboard/coins?needed=${shortage > 0 ? shortage : JSON_EXPORT_COST}`);
    }
  };

  const handleBuyCoinsForTranslation = (goSubscription = false) => {
    const translationCost = calculateTranslationCost(resume.data);
    const shortage = translationCost - balance;
    
    setShowTranslationCoinPopover(false);
    if (goSubscription) {
      navigate("/dashboard/pricing");
    } else {
      navigate(`/dashboard/coins?needed=${shortage > 0 ? shortage : translationCost}`);
    }
  };

  // ========== HELPER FUNCTIONS ==========
  const openTranslatedResume = (resumeId: string) => {
    navigate(`/builder/${resumeId}`);
  };

  const getCurrentTemplateDisplayName = () => {
    const templateId = resume.data.metadata?.template || 'vertex';
    return getTemplateDisplayName(templateId);
  };

  const getCurrentTemplateCategory = () => {
    const templateId = resume.data.metadata?.template || 'vertex';
    return getTemplateCategory(templateId);
  };

  const getCurrentTemplateDescription = () => {
    const templateId = resume.data.metadata?.template || 'vertex';
    return getTemplateDescription(templateId);
  };

  // Sort and group languages
  const sortedLanguages = [...availableLanguages]
    .filter(lang => !lang.isOriginal)
    .sort((a, b) => {
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      if (a.confidence && b.confidence) return b.confidence - a.confidence;
      return a.name.localeCompare(b.name);
    });

  const popularLanguages = ['es', 'fr', 'de', 'pt', 'ja', 'zh', 'ar', 'ru'];
  const otherLanguages = sortedLanguages.filter(lang => !popularLanguages.includes(lang.code));

  return (
    <>
      <section id="export" className="grid gap-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-x-4">
            <SectionIcon id="export" size={18} name={t`Export`} />
            <div>
              <h2 className="line-clamp-1 text-2xl font-bold lg:text-3xl">{t`Export`}</h2>
              <p className="text-sm text-muted-foreground">
                {t`Export your resume in different formats and languages`}
              </p>
            </div>
          </div>
          
          {/* Coin Balance Display */}
          {user && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <Coins className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">{balance}</span>
              <span className="text-xs text-yellow-600 dark:text-yellow-400">{t`coins`}</span>
            </div>
          )}
        </header>

        <main className="grid gap-y-4">
          {/* Recently Translated Section */}
          {recentlyTranslated.length > 0 && (
            <Card className="border-emerald-200 dark:border-emerald-800/30 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">{t`Recently Translated`}</h3>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">{t`Your latest translation is saved, ready to use`}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">
                    {recentlyTranslated.length} {t`saved`}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {recentlyTranslated.map((translation) => (
                    <div 
                      key={translation.id}
                      className="group flex items-center justify-between p-3 bg-white/80 dark:bg-gray-800/50 rounded-lg border border-emerald-100 dark:border-emerald-800/50 hover:border-emerald-200 dark:hover:border-emerald-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
                          <span className="text-lg">{availableLanguages.find(l => l.code === translation.language)?.flag || '🌐'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{translation.title}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">
                              {translation.languageName || translation.language.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{t`Just now`}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tooltip content={t`Open translated resume`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openTranslatedResume(translation.id)}
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            <ArrowSquareOut size={14} />
                          </Button>
                        </Tooltip>
                        <Button
                          size="sm"
                          onClick={() => openTranslatedResume(translation.id)}
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                        >
                          <Eye size={14} />
                          {t`Open`}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PDF Export Card */}
            <Card
              className={cn(
                "h-auto cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-red-300 dark:hover:border-red-700",
                "border-red-100 dark:border-red-900/30 bg-gradient-to-br from-red-50 dark:from-red-900/20 to-white dark:to-gray-900",
                (pdfLoading || isExportingPdf) && "opacity-75 pointer-events-none"
              )}
              onClick={handlePdfExport}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30">
                        {(pdfLoading || isExportingPdf) ? (
                          <CircleNotch size={24} className="animate-spin text-red-600 dark:text-red-400" />
                        ) : (
                          <FilePdf size={24} className="text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-semibold">{t`PDF Export`}</CardTitle>
                        <Badge variant="outline" className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700">
                          {pdfExportCost} <Coins size={10} className="ml-1" />
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground">
                      {t`Generate a professional PDF for printing, emailing, or job portals.`}
                    </CardDescription>
                    <Badge variant="outline" className="mt-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700">
                      {getCurrentTemplateDisplayName()} {t`Template`}
                    </Badge>
                    <div className="mt-4 flex items-center text-xs text-red-600 dark:text-red-400">
                      <FileDoc size={12} className="mr-1" />
                      {(pdfLoading || isExportingPdf) ? t`Processing...` : t`Click to export (${pdfExportCost} coins)`}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {getCurrentTemplateCategory()} • {getCurrentTemplateDescription()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* JSON Export Card */}
            <Card
              className={cn(
                "h-auto cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-blue-700",
                "border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-white dark:to-gray-900",
                isExportingJson && "opacity-75 pointer-events-none"
              )}
              onClick={handleJsonExport}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30">
                        {isExportingJson ? (
                          <CircleNotch size={24} className="animate-spin text-blue-600 dark:text-blue-400" />
                        ) : (
                          <FileJs size={24} className="text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-semibold">{t`JSON Export`}</CardTitle>
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                          {JSON_EXPORT_COST} <Coins size={10} className="ml-1" />
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground">
                      {t`Download a JSON snapshot for backup, sharing, or future imports.`}
                    </CardDescription>
                    <Badge variant="outline" className="mt-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                      {t`Universal Format`}
                    </Badge>
                    <div className="mt-4 flex items-center text-xs text-blue-600 dark:text-blue-400">
                      <DownloadSimple size={12} className="mr-1" />
                      {isExportingJson ? t`Exporting...` : t`Click to export (${JSON_EXPORT_COST} coins)`}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {t`Low-cost backup option • 5 coins only`}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Translation Section */}
          <Card className="border-2 border-dashed border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50/80 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/20 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-5">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 shadow-sm">
                          {isTranslating || isSaving ? (
                            <CircleNotch size={28} className="animate-spin text-purple-600 dark:text-purple-400" />
                          ) : (
                            <Sparkle size={28} className="text-purple-600 dark:text-purple-400" />
                          )}
                        </div>
                        {t`AI Translation`}
                        <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-600 dark:to-indigo-600 text-white border-0">
                          <ChatCircleText size={12} className="mr-1" />
                          {t`Smart AI`}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mt-1">
                        {t`Create professional translations for international job applications. Each translation is saved as a new resume.`}
                      </CardDescription>
                      <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <Coins size={12} />
                        {t`Cost: 20-100 coins based on resume length`}
                      </div>
                    </div>
                    
                    <Tooltip
                      content={t`AI-Powered Translation: Our model preserves your resume's structure while adapting content for different cultures and professional contexts.`}
                    >
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 dark:text-gray-400">
                        <WarningCircle size={16} className="text-gray-400 dark:text-gray-500" />
                      </Button>
                    </Tooltip>
                  </div>

                  {/* Language Selection */}
                  <div className="space-y-5">
                    {/* Popular Languages Grid */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Globe size={14} />
                        {t`Popular Languages`}
                        <div className="ml-3 text-sm text-muted-foreground mt-1">
                          ({t`27+ Languages Supported`})
                        </div>
                      </h4>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {sortedLanguages
                          .filter(lang => popularLanguages.includes(lang.code))
                          .map((lang) => {
                            const translationCost = calculateTranslationCost(resume.data);
                            return (
                              <Tooltip
                                key={lang.code}
                                content={`${lang.nativeName} • ${t`Cost`}: ${translationCost} ${t`coins`}`}
                              >
                                <Button
                                  ref={lang.code === selectedLanguage ? translationButtonRef : null}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTranslationWithCoins(lang.code)}
                                  disabled={isTranslating || isSaving}
                                  className={cn(
                                    "h-auto py-3 px-4 flex flex-col items-center justify-center gap-2 transition-all",
                                    "hover:shadow-md hover:-translate-y-0.5",
                                    lang.available 
                                      ? "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-800 dark:text-green-300 hover:border-green-300 dark:hover:border-green-600"
                                      : "border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-800 dark:text-purple-300 hover:border-purple-300 dark:hover:border-purple-600"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl">{lang.flag}</span>
                                    {lang.available && (
                                      <CheckCircle size={14} className="text-green-500 dark:text-green-400" />
                                    )}
                                  </div>
                                  <span className="text-xs font-medium">{lang.name}</span>
                                  <div className="flex items-center gap-1 text-xs">
                                    <Coins size={10} />
                                    {translationCost}
                                  </div>
                                </Button>
                              </Tooltip>
                            );
                          })}
                      </div>
                    </div>

                    {/* Other Languages Dropdown */}
                    {otherLanguages.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3">{t`More Languages`}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="lg" 
                              className="w-full justify-between h-12 border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-600"
                              disabled={isTranslating || isSaving}
                            >
                              <div className="flex items-center gap-3">
                                <ChatCircleText size={18} className="text-purple-600 dark:text-purple-400" />
                                <div className="text-left">
                                  <span className="font-medium">{t`Select Language`}</span>
                                  <p className="text-xs text-muted-foreground">{otherLanguages.length}+ {t`more languages available`}</p>
                                </div>
                              </div>
                              <Translate size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-72 max-h-96 overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
                            <div className="p-2">
                              <p className="text-xs font-medium text-muted-foreground mb-2">{t`All Available Languages`}</p>
                              {otherLanguages.map((lang) => {
                                const translationCost = calculateTranslationCost(resume.data);
                                return (
                                  <DropdownMenuItem
                                    key={lang.code}
                                    onClick={() => handleTranslationWithCoins(lang.code)}
                                    disabled={isTranslating || isSaving}
                                    className="flex items-center justify-between py-3 px-3 cursor-pointer dark:hover:bg-gray-700"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-xl">{lang.flag}</span>
                                      <div className="flex flex-col">
                                        <span className="font-medium dark:text-gray-200">{lang.name}</span>
                                        <span className="text-xs text-muted-foreground">{lang.nativeName}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Coins size={10} />
                                        {translationCost}
                                      </div>
                                      {lang.available ? (
                                        <CheckCircle size={14} className="text-green-500 dark:text-green-400" />
                                      ) : (
                                        <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-400">
                                          {t`New`}
                                        </Badge>
                                      )}
                                    </div>
                                  </DropdownMenuItem>
                                );
                              })}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}

                    {/* Translation Status */}
                    {(isTranslating || isSaving) && (
                      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 border border-blue-100 dark:border-blue-800/30">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-800">
                            <CircleNotch size={20} className="animate-spin text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-blue-800 dark:text-blue-300">
                                {isSaving ? t`Saving Translation...` : t`AI Translating...`}
                              </span>
                              <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                                {t`In Progress`}
                              </Badge>
                            </div>
                            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                              {t`Translating to`} {availableLanguages.find(l => l.code === selectedLanguage)?.name || selectedLanguage.toUpperCase()}
                            </p>
                            <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
                              {t`This usually takes 15-30 seconds. Please don't close this page.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card className="border-amber-200 dark:border-amber-800/30 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300">{t`Export Pricing`}</h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400">{t`Cost varies based on template complexity`}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                    <span className="text-sm font-semibold text-foreground">{t`Executive Templates`}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>{t`Sovereign, Apex`}</span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">{t`35 coins`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t`Imperial, Vanguard`}</span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">{t`30 coins`}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-semibold text-foreground">{t`Professional Templates`}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>{t`Vertex, Meridian, Ascend`}</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{t`20 coins`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t`Clarity`}</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{t`15 coins`}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-100 dark:border-green-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-semibold text-foreground">{t`Other Exports`}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-2">
                    <div className="flex justify-between">
                      <span>{t`JSON Export`}</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{t`5 coins`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t`AI Translation`}</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{t`20-100 coins`}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </section>

      {/* Save Translation Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30">
                <ChatCircleText size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-lg text-center dark:text-gray-200">{t`Resume Translation`}</DialogTitle>
                <DialogDescription className="dark:text-gray-400">
                  {t`AI translation of current resume into`} <strong className="dark:text-gray-300">{availableLanguages.find(l => l.code === selectedLanguage)?.name || selectedLanguage.toUpperCase()}</strong>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Separator className="my-2 dark:bg-gray-700" />

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-sm font-medium dark:text-gray-300">
                {t`Resume Title`}
              </Label>
              <Input
                id="title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={t`Enter resume title`}
                className="h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <WarningCircle size={12} />
                <span>{t`This will be saved as a new resume in your workspace`}</span>
              </div>
            </div>
            
            <div className="rounded-xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 border border-blue-100 dark:border-blue-800/30">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2">{t`What to expect`}</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5"></div>
                      <span>{t`A new resume will be created with the translated content`}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5"></div>
                      <span>{t`You'll receive success notifications with quick actions`}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5"></div>
                      <span>{t`We recommend reviewing the translation for accuracy`}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-2 dark:bg-gray-700" />

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              disabled={isSaving}
              className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {t`Cancel`}
            </Button>
            <Button
              onClick={confirmSaveTranslation}
              disabled={isSaving || !customTitle.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 gap-3 dark:from-purple-700 dark:to-indigo-700 dark:hover:from-purple-600 dark:hover:to-indigo-600"
            >
              {isSaving ? (
                <>
                  <CircleNotch className="h-4 w-4 animate-spin" />
                  <span>{t`Creating Translation...`}</span>
                </>
              ) : (
                <>
                  <Sparkle size={16} />
                  <span>{t`Translate Resume`}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Export Coin Confirmation Popover */}
      <CoinConfirmPopover
        open={showPdfCoinPopover}
        onClose={() => setShowPdfCoinPopover(false)}
        required={pdfExportCost}
        balance={balance}
        onConfirm={confirmPdfExport}
        onBuyCoins={handleBuyCoinsForPdf}
        title={t`Export ${getCurrentTemplateDisplayName()} Resume as PDF`}
        description={t`Export your professionally formatted ${getCurrentTemplateDisplayName()} resume as a high-quality PDF. This ${getCurrentTemplateCategory().toLowerCase()} template is optimized for ${getCurrentTemplateDescription()}.`}
        actionType="export"
        triggerRef={pdfExportButtonRef}
        userId={user?.id}
        metadata={{
          template: resume.data.metadata?.template,
          templateName: getCurrentTemplateDisplayName(),
          templateCategory: getCurrentTemplateCategory(),
          costBreakdown: t`Template: ${pdfExportCost} coins`,
        }}
      />

      {/* JSON Export Coin Confirmation Popover */}
      <CoinConfirmPopover
        open={showJsonCoinPopover}
        onClose={() => setShowJsonCoinPopover(false)}
        required={JSON_EXPORT_COST}
        balance={balance}
        onConfirm={confirmJsonExport}
        onBuyCoins={handleBuyCoinsForJson}
        title={t`Export Resume as JSON`}
        description={t`Download a JSON backup of your resume data for safekeeping, sharing, or future imports.`}
        actionType="export"
        triggerRef={jsonExportButtonRef}
        userId={user?.id}
        metadata={{
          costBreakdown: t`JSON Export: ${JSON_EXPORT_COST} coins`,
          note: t`Low-cost backup option`,
        }}
      />

      {/* Translation Coin Confirmation Popover */}
      <CoinConfirmPopover
        open={showTranslationCoinPopover}
        onClose={() => setShowTranslationCoinPopover(false)}
        required={calculateTranslationCost(resume.data)}
        balance={balance}
        onConfirm={confirmTranslation}
        onBuyCoins={handleBuyCoinsForTranslation}
        title={t`Translation to ${selectedLanguage.toUpperCase()}`}
        description={t`Translate your resume to ${availableLanguages.find(l => l.code === selectedLanguage)?.name || selectedLanguage.toUpperCase()} using advanced AI. The translation will be saved as a new resume in your workspace.`}
        actionType="enhance"
        triggerRef={translationButtonRef}
        userId={user?.id}
        metadata={{
          targetLanguage: selectedLanguage,
          languageName: availableLanguages.find(l => l.code === selectedLanguage)?.name,
          cost: calculateTranslationCost(resume.data),
          costBreakdown: t`AI Translation: ${calculateTranslationCost(resume.data)} coins`,
        }}
      />
    </>
  );
};