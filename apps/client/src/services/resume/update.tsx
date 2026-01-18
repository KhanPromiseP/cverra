// import type { ResumeDto, UpdateResumeDto } from "@reactive-resume/dto";
// import { useMutation } from "@tanstack/react-query";
// import type { AxiosResponse } from "axios";
// import debounce from "lodash.debounce";

// import { axios } from "@/client/libs/axios";
// import { queryClient } from "@/client/libs/query-client";

// export const updateResume = async (data: UpdateResumeDto) => {
//   const response = await axios.patch<ResumeDto, AxiosResponse<ResumeDto>, UpdateResumeDto>(
//     `/resume/${data.id}`,
//     data,
//   );

//   queryClient.setQueryData<ResumeDto>(["resume", { id: response.data.id }], response.data);

//   queryClient.setQueryData<ResumeDto[]>(["resumes"], (cache) => {
//     if (!cache) return [response.data];
//     return cache.map((resume) => {
//       if (resume.id === response.data.id) return response.data;
//       return resume;
//     });
//   });

//   return response.data;
// };

// export const debouncedUpdateResume = debounce(updateResume, 500);

// export const useUpdateResume = () => {
//   const {
//     error,
//     isPending: loading,
//     mutateAsync: updateResumeFn,
//   } = useMutation({
//     mutationFn: updateResume,
//   });

//   return { updateResume: updateResumeFn, loading, error };
// };





// I have updated this so that it should handle updates from ai generated resumes using the flexible endpoint and not the normal update endpint as other manually created resumes to escape some level of DTO Validation

import type { ResumeDto, UpdateResumeDto } from "@reactive-resume/dto";
import { useMutation } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import debounce from "lodash.debounce";

import { axios } from "@/client/libs/axios";
import { queryClient } from "@/client/libs/query-client";

// Helper to check if resume is AI-generated
const isAIResume = (data: any): boolean => {
  return data?.metadata?.aiGenerated === true;
};

// Main update function
export const updateResume = async (data: UpdateResumeDto) => {
  // Check if it's an AI resume
  const aiResume = isAIResume(data.data);
  
  // Use different endpoint for AI resumes
  const endpoint = aiResume 
    ? `/resume/${data.id}/flexible`  // Use flexible endpoint for AI resumes
    : `/resume/${data.id}`;          // Normal endpoint for regular resumes

  const response = await axios.patch<ResumeDto, AxiosResponse<ResumeDto>, UpdateResumeDto>(
    endpoint,
    data,
  );

  queryClient.setQueryData<ResumeDto>(["resume", { id: response.data.id }], response.data);

  queryClient.setQueryData<ResumeDto[]>(["resumes"], (cache) => {
    if (!cache) return [response.data];
    return cache.map((resume) => {
      if (resume.id === response.data.id) return response.data;
      return resume;
    });
  });

  return response.data;
};

export const debouncedUpdateResume = debounce(updateResume, 500);

export const useUpdateResume = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: updateResumeFn,
  } = useMutation({
    mutationFn: updateResume,
  });

  return { updateResume: updateResumeFn, loading, error };
};