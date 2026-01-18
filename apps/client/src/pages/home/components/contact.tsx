import { t, Trans } from "@lingui/macro";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  ArrowLeft,
  CheckCircle,
  MessageSquare,
  User,
  HelpCircle,
  Globe,
  ArrowRight
} from "lucide-react";
import { Button } from "@reactive-resume/ui";
import { Link } from "react-router";
import { Header } from "./header";
import { Footer } from "./footer";

export const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

    // Add this useEffect to scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]); // Trigger when the pathname changes

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for JWT
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit form');
    }

    const result = await response.json();
    
    setIsSubmitted(true);
    
    // Show success message
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    }, 20000);

  } catch (error: any) {
    console.error('Error submitting form:', error);
    // Show error notification to user
    alert(error.message || t`Failed to send message. Please try again.`);
  } finally {
    setIsSubmitting(false);
  }
};

  // Contact information
  const contactInfo = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: t`Email`,
      details: "support@inlirah.com",
      link: "mailto:support@inlirah.com",
      description: t`For general inquiries and support`
    },
    {
      icon: <Phone className="w-5 h-5" />,
      title: t`Phone`,
      details: "+(237) 680-834-767",
      link: "tel: 680834767",
      description: t`Mon-Fri, 9am-6pm EST`
    },
  
    {
      icon: <Clock className="w-5 h-5" />,
      title: t`Response Time`,
      details: t`Within 24 hours`,
      description: t`For all support requests`
    }
  ];

  // Common contact reasons
  const contactReasons = [
    {
      title: t`Technical Support`,
      description: t`Need help with platform features or account issues`,
      icon: <HelpCircle className="w-5 h-5" />
    },
    {
      title: t`Business Inquiries`,
      description: t`Partnerships, enterprise solutions, or bulk pricing`,
      icon: <Globe className="w-5 h-5" />
    },
    {
      title: t`Feedback & Suggestions`,
      description: t`Share your thoughts to help us improve`,
      icon: <MessageSquare className="w-5 h-5" />
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-8 pb-12 md:pt-12 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
        
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex mb-6">
                <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {t`Get in Touch`}
                  </span>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                <span className="block text-gray-900 dark:text-white mb-2">
                  {t`We're Here`}
                </span>
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t`To Help You Succeed`}
                </span>
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                <Trans>
                  Have questions about Inlirah? Need help with your account? Want to provide feedback?
                  Our team is ready to assist you with any inquiries about our career development platform.
                </Trans>
              </p>

              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">{t`Quick response times`}</span>
              </div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop&crop=center"
                  alt={t`Friendly support team ready to help`}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                
                {/* Floating Badge */}
                <motion.div
                  className="absolute bottom-6 left-6 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">{t`Live Support`}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{t`24/7 Available`}</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <div className="text-blue-600 dark:text-blue-400">
                    {info.icon}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                  {info.title}
                </h3>
                {info.link ? (
                  <a
                    href={info.link}
                    className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors block mb-2"
                  >
                    {info.details}
                  </a>
                ) : (
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {info.details}
                  </div>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {info.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Image */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Contact Reasons */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                {t`How Can We Help?`}
              </h2>
              
              <div className="space-y-6">
                {contactReasons.map((reason, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <div className="text-purple-600 dark:text-purple-400">
                        {reason.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                        {reason.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {reason.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Support Image */}
              <div className="mt-10 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop&crop=center"
                  alt={t`Support team available to help`}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            </motion.div>

            {/* Right: Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
            >
              {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      {t`Message Received Successfully!`}
                    </h3>
                    
                    <div className="space-y-4 max-w-md mx-auto mb-8">
                      <p className="text-lg text-gray-600 dark:text-gray-300">
                        {t`Thank you for reaching out to Inlirah. We truly appreciate you taking the time to contact us.`}
                      </p>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <p className="font-medium text-blue-800 dark:text-blue-300">
                            {t`Please check your inbox (and spam folder) for our confirmation email.`}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300">
                        {t`Our dedicated support team will review your inquiry and get back to you within 24 hours during business days.`}
                      </p>
                      
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{t`Response Time: Typically within 24 hours`}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        onClick={() => setIsSubmitted(false)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {t`Send Another Message`}
                      </Button>
                      
                      <div className="pt-4">
                        <Link 
                          to="/docs" 
                          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                          {t`Browse our documentation`}
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                <>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t`Send a Message`}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    {t`Fill out the form below and we'll respond as soon as possible.`}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t`Your Name`}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="pl-10 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-3 px-4 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                            placeholder={t`Khan Pro`}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t`Email Address`}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="pl-10 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-3 px-4 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                            placeholder={t`support@inlirah.com`}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t`Subject`}
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-3 px-4 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">{t`Select a topic`}</option>
                        <option value="support">{t`Technical Support`}</option>
                        <option value="billing">{t`Billing & Payments`}</option>
                        <option value="feedback">{t`Feedback & Suggestions`}</option>
                        <option value="business">{t`Business Inquiries`}</option>
                        <option value="other">{t`Other`}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t`Message`}
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-3 px-4 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500 resize-none"
                        placeholder={t`How can we help you today?`}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          {t`Sending...`}
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          {t`Send Message`}
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
     <section className="py-12 md:py-20">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center max-w-3xl mx-auto mb-12">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        {t`Frequently Asked Questions`}
      </h2>
      <p className="text-gray-600 dark:text-gray-300">
        {t`Quick answers to common questions`}
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {/* Column 1 - Contains your first FAQ */}
      <div className="space-y-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            {t`How long does support take to respond?`}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t`We typically respond within 24 hours for all inquiries. Priority support is available for premium users.`}
          </p>
        </div>
      </div>

      {/* Column 2 - Contains your second FAQ */}
      <div className="space-y-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            {t`Is there phone support available?`}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t`Yes! Phone support is available during business hours. Email support is available 24/7 for all users.`}
          </p>
        </div>
      </div>

      {/* Column 3 - Contains your third FAQ */}
      <div className="space-y-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            {t`Where can I find documentation?`}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t`Our complete documentation is available at docs.inrah.com. You can also access it from the main navigation.`}
          </p>
        </div>
      </div>
    </div>

    <div className="text-center mt-12">
      <Link to="/docs">
        <Button variant="outline">
          {t`View Full Documentation`}
        </Button>
      </Link>
    </div>
  </div>
</section>

      <Footer />
    </div>
  );
};