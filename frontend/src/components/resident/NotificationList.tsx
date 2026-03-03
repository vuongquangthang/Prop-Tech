import { Bell, AlertTriangle, Info, DollarSign, Wrench, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useData } from '../../contexts/DataContext';
import { useState } from 'react';

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'payment' | 'incident' | 'success';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  relatedId?: string;
}

export function NotificationList() {
  const navigate = useNavigate();
  const { getNotificationsByTarget, confirmIncidentCompletion, incidents } = useData();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  
  // Get only resident notifications
  const notifications = getNotificationsByTarget('resident');
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return { icon: AlertTriangle, color: '#E67E22', bg: '#FFF3E0' };
      case 'info':
        return { icon: Info, color: '#1A4B84', bg: '#E3F2FD' };
      case 'payment':
        return { icon: DollarSign, color: '#27AE60', bg: '#E8F5E9' };
      case 'incident':
        return { icon: Wrench, color: '#9B59B6', bg: '#F3E5F5' };
      case 'success':
        return { icon: CheckCircle, color: '#27AE60', bg: '#E8F5E9' };
      default:
        return { icon: Bell, color: '#95A5A6', bg: '#F5F5F5' };
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleConfirmCompletion = (incidentId: string) => {
    setConfirmingId(incidentId);
    confirmIncidentCompletion(incidentId);
    
    // Show success feedback
    setTimeout(() => {
      setConfirmingId(null);
    }, 1500);
  };

  // Check if notification is for review (chờ nghiệm thu)
  const isReviewNotification = (notification: any) => {
    if (!notification.relatedId) return false;
    const incident = incidents.find(inc => inc.id === notification.relatedId);
    return incident?.status === 'review' && notification.title === 'Yêu cầu nghiệm thu';
  };

  const handleNotificationClick = (notification: any) => {
    // Navigate based on notification type
    if (notification.type === 'payment') {
      navigate('/resident/bill-detail');
    } else if (notification.type === 'incident' && notification.relatedId) {
      navigate('/resident/incidents/tracking');
    }
    // You can add more navigation logic for other types
  };

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
          const iconConfig = getNotificationIcon(notification.type);
          const Icon = iconConfig.icon;
          const showConfirmButton = isReviewNotification(notification);

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
                onClick={() => handleNotificationClick(notification)}
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
                      {notification.message}
                    </p>
                    <p style={{ 
                      fontSize: '10px', 
                      color: 'var(--text-tertiary)',
                      lineHeight: 1,
                      marginBottom: showConfirmButton ? '8px' : '0'
                    }}>
                      {notification.time}
                    </p>
                    
                    {/* Confirm Button for Review Notifications */}
                    {showConfirmButton && notification.relatedId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmCompletion(notification.relatedId!);
                        }}
                        disabled={confirmingId === notification.relatedId}
                        className="w-full mt-2 px-3 py-2 rounded-lg font-semibold text-white transition-all"
                        style={{
                          backgroundColor: confirmingId === notification.relatedId ? '#27AE60' : '#FF5733',
                          fontSize: '12px',
                          opacity: confirmingId === notification.relatedId ? 0.8 : 1,
                          cursor: confirmingId === notification.relatedId ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {confirmingId === notification.relatedId ? (
                          <span className="flex items-center justify-center space-x-1">
                            <CheckCircle size={14} />
                            <span>Đã xác nhận!</span>
                          </span>
                        ) : (
                          '✓ Xác nhận hoàn thành hài lòng'
                        )}
                      </button>
                    )}
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