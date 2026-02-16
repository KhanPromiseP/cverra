import { t } from "@lingui/macro";
import { sortByDate } from "@reactive-resume/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, FileText, FolderOpen, RefreshCcw } from "lucide-react";
import { Button } from "@reactive-resume/ui";
import { useState } from "react";
import { toast } from "sonner";

import { useResumes } from "@/client/services/resume";

import { CreateResumeListItem } from "./_components/create-item";
import { ImportResumeListItem } from "./_components/import-item";
import { AIBuilderCard } from "./_components/ai-builder-item";
import { ResumeListItem } from "./_components/resume-item";

export const ListView = () => {
  const { resumes, loading, refetch } = useResumes();
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    
    try {
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
    <div className="space-y-8 pb-[100px]">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div>
          <h2 className="">
            {t`Start Building Your Career Success with Inlirah Resume Builder`}
          </h2>
          <p className="text-gray-600 text-lg dark:text-gray-400">
            {t`Craft standout resumes that get noticed by recruiters in no time. Choose your starting point-create from scratch, import, or let our smart model build from your existing docs/pdf or text.`}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="group"
          >
            <CreateResumeListItem />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="group"
          >
            <ImportResumeListItem />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="group"
          >
            <AIBuilderCard />
          </motion.div>
        </div>
      </motion.div>

      {/* Resume List Section */}
      <div className="space-y-6">
        {/* Section Header with Refresh Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t`Your Resumes`}
                {showResumes && (
                  <span className="ml-2 text-sm font-normal bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground px-2 py-1 rounded-full">
                    {resumes.length}
                  </span>
                )}
              </h3>
              
              {/* Refresh Button */}
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
                  <RefreshCcw 
                    className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                  />
                  {refreshing ? t`Refreshing...` : t`Refresh`}
                </Button>
              </motion.div>
            </div>
            
            {showResumes && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t`Sorted by recently updated`}
              </p>
            )}
          </div>

          {showResumes && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <button 
                onClick={handleRefresh}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm font-medium flex items-center gap-1"
              >
                <RefreshCcw className="w-3 h-3" />
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
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="animate-pulse"
              >
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-100/50 to-gray-100/30 dark:from-gray-900/50 dark:to-gray-800/30 p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <div className="h-8 w-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {showEmptyState && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900/30"
          >
            <div className="mx-auto max-w-md">
              <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-6">
                <FolderOpen className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl flex justify-center font-semibold text-gray-900 dark:text-white mb-3">
                {t`No resumes yet`}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t`Start building your career journey with Inlirah. Create, import, or let our smart model build your first professional resume from your existing docs/pdf or text.`}
              </p>
              
              <div className="flex flex-col items-center gap-3 mb-6">
                <Button 
                  onClick={handleRefresh} 
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCcw className="w-4 h-4" />
                  {t`Check for resumes`}
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t`Click refresh if you just created a resume and don't see it here`}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                <motion.div
                  className="w-auto"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <CreateResumeListItem compact />
                </motion.div>

                <motion.div
                  className="w-auto"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <ImportResumeListItem compact />
                </motion.div>

                <motion.div
                  className="w-auto"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <AIBuilderCard compact />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Resume List */}
        {showResumes && (
          <AnimatePresence mode="wait">
            <motion.div className="space-y-3">
              {resumes
                .sort((a, b) => sortByDate(a, b, "updatedAt"))
                .map((resume, index) => (
                  <motion.div
                    key={resume.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 100
                    }}
                    layout
                    className="group"
                  >
                    <ResumeListItem resume={resume} />
                  </motion.div>
                ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Bottom Stats */}
      {showResumes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800"
        >
          <div className="flex flex-wrap items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>{t`Last updated: Just now`}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>{t`${resumes.length} total resumes`}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <button 
                onClick={handleRefresh}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm font-medium flex items-center gap-1"
              >
                <RefreshCcw className="w-3 h-3" />
                {t`Refresh list`}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};