import { chatService, type ChatMessage } from './feature.service';

type RoomConversationMessage = {
  id: number;
  sender: 'user' | 'me';
  text: string;
  time: string;
  createdAt: string;
};

export type RoomConversation = {
  id: string;
  userName: string;
  avatar: string | null;
  roomInquiry: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  userPhone?: string;
  messages: RoomConversationMessage[];
};

const ROOM_PATTERN = /\b([A-Z]-\d{3})\b/;

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

function extractRoomInquiry(messages: ChatMessage[], fallback: string): string {
  for (const message of messages) {
    const match = message.messageText.match(ROOM_PATTERN);
    if (match?.[1]) {
      return match[1];
    }
  }

  return fallback;
}

export async function loadRoomConversations(): Promise<RoomConversation[]> {
  const history = await chatService.getAllHistory(1000);
  const grouped = new Map<number, ChatMessage[]>();

  for (const message of history) {
    const existing = grouped.get(message.userId) ?? [];
    existing.push(message);
    grouped.set(message.userId, existing);
  }

  return Array.from(grouped.entries())
    .map(([userId, userMessages]) => {
      const ordered = [...userMessages].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
      const roomInquiry = extractRoomInquiry(ordered, `#${userId}`);
      const lastMessage = ordered[ordered.length - 1];
      const latestUserMessage = [...ordered].reverse().find((message) => message.messageRole === 'user');
      const unread = ordered.filter((message) => message.messageRole === 'user').length;

      return {
        id: String(userId),
        userName: ordered[0]?.userPhone ? `Người thuê ${ordered[0].userPhone.slice(-4)}` : `Người thuê #${userId}`,
        avatar: null,
        roomInquiry,
        lastMessage: latestUserMessage?.messageText || lastMessage?.messageText || '',
        timestamp: formatTime(lastMessage?.createdAt),
        unread,
        online: Boolean(lastMessage?.createdAt && Date.now() - new Date(lastMessage.createdAt).getTime() < 15 * 60 * 1000),
        userPhone: ordered[0]?.userPhone,
        messages: ordered.map((message) => ({
          id: Number(message.id),
          sender: message.messageRole === 'assistant' ? 'me' : 'user',
          text: message.messageText,
          time: formatTime(message.createdAt),
          createdAt: message.createdAt,
        })),
      } satisfies RoomConversation;
    })
    .sort((left, right) => {
      const leftTime = left.messages[left.messages.length - 1]?.createdAt ?? '';
      const rightTime = right.messages[right.messages.length - 1]?.createdAt ?? '';
      return new Date(rightTime).getTime() - new Date(leftTime).getTime();
    });
}
