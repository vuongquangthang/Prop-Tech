import { X, CheckCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { notificationService, Notification } from '../services/feature.service';

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const [adminNotifications, setAdminNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationService.getAdminAll(100).then(data => {
      setAdminNotifications(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'INVOICE':
        return { bg: '#E8F0F8', text: '#1A4B84', icon: '💰' };
      case 'PAYMENT':
        return { bg: '#E8F5E9', text: '#1E7E34', icon: '✅' };
      case 'COMPLAINT':
        return { bg: '#FEF3E8', text: '#E67E22', icon: '⚠️' };
      case 'SYSTEM':
        return { bg: '#F3E5F5', text: '#7B1FA2', icon: 'ℹ️' };
      case 'ANNOUNCEMENT':
        return { bg: '#FEF3E8', text: '#E67E22', icon: '📢' };
      default:
        return { bg: '#F5F5F5', text: '#666', icon: 'ℹ️' };
    }
  };

  const handleMarkAsRead = async (id: number) => {
    await notificationService.markAsRead(id);
    setAdminNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
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
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Panel */}
      <div 
        className="absolute right-8 top-20 bg-white rounded-2xl shadow-2xl"
        style={{ 
          width: '420px',
          maxHeight: '600px',
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
              fontSize: 'var(--type-h4)', 
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
                className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                title="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck size={20} color="var(--brand-primary)" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100"
            >
              <X size={20} color="var(--text-primary)" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
          {adminNotifications.length === 0 ? (
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
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="w-full text-left p-4 transition-colors hover:bg-gray-50"
                    style={{
                      borderLeft: notification.isRead ? 'none' : '4px solid var(--brand-primary)',
                      opacity: notification.isRead ? 0.6 : 1,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: typeColor.bg }}
                      >
                        <span style={{ fontSize: '20px' }}>{typeColor.icon}</span>
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
