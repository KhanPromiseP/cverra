import { t, Trans } from "@lingui/macro";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useBreakpoint } from "@reactive-resume/hooks";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  VisuallyHidden,
  Button,
  Tooltip,
} from "@reactive-resume/ui";
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Download, 
  Plus, 
  Eye, 
  EyeOff,
  Save,
  XCircle,
  Coins
} from 'lucide-react';
import { 
  SidebarSimple, 
  PencilSimple, 
  Lock,
  House
} from "@phosphor-icons/react";
import { cn } from "@reactive-resume/utils";

import { CoverLetterGrid } from './cover-letter-grid';
import { CoverLetterWizard } from './cover-letter-wizard';
import { useAutoSave } from '@/client/hooks/use-auto-save';
import { exportToPDF, exportToDOCX } from '@/client/libs/export';
import { coverLetterService, CreateCoverLetterData, UpdateCoverLetterData } from '@/client/services/cover-letter.service';
import { toast } from 'sonner';
import { Link } from "react-router";
import { LocaleSwitch } from "@/client/components/locale-switch";
import { Logo } from "@/client/components/logo";
import { ThemeSwitch } from "@/client/components/theme-switch";

// Sidebar components
import { LeftSidebar } from './sidebars/left';
import { RightSidebar } from './sidebars/right';
import { useCoverLetterStore, CoverLetter } from '../../../stores/cover-letter';
import { useBuilderStore } from '@/client/stores/builder';

import { useAuthStore } from '@/client/stores/auth';
import { useWallet } from '@/client/hooks/useWallet';

import { CoinConfirmPopover } from '../modals/coin-confirm-modal';
import { autoSaveService } from '../../services/uto-save.service';

interface CoverLetterEditorProps {
  mode?: 'create' | 'edit';
}

const EditorContent = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore(); 
  const { 
    balance, 
    canAfford, 
    deductCoinsWithRollback, 
    completeTransaction, 
    refundTransaction, 
    fetchBalance 
  } = useWallet(user?.id || '');
  
  const { id } = useParams();
  const { coverLetter, setCoverLetter, selectedBlock, setSelectedBlock } = useCoverLetterStore();
  const [previewMode, setPreviewMode] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [showCoinPopover, setShowCoinPopover] = useState(false);
  const [exportCost] = useState(10);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved'>('idle');


  // Get builder store for sidebar state
  const sheet = useBuilderStore((state) => state.sheet);
  const toggleLeftSidebar = () => sheet.left.setOpen(!sheet.left.open);
  const toggleRightSidebar = () => sheet.right.setOpen(!sheet.right.open);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  

  useEffect(() => {
    return () => {
      console.log('Cleaning up auto-save timeout on unmount');
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = undefined;
      }
    };
  }, []);

  useEffect(() => {
  // Global beforeunload handler for entire cover letter
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (coverLetter?.id && hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = t`You have unsaved changes. Are you sure you want to leave?`;
      return e.returnValue;
    }
  };

  

  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    // Cleanup all auto-save timeouts
    autoSaveService.cleanup();
  };
}, [coverLetter?.id, hasUnsavedChanges]);

  useEffect(() => {
    console.log('Coin popover state:', showCoinPopover);
    console.log('User balance:', balance);
  }, [showCoinPopover, balance]);

  const { triggerSave } = useAutoSave({
  data: coverLetter,
  onSave: async (data) => {
    console.log('AUTO-SAVE HOOK FIRED!', {
      id: data?.id,
      blocksCount: data?.content?.blocks?.length,
      dataChanged: data !== coverLetter,
      timestamp: new Date().toISOString()
    });
    
    if (!id || !data || manualSaving) return;
    
    try {
      // Validate content before saving
      if (!data.content?.blocks || !Array.isArray(data.content.blocks)) {
        console.error('Invalid content structure for auto-save:', data.content);
        return;
      }

      console.log('Auto-saving to database...');
      
      // Prepare save data
      const saveData = {
        title: data.title,
        content: {
          ...data.content,
          structure: data.structure || data.content.structure || {}
        },
        style: data.style,
        layout: data.layout,
        structure: data.structure || data.content.structure || {}
      };

      console.log('Auto-save data:', {
        ...saveData,
        contentBlocks: saveData.content?.blocks?.length,
        contentStructure: !!saveData.content?.structure
      });
      
      // Save to database
      const savedCoverLetter = await coverLetterService.update(id, saveData);
      
      console.log('Auto-save successful!', {
        id: savedCoverLetter.id,
        updatedAt: savedCoverLetter.updatedAt
      });
      
      // Update store with fresh data from DB
      setCoverLetter(savedCoverLetter);
      
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast.error(t`Auto-save failed. Changes might not be saved.`);
    }
  },
  delay: 2000 // 2-second debounce
});

 // Enhanced content change handler with direct auto-save implementation
