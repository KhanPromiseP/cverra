import { t } from "@lingui/macro";
import { ArrowRight, Sparkle, FileText, Palette, Globe, Share, MagicWand, Download, Eye, Layout } from "@phosphor-icons/react";
import { buttonVariants, Badge } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { motion } from "framer-motion";
import { Link } from "react-router";

// Add interface for props
interface ResumeSectionProps {
  onViewTemplates?: () => void;
}

export const ResumeSection = ({ onViewTemplates }: ResumeSectionProps) => (
  <section id="resumes" className="relative py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
    {/* Background Elements - Mobile Optimized */}
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-20 -right-20 sm:-top-32 sm:-right-32 md:-top-40 md:-right-40 w-40 h-40 sm:w-60 sm:h-60 md:w-80 md:h-80 bg-blue-500/5 rounded-full blur-2xl sm:blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 sm:-bottom-32 sm:-left-32 md:-bottom-40 md:-left-40 w-40 h-40 sm:w-60 sm:h-60 md:w-80 md:h-80 bg-purple-500/5 rounded-full blur-2xl sm:blur-3xl"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
    </div>

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16 md:mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-50px" }}
          className="inline-flex mb-4 sm:mb-6"
        >
          <Badge 
            variant="secondary" 
            className="text-sm sm:text-base font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full"
          >
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" weight="fill" />
            {t`Resume Builder`}
          </Badge>
        </motion.div>

        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold sm:font-extrabold lg:font-black tracking-tight mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <span className="block text-gray-900 dark:text-white">
            {t`Build Resumes That`}
          </span>
          <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t`Stand Out & Get Noticed`}
          </span>
        </motion.h2>

        <motion.p
          className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          {t`Unleash your creativity with complete design freedom, AI-powered enhancements, and professional templates that make your resume impossible to ignore.`}
        </motion.p>
      </div>

      {/* Main Content Grid - Stack on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center mb-12 sm:mb-16 md:mb-20">
        {/* Left Column - Features */}
        <motion.div
          className="space-y-6 sm:space-y-8 order-2 lg:order-1"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          {/* Feature 1 - Complete Design Freedom */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-0">
            <div className="flex-shrink-0 self-start sm:self-auto">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <Layout className="w-5 h-5 sm:w-6 sm:h-6 text-white" weight="fill" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t`Complete Design Freedom`}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                {t`Add custom sections, manipulate colors, and decide exactly where everything stands. Full control over every element of your resume's layout and design.`}
              </p>
            </div>
          </div>

          {/* Feature 2 - AI Enhancement */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-0">
            <div className="flex-shrink-0 self-start sm:self-auto">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <MagicWand className="w-5 h-5 sm:w-6 sm:h-6 text-white" weight="fill" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t`AI-Powered Enhancement`}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                {t`Enhance any section with AI. Get professional resumes crafting and instant translation to choice language, optimize for ATS systems, and make your achievements shine with multiple enhancement options.`}
              </p>
            </div>
          </div>

          {/* Feature 3 - Premium Templates */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-0">
            <div className="flex-shrink-0 self-start sm:self-auto">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <Palette className="w-5 h-5 sm:w-6 sm:h-6 text-white" weight="fill" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t`Premium Templates`}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                {t`Choose from professionally designed templates for every industry. Modern, creative, executive, and minimalist styles to match your personality and career goals.`}
              </p>
            </div>
          </div>

          {/* Feature 4 - Host & Share */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-0">
            <div className="flex-shrink-0 self-start sm:self-auto">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" weight="fill" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t`Instant Hosting & Sharing`}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                {t`Host your resume directly from the editor and get a shareable link. Track views and downloads. Export to PDF, json, or share online with one click.`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Column - Visual Demo */}
        <motion.div
          className="relative order-1 lg:order-2 mb-8 sm:mb-0"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl sm:shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            {/* Resume Preview */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-600/50">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
                  <div>
                    <div className="h-2.5 sm:h-3 w-16 sm:w-24 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
                    <div className="h-2 w-12 sm:w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="flex gap-1.5 sm:gap-2">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-blue-500 rounded"></div>
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-purple-500 rounded"></div>
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-indigo-500 rounded"></div>
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-4">
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
              </div>

              <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                <div className="h-12 sm:h-16 md:h-20 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"></div>
                <div className="h-12 sm:h-16 md:h-20 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"></div>
              </div>
            </div>

            {/* Floating Action Buttons - Mobile Optimized */}
            <div className="absolute -bottom-3 sm:-bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 sm:gap-3 flex-wrap justify-center">
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-full px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                {t`Live Preview`}
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg rounded-full px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-white whitespace-nowrap">
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                {t`Export PDF`}
              </div>
            </div>
          </div>

          {/* Floating AI Badge - Mobile Responsive */}
          <motion.div
            className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg flex items-center gap-1 sm:gap-2 whitespace-nowrap"
            animate={{
              y: [0, -3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkle className="w-3 h-3 sm:w-4 sm:h-4" weight="fill" />
            {t`AI Enhanced`}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom CTA - Mobile Optimized */}
      <motion.div
        className="text-center px-2 sm:px-0"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        viewport={{ once: true, margin: "-50px" }}
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 text-white shadow-xl sm:shadow-2xl">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
            {t`Ready to Create Your Standout Resume?`}
          </h3>
          <p className="text-blue-100 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            {t`Join thousands of professionals who landed their dream jobs with Inrah-powered resumes.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
            <Link
              to="/dashboard/resumes"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-white text-blue-600 hover:bg-gray-100 font-semibold px-6 sm:px-8 py-3 rounded-xl sm:rounded-2xl shadow-lg w-full sm:w-auto flex items-center justify-center"
              )}
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              {t`Start Building`}
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            </Link>
            <button 
              onClick={onViewTemplates} 
              className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 sm:px-8 py-3 rounded-xl sm:rounded-2xl border border-white/30 transition-all duration-300 w-full sm:w-auto"
            >
              {t`View Templates`}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);