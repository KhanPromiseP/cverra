import { t } from "@lingui/macro";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Users, 
  Target, 
  Sparkle, 
  Shield, 
  Globe, 
  Rocket, 
  Heart, 
  Award, 
  TrendingUp,
  FileText,
  BookOpen,
  CheckCircle,
  Star,
  Zap,
  Brain,
  Lightbulb,
  Briefcase
} from "lucide-react";
import { Button } from "@reactive-resume/ui";
import { Link } from "react-router";
import { Header } from "./header";
import { Footer } from "./footer";

export const AboutPage = () => {
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


  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]); // Trigger when the pathname changes

  

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const stats = [
    { value: t`Professional Tools`, label: t`Career Development`, icon: Briefcase, color: "blue" },
    { value: t`AI-Assisted`, label: t`Smart Enhancements`, icon: Sparkle, color: "purple" },
    { value: t`Global Users`, label: t`Worldwide Community`, icon: Globe, color: "green" },
    { value: t`Industry Standards`, label: t`Professional Quality`, icon: Award, color: "amber" }
  ];

  const platformPrinciples = [
    {
      title: t`Professional Integrity`,
      description: t`We maintain the highest standards for professional documents and career resources.`,
      icon: Shield,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: t`Practical Innovation`,
      description: t`We implement technology where it genuinely enhances professional outcomes.`,
      icon: Brain,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: t`Accessible Excellence`,
      description: t`Quality career tools should be accessible to professionals at every level.`,
      icon: Heart,
      color: "from-amber-500 to-orange-500"
    },
    {
      title: t`User-Focused Evolution`,
      description: t`Our platform evolves based on real professional needs and feedback.`,
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-500"
    }
  ];

  const platformCapabilities = [
    {
      title: t`Resume Development`,
      description: t`Create professional resumes with proper formatting and structure that meet industry standards.`,
      icon: FileText,
      features: [t`Industry Templates`, t`Professional Formatting`, t`ATS Optimization`],
      color: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: t`Professional Correspondence`,
      description: t`Craft various types of business letters with appropriate tone and professional structure.`,
      icon: FileText,
      features: [t`Multiple Categories`, t`Tone Adjustment`, t`Format Guidelines`],
      color: "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20"
    },
    {
      title: t`Career Resources`,
      description: t`Access curated articles and insights that provide practical career guidance.`,
      icon: BookOpen,
      features: [t`Expert Content`, t`Industry Insights`, t`Practical Advice`],
      color: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
    }
  ];

  const impactMetrics = [
    {
      number: "1",
      title: t`Professional Focus`,
      description: t`Dedicated to career development tools that meet real workplace needs`
    },
    {
      number: "2",
      title: t`Quality Standards`,
      description: t`All outputs maintain professional quality and industry standards`
    },
    {
      number: "3", 
      title: t`Practical Value`,
      description: t`Tools designed for real-world professional application`
    },
    {
      number: "4",
      title: t`User Experience`,
      description: t`Platform built around professional workflows and needs`
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-8 pb-12 md:pt-12 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
        
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 -left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"
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
            className="absolute bottom-20 -right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
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

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-2"
          >
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="font-medium">{t`Back`}</span>
            </button>
          </motion.div>

          {/* Hero Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="inline-flex mb-8">
                <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {t`About Inlirah`}
                  </span>
                </div>
              </motion.div>

           

              <motion.h1
                variants={itemVariants}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
              >
                <span className="block text-gray-900 dark:text-white mb-2">
                  {t`Professional Career`}
                </span>
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t`Tools for Today's Professionals`}
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
              >
                {t`Inlirah provides practical career advancement tools designed for modern professionals. We focus on creating useful resources for resume development, professional correspondence, and career knowledge - implementing technology where it genuinely enhances professional outcomes.`}
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                <Link to="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    {t`Start Building`}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/dashboard/articles">
                  <Button size="lg" variant="outline">
                    {t`Explore Articles`}
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop&crop=center"
                  alt={t`Inlirah Platform Interface`}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                
                {/* Floating Elements */}
                <motion.div
                  className="absolute top-6 left-6 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">{t`Resume Builder`}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{t`AI-Enhanced`}</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute bottom-6 right-6 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">{t`Letter Writer`}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{t`Smart Templates`}</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      

      {/* Stats Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <stat.icon className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Platform Approach */}
      <section className="py-12 md:py-24 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full" />
                <h2 className="text-3xl sm:text-4xl font-bold mb-6 relative z-10">
                  <span className="block text-gray-900 dark:text-white mb-2">
                    {t`Our Approach`}
                  </span>
                  <span className="block text-gray-700 dark:text-gray-300">
                    {t`Technology Applied Practically`}
                  </span>
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  {t`We focus on implementing technology where it genuinely improves professional outcomes. Our tools are designed to assist with structure, formatting, and presentation - areas where technology can enhance human effort without replacing professional judgment.`}
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{t`Focus on practical professional needs`}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{t`Maintain professional standards and quality`}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{t`Provide genuine value without exaggeration`}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=800&fit=crop&crop=center"
                  alt={t`Team collaborating on professional tools`}
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Platform Principles */}
      <section className="py-12 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="block text-gray-900 dark:text-white">
                {t`How We Work`}
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {t`Principles guiding our platform development`}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformPrinciples.map((principle, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${principle.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <principle.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {principle.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {principle.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section className="py-12 md:py-24 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="block text-gray-900 dark:text-white">
                {t`Platform Capabilities`}
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {t`Practical tools for professional development`}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {platformCapabilities.map((capability, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-2xl p-6 border ${capability.color} hover:shadow-lg transition-all`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center">
                    <capability.icon className="w-7 h-7 text-gray-700 dark:text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {capability.title}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {capability.description}
                </p>
                <div className="space-y-2">
                  {capability.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="py-12 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="block text-gray-900 dark:text-white">
                {t`Our Focus Areas`}
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {t`Key aspects of our platform development`}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {impactMetrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{metric.number}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  {metric.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {metric.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-12 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-900 dark:bg-gray-800 rounded-3xl p-12 text-white text-center"
          >
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-gray-800 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-8 h-8" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                {t`Ready to Transform Your Career?`}
              </h2>
              <p className="text-gray-300 text-xl mb-8">
                {t`Explore practical tools for resume development, professional correspondence, and career insights.`}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/dashboard">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold">
                    {t`Get Started Free`}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                    {t`Contact Us`}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};