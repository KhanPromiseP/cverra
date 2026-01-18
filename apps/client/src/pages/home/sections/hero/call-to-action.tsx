import { t } from "@lingui/macro";
import { Book, SignOut, Rocket, ArrowRight, Star } from "@phosphor-icons/react";
import { Button } from "@reactive-resume/ui";
import { Link } from "react-router";
import { motion } from "framer-motion";

import { useLogout } from "@/client/services/auth";
import { useAuthStore } from "@/client/stores/auth";

export const HeroCTA = () => {
  const { logout } = useLogout();
  const isLoggedIn = useAuthStore((state) => !!state.user);

  if (isLoggedIn) {
    return (
      <div className="flex flex-col sm:flex-row gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          <Button 
            asChild 
            size="lg" 
            className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-2xl shadow-2xl hover:shadow-3xl border-0 transition-all duration-300 group"
          >
            <Link to="/dashboard" className="flex items-center gap-2">
              <Rocket className="w-5 h-5 group-hover:scale-110 transition-transform" weight="fill" />
              {t`Go to Dashboard`}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => logout()}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-2 border-gray-300 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-600 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <SignOut className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform" />
            {t`Logout`}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Primary CTA - Get Started */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
        <Button 
          asChild 
          size="lg" 
          className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-2xl shadow-2xl hover:shadow-3xl border-0 transition-all duration-300 group overflow-hidden"
        >
          <Link to="/auth/login" className="flex items-center gap-2">
            <span className="relative z-10 flex items-center gap-2">
              <Rocket className="w-5 h-5 group-hover:scale-110 transition-transform" weight="fill" />
              {t`Get Started`}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </Link>
        </Button>
      </motion.div>

      {/* Secondary CTA - Learn More */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button 
          asChild 
          size="lg" 
          variant="outline"
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden"
        >
          <Link to="/docs" className="flex items-center gap-2">
            <Book className="w-5 h-5 group-hover:scale-110 transition-transform" weight="fill" />
            {t`Learn More`}
            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/10 dark:via-blue-900/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};