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
import { contractService } from '../services/contract.service';
import invoiceService, { Invoice } from '../services/invoice.service';
import maintenanceService, { MaintenanceRequest } from '../services/maintenance.service';
import { roomService, MyRoom } from '../services/room.service';
import notificationService from '../services/notification.service';
import { palette, radius } from '../theme/palette';
import { canResidentManageFinancialActions } from '../utils/residentPermissions';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [myRoom, setMyRoom] = useState<MyRoom | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [latestUnreadNotification, setLatestUnreadNotification] = useState<import('../services/notification.service').Notification | null>(null);
  const [canPayCurrentInvoice, setCanPayCurrentInvoice] = useState(false);

  const activeContractId = useAuthStore((s) => s.activeContractId);

  useEffect(() => {
    loadData();
  }, [activeContractId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [activeContractId])
  );

  const loadData = async () => {
    try {
      // Load my room info
      try {
        const activeContractId = useAuthStore.getState().activeContractId;
        if (activeContractId) {
          // Fetch contract then room detail directly to avoid stale/default my-room
          const contract = await contractService.getById(activeContractId);
          if (contract) {
            const detail = await roomService.getRoomDetail(contract.roomId);
            const primary = contract.residents?.find(r => r.residencyRole && (r.residencyRole.includes('Người thuê') || r.residencyRole.includes('Chủ')))
              || contract.residents?.[0];

            const myRoomFromContract = {
              roomId: detail.id,
              roomCode: detail.roomCode || '',
              area: detail.area ?? null,
              maxOccupants: detail.maxOccupants ?? null,
              amenities: detail.amenities ?? [],
              status: detail.status ?? 'N/A',
              buildingId: 0,
              buildingName: detail.buildingName ?? '',
              buildingAddress: '',
              floorId: 0,
              floorNumber: detail.floorNumber ?? 0,
              contractId: contract.id,
              contractStartDate: contract.startDate,
              contractEndDate: contract.expectedEndDate ?? null,
              rentPrice: contract.actualRentPrice,
              deposit: contract.depositAmount ?? 0,
              householdHeadName: primary?.fullName,
              services: [],
              electricityBasePrice: null,
              electricityTiers: [],
              waterPricePerCubicMeter: null,
            } as any;

            setMyRoom(myRoomFromContract);
          } else {
            setMyRoom(null);
          }
        } else {
          const roomData = await roomService.getMyRoom();
          setMyRoom(roomData);
        }
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
        const nextInvoice = sorted[0];
        setCurrentInvoice(nextInvoice);
        try {
          const invoiceContract = await contractService.getById(nextInvoice.contractId);
          setCanPayCurrentInvoice(canResidentManageFinancialActions(invoiceContract, user?.residentId));
        } catch {
          setCanPayCurrentInvoice(false);
        }
      } else {
        setCurrentInvoice(null);
        setCanPayCurrentInvoice(false);
      }

      // Load maintenance request count
      const requests = await maintenanceService.getMyRequests();
      setMaintenanceCount(requests.length);

      // Load unread notification count
      const count = await notificationService.getUnreadCount();
      setUnreadNotifications(count);

      // Load newest unread notification
      const allNotifs = await notificationService.getMyNotifications();
      const unread = allNotifs.filter(n => !n.isRead);
      if (unread.length > 0) {
        const sortedUnread = unread.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLatestUnreadNotification(sortedUnread[0]);
      } else {
        setLatestUnreadNotification(null);
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

  const accountDisplayName =
    user?.displayName ||
    user?.fullName ||
    user?.residentName ||
    user?.phoneNumber ||
    'Cư dân';

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
            Chào {accountDisplayName}
          </Text>
          <Text style={styles.greetingSub}>
            Quản lý phòng, hóa đơn và sự cố của bạn trong một không gian duy nhất.
          </Text>

          {/* Latest Notification Card */}
          {latestUnreadNotification ? (
            <TouchableOpacity
              style={styles.notifCard}
              onPress={() => (navigation as any).navigate('Notifications')}
            >
              <View style={styles.notifCardHeader}>
                <View style={[styles.notifCardIcon, styles.notifCardIconUnread]}>
                  <Ionicons
                    name={
                      latestUnreadNotification.notificationType === 'INVOICE' ? 'receipt-outline' :
                      latestUnreadNotification.notificationType === 'PAYMENT' ? 'card-outline' :
                      latestUnreadNotification.notificationType === 'COMPLAINT' ? 'construct-outline' :
                      'notifications-outline'
                    }
                    size={20}
                    color={palette.primary}
                  />
                </View>
                <View style={styles.notifCardInfo}>
                  <Text style={styles.notifCardLabel}>THÔNG BÁO CHƯA ĐỌC MỚI NHẤT</Text>
                  <Text style={styles.notifCardTitle} numberOfLines={1}>{latestUnreadNotification.title}</Text>
                </View>
                <View style={styles.notifUnreadDot} />
              </View>
              <Text style={styles.notifCardBody} numberOfLines={2}>{latestUnreadNotification.content}</Text>
              <View style={styles.notifCardFooter}>
                <Text style={styles.notifCardTime}>
                  {new Date(latestUnreadNotification.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
              <View style={styles.billGlow} />
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

              {canPayCurrentInvoice && (
                <TouchableOpacity 
                  style={styles.payButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    // @ts-ignore - Navigation typing issue
                    navigation.navigate('BillDetail' as never, { id: currentInvoice.id });
                  }}
                >
                  <Text style={styles.payButtonText}>Thanh toán ngay</Text>
                  <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                </TouchableOpacity>
              )}

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
              <View style={styles.billGlow} />
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
              <View style={[styles.utilityIcon, styles.utilityIconBlue]}>
                <Ionicons name="construct" size={23} color={palette.primary} />
              </View>
              <Text style={styles.utilityText}>Báo cáo sự cố</Text>
              <Text style={styles.utilityHint}>Gửi yêu cầu mới</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.utilityCard}
              onPress={() => navigation.navigate('Issues' as never)}
            >
              <View style={[styles.utilityIcon, styles.utilityIconGreen]}>
                <Ionicons name="list" size={23} color={palette.secondary} />
              </View>
              <Text style={styles.utilityText}>Danh sách sự cố</Text>
              <Text style={styles.utilityHint}>Theo dõi tiến độ</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.utilityCard, styles.utilityCardFull]}
            onPress={() => navigation.navigate('RoommatePost' as never)}
          >
            <View style={[styles.utilityIcon, styles.utilityIconWarm]}>
              <Ionicons name="people" size={23} color={palette.accent} />
            </View>
            <View>
              <Text style={styles.utilityText}>Tìm bạn ở ghép</Text>
              <Text style={styles.utilityHint}>Đăng bài và trao đổi trực tiếp</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.floatingChatButton}
        onPress={() => navigation.navigate('Chatbot' as never)}
      >
        <Ionicons name="sparkles" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: 255,
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
    backgroundColor: 'rgba(6, 25, 48, 0.52)',
  },
  buildingSelector: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 80,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    gap: 8,
  },
  buildingLabel: {
    fontSize: 12,
    color: palette.textMuted,
    fontWeight: '500',
  },
  buildingIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildingIconText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  buildingName: {
    color: palette.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  notificationButton: {
    position: 'absolute',
    top: 112,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: radius.md,
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
    backgroundColor: palette.danger,
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
    backgroundColor: palette.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -64,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 28,
    minHeight: 500,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.text,
    marginBottom: 5,
  },
  greetingSub: {
    fontSize: 13,
    color: palette.textMuted,
    lineHeight: 19,
    marginBottom: 16,
  },
  /* Notification card replacing roomCard */
  notifCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 20,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 4,
    borderWidth: 1,
    borderColor: palette.borderSoft,
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
    backgroundColor: palette.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifCardIconUnread: {
    backgroundColor: palette.primarySoft,
  },
  notifCardInfo: {
    flex: 1,
  },
  notifCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  notifCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.text,
  },
  notifCardBody: {
    fontSize: 13,
    color: palette.textMuted,
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
    color: palette.textMuted,
  },
  notifCardMore: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.primary,
  },
  notifUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.primary,
  },
  notifCardEmpty: {
    fontSize: 14,
    color: palette.textMuted,
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
    backgroundColor: palette.dangerSoft,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: radius.md,
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
    color: palette.text,
    marginBottom: 2,
  },
  warningSubtitle: {
    fontSize: 12,
    color: palette.textMuted,
  },
  warningBannerYellow: {
    backgroundColor: palette.accentSoft,
    borderColor: '#FFE5A3',
  },
  warningTitleYellow: {
    color: '#92400E',
  },
  warningSubtitleYellow: {
    color: '#78350F',
  },
  billCard: {
    position: 'relative',
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DCEAF5',
    shadowColor: palette.shadowStrong,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 7,
    overflow: 'hidden',
  },
  billGlow: {
    position: 'absolute',
    top: -70,
    right: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: palette.primarySoft,
  },
  billLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  billMonth: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 14,
  },
  billDivider: {
    height: 1,
    backgroundColor: palette.border,
    marginBottom: 14,
  },
  billDividerThin: {
    height: 1,
    backgroundColor: palette.borderSoft,
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
    color: palette.textMuted,
  },
  billDeadline: {
    fontSize: 12,
    color: palette.textMuted,
    marginBottom: 18,
  },
  billAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.primary,
  },
  noBillText: {
    fontSize: 14,
    color: palette.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
    marginBottom: 12,
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
    shadowColor: palette.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 5,
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
    color: palette.textMuted,
    marginLeft: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textMuted,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  utilitiesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  utilityCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    borderRadius: radius.lg,
    padding: 16,
    alignItems: 'center',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 4,
  },
  utilityCardFull: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
  },
  utilityIcon: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  utilityIconBlue: {
    backgroundColor: palette.primarySoft,
  },
  utilityIconGreen: {
    backgroundColor: palette.secondarySoft,
  },
  utilityIconWarm: {
    backgroundColor: palette.accentSoft,
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
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
  },
  utilityHint: {
    fontSize: 11,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  floatingChatButton: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
