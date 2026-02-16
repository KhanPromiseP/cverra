// import { t, Trans } from "@lingui/macro";
// import { SidebarSimple, SignOut, Warning, User, SignIn } from "@phosphor-icons/react";
// import { Button, Sheet, SheetClose, SheetContent, SheetTrigger, SheetTitle, SheetDescription, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@reactive-resume/ui";
// import { useState, Fragment, useEffect } from "react";
// import { Outlet } from "react-router";
// import { LocaleSwitch } from "@/client/components/locale-switch";
// import { Logo } from "@/client/components/logo";
// import { ThemeSwitch } from "@/client/components/theme-switch";
// import { Link } from "react-router";
// import { Menu, Transition } from "@headlessui/react";
// import { NotificationCenter } from "@/client/components/notifications/NotificationCenter";
// import { useUser } from "@/client/services/user";
// import { useLogout } from "@/client/services/auth";
// import { useAuthStore } from "@/client/stores/auth";

// import { toast } from 'sonner';

// import { Footer } from "../home/components/footer";

// import { Sidebar } from "./_components/sidebar";
// import { UserAvatar } from "@/client/components/user-avatar";

// import { WelcomePopup } from '@/client/components/WelcomePopup';
// import { useWelcomeBonus } from '@/client/hooks/useWelcomeBonus';

// import { BonusFlag } from './BonusFlag';

// export const DashboardLayout: React.FC = () => {
//   const [open, setOpen] = useState(false);
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
//   const { user, loading } = useUser();
//   const { logout } = useLogout();
//   const isLoggedIn = useAuthStore((state) => !!state.user);
  
//   const headerHeight = 20; 

//   const handleLogout = () => {
//     logout();
//     setShowLogoutConfirm(false);
//   };

//   const confirmLogout = () => {
//     setShowLogoutConfirm(true);
//   };


//   return (
//     <div className="min-h-screen bg-background">
//       {/* Logout Confirmation Dialog */}
//       <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
//         <DialogContent>
//           <DialogHeader>
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
//                 <Warning className="w-5 h-5 text-red-600 dark:text-red-400" />
//               </div>
//               <div>
//                 <DialogTitle>{t`Confirm Logout`}</DialogTitle>
//                 <DialogDescription>
//                   {t`Are you sure you want to logout?`}
//                 </DialogDescription>
//               </div>
//             </div>
//           </DialogHeader>
          
//           <DialogFooter>
//             <button
//               onClick={() => setShowLogoutConfirm(false)}
//               className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
//             >
//               {t`Cancel`}
//             </button>
//             <button
//               onClick={handleLogout}
//               className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center gap-2"
//             >
//               <SignOut className="w-4 h-4" />
//               {t`Logout`}
//             </button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Top Navigation */}
//       <div className="sticky top-0 z-50">
//         <header className="relative backdrop-blur-md bg-background/80 border-b border-border shadow-lg supports-[backdrop-filter]:bg-background/60">
//           <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
//             <div className="flex items-center gap-3">
//               {/* Mobile Sidebar Trigger */}
//               <div className="lg:hidden">
//                 <Sheet open={open} onOpenChange={setOpen}>
//                   <SheetTrigger asChild>
//                     <Button
//                       size="icon"
//                       variant="ghost"
//                       className="h-9 w-9 bg-background hover:bg-muted border border-border sm:h-10 sm:w-10"
//                     >
//                       <SidebarSimple className="h-4 w-4 sm:h-5 sm:w-5" />
//                     </Button>
//                   </SheetTrigger>

//                   <SheetContent
//                     showClose={false}
//                     side="left"
//                     className="focus-visible:outline-none w-[280px] p-0 border-r border-border bg-background sm:w-80 h-screen"
//                   >
//                     <SheetTitle className="sr-only">{t`Navigation Menu`}</SheetTitle>
//                     <SheetDescription className="sr-only">
//                       {t`Main navigation menu for the application`}
//                     </SheetDescription>

