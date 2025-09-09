import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { Helmet } from "react-helmet-async";


import { FeaturesSection } from "./sections/features";
import { HeroSection } from "./sections/hero";
import { LogoCloudSection } from "./sections/logo-cloud";
import { TemplatesSection } from "./sections/templates";


export const HomePage = () => {
  const { i18n } = useLingui();

  return (
    <main className="relative isolate bg-background">
      <Helmet prioritizeSeoTags>
        <html lang={i18n.locale} />

        <title>
          {t`Reactive Resume`} - {t`A powerful resume builder`}
        </title>

        <meta
          name="description"
          content="A powerful resume builder that makes creating, updating, and sharing your professional profile effortless."
        />
      </Helmet>

      <HeroSection />
      <LogoCloudSection />
      <FeaturesSection />
      <TemplatesSection />
     
    
    </main>
  );
};
