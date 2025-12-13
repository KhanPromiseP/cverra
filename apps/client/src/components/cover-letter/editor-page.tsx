// client/components/cover-letter/editor-page.tsx
import { CoverLetterEditor } from "./editor";

interface CoverLetterEditorPageProps {
  mode?: 'create' | 'edit';
}

export const CoverLetterEditorPage = ({ mode = 'edit' }: CoverLetterEditorPageProps) => {
  return <CoverLetterEditor mode={mode} />;
};

export default CoverLetterEditorPage;