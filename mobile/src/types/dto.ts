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
  residentName?: string;
  role: string;
  residentId?: number;
  mustChangePassword?: boolean;
  isLocked?: boolean;
  email?: string;
  address?: string;
  avatarUrl?: string;
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

// ==================== ROOMMATE POST DTOs ====================

export interface PostServiceLineItemDto {
  key: string;
  name: string;
  unit: string;
  price: number;
}

export interface PostDto {
  id: number;
  roomId: number;
  roomCode: string;
  buildingName: string;
  floorNumber: number;
  area?: number | null;
  maxOccupants?: number | null;
  currentOccupants?: number | null;
  title: string;
  baseRentPrice: number;
  postDate: string;
  createdAt: string;
  views: number;
  messages: number;
  isLocked: boolean;
  status: string;
  roomStatus: string;
  moveInType: string;
  moveInDate?: string | null;
  floodProne: boolean;
  landlordRequirements?: string | null;
  contactType: string;
  contactName: string;
  contactPhone: string;
  servicePrices: PostServiceLineItemDto[];
  amenities?: string[];
  imageUrls: string[];
  coverImageUrl?: string | null;
  createdByUserId?: number | null;
}

export interface CreatePostDto {
  roomId: number;
  title: string;
  baseRentPrice: number;
  moveInType: string;
  moveInDate?: string | null;
  floodProne: boolean;
  landlordRequirements?: string | null;
  contactType: string;
  contactName: string;
  contactPhone: string;
  servicePrices: PostServiceLineItemDto[];
  amenities?: string[];
  imageUrls: string[];
}

export interface UpdatePostLockDto {
  isLocked: boolean;
}

export interface UpdatePostDto {
  title?: string;
  baseRentPrice?: number;
  maxOccupants?: number;
  currentOccupants?: number;
  moveInType?: string;
  moveInDate?: string | null;
  floodProne?: boolean;
  landlordRequirements?: string | null;
  contactType?: string;
  contactName?: string;
  contactPhone?: string;
  servicePrices?: PostServiceLineItemDto[];
  amenities?: string[];
  imageUrls?: string[];
}

export interface PostEditHistoryDto {
  id: number;
  version: string;
  summary: string;
  changedBy?: string | null;
  changedAt: string;
  isCurrent: boolean;
  changes: string[];
}

export interface PostMessageParticipantDto {
  userId: string;
  displayName: string;
  phoneNumber: string;
  avatarUrl?: string | null;
}

export interface PostConversationDto {
  conversationId: string;
  postId: number;
  postTitle: string;
  roomCode: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhone: string;
  otherUserAvatarUrl?: string | null;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderUserId: number;
  unreadCount: number;
  isUnread: boolean;
}

export interface PostMessageDto {
  id: string | number;
  conversationId: string;
  postId: number;
  content: string;
  createdAt: string;
  readAt?: string | null;
  isMine: boolean;
  status: string;
}

export interface PostConversationDetailDto {
  conversationId: string;
  postId: number;
  postTitle: string;
  roomCode: string;
  me: PostMessageParticipantDto;
  otherUser: PostMessageParticipantDto;
  messages: PostMessageDto[];
}

export interface SendPostMessageDto {
  conversationId: string;
  content: string;
}
