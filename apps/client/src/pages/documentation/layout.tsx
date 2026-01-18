import { t, Trans } from "@lingui/macro";
import { useEffect, useState } from "react";
import { cn } from "@reactive-resume/utils";
import {
  PlatformOverviewSection,
  GettingStartedSection,
  ResumeBuilderSection,
  LetterBuilderSection,
  ArticlesKnowledgeCenterSection,
  PaymentsPremiumTrustSection,
} from "./docs/index";

const sections = [
  { id: "platform-overview", title: t`Platform Overview` },
  { id: "getting-started", title: t`Getting Started` },
  { id: "resume-builder", title: t`Resume Builder` },
  { id: "letter-builder", title: t`Letter Builder` },
  { id: "articles-knowledge-center", title: t`Articles & Knowledge Center` },
  { id: "payments-premium-trust", title: t`Payments & Premium` },
];

export const DocumentationPage = () => {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  // Scroll spy effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // offset
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-muted/40 p-6 sticky top-0 h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{t`Documentation`}</h2>
        <nav className="flex flex-col space-y-3">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className={cn(
                "cursor-pointer rounded px-3 py-2 hover:bg-accent/20 transition-colors",
                activeSection === section.id ? "bg-accent/30 font-semibold text-primary" : "text-muted-foreground"
              )}
            >
              {section.title}
            </a>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 md:p-12 max-w-5xl mx-auto w-full space-y-24">
        <PlatformOverviewSection />
        <GettingStartedSection />
        <ResumeBuilderSection />
        <LetterBuilderSection />
        <ArticlesKnowledgeCenterSection />
        <PaymentsPremiumTrustSection />
      </main>
    </div>
  );
};