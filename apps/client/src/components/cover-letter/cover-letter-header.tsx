// client/components/cover-letter/cover-letter-header.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  EyeOff,
  Save
} from 'lucide-react'; // These from lucide-react
import { 
  House, 
  Lock, 
  SidebarSimple, 
  PencilSimple,
  FloppyDisk,
  Export
} from "@phosphor-icons/react"; // These from phosphor
import { Button, Tooltip } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { toast } from 'sonner';
import { Link } from "react-router";

import { useCoverLetterStore } from '../../../stores/cover-letter';
import { useAuthStore } from '@/client/stores/auth';
import { useWallet } from '@/client/hooks/useWallet';
import { LocaleSwitch } from "@/client/components/locale-switch";
import { ThemeSwitch } from "@/client/components/theme-switch";

import { CoinConfirmPopover } from '../modals/coin-confirm-modal';

interface CoverLetterHeaderProps {
  previewMode: boolean;
  setPreviewMode: (mode: boolean) => void;
  manualSaving: boolean;
  isExporting: boolean;
  exportCost: number;
  handleManualSave: () => void;
  handleExportPDF: () => void;
  showCoinPopover: boolean;
  setShowCoinPopover: (show: boolean) => void;
  onToggleLeftSidebar?: () => void;
  onToggleRightSidebar?: () => void;
  isMobile?: boolean;
  leftSidebarOpen?: boolean;
  rightSidebarOpen?: boolean;
  locked?: boolean;
}

export const CoverLetterHeader = ({
  previewMode,
  setPreviewMode,
  manualSaving,
  isExporting,
  exportCost,
  handleManualSave,
  handleExportPDF,
  showCoinPopover,
  setShowCoinPopover,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  isMobile = false,
  leftSidebarOpen = false,
  rightSidebarOpen = false,
  locked = false
}: CoverLetterHeaderProps) => {
  const navigate = useNavigate();
  const { coverLetter } = useCoverLetterStore();
  const { user } = useAuthStore();
  const { balance } = useWallet(user?.id || '');
  
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const [title, setTitle] = useState(coverLetter?.title || '');

  // Update title when coverLetter changes
  useEffect(() => {
    if (coverLetter?.title) {
      setTitle(coverLetter.title);
    }
  }, [coverLetter?.title]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (coverLetter) {
      // This will trigger the auto-save via the parent component
    }
  };

  const handleBuyCoins = (goSubscription = false) => {
    setShowCoinPopover(false);
    if (goSubscription) {
      navigate("/dashboard/pricing");
    }
  };

  const confirmExportPDF = async () => {
    if (!coverLetter) return;
    handleExportPDF();
  };

  // Truncate title for mobile
  const getDisplayTitle = () => {
    if (!isMobile) return title;
    
    if (title.length > 20) {
      return `${title.substring(0, 18)}...`;
    }
    return title;
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
            {isMobile && onToggleLeftSidebar && (
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "flex lg:hidden h-10 w-10",
                  isMobile && "min-w-10"
                )}
                onClick={onToggleLeftSidebar}
              >
                <SidebarSimple size={isMobile ? 20 : 22} />
              </Button>
            )}

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
            {isMobile && onToggleRightSidebar && (
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "flex lg:hidden h-10 w-10",
                  isMobile && "min-w-10"
                )}
                onClick={onToggleRightSidebar}
              >
                <SidebarSimple className="-scale-x-100" size={isMobile ? 20 : 22} />
              </Button>
            )}
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
        userId={user?.id}
      />

      {/* Spacer for fixed header and status bar */}
      <div className="h-28"></div>
    </>
  );
};