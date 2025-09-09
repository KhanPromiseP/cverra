import { SidebarSimple } from "@phosphor-icons/react";
import { Button, Sheet, SheetClose, SheetContent, SheetTrigger } from "@reactive-resume/ui";
import { motion } from "framer-motion";
import { useState } from "react";
import { Outlet } from "react-router";
import { LocaleSwitch } from "@/client/components/locale-switch";
import { Logo } from "@/client/components/logo";
import { ThemeSwitch } from "@/client/components/theme-switch";
import { Link } from "react-router";


import { Sidebar } from "./_components/sidebar";

export const DashboardLayout = () => {
  const [open, setOpen] = useState(false);

  return (
    
    <div>
        <div className="sticky top-0 flexjustify-between ">
          {/* Top Nav */}
          <header className="relative z-10 backdrop-blur-md bg-white/10 border-b border-gray-300 shadow-md">
          
            <div className="container mx-auto flex items-center justify-between px-6 py-4 sm:px-12">
              <Link to="/" className="flex items-center">
                <Logo className="-ml-3" size={72} />
              </Link>
      
              <div className="flex items-center space-x-4">
                <LocaleSwitch />
                <ThemeSwitch />
              </div>
            </div>
          </header>
        </div>
      
      <div className="sticky top-0 z-50 flex items-center justify-between p-4 pb-0 lg:hidden">
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="bg-background">
              <SidebarSimple />
            </Button>
          </SheetTrigger>

          <SheetContent showClose={false} side="left" className="focus-visible:outline-none">
            <SheetClose asChild className="absolute left-4 top-4">
              <Button size="icon" variant="ghost">
                <SidebarSimple />
              </Button>
            </SheetClose>

            <Sidebar setOpen={setOpen} />
          </SheetContent>
        </Sheet>
      </div>

      <motion.div
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-[320px] lg:flex-col"
      >
        <div className="h-full rounded p-4">
          <Sidebar />
        </div>
      </motion.div>

      <main className="mx-6 my-4 lg:mx-8 lg:pl-[320px]">
        <Outlet />
      </main>
    </div>
  );
};
