import { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../lib/api-client';
import { API_ENDPOINTS } from '../lib/api-config';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';

export function ForgotPasswordPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        phoneNumberOrEmail: phoneNumber.trim(),
      });
      setSubmitted(true);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại');
      setError(errorMessage);
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
        <section className="auth-panel" aria-labelledby="forgot-password-title">
          <h1 id="forgot-password-title" className="auth-title">Quên mật khẩu</h1>
          <p className="auth-description">
            Nhập số điện thoại hoặc email để kiểm tra tài khoản
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="auth-form">
              {error && (
                <p className="auth-alert auth-alert-error" role="alert">{error}</p>
              )}

              <div className="auth-field">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Số điện thoại hoặc email"
                  className="auth-input"
                  autoComplete="username"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-submit"
              >
                {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="auth-back"
              >
                <ArrowLeft size={16} />
                Quay lại đăng nhập
              </button>
            </form>
          ) : (
            <div className="auth-success">
              <span className="auth-success-icon">
                <MailCheck size={28} />
              </span>
              <p className="auth-success-title">
                Tài khoản đã được xác nhận
              </p>
              <p className="auth-help">
                Vui lòng liên hệ quản trị viên hoặc ban quản lý để được cấp lại mật khẩu.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="auth-submit"
              >
                Quay lại đăng nhập
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
