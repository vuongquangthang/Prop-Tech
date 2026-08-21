import {
  Plus,
  Eye,
  Lock,
  Unlock,
  X,
  MessageCircle,
  CheckCircle2,
  MapPin,
  Users,
  Ruler,
  CalendarDays,
  Phone,
  User,
  Droplets,
  Home,
  Clock3,
  CircleX,
  PauseCircle,
  Pencil,
  History,
} from 'lucide-react';
import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { usePosts } from '../hooks/usePosts';
import { useAuth } from '../contexts/AuthContext';
import { formatDisplayDate, formatDisplayDateTime } from '../lib/date-utils';
import { formatMoneyVnd } from '../lib/postValidation';
import { postService, type PostEditHistoryDto } from '../services/postService';
import { buildPropTechPartnerUserId, loadRoomConversations } from '../services/roomConversationService';
import { ImageViewer } from '../components/ui/ImageViewer';

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

function isResidentPost(post: any): boolean {
  return String(post?.createdByUserRole ?? '').trim().toLowerCase() === 'cudan';
}

function getPostDisplayStatus(post: any) {
  const status = String(post?.status ?? '').trim().toLowerCase();
  if (status === 'deleted' || post?.deletionSource === 'trouytin_admin') {
    return {
      label: 'Đã bị xoá',
      title: post?.moderationDeletedReason
        ? `Bài đã bị xoá. Lý do: ${post.moderationDeletedReason}`
        : 'Bài đã bị xoá khỏi TroUyTin',
      className: 'bg-red-50 text-red-700 border-red-200',
      icon: CircleX,
    };
  }

  if (status === 'pending_review') {
    return {
      label: 'Chờ duyệt',
      title: 'Bài đang chờ admin TroUyTin duyệt',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock3,
    };
  }

  if (post?.isLocked || status === 'paused') {
    return {
      label: 'Tạm ẩn',
      title: 'Bài đang bị khoá/tạm ẩn',
      className: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: PauseCircle,
    };
  }

  return {
    label: 'Đã đăng',
    title: 'Bài đã được đăng và đang hiển thị',
    className: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle2,
  };
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
  const [detailPreviewImage, setDetailPreviewImage] = useState<{ images: string[]; index: number; titlePrefix: string } | null>(null);

  const sorted = useMemo(() => [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [posts]);

  const getPostLocationAddress = (post: any) => {
    const buildingName = post?.buildingName || '—';
    const floorNumber = post?.floorNumber ?? post?.floor;
    const address = post?.address;
    return [
      floorNumber ? `Tầng ${floorNumber}` : '',
      buildingName,
      address || '',
    ].filter(Boolean).join(' • ');
  };

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
          if (post.createdByUserId && !isResidentPost(post)) {
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
        <div className="product-tabs">
            <button type="button" className="is-active">
              <span>Quản lý bài đăng</span>
            </button>
            <button type="button" onClick={() => navigate('/messages')}>
              <span>Tin nhắn</span>
            </button>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="rounded-[12px] border-2 border-gray-300 bg-white p-10 text-center text-gray-500">Đang tải danh sách...</div>
        ) : (
          <div className="overflow-hidden rounded-[12px] border-2 border-gray-300 bg-white">
            <div className="flex items-center justify-between border-b border-gray-300 px-6 py-4">
              <h2 className="table-section-title">Danh sách bài đăng</h2>
              <button
                onClick={() => navigate('/post-management/create')}
                className="app-button-primary shrink-0"
              >
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
                    <tr
                      key={p.id}
                      className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                      onClick={() => setSelectedPost(p)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold">{p.roomCode}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatDisplayDate(p.postDate ?? p.createdAt)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-700">
                          <Eye size={16} className="text-gray-500" />
                          <span>{p.views ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center" onClick={(event) => event.stopPropagation()}>
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
                      <td className="px-6 py-4 text-center" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          {(() => {
                            const statusMeta = getPostDisplayStatus(p);
                            const StatusIcon = statusMeta.icon;
                            return (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${statusMeta.className}`}
                                title={statusMeta.title}
                                aria-label={statusMeta.label}
                              >
                                <StatusIcon size={14} />
                                <span className="hidden xl:inline">{statusMeta.label}</span>
                              </span>
                            );
                          })()}
                          <button onClick={() => setSelectedPost(p)} className="p-2 rounded hover:bg-gray-100"><Eye size={16} /></button>
                          {(() => {
                            const isDeleted = p.status === 'deleted' || p.deletionSource === 'trouytin_admin';
                            return (
                              <button
                                type="button"
                                onClick={() => navigate(`/post-management/create?edit=${p.id}`)}
                                className={`p-2 rounded hover:bg-gray-100 ${isDeleted ? 'text-brand-primary' : ''}`}
                                title={isDeleted ? 'Chỉnh sửa & đăng lại bài (gửi duyệt lại)' : 'Chỉnh sửa bài đăng'}
                                aria-label={isDeleted ? 'Chỉnh sửa và đăng lại bài đăng' : 'Chỉnh sửa bài đăng'}
                              >
                                <Pencil size={16} />
                              </button>
                            );
                          })()}
                          <button
                            type="button"
                            onClick={() => handleRequestToggleLock(p)}
                            disabled={p.status === 'pending_review' || p.status === 'deleted'}
                            className="p-2 rounded hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
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
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="z-10 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Bài đăng cho thuê</p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">Xem chi tiết bài đăng</h3>
              </div>
              <button onClick={() => setSelectedPost(null)} className="product-action-icon" aria-label="Đóng"><X size={19} /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {(() => {
                const galleryImages = Array.from(new Set([
                  ...(Array.isArray(selectedPost.imageUrls) ? selectedPost.imageUrls : []),
                  ...(Array.isArray((selectedPost as any).roomImageUrls) ? (selectedPost as any).roomImageUrls : []),
                ].filter(Boolean)));

                return (
                  <>
                    {galleryImages.length > 0 && (
                      <div className="px-6 pt-6">
                        <PostDetailGallery
                          images={galleryImages}
                          onPreview={(index) => setDetailPreviewImage({
                            images: galleryImages,
                            index,
                            titlePrefix: selectedPost.title || 'Bài đăng cho thuê phòng',
                          })}
                        />
                      </div>
                    )}

                    {selectedPost.status === 'deleted' && (
                      <div className="mx-6 mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        Bài đăng đã bị xoá khỏi TroUyTin
                        {selectedPost.moderationDeletedReason ? ` · Lý do: ${selectedPost.moderationDeletedReason}` : ''}.
                        Hãy chỉnh sửa lại bài để gửi duyệt lại.
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                      <article className="min-w-0 space-y-7">
                        <header className="border-b border-gray-200 pb-6">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className={`admin-status-badge px-3 py-1 text-xs font-semibold ${
                              selectedPost.isLocked
                                ? 'bg-red-50 text-red-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {selectedPost.isLocked ? 'Đã khóa' : 'Đang hiển thị'}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <Clock3 size={13} />
                              Đăng ngày {formatDisplayDate(selectedPost.createdAt)}
                            </span>
                          </div>
                          <h1 className="text-2xl font-semibold leading-tight text-gray-950">
                            {selectedPost.title || 'Bài đăng cho thuê phòng'}
                          </h1>
                          <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                            <MapPin size={17} className="mt-0.5 shrink-0 text-blue-700" />
                            {getPostLocationAddress(selectedPost)}
                          </p>
                          <p className="mt-4 text-2xl font-bold text-blue-800">
                            {formatMoneyVnd(selectedPost.baseRentPrice)}
                            <span className="ml-1 text-sm font-normal text-gray-500">/ tháng</span>
                          </p>
                        </header>

                        <section>
                          <h2 className="text-base font-semibold text-gray-900">Thông tin phòng</h2>
                          <div className="mt-3 grid grid-cols-2 border border-gray-200 sm:grid-cols-3">
                            <PostFact icon={<Home size={18} />} label="Mã phòng" value={selectedPost.roomCode || '—'} />
                            <PostFact icon={<Ruler size={18} />} label="Diện tích" value={`${selectedPost.area ?? '—'} m²`} />
                            <PostFact icon={<Users size={18} />} label="Tối đa" value={`${selectedPost.maxOccupants ?? '—'} người`} />
                          </div>
                        </section>

                        <section className="border-t border-gray-200 pt-6">
                          <h2 className="text-base font-semibold text-gray-900">Nội dung bài đăng</h2>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                            {selectedPost.description || selectedPost.landlordRequirements || 'Chưa có nội dung mô tả.'}
                          </p>
                        </section>

                        {selectedPost.landlordRequirements && selectedPost.description && (
                          <section className="border-t border-gray-200 pt-6">
                            <h2 className="text-base font-semibold text-gray-900">Yêu cầu từ chủ nhà</h2>
                            <p className="mt-3 whitespace-pre-wrap border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                              {selectedPost.landlordRequirements}
                            </p>
                          </section>
                        )}

                        {selectedPost.amenities?.length > 0 && (
                          <section className="border-t border-gray-200 pt-6">
                            <h2 className="text-base font-semibold text-gray-900">Tiện nghi</h2>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {selectedPost.amenities.map((amenity: string) => (
                                <span key={amenity} className="rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-800">
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </section>
                        )}

                        {selectedPost.servicePrices?.length > 0 && (
                          <section className="border-t border-gray-200 pt-6">
                            <h2 className="text-base font-semibold text-gray-900">Chi phí dịch vụ</h2>
                            <div className="mt-3 overflow-hidden border border-gray-200">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Dịch vụ</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Đơn giá</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedPost.servicePrices.map((service: any, index: number) => (
                                    <tr key={`${service.name}-${index}`} className="border-t border-gray-100">
                                      <td className="px-4 py-3 text-sm text-gray-700">{service.name ?? 'Dịch vụ'}</td>
                                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                        {Number(service.price ?? 0).toLocaleString('vi-VN')} {service.unit ?? ''}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </section>
                        )}
                      </article>

                      <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
                        <section className="border border-gray-200 bg-white p-5 shadow-sm">
                          <h2 className="text-base font-semibold text-gray-900">Thông tin liên hệ</h2>
                          <div className="mt-4 space-y-4">
                            <div className="flex items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-blue-50 text-blue-700"><User size={17} /></span>
                              <div>
                                <p className="text-xs text-gray-500">Người liên hệ</p>
                                <p className="mt-0.5 text-sm font-semibold text-gray-900">{selectedPost.contactName ?? '—'}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-blue-50 text-blue-700"><Phone size={17} /></span>
                              <div>
                                <p className="text-xs text-gray-500">Số điện thoại</p>
                                <p className="mt-0.5 text-sm font-semibold text-gray-900">{selectedPost.contactPhone ?? '—'}</p>
                              </div>
                            </div>
                          </div>
                        </section>

                        <section className="border border-gray-200 bg-gray-50 p-5">
                          <h2 className="text-base font-semibold text-gray-900">Thông tin thuê</h2>
                          <div className="mt-4 space-y-4 text-sm">
                            <PostSidebarRow
                              icon={<CalendarDays size={16} />}
                              label="Có thể vào ở"
                              value={selectedPost.moveInType === 'from-date'
                                ? `Từ ${formatDisplayDate(selectedPost.moveInDate)}`
                                : 'Ở luôn'}
                            />
                            <PostSidebarRow
                              icon={<Droplets size={16} />}
                              label="Khu vực ngập lụt"
                              value={selectedPost.floodProne ? 'Có' : 'Không'}
                            />
                            <PostSidebarRow
                              icon={<MapPin size={16} />}
                              label="Vị trí"
                              value={getPostLocationAddress(selectedPost)}
                            />
                          </div>
                        </section>
                      </aside>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
              <p className="hidden text-xs text-gray-500 sm:block">Thông tin hiển thị theo nội dung bài đăng hiện tại.</p>
              <div className="ml-auto flex gap-3">
                <button onClick={() => void handleShowHistory()} className="inline-flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <History size={16} /> Lịch sử
                </button>
                <button onClick={() => { setSelectedPost(null); navigate(`/post-management/create?edit=${selectedPost.id}`); }} className="inline-flex items-center gap-2 rounded bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700">
                  <Pencil size={16} /> Chỉnh sửa
                </button>
              </div>
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
                      <div className="mt-2 flex flex-wrap items-center text-xs text-gray-500" style={{ columnGap: '1px', rowGap: '4px' }}>
                        <span className="inline-flex rounded bg-gray-100 px-2 py-1">
                          {formatDisplayDateTime(item.changedAt)}
                        </span>
                        {item.changedBy ? (
                          <span className="inline-flex rounded bg-gray-100 px-2 py-1">
                            Bởi {item.changedBy}
                          </span>
                        ) : null}
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

          </div>
        </div>
      )}

      {detailPreviewImage && (
        <ImageViewer
          images={detailPreviewImage.images}
          initialIndex={detailPreviewImage.index}
          titlePrefix={detailPreviewImage.titlePrefix}
          onClose={() => setDetailPreviewImage(null)}
        />
      )}
    </div>
  );
}

function PostDetailGallery({
  images,
  onPreview,
}: {
  images: string[];
  onPreview: (index: number) => void;
}) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const imagesKey = images.join('|');

  useEffect(() => {
    setFailedImages(new Set());
  }, [imagesKey]);

  const visibleImages = images
    .map((src, originalIndex) => ({ src, originalIndex }))
    .filter((item) => !failedImages.has(item.src));

  if (visibleImages.length === 0) return null;

  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-2 sm:gap-3">
      {visibleImages.map(({ src, originalIndex }) => (
          <button
            key={`${src}-${originalIndex}`}
            type="button"
            onClick={() => onPreview(originalIndex)}
            className="group relative h-28 w-40 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md sm:h-32 sm:w-48 md:h-36 md:w-56"
            aria-label={`Ảnh bài đăng ${originalIndex + 1}`}
          >
            <img
              src={src}
              alt={`Ảnh bài đăng ${originalIndex + 1}`}
              className="h-full w-full object-cover transition duration-200 group-hover:scale-105 group-hover:opacity-95"
              onError={() => setFailedImages((current) => new Set(current).add(src))}
            />
          </button>
      ))}
    </div>
  );
}

function PostFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-r border-gray-200 p-4 last:border-r-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-blue-50 text-blue-700">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function PostSidebarRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
      <span className="mt-0.5 text-blue-700">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-1 break-words font-medium leading-5 text-gray-900">{value}</p>
      </div>
    </div>
  );
}
