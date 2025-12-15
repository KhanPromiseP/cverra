import { t } from "@lingui/macro";
import {
  CopySimple,
  FolderOpen,
  Lock,
  LockOpen,
  PencilSimple,
  TrashSimple,
  Globe,
  Translate,
  CheckCircle,
  CircleNotch,
  ArrowSquareOut,
  DotsThreeVertical,
} from "@phosphor-icons/react";
import type { ResumeDto } from "@reactive-resume/dto";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Badge,
  // Tooltip,
  Separator,
} from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router";

import { useDialog } from "@/client/stores/dialog";
import { useSaveTranslation } from "@/client/hooks/use-save-translation";
import { useToast } from "@/client/hooks/use-toast";
import { useResumeTranslation } from "@/client/hooks/use-resume-translation";
import * as Tooltip from "@radix-ui/react-tooltip";

import { BaseCard } from "./base-card";

type Props = {
  resume: ResumeDto;
};

export const ResumeCard = ({ resume }: Props) => {
  const navigate = useNavigate();
  const { open } = useDialog<ResumeDto>("resume");
  const { open: lockOpen } = useDialog<ResumeDto>("lock");
  const { toast } = useToast();
  
  const [translationDialogOpen, setTranslationDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("es");
  const [customTitle, setCustomTitle] = useState("");
  const [translationComplete, setTranslationComplete] = useState(false);
  const [newTranslatedResumeId, setNewTranslatedResumeId] = useState<string | null>(null);
  
  const { availableLanguages, isLoadingLanguages } = useResumeTranslation();
  const { saveTranslation, isSaving } = useSaveTranslation({
    resumeId: resume.id,
    onSuccess: (data) => {
      setTranslationComplete(true);
      setNewTranslatedResumeId(data.translatedResume.id);
      
      // Show success in dialog first
      setTimeout(() => {
        toast({
          title: `Translation Complete!`,
          description: `Your resume has been translated successfully.`,
          variant: "success",
        });
      }, 500);
    },
  });

  const template = resume.data?.metadata?.template || "modern";
  const lastUpdated = dayjs().to(resume.updatedAt);
  
  // Safe metadata access - FIXED (check both locations)
  const resumeMetadata = resume.data?.metadata as any;
  const isTranslation = resumeMetadata?.isTranslation || resumeMetadata?.translatedFrom || 
                        (resume as any).metadata?.isTranslation; // Also check root metadata

  const onOpen = () => {
    void navigate(`/builder/${resume.id}`);
  };

  const onUpdate = () => {
    open("update", { id: "resume", item: resume });
  };

  const onDuplicate = () => {
    open("duplicate", { id: "resume", item: resume });
  };

  const onLockChange = () => {
    lockOpen(resume.locked ? "update" : "create", { id: "lock", item: resume });
  };

  const onDelete = () => {
    open("delete", { id: "resume", item: resume });
  };

  const onTranslate = () => {
    setTranslationDialogOpen(true);
    setTranslationComplete(false);
    setNewTranslatedResumeId(null);
    setCustomTitle(`${resume.title} (${selectedLanguage.toUpperCase()})`);
  };

  const handleStartTranslation = async () => {
    if (!customTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the translated resume",
        variant: "error",
      });
      return;
    }

    try {
      await saveTranslation(selectedLanguage, customTitle);
    } catch (error) {
      // Error handled in hook
    }
  };

  const openTranslatedResume = () => {
    if (newTranslatedResumeId) {
      navigate(`/builder/${newTranslatedResumeId}`);
      setTranslationDialogOpen(false);
    }
  };

  const closeDialog = () => {
    setTranslationDialogOpen(false);
    setTranslationComplete(false);
    setNewTranslatedResumeId(null);
  };

  // Sort languages for dropdown
  const sortedLanguages = [...availableLanguages]
    .filter(lang => !lang.isOriginal)
    .sort((a, b) => {
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      return a.name.localeCompare(b.name);
    });

  return (
    <>
      <div className="relative group">
        {/* Main Card - Clickable for opening resume */}
        <BaseCard 
          className="cursor-pointer space-y-0 relative overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/10"
          onClick={onOpen}
        >
          <AnimatePresence>
            {resume.locked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-20"
              >
                <Lock size={42} className="text-muted-foreground" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Translation Badge Overlay - MADE MORE VISIBLE */}
          {isTranslation && (
            <div className="absolute top-60 left-3 z-30">
              <Badge 
                variant="outline" 
                className="bg-emerald-500/20 backdrop-blur-sm border-emerald-400 text-emerald-700 dark:text-gray-900 text-xs font-medium shadow-sm"
              >
                <Globe size={10} className="mr-1" />
                {t`Translated`}
              </Badge>
            </div>
          )}

           {!isTranslation && (
            <div className="absolute top-60 left-3 z-30">
              <Badge 
                variant="outline" 
                className="bg-blue-500/20 backdrop-blur-sm border-blue-400 text-emerald-700 dark:text-gray-900 text-xs font-medium shadow-sm"
              >
                <Globe size={10} className="mr-1" />
                {t`Original`}
              </Badge>
            </div>
          )}

          {/* Action Button Overlay - Single button for dropdown */}
          <div className="absolute top-60 right-3 z-30">
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Tooltip.Provider>
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 bg-background backdrop-blur-sm hover:bg-background border border-gray-400 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <DotsThreeVertical size={16} className="text-bold" />
                        </Button>
                      </DropdownMenuTrigger>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="bg-gray-900 text-white px-2 py-1 rounded text-xs shadow-lg z-[100]"
                        sideOffset={5}
                      >
                        Manage resume
                        <Tooltip.Arrow className="fill-gray-900" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                align="end" 
                className="w-56 p-2 rounded-xl shadow-xl border border-border dark:border-border bg-background dark:bg-background z-40"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1.5">
                  <p className="text-xs text-center font-medium text-muted-foreground">Quick Actions</p>
                </div>
                
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen();
                  }}
                  className="px-3 py-2.5 rounded-lg cursor-pointer focus:bg-accent focus:text-accent-foreground hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-accent-foreground transition-colors duration-200"
                >
                  <FolderOpen size={16} className="mr-3 text-primary" />
                  <span className="font-medium">{t`Open`}</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate();
                  }}
                  className="px-3 py-2.5 rounded-lg cursor-pointer focus:bg-accent focus:text-accent-foreground hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-accent-foreground transition-colors duration-200"
                >
                  <PencilSimple size={16} className="mr-3 text-blue-500" />
                  <span className="font-medium">{t`Rename`}</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                  className="px-3 py-2.5 rounded-lg cursor-pointer focus:bg-accent focus:text-accent-foreground hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-accent-foreground transition-colors duration-200"
                >
                  <CopySimple size={16} className="mr-3 text-green-500" />
                  <span className="font-medium">{t`Duplicate`}</span>
                </DropdownMenuItem>

                {/* Translate Option with special styling */}
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onTranslate();
                  }}
                  className="px-3 py-2.5 rounded-lg cursor-pointer focus:bg-accent focus:text-accent-foreground hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-accent-foreground transition-colors duration-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20"
                >
                  <Translate size={16} className="mr-3 text-purple-500 dark:text-purple-400" />
                  <div className="flex items-center justify-between flex-1">
                    <span className="font-medium">{t`Translate`}</span>
                    <Badge variant="outline" className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      AI
                    </Badge>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2 bg-border" />
                
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onLockChange();
                  }}
                  className="px-3 py-2.5 rounded-lg cursor-pointer focus:bg-accent focus:text-accent-foreground hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-accent-foreground transition-colors duration-200"
                >
                  {resume.locked ? (
                    <>
                      <LockOpen size={16} className="mr-3 text-amber-500" />
                      <span className="font-medium">{t`Unlock`}</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} className="mr-3 text-amber-500" />
                      <span className="font-medium">{t`Lock`}</span>
                    </>
                  )}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="my-2 bg-border" />
                
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="px-3 py-2.5 rounded-lg cursor-pointer focus:bg-accent focus:text-accent-foreground hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors duration-200 text-error"
                >
                  <TrashSimple size={16} className="mr-3" />
                  <span className="font-medium">{t`Delete`}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Card Content Overlay - Improved for both themes */}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end p-4 pt-16",
              "bg-gradient-to-t from-background/95 via-background/80 to-transparent",
              "dark:from-background/95 dark:via-background/90 dark:to-transparent"
            )}
          >
            <div className="space-y-2">
              <h4 className="line-clamp-2 font-semibold text-foreground dark:text-foreground text-sm leading-tight">
                {resume.title}
              </h4>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  {t`Updated ${lastUpdated}`}
                </p>
                <Badge 
                  variant="ghost" 
                  className="text-sm px-2 py-0.5 bg-primary/50 dark:bg-primary/20 text-white dark:text-white"
                >
                  {template}
                </Badge>
              </div>
            </div>
          </div>

          {/* Template Image */}
          <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
            <img
              src={`/templates/jpg/${template}.jpg`}
              alt={template}
              className={cn(
                "w-full h-full object-cover transition-all duration-500",
                "group-hover:scale-110 group-hover:brightness-110",
                "dark:opacity-90 dark:group-hover:opacity-100",
                resume.locked && "opacity-40"
              )}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/templates/jpg/modern.jpg';
              }}
            />
            
            {/* Grid overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent dark:from-background/30" />
            
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300" />
          </div>
             
        </BaseCard>
      </div>

      {/* Translation Dialog with improved styling */}
      <Dialog open={translationDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-background dark:bg-background shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30">
                <Translate size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground dark:text-foreground">
                  {translationComplete ? "Translation Complete!" : "Translate Resume"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground dark:text-muted-foreground">
                  {translationComplete 
                    ? "Your resume has been successfully translated."
                    : "Select a language and translate your resume."
                  }
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Separator className="my-2 bg-border dark:bg-border" />

          {!translationComplete ? (
            <>
              {/* Language Selection */}
              <div className="space-y-5 py-4">
                <div className="space-y-3">
                  <Label htmlFor="language" className="text-sm font-medium text-foreground dark:text-foreground">
                    Target Language
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                      <Globe size={18} className="text-muted-foreground" />
                    </div>
                    <select
                      id="language"
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full h-12 pl-10 pr-10 rounded-xl border-2 border-input bg-background dark:bg-background text-foreground dark:text-foreground text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary transition-all appearance-none"
                      disabled={isSaving}
                    >
                      <option value="" disabled>Select a language</option>
                      {sortedLanguages.map((lang) => (
                        <option 
                          key={lang.code} 
                          value={lang.code}
                          className="py-2 dark:bg-background"
                        >
                          {lang.flag} {lang.name} ({lang.nativeName})
                          {lang.available && " ✓"}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose the language you want to translate your resume to
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="title" className="text-sm font-medium text-foreground dark:text-foreground">
                    Translated Resume Title
                  </Label>
                  <div className="relative">
                    <Input
                      id="title"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g., My Resume (Spanish)"
                      className="h-12 pl-4 pr-4 rounded-xl border-2 border-input focus:border-primary transition-all"
                      disabled={isSaving}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will be saved as a new resume in your workspace
                  </p>
                </div>

                {/* Features Card */}
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                      <Globe size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">AI Translation Features</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                          <CheckCircle size={14} className="text-green-500 dark:text-green-400 flex-shrink-0" />
                          <span>Preserves all formatting and structure</span>
                        </li>
                        <li className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                          <CheckCircle size={14} className="text-green-500 dark:text-green-400 flex-shrink-0" />
                          <span>Professional tone and cultural adaptation</span>
                        </li>
                        <li className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                          <CheckCircle size={14} className="text-green-500 dark:text-green-400 flex-shrink-0" />
                          <span>Saves as a new resume for easy editing</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-2 bg-border dark:bg-border" />

              <DialogFooter className="flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={closeDialog}
                  disabled={isSaving}
                  className="flex-1 h-12 rounded-xl border-2 hover:bg-accent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartTranslation}
                  disabled={isSaving || !customTitle.trim()}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 gap-3 shadow-lg hover:shadow-xl transition-all"
                >
                  {isSaving ? (
                    <>
                      <CircleNotch className="h-5 w-5 animate-spin" />
                      <span className="font-semibold">Translating...</span>
                    </>
                  ) : (
                    <>
                      <Translate size={18} />
                      <span className="font-semibold">Start Translation</span>
                    </>
                  )}
                </Button>
              </DialogFooter>

              {isSaving && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-background">
                      <CircleNotch size={20} className="animate-spin text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">AI is translating your resume...</p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        This usually takes 15-30 seconds. Please don't close this dialog.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Success View */}
              <div className="space-y-5 py-4">
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-6 text-center border border-emerald-100 dark:border-emerald-800/30">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                      <CheckCircle size={36} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-300 mb-3">
                      Translation Successful! 
                    </h3>
                    <p className="text-sm text-emerald-800 dark:text-emerald-400 mb-6">
                      Your resume has been translated to{" "}
                      <span className="font-bold">
                        {availableLanguages.find(l => l.code === selectedLanguage)?.name || selectedLanguage.toUpperCase()}
                      </span>{" "}
                      and saved as a new resume.
                    </p>
                    
                    <div className="space-y-3 w-full max-w-xs">
                      <Button
                        onClick={openTranslatedResume}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 gap-3 shadow-lg"
                        size="lg"
                      >
                        <FolderOpen size={20} />
                        <span className="font-semibold">Open Translated Resume</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => navigate('/dashboard')}
                        className="w-full h-12 rounded-xl gap-3 border-2"
                      >
                        <Globe size={18} />
                        <span className="font-medium">View All Resumes</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Next Steps Card */}
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                      <CheckCircle size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">Next Steps</h4>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-start gap-2 text-blue-700 dark:text-blue-400">
                          <div className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5 flex-shrink-0"></div>
                          <span>Review the translation for accuracy and cultural relevance</span>
                        </li>
                        <li className="flex items-start gap-2 text-blue-700 dark:text-blue-400">
                          <div className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5 flex-shrink-0"></div>
                          <span>Customize any sections that need personal adjustment</span>
                        </li>
                        <li className="flex items-start gap-2 text-blue-700 dark:text-blue-400">
                          <div className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5 flex-shrink-0"></div>
                          <span>Export or share your translated resume for international applications</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-2 bg-border dark:bg-border" />

              <DialogFooter className="gap-3">
                <Button
                  variant="outline"
                  onClick={closeDialog}
                  className="flex-1 h-12 rounded-xl border-2"
                >
                  Close
                </Button>
                <Button
                  onClick={openTranslatedResume}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 gap-3"
                >
                  <FolderOpen size={18} />
                  <span className="font-semibold">Open Resume</span>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};