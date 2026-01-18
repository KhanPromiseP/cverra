import { t } from "@lingui/macro";
import { cn } from "@reactive-resume/utils";
import { useMemo, useEffect, useRef, useState } from "react";
import { Link, matchRoutes, Outlet, useLocation } from "react-router";

import { LocaleSwitch } from "@/client/components/locale-switch";
import { Logo } from "@/client/components/logo";
import { ThemeSwitch } from "@/client/components/theme-switch";
import { useAuthProviders } from "@/client/services/auth/providers";

import { SocialAuth } from "./_components/social-auth";

const authRoutes = [{ path: "/auth/login" }, { path: "/auth/register" }];

export const AuthLayout = () => {
  const location = useLocation();
  const { providers } = useAuthProviders();
  const isAuthRoute = useMemo(() => matchRoutes(authRoutes, location) !== null, [location]);

  const hideDivider = !providers?.includes("email") || (providers?.length === 1);

 

  // -------------------------
  // Layout JSX
  // -------------------------
  if (!providers) return null;

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden">
  
      
      {/* Enhanced Top Nav */}
      <header className="relative z-10 backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-2 sm:px-12">
          <Link to="/" className="flex items-center group">
            <Logo className="group-hover:scale-105 transition-transform duration-300" size={72} />
          </Link>

          <div className="flex items-center space-x-4">
            <LocaleSwitch />
            <ThemeSwitch />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 sm:px-4 lg:px-8">
        <div className="w-full max-w-lg sm:max-w-xl lg:max-w-xl flex flex-col items-center justify-center gap-y-4">
          <div className="w-full">
            <Outlet />
          </div>

          {isAuthRoute && (
            <>
              <div className={cn("flex items-center gap-x-4 w-full", hideDivider && "hidden")}>
                <hr className="flex-1 border-gray-300 dark:border-gray-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 px-4">
                  {t({
                    message: "or continue with",
                    context:
                      "The user can either login with email/password, or continue with GitHub or Google.",
                  })}
                </span>
                <hr className="flex-1 border-gray-300 dark:border-gray-600" />
              </div>

              <SocialAuth />
            </>
          )}
        </div>
      </main>

    </div>
  );
};