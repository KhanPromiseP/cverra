import { t } from "@lingui/macro";
import { Plus } from "@phosphor-icons/react";
import type { ResumeDto } from "@reactive-resume/dto";
import { KeyboardShortcut } from "@reactive-resume/ui";

import { useDialog } from "@/client/stores/dialog";
import { cn } from "@reactive-resume/utils";

import { BaseListItem } from "./base-item";

interface CreateResumeListItemProps {
  compact?: boolean;
  className?: string;
}

export const CreateResumeListItem = ({
  compact = false,
  className,
}: CreateResumeListItemProps) => {
  const { open } = useDialog<ResumeDto>("resume");

  return (
    <BaseListItem
      start={<Plus size={compact ? 16 : 18} />}
      title={
        <>
          <span>{t`Create new resume`}</span>
          {!compact && (
            <KeyboardShortcut className="ml-2">^N</KeyboardShortcut>
          )}
        </>
      }
      description={!compact ? t`Start building from scratch` : undefined}
      onClick={() => open("create")}
      className={cn(
        // base style
        "bg-blue-100 hover:bg-blue-200",
        "dark:bg-blue-300 dark:hover:bg-blue-400",
        "text-gray-900 font-semibold rounded-lg shadow-md",
        "cursor-pointer transition-colors duration-300",

        // compact mode
        compact && "h-10 px-4 text-sm",

        // external overrides
        className
      )}
    />
  );
};
