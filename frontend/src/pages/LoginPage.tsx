import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router';
import { getDefaultRoute } from '../lib/roles';

export function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phoneNumber, password);
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const defaultRoute = getDefaultRoute(userData.role);
        const from = (location.state as any)?.from?.pathname;
        navigate(from || defaultRoute, { replace: true });
      } else {
        setError('Lỗi: Không lưu được thông tin đăng nhập');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center font-sans">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920&auto=format&fit=crop" 
          alt="Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10 px-4" style={{ width: '100%', maxWidth: '560px' }}>
        <div className="rounded-3xl shadow-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.1)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '0.5px solid rgba(255,255,255,0.2)', padding: '80px 48px' }}>
          <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow text-center mb-10">Đăng nhập</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-3">{error}</p>
            )}

            <div>
              <input 
                type="text" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Số điện thoại" 
                className="w-full bg-transparent border-0 border-b border-white/50 py-3 text-white font-medium placeholder-white/60 outline-none focus:outline-none focus:ring-0 focus:shadow-none focus:border-white/90 transition-colors text-base appearance-none"
                required
              />
            </div>

            <div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu" 
                className="w-full bg-transparent border-0 border-b border-white/50 py-3 text-white font-medium placeholder-white/60 outline-none focus:outline-none focus:ring-0 focus:shadow-none focus:border-white/90 transition-colors text-base appearance-none"
                required
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border border-white/50 accent-white cursor-pointer"
                />
                <span className="text-sm font-normal" style={{ color: 'rgba(255,255,255,0.85)' }}>Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.85)' }}>Quên mật khẩu?</Link>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-white text-gray-900 font-bold py-3 rounded-lg mt-8 hover:bg-gray-100 transition-colors shadow-lg disabled:opacity-50"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            <div className="text-center pt-4">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Tài khoản được cấp bởi quản trị viên. Vui lòng liên hệ ban quản lý nếu cần hỗ trợ.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}