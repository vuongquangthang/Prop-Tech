import { useNavigate } from 'react-router';
import { Monitor, Home } from 'lucide-react';

export function PlatformSelector() {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #1A4B84 0%, #2563A8 100%)' }}
    >
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div 
            className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center"
            style={{ backgroundColor: '#FF5733' }}
          >
            <Home size={48} color="#FFF" />
          </div>
          <h1 style={{ fontSize: '44px', fontWeight: 700, color: '#FFF', marginBottom: '16px' }}>
            SmartHome Hub
          </h1>
          <p style={{ fontSize: '20px', color: '#E8F0F8' }}>
            Hệ thống Quản lý Chung cư
          </p>
        </div>

        {/* Platform Selection Cards */}
        <div className="max-w-2xl mx-auto">
          {/* Admin Web Card */}
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white rounded-3xl p-8 hover:shadow-2xl transition-all hover:scale-105 text-left group"
            style={{ border: '3px solid transparent' }}
          >
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
              style={{ backgroundColor: '#E8F0F8' }}
            >
              <Monitor size={40} color="#1A4B84" />
            </div>
            
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              🖥️ Web Admin
            </h2>
            <p style={{ fontSize: '17px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Giao diện desktop 1440×1024px dành cho Ban quản lý
            </p>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1A4B84' }} />
                <span style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                  Quản lý tài khoản
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1A4B84' }} />
                <span style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                  Xử lý sự cố
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1A4B84' }} />
                <span style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                  Thống kê báo cáo
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1A4B84' }} />
                <span style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                  Quản lý hóa đơn
                </span>
              </div>
            </div>

            <div 
              className="mt-6 py-3 px-6 rounded-xl text-center"
              style={{ 
                backgroundColor: '#1A4B84',
                color: '#FFF',
                fontSize: '17px',
                fontWeight: 700,
              }}
            >
              Vào Web Admin →
            </div>
          </button>
        </div>

        {/* Demo Info */}
        <div className="mt-12 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 inline-block">
            <p style={{ fontSize: '13px', color: '#D1E7F8' }}>
              App cư dân đã được tách riêng tại thư mục mobile
            </p>
          </div>
        </div>

        {/* Version */}
        <div className="mt-8 text-center">
          <p style={{ fontSize: '13px', color: '#B8D4E8' }}>
            Version 1.0.0 • Desktop 1440×1024
          </p>
        </div>
      </div>
    </div>
  );
}
