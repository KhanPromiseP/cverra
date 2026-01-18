import { t, Trans } from "@lingui/macro";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowsOutCardinal,
  CircleNotch,
  ClockClockwise,
  CubeFocus,
  FilePdf,
  Hash,
  LineSegment,
  LinkSimple,
  MagnifyingGlass,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Coins,
} from "@phosphor-icons/react";
import { Button, Separator, Toggle, Tooltip } from "@reactive-resume/ui";
import { motion } from "framer-motion";
import { useState, useRef } from "react";

import { useToast } from "@/client/hooks/use-toast";
import { usePrintResume } from "@/client/services/resume";
import { useBuilderStore } from "@/client/stores/builder";
import { useResumeStore, useTemporalResumeStore } from "@/client/stores/resume";
import { useAuthStore } from "@/client/stores/auth";
import { useWallet } from "@/client/hooks/useWallet";
import { CoinConfirmPopover } from "@/client/components/modals/coin-confirm-modal";
import { calculateExportCost } from "@/client/libs/resume-pricing";

const openInNewTab = (url: string) => {
  const win = window.open(url, "_blank");
  if (win) win.focus();
};

export const BuilderToolbar = () => {
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const [panMode, setPanMode] = useState<boolean>(true);
  const [showPdfCoinPopover, setShowPdfCoinPopover] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  const setValue = useResumeStore((state) => state.setValue);
  const undo = useTemporalResumeStore((state) => state.undo);
  const redo = useTemporalResumeStore((state) => state.redo);
  const frameRef = useBuilderStore((state) => state.frame.ref);

  const id = useResumeStore((state) => state.resume.id);
  const resume = useResumeStore((state) => state.resume);
  const isPublic = useResumeStore((state) => state.resume.visibility === "public");
  const pageOptions = useResumeStore((state) => state.resume.data.metadata.page.options);
  
  const { printResume, loading } = usePrintResume();
  
  // Wallet and coin management
  const { 
    balance, 
    canAfford, 
    deductCoinsWithRollback, 
    completeTransaction, 
    refundTransaction, 
    fetchBalance 
  } = useWallet(user?.id || '');
  
  const pdfExportButtonRef = useRef<HTMLButtonElement>(null);

  // Calculate PDF export cost based on template
  const getPdfExportCost = () => {
    const templateId = resume.data.metadata?.template || 'vertex';
    return calculateExportCost(templateId);
  };

  const generateTransactionId = (action: string): string => {
    return `${action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const onPrint = async () => {
    if (!user) {
      toast({
        title: t`Authentication Required`,
        description: t`Please sign in to export your resume`,
        variant: "error",
      });
      return;
    }

    const pdfExportCost = getPdfExportCost();
    const affordable = await canAfford(pdfExportCost);
    
    if (!affordable) {
      setShowPdfCoinPopover(true);
      return;
    }

    // Proceed with export
    await processPdfExport();
  };

  const processPdfExport = async () => {
    const pdfExportCost = getPdfExportCost();
    const transactionId = generateTransactionId('pdf_export');
    let transactionSuccess = false;
    
    setIsExportingPdf(true);

    // Show loading toast
    const loadingToast = toast({
      title: t`Generating PDF`,
      description: t`Processing your resume (Cost: ${pdfExportCost} coins)...`,
      variant: "default",
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
        const { url } = await printResume({ id });
        
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
        
        // Also open in new tab for preview
        openInNewTab(url);
        
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
      });

      setShowPdfCoinPopover(false);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const confirmPdfExport = async () => {
    try {
      const pdfExportCost = getPdfExportCost();
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

  const handleBuyCoinsForPdf = (goSubscription = false) => {
    setShowPdfCoinPopover(false);
    if (goSubscription) {
      window.location.href = "/dashboard/pricing";
    } else {
      const shortage = getPdfExportCost() - balance;
      window.location.href = `/dashboard/coins?needed=${shortage > 0 ? shortage : getPdfExportCost()}`;
    }
  };

  const onCopy = async () => {
    const { url } = await printResume({ id });
    await navigator.clipboard.writeText(url);

    toast({
      variant: "success",
      title: t`A link has been copied to your clipboard.`,
      description: t`Anyone with this link can view and download the resume. Share it on your profile or with recruiters.`,
    });
  };

  const onZoomIn = () => frameRef?.contentWindow?.postMessage({ type: "ZOOM_IN" }, "*");
  const onZoomOut = () => frameRef?.contentWindow?.postMessage({ type: "ZOOM_OUT" }, "*");
  const onResetView = () => frameRef?.contentWindow?.postMessage({ type: "RESET_VIEW" }, "*");
  const onCenterView = () => frameRef?.contentWindow?.postMessage({ type: "CENTER_VIEW" }, "*");
  const onTogglePanMode = () => {
    setPanMode(!panMode);
    frameRef?.contentWindow?.postMessage({ type: "TOGGLE_PAN_MODE", panMode: !panMode }, "*");
  };

  // Get template display name
  const getTemplateDisplayName = () => {
    const templateId = resume.data.metadata?.template || 'vertex';
    const names: Record<string, string> = {
      'sovereign': t`Sovereign`,
      'apex': t`Apex`,
      'imperial': t`Imperial`,
      'vanguard': t`Vanguard`,
      'vertex': t`Vertex`,
      'meridian': t`Meridian`,
      'ascend': t`Ascend`,
      'clarity': t`Clarity`,
      'legacy': t`Legacy`,
      'prestige': t`Prestige`,
      'noble': t`Noble`,
      'regal': t`Regal`,
    };
    return names[templateId] || t`Professional`;
  };

  // Get template category
  const getTemplateCategory = () => {
    const templateId = resume.data.metadata?.template || 'vertex';
    const categories: Record<string, string> = {
      'sovereign': t`Executive / Authority`,
      'apex': t`Executive / Authority`,
      'imperial': t`Executive / Authority`,
      'vanguard': t`Executive / Authority`,
      'vertex': t`Modern / Professional`,
      'meridian': t`Modern / Professional`,
      'ascend': t`Modern / Professional`,
      'clarity': t`Modern / Professional`,
      'legacy': t`Timeless / Trusted`,
      'prestige': t`Timeless / Trusted`,
      'noble': t`Timeless / Trusted`,
      'regal': t`Timeless / Trusted`,
    };
    return categories[templateId] || t`Professional`;
  };

  // User balance display component
  const UserBalance = () => {
    if (!user) return null;
    
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/30 rounded-full border border-yellow-200 dark:border-yellow-800">
        <Coins size={12} className="text-yellow-600 dark:text-yellow-400" />
        <span className="text-xs font-medium text-yellow-800 dark:text-yellow-300">{balance}</span>
      </div>
    );
  };

  return (
    <>
      <motion.div className="fixed inset-x-0 bottom-0 mx-auto hidden py-6 text-center md:block">
        <div className="inline-flex items-center justify-center rounded-full bg-background px-4 shadow-xl border border-gray-700">
          {/* User Balance Display */}
          {user && (
            <>
              <div className="flex items-center gap-1.5 px-2">
                <UserBalance />
              </div>
              <Separator orientation="vertical" className="h-9" />
            </>
          )}

          <Tooltip content={t`Undo`}>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-none"
              onClick={() => {
                undo();
              }}
            >
              <ArrowCounterClockwise />
            </Button>
          </Tooltip>

          <Separator orientation="vertical" className="h-9" />

          <Tooltip content={t`Redo`}>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-none"
              onClick={() => {
                redo();
              }}
            >
              <ArrowClockwise />
            </Button>
          </Tooltip>

          <Separator orientation="vertical" className="h-9" />

          <Tooltip content={panMode ? t`Scroll to Pan` : t`Scroll to Zoom`}>
            <Toggle className="rounded-none" pressed={panMode} onPressedChange={onTogglePanMode}>
              {panMode ? <ArrowsOutCardinal /> : <MagnifyingGlass />}
            </Toggle>
          </Tooltip>

          <Separator orientation="vertical" className="h-9" />

          <Tooltip content={t`Zoom In`}>
            <Button size="icon" variant="ghost" className="rounded-none" onClick={onZoomIn}>
              <MagnifyingGlassPlus />
            </Button>
          </Tooltip>

          <Separator orientation="vertical" className="h-9" />

          <Tooltip content={t`Zoom Out`}>
            <Button size="icon" variant="ghost" className="rounded-none" onClick={onZoomOut}>
              <MagnifyingGlassMinus />
            </Button>
          </Tooltip>

          <Separator orientation="vertical" className="h-9" />

          <Tooltip content={t`Reset Zoom`}>
            <Button size="icon" variant="ghost" className="rounded-none" onClick={onResetView}>
              <ClockClockwise />
            </Button>
          </Tooltip>

          <Separator orientation="vertical" className="h-9" />

          <Tooltip content={t`Center Artboard`}>
            <Button size="icon" variant="ghost" className="rounded-none" onClick={onCenterView}>
              <CubeFocus />
            </Button>
          </Tooltip>

          <Separator orientation="vertical" className="h-9" />

          <Tooltip content={t`Toggle Page Break Line`}>
            <Toggle
              className="rounded-none"
              pressed={pageOptions.breakLine}
              onPressedChange={(pressed) => {
                setValue("metadata.page.options.breakLine", pressed);
              }}
            >
              <LineSegment />
            </Toggle>
          </Tooltip>

          <Separator orientation="vertical" className="h-9" />

          <Tooltip content={t`Toggle Page Numbers`}>
            <Toggle
              className="rounded-none"
              pressed={pageOptions.pageNumbers}
              onPressedChange={(pressed) => {
                setValue("metadata.page.options.pageNumbers", pressed);
              }}
            >
              <Hash />
            </Toggle>
          </Tooltip>

          <Separator orientation="vertical" className="h-9" />

          <Tooltip content={t`Copy Link to Resume`}>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-none"
              disabled={!isPublic}
              onClick={onCopy}
            >
              <LinkSimple />
            </Button>
          </Tooltip>

          <Separator orientation="vertical" className="h-9" />

          <Tooltip content={t`Download PDF (${getPdfExportCost()} coins)`}>
            <Button
              ref={pdfExportButtonRef}
              size="icon"
              variant="ghost"
              disabled={loading || isExportingPdf || !user}
              className="rounded-none relative group"
              onClick={onPrint}
            >
              {(loading || isExportingPdf) ? (
                <CircleNotch className="animate-spin" />
              ) : (
                <>
                  <FilePdf />
                  {/* Coin badge overlay */}
                  <div className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-yellow-500 text-white text-[8px] font-bold shadow-sm">
                    {getPdfExportCost()}
                  </div>
                </>
              )}
            </Button>
          </Tooltip>
        </div>
      </motion.div>

      {/* PDF Export Coin Confirmation Popover */}
      <CoinConfirmPopover
        open={showPdfCoinPopover}
        onClose={() => setShowPdfCoinPopover(false)}
        required={getPdfExportCost()}
        balance={balance}
        onConfirm={confirmPdfExport}
        onBuyCoins={handleBuyCoinsForPdf}
        title={t`Export ${getTemplateDisplayName()} Resume as PDF`}
        description={t`Export your professionally formatted ${getTemplateDisplayName()} resume as a high-quality PDF. This ${getTemplateCategory().toLowerCase()} template is optimized for printing and job applications.`}
        actionType="export"
        triggerRef={pdfExportButtonRef}
        userId={user?.id}
        metadata={{
          template: resume.data.metadata?.template,
          templateName: getTemplateDisplayName(),
          templateCategory: getTemplateCategory(),
          costBreakdown: t`Template: ${getPdfExportCost()} coins`,
        }}
      />
    </>
  );
};