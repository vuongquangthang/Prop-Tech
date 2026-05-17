import { useCallback, useEffect, useState } from 'react';
import { postService, type CreatePostInput, type PostRecord, type RoomOption } from '../services/postService';

export function usePosts() {
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
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
    void refresh();
  }, [refresh]);

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

  return {
    rooms,
    posts,
    loading,
    creating,
    error,
    refresh,
    createPost,
    updatePost,
  };
}