//                     {/* Mobile Sidebar Container - FULL HEIGHT */}
//                     <div className="flex flex-col h-full">
//                       {/* Close button header */}
//                       <div className="flex items-center justify-between p-4 border-b border-border bg-background">
//                         <Link to="/" className="flex items-center" onClick={() => setOpen(false)}>
//                           <Logo size={40} className="sm:size-48" />
//                         </Link>
//                         <SheetClose asChild>
//                           <Button 
//                             size="icon" 
//                             variant="ghost" 
//                             className="h-9 w-9"
//                             onClick={() => setOpen(false)}
//                           >
//                             <SidebarSimple className="h-4 w-4" />
//                           </Button>
//                         </SheetClose>
//                       </div>

//                       {/* Sidebar Content - Takes remaining height */}
//                       <div className="flex-1 overflow-hidden">
//                         <Sidebar setOpen={setOpen} forceExpanded={true} />
//                       </div>
//                     </div>
//                   </SheetContent>
//                 </Sheet>
//               </div>

//               {/* Logo */}
//               <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
//                 <Logo className="hidden sm:block" size={56} />
//                 <Logo className="sm:hidden" size={40} />
//               </Link>
//             </div>

//             {/* Controls */}
//             <div className="flex items-center gap-2 sm:gap-3">
//               {!loading && user && (
//                 <div className="mr-2">
//                   <NotificationCenter />
//                 </div>
//               )}

//               <LocaleSwitch />
//               <ThemeSwitch />

//               {/* Auth Buttons for Non-Logged In Users */}
//               {!loading && !user && (
//                 <div className="flex items-center gap-2">
//                   <Link to="/auth/login">
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="hidden sm:flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
//                     >
//                       <SignIn className="w-4 h-4" />
//                       {t`Sign In`}
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       className="sm:hidden text-gray-700 dark:text-gray-300"
//                     >
//                       <SignIn className="w-5 h-5" />
//                     </Button>
//                   </Link>
                  
//                   <Link to="/auth/register">
//                     <Button
//                       variant="primary"
//                       size="sm"
//                       className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hidden sm:inline-flex items-center gap-2"
//                     >
//                       <User className="w-4 h-4" />
//                       {t`Sign Up`}
//                     </Button>
//                     <Button
//                       variant="primary"
//                       size="icon"
//                       className="sm:hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
//                     >
//                       <User className="w-5 h-5" />
//                     </Button>
//                   </Link>
//                 </div>
//               )}

//               {/* User Dropdown for Logged In Users */}
//               {!loading && user && (
//                 <Menu as="div" className="relative inline-block text-left">
//                   <Menu.Button className="flex items-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 justify-center text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-transform hover:scale-105">
//                     <UserAvatar
//                       className="flex-shrink-0 border-2 border-white/20"
//                     />
//                   </Menu.Button>

//                   <Transition
//                     as={Fragment}
//                     enter="transition ease-out duration-100"
//                     enterFrom="transform opacity-0 scale-95"
//                     enterTo="transform opacity-100 scale-100"
//                     leave="transition ease-in duration-75"
//                     leaveFrom="transform opacity-100 scale-100"
//                     leaveTo="transform opacity-0 scale-95"
//                   >
//                     <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
//                       <div className="py-1">
//                         <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
//                           <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
//                             {user.name || user.email}
//                           </p>
//                           <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
//                             {user.email}
//                           </p>
//                         </div>
                        
//                         <Menu.Item>
//                           {({ active }: any) => (
//                             <Link
//                               to="/dashboard/profile"
//                               className={`${
//                                 active ? "bg-gray-100 dark:bg-gray-700" : ""
//                               } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
//                             >
//                               <User className="mr-2 w-4 h-4" />
//                               {t`Profile`}
//                             </Link>
//                           )}
//                         </Menu.Item>
//                         <Menu.Item>
//                           {({ active }: any) => (
//                             <Link
//                               to="/dashboard/settings"
//                               className={`${
//                                 active ? "bg-gray-100 dark:bg-gray-700" : ""
//                               } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
//                             >
//                               <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                               </svg>
//                               {t`Settings`}
//                             </Link>
//                           )}
//                         </Menu.Item>
                        
