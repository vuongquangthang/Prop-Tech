import { Plus, Eye, Lock, Unlock, RefreshCw, X } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { usePosts } from '../hooks/usePosts';
import { formatMoneyVnd } from '../lib/postValidation';

export function PostManagementPage() {
  const navigate = useNavigate();
  const { posts, loading, error, refresh, updatePost } = usePosts();
  const location = useLocation();
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const sorted = useMemo(() => [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [posts]);

  useEffect(() => {
    // If navigated back with a refresh flag, reload posts from server
    if ((location as any)?.state?.refresh) {
      void refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(location as any)?.state?.refresh]);

  const handleToggleLock = async (post: any) => {
    try {
      await updatePost(post.id, { isLocked: !post.isLocked });
      toast.success(!post.isLocked ? 'Đã khóa bài đăng' : 'Đã mở khóa bài đăng');
      await refresh();
    } catch {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Đăng bài tìm phòng</p>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý bài đăng</h1>
            <p className="text-sm text-gray-600">Danh sách bài đăng đã tạo</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded border px-3 py-2 bg-white">
              <RefreshCw size={16} />
              Làm mới
            </button>
            <button onClick={() => navigate('/post-management/create')} className="inline-flex items-center gap-2 rounded bg-gray-800 px-4 py-2 text-white">
              <Plus size={16} />
              Tạo bài đăng
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex space-x-8 border-b border-gray-300">
            <button className="pb-3 px-2 text-sm font-semibold border-b-2 border-blue-600 text-blue-600">
              Quản lý bài đăng
            </button>
            <button
              onClick={() => navigate('/messages')}
              className="pb-3 px-2 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-gray-800 hover:border-gray-300 transition-colors"
            >
              Tin nhắn
            </button>
          </div>
        </div>

        {error && <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="rounded border bg-white p-10 text-center text-gray-500">Đang tải danh sách...</div>
        ) : (
          <div className="rounded border bg-white overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b">
              <h2 className="text-lg font-semibold">Danh sách bài đăng</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm text-gray-600">Phòng</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-600">Ngày đăng</th>
                    <th className="px-6 py-3 text-center text-sm text-gray-600">Tin nhắn</th>
                    <th className="px-6 py-3 text-center text-sm text-gray-600">Trạng thái</th>
                    <th className="px-6 py-3 text-center text-sm text-gray-600">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{p.roomCode ?? p.room}</div>
                        <div className="text-xs text-gray-500">{p.buildingName ?? p.building}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-4 text-center">{p.messages ?? 0}</td>
                      <td className="px-6 py-4 text-center">{p.isLocked ? 'Đang khóa' : 'Đang hoạt động'}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setSelectedPost(p)} className="p-2 rounded hover:bg-gray-100"><Eye size={16} /></button>
                          <button onClick={() => void handleToggleLock(p)} className="p-2 rounded hover:bg-gray-100">{p.isLocked ? <Unlock size={16} /> : <Lock size={16} />}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 z-50 p-4" style={{ pointerEvents: 'auto' }}>
          <div className={`absolute inset-0 bg-black/50 ${showHistory ? 'pointer-events-none' : ''}`} />
          <div className="relative max-w-5xl w-full rounded bg-white p-6" style={{ zIndex: 51 }}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedPost.title || '—'}</h3>
                <p className="text-sm text-gray-600">{selectedPost.roomCode ?? '—'} • {selectedPost.buildingName ?? '—'}</p>
              </div>
              <button onClick={() => setSelectedPost(null)} className="rounded p-1 hover:bg-gray-100"><X size={18} /></button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="text-sm">Giá: <strong>{formatMoneyVnd(selectedPost.baseRentPrice)}</strong></div>
                <div className="text-sm">Diện tích: {selectedPost.area ?? '—'} m²</div>
                <div className="text-sm">Số người tối đa: {selectedPost.maxOccupants ?? '—'}</div>
                <div className="text-sm">Mô tả:
                  <div className="mt-1 text-gray-700 whitespace-pre-wrap">{selectedPost.description ?? '—'}</div>
                </div>
                <div className="text-sm">Tiện ích: {selectedPost.amenities?.length ? selectedPost.amenities.join(', ') : '—'}</div>

                {selectedPost.imageUrls && selectedPost.imageUrls.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-2 text-sm text-gray-600">Ảnh minh họa</p>
                    <div className="flex gap-2">
                      {selectedPost.imageUrls.slice(0, 6).map((url: string, i: number) => (
                        <img key={i} src={url} alt={`img-${i}`} className="h-20 w-32 rounded object-cover border" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="text-sm">Địa chỉ: {selectedPost.address ?? '—'}</div>
                <div className="text-sm">Liên hệ: {selectedPost.contactName ?? '—'} — {selectedPost.contactPhone ?? '—'}</div>
                <div className="text-sm">Trạng thái: {selectedPost.isLocked ? 'Đang khóa' : 'Đang hoạt động'}</div>

                <div className="mt-4 flex justify-end gap-3">
                  <button onClick={() => setSelectedPost(null)} className="rounded border px-4 py-2">Đóng</button>
                  <button onClick={() => setShowHistory(true)} className="rounded border px-4 py-2">Lịch sử</button>
                  <button onClick={() => { setSelectedPost(null); navigate(`/post-management/create?edit=${selectedPost.id}`); }} className="rounded bg-gray-800 px-4 py-2 text-white">Chỉnh sửa</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHistory && selectedPost && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 p-4" style={{ zIndex: 60 }}>
          <div className="max-w-2xl w-full rounded bg-white p-6" style={{ zIndex: 61 }}>
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Lịch sử chỉnh sửa</h4>
              <button onClick={() => setShowHistory(false)} className="rounded p-1 hover:bg-gray-100"><X size={18} /></button>
            </div>

            <div className="mt-4 space-y-3">
              {selectedPost.editHistory && selectedPost.editHistory.length ? (
                <ul className="list-disc pl-5 text-sm text-gray-700">
                  {selectedPost.editHistory.map((h: any, i: number) => (
                    <li key={i} className="mb-2">{h.summary ?? `[${new Date(h.date).toLocaleString('vi-VN')}]`}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-600">Chưa có lịch sử chỉnh sửa.</div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowHistory(false)} className="rounded border px-4 py-2">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

