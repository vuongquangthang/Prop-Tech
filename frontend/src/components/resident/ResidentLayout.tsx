import { Outlet, useNavigate, useLocation } from 'react-router';
import { Home, Receipt, Wrench, User } from 'lucide-react';

export function ResidentLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/resident', icon: Home, label: 'Trang chủ', exact: true },
    { path: '/resident/payment-history', icon: Receipt, label: 'Hóa đơn', exact: false },
    { path: '/resident/incidents', icon: Wrench, label: 'Sự cố', exact: false },
    { path: '/resident/profile', icon: User, label: 'Cá nhân', exact: false },
  ];

  const isActive = (path: string, exact: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#6B7280',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      {/* Mobile Frame - 360 x 700 */}
      <div style={{
        backgroundColor: '#FFF',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        position: 'relative',
        width: '360px',
        height: '700px',
        borderRadius: '32px',
        border: '10px solid #1f2937',
        overflow: 'hidden',
      }}>
        {/* Status Bar */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          backgroundColor: '#111827',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          height: '24px',
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#FFF' }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#FFF' }} />
          </div>
          <span style={{ fontSize: 9, color: '#FFF' }}>100%</span>
        </div>

        {/* App Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          paddingTop: '24px',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }}>
          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F9FAFB', position: 'relative' }}>
            <Outlet />
          </div>

          {/* Bottom Tab Bar */}
          <div style={{
            backgroundColor: '#FFF',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '8px 0 16px',
            flexShrink: 0,
          }}>
            {navItems.map(({ path, icon: Icon, label, exact }) => {
              const active = isActive(path, exact);
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    padding: '4px 16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: active ? '#007AFF' : '#8E8E93',
                  }}
                >
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                  <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, lineHeight: 1 }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
