// client/components/modals/ai-resume-upload-modal.tsx
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@reactive-resume/ui";
import {
  Upload,
  FileText,
  FilePdf,
  FileDoc,
  Sparkle,
  X,
  ClipboardText,
  Coins,
  CheckCircle,
  MagicWand,
  ArrowRight,
} from "@phosphor-icons/react";
import { Loader2 } from 'lucide-react';
import { t, Trans } from "@lingui/macro";

import { Button } from "@reactive-resume/ui";
import { useToast } from "@/client/hooks/use-toast";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/client/stores/auth";
import { useWallet } from "@/client/hooks/useWallet";
import { CoinConfirmPopover } from "@/client/components/modals/coin-confirm-modal";

interface AIResumeUploadModalProps {
  open: boolean;
  onClose: () => void;
}

export const AIResumeUploadModal = ({
  open,
  onClose,
}: AIResumeUploadModalProps) => {
  const [activeTab, setActiveTab] = useState<'text' | 'pdf' | 'doc'>('text');
  const [textContent, setTextContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(30);
  const [showCoinPopover, setShowCoinPopover] = useState(false);
  const [enhanceWithAI, setEnhanceWithAI] = useState(true);
  const [includeSuggestions, setIncludeSuggestions] = useState(true);
  const [resumeTitle, setResumeTitle] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processButtonRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { balance, canAfford } = useWallet(user?.id || '');

  const handleTextPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTextContent(text);
      
      // Update estimated cost based on text length
      const newCost = calculateCost(text.length);
      setEstimatedCost(newCost);
      
      toast({
        title: t`Text pasted!`,
        description: t`Text analysis complete. Ready for AI processing.`,
      });
    } catch (error) {
      toast({
        title: t`Error`,
        description: t`Could not access clipboard`,
        variant: "error",
      });
    }
  };

  const calculateCost = (textLength: number): number => {
    let cost = 30; // Base cost
    
    // Source type costs
    // if (activeTab === 'pdf') cost += 10;
    // if (activeTab === 'doc') cost += 10;
    
    // Text length adjustment
    // if (textLength > 5000) cost += 5;
    // if (textLength > 10000) cost += 10;
    
    // Enhancement options
    // if (enhanceWithAI) cost += 25;
    // if (includeSuggestions) cost += 15;
    
    return cost;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Preview file content for cost estimation
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const textLength = content.length;
      const newCost = calculateCost(textLength);
      setEstimatedCost(newCost);
      
      toast({
        title: t`File loaded!`,
        description: t`${file.name} ready for AI processing`,
      });
    };
    
    if (activeTab === 'pdf' || activeTab === 'doc') {
      reader.readAsText(file.slice(0, 5000)); // Read first 5KB for estimation
    }
  };

  const handleProcessWithAI = async () => {
    if (!user) {
      toast({
        title: t`Authentication Required`,
        description: t`Please sign in to use AI Resume Builder`,
        variant: "error",
      });
      return;
    }

    // Check if user can afford
    const affordable = await canAfford(estimatedCost);
    
    if (!affordable) {
      setShowCoinPopover(true);
      return;
    }

    await startAIProcessing();
  };

  const startAIProcessing = async () => {
  setIsProcessing(true);

  try {
    const token = localStorage.getItem('token');
    const endpoint = '/api/resume/ai-builder/build';
    
    let payload;
    let headers = {
      'Authorization': `Bearer ${token}`,
    };

    if (activeTab === 'text') {
      // Send as JSON
      payload = JSON.stringify({
        source: 'text',
        sourceData: textContent,
        title: resumeTitle || t`AI Generated Resume`,
        // enhanceWithAI,
        // includeSuggestions,
      });
      headers['Content-Type'] = 'application/json';
    } else {
      // For files, use FormData
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        throw new Error(t`Please select a file`);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('source', activeTab); // 'pdf' or 'doc'
      formData.append('title', resumeTitle || t`AI Generated Resume`);
      // formData.append('enhanceWithAI', enhanceWithAI.toString());
      // formData.append('includeSuggestions', includeSuggestions.toString());
      
      payload = formData;
      // Don't set Content-Type for FormData
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: payload,
    });

    const data = await response.json();

    if (data.success) {
      toast({
        title: t`AI Resume Created!`,
        description: t`Your resume has been built and is ready to edit`,
        variant: "success",
      });

      // Always use redirectTo if provided, otherwise use resumeId
      const redirectPath = data.redirectTo || `/builder/${data.resumeId || data.resume?.id}`;
      navigate(redirectPath);
      
      onClose();
    } else {
      throw new Error(data.error || data.message || t`AI processing failed`);
    }
  } catch (error) {
    console.error('AI processing error:', error);
    
    if (error instanceof Error) {
      toast({
        title: t`AI Processing Failed`,
        description: error.message || t`Please try again`,
        variant: "error",
      });
    } else {
      toast({
        title: t`AI Processing Failed`,
        description: t`An unknown error occurred`,
        variant: "error",
      });
    }
    
    setIsProcessing(false);
  }
};

  const confirmAIProcessing = async () => {
    try {
      const affordable = await canAfford(estimatedCost);

      if (!affordable) {
        toast({
          title: t`Insufficient Coins`,
          description: t`You need ${estimatedCost} coins for AI resume building`,
          variant: "error",
        });
        setShowCoinPopover(false);
        return;
      }

      await startAIProcessing();
      setShowCoinPopover(false);

    } catch (error) {
      toast({
        title: t`Processing Failed`,
        description: t`Failed to start AI processing`,
        variant: "error",
      });
      setShowCoinPopover(false);
    }
  };

  const handleBuyCoins = (goSubscription = false) => {
    setShowCoinPopover(false);
    if (goSubscription) {
      navigate("/dashboard/pricing");
    } else {
      navigate(`/dashboard/coins?needed=${estimatedCost}`);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkle className="text-purple-500" />
              <Trans>AI Resume Builder</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans>
                Upload your information as pdf/doc or paste text and build, editable version for you
              </Trans>
            </DialogDescription>
          </DialogHeader>

          {/* User Balance */}
          {user && (
            <div className="mb-2 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                    <Coins size={16} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                      <Trans>Your Balance</Trans>
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      <Trans>Available coins for In wallet</Trans>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{balance}</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    <Trans>coins</Trans>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
           <Button
              variant={activeTab === 'text' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('text')}
              className="flex-1 gap-2"
            >
              <ClipboardText size={16} />
              <Trans>Paste Text</Trans>
            </Button>
            <Button
              variant={activeTab === 'pdf' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('pdf')}
              className="flex-1 gap-2"
            >
              <FilePdf size={16} />
              <Trans>PDF</Trans>
            </Button>
            <Button
              variant={activeTab === 'doc' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('doc')}
              className="flex-1 gap-2"
            >
              <FileDoc size={16} />
              <Trans>DOC</Trans>
            </Button>
          </div>

          {/* Content based on active tab */}
          <div className="space-y-4">
            {activeTab === 'text' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTextPaste}
                    className="gap-2"
                  >
                    <ClipboardText size={16} />
                    <Trans>Paste from Clipboard</Trans>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setTextContent('');
                      setEstimatedCost(30);
                    }}
                    className="gap-2"
                  >
                    <X size={16} />
                    <Trans>Clear</Trans>
                  </Button>
                </div>
                <textarea
                  value={textContent}
                  onChange={(e) => {
                    setTextContent(e.target.value);
                    setEstimatedCost(calculateCost(e.target.value.length));
                  }}
                  placeholder={t`Paste your resume text here, or type it manually...`}
                  className="w-full h-48 p-3 border rounded-md resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  <Trans>
                    Transform your existing documents or text into a polished, customizable resume in seconds.
                  </Trans>
                </p>
              </div>
            )}

            {(activeTab === 'pdf' || activeTab === 'doc') && (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="mb-4">
                  <Trans>Upload your {activeTab.toUpperCase()} resume</Trans>
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept={activeTab === 'pdf' ? '.pdf' : '.doc,.docx'}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="gap-2 mb-2"
                >
                  <Trans>Choose File</Trans>
                </Button>
                <p className="text-xs text-muted-foreground">
                  <Trans>
                    Supported: {activeTab === 'pdf' ? 'PDF files' : 'Word documents'}
                  </Trans>
                </p>
              </div>
            )}

            {/* Resume Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                <Trans>Resume Title</Trans>
              </label>
              <input
                type="text"
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                placeholder={t`e.g., John Doe - Software Engineer Resume`}
                className="w-full p-3 border rounded-md"
              />
              <p className="text-xs text-muted-foreground">
                <Trans>This will be the name of your new resume</Trans>
              </p>
            </div>

            {/* AI Enhancement Options */}
            {/* <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MagicWand size={18} className="text-purple-500" />
                  <span className="font-medium">
                    <Trans>AI Enhancement</Trans>
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enhanceWithAI}
                    onChange={(e) => {
                      setEnhanceWithAI(e.target.checked);
                      setEstimatedCost(calculateCost(textContent.length));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                <Trans>
                  Enhance your resume with professional language, action verbs, and quantifiable achievements (+5 coins)
                </Trans>
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-blue-500" />
                  <span className="font-medium">
                    <Trans>AI Suggestions</Trans>
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSuggestions}
                    onChange={(e) => {
                      setIncludeSuggestions(e.target.checked);
                      setEstimatedCost(calculateCost(textContent.length));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                <Trans>
                  Get AI suggestions for improving your resume content and structure (+5 coins)
                </Trans>
              </p>
            </div> */}

            {/* Cost Summary */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Coins size={20} className="text-yellow-600" />
                  <span className="font-semibold">
                    <Trans>Cost</Trans>
                  </span>
                </div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {estimatedCost} <span className="text-sm">
                    <Trans>coins</Trans>
                  </span>
                </div>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {/* <div className="flex justify-between">
                  <span>
                    <Trans>Base AI Processing</Trans>
                  </span>
                  <span>30 coins</span>
                </div>
                {activeTab === 'pdf' && (
                  <div className="flex justify-between">
                    <span>
                      <Trans>PDF Processing</Trans>
                    </span>
                    <span>+10 coins</span>
                  </div>
                )}
                {activeTab === 'doc' && (
                  <div className="flex justify-between">
                    <span>
                      <Trans>DOC Processing</Trans>
                    </span>
                    <span>+10 coins</span>
                  </div>
                )} */}
                {/* {enhanceWithAI && (
                  <div className="flex justify-between">
                    <span>
                      <Trans>AI Enhancement</Trans>
                    </span>
                    <span>+25 coins</span>
                  </div>
                )}
                {includeSuggestions && (
                  <div className="flex justify-between">
                    <span>
                      <Trans>AI Suggestions</Trans>
                    </span>
                    <span>+15 coins</span>
                  </div>
                )} */}
                {/* {textContent.length > 5000 && (
                  <div className="flex justify-between">
                    <span>
                      <Trans>Length Adjustment</Trans>
                    </span>
                    <span>+{textContent.length > 10000 ? 15 : 5} coins</span>
                  </div>
                )} */}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              <Trans>Cancel</Trans>
            </Button>
            <Button
              ref={processButtonRef}
              onClick={handleProcessWithAI}
              disabled={isProcessing || (!textContent.trim() && activeTab === 'text')}
              className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <Trans>Building...</Trans>
                </>
              ) : (
                <>
                  <Sparkle size={18} />
                  <Trans>Build with AI</Trans>
                </>
              )}
            </Button>
          </DialogFooter>

          {/* Processing Info */}
          {isProcessing && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium">
                    <Trans>AI is building your resume...</Trans>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <Trans>
                      This usually takes 15-30 seconds. You'll be redirected to the editor when complete.
                    </Trans>
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Coin Confirmation Popover */}
      <CoinConfirmPopover
        open={showCoinPopover}
        onClose={() => setShowCoinPopover(false)}
        required={estimatedCost}
        balance={balance}
        onConfirm={confirmAIProcessing}
        onBuyCoins={handleBuyCoins}
        title={t`AI Resume Builder`}
        description={t`Build a complete resume from your ${activeTab.toUpperCase()} using advanced AI. The resume will be created and opened in the editor for you to review and edit.`}
        actionType="ai_builder"
        triggerRef={processButtonRef}
        userId={user?.id}
        metadata={{
          sourceType: activeTab,
          textLength: textContent.length,
          enhanceWithAI,
          includeSuggestions,
          costBreakdown: t`Total: ${estimatedCost} coins`,
        }}
      />
    </>
  );
};