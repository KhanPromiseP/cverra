import { cn } from "@reactive-resume/utils";
import { t } from "@lingui/macro";
import { Plus } from "@phosphor-icons/react";
import { KeyboardShortcut } from "@reactive-resume/ui";
import { useState } from "react";

import { AIResumeUploadModal } from "../../../../../../components/modals/ai-resume-upload-modal";
import { BaseListItem } from "./base-item";

interface AIBuilderCardProps {
  compact?: boolean;
}

export const AIBuilderCard = ({ compact = false }: AIBuilderCardProps) => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  return (
    <>
      <BaseListItem
        start={<Plus size={18} />}
        title={
          <>
            <span>{t`Build With AI`}</span>
            <KeyboardShortcut className="ml-2">^N</KeyboardShortcut>
          </>
        }
        description={t`Upload, pre-fill your resume`}
        onClick={() => setUploadModalOpen(true)}
        className={cn(
          "bg-pink-100 hover:bg-pink-200 dark:bg-pink-300 dark:hover:bg-pink-400",
          "text-gray-900 font-semibold rounded-lg shadow-md",
          "transition-colors duration-300"
        )}
      />

      <AIResumeUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
    </>
  );
};
