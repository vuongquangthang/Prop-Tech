import type { CreatePostInput, PostRecord, RoomOption } from '../services/postService';

const STORAGE_KEY = 'prop-tech-posts-demo';

const placeholderImage =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640" fill="none">
      <rect width="960" height="640" rx="36" fill="#E5EEF9"/>
      <rect x="64" y="64" width="832" height="512" rx="28" fill="#FFFFFF" stroke="#C7D2E5" stroke-width="4" stroke-dasharray="18 14"/>
      <path d="M180 392L312 272L436 356L556 236L768 392" stroke="#1D4ED8" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="282" cy="248" r="34" fill="#60A5FA"/>
      <text x="480" y="476" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="#475569">Phòng đang chờ đăng tin</text>
    </svg>`
  );

const seedRooms: RoomOption[] = [
  {
    id: 101,
    floorId: 11,
    buildingId: 1,
    buildingName: 'Tòa A',
    floorNumber: 1,
    roomCode: 'A-101',
    area: 45,
    maxOccupants: 4,
    defaultRentPrice: 8500000,
    status: 'Trống',
  },
  {
    id: 108,
    floorId: 11,
    buildingId: 1,
    buildingName: 'Tòa A',
    floorNumber: 1,
    roomCode: 'A-108',
    area: 50,
    maxOccupants: 5,
    defaultRentPrice: 9000000,
    status: 'Trống',
  },
  {
    id: 205,
    floorId: 22,
    buildingId: 2,
    buildingName: 'Tòa B',
    floorNumber: 2,
    roomCode: 'B-205',
    area: 42,
    maxOccupants: 3,
    defaultRentPrice: 7800000,
    status: 'Đã thuê',
  },
  {
    id: 302,
    floorId: 31,
    buildingId: 3,
    buildingName: 'Tòa C',
    floorNumber: 3,
    roomCode: 'C-302',
    area: 60,
    maxOccupants: 6,
    defaultRentPrice: 12000000,
    status: 'Trống',
  },
];

const seedPosts: PostRecord[] = [
  {
    id: 1,
    roomId: 101,
    roomCode: 'A-101',
    buildingName: 'Tòa A',
    floorNumber: 1,
    area: 45,
    maxOccupants: 4,
    title: 'Phòng đẹp thoáng mát giá rẻ gần trường ĐH',
    baseRentPrice: 8500000,
    postDate: '2026-04-15T08:30:00.000Z',
    createdAt: '2026-04-15T08:30:00.000Z',
    views: 234,
    messages: 12,
    isLocked: false,
    status: 'active',
    roomStatus: 'Trống',
    moveInType: 'immediate',
    floodProne: false,
    landlordRequirements: 'Không nuôi thú cưng, không hút thuốc trong phòng',
    contactType: 'current',
    contactName: 'Nguyễn Văn A',
    contactPhone: '0912345678',
    servicePrices: [
      { key: 'electricity', name: 'Tiền điện', unit: 'kWh', price: 3500 },
      { key: 'water', name: 'Tiền nước', unit: 'm³', price: 25000 },
      { key: 'management', name: 'Phí quản lý', unit: 'Tháng', price: 500000 },
      { key: 'cleaning', name: 'Phí dọn rác', unit: 'Tháng', price: 50000 },
    ],
    imageUrls: [placeholderImage],
    coverImageUrl: placeholderImage,
    createdByUserRole: 'Admin',
  },
  {
    id: 2,
    roomId: 302,
    roomCode: 'C-302',
    buildingName: 'Tòa C',
    floorNumber: 3,
    area: 60,
    maxOccupants: 6,
    title: 'Căn hộ 2PN full nội thất sang trọng',
    baseRentPrice: 12000000,
    postDate: '2026-04-10T10:20:00.000Z',
    createdAt: '2026-04-10T10:20:00.000Z',
    views: 189,
    messages: 8,
    isLocked: true,
    status: 'active',
    roomStatus: 'Trống',
    moveInType: 'from-date',
    moveInDate: '2026-05-01',
    floodProne: false,
    landlordRequirements: 'Ưu tiên gia đình trẻ, giữ gìn nội thất',
    contactType: 'other',
    contactName: 'Trần Thị B',
    contactPhone: '0987654321',
    servicePrices: [
      { key: 'electricity', name: 'Tiền điện', unit: 'kWh', price: 3500 },
      { key: 'water', name: 'Tiền nước', unit: 'm³', price: 25000 },
      { key: 'management', name: 'Phí quản lý', unit: 'Tháng', price: 500000 },
      { key: 'internet', name: 'Internet', unit: 'Tháng', price: 200000 },
    ],
    imageUrls: [placeholderImage],
    coverImageUrl: placeholderImage,
    createdByUserRole: 'QuanLy',
  },
];

function readPostsFromStorage(): PostRecord[] {
  if (typeof window === 'undefined') {
    return seedPosts;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPosts));
    return seedPosts;
  }

  try {
    const parsed = JSON.parse(stored) as PostRecord[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Ignore corrupted local state and reset to the seed data.
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPosts));
  return seedPosts;
}

function writePostsToStorage(posts: PostRecord[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function getMockRooms(): RoomOption[] {
  return seedRooms;
}

export function getMockPosts(): PostRecord[] {
  return readPostsFromStorage();
}

export function createMockPost(input: CreatePostInput): PostRecord {
  const rooms = getMockRooms();
  const room = rooms.find((item) => item.id === input.roomId);
  const createdAt = new Date().toISOString();

  const newPost: PostRecord = {
    id: Date.now(),
    roomId: input.roomId,
    roomCode: room?.roomCode ?? `R-${input.roomId}`,
    buildingName: room?.buildingName ?? 'Chưa xác định',
    floorNumber: room?.floorNumber ?? 0,
    area: room?.area,
    maxOccupants: room?.maxOccupants,
    title: input.title,
    baseRentPrice: input.baseRentPrice,
    postDate: createdAt,
    createdAt,
    views: 0,
    messages: 0,
    isLocked: false,
    status: 'active',
    roomStatus: room?.status ?? 'Trống',
    moveInType: input.moveInType,
    moveInDate: input.moveInDate,
    floodProne: input.floodProne,
    landlordRequirements: input.landlordRequirements,
    contactType: input.contactType,
    contactName: input.contactName,
    contactPhone: input.contactPhone,
    servicePrices: input.servicePrices,
    imageUrls: input.imageUrls,
    coverImageUrl: input.imageUrls[0] ?? placeholderImage,
    createdByUserRole: 'Admin',
  };

  const posts = [newPost, ...readPostsFromStorage()];
  writePostsToStorage(posts);

  return newPost;
}

export function replaceMockPosts(posts: PostRecord[]): void {
  writePostsToStorage(posts);
}

export function toggleMockPostLock(postId: number, isLocked: boolean): PostRecord | null {
  const posts = readPostsFromStorage();
  const index = posts.findIndex((post) => post.id === postId);

  if (index < 0) {
    return null;
  }

  const updatedPost = {
    ...posts[index],
    isLocked,
    status: isLocked ? 'paused' : 'active',
  };

  posts[index] = updatedPost;
  writePostsToStorage(posts);

  return updatedPost;
}

export function deleteMockPost(postId: number): boolean {
  const posts = readPostsFromStorage();
  const nextPosts = posts.filter((post) => post.id !== postId);

  if (nextPosts.length === posts.length) {
    return false;
  }

  writePostsToStorage(nextPosts);
  return true;
}