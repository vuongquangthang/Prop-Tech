import { api, handleApiError } from '../lib/api-client';
import { API_ENDPOINTS } from '../lib/api-config';

// Types
export interface DashboardStats {
  roomStats: RoomStats;
  revenueStats: RevenueStats;
  debtStats: DebtStats;
  residentStats: ResidentStats;
  vehicleStats: VehicleStats;
  maintenanceStats: MaintenanceStats;
}

export interface RoomStats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
}

export interface RevenueStats {
  currentMonthRevenue: number;
  lastMonthRevenue: number;
  yearToDateRevenue: number;
  averageMonthlyRevenue: number;
  growthRate: number;
}

export interface DebtStats {
  totalOutstanding: number;
  overdueInvoicesCount: number;
  overdueAmount: number;
  unpaidInvoicesCount: number;
}

export interface ResidentStats {
  totalResidents: number;
  activeContracts: number;
  newResidentsThisMonth: number;
}

export interface VehicleStats {
  totalVehicles: number;
  cars: number;
  motorcycles: number;
  bicycles: number;
}

export interface MaintenanceStats {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  rejectedRequests: number;
}

export interface MonthlyRevenue {
  month: number;
  year: number;
  totalRevenue: number;
  collectedRevenue?: number;
  outstandingRevenue?: number;
  roomRentRevenue: number;
  serviceRevenue: number;
  otherRevenue: number;
}

export interface ChatMessage {
  id: number;
  userId: number;
  userPhone: string;
  messageRole: string;
  messageText: string;
  isKnowledgeGap?: boolean;
  createdAt: string;
}

export interface UnansweredChatItem {
  assistantMessageId: number;
  userId: number;
  userPhone?: string;
  question: string;
  aiResponse: string;
  askedAt: string;
  isResolved: boolean;
}

export interface Notification {
  id: number;
  ownerUserId?: number;
  title: string;
  content: string;
  notificationType: string;
  relatedId?: number;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
  senderPhone?: string;
}

export interface MaintenanceRequest {
  id: number;
  roomId: number;
  roomNumber?: string;
  userId: number;
  userName?: string;
  issueType: string;
  description?: string;
  mediaUrls?: string; // JSON string array
  imageUrls?: string[]; // Parsed array (helper)
  status: string;
  adminNote?: string;
  completionImageUrl?: string;
  createdAt: string;
  closedAt?: string;
}

export interface KnowledgeBase {
  id: number;
  title: string;
  content: string;
  category: string;
  tags?: string;
  isActive: boolean;
  updatedAt?: string;
}

