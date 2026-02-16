import { t, Trans } from "@lingui/macro";
import { useState, useEffect } from 'react';
import { Button } from '@reactive-resume/ui';
import { Layout, Check, Star, Eye, Download, RefreshCw, Wifi, Info, X, MapPin, Calendar, User, Building, Mail, Phone } from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";
import { AspectRatio } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";

import { useCoverLetterStore } from "../../../../../stores/cover-letter";
import { coverLetterService } from "@/client/services/cover-letter.service";
import { toast } from "sonner";

interface TemplateStructure {
  contactInfoPosition: 'left' | 'center' | 'right' | 'none';
  datePosition: 'left' | 'right' | 'none';
  greetingAlignment: 'left' | 'center' | 'right';
  paragraphSpacing: 'compact' | 'balanced' | 'generous' | 'creative' | 'minimal' | 'traditional' | 'academic' | 'technical';
  signatureAlignment: 'left' | 'center' | 'right';
  recipientInfoPosition?: 'left' | 'center' | 'right' | 'none';
  subjectLinePosition?: 'left' | 'center' | 'right' | 'none';
  includeAddress?: boolean;
  showSubjectLine?: boolean;
  includeAddresseeInfo?: boolean;
  showCompanyLogo?: boolean;
  lineHeight?: 'tight' | 'normal' | 'relaxed';
  marginSize?: 'small' | 'medium' | 'large';
  fontStyle?: 'serif' | 'sans-serif' | 'modern' | 'classic';
}

interface CoverLetterTemplate {
  id: string;
  name: string;
  category: string;
  style: string;
  description: string;
  premium?: boolean;
  layout: string;
  structure: TemplateStructure;
  recommendedFor?: string[];
  tags?: string[];
  idealFor?: string[];
  features?: string[];
  isFeatured?: boolean;
  isPopular?: boolean;
  usageCount?: number;
}

// Template categories mapping
const templateCategories: Record<string, string> = {
  'professional': t`Professional`,
  'creative': t`Creative`,
  'modern': t`Modern`,
  'executive': t`Executive`,
  'academic': t`Academic`,
  'technical': t`Technical`,
  'minimal': t`Minimal`,
  'traditional': t`Traditional`,
} as const;

// Template descriptions mapping
const templateDescriptions: Record<string, string> = {
  'modern-pro': t`Clean, contemporary design perfect for tech and creative industries`,
  'executive-elite': t`Sophisticated layout for senior-level positions and corporate environments`,
  'creative-spark': t`Bold and innovative design for creative professionals`,
  'academic-precision': t`Structured format ideal for academic and research positions`,
  'minimal-clear': t`Simple, ATS-friendly design that focuses on content`,
  'professional-classic': t`Timeless design trusted by professionals worldwide`,
} as const;

