// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5052',
  TIMEOUT: 30000,
} as const;

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/Auth/login',
    REGISTER: '/api/Auth/register',
    REFRESH: '/api/Auth/refresh',
    CHANGE_PASSWORD: '/api/Auth/change-password',
    LOGOUT: '/api/Auth/logout',
    ME: '/api/Auth/me',
  },
  
  // Users
  USERS: {
    BASE: '/api/Users',
    BY_ID: (id: number) => `/api/Users/${id}`,
    LOCK: (id: number) => `/api/Users/${id}/lock`,
    UNLOCK: (id: number) => `/api/Users/${id}/unlock`,
    RESET_PASSWORD: (id: number) => `/api/Users/${id}/reset-password`,
  },
  
  // Buildings
  BUILDINGS: {
    BASE: '/api/Buildings',
    BY_ID: (id: number) => `/api/Buildings/${id}`,
  },
  
  // Floors
  FLOORS: {
    BASE: '/api/Floors',
    BY_ID: (id: number) => `/api/Floors/${id}`,
    BY_BUILDING: (buildingId: number) => `/api/Floors/building/${buildingId}`,
  },
  
  // Rooms
  ROOMS: {
    BASE: '/api/Rooms',
    BY_ID: (id: number) => `/api/Rooms/${id}`,
    BY_FLOOR: (floorId: number) => `/api/Rooms/floor/${floorId}`,
    SEARCH: '/api/Rooms/search',
  },
  
  // Residents
  RESIDENTS: {
    BASE: '/api/Residents',
    BY_ID: (id: number) => `/api/Residents/${id}`,
    SEARCH: '/api/Residents/search',
  },
  
  // Contracts
  CONTRACTS: {
    BASE: '/api/HopDong',
    BY_ID: (id: number) => `/api/HopDong/${id}`,
    ACTIVE: '/api/HopDong/active',
    BY_ROOM: (roomId: number) => `/api/HopDong/room/${roomId}`,
    EXTEND: (id: number) => `/api/HopDong/${id}/extend`,
    TERMINATE: (id: number) => `/api/HopDong/${id}/terminate`,
    OCCUPANTS: (id: number) => `/api/HopDong/${id}/occupants`,
  },
  
  // Services
  SERVICES: {
    BASE: '/api/Services',
    BY_ID: (id: number) => `/api/Services/${id}`,
    PRICE_HISTORY: (id: number) => `/api/Services/${id}/price-history`,
  },
  
  // Invoices
  INVOICES: {
    BASE: '/api/HoaDon',
    BY_ID: (id: number) => `/api/HoaDon/${id}`,
    UNPAID: '/api/HoaDon/unpaid',
    DRAFTS: '/api/HoaDon/drafts',
    CALCULATE: (year: number, month: number) => `/api/HoaDon/calculate/${year}/${month}`,
    APPROVE: (id: number) => `/api/HoaDon/${id}/approve`,
    APPROVE_BATCH: '/api/HoaDon/approve-batch',
    REJECT: (id: number) => `/api/HoaDon/${id}/reject`,
    EDIT_DRAFT: (id: number) => `/api/HoaDon/${id}/edit-draft`,
    GENERATE: '/api/HoaDon/generate',
    FINALIZE: (id: number) => `/api/HoaDon/${id}/finalize`,
    DETAILS: (id: number) => `/api/HoaDon/${id}/details`,
    MY: '/api/HoaDon/my',
  },
  
  // Utility Readings
  UTILITY_READINGS: {
    MONTH: (year: number, month: number) => `/api/UtilityReadings/month/${year}/${month}`,
    RECORD_BATCH: '/api/UtilityReadings/record-batch',
  },
  
  // Payments
  PAYMENTS: {
    BASE: '/api/ThanhToan',
    BY_ID: (id: number) => `/api/ThanhToan/${id}`,
    BY_INVOICE: (invoiceId: number) => `/api/ThanhToan/invoice/${invoiceId}`,
    INITIATE: '/api/Payment/initiate',
    CALLBACK: '/api/Payment/callback',
    PENDING: (invoiceId: number) => `/api/Payment/pending/${invoiceId}`,
    CANCEL: (transactionId: number) => `/api/Payment/cancel/${transactionId}`,
    MY: '/api/ThanhToan/my',
  },
  
  // Meter Readings
  ELECTRICITY: {
    BASE: '/api/ChiSoDien',
    BY_ID: (id: number) => `/api/ChiSoDien/${id}`,
    BY_ROOM: (roomId: number) => `/api/ChiSoDien/room/${roomId}`,
    CALCULATE: '/api/ChiSoDien/calculate-cost',
  },
  
  WATER: {
    BASE: '/api/ChiSoNuoc',
    BY_ID: (id: number) => `/api/ChiSoNuoc/${id}`,
    BY_ROOM: (roomId: number) => `/api/ChiSoNuoc/room/${roomId}`,
  },
  
  // Settlement
  SETTLEMENT: {
    BASE: '/api/TatToan',
    BY_ID: (id: number) => `/api/TatToan/${id}`,
    APPROVE: (id: number) => `/api/TatToan/${id}/approve`,
    REJECT: (id: number) => `/api/TatToan/${id}/reject`,
  },
  
  // Assets
  ASSETS: {
    BASE: '/api/TaiSan',
    BY_ID: (id: number) => `/api/TaiSan/${id}`,
    ROOM_ASSETS: '/api/ChiTietTaiSanPhong',
    ROOM_ASSETS_BY_ASSET: (assetId: number) => `/api/ChiTietTaiSanPhong/asset/${assetId}`,
    ROOM_ASSETS_BY_ROOM: (roomId: number) => `/api/ChiTietTaiSanPhong/room/${roomId}`,
    ROOM_ASSETS_UPDATE: (roomId: number, assetId: number) => `/api/ChiTietTaiSanPhong/room/${roomId}/asset/${assetId}`,
    ROOM_ASSETS_DELETE: (roomId: number, assetId: number) => `/api/ChiTietTaiSanPhong/room/${roomId}/asset/${assetId}`,
  },
  
  // Vehicles
  VEHICLES: {
    BASE: '/api/Xe',
    BY_ID: (id: number) => `/api/Xe/${id}`,
    APPROVE: (id: number) => `/api/Xe/${id}/approve`,
    REJECT: (id: number) => `/api/Xe/${id}/reject`,
  },
  
  // Maintenance
  MAINTENANCE: {
    BASE: '/api/YeuCauSuaChua',
    BY_ID: (id: number) => `/api/YeuCauSuaChua/${id}`,
    UPDATE: (id: number) => `/api/YeuCauSuaChua/${id}`,
    CLOSE: (id: number) => `/api/YeuCauSuaChua/${id}/close`,
  },
  
  // Knowledge Base
  KNOWLEDGE: {
    BASE: '/api/KnowledgeBase',
    BY_ID: (id: number) => `/api/KnowledgeBase/${id}`,
    SEARCH: '/api/KnowledgeBase/search',
    BY_CATEGORY: (category: string) => `/api/KnowledgeBase/category/${category}`,
    UPLOAD_DOCUMENT: '/api/KnowledgeBase/upload-document',
  },
  
  // Chat
  CHAT: {
    HISTORY: '/api/Chat/history',
    CONVERSATION: '/api/Chat/conversation',
    SEND: '/api/Chat/send',
    ADMIN_ALL: '/api/Chat/admin/all',
  },
  
  // Debt Reminders
  DEBT_REMINDERS: {
    BASE: '/api/NhatKyNhacNo',
    BY_ID: (id: number) => `/api/NhatKyNhacNo/${id}`,
    BY_INVOICE: (invoiceId: number) => `/api/NhatKyNhacNo/invoice/${invoiceId}`,
    SEND: '/api/NhatKyNhacNo/send',
  },
  
  // Notifications
  NOTIFICATIONS: {
    MY: '/api/Notifications/my-notifications',
    BY_ID: (id: number) => `/api/Notifications/${id}`,
    MARK_READ: (id: number) => `/api/Notifications/${id}/read`,
  },
  
  // Audit Logs
  AUDIT_LOGS: {
    BASE: '/api/AuditLogs',
  },
  
  // Reports
  REPORTS: {
    DASHBOARD: '/api/Reports/dashboard',
    ROOMS: '/api/Reports/rooms',
    REVENUE: '/api/Reports/revenue',
    DEBT: '/api/Reports/debt',
    MONTHLY_REVENUE: '/api/Reports/revenue/monthly',
  },
  
  // File Upload
  FILE: {
    UPLOAD: '/api/File/upload',
    DELETE: (fileName: string) => `/api/File/${fileName}`,
  },
} as const;