// Report Services
export const reportService = {
  getDashboard: async () => {
    try {
      const response = await api.get<DashboardStats>(API_ENDPOINTS.REPORTS.DASHBOARD);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getRoomStats: async () => {
    try {
      const response = await api.get<RoomStats>(API_ENDPOINTS.REPORTS.ROOMS);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getRevenueStats: async () => {
    try {
      const response = await api.get<RevenueStats>(API_ENDPOINTS.REPORTS.REVENUE);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getDebtStats: async () => {
    try {
      const response = await api.get<DebtStats>(API_ENDPOINTS.REPORTS.DEBT);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getMonthlyRevenue: async (year: number) => {
    try {
      const response = await api.get<MonthlyRevenue[]>(
        `${API_ENDPOINTS.REPORTS.MONTHLY_REVENUE}?year=${year}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Chat Services
/**
 * N8N Integration Service
 * Direct communication with n8n RAG system
 */
export const n8nService = {
  // Upload documents to n8n form endpoint for RAG processing
  uploadDocument: async (file: File): Promise<{ success: boolean; message?: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(
        'https://lhdpo.app.n8n.cloud/form/00211f43-8279-4906-81f9-1b0b97d8646b',
        {
          method: 'POST',
          body: formData,
        }
      );
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      return { success: true, message: 'Tài liệu đã được đồng bộ với AI' };
    } catch (error: any) {
      console.error('N8N upload error:', error);
      throw new Error(error?.message || 'Lỗi khi đồng bộ tài liệu với AI');
    }
  },

  // Send chat message via backend API (which calls n8n RAG webhook)
  sendChatMessage: async (message: string): Promise<{ text: string }> => {
    try {
      const response = await api.post<ChatMessage>(
        API_ENDPOINTS.CHAT.SEND,
        { messageText: message }
      );
      return { text: response.data.messageText };
    } catch (error: any) {
      console.error('Chat error:', error);
      throw new Error(error?.message || 'Lỗi khi gửi tin nhắn');
    }
  },
};

export const chatService = {
  getHistory: async (limit: number = 100) => {
    try {
      const response = await api.get<ChatMessage[]>(
        `${API_ENDPOINTS.CHAT.HISTORY}?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getAllHistory: async (limit: number = 1000) => {
    try {
      const response = await api.get<ChatMessage[]>(
        `${API_ENDPOINTS.CHAT.ADMIN_ALL}?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getUnanswered: async (limit: number = 200) => {
    try {
      const response = await api.get<UnansweredChatItem[]>(
        `${API_ENDPOINTS.CHAT.ADMIN_UNANSWERED}?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  resolveUnanswered: async (assistantMessageId: number, payload: { answerText: string; category?: string; activateImmediately?: boolean }) => {
    try {
      const response = await api.post<KnowledgeBase>(
        API_ENDPOINTS.CHAT.RESOLVE_UNANSWERED(assistantMessageId),
        payload
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Send message via backend API
  sendMessage: async (messageText: string) => {
    try {
      const response = await api.post<ChatMessage>(
        API_ENDPOINTS.CHAT.SEND,
        { messageText }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Notification Services
export const notificationService = {
  getMy: async (unreadOnly: boolean = false) => {
    try {
      const response = await api.get<Notification[]>(
        `${API_ENDPOINTS.NOTIFICATIONS.MY}?unreadOnly=${unreadOnly}`
      );
      return response.data;
    } catch (error) {
      console.warn('Notification list is unavailable:', handleApiError(error));
      return [];
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get<{ count: number }>(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      return response.data.count;
    } catch {
      return 0;
    }
  },

  markAsRead: async (id: number) => {
    try {
      await api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getAdminAll: async (limit: number = 200) => {
    try {
      const response = await api.get<Notification[]>(
        `${API_ENDPOINTS.NOTIFICATIONS.ADMIN_ALL}?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.warn('Admin notifications are unavailable:', handleApiError(error));
      return [];
    }
  },

  send: async (dto: { recipientId: number; title: string; content: string; notificationType?: string }) => {
    try {
      await api.post(API_ENDPOINTS.NOTIFICATIONS.SEND, dto);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  broadcast: async (dto: { title: string; content: string; notificationType?: string }) => {
    try {
      await api.post(API_ENDPOINTS.NOTIFICATIONS.BROADCAST, dto);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Maintenance Services
export const maintenanceService = {
  getAll: async () => {
    try {
      const response = await api.get<MaintenanceRequest[]>(API_ENDPOINTS.MAINTENANCE.BASE);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getById: async (id: number) => {
    try {
      const response = await api.get<MaintenanceRequest>(API_ENDPOINTS.MAINTENANCE.BY_ID(id));
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  create: async (data: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'userId' | 'closedAt' | 'adminNote' | 'status'>) => {
    try {
      const response = await api.post<MaintenanceRequest>(API_ENDPOINTS.MAINTENANCE.BASE, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  update: async (id: number, status?: string, adminNote?: string, completionImageUrl?: string) => {
    try {
      const response = await api.put<MaintenanceRequest>(
        API_ENDPOINTS.MAINTENANCE.UPDATE(id),
        { status, adminNote, completionImageUrl }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  close: async (id: number, status: string, adminNote?: string, completionImageUrl?: string) => {
    try {
      const response = await api.post<MaintenanceRequest>(
        API_ENDPOINTS.MAINTENANCE.CLOSE(id),
        { status, adminNote, completionImageUrl }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Knowledge Base Services
export const knowledgeService = {
  getAll: async () => {
    try {
      const response = await api.get<KnowledgeBase[]>(`${API_ENDPOINTS.KNOWLEDGE.BASE}?activeOnly=false`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  search: async (keyword: string) => {
    try {
      const response = await api.get<KnowledgeBase[]>(
        `${API_ENDPOINTS.KNOWLEDGE.SEARCH}?keyword=${keyword}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getByCategory: async (category: string) => {
    try {
      const response = await api.get<KnowledgeBase[]>(
        API_ENDPOINTS.KNOWLEDGE.BY_CATEGORY(category)
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  create: async (data: Omit<KnowledgeBase, 'id' | 'createdAt'>) => {
    try {
      const response = await api.post<KnowledgeBase>(API_ENDPOINTS.KNOWLEDGE.BASE, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  update: async (id: number, data: Partial<KnowledgeBase>) => {
    try {
      const response = await api.put<KnowledgeBase>(
        API_ENDPOINTS.KNOWLEDGE.BY_ID(id),
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  delete: async (id: number) => {
    try {
      await api.delete(API_ENDPOINTS.KNOWLEDGE.BY_ID(id));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  uploadDocument: async (file: File, category: string, autoActivate: boolean) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('autoActivate', String(autoActivate));
      const response = await api.post<{
        fileName: string;
        totalExtracted: number;
        activated: number;
        entries: KnowledgeBase[];
      }>(API_ENDPOINTS.KNOWLEDGE.UPLOAD_DOCUMENT, formData, {
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// File Upload Services
export const fileService = {
  upload: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post<{ url: string }>(API_ENDPOINTS.FILE.UPLOAD, formData);
      return response.data.url;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  delete: async (fileName: string) => {
    try {
      await api.delete(API_ENDPOINTS.FILE.DELETE(fileName));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

