import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/postService';
import {
  buildPropTechPartnerUserId,
  loadRoomConversations,
  type RoomConversation,
} from '../services/roomConversationService';
import { connectPropTechConversationSocket } from '../services/trouytinConversationSocket';

// Cac vai tro duoc xem hoi thoai cua bai dang do minh quan ly
const MANAGED_CONVERSATION_ROLES = ['Admin', 'QuanLy'];

// Chi la luoi an toan khi socket rot; realtime van la duong chinh
const FALLBACK_POLL_MS = 60_000;

// Quet lai danh sach bai dang de bat partner moi xuat hien sau khi trang da mo
const PARTNER_REFRESH_MS = 60_000;

const collectPartnerIds = async (userId: number, role?: string): Promise<string[]> => {
  const partnerIds = new Set<string>([buildPropTechPartnerUserId(userId)]);

  if (role && MANAGED_CONVERSATION_ROLES.includes(role)) {
    const posts = await postService.getPosts().catch(() => []);
    posts.forEach((post: any) => {
      if (post.createdByUserId) {
        partnerIds.add(buildPropTechPartnerUserId(post.createdByUserId));
      }
    });
  }

  return [...partnerIds];
};

/**
 * Dem so hoi thoai dang co tin nhan chua doc cua nguoi dung hien tai.
 * Nghe WebSocket de cap nhat tuc thi, poll dinh ky chi lam du phong.
 */
export function useUnreadConversations() {
  const { user } = useAuth();
  const [partnerIds, setPartnerIds] = useState<string[]>([]);
  const [unreadConversations, setUnreadConversations] = useState(0);

  // Giu trang thai unread theo tung hoi thoai de su kien realtime chi
  // sua dung hoi thoai vua doi, khong phai tai lai toan bo
  const unreadByConversation = useRef(new Map<string, number>());

  const applyConversations = (conversations: RoomConversation[]) => {
    conversations.forEach((conversation) => {
      unreadByConversation.current.set(conversation.id, conversation.unread);
    });
    setUnreadConversations(
      [...unreadByConversation.current.values()].filter((unread) => unread > 0).length
    );
  };

  // Xac dinh minh dang theo doi hoi thoai cua nhung partner nao
  useEffect(() => {
    if (!user?.id) {
      setPartnerIds([]);
      unreadByConversation.current.clear();
      setUnreadConversations(0);
      return;
    }

    let cancelled = false;

    const refreshPartnerIds = async () => {
      const ids = await collectPartnerIds(user.id, user.role);
      if (cancelled) return;
      // So sanh chuoi de khong tao mang moi khi danh sach khong doi
      setPartnerIds((current) => (current.join('|') === ids.join('|') ? current : ids));
    };

    void refreshPartnerIds();
    const timer = setInterval(refreshPartnerIds, PARTNER_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user?.id, user?.role]);

  // Tai so lieu ban dau + nghe realtime cho tung partner
  useEffect(() => {
    if (partnerIds.length === 0) return;

    let cancelled = false;

    const reloadAll = async () => {
      const batches = await Promise.all(
        partnerIds.map((id) => loadRoomConversations(id).catch(() => [] as RoomConversation[]))
      );
      if (cancelled) return;

      // Gop theo id de khong dem trung hoi thoai xuat hien o nhieu partner
      const merged = new Map<string, RoomConversation>();
      batches.flat().forEach((conversation) => merged.set(conversation.id, conversation));

      unreadByConversation.current.clear();
      applyConversations([...merged.values()]);
    };

    void reloadAll();

    const sockets = partnerIds.map((id) =>
      connectPropTechConversationSocket({
        partnerUserId: id,
        onConversation: (conversation) => applyConversations([conversation]),
      })
    );

    // Socket rot thi quay ve poll cho den khi noi lai duoc
    const fallbackTimer = setInterval(() => {
      if (sockets.some((socket) => !socket.isConnected())) {
        void reloadAll();
      }
    }, FALLBACK_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(fallbackTimer);
      sockets.forEach((socket) => socket.disconnect());
    };
  }, [partnerIds.join('|')]);

  return unreadConversations;
}
