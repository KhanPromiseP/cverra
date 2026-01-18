// client/components/dashboard/_components/ai-builder-card.tsx
import { t } from "@lingui/macro";
import { Sparkle, FileText, FilePdf, FileDoc, Upload, Coins } from "@phosphor-icons/react";
import { Card, CardContent, Badge, Button } from "@reactive-resume/ui";
import { motion } from "framer-motion";
import { useState } from "react";

import { AIResumeUploadModal } from "../../../../../../components/modals/ai-resume-upload-modal";

interface AIBuilderCardProps {
  compact?: boolean;
}

export const AIBuilderCard = ({ compact = false }: AIBuilderCardProps) => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          "group relative h-full cursor-pointer overflow-hidden rounded-2xl",
          "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
          "border-2 border-dashed border-purple-200 dark:border-purple-700",
          "shadow-sm hover:shadow-xl transition-all duration-300",
          compact ? "aspect-[4/3]" : "aspect-[3/4]"
        )}
        onClick={() => setUploadModalOpen(true)}
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-pink-400/0 to-blue-600/0 transition-all duration-500 group-hover:from-purple-500/10 group-hover:via-pink-400/5 group-hover:to-blue-600/10" />
        
        {/* Floating AI particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30"
              initial={{ y: "100%", x: `${10 + i * 20}%` }}
              animate={{ y: "-100%" }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "linear"
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center p-6">
          {/* Animated AI icon */}
          <motion.div
            className="relative mb-6"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Sparkle size={32} weight="fill" className="text-white" />
            </div>
            
            {/* Orbiting file icons */}
            {['FileText', 'FilePdf', 'FileDoc'].map((icon, i) => (
              <motion.div
                key={icon}
                className="absolute"
                style={{
                  top: '50%',
                  left: '50%',
                }}
                animate={{
                  x: Math.cos((i * 120 * Math.PI) / 180) * 60 - 20,
                  y: Math.sin((i * 120 * Math.PI) / 180) * 60 - 20,
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg">
                  {icon === 'FileText' && <FileText size={16} className="text-purple-600" />}
                  {icon === 'FilePdf' && <FilePdf size={16} className="text-red-600" />}
                  {icon === 'FileDoc' && <FileDoc size={16} className="text-blue-600" />}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Text */}
          <div className="text-center">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">
              {t`AI Resume Builder`}
            </h4>
            <p className="mt-2 text-sm text-gray-900 dark:text-gray-200">
              {t`Upload a document to pre-fill your resume`}
            </p>
            
            {/* Cost badge */}
            {/* <div className="mt-3">
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 gap-1">
                <Coins size={12} />
                {t`From 30 coins`}
              </Badge>
            </div> */}
          </div>

          {/* Supported formats */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 flex items-center gap-1">
              <FileText size={10} />
              {t`Text`}
            </span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300 flex items-center gap-1">
              <FilePdf size={10} />
              {t`PDF`}
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 flex items-center gap-1">
              <FileDoc size={10} />
              {t`DOC`}
            </span>
          </div>

          {/* CTA Button */}
          <button className="mt-12 relative rounded-full bg-gradient-to-b from-purple-600 to-pink-600 px-7 py-2 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl active:translate-y-[1px] active:shadow-md dark:from-purple-700 dark:to-pink-700">
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Upload size={18} />
              {t`Build with AI`}
            </span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-50" />
          </button>

          {/* Features */}
          <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span>{t`Smart Parsing`}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span>{t`AI Enhancement`}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span>{t`Instant Editing`}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span>{t`Ready in 30s`}</span>
            </div>
          </div>

          {/* Hover indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="h-1 w-8 rounded-full bg-purple-300 transition-all group-hover:w-16 group-hover:bg-pink-500 dark:bg-purple-600" />
          </div>
        </div>

        {/* Glass effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/80 to-transparent backdrop-blur-[1px] dark:from-gray-900/80" />
      </motion.div>

      <AIResumeUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
    </>
  );
};

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}