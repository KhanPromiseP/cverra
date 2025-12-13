import { t } from "@lingui/macro";
import { ArrowRight, Sparkle, FileText, Article, Star, Rocket, Users, Trophy, ChartLine } from "@phosphor-icons/react";
import { buttonVariants, Badge } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";

import { defaultTiltProps } from "@/client/constants/parallax-tilt";
import { HeroCTA } from "./call-to-action";
import { Decoration } from "./decoration";

export const HeroSection = () => (
  <section id="hero" className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950">
    {/* Enhanced Decorations */}
    <Decoration.Grid />
    <Decoration.Gradient />
    
    {/* Enhanced Animated Background Elements */}
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute top-1/4 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-1/3 right-10 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-3xl"
        animate={{
          scale: [1.3, 1, 1.3],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/3 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1.5, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
    </div>

    {/* Floating Particles */}
    <div className="absolute inset-0">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>

    <div className="relative mx-auto max-w-7xl px-6 lg:flex lg:h-screen lg:items-center lg:px-12 py-20">
      {/* Main Content - Centered Layout */}
      <div className="mx-auto max-w-6xl text-center">
        {/* Enhanced Premium Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex mb-12"
        >
          <Badge 
            variant="secondary" 
            className="text-lg font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white border-0 shadow-2xl mt-12 px-8 py-4 rounded-2xl hover:scale-105 transition-transform duration-300"
          >
          
            {t`Next-Gen Career Platform`}
            <div className="ml-3 w-2 h-2 bg-white rounded-full animate-pulse" />
          </Badge>
        </motion.div>

        {/* Enhanced Main Headline */}
        <motion.h1
          className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="block text-gray-900 dark:text-white leading-tight drop-shadow-sm">
            {t`Cverra, Your Complete`}
          </span>
          <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight drop-shadow-sm">
            {t`Career Success Suite`}
          </span>
        </motion.h1>

        {/* Enhanced Subheading */}
        <motion.p
          className="text-2xl sm:text-3xl text-gray-600 dark:text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed font-light drop-shadow-sm"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {t`Transform your career journey with AI-powered tools for resumes, cover letters, and professional growth strategies that deliver real results.`}
        </motion.p>

        {/* Enhanced Feature Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, staggerChildren: 0.2 }}
        >
          {[
            {
              icon: FileText,
              title: "AI Resume Builder",
              desc: "Create professional, ATS-optimized resumes with intelligent content enhancement",
              gradient: "from-blue-500 to-blue-600",
              delay: 0
            },
            {
              icon: Article,
              title: "Smart Cover Letters",
              desc: "Generate personalized, company-specific letters with AI analysis",
              gradient: "from-purple-500 to-purple-600",
              delay: 0.1
            },
            {
              icon: Sparkle,
              title: "Career Growth Hub",
              desc: "Access expert guidance, interview prep, and career advancement strategies",
              gradient: "from-indigo-500 to-indigo-600",
              delay: 0.2
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: feature.delay }}
              className="group"
            >
              <Tilt {...defaultTiltProps}>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 dark:border-gray-700/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 h-full">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" weight="fill" />
                  </div>
                  <h3 className="font-bold text-2xl text-gray-900 dark:text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </Tilt>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced CTA Section */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {/* Primary CTA Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
            <HeroCTA />
          </motion.div>

          {/* Secondary CTA Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <a
              href="#features"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "group relative px-10 py-5 text-xl font-bold rounded-2xl border-3 border-gray-300 dark:border-gray-600 hover:border-transparent bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-800 hover:shadow-2xl transition-all duration-500 overflow-hidden"
              )}
            >
              <span className="relative z-10 flex items-center">
                {t`Explore Features`}
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </a>
          </motion.div>
        </motion.div>

        
      </div>
    </div>

   
  </section>
);