const handleContentChange = useCallback((newContent: any) => {
  if (!coverLetter || !coverLetter.id) return;
  
  console.log('Content changed - tracking for auto-save');
  setHasUnsavedChanges(true);
  
  const updatedCoverLetter = {
    ...coverLetter,
    content: {
      ...newContent,
      lastSaved: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  };

  setCoverLetter(updatedCoverLetter);
  
  // Schedule global auto-save
  autoSaveService.scheduleSave(
    `cover-letter-${coverLetter.id}`,
    updatedCoverLetter,
    async (dataToSave) => {
      console.log('Global auto-save triggered');
      
      const saveData = {
        title: dataToSave.title,
        content: {
          ...dataToSave.content,
          structure: dataToSave.structure || dataToSave.content.structure || {}
        },
        style: dataToSave.style,
        layout: dataToSave.layout,
        structure: dataToSave.structure || dataToSave.content.structure || {}
      };

      const saved = await coverLetterService.update(coverLetter.id, saveData);
      setCoverLetter(saved);
      setHasUnsavedChanges(false);
      console.log('Global auto-save successful');
    },
    1500 // 1.5 second debounce for global saves
  );
}, [coverLetter, setCoverLetter]);


 const handleManualSave = async () => {
  if (!coverLetter || !coverLetter.id) {
    toast.error(t`No cover letter to save`);
    return;
  }

  setManualSaving(true);
  try {
    // Validate content structure
    if (!coverLetter.content?.blocks || !Array.isArray(coverLetter.content.blocks)) {
      console.error('Invalid content structure:', coverLetter.content);
      toast.error(t`Invalid content structure - cannot save`);
      return;
    }

    console.log('Manual save triggered with content:', {
      id: coverLetter.id,
      blocksCount: coverLetter.content.blocks.length,
      firstBlockContent: coverLetter.content.blocks[0]?.content?.substring(0, 50),
      hasStructure: !!coverLetter.structure
    });
    
    // Prepare the save data - SIMPLIFIED VERSION
    const saveData: UpdateCoverLetterData = {
      title: coverLetter.title,
      content: {
        ...coverLetter.content,
        // CRITICAL: Ensure structure is in content
        structure: coverLetter.structure || coverLetter.content.structure || {},
        lastSaved: new Date().toISOString()
      },
      style: coverLetter.style,
      layout: coverLetter.layout,
      structure: coverLetter.structure || coverLetter.content.structure || {}
      // REMOVE userData and jobData if not needed for updates
    };

    console.log('Sending save data to API:', {
      ...saveData,
      contentBlocks: saveData.content?.blocks?.length,
      contentStructure: saveData.content?.structure ? 'Yes' : 'No',
      rootStructure: saveData.structure ? 'Yes' : 'No'
    });
    
    const savedCoverLetter = await coverLetterService.update(coverLetter.id, saveData);
    
    console.log('API response:', {
      id: savedCoverLetter.id,
      updatedAt: savedCoverLetter.updatedAt,
      contentBlocks: (savedCoverLetter.content as any)?.blocks?.length,
      contentStructure: (savedCoverLetter.content as any)?.structure ? 'Yes' : 'No'
    });
    
    setCoverLetter(savedCoverLetter);
    toast.success(t`Cover letter saved successfully!`);
    
  } catch (error: any) {
    console.error('Failed to save cover letter:', error);
    console.error('Error details:', error.response?.data || error.message);
    toast.error(t`Failed to save: ${error.message || 'Unknown error'}`);
  } finally {
    setManualSaving(false);
  }
};

  const handleTitleChange = (newTitle: string) => {
    if (!coverLetter) return;
    
    setCoverLetter({
      ...coverLetter,
      title: newTitle,
      updatedAt: new Date().toISOString()
    });
    triggerSave();
  };

  const handleBlockSelect = (blockId: string) => {
    setSelectedBlock(blockId);
  };

  const generateTransactionId = (): string => {
    return `export_pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const ensurePreviewModeForExport = async (): Promise<Array<{ element: HTMLElement, display: string, opacity: string }>> => {
    console.log('Ensuring preview mode for export...');
    
    // If we're not in preview mode, force it
    if (!previewMode) {
      console.log('Switching to preview mode...');
      setPreviewMode(true);
      
      // Wait for the preview mode to take effect
      await new Promise(resolve => {
        // Wait for state update
        setTimeout(() => {
          // Force a re-render
          requestAnimationFrame(() => {
            setTimeout(resolve, 300);
          });
        }, 100);
      });
    }
    
    // Get the cover letter grid element
    const coverLetterGrid = document.querySelector('[data-cover-letter-grid]');
    
    // If no grid found, return empty
    if (!coverLetterGrid) {
      console.warn('Cover letter grid not found');
      return [];
    }
    
    // Hide ALL editing UI elements comprehensively
    const elementsToHide = [
      // All possible drag handles
      '[data-drag-handle]',
      '.drag-handle',
      '.resize-handle',
      '.react-resizable-handle',
      '[data-resize-handle]',
      
      // All selection and highlight styles
      '.ring-2',
      '.ring-[2px]',
      '.ring-blue-500',
      '.ring-dashed',
      '.border-dashed',
      '.border-blue-500',
      '[data-selected="true"]',
      '.selected',
      '.is-selected',
      '.block-selected',
      '.active-block',
      
      // All control elements
      '.block-controls',
      '.block-toolbar',
      '.edit-toolbar',
      '.format-toolbar',
      '.control-bar',
      '.editor-controls',
      
      // All interactive buttons
      '.delete-button',
      '.edit-button',
      '.resize-button',
      '.move-button',
      '.duplicate-button',
      '.block-options',
      '.context-menu',
      
      // All hover effects
      '.hover\\:shadow-sm',
      '.hover\\:ring-1',
      '.hover\\:ring-2',
      '.hover\\:border',
      
      // Grid editing elements
      '.react-grid-item.resizing',
      '.react-grid-item.react-draggable-dragging',
      '.react-grid-placeholder',
      '.react-draggable',
      '.react-draggable-dragging',
      '.react-resizable',
      
      // Add block buttons
      '.add-block-button',
      '.insert-block',
      '.new-block-button',
      
      // Sidebar and panel controls
      '.block-sidebar',
      '.properties-panel',
      '.editor-panel',
      
      // Tooltips and overlays
      '[role="tooltip"]',
      '.tooltip',
      '.popover',
      '.modal-backdrop',
      '.overlay'
    ];
    
    // Collect all elements to hide
    const allElements: HTMLElement[] = [];
    elementsToHide.forEach(selector => {
      try {
        const elements = coverLetterGrid.querySelectorAll(selector);
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            allElements.push(element);
          }
        });
      } catch (error) {
        // Skip invalid selectors
      }
    });
    
    // Remove duplicates
    const uniqueElements = Array.from(new Set(allElements));
    
    // Store original styles and hide elements
    const originalStyles: Array<{ element: HTMLElement, display: string, opacity: string }> = [];
    
    uniqueElements.forEach(element => {
      // Check if element is already hidden
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.display === 'none' || 
          computedStyle.visibility === 'hidden' ||
          computedStyle.opacity === '0') {
        return;
      }
      
      originalStyles.push({
        element,
        display: element.style.display,
        opacity: element.style.opacity
      });
      
      // Hide element
      element.style.opacity = '0';
      element.style.pointerEvents = 'none';
      element.style.visibility = 'hidden';
    });
    
    console.log(`Hidden ${originalStyles.length} editing UI elements`);
    
    // Add a class to the grid to indicate export mode
    coverLetterGrid.classList.add('export-mode');
    
    // Force a reflow to ensure changes are rendered
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        coverLetterGrid.clientHeight; // Force reflow
        setTimeout(resolve, 100);
      });
    });
    
    return originalStyles;
  };

  const restoreEditingUI = (originalStyles: Array<{ element: HTMLElement, display: string, opacity: string }>) => {
    console.log('Restoring editing UI...');
    
    // Restore all hidden elements
    originalStyles.forEach(({ element, display, opacity }) => {
      element.style.opacity = opacity;
      element.style.pointerEvents = '';
      element.style.visibility = '';
      element.style.display = display;
    });
    
    // Remove export mode class
    const coverLetterGrid = document.querySelector('[data-cover-letter-grid]');
    if (coverLetterGrid) {
      coverLetterGrid.classList.remove('export-mode');
    }
    
    // Force a reflow
    requestAnimationFrame(() => {
      if (coverLetterGrid) {
        coverLetterGrid.clientHeight; // Force reflow
      }
    });
  };

  // Quick preview and export (same as ExportSection)
  const quickPreviewAndExport = async (): Promise<{ success: boolean; error?: string }> => {
    if (!coverLetter || !user) {
      return { success: false, error: 'No cover letter or user found' };
    }

    const transactionId = generateTransactionId();
    let transactionSuccess = false;
    let originalStyles: Array<{ element: HTMLElement, display: string, opacity: string }> = [];
    
    setIsExporting(true);

    try {
      // Step 1: Reserve coins
      console.log('Reserving coins for export...');
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

      // Step 2: Force preview mode and hide editing UI
      console.log('Preparing preview for export...');
      toast.info(t`Preparing preview for export...`, { 
        id: 'export-prepare',
        duration: 2000 
      });
      
      originalStyles = await ensurePreviewModeForExport();
      
      // Additional wait for preview to render
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Verify we're ready to export
      const coverLetterGrid = document.querySelector('[data-cover-letter-grid]');
      if (!coverLetterGrid) {
        throw new Error(t`Cover letter grid not found for export`);
      }
      
      // Check if content blocks are visible
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
      
      console.log(`Ready to export: ${visibleBlocks.length} content blocks visible`);

      // Step 4: Generate PDF
      const loadingToast = toast.loading(t`Generating PDF from preview...`, {
        id: 'export-loading'
      });

      try {
        console.log('Exporting cover letter...', {
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

      // Step 5: Complete transaction
      await completeTransaction(transactionId, {
        result: 'success',
        coverLetterTitle: coverLetter.title,
        fileSize: 'PDF',
        exportedAt: new Date().toISOString()
      });

      console.log('PDF export completed successfully');
      return { success: true };

    } catch (error: any) {
      console.error("PDF export failed:", error);
      
      // Always restore UI even on error
      if (originalStyles.length > 0) {
        restoreEditingUI(originalStyles);
      }
      
      // Refund coins if transaction was successful but export failed
      if (transactionSuccess) {
        try {
          await refundTransaction(transactionId, error.message || t`PDF export failed`);
          await fetchBalance();
          console.log(`Refunded ${exportCost} coins`);
          
          toast.info(t`Coins refunded due to export failure`, { 
            duration: 2000 
          });
        } catch (refundError) {
          console.error('Failed to refund coins:', refundError);
        }
      }

      return { 
        success: false, 
        error: error.message || t`PDF export failed` 
      };
      
    } finally {
      // Step 6: Always restore UI
      if (originalStyles.length > 0) {
        restoreEditingUI(originalStyles);
      }
      
      // Step 7: Exit preview mode if we forced it
      if (!previewMode) {
        setPreviewMode(false);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setIsExporting(false);
    }
  };

  // Use quickPreviewAndExport instead
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

      const result = await quickPreviewAndExport();
      if (!result.success) {
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
      // Only navigate for subscriptions
      navigate("/dashboard/pricing");
    } else {
      // For direct coin purchases, navigate to coins page
      navigate(`/dashboard/coins?needed=${exportCost - balance}`);
    }
  };

  //  use quickPreviewAndExport
  const handleExportPDF = async () => {
    if (!coverLetter || !user) {
      toast.error(t`Please sign in to export PDF`);
      return;
    }

    // Check if cover letter has content
    const blocksWithContent = coverLetter.content?.blocks?.filter((block: any) => 
      block.content && block.content.trim().length > 0
    ) || [];

    if (blocksWithContent.length === 0) {
      toast.error(
        <div className="space-y-1">
          <div className="font-medium">{t`No content to export`}</div>
          <div className="text-xs">{t`Please add content to your cover letter before exporting.`}</div>
        </div>,
        { duration: 3000 }
      );
      return;
    }

    // First check if user can afford
    const affordable = await canAfford(exportCost);
    
    if (!affordable) {
      setShowCoinPopover(true);
      return;
    }

    // Export with preview handling
    const result = await quickPreviewAndExport();
    
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
    } else {
      toast.error(t`Export failed: ${result.error}`, {
        duration: 4000,
      });
    }
  };


  useEffect(() => {
    // Add export mode styles
    const style = document.createElement('style');
    style.textContent = `
      .export-mode {
        --export-mode: true;
      }
      
      .export-mode [data-block-id] {
        cursor: default !important;
      }
      
      .export-mode [contenteditable="true"] {
        pointer-events: none !important;
      }
      
      .export-mode .professional-letter-container {
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);


  // Debug: Log current state
  useEffect(() => {
    if (coverLetter) {
      console.log('Current cover letter state:', {
        id: coverLetter.id,
        title: coverLetter.title,
        blocks: coverLetter.content?.blocks?.length,
        hasContent: coverLetter.content?.blocks?.some((b: any) => b.content && b.content.length > 0)
      });
    }
  }, [coverLetter]);

  if (!coverLetter) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t`Loading cover letter...`}</p>
        </div>
      </div>
    );
  }

  // Truncate title for mobile
  const getDisplayTitle = () => {
    if (isMobile) {
      if (coverLetter.title.length > 10) {
        return `${coverLetter.title.substring(0, 8)}...`;
      }
      return coverLetter.title;
    }
    
    if (coverLetter.title.length > 25) {
      return `${coverLetter.title.substring(0, 23)}...`;
    }
    return coverLetter.title;
  };

  return (
  <div className="flex flex-col h-full bg-background">
    {/* Fixed Header - Optimized for all screen sizes */}
    <div className="fixed top-0 left-0  right-0 z-50 bg-secondary-accent/95 backdrop-blur-xl border-b border-gray-700 shadow-lg">
      {/* Main Navigation Bar */}
      <div className="h-12 sm:h-14 flex items-center px-2 sm:px-3 md:px-4">
        {/* Left: Back and Menu */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Mobile Menu Button */}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 sm:hidden"
            onClick={toggleLeftSidebar}
            title={t`Menu`}
          >
            <SidebarSimple size={16} />
          </Button>

          {/* Back Button */}
          <Button 
            asChild 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 sm:h-9 sm:w-9"
            title={t`Back to Dashboard`}
          >
            <Link to="/dashboard/cover-letters">
              <ArrowLeft size={16} className="sm:size-5" />
            </Link>
          </Button>
        </div>

        {/* Center: Title */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-1 sm:px-2">
          <div className="flex flex-col items-center max-w-full">
            <h1 className="font-semibold text-xs sm:text-sm md:text-base truncate max-w-[140px] xs:max-w-[160px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-none text-center">
              {getDisplayTitle()}
            </h1>
            
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Essential Actions - Always visible */}
          <Button
            onClick={handleManualSave}
            variant="ghost"
            size="icon"
            disabled={manualSaving || isExporting}
            className="h-8 w-8 sm:h-9 sm:w-9"
            title={t`Save`}
          >
            {manualSaving ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
            ) : (
              <Save size={14} className="sm:size-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => setPreviewMode(!previewMode)}
            disabled={isExporting}
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            title={previewMode ? t`Edit` : t`Preview`}
          >
            {previewMode ? (
              <EyeOff size={14} className="sm:size-4" />
            ) : (
              <Eye size={14} className="sm:size-4" />
            )}
          </Button>

          <Button 
            ref={exportButtonRef}
            onClick={handleExportPDF}
            variant="ghost"
            disabled={isExporting}
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            title={t`Export PDF`}
          >
            {isExporting ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
            ) : (
              <Download size={14} className="sm:size-4" />
            )}
          </Button>

          {/* Locale & Theme - Visible on all screens */}
          <div className="flex items-center gap-0.5 ml-0.5">
            <div className="scale-80 sm:scale-90">
              <LocaleSwitch />
            </div>
            <div className="scale-80 sm:scale-90">
              <ThemeSwitch />
            </div>
          </div>

          {/* Right Menu Toggle - Mobile only */}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 sm:hidden"
            onClick={toggleRightSidebar}
            title={t`Tools`}
          >
            <SidebarSimple className="-scale-x-100" size={16} />
          </Button>

          {/* Desktop Save Button with Text */}
          <Button
            onClick={handleManualSave}
            variant="primary"
            size="sm"
            disabled={manualSaving || isExporting}
            className="hidden md:flex ml-1 bg-green-600 hover:bg-green-700 text-white border-green-700"
          >
            {manualSaving ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current mr-1.5" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {manualSaving ? t`Saving...` : t`Save`}
          </Button>
        </div>
      </div>

      {/* Status Bar - Shows detailed info */}
      <div className="px-2 sm:px-3 md:px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
        <div className={cn(
          "flex items-center justify-between",
          isMobile ? "text-[10px]" : "text-xs"
        )}>
          {/* Left info */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 overflow-hidden">
            <span className="truncate max-w-[70px] sm:max-w-[90px] font-mono">
              {coverLetter?.id?.substring(0, isMobile ? 5 : 7)}...
            </span>
            {!isMobile && (
              <>
                <span className="hidden sm:inline">{t`Blocks:`} <strong>{coverLetter?.content?.blocks?.length || 0}</strong></span>
                <span className="hidden md:inline">{t`Style:`} <strong>{coverLetter?.style}</strong></span>
              </>
            )}
            {isMobile && (
              <>
                <span>•</span>
                <span>{t`Style:`} <strong>{coverLetter?.style}</strong></span>
                   <span>•</span>
                <span>{coverLetter?.content?.blocks?.length || 0} {t`blocks`}</span>
              </>
            )}
            <span className="hidden sm:inline">•</span>
            <span>•</span>
            <span className="flex items-center">
              <Coins className={cn("mr-0.5", isMobile ? "w-2.5 h-2.5" : "w-3 h-3")} />
              <strong>{balance}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {autoSaveStatus === 'pending' && (
              <span className="flex items-center text-yellow-600">
                <div className="animate-pulse h-2 w-2 bg-yellow-500 rounded-full mr-1"></div>
                <span className="text-xs">{t`Auto-saving...`}</span>
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="flex items-center text-green-600">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                <span className="text-xs">{t`Auto-saved`}</span>
              </span>
            )}
          </div>

          {/* Right status indicators */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {coverLetter?.updatedAt && !isMobile && (
              <span className="hidden md:inline text-[10px]">
                {t`Updated:`} {new Date(coverLetter.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            )}
            {manualSaving && (
              <span className="flex items-center text-orange-600">
                <div className={cn(
                  "animate-spin rounded-full border-b-2 border-orange-600 mr-0.5",
                  isMobile ? "h-1.5 w-1.5" : "h-2 w-2"
                )}></div>
                <span className="hidden xs:inline">{t`Saving`}</span>
              </span>
            )}
            {isExporting && (
              <span className="flex items-center text-blue-600">
                <div className={cn(
                  "animate-spin rounded-full border-b-2 border-blue-600 mr-0.5",
                  isMobile ? "h-1.5 w-1.5" : "h-2 w-2"
                )}></div>
                <span className="hidden xs:inline">{t`Exporting`}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Spacer for fixed header */}
    <div className={cn(
      "flex-shrink-0",
      isMobile ? "h-[5rem]" : "h-[4.5rem] sm:h-[5rem]"
    )}></div>

    {/* Editor Area */}
    <div className="flex-1 overflow-auto p-2 sm:p-3 md:p-4 lg:p-6">
      <CoverLetterGrid
        content={coverLetter.content}
        onContentChange={handleContentChange}
        onBlockSelect={handleBlockSelect}
        selectedBlock={selectedBlock}
        previewMode={previewMode}
      />
    </div>

    {/* Coin Confirmation Popover */}
    <CoinConfirmPopover
      open={showCoinPopover}
      onClose={() => setShowCoinPopover(false)}
      required={exportCost}
      balance={balance}
      onConfirm={confirmExportPDF}
      onBuyCoins={handleBuyCoins}
      title={t`Export Letter as PDF`}
      description={t`Export your professionally formatted letter as a high-quality PDF document.`}
      actionType="export"
      triggerRef={exportButtonRef}
      userId={user?.id}
    />
  </div>
);
};

export const CoverLetterEditor = ({ mode = 'edit' }: CoverLetterEditorProps) => {
  const { isDesktop } = useBreakpoint();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { coverLetter, setCoverLetter, setSelectedBlock } = useCoverLetterStore();
  const [showWizard, setShowWizard] = useState(mode === 'create');
  const [isGenerating, setIsGenerating] = useState(false);

  const sheet = useBuilderStore((state) => state.sheet);
  const leftSetSize = useBuilderStore((state) => state.panel.left.setSize);
  const rightSetSize = useBuilderStore((state) => state.panel.right.setSize);
  const leftHandle = useBuilderStore((state) => state.panel.left.handle);
  const rightHandle = useBuilderStore((state) => state.panel.right.handle);

  // Load cover letter data if in edit mode
  useEffect(() => {
    if (id && mode === 'edit') {
      fetchCoverLetter();
    }
  }, [id, mode]);

  const fetchCoverLetter = async () => {
  try {
    const coverLetterData = await coverLetterService.findOne(id!);
    
    // Type cast it to CoverLetter interface
    const data = coverLetterData as CoverLetter;
    
    // Debug log what's being loaded
    console.log('Loaded cover letter from DB:', {
      id: data.id,
      contentBlocks: data.content?.blocks?.length,
      contentStructure: data.content?.structure,
      rootStructure: data.structure,
      hasContent: !!data.content,
      hasStructure: !!data.structure
    });
    
    // CRITICAL FIX: Ensure content structure is properly merged
    const coverLetterToSet = {
      ...data,
      // Ensure structure is properly set at both root and content levels
      structure: data.structure || data.content?.structure || {},
      content: {
        ...data.content,
        // Make sure content has the structure too
        structure: data.content?.structure || data.structure || {}
      }
    };
    
    console.log('Setting cover letter in store:', {
      blocksCount: coverLetterToSet.content?.blocks?.length,
      structure: coverLetterToSet.structure,
      contentStructure: coverLetterToSet.content?.structure
    });
    
    setCoverLetter(coverLetterToSet);
    
    // Auto-select first block if available
    if (coverLetterToSet.content?.blocks?.length > 0) {
      setSelectedBlock(coverLetterToSet.content.blocks[0].id);
    }
  } catch (error) {
    console.error('Failed to fetch cover letter:', error);
    toast.error(t`Failed to load cover letter`);
  }
};

  const handleGenerate = async (formData: CreateCoverLetterData) => {
    setIsGenerating(true);
    try {
      const result = await coverLetterService.create(formData);
      setCoverLetter(result.coverLetter);
      setShowWizard(false);
      
      // Auto-select first block after generation
      if (result.coverLetter.content?.blocks?.length > 0) {
        setSelectedBlock(result.coverLetter.content.blocks[0].id);
      }
      
      toast.success(t`Cover letter generated successfully!`);
      
      // Navigate to edit mode with the new ID
      navigate(`/builder/cover-letter/${result.coverLetter.id}/edit`, { replace: true });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || t`Failed to generate cover letter. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Show wizard for create mode
  if (mode === 'create' && showWizard) {
    return (
      <div className="h-full p-6">
        <CoverLetterWizard
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          onCancel={() => navigate('/dashboard/cover-letters')}
        />
      </div>
    );
  }

  const onOpenAutoFocus = (event: Event) => {
    event.preventDefault();
  };

  if (isDesktop) {
    return (
      <div className="relative size-full overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          <Panel
            minSize={20}
            maxSize={45}
            defaultSize={25}
            className={cn("z-10 bg-background", !leftHandle.isDragging && "transition-[flex]")}
            onResize={leftSetSize}
          >
            <LeftSidebar />
          </Panel>
          <PanelResizeHandle
            isDragging={leftHandle.isDragging}
            onDragging={leftHandle.setDragging}
          />
          <Panel className="flex flex-col">
            <EditorContent />
          </Panel>
          <PanelResizeHandle
            isDragging={rightHandle.isDragging}
            onDragging={rightHandle.setDragging}
          />
          <Panel
            minSize={20}
            maxSize={45}
            defaultSize={25}
            className={cn("z-10 bg-background", !rightHandle.isDragging && "transition-[flex]")}
            onResize={rightSetSize}
          >
            <RightSidebar />
          </Panel>
        </PanelGroup>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <Sheet open={sheet.left.open} onOpenChange={sheet.left.setOpen}>
        <VisuallyHidden>
          <SheetHeader>
            <SheetTitle />
            <SheetDescription />
          </SheetHeader>
        </VisuallyHidden>

        <SheetContent
          side="left"
          showClose={false}
          className="top-16 p-0 sm:max-w-xl"
          onOpenAutoFocus={onOpenAutoFocus}
        >
          <LeftSidebar />
        </SheetContent>
      </Sheet>

      <EditorContent />

      <Sheet open={sheet.right.open} onOpenChange={sheet.right.setOpen}>
        <VisuallyHidden>
          <SheetHeader>
            <SheetTitle />
            <SheetDescription />
          </SheetHeader>
        </VisuallyHidden>

        <SheetContent
          side="right"
          showClose={false}
          className="top-16 p-0 sm:max-w-xl"
          onOpenAutoFocus={onOpenAutoFocus}
        >
          <RightSidebar />
        </SheetContent>
      </Sheet>
    </div>
  );
};