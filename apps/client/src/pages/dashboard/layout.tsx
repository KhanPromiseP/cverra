import { SidebarSimple } from "@phosphor-icons/react";
import { Button, Sheet, SheetClose, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@reactive-resume/ui";
import { useState, Fragment } from "react";
import { Outlet } from "react-router";
import { LocaleSwitch } from "@/client/components/locale-switch";
import { Logo } from "@/client/components/logo";
import { ThemeSwitch } from "@/client/components/theme-switch";
import { Link } from "react-router";
import { Menu, Transition } from "@headlessui/react";
import { NotificationCenter } from "@/client/components/notifications/NotificationCenter";
import { useUser } from "@/client/services/user";

import { Footer } from "../home/components/footer";

import { Sidebar } from "./_components/sidebar";

export const DashboardLayout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, loading } = useUser();
  const headerHeight = 28; // Spacer height to prevent overlap

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
              {!loading && user && (
                <div className="mr-2">
                  <NotificationCenter />
                </div>
              )}

              <LocaleSwitch />
              <ThemeSwitch />

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
                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }: any) => (
                            <Link
                              to="/dashboard/profile"
                              className={`${
                                active ? "bg-gray-100" : ""
                              } block px-4 py-2 text-sm text-gray-700`}
                            >
                              Profile
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }: any) => (
                            <Link
                              to="/dashboard/settings"
                              className={`${
                                active ? "bg-gray-100" : ""
                              } block px-4 py-2 text-sm text-gray-700`}
                            >
                              Settings
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }: any) => (
                            <Link
                              to="/logout"
                              className={`${
                                active ? "bg-gray-100" : ""
                              } block px-4 py-2 text-sm text-gray-700`}
                            >
                              Logout
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
      </div>

      {/* Spacer to prevent content from hiding under header */}
      <div style={{ height: headerHeight }} />

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
          `}
        >
          <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:container lg:mx-auto lg:px-8 lg:py-8">
            <div className="animate-in fade-in duration-500">
              <Outlet />
            </div>
          </div>
          <div className="mt-[250px] mb-0">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
};
