import { t } from "@lingui/macro";
import { useNavigate } from "react-router";
import { Logo } from "@/client/components/logo";
import { LocaleSwitch } from "@/client/components/locale-switch";
import { ThemeSwitch } from "@/client/components/theme-switch";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

export const LearnMorePage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const currentYear = new Date().getFullYear();

  // Detect Tailwind dark/light mode
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);



  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden text-foreground">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      <header className="relative z-10 backdrop-blur-md bg-white/10 border-b shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center">
            <Logo size={62} />
          </Link>

          <div className="flex items-center gap-4">
            <LocaleSwitch />
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6">
        <div className="max-w-3xl text-center p-8 rounded-lg backdrop-blur-sm bg-white/10 shadow-lg">
          <h1 className="text-4xl font-bold mb-6">
            {t`Learn More About Inlirah`}
          </h1>

          <p className="text-lg leading-relaxed opacity-90 mb-6">
            {t`Inlirah is more than just a CV builder — it is a career empowerment platform. We help you communicate your value clearly, present yourself with confidence, and stand out in competitive job markets. Whether you are crafting your first resume or refining your professional profile, Inlirah guides you step-by-step with structure, clarity, and professional styling.`}
          </p>

          <p className="text-lg leading-relaxed opacity-90 mb-6">
            {t`Our templates are built to reflect real hiring standards. Each section, wording suggestion, and formatting layout is designed based on what recruiters look for. No unnecessary complexity. No clutter. Just clean, impactful presentation that makes your strengths undeniable.`}
          </p>

          <p className="text-lg leading-relaxed opacity-90 mb-10">
            {t`With Inlirah, you do not need to be a designer, a writer, or a career strategist. You simply bring your story, and we help you shape it with elegance, clarity, and professional impact.`}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
            
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition w-full sm:w-auto"
            >
               <Link to="/auth/login">{t`Get Started`}</Link>
            </button>

            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 border border-gray-300 text-primary rounded-lg hover:bg-secondary hover:text-white transition w-full sm:w-auto"
            >
              {t`Go Back Home`}
            </button>
          </div>
          
        </div>
      </main>
        <footer className="mt-10 mb-4 text-sm text-center opacity-70">
            {t`© ${currentYear} Inlirah. All rights reserved.`}
          </footer>
    </div>
  );
};
