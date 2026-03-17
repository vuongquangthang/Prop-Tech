import { useNavigate } from 'react-router';
import { Building2, Home } from 'lucide-react';

export function AppSelector() {
  const navigate = useNavigate();

  return (
    <div 
      className="flex items-center justify-center"
      style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1A4B84 0%, #2563A8 100%)',
      }}
    >
      <div className="text-center space-y-12 px-6">
        {/* Branding */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '12px',
        }}>
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-3">
            {/* Logo Icon Box - Same as Web */}
            <div 
              className="flex items-center justify-center"
              style={{ 
                width: '48px', 
                height: '48px', 
                backgroundColor: '#FF5733',
                borderRadius: '12px'
              }}
            >
              <Home size={28} style={{ color: 'white', strokeWidth: 2 }} />
            </div>
            
            {/* Logo Text */}
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#FFF',
            }}>
              SmartHome Hub
            </h1>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 style={{ 
            fontSize: '44px', 
            fontWeight: 700, 
            color: '#FFF',
            marginBottom: '12px',
          }}>
            Smart Building
          </h1>
          <p style={{ 
            fontSize: 'var(--type-body)', 
            color: '#E8F0F8',
          }}>
            Chọn ứng dụng để tiếp tục
          </p>
        </div>

        {/* App Cards */}
        <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
          {/* Admin App */}
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white rounded-3xl p-10 hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: '#1A4B84' }}
            >
              <Building2 size={40} color="#FFF" strokeWidth={2} />
            </div>
            
            <h2 style={{ 
              fontSize: 'var(--type-section-title)', 
              fontWeight: 700, 
              color: 'var(--text-primary)',
              marginBottom: '12px',
            }}>
              Ứng dụng Ban Quản Lý
            </h2>
            
            <p style={{ 
              fontSize: 'var(--type-body)', 
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              Quản lý tòa nhà, cư dân, tài chính, sự cố, báo cáo và hệ thống AI
            </p>

            <div className="mt-6 pt-6 border-t border-gray-200">
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
                backgroundColor: '#1A4B84',
                color: '#FFF',
                fontSize: 'var(--type-body-bold)',
                fontWeight: 600,
              }}
            >
              Truy cập Admin
            </div>
          </button>
        </div>

        {/* Footer */}
        <div style={{ 
          fontSize: 'var(--type-caption)', 
          color: '#E8F0F8',
        }}>
          © 2026 Smart Building Management System
        </div>
      </div>
    </div>
  );
}