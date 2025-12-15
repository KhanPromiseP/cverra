// export-section.tsx - Updated with enhanced UI and better notifications
import { t } from "@lingui/macro";
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
import { useState } from "react";
import { useNavigate } from "react-router";

import { usePrintResume } from "@/client/services/resume/print";
import { useResumeStore } from "@/client/stores/resume";
import { useResumeTranslation } from "@/client/hooks/use-resume-translation";
import { useToast } from "@/client/hooks/use-toast";
import { useSaveTranslation } from "@/client/hooks/use-save-translation";

import { SectionIcon } from "../shared/section-icon";

const openInNewTab = (url: string) => {
  const win = window.open(url, "_blank");
  if (win) win.focus();
};

export const ExportSection = () => {
  const { printResume, loading: pdfLoading } = usePrintResume();
  const { resume } = useResumeStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
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
        title: `Translation Successfully Saved!`,
        description: `Your resume has been translated to ${languageName} and is ready to use.`,
        duration: 8000,
        variant: "success",
        action: (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/builder/${data.translatedResume.id}`)}
                className="gap-2 flex-1"
              >
                <Eye size={14} />
                Open Translation
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2 flex-1"
              >
                View Workspace
                <ArrowRight size={14} />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Remember to review the translation to ensure accuracy
            </p>
          </div>
        ),
      });

      // Follow-up review reminder with action button
      setTimeout(() => {
        toast({
          title: "📝 Review Your Translation",
          description: "Please we always advice to review the translated content to ensure maximum accuracy before using it professionally.",
          duration: 10000,
          variant: "info",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/builder/${data.translatedResume.id}`)}
              className="gap-2"
            >
              <Eye size={14} />
              Review Now
            </Button>
          ),
        });
      }, 1500);
    },
  });

  const onJsonExport = () => {
    const filename = `reactive_resume-${resume.id}.json`;
    const resumeJSON = JSON.stringify(resume.data, null, 2);
    saveAs(new Blob([resumeJSON], { type: "application/json" }), filename);
    
    toast({
      title: "JSON Exported",
      description: "Your resume has been exported as JSON",
      variant: "success",
      icon: <FileJs className="h-5 w-5" />,
    });
  };

  const onPdfExport = async () => {
    try {
      const { url } = await printResume({ id: resume.id });
      openInNewTab(url);
      
      toast({
        title: "PDF Generated",
        description: "Your resume PDF is ready to download",
        variant: "success",
        icon: <FilePdf className="h-5 w-5" />,
      });
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "error",
      });
    }
  };

  const handleSaveTranslatedResume = async (language: string) => {
    try {
      setSelectedLanguage(language);
      
      // Get language info for default title
      const langInfo = availableLanguages.find(l => l.code === language);
      const defaultTitle = `${resume.title} (${langInfo?.name || language.toUpperCase()})`;
      setCustomTitle(defaultTitle);
      
      setSaveDialogOpen(true);
    } catch (error) {
      toast({
        title: "Translation Failed",
        description: "Could not start translation process",
        variant: "error",
      });
    }
  };

  const confirmSaveTranslation = async () => {
    try {
      await saveTranslation(selectedLanguage, customTitle);
      setSaveDialogOpen(false);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const openTranslatedResume = (resumeId: string) => {
    navigate(`/builder/${resumeId}`);
  };

  const goToDashboard = () => {
    navigate('/dashboard');
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
              <p className="text-sm text-gray-500">
                Export your resume in different formats and languages
              </p>
            </div>
          </div>
        </header>

        <main className="grid gap-y-4">
          {/* Recently Translated Section - Enhanced */}
          {recentlyTranslated.length > 0 && (
            <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-emerald-900">Recently Translated</h3>
                      <p className="text-xs text-emerald-600">Your latest translation is saved, ready to use</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                    {recentlyTranslated.length} saved
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {recentlyTranslated.map((translation) => (
                    <div 
                      key={translation.id}
                      className="group flex items-center justify-between p-3 bg-white/80 rounded-lg border border-emerald-100 hover:border-emerald-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                          <span className="text-lg">{availableLanguages.find(l => l.code === translation.language)?.flag || '🌐'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{translation.title}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
                              {translation.languageName || translation.language.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500">Just now</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tooltip content="Open translated resume">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openTranslatedResume(translation.id)}
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ArrowSquareOut size={14} />
                          </Button>
                        </Tooltip>
                        <Button
                          size="sm"
                          onClick={() => openTranslatedResume(translation.id)}
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Eye size={14} />
                          Open
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Standard Export Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* PDF Export Card */}
            <Card
              className={cn(
                "h-auto cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-red-300",
                "border-red-100 bg-gradient-to-br from-red-50 to-white",
                pdfLoading && "opacity-75 pointer-events-none"
              )}
              onClick={onPdfExport}
            >
              <CardContent className="p-5">
               
                <div className="flex items-start gap-4">
                
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-100 to-red-200">
                          {pdfLoading ? (
                            <CircleNotch size={24} className="animate-spin text-red-600" />
                          ) : (
                            <FilePdf size={24} className="text-red-600" />
                          )}
                        </div>
                      <CardTitle className="ml-4 text-base font-semibold">{t`PDF Export`}</CardTitle>
                     
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                      Generate a professional PDF for printing, emailing, or job portals.
                    </CardDescription>
                     <Badge variant="outline" className="mt-1 bg-red-50 text-red-700">
                        Print-Ready
                      </Badge>
                    <div className="mt-4 flex items-center text-xs text-red-600">
                      <FileDoc size={12} className="mr-1" />
                      {pdfLoading ? "Generating PDF..." : "Click to generate PDF"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* JSON Export Card */}
            <Card
              className={cn(
                "h-auto cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-blue-300",
                "border-blue-100 bg-gradient-to-br from-blue-50 to-white"
              )}
              onClick={onJsonExport}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
                        <FileJs size={24} className="text-blue-600" />
                      </div>
                      <CardTitle className="ml-4 text-base font-semibold">{t`JSON Export`}</CardTitle>
                      
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                      Download a JSON snapshot for backup, sharing, or future imports.
                    </CardDescription>
                    <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700">
                        Universal
                      </Badge>
                    <div className="mt-4 flex items-center text-xs text-blue-600">
                      <DownloadSimple size={12} className="mr-1" />
                      Click to download JSON file
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            
          </div>

          {/* Translation Section - Enhanced */}
          <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50/80 to-indigo-50/50 shadow-sm">
          
            <CardContent className="p-6">
              <div className="flex items-start gap-5">
            
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      
                      <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-3">
                         <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 shadow-sm">
                            {isTranslating || isSaving ? (
                              <CircleNotch size={28} className="animate-spin text-purple-600" />
                            ) : (
                              <Sparkle size={28} className="text-purple-600" />
                            )}
                          </div>
                        {t`AI Translation`}
                        <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
                          <ChatCircleText size={12} className="mr-1" />
                          Smart AI
                        </Badge>

                        
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 mt-1">
                        Create professional translations for international job applications. Each translation is saved as a new resume.
                      </CardDescription>
                    </div>
                    
                    <Tooltip
                      content={
                        <div className="max-w-xs p-2">
                          <p className="font-medium mb-1">AI-Powered Translation</p>
                          <p className="text-sm">Our AI preserves your resume's structure while adapting content for different cultures and professional contexts.</p>
                        </div>
                      }
                    >
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <WarningCircle size={16} className="text-gray-400" />
                      </Button>
                    </Tooltip>
                  </div>

                  {/* Language Selection */}
                  <div className="space-y-5">
                    {/* Popular Languages Grid */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Globe size={14} />
                        Popular Languages
                        <div className="ml-3 text-sm text-gray-600 mt-1">
                        (27+ Languages Supported)
                      </div>
                      </h4>

                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {sortedLanguages
                          .filter(lang => popularLanguages.includes(lang.code))
                          .map((lang) => (
                            <Tooltip
                              key={lang.code}
                              content={
                                <div className="text-center p-2">
                                  <p className="font-medium">{lang.nativeName}</p>
                                  {lang.confidence && (
                                    <p className="text-xs mt-1">
                                      Confidence: <span className="font-semibold">{Math.round(lang.confidence * 100)}%</span>
                                    </p>
                                  )}
                                </div>
                              }
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSaveTranslatedResume(lang.code)}
                                disabled={isTranslating || isSaving}
                                className={cn(
                                  "h-auto py-3 px-4 flex flex-col items-center justify-center gap-2 transition-all",
                                  "hover:shadow-md hover:-translate-y-0.5",
                                  lang.available 
                                    ? "border-green-200 bg-green-50 hover:bg-green-100 text-green-800 hover:border-green-300"
                                    : "border-purple-200 bg-white hover:bg-purple-50 text-purple-800 hover:border-purple-300"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{lang.flag}</span>
                                  {lang.available && (
                                    <CheckCircle size={14} className="text-green-500" />
                                  )}
                                </div>
                                <span className="text-xs font-medium">{lang.name}</span>
                                {lang.confidence && (
                                  <div className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-full",
                                    lang.confidence > 0.8 ? "bg-green-100 text-green-700" :
                                    lang.confidence > 0.6 ? "bg-yellow-100 text-yellow-700" :
                                    "bg-blue-100 text-blue-700"
                                  )}>
                                    {Math.round(lang.confidence * 100)}%
                                  </div>
                                )}
                              </Button>
                            </Tooltip>
                          ))}
                      </div>
                    </div>

                    {/* Other Languages Dropdown */}
                    {otherLanguages.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">More Languages</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="lg" 
                              className="w-full justify-between h-12 border-purple-200 bg-white hover:bg-purple-50 hover:border-purple-300"
                              disabled={isTranslating || isSaving}
                            >
                              <div className="flex items-center gap-3">
                                <ChatCircleText size={18} className="text-purple-600" />
                                <div className="text-left">
                                  <span className="font-medium">Select Language</span>
                                  <p className="text-xs text-gray-500">{otherLanguages.length }+ more languages available</p>
                                </div>
                              </div>
                              <Translate size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-72 max-h-96 overflow-y-auto">
                            <div className="p-2">
                              <p className="text-xs font-medium text-gray-500 mb-2">All Available Languages</p>
                              {otherLanguages.map((lang) => (
                                <DropdownMenuItem
                                  key={lang.code}
                                  onClick={() => handleSaveTranslatedResume(lang.code)}
                                  disabled={isTranslating || isSaving}
                                  className="flex items-center justify-between py-3 px-3 cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-xl">{lang.flag}</span>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{lang.name}</span>
                                      <span className="text-xs text-gray-500">{lang.nativeName}</span>
                                    </div>
                                  </div>
                                  {lang.available ? (
                                    <div className="flex items-center gap-2">
                                      {lang.confidence && (
                                        <span className="text-xs text-gray-500">
                                          {Math.round(lang.confidence * 100)}%
                                        </span>
                                      )}
                                      <CheckCircle size={14} className="text-green-500" />
                                    </div>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      New
                                    </Badge>
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}

                    {/* Translation Status */}
                    {(isTranslating || isSaving) && (
                      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                            <CircleNotch size={20} className="animate-spin text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-blue-800">
                                {isSaving ? 'Saving Translation...' : 'AI Translating...'}
                              </span>
                              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                                In Progress
                              </Badge>
                            </div>
                            <p className="text-sm text-blue-600 mt-1">
                              Translating to {availableLanguages.find(l => l.code === selectedLanguage)?.name || selectedLanguage.toUpperCase()}
                            </p>
                            <p className="text-xs text-blue-500 mt-2">
                              This usually takes 15-30 seconds. Please don't close this page.
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
        </main>
      </section>

      {/* Save Translation Dialog - Enhanced */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-indigo-100">
                <ChatCircleText size={20} className="text-purple-600" />
              </div>
              <div>
                <DialogTitle className="text-lg text-center">Resume Translation</DialogTitle>
                <DialogDescription>
                  AI translation of current resume into <strong>{availableLanguages.find(l => l.code === selectedLanguage)?.name || selectedLanguage.toUpperCase()}</strong>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Separator className="my-2" />

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-sm font-medium">
                Resume Title
              </Label>
              <Input
                id="title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Enter resume title"
                className="h-11"
              />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <WarningCircle size={12} />
                <span>This will be saved as a new resume in your workspace</span>
              </div>
            </div>
            
            <div className="rounded-xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 p-4 border border-blue-100">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">What to expect</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                      <span>A new resume will be created with the translated content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                      <span>You'll receive success notifications with quick actions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                      <span>We recommend reviewing the translation for accuracy</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-2" />

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSaveTranslation}
              disabled={isSaving || !customTitle.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 gap-3"
            >
              {isSaving ? (
                <>
                  <CircleNotch className="h-4 w-4 animate-spin" />
                  <span>Creating Translation...</span>
                </>
              ) : (
                <>
                  <Sparkle size={16} />
                  <span>Translate Resume</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};