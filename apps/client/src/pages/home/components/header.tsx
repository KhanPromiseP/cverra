import { motion } from "framer-motion";
import { Link } from "react-router";

import { LocaleSwitch } from "@/client/components/locale-switch";
import { Logo } from "@/client/components/logo";
import { ThemeSwitch } from "@/client/components/theme-switch";

export const Header = () => (
  <motion.header
    className="fixed inset-x-0 top-0 z-50"
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.3 } }}
  >
    {/* Transparent background with shadow and bottom line */}
    <div className="backdrop-blur-md bg-white/10 border-b border-gray-300 shadow-md">
      {/* Container to align nav items with page content */}
      <div className="container mx-auto flex items-center justify-between px-6 py-4 sm:px-12">
        <Link to="/" className="flex items-center">
          <Logo className="-ml-3" size={72} />
        </Link>

        <div className="flex items-center space-x-4">
          <LocaleSwitch />
          <ThemeSwitch />
        </div>
      </div>
    </div>
  </motion.header>
);
