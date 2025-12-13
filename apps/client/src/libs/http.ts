
import axios from 'axios';

export const http = {
  get: <T>(url: string) => axios.get<T>(url).then(response => response.data),
  post: <T>(url: string, data?: any) => axios.post<T>(url, data).then(response => response.data),
  put: <T>(url: string, data?: any) => axios.put<T>(url, data).then(response => response.data),
  delete: <T>(url: string) => axios.delete<T>(url).then(response => response.data),
};