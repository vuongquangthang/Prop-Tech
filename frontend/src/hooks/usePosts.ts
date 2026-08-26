import { useCallback, useEffect, useState } from 'react';
import { postService, type CreatePostInput, type PostRecord, type RoomOption } from '../services/postService';
import { getCachedData, getCurrentDataCacheScope } from '../lib/memoryDataCache';

const POST_DATA_CACHE_TTL_MS = 2 * 60 * 1000;

const getPostCacheKey = (name: string) => `posts:${getCurrentDataCacheScope()}:${name}`;

export function usePosts() {
  const initialRooms = getCachedData<RoomOption[]>(getPostCacheKey('rooms'), POST_DATA_CACHE_TTL_MS);
  const initialPosts = getCachedData<PostRecord[]>(getPostCacheKey('list'), POST_DATA_CACHE_TTL_MS);
  const hasInitialCache = Boolean(initialRooms && initialPosts);
  const [rooms, setRooms] = useState<RoomOption[]>(initialRooms ?? []);
  const [posts, setPosts] = useState<PostRecord[]>(initialPosts ?? []);
  const [loading, setLoading] = useState(!hasInitialCache);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [roomList, postList] = await Promise.all([
        postService.getRooms(),
        postService.getPosts(),
      ]);

      setRooms(roomList);
      setPosts(postList);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Không thể tải dữ liệu bài đăng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasInitialCache) return;
    void refresh();
  }, [hasInitialCache, refresh]);

  const createPost = useCallback(async (input: CreatePostInput) => {
    setCreating(true);
    setError(null);

    try {
      const created = await postService.createPost(input);
      setPosts((currentPosts) => [created, ...currentPosts]);
      return created;
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Không thể tạo bài đăng';
      setError(message);
      throw createError;
    } finally {
      setCreating(false);
    }
  }, []);

  const deletePost = useCallback(async (id: number) => {
    setError(null);

    try {
      await postService.deletePost(id);
      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== id));
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Không thể xóa bài đăng';
      setError(message);
      throw deleteError;
    }
  }, []);

  const updatePost = useCallback(async (id: number, payload: Partial<CreatePostInput>) => {
    setError(null);
    try {
      const updated = await postService.updatePost(id, payload);
      setPosts((current) => current.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật bài đăng';
      setError(message);
      throw err;
    }
  }, []);

  const toggleLock = useCallback(async (id: number, isLocked: boolean) => {
    setError(null);
    try {
      const updated = await postService.toggleLock(id, isLocked);
      setPosts((current) => current.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật trạng thái bài đăng';
      setError(message);
      throw err;
    }
  }, []);

  return {
    rooms,
    posts,
    loading,
    creating,
    error,
    refresh,
    createPost,
    updatePost,
    toggleLock,
  };
}
