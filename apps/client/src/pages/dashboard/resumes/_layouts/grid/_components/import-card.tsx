import { t, Trans } from "@lingui/macro";
import { DownloadSimple } from "@phosphor-icons/react";
import { KeyboardShortcut } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { motion } from "framer-motion";

import { useDialog } from "@/client/stores/dialog";

import { BaseCard } from "./base-card";

interface ImportResumeCardProps {
  compact?: boolean;
}

export const ImportResumeCard = ({ compact = false }: ImportResumeCardProps) => {
  const { open } = useDialog("import");

  const handleClick = () => {
    open("create");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "group relative h-full cursor-pointer overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800",
        "border border-gray-200/50 dark:border-gray-700/50",
        "shadow-sm hover:shadow-xl transition-shadow duration-300",
        compact ? "aspect-[4/3]" : "aspect-[3/4]"
      )}
      onClick={handleClick}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-green-400/0 to-green-600/0 transition-all duration-500 group-hover:from-green-500/10 group-hover:via-green-400/5 group-hover:to-green-600/10" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-green-500/20"
            initial={{ y: "100%", x: `${20 + i * 30}%` }}
            animate={{ y: "-100%" }}
            transition={{
              duration: 2 + i,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center p-6">
        {/* Animated icon */}
        <motion.div
          className="relative mb-6"
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
            <DownloadSimple size={28} weight="bold" className="text-white" />
          </div>
        </motion.div>

        {/* Text */}
        <div className="text-center">
          <h4 className="text-xl font-bold text-gray-900 dark:text-white">
            {t`Import Resume`}
          </h4>
          <p className="mt-2 text-sm text-gray-900 dark:text-gray-200">
            {t`Upload and edit existing resumes`}
          </p>
        </div>

        {/* Feature tags */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {t`LinkedIn`}
          </span>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {t`JSON Resume`}
          </span>
        </div>

        {/* Import Button */}
        <button className="mt-12 relative rounded-full bg-gradient-to-b from-green-500 to-green-700 px-7 py-2 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl active:translate-y-[1px] active:shadow-md dark:from-green-600 dark:to-green-800">
          <span className="relative z-10 flex items-center justify-center gap-2">
            {t`Import Now`}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </span>
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-50" />
        </button>

        {/* Quick action indicator */}
        <motion.div
          className="mt-8"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <KeyboardShortcut className="rounded-full bg-gray-900/10 px-4 py-2 text-xs font-semibold text-gray-700 backdrop-blur-sm dark:bg-white/10 dark:text-gray-200">
            {t`Click or press ⌘I`}
          </KeyboardShortcut>
        </motion.div>

        {/* Supported formats */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t`Supports: JSON, LinkedIn`}
          </p>
        </div>

        {/* Hover indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="h-1 w-8 rounded-full bg-gray-300 transition-all group-hover:w-16 group-hover:bg-green-500 dark:bg-gray-600" />
        </div>
      </div>

      {/* Glass effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/80 to-transparent backdrop-blur-[1px] dark:from-gray-900/80" />
    </motion.div>
  );
};

