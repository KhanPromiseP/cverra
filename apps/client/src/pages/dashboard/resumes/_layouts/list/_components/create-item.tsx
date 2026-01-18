import { t } from "@lingui/macro";
import { Plus } from "@phosphor-icons/react";
import type { ResumeDto } from "@reactive-resume/dto";
import { KeyboardShortcut } from "@reactive-resume/ui";

import { useDialog } from "@/client/stores/dialog";

import { BaseListItem } from "./base-item";

export const CreateResumeListItem = () => {
  const { open } = useDialog<ResumeDto>("resume");

  return (
    <BaseListItem
      start={<Plus size={18} />}
      title={
        <>
          <span>{t`Create a new resume`}</span>
          {/* eslint-disable-next-line lingui/no-unlocalized-strings */}
          <KeyboardShortcut className="ml-2">^N</KeyboardShortcut>
        </>
      }
      description={t`Start building from scratch`}
      onClick={() => {
        open("create");
      }}
      className="
        bg-blue-100 hover:bg-blue-100 
        dark:bg-blue-300 dark:hover:bg-blue-400
        text-gray-900 font-semibold rounded-lg shadow-md
        cursor-pointer transition-colors duration-300
      "
    />
  );
};
