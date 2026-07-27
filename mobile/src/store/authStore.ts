import { create } from 'zustand';
import { apiService } from '../services/api.service';
import { LoginRequest, LoginResponse, UserDto } from '../types/dto';
import { secureStorage } from '../utils/secureStorage';

const normalizeUser = (rawUser: any): UserDto => {
  if (!rawUser) {
    throw new Error('Thiếu thông tin người dùng sau khi đăng nhập.');
  }

  return {
    ...rawUser,
    id: rawUser.id ?? rawUser.Id,
    phoneNumber: rawUser.phoneNumber ?? rawUser.PhoneNumber,
    role: rawUser.role ?? rawUser.Role,
    residentId: rawUser.residentId ?? rawUser.ResidentId,
    ownerUserId: rawUser.ownerUserId ?? rawUser.OwnerUserId,
    fullName: rawUser.fullName ?? rawUser.FullName,
    displayName: rawUser.displayName ?? rawUser.DisplayName,
    residentName: rawUser.residentName ?? rawUser.ResidentName,
    mustChangePassword: rawUser.mustChangePassword ?? rawUser.MustChangePassword ?? false,
    isLocked: rawUser.isLocked ?? rawUser.IsLocked ?? false,
    email: rawUser.email ?? rawUser.Email,
    address: rawUser.address ?? rawUser.Address,
    avatarUrl: rawUser.avatarUrl ?? rawUser.AvatarUrl,
  };
};

const normalizeLoginResponse = (response: any): LoginResponse => ({
  ...response,
  accessToken: response.accessToken ?? response.AccessToken,
  refreshToken: response.refreshToken ?? response.RefreshToken,
  tokenType: response.tokenType ?? response.TokenType ?? 'Bearer',
  expiresIn: response.expiresIn ?? response.ExpiresIn ?? 3600,
  user: normalizeUser(response.user ?? response.User),
});

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  activeContractId: number | null;
  
  // Actions
  login: (phoneNumber: string, password: string) => Promise<UserDto>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setActiveContract: (contractId: number | null) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  activeContractId: null,

  login: async (phoneNumber: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const loginRequest: LoginRequest = {
        phoneNumber,
        password,
      };

      const rawResponse = await apiService.post<LoginResponse>(
        '/api/auth/login',
        loginRequest
      );
      const response = normalizeLoginResponse(rawResponse);

      // Save tokens
      await apiService.saveTokens(response.accessToken, response.refreshToken);
      
      // Save user
      await apiService.saveUser(response.user);
      await secureStorage.deleteItemAsync('active_contract_id');

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        activeContractId: null,
      });

      return response.user;
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
    } finally {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated && state.isLoading) {
        set({ isLoading: false });
      }
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
        activeContractId: null,
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
        let currentUser = user;
        try {
          currentUser = normalizeUser(await apiService.get<UserDto>('/api/auth/me'));
          await apiService.saveUser(currentUser);
        } catch (error) {
          console.warn('Could not refresh current user, using cached user', error);
        }

        const activeStr = await secureStorage.getItemAsync('active_contract_id');
        const activeId = activeStr ? parseInt(activeStr, 10) : null;
        set({
          user: currentUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          activeContractId: activeId,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          activeContractId: null,
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

  setActiveContract: async (contractId: number | null) => {
    try {
      if (contractId == null) {
        await secureStorage.deleteItemAsync('active_contract_id');
      } else {
        await secureStorage.setItemAsync('active_contract_id', String(contractId));
      }
      set({ activeContractId: contractId });
    } catch (err) {
      console.error('Failed to save activeContractId', err);
    }
  },
}));
