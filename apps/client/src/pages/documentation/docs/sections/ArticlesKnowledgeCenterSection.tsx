import { t, Trans } from "@lingui/macro";
import { 
  BookOpen,
  Search,
  Bookmark,
  Globe,
  Heart,
  Share2,
  Download,
  Crown,
  Award,
  Zap,
  Target,
  Filter,
  Clock,
  TrendingUp,
  Star,
  Eye,
  MessageCircle,
  Save,
  Upload,
  Brain,
  CheckCircle2,
  Lightbulb,
  Smartphone,
  Layout,
  Type,
  Palette,
  Settings,
  Bell,
  Users,
  BarChart,
  Compass,
  Folder,
  Tag,
  Calendar,
  User,
  Lock,
  Unlock,
  Trophy,
  Gift,
  Book,
  Headphones,
  Printer,
  HelpCircle,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Languages,
  Target as TargetIcon,
  Coffee,
  History, 
  FireExtinguisherIcon,
  Shield,
  AlertTriangle,


} from "lucide-react";
import { Button } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { Link } from "react-router";
 import { Mail, Twitter, Linkedin } from "lucide-react";

// Tip Component
const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-200 dark:border-blue-800 my-6">
    <div className="flex items-start gap-3">
      <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">{t`Pro Tip`}</p>
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

