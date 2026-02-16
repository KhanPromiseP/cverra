import { t, Trans } from "@lingui/macro";
import { 
  House, 
  ReadCvLogo, 
  FadersHorizontal, 
  Article, 
  Question,
  EnvelopeSimple,
  Coin,
  Users,
  ChartBar,
  Gear,
  Crown,
  ChartLine,
  CaretLeft,
  CaretRight,
  User,
  CheckCircle,
  SignIn,
  UserPlus,
  LockSimple,
  Bell,
  X,
  Sparkle,
  FileText,
  Envelope,
  BookOpen,
  RocketLaunch,
  Target,
  Palette,
  BellRinging,
  Key,
  UserCircle,
  Info
} from "@phosphor-icons/react";

import { 
  Button, 
  Tooltip, 
  TooltipProvider,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router";
import { useState, useEffect } from "react";

import { UserAvatar } from "@/client/components/user-avatar";
import { UserOptions } from "@/client/components/user-options";
import { useUser } from "@/client/services/user";

// Line indicator for active items
const LineIndicator = ({ isActive }: { isActive: boolean }) => (
  <motion.div
    initial={{ scaleX: 0 }}
    animate={{ scaleX: isActive ? 1 : 0 }}
    className={cn(
      "absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-blue-500 to-purple-600 transition-all duration-200",
      isActive ? "scale-x-100" : "scale-x-0"
    )}
  />
);

// Auth Popup Component
interface AuthPopupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  featureIcon: React.ReactNode;
  description: string;
  benefits: string[];
  ctaText: string;
}

