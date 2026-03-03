import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from './api.service';

const API_URL = API_BASE_URL;

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
};

export interface InitiatePaymentRequest {
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  returnUrl?: string;
  notes?: string;
}

export interface InitiatePaymentResponse {
  transactionId: number;
  transactionCode: string;
  status: string;
  amount: number;
  qrCodeUrl: string;
  paymentUrl: string;
}

export interface PendingPayment {
  id: number;
  invoiceId: number | null;
  amount: number;
  paymentType: string | null;
  transactionCode: string | null;
  status: string;
  createdAt: string;
  paidAt: string | null;
  invoiceReference: string | null;
}

class PaymentService {
  private async getAuthHeaders() {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Initiate a new payment transaction
   */
  async initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/api/Payment/initiate`,
        request,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Initiate payment error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Không thể khởi tạo thanh toán');
    }
  }

  /**
   * Get pending payment for an invoice (if exists)
   */
  async getPendingPayment(invoiceId: number): Promise<PendingPayment | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(
        `${API_URL}/api/Payment/pending/${invoiceId}`,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Get pending payment error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Không thể kiểm tra giao dịch');
    }
  }

  /**
   * Confirm payment as SUCCESS (mock - resident confirms they've transferred)
   */
  async confirmPayment(transactionCode: string): Promise<void> {
    try {
      await axios.post(
        `${API_URL}/api/Payment/callback`,
        {
          transactionCode,
          status: 'SUCCESS',
          paidAt: new Date().toISOString(),
        }
      );
    } catch (error: any) {
      console.error('Confirm payment error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Không thể xác nhận thanh toán');
    }
  }

  /**
   * Cancel a pending payment transaction
   */
  async cancelPayment(transactionId: number): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      await axios.post(
        `${API_URL}/api/Payment/cancel/${transactionId}`,
        {},
        { headers }
      );
    } catch (error: any) {
      console.error('Cancel payment error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Không thể hủy giao dịch');
    }
  }

  /**
   * Get the full payment gateway URL (for opening in browser)
   */
  getGatewayUrl(paymentUrl: string): string {
    // paymentUrl is like "/payment/gateway?txn=..."
    return `${API_URL}${paymentUrl}`;
  }
}

export default new PaymentService();
