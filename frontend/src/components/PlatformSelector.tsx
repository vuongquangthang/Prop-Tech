import { useNavigate } from 'react-router';
import { Smartphone, Monitor, Home } from 'lucide-react';

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
        <div className="grid md:grid-cols-2 gap-8">
          {/* Resident App Card */}
          <button
            onClick={() => navigate('/resident')}
            className="bg-white rounded-3xl p-8 hover:shadow-2xl transition-all hover:scale-105 text-left group"
            style={{ border: '3px solid transparent' }}
          >
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
              style={{ backgroundColor: '#FEF3E8' }}
            >
              <Smartphone size={40} color="#E67E22" />
            </div>
            
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              📱 App Cư Dân
            </h2>
            <p style={{ fontSize: '17px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Giao diện mobile 360×700px dành cho cư dân
            </p>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1E7E34' }} />
                <span style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                  Báo cáo sự cố
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1E7E34' }} />
                <span style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                  Thanh toán hóa đơn
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1E7E34' }} />
                <span style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                  Theo dõi tiến độ
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1E7E34' }} />
                <span style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                  Nhận thông báo
                </span>
              </div>
            </div>

            <div 
              className="mt-6 py-3 px-6 rounded-xl text-center"
              style={{ 
                backgroundColor: '#E67E22',
                color: '#FFF',
                fontSize: '17px',
                fontWeight: 700,
              }}
            >
              Vào App Cư Dân →
            </div>
          </button>

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
            <p style={{ fontSize: '15px', color: '#E8F0F8', marginBottom: '8px' }}>
              💡 <strong>Demo Account:</strong> Nguyễn Văn A • Căn hộ A-1205 • 0901234567
            </p>
            <p style={{ fontSize: '13px', color: '#D1E7F8' }}>
              Dữ liệu đồng bộ real-time giữa App và Web • Font Inter • Design tokens nhất quán
            </p>
          </div>
        </div>

        {/* Version */}
        <div className="mt-8 text-center">
          <p style={{ fontSize: '13px', color: '#B8D4E8' }}>
            Version 1.0.0 • Desktop 1440×1024 • Mobile 360×700
          </p>
        </div>
      </div>
    </div>
  );
}
