import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  api,
  clearAuthSession,
  getStoredAuthToken,
  getStoredRefreshToken,
  getStoredUser,
  handleApiError,
  LoginRequest,
  LoginResponse,
  refreshAccessToken,
  saveAuthSession,
  updateStoredUser,
} from '../lib/api-client';
import { API_ENDPOINTS } from '../lib/api-config';

interface User {
  id: number;
  username?: string;
  phoneNumber: string;
  fullName?: string;
  displayName?: string;
  residentName?: string;
  email?: string;
  address?: string;
  avatarUrl?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phoneNumber: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateUser: (userData: User) => void;
}

interface RegisterRequest {
  phoneNumber: string;
  password: string;
  fullName: string;
  role?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from persisted auth storage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedToken = getStoredAuthToken();
        const storedUser = getStoredUser();
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading user from auth storage:', error);
        clearAuthSession();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Phiên tính theo HOẠT ĐỘNG (idle), không cố định từ lúc đăng nhập:
  // - Ghi nhận thời điểm user thao tác gần nhất (click/nhập/di chuột/scroll).
  // - Định kỳ, nếu user CÒN hoạt động gần đây -> chủ động refresh token (gia hạn phiên).
  //   Đang dùng -> token luôn mới -> không bị logout giữa chừng.
  // - Không thao tác đủ lâu -> ngừng refresh -> phiên hết hạn tự nhiên (đúng nghĩa idle).
  useEffect(() => {
    // Ngưỡng "còn hoạt động": nếu thao tác trong vòng thời gian này thì mới gia hạn.
    const ACTIVE_WINDOW_MS = 55 * 60 * 1000;   // 55 phút
    // Chu kỳ kiểm tra + refresh (< 60' để refresh trước khi access token 60' hết hạn).
    const REFRESH_INTERVAL_MS = 50 * 60 * 1000; // 50 phút

    let lastActivity = Date.now();
    const markActivity = () => { lastActivity = Date.now(); };

    const events: Array<keyof WindowEventMap> = [
      'click', 'keydown', 'mousemove', 'scroll', 'touchstart', 'visibilitychange',
    ];
    events.forEach((e) => window.addEventListener(e, markActivity, { passive: true }));

    const timer = window.setInterval(async () => {
      // Chỉ gia hạn khi đã đăng nhập và user còn hoạt động gần đây.
      if (!getStoredRefreshToken()) return;
      if (Date.now() - lastActivity > ACTIVE_WINDOW_MS) return;
      await refreshAccessToken();
    }, REFRESH_INTERVAL_MS);

    return () => {
      events.forEach((e) => window.removeEventListener(e, markActivity));
      window.clearInterval(timer);
    };
  }, []);

  const login = async (phoneNumber: string, password: string, remember = false) => {
    try {
      setIsLoading(true);
      console.log('📡 Calling login API:', { phoneNumber, endpoint: API_ENDPOINTS.AUTH.LOGIN });
      
      const response = await api.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        { phoneNumber, password } as LoginRequest
      );

      console.log('📦 Login API response:', { 
        hasToken: !!response.data.accessToken, 
        hasUser: !!response.data.user,
        role: response.data.user?.role 
      });

      const { accessToken, refreshToken, user: userData } = response.data;

      saveAuthSession(accessToken, refreshToken, userData, remember);

      // Update state
      setToken(accessToken);
      setUser(userData);
    } catch (error) {
      console.error('❌ Login API error:', error);
      const message = handleApiError(error);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Clear local auth immediately so navigation is not blocked by a slow logout API.
    clearAuthSession();
    setToken(null);
    setUser(null);

    void api.post(API_ENDPOINTS.AUTH.LOGOUT).catch((error) => {
      console.error('Logout error:', error);
    });
  };

  const register = async (data: RegisterRequest) => {
    try {
      setIsLoading(true);
      const response = await api.post<LoginResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        data
      );

      const { accessToken, refreshToken, user: userData } = response.data;

      saveAuthSession(accessToken, refreshToken, userData, true);

      // Update state
      setToken(accessToken);
      setUser(userData);
    } catch (error) {
      const message = handleApiError(error);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        oldPassword,
        newPassword,
      });
    } catch (error) {
      const message = handleApiError(error);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: User) => {
    updateStoredUser(userData);
    setUser(userData);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    register,
    changePassword,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