const AuthPopup = ({ 
  isOpen, 
  onOpenChange, 
  featureName, 
  featureIcon, 
  description, 
  benefits, 
  ctaText 
}: AuthPopupProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="
          w-[95vw]
          max-w-[95vw]
          sm:max-w-md
          max-h-[90vh]
          overflow-y-auto
          rounded-2xl
          border
          bg-background
          shadow-2xl
          p-4
          sm:p-6
        "
      >
        <DialogHeader>
          <div className="flex items-start sm:items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
              {featureIcon}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground dark:text-foreground">
                <Trans>Unlock {featureName}</Trans>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground dark:text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Benefits Card */}
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                <Sparkle size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">
                  <Trans>What You'll Get</Trans>
                </h4>
                <ul className="space-y-2 text-sm">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-blue-700 dark:text-blue-400">
                      <CheckCircle size={14} className="text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Card */}
          <div className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 border border-amber-100 dark:border-amber-800/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <RocketLaunch size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  <Trans>Ready to Get Started?</Trans>
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  {ctaText}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 rounded-xl border-2"
          >
            <Trans>Maybe Later</Trans>
          </Button>
          <Link to="/auth/register" className="flex-1" onClick={() => onOpenChange(false)}>
            <Button
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-3"
            >
              <UserPlus size={18} />
              <span className="font-semibold"><Trans>Create Free Account</Trans></span>
            </Button>
          </Link>
        </DialogFooter>

        <div className="pt-4 border-t border-border mt-4">
          <p className="text-xs text-center text-muted-foreground">
            <Trans>Already have an account? </Trans>
            <Link 
              to="/auth/login" 
              className="text-blue-600 dark:text-blue-400 ml-1 hover:underline font-medium"
              onClick={() => onOpenChange(false)}
            >
              <Trans>Sign in here</Trans>
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Feature-specific auth popup data
const FEATURE_AUTH_DATA = {
  resumes: {
    icon: <FileText size={24} className="text-blue-600 dark:text-blue-400" />,
    description: t`Create professional resumes with AI-powered enhancement and beautiful templates`,
    benefits: [
      t`Powerful & AI enhanced resume builder space`,
      t`Professional experts designed templates`,
      t`Export to PDF, Json, for different needs`,
      t`Poblish resume, share link, track views & downloads`,
      t`Build resumes any where and all time with best ease`
    ],
    ctaText: t`Join thousands of professionals creating stunning resumes on Inlirah`
  },
  coverLetters: {
    icon: <Envelope size={24} className="text-green-600 dark:text-green-400" />,
    description: t`Generate compelling letters letters of all kind that get you noticed`,
    benefits: [
      t`AI-generated, formatted wide gategories letters`,
      t`Generate from resume directly or few inputs`,
      t`Situation-specific best customization`,
      t`Save and manage multiple versions`,
      t`Professional formatting and styling`
    ],
    ctaText: t`Create letters that stand out with no formatting stress in seconds`
  },

   assistant: {
    icon: <Sparkle size={24} className="text-emerald-600 dark:text-emerald-400" />,
    description: t`Access a powerful personal AI assistant that guides, remembers, and grows with you`,
    benefits: [
      t`Personal AI tutor for career, learning, and life guidance`,
      t`Remembers your past conversations, goals, and decisions`,
      t`Guided learning with step-by-step explanations and follow-ups`,
      t`Smart advice based on your activities and interests on Inlirah`,
      t`Interactive conversations, stories, and motivation when you need it`
    ],
    ctaText: t`Unlock your personal AI assistant and grow smarter every day with Inlirah`
  },


  profile: {
    icon: <UserCircle size={24} className="text-purple-600 dark:text-purple-400" />,
    description: t`Build a professional profile from Inlirah knowledge-hub`,
    benefits: [
      t`Articles reading statistics on Inlirah`,
      t`Achievments in your reading journey`,
      t`Set fevorites best recommendations`,
      t`Add preferred reading sessions & interest`,
      t`View activities, puplic profile, engagement`
    ],
    ctaText: t`Build and share professional identity on Inlirah`
  },
  myarticles: {
    icon: <BookOpen size={24} className="text-amber-600 dark:text-amber-400" />,
    description: t`Acces your saved, recomended articles for your learning journey`,
    benefits: [
      t`Saved articles to read later`,
      t`Access personalized recommendations`,
      t`Access your premium articles`
    ],
    ctaText: t`Access your knowledge library and stay ahead`
  },
  settings: {
    icon: <Palette size={24} className="text-pink-600 dark:text-pink-400" />,
    description: t`Access account profile and security settings`,
    benefits: [
      t`Manage privacy settings`,
      t`Add account seccurity`,
    ],
    ctaText: t`Handle your profile and security settings`
  },
  notifications: {
    icon: <BellRinging size={24} className="text-red-600 dark:text-red-400" />,
    description: t`Stay updated with important notifications and alerts`,
    benefits: [
      t`Real-time activity notifications`,
      t`Custom notification settings`,
      t`Never miss important updates`,
  
    ],
    ctaText: t`Stay in the loop with all important updates on Inlirah`
  },
  default: {
    icon: <Key size={24} className="text-blue-600 dark:text-blue-400" />,
    description: t`Access premium knowledge and tools`,
    benefits: [
      t`Stay where knowledge is practical`,
      t`Access advanced resume/letter Builder`,
      t`Notifications and important recomendations`,
      t`Build professional Identity`,
      t`Stay ahead of others`
    ],
    ctaText: t`Join Inlirah to access amazing career-building tools`
  }
};

type SidebarItem = {
  path: string;
  name: string;
  icon: React.ReactNode;
  matchPattern?: string;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  requiresLogin?: boolean;
  description?: string;
  featureKey?: keyof typeof FEATURE_AUTH_DATA;
};

type SidebarItemProps = SidebarItem & {
  onClick?: () => void;
  collapsed: boolean;
  disabled?: boolean;
  onDisabledClick?: (featureKey?: keyof typeof FEATURE_AUTH_DATA) => void;
  adminOnly?: boolean; 
  superAdminOnly?: boolean; 
};

