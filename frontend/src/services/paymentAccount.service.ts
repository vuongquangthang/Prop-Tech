import apiClient from '../lib/api-client';

export interface PaymentAccount {
  id: number;
  ownerUserId: number;
  bankBin: string;
  bankAccountNo: string;
  accountHolder: string;
  bankName?: string;
  provider: string;
  isActive: boolean;
  connectedAt?: string;
}

export interface ConnectPaymentAccountInput {
  bankBin: string;
  bankAccountNo: string;
  accountHolder: string;
  bankName?: string;
}

export interface VietQrBank {
  bin: string;
  shortName: string;
  name: string;
  logo?: string;
}

export const paymentAccountService = {
  /** TK nhận tiền hiện tại của chủ nhà (null nếu chưa kết nối). */
  async get(): Promise<PaymentAccount | null> {
    const res = await apiClient.get('/api/payment-account');
    return res.data ?? null;
  },

  /** Kết nối / cập nhật TK nhận tiền. */
  async connect(input: ConnectPaymentAccountInput): Promise<PaymentAccount> {
    const res = await apiClient.post('/api/payment-account', input);
    return res.data;
  },

  /** Danh sách ngân hàng VN (từ VietQR) để chọn — trả về bin + tên. */
  async getBanks(): Promise<VietQrBank[]> {
    try {
      const res = await fetch('https://api.vietqr.io/v2/banks');
      const json = await res.json();
      return (json?.data ?? []).map((b: any) => ({
        bin: b.bin,
        shortName: b.shortName,
        name: b.name,
        logo: b.logo,
      }));
    } catch {
      return [];
    }
  },
};
