import { t, Trans } from "@lingui/macro";
import { cn } from "@reactive-resume/utils";
import { Logo } from "@/client/components/logo";
import { LocaleSwitch } from "@/client/components/locale-switch";
import { ThemeSwitch } from "@/client/components/theme-switch";
import { useEffect, useRef, useState, Fragment } from "react";
import { Link, useNavigate } from "react-router";
import { NotificationCenter } from "@/client/components/notifications/NotificationCenter";
import { Menu, Transition } from "@headlessui/react";
import { useUser } from "@/client/services/user";
import { SignOut, Warning, SignIn } from "@phosphor-icons/react"; 

import { ArrowLeft, ChevronUp } from "lucide-react";

import {
  PlatformOverviewSection,
  GettingStartedSection,
  ResumeBuilderSection,
  LetterBuilderSection,
  ArticlesKnowledgeCenterSection,
  PaymentsPremiumTrustSection,
} from "./docs/index";

// Add the missing icons import at the top
import { 
  Home,
  Rocket,
  FileText,
  Mail,
  BookOpen,
  CreditCard,
  ChevronRight,
  ChevronDown,
  Zap,
  Layout,
  Grid3x3,
  Palette,
  Download,
  Sparkles,
  Award,
  Smartphone,
  // Add these letter-specific icons
  Target,
  Building,
  Type,
  Save,
  Coins,
  Wand2,
  Share2,
  Printer,
  PlusCircle,
  Upload,
  Brain,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Wrench,
  HelpCircle,
  Briefcase,
  GraduationCap,
  ShoppingCart,
  Crown,
  User,
  Search,
  Globe,
  Workflow,
  Edit3,
  Eye,

  ArrowRight,
  Compass,
  Users,
  Trophy,
  UserPlus,
  DollarSign,
  Wallet,
  Shield,
  RefreshCw,
  TrendingUp,
  Calculator,
  BarChart,

  Calendar,
  Lock
} from "lucide-react";
import { Button } from "@reactive-resume/ui";


