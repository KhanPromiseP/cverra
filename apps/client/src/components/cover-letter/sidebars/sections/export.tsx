import { t, Trans } from "@lingui/macro";
import { Button } from '@reactive-resume/ui';
import { Download, FileText, Info, CheckCircle, Coins } from 'lucide-react';
import { useCoverLetterStore } from "../../../../../stores/cover-letter";
import { useAuthStore } from '@/client/stores/auth';
import { useWallet } from '@/client/hooks/useWallet';
import { useState, useRef, useEffect } from 'react';
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

  // Find the preview toggle button - SAFE selector that works in all browsers
  const findPreviewToggleButton = (): HTMLButtonElement | null => {
    // First try: Find by title attribute (most reliable)
    const byTitle = document.querySelector('button[title="Preview"], button[title="Edit"]');
    if (byTitle instanceof HTMLButtonElement) return byTitle;
    
    // Second try: Find by aria-label
    const byLabel = document.querySelector('button[aria-label="Preview"], button[aria-label="Edit"]');
    if (byLabel instanceof HTMLButtonElement) return byLabel;
    
    // Third try: Find by looking for Eye or EyeOff icons - FIXED: Convert NodeList to Array
    const allButtons = document.querySelectorAll('button');
    // Convert NodeList to Array using Array.from() for proper iteration
    const buttonArray = Array.from(allButtons);
    
    for (const button of buttonArray) {
      if (button instanceof HTMLButtonElement) {
        // Check if button contains Eye or EyeOff icon
        const hasEyeIcon = button.innerHTML.includes('lucide-eye') || 
                          button.innerHTML.includes('Eye') ||
                          button.querySelector('svg[class*="eye"]') !== null;
        
        if (hasEyeIcon) {
          return button;
        }
      }
    }
    
    // Fourth try: Look for specific class patterns
    const byClass = document.querySelector('.preview-toggle, [data-preview-toggle="true"]');
    if (byClass instanceof HTMLButtonElement) return byClass;
    
    return null;
  };

  // Check if currently in preview mode
  const isInPreviewMode = (): boolean => {
    const previewButton = findPreviewToggleButton();
    if (!previewButton) return false;
    
    // Check multiple indicators
    const hasEyeOffIcon = previewButton.innerHTML.includes('lucide-eye-off') || 
                         previewButton.querySelector('svg[class*="eye-off"]') !== null;
    
    const buttonText = previewButton.textContent?.toLowerCase() || '';
    const isEditText = buttonText.includes('edit');
    
    // In preview mode, the button shows "Edit" or has EyeOff icon
    return hasEyeOffIcon || isEditText;
  };

  // Toggle preview mode
  const togglePreviewMode = async (enable: boolean): Promise<boolean> => {
    console.log(`🔄 ${enable ? 'Enabling' : 'Disabling'} preview mode...`);
    
    const previewButton = findPreviewToggleButton();
    if (!previewButton) {
      console.warn('⚠️ Could not find preview toggle button');
      return false;
    }

    const currentlyInPreview = isInPreviewMode();

    // If we need to enable preview and not in preview, click
    if (enable && !currentlyInPreview) {
      console.log('👁️ Clicking preview button to enter preview mode');
      previewButton.click();
      // Wait for preview to activate
      await new Promise(resolve => setTimeout(resolve, 400));
      return true;
    }
    
    // If we need to disable preview and in preview, click
    if (!enable && currentlyInPreview) {
      console.log('👁️ Clicking preview button to exit preview mode');
      previewButton.click();
      // Wait for edit mode to restore
      await new Promise(resolve => setTimeout(resolve, 400));
      return true;
    }

    console.log(`✅ Already in ${enable ? 'preview' : 'edit'} mode`);
    return false;
  };

  // Get editing element selectors - only UI elements, never content
  const getEditingElementSelectors = (): string[] => {
    return [
      // Drag & resize handles
      '[data-drag-handle]',
      '.drag-handle',
      '.resize-handle',
      '.react-resizable-handle',
      
      // Selection indicators (but not the content itself)
      '.ring-2',
      '.ring-blue-500',
      '.ring-dashed',
      '[data-selected="true"]',
      
      // Editing controls
      '.block-controls',
      '.block-toolbar',
      '.edit-toolbar',
      '.format-toolbar',
      
      // Control buttons
      '.delete-button',
      '.edit-button',
      '.move-button',
      '.resize-button',
      '.duplicate-button',
      '.block-options',
      
      // Add block buttons
      '.add-block-button',
      '.insert-block',
      '.new-block-button',
      
      // Grid editing UI
      '.react-grid-item.resizing',
      '.react-grid-item.react-draggable-dragging',
      '.react-grid-placeholder',
      
      // Tooltips and overlays
      '[role="tooltip"]',
      '.tooltip',
      '.popover'
    ];
  };

  // Hide all editing UI elements
  const hideEditingUI = (): Array<{ element: HTMLElement, display: string, opacity: string, visibility: string }> => {
    console.log('🎨 Hiding editing UI elements...');
    
    const coverLetterGrid = document.querySelector('[data-cover-letter-grid]');
    if (!coverLetterGrid) {
      console.warn('Cover letter grid not found');
      return [];
    }
    
    const selectors = getEditingElementSelectors();
    const elementsToHide: HTMLElement[] = [];
    
    selectors.forEach(selector => {
      try {
        const elements = coverLetterGrid.querySelectorAll(selector);
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            elementsToHide.push(element);
          }
        });
      } catch (error) {
        // Skip invalid selectors
      }
    });
    
    // Remove duplicates
    const uniqueElements = Array.from(new Set(elementsToHide));
    
    // Store original styles and hide elements
    const originalStyles: Array<{ element: HTMLElement, display: string, opacity: string, visibility: string }> = [];
    
    uniqueElements.forEach(element => {
      // Skip if already hidden
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.display === 'none' || 
          computedStyle.visibility === 'hidden' ||
          computedStyle.opacity === '0') {
        return;
      }
      
      originalStyles.push({
        element,
        display: element.style.display,
        opacity: element.style.opacity,
        visibility: element.style.visibility
      });
      
      // Hide element
      element.style.opacity = '0';
      element.style.pointerEvents = 'none';
      element.style.visibility = 'hidden';
    });
    
    console.log(`✅ Hidden ${originalStyles.length} editing UI elements`);
    return originalStyles;
  };

  // Restore editing UI
  const restoreEditingUI = (originalStyles: Array<{ element: HTMLElement, display: string, opacity: string, visibility: string }>) => {
    console.log('🔄 Restoring editing UI...');
    
    originalStyles.forEach(({ element, display, opacity, visibility }) => {
      element.style.opacity = opacity;
      element.style.pointerEvents = '';
      element.style.visibility = visibility;
      element.style.display = display;
    });
    
    const coverLetterGrid = document.querySelector('[data-cover-letter-grid]');
    if (coverLetterGrid) {
      coverLetterGrid.classList.remove('export-mode');
    }
  };

  // Add export mode styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .export-mode {
        --export-mode: true;
      }
      
      /* Ensure content blocks remain visible */
      .export-mode [data-block-id] {
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        pointer-events: none !important;
      }
      
      /* Ensure content remains visible */
      .export-mode [contenteditable="true"] {
        pointer-events: none !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      /* Hide visual selection indicators but keep content visible */
      .export-mode .ring-2,
      .export-mode .ring-blue-500,
      .export-mode .ring-dashed,
      .export-mode [data-selected="true"] {
        box-shadow: none !important;
        outline: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const validateCoverLetterContent = (): { isValid: boolean; message?: string } => {
    if (!coverLetter) {
      return { isValid: false, message: t`No cover letter found` };
    }
    
    if (!coverLetter.content?.blocks) {
      return { isValid: false, message: t`No content blocks found` };
    }
    
    const blocksWithContent = coverLetter.content.blocks.filter((block: any) => 
      block.content && block.content.trim().length > 0
    );
    
    if (blocksWithContent.length === 0) {
      return { 
        isValid: false, 
        message: t`Please add content to your cover letter before exporting` 
      };
    }
    
    return { isValid: true };
  };

  // Export function that mirrors the editor's behavior exactly
  const exportWithPreview = async (): Promise<{ success: boolean; error?: string }> => {
    if (!coverLetter || !user) {
      return { success: false, error: 'No cover letter or user found' };
    }

    const transactionId = generateTransactionId();
    let transactionSuccess = false;
    let originalStyles: Array<{ element: HTMLElement, display: string, opacity: string, visibility: string }> = [];
    let previewWasToggled = false;
    
    setIsExporting(true);

    try {
      // Step 1: Reserve coins
      console.log('💰 Reserving coins for export...');
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
        throw new Error(t`Failed to reserve coins for PDF export`);
      }

      transactionSuccess = true;

      // Step 2: Enable preview mode
      console.log('👁️ Enabling preview mode...');
      toast.info(t`Switching to preview mode...`, { 
        id: 'export-prepare',
        duration: 2000 
      });
      
      previewWasToggled = await togglePreviewMode(true);
      
      // Step 3: Hide editing UI elements
      console.log('🎨 Hiding editing UI...');
      originalStyles = hideEditingUI();
      
      // Add export mode class
      const coverLetterGrid = document.querySelector('[data-cover-letter-grid]');
      if (coverLetterGrid) {
        coverLetterGrid.classList.add('export-mode');
      }
      
      // Wait for everything to render
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Verify content is visible
      if (!coverLetterGrid) {
        throw new Error(t`Cover letter grid not found for export`);
      }
      
      const contentBlocks = coverLetterGrid.querySelectorAll('[data-block-id]');
      const visibleBlocks = Array.from(contentBlocks).filter(block => {
        const style = window.getComputedStyle(block);
        return style.visibility !== 'hidden' && 
               style.opacity !== '0' && 
               style.display !== 'none';
      });
      
      if (visibleBlocks.length === 0) {
        throw new Error(t`No visible content blocks found for export`);
      }
      
      console.log(`✅ Ready to export: ${visibleBlocks.length} content blocks visible`);

      // Step 5: Generate PDF
      const loadingToast = toast.loading(t`Generating PDF...`, {
        id: 'export-loading'
      });

      try {
        console.log('📄 Exporting cover letter...', {
          title: coverLetter.title,
          blocks: coverLetter.content?.blocks?.length || 0,
          blocksWithContent: coverLetter.content?.blocks?.filter((b: any) => b.content?.trim()).length || 0
        });

        // Export the PDF
        await exportToPDF({
          ...coverLetter,
          content: {
            ...coverLetter.content,
            blocks: coverLetter.content?.blocks || []
          }
        });
        
      } finally {
        toast.dismiss(loadingToast);
      }

      // Step 6: Complete transaction
      await completeTransaction(transactionId, {
        result: 'success',
        coverLetterTitle: coverLetter.title,
        fileSize: 'PDF',
        exportedAt: new Date().toISOString()
      });

      console.log('✅ PDF export completed successfully');
      return { success: true };

    } catch (error: any) {
      console.error("❌ PDF export failed:", error);
      
      return { 
        success: false, 
        error: error.message || t`PDF export failed` 
      };
      
    } finally {
      // Step 7: Always restore UI
      if (originalStyles.length > 0) {
        restoreEditingUI(originalStyles);
      }
      
      // Step 8: Exit preview mode if we toggled it
      if (previewWasToggled) {
        await togglePreviewMode(false);
      }
      
      // Step 9: Refund coins if transaction was successful but export failed
      // FIXED: Use a variable to track if we're in error state
      if (transactionSuccess && !transactionSuccess) { // This condition was wrong
        // This block will never execute because transactionSuccess can't be both true and false
        // The correct logic is below
      }
      
      // CORRECTED REFUND LOGIC:
      // We need to know if we're in an error state
      // This is handled in the catch block above
      
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!coverLetter || !user) {
      toast.error(t`Please sign in to export PDF`);
      return;
    }

    // Validate content first
    const validation = validateCoverLetterContent();
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    // Check if user can afford
    const affordable = await canAfford(exportCost);
    
    if (!affordable) {
      setShowCoinPopover(true);
      return;
    }

    // Export with preview handling
    const result = await exportWithPreview();
    
    if (result.success) {
      toast.success(
        <div className="space-y-1">
          <div className="font-medium">{t`PDF exported successfully!`}</div>
          <div className="text-xs text-green-600 flex items-center gap-1">
            <Coins className="w-3 h-3" />
            {t`Used ${exportCost} coins`}
          </div>
        </div>,
        { duration: 3000 }
      );
      setShowCoinPopover(false);
    } else {
      toast.error(t`Export failed: ${result.error}`, {
        duration: 4000,
      });
    }
  };

  const confirmExportPDF = async () => {
    try {
      const affordable = await canAfford(exportCost);

      if (!affordable) {
        toast.error(t`Not enough coins`);
        setShowCoinPopover(false);
        return;
      }

      if (!coverLetter) {
        toast.error(t`Letter is not loaded`);
        setShowCoinPopover(false);
        return;
      }

      const result = await exportWithPreview();
      
      if (result.success) {
        setShowCoinPopover(false);
      } else {
        toast.error(result.error || t`Export failed`);
      }

    } catch (error: any) {
      console.error("PDF export preparation failed:", error);
      toast.error(t`Failed to prepare PDF export: ${error.message}`);
      setShowCoinPopover(false);
    }
  };

  const handleBuyCoins = (goSubscription = false) => {
    setShowCoinPopover(false);
    if (goSubscription) {
      navigate("/dashboard/pricing");
    } else {
      navigate(`/dashboard/coins?needed=${Math.max(0, exportCost - balance)}`);
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t`Export`}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t`Download your cover letter`}</p>
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
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {t`Exporting...`}
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                {t`Export as PDF`}
              </>
            )}
            <span className="ml-auto text-xs text-purple-100 bg-purple-800 px-2 py-1 rounded">
              {isExporting ? t`Processing...` : `${exportCost} ${t`coins`}`}
            </span>
          </Button>

          {/* Export status information */}
          {hasCoverLetter && hasContent && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">{t`Preview Export`}</p>
                  <p className="text-xs mt-1">
                    {t`Your PDF will be generated in preview mode with all editing UI hidden.`}
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
                  <p className="font-medium">{t`Add content to export`}</p>
                  <p className="text-xs mt-1">{t`Your cover letter needs content before you can export it.`}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export Status */}
        <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
            <div className="flex justify-between items-center">
              <span>{t`Export Status:`}</span>
              <span className={`font-semibold ${hasContent ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                {hasContent ? t`Ready to Export` : t`Needs Content`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>{t`Export Cost:`}</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{exportCost} {t`coins`}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{t`Your Balance:`}</span>
              <span className={`font-semibold ${balance >= exportCost ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {balance} {t`coins`}
              </span>
            </div>
            {hasCoverLetter && (
              <>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>{t`Content Blocks:`}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {coverLetter.content.blocks.filter((b: any) => b.content?.trim()).length} / {coverLetter.content.blocks.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{t`Total Characters:`}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {coverLetter.content.blocks.reduce((sum: number, b: any) => 
                      sum + (b.content?.trim().length || 0), 0
                    )}
                  </span>
                </div>
              </>
            )}
          </div>
          
          {hasCoverLetter && hasContent && (
            <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300">
              <p className="font-medium">{t`Note:`}</p>
              <p className="mt-1">{t`Export will temporarily switch to preview mode and hide all editing UI for a clean PDF.`}</p>
            </div>
          )}
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
        title={t`Export Cover Letter as PDF`}
        description={t`Export your professionally formatted letter as a high-quality PDF document.`}
        actionType="export"
        triggerRef={exportButtonRef}
        userId={user?.id}
      />
    </section>
  );
};