//                         {/* Add divider before logout */}
//                         <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                        
//                         <Menu.Item>
//                           {({ active }: any) => (
//                             <button
//                               onClick={confirmLogout}
//                               className={`${
//                                 active ? "bg-red-50 dark:bg-red-900/20" : ""
//                               } flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors`}
//                             >
//                               <SignOut className="mr-2 w-4 h-4" />
//                               {t`Logout`}
//                             </button>
//                           )}
//                         </Menu.Item>
//                       </div>
//                     </Menu.Items>
//                   </Transition>
//                 </Menu>
//               )}
//             </div>
//           </div>
//         </header>
//       </div>

//       {/* Spacer to prevent content from hiding under header */}
//       <div style={{ height: headerHeight }} />



//     {/* Bonus Flag - ADD THIS LINE */}
//     <BonusFlag />


//       {/* Main Layout Container */}
//       <div className="flex">
//         {/* Desktop Sidebar */}
//         <div className="hidden lg:block fixed inset-y-0 z-30 pt-[88px]">
//           <Sidebar onCollapseChange={setSidebarCollapsed} />
//         </div>

//         {/* Main Content */}
//         <main
//           className={`
//             flex-1 w-full min-w-0
//             transition-all duration-300 ease-in-out
//             lg:ml-80
//             ${sidebarCollapsed ? "lg:!ml-20" : ""}
//           `}
//         >
//           <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:container lg:mx-auto lg:px-8 lg:py-8">
//             <div className="animate-in fade-in duration-500">
//               <Outlet />
//             </div>
//           </div>
//           <div className="mt-[10px] mb-0">
//             <Footer />
//           </div>
//         </main>
//       </div>

   
//       <WelcomePopup />
//     </div>
//   );
// };



