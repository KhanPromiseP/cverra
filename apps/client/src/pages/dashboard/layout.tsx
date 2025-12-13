import { SidebarSimple } from "@phosphor-icons/react";
import { Button, Sheet, SheetClose, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@reactive-resume/ui";
import { useState } from "react";
import { Outlet } from "react-router";
import { LocaleSwitch } from "@/client/components/locale-switch";
import { Logo } from "@/client/components/logo";
import { ThemeSwitch } from "@/client/components/theme-switch";
import { Link } from "react-router";

import { Sidebar } from "./_components/sidebar";

export const DashboardLayout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50">
        <header className="relative backdrop-blur-md bg-background/80 border-b border-border shadow-lg supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-3">
              {/* Mobile Sidebar Trigger */}
              <div className="lg:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-9 w-9 bg-background hover:bg-muted border border-border sm:h-10 sm:w-10"
                    >
                      <SidebarSimple className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </SheetTrigger>

                  <SheetContent 
                    showClose={false} 
                    side="left" 
                    className="focus-visible:outline-none w-[280px] p-0 border-r border-border bg-background sm:w-80"
                  >
                    {/* Add accessibility titles */}
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SheetDescription className="sr-only">
                      Main navigation menu for the application
                    </SheetDescription>
                    
                    <div className="flex items-center justify-between p-3 border-b border-border sm:p-4">
                      <Link to="/" className="flex items-center">
                        <Logo size={40} className="sm:size-48" />
                      </Link>
                      <SheetClose asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-9 sm:w-9">
                          <SidebarSimple className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </SheetClose>
                    </div>
                    <div className="p-3 sm:p-4">
                      {/* Mobile Sidebar - Always expanded */}
                      <Sidebar setOpen={setOpen} forceExpanded={true} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Logo */}
              <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
                <Logo className="hidden sm:block" size={56} />
                <Logo className="sm:hidden" size={40} />
              </Link>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 sm:gap-2">
                <LocaleSwitch />
                <ThemeSwitch />
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Layout Container */}
      <div className="flex">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden lg:block fixed inset-y-0 z-30 pt-[76px]">
          <Sidebar onCollapseChange={setSidebarCollapsed} />
        </div>

        {/* Main Content Area - Use CSS classes with proper responsive design */}
        <main className={`
          flex-1 w-full min-w-0
          transition-all duration-300 ease-in-out
          lg:ml-80
          ${sidebarCollapsed ? 'lg:!ml-20' : ''}
        `}>
          <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:container lg:mx-auto lg:px-8 lg:py-8">
            {/* Page Content */}
            <div className="animate-in fade-in duration-500">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};