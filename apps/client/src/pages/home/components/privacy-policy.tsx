import { t } from "@lingui/macro";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { useEffect } from "react";
import { Button } from "@reactive-resume/ui";
import { 
  Shield, 
  Lock, 
  Eye,
  Database,
  User,
  Mail,
  Trash2,
  Download,
  Bell,
  BellOff,
  Key,
  Users,
  CheckCircle,
  XCircle,
  FileText,
  KeyRound,
  ShieldCheck,
  ArrowLeft
} from "lucide-react";
import { Header } from "./header";
import { Footer } from "./footer";

export const PrivacyPolicyPage = () => {
  const currentYear = new Date().getFullYear();
  const effectiveDate = t`January 1, 2026`;


  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-2"
          >
            <button
              onClick={() => window.history.back()}
              className="inline-flex p-2 items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="font-medium">{t`Back`}</span>
            </button>
          </motion.div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto"
          >
          
            
            <motion.h1 
              variants={itemVariants}
              className="text-4xl sm:text-5xl font-bold text-center mb-6"
            >
              <span className="block text-gray-900 dark:text-white mb-2">
                {t`Privacy Policy`}
              </span>
              <span className="block text-2xl sm:text-3xl text-gray-600 dark:text-gray-300">
                {t`Your Privacy is Our Priority`}
              </span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-xl text-gray-600 dark:text-gray-300 text-center mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              {t`We believe in transparency about how we collect, use, and protect your data. This policy explains our practices in simple, clear language.`}
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm max-w-3xl mx-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{t`Secure`}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t`Your Data Protected`}</div>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{t`Transparent`}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t`Clear Practices`}</div>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{t`Protected`}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t`Your Information Safe`}</div>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
                    <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{t`Control`}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t`You Own Your Data`}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Quick Summary */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-12"
            >
              <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold mb-2">{t`Our Promise to You`}</h3>
                    <p className="text-blue-100">
                      {t`We never sell your personal data. We handle your information with care and respect. You have full control over your data at all times.`}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Privacy Content */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="space-y-12"
            >
              {/* What We Collect */}
              <motion.section variants={itemVariants}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t`What We Collect`}</h2>
                    <p className="text-gray-600 dark:text-gray-300">{t`The data we collect to provide our services`}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" />
                      {t`Personal Information`}
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">{t`Name and contact details`}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">{t`Professional information`}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">{t`Account credentials`}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-500" />
                      {t`Content & Usage Data`}
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">{t`Resumes and cover letters`}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">{t`Platform usage patterns`}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">{t`Feature preferences`}</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">{t`What We Never Collect`}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t`We never collect sensitive information like government IDs, financial account numbers, or health data unless explicitly required for a specific service.`}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* How We Use Data */}
              <motion.section variants={itemVariants}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t`How We Use Your Data`}</h2>
                    <p className="text-gray-600 dark:text-gray-300">{t`Purposes for processing your information`}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      icon: Key,
                      title: t`Service Delivery`,
                      color: "text-blue-500",
                      items: [t`Provide platform access`, t`Process transactions`, t`Enable features`]
                    },
                    {
                      icon: Bell,
                      title: t`Communication`,
                      color: "text-green-500",
                      items: [t`Send updates`, t`Provide support`, t`Share important notices`]
                    },
                    {
                      icon: Users,
                      title: t`Improvement`,
                      color: "text-purple-500",
                      items: [t`Enhance features`, t`Fix issues`, t`Personalize experience`]
                    }
                  ].map((purpose, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                      <div className={`w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4`}>
                        <purpose.icon className={`w-6 h-6 ${purpose.color}`} />
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-3">{purpose.title}</h3>
                      <ul className="space-y-2">
                        {purpose.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 ${purpose.color.replace('text-', 'bg-')} rounded-full`}></div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.section>

              {/* Data Protection - Simple and Truthful */}
              <motion.section variants={itemVariants}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t`Data Protection`}</h2>
                    <p className="text-gray-600 dark:text-gray-300">{t`How we keep your information secure`}</p>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t`Our Security Approach`}</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{t`Secure Data Handling`}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t`We implement security measures to protect your data from unauthorized access and maintain confidentiality.`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{t`2FA Security Option`}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t`You can enable two-factor authentication in your account settings for enhanced account security.`}
                            </p>
                            <Link 
                              to="/dashboard/settings/security" 
                              className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 mt-1 inline-block"
                            >
                              {t`Enable in Settings →`}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t`Our Commitment`}</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{t`Data Protection Standards`}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t`We handle data protection seriously and implement appropriate measures to safeguard your information.`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{t`Continuous Improvement`}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t`We regularly review and update our security practices to maintain the protection of your data.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Your Rights */}
              <motion.section variants={itemVariants}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t`Your Data Rights`}</h2>
                    <p className="text-gray-600 dark:text-gray-300">{t`Control over your personal information`}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    {
                      icon: Eye,
                      title: t`Access`,
                      description: t`View your data anytime`,
                      bgColor: "bg-blue-100",
                      darkBgColor: "bg-blue-900/30",
                      iconColor: "text-blue-600",
                      darkIconColor: "dark:text-blue-400"
                    },
                    {
                      icon: Download,
                      title: t`Export`,
                      description: t`Download your data`,
                      bgColor: "bg-green-100",
                      darkBgColor: "bg-green-900/30",
                      iconColor: "text-green-600",
                      darkIconColor: "dark:text-green-400"
                    },
                    {
                      icon: Trash2,
                      title: t`Delete`,
                      description: t`Remove your data`,
                      bgColor: "bg-red-100",
                      darkBgColor: "bg-red-900/30",
                      iconColor: "text-red-600",
                      darkIconColor: "dark:text-red-400"
                    },
                    {
                      icon: BellOff,
                      title: t`Opt-Out`,
                      description: t`Control communications`,
                      bgColor: "bg-purple-100",
                      darkBgColor: "bg-purple-900/30",
                      iconColor: "text-purple-600",
                      darkIconColor: "dark:text-purple-400"
                    }
                  ].map((right, index) => (
                    <div key={index} className="text-center">
                      <div className={`w-12 h-12 ${right.bgColor} ${right.darkBgColor} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                        <right.icon className={`w-6 h-6 ${right.iconColor} ${right.darkIconColor}`} />
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{right.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{right.description}</p>
                    </div>
                  ))}
                </div>
              </motion.section>

              {/* Contact Section */}
              <motion.section variants={itemVariants}>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                  <div className="max-w-2xl mx-auto text-center">
                    <Shield className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-4">{t`Questions About Privacy?`}</h3>
                    <p className="text-blue-100 mb-6">
                      {t`We're committed to transparency. If you have any questions about our privacy practices or how we protect your data, please reach out.`}
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-3">
                        <Mail className="w-5 h-5" />
                        <span>support@inlirah.com</span>
                      </div>
                      <div className="text-sm text-blue-200">
                        {t`Contact us for privacy-related inquiries`}
                      </div>
                      <div className="pt-4">
                        <Link to="/contact">
                          <Button variant="outline" className="text-white border-white hover:bg-white/10">
                            {t`Visit Contact Page`}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            </motion.div>

            {/* Last Updated */}
            <motion.div
              variants={itemVariants}
              className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center"
            >
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {t`Last updated:`} {effectiveDate}
              </p>
            
              
              <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/dashboard">
                  <Button variant="outline" className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                    {t`Return to Dashboard`}
                  </Button>
                </Link>
                <Link to="/terms-of-service">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    {t`View Terms of Service`}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};