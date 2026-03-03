import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router';
import { getDefaultRoute } from '../lib/roles';

export function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔐 Attempting login with:', { phoneNumber, passwordLength: password.length });

    try {
      await login(phoneNumber, password);
      console.log('✅ Login successful!');
      
      // Get user data immediately after login
      const userDataStr = localStorage.getItem('user');
      console.log('📦 User data from localStorage:', userDataStr);
      
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        console.log('👤 User role:', userData.role);
        
        const defaultRoute = getDefaultRoute(userData.role);
        console.log('🎯 Default route for role:', defaultRoute);
        
        const from = (location.state as any)?.from?.pathname;
        const targetRoute = from || defaultRoute;
        console.log('🚀 Navigating to:', targetRoute);
        
        navigate(targetRoute, { replace: true });
      } else {
        console.error('❌ No user data in localStorage!');
        setError('Lỗi: Không lưu được thông tin đăng nhập');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng nhập hệ thống
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Quản lý chung cư
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Số điện thoại
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="0123456789"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="font-semibold mb-2">Demo Accounts:</p>
              <div className="space-y-1 text-xs font-mono">
                <p className="text-purple-700">👑 Admin: 0123456789 / Admin@123</p>
                <p className="text-blue-700">👤 Manager: 0987654321 / Manager@123</p>
                <p className="text-green-700">🏠 Resident: 0111222333 / Resident@123</p>
                <p className="text-orange-700">💰 Accountant: 0444555666 / Accountant@123</p>
                <p className="text-gray-700">🔧 Staff: 0777888999 / Staff@123</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