// Template modal component
const TemplatePreviewModal = ({
  template,
  isOpen,
  onClose,
  onSelectTemplate,
  isApplying,
  coverLetterId
}: {
  template: CoverLetterTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: CoverLetterTemplate) => void;
  isApplying: boolean;
  coverLetterId?: string;
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !template) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div 
          className={cn(
            "relative mx-auto w-full max-w-6xl bg-background shadow-2xl rounded-xl overflow-hidden",
            isMobile ? "h-full max-h-full" : "max-h-[90vh]"
          )}
          onClick={(e) => e.stopPropagation()}
          style={{
            // Force modal positioning for Chrome
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            // Mobile full screen adjustments
            ...(isMobile ? {
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              transform: 'none',
              borderRadius: 0,
              width: '100vw',
              height: '100vh',
              maxHeight: '100vh',
              margin: 0,
            } : {})
          }}
        >
          {/* Mobile header with close button */}
          {isMobile && (
            <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 backdrop-blur-sm p-4">
              <div>
                <h2 className="text-lg font-semibold capitalize">{template.name}</h2>
                <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-secondary transition-colors"
                aria-label={t`Close`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Scrollable content */}
          <div className="h-full overflow-y-auto">
            <div className="grid gap-4 md:grid-cols-2 p-4 md:p-6">
              {/* Template Preview */}
              <div className="space-y-4 order-2 md:order-1">
                <div className="relative overflow-hidden rounded-lg border bg-secondary/20">
                  <AspectRatio ratio={1 / 1.4142}>
                    <img
                      src={`/templates/jpg/letters/${template.id}.jpg`}
                      alt={template.name}
                      className="h-full w-full object-contain rounded-lg"
                      loading="lazy"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.opacity = "0.3";
                        // Show fallback
                        const parent = img.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100';
                          fallback.innerHTML = `
                            <div class="text-center p-4">
                              <Layout class="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <div class="text-lg font-semibold text-gray-600">${template.name}</div>
                              <div class="text-sm text-gray-500">${template.category} • ${template.style}</div>
                            </div>
                          `;
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                    
                    {/* Premium Badge */}
                    {template.premium && (
                      <div className="absolute top-2 right-2 rounded-full bg-yellow-500 px-3 py-1 text-xs font-semibold text-white flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {t`Premium`}
                      </div>
                    )}
                  </AspectRatio>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      onSelectTemplate(template);
                      onClose();
                    }}
                    disabled={isApplying || !coverLetterId}
                    className="flex-1 rounded-lg bg-primary px-4 sm:px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApplying ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {t`Applying...`}
                      </span>
                    ) : (
                      t`Use This Template`
                    )}
                  </button>
                  {!isMobile && (
                    <button
                      onClick={onClose}
                      className="px-4 sm:px-6 py-3 rounded-lg border hover:bg-secondary transition-colors"
                    >
                      {t`Cancel`}
                    </button>
                  )}
                </div>
              </div>

              {/* Template Info */}
              <div className="space-y-4 md:space-y-6 order-1 md:order-2">
                {!isMobile && (
                  <div className="flex justify-end">
                    <button
                      onClick={onClose}
                      className="rounded-full p-2 hover:bg-secondary transition-colors"
                      aria-label={t`Close`}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary capitalize">
                      {template.category}
                    </div>
                    <div className="rounded-lg bg-secondary/30 px-3 py-1 text-sm font-medium capitalize">
                      {template.style}
                    </div>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">{template.name}</h2>
                  <p className="text-base md:text-lg text-muted-foreground">{template.description}</p>
                </div>

                {/* Template Features */}
                <div className="space-y-4">
                  {/* Recommended For */}
                  {template.recommendedFor && template.recommendedFor.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-lg md:text-xl font-semibold">{t`Best For`}</h3>
                      <ul className="space-y-2">
                        {template.recommendedFor.slice(0, 4).map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                            <span className="text-sm md:text-base">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key Features */}
                  {template.features && template.features.length > 0 && (
                    <div className="rounded-lg bg-secondary/30 p-4">
                      <h4 className="mb-3 font-semibold">{t`Template Features`}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {template.features.slice(0, 4).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-primary flex-shrink-0" />
                            <span className="text-xs md:text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-muted-foreground">{t`Tags`}</h4>
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 5).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Usage Stats */}
                  {template.usageCount !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span>{t`Used by ${template.usageCount}+ users`}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const TemplateSection = () => {
  const { coverLetter, applyEnhancedTemplate, updateCoverLetter } = useCoverLetterStore();
  const [isApplying, setIsApplying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<CoverLetterTemplate | null>(null);
  const [templates, setTemplates] = useState<CoverLetterTemplate[]>([]);

  const currentCoverLetterCategory = coverLetter?.content?.category || t`Job Application`;

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        const backendTemplates = await coverLetterService.getTemplates();
        
        const transformedTemplates: CoverLetterTemplate[] = backendTemplates.map(template => ({
          ...template,
          premium: (template as any).premium || false,
        }));
        
        setTemplates(transformedTemplates);
      } catch (error) {
        console.error(t`Failed to load templates:`, error);
        toast.error(t`Failed to load templates`);
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTemplates();
  }, []);

  // Filter templates to show ONLY the current category
  const filteredTemplates = templates.filter(template => 
    template.category === currentCoverLetterCategory
  );

  const handleTemplateSelect = async (template: CoverLetterTemplate) => {
    if (!coverLetter?.id) {
      toast.error(t`Please save your cover letter first`);
      return;
    }
    
    setIsApplying(true);
    try {
      if (applyEnhancedTemplate) {
        applyEnhancedTemplate(template);
      } else {
        updateCoverLetter({ 
          style: template.style,
          layout: template.layout,
          content: {
            ...coverLetter.content,
            style: template.style,
            layoutType: template.layout,
            structure: template.structure
          }
        });
      }
      
      if (typeof coverLetterService.applyTemplate === 'function') {
        await coverLetterService.applyTemplate(coverLetter.id, template.id);
      } else {
        await coverLetterService.update(coverLetter.id, {
          style: template.style,
          layout: template.layout, 
          content: {
            ...coverLetter.content,
            style: template.style,
          },
        });
      }
      
      toast.success(t`Applied ${template.name} template`);
    } catch (error) {
      console.error(t`Failed to apply template:`, error);
      toast.error(t`Failed to apply template`);
    } finally {
      setIsApplying(false);
    }
  };

  const handlePreview = (template: CoverLetterTemplate) => {
    setSelectedTemplate(template);
  };

  if (isLoading) {
    return (
      <section id="template">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Layout className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t`Templates`}</h2>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
            <span className="text-gray-600 dark:text-gray-400">{t`Loading templates...`}</span>
          </div>
        </div>
      </section>
    );
  }

  if (templates.length === 0) {
    return (
      <section id="template">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Layout className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t`Templates`}</h2>
          </div>
        </div>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Layout className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">{t`No templates available`}</p>
          <p className="text-sm">{t`Please try again later or contact support.`}</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="template">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Layout className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t`Templates`}</h2>
            <Wifi className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              {coverLetter?.layout ? t`Current: ${templates.find(t => t.layout === coverLetter.layout)?.name || coverLetter.layout}` : t`No template selected`}
            </div>
          </div>
        </div>

        {/* Current Category Info */}
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {t`Showing templates for your letter type`}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300 capitalize">
                {currentCoverLetterCategory}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {t`Only templates specifically designed for ${currentCoverLetterCategory.toLowerCase()} are shown`}
              </div>
            </div>
          </div>
        </div>

        {/* Template Count */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {filteredTemplates.length} {t`template${filteredTemplates.length !== 1 ? 's' : ''}`} {t`available for ${currentCoverLetterCategory.toLowerCase()}`}
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="mb-4">
              <Layout className="w-16 h-16 mx-auto text-gray-400 mb-3" />
              <div className="font-medium text-gray-600 dark:text-gray-400 text-lg mb-2">
                {t`No templates found for "${currentCoverLetterCategory}"`}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
              {t`There are no templates specifically designed for ${currentCoverLetterCategory.toLowerCase()} letters yet. Our team is working on adding more templates for this category.`}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info(t`Contact support to request templates for this category`)}
            >
              {t`Request Templates`}
            </Button>
          </div>
        ) : (
          <>
            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative cursor-pointer"
                  onClick={() => handlePreview(template)}
                >
                  <AspectRatio ratio={1 / 1.4142}>
                    <div
                      className={cn(
                        "relative h-full w-full overflow-hidden rounded-lg border-2 transition-all duration-300",
                        coverLetter?.layout === template.layout
                          ? "border-primary shadow-lg shadow-primary/20"
                          : "border-transparent group-hover:border-primary/50"
                      )}
                    >
                      <img
                        src={`/templates/jpg/letters/${template.id}.jpg`}
                        alt={template.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.opacity = "0.3";
                        }}
                      />

                      {/* Premium Badge */}
                      {template.premium && (
                        <div className="absolute top-2 right-2 z-10">
                          <div className="flex items-center gap-1 rounded-full bg-yellow-500 px-2 py-1 text-xs font-semibold text-white">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{t`Premium`}</span>
                          </div>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <div className="mb-2 flex flex-wrap items-center gap-1">
                            <div className="rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary-foreground capitalize">
                              {template.category}
                            </div>
                            <div className="rounded-full bg-secondary/30 px-2 py-1 text-xs font-medium capitalize">
                              {template.style}
                            </div>
                            {coverLetter?.layout === template.layout && (
                              <div className="rounded-full bg-green-500/90 px-2 py-1 text-xs font-semibold">
                                {t`Selected`}
                              </div>
                            )}
                          </div>
                          <h3 className="mb-1 text-lg font-bold">{template.name}</h3>
                          <p className="text-xs text-white/90 line-clamp-2">{template.description}</p>
                          <div className="mt-2 flex gap-2">
                            <button 
                              className="flex-1 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreview(template);
                              }}
                            >
                              {t`Preview`}
                            </button>
                            <button 
                              className="flex-1 rounded-lg bg-primary/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTemplateSelect(template);
                              }}
                              disabled={isApplying || !coverLetter?.id}
                            >
                              {t`Apply`}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Selected Indicator */}
                      {coverLetter?.layout === template.layout && (
                        <div className="absolute left-2 top-2 z-10">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                      )}

                      {/* Template Name at Bottom */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-center text-sm font-semibold capitalize text-white line-clamp-1">
                          {template.name}
                        </p>
                      </div>
                    </div>
                  </AspectRatio>
                </motion.div>
              ))}
            </main>

            <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/10 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                💡 {t`All templates shown are specifically designed for ${currentCoverLetterCategory.toLowerCase()} letters. Hover over a template to preview, or click to see full details.`}
              </p>
            </div>
          </>
        )}
      </section>

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={selectedTemplate}
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onSelectTemplate={handleTemplateSelect}
        isApplying={isApplying}
        coverLetterId={coverLetter?.id}
      />
    </>
  );
};

export type { CoverLetterTemplate, TemplateStructure };