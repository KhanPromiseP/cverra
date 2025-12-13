// hooks/use-dashboard-stats.ts
import { useQuery } from "@tanstack/react-query";
import { resumeService } from "@/client/services/resume.service";
import { coverLetterService } from "@/client/services/cover-letter.service";

export const useDashboardStats = () => {
  const { data: resumes, isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeService.getAll(),
  });

  const { data: coverLetters, isLoading: coverLettersLoading } = useQuery({
    queryKey: ['cover-letters'],
    queryFn: () => coverLetterService.findAll(),
  });

  const resumeCount = resumes?.length || 0;
  const coverLetterCount = coverLetters?.length || 0;

  return {
    resumeCount,
    coverLetterCount,
    isLoading: resumesLoading || coverLettersLoading,
  };
};