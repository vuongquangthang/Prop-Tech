import { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../lib/api-client';
import { API_ENDPOINTS } from '../lib/api-config';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';

type Step = 'request' | 'reset' | 'done';

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('request');
  const [account, setAccount] = useState('');   // sđt hoặc email
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const extractError = (err: any, fallback: string) =>
    err?.response?.data?.message || (err instanceof Error ? err.message : fallback);

  // Bước 1: gửi OTP về email của tài khoản
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ email?: string }>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        phoneNumberOrEmail: account.trim(),
      });
      setMaskedEmail(res?.data?.email ?? '');
      setStep('reset');
    } catch (err: any) {
      setError(extractError(err, 'Có lỗi xảy ra, vui lòng thử lại'));
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: verify OTP + đặt mật khẩu mới
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        email: account.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setStep('done');
    } catch (err: any) {
      setError(extractError(err, 'Đặt lại mật khẩu thất bại'));
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

          {error && step !== 'done' && (
            <p className="auth-alert auth-alert-error" role="alert">{error}</p>
          )}

          {step === 'request' && (
            <>
              <p className="auth-description">
                Nhập số điện thoại hoặc email. Mã OTP sẽ được gửi tới email của tài khoản.
              </p>
              <form onSubmit={handleRequest} className="auth-form">
                <div className="auth-field">
                  <input
                    type="text"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    placeholder="Số điện thoại hoặc email"
                    className="auth-input"
                    autoComplete="username"
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="auth-submit">
                  {loading ? 'Đang gửi mã...' : 'Gửi mã OTP'}
                </button>
                <button type="button" onClick={() => navigate('/login')} className="auth-back">
                  <ArrowLeft size={16} />
                  Quay lại đăng nhập
                </button>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <p className="auth-description">
                Mã OTP đã gửi tới email {maskedEmail || 'của bạn'}. Nhập mã và mật khẩu mới.
              </p>
              <form onSubmit={handleReset} className="auth-form">
                <div className="auth-field">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Mã OTP (6 số)"
                    className="auth-input"
                    maxLength={6}
                    required
                  />
                </div>
                <div className="auth-field">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mật khẩu mới"
                    className="auth-input"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="auth-field">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận mật khẩu mới"
                    className="auth-input"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="auth-submit">
                  {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                </button>
                <button type="button" onClick={() => { setStep('request'); setError(''); }} className="auth-back">
                  <ArrowLeft size={16} />
                  Nhập lại tài khoản
                </button>
              </form>
            </>
          )}

          {step === 'done' && (
            <div className="auth-success">
              <span className="auth-success-icon">
                <CheckCircle2 size={28} />
              </span>
              <p className="auth-success-title">Đặt lại mật khẩu thành công</p>
              <p className="auth-help">Bạn có thể đăng nhập bằng mật khẩu mới.</p>
              <button type="button" onClick={() => navigate('/login')} className="auth-submit">
                Đăng nhập ngay
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
