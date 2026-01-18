import { t, Trans } from "@lingui/macro";
import { CoverLetterEditor } from "@/client/components/cover-letter/editor";

interface CoverLetterEditorPageProps {
  mode?: 'create' | 'edit';
}

export const CoverLetterEditorPage = ({ mode = 'edit' }: CoverLetterEditorPageProps) => {
  return <CoverLetterEditor mode={mode} />;
};

export default CoverLetterEditorPage;