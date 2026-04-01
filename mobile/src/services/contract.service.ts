import apiService from './api.service';

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
}

export const contractService = new ContractService();
