// client/components/cover-letter/editor.tsx
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
    console.log('Coin popover state:', showCoinPopover);
    console.log('User balance:', balance);
  }, [showCoinPopover, balance]);

  const { triggerSave } = useAutoSave({
    data: coverLetter,
    onSave: async (data) => {
      if (!id || !data || manualSaving) return;
      
      try {
        // Validate content before saving
        if (!data.content?.blocks || !Array.isArray(data.content.blocks)) {
          console.error('Invalid content structure for auto-save:', data.content);
          return;
        }

        console.log('Auto-saving content with border settings:', data.structure?.borderStyle);
        
        await coverLetterService.update(id, { 
          content: {
            ...data.content,
            structure: data.structure // Include structure
          },
          style: data.style,
          title: data.title,
          layout: data.layout,
          structure: data.structure // Also include at root level
        });
        console.log('Auto-saved successfully with content and border settings');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    },
    delay: 2000
  });

  // Enhanced content change handler
  const handleContentChange = useCallback((newContent: any) => {
    if (!coverLetter) return;
    
    console.log('Content changed - blocks:', newContent.blocks?.length);

    const updatedCoverLetter = {
      ...coverLetter,
      content: {
        ...newContent,
        lastSaved: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };

    setCoverLetter(updatedCoverLetter);
    triggerSave();
  }, [coverLetter, setCoverLetter, triggerSave]);

  const handleManualSave = async () => {
    if (!coverLetter) {
      toast.error('No cover letter to save');
      return;
    }

    setManualSaving(true);
    try {
      // Validate content structure
      if (!coverLetter.content?.blocks || !Array.isArray(coverLetter.content.blocks)) {
        console.error('Invalid content structure:', coverLetter.content);
        toast.error('Invalid content structure - cannot save');
        return;
      }

      console.log('Manual save - saving with border settings:', coverLetter.structure?.borderStyle);
      
      let savedCoverLetter;

      // Ensure borderStyle is properly included in the structure
      const saveData = {
        title: coverLetter.title,
        content: {
          ...coverLetter.content,
          // Make sure structure includes borderStyle
          structure: coverLetter.structure
        },
        style: coverLetter.style,
        layout: coverLetter.layout,
        structure: coverLetter.structure, // This should include borderStyle
        userData: {
          name: user?.name || '',
          email: user?.email || '',
          skills: [],
          experience: [],
          achievements: []
        },
        jobData: {
          position: '',
          company: ''
        }
      };

      if (coverLetter.id) {
        savedCoverLetter = await coverLetterService.update(coverLetter.id, saveData);
      } else {
        savedCoverLetter = await coverLetterService.create(saveData);
      }

      // Fix the response handling
      let coverLetterData;
      if ('coverLetter' in savedCoverLetter) {
        coverLetterData = savedCoverLetter.coverLetter;
      } else {
        coverLetterData = savedCoverLetter;
      }

      if (coverLetterData) {
        setCoverLetter(coverLetterData);
        
        // Navigate for new cover letters
        if (!coverLetter.id && coverLetterData.id) {
          navigate(`/builder/cover-letter/${coverLetterData.id}/edit`, { replace: true });
        }
      }

      toast.success('Cover letter saved successfully! Border settings preserved.');
      
    } catch (error) {
      console.error('Failed to save cover letter:', error);
      toast.error('Failed to save cover letter content');
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

  const executePDFExport = async () => {
    if (!coverLetter || !user) return;

    const transactionId = generateTransactionId();
    let transactionSuccess = false;
    
    setIsExporting(true);

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

      // Step 2: Ensure we're in preview mode for best results
      if (!previewMode) {
        console.log('Switching to preview mode for PDF export...');
        toast.info(
          <div className="space-y-1">
            <div className="font-medium">Switching to Preview Mode</div>
            <div className="text-xs text-blue-600">
              Preparing for high-quality PDF export...
            </div>
          </div>,
          { duration: 2000 }
        );
        
        // Switch to preview mode
        setPreviewMode(true);
        
        // Wait for preview mode to fully render
        // This is crucial for React to update the DOM
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Double-check that preview mode has been applied
        // Look for editing UI elements to confirm we're in preview mode
        await new Promise<void>((resolve) => {
          const checkPreviewMode = () => {
            const hasEditingUI = document.querySelector('.ring-2, .ring-blue-500, [data-drag-handle]');
            if (!hasEditingUI) {
              console.log('Successfully switched to preview mode');
              resolve();
            } else {
              setTimeout(checkPreviewMode, 100);
            }
          };
          checkPreviewMode();
        });
      }

      // Step 3: Verify the cover letter element exists and is ready
      let targetElement = document.querySelector('[data-cover-letter-grid]') as HTMLElement;
      
      // If element not found immediately, try again with a delay
      if (!targetElement) {
        console.log('Element not found immediately, waiting...');
        await new Promise(resolve => setTimeout(resolve, 300));
        targetElement = document.querySelector('[data-cover-letter-grid]') as HTMLElement;
      }
      
      // If still not found, try alternative selectors
      if (!targetElement) {
        console.log('🔍 Trying alternative selectors...');
        const alternativeSelectors = [
          '.react-grid-layout',
          '.cover-letter-container',
          '[class*="grid"]',
          '.grid-layout',
          '.editor-content'
        ];
        
        for (const selector of alternativeSelectors) {
          const element = document.querySelector(selector) as HTMLElement;
          if (element) {
            targetElement = element;
            console.log(`Found element with selector: ${selector}`);
            break;
          }
        }
      }
      
      if (!targetElement) {
        // Provide helpful error message
        if (!previewMode) {
          throw new Error('Please switch to Preview mode first for best PDF results. Click the "Preview" button.');
        } else {
          throw new Error('Could not find cover letter content. Please try refreshing the page.');
        }
      }

      // Step 4: Show loading indicator
      const loadingToast = toast.loading('Generating professional PDF...');

      try {
        // Step 5: Generate PDF with the cover letter data
        // Your exportToPDF function expects the CoverLetter object, not the element
        await exportToPDF(coverLetter);
      } finally {
        // Dismiss loading toast
        toast.dismiss(loadingToast);
      }

      // Step 6: Mark transaction as completed
      await completeTransaction(transactionId, {
        result: 'success',
        coverLetterTitle: coverLetter.title,
        fileSize: 'PDF',
        exportedFromPreview: previewMode,
        exportedAt: new Date().toISOString()
      });

      toast.success(
        <div className="space-y-1">
          <div className="font-medium">
            {previewMode ? 'PDF exported from Preview Mode!' : 'PDF exported successfully!'}
          </div>
          <div className="text-xs text-green-600 flex items-center gap-1">
            <Coins className="w-3 h-3" />
            Used {exportCost} coins • Transaction: {transactionId.slice(-8)}
          </div>
          {previewMode && (
            <div className="text-xs text-blue-600">
              Preview mode ensures perfect formatting in your PDF
            </div>
          )}
        </div>,
        { duration: 10000 }
      );

      setShowCoinPopover(false);

    } catch (error: any) {
      console.error("PDF export failed:", error);
      
      // Step 7: Refund coins if transaction was successful
      if (transactionSuccess) {
        try {
          await refundTransaction(transactionId, error.message || 'PDF export failed');
          await fetchBalance();
          console.log(`Refunded ${exportCost} coins due to PDF export failure`);
          
          // Show refund notification
          toast.info(
            <div className="space-y-1">
              <div className="font-medium">Coins Refunded</div>
              <div className="text-xs text-blue-600 flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {exportCost} coins returned to your balance
              </div>
            </div>,
            { duration: 5000 }
          );
        } catch (refundError) {
          console.error('Failed to refund coins:', refundError);
        }
      }

      // User-friendly error messages
      let errorMessage = 'Failed to export PDF. Please try again.';
      let suggestion = '';
      
      if (error.message?.includes('preview') || error.message?.includes('Preview')) {
        errorMessage = 'Preview mode required';
        suggestion = 'Please switch to Preview mode first by clicking the "Preview" button.';
      } else if (error.message?.includes('cover letter content')) {
        errorMessage = 'Content not found';
        suggestion = 'Please ensure your cover letter has content and try again.';
      } else if (error.message?.includes('network') || error.code === 'ECONNABORTED') {
        errorMessage = 'Network error';
        suggestion = 'Please check your connection and try again.';
      } else if (transactionSuccess) {
        errorMessage = 'PDF generation failed';
        suggestion = 'Please try again or contact support.';
      }

      toast.error(
        <div className="space-y-1">
          <div className="font-medium">{errorMessage}</div>
          {suggestion && (
            <div className="text-xs text-yellow-600">{suggestion}</div>
          )}
          <div className="text-xs text-gray-500 mt-1">
            Error: {error.message || 'Unknown error'}
          </div>
        </div>,
        {
          duration: 20000,
          icon: <XCircle className="w-4 h-4 text-red-500" />,
        }
      );

      setShowCoinPopover(false);
    } finally {
      setIsExporting(false);
    }
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
        toast.error("Cover letter is not loaded");
        setShowCoinPopover(false);
        return;
      }

      // Use the enhanced export function
      await executePDFExport();

    } catch (error) {
      console.error("PDF export preparation failed:", error);
      toast.error("Failed to prepare PDF export");
      setShowCoinPopover(false);
    }
  };

  const handleBuyCoins = (goSubscription = false) => {
    setShowCoinPopover(false);
    if (goSubscription) {
      // Only navigate for subscriptions
      navigate("/dashboard/pricing");
    }
    // For direct coin purchases, the popover handles it internally
    // No navigation needed
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
      toast.error(
        <div className="space-y-1">
          <div className="font-medium">No content to export</div>
          <div className="text-xs">Please add content to your cover letter before exporting.</div>
        </div>
      );
      return;
    }

    // First check if user can afford
    const affordable = await canAfford(exportCost);
    
    if (!affordable) {
      setShowCoinPopover(true);
      return;
    }

    // Check if we need to switch to preview mode
    if (!previewMode) {
      // Ask user to confirm switching to preview mode
      toast.info(
        <div className="space-y-1">
          <div className="font-medium">Switch to Preview Mode?</div>
          <div className="text-xs text-blue-600">
            For best PDF results, we recommend exporting from Preview mode.
          </div>
          <div className="flex gap-2 mt-2">
            <button
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={async () => {
                toast.dismiss();
                await executePDFExport();
              }}
            >
              Switch & Export
            </button>
            <button
              className="text-xs px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              onClick={() => toast.dismiss()}
            >
              Cancel
            </button>
          </div>
        </div>,
        { 
          duration: 10000,
          dismissible: false 
        }
      );
      return;
    }

    // If already in preview mode, proceed directly
    await executePDFExport();
  };

  const handleExportDOCX = async () => {
    if (!coverLetter) return;
    
    try {
      await exportToDOCX(coverLetter);
      toast.success('DOCX exported successfully!');
    } catch (error) {
      console.error('DOCX export failed:', error);
      toast.error('Failed to export DOCX');
    }
  };

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
          <p className="text-gray-600 dark:text-gray-300">Loading cover letter...</p>
        </div>
      </div>
    );
  }

  // Truncate title for mobile
  const getDisplayTitle = () => {
    if (!isMobile) return coverLetter.title;
    
    if (coverLetter.title.length > 20) {
      return `${coverLetter.title.substring(0, 18)}...`;
    }
    return coverLetter.title;
  };

  return (
    <>
      {/* Main Header - Fixed at top */}
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-[60] h-16 bg-secondary-accent/90 backdrop-blur-xl lg:z-20 border-b border-gray-700 shadow-lg",
          isMobile && "px-0"
        )}
      >
        <div className="relative flex h-full items-center justify-between px-3 sm:px-4">
          {/* Left side: Home button + Left toggle */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Left sidebar toggle - Visible on mobile only */}
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "flex lg:hidden h-10 w-10",
                isMobile && "min-w-10"
              )}
              onClick={toggleLeftSidebar}
            >
              <SidebarSimple size={isMobile ? 20 : 22} />
            </Button>

            {/* Home button */}
            <Button 
              asChild 
              size="icon" 
              variant="ghost" 
              className={cn(
                "text-foreground h-10 w-10",
                isMobile && "min-w-10"
              )}
            >
              <Link to="/dashboard/cover-letters">
                <ArrowLeft size={isMobile ? 20 : 22} />
              </Link>
            </Button>
          </div>

          {/* Centered Title Area - Takes available space */}
          <div className="flex-1 flex items-center justify-center min-w-0 px-2 sm:px-4">
            <div className="flex items-center justify-center space-x-2 max-w-full">
              {/* Optional: Edit icon on mobile to indicate edit mode */}
              {isMobile && (
                <PencilSimple size={16} className="text-primary flex-shrink-0" />
              )}
              
              <div className="flex items-center gap-2 max-w-full">
                <h1 className="font-semibold text-sm sm:text-base md:text-lg truncate max-w-[200px] sm:max-w-[300px] md:max-w-none">
                  {getDisplayTitle()}
                </h1>
              </div>
            </div>
          </div>

          {/* Right side: Controls + Right toggle */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Desktop Controls - Original components with responsive hiding */}
            <div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
              {/* Enhanced Save Button */}
              <Button
                onClick={handleManualSave}
                variant="primary"
                size="sm"
                disabled={manualSaving || isExporting}
                className="bg-green-600 hover:bg-green-700 text-white border-green-700"
              >
                {manualSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {manualSaving ? 'Saving...' : 'Save Content'}
              </Button>

              {/* Preview/Edit Toggle */}
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                disabled={isExporting}
                size="sm"
              >
                {previewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {previewMode ? 'Edit' : 'Preview'}
              </Button>

              {/* PDF Button with hover cost tooltip */}
              <div className="relative group">
                <Button 
                  ref={exportButtonRef}
                  onClick={handleExportPDF}
                  variant="outline"
                  disabled={isExporting}
                  size="sm"
                >
                  {isExporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {isExporting ? 'Exporting...' : 'PDF'}
                </Button>
                {/* Tooltip positioned below the button */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 bg-green-600 dark:bg-green-700 text-white dark:text-gray-50 text-xs font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Cost: {exportCost} coins
                  {/* Arrow pointing up to button */}
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-green-600 dark:border-b-green-700"></div>
                </div>
              </div>

              <LocaleSwitch />
              <ThemeSwitch />
            </div>
            
            {/* Mobile Controls - Same components but with wrapper for sizing */}
            <div className="flex sm:hidden items-center gap-1">
              {/* Save Button (Mobile) */}
              <Button
                onClick={handleManualSave}
                variant="ghost"
                size="icon"
                disabled={manualSaving || isExporting}
                className="h-10 w-10"
              >
                {manualSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>

              {/* Preview/Edit Toggle (Mobile) */}
              <Button
                variant="ghost"
                onClick={() => setPreviewMode(!previewMode)}
                disabled={isExporting}
                size="icon"
                className="h-10 w-10"
              >
                {previewMode ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>

              {/* PDF Export Button (Mobile) */}
              <Button 
                ref={exportButtonRef}
                onClick={handleExportPDF}
                variant="ghost"
                disabled={isExporting}
                size="icon"
                className="h-10 w-10"
              >
                {isExporting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>

              <div className="scale-90">
                <LocaleSwitch />
              </div>
              <div className="scale-90">
                <ThemeSwitch />
              </div>
            </div>

            {/* Right sidebar toggle - Visible on mobile only */}
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "flex lg:hidden h-10 w-10",
                isMobile && "min-w-10"
              )}
              onClick={toggleRightSidebar}
            >
              <SidebarSimple className="-scale-x-100" size={isMobile ? 20 : 22} />
            </Button>
          </div>
        </div>

        {/* Optional: Mobile status bar indicator */}
        {isMobile && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50"></div>
        )}
      </div>

      {/* Status Bar - Fixed below header */}
      <div className="fixed top-16 inset-x-0 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 z-40">
        <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
          <div className="flex items-center flex-wrap gap-2 sm:gap-4">
            <span className="truncate max-w-[100px] sm:max-w-none">
              <span className="hidden sm:inline">ID: </span>
              <strong className="font-mono">{coverLetter?.id?.substring(0, 8)}</strong>
            </span>
            <span className="hidden sm:inline">Blocks: <strong>{coverLetter?.content?.blocks?.length || 0}</strong></span>
            <span className="hidden sm:inline">Style: <strong>{coverLetter?.style}</strong></span>
            <span>Coins: <strong>{balance}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            {coverLetter?.updatedAt && (
              <span className="hidden sm:inline">
                Updated: {new Date(coverLetter.updatedAt).toLocaleTimeString()}
              </span>
            )}
            {manualSaving && (
              <span className="flex items-center text-orange-600">
                <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-orange-600 mr-1"></div>
                <span className="hidden sm:inline">Saving...</span>
              </span>
            )}
            {isExporting && (
              <span className="flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-blue-600 mr-1"></div>
                <span className="hidden sm:inline">Exporting...</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Spacer for fixed header and status bar */}
      <div className="h-28"></div>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
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
        title="Export Letter as PDF"
        description="Export your professionally formatted letter as a high-quality PDF document."
        actionType="export"
        triggerRef={exportButtonRef}
        userId={user?.id} // Pass the userId
      />
    </>
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
      console.log('Loaded cover letter data:', {
        hasBorderSettings: !!data.structure?.borderStyle,
        borderSettings: data.structure?.borderStyle,
        structure: data.structure,
        contentStructure: data.content?.structure
      });
      
      // Ensure structure is properly set - use optional chaining
      if (data.content?.structure && !data.structure) {
        // Create a new object with the structure property
        const updatedData = {
          ...data,
          structure: data.content.structure
        };
        setCoverLetter(updatedData);
      } else {
        setCoverLetter(data);
      }
      
      console.log('Loaded cover letter with border settings:', {
        id: data.id,
        blocks: data.content?.blocks?.length,
        borderStyle: data.structure?.borderStyle
      });
      
      // Auto-select first block if available
      if (data.content?.blocks?.length > 0) {
        setSelectedBlock(data.content.blocks[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch cover letter:', error);
      toast.error('Failed to load cover letter');
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
      
      toast.success('Cover letter generated successfully!');
      
      // Navigate to edit mode with the new ID
      navigate(`/builder/cover-letter/${result.coverLetter.id}/edit`, { replace: true });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate cover letter. Please try again.');
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
        <PanelGroup direction="horizontal">
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
          <Panel >
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
    <div className="relative">
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