// import { t } from "@lingui/macro";
// import { House, Lock, SidebarSimple } from "@phosphor-icons/react";
// import { Button, Tooltip } from "@reactive-resume/ui";
// import { cn } from "@reactive-resume/utils";
// import { Link } from "react-router";

// import { useBuilderStore } from "@/client/stores/builder";
// import { useResumeStore } from "@/client/stores/resume";

// import { LocaleSwitch } from "@/client/components/locale-switch";
// import { ThemeSwitch } from "@/client/components/theme-switch";

// export const BuilderHeader = () => {
//   const title = useResumeStore((state) => state.resume.title);
//   const locked = useResumeStore((state) => state.resume.locked);

//   const toggle = useBuilderStore((state) => state.toggle);
//   const isDragging = useBuilderStore(
//     (state) => state.panel.left.handle.isDragging || state.panel.right.handle.isDragging,
//   );
//   const leftPanelSize = useBuilderStore((state) => state.panel.left.size);
//   const rightPanelSize = useBuilderStore((state) => state.panel.right.size);

//   const onToggle = (side: "left" | "right") => {
//     toggle(side);
//   };

//   return (
//     <div
//       style={{ left: `${leftPanelSize}%`, right: `${rightPanelSize}%` }}
//       className={cn(
//         "fixed inset-x-0 top-0 z-[60] h-16 bg-secondary-accent/50 backdrop-blur-lg lg:z-20 border border-gray-700",
//         !isDragging && "transition-[left,right]",
//       )}
//     >
//       <div className="relative flex h-full items-center px-4">
//         {/* Left sidebar toggle */}
//         <Button
//           size="icon"
//           variant="ghost"
//           className="flex lg:hidden"
//           onClick={() => onToggle("left")}
//         >
//           <SidebarSimple />
//         </Button>

//         <Button asChild size="icon" variant="ghost" className="text-foreground">
//           <Link to="/dashboard/resumes">
//             <House size={22} weight="bold" />
//           </Link>
//         </Button>
//         {/* Centered Title */}
//         <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center space-x-2">
          

//           <h1 className="font-medium">{title}</h1>

//           {locked && (
//             <Tooltip content={t`This resume is locked, please unlock to make further changes.`}>
//               <Lock size={14} className="ml-2 opacity-75" />
//             </Tooltip>
//           )}
//         </div>

//         {/* Right: Locale & Theme Switch */}
//         <div className="ml-auto flex items-center space-x-4">
//           <LocaleSwitch />
//           <ThemeSwitch />
//         </div>

//         {/* Right sidebar toggle */}
//         <Button
//           size="icon"
//           variant="ghost"
//           className="flex lg:hidden"
//           onClick={() => onToggle("right")}
//         >
//           <SidebarSimple className="-scale-x-100" />
//         </Button>
//       </div>
//     </div>
//   );
// };



import { t } from "@lingui/macro";
import { House, Lock, SidebarSimple, PencilSimple } from "@phosphor-icons/react";
import { Button, Tooltip } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { Link } from "react-router";
import { useEffect, useState } from "react";

import { useBuilderStore } from "@/client/stores/builder";
import { useResumeStore } from "@/client/stores/resume";

import { LocaleSwitch } from "@/client/components/locale-switch";
import { ThemeSwitch } from "@/client/components/theme-switch";

export const BuilderHeader = () => {
  const title = useResumeStore((state) => state.resume.title);
  const locked = useResumeStore((state) => state.resume.locked);
  const [isMobile, setIsMobile] = useState(false);

  const toggle = useBuilderStore((state) => state.toggle);
  const isDragging = useBuilderStore(
    (state) => state.panel.left.handle.isDragging || state.panel.right.handle.isDragging,
  );
  const leftPanelSize = useBuilderStore((state) => state.panel.left.size);
  const rightPanelSize = useBuilderStore((state) => state.panel.right.size);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const onToggle = (side: "left" | "right") => {
    toggle(side);
  };

  // Truncate title for mobile
  const getDisplayTitle = () => {
    if (!isMobile) return title;
    
    // For mobile, truncate to fit better
    if (title.length > 20) {
      return `${title.substring(0, 18)}...`;
    }
    return title;
  };

  return (
    <div
      style={{ 
        left: isMobile ? "0%" : `${leftPanelSize}%`, 
        right: isMobile ? "0%" : `${rightPanelSize}%` 
      }}
      className={cn(
        "fixed inset-x-0 top-0 z-[60] h-16 bg-secondary-accent/90 backdrop-blur-xl lg:z-20 border-b border-gray-700 shadow-lg",
        !isDragging && "transition-[left,right]",
        isMobile && "px-0" // Remove padding on mobile for full width
      )}
    >
      <div className="relative flex h-full items-center justify-between px-3 sm:px-4">
        {/* Left side: Home button + Left toggle */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Left sidebar toggle - Visible on mobile only */}
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "flex lg:hidden h-10 w-10",
              isMobile && "min-w-10" // Ensure minimum width on mobile
            )}
            onClick={() => onToggle("left")}
          >
            <SidebarSimple size={isMobile ? 20 : 22} />
          </Button>

          {/* Home button */}
          <Button 
            asChild 
            size="icon" 
            variant="ghost" 
            className={cn(
              "text-foreground h-10 w-10",
              isMobile && "min-w-10" // Ensure minimum width on mobile
            )}
          >
            <Link to="/dashboard/resumes">
              <House size={isMobile ? 20 : 22} weight="bold" />
            </Link>
          </Button>
        </div>

        {/* Centered Title Area - Takes available space */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-2 sm:px-4">
          <div className="flex items-center justify-center space-x-2 max-w-full">
            {/* Optional: Edit icon on mobile to indicate edit mode */}
            {isMobile && !locked && (
              <PencilSimple size={16} className="text-primary flex-shrink-0" />
            )}
            
            <div className="flex items-center gap-2 max-w-full">
              <h1 className="font-semibold text-sm sm:text-base md:text-lg truncate max-w-[200px] sm:max-w-[300px] md:max-w-none">
                {getDisplayTitle()}
              </h1>

              {locked && (
                <Tooltip content={t`This resume is locked, please unlock to make further changes.`}>
                  <Lock 
                    size={isMobile ? 12 : 14} 
                    className="text-amber-500 flex-shrink-0" 
                  />
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Controls + Right toggle */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Desktop Controls - Original components with responsive hiding */}
          <div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
            <LocaleSwitch />
            <ThemeSwitch />
          </div>
          
          {/* Mobile Controls - Same components but with wrapper for sizing */}
          <div className="flex sm:hidden items-center gap-1">
            <div className="scale-90">
              <LocaleSwitch />
            </div>
            <div className="scale-90">
              <ThemeSwitch />
            </div>
          </div>

          {/* Right sidebar toggle - Visible on mobile only */}
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "flex lg:hidden h-10 w-10",
              isMobile && "min-w-10" // Ensure minimum width on mobile
            )}
            onClick={() => onToggle("right")}
          >
            <SidebarSimple className="-scale-x-100" size={isMobile ? 20 : 22} />
          </Button>
        </div>
      </div>

      {/* Optional: Mobile status bar indicator */}
      {isMobile && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50"></div>
      )}
    </div>
  );
};