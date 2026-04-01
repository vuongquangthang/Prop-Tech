import apiService from './api.service';

export interface ContractChangeDetail {
  notificationId: number;
  status: 'PENDING' | 'DISCUSSING' | 'CONFIRMED';
  createdAt: string;
  effectiveDate: string;
  contractId: number;
  contractCode?: string;
  roomId: number;
  roomNumber?: string;
  currentRentPrice: number;
  proposedRentPrice?: number;
  note?: string;
  residentMessage?: string;
  servicePriceChanges: Array<{
    serviceId: number;
    serviceName: string;
    currentPrice: number;
    newPrice: number;
  }>;
  addedServices: Array<{
    serviceId: number;
    serviceName: string;
    unitPrice: number;
    unit?: string;
  }>;
}

class ContractChangeService {
  async getDetail(notificationId: number): Promise<ContractChangeDetail> {
    return apiService.get<ContractChangeDetail>(`/api/HopDong/change-request/${notificationId}`);
  }

  async confirm(notificationId: number): Promise<void> {
    await apiService.post(`/api/HopDong/change-request/${notificationId}/confirm`, {});
  }

  async discuss(notificationId: number, message?: string): Promise<void> {
    await apiService.post(`/api/HopDong/change-request/${notificationId}/discuss`, {
      message,
    });
  }
}

export default new ContractChangeService();
