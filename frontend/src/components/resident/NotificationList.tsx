import { Bell, AlertTriangle, Info, DollarSign, Wrench, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { notificationService, Notification } from '../../services/feature.service';

export function NotificationList() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    notificationService.getMy().then(data => {
      setNotifications(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'INVOICE':
        return { icon: DollarSign, color: '#1A4B84', bg: '#E3F2FD' };
      case 'PAYMENT':
        return { icon: CheckCircle, color: '#27AE60', bg: '#E8F5E9' };
      case 'COMPLAINT':
        return { icon: AlertTriangle, color: '#E67E22', bg: '#FFF3E0' };
      case 'SYSTEM':
        return { icon: Info, color: '#1A4B84', bg: '#E3F2FD' };
      case 'ANNOUNCEMENT':
        return { icon: Wrench, color: '#9B59B6', bg: '#F3E5F5' };
      default:
        return { icon: Bell, color: '#95A5A6', bg: '#F5F5F5' };
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Header with Back Button */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Thông báo
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} color="var(--text-secondary)" strokeWidth={2} />
        </button>
      </div>

      {/* Unread Count Info */}
      {unreadCount > 0 && (
        <div className="bg-white px-4 py-2 border-b border-gray-200">
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {unreadCount} thông báo chưa đọc
          </p>
        </div>
      )}

      {/* Notifications List */}
      <div className="p-3 space-y-2">
        {notifications.map((notification) => {
          const iconConfig = getNotificationIcon(notification.notificationType);
          const Icon = iconConfig.icon;

          return (
            <div
              key={notification.id}
              className="w-full"
            >
              <div 
                className="bg-white rounded-xl p-3 border transition-all cursor-pointer hover:shadow-md"
                style={{
                  borderColor: notification.isRead ? '#E5E7EB' : iconConfig.color,
                  borderWidth: notification.isRead ? '1px' : '2px',
                  opacity: notification.isRead ? 0.7 : 1,
                }}
                onClick={async () => {
                  if (!notification.isRead) {
                    await notificationService.markAsRead(notification.id);
                    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
                  }
                }}
              >
                <div className="flex space-x-3">
                  {/* Icon */}
                  <div 
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: iconConfig.bg,
                      borderRadius: '8px',
                    }}
                  >
                    <Icon size={18} color={iconConfig.color} strokeWidth={2.5} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 style={{ 
                        fontSize: '13px', 
                        fontWeight: notification.isRead ? 500 : 700, 
                        color: 'var(--text-primary)',
                        lineHeight: 1.3
                      }}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div 
                          style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: iconConfig.color,
                            borderRadius: '50%',
                            marginLeft: '8px',
                            marginTop: '4px',
                          }}
                        />
                      )}
                    </div>
                    <p style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)', 
                      lineHeight: 1.4,
                      marginBottom: '6px'
                    }}>
                      {notification.content}
                    </p>
                    <p style={{ 
                      fontSize: '10px', 
                      color: 'var(--text-tertiary)',
                      lineHeight: 1,
                    }}>
                      {new Date(notification.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State (if no notifications) */}
      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div 
            className="flex items-center justify-center mb-3"
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#F5F5F5',
              borderRadius: '50%',
            }}
          >
            <Bell size={32} color="#95A5A6" strokeWidth={1.5} />
          </div>
          <h3 style={{ 
            fontSize: '14px', 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            marginBottom: '6px'
          }}>
            Chưa có thông báo
          </h3>
          <p style={{ 
            fontSize: '12px', 
            color: 'var(--text-secondary)',
            textAlign: 'center',
            lineHeight: 1.5
          }}>
            Các thông báo từ ban quản lý sẽ hiển thị ở đây
          </p>
        </div>
      )}
    </div>
  );
}