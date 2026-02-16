// import { t, Trans } from "@lingui/macro";
// import { sortByDate } from "@reactive-resume/utils";
// import { motion } from "framer-motion";

// import { useResumes } from "@/client/services/resume";

// import { BaseCard } from "./_components/base-card";
// import { CreateResumeCard } from "./_components/create-card";
// import { ImportResumeCard } from "./_components/import-card";
// import { ResumeCard } from "./_components/resume-card";

// export const GridView = () => {
//   const { resumes, loading } = useResumes();

//   return (
//     <div className="space-y-6 pb-6">
//       {/* Action Buttons Section - With constrained sizing */}
//       <div className="space-y-4">
//         <div>
//           <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
//             {t`Start Building Your Career Success with Inlirah Resume Builder`}
//           </h2>
//           <p className="text-gray-600 text-sm md:text-base dark:text-gray-400 mt-2">
//             {t`Craft standout resumes that get noticed by recruiters in no time. Choose your starting point-create from scratch or import existing resumes to enhance.`}
//           </p>
//         </div>
        
//         {/* Constrained action cards container */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-4xl">
//           <motion.div
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.2 }}
//             className="h-full"
//           >
//             {/* Add max-height constraint to CreateResumeCard if needed */}
//             <div className="h-full">
//               <CreateResumeCard />
//             </div>
//           </motion.div>
          
//           <motion.div
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.2, delay: 0.05 }}
//             className="h-full"
//           >
//             <div className="h-full">
//               <ImportResumeCard />
//             </div>
//           </motion.div>
//         </div>
//       </div>

//       {/* Divider */}
//       <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
//         <div className="flex items-center justify-between mb-6">
//           <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
//             {t`Your Resumes`}
//             {resumes && (
//               <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
//                 ({resumes.length})
//               </span>
//             )}
//           </h2>
          
//           {resumes && resumes.length > 0 && (
//             <div className="text-sm text-gray-500 dark:text-gray-400">
//               {t`Sorted by recently updated`}
//             </div>
//           )}
//         </div>

//         {/* Loading State */}
//         {loading && (
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
//             {Array.from({ length: 6 }).map((_, i) => (
//               <div
//                 key={i}
//                 className="animate-pulse"
//               >
//                 <div className="h-64 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900" />
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Resumes Grid */}
//         {!loading && resumes && (
//           <>
//             {resumes.length === 0 ? (
//               // Empty State
//               <div className="text-center py-12 px-4">
//                 <div className="mx-auto max-w-md">
//                   <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
//                     <svg 
//                       className="h-8 w-8 text-gray-400 dark:text-gray-500" 
//                       fill="none" 
//                       viewBox="0 0 24 24" 
//                       stroke="currentColor"
//                     >
//                       <path 
//                         strokeLinecap="round" 
//                         strokeLinejoin="round" 
//                         strokeWidth={1.5} 
//                         d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" 
//                       />
//                     </svg>
//                   </div>
//                   <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
//                     {t`No resumes yet`}
//                   </h3>
//                   <p className="text-gray-600 dark:text-gray-400 mb-6">
//                     {t`Start building your career journey with Inlirah. Create your first professional resume or import an existing one.`}
//                   </p>
//                 </div>
//               </div>
//             ) : (
//               // Resumes Grid
//               <motion.div 
//                 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
//                 layout
//               >
//                 {resumes
//                   .sort((a, b) => sortByDate(a, b, "updatedAt"))
//                   .map((resume, index) => (
//                     <motion.div
//                       key={resume.id}
//                       layoutId={`resume-${resume.id}`}
//                       initial={{ opacity: 0, scale: 0.95 }}
//                       animate={{ opacity: 1, scale: 1 }}
//                       transition={{ 
//                         duration: 0.2,
//                         delay: index * 0.05 
//                       }}
//                     >
//                       <ResumeCard resume={resume} />
//                     </motion.div>
//                   ))}
//               </motion.div>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

