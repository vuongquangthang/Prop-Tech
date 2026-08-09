import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import notificationService, { Notification } from '../services/notification.service';
import { contractService } from '../services/contract.service';
import invoiceService from '../services/invoice.service';
import maintenanceService from '../services/maintenance.service';
import { useAuthStore } from '../store/authStore';
import { palette, radius } from '../theme/palette';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const setActiveContract = useAuthStore((state) => state.setActiveContract);
  const [notifications, setNotifications] = useState<Notification[]>(() => notificationService.getCachedNotifications());
  const [loading, setLoading] = useState(() => notificationService.getCachedNotifications().length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setError(null);
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không tải được thông báo. Vui lòng thử lại.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      const cachedNotifications = notificationService.getCachedNotifications();
      if (cachedNotifications.length > 0) {
        setNotifications(cachedNotifications);
        setLoading(false);
      } else {
        setLoading(true);
      }
      loadNotifications().finally(() => setLoading(false));
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (id: number) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const setActiveContractForRoom = async (roomId?: number | null) => {
    if (!roomId) return undefined;
    const contracts = await contractService.getMyContracts();
    const matched = contracts.find((contract) => contract.roomId === roomId);
    if (matched) {
      await setActiveContract(matched.id);
      return matched.id;
    }
    return undefined;
  };

  const getNotificationRelatedId = (notification: Notification) => {
    if (notification.relatedId) return notification.relatedId;
    const linkMatch = notification.linkUrl?.match(/(?:id|relatedId|requestId|invoiceId)=(\d+)/i);
    if (linkMatch) return Number(linkMatch[1]);
    const textMatch = `${notification.title} ${notification.content}`.match(/#(\d+)/);
    return textMatch ? Number(textMatch[1]) : undefined;
  };

  const resolveLegacyInvoice = async (notification: Notification) => {
    const text = `${notification.title} ${notification.content}`;
    const periodMatch = text.match(/(?:tháng\s*)?(\d{1,2})\/(\d{4})/i);
    if (!periodMatch) return undefined;

    const month = Number(periodMatch[1]);
    const year = Number(periodMatch[2]);
    const amountMatch = notification.content.match(/Tổng tiền:\s*([\d.,\s]+)\s*đ/i);
    const amount = amountMatch ? Number(amountMatch[1].replace(/\D/g, '')) : undefined;
    const invoices = await invoiceService.getAll();
    let candidates = invoices.filter((invoice) => invoice.month === month && invoice.year === year);

    if (amount && candidates.some((invoice) => invoice.totalAmount === amount)) {
      candidates = candidates.filter((invoice) => invoice.totalAmount === amount);
    }
    if (candidates.length === 1) return candidates[0];

    const notificationTime = new Date(notification.createdAt).getTime();
    const candidatesWithApprovalTime = candidates
      .filter((invoice) => invoice.approvedAt)
      .map((invoice) => ({
        invoice,
        distance: Math.abs(new Date(invoice.approvedAt as string).getTime() - notificationTime),
      }))
      .sort((left, right) => left.distance - right.distance);

    return candidatesWithApprovalTime[0]?.distance <= 10 * 60 * 1000
      ? candidatesWithApprovalTime[0].invoice
      : undefined;
  };

  const resolveNotificationContext = async (notification: Notification) => {
    const type = (notification.notificationType || '').toUpperCase();
    const relatedId = getNotificationRelatedId(notification);
    if (type === 'INVOICE' || type === 'PAYMENT') {
      const invoice = relatedId
        ? await invoiceService.getById(relatedId)
        : await resolveLegacyInvoice(notification);
      if (!invoice) return {};
      if (invoice.contractId) {
        await setActiveContract(invoice.contractId);
        return { relatedId: invoice.id, contractId: invoice.contractId, roomId: invoice.roomId };
      }
      const contractId = await setActiveContractForRoom(invoice.roomId);
      return { relatedId: invoice.id, contractId, roomId: invoice.roomId };
    }

    if (!relatedId) return {};

    if (type === 'COMPLAINT' || type === 'MAINTENANCE') {
      const request = await maintenanceService.getById(relatedId);
      const contractId = await setActiveContractForRoom(request.roomId);
      return { relatedId, contractId, roomId: request.roomId };
    }

    return { relatedId };
  };

  const navigateByNotification = (
    notification: Notification,
    context: { relatedId?: number; contractId?: number; roomId?: number } = {},
  ) => {
    const type = (notification.notificationType || '').toUpperCase();
    const relatedId = context.relatedId ?? getNotificationRelatedId(notification);

    if (type === 'CONTRACT_CHANGE') {
      // @ts-ignore
      navigation.navigate('ContractChangeApproval', { notificationId: notification.id });
      return;
    }

    if (type === 'SERVICE_PRICE') {
      // @ts-ignore
      navigation.navigate('ServicePriceChangeDetail', { notification });
      return;
    }

    if (type === 'INVOICE' || type === 'PAYMENT') {
      if (relatedId) {
        // @ts-ignore
        navigation.navigate('BillDetail', { id: relatedId, contractId: context.contractId, roomId: context.roomId });
        return;
      }
      // @ts-ignore
      navigation.navigate('Bills', { contractId: context.contractId });
      return;
    }

    if (type === 'COMPLAINT' || type === 'MAINTENANCE') {
      if (relatedId) {
        // @ts-ignore
        navigation.navigate('IssueDetail', { id: relatedId, contractId: context.contractId, roomId: context.roomId });
        return;
      }
      // @ts-ignore
      navigation.navigate('Issues', { contractId: context.contractId, roomId: context.roomId });
      return;
    }

    // Không có màn đích cụ thể thì chỉ đánh dấu đã đọc và giữ lại trang thông báo.
  };

  const handleNotificationPress = async (notification: Notification) => {
    const type = (notification.notificationType || '').toUpperCase();
    if (type !== 'CONTRACT_CHANGE') {
      await handleMarkAsRead(notification.id);
    }
    let context: { relatedId?: number; contractId?: number; roomId?: number } = {};
    try {
      context = await resolveNotificationContext(notification);
    } catch (error) {
      console.warn('Không thể tự động chuyển hợp đồng theo thông báo:', error);
    }
    navigateByNotification(notification, context);
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderItem = ({ item }: { item: Notification }) => {
    const style = notificationService.getTypeColor(item.notificationType);
    const iconName = notificationService.getTypeIcon(item.notificationType);

    return (
      <TouchableOpacity
        style={[styles.item, !item.isRead && styles.itemUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: style.bgColor }]}>
          <Ionicons name={iconName as any} size={22} color={style.color} />
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && <View style={[styles.dot, { backgroundColor: style.color }]} />}
          </View>
          <Text style={styles.body} numberOfLines={2}>{item.content}</Text>
          <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={notifications.length === 0 ? styles.center : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={error ? 'cloud-offline-outline' : 'notifications-off-outline'}
                size={64}
                color="#CBD5E1"
              />
              <Text style={styles.emptyText}>{error || 'Không có thông báo nào'}</Text>
              {error && (
                <TouchableOpacity style={styles.retryButton} onPress={loadNotifications}>
                  <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: palette.text },
  markAllBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  markAllText: { fontSize: 13, color: palette.primary, fontWeight: '700' },
  list: { padding: 14, paddingBottom: 28 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    borderRadius: radius.lg,
    marginBottom: 10,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 3,
  },
  itemUnread: { backgroundColor: '#F6FBFF', borderColor: '#A7E1FF' },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  title: { fontSize: 14, fontWeight: '600', color: palette.text, flex: 1 },
  titleUnread: { fontWeight: '800', color: palette.primaryDark },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  body: { fontSize: 13, color: palette.textMuted, lineHeight: 18, marginBottom: 6 },
  time: { fontSize: 11, color: palette.textMuted },
  separator: { height: 0 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 15, color: '#94A3B8', fontWeight: '500' },
  retryButton: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { color: palette.surface, fontSize: 13, fontWeight: '800' },
});
