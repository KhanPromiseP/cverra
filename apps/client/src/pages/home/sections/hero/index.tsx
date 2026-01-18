import { t } from "@lingui/macro";
import { ArrowRight, Sparkle, FileText, Article } from "@phosphor-icons/react";
import { buttonVariants, Badge } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";

import { defaultTiltProps } from "@/client/constants/parallax-tilt";
import { HeroCTA } from "./call-to-action";
import { Decoration } from "./decoration";

export const HeroSection = () => (
  <section
    id="hero"
    className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950"
  >
    <Decoration.Grid />
    <Decoration.Gradient />

    {/* Animated Background */}
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute top-1/4 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/3 right-10 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-3xl"
        animate={{ scale: [1.3, 1, 1.3], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>

    <div className="relative mx-auto max-w-7xl px-6 lg:flex lg:h-screen lg:items-center lg:px-12 py-10">
      <div className="mx-auto max-w-6xl text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex mb-12"
        >
          <Badge
            variant="secondary"
            className="text-lg font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white border-0 shadow-2xl mt-12 px-8 py-4 rounded-2xl"
          >
            {t`Next-Gen Career Platform`}
          </Badge>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="block text-gray-900 dark:text-white">
            {t`Inlirah, Your Complete`}
          </span>
          <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {t`Career Success Suite`}
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {t`Transform your career journey with intelligent tools for building resumes, crafting professional letters, and accessing growth-focused insights designed to deliver real results.`}
        </motion.p>

        {/* Features - Fixed height cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {[
            {
              icon: FileText,
              title: t`Resume Builder`,
              desc: t`Create clear, professional resumes that highlight your strengths and align with real-world opportunities.`,
              gradient: "from-blue-500 to-blue-600",
            },
            {
              icon: Article,
              title: t`Smart Cover Letters`,
              desc: t`Craft tailored letters for every situation-job applications, academics, business, and beyond-with clarity and confidence.`,
              gradient: "from-purple-500 to-purple-600",
            },
            {
              icon: Sparkle,
              title: t`Career Growth Hub`,
              desc: t`Access powerful articles on career development, productivity, motivation, and purposeful growth—free and premium.`,
              gradient: "from-indigo-500 to-indigo-600",
            },
          ].map((feature) => (
            <Tilt key={feature.title} {...defaultTiltProps}>
              <div className="group h-full flex flex-col bg-white/80 dark:bg-gray-800/80 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
                {/* Icon */}
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-8 h-8 text-white" weight="fill" />
                </div>
                
                {/* Title */}
                <h3 className="font-bold text-2xl mb-4 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                
                {/* Description with fixed height container */}
                <div className="flex-1 min-h-[120px] flex items-center">
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
                
                
              </div>
            </Tilt>
          ))}
        </motion.div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <HeroCTA />
          <a
            href="#features"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "px-10 py-5 text-xl font-bold"
            )}
          >
            {t`Explore Features`}
            <ArrowRight className="ml-3 w-6 h-6 inline" />
          </a>
        </div>
      </div>
    </div>
  </section>
);