import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { Helmet } from "react-helmet-async";
import { useCallback } from "react";

import { FeaturesSection } from "./sections/features";
import { HeroSection } from "./sections/hero";
import { LogoCloudSection } from "./sections/logo-cloud";
import { TemplatesSection } from "./sections/templates";
import { KnowledgeHubSection } from "./sections/knowledgeHub";
import { PlatformManifestoSection } from "./sections/platformManifesto";
import { ResumeSection } from "./sections/resume";
import { LettersSection } from "./sections/letters";

export const HomePage = () => {
  const { i18n } = useLingui();

  const scrollToTemplates = useCallback(() => {
    const templatesSection = document.getElementById('templates');
    
    if (templatesSection) {
      const offset = 80;
      const elementPosition = templatesSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  return (
    <main className="relative isolate bg-background">
      <Helmet prioritizeSeoTags>
        <html lang={i18n.locale} />
        <title>
          {t`Inlirah`} – {t`Build resumes, letters, and careers with Inlirah`}
        </title>
        <meta
          name="description"
          content={t`Inlirah is an AI-powered career platform that helps professionals build standout resumes, write impactful letters, and grow with expert knowledge.`}
        />
      </Helmet>

      <HeroSection />
      <PlatformManifestoSection />
      {/* Pass the same function to ResumeSection */}
      <ResumeSection onViewTemplates={scrollToTemplates} />
      {/* Pass the same function to LettersSection */}
      <LettersSection onViewTemplates={scrollToTemplates} />
      <KnowledgeHubSection />
      <LogoCloudSection />
      <FeaturesSection />
      <TemplatesSection />
    </main>
  );
};