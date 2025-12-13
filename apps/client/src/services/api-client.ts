// client/services/api-client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', 
  withCredentials: true,
  timeout: 45000, 
});

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

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} Response from: ${response.config.url}`);
    return response;
  },
  (error) => {
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

// Export for convenience
export default apiClient;