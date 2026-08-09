import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';
import { LoginResponse, RefreshTokenRequest } from '../types/dto';
import { secureStorage } from '../utils/secureStorage';

declare const process: {
  env?: Record<string, string | undefined>;
};

// Base URL - Change this to your actual backend URL
const envBaseUrl =
  typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_BASE_URL : undefined;
const defaultApiBaseUrl = Platform.OS === 'web'
  ? 'http://localhost:5052'
  : 'http://192.168.100.152:5052';

const extractHost = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  const withoutProtocol = value.replace(/^[a-z]+:\/\//i, '');
  const host = withoutProtocol.split('/')[0]?.split(':')[0];
  return host && host !== 'localhost' && host !== '127.0.0.1' ? host : undefined;
};

const getExpoHostApiBaseUrl = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    (Constants.manifest as any)?.debuggerHost ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    NativeModules.SourceCode?.scriptURL;
  const host = extractHost(hostUri);

  return host ? `http://${host}:5052` : undefined;
};

export let API_BASE_URL = envBaseUrl?.trim() ? envBaseUrl.trim() : defaultApiBaseUrl;

export const getApiBaseUrl = () => API_BASE_URL;

const uniqueUrls = (urls: Array<string | undefined>) =>
  urls
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url))
    .filter((url, index, arr) => arr.indexOf(url) === index);

const API_BASE_URL_FALLBACKS = uniqueUrls([
  API_BASE_URL,
  getExpoHostApiBaseUrl(),
  defaultApiBaseUrl,
  Platform.OS === 'android' ? 'http://10.0.2.2:5052' : undefined,
  'http://localhost:5052',
]);

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  API_BASE_URL: 'api_base_url',
};

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 70000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Attach JWT token
    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle 401 and refresh token
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => this.api(originalRequest))
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await this.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // Call refresh token endpoint
            const response = await axios.post<LoginResponse>(
              `${getApiBaseUrl()}/api/auth/refresh-token`,
              { refreshToken } as RefreshTokenRequest,
              {
                headers: { 'Content-Type': 'application/json' },
              }
            );

            const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
              response.data;

            // Save new tokens
            await this.saveTokens(newAccessToken, newRefreshToken);

            // Update authorization header
            this.api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            // Process queued requests
            this.failedQueue.forEach((prom) => prom.resolve());
            this.failedQueue = [];

            // Retry original request
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear tokens and force logout
            this.failedQueue.forEach((prom) => prom.reject(refreshError));
            this.failedQueue = [];
            await this.clearAuth();
            
            // Notify auth store to logout (break the loop)
            console.error('❌ Token expired. Please login again.');
            
            // Use dynamic import to avoid circular dependency
            import('../store/authStore').then(({ useAuthStore }) => {
              const state = useAuthStore.getState();
              if (state && state.isAuthenticated) {
                // Force logout to update UI
                state.logout().catch(() => {});
              }
            });
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ==================== TOKEN MANAGEMENT ====================

  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await secureStorage.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await secureStorage.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  async getAccessToken(): Promise<string | null> {
    return await secureStorage.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  }

  async getRefreshToken(): Promise<string | null> {
    return await secureStorage.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async saveUser(user: any): Promise<void> {
    await secureStorage.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  async getUser(): Promise<any | null> {
    const userStr = await secureStorage.getItemAsync(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  async clearAuth(): Promise<void> {
    await secureStorage.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await secureStorage.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await secureStorage.deleteItemAsync(STORAGE_KEYS.USER);
  }

  async saveApiBaseUrl(baseUrl: string): Promise<void> {
    const normalized = this.normalizeBaseUrl(baseUrl);
    this.setApiBaseUrl(normalized);
    await secureStorage.setItemAsync(STORAGE_KEYS.API_BASE_URL, normalized);
  }

  // ==================== API METHODS ====================

  getAxiosInstance(): AxiosInstance {
    return this.api;
  }

  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    if (url.toLowerCase() === '/api/auth/login') {
      return this.postLoginWithFallback<T>(url, data, config);
    }

    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.patch<T>(url, data, config);
    return response.data;
  }

  private async postLoginWithFallback<T>(url: string, data?: any, config?: any): Promise<T> {
    let lastNetworkError: any = null;
    let lastAuthError: any = null;
    const savedBaseUrl = await secureStorage.getItemAsync(STORAGE_KEYS.API_BASE_URL);
    const normalizedConfiguredUrl = this.normalizeBaseUrl(API_BASE_URL);
    const normalizedSavedUrl = savedBaseUrl ? this.normalizeBaseUrl(savedBaseUrl) : undefined;
    const fallbackUrls = uniqueUrls([
      savedBaseUrl || undefined,
      API_BASE_URL,
      getExpoHostApiBaseUrl(),
      ...API_BASE_URL_FALLBACKS,
    ]);
    const attemptedUrls: string[] = [];

    for (const baseUrl of fallbackUrls) {
      attemptedUrls.push(baseUrl);
      try {
        const response = await axios.post<T>(`${baseUrl}${url}`, data, {
          ...config,
          headers: {
            'Content-Type': 'application/json',
            ...(config?.headers || {}),
          },
          timeout: config?.timeout ?? 4000,
        });

        this.setApiBaseUrl(baseUrl);
        await secureStorage.setItemAsync(STORAGE_KEYS.API_BASE_URL, baseUrl);
        return response.data;
      } catch (error: any) {
        if (error.response) {
          if (error.response.status === 401) {
            lastAuthError = error;
            const normalizedAttemptUrl = this.normalizeBaseUrl(baseUrl);
            const isStaleSavedUrl = Boolean(normalizedSavedUrl)
              && normalizedAttemptUrl === normalizedSavedUrl
              && normalizedSavedUrl !== normalizedConfiguredUrl;

            if (isStaleSavedUrl) {
              console.warn(`Đăng nhập chưa khớp tại API đã lưu, thử API cấu hình: ${baseUrl}`);
              continue;
            }

            throw error;
          }
          throw error;
        }

        lastNetworkError = error;
        console.warn(`Không kết nối được API: ${baseUrl}`, error?.message);
      }
    }

    const error = lastNetworkError || new Error('Không kết nối được đến máy chủ');
    if (lastAuthError) {
      (lastAuthError as any).attemptedUrls = attemptedUrls;
      throw lastAuthError;
    }
    (error as any).attemptedUrls = attemptedUrls;
    throw error;
  }

  private normalizeBaseUrl(baseUrl: string) {
    return baseUrl.trim().replace(/\/+$/, '');
  }

  private setApiBaseUrl(baseUrl: string) {
    baseUrl = this.normalizeBaseUrl(baseUrl);
    if (API_BASE_URL === baseUrl) {
      return;
    }

    API_BASE_URL = baseUrl;
    this.api.defaults.baseURL = baseUrl;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
