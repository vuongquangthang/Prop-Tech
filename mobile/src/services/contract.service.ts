import apiService from './api.service';
import { useAuthStore } from '../store/authStore';

export interface ContractResident {
  residentId: number;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  idCardNumber?: string;
  hometown?: string;
  residencyRole: string;
  fromDate: string;
  toDate?: string | null;
}

export interface ContractDetail {
  id: number;
  contractCode?: string;
  roomId: number;
  roomNumber?: string;
  startDate: string;
  expectedEndDate?: string | null;
  actualRentPrice: number;
  depositAmount?: number | null;
  paymentDayOfMonth?: number | null;
  billingFormulaJson?: string | null;
  BillingFormulaJson?: string | null;
  residents: ContractResident[];
  status?: string;
}

class ContractService {
  async getById(id: number): Promise<ContractDetail> {
    return apiService.get<ContractDetail>(`/api/HopDong/${id}`);
  }

  /**
   * Lấy danh sách hợp đồng còn hiệu lực gắn với cư dân hiện tại
   */
  async getMyContracts(): Promise<ContractDetail[]> {
    const state = useAuthStore.getState();
    const residentId = state.user?.residentId;
    if (!residentId) return [];

    try {
      return await apiService.get<ContractDetail[]>('/api/HopDong/my');
    } catch (error) {
      // Backward compatibility for backend versions before /api/HopDong/my.
      const allActive = await apiService.get<ContractDetail[]>('/api/HopDong/active');
      return allActive.filter((contract) =>
        contract.residents?.some((resident) => resident.residentId === residentId)
      );
    }
  }
}

export const contractService = new ContractService();
