import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from './api-config';

// Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    phoneNumber: string;
    fullName?: string;
    displayName?: string;
    residentName?: string;
    email?: string;
    role: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) {
        delete (config.headers as any)['Content-Type'];
        delete (config.headers as any)['content-type'];
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post<LoginResponse>(
            `${API_CONFIG.BASE_URL}/api/Auth/refresh-token`,
            { refreshToken }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API helper methods
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => 
    apiClient.get<T>(url, config),
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.post<T>(url, data, config),
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.put<T>(url, data, config),
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => 
    apiClient.delete<T>(url, config),
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.patch<T>(url, data, config),
};

// Error handler helper
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse>;
    
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  
  return 'Đã xảy ra lỗi không xác định';
};

export default apiClient;
