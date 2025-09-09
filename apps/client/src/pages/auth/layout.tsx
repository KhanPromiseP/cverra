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
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Detect Tailwind dark/light mode
  useEffect(() => {
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

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      }));
    };

    const draw = () => {
      if (!ctx) return;

      // Background color
      ctx.fillStyle = theme === "dark" ? "#000000" : "gray";
      ctx.fillRect(0, 0, w, h);

      // Dot and line colors
      const dotColor = theme === "dark" ? "rgba(253, 250, 250, 0.7)" : "rgba(0,112,255,0.8)"; // blue in light mode
      const lineColor = theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,112,255,0.2)"; // lighter blue lines in light mode

      ctx.fillStyle = dotColor;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 0.5;

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [theme]);

  // -------------------------
  // Layout JSX
  // -------------------------
  if (!providers) return null;

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden text-white">
      {/* Motion Background */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 z-0 h-screen w-screen block"
        style={{ display: "block" }}
      />

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


      {/* Main Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg sm:max-w-xl lg:max-w-xl flex flex-col items-center justify-center gap-y-10">
          <div className="w-full space-y-6">
            <Outlet />
          </div>

          {isAuthRoute && (
            <>
              <div className={cn("flex items-center gap-x-4", hideDivider && "hidden")}>
                <hr className="flex-1 border-gray-500" />
                <span className="text-sm sm:text-base lg:text-lg font-medium">
                  {t({
                    message: "or continue with",
                    context:
                      "The user can either login with email/password, or continue with GitHub or Google.",
                  })}
                </span>
                <hr className="flex-1 border-gray-500" />
              </div>

              <SocialAuth />
            </>
          )}
        </div>
      </main>

      {/* Footer (image credit) */}
      <footer className="relative z-10 hidden lg:block lg:p-6">
        <div className="absolute bottom-5 right-5 z-10 bg-primary/30 px-4 py-2 text-xs font-medium text-primary-foreground backdrop-blur-sm">
          <a
            target="_blank"
            rel="noopener noreferrer nofollow"
            href="https://unsplash.com/photos/Oaqk7qqNh_c"
          >
            {t`Photograph by Patrick Tomasso`}
          </a>
        </div>
      </footer>
    </div>
  );
};