// Complete updated sections array
const sections = [
  // Platform Overview and Subsections
  { id: "platform-overview", title: t`Platform Overview`, icon: <Home className="w-4 h-4" />, level: 1 },
  { id: "platform-glance", title: t`Platform at a Glance`, icon: <Briefcase className="w-4 h-4" />, level: 2 },
  { id: "platform-features", title: t`Core Features`, icon: <Zap className="w-4 h-4" />, level: 2 },
  { id: "platform-benefits", title: t`Key Benefits`, icon: <Users className="w-4 h-4" />, level: 2 },
  { id: "platform-start", title: t`Getting Started`, icon: <Zap className="w-4 h-4" />, level: 2 },
  
  // Getting Started and Subsections
  { id: "getting-started", title: t`Getting Started`, icon: <Rocket className="w-4 h-4" />, level: 1 },
  { id: "getting-overview", title: t`Quick Start Overview`, icon: <Zap className="w-4 h-4" />, level: 2 },
  { id: "getting-creation", title: t`Creating Your Account`, icon: <UserPlus className="w-4 h-4" />, level: 2 },
  { id: "getting-navigation", title: t`Navigating Your Dashboard`, icon: <Layout className="w-4 h-4" />, level: 2 },
  { id: "getting-features", title: t`Core Platform Features`, icon: <Sparkles className="w-4 h-4" />, level: 2 },
  { id: "getting-steps", title: t`What's Next?`, icon: <ArrowRight className="w-4 h-4" />, level: 2 },
  
  // Resume Builder and Subsections
  { id: "resume-builder", title: t`Resume Builder`, icon: <FileText className="w-4 h-4" />, level: 1 },
  { id: "resume-getting-started", title: t`Getting Started`, icon: <Zap className="w-4 h-4" />, level: 2 },
  { id: "resume-interface", title: t`Interface Guide`, icon: <Layout className="w-4 h-4" />, level: 2 },
  { id: "resume-sections", title: t`Resume Sections`, icon: <Grid3x3 className="w-4 h-4" />, level: 2 },
  { id: "resume-design", title: t`Design & Templates`, icon: <Palette className="w-4 h-4" />, level: 2 },
  { id: "resume-export", title: t`Export & Sharing`, icon: <Download className="w-4 h-4" />, level: 2 },
  { id: "resume-ai-features", title: t`AI Features`, icon: <Sparkles className="w-4 h-4" />, level: 2 },
  { id: "resume-best-practices", title: t`Best Practices`, icon: <Award className="w-4 h-4" />, level: 2 },
  
  // Letter Builder and Subsections
  { id: "letter-builder", title: t`Letter Builder`, icon: <Mail className="w-4 h-4" />, level: 1 },
  { id: "letter-getting-started", title: t`Getting Started`, icon: <Zap className="w-4 h-4" />, level: 2 },
  { id: "letter-categories", title: t`Letter Categories`, icon: <FileText className="w-4 h-4" />, level: 2 },
  { id: "letter-features", title: t`Key Features`, icon: <Sparkles className="w-4 h-4" />, level: 2 },
  { id: "letter-creating", title: t`Creating a Letter`, icon: <Edit3 className="w-4 h-4" />, level: 2 },
  { id: "letter-ai-features", title: t`AI Features`, icon: <Brain className="w-4 h-4" />, level: 2 },
  { id: "letter-export", title: t`Export & Sharing`, icon: <Download className="w-4 h-4" />, level: 2 },
  { id: "letter-best-practices", title: t`Best Practices`, icon: <Award className="w-4 h-4" />, level: 2 },
  
  // Articles & Knowledge Center and Subsections
  { id: "articles-knowledge-center", title: t`Articles & Knowledge Center`, icon: <BookOpen className="w-4 h-4" />, level: 1 },
  { id: "articles-accessing", title: t`Accessing Articles`, icon: <Compass className="w-4 h-4" />, level: 2 },
  { id: "articles-reading", title: t`Reading Experience`, icon: <BookOpen className="w-4 h-4" />, level: 2 },
  { id: "articles-search", title: t`Search & Discovery`, icon: <Search className="w-4 h-4" />, level: 2 },
  { id: "articles-multilingual", title: t`Multilingual Features`, icon: <Globe className="w-4 h-4" />, level: 2 },
  { id: "articles-achievements", title: t`Earn Achievements`, icon: <Trophy className="w-4 h-4" />, level: 2 },
  
  // Payments & Premium
  { id: "payments-premium-trust", title: t`Payments & Premium`, icon: <CreditCard className="w-4 h-4" />, level: 1 },
  { id: "understanding-coins", title: t`Understanding Coins`, icon: <DollarSign className="w-4 h-4" />, level: 2 },
  { id: "getting-coins", title: t`Getting Coins`, icon: <Wallet className="w-4 h-4" />, level: 2 },
  { id: "payment-options", title: t`Payment Methods`, icon: <CreditCard className="w-4 h-4" />, level: 2 },
  { id: "account-management", title: t`Account Management`, icon: <BarChart className="w-4 h-4" />, level: 2 },
  { id: "smart-spending", title: t`Smart Spending`, icon: <TrendingUp className="w-4 h-4" />, level: 2 },
  { id: "security-trust", title: t`Security & Trust`, icon: <Shield className="w-4 h-4" />, level: 2 },
  { id: "faq", title: t`FAQ`, icon: <HelpCircle className="w-4 h-4" />, level: 2 },
];
// Update the TOCItem interface
interface TOCItemProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  level?: number;
  onClick?: (e: React.MouseEvent) => void;
  isActive?: boolean;
}

export const DocumentationPage = () => {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [isScrolling, setIsScrolling] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const headerHeight = 120;
  
  const scrollInProgress = useRef(false);
  const lastScrollToSection = useRef<string>("");

  const scrollToSection = (sectionId: string) => {
  if (scrollInProgress.current) return;

  scrollInProgress.current = true;
  lastScrollToSection.current = sectionId;
  setIsScrolling(true);
  setActiveSection(sectionId);
  
  window.history.replaceState(null, "", `/docs/#${sectionId}`);

  const element = document.getElementById(sectionId);
  if (element) {
    const offsetPosition = element.offsetTop - headerHeight;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });

    setTimeout(() => {
      setIsScrolling(false);
      scrollInProgress.current = false;
    }, 800);
  } else {
    setIsScrolling(false);
    scrollInProgress.current = false;
  }
};


