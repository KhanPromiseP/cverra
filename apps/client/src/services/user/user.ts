// import type { UserDto } from "@reactive-resume/dto";
// import { useQuery } from "@tanstack/react-query";
// import type { AxiosResponse } from "axios";
// import { useEffect } from "react";

// import { axios } from "@/client/libs/axios";
// import { useAuthStore } from "@/client/stores/auth";

// export const fetchUser = async () => {
//   const response = await axios.get<UserDto | undefined, AxiosResponse<UserDto | undefined>>(
//     "/user/me",
//   );

//   return response.data;
// };

// export const useUser = () => {
//   const setUser = useAuthStore((state) => state.setUser);

//   const {
//     error,
//     isPending: loading,
//     data: user,
//   } = useQuery({
//     queryKey: ["user"],
//     queryFn: fetchUser,
//   });

//   useEffect(() => {
//     setUser(user ?? null);
//   }, [user, setUser]);

//   return { user: user, loading, error };
// };



// // updated this to prevent rerenders when a non auth user opens an article
// import type { UserDto } from "@reactive-resume/dto";
// import { useQuery } from "@tanstack/react-query";
// import type { AxiosResponse } from "axios";
// import { useEffect, useRef } from "react";

// import { axios } from "@/client/libs/axios";
// import { useAuthStore } from "@/client/stores/auth";

// // Cache configuration
// const CACHE_CONFIG = {
//   staleTime: 2 * 60 * 1000, // 2 minutes - data considered fresh
//   gcTime: 30 * 60 * 1000, // 30 minutes - cache duration
// } as const;

// export const fetchUser = async (signal?: AbortSignal) => {
//   try {
//     const response = await axios.get<UserDto | undefined, AxiosResponse<UserDto | undefined>>(
//       "/user/me",
//       { signal } // Pass abort signal for cancellation
//     );
//     return response.data;
//   } catch (error: any) {
//     // Handle 401 gracefully - expected for non-logged users
//     if (error.name === 'AbortError') {
//       console.debug('User fetch aborted');
//       return null;
//     }
    
//     if (error.response?.status === 401) {
//       return null; // Return null instead of throwing
//     }
    
//     // Re-throw only critical errors
//     if (error.response?.status >= 500) {
//       throw error;
//     }
    
//     return null; // For other client errors, return null
//   }
// };

// export const useUser = () => {
//   const setUser = useAuthStore((state) => state.setUser);
//   const userFromStore = useAuthStore((state) => state.user);
//   const hasInitializedRef = useRef(false);

//   const {
//     error,
//     isPending: loading,
//     data: user,
//     refetch,
//   } = useQuery({
//     queryKey: ["user"],
//     queryFn: ({ signal }) => fetchUser(signal),
//     staleTime: CACHE_CONFIG.staleTime,
//     gcTime: CACHE_CONFIG.gcTime,
//     retry: false, // CRITICAL: No retries for auth failures
//     refetchOnMount: userFromStore ? "always" : false, //prevent unnecessary initial fetch for non-logged users
//     refetchOnWindowFocus: false, // Disable annoying refetches
//     refetchOnReconnect: false, // We'll handle this manually
//     initialData: userFromStore, // Use store data first
//     placeholderData: userFromStore, // Show cached data while loading
//     throwOnError: false, // Don't throw errors to components
//   });

//   // Debounced user update to store
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (user !== undefined) {
//         setUser(user ?? null);
//       }
//     }, 100);
    
//     return () => clearTimeout(timer);
//   }, [user, setUser]);

//   // Manual refresh with debounce
//   const refreshUser = useRef(() => {
//     return refetch();
//   }).current;

//   return { 
//     user: user ?? userFromStore, // Fallback to store
//     loading: loading && !userFromStore, // Don't show loading if we have cached data
//     error,
//     refreshUser 
//   };
// };


import type { UserDto } from "@reactive-resume/dto";
import { useQuery } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import { useEffect, useRef } from "react";

import { axios } from "@/client/libs/axios";
import { useAuthStore } from "@/client/stores/auth";

// Cache configuration
const CACHE_CONFIG = {
  staleTime: 2 * 60 * 1000, // 2 minutes - data considered fresh
  gcTime: 30 * 60 * 1000, // 30 minutes - cache duration
} as const;

export const fetchUser = async (signal?: AbortSignal) => {
  try {
    const response = await axios.get<UserDto | undefined, AxiosResponse<UserDto | undefined>>(
      "/user/me",
      { signal }
    );
    return response.data;
  } catch (error: any) {
    // Handle 401 gracefully - expected for non-logged users
    if (error.name === 'AbortError') {
      console.debug('User fetch aborted');
      return null;
    }
    
    if (error.response?.status === 401) {
      return null; // Return null instead of throwing
    }
    
    // Re-throw only critical errors
    if (error.response?.status >= 500) {
      throw error;
    }
    
    return null; // For other client errors, return null
  }
};

export const useUser = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const userFromStore = useAuthStore((state) => state.user);
  const hasFetchedRef = useRef(false);

  const {
    error,
    isPending: loading,
    data: user,
    refetch,
  } = useQuery({
    queryKey: ["user"],
    queryFn: ({ signal }) => fetchUser(signal),
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: false,
    // CRITICAL FIX: Always refetch on mount if data is stale or we haven't fetched yet
    refetchOnMount: !hasFetchedRef.current ? true : "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    initialData: userFromStore,
    placeholderData: userFromStore,
    throwOnError: false,
    // Only fetch if we haven't fetched before or data is stale
    enabled: !hasFetchedRef.current || !userFromStore,
  });

  // Track if we've fetched at least once
  useEffect(() => {
    if (!hasFetchedRef.current && (user !== undefined || error)) {
      hasFetchedRef.current = true;
    }
  }, [user, error]);

  // Update store when user data changes
  useEffect(() => {
    if (user !== undefined && user !== userFromStore) {
      setUser(user);
    }
  }, [user, userFromStore, setUser]);

  const refreshUser = useRef(() => {
    return refetch();
  }).current;

  return {
    // Always prioritize fresh data over store data
    user: user ?? userFromStore ?? null,
    // Only show loading on initial fetch, not on cache refreshes
    loading: loading && !hasFetchedRef.current,
    error,
    refreshUser,
    isAuthenticated: !!(user ?? userFromStore),
  };
};