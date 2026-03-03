import apiService from './api.service';

// Types matching backend DTOs
export interface MaintenanceRequest {
  id: number;
  roomId: number;
  roomNumber?: string;
  userId: number;
  userName?: string;
  issueType: string;
  description?: string;
  mediaUrl?: string;
  status: 'Chờ xử lý' | 'Đang xử lý' | 'Hoàn thành' | 'Từ chối';
  adminNote?: string;
  completionImageUrl?: string;
  createdAt: string;
  closedAt?: string;
}

export interface CreateMaintenanceRequest {
  roomId?: number; // Optional - backend will auto-detect from user's residency
  issueType: string;
  description?: string;
  mediaUrl?: string;
}

export interface UpdateMaintenanceRequest {
  status?: string;
  adminNote?: string;
}

class MaintenanceService {
  private baseUrl = '/api/YeuCauSuaChua';

  /**
   * Get all maintenance requests (for admin)
   */
  async getAll(): Promise<MaintenanceRequest[]> {
    return apiService.get<MaintenanceRequest[]>(this.baseUrl);
  }

  /**
   * Get my maintenance requests (for resident)
   */
  async getMyRequests(): Promise<MaintenanceRequest[]> {
    return apiService.get<MaintenanceRequest[]>(`${this.baseUrl}/my-requests`);
  }

  /**
   * Get maintenance requests by status
   */
  async getByStatus(status: string): Promise<MaintenanceRequest[]> {
    return apiService.get<MaintenanceRequest[]>(`${this.baseUrl}/status/${status}`);
  }

  /**
   * Get maintenance request by ID
   */
  async getById(id: number): Promise<MaintenanceRequest> {
    return apiService.get<MaintenanceRequest>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create new maintenance request
   */
  async create(data: CreateMaintenanceRequest): Promise<MaintenanceRequest> {
    return apiService.post<MaintenanceRequest>(this.baseUrl, data);
  }

  /**
   * Update maintenance request status
   */
  async updateStatus(id: number, data: UpdateMaintenanceRequest): Promise<MaintenanceRequest> {
    return apiService.put<MaintenanceRequest>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Close maintenance request
   */
  async close(id: number, data: { status: string; adminNote?: string }): Promise<MaintenanceRequest> {
    return apiService.post<MaintenanceRequest>(`${this.baseUrl}/${id}/close`, data);
  }

  /**
   * Delete maintenance request
   */
  async delete(id: number): Promise<void> {
    return apiService.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Get issue type label in Vietnamese
   */
  getIssueTypeLabel(issueType: string): string {
    const types: Record<string, string> = {
      'elevator': 'Thang máy',
      'water': 'Nước',
      'electrical': 'Điện',
      'security': 'An ninh',
      'cleaning': 'Vệ sinh',
      'parking': 'Bãi xe',
      'noise': 'Tiếng ồn',
      'other': 'Khác',
    };
    return types[issueType] || issueType;
  }

  /**
   * Get issue type icon
   */
  getIssueTypeIcon(issueType: string): string {
    const icons: Record<string, string> = {
      'elevator': 'layers',
      'water': 'water',
      'electrical': 'flash',
      'security': 'lock-closed',
      'cleaning': 'brush',
      'parking': 'car',
      'noise': 'volume-high',
      'other': 'document-text',
    };
    return icons[issueType] || 'document-text';
  }

  /**
   * Get status label and color
   */
  getStatusInfo(status: string): { label: string; color: string; bgColor: string } {
    const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
      'Chờ xử lý': { label: 'Chờ xử lý', color: '#D97706', bgColor: '#FEF3C7' },
      'Đang xử lý': { label: 'Đang xử lý', color: '#2563EB', bgColor: '#DBEAFE' },
      'Hoàn thành': { label: 'Hoàn thành', color: '#059669', bgColor: '#D1FAE5' },
      'Yêu cầu sửa lại': { label: 'Yêu cầu sửa lại', color: '#DC2626', bgColor: '#FEE2E2' },
      'Từ chối': { label: 'Từ chối', color: '#DC2626', bgColor: '#FEE2E2' },
      'Đã đóng': { label: 'Đã đóng', color: '#6B7280', bgColor: '#F3F4F6' },
    };
    return statusMap[status] || { label: status, color: '#6B7280', bgColor: '#F3F4F6' };
  }
}

export default new MaintenanceService();
