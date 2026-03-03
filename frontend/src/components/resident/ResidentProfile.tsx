import { User, ChevronRight, LogOut, Bell, Lock, HelpCircle } from 'lucide-react';

export function ResidentProfile() {
  const menuItems = [
    { icon: User, label: 'Thông tin cá nhân', path: '#' },
    { icon: Bell, label: 'Cài đặt thông báo', path: '#' },
    { icon: Lock, label: 'Đổi mật khẩu', path: '#' },
    { icon: HelpCircle, label: 'Hỗ trợ & Liên hệ', path: '#' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Tài khoản
        </h2>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1A4B84 0%, #2563A8 100%)' }}
            >
              <span style={{ fontSize: '28px', fontWeight: 700, color: '#FFF' }}>
                A
              </span>
            </div>
            <div className="flex-1">
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Nguyễn Văn A
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                0901234567
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Căn hộ
              </p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                A-1205
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Tòa nhà
              </p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Tòa A
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Diện tích
              </p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                85 m²
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === menuItems.length - 1;

            return (
              <button
                key={index}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                style={{
                  borderBottom: isLast ? 'none' : '1px solid #E5E7EB',
                }}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={20} color="var(--text-secondary)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.label}
                  </span>
                </div>
                <ChevronRight size={18} color="var(--text-secondary)" />
              </button>
            );
          })}
        </div>

        {/* App Info */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Smart Building App
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Phiên bản 1.0.0
          </p>
        </div>

        {/* Logout Button */}
        <button
          className="w-full py-3 rounded-xl text-center border-2 hover:bg-red-50 transition-colors flex items-center justify-center space-x-2"
          style={{
            borderColor: 'var(--error)',
            color: 'var(--error)',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
