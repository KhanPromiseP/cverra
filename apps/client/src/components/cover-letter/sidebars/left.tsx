// client/components/cover-letter/sidebars/left.tsx
import { t } from "@lingui/macro";
import { Button, ScrollArea, Separator } from "@reactive-resume/ui";
import { useRef } from "react";
import { Link } from "react-router";
import { FileText, Wand2, Settings } from "lucide-react"; 

import { Icon } from "@/client/components/icon";
import { UserAvatar } from "@/client/components/user-avatar";
import { UserOptions } from "@/client/components/user-options";
import { useCoverLetterStore } from "../../../../stores/cover-letter";

import { SectionIcon } from "../shared/section-icon";
import { ContentSection } from "./sections/content";
import { AISection } from "./sections/ai";
import { BlockSection } from "./sections/block";

export const LeftSidebar = () => {
  const containterRef = useRef<HTMLDivElement | null>(null);

  const scrollIntoView = (selector: string) => {
    const section = containterRef.current?.querySelector(selector);
    section?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex h-full bg-secondary-accent/30 border-r mt-20 border-gray-500 dark:border-gray-700">
      {/* Icon Bar */}
      <div className="hidden basis-12 flex-col items-center justify-between bg-secondary-accent/30 border-r border-gray-500 dark:border-gray-700 py-4 sm:flex">
        <Button asChild size="icon" variant="ghost" className="size-8 rounded-full">
          <Link to="/dashboard">
            <Icon size={14} />
          </Link>
        </Button>

        <div className="flex flex-col items-center justify-center gap-y-2">
          <SectionIcon
            id="content"
            name={t`Content`}
            icon={<FileText size={14} className="text-green-600 dark:text-green-400"/>}
            onClick={() => {
              scrollIntoView("#content");
            }}
          />
          <SectionIcon
            id="ai"
            name={t`AI Assistant`}
            icon={<Wand2 size={14} className="text-pink-600 dark:text-pink-400"/>}
            onClick={() => {
              scrollIntoView("#ai");
            }}
          />
          <SectionIcon
            id="block"
            name={t`Block Settings`}
            icon={<Settings size={14} className="text-blue-600 dark:text-blue-400" />}
            onClick={() => {
              scrollIntoView("#block");
            }}
          />
        </div>

        <UserOptions>
          <Button size="icon" variant="ghost" className="rounded-full">
            <UserAvatar size={28} />
          </Button>
        </UserOptions>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1">
          <div ref={containterRef} className="grid gap-y-6 p-6 @container/left">
            <ContentSection />
            <Separator />
            <AISection />
            <Separator />
            <BlockSection />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};