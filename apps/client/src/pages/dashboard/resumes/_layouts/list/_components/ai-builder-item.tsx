import { cn } from "@reactive-resume/utils";
import { t } from "@lingui/macro";
import { Plus } from "@phosphor-icons/react";
import { KeyboardShortcut } from "@reactive-resume/ui";
import { useState } from "react";

import { AIResumeUploadModal } from "../../../../../../components/modals/ai-resume-upload-modal";
import { BaseListItem } from "./base-item";

interface AIBuilderCardProps {
  compact?: boolean;
  className?: string;
}

export const AIBuilderCard = ({
  compact = false,
  className,
}: AIBuilderCardProps) => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  return (
    <>
      <BaseListItem
        start={<Plus size={compact ? 16 : 18} />}
        title={
          <>
            <span>{t`Build with AI`}</span>
            {!compact && <KeyboardShortcut className="ml-2">^N</KeyboardShortcut>}
          </>
        }
        description={!compact ? t`Upload doc/pdf or paste text, pre-fill your resume` : undefined}
        onClick={() => setUploadModalOpen(true)}
        className={cn(
          // base style
          "bg-pink-100 hover:bg-pink-200 dark:bg-pink-300 dark:hover:bg-pink-400",
          "text-gray-900 font-semibold rounded-lg shadow-md",
          "transition-colors duration-300",

          // compact sizing
          compact && "h-10 px-4 text-sm",

          // external override
          className
        )}
      />

      <AIResumeUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
    </>
  );
};
