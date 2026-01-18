import { t } from "@lingui/macro";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { useEffect } from "react";
import { Button } from "@reactive-resume/ui";
import { 
  Shield, 
  FileText, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Lock,
  Mail,
  Calendar,
  DollarSign,
  X,
  Ban,
  Book,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { Header } from "./header";
import { Footer } from "./footer";

export const TermsOfServicePage = () => {
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
                {t`Terms of Service`}
              </span>
              <span className="block text-2xl sm:text-3xl text-gray-600 dark:text-gray-300">
                {t`Our Agreement with You`}
              </span>
            </motion.h1>
            
            <motion.div 
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm max-w-3xl mx-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{t`Effective Date`}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{effectiveDate}</div>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                    <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{t`Last Updated`}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{effectiveDate}</div>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{t`Version`}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">2.0</div>
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
            {/* Terms Content */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="space-y-12"
            >
              {/* Section 1: Acceptance of Terms */}
              <motion.section variants={itemVariants} className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400">1</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t`Acceptance of Terms`}</h2>
                </div>
                <div className="pl-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {t`By accessing and using Inlirah ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree with any of these terms, you may not use or access this Platform.`}
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          {t`Important Notice`}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t`These terms constitute a legally binding agreement. By creating an account or using our services, you acknowledge that you have read, understood, and agree to be bound by these terms.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Section 2: Account Registration */}
              <motion.section variants={itemVariants} className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400">2</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t`Account Registration`}</h2>
                </div>
                <div className="pl-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {t`To access certain features of the Platform, you must register for an account. You agree to:`}
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {t`Provide accurate and current information`}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {t`Maintain account security`}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {t`Not share account credentials`}
                      </span>
                    </li>
                  </ul>
                </div>
              </motion.section>

              {/* Section 3: User Responsibilities */}
              <motion.section variants={itemVariants} className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400">3</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t`User Responsibilities`}</h2>
                </div>
                <div className="pl-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {t`You are responsible for all activities under your account and agree to use the Platform only for lawful purposes.`}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-200 dark:border-red-800">
                      <h4 className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                        <Ban className="w-4 h-4" />
                        {t`Prohibited Actions`}
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <span className="text-red-600 dark:text-red-400">
                            {t`Violate applicable laws`}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <span className="text-red-600 dark:text-red-400">
                            {t`Infringe intellectual property`}
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <h4 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {t`Expected Conduct`}
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <span className="text-green-600 dark:text-green-400">
                            {t`Use professional language`}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <span className="text-green-600 dark:text-green-400">
                            {t`Provide accurate information`}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Section 4: Service Usage */}
              <motion.section variants={itemVariants} className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400">4</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t`Service Usage`}</h2>
                </div>
                <div className="pl-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {t`Inlirah provides career tools including resume building, cover letter creation, and knowledge resources. Our services include:`}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white">{t`Resume Building`}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t`Professional resume creation`}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <FileText className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white">{t`Letter Writing`}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t`Cover letter tools`}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <Book className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white">{t`Knowledge Resources`}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t`Career insights`}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Section 5: Content Ownership */}
              <motion.section variants={itemVariants} className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400">5</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t`Content Ownership`}</h2>
                </div>
                <div className="pl-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {t`You retain ownership of your content. You grant us a license to provide our services.`}
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          {t`User Content Rights`}
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                            <span className="text-gray-600 dark:text-gray-300">
                              {t`You own your documents`}
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                            <span className="text-gray-600 dark:text-gray-300">
                              {t`You control your data`}
                            </span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          {t`Platform License`}
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                            <span className="text-gray-600 dark:text-gray-300">
                              {t`Store your content securely`}
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                            <span className="text-gray-600 dark:text-gray-300">
                              {t`Provide our services to you`}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Section 6: Payment Terms */}
              <motion.section variants={itemVariants} className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400">6</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t`Payment Terms`}</h2>
                </div>
                <div className="pl-11">
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4 border border-amber-200 dark:border-amber-800 mb-6">
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                          {t`Subscription & Coin Model`}
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          {t`Inlirah operates on a coin-based subscription model. You can purchase coins or subscribe to receive coins regularly.`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {t`Key payment terms:`}
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {t`All payments processed through secure providers`}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {t`Subscriptions auto-renew unless cancelled`}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {t`Refunds subject to applicable refund policy`}
                      </span>
                    </li>
                  </ul>
                </div>
              </motion.section>

              {/* Section 7: Termination */}
              <motion.section variants={itemVariants} className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400">7</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t`Termination`}</h2>
                </div>
                <div className="pl-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {t`You may terminate your account at any time. We may terminate or suspend access for violations of these terms.`}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-200 dark:border-red-800">
                      <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">
                        {t`Upon Termination`}
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5"></div>
                          <span className="text-red-600 dark:text-red-400">
                            {t`Access to service ends`}
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">
                        {t`Data Retention`}
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5"></div>
                          <span className="text-green-600 dark:text-green-400">
                            {t`Export your data before termination`}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Section 8: Limitation of Liability */}
              <motion.section variants={itemVariants} className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400">8</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t`Limitation of Liability`}</h2>
                </div>
                <div className="pl-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {t`To the extent permitted by law, Inlirah shall not be liable for indirect, incidental, or consequential damages arising from your use of the Platform.`}
                  </p>
                  <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-red-700 dark:text-red-300 mb-1">
                          {t`Disclaimer`}
                        </h4>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {t`The Platform is provided "as is" without warranties of any kind. We do not guarantee job placement or specific career outcomes.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Section 9: Changes to Terms */}
              <motion.section variants={itemVariants} className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400">9</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t`Changes to Terms`}</h2>
                </div>
                <div className="pl-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {t`We may modify these terms at any time. We will notify users of material changes. Continued use after changes constitutes acceptance.`}
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                          {t`Your Responsibility`}
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          {t`Review these terms periodically. The "Last Updated" date indicates when terms were revised.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Section 10: Contact Information */}
              <motion.section variants={itemVariants} className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400">10</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t`Contact Information`}</h2>
                </div>
                <div className="pl-11">
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {t`If you have questions about these Terms of Service, please contact us:`}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-blue-500" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{t`Email Support`}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">support@inlirah.com</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{t`Contact Page`}</div>
                          <Link 
                            to="/contact" 
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            inlirah.com/contact
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Final Notice */}
              <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold mb-2">{t`Legal Protection for All`}</h3>
                    <p className="text-blue-100">
                      {t`These terms are designed to ensure a safe and professional environment for career advancement.`}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Acceptance Section */}
            <motion.div
              variants={itemVariants}
              className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {t`By using Inlirah, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.`}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/dashboard">
                    <Button variant="outline" className="border-gray-300 dark:border-gray-600">
                      {t`Return to Dashboard`}
                    </Button>
                  </Link>
                  <Link to="/privacy-policy">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      <Lock className="w-4 h-4 mr-2" />
                      {t`View Privacy Policy`}
                    </Button>
                  </Link>
                </div>
              
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};