// import { t } from "@lingui/macro";
// import type { ErrorMessage } from "@reactive-resume/utils";
// import { deepSearchAndParseDates } from "@reactive-resume/utils";
// import _axios from "axios";
// import createAuthRefreshInterceptor from "axios-auth-refresh";
// import { redirect } from "react-router";

// import { refreshToken } from "@/client/services/auth";

// import { USER_KEY } from "../constants/query-keys";
// import { toast } from "../hooks/use-toast";
// import { translateError } from "../services/errors/translate-error";
// import { queryClient } from "./query-client";


// export const axios = _axios.create({ baseURL: "/api", withCredentials: true });

// // Intercept responses to transform ISO dates to JS date objects
// axios.interceptors.response.use(
//   (response) => {
//     const transformedResponse = deepSearchAndParseDates(response.data, ["createdAt", "updatedAt"]);
//     return { ...response, data: transformedResponse };
//   },
//   (error) => {
//     const message = error.response?.data.message as ErrorMessage;
//     const description = translateError(message);

//     if (description) {
//       toast({
//         variant: "error",
//         title: t`Oops, the server returned an error.`,
//         description,
//       });
//     }

//     return Promise.reject(new Error(message));
//   },
// );

// // Create another instance to handle failed refresh tokens
// // Reference: https://github.com/Flyrell/axios-auth-refresh/issues/191
// const axiosForRefresh = _axios.create({ baseURL: "/api", withCredentials: true });

// // Interceptor to handle expired access token errors
// const handleAuthError = () => refreshToken(axiosForRefresh);

// // Interceptor to handle expired refresh token errors
// const handleRefreshError = async () => {
//   await queryClient.invalidateQueries({ queryKey: USER_KEY });
//   redirect("/auth/login");
// };

// // Intercept responses to check for 401 and 403 errors, refresh token and retry the request
// createAuthRefreshInterceptor(axios, handleAuthError, { statusCodes: [401, 403] });
// createAuthRefreshInterceptor(axiosForRefresh, handleRefreshError);




import { t } from "@lingui/macro";
import type { ErrorMessage } from "@reactive-resume/utils";
import { deepSearchAndParseDates } from "@reactive-resume/utils";
import _axios from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import { redirect } from "react-router";

import { refreshToken } from "@/client/services/auth";

import { USER_KEY } from "../constants/query-keys";
import { toast } from "../hooks/use-toast";
import { translateError } from "../services/errors/translate-error";
import { queryClient } from "./query-client";

// Use environment variable for flexibility
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const axios = _axios.create({ 
  baseURL: API_URL, // Full URL to your backend
  withCredentials: true 
});

// Create another instance for refresh
export const axiosForRefresh = _axios.create({ 
  baseURL: API_URL, // Same full URL
  withCredentials: true 
});

// Queue for pending requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  config: any;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      axios(prom.config)
        .then(response => prom.resolve(response))
        .catch(err => prom.reject(err));
    }
  });
  failedQueue = [];
};

// Improved auth error handler with queue
const handleAuthError = async (failedRequest: any) => {
  try {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: failedRequest.config });
      });
    }

    isRefreshing = true;
    console.log('🔄 Token refresh in progress...');
    
    await refreshToken(axiosForRefresh);
    
    console.log('✅ Token refresh successful');
    processQueue(null);
    
    return axios(failedRequest.config);
  } catch (refreshError) {
    console.error('❌ Token refresh failed:', refreshError);
    processQueue(refreshError);
    await queryClient.invalidateQueries({ queryKey: USER_KEY });
    redirect("/auth/login");
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
};

// Improved refresh error handler
const handleRefreshError = async (error: any) => {
  console.error('❌ Refresh token expired:', error);
  await queryClient.invalidateQueries({ queryKey: USER_KEY });
  
  toast({
    variant: "error",
    title: t`Session Expired`,
    description: t`Please log in again to continue.`,
  });
  
  setTimeout(() => {
    redirect("/auth/login");
  }, 1000);
  
  return Promise.reject(error);
};

// Intercept responses to transform ISO dates
axios.interceptors.response.use(
  (response) => {
    const transformedResponse = deepSearchAndParseDates(response.data, ["createdAt", "updatedAt"]);
    return { ...response, data: transformedResponse };
  },
  (error) => {
    // Don't show toasts for auth errors - they're handled by interceptors
    if (error.response?.status === 401 || error.response?.status === 403) {
      return Promise.reject(error);
    }
    
    const message = error.response?.data.message as ErrorMessage;
    const description = translateError(message);

    if (description) {
      toast({
        variant: "error",
        title: t`Oops, the server returned an error.`,
        description,
      });
    }

    return Promise.reject(error);
  },
);

// Set up auth refresh interceptors with proper options
createAuthRefreshInterceptor(axios, handleAuthError, { 
  statusCodes: [401, 403],
  pauseInstanceWhileRefreshing: true,
});

createAuthRefreshInterceptor(axiosForRefresh, handleRefreshError, {
  statusCodes: [401, 403],
});

// Add request interceptor for debugging
axios.interceptors.request.use((config) => {
  console.log(`🚀 Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
  return config;
});

axiosForRefresh.interceptors.request.use((config) => {
  console.log(`🔄 Refresh request to: ${config.baseURL}${config.url}`);
  return config;
});