import { useData } from '../contexts/DataContext';
import { useUnreadConversations } from './useUnreadConversations';

/**
 * Dem so su co moi (chua xu ly) va so hoi thoai co tin nhan chua doc,
 * dung de hien tick do canh menu o Sidebar.
 */
export function useSidebarBadges() {
  const { incidents } = useData();
  const unreadConversations = useUnreadConversations();

  // Su co moi = trang thai cho xu ly, lay truc tiep tu DataContext (da co san)
  const newIncidents = incidents.filter((incident) => incident.status === 'pending').length;

  return { newIncidents, unreadConversations };
}
