import { t } from "@lingui/macro";
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
} from "@phosphor-icons/react";

// Add to regularItems array:
import { Button, Tooltip, TooltipProvider } from "@reactive-resume/ui";
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

type SidebarItem = {
  path: string;
  name: string;
  icon: React.ReactNode;
  matchPattern?: string;
  adminOnly?: boolean;
};

type SidebarItemProps = SidebarItem & {
  onClick?: () => void;
  collapsed: boolean;
};

const SidebarItem = ({ path, name, icon, onClick, matchPattern, collapsed }: SidebarItemProps) => {
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

  // Create the link content
  const linkContent = (
    <div className={cn(
      "flex items-center w-full transition-all duration-200 group relative",
      collapsed ? "px-3 py-4 justify-center" : "px-5 py-4",
      "hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30",
      "rounded-lg border border-transparent hover:border-blue-200 dark:hover:border-blue-800",
      isActive && [
        "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40",
        "text-blue-700 dark:text-blue-300 font-semibold border-blue-300 dark:border-blue-700",
        "shadow-md shadow-blue-500/10"
      ]
    )}>
      <LineIndicator isActive={isActive} />
      <div className={cn(
        "transition-all duration-200 flex-shrink-0",
        collapsed ? "" : "mr-4",
        isActive 
          ? "text-blue-600 dark:text-blue-400" 
          : "text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
      )}>
        {icon}
      </div>
      
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="text-base font-medium tracking-wide whitespace-nowrap overflow-hidden"
          >
            {name}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );

  // For collapsed state with tooltip
  if (collapsed) {
    return (
      <Tooltip content={name} side="right">
        <Link 
          to={path} 
          className="block mx-1 my-1"
          onClick={onClick}
        >
          {linkContent}
        </Link>
      </Tooltip>
    );
  }

  // For expanded state without tooltip
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
          Administration
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
      </div>
    </div>
  );
};

type SidebarProps = {
  setOpen?: (open: boolean) => void;
  onCollapseChange?: (collapsed: boolean) => void;
  forceExpanded?: boolean; // Add this prop to force expanded state
};

export const Sidebar = ({ setOpen, onCollapseChange, forceExpanded = false }: SidebarProps) => {
  const { user } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  const isAdmin = user?.role === "ADMIN";

  // Bigger icons - using larger size and weight
  const regularItems: SidebarItem[] = [
    {
      path: "/dashboard",
      name: t`Home`,
      icon: <House weight="fill" size={24} />,
    },
    {
      path: "/dashboard/resumes",
      name: t`Resumes`,
      icon: <ReadCvLogo weight="fill" size={24} />,
      matchPattern: "^/dashboard/resumes"
    },
    {
      path: "/dashboard/cover-letters",
      name: t`Cover Letters`,
      icon: <EnvelopeSimple weight="fill" size={24} />,
      matchPattern: "^/dashboard/cover-letters"
    },
    {
      path: "/dashboard/articles", 
      name: t`Articles`,
      icon: <Article weight="fill" size={24} />,
      matchPattern: "^/dashboard/articles"
    },
    {
      path: "/help",
      name: t`Help & Support`,
      icon: <Question weight="fill" size={24} />,
    },
    {
      path: "/dashboard/pricing",
      name: t`Pricing`,
      icon: <Coin weight="fill" size={24} />,
    },
   
    {
      path: "/dashboard/profile",
      name: t`Article-Profile`,
      icon: <User weight="fill" size={24} />,
      matchPattern: "^/dashboard/profile"
    },
    {
      path: "/dashboard/settings",
      name: t`Settings`,
      icon: <FadersHorizontal weight="fill" size={24} />,
    },
  ];

  const adminItems: SidebarItem[] = [
    {
      path: "/dashboard/admin/dashboard",
      name: t`Admin Dashboard`,
      icon: <ChartBar weight="fill" size={24} />,
      adminOnly: true
    },
    {
      path: "/dashboard/admin/analytics",
      name: t`Analytics`,
      icon: <ChartLine weight="fill" size={24} />,
      adminOnly: true
    },
    {
      path: "/dashboard/admin/users",
      name: t`User Management`,
      icon: <Users weight="fill" size={24} />,
      adminOnly: true
    },
    {
      path: "/dashboard/admin/subscription-plans",
      name: t`Subscription Plans`,
      icon: <Crown weight="fill" size={24} />,
      adminOnly: true
    },
    {
      path: "/dashboard/admin/settings",
      name: t`Admin Settings`,
      icon: <Gear weight="fill" size={24} />,
      adminOnly: true
    },
     {
      path: "/dashboard/article-admin",
      name: t`Article Admin`,
      icon: <Article weight="fill" size={24} />,
      adminOnly: true
    },

  ];

  // For mobile, use a simple div without animations
  if (forceExpanded) {
    return (
      <TooltipProvider>
        <div className="flex h-full flex-col bg-background">
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-1 py-4 px-3">
              {/* Regular User Items */}
              {regularItems.map((item) => (
                <SidebarItem 
                  {...item} 
                  key={item.path} 
                  onClick={() => setOpen?.(false)} 
                  collapsed={false}
                />
              ))}

              {/* Admin Section with Header */}
              {isAdmin && (
                <>
                  <AdminSectionHeader collapsed={false} />
                  {adminItems.map((item) => (
                    <SidebarItem 
                      {...item} 
                      key={item.path} 
                      onClick={() => setOpen?.(false)} 
                      collapsed={false}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* User Section */}
          <div className="border-t border-border p-4">
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
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate max-w-[160px] mt-1">
                    {user?.email}
                  </p>
                </div>
              </div>
            </UserOptions>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // For desktop with animations
  return (
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

        <div className="flex-1 overflow-y-auto">
          <div className={cn("flex flex-col gap-1 py-4", isCollapsed ? "px-1" : "px-3")}>
            {/* Regular User Items */}
            {regularItems.map((item) => (
              <SidebarItem 
                {...item} 
                key={item.path} 
                onClick={() => setOpen?.(false)} 
                collapsed={isCollapsed}
              />
            ))}

            {/* Admin Section with Header */}
            {isAdmin && (
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

        {/* Enhanced User Section */}
        <div className={cn("border-t border-border p-4", isCollapsed && "px-3")}>
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
                          ADMIN
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
        </div>
      </motion.div>
    </TooltipProvider>
  );
};