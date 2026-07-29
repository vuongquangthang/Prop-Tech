import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle, Send, User, Users } from 'lucide-react';
import { notificationService, type NotificationRecipient } from '../services/feature.service';
import { FilterSelect } from '../components/ui/FilterSelect';
import { PageHeader } from '../components/ui/product-system';

type SendScope = 'all' | 'single';

const notificationTypes = [
  { value: 'ANNOUNCEMENT', label: 'Thông báo chung' },
  { value: 'SYSTEM', label: 'Hệ thống' },
  { value: 'MAINTENANCE', label: 'Vận hành/Sự cố' },
  { value: 'INVOICE', label: 'Hóa đơn' },
];

interface ResidentNotificationComposerProps {
  compact?: boolean;
  formId?: string;
  hideSubmitButton?: boolean;
  onSent?: () => void;
}

export function ResidentNotificationComposer({ compact = false, formId, hideSubmitButton = false, onSent }: ResidentNotificationComposerProps) {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [scope, setScope] = useState<SendScope>('all');
  const [recipientId, setRecipientId] = useState('');
  const [notificationType, setNotificationType] = useState('ANNOUNCEMENT');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoadingRecipients(true);
    notificationService.getRecipients()
      .then((items) => {
        if (!mounted) return;
        setRecipients(items || []);
      })
      .catch((err: any) => {
        if (!mounted) return;
        setError(err?.message || 'Không thể tải danh sách cư dân');
      })
      .finally(() => {
        if (mounted) setLoadingRecipients(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedRecipient = useMemo(
    () => recipients.find((item) => String(item.userId) === recipientId),
    [recipientId, recipients]
  );

  const resetFeedback = () => {
    setSuccess('');
    setError('');
  };

  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault();
    resetFeedback();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle) {
      setError('Vui lòng nhập tiêu đề thông báo.');
      return;
    }
    if (!trimmedContent) {
      setError('Vui lòng nhập nội dung thông báo.');
      return;
    }
    if (scope === 'single' && !recipientId) {
      setError('Vui lòng chọn cư dân nhận thông báo.');
      return;
    }

    setSending(true);
    try {
      if (scope === 'all') {
        await notificationService.broadcast({
          title: trimmedTitle,
          content: trimmedContent,
          notificationType,
        });
        setSuccess(`Đã gửi thông báo đến tất cả cư dân có tài khoản app.`);
      } else {
        await notificationService.send({
          recipientId: Number(recipientId),
          title: trimmedTitle,
          content: trimmedContent,
          notificationType,
        });
        setSuccess(`Đã gửi thông báo đến ${selectedRecipient?.displayName || 'cư dân đã chọn'}.`);
      }
      setTitle('');
      setContent('');
      if (scope === 'single') setRecipientId('');
      onSent?.();
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi thông báo.');
    } finally {
      setSending(false);
    }
  };

  return (
      <div className={`grid grid-cols-1 gap-4 ${compact ? 'xl:grid-cols-[1fr_300px]' : 'xl:grid-cols-[1fr_360px]'}`}>
        <form
          id={formId}
          onSubmit={handleSend}
          className={`bg-white border border-gray-300 rounded space-y-4 ${compact ? 'p-4' : 'p-5'}`}
        >
          {success && (
            <div className="flex items-center gap-2 border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
              <CheckCircle size={16} />
              <span>{success}</span>
              <button type="button" className="ml-auto text-green-700" onClick={() => setSuccess('')}>Đóng</button>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              <AlertTriangle size={16} />
              <span>{error}</span>
              <button type="button" className="ml-auto text-red-700" onClick={() => setError('')}>Đóng</button>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">Phạm vi gửi *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setScope('all');
                  setRecipientId('');
                }}
                className={`border px-4 py-3 text-left ${scope === 'all' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-300 bg-white text-gray-800'}`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Users size={16} />
                  Tất cả cư dân
                </div>
                <p className="mt-1 text-xs text-gray-600">Gửi đến toàn bộ cư dân có tài khoản app.</p>
              </button>
              <button
                type="button"
                onClick={() => setScope('single')}
                className={`border px-4 py-3 text-left ${scope === 'single' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-300 bg-white text-gray-800'}`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <User size={16} />
                  Một cư dân
                </div>
                <p className="mt-1 text-xs text-gray-600">Chọn một tài khoản cư dân cụ thể.</p>
              </button>
            </div>
          </div>

          {scope === 'single' && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-800">Cư dân nhận *</label>
              <FilterSelect
                value={recipientId}
                onChange={(event) => setRecipientId(event.target.value)}
                disabled={loadingRecipients}
                className="w-full"
              >
                <option value="">{loadingRecipients ? 'Đang tải cư dân...' : 'Chọn cư dân'}</option>
                {recipients.map((recipient) => (
                  <option key={recipient.userId} value={String(recipient.userId)}>
                    {recipient.displayName}
                    {recipient.phoneNumber ? ` - ${recipient.phoneNumber}` : ''}
                    {recipient.roomCode ? ` - ${recipient.roomCode}` : ''}
                  </option>
                ))}
              </FilterSelect>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">Loại thông báo *</label>
            <FilterSelect
              value={notificationType}
              onChange={(event) => setNotificationType(event.target.value)}
              className="w-full"
            >
              {notificationTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </FilterSelect>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">Tiêu đề *</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="VD: Thông báo bảo trì hệ thống nước"
              className="w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">{title.length}/120 ký tự</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">Nội dung *</label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={compact ? 5 : 7}
              maxLength={1000}
              placeholder="Nhập nội dung thông báo gửi đến app cư dân..."
              className="w-full resize-y border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">{content.length}/1000 ký tự</p>
          </div>

          {!hideSubmitButton && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              <Send size={16} />
              {sending ? 'Đang gửi...' : 'Gửi thông báo'}
            </button>
          </div>
          )}
        </form>

        <div className={`bg-white border border-gray-300 rounded h-fit ${compact ? 'p-4' : 'p-5'}`}>
          <div className="mb-4 flex items-center gap-2">
            <Bell size={18} className="text-blue-700" />
            <h2 className="text-base font-bold text-gray-900">Xem trước</h2>
          </div>
          <div className="border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              {notificationTypes.find((type) => type.value === notificationType)?.label || 'Thông báo'}
            </p>
            <h3 className="mt-2 text-base font-bold text-gray-900">
              {title.trim() || 'Tiêu đề thông báo'}
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {content.trim() || 'Nội dung thông báo sẽ hiển thị tại đây trước khi gửi đến app cư dân.'}
            </p>
            <div className="mt-4 border-t border-gray-200 pt-3 text-xs text-gray-500">
              Người nhận:{' '}
              <span className="font-semibold text-gray-800">
                {scope === 'all'
                  ? `Tất cả cư dân (${recipients.length} tài khoản)`
                  : selectedRecipient
                    ? `${selectedRecipient.displayName}${selectedRecipient.roomCode ? ` - ${selectedRecipient.roomCode}` : ''}`
                    : 'Chưa chọn'}
              </span>
            </div>
          </div>
        </div>
      </div>
  );
}

export function ResidentNotificationsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Thông báo cư dân"
        title="Gửi thông báo chủ động"
        description="Nhập nội dung và gửi thông báo realtime đến app cư dân."
      />

      <ResidentNotificationComposer />
    </div>
  );
}
