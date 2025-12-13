// client/components/cover-letter/sidebars/sections/information.tsx
import { Info, Calendar, User, Hash, FileText, Clock, RefreshCw, Layers, Tag } from "lucide-react";
import { useCoverLetterStore } from "../../../../../stores/cover-letter";
import { useState, useEffect } from 'react';

interface InformationSectionProps {
  disabled?: boolean;
}

export const InformationSection = ({ disabled = false }: InformationSectionProps) => {
  const { coverLetter } = useCoverLetterStore();
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('');

 
  // Get category with better fallback logic
  const getCategoryDisplay = () => {
    if (!coverLetter) return 'General Letter';
    
    // Try multiple ways to get the category
    const category = 
      (coverLetter as any).category || // Direct access
      (coverLetter as any).userData?.category || // Check userData
      (coverLetter as any).jobData?.category || // Check jobData
      undefined;
    
    console.log('📋 Category found:', category);
    
    if (category) {
      return category.includes('Letter') ? category : `${category} Letter`;
    }
    
    // Try to infer from title
    const title = coverLetter.title?.toLowerCase() || '';
    if (title.includes('job') || title.includes('application')) return 'Job Application Letter';
    if (title.includes('internship')) return 'Internship Application Letter';
    if (title.includes('scholarship')) return 'Scholarship Request Letter';
    if (title.includes('business')) return 'Business Partnership Letter';
    
    return 'General Letter';
  };

  // Calculate real-time information
  const info = {
    id: coverLetter?.id ? `CL-${coverLetter.id.slice(-8).toUpperCase()}` : 'N/A',
    title: coverLetter?.title || 'Untitled Cover Letter',
    style: coverLetter?.style || 'Professional',
    layout: coverLetter?.layout || 'Standard',
    category: getCategoryDisplay(),
    created: coverLetter?.createdAt ? 
      new Date(coverLetter.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Not created yet',
    
    updated: coverLetter?.updatedAt ? 
      new Date(coverLetter.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Never',
 
    status: coverLetter?.id ? 'Saved' : 'Draft',
    blockCount: coverLetter?.content?.blocks?.length || 0,
    filledBlocks: coverLetter?.content?.blocks?.filter((block: any) => 
      block.content && block.content.toString().trim().length > 0
    ).length || 0
  };

  // Calculate time since last update
  useEffect(() => {
    const updateTimeSince = () => {
      if (!coverLetter?.updatedAt) {
        setTimeSinceUpdate('');
        return;
      }

      const updated = new Date(coverLetter.updatedAt).getTime();
      const now = Date.now();
      const diffInMinutes = Math.floor((now - updated) / (1000 * 60));
      
      if (diffInMinutes < 1) {
        setTimeSinceUpdate('Just now');
      } else if (diffInMinutes < 60) {
        setTimeSinceUpdate(`${diffInMinutes}m ago`);
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        setTimeSinceUpdate(`${hours}h ago`);
      } else {
        const days = Math.floor(diffInMinutes / 1440);
        setTimeSinceUpdate(`${days}d ago`);
      }
    };

    updateTimeSince();
    const interval = setInterval(updateTimeSince, 60000);

    return () => clearInterval(interval);
  }, [coverLetter?.updatedAt]);

  const hasCoverLetter = !!coverLetter;
  const rawCategory = coverLetter ? (coverLetter as any).category : undefined;

  return (
    <section id="information">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Information</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Cover letter details & metadata</p>
        </div>
      </div>

      {!hasCoverLetter ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Create a cover letter to see information</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Document Identity */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Document Identity
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">ID:</span>
                <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                  {info.id}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`text-sm font-medium ${
                  info.status === 'Saved' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {info.status}
                </span>
              </div>
              
              {/* Category Display */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {info.category}
                  
                </span>
              </div>
            </div>
          </div>

          {/* Rest of your component... */}
          
          {/* Technical Details */}
          {coverLetter?.id && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Document ID:</span>
                  <span className="font-mono">{coverLetter.id}</span>
                </div>
               
                <div className="flex justify-between">
                  <span>Content Type:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {info.category}
                  </span>
                </div>

                
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};