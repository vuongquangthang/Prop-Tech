import { useNavigate } from 'react-router';
import { Monitor, Home } from 'lucide-react';

export function PlatformSelector() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-10"
      style={{
        background: 'radial-gradient(circle at top, rgba(30, 78, 140, 0.18), transparent 36%), linear-gradient(180deg, #F7FAFD 0%, #EDF3F9 100%)',
      }}
    >
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10 sm:mb-12">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-[12px] flex items-center justify-center shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <Home size={42} color="#FFF" />
          </div>
          <h1 style={{ fontSize: 'var(--type-page-title)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            LIVO Hub
          </h1>
          <p style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)' }}>
            Hệ thống Quản lý Chung cư
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="app-card w-full text-left p-6 sm:p-8 hover:-translate-y-1 transition-all group"
            style={{ border: '1px solid var(--surface-border)' }}
          >
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-[12px] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform"
              style={{ backgroundColor: 'var(--brand-surface)' }}
            >
              <Monitor size={36} color="var(--brand-primary)" />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Web Admin
            </h2>
            <p style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Giao diện desktop dành cho Ban quản lý với các tác vụ vận hành, tài chính và báo cáo.
            </p>

            <div className="space-y-2">
              {['Quản lý tài khoản', 'Xử lý sự cố', 'Thống kê báo cáo', 'Quản lý hóa đơn'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand-primary)' }} />
                  <span style={{ fontSize: 'var(--type-body)', color: 'var(--text-primary)' }}>{item}</span>
                </div>
              ))}
            </div>

            <div
              className="mt-6 py-3 px-6 rounded-[10px] text-center"
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: '#FFF',
                fontSize: 'var(--type-body-bold)',
                fontWeight: 700,
              }}
            >
              Vào Web Admin →
            </div>
          </button>
        </div>

        <div className="mt-12 text-center">
          <div className="app-card-subtle px-5 py-4 inline-block">
            <p style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>
              App cư dân đã được tách riêng tại thư mục mobile
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>
            Version 1.0.0 • Desktop 1440×1024
          </p>
        </div>
      </div>
    </div>
  );
}
