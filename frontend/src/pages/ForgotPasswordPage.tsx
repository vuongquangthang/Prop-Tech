import { useState } from 'react';
import { useNavigate } from 'react-router';

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
      // TODO: gọi API reset mật khẩu
      setSubmitted(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại';
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

          <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow text-center mb-4">Quên mật khẩu</h1>
          <p className="text-center text-base mb-10" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Nhập số điện thoại để nhận hướng dẫn đặt lại mật khẩu
          </p>

          {!submitted ? (
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-gray-900 font-bold py-3 rounded-lg mt-8 hover:bg-gray-100 transition-colors shadow-lg disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm transition-colors hover:underline"
                  style={{ color: 'rgba(255,255,255,0.85)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ← Quay lại đăng nhập
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <div className="text-6xl mb-4">✉️</div>
              <p className="text-white text-base font-medium">
                Yêu cầu đã được gửi!
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Vui lòng liên hệ quản trị viên hoặc ban quản lý để được hỗ trợ đặt lại mật khẩu.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-white text-gray-900 font-bold py-3 rounded-lg mt-4 hover:bg-gray-100 transition-colors shadow-lg"
              >
                Quay lại đăng nhập
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
