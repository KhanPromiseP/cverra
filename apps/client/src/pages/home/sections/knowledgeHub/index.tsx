// components/home/KnowledgeHubSection.tsx
import React from 'react';
import { 
  ArrowRight, 
  BookOpen, 
  Brain, 
  ChartLineUp, 
  Coffee, 
  Crown, 
  Fire, 
  Globe, 
  Lightning, 
  Star, 
  Target, 
  TrendUp 
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Badge, Card } from "@reactive-resume/ui";

export const KnowledgeHubSection = () => {
  const knowledgePillars = [
    {
      title: "Featured Articles",
      description: "Handpicked excellence. Our editors curate the most valuable insights.",
      icon: Star,
      color: "from-amber-500 to-orange-500",
      count: "100+",
      link: "/dashboard/articles?tab=featured"
    },
    {
      title: "Trending Insights",
      description: "What the community is learning right now. Stay ahead of the curve.",
      icon: TrendUp,
      color: "from-purple-500 to-pink-500",
      count: "50+",
      link: "/dashboard/articles?tab=trending"
    },
    {
      title: "Quick Reads",
      description: "Powerful insights under 10 minutes. Perfect for busy professionals.",
      icon: Coffee,
      color: "from-blue-500 to-cyan-500",
      count: "200+",
      link: "/dashboard/articles?tab=short"
    },
    {
      title: "Premium Content",
      description: "Exclusive deep dives from industry leaders and subject matter experts.",
      icon: Crown,
      color: "from-violet-500 to-purple-500",
      count: "Premium",
      link: "/dashboard/articles?tab=premium"
    }
  ];

  const knowledgeValues = [
    {
      title: "Depth Over Volume",
      description: "We prioritize quality insights over content quantity. Every article must provide genuine value.",
      icon: Brain
    },
    {
      title: "Actionable Insights",
      description: "Knowledge without application is noise. We focus on practical, actionable takeaways.",
      icon: Target
    },
    {
      title: "Multi-Language Access",
      description: "Wisdom shouldn't have language barriers. We translate excellence across borders.",
      icon: Globe
    },
    {
      title: "Real-World Application",
      description: "Theory meets practice. Our content is grounded in real professional challenges.",
      icon: Lightning
    }
  ];

  return (
    <section id="knowledge-hub" className="relative py-32 overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-amber-900/20">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/3 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <Badge 
            variant="secondary"
            className="mb-6 px-6 py-3 text-lg font-semibold uppercase tracking-wider bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full"
          >
            <BookOpen className="w-5 h-5 mr-2" weight="fill" />
            Third Pillar: Knowledge Hub
          </Badge>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-8">
            <span className="block text-gray-900 dark:text-white mb-4">
              Articles Are Not Content
            </span>
            <span className="block bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
              They're Distilled Thinking
            </span>
          </h2>

          <p className="text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
            In a world overflowing with information, we provide understanding.
            <br />
            Where others publish content, we distill wisdom.
          </p>
        </motion.div>

        {/* Knowledge Pillars */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {knowledgePillars.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card 
                className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-3xl transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => window.location.href = pillar.link}
              >
                {/* Pillar Icon */}
                <div className={`w-14 h-14 bg-gradient-to-r ${pillar.color} rounded-xl flex items-center justify-center mb-4`}>
                  <pillar.icon className="w-7 h-7 text-white" weight="fill" />
                </div>

                {/* Content */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {pillar.title}
                    </h3>
                    <Badge 
                      variant="secondary"
                      className={`text-xs font-semibold bg-gradient-to-r ${pillar.color}/20 text-gray-700 dark:text-gray-300`}
                    >
                      {pillar.count}
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {pillar.description}
                  </p>
                </div>

                {/* CTA */}
                <div className="flex items-center text-sm font-medium text-amber-600 dark:text-amber-400">
                  Explore Collection
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Knowledge Values */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {knowledgeValues.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <value.icon className="w-8 h-8 text-amber-600 dark:text-amber-400" weight="fill" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {value.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-12 text-white shadow-3xl"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "1,000+", label: "Expert Articles", icon: BookOpen },
              { value: "50+", label: "Industry Experts", icon: Star },
              { value: "10+", label: "Languages", icon: Globe },
              { value: "98%", label: "Reader Satisfaction", icon: ChartLineUp }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};