import { t } from "@lingui/macro";
import { sortByDate } from "@reactive-resume/utils";
import { motion } from "framer-motion";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { Button } from "@reactive-resume/ui";
import { useState, useEffect } from "react";
import { toast } from "sonner"; // Direct import for better reliability

import { useResumes } from "@/client/services/resume";

import { CreateResumeCard } from "./_components/create-card";
import { ImportResumeCard } from "./_components/import-card";
import { AIBuilderCard } from "./_components/ai-builder-card";
import { ResumeCard } from "./_components/resume-card";

export const GridView = () => {
  const { resumes, loading, refetch } = useResumes(); 
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('GridView state:', { 
      resumes: resumes?.length, 
      loading, 
      hasResumes: !!resumes 
    });
  }, [resumes, loading]);

  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    
    try {
      // Simple refetch without complex options
      await refetch();
      
      // Show success animation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
      
      // Show success toast
      toast.success(t`Resumes refreshed!`, {
        description: t`List updated with your resumes`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error refreshing resumes:', error);
      toast.error(t`Refresh failed`, {
        description: t`Please try again in a moment`,
        duration: 4000,
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Determine what to show
  const showLoading = loading && !refreshing;
  const showResumes = !loading && resumes && resumes.length > 0;
  const showEmptyState = !loading && (!resumes || resumes.length === 0);

  return (
    <div className="space-y-6 pb-6">
      {/* Action Buttons Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t`Start Building Your Career Success with Inlirah Resume Builder`}
          </h2>
          <p className="text-gray-600 text-sm md:text-base dark:text-gray-400 mt-2">
            {t`Craft standout resumes that get noticed by recruiters in no time. Choose your starting point-create from scratch, import, or let our smart model build from your existing docs/pdf or text.`}
          </p>
        </div>
        
        {/* Action cards container */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <CreateResumeCard />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="h-full"
          >
            <ImportResumeCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="h-full"
          >
            <AIBuilderCard />
          </motion.div>
        </div>
      </div>

      {/* Your Resumes Section */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t`Your Resumes`}
              {showResumes && (
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({resumes.length})
                </span>
              )}
            </h2>
            
            {/* Refresh Button - Always show */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                variant="outline"
                size="sm"
                className={`gap-2 transition-all duration-300 relative ${
                  showSuccess 
                    ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
                    : 'border-blue-200 hover:bg-blue-50 hover:border-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/20'
                }`}
              >
                {showSuccess && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ✓
                  </motion.div>
                )}
                <ArrowsClockwise 
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                />
                {refreshing ? t`Refreshing...` : t`Refresh`}
              </Button>
            </motion.div>
          </div>
          
          {showResumes && (
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span>{t`Sorted by recently updated`}</span>
              <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></div>
              <button 
                onClick={handleRefresh}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-xs font-medium"
              >
                {t`Sync now`}
              </button>
            </div>
          )}
        </div>

        {/* Refresh Status Indicator */}
        {refreshing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                {t`Fetching latest resumes from server...`}
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {showLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
              >
                <div className="h-64 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {showEmptyState && (
          <div className="text-center py-12 px-4">
            <div className="mx-auto max-w-md">
              <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg 
                  className="h-8 w-8 text-gray-400 dark:text-gray-500" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t`No resumes yet`}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t`Start building your career journey with Inlirah. Create, import, or let our smart model build your first professional resume.`}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
                  <ArrowsClockwise className="w-4 h-4" />
                  {t`Check for resumes`}
                </Button>
                <Button onClick={() => window.location.href = '/dashboard/resumes/create'} size="sm">
                  {t`Create Your First Resume`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Resumes Grid - Only show when we have resumes */}
        {showResumes && (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
            layout
          >
            {resumes
              .sort((a, b) => sortByDate(a, b, "updatedAt"))
              .map((resume, index) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    transition: { 
                      duration: 0.2,
                      delay: index * 0.05 
                    }
                  }}
                >
                  <ResumeCard resume={resume} />
                </motion.div>
              ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};