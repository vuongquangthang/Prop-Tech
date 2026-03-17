import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Image,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import invoiceService, { Invoice } from '../services/invoice.service';
import maintenanceService, { MaintenanceRequest } from '../services/maintenance.service';
import { roomService, MyRoom } from '../services/room.service';
import notificationService from '../services/notification.service';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [myRoom, setMyRoom] = useState<MyRoom | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [latestNotification, setLatestNotification] = useState<import('../services/notification.service').Notification | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      // Load my room info
      try {
        const roomData = await roomService.getMyRoom();
        setMyRoom(roomData);
      } catch (err) {
        console.log('Could not load room info:', err);
        setMyRoom(null);
      }

      // Load current unpaid invoice
      const unpaidInvoices = await invoiceService.getUnpaid();
      if (unpaidInvoices.length > 0) {
        // Get the most recent unpaid invoice
        const sorted = unpaidInvoices.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        setCurrentInvoice(sorted[0]);
      } else {
        setCurrentInvoice(null);
      }

      // Load maintenance request count
      const requests = await maintenanceService.getMyRequests();
      setMaintenanceCount(requests.length);

      // Load unread notification count
      const count = await notificationService.getUnreadCount();
      setUnreadNotifications(count);

      // Load latest notification
      const allNotifs = await notificationService.getMyNotifications();
      if (allNotifs.length > 0) {
        const sorted = allNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLatestNotification(sorted[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Header */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop' }}
            style={styles.heroImage}
          />
          <View style={styles.heroDarkOverlay} />
          <TouchableOpacity
            style={styles.buildingSelector}
            onPress={() => (navigation as any).navigate('RoomDetail')}
          >
            <View style={styles.buildingIcon}>
              <Ionicons name="business-outline" size={16} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.buildingLabel}>Smart Home</Text>
              <Text style={styles.buildingName} numberOfLines={1}>
                {myRoom ? `${myRoom.roomCode} · ${myRoom.buildingName}` : 'SmartHome KĐT'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => (navigation as any).navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.greeting}>
            Chào {myRoom?.householdHeadName || user?.residentName || user?.phoneNumber || 'Cư dân'}
          </Text>

          {/* Latest Notification Card */}
          {latestNotification ? (
            <TouchableOpacity
              style={styles.notifCard}
              onPress={() => (navigation as any).navigate('Notifications')}
            >
              <View style={styles.notifCardHeader}>
                <View style={[styles.notifCardIcon, !latestNotification.isRead && styles.notifCardIconUnread]}>
                  <Ionicons
                    name={
                      latestNotification.notificationType === 'INVOICE' ? 'receipt-outline' :
                      latestNotification.notificationType === 'PAYMENT' ? 'card-outline' :
                      latestNotification.notificationType === 'COMPLAINT' ? 'construct-outline' :
                      'notifications-outline'
                    }
                    size={20}
                    color={latestNotification.isRead ? '#6B7280' : '#1A4B84'}
                  />
                </View>
                <View style={styles.notifCardInfo}>
                  <Text style={styles.notifCardLabel}>THÔNG BÁO MỚI NHẤT</Text>
                  <Text style={styles.notifCardTitle} numberOfLines={1}>{latestNotification.title}</Text>
                </View>
                {!latestNotification.isRead && <View style={styles.notifUnreadDot} />}
              </View>
              <Text style={styles.notifCardBody} numberOfLines={2}>{latestNotification.content}</Text>
              <View style={styles.notifCardFooter}>
                <Text style={styles.notifCardTime}>
                  {new Date(latestNotification.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.notifCardMore}>Xem tất cả  ›</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.notifCard}
              onPress={() => (navigation as any).navigate('Notifications')}
            >
              <View style={styles.notifCardHeader}>
                <View style={styles.notifCardIcon}>
                  <Ionicons name="notifications-outline" size={20} color="#9CA3AF" />
                </View>
                <Text style={styles.notifCardEmpty}>Chưa có thông báo nào</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Warning Banner */}
          {currentInvoice && invoiceService.isOverdue(currentInvoice) && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning" size={20} color="#DC2626" />
              <View style={styles.warningText}>
                <Text style={styles.warningTitle}>Hóa đơn quá hạn</Text>
                <Text style={styles.warningSubtitle}>
                  {invoiceService.formatPeriod(currentInvoice.month, currentInvoice.year)} • Quá hạn{' '}
                  {Math.abs(invoiceService.getDaysUntilDue(currentInvoice) || 0)} ngày
                </Text>
              </View>
            </View>
          )}

          {currentInvoice && !invoiceService.isOverdue(currentInvoice) && (invoiceService.getDaysUntilDue(currentInvoice) || 0) <= 7 && (
            <View style={[styles.warningBanner, styles.warningBannerYellow]}>
              <Ionicons name="time" size={20} color="#D97706" />
              <View style={styles.warningText}>
                <Text style={[styles.warningTitle, styles.warningTitleYellow]}>Hóa đơn sắp hết hạn</Text>
                <Text style={[styles.warningSubtitle, styles.warningSubtitleYellow]}>
                  {invoiceService.formatPeriod(currentInvoice.month, currentInvoice.year)} • Còn{' '}
                  {invoiceService.getDaysUntilDue(currentInvoice)} ngày
                </Text>
              </View>
            </View>
          )}

          {/* Current Bill Card */}
          {currentInvoice ? (
            <TouchableOpacity
              style={styles.billCard}
              // @ts-ignore - Navigation typing issue
              onPress={() => navigation.navigate('BillDetail' as never, { id: currentInvoice.id })}
            >
              <Text style={styles.billLabel}>HÓA ĐƠN HIỆN TẠI</Text>
              <Text style={styles.billMonth}>
                {invoiceService.formatPeriod(currentInvoice.month, currentInvoice.year)}
              </Text>

              <View style={styles.billDivider} />

              <View style={styles.billAmountRow}>
                <Text style={styles.billTotalLabel}>Tổng tiền:</Text>
                <Text style={styles.billAmount}>
                  {invoiceService.formatCurrency(currentInvoice.totalAmount)}
                </Text>
              </View>
              <Text style={styles.billDeadline}>
                Hạn thanh toán:{' '}
                {currentInvoice.dueDate
                  ? new Date(currentInvoice.dueDate).toLocaleDateString('vi-VN')
                  : 'Chưa có'}
              </Text>

              <TouchableOpacity 
                style={styles.payButton}
                onPress={(e) => {
                  e.stopPropagation();
                  // @ts-ignore - Navigation typing issue
                  navigation.navigate('BillDetail' as never, { id: currentInvoice.id });
                }}
              >
                <Text style={styles.payButtonText}>Thanh toán ngay {'>'}</Text>
              </TouchableOpacity>

              <View style={styles.billDividerThin} />

              <TouchableOpacity
                style={styles.historyButton}
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.navigate('Bills' as never);
                }}
              >
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.historyButtonText}>Lịch sử giao dịch</Text>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </TouchableOpacity>
            </TouchableOpacity>
          ) : (
            <View style={styles.billCard}>
              <Text style={styles.billLabel}>HÓA ĐƠN HIỆN TẠI</Text>
              <Text style={styles.noBillText}>Bạn chưa có hóa đơn nào cần thanh toán</Text>
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => navigation.navigate('Bills' as never)}
              >
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.historyButtonText}>Xem lịch sử</Text>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}

          {/* Utilities Section */}
          <Text style={styles.sectionLabel}>TIỆN ÍCH</Text>
          <View style={styles.utilitiesGrid}>
            <TouchableOpacity
              style={styles.utilityCard}
              onPress={() => navigation.navigate('ReportIssue' as never)}
            >
              <View style={styles.utilityIcon}>
                <Ionicons name="construct" size={24} color="#1A4B84" />
              </View>
              <Text style={styles.utilityText}>Báo cáo sự cố</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.utilityCard}
              onPress={() => navigation.navigate('Issues' as never)}
            >
              <View style={styles.utilityIcon}>
                <Ionicons name="list" size={24} color="#1A4B84" />
              </View>
              <Text style={styles.utilityText}>Danh sách sự cố</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.floatingChatButton}
        onPress={() => navigation.navigate('Chatbot' as never)}
      >
        <Ionicons name="chatbubbles" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: 240,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroDarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  buildingSelector: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 80,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    gap: 8,
  },
  buildingLabel: {
    fontSize: 12,
    color: '#1A4B84',
    fontWeight: '500',
  },
  buildingIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1A4B84',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildingIconText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  buildingName: {
    color: '#1A4B84',
    fontSize: 13,
    fontWeight: '800',
  },
  notificationButton: {
    position: 'absolute',
    top: 112,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -64,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 24,
    minHeight: 500,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },  /* Notification card replacing roomCard */
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  notifCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  notifCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifCardIconUnread: {
    backgroundColor: '#E8F0FB',
  },
  notifCardInfo: {
    flex: 1,
  },
  notifCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  notifCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  notifCardBody: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    marginBottom: 10,
  },
  notifCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifCardTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  notifCardMore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A4B84',
  },
  notifUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A4B84',
  },
  notifCardEmpty: {
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
  },
  roomCard: {},
  roomCardHeader: {},
  roomCardIcon: {},
  roomCardInfo: {},
  roomCardTitle: {},
  roomCardCode: {},
  roomCardDetails: {},
  roomCardDetail: {},
  roomCardDetailText: {},  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  warningSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  warningBannerYellow: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  warningTitleYellow: {
    color: '#92400E',
  },
  warningSubtitleYellow: {
    color: '#78350F',
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  billLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  billMonth: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 14,
  },
  billDividerThin: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  billAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  billTotalLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  billDeadline: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 18,
  },
  billAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A4B84',
  },
  noBillText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
    marginBottom: 12,
  },
  payButton: {
    backgroundColor: '#1A4B84',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  historyButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  utilitiesGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  utilityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  utilityIcon: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F0FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  utilityBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  utilityBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  utilityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  floatingChatButton: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A4B84',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
