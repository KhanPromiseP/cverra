import { t, Trans } from "@lingui/macro";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { Button } from "@reactive-resume/ui";
import { useUser } from "@/client/services/user";
import { useResumes } from "@/client/services/resume";
import { useQuery } from "@tanstack/react-query";
import { coverLetterService } from "@/client/services/cover-letter.service";
import { 
  FileText, 
  PenTool, 
  BookOpen,
  ArrowRight,
  Sparkle,
  Brain,
  Lightbulb,
  Target,
  User,
  Lock,
  Rocket,
  Award,
  Zap
} from "lucide-react";

export const DashboardHomePage = () => {
  const { user } = useUser();
  const { resumes, loading: resumesLoading } = useResumes();
  
  const { data: coverLetters, isLoading: coverLettersLoading } = useQuery({
    queryKey: ['cover-letters'],
    queryFn: () => coverLetterService.findAll(),
  });

  const resumeCount = resumes?.length || 0;
  const coverLetterCount = coverLetters?.length || 0;
  const isLoading = resumesLoading || coverLettersLoading;
  const isLoggedIn = !!user;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Welcome message based on login status
  const getWelcomeMessage = () => {
    if (isLoggedIn) {
      return {
        greeting: t`Welcome back, ${user?.name?.split(' ')[0] || 'there'}!`,
        subtitle: t`Ready to build something amazing?`,
        description: t`Access your tools and curated insights to advance your career journey.`
      };
    } else {
      return {
        greeting: t`Welcome to Inlirah`,
        subtitle: t`Your career advancement platform`,
        description: t`Access curated tools and insights to elevate your professional journey. Sign up to unlock all features.`
      };
    }
  };

  const welcome = getWelcomeMessage();

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto"
        >
          {/* Welcome Section */}
          <motion.div 
            variants={itemVariants}
            className="text-center mb-12 sm:mb-16"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <span className="block text-gray-900 dark:text-white">
                {welcome.greeting}
              </span>
              <span className="block mt-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {welcome.subtitle}
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {welcome.description}
            </p>
          </motion.div>

          {/* Quick Stats - Only show for logged-in users */}
          {isLoggedIn && (
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {isLoading ? (
                        <div className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        resumeCount
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t`Resumes`}</div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {isLoading ? (
                        <div className="inline-block w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        coverLetterCount
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t`Cover Letters`}</div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <PenTool className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {t`Curated`}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t`Knowledge Hub`}</div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* CTA for non-logged-in users */}
          {!isLoggedIn && (
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl mb-12"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                    <Rocket className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">{t`Ready to Elevate Your Career?`}</h2>
                  </div>
                  <p className="text-blue-100 mb-6 max-w-2xl">
                    {t`Create a free account to unlock all features including resume building, 
                    cover letter writing, and personalized career insights.`}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/auth/register">
                      <Button 
                        size="lg"
                        className="bg-white text-blue-600 hover:bg-blue-50 px-8 font-semibold"
                      >
                        <User className="w-5 h-5 mr-2" />
                        {t`Create Free Account`}
                      </Button>
                    </Link>
                    <Link to="/auth/login">
                      <Button 
                        size="lg"
                        variant="outline" 
                        className="border-white text-white hover:bg-white/10"
                      >
                        {t`Already have an account? Sign In`}
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/20 rounded-xl p-4 text-center">
                    <Award className="w-8 h-8 mx-auto mb-2" />
                    <div className="text-sm">{t`Premium Tools`}</div>
                  </div>
                  <div className="bg-white/20 rounded-xl p-4 text-center">
                    <Zap className="w-8 h-8 mx-auto mb-2" />
                    <div className="text-sm">{t`Instant Access`}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
              {isLoggedIn ? t`What would you like to work on?` : t`Explore Our Platform Features`}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
              {/* Resume Builder */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="group"
              >
                <Link to={isLoggedIn ? "/dashboard/resumes" : "/auth/login"} className="block">
                  <div className={`
                    rounded-2xl p-6 border transition-all duration-300 h-full
                    ${isLoggedIn 
                      ? "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700"
                      : "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className={`
                      w-14 h-14 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300
                      ${isLoggedIn 
                        ? "bg-gradient-to-r from-blue-500 to-blue-600"
                        : "bg-gradient-to-r from-gray-400 to-gray-500"
                      }`}
                    >
                      {isLoggedIn ? (
                        <FileText className="w-7 h-7 text-white" />
                      ) : (
                        <Lock className="w-7 h-7 text-white" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {t`Resume Builder`}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {isLoggedIn 
                        ? t`Create and manage your professional resumes`
                        : t`Create professional resumes (Sign up required)`
                      }
                    </p>
                    <div className={`
                      flex items-center justify-center text-sm font-medium
                      ${isLoggedIn 
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {isLoggedIn ? t`Access Tool` : t`Sign Up to Access`}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Letter Writer */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="group"
              >
                <Link to={isLoggedIn ? "/dashboard/cover-letters" : "/auth/login"} className="block">
                  <div className={`
                    rounded-2xl p-6 border transition-all duration-300 h-full
                    ${isLoggedIn 
                      ? "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700"
                      : "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className={`
                      w-14 h-14 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300
                      ${isLoggedIn 
                        ? "bg-gradient-to-r from-purple-500 to-purple-600"
                        : "bg-gradient-to-r from-gray-400 to-gray-500"
                      }`}
                    >
                      {isLoggedIn ? (
                        <PenTool className="w-7 h-7 text-white" />
                      ) : (
                        <Lock className="w-7 h-7 text-white" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {t`Letter Writer`}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {isLoggedIn 
                        ? t`Craft personalized letters and correspondence`
                        : t`Write professional cover letters (Sign up required)`
                      }
                    </p>
                    <div className={`
                      flex items-center justify-center text-sm font-medium
                      ${isLoggedIn 
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {isLoggedIn ? t`Access Tool` : t`Sign Up to Access`}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Knowledge Hub */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="group"
              >
                <Link to="/dashboard/articles" className="block">
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300 h-full">
                    <div className="w-14 h-14 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {t`Knowledge Hub`}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {t`Access curated articles and career insights`}
                    </p>
                    <div className="flex items-center justify-center text-sm font-medium text-amber-600 dark:text-amber-400">
                      {t`Explore Articles`}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Platform Philosophy */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Brain className="w-8 h-8" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-bold mb-2">
                  {t`Most platforms optimize for noise. We optimize for clarity.`}
                </h3>
                <p className="text-blue-100">
                  <Trans>
                    This is a place for minds that value insight over hype, and excellence over shortcuts.
                    {!isLoggedIn && " Join our community of professionals today."}
                  </Trans>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Additional Resources/CTAs */}
          <motion.div
            variants={itemVariants}
            className="text-center"
          >
            {isLoggedIn ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t`Need help? Check out our`}{" "}
                <Link to="/docs" className="text-blue-600 dark:text-blue-400 hover:underline">
                  {t`Inlirah guides`}
                </Link>
                {" "}{t`or`}{" "}
                <Link to="/dashboard/settings" className="text-blue-600 dark:text-blue-400 hover:underline">
                  {t`update your profile`}
                </Link>
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  {t`Already have an account?`}{" "}
                  <Link to="/auth/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    {t`Sign in here`}
                  </Link>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <Lightbulb className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t`Expert Insights`}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t`Career Tools`}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <Sparkle className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t`Premium Features`}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};