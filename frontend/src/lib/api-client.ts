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

const AUTH_STORAGE_MODE_KEY = 'authStorageMode';
type AuthStorageMode = 'local' | 'session';

const getAuthStorage = (mode?: AuthStorageMode): Storage => {
  if (mode) return mode === 'local' ? localStorage : sessionStorage;

  // Không có mode chỉ định -> ghi vào ĐÚNG storage đang giữ token hiện tại.
  // Dò trực tiếp thay vì chỉ tin authStorageMode: nếu key mode bị mất/lệch mà token
  // nằm ở sessionStorage, ghi vào localStorage sẽ làm getStoredAuthToken() (ưu tiên
  // sessionStorage) đọc token CŨ -> 401 liên tục -> logout oan.
  if (sessionStorage.getItem('token')) return sessionStorage;
  if (localStorage.getItem('token')) return localStorage;

  return localStorage.getItem(AUTH_STORAGE_MODE_KEY) === 'session' ? sessionStorage : localStorage;
};

export const getStoredAuthToken = () =>
  sessionStorage.getItem('token') || localStorage.getItem('token');

export const getStoredRefreshToken = () =>
  sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');

export const getStoredUser = () =>
  sessionStorage.getItem('user') || localStorage.getItem('user');

export const saveAuthSession = (
  accessToken: string,
  refreshToken: string,
  user: LoginResponse['user'],
  remember: boolean,
) => {
  clearAuthSession();
  const mode: AuthStorageMode = remember ? 'local' : 'session';
  const storage = getAuthStorage(mode);
  storage.setItem('token', accessToken);
  storage.setItem('refreshToken', refreshToken);
  storage.setItem('user', JSON.stringify(user));
  localStorage.setItem(AUTH_STORAGE_MODE_KEY, mode);
};

export const updateStoredAuthToken = (accessToken: string, refreshToken: string) => {
  const storage = getAuthStorage();
  storage.setItem('token', accessToken);
  storage.setItem('refreshToken', refreshToken);
};

export const updateStoredUser = (user: LoginResponse['user']) => {
  getAuthStorage().setItem('user', JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem(AUTH_STORAGE_MODE_KEY);
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');
};

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
    const token = getStoredAuthToken();
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

// Refresh token dùng chung (single-flight): nhiều request cùng 401 chỉ gọi refresh
// MỘT lần, tránh race condition xoay refresh token 2 lần -> token cũ bị vô hiệu ->
// logout oan khi đang dùng. Trả về accessToken mới hoặc null nếu refresh thất bại.
let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return null;
    try {
      const response = await axios.post<LoginResponse>(
        `${API_CONFIG.BASE_URL}/api/Auth/refresh-token`,
        { refreshToken }
      );
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      updateStoredAuthToken(accessToken, newRefreshToken);
      return accessToken;
    } catch {
      return null;
    } finally {
      // Cho phép lần refresh kế tiếp (sau khi promise hiện tại settle).
      setTimeout(() => { refreshPromise = null; }, 0);
    }
  })();

  return refreshPromise;
};

// Response interceptor - handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried, try to refresh token (single-flight).
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      }

      // Refresh thất bại -> hết phiên thật -> logout.
      clearAuthSession();
      window.location.href = '/';
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
