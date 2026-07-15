export type RoommatePostStatus = 'open' | 'closed';

export type RoomService = {
  name: string;
  price: number;
  unit: string;
};

export type RoomPricing = {
  roomPrice: number;
  electricity: number;
  water: number;
  management: number;
};

export type RoomInfo = {
  images: string[];
  roomCode: string;
  location: string;
  area: string;
  maxOccupants: number;
  rentPrice: number;
  roomType: string;
  hasPrivateBathroom: boolean;
  amenities: string[];
  services: RoomService[];
  pricing: RoomPricing;
};

export type RoommatePost = {
  id: number;
  room: string;
  currentOccupants: number;
  needMore: number;
  postedDate: string;
  lastUpdated: string;
  views: number;
  pendingMessages: number;
  status: RoommatePostStatus;
  editHistory: number;
};

export type MessageConversation = {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  unreadCount: number;
  isOnline: boolean;
};

export type EditHistoryItem = {
  id: number;
  version: string;
  date: string;
  time: string;
  changes: string[];
  isCurrent: boolean;
};

export const roommatePost: RoommatePost = {
  id: 1,
  room: 'Phòng B02-301',
  currentOccupants: 2,
  needMore: 1,
  postedDate: '15/10/2023',
  lastUpdated: '20/10/2023',
  views: 156,
  pendingMessages: 5,
  status: 'open',
  editHistory: 3,
};

export const roomInfo: RoomInfo = {
  images: [
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
  ],
  roomCode: 'B-105',
  location: 'Tầng 1 - Tòa B',
  area: '42 m²',
  maxOccupants: 3,
  rentPrice: 7800000,
  roomType: 'Phòng đơn',
  hasPrivateBathroom: false,
  amenities: ['Điều hòa', 'Giường', 'Bàn làm việc'],
  services: [
    { name: 'Tiền điện', price: 3500, unit: 'VNĐ/kWh' },
    { name: 'Tiền nước', price: 25000, unit: 'VNĐ/m³' },
    { name: 'Phí quản lý', price: 500000, unit: 'VNĐ/tháng' },
  ],
  pricing: {
    roomPrice: 7800000,
    electricity: 350000,
    water: 100000,
    management: 500000,
  },
};

export const postDetail = {
  id: 1,
  status: 'open' as RoommatePostStatus,
  postedDate: '15/10/2023',
  views: 156,
  pendingMessages: 5,
  roomInfo,
  currentOccupants: 2,
  needMore: 1,
  pricing: {
    roomPrice: { before: 7800000, after: 2600000 },
    electricity: { before: 350000, after: 120000 },
    water: { before: 100000, after: 35000 },
    management: { before: 500000, after: 170000 },
  },
  moveInType: 'date' as 'now' | 'date',
  moveInDate: '20/08/2026',
  floodZone: false,
  requirements: 'Không nuôi thú cưng, không hút thuốc trong phòng. Giờ giấc sinh hoạt điều độ.',
  contactName: 'Nguyễn Văn A',
  contactPhone: '0912345678',
};

export const currentAccount = {
  name: 'Nguyễn Văn A',
  phone: '0912345678',
};

export const conversations: MessageConversation[] = [
  {
    id: 1,
    name: 'Nguyễn Văn An',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    lastMessage: 'Cho mình hỏi phòng còn chỗ không ạ?',
    time: '5 phút',
    unread: true,
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: 2,
    name: 'Trần Thị Bình',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    lastMessage: 'Mình có thể đến xem phòng vào cuối tuần này được không?',
    time: '15 phút',
    unread: true,
    unreadCount: 1,
    isOnline: false,
  },
  {
    id: 3,
    name: 'Lê Minh Cường',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    lastMessage: 'Anh ơi, giá phòng có thương lượng được không ạ?',
    time: '1 giờ',
    unread: true,
    unreadCount: 3,
    isOnline: true,
  },
  {
    id: 4,
    name: 'Võ Thị Phương',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    lastMessage: 'Cảm ơn bạn nhé, mình sẽ liên hệ lại sau',
    time: 'Hôm qua',
    unread: false,
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: 5,
    name: 'Đặng Quốc Giang',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
    lastMessage: 'OK anh, em hiểu rồi ạ',
    time: 'Hôm qua',
    unread: false,
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 6,
    name: 'Bùi Thanh Hà',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    lastMessage: 'Mình đã tìm được phòng rồi, cảm ơn bạn!',
    time: '2 ngày',
    unread: false,
    unreadCount: 0,
    isOnline: false,
  },
];

export const editHistory: EditHistoryItem[] = [
  {
    id: 1,
    version: 'Phiên bản hiện tại',
    date: '20/10/2023',
    time: '14:30',
    changes: ['Cập nhật số người cần tìm', 'Sửa yêu cầu từ cư dân'],
    isCurrent: true,
  },
  {
    id: 2,
    version: 'Phiên bản 2',
    date: '18/10/2023',
    time: '09:15',
    changes: ['Cập nhật giá sau khi chia', 'Thêm yêu cầu không hút thuốc'],
    isCurrent: false,
  },
  {
    id: 3,
    version: 'Phiên bản 1',
    date: '15/10/2023',
    time: '10:00',
    changes: ['Tạo bài đăng lần đầu'],
    isCurrent: false,
  },
];

export const formatCurrency = (amount: number): string => new Intl.NumberFormat('vi-VN').format(amount);
