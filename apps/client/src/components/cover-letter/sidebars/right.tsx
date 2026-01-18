// client/components/cover-letter/sidebars/right.tsx
import { t } from "@lingui/macro";
import { ScrollArea, Separator, Button } from "@reactive-resume/ui";
import { useRef } from "react";
import { 
  Layout, 
  Palette, 
  Type, 
  Download, 
  BarChart3, 
  Info 
} from "lucide-react";

import { Link } from "react-router";
import { Icon } from "@/client/components/icon";

import { ThemeSwitch } from "@/client/components/theme-switch";
import { useCoverLetterStore } from "../../../../stores/cover-letter";

import { SectionIcon } from "../shared/section-icon";
import { TemplateSection } from "./sections/template";
import { TypographySection } from "./sections/typography";
import { ExportSection } from "./sections/export";
import { StatisticsSection } from "./sections/statistics";
import { InformationSection } from "./sections/information";

export const RightSidebar = () => {
  const containterRef = useRef<HTMLDivElement | null>(null);
  const { coverLetter } = useCoverLetterStore();

  const scrollIntoView = (selector: string) => {
    const section = containterRef.current?.querySelector(selector);
    section?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex border-l mt-20 border-gray-500 dark:border-gray-700 h-full w-full bg-background">
      {/* Content Area */}
      <div className="flex-1 flex flex-col">
        <ScrollArea orientation="vertical" className="flex-1">
          <div ref={containterRef} className="grid gap-y-6 p-6 @container/right">
            <TemplateSection />
            <Separator />
            <TypographySection />
            <Separator />
            <ExportSection />
            <Separator />
            <StatisticsSection />
            <Separator />
            <InformationSection />
            <Separator />
          </div>
        </ScrollArea>
      </div>

      {/* Icon Bar */}
      <div className="hidden basis-12 flex-col items-center border-r border-gray-500 dark:border-gray-700 justify-between bg-secondary-accent/30 py-4 sm:flex border-l">
        <Button asChild size="icon" variant="ghost" className="size-8 rounded-full">
          <Link to="/dashboard">
            <Icon size={14} />
          </Link>
        </Button>

        <div className="flex flex-col items-center justify-center gap-y-3">
          <SectionIcon
            id="template"
            name={t`Templates`}
            icon={<Layout size={16} className="text-orange-600 dark:text-orange-400" />}
            onClick={() => scrollIntoView("#template")}
          />
          <SectionIcon
            id="style"
            name={t`Style`}
            icon={<Palette size={16} className="text-pink-600 dark:text-pink-400" />}
            onClick={() => scrollIntoView("#style")}
          />
          <SectionIcon
            id="layout"
            name={t`Layout`}
            icon={<Layout size={16} className="text-green-600 dark:text-green-400" />}
            onClick={() => scrollIntoView("#layout")}
          />
          <SectionIcon
            id="typography"
            name={t`Typography`}
            icon={<Type size={16} className="text-blue-600 dark:text-blue-400" />}
            onClick={() => scrollIntoView("#typography")}
          />
          <SectionIcon
            id="export"
            name={t`Export`}
            icon={<Download size={16} className="text-purple-600 dark:text-purple-400" />}
            onClick={() => scrollIntoView("#export")}
          />
          <SectionIcon
            id="statistics"
            name={t`Statistics`}
            icon={<BarChart3 size={16} className="text-teal-600 dark:text-teal-400" />}
            onClick={() => scrollIntoView("#statistics")}
          />
          <SectionIcon
            id="information"
            name={t`Information`}
            icon={<Info size={16} className="text-gray-600 dark:text-gray-400" />}
            onClick={() => scrollIntoView("#information")}
          />
        </div>

        <ThemeSwitch size={14} />
      </div>
    </div>
  );
};