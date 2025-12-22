// components/home/PlatformManifestoSection.tsx
import React from 'react';
import { 
  ArrowRight, 
  Brain, 
  Target, 
  Sparkle, 
  Diamond, 
  Scales, 
  Strategy,
  Lightbulb,
  Rocket,
  PresentationChart,
  CheckCircle,
  FileText,
  Envelope,
  BookOpen,
  Trophy
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Badge, Card } from "@reactive-resume/ui";
import { Link } from "react-router";

export const PlatformManifestoSection = () => {
  const manifestoPillars = [
    {
      title: "Resume Builder",
      subtitle: "Positioning Documents",
      description: "Your resume is not a document. It's positioning. We treat it with the strategic importance it deserves.",
      icon: FileText,
      color: "from-blue-500 to-cyan-500",
      principles: [
        "Every element serves a strategic purpose",
        "Design communicates before content does",
        "Clarity is your competitive advantage"
      ],
      link: "/dashboard/resumes"
    },
    {
      title: "Letter Writer",
      subtitle: "Intentional Narratives",
      description: "Cover letters are not templates. They're intentional narratives crafted for specific conversations.",
      icon: Envelope,
      color: "from-purple-500 to-pink-500",
      principles: [
        "Every word carries intention",
        "Format is stewardship of your message",
        "AI enhances, never replaces thought"
      ],
      link: "/dashboard/cover-letters"
    },
    {
      title: "Knowledge Hub",
      subtitle: "Distilled Thinking",
      description: "Articles are not content. They're distilled thinking that transforms information into understanding.",
      icon: BookOpen,
      color: "from-amber-500 to-orange-500",
      principles: [
        "Depth over volume",
        "Insight over information",
        "Wisdom applied, not just shared"
      ],
      link: "/dashboard/articles"
    }
  ];

  const platformPhilosophy = [
    {
      statement: "Most platforms optimize for noise.",
      contrast: "We optimize for clarity.",
      icon: Brain,
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      statement: "Most people are overwhelmed with information,",
      contrast: "yet starving for understanding.",
      icon: Lightbulb,
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      statement: "This platform exists because",
      contrast: "excellence is a discipline, not a gift.",
      icon: Trophy,
      color: "text-amber-600 dark:text-amber-400"
    }
  ];

  return (
    <section id="manifesto" className="relative py-32 overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/3 -right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.6, 0.4]
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
        {/* Manifesto Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <Badge 
            variant="secondary"
            className="mb-6 px-6 py-3 text-lg font-semibold uppercase tracking-wider bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full"
          >
            <Diamond className="w-5 h-5 mr-2" weight="fill" />
            The Cverra Manifesto
          </Badge>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-8">
            <span className="block text-gray-900 dark:text-white mb-4">
              Most Platforms Optimize for Noise
            </span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-amber-600 bg-clip-text text-transparent">
              We Optimize for Clarity
            </span>
          </h2>

          <p className="text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
            This is not a place for shortcuts. This is not a place for trends.
            <br />
            This is a place for minds that value insight over hype.
          </p>
        </motion.div>

        {/* Three Pillars */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {manifestoPillars.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative"
            >
              <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
                {/* Pillar Icon */}
                <div className={`w-20 h-20 bg-gradient-to-r ${pillar.color} rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg`}>
                  <pillar.icon className="w-10 h-10 text-white" weight="fill" />
                </div>

                {/* Pillar Title */}
                <div className="text-center mb-6">
                  <Badge 
                    variant="secondary"
                    className={`mb-3 px-4 py-1 text-sm font-semibold bg-gradient-to-r ${pillar.color}/20 text-gray-700 dark:text-gray-300 border-transparent`}
                  >
                    {pillar.subtitle}
                  </Badge>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {pillar.description}
                  </p>
                </div>

                {/* Principles */}
                <div className="space-y-3">
                  {pillar.principles.map((principle, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" weight="fill" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{principle}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button - Now with proper link */}
                <Link 
                  to={pillar.link}
                  className="w-full mt-8 py-3 px-6 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-200 font-semibold hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Explore {pillar.title}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Card>

              {/* Floating Decoration */}
              <motion.div
                className={`absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-r ${pillar.color} rounded-full shadow-lg`}
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Platform Philosophy */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-white shadow-3xl mb-20"
        >
          <div className="grid md:grid-cols-3 gap-8">
            {platformPhilosophy.map((item, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 ${item.color} bg-white/10 rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                  <item.icon className="w-8 h-8" weight="fill" />
                </div>
                <p className="text-lg text-gray-300 mb-2">{item.statement}</p>
                <p className="text-2xl font-bold text-white">{item.contrast}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-12 text-white shadow-2xl">
            <h3 className="text-3xl font-bold mb-6">
              Ready to Build with Intention?
            </h3>
            <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have chosen clarity over noise, 
              depth over volume, and excellence over shortcuts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/dashboard/resumes"
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-2xl shadow-lg text-lg text-center"
              >
                Start Your Journey
              </Link>
              <Link 
                to="/dashboard"
                className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-4 rounded-2xl border border-white/30 transition-all duration-300 text-lg text-center"
              >
                Read Full Manifesto
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};