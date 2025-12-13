import { t } from "@lingui/macro";
import { useNavigate } from "react-router";
import { Logo } from "@/client/components/logo";
import { LocaleSwitch } from "@/client/components/locale-switch";
import { ThemeSwitch } from "@/client/components/theme-switch";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";


export const PrivacyPolicyPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

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

  // Motion background
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
      ctx.fillStyle = theme === "dark" ? "#000000" : "#f0f0f0";
      ctx.fillRect(0, 0, w, h);

      const dotColor = theme === "dark" ? "rgba(253, 250, 250, 0.7)" : "rgba(0,112,255,0.8)";
      const lineColor = theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,112,255,0.2)";

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

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden text-foreground">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 z-0 h-screen w-screen block"
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
      <main className="relative z-10 flex flex-1 items-start justify-center px-4 sm:px-6 lg:px-8 pt-10">
        <div className="w-full max-w-4xl p-6 sm:p-12  text-foreground rounded-lg">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition"
          >
            {t`Back`}
          </button>

          <h1 className="text-3xl font-bold mb-4">{t`Privacy Policy`}</h1>

          <p className="mb-4">
            {t`Cverra values your privacy and is committed to protecting your personal information. This Privacy Policy outlines how we collect, use, and safeguard your data.`}
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2">{t`Information We Collect`}</h2>
          <p className="mb-4">
            {t`We may collect personal information such as your name, email address, and resume content when you create or update your CV. We also collect usage data to improve our services.`}
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2">{t`How We Use Your Information`}</h2>
          <p className="mb-4">
            {t`The information you provide is used to create, save, and manage your CVs. Usage data helps us improve Cverra and deliver a better user experience.`}
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2">{t`Data Sharing and Security`}</h2>
          <p className="mb-4">
            {t`We do not sell your personal data. We may share information with trusted service providers to maintain and improve our platform. All data is stored securely using industry-standard practices.`}
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2">{t`Your Rights`}</h2>
          <p className="mb-4">
            {t`You have the right to access, update, or delete your personal data at any time. You can contact us for any privacy-related inquiries.`}
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2">{t`Changes to This Policy`}</h2>
          <p className="mb-4">
            {t`We may update this Privacy Policy from time to time. The latest version will always be available on our website.`}
          </p>

          <footer className="mt-10 text-sm text-center opacity-70">
            {t`© ${currentYear} Cverra. All rights reserved.`}
          </footer>
        </div>
      </main>
    </div>
  );
};
