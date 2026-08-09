import apiService from './api.service';

// Types matching backend
export interface Notification {
  id: number;
  title: string;
  content: string;
  notificationType: 'INVOICE' | 'PAYMENT' | 'COMPLAINT' | 'SYSTEM' | 'ANNOUNCEMENT' | 'CONTRACT_CHANGE' | 'SERVICE_PRICE';
  relatedId?: number;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
  senderPhone?: string;
}

const normalizeNotification = (raw: any): Notification => {
  const relatedValue = raw?.relatedId
    ?? raw?.RelatedId
    ?? raw?.invoiceId
    ?? raw?.InvoiceId
    ?? raw?.relatedEntityId
    ?? raw?.RelatedEntityId;
  const relatedId = Number(relatedValue);

  return {
    ...raw,
    id: Number(raw?.id ?? raw?.Id),
    title: raw?.title ?? raw?.Title ?? '',
    content: raw?.content ?? raw?.Content ?? raw?.message ?? raw?.Message ?? '',
    notificationType: String(
      raw?.notificationType
      ?? raw?.NotificationType
      ?? raw?.type
      ?? raw?.Type
      ?? 'SYSTEM',
    ).toUpperCase() as Notification['notificationType'],
    relatedId: Number.isFinite(relatedId) && relatedId > 0 ? relatedId : undefined,
    linkUrl: raw?.linkUrl ?? raw?.LinkUrl,
    isRead: Boolean(raw?.isRead ?? raw?.IsRead ?? false),
    createdAt: raw?.createdAt ?? raw?.CreatedAt ?? new Date().toISOString(),
    senderPhone: raw?.senderPhone ?? raw?.SenderPhone,
  };
};

class NotificationService {
  private baseUrl = '/api/Notifications';
  private cachedNotifications: Notification[] = [];

  getCachedNotifications(): Notification[] {
    return this.cachedNotifications;
  }

  /**
   * Get all my notifications
   */
  async getMyNotifications(): Promise<Notification[]> {
    try {
      const response = await apiService.get<Notification[]>(
        `${this.baseUrl}/my-notifications`
      );
      this.cachedNotifications = (response || []).map(normalizeNotification);
      return this.cachedNotifications;
    } catch (error) {
      console.warn('Unable to fetch notifications:', error);
      throw error;
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
      const unreadNotifications = (response || []).map(normalizeNotification);
      if (this.cachedNotifications.length > 0) {
        const unreadIds = new Set(unreadNotifications.map((item) => item.id));
        this.cachedNotifications = this.cachedNotifications.map((item) => ({
          ...item,
          isRead: !unreadIds.has(item.id),
        }));
      }
      return unreadNotifications;
    } catch (error) {
      console.warn('Unable to fetch unread notifications:', error);
      throw error;
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
      this.cachedNotifications = this.cachedNotifications.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      );
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
      this.cachedNotifications = this.cachedNotifications.map((item) => ({ ...item, isRead: true }));
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
      'CONTRACT_CHANGE': 'document-text',
      'SERVICE_PRICE': 'pricetag',
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
      'CONTRACT_CHANGE': { color: '#1D4ED8', bgColor: '#DBEAFE' },
      'SERVICE_PRICE': { color: '#0E7490', bgColor: '#CFFAFE' },
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
