import { Plus, Eye, Lock, Unlock, X, MessageCircle } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { usePosts } from '../hooks/usePosts';
import { useAuth } from '../contexts/AuthContext';
import { formatMoneyVnd } from '../lib/postValidation';
import { postService, type PostEditHistoryDto } from '../services/postService';
import { buildPropTechPartnerUserId, loadRoomConversations } from '../services/roomConversationService';

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

function canViewManagedConversations(role?: string): boolean {
  const normalized = String(role ?? '').trim().toLowerCase();
  return normalized === 'admin' || normalized === 'quanly' || normalized === 'manager';
}

export function PostManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { posts, loading, error, refresh, toggleLock } = usePosts();
  const location = useLocation();
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [lockTarget, setLockTarget] = useState<{ post: any; nextIsLocked: boolean } | null>(null);
  const [lockUpdating, setLockUpdating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<PostEditHistoryDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [pendingMessagesByPost, setPendingMessagesByPost] = useState<Record<string, number>>({});
  const [detailPreviewImage, setDetailPreviewImage] = useState<{ src: string; title: string } | null>(null);

  const sorted = useMemo(() => [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [posts]);

  useEffect(() => {
    // If navigated back with a refresh flag, reload posts from server
    if ((location as any)?.state?.refresh) {
      void refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(location as any)?.state?.refresh]);

  useEffect(() => {
    let cancelled = false;

    const loadPendingMessages = async () => {
      if (!user?.id || posts.length === 0) {
        setPendingMessagesByPost({});
        return;
      }

      const partnerIds = new Set<string>([buildPropTechPartnerUserId(user.id)]);
      if (canViewManagedConversations(user.role)) {
        posts.forEach((post) => {
          if (post.createdByUserId) {
            partnerIds.add(buildPropTechPartnerUserId(post.createdByUserId));
          }
        });
      }

      try {
        const batches = await Promise.all([...partnerIds].map((id) => loadRoomConversations(id)));
        if (cancelled) return;

        const nextCounts: Record<string, number> = {};
        batches.flat().forEach((conversation) => {
          if (!conversation.roomId || conversation.unread <= 0) return;
          nextCounts[conversation.roomId] = (nextCounts[conversation.roomId] ?? 0) + conversation.unread;
        });
        setPendingMessagesByPost(nextCounts);
      } catch {
        if (!cancelled) {
          setPendingMessagesByPost({});
        }
      }
    };

    void loadPendingMessages();

    return () => {
      cancelled = true;
    };
  }, [posts, user?.id, user?.role]);

  const handleRequestToggleLock = (post: any) => {
    const nextIsLocked = !post.isLocked;
    setLockTarget({ post, nextIsLocked });
  };

  const handleConfirmToggleLock = async () => {
    if (!lockTarget) return;

    setLockUpdating(true);
    try {
      await toggleLock(lockTarget.post.id, lockTarget.nextIsLocked);
      toast.success(lockTarget.nextIsLocked ? 'Đã khóa bài đăng' : 'Đã mở khóa bài đăng');
      setLockTarget(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
    } finally {
      setLockUpdating(false);
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
    <div className="space-y-6">
        <div className="flex items-end gap-8 border-b border-gray-300">
            <button
              className="-mb-px border-b-2 px-2 pb-3 text-sm font-semibold"
              style={{ borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }}
            >
              Quản lý bài đăng
            </button>
            <button
              onClick={() => navigate('/messages')}
              className="-mb-px border-b-2 border-transparent px-2 pb-3 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-800"
            >
              Tin nhắn
            </button>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="rounded-[12px] border-2 border-gray-300 bg-white p-10 text-center text-gray-500">Đang tải danh sách...</div>
        ) : (
          <div className="overflow-hidden rounded-[12px] border-2 border-gray-300 bg-white">
            <div className="flex items-center justify-between border-b border-gray-300 px-6 py-4">
              <h2 className="text-lg font-semibold">Danh sách bài đăng</h2>
              <button onClick={() => navigate('/post-management/create')} className="inline-flex items-center gap-2 rounded bg-gray-800 px-4 py-2 text-white">
                <Plus size={16} />
                Tạo bài đăng
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-300 bg-gray-50">
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
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                          onClick={() => navigate(`/messages?room=post-${p.id}`)}
                          className="mx-auto inline-flex items-center justify-center gap-1 text-sm text-gray-700 transition-colors hover:text-blue-600"
                          title="Đi tới trang tin nhắn"
                        >
                          <MessageCircle size={16} className="text-gray-500" />
                          {(() => {
                            const pendingMessages = pendingMessagesByPost[`post-${p.id}`] ?? Number(p.messages ?? 0);
                            return (
                              <span className={pendingMessages > 0 ? 'font-bold text-blue-700' : ''}>
                                {pendingMessages}
                              </span>
                            );
                          })()}
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
                          <button
                            type="button"
                            onClick={() => handleRequestToggleLock(p)}
                            className="p-2 rounded hover:bg-gray-100"
                            title={p.isLocked ? 'Mở khóa bài đăng' : 'Khóa bài đăng'}
                          >
                            {p.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {lockTarget && (
        <div className="admin-content-modal-overlay">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-300 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {lockTarget.nextIsLocked ? 'Khóa bài đăng' : 'Mở khóa bài đăng'}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {lockTarget.post.roomCode ?? 'Phòng'} - {lockTarget.post.buildingName ?? 'Tòa nhà'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLockTarget(null)}
                disabled={lockUpdating}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-gray-700">
                {lockTarget.nextIsLocked
                  ? 'Bài đăng sẽ được khóa thủ công và tạm ẩn khỏi TroUyTin cho đến khi bạn mở khóa lại.'
                  : 'Bài đăng sẽ được mở lại và có thể hiển thị trên TroUyTin nếu vẫn được admin duyệt.'}
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-300 px-6 py-4">
              <button
                type="button"
                onClick={() => setLockTarget(null)}
                disabled={lockUpdating}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmToggleLock()}
                disabled={lockUpdating}
                className="rounded px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: lockTarget.nextIsLocked ? '#B91C1C' : '#1F2937',
                  color: '#FFFFFF',
                }}
              >
                {lockUpdating ? 'Đang xử lý...' : lockTarget.nextIsLocked ? 'Khóa bài đăng' : 'Mở khóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPost && (
        <div className="admin-content-modal-overlay">
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
                  <PostDetailImageStrip
                    images={(selectedPost as any).roomImageUrls}
                    altPrefix="Ảnh phòng"
                    onPreview={(src, index) => setDetailPreviewImage({ src, title: `Ảnh phòng ${index + 1}` })}
                  />
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
                  <div className="overflow-hidden rounded-xl border border-gray-300 bg-white">
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
                  <PostDetailImageStrip
                    images={selectedPost.imageUrls}
                    altPrefix="Ảnh minh họa"
                    onPreview={(src, index) => setDetailPreviewImage({ src, title: `Ảnh minh họa ${index + 1}` })}
                  />
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
        <div className="admin-content-modal-overlay">
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
                          <span className="rounded-full bg-blue-600 px-2 py-1 text-sm font-semibold text-white">Hiện tại</span>
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

      {detailPreviewImage && typeof document !== 'undefined' && createPortal((
        <div
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{
            zIndex: 2147483647,
            backgroundColor: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setDetailPreviewImage(null)}
        >
          <div
            className="relative flex items-center justify-center"
            style={{ maxHeight: '72vh', maxWidth: '78vw' }}
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={detailPreviewImage.src}
              alt={detailPreviewImage.title}
              className="rounded bg-white object-contain shadow-2xl"
              style={{
                maxHeight: 'min(72vh, 560px)',
                maxWidth: 'min(78vw, 720px)',
                width: 'auto',
                height: 'auto',
              }}
            />
          </div>
        </div>
      ), document.body)}
    </div>
  );
}

function PostDetailImageStrip({
  images,
  altPrefix,
  onPreview,
}: {
  images: string[];
  altPrefix: string;
  onPreview: (src: string, index: number) => void;
}) {
  const normalizedImages = images.slice(0, 6);

  return (
    <div className="flex w-full items-start gap-2 overflow-x-auto pb-1">
      {Array.from({ length: 6 }).map((_, index) => {
        const src = normalizedImages[index];

        if (!src) {
          return (
            <div
              key={`empty-${altPrefix}-${index}`}
              className="h-24 w-24 shrink-0 rounded border border-gray-300 bg-white"
              aria-label={`Ô ${altPrefix.toLowerCase()} trống ${index + 1}`}
            />
          );
        }

        return (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => onPreview(src, index)}
            className="h-24 w-24 shrink-0 overflow-hidden rounded border border-gray-300 bg-white"
            title="Xem chi tiết ảnh"
          >
            <img src={src} alt={`${altPrefix} ${index + 1}`} className="h-full w-full object-cover" />
          </button>
        );
      })}
    </div>
  );
}
