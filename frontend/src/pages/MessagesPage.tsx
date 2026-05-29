import { ArrowLeft, CheckCheck, MessageSquare, RefreshCw, Search, Send } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { cn } from '../components/ui/utils';
import { useAuth } from '../contexts/AuthContext';
import {
  buildPropTechPartnerUserId,
  loadRoomConversations,
  sendRoomConversationMessage,
  type RoomConversation,
} from '../services/roomConversationService';
import { connectPropTechConversationSocket } from '../services/trouytinConversationSocket';
import { postService } from '../services/postService';

function canViewManagedConversations(role?: string): boolean {
  const normalized = String(role ?? '').trim().toLowerCase();
  return normalized === 'admin' || normalized === 'quanly';
}

function getConversationTime(conversation: RoomConversation): number {
  const latestMessage = conversation.messages[conversation.messages.length - 1];
  const value = latestMessage?.createdAt;
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortConversations(conversations: RoomConversation[]): RoomConversation[] {
  return [...conversations].sort((left, right) => getConversationTime(right) - getConversationTime(left));
}

function mergeConversation(current: RoomConversation[], incoming: RoomConversation): RoomConversation[] {
  return sortConversations([
    incoming,
    ...current.filter((conversation) => conversation.id !== incoming.id),
  ]);
}

export function MessagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<RoomConversation[]>([]);
  const [conversationPartnerIds, setConversationPartnerIds] = useState<string[]>([]);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const partnerUserId = user?.id ? buildPropTechPartnerUserId(user.id) : '';
  const canSeeManagedConversations = canViewManagedConversations(user?.role);

  const loadConversationList = async () => {
    const partnerIds = new Set<string>();
    if (partnerUserId) partnerIds.add(partnerUserId);

    if (canSeeManagedConversations) {
      const posts = await postService.getPosts().catch(() => []);
      posts.forEach((post) => {
        if (post.createdByUserId) {
          partnerIds.add(buildPropTechPartnerUserId(post.createdByUserId));
        }
      });
    }

    const batches = await Promise.all([...partnerIds].map((id) => loadRoomConversations(id)));
    const merged = new Map<string, RoomConversation>();
    batches.flat().forEach((conversation) => {
      merged.set(conversation.id, conversation);
    });

    return {
      conversations: sortConversations([...merged.values()]),
      partnerIds: [...partnerIds],
    };
  };

  const refresh = async () => {
    setLoading(true);
    setError('');

    try {
      const { conversations: nextConversations, partnerIds } = await loadConversationList();
      setConversations(nextConversations);
      setConversationPartnerIds(partnerIds);

      const roomParam = searchParams.get('room');
      if (roomParam) {
        const matchedConversation = nextConversations.find(
          (conversation) =>
            conversation.roomInquiry === roomParam ||
            conversation.messages.some((message) => message.text.includes(roomParam))
        );
        if (matchedConversation) {
          setSelectedConversation(matchedConversation.id);
        } else if (nextConversations.length > 0 && selectedConversation === null) {
          setSelectedConversation(nextConversations[0].id);
        }
      } else if (nextConversations.length > 0 && selectedConversation === null) {
        setSelectedConversation(nextConversations[0].id);
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Không thể tải hội thoại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, partnerUserId]);

  useEffect(() => {
    if (conversationPartnerIds.length === 0) {
      setRealtimeConnected(false);
      return;
    }

    const sockets = conversationPartnerIds.map((id) =>
      connectPropTechConversationSocket({
        partnerUserId: id,
        onConversation: (conversation) => {
          setConversations((current) => mergeConversation(current, conversation));
          setSelectedConversation((current) => current ?? conversation.id);
        },
        onConnectionChange: () => {
          window.setTimeout(() => {
            setRealtimeConnected(sockets.some((socket) => socket.isConnected()));
          }, 0);
        },
      })
    );

    const fallbackTimer = window.setInterval(() => {
      if (sockets.some((socket) => !socket.isConnected())) {
        void refresh();
      }
    }, 15000);

    return () => {
      window.clearInterval(fallbackTimer);
      sockets.forEach((socket) => socket.disconnect());
      setRealtimeConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationPartnerIds.join('|')]);

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) =>
        conversation.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.roomInquiry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [conversations, searchQuery]
  );

  const activeConversation = selectedConversation
    ? filteredConversations.find((conversation) => conversation.id === selectedConversation) ??
      conversations.find((conversation) => conversation.id === selectedConversation) ??
      null
    : null;

  const activeMessages = [...(activeConversation?.messages ?? [])].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [activeConversation?.id, activeMessages.length]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversation) return;

    const text = messageInput.trim();
    try {
      await sendRoomConversationMessage(activeConversation.id, activeConversation.partnerUserId || partnerUserId, text);
      setMessageInput('');
      if (!realtimeConnected) {
        await refresh();
      }
      toast.success('Đã gửi tin nhắn');
    } catch (sendError) {
      toast.error(sendError instanceof Error ? sendError.message : 'Không thể gửi tin nhắn');
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSendMessage();
  };

  return (
    <div className="flex h-[calc(100vh-128px)] min-h-[680px] flex-col space-y-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Đăng bài tìm phòng</p>
          <h1 className="text-2xl font-bold text-gray-800">Tin nhắn</h1>
          <p className="text-sm text-gray-600">Quản lý hội thoại với người thuê phòng từ TroUyTin</p>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded bg-gray-800 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Tải lại
        </button>
      </div>

      <div className="flex items-end gap-8 border-b border-gray-300">
        <button
          type="button"
          onClick={() => navigate('/post-management')}
          className="-mb-px border-b-2 border-transparent px-2 pb-3 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-800"
        >
          Quản lý bài đăng
        </button>
        <button
          type="button"
          className="-mb-px border-b-2 px-2 pb-3 text-sm font-semibold"
          style={{ borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }}
        >
          Tin nhắn
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        <aside
          className="flex min-h-0 w-96 shrink-0 flex-col overflow-hidden rounded-2xl border-2 border-gray-300 bg-white"
        >
          <div className="border-b border-gray-300 px-4 py-3">
            <h2 className="text-base font-bold text-gray-800">Tin nhắn</h2>
          </div>

          <div className="border-b border-gray-300 px-3 py-2">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-800 focus:outline-none"
                style={{ outlineColor: 'var(--brand-primary)' }}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-gray-500">Đang tải hội thoại...</div>
            ) : filteredConversations.length === 0 ? (
              <EmptyState
                title={searchQuery ? 'Không tìm thấy' : 'Chưa có tin nhắn'}
                description={searchQuery ? 'Không có hội thoại phù hợp' : 'Tin nhắn từ người thuê sẽ xuất hiện tại đây'}
              />
            ) : (
              filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === activeConversation?.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                />
              ))
            )}
          </div>
        </aside>

        <section
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-2 border-gray-300 bg-white"
        >
          {activeConversation ? (
            <>
              <header className="flex items-center gap-3 border-b border-gray-300 bg-white px-4 py-3">
                <button
                  type="button"
                  onClick={() => setSelectedConversation(null)}
                  className="hidden rounded p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
                  aria-label="Quay lại danh sách"
                >
                  <ArrowLeft size={20} />
                </button>
                <ConversationAvatar
                  name={activeConversation.userName}
                  avatar={activeConversation.avatar}
                  online={activeConversation.online}
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-gray-800">{activeConversation.userName}</h2>
                  <p
                    className="text-xs"
                    style={{ color: activeConversation.online ? 'var(--success)' : 'var(--text-secondary)' }}
                  >
                    {activeConversation.online ? 'Đang hoạt động' : 'Tin nhắn từ TroUyTin'}
                  </p>
                </div>
              </header>

              <div
                className="min-h-0 flex-1 overflow-y-auto bg-gray-50 px-4 py-4"
                role="log"
                aria-live="polite"
              >
                {activeMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <EmptyState title="Chưa có tin nhắn" description="Hội thoại này chưa có nội dung" />
                  </div>
                ) : (
                  <div className="flex min-h-full flex-col justify-end gap-2">
                    {activeMessages.map((message, index) => {
                      const previousMessage = index > 0 ? activeMessages[index - 1] : null;
                      const showAvatar = message.sender !== 'me' && message.sender !== previousMessage?.sender;
                      return (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          conversation={activeConversation}
                          showAvatar={showAvatar}
                        />
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 border-t border-gray-300 bg-white px-4 py-3"
              >
                <input
                  type="text"
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="h-10 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 text-sm text-gray-800 focus:outline-none"
                  aria-label="Tin nhắn của bạn"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
                  style={messageInput.trim() ? { backgroundColor: 'var(--brand-primary)' } : undefined}
                  aria-label="Gửi tin nhắn"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState title="Chọn cuộc hội thoại để bắt đầu" description="Nội dung tin nhắn sẽ hiển thị ở khung bên phải" />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  active,
  onClick,
}: {
  conversation: RoomConversation;
  active: boolean;
  onClick: () => void;
}) {
  const preview = conversation.lastMessage || conversation.messages[conversation.messages.length - 1]?.text || 'Chưa có tin nhắn';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full border-b border-gray-100 px-4 py-3 text-left transition-colors',
        !active && 'hover:bg-gray-50'
      )}
      style={active ? { backgroundColor: 'rgba(26, 75, 132, 0.08)' } : undefined}
    >
      <div className="flex items-center gap-3">
        <ConversationAvatar name={conversation.userName} avatar={conversation.avatar} online={conversation.online} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn('truncate text-sm', active ? 'font-bold' : 'font-semibold text-gray-800')}
              style={active ? { color: 'var(--brand-primary)' } : undefined}
            >
              {conversation.userName}
            </p>
            <span className="shrink-0 text-xs text-gray-500">{conversation.timestamp}</span>
          </div>
          <p className="mt-1 truncate text-xs text-gray-500">{preview}</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className="rounded border px-2 py-0.5 text-xs font-medium"
              style={{
                borderColor: 'rgba(26, 75, 132, 0.18)',
                backgroundColor: 'rgba(26, 75, 132, 0.08)',
                color: 'var(--brand-primary)',
              }}
            >
              Khách thuê
            </span>
            <span className="truncate rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-500">
              #{conversation.roomInquiry}
            </span>
            {conversation.unread > 0 && (
              <span
                className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold text-white"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {conversation.unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({
  message,
  conversation,
  showAvatar,
}: {
  message: RoomConversation['messages'][number];
  conversation: RoomConversation;
  showAvatar: boolean;
}) {
  const mine = message.sender === 'me';

  return (
    <div className={cn('flex items-end gap-3', mine ? 'justify-end' : 'justify-start')}>
      {!mine && (
        showAvatar ? (
          <ConversationAvatar name={conversation.userName} avatar={conversation.avatar} online={false} size="sm" />
        ) : (
          <div className="h-8 w-8 shrink-0" />
        )
      )}
      <div className={cn('flex max-w-md flex-col', mine ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm',
            mine ? 'text-white' : 'border border-gray-200 bg-white text-gray-800'
          )}
          style={mine ? { backgroundColor: 'var(--brand-primary)' } : undefined}
        >
          {message.text}
        </div>
        <div className="mt-1 flex items-center gap-1 px-2 text-xs text-gray-500">
          <span>{message.time}</span>
          {mine && <CheckCheck size={14} style={{ color: 'var(--brand-primary)' }} aria-label="Đã gửi" />}
        </div>
      </div>
    </div>
  );
}

function ConversationAvatar({
  name,
  avatar,
  online,
  size = 'md',
}: {
  name: string;
  avatar?: string | null;
  online?: boolean;
  size?: 'sm' | 'md';
}) {
  const dimension = size === 'sm' ? 32 : 44;

  return (
    <div className="relative shrink-0" style={{ height: dimension, width: dimension }}>
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          style={{ height: '100%', width: '100%', borderRadius: '9999px', objectFit: 'cover' }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{
            height: '100%',
            width: '100%',
            background: 'linear-gradient(135deg, #4F8FD8, var(--brand-primary))',
          }}
        >
          {initials(name)}
        </div>
      )}
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-white"
          style={{ height: 12, width: 12, backgroundColor: 'var(--success)' }}
        />
      )}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
        <MessageSquare size={28} className="text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  return parts.slice(-2).map((part) => part[0]?.toUpperCase()).join('');
}
