import { t, Trans } from "@lingui/macro";
import { motion } from "framer-motion";
import {
  Brain,
  Cloud,
  Files,
  Lock,
  Star,
  TextAa,
  Translate,
  Eye,
  Swatches,
  Layout,
  Briefcase,
  Rocket,
  Lightning,
  Target,
  ShieldCheck,
  Globe,
  ChartLineUp,
  MagicWand,
  Sparkle,
  Trophy,
  Crown,
  TrendUp,
  ArrowRight
 
} from "@phosphor-icons/react";
import { Link } from "react-router";
import { cn } from "@reactive-resume/utils";

type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  gradient?: string;
};

const features: Feature[] = [
  {
    icon: <Rocket size={32} />,
    title: t`Profesional Resume Building`,
    description: t`Intelligent system that crafts ATS-beating, recruiter-winning resumes in minutes, not hours.`,
    badge: t`perfection`,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: <Sparkle size={32} />,
    title: t`Professional Letter Crafting`,
    description: t`Generate perfectly structured cover letters, recommendations, business and all kinds of correspondence with professional tone and impact.`,
    badge: t`Polished`,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: <Crown size={32} />,
    title: t`Unbeatable Knowledge Hub`,
    description: t`meticulously filtered across diverse domains—strategic insights, career mastery, and personal development distilled into actionable wisdom that accelerates excellence.`,
    badge: t`Stay Ahead`,
    gradient: "from-amber-500 to-orange-500",
  },
{
  icon: <Star size={32} weight="fill" />,
  title: t`Engage & Curate Expert Knowledge`,
  description: t`Bookmark, comment on, and engage with premium career articles. Build your personal knowledge library while learning from professionally curated insights and community wisdom.`,
  badge: t`Knowledge Hub`,
  gradient: "from-amber-500 to-orange-600",
},
  {
    icon: <Target size={32} />,
    title: t`Precision Targeting`,
    description: t`Customize every resume and letter for exact job descriptions, company cultures, and industry expectations or preferences.`,
    badge: t`Perfect Fit`,
    gradient: "from-red-500 to-rose-500",
  },
  {
    icon: <Lightning size={32} />,
    title: t`Instant Professional Results`,
    description: t`No drafts, no revisions needed. Get complete, polished professional documents ready for submission in no time.`,
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: <ShieldCheck size={32} />,
    title: t`Enterprise-Grade Security`,
    description: t`Best security and privacy controls ensure your sensitive career information remains completely confidential.`,
    badge: t`Ultra Secure`,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: <Globe size={32} />,
    title: t`Global Career Reach`,
    description: t`Create multilingual documents with culturally adapted content for opportunities anywhere in the world.`,
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    icon: <MagicWand size={32} />,
    title: t`Complete Creative Control`,
    description: t`Full editing freedom to add, adjust, and perfect any content before or after generation. Your vision, perfected.`,
    gradient: "from-pink-500 to-rose-500",
  },
{
  icon: <Lightning size={32} weight="fill" />,
  title: t`Complex Power, Simple Use`,
  description: t`Expert-grade tools presented with unparalleled clarity and intuitive design. Achieve professional mastery from your first interaction—no learning curve, just results.`,
  badge: t`Immediate Expertise`,
  gradient: "from-red-500 to-rose-600",
},
  {
    icon: <Trophy size={32} />,
    title: t`Industry Recognition Ready`,
    description: t`Craft resumes and letters that meet the highest standards of Fortune 500 companies and elite institutions.`,
    badge: t`Top Tier`,
    gradient: "from-amber-500 to-yellow-500",
  },
  {
    icon: <TrendUp size={32} />,
    title: t`Continuous Career Growth`,
    description: t`Leverage our knowledge hub to evolve your skills, strategy, and positioning for long-term career success.`,
    gradient: "from-teal-500 to-emerald-500",
  },
];

export const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="relative py-24 sm:py-32 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 text-foreground transition-colors overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container relative mx-auto px-6">
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-sm font-semibold text-white mb-4">
            <Sparkle size={16} weight="fill" />
            <span>{t`The Complete Career Platform Features`}</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {t`Everything you need for career domination.`}
          </h2>
          
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            <Trans>
              Inlirah delivers the trifecta of career success: professional resume building, powerful letter crafting, and unmatched knowledge resources—all designed to keep you ahead, no matter what.
            </Trans>
          </p>
        </div>

        {/* Platform Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-800">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
              <Briefcase size={24} className="text-white" weight="fill" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t`Professional Resumes`}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t`AI-optimized resumes that pass automated screening and impress human recruiters simultaneously.`}
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <TextAa size={24} className="text-white" weight="fill" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t`Perfect Letters`}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t`Professionally crafted correspondence for every career situation, from applications to negotiations.`}
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center mb-4">
              <Brain size={24} className="text-white" weight="fill" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t`Career Wisdom Hub`}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t`Expert knowledge, strategies, and insights to navigate career challenges and seize opportunities.`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0, transition: { delay: index * 0.1, duration: 0.5 } }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-left bg-white dark:bg-gray-900 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-900/20"
            >
              {/* Gradient accent */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
              
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-700 dark:group-hover:from-white dark:group-hover:to-gray-300 group-hover:bg-clip-text transition-all duration-300">
                    {feature.title}
                  </h4>
                  {feature.badge && (
                    <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-800 dark:to-gray-600 text-white rounded-full">
                      {feature.badge}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
              
              {/* Hover indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 p-8 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800 max-w-2xl mx-auto">
  <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
    <Lightning size={28} className="text-white" weight="fill" />
  </div>
  
  <div className="flex-1 text-center sm:text-left">
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
      {t`Ready to dominate your career?`}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
      {t`Join thousands of professionals who trust Inlirah for their complete career toolkit.`}
    </p>
    
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <Link 
        to="/dashboard"
        className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base w-full sm:w-auto"
      >
        <span>{t`Start Your Journey`}</span>
        <ArrowRight size={20} className="ml-2" weight="bold" />
      </Link>
      
      <Link 
        to="/dashboard/pricing"
        className="inline-flex items-center justify-center bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors duration-200 text-sm w-full sm:w-auto"
      >
        <span>{t`View Plans`}</span>
      </Link>
    </div>
  </div>
</div>
        </motion.div>
      </div>
    </section>
  );
};