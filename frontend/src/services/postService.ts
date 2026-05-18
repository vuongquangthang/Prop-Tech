import { api, handleApiError } from '../lib/api-client';
import { API_CONFIG, API_ENDPOINTS } from '../lib/api-config';
import { createMockPost, deleteMockPost, getMockPosts, getMockRooms, toggleMockPostLock, replaceMockPosts } from '../mocks/postsMock';

const POST_AMENITIES_CACHE_KEY = 'prop-tech-post-amenities-cache';

export interface RoomOption {
  id: number;
  floorId: number;
  buildingId: number;
  buildingName: string;
  floorNumber: number;
  roomCode: string;
  area?: number | null;
  maxOccupants?: number | null;
  defaultRentPrice?: number | null;
  status: string;
  services?: PostServiceLineItem[];
  amenities?: string[];
}

export interface PostServiceLineItem {
  key: string;
  name: string;
  unit: string;
  price: number;
}

export interface PostRecord {
  id: number;
  roomId: number;
  roomCode: string;
  buildingName: string;
  floorNumber: number;
  area?: number | null;
  maxOccupants?: number | null;
  title: string;
  baseRentPrice: number;
  postDate: string;
  createdAt: string;
  views: number;
  messages: number;
  isLocked: boolean;
  status: 'active' | 'paused' | 'draft';
  roomStatus: string;
  moveInType: 'immediate' | 'from-date';
  moveInDate?: string;
  floodProne: boolean;
  landlordRequirements: string;
  contactType: 'current' | 'other';
  contactName: string;
  contactPhone: string;
  servicePrices: PostServiceLineItem[];
  description?: string;
  address?: string;
  amenities?: string[];
  imageUrls: string[];
  coverImageUrl?: string;
}

export interface CreatePostInput {
  roomId: number;
  title: string;
  baseRentPrice: number;
  moveInType: 'immediate' | 'from-date';
  moveInDate?: string;
  floodProne: boolean;
  landlordRequirements: string;
  contactType: 'current' | 'other';
  contactName: string;
  contactPhone: string;
  servicePrices: PostServiceLineItem[];
  amenities?: string[];
  imageUrls: string[];
}

function normalizeRoomAmenities(room: any): string[] {
  const raw = room?.amenities ?? room?.features ?? [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return item.name ?? item.assetName ?? item.label ?? '';
        return '';
      })
      .map((item) => String(item ?? '').trim())
      .filter(Boolean);
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item ?? '').trim()).filter(Boolean);
      }
    } catch {
      return raw.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  return [];
}

function normalizeAmenityStrings(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);
}

