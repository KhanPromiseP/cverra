import { t } from "@lingui/macro";
import { ArrowRight, Sparkle, FileText, MagicWand, Download, Upload, Copy, Pencil, BookOpen, Target, Envelope } from "@phosphor-icons/react";
import { buttonVariants, Badge } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { useState } from "react";
import { Plus, PenTool } from "lucide-react";

interface LettersSectionProps {
  onViewTemplates?: () => void;
}

export const LettersSection = ({ onViewTemplates }: LettersSectionProps) => {
  const [activeCategory, setActiveCategory] = useState('professional');


 

  const categories = [
    {
      id: 'professional',
      name: t`Job Applications`,
      icon: FileText,
      description: t`Professional jobs, career changes`,
      templates: 25
    },
    {
      id: 'internship',
      name: t`Internships`,
      icon: BookOpen,
      description: t`Internship programs, entry-level`,
      templates: 18
    },
    {
      id: 'business',
      name: t`Business Letters`,
      icon: Target,
      description: t`Networking, proposals, correspondence`,
      templates: 15
    },
    {
      id: 'personal',
      name: t`Personal Letters`,
      icon: Envelope,
      description: t`Family, friends, recommendations`,
      templates: 12
    }
  ];

  const enhancementOptions = [
    {
      name: t`Professional Tone`,
      description: t`Make it more formal and business-appropriate`,
      icon: FileText
    },
    {
      name: t`Impact Enhancement`,
      description: t`Strengthen achievements and impact statements`,
      icon: MagicWand
    },
    {
      name: t`Custom Instructions`,
      description: t`Provide specific enhancement guidelines`,
      icon: Pencil
    }
  ];

  return (
    <section id="letters" className="relative py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Background Elements - Mobile Responsive */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-10 -left-10 sm:top-20 sm:-left-20 w-32 h-32 sm:w-48 sm:h-48 md:w-60 md:h-60 bg-purple-500/10 rounded-full blur-xl sm:blur-2xl md:blur-3xl"
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
          className="absolute bottom-10 -right-10 sm:bottom-20 sm:-right-20 w-32 h-32 sm:w-48 sm:h-48 md:w-60 md:h-60 bg-blue-500/10 rounded-full blur-xl sm:blur-2xl md:blur-3xl"
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
              className="text-sm sm:text-base font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full"
            >
              <Envelope className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" weight="fill" />
              {t`AI Letter Writer`}
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
              {t`Perfect Letters Made`}
            </span>
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {t`Simple & Fast`}
            </span>
          </motion.h2>

          <motion.p
            className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true, margin: "-50px" }}
          >
            {t`Just tell us what you need - we handle the format and structure. Import from your resume or enter minimal details, and get a perfectly crafted letter in seconds.`}
          </motion.p>
        </div>

        {/* Main Content Grid - Stack on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-start mb-12 sm:mb-16 md:mb-20">
          {/* Left Column - Features & Process */}
          <motion.div
            className="space-y-6 sm:space-y-8 order-2 lg:order-1"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-50px" }}
          >
            {/* Category Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {t`What Do You Need to Write?`}
                  </h3>
                </div>
                <Link
                  to="/dashboard/cover-letters"
                  className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 self-start sm:self-auto"
                >
                  {t`Build with choice category`}
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Link>
              </div>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                {categories.slice(0, 3).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 text-left transition-all ${
                      activeCategory === category.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        activeCategory === category.id
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        <category.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm block truncate">
                          {category.name}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {category.templates} {t`templates`}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {category.description}
                    </p>
                  </button>
                ))}
                
                {/* "More" placeholder */}
                <Link
                  to="/dashboard/cover-letters"
                  className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all flex flex-col items-center justify-center text-center group"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/20 transition-colors">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 group-hover:text-purple-500" />
                  </div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                    {t`start with any category`}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t`Business, Personal, Academic, etc.`}
                  </p>
                </Link>
              </div>
              
              {/* CTA Button */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  to="/dashboard/cover-letters"
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 active:scale-95"
                >
                  <PenTool className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t`Start Writing Now`}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>

            {/* Data Import Feature */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-0">
              <div className="flex-shrink-0 self-start sm:self-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-white" weight="fill" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {t`Import or Enter Minimal Info`}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 leading-relaxed">
                  {t`Use your existing resume data or just provide the basics. We handle the proper letter format and structure automatically.`}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-transparent border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 px-2 py-0.5"
                  >
                    {t`Auto-Import`}
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-transparent border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 px-2 py-0.5"
                  >
                    {t`Manual Input`}
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-transparent border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 px-2 py-0.5"
                  >
                    {t`Edit Any Time`}
                  </Badge>
                </div>
              </div>
            </div>

            {/* AI Enhancement Feature */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-0">
              <div className="flex-shrink-0 self-start sm:self-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <MagicWand className="w-5 h-5 sm:w-6 sm:h-6 text-white" weight="fill" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {t`AI-Powered Enhancement`}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 leading-relaxed">
                  {t`Choose enhancement options or give custom instructions. AI optimizes your letter sections for the perfect tone and impact.`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {enhancementOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <option.icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{option.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Editing & Export Feature */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-0">
              <div className="flex-shrink-0 self-start sm:self-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <Pencil className="w-5 h-5 sm:w-6 sm:h-6 text-white" weight="fill" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {t`Full Control & Export`}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t`Edit any part of your letter. Export to PDF. Complete freedom to customize peice of letter to achieve the best final result for your use.`}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Interactive Demo */}
          <motion.div
            className="relative order-1 lg:order-2 mb-8 sm:mb-0"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true, margin: "-50px" }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl sm:shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
              {/* Letter Preview */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg sm:rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-600/50">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div>
                    <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 sm:w-32 mb-1.5 sm:mb-2"></div>
                    <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-24"></div>
                  </div>
                  <div className="flex gap-0.5 sm:gap-1">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                  </div>
                </div>
                
                {/* Letter Content */}
                <div className="space-y-2 sm:space-y-4">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                  <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  
                  {/* Highlighted AI Section */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-3 sm:mt-4">
                    <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                      <Sparkle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-yellow-700 dark:text-yellow-300 truncate">
                        {t`AI Enhanced Section`}
                      </span>
                    </div>
                    <div className="h-2.5 sm:h-3 bg-yellow-200 dark:bg-yellow-800 rounded w-full mb-1"></div>
                    <div className="h-2.5 sm:h-3 bg-yellow-200 dark:bg-yellow-800 rounded w-5/6"></div>
                  </div>
                </div>

                {/* Action Buttons - Mobile Optimized */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4 sm:mt-6">
                  <button className="flex-1 min-w-[calc(33.333%-0.375rem)] sm:min-w-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1 sm:gap-2">
                    <Pencil className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{t`Edit`}</span>
                  </button>
                  <button className="flex-1 min-w-[calc(33.333%-0.375rem)] sm:min-w-0 bg-blue-500 hover:bg-blue-600 rounded-lg py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-white flex items-center justify-center gap-1 sm:gap-2">
                    <MagicWand className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{t`Enhance`}</span>
                  </button>
                  <button className="flex-1 min-w-[calc(33.333%-0.375rem)] sm:min-w-0 bg-green-500 hover:bg-green-600 rounded-lg py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-white flex items-center justify-center gap-1 sm:gap-2">
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{t`Export`}</span>
                  </button>
                </div>
              </div>

              {/* Import Status */}
              <div className="mt-4 sm:mt-6 bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1.5 sm:mb-2 gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{t`Data Source`}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs px-2 py-0.5 self-start sm:self-auto">
                    {t`Resume Imported`}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  {t`Using data from your resume • Format handled automatically`}
                </div>
              </div>
            </div>

            {/* Floating AI Badge - Mobile Responsive */}
            <motion.div
              className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg flex items-center gap-1 sm:gap-2 whitespace-nowrap"
              animate={{
                y: [0, -3, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" weight="fill" />
              <span className="truncate">{t`Format Handled`}</span>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-8 p-4 sm:p-0">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {t`The End of Letter Writing Headaches`}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  <span className="font-semibold dark:text-gray-300">{t`Professional letters, perfected instantly.`}</span> {t`Inlirah handles content type, tone, structure, and presentation to industry standards, enjoy complete freedom with guaranteed professional quality to add or adjust details upfront or refine after, delivering polished results that require zero additional work.`}
                </p>
                
                <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {t`What you`} <span className="font-bold text-gray-900 dark:text-white">{t`escape`}</span> {t`with Inlirah:`}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="text-red-500">✗</span>
                      <span>{t`Content brainstorming headaches`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="text-red-500">✗</span>
                      <span>{t`Tone & structure guessing`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="text-red-500">✗</span>
                      <span>{t`Professional formatting struggles`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="text-red-500">✗</span>
                      <span>{t`Multiple revision cycles`}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl sm:rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 text-white shadow-xl sm:shadow-2xl">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
              {t`Ready to Create Your Perfect Letter?`}
            </h3>
            <p className="text-purple-100 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
              {t`No need to know letter formats. Just tell us what you need, and we'll handle the rest. Create professional letters in minutes.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              <Link
                to="/dashboard/cover-letters"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-white text-purple-600 hover:bg-gray-100 font-semibold px-6 sm:px-8 py-3 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg w-full sm:w-auto flex items-center justify-center"
                )}
              >
                <Envelope className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                <span className="truncate">{t`Start Writing`}</span>
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </Link>
              {/* Update this button to use the onViewTemplates prop */}
              <button 
                onClick={onViewTemplates}
                className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 sm:px-8 py-3 rounded-lg sm:rounded-xl md:rounded-2xl border border-white/30 transition-all duration-300 w-full sm:w-auto"
              >
                {t`View Templates`}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};