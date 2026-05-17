import { api, handleApiError } from '../lib/api-client';
import { API_ENDPOINTS } from '../lib/api-config';
import { createMockPost, deleteMockPost, getMockPosts, getMockRooms, toggleMockPostLock, replaceMockPosts } from '../mocks/postsMock';

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
  services?: any[];
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
  imageUrls: string[];
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
    services: Array.isArray(room.services) ? room.services : Array.isArray(room.servicePrices) ? room.servicePrices : Array.isArray(room.lineItems) ? room.lineItems : [],
  };
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
    moveInDate: post.moveInDate,
    floodProne: Boolean(post.floodProne ?? false),
    landlordRequirements: post.landlordRequirements ?? '',
    contactType: post.contactType ?? 'current',
    contactName: post.contactName ?? '',
    contactPhone: post.contactPhone ?? '',
    servicePrices: Array.isArray(post.servicePrices) ? post.servicePrices : [],
    imageUrls: Array.isArray(post.imageUrls) ? post.imageUrls : Array.isArray(post.images) ? post.images : [],
    coverImageUrl: post.coverImageUrl ?? post.imageUrls?.[0],
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
        if (!postCopy.roomCode && postCopy.roomId) {
          const room = roomMap.get(Number(postCopy.roomId));
          if (room) {
            postCopy.roomCode = room.roomCode ?? room.code ?? postCopy.roomCode;
            postCopy.buildingName = room.buildingName ?? room.building ?? postCopy.buildingName;
            postCopy.floorNumber = postCopy.floorNumber ?? room.floorNumber ?? room.floor;
          }
        }

        const normalizedPost = normalizePostRecord(postCopy);
        try {
          // eslint-disable-next-line no-console
          console.log('[postService] mapped post', { id: normalizedPost.id, roomId: normalizedPost.roomId, roomCode: normalizedPost.roomCode, buildingName: normalizedPost.buildingName });
        } catch {}

        return normalizedPost;
      });

      return normalized;
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
      try {
        // eslint-disable-next-line no-console
        console.log('[postService] createPost normalized:', { id: normalized.id, roomId: normalized.roomId, roomCode: normalized.roomCode, buildingName: normalized.buildingName });
      } catch {}

      return normalized;
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
      return normalizePostRecord(response.data);
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
          return normalizePostRecord(updated);
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