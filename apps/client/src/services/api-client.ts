// // client/services/api-client.ts
// import axios from 'axios';

// export const apiClient = axios.create({
//   baseURL: 'http://localhost:3000/api', 
//   withCredentials: true,
//   timeout: 45000, 
// });

// apiClient.interceptors.request.use(
//   (config) => {
//     console.log(`🚀 Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    
//     // Special handling for AI requests
//     if (config.url?.includes('/enhance') || config.url?.includes('/regenerate')) {
//       config.timeout = 30000; // 30 seconds for AI processing
//     }
    
//     return config;
//   },
//   (error) => {
//     console.error('❌ Request error:', error);
//     return Promise.reject(error);
//   }
// );

// apiClient.interceptors.response.use(
//   (response) => {
//     console.log(`✅ ${response.status} Response from: ${response.config.url}`);
//     return response;
//   },
//   (error) => {
//     console.error('❌ API Error:', {
//       status: error.response?.status,
//       statusText: error.response?.statusText,
//       url: error.config?.url,
//       message: error.message,
//       code: error.code
//     });
    
//     // Handle timeout errors specifically
//     if (error.code === 'ECONNABORTED') {
//       console.error('⏰ Request timeout - operation took too long');
//       error.message = 'Request timeout. Please try again.';
//     }
    
//     // Handle network errors
//     if (!error.response) {
//       console.error('🌐 Network error - check connection');
//       error.message = 'Network error. Please check your internet connection.';
//     }
    
//     return Promise.reject(error);
//   }
// );

// // Export for convenience
// export default apiClient;

// client/services/api-client.ts
import axios from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import { refreshToken } from './auth/refresh';

// Create main axios instance
export const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', 
  withCredentials: true,
  timeout: 45000, 
});

// Create a separate instance for refresh requests (to avoid interceptor loops)
export const refreshClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
  timeout: 10000, // Shorter timeout for refresh requests
});

// Queue for pending requests while token refreshes
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
      // Retry the queued request
      apiClient(prom.config)
        .then(response => prom.resolve(response))
        .catch(err => prom.reject(err));
    }
  });
  
  failedQueue = [];
};

// Auth error handler for 401/403 responses
const handleAuthError = async (failedRequest: any) => {
  try {
    // If already refreshing, queue this request
    if (isRefreshing) {
      console.log('⏳ Token refresh in progress, queueing request...');
      
      return new Promise((resolve, reject) => {
        failedQueue.push({ 
          resolve, 
          reject, 
          config: failedRequest.config 
        });
      });
    }

    isRefreshing = true;
    console.log('🔄 Attempting token refresh...');
    
    // Attempt to refresh token using your refreshToken function
    await refreshToken(refreshClient);
    
    console.log('✅ Token refresh successful');
    
    // Process queued requests
    processQueue(null);
    
    // Retry the original request
    return apiClient(failedRequest.config);
  } catch (refreshError) {
    console.error('❌ Token refresh failed:', refreshError);
    
    // If refresh fails, clear queue and redirect to login
    processQueue(refreshError);
    
    // Redirect to login
    window.location.href = '/auth/login';
    
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
};

// Apply the auth refresh interceptor to apiClient
createAuthRefreshInterceptor(apiClient, handleAuthError, {
  statusCodes: [401, 403], // Intercept 401 and 403 errors
  pauseInstanceWhileRefreshing: true, // Important: prevents multiple refresh attempts
  retryInstance: apiClient, // Use the same instance for retries
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    
    // Special handling for AI requests
    if (config.url?.includes('/enhance') || config.url?.includes('/regenerate')) {
      config.timeout = 30000; // 30 seconds for AI processing
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} Response from: ${response.config.url}`);
    return response;
  },
  (error) => {
    // Don't log auth errors twice (they're handled by the refresh interceptor)
    if (error.response?.status === 401 || error.response?.status === 403) {
      return Promise.reject(error);
    }
    
    console.error('❌ API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      message: error.message,
      code: error.code
    });
    
    // Handle timeout errors specifically
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout - operation took too long');
      error.message = 'Request timeout. Please try again.';
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('🌐 Network error - check connection');
      error.message = 'Network error. Please check your internet connection.';
    }
    
    return Promise.reject(error);
  }
);

// Also add interceptors for refreshClient
refreshClient.interceptors.response.use(
  (response) => {
    console.log(`✅ Refresh: ${response.status} Response`);
    return response;
  },
  (error) => {
    console.error('❌ Refresh API Error:', {
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

// Export for convenience
export default apiClient;