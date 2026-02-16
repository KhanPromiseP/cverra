import { t } from "@lingui/macro";
import { DownloadSimple } from "@phosphor-icons/react";
import { KeyboardShortcut } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";

import { useDialog } from "@/client/stores/dialog";
import { BaseListItem } from "./base-item";

interface ImportResumeListItemProps {
  compact?: boolean;
  className?: string;
}

export const ImportResumeListItem = ({
  compact = false,
  className,
}: ImportResumeListItemProps) => {
  const { open } = useDialog("import");

  return (
    <BaseListItem
      start={<DownloadSimple size={compact ? 16 : 18} />}
      title={
        <>
          <span>{t`Import resume`}</span>
          {!compact && (
            <KeyboardShortcut className="ml-2">^I</KeyboardShortcut>
          )}
        </>
      }
      description={!compact ? t`LinkedIn, JSON Resume` : undefined}
      onClick={() => open("create")}
      className={cn(
        // base style
        "bg-green-100 hover:bg-green-200",
        "dark:bg-green-300 dark:hover:bg-green-400",
        "text-gray-900 font-semibold rounded-lg shadow-md",
        "cursor-pointer transition-colors duration-300",

        // compact sizing
        compact && "h-10 px-4 text-sm",

        // external overrides
        className
      )}
    />
  );
};
