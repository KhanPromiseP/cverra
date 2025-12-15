
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { apiClient } from '../services/api-client';
import { useResumeStore } from '../stores/resume';

interface TranslationOptions {
  force?: boolean;
  aiModel?: string;
  useCache?: boolean;
  priority?: number;
}

interface TranslationResult {
  success: boolean;
  message: string;
  data: any;
  confidence: number;
  needsReview: boolean;
  timestamp: string;
}

interface AvailableLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isOriginal: boolean;
  confidence?: number;
  qualityScore?: number;
  available: boolean;
  lastUpdated?: Date;
}

export const useResumeTranslation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { resume } = useResumeStore();

  // Translate resume
  const translateMutation = useMutation<
    TranslationResult,
    Error,
    { language: string; options?: TranslationOptions }
  >({
    mutationFn: async ({ language, options }) => {
      const response = await apiClient.post(
        `/resume/${resume.id}/translate/${language}`,
        options
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Translation Complete',
        description: `Resume successfully translated to ${variables.language.toUpperCase()}`,
      });
      
      // Invalidate translations cache
      queryClient.invalidateQueries({ queryKey: ['resume-translations', resume.id] });
    },
    onError: (error, variables) => {
      toast({
        title: 'Translation Failed',
        description: `Failed to translate to ${variables.language.toUpperCase()}: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Get available translations
  const availableTranslationsQuery = useQuery<AvailableLanguage[]>({
    queryKey: ['resume-translations', resume.id],
    queryFn: async () => {
      const response = await apiClient.get(`/resume/${resume.id}/translations`);
      return response.data.languages;
    },
    enabled: !!resume.id,
  });

  // Get specific translation
  const getTranslation = async (language: string) => {
    try {
      const response = await apiClient.get(`/resume/${resume.id}/translate/${language}`);
      return response.data.translation;
    } catch (error) {
      return null;
    }
  };

  // Batch translate
  const batchTranslateMutation = useMutation<
    { success: boolean; message: string; results: any[] },
    Error,
    { resumeIds: string[]; language: string; options?: TranslationOptions }
  >({
    mutationFn: async ({ resumeIds, language, options }) => {
      const response = await apiClient.post('/resume/batch-translate', {
        resumeIds,
        language,
        options,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Batch Translation Complete',
        description: `Successfully translated ${data.results.filter(r => r.success).length} resumes`,
      });
    },
  });

  // Retry failed translations
  const retryFailedMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/resume/${resume.id}/retry-translations`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Retry Completed',
        description: 'Failed translations have been retried',
      });
      queryClient.invalidateQueries({ queryKey: ['resume-translations', resume.id] });
    },
  });

  return {
    // Mutations
    translate: translateMutation.mutateAsync,
    translateAsync: translateMutation.mutateAsync,
    isTranslating: translateMutation.isPending,
    
    batchTranslate: batchTranslateMutation.mutateAsync,
    isBatchTranslating: batchTranslateMutation.isPending,
    
    retryFailed: retryFailedMutation.mutateAsync,
    isRetrying: retryFailedMutation.isPending,
    
    // Queries
    availableLanguages: availableTranslationsQuery.data || [],
    isLoadingLanguages: availableTranslationsQuery.isLoading,
    
    // Functions
    getTranslation,
    
    // Error
    translationError: translateMutation.error,
  };
};