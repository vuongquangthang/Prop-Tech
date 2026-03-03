// ==================== AUTH DTOs ====================

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserDto;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserDto {
  id: number;
  phoneNumber: string;
  fullName: string;
  role: string;
  residentId?: number;
}

// ==================== NOTIFICATION DTOs ====================

export interface NotificationDto {
  id: number;
  title: string;
  message: string;
  type: string;
  targetAudience: string;
  isRead: boolean;
  createdAt: string;
}

// ==================== INVOICE DTOs ====================

export interface InvoiceDto {
  id: number;
  invoiceNumber: string;
  residencyId: number;
  billingPeriodId: number;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: string; // 'Pending' | 'Paid' | 'Overdue' | 'Cancelled'
  lineItems: InvoiceLineItemDto[];
}

export interface InvoiceLineItemDto {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ==================== COMPLAINT/INCIDENT DTOs ====================

export interface ComplaintDto {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  roomId?: number;
  reportedBy: number;
  createdAt: string;
  updatedAt: string;
  attachments: ComplaintAttachmentDto[];
  responses: ComplaintResponseDto[];
}

export interface ComplaintAttachmentDto {
  id: number;
  fileUrl: string;
  fileName: string;
  fileType: string;
}

export interface ComplaintResponseDto {
  id: number;
  message: string;
  respondedBy: number;
  respondedAt: string;
}

export interface CreateComplaintRequest {
  title: string;
  description: string;
  category: string;
  priority?: string;
  roomId?: number;
}

// ==================== RESIDENT DTOs ====================

export interface ResidentDto {
  id: number;
  fullName: string;
  phoneNumber?: string;
  idCardNumber?: string;
  hometown?: string;
}

export interface ResidencyDto {
  id: number;
  resident: ResidentDto;
  room: RoomDto;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface RoomDto {
  id: number;
  roomNumber: string;
  floorId: number;
  buildingName: string;
  area: number;
  status: string;
}

// ==================== API RESPONSE WRAPPER ====================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
