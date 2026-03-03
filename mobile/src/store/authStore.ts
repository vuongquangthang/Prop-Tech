import { create } from 'zustand';
import { apiService } from '../services/api.service';
import { LoginRequest, LoginResponse, UserDto } from '../types/dto';

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (phoneNumber: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (phoneNumber: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const loginRequest: LoginRequest = {
        phoneNumber,
        password,
      };

      const response = await apiService.post<LoginResponse>(
        '/api/auth/login',
        loginRequest
      );

      // Save tokens
      await apiService.saveTokens(response.accessToken, response.refreshToken);
      
      // Save user
      await apiService.saveUser(response.user);

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Đăng nhập thất bại. Vui lòng thử lại.';
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
      
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });

      // Clear tokens and user data
      await apiService.clearAuth();

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      await apiService.clearAuth();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });

      // Check if tokens exist
      const accessToken = await apiService.getAccessToken();
      const user = await apiService.getUser();

      if (accessToken && user) {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Load user error:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
