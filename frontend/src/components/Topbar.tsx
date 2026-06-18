import { Bell, User, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { NotificationPanel } from './NotificationPanel';
import { notificationService } from '../services/feature.service';
import { notificationHub } from '../lib/signalr-service';
import { ThemeSwitcher } from './ThemeSwitcher';

interface TopbarProps {
  title?: string;
  onMenuToggle?: () => void;
}

export function Topbar({ title = 'Bảng điều khiển', onMenuToggle }: TopbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const adminName = user?.displayName || user?.fullName || user?.residentName || user?.phoneNumber || 'Admin';
  const adminRole = user?.role || 'Admin';

  const refreshUnreadCount = useCallback(() => {
    notificationService.getUnreadCount().then(setUnreadCount);
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  useEffect(() => {
    const refreshOnNotificationEvent = () => {
      void refreshUnreadCount();
    };
    const events = [
      'ReceiveNotification',
      'ReceiveAdminNotification',
      'NewMaintenanceRequest',
      'MaintenanceRequestUpdated',
      'MaintenanceRequestClosed',
      'InvoiceUpdated',
      'PaymentInitiated',
      'PaymentSuccess',
      'PaymentFailed',
    ];

    events.forEach((eventName) => notificationHub.on(eventName, refreshOnNotificationEvent));
    return () => {
      events.forEach((eventName) => notificationHub.off(eventName, refreshOnNotificationEvent));
    };
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!showUserMenu) return undefined;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [showUserMenu]);

  const handleExitAdmin = () => {
    setShowNotifications(false);
    setShowUserMenu(false);
    setShowLogoutConfirm(true);
  };

  const confirmExitAdmin = async () => {
    await logout();
    setShowLogoutConfirm(false);
    navigate('/', { replace: true });
  };

  const logoutConfirmModal = showLogoutConfirm
    ? createPortal(
        <div
          className="admin-content-modal-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="admin-content-modal-panel"
            style={{ width: 'min(100%, 440px)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            aria-describedby="logout-confirm-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-content-modal-header flex items-center justify-between border-b border-gray-300 px-6 py-4">
              <h3 id="logout-confirm-title" className="text-lg font-semibold text-gray-800">
                Xác nhận đăng xuất
              </h3>
              <button
                type="button"
                className="rounded p-1 hover:bg-gray-100"
                onClick={() => setShowLogoutConfirm(false)}
                aria-label="Đóng"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="flex items-start gap-3 rounded border border-red-200 bg-red-50 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-red-600">
                  <LogOut size={20} />
                </div>
                <div>
                  <p id="logout-confirm-description" className="text-sm font-semibold text-red-800">
                    Bạn có muốn đăng xuất khỏi hệ thống?
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    Phiên làm việc hiện tại sẽ kết thúc và bạn sẽ quay về màn hình đăng nhập.
                  </p>
                </div>
              </div>
            </div>

            <div className="admin-content-modal-footer flex items-center justify-end gap-3 border-t border-gray-300 px-6 py-4">
              <button
                type="button"
                className="app-button-secondary"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="app-button-danger"
                onClick={confirmExitAdmin}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <header
      className="admin-topbar app-navbar fixed left-0 right-0 top-0 z-[60] flex h-16 flex-shrink-0 items-center justify-between px-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
      style={{ backgroundColor: 'var(--topbar)' }}
    >
      <div className="flex items-center" style={{ gap: '12px', minWidth: 0 }}>
        <style>{`
          .topbar-hamburger { display: none; }
          @media (max-width: 1279px) { .topbar-hamburger { display: flex; } }
          .topbar-label { display: inline; }
          @media (max-width: 1023px) { .topbar-label { display: none; } }
        `}</style>
        <button
          type="button"
          className="topbar-hamburger items-center justify-center rounded-xl transition-colors hover:bg-[var(--brand-surface)]"
          style={{ padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
          onClick={onMenuToggle}
        >
          <Menu size={22} style={{ color: 'var(--text-primary)' }} />
        </button>
        <span
          className="topbar-label truncate font-semibold"
          style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)', maxWidth: '320px', letterSpacing: '0.01em' }}
        >
          {title}
        </span>
      </div>

      <div className="flex flex-shrink-0 items-center" style={{ gap: '8px' }}>
        <ThemeSwitcher />
        <button
          type="button"
          className="relative rounded-xl transition-colors hover:bg-[var(--brand-surface)]"
          style={{ padding: '10px' }}
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications((current) => {
              const next = !current;
              if (next) {
                void refreshUnreadCount();
              }
              return next;
            });
          }}
        >
          <Bell size={18} style={{ color: 'var(--text-primary)' }} />
          {unreadCount > 0 && (
            <span
              className="absolute rounded-full"
              style={{
                top: '8px',
                right: '8px',
                width: '8px',
                height: '8px',
                backgroundColor: 'var(--error)'
              }}
            />
          )}
        </button>

        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            className="flex items-center rounded-xl transition-colors hover:bg-[var(--brand-surface)]"
            style={{ gap: '8px', padding: '6px 10px', cursor: 'pointer' }}
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
            aria-label="Menu tài khoản"
            onClick={() => {
              setShowNotifications(false);
              setShowUserMenu((current) => !current);
            }}
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: '28px', height: '28px', backgroundColor: 'var(--brand-surface)' }}
            >
              <User size={14} style={{ color: 'var(--brand-primary)' }} />
            </div>
            <span
              className="topbar-label max-w-[160px] truncate"
              style={{ fontSize: 'var(--type-caption)', color: 'var(--text-primary)', fontWeight: 600 }}
            >
              {adminName}
            </span>
            <ChevronDown
              size={14}
              className="topbar-label transition-transform"
              style={{ color: 'var(--text-secondary)', transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 z-[80] mt-2 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
              role="menu"
            >
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-gray-800">{adminName}</p>
                <p className="mt-0.5 truncate text-xs text-gray-500">{adminRole}</p>
              </div>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                role="menuitem"
                onClick={handleExitAdmin}
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>

      {showNotifications && (
        <NotificationPanel
          onClose={() => setShowNotifications(false)}
          onNotificationsChanged={refreshUnreadCount}
        />
      )}

      {logoutConfirmModal}
    </header>
  );
}
