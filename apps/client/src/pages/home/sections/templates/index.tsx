import { t } from "@lingui/macro";
import { templatesList, templatesData, Template } from "@reactive-resume/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@reactive-resume/ui";
import { X, Maximize2, FileText, ArrowRight, FileCheck } from "lucide-react";

export const TemplatesSection = () => {
  const [activeTab, setActiveTab] = useState<"resumes" | "letters">("resumes");
  const [selectedTemplate, setSelectedTemplate] = useState<{
    id: string;
    name: string;
    category: string;
    style: string;
    type: "resumes" | "letters";
  } | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Get correct image and PDF paths based on template type
  const getTemplatePaths = (templateId: string, templateType: "resumes" | "letters") => {
    if (templateType === "resumes") {
      return {
        image: `/templates/jpg/resumes/${templateId}.jpg`,
        preview: `/templates/jpg/resumes/${templateId}.jpg`
      };
    } else {
      return {
        image: `/templates/jpg/letters/${templateId}.jpg`,
        preview: `/templates/jpg/letters/${templateId}.jpg`
      };
    }
  };

  const handlePreviewTemplate = (
    templateId: string, 
    templateType: "resumes" | "letters", 
    templateData: any
  ) => {
    setSelectedTemplate({
      id: templateId,
      name: templateData.name,
      category: templateData.category,
      style: templateData.style,
      type: templateType
    });
    setShowPreviewModal(true);
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    
    if (selectedTemplate.type === "resumes") {
      // Navigate to resume creation with this template
      window.location.href = `/dashboard/resumes`;
    } else {
      // Navigate to cover letter wizard
      window.location.href = `/dashboard/letters/wizard`;
    }
  };

  return (
    <>
      <section id="templates" className="relative py-12 md:py-24 lg:py-32">
        <div className="container px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 md:mb-12 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{t`Professional Templates`}</h2>
            <p className="mt-2 sm:mt-4 text-base sm:text-lg text-muted-foreground">
              {t`Choose from our collection of beautifully designed resume and letter templates`}
            </p>
          </div>

          {/* Tab Navigation */}
          {/* <div className="mb-8 md:mb-16 flex justify-center">
            <div className="inline-flex rounded-lg border p-1">
              {(["resumes", "letters"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-md text-xs sm:text-sm md:text-base font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  {tab === "resumes" ? t`Resume Templates` : t`Cover Letter Templates`}
                </button>
              ))}
            </div>
          </div> */}

          {/* Resume Templates Carousel */}
          <div className="mb-8 md:mb-20">
            <h3 className="mb-4 md:mb-8 text-center text-xl sm:text-2xl lg:text-3xl font-bold">
              {t`Resume Templates`}
            </h3>
            <div className="relative overflow-hidden rounded-xl md:rounded-2xl border bg-gradient-to-br from-muted/20 to-muted/5 p-1">
              <motion.div
                animate={{
                  x: [0, -templatesList.length * 280],
                  transition: {
                    x: {
                      duration: 45,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "loop",
                      ease: "linear",
                    },
                  },
                }}
                className="flex gap-4 sm:gap-6 md:gap-8 py-4 sm:py-6"
              >
                {[...templatesList, ...templatesList].map((templateId, index) => {
                  const template = templatesData.resumes.find(t => t.id === templateId)!;
                  const paths = getTemplatePaths(templateId, "resumes");
                  
                  return (
                    <motion.div
                      key={`resume-${templateId}-${index}`}
                      className="min-w-[240px] sm:min-w-[280px] md:min-w-[300px]"
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="group cursor-pointer">
                        <div
                          onClick={() => handlePreviewTemplate(templateId, "resumes", template)}
                          className="block"
                        >
                          <div className="relative overflow-hidden rounded-lg md:rounded-xl border-2 border-transparent shadow-lg transition-all group-hover:border-primary group-hover:shadow-xl">
                            <div className="relative aspect-[1/1.4142] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                              {/* Fallback */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-600">
                                    {template.name}
                                  </div>
                                  <div className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    {template.category}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Template Image */}
                              <img
                                src={paths.image}
                                alt={template.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.style.opacity = "0";
                                }}
                              />
                              
                              {/* Hover Overlay */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <div className="text-center p-2 sm:p-4">
                                  <span className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-gray-900 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium shadow-lg">
                                    <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                    {t`View Template`}
                                  </span>
                                  <div className="mt-2 sm:mt-3 text-white">
                                    <div className="font-semibold text-sm sm:text-lg">{template.name}</div>
                                    <div className="text-xs sm:text-sm opacity-90 mt-1">{template.category}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Template Info */}
                        <div className="mt-2 sm:mt-4 px-1 sm:px-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-sm sm:text-base">{template.name}</h4>
                              <span className="text-xs sm:text-sm text-muted-foreground capitalize">
                                {template.category}
                              </span>
                            </div>
                            <button
                              onClick={() => handlePreviewTemplate(templateId, "resumes", template)}
                              className="rounded-full bg-primary px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 flex items-center gap-1"
                            >
                              <Maximize2 className="w-3 h-3" />
                              {t`View`}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 md:w-32 bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 md:w-32 bg-gradient-to-l from-background to-transparent" />
            </div>
          </div>

          {/* Letter Templates Carousel */}
          <div>
            <h3 className="mb-4 md:mb-8 text-center text-xl sm:text-2xl lg:text-3xl font-bold">
              {t`Cover Letter Templates`}
            </h3>
            <div className="relative overflow-hidden rounded-xl md:rounded-2xl border bg-gradient-to-br from-muted/20 to-muted/5 p-1">
              <motion.div
                animate={{
                  x: [-templatesData.letters.length * 280, 0],
                  transition: {
                    x: {
                      duration: 40,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "loop",
                      ease: "linear",
                    },
                  },
                }}
                className="flex gap-4 sm:gap-6 md:gap-8 py-4 sm:py-6"
              >
                {[...templatesData.letters, ...templatesData.letters].map((template, index) => {
                  const paths = getTemplatePaths(template.id, "letters");
                  
                  return (
                    <motion.div
                      key={`letter-${template.id}-${index}`}
                      className="min-w-[240px] sm:min-w-[280px] md:min-w-[300px]"
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="group cursor-pointer">
                        <div
                          onClick={() => handlePreviewTemplate(template.id, "letters", template)}
                          className="block"
                        >
                          <div className="relative overflow-hidden rounded-lg md:rounded-xl border-2 border-transparent shadow-lg transition-all group-hover:border-primary group-hover:shadow-xl">
                            <div className="relative aspect-[1/1.4142] overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
                              {/* Fallback */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-600">
                                    {template.name}
                                  </div>
                                  <div className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    {template.category}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Template Image */}
                              <img
                                src={paths.image}
                                alt={template.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.style.opacity = "0";
                                }}
                              />
                              
                              {/* Hover Overlay */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <div className="text-center p-2 sm:p-4">
                                  <span className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-gray-900 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium shadow-lg">
                                    <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                    {t`View Template`}
                                  </span>
                                  <div className="mt-2 sm:mt-3 text-white">
                                    <div className="font-semibold text-sm sm:text-lg">{template.name}</div>
                                    <div className="text-xs sm:text-sm opacity-90 mt-1">{template.category}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Template Info */}
                        <div className="mt-2 sm:mt-4 px-1 sm:px-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-sm sm:text-base">{template.name}</h4>
                              <span className="text-xs sm:text-sm text-muted-foreground capitalize">
                                {template.category}
                              </span>
                            </div>
                            <button
                              onClick={() => handlePreviewTemplate(template.id, "letters", template)}
                              className="rounded-full bg-primary px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 flex items-center gap-1"
                            >
                              <Maximize2 className="w-3 h-3" />
                              {t`View`}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 md:w-32 bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 md:w-32 bg-gradient-to-l from-background to-transparent" />
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-8 md:mt-16 text-center">
            <p className="text-base sm:text-lg text-muted-foreground">
              {t`All templates are fully customizable to match your personal style and career needs.`}
            </p>
          </div>
        </div>
      </section>

      {/* VERTICAL STACK Template Preview Modal - Works on all devices */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 mt-10 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="relative bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl w-full max-w-4xl lg:max-w-6xl max-h-[90vh] md:max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                    selectedTemplate.type === "resumes" 
                      ? "bg-blue-100 dark:bg-blue-900" 
                      : "bg-purple-100 dark:bg-purple-900"
                  }`}>
                    <FileText className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      selectedTemplate.type === "resumes" 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-purple-600 dark:text-purple-400"
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 sm:gap-2">
                      <span className="capitalize">{selectedTemplate.category}</span>
                      <span>•</span>
                      
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreviewModal(false)}
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>

            {/* Content - Vertical Stack */}
            <div className="flex-1 overflow-y-auto">
              {/* Template Info Bar */}
              <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-3 sm:gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 dark:text-gray-400">{t`Type:`}</span>
                    <span className="font-medium">
                      {selectedTemplate.type === "resumes" ? t`Resume` : t`Cover Letter`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 dark:text-gray-400">{t`Category:`}</span>
                    <span className="font-medium capitalize">{selectedTemplate.category}</span>
                  </div>
                  
                </div>
              </div>

              {/* Image Preview - Full Width */}
              <div className="p-3 sm:p-4 md:p-6 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                <div className="relative w-full max-w-2xl">
                  <div className="relative rounded-md sm:rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                    <img
                      src={getTemplatePaths(selectedTemplate.id, selectedTemplate.type).preview}
                      alt={selectedTemplate.name}
                      className="w-full h-auto"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.opacity = "0";
                        const parent = img.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full min-h-[300px] md:min-h-[400px] flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 text-center">
                              <FileText class="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-4" />
                              <div class="text-xl sm:text-2xl font-bold text-gray-600">${selectedTemplate.name}</div>
                              <div class="text-sm sm:text-base text-gray-500 mt-2">${selectedTemplate.category} • ${selectedTemplate.style}</div>
                              <div class="text-xs sm:text-sm text-gray-400 mt-3">Template preview</div>
                            </div>
                          `;
                        }
                      }}
                    />
                    <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm">
                      {t`Template Preview`}
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* Action Buttons - Stacked at Bottom */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <div className="max-w-2xl mx-auto w-full space-y-3">
                  {/* Main Action Button */}
                  <Button
                    onClick={handleUseTemplate}
                    className="w-full py-3 sm:py-4 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    size="lg"
                  >
                    <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    {selectedTemplate.type === "resumes" 
                      ? t`Start Building Your Resume`
                      : t`Start Crafting Your Letter`
                    }
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Button>
                  
                  {/* Secondary Button */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowPreviewModal(false)}
                      className="flex-1 py-2 sm:py-3 text-sm sm:text-base"
                    >
                      {t`Back to Templates`}
                    </Button>
                   
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};