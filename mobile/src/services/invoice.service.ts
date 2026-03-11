import apiService from './api.service';

// Types matching backend DTOs
export interface InvoiceLineItem {
  id: number;
  itemType: 'TienPhong' | 'Dien' | 'Nuoc' | 'DichVu' | 'PhatSinh' | 'KhauTru';
  serviceId?: number;
  serviceName?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  subtotal: number;
  description?: string;
}

export interface Invoice {
  id: number;
  contractId: number;
  roomId?: number;
  roomNumber?: string;
  month: number;
  year: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  dueDate?: string;
  paidDate?: string;
  qrCodeUrl?: string;
  lineItems: InvoiceLineItem[];
}

export interface CreateInvoice {
  contractId: number;
  month: number;
  year: number;
  dueDate?: string;
  lineItems: CreateInvoiceLineItem[];
}

export interface CreateInvoiceLineItem {
  itemType: string;
  serviceId?: number;
  quantity?: number;
  unitPrice?: number;
  description?: string;
}

export interface PayInvoice {
  amount: number;
  paymentType: 'Tiền mặt' | 'Chuyển khoản' | 'Thẻ' | 'Khác';
  transactionCode?: string;
}

class InvoiceService {
  private baseUrl = '/api/HoaDon';

  /**
   * Get all invoices (only approved/paid - excludes Nháp)
   */
  async getAll(): Promise<Invoice[]> {
    const all = await apiService.get<Invoice[]>(this.baseUrl);
    // Filter out draft invoices - residents should not see Nháp
    return all.filter(inv => inv.status !== 'Nháp' && inv.status !== 'Bị từ chối');
  }

  /**
   * Get unpaid invoices
   */
  async getUnpaid(): Promise<Invoice[]> {
    return apiService.get<Invoice[]>(`${this.baseUrl}/unpaid`);
  }

  /**
   * Get invoices by contract
   */
  async getByContract(contractId: number): Promise<Invoice[]> {
    return apiService.get<Invoice[]>(`${this.baseUrl}/contract/${contractId}`);
  }

  /**
   * Get invoice by ID
   */
  async getById(id: number): Promise<Invoice> {
    return apiService.get<Invoice>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create new invoice
   */
  async create(data: CreateInvoice): Promise<Invoice> {
    return apiService.post<Invoice>(this.baseUrl, data);
  }

  /**
   * Pay invoice
   */
  async pay(id: number, data: PayInvoice): Promise<Invoice> {
    return apiService.post<Invoice>(`${this.baseUrl}/${id}/pay`, data);
  }

  /**
   * Delete invoice
   */
  async delete(id: number): Promise<void> {
    return apiService.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Get line item type label in Vietnamese
   */
  getLineItemTypeLabel(itemType: string): string {
    const types: Record<string, string> = {
      'TienPhong': 'Tiền phòng',
      'Dien': 'Tiền điện',
      'Nuoc': 'Tiền nước',
      'DichVu': 'Dịch vụ',
      'PhatSinh': 'Phát sinh',
      'KhauTru': 'Khấu trừ',
    };
    return types[itemType] || itemType;
  }

  /**
   * Format currency VND
   */
  formatCurrency(amount: number): string {
    return amount.toLocaleString('vi-VN') + ' đ';
  }

  /**
   * Format month/year
   */
  formatPeriod(month: number, year: number): string {
    return `Tháng ${String(month).padStart(2, '0')}/${year}`;
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): { color: string; bgColor: string } {
    const statusMap: Record<string, { color: string; bgColor: string }> = {
      'Chưa thanh toán': { color: '#D97706', bgColor: '#FEF3C7' },
      'Đã thanh toán': { color: '#059669', bgColor: '#D1FAE5' },
      'Quá hạn': { color: '#DC2626', bgColor: '#FEE2E2' },
      'Thanh toán một phần': { color: '#1A4B84', bgColor: '#E8F0FB' },
    };
    return statusMap[status] || { color: '#6B7280', bgColor: '#F3F4F6' };
  }

  /**
   * Check if invoice is overdue
   */
  isOverdue(invoice: Invoice): boolean {
    if (!invoice.dueDate || invoice.status === 'Đã thanh toán') return false;
    return new Date(invoice.dueDate) < new Date();
  }

  /**
   * Check if invoice is "new" (approved/created within 48 hours)
   */
  isNew(invoice: Invoice): boolean {
    if (!invoice.dueDate) return false;
    // We use dueDate as a proxy; ideally use approvedAt but it's not in this DTO
    // For now mark as new if created in the last 48h based on current date vs month/year
    const now = new Date();
    const invoiceDate = new Date(invoice.year, invoice.month - 1, 1);
    const diffMs = now.getTime() - invoiceDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= 2 && invoice.status === 'Chưa thanh toán';
  }

  /**
   * Get days until due
   */
  getDaysUntilDue(invoice: Invoice): number | null {
    if (!invoice.dueDate) return null;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}

export default new InvoiceService();
