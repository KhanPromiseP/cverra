import { t, Trans } from "@lingui/macro";
import { sortByDate } from "@reactive-resume/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, FileText, FolderOpen, PlusCircle, Upload } from "lucide-react";

import { useResumes } from "@/client/services/resume";

import { BaseListItem } from "./_components/base-item";
import { CreateResumeListItem } from "./_components/create-item";
import { ImportResumeListItem } from "./_components/import-item";
import { AIBuilderCard } from "./_components/ai-builder-item";
import { ResumeListItem } from "./_components/resume-item";


export const ListView = () => {
  const { resumes, loading } = useResumes();

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
            {t`Start Building Your Career Success with Cverra Resume Builder`}
          </h2>
          <p className="text-gray-600 text-lg dark:text-gray-400">
            {t`Craft standout resumes that get noticed by recruiters in no time. Choose your starting point-create from scratch or import existing resumes to enhance.`}
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
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t`Your Resumes`}
              {resumes && (
                <span className="ml-2 text-sm font-normal bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground px-2 py-1 rounded-full">
                  {resumes.length}
                </span>
              )}
            </h3>
            {resumes && resumes.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t`Sorted by recently updated`}
              </p>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
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
        {!loading && resumes && resumes.length === 0 && (
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
              <p className="tflex justify-center ext-gray-600 dark:text-gray-400 mb-8">
                {t`Start building your career journey with Cverra. Create your first professional resume or import an existing one.`}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <CreateResumeListItem />
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <ImportResumeListItem />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Resume List */}
        {!loading && resumes && resumes.length > 0 && (
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
      {!loading && resumes && resumes.length > 0 && (
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
            
          </div>
        </motion.div>
      )}
    </div>
  );
};