import { motion } from "framer-motion";
import { Link } from "react-router";
import { LocaleSwitch } from "@/client/components/locale-switch";
import { Logo } from "@/client/components/logo";
import { ThemeSwitch } from "@/client/components/theme-switch";
import { NotificationCenter } from "@/client/components/notifications/NotificationCenter";
import { useUser } from "@/client/services/user";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

export const Header = () => {
  const { user, loading } = useUser();

  const headerHeight = 88; // px, matches spacer

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.3 } }}
      >
        <div className="backdrop-blur-md bg-white/10 border-b border-gray-300 shadow-md">
          <div className="container mx-auto flex items-center justify-between px-6 py-4 sm:px-12">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <Logo className="-ml-3" size={72} />
            </Link>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {!loading && user && <NotificationCenter />}

              <LocaleSwitch />
              <ThemeSwitch />

              {/* Profile Dropdown */}
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
        </div>
      </motion.header>

      {/* Spacer to prevent content hiding under header */}
      <div style={{ height: headerHeight }} />
    </>
  );
};
