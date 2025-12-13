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
  // Motion Background
  // -------------------------
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Detect Tailwind dark/light mode
  useEffect(() => {
    const html = document.documentElement;
    setTheme(html.classList.contains("dark") ? "dark" : "light");

    const observer = new MutationObserver(() => {
      const html = document.documentElement;
      setTheme(html.classList.contains("dark") ? "dark" : "light");
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w: number, h: number;
    let particles: { x: number; y: number; vx: number; vy: number }[] = [];
    let animationId: number;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      particles = Array.from({ length: 60 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      }));
    };

    const draw = () => {
      if (!ctx) return;

      // Enhanced background colors with gradients
      if (theme === "dark") {
        // Dark theme: Deep blue to purple gradient
        const gradient = ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, "#0f172a"); // slate-900
        gradient.addColorStop(0.5, "#1e1b4b"); // indigo-950
        gradient.addColorStop(1, "#312e81"); // indigo-900
        ctx.fillStyle = gradient;
      } else {
        // Light theme: Soft blue to white gradient
        const gradient = ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, "#f0f9ff"); // sky-50
        gradient.addColorStop(0.4, "#e0f2fe"); // sky-100
        gradient.addColorStop(0.8, "#bae6fd"); // sky-200
        gradient.addColorStop(1, "#7dd3fc"); // sky-300
        ctx.fillStyle = gradient;
      }
      
      ctx.fillRect(0, 0, w, h);

      // Enhanced dot and line colors
      const dotColor = theme === "dark" ? "rgba(120, 113, 255, 0.8)" : "rgba(59, 130, 246, 0.8)"; // indigo-500 / blue-500
      const lineColor = theme === "dark" ? "rgba(120, 113, 255, 0.2)" : "rgba(59, 130, 246, 0.15)";

      ctx.fillStyle = dotColor;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, theme === "dark" ? 2.5 : 2, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const opacity = 1 - dist / 150;
            ctx.globalAlpha = opacity * 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [theme]);

  // -------------------------
  // Layout JSX
  // -------------------------
  if (!providers) return null;

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden">
      {/* Motion Background */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 z-0 h-screen w-screen"
      />

      {/* Enhanced Top Nav */}
      <header className="relative z-10 backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4 sm:px-12">
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
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg sm:max-w-xl lg:max-w-xl flex flex-col items-center justify-center gap-y-8">
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