
import { t } from "@lingui/macro";
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CoverLetterWizard } from '@/client/components/cover-letter/cover-letter-wizard';
import type { CreateCoverLetterData } from '@/client/services/cover-letter.service';
import { coverLetterService } from '@/client/services/cover-letter.service';
import { toast } from 'sonner';

export const CoverLetterWizardPage = () => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (data: CreateCoverLetterData) => {
    setIsGenerating(true);
    try {
      const result = await coverLetterService.create(data);
      console.log('Creation result:', result); // Debug log
      
     const coverLetterId = result.coverLetter?.id;

      if (!coverLetterId) {
        throw new Error('No cover letter ID returned from server');
      }
      
      toast.success(t`Cover letter generated successfully!`);
      navigate(`/builder/cover-letter/${coverLetterId}/edit`);
    } catch (error) {
      console.error('Failed to generate cover letter:', error);
      toast.error(t`Failed to generate cover letter. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/cover-letters');
  };

  return (
    <div className="h-full p-6">
      <CoverLetterWizard
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        onCancel={handleCancel}
      />
    </div>
  );
};