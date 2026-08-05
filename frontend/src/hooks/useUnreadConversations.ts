import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/postService';
import {
  buildPropTechPartnerUserId,
  loadRoomConversations,
  type RoomConversation,
} from '../services/roomConversationService';

// Cac vai tro duoc xem hoi thoai cua bai dang do minh quan ly
const MANAGED_CONVERSATION_ROLES = ['Admin', 'QuanLy'];

const POLL_INTERVAL_MS = 60_000;

/** Dem so hoi thoai dang co tin nhan chua doc cua nguoi dung hien tai. */
export function useUnreadConversations() {
  const { user } = useAuth();
  const [unreadConversations, setUnreadConversations] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setUnreadConversations(0);
      return;
    }

    let cancelled = false;

    const countUnread = async () => {
      const partnerIds = new Set<string>([buildPropTechPartnerUserId(user.id)]);

      if (user.role && MANAGED_CONVERSATION_ROLES.includes(user.role)) {
        const posts = await postService.getPosts().catch(() => []);
        posts.forEach((post: any) => {
          if (post.createdByUserId) {
            partnerIds.add(buildPropTechPartnerUserId(post.createdByUserId));
          }
        });
      }

      const batches = await Promise.all(
        [...partnerIds].map((id) => loadRoomConversations(id).catch(() => [] as RoomConversation[]))
      );

      // Gop theo id de khong dem trung hoi thoai xuat hien o nhieu partner
      const merged = new Map<string, RoomConversation>();
      batches.flat().forEach((conversation) => merged.set(conversation.id, conversation));

      if (cancelled) return;
      setUnreadConversations([...merged.values()].filter((c) => c.unread > 0).length);
    };

    void countUnread();
    const timer = setInterval(countUnread, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user?.id, user?.role]);

  return unreadConversations;
}
