import { t, Trans } from "@lingui/macro";
import { 
  Home,
  Globe,
  Smartphone,
  Sparkles,
  Shield,
  Briefcase,
  FileText,
  Mail,
  BookOpen,
  CheckCircle2,
  Users,
  Zap,
  Brain
} from "lucide-react";
import { cn } from "@reactive-resume/utils";
import { Link } from "react-router";

// Tip Component
const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-200 dark:border-blue-800 my-6">
    <div className="flex items-start gap-3">
      <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
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

export const PlatformOverviewSection = () => {
  return (
    <div id="platform-overview" className="scroll-mt-28 space-y-16">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-cyan-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-cyan-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
              <Home className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {t`Platform Overview`}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
                <Trans>
                  Inlirah is your comprehensive career development platform. We provide professional tools 
                  for resume building, letter writing, and career insights—all designed for global professionals.
                </Trans>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform at a Glance */}
      <section id="platform-glance" className="scroll-mt-24">
        <SectionHeader
          id="platform-glance"
          title={t`Platform at a Glance`}
          description={t`Quick overview of what Inlirah offers`}
          icon={<Briefcase className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: t`Professional Documents`,
              description: t`Create resumes and letters with professional templates and formatting`,
              icon: <FileText className="w-5 h-5" />,
              count: t`Professional templates`,
              color: "blue"
            },
            {
              title: t`Global Accessibility`,
              description: t`Accessible worldwide with bilingual support across all devices`,
              icon: <Globe className="w-5 h-5" />,
              count: t`English & French`,
              color: "purple"
            },
            {
              title: t`Smart Features`,
              description: t`AI-powered enhancements to improve your professional documents`,
              icon: <Brain className="w-5 h-5" />,
              count: t`AI assistance`,
              color: "green"
            }
          ].map((item, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  item.color === "blue" && "bg-blue-100 dark:bg-blue-900/30",
                  item.color === "purple" && "bg-purple-100 dark:bg-purple-900/30",
                  item.color === "green" && "bg-green-100 dark:bg-green-900/30"
                )}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.count}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Core Features */}
      <section id="platform-features" className="scroll-mt-24">
        <SectionHeader
          id="core-features"
          title={t`Core Features`}
          description={t`Essential tools for your career development`}
          icon={<Zap className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t`Resume Builder`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Create professional resumes`}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {t`Key capabilities:`}
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t`Professional templates`}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t`ATS-friendly formatting`}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t`Export to PDF/Word`}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t`Letter Builder`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Write professional correspondence`}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {t`Key capabilities:`}
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t`Multiple letter categories`}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t`AI writing assistance`}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t`Professional formatting`}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t`Knowledge Center`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Career insights and articles in multiple languages`}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {t`Key capabilities:`}
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t`Professional articles`}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t`Multilingual content`}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t`Career development tips`}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t`AI Features`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Intelligent document enhancement`}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {t`Key capabilities:`}
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t`Grammar and style improvement`}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t`Content enhancement suggestions`}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{t`Professional tone adjustment`}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section id="platform-benefits" className="scroll-mt-24">
        <SectionHeader
          id="key-benefits"
          title={t`Key Benefits`}
          description={t`Why professionals choose Inlirah`}
          icon={<Users className="w-6 h-6" />}
        />

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{t`Bilingual Platform`}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t`Available in English and French with multilingual articles worldwide`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{t`Device Agnostic`}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t`Perfect experience on desktop, tablet, or mobile devices`}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{t`Professional Quality`}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t`Industry-standard documents that meet professional expectations`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{t`Easy to Use`}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t`Intuitive interface with guided workflows for quick results`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tip>
          {t`All core features are available for free, with the option to enhance your experience with additional tools.`}
        </Tip>
      </section>

      {/* Quick Start Guide */}
      <section id="platform-start" className="scroll-mt-24">
        <SectionHeader
          id="quick-start"
          title={t`Getting Started`}
          description={t`Begin using Inlirah in minutes`}
          icon={<Zap className="w-6 h-6" />}
        />

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: t`Create Account`,
                description: t`Sign up for free with email or social login`,
                action: t`Start free`
              },
              {
                step: "2",
                title: t`Choose Tool`,
                description: t`Select Resume Builder, Letter Builder, or explore Articles`,
                action: t`Explore tools`
              },
              {
                step: "3",
                title: t`Begin Creating`,
                description: t`Use templates and guided workflows to create your documents`,
                action: t`Start creating`
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold">{item.step}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {item.description}
                </p>
                <Link 
                  to="/dashboard"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {item.action}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <div className="grid md:grid-cols-2 gap-6 mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <Link 
          to="/docs/getting-started" 
          className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6" />
            <h3 className="font-semibold text-lg">
              {t`Getting Started Guide`}
            </h3>
          </div>
          <p className="text-blue-100 text-sm">
            {t`Detailed guide to begin using all platform features`}
          </p>
        </Link>

        <Link 
          to="/dashboard" 
          className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <Briefcase className="w-6 h-6" />
            <h3 className="font-semibold text-lg">
              {t`Go to Dashboard`}
            </h3>
          </div>
          <p className="text-purple-100 text-sm">
            {t`Start creating resumes, letters, or exploring articles`}
          </p>
        </Link>
      </div>
    </div>
  );
};