export const ArticlesKnowledgeCenterSection = () => {
  return (
    <div id="articles-knowledge-center" className="scroll-mt-28 space-y-16">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {t`Articles & Knowledge Center`}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
                {t`Discover expertly curated content, save articles for later, request translations, earn achievements, and access premium insights designed to accelerate your learning.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => document.getElementById('articles-accessing')?.scrollIntoView({ behavior: 'smooth' })}
          className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-xl border border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform"
        >
          <div className="flex flex-col items-center text-center">
            <Compass className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
            <span className="font-medium text-sm text-gray-900 dark:text-white">{t`Access`}</span>
          </div>
        </button>
        <button
          onClick={() => document.getElementById('articles-reading')?.scrollIntoView({ behavior: 'smooth' })}
          className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl border border-green-200 dark:border-green-800 hover:scale-105 transition-transform"
        >
          <div className="flex flex-col items-center text-center">
            <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
            <span className="font-medium text-sm text-gray-900 dark:text-white">{t`Read`}</span>
          </div>
        </button>
        <button
          onClick={() => document.getElementById('articles-multilingual')?.scrollIntoView({ behavior: 'smooth' })}
          className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl border border-purple-200 dark:border-purple-800 hover:scale-105 transition-transform"
        >
          <div className="flex flex-col items-center text-center">
            <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
            <span className="font-medium text-sm text-gray-900 dark:text-white">{t`Translate`}</span>
          </div>
        </button>
        <button
          onClick={() => document.getElementById('articles-achievements')?.scrollIntoView({ behavior: 'smooth' })}
          className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl border border-amber-200 dark:border-amber-800 hover:scale-105 transition-transform"
        >
          <div className="flex flex-col items-center text-center">
            <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400 mb-2" />
            <span className="font-medium text-sm text-gray-900 dark:text-white">{t`Achievements`}</span>
          </div>
        </button>
      </div>

      {/* Accessing Articles */}
      <section id="articles-accessing" className="scroll-mt-24">
        <SectionHeader
          id="articles-accessing"
          title={t`Accessing Articles`}
          description={t`Multiple pathways to discover knowledge`}
          icon={<Compass className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`Primary Access Points`}
            </h3>
            <div className="space-y-4">
              {[
                {
                  path: "/dashboard/articles",
                  title: t`Dashboard Feed`,
                  description: t`Personalized recommendations based on your interests`,
                  icon: <Layout className="w-5 h-5" />,
                  badge: t`Recommended`
                },
                {
                  path: "/dashboard/articles/all",
                  title: t`All Articles`,
                  description: t`Complete catalog with advanced filters`,
                  icon: <Search className="w-5 h-5" />,
                  badge: t`Full Access`
                },
                {
                  path: "/dashboard/categories",
                  title: t`Categories`,
                  description: t`Browse by topic and expertise areas`,
                  icon: <Folder className="w-5 h-5" />
                },
                {
                  path: "/dashboard/articles?tab=trending",
                  title: t`Trending`,
                  description: t`Most popular content in the community`,
                  icon: <FireExtinguisherIcon className="w-5 h-5" />
                }
              ].map((item, index) => (
                <Link 
                  key={index}
                  to={item.path}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {item.title}
                      </h4>
                      {item.badge && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`Quick Navigation Tips`}
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white mb-2">
                  {t`Keyboard Shortcuts`}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">⌘K</kbd>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t`Quick Search`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">⌘S</kbd>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t`Save Article`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">⌘F</kbd>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t`Find in Article`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">/</kbd>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t`Command Menu`}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white mb-2">
                  {t`Smart Features`}
                </div>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span>{t`AI-powered recommendations`}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-500" />
                    <span>{t`Continue reading where you left off`}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-500" />
                    <span>{t`New content notifications`}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Tip>
          {t`Save articles for the fastest access to curated knowledge.`}
        </Tip>
      </section>

      {/* Reading Experience */}
      <section id="articles-reading" className="scroll-mt-24">
        <SectionHeader
          id="articles-reading"
          title={t`Reading Experience`}
          description={t`Customizable environment optimized for learning`}
          icon={<BookOpen className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t`Customization Options`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Tailor reading to your preferences`}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  setting: t`Font Size`,
                  description: t`Adjust from 12px to 24px`,
                  icon: <Type className="w-4 h-4" />
                },
                {
                  setting: t`Line Height`,
                  description: t`Set spacing from 1.4 to 2.2`,
                  icon: <Layout className="w-4 h-4" />
                },
                {
                  setting: t`Font Family`,
                  description: t`Choose from 5 typefaces`,
                  icon: <Palette className="w-4 h-4" />
                },
                {
                  setting: t`Theme`,
                  description: t`Light, Dark, or Sepia mode`,
                  icon: <Eye className="w-4 h-4" />
                }
              ].map((item, index) => (
                <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">{item.setting}</div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t`Reading Modes`}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Choose how you consume content`}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                {
                  mode: t`Standard View`,
                  description: t`Full-featured interface with all tools. Ideal for in-depth reading and engagement with curated articles.`,
                  features: [t`Comments`, t`Sharing`, t`Translation`, t`Save options,`, t`Like`],
                  icon: <Layout className="w-4 h-4" />
                },
                
              ].map((mode, index) => (
                <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        {mode.icon}
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">{mode.mode}</div>
                    </div>
                    {index === 2 && (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{mode.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {mode.features.map((feature, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded text-xs">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {t`Reading Progress & Tracking`}
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="font-medium text-gray-900 dark:text-white">{t`Progress Bar`}</div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t`Visual indicator showing how much you've read`}
              </p>
            </div>
            <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Bookmark className="w-4 h-4" />
                </div>
                <div className="font-medium text-gray-900 dark:text-white">{t`Last Position`}</div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t`Automatically saves where you stopped reading`}
              </p>
            </div>
            <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="font-medium text-gray-900 dark:text-white">{t`Reading Time`}</div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t`Estimated time to complete each article`}
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Search & Discovery */}
      <section id="articles-search" className="scroll-mt-24">
        <SectionHeader
          id="articles-search"
          title={t`Search & Discovery`}
          description={t`Find exactly what you're looking for`}
          icon={<Search className="w-6 h-6" />}
        />

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`Advanced Search`}
            </h3>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="font-medium text-gray-900 dark:text-white mb-2">
                  {t`Search Filters`}
                </div>
                <div className="space-y-2">
                  {[
                    { filter: t`By Category`, example: 'category:"Technology"' },
                    { filter: t`By Author`, example: 'author:"Jane Smith"' },
                    { filter: t`By Reading Time`, example: 'reading_time:<10' },
                    { filter: t`By Date`, example: 'published:2024' },
                    { filter: t`By Tags`, example: 'tags:AI,machine-learning' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.filter}</span>
                      <code className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        {item.example}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`Discovery Features`}
            </h3>
            <div className="space-y-4">
              {[
                {
                  feature: t`Related Articles`,
                  description: t`AI-powered suggestions based on what you're reading`,
                  icon: <Brain className="w-4 h-4" />
                },
                {
                  feature: t`Trending Now`,
                  description: t`Most popular content in the community this week`,
                  icon: <TrendingUp className="w-4 h-4" />
                },
                {
                  feature: t`Editor's Pick`,
                  description: t`Curated selections by our editorial team`,
                  icon: <Star className="w-4 h-4" />
                },
                {
                  feature: t`Based on History`,
                  description: t`Personalized recommendations from your reading habits`,
                  icon: <History className="w-4 h-4" />
                }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{item.feature}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Tip>
          {t`Use quotation marks for exact phrase searches: "machine learning" will find articles containing that exact phrase.`}
        </Tip>
      </section>

      {/* Multilingual Features */}
      <section id="articles-multilingual" className="scroll-mt-24">
        <SectionHeader
          id="articles-multilingual"
          title={t`Multilingual Features`}
          description={t`Read and translate content in multiple languages`}
          icon={<Globe className="w-6 h-6" />}
        />

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t`Language Support`}
            </h3>
            <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-medium">
              10+ languages
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[
              { code: "en", name: "English", flag: "🇺🇸" },
              { code: "fr", name: "Français", flag: "🇫🇷" },
              { code: "es", name: "Español", flag: "🇪🇸" },
              { code: "de", name: "Deutsch", flag: "🇩🇪" },
              { code: "pt", name: "Português", flag: "🇵🇹" },
              { code: "ar", name: "العربية", flag: "🇸🇦" },
              { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
              { code: "zh", name: "中文", flag: "🇨🇳" },
              { code: "ja", name: "日本語", flag: "🇯🇵" },
              { code: "ru", name: "Русский", flag: "🇷🇺" }
            ].map((lang) => (
              <div key={lang.code} className="flex flex-col items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <span className="text-2xl mb-2">{lang.flag}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white text-center">{lang.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{lang.code.toUpperCase()}</span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                               <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-blue-900 dark:text-blue-300 mb-1">
                  {t`AI-Powered Translations`}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {t`Real-time translation using advanced neural networks for natural-sounding results. Translations improve with system review.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t`How to Request Translations`}
            </h3>
            <div className="space-y-4">
              {[
                {
                  step: t`Open article`,
                  description: t`Navigate to any article you want translated`,
                  icon: <BookOpen className="w-4 h-4" />
                },
                {
                  step: t`Click translate button`,
                  description: t`Find the globe icon in the toolbar`,
                  icon: <Globe className="w-4 h-4" />
                },
                {
                  step: t`Select language`,
                  description: t`Choose from available target languages`,
                  icon: <Languages className="w-4 h-4" />
                },
                {
                  step: t`Submit request`,
                  description: t`AI processes request instantly for premium users`,
                  icon: <Zap className="w-4 h-4" />
                }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{item.step}</span>
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                        {`Step ${index + 1}`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
    {t`Translation Quality & Review Process`}
  </h3>
  <div className="space-y-2">
    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-blue-500" />
        <span className="font-medium text-gray-900 dark:text-white">{t`Important Notice`}</span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        {t`While we use advanced AI models and algorithms, we do not guarantee translation perfection.`}
      </p>
     
    </div>

    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/20">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900 dark:text-white">{t`Multi-Layer AI Processing`}</span>
        <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
          {t`Real-time`}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t`Advanced algorithms perform contextual analysis, grammar correction, and terminology validation. Heavy system processing ensures optimal translation quality.`}
      </p>
    </div>
    
    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/20">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900 dark:text-white">{t`Post-Translation Review`}</span>
        <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
          {t`Premium Feature`}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t`Professional translators review AI translations for accuracy and cultural nuances during working hours (not immediately). This ensures high-quality translations within 24-48 hours.`}
      </p>
    </div>
    
    

    <div className="p-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-medium text-amber-800 dark:text-amber-300 mb-1">
            {t`User Responsibility Notice`}
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {t`Always feel free to provide feedback or reach out to our support team for assistance.`}
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
        </div>
      </section>


      {/* Achievements & Gamification */}
{/* Achievements & Gamification */}
<section id="articles-achievements" className="scroll-mt-24">
  <SectionHeader
    id="articles-achievements"
    title={t`Earn Achievements`}
    description={t`Read articles, track progress, and unlock rewards`}
    icon={<Trophy className="w-6 h-6" />}
  />

  {/* Simple Guide to Earn */}
  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      {t`How to Earn Achievements`}
    </h3>
    
    <div className="space-y-4">
      {/* Step 1 */}
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">1</span>
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {t`Read articles daily`}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t`Open and read at least one article each day to earn streak badges`}
          </p>
        </div>
      </div>

      {/* Step 2 */}
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">2</span>
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {t`Read in different languages`}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t`Use the translate feature to read articles in multiple languages`}
          </p>
        </div>
      </div>

      {/* Step 3 */}
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">3</span>
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {t`Save and share articles`}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t`Click the bookmark icon to save articles, or share them with others`}
          </p>
        </div>
      </div>

      {/* Step 4 */}
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">4</span>
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {t`Check your progress`}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t`Visit your profile to see earned achievements and what to work on next`}
          </p>
        </div>
      </div>
    </div>

    {/* Quick Tips */}
    <div className="mt-6 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-4 h-4 text-yellow-500" />
        <div className="font-medium text-gray-900 dark:text-white">{t`Quick Tips`}</div>
      </div>
      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
        <li>• {t`Focus on daily streaks first - they give the most points`}</li>
        <li>• {t`Try reading in different categories to earn variety badges`}</li>
        <li>• {t`Your progress automatically saves - no need to do anything extra`}</li>
      </ul>
    </div>
  </div>

  {/* Simple View Progress */}
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      {t`Check Your Achievements`}
    </h3>
    
    <div className="space-y-4">
      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="font-medium text-gray-900 dark:text-white mb-1">
          {t`Visit your profile`}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {t`Go to your profile page to see all earned badges and progress`}
        </p>
        <Link
          to="/dashboard/profile"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          <User className="w-4 h-4" />
          {t`Go to Profile`}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      
    </div>
  </div>
</section>
      


      {/* Call to Action */}
      <div className="text-center py-12">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t`Ready to dive in?`}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            {t`Start exploring our knowledge center today and unlock your learning potential.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard/articles"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              {t`Browse Articles`}
            </Link>
            <Link
              to="/dashboard/myarticles"
              className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t`View My Library`}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

