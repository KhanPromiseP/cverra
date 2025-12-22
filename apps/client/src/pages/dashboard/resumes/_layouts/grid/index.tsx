import { sortByDate } from "@reactive-resume/utils";
import { motion } from "framer-motion";

import { useResumes } from "@/client/services/resume";

import { BaseCard } from "./_components/base-card";
import { CreateResumeCard } from "./_components/create-card";
import { ImportResumeCard } from "./_components/import-card";
import { ResumeCard } from "./_components/resume-card";

export const GridView = () => {
  const { resumes, loading } = useResumes();

  return (
    <div className="space-y-8">
      {/* Action Buttons Section - Separated from resumes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Start Building Your Career Success
          </h2>
          <p className="text-gray-600 text-lg dark:text-gray-400">
            Craft standout resumes that get noticed by recruiters in no time. Choose your starting point—create from scratch or import existing resumes to enhance.
          </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CreateResumeCard />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <ImportResumeCard />
          </motion.div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Your Resumes
            {resumes && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({resumes.length})
              </span>
            )}
          </h2>
          
          {resumes && resumes.length > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Sorted by recently updated
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
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

        {/* Resumes Grid */}
        {!loading && resumes && (
          <>
            {resumes.length === 0 ? (
              // Empty State
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
                    No resumes yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Get started by creating your first resume or importing an existing one
                  </p>
                </div>
              </div>
            ) : (
              // Resumes Grid
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                layout
              >
                {resumes
                  .sort((a, b) => sortByDate(a, b, "updatedAt"))
                  .map((resume, index) => (
                    <motion.div
                      key={resume.id}
                      layoutId={`resume-${resume.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        duration: 0.2,
                        delay: index * 0.05 
                      }}
                    >
                      <ResumeCard resume={resume} />
                    </motion.div>
                  ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};