import { motion } from "framer-motion";
import { Link } from "react-router";
import { LocaleSwitch } from "@/client/components/locale-switch";
import { Logo } from "@/client/components/logo";
import { ThemeSwitch } from "@/client/components/theme-switch";
import { NotificationCenter } from "@/client/components/notifications/NotificationCenter";
import { useUser } from "@/client/services/user";
import { Menu, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { UserAvatar } from "@/client/components/user-avatar";
import { 
  SignOut, 
  Warning, 
  User, 
  SignIn, 
  Question, 
  BookOpen, 
  Envelope 
} from "@phosphor-icons/react"; 
import { useLogout } from "@/client/services/auth";
import { useAuthStore } from "@/client/stores/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@reactive-resume/ui";
import { Button } from "@reactive-resume/ui";

export const Header = () => {
  const { user, loading } = useUser();
  const { logout } = useLogout();
  const isLoggedIn = useAuthStore((state) => !!state.user);
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const headerHeight = 64;

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.3 } }}
      >
        <div className="backdrop-blur-md bg-white/20 dark:bg-gray-900/20 border-b border-gray-300 dark:border-gray-700 shadow-md">
          <div className="container mx-auto flex items-center justify-between px-4 py-2 sm:px-8">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <Logo className="-ml-2" size={56} />
            </Link>

            {/* Controls */}
            <div className="flex items-center space-x-3">
              {/* Question Mark Help Dropdown */}
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="flex items-center justify-center w-8 h-8 rounded-full text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400">
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
                            Documentation
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
                            Contact Us
                          </Link>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>

              {!loading && user && <NotificationCenter />}

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

              {/* Profile Dropdown for Logged In Users */}
              {!loading && user && (
                <Menu as="div" className="relative inline-block text-left">
                  <Menu.Button className="flex items-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 justify-center text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-transform hover:scale-105">
                    <UserAvatar
                      size={32}
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
                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.name || user.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        
                        <Menu.Item>
                          {({ active }: any) => (
                            <Link
                              to="/dashboard/profile"
                              className={`${
                                active ? "bg-gray-100 dark:bg-gray-700" : ""
                              } flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                            >
                              <User className="mr-2 w-4 h-4" />
                              Profile
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
                              Settings
                            </Link>
                          )}
                        </Menu.Item>
                        
                        {/* Add divider before logout */}
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
                              Logout
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
        </div>
      </motion.header>

      {/* Spacer to prevent content hiding under header */}
      <div style={{ height: headerHeight }} />

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Warning className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <DialogTitle>Confirm Logout</DialogTitle>
                <DialogDescription>
                  Are you sure you want to logout?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <DialogFooter>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center gap-2"
            >
              <SignOut className="w-4 h-4" />
              Logout
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};