// client/components/cover-letter/sidebars/sections/export.tsx
import { Button } from '@reactive-resume/ui';
import { Download, FileText, Info, CheckCircle, Coins } from 'lucide-react';
import { useCoverLetterStore } from "../../../../../stores/cover-letter";
import { useAuthStore } from '@/client/stores/auth';
import { useWallet } from '@/client/hooks/useWallet';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { exportToPDF } from '@/client/libs/export';
import { CoinConfirmPopover } from '@/client/components/modals/coin-confirm-modal';
import { useNavigate } from 'react-router';

interface ExportSectionProps {
  disabled?: boolean;
}

export const ExportSection = ({ disabled = false }: ExportSectionProps) => {
  const { coverLetter } = useCoverLetterStore();
  const { user } = useAuthStore();
  const { 
    balance, 
    canAfford, 
    deductCoinsWithRollback, 
    completeTransaction, 
    refundTransaction, 
    fetchBalance 
  } = useWallet(user?.id || '');
  
  const navigate = useNavigate();
  
  const [showCoinPopover, setShowCoinPopover] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportCost] = useState(10);
  
  const exportButtonRef = useRef<HTMLButtonElement>(null);

  const generateTransactionId = (): string => {
    return `export_pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const ensurePreviewModeForExport = async () => {
    // First, check if we're already in preview mode by looking for the main preview toggle button
    const previewButton = document.querySelector('button:has(svg.lucide-eye), button:has(svg.lucide-eye-off)');
    const isInPreviewMode = previewButton?.textContent?.includes('Edit');
    
    if (!isInPreviewMode) {
      // Click the preview button to switch to preview mode
      if (previewButton) {
        (previewButton as HTMLButtonElement).click();
        // Wait a moment for the UI to update
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    // Now hide ONLY the editing UI elements, NOT the content
    // Be very specific about what we hide
    const elementsToHide = [
      // Drag handles only
      '[data-drag-handle]',
      '.drag-handle',
      '.resize-handle',
      
      // Selection rings only (not content)
      '.ring-2[class*="border"]',
      '.ring-2.border-blue-500',
      '.ring-2.border-dashed',
      
      // Editing controls
      '.block-controls',
      '.resize-control',
      '.delete-button',
      '.edit-button',
      
      // Grid editing UI
      '.react-grid-item.resizing',
      '.react-grid-item.react-draggable-dragging'
    ];
    
    const selectors = elementsToHide.join(', ');
    const editingElements = document.querySelectorAll(selectors);
    const originalStyles: Array<{ element: HTMLElement, display: string, opacity: string }> = [];
    
    editingElements.forEach((element) => {
      const el = element as HTMLElement;
      originalStyles.push({
        element: el,
        display: el.style.display,
        opacity: el.style.opacity
      });
      
      // Hide with opacity instead of display to preserve layout
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
    });
    
    return originalStyles;
  };

  const restoreEditingUI = (originalStyles: Array<{ element: HTMLElement, display: string, opacity: string }>) => {
    originalStyles.forEach(({ element, display, opacity }) => {
      element.style.display = display;
      element.style.opacity = opacity;
      element.style.pointerEvents = '';
    });
  };

  const quickPreviewAndExport = async () => {
    if (!coverLetter || !user) return;

    const transactionId = generateTransactionId();
    let transactionSuccess = false;
    
    setIsExporting(true);

    // Store original styles for restoration
    let originalStyles: Array<{ element: HTMLElement, display: string, opacity: string }> = [];

    try {
      // Step 1: Reserve coins
      const transactionResult = await deductCoinsWithRollback(
        exportCost,
        `PDF Export - ${coverLetter.title}`,
        { 
          transactionId, 
          coverLetterId: coverLetter.id,
          action: 'pdf_export'
        }
      );

      if (!transactionResult.success) {
        throw new Error('Failed to reserve coins for PDF export');
      }

      transactionSuccess = true;

      // Step 2: Switch to preview mode and hide editing UI
      toast.info('Preparing preview for export...', { duration: 1000 });
      originalStyles = await ensurePreviewModeForExport();
      
      // Give a moment for the preview to render
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 3: Show loading toast
      const loadingToast = toast.loading('Generating PDF from preview...');

      try {
        // DEBUG: Log what we're exporting
        console.log('Exporting cover letter with blocks:', {
          totalBlocks: coverLetter.content?.blocks?.length,
          blocksWithContent: coverLetter.content?.blocks?.filter((b: any) => b.content?.trim()).length,
          allBlocks: coverLetter.content?.blocks?.map((b: any) => ({
            id: b.id,
            type: b.type,
            content: b.content?.substring(0, 50) + '...',
            hasContent: !!b.content?.trim()
          }))
        });

        // Step 4: Generate PDF
        await exportToPDF({
          ...coverLetter,
          content: {
            ...coverLetter.content,
            blocks: coverLetter.content?.blocks || []
          }
        });
        
      } finally {
        toast.dismiss(loadingToast);
        
        // Step 5: Restore editing UI immediately
        restoreEditingUI(originalStyles);
      }

      // Step 6: Mark transaction as completed
      await completeTransaction(transactionId, {
        result: 'success',
        coverLetterTitle: coverLetter.title,
        fileSize: 'PDF',
        exportedAt: new Date().toISOString()
      });

      toast.success(
        <div className="space-y-1">
          <div className="font-medium">PDF exported with preview formatting!</div>
          <div className="text-xs text-green-600 flex items-center gap-1">
            <Coins className="w-3 h-3" />
            Used {exportCost} coins
          </div>
        </div>,
        { duration: 3000 }
      );

      setShowCoinPopover(false);

    } catch (error: any) {
      console.error("PDF export failed:", error);
      
      // Always restore UI even on error
      if (originalStyles.length > 0) {
        restoreEditingUI(originalStyles);
      }
      
      // Step 7: Refund coins if transaction was successful
      if (transactionSuccess) {
        try {
          await refundTransaction(transactionId, error.message || 'PDF export failed');
          await fetchBalance();
          console.log(`Refunded ${exportCost} coins`);
          
          toast.info('Coins refunded due to export failure', { duration: 2000 });
        } catch (refundError) {
          console.error('Failed to refund coins:', refundError);
        }
      }

      toast.error('PDF export failed: ' + error.message, {
        duration: 3000,
      });

      setShowCoinPopover(false);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!coverLetter || !user) {
      toast.error("Please sign in to export PDF");
      return;
    }

    // Check if cover letter has content
    const hasContent = coverLetter.content?.blocks?.some((block: any) => 
      block.content && block.content.trim().length > 0
    );

    if (!hasContent) {
      toast.error("Please add content to your cover letter before exporting");
      return;
    }

    // First check if user can afford
    const affordable = await canAfford(exportCost);
    
    if (!affordable) {
      setShowCoinPopover(true);
      return;
    }

    // Export immediately with quick preview
    await quickPreviewAndExport();
  };

  const confirmExportPDF = async () => {
    try {
      const affordable = await canAfford(exportCost);

      if (!affordable) {
        toast.error("Not enough coins");
        setShowCoinPopover(false);
        return;
      }

      if (!coverLetter) {
        toast.error("Letter is not loaded");
        setShowCoinPopover(false);
        return;
      }

      await quickPreviewAndExport();

    } catch (error) {
      console.error("PDF export preparation failed:", error);
      toast.error("Failed to prepare PDF export");
      setShowCoinPopover(false);
    }
  };

  const handleBuyCoins = (goSubscription = false) => {
    setShowCoinPopover(false);
    if (goSubscription) {
      navigate("/dashboard/pricing");
    } else {
      navigate(`/dashboard/coins?needed=${exportCost - balance}`);
    }
  };

  const hasCoverLetter = coverLetter && coverLetter.content?.blocks;
  const hasContent = hasCoverLetter && coverLetter.content.blocks.some((block: any) => 
    block.content && block.content.trim().length > 0
  );

  return (
    <section id="export">
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
          <Download className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Export</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Download your cover letter</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <Button
            ref={exportButtonRef}
            onClick={handleExportPDF}
            disabled={disabled || !hasCoverLetter || !hasContent || isExporting}
            className="w-full justify-start bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
            size="lg"
          >
            {isExporting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Export as PDF
            <span className="ml-auto text-xs text-purple-100 bg-purple-800 px-2 py-1 rounded">
              {isExporting ? 'Exporting...' : `Cost: ${exportCost} coins`}
            </span>
          </Button>

          {/* Simple info about preview */}
          {hasCoverLetter && hasContent && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Export with Preview Formatting</p>
                  <p className="text-xs mt-1">
                    Your PDF will include all content blocks with clean, professional formatting.
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasCoverLetter && !hasContent && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium">Add content to export</p>
                  <p className="text-xs mt-1">Your cover letter needs content before you can export it.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Simple Export Status */}
        <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
            <div className="flex justify-between items-center">
              <span>Export Ready:</span>
              <span className={`font-semibold ${hasContent ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                {hasContent ? 'Ready' : 'Add Content'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Cost:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{exportCost} coins</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Your Balance:</span>
              <span className={`font-semibold ${balance >= exportCost ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {balance} coins
              </span>
            </div>
            {hasCoverLetter && (
              <div className="flex justify-between items-center">
                <span>Blocks with Content:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {coverLetter.content.blocks.filter((b: any) => b.content?.trim()).length} / {coverLetter.content.blocks.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coin Confirmation Popover */}
      <CoinConfirmPopover
        open={showCoinPopover}
        onClose={() => setShowCoinPopover(false)}
        required={exportCost}
        balance={balance}
        onConfirm={confirmExportPDF}
        onBuyCoins={handleBuyCoins}
        title="Export Cover Letter as PDF"
        description="Export your professionally formatted letter as a high-quality PDF document."
        actionType="export"
        triggerRef={exportButtonRef}
        userId={user?.id}
      />
    </section>
  );
};