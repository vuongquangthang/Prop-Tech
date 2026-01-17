const API_BASE_URL = 'http://localhost:5052/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  setTokens(token, refreshToken) {
    this.token = token;
    this.refreshToken = refreshToken;
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearTokens();
          window.location.href = '/login';
        }
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Auth
  async login(phoneNumber, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, password }),
      headers: { 'Content-Type': 'application/json' },
    });
    this.setTokens(response.accessToken, response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearTokens();
    }
  }

  async changePassword(oldPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  // Invoices
  async getMyInvoices() {
    return this.request('/invoices/my');
  }

  async getInvoicesByPeriod(billingPeriodId) {
    return this.request(`/invoices/period/${billingPeriodId}`);
  }

  async getInvoiceDetail(id) {
    return this.request(`/invoices/${id}/detail`);
  }

  async getInvoicesByRoom(roomId) {
    return this.request(`/invoices/room/${roomId}`);
  }

  async generateDraftInvoices(billingPeriodId) {
    return this.request(`/invoices/period/${billingPeriodId}/generate`, {
      method: 'POST',
    });
  }

  async adjustInvoice(id, adjustmentAmount, adjustmentNote) {
    return this.request(`/invoices/${id}/adjust`, {
      method: 'PUT',
      body: JSON.stringify({ adjustmentAmount, adjustmentNote }),
    });
  }

  async confirmInvoice(id) {
    return this.request(`/invoices/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async voidInvoice(id, reason) {
    return this.request(`/invoices/${id}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Complaints
  async getMyComplaints() {
    return this.request('/complaints');
  }

  async getComplaintById(id) {
    return this.request(`/complaints/${id}`);
  }

  async getComplaintsByRoom(roomId) {
    return this.request(`/complaints/room/${roomId}`);
  }

  async createComplaint(roomId, category, subject, description) {
    return this.request('/complaints', {
      method: 'POST',
      body: JSON.stringify({ roomId, category, subject, description }),
    });
  }

  async updateComplaint(id, status, responseText) {
    return this.request(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, responseText }),
    });
  }

  async uploadComplaintAttachment(complaintId, file) {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/attachments`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload Error: ${response.status}`);
    }

    return await response.json();
  }

  // Billing Periods
  async getBillingPeriods() {
    return this.request('/billing-periods');
  }

  async createBillingPeriod(periodMonth, periodYear, dueDate) {
    return this.request('/billing-periods', {
      method: 'POST',
      body: JSON.stringify({ periodMonth, periodYear, dueDate }),
    });
  }

  // Reports
  async getDashboard() {
    return this.request('/reports/dashboard');
  }

  async getRoomStatusByBuilding() {
    return this.request('/reports/room-status/buildings');
  }

  async getReceivablesReport() {
    return this.request('/reports/receivables');
  }

  async getRevenueReport() {
    return this.request('/reports/revenue');
  }

  async getComplaintStats() {
    return this.request('/reports/complaints');
  }

  // Buildings/Rooms
  async getBuildings() {
    return this.request('/buildings');
  }

  async getRoomsByBuilding(buildingId) {
    return this.request(`/api/floors/building/${buildingId}`);
  }
}

export default new ApiService();
