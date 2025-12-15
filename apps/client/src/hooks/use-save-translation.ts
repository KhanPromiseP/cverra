// hooks/use-save-translation.ts
import { useState } from 'react';
import { useToast } from './use-toast';
import { apiClient } from '../services/api-client';

interface UseSaveTranslationProps {
  resumeId: string;
  onSuccess?: (data: any) => void;
}

export const useSaveTranslation = ({ resumeId, onSuccess }: UseSaveTranslationProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const saveTranslation = async (language: string, customTitle?: string) => {
    try {
      setIsSaving(true);
      
      const response = await apiClient.post(`/resume/${resumeId}/translate/save`, {
        language,
        title: customTitle,
        options: {
          useCache: true,
          priority: 1,
        },
      });

      const { data } = response;
      
      // Show success toast
      toast({
        title: `✅ Translation Saved Successfully!`,
        description: `Your resume has been translated to ${data.data.translation.languageName} and saved to your workspace.`,
        duration: 8000,
        variant: 'success',
      });

      // Call success callback
      if (onSuccess) {
        onSuccess(data.data);
      }

      return data.data;
      
    } catch (error: any) {
      toast({
        title: "Failed to Save Translation",
        description: error.response?.data?.message || "An error occurred",
        variant: 'error',
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveTranslation,
    isSaving,
  };
};