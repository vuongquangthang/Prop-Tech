import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { getDefaultRoute } from '../lib/roles';
import { Eye, EyeOff } from 'lucide-react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { getStoredUser } from '../lib/api-client';

const TEMP_LOCK_MESSAGE = 'Tài khoản bị khóa tạm thời 15 phút do nhập sai quá 5 lần';
const TEMP_LOCK_DURATION_MS = 15 * 60 * 1000;

export function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isTemporarilyLocked = lockExpiresAt !== null && lockExpiresAt > Date.now();

  useEffect(() => {
    const logoutMessage = window.sessionStorage.getItem('authLogoutMessage')
      || (location.state as any)?.message;
    if (!logoutMessage) return;

    setError(logoutMessage);
    window.sessionStorage.removeItem('authLogoutMessage');
  }, [location.state]);

  useEffect(() => {
    if (!lockExpiresAt) return;

    const timer = window.setInterval(() => {
      if (lockExpiresAt <= Date.now()) {
        setLockExpiresAt(null);
        setError('');
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [lockExpiresAt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTemporarilyLocked) return;
    setError('');
    const identity = phoneNumber.trim();
    const isEmail = identity.includes('@');
    if (!isEmail && !/^0\d{9}$/.test(identity)) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại bắt đầu bằng 0 và có 10 chữ số.');
      return;
    }
    setLoading(true);
    try {
      await login(identity, password, rememberMe);
      const userDataStr = getStoredUser();
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
      if (errorMessage.includes(TEMP_LOCK_MESSAGE)) {
        setLockExpiresAt(Date.now() + TEMP_LOCK_DURATION_MS);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-background" aria-hidden="true">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920&auto=format&fit=crop" 
          alt="" 
        />
      </div>

      <div className="auth-theme-switcher">
        <ThemeSwitcher />
      </div>

      <main className="auth-content">
        <section className="auth-panel" aria-labelledby="login-title">
          <h1 id="login-title" className="auth-title">Đăng nhập</h1>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <p className="auth-alert auth-alert-error" role="alert">{error}</p>
            )}

            <div className="auth-field">
              <label className="auth-label" htmlFor="login-phone-number">Tài khoản</label>
              <input 
                id="login-phone-number"
                type="text" 
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (error) setError('');
                  if (lockExpiresAt) setLockExpiresAt(null);
                }}
                placeholder="Số điện thoại hoặc email" 
                className="auth-input"
                autoComplete="username"
                required
              />
            </div>

            <div className="auth-field auth-password-field">
              <label className="auth-label" htmlFor="login-password">Mật khẩu</label>
              <input 
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu" 
                className="auth-input"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="auth-password-toggle"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="auth-options">
              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="auth-link">Quên mật khẩu?</Link>
            </div>

            <button 
              type="submit"
              disabled={loading || isTemporarilyLocked}
              className="auth-submit"
            >
              {loading ? 'Đang đăng nhập...' : isTemporarilyLocked ? 'Tài khoản tạm khóa' : 'Đăng nhập'}
            </button>

            <p className="auth-help">
              Tài khoản được cấp bởi quản trị viên. Vui lòng liên hệ ban quản lý nếu cần hỗ trợ.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
