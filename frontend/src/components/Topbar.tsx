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
    const interval = setInterval(load, 30000);
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
    <header className="app-navbar h-16 flex items-center justify-between px-4 flex-shrink-0 shadow-[0_1px_0_rgba(15,23,42,0.04)]" style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
      {/* Left: hamburger (visible only on <1280px) + title */}
      <div className="flex items-center" style={{ gap: '12px', minWidth: 0 }}>
        <style>{`
          .topbar-hamburger { display: none; }
          @media (max-width: 1279px) { .topbar-hamburger { display: flex; } }
          .topbar-search { width: min(28vw, 260px); }
          @media (max-width: 1439px) { .topbar-search { width: min(24vw, 220px); } }
          @media (max-width: 1023px) { .topbar-search { width: 160px; } }
          .topbar-label { display: inline; }
          @media (max-width: 1023px) { .topbar-label { display: none; } }
        `}</style>
        <button
          className="topbar-hamburger items-center justify-center rounded-xl transition-colors hover:bg-[var(--brand-surface)]"
          style={{ padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
          onClick={onMenuToggle}
        >
          <Menu size={22} style={{ color: 'var(--text-primary)' }} />
        </button>
        <span
          className="topbar-label font-semibold truncate"
          style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)', maxWidth: '320px', letterSpacing: '0.01em' }}
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
            className="topbar-search app-input focus:outline-none"
            style={{
              paddingLeft: '36px',
              paddingRight: '12px',
              height: '40px',
              backgroundColor: 'var(--surface-card-2)',
              fontSize: 'var(--type-caption)'
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Notification */}
        <button className="relative rounded-xl transition-colors hover:bg-[var(--brand-surface)]" style={{ padding: '10px' }} onClick={() => setShowNotifications(!showNotifications)}>
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
        <button className="flex items-center rounded-xl transition-colors hover:bg-[var(--brand-surface)]" style={{
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
        <button className="flex items-center rounded-xl transition-colors hover:bg-[var(--brand-surface)]" style={{
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