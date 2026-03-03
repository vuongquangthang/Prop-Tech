import { Search, Bell, User, LogOut } from 'lucide-react';
import { useSearch } from '../contexts/SearchContext';
import { useNavigate } from 'react-router';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { NotificationPanel } from './NotificationPanel';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title = 'Bảng điều khiển' }: TopbarProps) {
  const { searchTerm, setSearchTerm } = useSearch();
  const navigate = useNavigate();
  const { getUnreadNotificationCountByTarget } = useData();
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = getUnreadNotificationCountByTarget('admin');

  const handleExitAdmin = () => {
    if (confirm('Bạn có muốn đăng xuất khỏi hệ thống?')) {
      console.log('🚪 Logging out...');
      logout();
      console.log('✅ Logged out, navigating to landing page...');
      navigate('/', { replace: true });
    }
  };

  return (
    <header className="h-16 flex items-center justify-between" style={{ 
      backgroundColor: 'var(--surface-card)', 
      borderBottom: '1px solid var(--surface-border)',
      padding: '0 32px'
    }}>
      {/* Empty left section - title removed */}
      <div></div>
      
      {/* Right Section */}
      <div className="flex items-center" style={{ gap: 'var(--space-card)' }}>
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            className="focus:outline-none"
            style={{
              width: '320px',
              paddingLeft: '40px',
              paddingRight: '16px',
              paddingTop: '12px',
              paddingBottom: '12px',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--radius-button)',
              backgroundColor: 'var(--surface-bg)',
              fontSize: 'var(--type-body)',
              color: 'var(--text-primary)'
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Notification */}
        <button className="relative rounded transition-colors hover:bg-[var(--brand-surface)]" style={{ padding: '12px' }} onClick={() => setShowNotifications(!showNotifications)}>
          <Bell size={20} style={{ color: 'var(--text-primary)' }} />
          {unreadCount > 0 && (
            <span className="absolute rounded-full" style={{
              top: '8px',
              right: '8px',
              width: '8px',
              height: '8px',
              backgroundColor: 'var(--error)'
            }}></span>
          )}
        </button>
        
        {/* User Avatar */}
        <button className="flex items-center rounded transition-colors hover:bg-[var(--brand-surface)]" style={{
          gap: '8px',
          padding: '8px 12px'
        }}>
          <div className="rounded-full flex items-center justify-center" style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'var(--brand-surface)',
          }}>
            <User size={16} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <span style={{ fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 600 }}>Admin</span>
        </button>

        {/* Logout Button */}
        <button className="flex items-center rounded transition-colors hover:bg-[var(--brand-surface)]" style={{
          gap: '8px',
          padding: '8px 12px'
        }} onClick={handleExitAdmin}>
          <div className="rounded-full flex items-center justify-center" style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'var(--brand-surface)',
          }}>
            <LogOut size={16} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <span style={{ fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 600 }}>Đăng xuất</span>
        </button>
      </div>

      {/* Notification Panel */}
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </header>
  );
}