function readPostAmenitiesCache(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(POST_AMENITIES_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const entries = Object.entries(parsed as Record<string, unknown>).map(([postId, amenities]) => [postId, normalizeAmenityStrings(amenities)]);
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

function writePostAmenitiesCache(cache: Record<string, string[]>): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(POST_AMENITIES_CACHE_KEY, JSON.stringify(cache));
}

function persistPostAmenities(postId: number, amenities: string[] | undefined): void {
  if (!postId || !amenities?.length) return;
  const cache = readPostAmenitiesCache();
  cache[String(postId)] = normalizeAmenityStrings(amenities);
  writePostAmenitiesCache(cache);
}

function applyCachedAmenities(post: PostRecord): PostRecord {
  const cache = readPostAmenitiesCache();
  const cachedAmenities = normalizeAmenityStrings(cache[String(post.id)]);
  const currentAmenities = normalizeAmenityStrings(post.amenities);

  if (currentAmenities.length > 0) {
    if (JSON.stringify(currentAmenities) !== JSON.stringify(cachedAmenities)) {
      cache[String(post.id)] = currentAmenities;
      writePostAmenitiesCache(cache);
    }
    return post;
  }

  if (cachedAmenities.length > 0) {
    return {
      ...post,
      amenities: cachedAmenities,
    };
  }

  return post;
}

function normalizeRoomServices(room: any): PostServiceLineItem[] {
  const raw = room?.services ?? room?.servicePrices ?? room?.lineItems ?? [];
  if (!Array.isArray(raw)) return [];

  return raw.map((item: any, index: number) => ({
    key: item?.key ?? `service-${index}`,
    name: item?.name ?? item?.serviceName ?? 'Dịch vụ',
    unit: item?.unit ?? '',
    price: Number(item?.price ?? item?.unitPrice ?? item?.amount ?? 0),
  }));
}

function mapRoomDto(room: any): RoomOption {
  return {
    id: Number(room.id ?? 0),
    floorId: Number(room.floorId ?? 0),
    buildingId: Number(room.buildingId ?? 0),
    buildingName: room.buildingName ?? room.building ?? 'Chưa xác định',
    floorNumber: Number(room.floorNumber ?? 0),
    roomCode: room.roomCode ?? room.code ?? `R-${room.id ?? 'unknown'}`,
    area: room.area ?? null,
    maxOccupants: room.maxOccupants ?? room.maxPeople ?? null,
    defaultRentPrice: room.defaultRentPrice ?? room.price ?? null,
    status: room.status ?? 'Trống',
    services: normalizeRoomServices(room),
    amenities: normalizeRoomAmenities(room),
  };
}

function resolvePostImageUrl(url: string): string {
  const trimmed = String(url ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;

  const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/+$/, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${baseUrl}${path}`;
}

function normalizePostImageUrls(post: any): string[] {
  const rawSources = post?.imageUrls ?? post?.images ?? post?.mediaUrls ?? [];

  let urls: any[] = [];
  if (Array.isArray(rawSources)) {
    urls = rawSources;
  } else if (typeof rawSources === 'string') {
    const raw = rawSources.trim();
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        urls = Array.isArray(parsed) ? parsed : [raw];
      } catch {
        urls = raw.includes(',') ? raw.split(',') : [raw];
      }
    }
  }

  return urls
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') return item.url ?? item.imageUrl ?? item.path ?? '';
      return '';
    })
    .map(resolvePostImageUrl)
    .filter(Boolean);
}

function normalizePostAmenities(post: any, roomObj: any): string[] {
  const raw = post?.amenities ?? roomObj?.amenities ?? [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return item.name ?? item.assetName ?? item.label ?? '';
        return '';
      })
      .map((item) => String(item ?? '').trim())
      .filter(Boolean);
  }

  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeServicePrices(post: any): PostServiceLineItem[] {
  const raw = post?.servicePrices ?? post?.services ?? post?.lineItems ?? [];
  if (!Array.isArray(raw)) return [];

  return raw.map((item: any, index: number) => ({
    key: item?.key ?? `service-${index}`,
    name: item?.name ?? item?.serviceName ?? 'Dịch vụ',
    unit: item?.unit ?? '',
    price: Number(item?.price ?? item?.unitPrice ?? item?.amount ?? 0),
  }));
}

function normalizePostRecord(post: any): PostRecord {
  // Debug: log incoming post object to help trace missing roomCode/buildingName
  try {
    // keep lightweight logging
    // eslint-disable-next-line no-console
    console.log('[postService] normalizePostRecord input:', { id: post?.id, roomId: post?.roomId, roomCode: post?.roomCode, buildingName: post?.buildingName });
  } catch (e) {
    // ignore logging errors
  }
  const createdAt = post.createdAt ?? post.postDate ?? new Date().toISOString();

  const roomObj = post.room ?? post.roomDto ?? null;

  const resolvedRoomCode =
    post.roomCode ?? (roomObj ? roomObj.roomCode ?? roomObj.code ?? roomObj.codeText ?? undefined : undefined) ?? 'Chưa xác định';

  const resolvedBuildingName =
    post.buildingName ?? (roomObj ? roomObj.buildingName ?? roomObj.building ?? roomObj.buildingText ?? undefined : undefined) ?? 'Chưa xác định';

  const resolvedFloorNumber = Number(post.floorNumber ?? (roomObj ? roomObj.floorNumber ?? roomObj.floor ?? 0 : 0));

  const normalizedImageUrls = normalizePostImageUrls(post);
  const normalizedCoverImageUrl = resolvePostImageUrl(post.coverImageUrl ?? normalizedImageUrls[0] ?? '');
  const finalImageUrls = normalizedImageUrls.length > 0
    ? normalizedImageUrls
    : (normalizedCoverImageUrl ? [normalizedCoverImageUrl] : []);
  const normalizedAmenities = normalizePostAmenities(post, roomObj);
  const resolvedAddress =
    post.address ??
    post.location ??
    post.roomAddress ??
    roomObj?.address ??
    `${resolvedBuildingName} - Tầng ${resolvedFloorNumber} - ${resolvedRoomCode}`;

  return {
    id: Number(post.id ?? Date.now()),
    roomId: Number(post.roomId ?? (roomObj ? roomObj.id ?? roomObj.roomId ?? 0 : 0)),
    roomCode: resolvedRoomCode,
    buildingName: resolvedBuildingName,
    floorNumber: resolvedFloorNumber,
    area: post.area ?? null,
    maxOccupants: post.maxOccupants ?? null,
    title: post.title ?? '',
    baseRentPrice: Number(post.baseRentPrice ?? post.price ?? 0),
    postDate: post.postDate ?? createdAt,
    createdAt,
    views: Number(post.views ?? 0),
    messages: Number(post.messages ?? 0),
    isLocked: Boolean(post.isLocked ?? false),
    status: post.status ?? 'active',
    roomStatus: post.roomStatus ?? post.statusRoom ?? 'Trống',
    moveInType: post.moveInType ?? 'immediate',
    moveInDate: post.moveInDate ?? post.availableFrom ?? post.availableDate,
    floodProne: Boolean(post.floodProne ?? false),
    landlordRequirements: post.landlordRequirements ?? '',
    contactType: post.contactType ?? 'current',
    contactName: post.contactName ?? '',
    contactPhone: post.contactPhone ?? '',
    servicePrices: normalizeServicePrices(post),
    description: post.description ?? post.content ?? post.landlordRequirements ?? '',
    address: resolvedAddress,
    amenities: normalizedAmenities,
    imageUrls: finalImageUrls,
    coverImageUrl: normalizedCoverImageUrl,
  };
}

export const postService = {
  getRooms: async (): Promise<RoomOption[]> => {
    try {
      const response = await api.get(API_ENDPOINTS.ROOMS.BASE);
      const rooms = Array.isArray(response.data) ? response.data : [];
      return rooms.map(mapRoomDto);
    } catch {
      return getMockRooms();
    }
  },

  getPosts: async (): Promise<PostRecord[]> => {
    try {
      const [roomsResp, postsResp] = await Promise.all([
        api.get(API_ENDPOINTS.ROOMS.BASE).catch(() => ({ data: getMockRooms() })),
        api.get(API_ENDPOINTS.POSTS.BASE).catch(() => ({ data: getMockPosts() })),
      ]);

      // Debug: log raw responses
      try {
        // eslint-disable-next-line no-console
        console.log('[postService] getPosts roomsResp.length, postsResp.length', {
          rooms: Array.isArray(roomsResp.data) ? roomsResp.data.length : 0,
          posts: Array.isArray(postsResp.data) ? postsResp.data.length : 0,
        });
      } catch {}

      const rooms = Array.isArray(roomsResp.data) ? roomsResp.data : [];
      const roomMap = new Map<number, any>();
      for (const r of rooms) {
        roomMap.set(Number(r.id ?? r.roomId ?? 0), r);
      }

      const posts = Array.isArray(postsResp.data) ? postsResp.data : [];
      const normalized = posts.map((p: any) => {
        const postCopy = { ...p } as any;
        if (postCopy.roomId) {
          const room = roomMap.get(Number(postCopy.roomId));
          if (room && !postCopy.room && !postCopy.roomDto) {
            postCopy.room = room;
          }
          if (room) {
            const roomNormalized = mapRoomDto(room);
            postCopy.roomCode = room.roomCode ?? room.code ?? postCopy.roomCode;
            postCopy.buildingName = room.buildingName ?? room.building ?? postCopy.buildingName;
            postCopy.floorNumber = postCopy.floorNumber ?? room.floorNumber ?? room.floor;
            if ((!Array.isArray(postCopy.servicePrices) || postCopy.servicePrices.length === 0) && roomNormalized.services?.length) {
              postCopy.servicePrices = roomNormalized.services;
            }
            if ((!Array.isArray(postCopy.amenities) || postCopy.amenities.length === 0) && roomNormalized.amenities?.length) {
              postCopy.amenities = roomNormalized.amenities;
            }
          }
        }

        const normalizedPost = normalizePostRecord(postCopy);
        try {
          // eslint-disable-next-line no-console
          console.log('[postService] mapped post', { id: normalizedPost.id, roomId: normalizedPost.roomId, roomCode: normalizedPost.roomCode, buildingName: normalizedPost.buildingName });
        } catch {}

        return normalizedPost;
      });

      return normalized.map(applyCachedAmenities);
    } catch {
      return getMockPosts();
    }
  },

  createPost: async (input: CreatePostInput): Promise<PostRecord> => {
    try {
      // Debug: log create input
      try {
        // eslint-disable-next-line no-console
        console.log('[postService] createPost input:', { roomId: input.roomId, title: input.title, baseRentPrice: input.baseRentPrice });
      } catch {}

      const response = await api.post(API_ENDPOINTS.POSTS.BASE, input);
      const created = response.data ?? {};

      // Debug: log raw create response
      try {
        // eslint-disable-next-line no-console
        console.log('[postService] createPost response:', { raw: created });
      } catch {}

      // If backend didn't return roomCode but returned roomId, try to map room info
      if (!created.roomCode && created.roomId) {
        try {
          const roomsResp = await api.get(API_ENDPOINTS.ROOMS.BASE);
          const rooms = Array.isArray(roomsResp.data) ? roomsResp.data : [];
          const room = rooms.find((r: any) => Number(r.id ?? r.roomId ?? 0) === Number(created.roomId));
          if (room) {
            created.roomCode = room.roomCode ?? room.code;
            created.buildingName = room.buildingName ?? room.building;
          }
        } catch {
          // ignore mapping failure
        }
      }

      const normalized = normalizePostRecord(created);
      const inputAmenities = normalizeAmenityStrings((input as any).amenities);
      if (inputAmenities.length > 0) {
        persistPostAmenities(normalized.id, inputAmenities);
      }
      try {
        // eslint-disable-next-line no-console
        console.log('[postService] createPost normalized:', { id: normalized.id, roomId: normalized.roomId, roomCode: normalized.roomCode, buildingName: normalized.buildingName });
      } catch {}

      return applyCachedAmenities({
        ...normalized,
        amenities: normalized.amenities?.length ? normalized.amenities : inputAmenities,
      });
    } catch (error) {
      if (error) {
        void handleApiError(error);
      }

      const mock = createMockPost(input);
      try {
        // eslint-disable-next-line no-console
        console.log('[postService] createPost fallback mock:', { id: mock.id, roomId: mock.roomId, roomCode: mock.roomCode, buildingName: mock.buildingName });
      } catch {}

      return mock;
    }
  },

  toggleLock: async (id: number, isLocked: boolean): Promise<PostRecord> => {
    try {
      const response = await api.patch(API_ENDPOINTS.POSTS.LOCK(id), { isLocked });
      return normalizePostRecord(response.data);
    } catch (error) {
      if (error) {
        void handleApiError(error);
      }

      const updated = toggleMockPostLock(id, isLocked);
      if (updated) {
        return updated;
      }

      throw error;
    }
  },

  updatePost: async (id: number, payload: Partial<CreatePostInput>): Promise<PostRecord> => {
    try {
      const response = await api.put(API_ENDPOINTS.POSTS.BY_ID(id), payload);
      const normalized = normalizePostRecord(response.data);
      const payloadAmenities = normalizeAmenityStrings((payload as any).amenities);
      if (payloadAmenities.length > 0) {
        persistPostAmenities(normalized.id || id, payloadAmenities);
      }
      return applyCachedAmenities({
        ...normalized,
        amenities: normalized.amenities?.length ? normalized.amenities : payloadAmenities,
      });
    } catch (error) {
      if (error) {
        void handleApiError(error);
      }

      // Fallback to updating mock storage so UI works offline
      try {
        const posts = getMockPosts();
        const index = posts.findIndex((p) => p.id === id);
        if (index >= 0) {
          const updated = { ...posts[index], ...payload, id } as any;

          // If updated lacks roomCode but has roomId, map from mock rooms
          if (!updated.roomCode && updated.roomId) {
            try {
              const rooms = getMockRooms();
              const room = rooms.find((r) => Number(r.id) === Number(updated.roomId));
              if (room) {
                updated.roomCode = room.roomCode ?? room.code;
                updated.buildingName = room.buildingName ?? room.building;
                updated.floorNumber = updated.floorNumber ?? room.floorNumber ?? room.floor;
              }
            } catch {}
          }

          posts[index] = updated;
          replaceMockPosts(posts);
          try {
            // eslint-disable-next-line no-console
            console.log('[postService] updatePost fallback updated:', { id: updated.id, roomId: updated.roomId, roomCode: updated.roomCode });
          } catch {}
          const normalized = normalizePostRecord(updated);
          const payloadAmenities = normalizeAmenityStrings((payload as any).amenities);
          if (payloadAmenities.length > 0) {
            persistPostAmenities(normalized.id || id, payloadAmenities);
          }
          return applyCachedAmenities({
            ...normalized,
            amenities: normalized.amenities?.length ? normalized.amenities : payloadAmenities,
          });
        }
      } catch {
        // ignore
      }

      throw error;
    }
  },

  deletePost: async (id: number): Promise<void> => {
    try {
      await api.delete(API_ENDPOINTS.POSTS.BY_ID(id));
    } catch (error) {
      if (error) {
        void handleApiError(error);
      }

      const deleted = deleteMockPost(id);
      if (!deleted) {
        throw error;
      }
    }
  },
};

export { mapRoomDto, normalizePostRecord };