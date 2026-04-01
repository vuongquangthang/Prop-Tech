import { Search, Bell, User, LogOut, Menu } from 'lucide-react';
import { useSearch } from '../contexts/SearchContext';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { NotificationPanel } from './NotificationPanel';
import { notificationService } from '../services/feature.service';

interface TopbarProps {
  title?: string;
  onMenuToggle?: () => void;
}

export function Topbar({ title = 'Bảng điều khiển', onMenuToggle }: TopbarProps) {
  const { searchTerm, setSearchTerm } = useSearch();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = () => notificationService.getUnreadCount().then(setUnreadCount);
    load();
    const interval = setInterval(load, 1000);
    return () => clearInterval(interval);
  }, []);

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
      padding: '0 16px',
      flexShrink: 0,
    }}>
      {/* Left: hamburger (visible only on <1280px) + title */}
      <div className="flex items-center" style={{ gap: '12px', minWidth: 0 }}>
        <style>{`
          .topbar-hamburger { display: none; }
          @media (max-width: 1279px) { .topbar-hamburger { display: flex; } }
          .topbar-search { width: 240px; }
          @media (max-width: 1439px) { .topbar-search { width: 200px; } }
          @media (max-width: 1023px) { .topbar-search { width: 160px; } }
          .topbar-label { display: inline; }
          @media (max-width: 1023px) { .topbar-label { display: none; } }
        `}</style>
        <button
          className="topbar-hamburger items-center justify-center rounded transition-colors hover:bg-[var(--brand-surface)]"
          style={{ padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
          onClick={onMenuToggle}
        >
          <Menu size={22} style={{ color: 'var(--text-primary)' }} />
        </button>
        <span
          className="topbar-label font-semibold truncate"
          style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)', maxWidth: '320px' }}
        >
          {title}
        </span>
      </div>
      
      {/* Right Section */}
      <div className="flex items-center flex-shrink-0" style={{ gap: '8px' }}>
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            className="topbar-search focus:outline-none"
            style={{
              paddingLeft: '36px',
              paddingRight: '12px',
              paddingTop: '10px',
              paddingBottom: '10px',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--radius-button)',
              backgroundColor: 'var(--surface-bg)',
              fontSize: 'var(--type-caption)',
              color: 'var(--text-primary)'
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Notification */}
        <button className="relative rounded transition-colors hover:bg-[var(--brand-surface)]" style={{ padding: '10px' }} onClick={() => setShowNotifications(!showNotifications)}>
          <Bell size={18} style={{ color: 'var(--text-primary)' }} />
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
          padding: '6px 10px'
        }}>
          <div className="rounded-full flex items-center justify-center" style={{
            width: '28px',
            height: '28px',
            backgroundColor: 'var(--brand-surface)',
          }}>
            <User size={14} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <span className="topbar-label" style={{ fontSize: 'var(--type-caption)', color: 'var(--text-primary)', fontWeight: 600 }}>Admin</span>
        </button>

        {/* Logout Button */}
        <button className="flex items-center rounded transition-colors hover:bg-[var(--brand-surface)]" style={{
          gap: '8px',
          padding: '6px 10px'
        }} onClick={handleExitAdmin}>
          <div className="rounded-full flex items-center justify-center" style={{
            width: '28px',
            height: '28px',
            backgroundColor: 'var(--brand-surface)',
          }}>
            <LogOut size={14} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <span className="topbar-label" style={{ fontSize: 'var(--type-caption)', color: 'var(--text-primary)', fontWeight: 600 }}>Đăng xuất</span>
        </button>
      </div>

      {/* Notification Panel */}
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </header>
  );
}