import { useNavigate } from 'react-router';
import { Building2, Home } from 'lucide-react';

export function AppSelector() {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center justify-center px-6 py-10"
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top, rgba(30, 78, 140, 0.18), transparent 36%), linear-gradient(180deg, #F7FAFD 0%, #EDF3F9 100%)',
      }}
    >
      <div className="text-center space-y-10 max-w-4xl w-full">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px' }}>
          <div className="flex items-center space-x-3 mb-3">
            <div
              className="flex items-center justify-center shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'var(--brand-primary)',
                borderRadius: '12px',
              }}
            >
              <Home size={28} style={{ color: 'white', strokeWidth: 2 }} />
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              SmartHome Hub
            </h1>
          </div>
        </div>

        <div>
          <h1 style={{ fontSize: 'var(--type-page-title)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Smart Building
          </h1>
          <p style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)' }}>
            Chọn ứng dụng để tiếp tục
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="app-card w-full rounded-3xl p-8 sm:p-10 hover:-translate-y-1 transition-all"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <Building2 size={40} color="#FFF" strokeWidth={2} />
            </div>

            <h2 style={{ fontSize: 'var(--type-section-title)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Ứng dụng Ban Quản Lý
            </h2>

            <p style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Quản lý tòa nhà, cư dân, tài chính, sự cố, báo cáo và hệ thống AI
            </p>

            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--surface-border)' }}>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>
                    Màn hình
                  </p>
                  <p style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '4px' }}>
                    20 màn hình
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>
                    Phân hệ
                  </p>
                  <p style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '4px' }}>
                    8 phân hệ
                  </p>
                </div>
              </div>
            </div>

            <div
              className="mt-6 py-3 rounded-xl"
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: '#FFF',
                fontSize: 'var(--type-body-bold)',
                fontWeight: 600,
              }}
            >
              Truy cập Admin
            </div>
          </button>
        </div>

        <div style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          © 2026 Smart Building Management System
        </div>
      </div>
    </div>
  );
}