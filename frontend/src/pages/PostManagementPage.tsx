import { Plus, Eye, Lock, Unlock, X, MessageCircle } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { usePosts } from '../hooks/usePosts';
import { formatMoneyVnd } from '../lib/postValidation';
import { postService, type PostEditHistoryDto } from '../services/postService';

const roomStatusConfig = {
  'Trống': { label: 'Trống', bgColor: '#D1FAE5', textColor: '#065F46', borderColor: '#A7F3D0' },
  empty: { label: 'Trống', bgColor: '#D1FAE5', textColor: '#065F46', borderColor: '#A7F3D0' },
  'Đã thuê': { label: 'Đã thuê', bgColor: '#FEE2E2', textColor: '#991B1B', borderColor: '#FECACA' },
  rented: { label: 'Đã thuê', bgColor: '#FEE2E2', textColor: '#991B1B', borderColor: '#FECACA' },
  'Bảo trì': { label: 'Bảo trì', bgColor: '#FED7AA', textColor: '#9A3412', borderColor: '#FDBA74' },
  maintenance: { label: 'Bảo trì', bgColor: '#FED7AA', textColor: '#9A3412', borderColor: '#FDBA74' },
};

const getRoomStatusConfig = (status: string) => {
  return (roomStatusConfig as Record<string, (typeof roomStatusConfig)['Trống']>)[status] || roomStatusConfig['Trống'];
};

