import { ArrowLeft, CheckCheck, ExternalLink, MessageSquare, Search, Send } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { cn } from '../components/ui/utils';
import { useAuth } from '../contexts/AuthContext';
import { searchIncludes } from '../lib/search';
import {
  buildPropTechPartnerUserId,
  loadRoomConversations,
  markRoomConversationRead,
  sendRoomConversationMessage,
  type RoomConversation,
} from '../services/roomConversationService';
import { connectPropTechConversationSocket } from '../services/trouytinConversationSocket';
import { postService } from '../services/postService';

const TROUYTIN_WEB_BASE_URL = (import.meta.env.VITE_TROUYTIN_WEB_BASE_URL || 'http://localhost:3002').replace(/\/+$/, '');

function canViewManagedConversations(role?: string): boolean {
  const normalized = String(role ?? '').trim().toLowerCase();
  return normalized === 'admin' || normalized === 'quanly' || normalized === 'manager';
}

function isResidentPost(post: any): boolean {
  return String(post?.createdByUserRole ?? '').trim().toLowerCase() === 'cudan';
}

function getTrouytinRoomUrl(roomId: string): string {
  const value = roomId.trim();
  return value ? `${TROUYTIN_WEB_BASE_URL}/rooms/${encodeURIComponent(value)}` : '';
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

function matchesRoomParam(conversation: RoomConversation, roomParam: string): boolean {
  return conversation.roomId === roomParam ||
    conversation.roomInquiry === roomParam ||
    conversation.messages.some((message) => message.text.includes(roomParam));
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
  const [, setRealtimeConnected] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const partnerUserId = user?.id ? buildPropTechPartnerUserId(user.id) : '';
  const canSeeManagedConversations = canViewManagedConversations(user?.role);
  const roomParam = searchParams.get('room');

  const loadConversationList = async () => {
    const partnerIds = new Set<string>();
    if (partnerUserId) partnerIds.add(partnerUserId);

    if (canSeeManagedConversations) {
      const posts = await postService.getPosts().catch(() => []);
      posts.forEach((post) => {
        if (post.createdByUserId && !isResidentPost(post)) {
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
      // Chi thay danh sach khi thuc su doi, tranh dung/mo lai socket vo ich
      setConversationPartnerIds((current) =>
        current.join('|') === partnerIds.join('|') ? current : partnerIds
      );

      if (roomParam) {
        const matchedConversation = nextConversations.find((conversation) => matchesRoomParam(conversation, roomParam));
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

  // Bai dang tao sau khi trang da mo se sinh partner moi; quet lai dinh ky
  // de socket kip lang nghe hoi thoai cua bai do.
  useEffect(() => {
    if (!canSeeManagedConversations) return;

    const timer = window.setInterval(() => {
      void (async () => {
        const posts = await postService.getPosts().catch(() => []);
        const ids = new Set<string>();
        if (partnerUserId) ids.add(partnerUserId);
        posts.forEach((post) => {
          if (post.createdByUserId && !isResidentPost(post)) {
            ids.add(buildPropTechPartnerUserId(post.createdByUserId));
          }
        });

        const nextIds = [...ids];
        setConversationPartnerIds((current) =>
          current.join('|') === nextIds.join('|') ? current : nextIds
        );
      })();
    }, 60000);

    return () => window.clearInterval(timer);
  }, [canSeeManagedConversations, partnerUserId]);

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
        searchIncludes(conversation.userName, searchQuery) ||
        searchIncludes(conversation.roomInquiry, searchQuery) ||
        searchIncludes(conversation.lastMessage, searchQuery)
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
  const activeRoomUrl = activeConversation ? getTrouytinRoomUrl(activeConversation.roomId) : '';
  const activeRoomTitle = activeConversation?.roomInquiry || activeConversation?.roomId || 'Bài đăng';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [activeConversation?.id, activeMessages.length]);

  useEffect(() => {
    if (!roomParam || conversations.length === 0) return;

    let cancelled = false;
    const targets = conversations.filter((conversation) => conversation.unread > 0 && matchesRoomParam(conversation, roomParam));
    if (targets.length === 0) return;

    void Promise.all(
      targets.map((conversation) =>
        markRoomConversationRead(conversation.id, conversation.partnerUserId || partnerUserId)
      )
    )
      .then((updatedConversations) => {
        if (cancelled) return;
        setConversations((current) =>
          current.map((conversation) =>
            updatedConversations.find((updated) => updated.id === conversation.id) ?? conversation
          )
        );
      })
      .catch(() => {
        // Viewing messages should not be blocked by a transient read-sync failure.
      });

    return () => {
      cancelled = true;
    };
  }, [roomParam, conversations.map((conversation) => `${conversation.id}:${conversation.unread}`).join('|'), partnerUserId]);

  useEffect(() => {
    if (roomParam || !activeConversation || activeConversation.unread <= 0) return;

    let cancelled = false;
    void markRoomConversationRead(activeConversation.id, activeConversation.partnerUserId || partnerUserId)
      .then((updatedConversation) => {
        if (cancelled) return;
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === updatedConversation.id ? updatedConversation : conversation
          )
        );
      })
      .catch(() => {
        // Keep the conversation usable even if read-state sync is temporarily unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [roomParam, activeConversation?.id, activeConversation?.unread, activeConversation?.partnerUserId, partnerUserId]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversation) return;

    const text = messageInput.trim();
    try {
      await sendRoomConversationMessage(activeConversation.id, activeConversation.partnerUserId || partnerUserId, text);
      setMessageInput('');
      await refresh();
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
    <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
      <div className="product-tabs shrink-0">
        <button
          type="button"
          onClick={() => navigate('/post-management')}
        >
          <span>Quản lý bài đăng</span>
        </button>
        <button
          type="button"
          className="is-active"
        >
          <span>Tin nhắn</span>
        </button>
      </div>

      {error && (
        <div className="shrink-0 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="proptech-message-layout">
        <aside
          className={cn(
            'proptech-conversation-sidebar',
            activeConversation && 'is-active'
          )}
        >
          <div className="shrink-0 border-b border-gray-300 px-4 py-3">
            <h2 className="table-section-title">Tin nhắn</h2>
          </div>

          <div className="shrink-0 border-b border-gray-300 px-3 py-2">
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

          <div className="proptech-conversation-list">
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
          className={cn(
            'proptech-chat-panel',
            activeConversation && 'is-active'
          )}
        >
          {activeConversation ? (
            <>
              <header className="proptech-chat-header">
                <button
                  type="button"
                  onClick={() => setSelectedConversation(null)}
                  className="proptech-chat-back-button rounded text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
                  aria-label="Quay lại danh sách"
                >
                  <ArrowLeft size={20} />
                </button>
                <ConversationAvatar
                  name={activeConversation.userName}
                  avatar={activeConversation.avatar}
                  online={activeConversation.online}
                />
                <div className="proptech-chat-title">
                  <h2 className="truncate text-sm font-semibold text-gray-800">{activeConversation.userName}</h2>
                  <p
                    className="truncate text-[11px]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Tin nhắn từ TroUyTin
                  </p>
                </div>
                {activeRoomUrl ? (
                  <a
                    href={activeRoomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="proptech-room-pill hover:border-gray-400 hover:bg-gray-200"
                    title={`Mở bài đăng TroUyTin: ${activeRoomTitle}`}
                  >
                    <span className="min-w-0 truncate">#{activeRoomTitle}</span>
                    <ExternalLink size={13} className="hidden shrink-0 md:block" />
                  </a>
                ) : (
                  <span className="proptech-room-pill bg-gray-50 text-gray-700">
                    #{activeRoomTitle}
                  </span>
                )}
              </header>

              <div
                className="proptech-message-log"
                role="log"
                aria-live="polite"
              >
                {activeMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <EmptyState title="Chưa có tin nhắn" description="Hội thoại này chưa có nội dung" />
                  </div>
                ) : (
                  <div className="proptech-message-stack">
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
                className="proptech-message-form"
              >
                <textarea
                  rows={1}
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.nativeEvent.isComposing) return;
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  placeholder="Nhập tin nhắn..."
                  className="proptech-message-input"
                  aria-label="Tin nhắn của bạn"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="proptech-message-send text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
                  style={messageInput.trim() ? { backgroundColor: 'var(--brand-primary)' } : undefined}
                  aria-label="Gửi tin nhắn"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center">
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
  const itemRef = useRef<HTMLDivElement>(null);
  const preview = conversation.lastMessage || conversation.messages[conversation.messages.length - 1]?.text || 'Chưa có tin nhắn';

  useEffect(() => {
    if (active) {
      itemRef.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [active]);

  return (
    <div
      ref={itemRef}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if ((event.target as HTMLElement).closest('a')) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'proptech-conversation-item',
        active ? 'is-active' : 'hover:bg-gray-50'
      )}
    >
      <div className="flex items-center gap-3">
        <ConversationAvatar name={conversation.userName} avatar={conversation.avatar} online={conversation.online} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <p
              className={cn('min-w-0 flex-1 truncate text-sm', active ? 'text-[15px] font-extrabold text-gray-950' : 'font-semibold text-gray-800')}
            >
              {conversation.userName}
            </p>
            <span className={cn('shrink-0 text-xs', active ? 'font-semibold text-gray-700' : 'text-gray-500')}>{conversation.timestamp}</span>
          </div>
          <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
            <p className="min-w-0 flex-1 truncate text-xs text-gray-500">{preview}</p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                'inline-flex min-w-[116px] shrink-0 items-center justify-center whitespace-nowrap rounded border px-3 py-0.5 text-xs font-medium',
                active ? 'border-gray-400 bg-gray-300 text-gray-900' : 'border-gray-300 bg-white text-gray-600'
              )}
            >
              {conversation.roleLabel}
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
    </div>
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
    <div className={cn('proptech-message-bubble-row', mine ? 'is-mine' : 'is-user')}>
      {!mine && (
        showAvatar ? (
          <ConversationAvatar name={conversation.userName} avatar={conversation.avatar} online={false} size="sm" />
        ) : (
          <div className="h-8 w-8 shrink-0" />
        )
      )}
      <div className={cn('proptech-message-bubble-content', mine ? 'is-mine' : 'is-user')}>
        <div
          className={cn(
            'proptech-message-bubble',
            mine ? 'is-mine text-white' : 'is-user'
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
