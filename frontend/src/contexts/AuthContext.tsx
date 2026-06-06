import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, handleApiError, LoginRequest, LoginResponse } from '../lib/api-client';
import { API_ENDPOINTS } from '../lib/api-config';

interface User {
  id: number;
  phoneNumber: string;
  fullName?: string;
  displayName?: string;
  residentName?: string;
  email?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phoneNumber: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
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

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (phoneNumber: string, password: string) => {
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

      // Save to localStorage
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

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
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
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

      // Save to localStorage
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

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

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    register,
    changePassword,
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
