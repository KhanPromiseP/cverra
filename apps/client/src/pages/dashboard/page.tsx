import { useEffect } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { Button } from "@reactive-resume/ui";
import { useUser } from "@/client/services/user";
import { useResumes } from "@/client/services/resume"; // Your working hook
import { useQuery } from "@tanstack/react-query";
import { coverLetterService } from "@/client/services/cover-letter.service";
import { 
  FileText, 
  PenTool, 
  Sparkles, 
  Award, 
  Zap, 
  Shield,
  ArrowRight,
  Star
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
        duration: 0.5
      }
    }
  };

  return (
    <div className="">
      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto"
        >
          {/* Welcome Section */}
          <motion.div 
            variants={itemVariants}
            className="text-center mb-16"
          >
           
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Ready to continue your journey with{" "}
              <span className="font-semibold text-purple-600 dark:text-purple-400">Cverra</span>? 
              Let's create something amazing today.
            </p>
          </motion.div>

          {/* Feature Cards */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"
          >
            {/* Cverra Introduction */}
            <motion.div
              variants={itemVariants}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-2xl"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  About Cverra
                </h2>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Cverra is your AI-powered partner for creating professional resumes and cover letters 
                that stand out. With premium templates and intelligent content generation, we help you 
                make the best impression possible.
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <Zap className="w-4 h-4" />
                  <span>AI-Powered</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                  <Shield className="w-4 h-4" />
                  <span>Premium Quality</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
                  <Star className="w-4 h-4" />
                  <span>Professional</span>
                </div>
                <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Easy to Use</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6">Your Workspace</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {isLoading ? (
                      <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      resumeCount
                    )}
                  </div>
                  <div className="text-blue-100">Resumes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {isLoading ? (
                      <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      coverLetterCount
                    )}
                  </div>
                  <div className="text-blue-100">Cover Letters</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">12+</div>
                  <div className="text-blue-100">Templates</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">∞</div>
                  <div className="text-blue-100">Possibilities</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              What would you like to create today?
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {/* Resume Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-2xl shadow-2xl group"
                >
                  <Link to="/dashboard/resumes">
                    <FileText className="w-6 h-6 mr-3" />
                    Access Resumes ({resumeCount})
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>

              {/* Cover Letter Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 px-8 py-6 text-lg font-semibold rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg"
                >
                  <Link to="/dashboard/cover-letters">
                    <PenTool className="w-6 h-6 mr-3" />
                    Write Letters ({coverLetterCount})
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            </div>

            {/* Additional Info */}
            <motion.p
              variants={itemVariants}
              className="text-gray-500 dark:text-gray-400 mt-8 text-sm"
            >
              Need help? Check out our{" "}
              <Link to="/help" className="text-blue-600 dark:text-blue-400 hover:underline">
                guides and tutorials
              </Link>
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};