import apiService from './api.service';

// Types matching backend
export interface Notification {
  id: number;
  title: string;
  content: string;
  notificationType: 'INVOICE' | 'PAYMENT' | 'COMPLAINT' | 'SYSTEM' | 'ANNOUNCEMENT';
  isRead: boolean;
  createdAt: string;
  senderPhone?: string;
}

class NotificationService {
  private baseUrl = '/api/Notifications';

  /**
   * Get all my notifications
   */
  async getMyNotifications(): Promise<Notification[]> {
    try {
      const response = await apiService.get<Notification[]>(
        `${this.baseUrl}/my-notifications`
      );
      return response || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notifications
   */
  async getUnread(): Promise<Notification[]> {
    try {
      const response = await apiService.get<Notification[]>(
        `${this.baseUrl}/my-notifications?unreadOnly=true`
      );
      return response || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiService.get<{ count: number }>(`${this.baseUrl}/unread-count`);
      return response?.count ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: number): Promise<void> {
    try {
      await apiService.post(`${this.baseUrl}/${id}/read`, {});
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await apiService.post(`${this.baseUrl}/mark-all-read`, {});
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }


  /**
   * Get notification type icon
   */
  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'INVOICE': 'receipt',
      'PAYMENT': 'cash',
      'COMPLAINT': 'construct',
      'SYSTEM': 'information-circle',
      'ANNOUNCEMENT': 'megaphone',
    };
    return icons[type] || 'notifications';
  }

  /**
   * Get notification type color
   */
  getTypeColor(type: string): { color: string; bgColor: string } {
    const colors: Record<string, { color: string; bgColor: string }> = {
      'INVOICE': { color: '#D97706', bgColor: '#FEF3C7' },
      'PAYMENT': { color: '#059669', bgColor: '#D1FAE5' },
      'COMPLAINT': { color: '#DC2626', bgColor: '#FEE2E2' },
      'SYSTEM': { color: '#1A4B84', bgColor: '#E8F0FB' },
      'ANNOUNCEMENT': { color: '#7C3AED', bgColor: '#EDE9FE' },
    };
    return colors[type] || { color: '#6B7280', bgColor: '#F3F4F6' };
  }

  /**
   * Format time ago
   */
  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}

export default new NotificationService();