useEffect(() => {
  // Function to handle scrolling to section on page load
  const handleHashOnLoad = () => {
    const hash = window.location.hash.replace("#", "");
    if (hash && sections.some(s => s.id === hash)) {
      // Wait for page to fully load and components to render
      setTimeout(() => {
        scrollToSection(hash);
      }, 100); // Small delay to ensure DOM is ready
    }
  };


  handleHashOnLoad();

  const handleHashChange = () => {
    handleHashOnLoad();
  };

  window.addEventListener('hashchange', handleHashChange);
  
  return () => {
    window.removeEventListener('hashchange', handleHashChange);
  };
}, []); 


useEffect(() => {
  if (window.location.hash) {
    const id = window.location.hash.replace("#", "");
    if (sections.some(s => s.id === id)) {
      setActiveSection(id);
    }
  }
}, []);


  // useEffect(() => {
  //   if (window.location.hash) {
  //     const id = window.location.hash.replace("#", "");
  //     if (sections.some(s => s.id === id)) {
  //       setActiveSection(id);
  //     }
  //   }
  // }, []);

  useEffect(() => {
  let ticking = false;
  let lastScrollY = window.scrollY;

  const handleScroll = () => {
    if (scrollInProgress.current) return;

    const currentScrollY = window.scrollY;
    
    // Show back-to-top button when scrolled down more than 300px
    setShowBackToTop(currentScrollY > 300);
    
    if (!ticking && Math.abs(currentScrollY - lastScrollY) > 10) {
      window.requestAnimationFrame(() => {
        const scrollY = currentScrollY + headerHeight;
        
        let currentSection = sections[0].id;
        for (let i = sections.length - 1; i >= 0; i--) {
          const section = sections[i];
          const element = document.getElementById(section.id);
          if (element && element.offsetTop <= scrollY) {
            currentSection = section.id;
            break;
          }
        }

        if (currentSection !== activeSection) {
          setActiveSection(currentSection);
          window.history.replaceState(null, "", `/docs/#${currentSection}`);
        }
        
        lastScrollY = currentScrollY;
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Initial check
  setShowBackToTop(window.scrollY > 300);
  
  return () => window.removeEventListener('scroll', handleScroll);
}, [activeSection, headerHeight]);

  const handleSidebarClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    scrollToSection(sectionId);
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // TOCItem component
  const TOCItem = ({ 
    id, 
    title, 
    icon, 
    level = 1, 
    onClick, 
    isActive 
  }: TOCItemProps) => {
    const paddingLeft = level === 1 ? "pl-0" : level === 2 ? "pl-6" : level === 3 ? "pl-10" : "pl-0";
    const isSubItem = level >= 2;
    
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center w-full text-left py-2 px-3 rounded-lg transition-all duration-200",
          "hover:bg-accent hover:text-accent-foreground",
          paddingLeft,
          isActive 
            ? "bg-primary text-primary-foreground font-semibold shadow-sm" 
            : "text-muted-foreground bg-transparent",
          isSubItem && "text-sm"
        )}
        style={{
          cursor: isScrolling ? 'wait' : 'pointer'
        }}
      >
        {icon && <span className="mr-2 text-current">{icon}</span>}
        <span className="flex-1 truncate text-left">{title}</span>
        {activeSection === id && (
          <div className="flex items-center ml-2">
            {isScrolling && lastScrollToSection.current === id && (
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-2"></div>
            )}
            <svg 
              className="w-4 h-4" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        )}
        
        {isActive && level === 1 && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r"></div>
        )}
      </button>
    );
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50">
        <header className="relative backdrop-blur-md bg-background/80 border-b border-border shadow-lg supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex items-center justify-between  px-2 py-2 sm:px-2 sm:py-2">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="md:hidden p-2 rounded-md hover:bg-accent/20"
                aria-label={t`Toggle documentation menu`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo */}
              <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
                <Logo className="hidden sm:block" size={56} />
                <Logo className="sm:hidden" size={40} />
              </Link>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {!loading && user && (
                <div className="mr-2">
                  <NotificationCenter />
                </div>
              )}

              <LocaleSwitch />
              <ThemeSwitch />


              {/* Auth Buttons for Non-Logged In Users */}
              {!loading && !user && (
                <div className="flex items-center gap-2">
                  <Link to="/auth/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden sm:flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <SignIn className="w-4 h-4" />
                      Sign In
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="sm:hidden text-gray-700 dark:text-gray-300"
                    >
                      <SignIn className="w-5 h-5" />
                    </Button>
                  </Link>
                  
                  <Link to="/auth/register">
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hidden sm:inline-flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Sign Up
                    </Button>
                    <Button
                      variant="primary"
                      size="icon"
                      className="sm:hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      <User className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              )}

              {/* User Dropdown */}
              {!loading && user && (
                <Menu as="div" className="relative inline-block text-left">
                  <Menu.Button className="flex items-center w-10 h-10 rounded-full bg-blue-500 justify-center text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400">
                    {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                  </Menu.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 dark:bg-gray-800">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }: any) => (
                            <Link
                              to="/dashboard/profile"
                              className={cn(
                                "block px-4 py-2 text-sm",
                                active ? "bg-gray-100 dark:bg-gray-700" : "",
                                "text-gray-700 dark:text-gray-200"
                              )}
                            >
                              {t`Profile`}
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }: any) => (
                            <Link
                              to="/dashboard/settings"
                              className={cn(
                                "block px-4 py-2 text-sm",
                                active ? "bg-gray-100 dark:bg-gray-700" : "",
                                "text-gray-700 dark:text-gray-200"
                              )}
                            >
                              {t`Settings`}
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }: any) => (
                            <Link
                              to="/logout"
                              className={cn(
                                "block px-4 py-2 text-sm",
                                active ? "bg-gray-100 dark:bg-gray-700" : "",
                                "text-gray-700 dark:text-gray-200"
                              )}
                            >
                              {t`Logout`}
                            </Link>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              )}
            </div>
          </div>
        </header>

        {/* Secondary Navigation Bar */}
        <div className="sticky top-[64px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border shadow-sm h-14">
          <div className="container mx-auto h-full">
            <div className="flex items-center justify-between px-2 py-2 sm:px-2 sm:py-2 h-full">
              {/* Left side: Back button and Back to Home */}
              <div className="flex items-center gap-2">
                {/* Back button (navigates to previous page) */}
                <button
                  onClick={() => navigate(-1)}
                  className={cn(
                    "flex items-center gap-2",
                    "px-3 py-1.5 sm:px-3 sm:py-2",
                    "border border-gray-700 rounded-lg",
                    "bg-transparent hover:bg-accent active:bg-accent/80 transition-all duration-200",
                    "hover:text-accent-foreground",
                    "font-medium text-sm",
                    "hover:shadow-sm"
                  )}
                  title={t`Go back`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span >{t`Back`}</span>
                </button>

                {/* Back to Home button */}
                <button
                  onClick={() => navigate("/")}
                  className={cn(
                    "flex items-center gap-2",
                    "px-3 py-1.5 sm:px-4 sm:py-2",
                    "border border-gray-700 rounded-lg",
                    "bg-transparent hover:bg-accent active:bg-accent/80 transition-all duration-200",
                    "hover:text-accent-foreground",
                    "font-medium text-sm sm:text-base",
                    "hover:shadow-sm"
                  )}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="hidden sm:inline">{t`Home`}</span>
                  <span className="sm:hidden">{t`Home`}</span>
                </button>
              </div>

              {/* Right side: Dashboard button */}
              <Link
                to="/dashboard"
                className={cn(
                  "flex items-center justify-center gap-2",
                  "px-3 py-1.5 sm:px-4 sm:py-2",
                  "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg",
                  "hover:from-blue-600 hover:to-purple-700 active:from-blue-700 active:to-purple-800 transition-all duration-200",
                  "font-medium text-sm sm:text-base",
                  "shadow-sm hover:shadow-md"
                )}
              >
                <Layout className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{t`Go to Dashboard`}</span>
                <span className="sm:hidden">{t`Dashboard`}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-[calc(100vh-120px)]">
        {/* Desktop Sidebar */}
        <aside className="sticky top-[120px] hidden h-[calc(100vh-120px)] w-[320px] flex-shrink-0 flex-col border-r border-gray-300 dark:border-gray-700 bg-card p-6 md:flex overflow-y-auto">
          <h2 className="mb-6 text-2xl font-bold text-card-foreground">{t`Documentation`}</h2>

          <nav className="flex flex-col space-y-1">
            {sections.map((section) => (
              <TOCItem
                key={section.id}
                id={section.id}
                title={section.title}
                icon={section.icon}
                level={section.level}
                onClick={(e: any) => handleSidebarClick(e, section.id)}
                isActive={activeSection === section.id}
              />
            ))}
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-[120px] h-[calc(100vh-120px)] w-64 bg-background border-r border-border p-6 shadow-xl z-50 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">{t`Documentation`}</h2>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 hover:bg-accent/20 rounded-md text-foreground/70"
                aria-label={t`Close menu`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col space-y-1">
              {sections.map((section) => (
                <TOCItem
                  key={section.id}
                  id={section.id}
                  title={section.title}
                  icon={section.icon}
                  level={section.level}
                  onClick={() => {
                    scrollToSection(section.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  isActive={activeSection === section.id}
                />
              ))}
            </nav>
          </aside>
        </div>
      )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto flex-1 px-4 py-6 md:px-6 md:py-8">
          {/* Documentation Sections */}
          <div className="space-y-16 md:space-y-20">
            <section id="platform-overview" className="scroll-mt-24">
              <PlatformOverviewSection />
            </section>
            <section id="getting-started" className="scroll-mt-24">
              <GettingStartedSection />
            </section>
            
            {/* Resume Builder Sections */}
            <section id="resume-builder" className="scroll-mt-24">
              <ResumeBuilderSection />
            </section>
            
            {/* Resume Subsections - These should be rendered by ResumeBuilderSection internally */}
            <section id="resume-getting-started" className="scroll-mt-24">
              {/* This content should come from ResumeBuilderSection */}
            </section>
            <section id="resume-interface" className="scroll-mt-24">
              {/* This content should come from ResumeBuilderSection */}
            </section>
            <section id="resume-sections" className="scroll-mt-24">
              {/* This content should come from ResumeBuilderSection */}
            </section>
            <section id="resume-design" className="scroll-mt-24">
              {/* This content should come from ResumeBuilderSection */}
            </section>
            <section id="resume-export" className="scroll-mt-24">
              {/* This content should come from ResumeBuilderSection */}
            </section>
            <section id="resume-ai-features" className="scroll-mt-24">
              {/* This content should come from ResumeBuilderSection */}
            </section>
            <section id="resume-best-practices" className="scroll-mt-24">
              {/* This content should come from ResumeBuilderSection */}
            </section>
            
            {/* Letter Builder Sections */}
            <section id="letter-builder" className="scroll-mt-24">
              <LetterBuilderSection />
            </section>
            
            {/* Letter Subsections - These should be rendered by LetterBuilderSection internally */}
            <section id="letter-getting-started" className="scroll-mt-24">
              {/* This content should come from LetterBuilderSection */}
            </section>
            <section id="letter-categories" className="scroll-mt-24">
              {/* This content should come from LetterBuilderSection */}
            </section>
            <section id="letter-features" className="scroll-mt-24">
              {/* This content should come from LetterBuilderSection */}
            </section>
            <section id="letter-creating" className="scroll-mt-24">
              {/* This content should come from LetterBuilderSection */}
            </section>
            <section id="letter-ai-features" className="scroll-mt-24">
              {/* This content should come from LetterBuilderSection */}
            </section>
            <section id="letter-export" className="scroll-mt-24">
              {/* This content should come from LetterBuilderSection */}
            </section>
            <section id="letter-best-practices" className="scroll-mt-24">
              {/* This content should come from LetterBuilderSection */}
            </section>
            
            <section id="articles-knowledge-center" className="scroll-mt-24">
              <ArticlesKnowledgeCenterSection />
            </section>
            <section id="payments-premium-trust" className="scroll-mt-24">
              <PaymentsPremiumTrustSection />
            </section>
          </div>

          {/* Floating Back to Top Button (Mobile & Desktop) */}
          {showBackToTop && (
            <div className="fixed bottom-6 right-6 z-30 animate-fadeIn">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={cn(
                  "flex items-center justify-center gap-2",
                  "px-4 py-3 sm:px-4 sm:py-3",
                  "bg-gradient-to-r from-blue-500 to-purple-600 border border-input rounded-full shadow-lg",
                  "hover:from-blue-600 hover:to-purple-700 active:scale-95 transition-all duration-200",
                  "font-medium text-sm",
                  "shadow-md hover:shadow-xl animate-fadeInUp"
                )}
                aria-label={t`Back to top`}
              >
                <ChevronUp className="w-5 h-5" />
                <span className="hidden sm:inline">{t`Top`}</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};