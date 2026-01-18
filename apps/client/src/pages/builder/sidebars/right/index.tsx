import { t } from "@lingui/macro";
import { ScrollArea, Separator } from "@reactive-resume/ui";
import { useRef } from "react";

import { ThemeSwitch } from "@/client/components/theme-switch";

import { CssSection } from "./sections/css";
import { ExportSection } from "./sections/export";
import { InformationSection } from "./sections/information";
import { LayoutSection } from "./sections/layout";
import { NotesSection } from "./sections/notes";
import { PageSection } from "./sections/page";
import { SharingSection } from "./sections/sharing";
import { StatisticsSection } from "./sections/statistics";
import { TemplateSection } from "./sections/template";
import { ThemeSection } from "./sections/theme";
import { TypographySection } from "./sections/typography";
import { SectionIcon } from "./shared/section-icon";

export const RightSidebar = () => {
  const containterRef = useRef<HTMLDivElement | null>(null);

  const scrollIntoView = (selector: string) => {
    const section = containterRef.current?.querySelector(selector);
    section?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex bg-secondary-accent/30 border-r border-gray-700 border-l border-gray-700 sm:mx-0"> {/* Added mx-4 for mobile */}
      <ScrollArea orientation="vertical" className="h-screen flex-1 pb-16 lg:pb-0">
        <div ref={containterRef} className="border-r border-gray-700 grid gap-y-6 p-6 @container/right"> {/* Added sm:rounded-lg */}
          <div className="mx-8">
          <TemplateSection />
          </div>
          <Separator />

           <div className="mx-8">
          <LayoutSection />
          </div>
          <Separator />
           <div className="mx-8">
          <TypographySection />
          </div>
          <Separator />
           <div className="mx-8">
          <ThemeSection />
          </div>
          <Separator />
           <div className="mx-8">
          <CssSection />
          </div>
          <Separator />
           <div className="mx-8">
          <PageSection />
          </div>
          <Separator />
           <div className="mx-8">
          <SharingSection />
          </div>
          <Separator />
           <div className="mx-8">
          <StatisticsSection />
          </div>
          <Separator />

          <ExportSection />

          <Separator />
           <div className="mx-8">
          <NotesSection />
          </div>
          <Separator />

          <InformationSection />

          <Separator />
       
        </div>
      </ScrollArea>

      <div className="hidden basis-12 flex-col items-center justify-between bg-secondary-accent/30 py-4 sm:flex">
        <div />

        <div className="flex flex-col items-center justify-center gap-y-2">
          <SectionIcon
            id="template"
            name={t`Template`}
            onClick={() => {
              scrollIntoView("#template");
            }}
            className="text-blue-600 dark:text-blue-400"
          />
          <SectionIcon
            id="layout"
            name={t`Layout`}
            onClick={() => {
              scrollIntoView("#layout");
            }}
            className="text-yellow-600 dark:text-yellow-400"
          />
          <SectionIcon
            id="typography"
            name={t`Typography`}
            onClick={() => {
              scrollIntoView("#typography");
            }}
            className="text-pink-600 dark:text-pink-400"
          />
          <SectionIcon
            id="theme"
            name={t`Theme`}
            onClick={() => {
              scrollIntoView("#theme");
            }}
            className="text-orange-600 dark:text-orange-400"
          />
          <SectionIcon
            id="css"
            name={t`Custom CSS`}
            onClick={() => {
              scrollIntoView("#css");
            }}
            className="text-teal-600 dark:text-teal-400"
          />
          <SectionIcon
            id="page"
            name={t`Page`}
            onClick={() => {
              scrollIntoView("#page");
            }}
            className="text-teal-600 dark:text-teal-400"
          />
          <SectionIcon
            id="sharing"
            name={t`Sharing`}
            onClick={() => {
              scrollIntoView("#sharing");
            }}
            className="text-teal-600 dark:text-teal-400"
          />
          <SectionIcon
            id="statistics"
            name={t`Statistics`}
            onClick={() => {
              scrollIntoView("#statistics");
            }}
            className="text-teal-600 dark:text-teal-400"
          />
          <SectionIcon
            id="export"
            name={t`Export`}
            onClick={() => {
              scrollIntoView("#export");
            }}
            className="text-teal-600 dark:text-teal-400"
          />
          <SectionIcon
            id="notes"
            name={t`Notes`}
            onClick={() => {
              scrollIntoView("#notes");
            }}
            className="text-teal-600 dark:text-teal-400"
          />
          <SectionIcon
            id="information"
            name={t`Information`}
            onClick={() => {
              scrollIntoView("#information");
            }}
            className="text-teal-600 dark:text-teal-400"
          />
        </div>

        <ThemeSwitch size={14} />
      </div>
    </div>
  );
};