const SidebarItem = ({ 
  path, 
  name, 
  icon, 
  onClick, 
  matchPattern, 
  collapsed,
  disabled = false,
  onDisabledClick,
  description,
  featureKey,
  adminOnly = false,
  superAdminOnly = false
}: SidebarItemProps) => {
  const location = useLocation();
  
  let isActive = false;
  
  if (matchPattern) {
    isActive = new RegExp(matchPattern).test(location.pathname);
  } else {
    if (path === "/dashboard") {
      isActive = location.pathname === "/dashboard";
    } else {
      isActive = location.pathname === path || location.pathname.startsWith(path + '/');
    }
  }

  const { user } = useUser();
  const isAdmin = user?.role === "ADMIN";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  
  // Check if item should be shown based on user role
  const shouldShowItem = () => {
    if (superAdminOnly && !isSuperAdmin) return false;
    if (adminOnly && !isAdmin && !isSuperAdmin) return false;
    return true;
  };
  
  const showItem = shouldShowItem();
  
  if (!showItem) return null; // Don't render if user doesn't have permission


  // Create the link content
  const linkContent = (
    <div className={cn(
      "flex items-center w-full transition-all duration-200 group relative",
      collapsed ? "px-3 py-4 justify-center" : "px-5 py-4",
      disabled 
        ? "opacity-60 cursor-not-allowed bg-gray-50/50 dark:bg-gray-800/30"
        : "hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30",
      disabled 
        ? "" 
        : "rounded-lg border border-transparent hover:border-blue-200 dark:hover:border-blue-800",
      isActive && !disabled && [
        "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40",
        "text-blue-700 dark:text-blue-300 font-semibold border-blue-300 dark:border-blue-700",
        "shadow-md shadow-blue-500/10"
      ]
    )}>
      <LineIndicator isActive={isActive && !disabled} />
      
      {/* Lock icon for disabled items */}
      {disabled && !collapsed && (
        <div className="absolute top-2 right-2">
          <LockSimple className="h-3 w-3 text-gray-400 dark:text-gray-500" />
        </div>
      )}
      
      <div className={cn(
        "transition-all duration-200 flex-shrink-0 relative",
        collapsed ? "" : "mr-4",
        disabled 
          ? "text-gray-400 dark:text-gray-500" 
          : isActive 
            ? "text-blue-600 dark:text-blue-400" 
            : "text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
      )}>
        {icon}
        
        {/* Lock badge for collapsed state */}
        {disabled && collapsed && (
          <div className="absolute -top-1 -right-1">
            <div className="h-3 w-3 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <LockSimple className="h-2 w-2 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="flex-1 min-w-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-medium tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                {name}
              </span>
              {disabled && (
                <LockSimple className="h-3 w-3 text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0" />
              )}
            </div>
            {description && !collapsed && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      e.stopPropagation();
      onDisabledClick?.(featureKey);
      return;
    }
    onClick?.();
  };

  // For collapsed state with tooltip
  if (collapsed) {
    return (
      <Tooltip 
        content={
          disabled 
            ? t`Sign in to access ${name}` 
            : name
        } 
        side="right"
      >
        <div 
          className={cn(
            "block mx-1 my-1",
            disabled && "cursor-not-allowed"
          )}
          onClick={handleClick}
        >
          {disabled ? (
            // Disabled item - not a link
            <div className="relative">
              {linkContent}
            </div>
          ) : (
            // Enabled item - regular link
            <Link to={path}>
              {linkContent}
            </Link>
          )}
        </div>
      </Tooltip>
    );
  }

  // For expanded state
  if (disabled) {
    return (
      <div 
        className="block mx-1 my-1 cursor-not-allowed"
        onClick={handleClick}
      >
        {linkContent}
      </div>
    );
  }

  return (
    <Link 
      to={path} 
      className="block mx-1 my-1"
      onClick={onClick}
    >
      {linkContent}
    </Link>
  );
};

// Admin Section Header Component
const AdminSectionHeader = ({ collapsed }: { collapsed: boolean }) => {
  if (collapsed) {
    return (
      <div className="flex justify-center py-3">
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-center space-x-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
        <span className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          {t`Administration`}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
      </div>
    </div>
  );
};

type SidebarProps = {
  setOpen?: (open: boolean) => void;
  onCollapseChange?: (collapsed: boolean) => void;
  forceExpanded?: boolean;
};

export const Sidebar = ({ setOpen, onCollapseChange, forceExpanded = false }: SidebarProps) => {
  const { user } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [authPopupOpen, setAuthPopupOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<keyof typeof FEATURE_AUTH_DATA>('default');

  // Use forceExpanded to override collapsed state for mobile
  const isCollapsed = forceExpanded ? false : collapsed;

  // Load collapsed state from localStorage on component mount
  useEffect(() => {
    if (forceExpanded) return; // Don't load saved state for mobile
    
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState) {
      const isCollapsed = JSON.parse(savedState);
      setCollapsed(isCollapsed);
      onCollapseChange?.(isCollapsed);
    }
  }, [onCollapseChange, forceExpanded]);

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    if (forceExpanded) return; // Don't save state for mobile
    
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
    onCollapseChange?.(collapsed);
  }, [collapsed, onCollapseChange, forceExpanded]);

  const toggleSidebar = () => {
    if (forceExpanded) return; // Don't allow toggling on mobile
    setCollapsed(!collapsed);
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isLoggedIn = !!user;


  const handleDisabledClick = (featureKey?: keyof typeof FEATURE_AUTH_DATA) => {
    if (featureKey) {
      setActiveFeature(featureKey);
    } else {
      setActiveFeature('default');
    }
    setAuthPopupOpen(true);
  };

  // All items for sidebar - Home is accessible to everyone
  const allItems: SidebarItem[] = [
    {
      path: "/dashboard",
      name: t`Home`,
      icon: <House weight="fill" size={24} />,
      description: t`Dashboard overview`,
      requiresLogin: false, // Home is accessible to everyone
    },
    {
      path: "/dashboard/resumes",
      name: t`Resumes`,
      icon: <ReadCvLogo weight="fill" size={24} />,
      matchPattern: "^/dashboard/resumes",
      description: t`Create and manage resumes`,
      requiresLogin: true,
      featureKey: 'resumes'
    },
    {
      path: "/dashboard/cover-letters",
      name: t`Cover Letters`,
      icon: <EnvelopeSimple weight="fill" size={24} />,
      matchPattern: "^/dashboard/cover-letters",
      description: t`Write professional cover letters`,
      requiresLogin: true,
      featureKey: 'coverLetters'
    },
    {
      path: "/dashboard/articles", 
      name: t`Articles`,
      icon: <Article weight="fill" size={24} />,
      matchPattern: "^/dashboard/articles",
      description: t`Read and explore articles`,
      requiresLogin: false, // Articles are public
    },

     {
      path: "/dashboard/assistant", 
      name: t`Assistant`,
      icon: <Sparkle weight="fill" size={24} />, 
      matchPattern: "^/dashboard/assistant",
      description: t`Access your personal assistant`,
      requiresLogin: true,
      featureKey: 'assistant'
    },

    {
      path: "/docs",
      name: t`Help & Support`,
      icon: <Question weight="fill" size={24} />,
      description: t`Get help and documentation`,
      requiresLogin: false, // Docs are public
    },
    {
      path: "/dashboard/pricing",
      name: t`Pricing`,
      icon: <Coin weight="fill" size={24} />,
      description: t`View pricing plans`,
      requiresLogin: false, // Pricing is public
    },
    {
      path: "/dashboard/profile",
      name: t`Reading Profile`,
      icon: <User weight="fill" size={24} />,
      matchPattern: "^/dashboard/profile",
      description: t`Access your profile`,
      requiresLogin: true,
      featureKey: 'profile'
    },
    {
      path: "/dashboard/myarticles",
      name: t`My Articles`,
      icon: <CheckCircle weight="fill" size={24} />,
      matchPattern: "^/dashboard/myarticles",
      description: t`Your saved and created articles`,
      requiresLogin: true,
      featureKey: 'myarticles'
    },
    {
      path: "/dashboard/notifications",
      name: t`Notifications`,
      icon: <Bell weight="fill" size={24} />,
      matchPattern: "^/dashboard/notifications",
      description: t`All notifications display`,
      requiresLogin: true,
      featureKey: 'notifications'
    },
    {
      path: "/dashboard/settings",
      name: t`Settings`,
      icon: <FadersHorizontal weight="fill" size={24} />,
      description: t`Account and app settings`,
      requiresLogin: true,
      featureKey: 'settings'
    },
  ];

  const adminItems: SidebarItem[] = [
    {
      path: "/dashboard/admin/dashboard",
      name: t`Admin Dashboard`,
      icon: <ChartBar weight="fill" size={24} />,
      superAdminOnly: true,
      requiresLogin: true,
    },
    {
      path: "/dashboard/admin/analytics",
      name: t`Analytics`,
      icon: <ChartLine weight="fill" size={24} />,
      superAdminOnly: true,
      requiresLogin: true,
    },
    {
      path: "/dashboard/admin/users",
      name: t`User Management`,
      icon: <Users weight="fill" size={24} />,
      superAdminOnly: true,
      requiresLogin: true,
    },
    {
      path: "/dashboard/admin/subscription-plans",
      name: t`Subscription Plans`,
      icon: <Crown weight="fill" size={24} />,
      superAdminOnly: true,
      requiresLogin: true,
    },
    {
      path: "/dashboard/admin/settings",
      name: t`Admin Settings`,
      icon: <Gear weight="fill" size={24} />,
      superAdminOnly: true,
      requiresLogin: true,
    },
    {
      path: "/dashboard/article-admin",
      name: t`Article Admin`,
      icon: <Article weight="fill" size={24} />,
      adminOnly: true,
      requiresLogin: true,
    },
  ];

  // Get current feature data
  const featureData = FEATURE_AUTH_DATA[activeFeature];


  // Then when rendering admin items, filter based on permissions
  const visibleAdminItems = adminItems.filter(item => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  // For mobile, use a simple div without animations
  if (forceExpanded) {
    return (
      <>
        <TooltipProvider>
          <div className="flex h-full flex-col bg-background">
            {/* Scrollable content area for mobile */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-1 py-4 px-3">
                {/* Show all items, with disabled state for non-logged-in users */}
                {allItems.map((item) => {
                  const disabled = item.requiresLogin && !isLoggedIn;
                  return (
                    <SidebarItem 
                      {...item} 
                      key={item.path} 
                      onClick={() => setOpen?.(false)} 
                      collapsed={false}
                      disabled={disabled}
                      onDisabledClick={handleDisabledClick}
                    />
                  );
                })}

                {/* Admin Section with Header (only for logged-in admins) */}
                {isLoggedIn && visibleAdminItems.length > 0 && (
  <>
    <AdminSectionHeader collapsed={isCollapsed} />
    {visibleAdminItems.map((item) => (
      <SidebarItem 
        {...item} 
        key={item.path} 
        onClick={() => setOpen?.(false)} 
        collapsed={isCollapsed}
      />
    ))}
  </>
)}
              </div>
            </div>

            {/* Bottom section - different for logged-in vs logged-out users */}
            <div className="border-t border-border p-4 bg-background">
              {isLoggedIn ? (
                // User info for logged-in users
                <UserOptions>
                  <div className="flex items-center w-full transition-all duration-200 rounded-xl p-3 hover:bg-accent cursor-pointer border border-transparent hover:border-accent-foreground/20">
                    <UserAvatar 
                      size={36} 
                      className="flex-shrink-0 border-2 border-blue-500/20"
                    />
                    
                    <div className="flex flex-col items-start overflow-hidden ml-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-base whitespace-nowrap">
                          {user?.name}
                        </span>
                        {isAdmin && (
                          <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg">
                            {t`ADMIN`}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate max-w-[160px] mt-1">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </UserOptions>
              ) : (
                // Login/Register buttons for logged-out users
                <div className="flex flex-col gap-3">
                  <div className="p-3 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                        <RocketLaunch size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                          {t`Unlock All Features`}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {t`Sign up for free to access all tools`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Link to="/auth/login" onClick={() => setOpen?.(false)}>
                    <Button 
                      variant="primary" 
                      className="w-full bg-gradient-to-r rounded from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                    >
                      <SignIn className="mr-2 h-4 w-4" />
                      {t`Sign In`}
                    </Button>
                  </Link>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      {t`Don't have an account?`}
                    </p>
                    <Link to="/auth/register" onClick={() => setOpen?.(false)}>
                      <Button 
                        variant="outline" 
                        className="w-full border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {t`Create Account`}
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TooltipProvider>

        {/* Auth Popup */}
        <AuthPopup
          isOpen={authPopupOpen}
          onOpenChange={setAuthPopupOpen}
          featureName={allItems.find(item => item.featureKey === activeFeature)?.name || t`Premium Feature`}
          featureIcon={featureData.icon}
          description={featureData.description}
          benefits={featureData.benefits}
          ctaText={featureData.ctaText}
        />
      </>
    );
  }

  // For desktop with animations
  return (
    <>
      <TooltipProvider>
        <motion.div
          className="flex h-full flex-col border-r border-gray-300 dark:border-gray-700 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 relative shadow-xl"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          animate={{ width: isCollapsed ? 80 : 320 }}
          transition={{ 
            type: "tween",
            duration: 0.2,
            ease: "easeInOut"
          }}
        >
          {/* Enhanced Toggle Button - Only show on desktop */}
          <div className="absolute -right-4 top-6 z-50">
            <Button
              size="icon"
              variant="secondary"
              className={cn(
                "h-8 w-8 rounded-full border-2 shadow-2xl transition-all duration-200 bg-background hover:bg-accent hover:scale-110",
                "border-blue-300 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-500"
              )}
              onClick={toggleSidebar}
            >
              {isCollapsed ? (
                <CaretRight className="h-4 w-4" />
              ) : (
                <CaretLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Scrollable content area for desktop */}
          <div className="flex-1 overflow-y-auto">
            <div className={cn("flex flex-col gap-1 py-4", isCollapsed ? "px-1" : "px-3")}>
              {/* Show all items, with disabled state for non-logged-in users */}
              {allItems.map((item) => {
                const disabled = item.requiresLogin && !isLoggedIn;
                return (
                  <SidebarItem 
                    {...item} 
                    key={item.path} 
                    onClick={() => setOpen?.(false)} 
                    collapsed={isCollapsed}
                    disabled={disabled}
                    onDisabledClick={handleDisabledClick}
                  />
                );
              })}

              {/* Admin Section with Header (only for logged-in admins) */}
              {isLoggedIn && isAdmin && (
                <>
                  <AdminSectionHeader collapsed={isCollapsed} />
                  {adminItems.map((item) => (
                    <SidebarItem 
                      {...item} 
                      key={item.path} 
                      onClick={() => setOpen?.(false)} 
                      collapsed={isCollapsed}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Enhanced Bottom Section - different for logged-in vs logged-out users */}
          <div className={cn("border-t border-border p-4 bg-background", isCollapsed && "px-3")}>
            {isLoggedIn ? (
              // User info for logged-in users
              <UserOptions>
                <div className={cn(
                  "flex items-center w-full transition-all duration-200 rounded-xl p-3 hover:bg-accent cursor-pointer border border-transparent hover:border-accent-foreground/20",
                  isCollapsed ? "justify-center" : ""
                )}>
                  <UserAvatar 
                    size={isCollapsed ? 40 : 36} 
                    className="flex-shrink-0 border-2 border-blue-500/20"
                  />
                  
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col items-start overflow-hidden ml-4"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-base whitespace-nowrap">
                            {user?.name}
                          </span>
                          {isAdmin && (
                            <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg">
                              {t`ADMIN`}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate max-w-[160px] mt-1">
                          {user?.email}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </UserOptions>
            ) : (
              // Login/Register buttons for logged-out users
              <div className={cn("flex", isCollapsed ? "flex-col gap-2" : "flex-col gap-3")}>
                {!isCollapsed && (
                  <div className="mb-2 p-3 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                        <RocketLaunch size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                          {t`Unlock Premium Features`}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {t`Sign up for free to access all tools`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <Link to="/auth/login">
                  {isCollapsed ? (
                    <Tooltip content={t`Sign In`} side="right">
                      <Button 
                        size="icon"
                        variant="primary" 
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                      >
                        <SignIn className="h-4 w-4" />
                      </Button>
                    </Tooltip>
                  ) : (
                    <Button 
                      variant="primary" 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                    >
                      <SignIn className="mr-2 h-4 w-4" />
                      {t`Sign In to Unlock`}
                    </Button>
                  )}
                </Link>
                
                {!isCollapsed && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      {t`New to Inlirah?`}
                    </p>
                    <Link to="/auth/register">
                      <Button 
                        variant="outline" 
                        className="w-full border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {t`Create Free Account`}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </TooltipProvider>

      {/* Auth Popup */}
      <AuthPopup
        isOpen={authPopupOpen}
        onOpenChange={setAuthPopupOpen}
        featureName={allItems.find(item => item.featureKey === activeFeature)?.name || t`Premium Feature`}
        featureIcon={featureData.icon}
        description={featureData.description}
        benefits={featureData.benefits}
        ctaText={featureData.ctaText}
      />
    </>
  );
};