export function PostManagementPage() {
  const navigate = useNavigate();
  const { posts, loading, error, refresh, updatePost } = usePosts();
  const location = useLocation();
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<PostEditHistoryDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

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

  const handleShowHistory = async () => {
    if (!selectedPost) return;

    setShowHistory(true);
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const history = await postService.getHistory(selectedPost.id);
      setHistoryItems(history);
    } catch (err) {
      setHistoryItems([]);
      setHistoryError(err instanceof Error ? err.message : 'Không thể tải lịch sử chỉnh sửa');
    } finally {
      setHistoryLoading(false);
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
            <button onClick={() => navigate('/post-management/create')} className="inline-flex items-center gap-2 rounded bg-gray-800 px-4 py-2 text-white">
              <Plus size={16} />
              Tạo bài đăng
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-end gap-8 border-b border-gray-300">
            <button className="-mb-px border-b-2 border-blue-600 px-2 pb-3 text-sm font-semibold text-blue-600">
              Quản lý bài đăng
            </button>
            <button
              onClick={() => navigate('/messages')}
              className="-mb-px border-b-2 border-transparent px-2 pb-3 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-800"
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
                    <th className="px-6 py-3 text-left text-sm text-gray-600">Phòng đã đăng</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-600">Ngày đăng</th>
                    <th className="px-6 py-3 text-center text-sm text-gray-600">Lượng người xem</th>
                    <th className="px-6 py-3 text-center text-sm text-gray-600">Tin nhắn đang chờ</th>
                    <th className="px-6 py-3 text-center text-sm text-gray-600">Trạng thái phòng</th>
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
                      <td className="px-6 py-4 text-sm text-gray-700">{new Date(p.postDate ?? p.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-700">
                          <Eye size={16} className="text-gray-500" />
                          <span>{p.views ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => navigate('/messages')}
                          className="mx-auto inline-flex items-center justify-center gap-1 text-sm text-gray-700 transition-colors hover:text-blue-600"
                          title="Đi tới trang tin nhắn"
                        >
                          <MessageCircle size={16} className="text-gray-500" />
                          <span className={Number(p.messages ?? 0) > 0 ? 'font-bold text-blue-700' : ''}>{p.messages ?? 0}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {(() => {
                          const cfg = getRoomStatusConfig(p.roomStatus ?? 'Trống');
                          return (
                            <span
                              className="inline-block rounded whitespace-nowrap"
                              style={{
                                padding: '6px 12px',
                                fontSize: 'var(--type-caption)',
                                fontWeight: 600,
                                backgroundColor: cfg.bgColor,
                                color: cfg.textColor,
                                border: `1px solid ${cfg.borderColor}`,
                              }}
                            >
                              {cfg.label}
                            </span>
                          );
                        })()}
                      </td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg bg-white">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-300 bg-white px-6 py-4">
              <div>
                <h3 className="text-lg text-gray-800 font-semibold">Chi tiết bài đăng</h3>
                <p className="text-sm text-gray-600">{selectedPost.roomCode ?? '—'} • {selectedPost.buildingName ?? '—'}</p>
              </div>
              <button onClick={() => setSelectedPost(null)} className="rounded p-1 hover:bg-gray-100"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <p className="text-xs text-gray-500 mb-1">Tiêu đề bài đăng</p>
                <p className="text-base font-semibold text-gray-800">{selectedPost.title || '—'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 border border-gray-300 rounded p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Thông tin phòng</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Giá thuê</span>
                    <span className="font-semibold text-gray-800">{formatMoneyVnd(selectedPost.baseRentPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Diện tích</span>
                    <span className="text-gray-800">{selectedPost.area ?? '—'} m²</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Số người tối đa</span>
                    <span className="text-gray-800">{selectedPost.maxOccupants ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-300 pt-2">
                    <span className="text-gray-600">Trạng thái</span>
                    <span className={`font-semibold ${selectedPost.isLocked ? 'text-red-700' : 'text-green-700'}`}>
                      {selectedPost.isLocked ? 'Đang khóa' : 'Đang hoạt động'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-300 rounded p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Thông tin liên hệ</h4>
                  <div className="text-sm">
                    <p className="text-gray-600">Địa chỉ</p>
                    <p className="text-gray-800">{selectedPost.address ?? `${selectedPost.buildingName ?? '—'} - ${selectedPost.roomCode ?? '—'}`}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-600">Người liên hệ</p>
                    <p className="text-gray-800">{selectedPost.contactName ?? '—'}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-600">Số điện thoại</p>
                    <p className="text-gray-800">{selectedPost.contactPhone ?? '—'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Yêu cầu từ chủ nhà</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedPost.landlordRequirements || selectedPost.description || '—'}</p>
              </div>

              {Array.isArray((selectedPost as any).roomImageUrls) && (selectedPost as any).roomImageUrls.length > 0 && (
                <div className="bg-gray-50 border border-gray-300 rounded p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Ảnh phòng</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(selectedPost as any).roomImageUrls.slice(0, 6).map((url: string, i: number) => (
                      <img key={`room-${i}`} src={url} alt={`room-img-${i}`} className="h-28 w-full rounded border border-gray-300 object-cover" />
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Thông tin đăng</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thời gian vào ở</span>
                    <span className="text-gray-800">
                      {selectedPost.moveInType === 'from-date'
                        ? `Từ ${selectedPost.moveInDate ? new Date(selectedPost.moveInDate).toLocaleDateString('vi-VN') : '—'}`
                        : 'Ở luôn'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Khu vực ngập lụt</span>
                    <span className="text-gray-800">{selectedPost.floodProne ? 'Có' : 'Không'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kiểu liên hệ</span>
                    <span className="text-gray-800">{selectedPost.contactType === 'other' ? 'Nhập thủ công' : 'Theo tài khoản hiện tại'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày đăng</span>
                    <span className="text-gray-800">{selectedPost.createdAt ? new Date(selectedPost.createdAt).toLocaleDateString('vi-VN') : '—'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Tiện ích</h4>
                <p className="text-sm text-gray-700">{selectedPost.amenities?.length ? selectedPost.amenities.join(', ') : '—'}</p>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Dịch vụ đi kèm</h4>
                {selectedPost.servicePrices?.length ? (
                  <div className="overflow-hidden rounded border border-gray-300 bg-white">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-300">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Tên dịch vụ</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Đơn giá</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPost.servicePrices.map((s: any, i: number) => (
                          <tr key={i} className="border-b border-gray-200 last:border-b-0">
                            <td className="px-4 py-2 text-sm text-gray-700">{s.name ?? 'Dịch vụ'}</td>
                            <td className="px-4 py-2 text-right text-sm text-gray-800">
                              {Number(s.price ?? 0).toLocaleString('vi-VN')} {s.unit ?? ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">—</p>
                )}
              </div>

              {selectedPost.imageUrls && selectedPost.imageUrls.length > 0 && (
                <div className="bg-gray-50 border border-gray-300 rounded p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Ảnh minh họa</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedPost.imageUrls.slice(0, 6).map((url: string, i: number) => (
                      <img key={i} src={url} alt={`img-${i}`} className="h-28 w-full rounded border border-gray-300 object-cover" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-300 bg-white px-6 py-4">
              <button onClick={() => setSelectedPost(null)} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Đóng</button>
              <button onClick={() => void handleShowHistory()} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Lịch sử</button>
              <button onClick={() => { setSelectedPost(null); navigate(`/post-management/create?edit=${selectedPost.id}`); }} className="rounded bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700">Chỉnh sửa</button>
            </div>
          </div>
        </div>
      )}

      {showHistory && selectedPost && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
            <div className="flex items-center justify-between border-b border-gray-300 px-6 py-4">
              <h4 className="text-lg font-semibold">Lịch sử chỉnh sửa</h4>
              <button
                onClick={() => {
                  setShowHistory(false);
                  setHistoryItems([]);
                  setHistoryError(null);
                }}
                className="rounded p-1 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-3">
              {historyLoading ? (
                <div className="rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">Đang tải lịch sử...</div>
              ) : historyError ? (
                <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{historyError}</div>
              ) : historyItems.length ? (
                <div className="space-y-3">
                  {historyItems.map((item) => (
                    <div key={item.id} className={`rounded border p-4 ${item.isCurrent ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{item.version}</p>
                          <p className="mt-1 text-sm text-gray-600">{item.summary}</p>
                        </div>
                        {item.isCurrent && (
                          <span className="rounded-full bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white">Hiện tại</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>{new Date(item.changedAt).toLocaleString('vi-VN')}</span>
                        {item.changedBy ? <span>Bởi {item.changedBy}</span> : null}
                      </div>
                      <div className="mt-3 space-y-1">
                        {item.changes.map((change, index) => (
                          <p key={`${item.id}-${index}`} className="text-sm text-gray-700">• {change}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600">Chưa có lịch sử chỉnh sửa.</div>
              )}
            </div>

            <div className="flex justify-end border-t border-gray-300 px-6 py-4">
              <button
                onClick={() => {
                  setShowHistory(false);
                  setHistoryItems([]);
                  setHistoryError(null);
                }}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