// dashboard-layout.tsx (updated)
import { t, Trans } from "@lingui/macro";
import { SidebarSimple, SignOut, Warning, User, SignIn, Question, BookOpen, Envelope } from "@phosphor-icons/react";
import { Button, Sheet, SheetClose, SheetContent, SheetTrigger, SheetTitle, SheetDescription, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@reactive-resume/ui";
import { useState, Fragment, useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { LocaleSwitch } from "@/client/components/locale-switch";
import { Logo } from "@/client/components/logo";
import { ThemeSwitch } from "@/client/components/theme-switch";
import { Link } from "react-router";
import { Menu, Transition } from "@headlessui/react";
import { NotificationCenter } from "@/client/components/notifications/NotificationCenter";
import { useUser } from "@/client/services/user";
import { useLogout } from "@/client/services/auth";
import { useAuthStore } from "@/client/stores/auth";

import { Footer } from "../home/components/footer";

import { Sidebar } from "./_components/sidebar";
import { UserAvatar } from "@/client/components/user-avatar";

import { WelcomePopup } from '@/client/components/WelcomePopup';
import { BonusFlag } from './BonusFlag';

// Import the AssistantDashboard
import AssistantDashboard from "./assistant/assistantdashboard";

export const DashboardLayout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const { user, loading } = useUser();
  const { logout } = useLogout();
  const isLoggedIn = useAuthStore((state) => !!state.user);
  
  const headerHeight = 20; 
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  // Check if current route is the assistant dashboard
  const isAssistantRoute = location.pathname === "/dashboard/assistant";

  return (
    <div className="min-h-screen bg-background">
      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Warning className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <DialogTitle>{t`Confirm Logout`}</DialogTitle>
                <DialogDescription>
                  {t`Are you sure you want to logout?`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <DialogFooter>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {t`Cancel`}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center gap-2"
            >
              <SignOut className="w-4 h-4" />
              {t`Logout`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top Navigation */}
      <div className="sticky top-0 z-50">
        <header className="relative backdrop-blur-md bg-background/80 border-b border-border shadow-lg supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex items-center justify-between px-2 py-2 sm:px-2 sm:py-2">
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
                    className="focus-visible:outline-none w-[280px] p-0 border-r border-border bg-background sm:w-80 h-screen"
                  >
                    <SheetTitle className="sr-only">{t`Navigation Menu`}</SheetTitle>
                    <SheetDescription className="sr-only">
                      {t`Main navigation menu for the application`}
                    </SheetDescription>

                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between p-4 border-b border-border bg-background">
                        <Link to="/" className="flex items-center" onClick={() => setOpen(false)}>
                          <Logo size={40} className="sm:size-48" />
                        </Link>
                        <SheetClose asChild>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-9 w-9"
                            onClick={() => setOpen(false)}
                          >
                            <SidebarSimple className="h-4 w-4" />
                          </Button>
                        </SheetClose>
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <Sidebar setOpen={setOpen} forceExpanded={true} />
                      </div>
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
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="flex items-center justify-center w-8 h-8 rounded-full text-gray-900 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400">
                  <Question className="w-5 h-5" />
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
                  <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }: any) => (
                          <a
                            href="/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${
                              active ? "bg-gray-100 dark:bg-gray-700" : ""
                            } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                          >
                            <BookOpen className="mr-2 w-4 h-4" />
                            {t`Documentation`}
                          </a>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }: any) => (
                          <Link
                            to="/contact"
                            className={`${
                              active ? "bg-gray-100 dark:bg-gray-700" : ""
                            } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                          >
                            <Envelope className="mr-2 w-4 h-4" />
                            {t`Contact Us`}
                          </Link>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>

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
                      {t`Sign In`}
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
                      {t`Sign Up`}
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

              {/* User Dropdown for Logged In Users */}
              {!loading && user && (
                <Menu as="div" className="relative inline-block text-left">
                  <Menu.Button className="flex items-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 justify-center text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-transform hover:scale-105">
                    <UserAvatar
                      className="flex-shrink-0 border-2 border-white/20"
                    />
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
                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-60">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.name || user.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>

                        {/* Assistant button */}
                        <Menu.Item>
                          {({ active }: any) => (
                            <Link
                              to="/dashboard/assistant"
                              className={`${
                                active ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20" : ""
                              } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 group`}
                            >
                              {/* Bot icon */}
                              <div className="mr-2 w-8 h-8 relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <img 
                                  src="/assets/assistant.jpeg" 
                                  alt="Assistant"
                                  className="w-full h-full rounded-full object-cover"
                                />
                                </div>
                                {/* Online indicator */}
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                              </div>
                              <span>My Assistant</span>
                              <span className="ml-auto text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-1.5 py-0.5 rounded-full">
                                New
                              </span>
                            </Link>
                          )}
                        </Menu.Item>
                        
                        <Menu.Item>
                          {({ active }: any) => (
                            <Link
                              to="/dashboard/profile"
                              className={`${
                                active ? "bg-gray-100 dark:bg-gray-700" : ""
                              } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                            >
                              <User className="mr-2 w-4 h-4" />
                              {t`Profile`}
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }: any) => (
                            <Link
                              to="/dashboard/settings"
                              className={`${
                                active ? "bg-gray-100 dark:bg-gray-700" : ""
                              } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                            >
                              <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {t`Settings`}
                            </Link>
                          )}
                        </Menu.Item>
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                        
                        <Menu.Item>
                          {({ active }: any) => (
                            <button
                              onClick={confirmLogout}
                              className={`${
                                active ? "bg-red-50 dark:bg-red-900/20" : ""
                              } flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors`}
                            >
                              <SignOut className="mr-2 w-4 h-4" />
                              {t`Logout`}
                            </button>
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
      </div>

      {/* Spacer to prevent content from hiding under header */}
      <div style={{ height: headerHeight }} />

      {/* Bonus Flag */}
      <BonusFlag />

      {/* Main Layout Container */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block fixed inset-y-0 z-30 pt-[88px]">
          <Sidebar onCollapseChange={setSidebarCollapsed} />
        </div>

        {/* Main Content */}
        <main
          className={`
            flex-1 w-full min-w-0
            transition-all duration-300 ease-in-out
            lg:ml-80
            ${sidebarCollapsed ? "lg:!ml-20" : ""}
            ${isAssistantRoute ? "bg-background" : ""}
          `}
        >
          <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:container lg:mx-auto lg:px-8 lg:py-8">
            <div className="animate-in fade-in duration-500">
              {/* Render the AssistantDashboard when on assistant route */}
              {isAssistantRoute ? <AssistantDashboard /> : <Outlet />}
            </div>
          </div>
          <div className="mt-[10px] mb-0">
            <Footer />
          </div>
        </main>
      </div>

      <WelcomePopup />
    </div>
  );
};