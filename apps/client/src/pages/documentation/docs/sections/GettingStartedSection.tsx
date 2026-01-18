import { t, Trans } from "@lingui/macro";
import { 
  Rocket,
  UserPlus,
  User,
  Layout,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Settings,
  BookOpen,
  Mail,
  FileText,
  Briefcase,
  Sparkles,
  Brain 
} from "lucide-react";
import { Button } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { Link } from "react-router";

// Tip Component
const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-200 dark:border-blue-800 my-6">
    <div className="flex items-start gap-3">
      <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">{t`Quick Tip`}</p>
        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">{children}</p>
      </div>
    </div>
  </div>
);

// Section Header Component
interface SectionHeaderProps {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

const SectionHeader = ({ id, title, description, icon }: SectionHeaderProps) => {
  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h2 id={id} className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const GettingStartedSection = () => {
  return (
    <div id="getting-started" className="scroll-mt-28 space-y-16">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-cyan-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-cyan-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {t`Getting Started`}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
                <Trans>
                  Welcome to Inlirah! This guide will help you set up your account, navigate the platform, 
                  and start creating professional documents. Whether you're building resumes, 
                  writing letters, or exploring career insights, we've got you covered.
                </Trans>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Overview */}
      <section id="getting-overview" className="scroll-mt-24"> 
        <div className="space-y-6">
          <SectionHeader
            id="getting-overview" 
            title={t`Quick Start Overview`}
            description={t`Three simple steps to get started`}
            icon={<Zap className="w-6 h-6" />}
          />

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: 1,
                title: t`Create Account`,
                description: t`Sign up for free in under a minute`,
                icon: <UserPlus className="w-5 h-5" />,
                actions: [
                  t`Free to get started`,
                  t`No credit card required`,
                  t`Available worldwide`
                ],
                link: "/auth/register",
                linkText: t`Sign Up Free`,
                color: "blue"
              },
              {
                step: 2,
                title: t`Explore Dashboard`,
                description: t`Discover all platform features`,
                icon: <Layout className="w-5 h-5" />,
                actions: [
                  t`Access all tools`,
                  t`Browse templates`,
                  t`Set preferences`
                ],
                link: "/dashboard",
                linkText: t`View Dashboard`,
                color: "purple"
              },
              {
                step: 3,
                title: t`Start Creating`,
                description: t`Build your first professional document`,
                icon: <FileText className="w-5 h-5" />,
                actions: [
                  t`Create a resume`,
                  t`Write a letter`,
                  t`Read articles`
                ],
                link: "/dashboard/resumes",
                linkText: t`Start Building`,
                color: "green"
              }
            ].map((step, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    step.color === "blue" && "bg-gradient-to-r from-blue-500 to-cyan-500",
                    step.color === "purple" && "bg-gradient-to-r from-purple-500 to-pink-500",
                    step.color === "green" && "bg-gradient-to-r from-green-500 to-emerald-500"
                  )}>
                    <span className="text-white font-bold text-lg">{step.step}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {t`What you'll do:`}
                  </div>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4">
                    {step.actions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Link 
                  to={step.link}
                  className={cn(
                    "inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg",
                    step.color === "blue" && "text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400",
                    step.color === "purple" && "text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400",
                    step.color === "green" && "text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                  )}
                >
                  {step.linkText} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Account Creation  */}
      <section id="getting-creation" className="scroll-mt-24 space-y-6"> 
        <SectionHeader
          id="getting-creation"
          title={t`Creating Your Account`}
          description={t`Simple, secure, and completely free`}
          icon={<UserPlus className="w-6 h-6" />}
        />

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t`Sign Up Process`}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{t`Basic Information`}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t`Enter your name, email, and create a secure password`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{t`Email Verification`}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t`Confirm your email address (recommended)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{t`Access Inlirah`}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t`Join thousands world wide and start your journey`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t`Key Benefits`}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t`Completely Free`}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t`No credit card required to start`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t`Bilingual Platform`}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t`Available in English and French with multilingual articles`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t`Data Privacy`}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t`Your information is secure and private`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            to="/auth/register" 
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white hover:shadow-lg transition-shadow text-center"
          >
            <div className="flex items-center justify-center gap-3">
              <UserPlus className="w-5 h-5" />
              <span className="font-semibold">{t`Create Free Account`}</span>
            </div>
            <p className="text-blue-100 text-sm mt-2">
              {t`No credit card required`}
            </p>
          </Link>

          <Link 
            to="/auth/login" 
            className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow text-center"
          >
            <div className="flex items-center justify-center gap-3">
              <User className="w-5 h-5" />
              <span className="font-semibold text-gray-900 dark:text-white">{t`Already have an account?`}</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              {t`Sign in to continue`}
            </p>
          </Link>
        </div>
      </section>

      {/* Dashboard Navigation */}
      <section id="getting-navigation" className="scroll-mt-24 space-y-6"> 
        <SectionHeader
          id="getting-navigation" 
          title={t`Navigating Your Dashboard`}
          description={t`Your central hub for all platform tools`}
          icon={<Layout className="w-6 h-6" />}
        />

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: t`Resume Builder`,
                description: t`Create and manage professional resumes`,
                icon: <FileText className="w-5 h-5" />,
                link: "/dashboard/resumes",
                color: "blue"
              },
              {
                title: t`Letter Builder`,
                description: t`Write professional correspondence`,
                icon: <Mail className="w-5 h-5" />,
                link: "/dashboard/cover-letters",
                color: "purple"
              },
              {
                title: t`Knowledge Hub`,
                description: t`Access career articles and insights in multiple languages`,
                icon: <BookOpen className="w-5 h-5" />,
                link: "/dashboard/articles",
                color: "green"
              },
              {
                title: t`Account Settings`,
                description: t`Manage your profile and preferences`,
                icon: <Settings className="w-5 h-5" />,
                link: "/dashboard/settings",
                color: "amber"
              }
            ].map((tool, index) => (
              <Link 
                key={index}
                to={tool.link}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    tool.color === "blue" && "bg-blue-100 dark:bg-blue-900/30",
                    tool.color === "purple" && "bg-purple-100 dark:bg-purple-900/30",
                    tool.color === "green" && "bg-green-100 dark:bg-green-900/30",
                    tool.color === "amber" && "bg-amber-100 dark:bg-amber-900/30"
                  )}>
                    {tool.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {tool.title}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tool.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <Tip>
          {t`Use the sidebar navigation to quickly switch between tools. Your dashboard shows recent activity and quick access to your most-used features.`}
        </Tip>
      </section>

      {/* Platform Features - UPDATED ID */}
      <section id="getting-features" className="scroll-mt-24 space-y-6"> {/* Changed from anonymous div to section */}
        <SectionHeader
          id="getting-features" 
          title={t`Core Platform Features`}
          description={t`Everything you need for career success`}
          icon={<Sparkles className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              title: t`Professional Documents`,
              description: t`Create resumes and letters that meet industry standards`,
              features: [
                t`Professional templates`,
                t`ATS-friendly formatting`,
                t`English and French support`,
                t`Export to PDF or Json for the usage`
              ],
              icon: <FileText className="w-6 h-6" />,
              color: "blue"
            },
            {
              title: t`AI-Powered Tools`,
              description: t`Enhance your documents with intelligent assistance`,
              features: [
                t`Complete document generation and improvement`,
                t`Content enhancement for preverence`,
                t`Translation support`,
                t`Professional tone adjustment`
              ],
              icon: <Brain className="w-6 h-6" />,
              color: "purple"
            },
            {
              title: t`Global Accessibility`,
              description: t`Accessible worldwide on any device`,
              features: [
                t`Bilingual interface (English/French)`,
                t`Responsive design`,
                t`Dark/light mode`,
                t`Touch-optimized mobile interface`
              ],
              icon: <Globe className="w-6 h-6" />,
              color: "green"
            },
            {
              title: t`Career Resources`,
              description: t`Learn and grow with expert insights`,
              features: [
                t`Curated professional articles`,
                t`Industry insights`,
                t`Career development tips`,
                t`Multilingual knowledge base`
              ],
              icon: <Briefcase className="w-6 h-6" />,
              color: "amber"
            }
          ].map((feature, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  feature.color === "blue" && "bg-gradient-to-r from-blue-500 to-cyan-500",
                  feature.color === "purple" && "bg-gradient-to-r from-purple-500 to-pink-500",
                  feature.color === "green" && "bg-gradient-to-r from-green-500 to-emerald-500",
                  feature.color === "amber" && "bg-gradient-to-r from-amber-500 to-orange-500"
                )}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {t`Key features:`}
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4">
                  {feature.features.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Next Steps  */}
      <section id="getting-steps" className="scroll-mt-24 space-y-6"> 
        <SectionHeader
          id="getting-steps" 
          title={t`What's Next?`}
          description={t`Continue your journey with these guides`}
          icon={<ArrowRight className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6 mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Link 
            to="/docs/#resume-builder" 
            className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-6 h-6" />
              <h3 className="font-semibold text-lg">
                {t`Resume Builder Guide`}
              </h3>
            </div>
            <p className="text-blue-100 text-sm">
              {t`Learn how to create professional resumes`}
            </p>
          </Link>

          <Link 
            to="/docs/#letter-builder" 
            className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-6 h-6" />
              <h3 className="font-semibold text-lg">
                {t`Letter Builder Guide`}
              </h3>
            </div>
            <p className="text-purple-100 text-sm">
              {t`Master professional letter writing`}
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
};