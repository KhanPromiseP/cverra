import { t } from "@lingui/macro";
import { ArrowRight, Sparkle, FileText, MagicWand, Download, Upload, Copy, Pencil, BookOpen, Target, Envelope } from "@phosphor-icons/react";
import { buttonVariants, Badge } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { useState } from "react";

export const LettersSection = () => {
  const [activeCategory, setActiveCategory] = useState('professional');

  const categories = [
    {
      id: 'professional',
      name: 'Job Applications',
      icon: FileText,
      description: 'Professional jobs, career changes, promotions',
      templates: 25
    },
    {
      id: 'internship',
      name: 'Internships',
      icon: BookOpen,
      description: 'Internship programs, entry-level positions',
      templates: 18
    },
    {
      id: 'business',
      name: 'Business Letters',
      icon: Target,
      description: 'Networking, proposals, professional correspondence',
      templates: 15
    },
    {
      id: 'personal',
      name: 'Personal Letters',
      icon: Envelope,
      description: 'Family, friends, recommendations, personal matters',
      templates: 12
    }
  ];

  const enhancementOptions = [
    {
      name: 'Professional Tone',
      description: 'Make it more formal and business-appropriate',
      icon: FileText
    },
    {
      name: 'Impact Enhancement',
      description: 'Strengthen achievements and impact statements',
      icon: MagicWand
    },
    {
      name: 'Custom Instructions',
      description: 'Provide specific enhancement guidelines',
      icon: Pencil
    }
  ];

  return (
    <section id="letters" className="relative py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 -right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
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
              className="text-base font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-4 py-2 rounded-full"
            >
              <Envelope className="w-4 h-4 mr-2" weight="fill" />
              {t`AI Letter Writer`}
            </Badge>
          </motion.div>

          <motion.h2
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="block text-gray-900 dark:text-white">
              {t`Perfect Letters Made`}
            </span>
            <span className="block mt-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {t`Simple & Fast`}
            </span>
          </motion.h2>

          <motion.p
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {t`Just tell us what you need - we handle the format and structure. Import from your resume or enter minimal details, and get a perfectly crafted letter in seconds.`}
          </motion.p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">
          {/* Left Column - Features & Process */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Category Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                What Do You Need to Write?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      activeCategory === category.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        activeCategory === category.id
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        <category.icon className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {category.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {category.description}
                    </p>
                    <div className="text-xs text-purple-600 dark:text-purple-400">
                      {category.templates} templates
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Data Import Feature */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" weight="fill" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Import or Enter Minimal Info
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Use your existing resume data or just provide the basics. We handle the proper letter format and structure automatically.
                </p>
 <div className="flex gap-2">
  <Badge 
    variant="secondary" 
    className="text-xs bg-transparent border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300"
  >
    Auto-Import
  </Badge>
  <Badge 
    variant="secondary" 
    className="text-xs bg-transparent border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300"
  >
    Manual Input
  </Badge>
  <Badge 
    variant="secondary" 
    className="text-xs bg-transparent border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300"
  >
    Edit Any Time
  </Badge>
</div>
              </div>
            </div>

            {/* AI Enhancement Feature */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <MagicWand className="w-6 h-6 text-white" weight="fill" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  AI-Powered Enhancement
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Choose enhancement options or give custom instructions. AI optimizes your letter sections for the perfect tone and impact.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {enhancementOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <option.icon className="w-4 h-4 text-blue-500" />
                      {option.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Editing & Export Feature */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
                  <Pencil className="w-6 h-6 text-white" weight="fill" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Full Control & Export
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Edit any part of your letter. Export to PDF, Word, or copy text. Complete freedom to customize the final result.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Interactive Demo */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
              {/* Letter Preview */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                </div>
                
                {/* Letter Content */}
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  
                  {/* Highlighted AI Section */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">AI Enhanced Section</span>
                    </div>
                    <div className="h-3 bg-yellow-200 dark:bg-yellow-800 rounded w-full mb-1"></div>
                    <div className="h-3 bg-yellow-200 dark:bg-yellow-800 rounded w-5/6"></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-6">
                  <button className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-lg py-2 px-3 text-sm font-medium text-white flex items-center justify-center gap-2">
                    <MagicWand className="w-4 h-4" />
                    Enhance
                  </button>
                  <button className="flex-1 bg-green-500 hover:bg-green-600 rounded-lg py-2 px-3 text-sm font-medium text-white flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>

              {/* Import Status */}
              <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Source</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    Resume Imported
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Using data from your resume • Format handled automatically
                </div>
              </div>
            </div>

            {/* Floating AI Badge */}
            <motion.div
              className="absolute -top-4 -right-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2"
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
              Format Handled
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
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-3xl p-12 text-white shadow-2xl">
            <h3 className="text-3xl font-bold mb-4">
              Ready to Create Your Perfect Letter?
            </h3>
            <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
              No need to know letter formats. Just tell us what you need, and we'll handle the rest. Create professional letters in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard/cover-letters"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-2xl shadow-lg"
                )}
              >
                <Envelope className="w-5 h-5 mr-2" />
                Start Writing Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <button className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-2xl border border-white/30 transition-all duration-300">
                View All Templates
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};