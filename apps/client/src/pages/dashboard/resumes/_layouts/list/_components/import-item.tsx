import { t } from "@lingui/macro";
import { DownloadSimple } from "@phosphor-icons/react";
import { KeyboardShortcut } from "@reactive-resume/ui";

import { useDialog } from "@/client/stores/dialog";

import { BaseListItem } from "./base-item";

export const ImportResumeListItem = () => {
  const { open } = useDialog("import");

  return (
    <BaseListItem
      start={<DownloadSimple size={18} />}
      title={
        <>
          <span>{t`Import an existing resume`}</span>
          {/* eslint-disable-next-line lingui/no-unlocalized-strings */}
          <KeyboardShortcut className="ml-2">^I</KeyboardShortcut>
        </>
      }
      description={t`LinkedIn, JSON Resume, etc.`}
      onClick={() => {
        open("create");
      }}
      className="
        bg-green-100 hover:bg-green-200 
        dark:bg-green-300 dark:hover:bg-green-400
         text-gray-900 font-semibold rounded-lg shadow-md
        cursor-pointer transition-colors duration-300
      "
    />
  );
};
