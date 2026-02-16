
import { useMutation } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { axios } from "@/client/libs/axios";
import { queryClient } from "@/client/libs/query-client";

export const updateLocale = async (locale: string) => {
  const response = await axios.patch<{ success: boolean; message: string; data: any }, 
    AxiosResponse<{ success: boolean; message: string; data: any }>, 
    { locale: string }>(
    "/user/locale",
    { locale },
  );

  return response.data;
};

export const useUpdateLocale = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: updateLocaleFn,
  } = useMutation({
    mutationFn: updateLocale,
    onSuccess: (response) => {
      // Update user data in cache with new locale
      const currentUser = queryClient.getQueryData(["user"]);
      if (currentUser && response.data) {
        queryClient.setQueryData(["user"], {
          ...currentUser,
          locale: response.data.locale,
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  return { updateLocale: updateLocaleFn, loading, error };
};