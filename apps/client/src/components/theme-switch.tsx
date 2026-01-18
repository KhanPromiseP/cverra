import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "@reactive-resume/hooks";
import { Button } from "@reactive-resume/ui";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  size?: number;
  className?: string;
};

export const ThemeSwitch = ({ size = 20, className }: Props) => {
  const { theme, toggleTheme } = useTheme();

  // Determine which icon to show - only light/dark
  const showSun = theme === "dark";

  return (
    <Button 
      size="icon" 
      variant="ghost" 
      className={`relative ${className}`} 
      onClick={toggleTheme}
      aria-label={`Switch to ${showSun ? "light" : "dark"} mode`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <AnimatePresence mode="wait">
          {showSun ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={size} />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={size} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Button>
  );
};