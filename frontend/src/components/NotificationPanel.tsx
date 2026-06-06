import { X, CheckCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { notificationService, Notification } from '../services/feature.service';

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const navigate = useNavigate();
  const [adminNotifications, setAdminNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    notificationService.getAdminAll(100).then(data => {
      setAdminNotifications(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'INVOICE':
        return { bg: 'rgba(30, 78, 140, 0.12)', text: 'var(--brand-primary)', icon: '💰' };
      case 'PAYMENT':
        return { bg: 'rgba(21, 128, 61, 0.12)', text: 'var(--success)', icon: '✅' };
      case 'COMPLAINT':
        return { bg: 'rgba(180, 83, 9, 0.12)', text: 'var(--warning)', icon: '⚠️' };
      case 'SYSTEM':
        return { bg: 'rgba(3, 105, 161, 0.12)', text: 'var(--info)', icon: 'ℹ️' };
      case 'ANNOUNCEMENT':
        return { bg: 'rgba(51, 65, 85, 0.12)', text: 'var(--brand-secondary)', icon: '📢' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.12)', text: 'var(--text-secondary)', icon: 'ℹ️' };
    }
  };

  const handleMarkAsRead = async (id: number) => {
    await notificationService.markAsRead(id);
    setAdminNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const resolveNotificationPath = (notification: Notification): string => {
    if (notification.linkUrl && notification.linkUrl.trim()) {
      return notification.linkUrl;
    }

    const type = (notification.notificationType || '').toUpperCase();
    switch (type) {
      case 'INVOICE':
        return '/invoice-management';
      case 'PAYMENT':
      case 'DEBT':
      case 'DEBT_REMINDER':
        return '/transaction-history';
      case 'COMPLAINT':
      case 'MAINTENANCE':
        return '/maintenance-request';
      case 'CHAT':
      case 'CHATBOT':
        return '/chat-history';
      case 'KNOWLEDGE':
      case 'KNOWLEDGE_BASE':
        return '/knowledge-base';
      case 'ANNOUNCEMENT':
      case 'SYSTEM':
      default:
        return '/dashboard';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    await handleMarkAsRead(notification.id);
    const path = resolveNotificationPath(notification);
    onClose();
    navigate(path);
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setAdminNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div 
      className="fixed inset-0 z-30"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Panel */}
      <div 
        className="absolute right-8 top-20 bg-white rounded-2xl shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
        style={{ 
          width: 'min(420px, calc(100vw - 2rem))',
          maxHeight: 'min(600px, calc(100vh - 6rem))',
          border: '1px solid var(--surface-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'var(--surface-border)' }}
        >
          <div>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: 700, 
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}>
              Thông báo Admin
            </h3>
            <p style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>
              {adminNotifications.length} thông báo
            </p>
          </div>
          <div className="flex items-center gap-2">
            {adminNotifications.some(n => !n.isRead) && (
              <button
                onClick={handleMarkAllRead}
                className="p-2 rounded-lg transition-colors hover:bg-slate-100"
                title="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck size={20} color="var(--brand-primary)" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-slate-100"
            >
              <X size={20} color="var(--text-primary)" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
          {loading ? (
            <div className="text-center py-12 px-6">
              <div
                className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--brand-primary)]"
                aria-hidden="true"
              />
              <p style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)' }}>
                Dang tai thong bao...
              </p>
            </div>
          ) : adminNotifications.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--brand-surface)' }}
              >
                <span style={{ fontSize: '32px' }}>🔔</span>
              </div>
              <p style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Không có thông báo mới
              </p>
              <p style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>
                Các thông báo sẽ xuất hiện ở đây
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--surface-border)' }}>
              {adminNotifications.map((notification) => {
                const typeColor = getTypeColor(notification.notificationType);
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full text-left p-4 transition-colors hover:bg-slate-50"
                    style={{
                      borderLeft: notification.isRead ? 'none' : '4px solid var(--brand-primary)',
                      opacity: notification.isRead ? 0.7 : 1,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: typeColor.bg }}
                      >
                        <span style={{ fontSize: '18px' }}>{typeColor.icon}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p style={{ 
                            fontSize: 'var(--type-body)', 
                            fontWeight: 700, 
                            color: 'var(--text-primary)' 
                          }}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                              style={{ backgroundColor: 'var(--error)' }}
                            />
                          )}
                        </div>
                        <p style={{ 
                          fontSize: 'var(--type-body)', 
                          color: 'var(--text-secondary)',
                          marginBottom: '6px',
                          lineHeight: '1.5',
                        }}>
                          {notification.content}
                        </p>
                        <p style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>
                          🕐 {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
