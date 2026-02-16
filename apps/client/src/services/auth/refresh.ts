// import type { MessageDto } from "@reactive-resume/dto";
// import type { AxiosInstance, AxiosResponse } from "axios";

// export const refreshToken = async (axios: AxiosInstance) => {
//   const response = await axios.post<MessageDto, AxiosResponse<MessageDto>>("/auth/refresh");

//   return response.data;
// };



// services/auth/refresh.ts
import type { MessageDto } from "@reactive-resume/dto";
import type { AxiosInstance, AxiosResponse } from "axios";

export const refreshToken = async (axios: AxiosInstance) => {
  try {
    console.log('🔄 [refresh] Calling refresh endpoint...');
    
    const response = await axios.post<MessageDto, AxiosResponse<MessageDto>>(
      "/auth/refresh", 
      {}, // Empty body
      {
        withCredentials: true, // CRITICAL: This sends cookies
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    console.log('✅ [refresh] Success:', response.status);
    return response.data;
    
  } catch (error: any) {
    console.error('❌ [refresh] Failed:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    // Throw a more helpful error
    if (error.response?.status === 403) {
      throw new Error('Refresh token expired or invalid');
    }
    
    throw error;
  }
};