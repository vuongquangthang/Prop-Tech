export type RoomConversationMessage = {
  id: string;
  sender: 'user' | 'me';
  text: string;
  time: string;
  createdAt: string;
};

export type RoomConversation = {
  id: string;
  roomId: string;
  partnerUserId: string;
  userName: string;
  roleLabel: string;
  avatar: string | null;
  roomInquiry: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  userPhone?: string;
  messages: RoomConversationMessage[];
};

export type TrouytinMessage = {
  id: string | number;
  from: 'web' | 'mobile' | string;
  text: string;
  at: string;
  status?: string;
};

export type TrouytinConversation = {
  id: string | number;
  ownerUserId: string | number;
  requesterName?: string;
  requesterPhone?: string;
  requesterEmail?: string;
  partnerUserId: string;
  partnerName?: string;
  partnerPhone?: string;
  partnerAvatar?: string;
  partnerRole?: string;
  roomId?: string;
  roomTitle?: string;
  messages?: TrouytinMessage[];
  updatedAt?: string;
};

const TROUYTIN_API_BASE_URL = (import.meta.env.VITE_TROUYTIN_API_BASE_URL || 'http://localhost:8090').replace(/\/+$/, '');
const TROUYTIN_INTERNAL_API_KEY = import.meta.env.VITE_TROUYTIN_INTERNAL_API_KEY || 'dev-internal-key';

function formatTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

function getMessageCreatedAt(message?: TrouytinMessage): string {
  return message?.at || new Date().toISOString();
}

export function countPendingWebMessages(messages: TrouytinMessage[]): number {
  return [...messages]
    .sort((left, right) => new Date(getMessageCreatedAt(left)).getTime() - new Date(getMessageCreatedAt(right)).getTime())
    .reduce((pending, message) => {
      if (message.from === 'web' && message.status !== 'seen') return pending + 1;
      if (message.from === 'mobile') return 0;
      return pending;
    }, 0);
}

export function mapConversation(conversation: TrouytinConversation): RoomConversation {
  const orderedMessages = [...(conversation.messages ?? [])].sort(
    (left, right) => new Date(getMessageCreatedAt(left)).getTime() - new Date(getMessageCreatedAt(right)).getTime()
  );
  const lastMessage = orderedMessages[orderedMessages.length - 1];
  const latestUserMessage = [...orderedMessages].reverse().find((message) => message.from === 'web');
  const latestAt = conversation.updatedAt || getMessageCreatedAt(lastMessage);
  const requesterName = conversation.requesterName?.trim();
  const requesterPhone = conversation.requesterPhone?.trim();

  return {
    id: String(conversation.id),
    roomId: conversation.roomId ? String(conversation.roomId) : '',
    partnerUserId: conversation.partnerUserId,
    userName: requesterName || requesterPhone || `Khách #${conversation.ownerUserId}`,
    roleLabel: 'Khách thuê',
    avatar: conversation.partnerAvatar || null,
    roomInquiry: conversation.roomTitle || conversation.roomId || String(conversation.id),
    lastMessage: latestUserMessage?.text || lastMessage?.text || '',
    timestamp: formatTime(latestAt),
    unread: countPendingWebMessages(orderedMessages),
    online: Boolean(latestAt && Date.now() - new Date(latestAt).getTime() < 15 * 60 * 1000),
    userPhone: requesterPhone || conversation.requesterEmail,
    messages: orderedMessages.map((message) => ({
      id: String(message.id),
      sender: message.from === 'mobile' ? 'me' : 'user',
      text: message.text,
      time: formatTime(getMessageCreatedAt(message)),
      createdAt: getMessageCreatedAt(message),
    })),
  };
}

export function buildPropTechPartnerUserId(userId: number | string): string {
  const value = String(userId).trim();
  if (!value) return '';
  return value.startsWith('user-') ? value : `user-${value}`;
}

export async function loadRoomConversations(partnerUserId: string): Promise<RoomConversation[]> {
  if (!partnerUserId) {
    return [];
  }

  const url = new URL(`${TROUYTIN_API_BASE_URL}/api/proptech/conversations`);
  url.searchParams.set('partnerUserId', partnerUserId);

  const response = await fetch(url.toString(), {
    headers: {
      'X-Internal-Api-Key': TROUYTIN_INTERNAL_API_KEY,
    },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || 'Không thể tải hội thoại TroUyTin');
  }

  const conversations = (await response.json()) as TrouytinConversation[];
  return conversations
    .map(mapConversation)
    .sort((left, right) => {
      const leftTime = left.messages[left.messages.length - 1]?.createdAt ?? '';
      const rightTime = right.messages[right.messages.length - 1]?.createdAt ?? '';
      return new Date(rightTime).getTime() - new Date(leftTime).getTime();
    });
}

export async function sendRoomConversationMessage(conversationId: string, partnerUserId: string, text: string): Promise<void> {
  if (!conversationId || !partnerUserId || !text.trim()) {
    return;
  }

  const url = new URL(`${TROUYTIN_API_BASE_URL}/api/proptech/conversations/${conversationId}/messages`);
  url.searchParams.set('partnerUserId', partnerUserId);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Api-Key': TROUYTIN_INTERNAL_API_KEY,
    },
    body: JSON.stringify({ text: text.trim() }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || 'Không thể gửi tin nhắn TroUyTin');
  }
}

export async function markRoomConversationRead(conversationId: string, partnerUserId: string): Promise<RoomConversation> {
  const url = new URL(`${TROUYTIN_API_BASE_URL}/api/proptech/conversations/${conversationId}/read`);
  url.searchParams.set('partnerUserId', partnerUserId);

  const response = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      'X-Internal-Api-Key': TROUYTIN_INTERNAL_API_KEY,
    },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || 'Khong the danh dau da doc hoi thoai TroUyTin');
  }

  return mapConversation((await response.json()) as TrouytinConversation);
}
