import { t } from "@lingui/macro";
import { ArrowRight, Sparkle, FileText, Palette, Globe, Share, MagicWand, Download, Eye, Layout } from "@phosphor-icons/react";
import { buttonVariants, Badge } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { motion } from "framer-motion";
import { Link } from "react-router";

export const ResumeSection = () => (
  <section id="resumes" className="relative py-20 lg:py-32 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
    {/* Background Elements */}
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"
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
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"
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

    <div className="relative max-w-7xl mx-auto px-6">
      {/* Section Header */}
      <div className="text-center max-w-4xl mx-auto mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex mb-6"
        >
          <Badge 
            variant="secondary" 
            className="text-base font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-full"
          >
            <FileText className="w-4 h-4 mr-2" weight="fill" />
            {t`Resume Builder`}
          </Badge>
        </motion.div>

        <motion.h2
          className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="block text-gray-900 dark:text-white">
            {t`Build Resumes That`}
          </span>
          <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t`Stand Out & Get Noticed`}
          </span>
        </motion.h2>

        <motion.p
          className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {t`Unleash your creativity with complete design freedom, AI-powered enhancements, and professional templates that make your resume impossible to ignore.`}
        </motion.p>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
        {/* Left Column - Features */}
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Feature 1 - Complete Design Freedom */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <Layout className="w-6 h-6 text-white" weight="fill" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Complete Design Freedom
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add custom sections, manipulate colors, and decide exactly where everything stands. Full control over every element of your resume's layout and design.
              </p>
            </div>
          </div>

          {/* Feature 2 - AI Enhancement */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <MagicWand className="w-6 h-6 text-white" weight="fill" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                AI-Powered Enhancement
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enhance any section with AI. Get professional wording suggestions, optimize for ATS systems, and make your achievements shine with multiple enhancement options.
              </p>
            </div>
          </div>

          {/* Feature 3 - Premium Templates */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Palette className="w-6 h-6 text-white" weight="fill" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                12+ Premium Templates
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose from professionally designed templates for every industry. Modern, creative, executive, and minimalist styles to match your personality and career goals.
              </p>
            </div>
          </div>

          {/* Feature 4 - Host & Share */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" weight="fill" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Instant Hosting & Sharing
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Host your resume directly from the editor and get a shareable link. Track views and downloads. Export to PDF, json, or share online with one click.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Column - Visual Demo */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            {/* Resume Preview */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
                  <div>
                    <div className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
                    <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded"></div>
                  <div className="w-6 h-6 bg-purple-500 rounded"></div>
                  <div className="w-6 h-6 bg-indigo-500 rounded"></div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="h-20 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"></div>
                <div className="h-20 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"></div>
              </div>
            </div>

            {/* Floating Action Buttons */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                <Eye className="w-4 h-4" />
                Live Preview
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm font-semibold text-white">
                <Download className="w-4 h-4" />
                Export PDF
              </div>
            </div>
          </div>

          {/* Floating AI Badge */}
          <motion.div
            className="absolute -top-4 -right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2"
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkle className="w-4 h-4" weight="fill" />
            AI Enhanced
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-12 text-white shadow-2xl">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Create Your Standout Resume?
          </h3>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who landed their dream jobs with Cverra-powered resumes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard/resumes"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-2xl shadow-lg"
              )}
            >
              <FileText className="w-5 h-5 mr-2" />
              Start Building
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <button className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-2xl border border-white/30 transition-all duration-300">
              View Templates
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);