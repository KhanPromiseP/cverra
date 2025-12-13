import { useState, useEffect } from 'react';
import { Button } from '@reactive-resume/ui';
import { Layout, Check, Star, Eye, Download, RefreshCw, Wifi, Info, X, MapPin, Calendar, User, Building, Mail, Phone } from "lucide-react"; 
import { t } from "@lingui/macro";

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

export const TemplateSection = () => {
  const { coverLetter, applyEnhancedTemplate, updateCoverLetter } = useCoverLetterStore();
  const [isApplying, setIsApplying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<CoverLetterTemplate | null>(null);
  const [templates, setTemplates] = useState<CoverLetterTemplate[]>([]);

  const currentCoverLetterCategory = coverLetter?.content?.category || 'Job Application';

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
        console.error('Failed to load templates:', error);
        toast.error('Failed to load templates');
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
      toast.error('Please save your cover letter first');
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
      
      toast.success(`Applied ${template.name} template`);
    } catch (error) {
      console.error('Failed to apply template:', error);
      toast.error('Failed to apply template');
    } finally {
      setIsApplying(false);
    }
  };

  const handlePreview = (template: CoverLetterTemplate) => {
    setPreviewTemplate(template);
  };

  // Helper function to get alignment class
  const getAlignmentClass = (alignment: string) => {
    switch (alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  // Helper function to get line height value
  const getLineHeightValue = (lineHeight?: string) => {
    switch (lineHeight) {
      case 'tight': return '1.3';
      case 'relaxed': return '1.8';
      default: return '1.5';
    }
  };

  // Helper function to get margin size
  const getMarginSize = (marginSize?: string) => {
    switch (marginSize) {
      case 'small': return '1rem';
      case 'large': return '3rem';
      default: return '2rem';
    }
  };

  const TemplatePreviewModal = () => {
  if (!previewTemplate) return null;

  const structure = previewTemplate.structure;
  
  // Helper function to get font family based on fontStyle
  const getFontFamily = (fontStyle?: string) => {
    switch (fontStyle) {
      case 'serif': return 'Georgia, "Times New Roman", serif';
      case 'modern': return '"Helvetica Neue", Arial, sans-serif';
      case 'classic': return '"Times New Roman", Georgia, serif';
      default: return 'Arial, sans-serif';
    }
  };

  // Helper function to get line height value
  const getLineHeight = (lineHeight?: string) => {
    switch (lineHeight) {
      case 'tight': return '1.3';
      case 'relaxed': return '1.8';
      default: return '1.5';
    }
  };

  // Helper function to get margin size (scaled down for preview)
  const getMarginSize = (marginSize?: string) => {
    switch (marginSize) {
      case 'small': return '0.5rem';
      case 'large': return '1.5rem';
      default: return '1rem';
    }
  };

  // Helper function to get paragraph spacing (scaled down for preview)
  const getParagraphSpacing = (spacing?: string) => {
    switch (spacing) {
      case 'compact': return '0.25rem';
      case 'balanced': return '0.5rem';
      case 'generous': return '0.75rem';
      case 'creative': return '0.5rem';
      case 'minimal': return '0.125rem';
      case 'traditional': return '0.5rem';
      case 'academic': return '0.45rem';
      case 'technical': return '0.3rem';
      default: return '0.5rem';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header - Same exact styling */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Layout className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {previewTemplate.name}
              </h3>
              {previewTemplate.premium && (
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {previewTemplate.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full capitalize">
                {previewTemplate.category}
              </span>
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full capitalize">
                {previewTemplate.style}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewTemplate(null)}
            className="h-8 w-8 p-0 hover:bg-white dark:hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Template Preview - Smaller but same colors */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
              <div 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mx-auto shadow-sm"
                style={{ 
                  maxWidth: '100%',
                  minHeight: '400px',
                  fontFamily: getFontFamily(structure.fontStyle),
                  padding: '2rem',
                  transform: 'scale(0.85)',
                  transformOrigin: 'top center'
                }}
              >
                {/* Header Section */}
                <div className="w-full h-auto">
                  {/* Contact Information - Only show if not 'none' */}
                  {structure.contactInfoPosition !== 'none' && (
                    <div 
                      className="mb-4"
                      style={{ 
                        textAlign: structure.contactInfoPosition,
                        marginBottom: getMarginSize(structure.marginSize)
                      }}
                    >
                      <div className="font-bold text-gray-900 dark:text-white text-lg">
                        John Doe
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 mt-2 space-y-1 text-sm">
                        <div className={`flex items-center gap-2 ${structure.contactInfoPosition === 'center' ? 'justify-center' : structure.contactInfoPosition === 'right' ? 'justify-end' : 'justify-start'}`}>
                      
                          <span>john.doe@email.com</span>
                        </div>
                        <div className={`flex items-center gap-2 ${structure.contactInfoPosition === 'center' ? 'justify-center' : structure.contactInfoPosition === 'right' ? 'justify-end' : 'justify-start'}`}>
                       
                          <span>(555) 123-4567</span>
                        </div>
                        {structure.includeAddress && (
                          <div className={`flex items-center gap-2 ${structure.contactInfoPosition === 'center' ? 'justify-center' : structure.contactInfoPosition === 'right' ? 'justify-end' : 'justify-start'}`}>
                     
                            <span>123 Main St, City, State 1</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Date - Only show if not 'none' */}
                  {structure.datePosition !== 'none' && (
                    <div 
                      className="mb-4"
                      style={{ 
                        textAlign: structure.datePosition,
                        marginBottom: getMarginSize(structure.marginSize)
                      }}
                    >
                      <div className="text-gray-600 dark:text-gray-400 text-sm">
                        {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recipient Information - Only show if included and not 'none' */}
                {structure.includeAddresseeInfo && structure.recipientInfoPosition && structure.recipientInfoPosition !== 'none' && (
                  <div 
                    className="mb-6"
                    style={{ 
                      textAlign: structure.recipientInfoPosition,
                      marginBottom: getMarginSize(structure.marginSize)
                    }}
                  >
                    <div className="space-y-2 text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        Hiring Manager
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Acme Corporation
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        123 Business Ave,
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        New York, NY 10001
                      </div>
                    </div>
                  </div>
                )}

                {/* Subject Line - Only show if included and not 'none' */}
                {structure.showSubjectLine && structure.subjectLinePosition && structure.subjectLinePosition !== 'none' && (
                  <div 
                    className="mb-4"
                    style={{ 
                      textAlign: structure.subjectLinePosition,
                      marginBottom: getMarginSize(structure.marginSize)
                    }}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Subject: Application for Senior Software Engineer Position
                    </div>
                  </div>
                )}

                {/* Greeting */}
                <div 
                  className="mb-6"
                  style={{ 
                    textAlign: structure.greetingAlignment,
                    marginBottom: getMarginSize(structure.marginSize)
                  }}
                >
                  <div className="text-gray-700 dark:text-gray-300">
                    Dear Hiring Manager,
                  </div>
                </div>

                {/* Body Paragraphs */}
                <div 
                  className="mb-6"
                  style={{ marginBottom: getMarginSize(structure.marginSize) }}
                >
                  {[1, 2].map((para) => (
                    <div 
                      key={para} 
                      className="text-gray-700 dark:text-gray-300 mb-3"
                      style={{ 
                        lineHeight: getLineHeight(structure.lineHeight),
                        marginBottom: getParagraphSpacing(structure.paragraphSpacing),
                      }}
                    >
                      This is a sample paragraph demonstrating the {structure.paragraphSpacing} spacing 
                      and {structure.lineHeight || 'normal'} line height of the {previewTemplate.name} template. 
                      The content would be replaced with your actual cover letter text when generated.
                    </div>
                  ))}
                </div>

                {/* Closing */}
                <div className="mb-4 text-gray-700 dark:text-gray-300">
                  Sincerely,
                </div>

                {/* Signature */}
                <div 
                  className="mt-8"
                  style={{ 
                    textAlign: structure.signatureAlignment,
                    marginTop: getMarginSize(structure.marginSize)
                  }}
                >
                  <div className="font-medium text-gray-900 dark:text-white">John Doe</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Senior Software Engineer
                  </div>
                  {/* <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Acme Corporation • (555) 123-4567
                  </div> */}
                </div>
              </div>
            </div>

            {/* Template Details - Same exact styling but scrollable */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Template Features
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Category</span>
                    <span className="font-medium capitalize">{previewTemplate.category}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Style</span>
                    <span className="font-medium capitalize">{previewTemplate.style}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Premium</span>
                    <span className={`font-medium ${previewTemplate.premium ? 'text-yellow-600' : 'text-green-600'}`}>
                      {previewTemplate.premium ? 'Premium' : 'Free'}
                    </span>
                  </div>
                  {previewTemplate.recommendedFor && (
  <div className="space-y-4">
    {/* Recommended For */}
    <div className="py-2 border-b border-gray-100 dark:border-gray-700">
      <span className="text-gray-600 dark:text-gray-400 block mb-2 font-medium">Recommended For</span>
      <div className="flex flex-wrap gap-1">
        {previewTemplate.recommendedFor.slice(0, 5).map((purpose) => (
          <span
            key={purpose}
            className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full"
          >
            {purpose}
          </span>
        ))}
      </div>
    </div>

    {/* Tags */}
    {previewTemplate.tags && previewTemplate.tags.length > 0 && (
      <div className="py-2 border-b border-gray-100 dark:border-gray-700">
        <span className="text-gray-600 dark:text-gray-400 block mb-2 font-medium">Tags</span>
        <div className="flex flex-wrap gap-1">
          {previewTemplate.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Ideal For */}
    {previewTemplate.idealFor && previewTemplate.idealFor.length > 0 && (
      <div className="py-2 border-b border-gray-100 dark:border-gray-700">
        <span className="text-gray-600 dark:text-gray-400 block mb-2 font-medium">Ideal For</span>
        <div className="flex flex-wrap gap-1">
          {previewTemplate.idealFor.slice(0, 4).map((role) => (
            <span
              key={role}
              className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full"
            >
              {role}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Features */}
    {previewTemplate.features && previewTemplate.features.length > 0 && (
      <div className="py-2 border-b border-gray-100 dark:border-gray-700">
        <span className="text-gray-600 dark:text-gray-400 block mb-2 font-medium">Key Features</span>
        <div className="space-y-1">
          {previewTemplate.features.slice(0, 4).map((feature, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Usage Count (if available) */}
    {previewTemplate.usageCount !== undefined && (
      <div className="py-2 border-b border-gray-100 dark:border-gray-700">
        <span className="text-gray-600 dark:text-gray-400 block mb-1 font-medium">Popularity</span>
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Used by {previewTemplate.usageCount}+ users
          </span>
        </div>
      </div>
    )}

    {/* Featured/Popular Badges */}
    <div className="flex flex-wrap gap-2 pt-2">
      {previewTemplate.isFeatured && (
        <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full font-medium">
          ⭐ Featured
        </span>
      )}
      {previewTemplate.isPopular && (
        <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full font-medium">
          🔥 Popular
        </span>
      )}
    </div>
  </div>
)}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Layout className="w-5 h-5 text-purple-600" />
                  Layout Structure
                </h4>
                
                <div className="space-y-3 max-h-100 overflow-y-auto">
                  {Object.entries(structure).map(([key, value]) => (
                    value !== undefined && (
                      <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400 capitalize text-sm">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-medium capitalize text-sm">
                          {String(value)}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Same exact styling */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setPreviewTemplate(null)}
              className="flex-1"
            >
              Close Preview
            </Button>
            <Button
              onClick={() => {
                handleTemplateSelect(previewTemplate);
                setPreviewTemplate(null);
              }}
              disabled={isApplying || !coverLetter?.id}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Applying...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Apply Template
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
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
            <span className="text-gray-600 dark:text-gray-400">Loading templates...</span>
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
          <p className="text-lg font-medium mb-2">No templates available</p>
          <p className="text-sm">Please try again later or contact support.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="template">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Layout className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t`Templates`}</h2>
          <Wifi className="w-4 h-4 text-green-500" />
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            {coverLetter?.layout ? `Current: ${templates.find(t => t.layout === coverLetter.layout)?.name || coverLetter.layout}` : 'No template selected'}
          </div>
        </div>
      </div>

      {/* Current Category Info */}
      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Showing templates for your letter type
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 capitalize">
              {currentCoverLetterCategory}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Only templates specifically designed for {currentCoverLetterCategory.toLowerCase()} are shown
            </div>
          </div>
        </div>
      </div>

      {/* Template Count */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available for {currentCoverLetterCategory.toLowerCase()}
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="mb-4">
            <Layout className="w-16 h-16 mx-auto text-gray-400 mb-3" />
            <div className="font-medium text-gray-600 dark:text-gray-400 text-lg mb-2">
              No templates found for "{currentCoverLetterCategory}"
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
            There are no templates specifically designed for {currentCoverLetterCategory.toLowerCase()} letters yet.
            Our team is working on adding more templates for this category.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Contact support to request templates for this category')}
          >
            Request Templates
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className={`relative p-4 border rounded-xl cursor-pointer transition-all duration-200 group ${
                  coverLetter?.layout === template.layout
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800 shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-lg bg-white dark:bg-gray-800'
                } ${isApplying ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isApplying && handleTemplateSelect(template)}
              >
                {/* Premium Badge */}
                {template.premium && (
                  <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Premium</span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="font-semibold text-gray-900 dark:text-white truncate text-lg">
                      {template.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(template);
                      }}
                      className="h-8 w-8 p-0 bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                      title="Preview Template"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {coverLetter?.layout === template.layout && (
                      <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 leading-relaxed">
                  {template.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full capitalize font-medium">
                    {template.category}
                  </span>
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full capitalize">
                    {template.style}
                  </span>
                </div>

                {template.recommendedFor?.slice(0, 1).map((purpose) => (
                  <div
                    key={purpose}
                    className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded border border-green-200 dark:border-green-800"
                  >
                    Ideal for: {purpose}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/10 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              💡 All templates shown are specifically designed for {currentCoverLetterCategory.toLowerCase()} letters. 
              Click the eye icon to preview, or click the template card to apply.
            </p>
          </div>
        </>
      )}

      {/* Preview Modal */}
      <TemplatePreviewModal />
    </section>
  );
};

export type { CoverLetterTemplate, TemplateStructure };