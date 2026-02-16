// import { Outlet } from "react-router";

// import { Footer } from "./components/footer";
// import { Header } from "./components/header";

// export const HomeLayout = () => (
//   <div className="min-h-screen flex flex-col bg-background">
//     <Header />
    
//     {/* Main content with proper mobile overflow handling */}
//     <main className="flex-1 w-full overflow-x-hidden overflow-y-auto">
//       {/* Prevent horizontal overflow on mobile */}
//       <div className="w-full min-h-[calc(100vh-140px)]">
//         <Outlet />
//       </div>
//     </main>
    
//     <Footer />
//   </div>
// );


import { Outlet } from "react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { cn } from "@reactive-resume/utils";

import { Footer } from "./components/footer";
import { Header } from "./components/header";

export const HomeLayout = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Main content with proper mobile overflow handling */}
      <main className="flex-1 w-full overflow-x-hidden overflow-y-auto">
        {/* Prevent horizontal overflow on mobile */}
        <div className="w-full min-h-[calc(100vh-140px)]">
          <Outlet />
        </div>
      </main>
      
      <Footer />
      
      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={scrollToTop}
            className={cn(
              "fixed right-4 sm:right-6 md:right-8 bottom-5",
              "z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full",
              "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
              "text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-purple-500/30",
              "flex items-center justify-center",
              "transition-all duration-300 hover:scale-110 active:scale-95",
              "border border-white/20"
            )}
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};