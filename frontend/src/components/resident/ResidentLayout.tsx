import { Outlet, useNavigate, useLocation } from 'react-router';
import { Home, FileText, MessageCircle, User, Bell, LogOut } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

export function ResidentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getUnreadNotificationCountByTarget } = useData();
  const { logout } = useAuth();

  const navItems = [
    { path: '/resident', icon: Home, label: 'Trang chủ' },
    { path: '/resident/incidents', icon: FileText, label: 'Sự cố' },
    { path: '/resident/chat', icon: MessageCircle, label: 'Hỏi AI' },
    { path: '/resident/profile', icon: User, label: 'Tài khoản' },
  ];

  // Get unread notification count from context - only for resident
  const unreadNotifications = getUnreadNotificationCountByTarget('resident');

  const isActive = (path: string) => {
    if (path === '/resident') {
      return location.pathname === '/resident';
    }
    return location.pathname.startsWith(path);
  };

  const handleExitApp = () => {
    if (confirm('Bạn có muốn đăng xuất khỏi ứng dụng?')) {
      console.log('🚪 Resident logging out...');
      logout();
      console.log('✅ Logged out, navigating to landing page...');
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-400 flex items-center justify-center p-4">
      {/* Mobile Frame - Compact: 360 x 700 */}
      <div 
        className="bg-white shadow-2xl relative"
        style={{ 
          width: '360px', 
          height: '700px',
          borderRadius: '32px',
          border: '10px solid #1f2937',
          overflow: 'hidden',
        }}
      >
        {/* Status Bar - Small Android Style */}
        <div 
          className="absolute top-0 left-0 right-0 bg-gray-900 z-50 flex items-center justify-between px-3"
          style={{ height: '24px' }}
        >
          <div className="flex items-center space-x-1">
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#FFF' }} />
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#FFF' }} />
          </div>
          <div className="flex items-center space-x-1">
            <span style={{ fontSize: '9px', color: '#FFF' }}>100%</span>
          </div>
        </div>

        {/* App Container with Sticky Header and Footer */}
        <div 
          className="flex flex-col h-full bg-gray-50 relative"
          style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
        >
          {/* Sticky Header */}
          <div 
            className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between sticky top-0 z-40"
            style={{ paddingTop: '28px' }}
          >
            <div className="flex items-center space-x-2">
              {/* Logo - Same as Web */}
              <div 
                className="flex items-center justify-center"
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  backgroundColor: '#FF5733',
                  borderRadius: '8px'
                }}
              >
                <Home size={20} style={{ color: 'white', strokeWidth: 2 }} />
              </div>
              <div>
                <h1 style={{ 
                  fontSize: '14px', 
                  fontWeight: 700, 
                  color: 'var(--text-primary)', 
                  lineHeight: 1.2,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                }}>
                  SmartHome Hub
                </h1>
              </div>
            </div>
            
            {/* Notification Bell */}
            <button
              onClick={() => navigate('/resident/notifications')}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell size={20} color="var(--text-primary)" strokeWidth={2} />
              {unreadNotifications > 0 && (
                <div 
                  className="absolute top-1 right-1 flex items-center justify-center"
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: '#D32F2F',
                    borderRadius: '50%',
                    border: '2px solid white',
                  }}
                >
                  <span style={{ 
                    fontSize: '9px', 
                    fontWeight: 700, 
                    color: '#FFF',
                    lineHeight: 1,
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                  }}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>

          {/* Sticky Bottom Navigation */}
          <div className="bg-white border-t border-gray-200 px-1 py-1.5 flex items-center justify-around sticky bottom-0 z-40">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center space-y-0.5 px-2 py-1.5 rounded transition-colors"
                  style={{
                    color: active ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: active ? 600 : 400,
                    lineHeight: 1,
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                  }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
            <button
              onClick={handleExitApp}
              className="flex flex-col items-center space-y-0.5 px-2 py-1.5 rounded transition-colors"
              style={{
                color: 'var(--text-secondary)',
              }}
            >
              <LogOut size={20} strokeWidth={2} />
              <span style={{ 
                fontSize: '10px', 
                fontWeight: 400,
                lineHeight: 1,
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
              }}>
                Thoát
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}