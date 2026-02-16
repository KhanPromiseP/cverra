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
  Check,
  WarningCircle,
} from "@phosphor-icons/react";
import { Loader2 } from 'lucide-react';
import { t, Trans } from "@lingui/macro";

import { Button } from "@reactive-resume/ui";
import { useToast } from "@/client/hooks/use-toast";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/client/stores/auth";
import { useWallet } from "@/client/hooks/useWallet";
import { CoinConfirmPopover } from "@/client/components/modals/coin-confirm-modal";
import { InstructionManual } from "@/client/components/modals/instruction-manual";

interface AIResumeUploadModalProps {
  open: boolean;
  onClose: () => void;
}

export const AIResumeUploadModal = ({
  open,
  onClose,
}: AIResumeUploadModalProps) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'pdf' | 'doc'>('text');
  const [textContent, setTextContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(30);
  const [showCoinPopover, setShowCoinPopover] = useState(false);
  const [enhanceWithAI, setEnhanceWithAI] = useState(true);
  const [includeSuggestions, setIncludeSuggestions] = useState(true);
  const [resumeTitle, setResumeTitle] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  
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
    return cost;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setFileName('');
    setFileSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
      };

      if (activeTab === 'text') {
        // Send as JSON
        payload = JSON.stringify({
          source: 'text',
          sourceData: textContent,
          title: resumeTitle || t`AI Generated Resume`,
        });
        headers['Content-Type'] = 'application/json';
      } else {
        // For files, use FormData
        const file = uploadedFile;
        if (!file) {
          throw new Error(t`Please select a file`);
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('source', activeTab);
        formData.append('title', resumeTitle || t`AI Generated Resume`);
        
        payload = formData;
        // Don't set Content-Type for FormData, browser will set it with boundary
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

  const getFileIcon = () => {
    if (activeTab === 'pdf') return <FilePdf className="h-10 w-10 text-red-500" />;
    return <FileDoc className="h-10 w-10 text-blue-500" />;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1">
              <Sparkle className="text-purple-500" />
              <Trans>AI Resume Builder</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans>
                Upload your information as pdf/doc or paste text and build, editable version for you.
              </Trans>
              <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                <Trans>Click the yellow button below for detailed instructions.</Trans>
              </span>
            </DialogDescription>
          </DialogHeader>

         <div className="mb-0">
  <Button
    variant="outline"
    onClick={() => setShowInstructions(true)}
    className="w-full py-0.5 px-1 min-h-0 text-xs leading-tight border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
  >
    <WarningCircle size={10} className="mr-1" />
    <Trans>⚠️ READ FIRST: Best Results</Trans>
  </Button>
</div>

          {/* User Balance */}
          {user && (
            <div className="mb-1 p-1 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-xl border border-yellow-200 dark:border-yellow-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/40">
                    <Coins size={12} className="text-yellow-600 dark:text-yellow-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                      <Trans>Your Balance</Trans>
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-300/80">
                      <Trans>Available coins In wallet</Trans>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-yellow-700 dark:text-yellow-200">{balance}</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-300/80">
                    <Trans>coins</Trans>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-2">
           <Button
              variant={activeTab === 'text' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('text')}
              className="flex-1 gap-2"
            >
              <ClipboardText size={16} />
              <Trans>Text</Trans>
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
          <div className="space-y-2">
            {activeTab === 'text' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTextPaste}
                    className="gap-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
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
                    className="gap-2 dark:text-gray-300 dark:hover:bg-gray-800"
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
                  className="w-full h-48 p-2 border rounded-md resize-none 
                    dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 
                    dark:placeholder-gray-500 focus:dark:border-purple-500 
                    focus:dark:ring-1 focus:dark:ring-purple-500"
                />
                <p className="text-xs text-muted-foreground dark:text-gray-400">
                  <Trans>
                    Transform your existing documents or text into a polished, customizable resume in seconds.
                  </Trans>
                </p>
              </div>
            )}

            {(activeTab === 'pdf' || activeTab === 'doc') && (
              <div className={`border-2 border-dashed rounded-lg p-4 text-center 
                ${uploadedFile ? 'border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-300 dark:border-gray-600'}`}>
                {uploadedFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      {getFileIcon()}
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{fileName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{fileSize}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" weight="fill" />
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        size="sm"
                        className="gap-2 dark:border-gray-600 dark:text-gray-200"
                      >
                        <Upload size={14} />
                        <Trans>Change File</Trans>
                      </Button>
                      <Button
                        onClick={removeUploadedFile}
                        variant="ghost"
                        size="sm"
                        className="gap-2 dark:text-gray-300"
                      >
                        <X size={14} />
                        <Trans>Remove</Trans>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
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
                      className="gap-2 mb-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      <Trans>Choose File</Trans>
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <Trans>
                        Supported: {activeTab === 'pdf' ? 'PDF files' : 'Word documents'}
                      </Trans>
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Resume Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-gray-200">
                <Trans>Resume Title</Trans>
              </label>
              <input
                type="text"
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                placeholder={t`e.g., John Doe - Software Engineer Resume`}
                className="w-full p-3 border rounded-md 
                  dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 
                  dark:placeholder-gray-500 focus:dark:border-purple-500 
                  focus:dark:ring-1 focus:dark:ring-purple-500"
              />
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                <Trans>This will be the name of your new resume</Trans>
              </p>
            </div>
            
          </div>
          

         <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 p-1 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Trans>Cancel</Trans>
          </Button>
          <div className="flex-1 flex flex-col gap-1">
            {/* Cost summary inline with button */}
            <div className="flex items-center justify-end gap-1.5 px-1">
              <Coins size={12} className="text-purple-500 dark:text-purple-400" />
              <span className="text-xs text-purple-600 dark:text-purple-300 font-medium">
                {estimatedCost}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                <Trans>coins</Trans>
              </span>
            </div>
            <Button
              ref={processButtonRef}
              onClick={handleProcessWithAI}
              disabled={isProcessing || 
                (activeTab === 'text' && !textContent.trim()) || 
                ((activeTab === 'pdf' || activeTab === 'doc') && !uploadedFile)}
              className="w-full gap-2 p-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 dark:from-purple-700 dark:to-blue-700 dark:hover:from-purple-800 dark:hover:to-blue-800"
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
          </div>
        </DialogFooter>

          {/* Processing Info */}
          {isProcessing && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium dark:text-gray-200">
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
          template: `ai_resume_${activeTab}`, // Use template instead of sourceType
          templateName: `AI Resume from ${activeTab.toUpperCase()}`,
          templateCategory: "ai_generated",
          textLength: textContent.length,
          cost: estimatedCost,
          costBreakdown: t`Total: ${estimatedCost} coins`,
          note: `Enhance with AI: ${enhanceWithAI}, Include suggestions: ${includeSuggestions}`
        }}
      />

      {/* Instruction Manual */}
      <InstructionManual
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </>
  );
};