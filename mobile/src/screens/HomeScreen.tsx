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
// @ts-ignore - TypeScript cache issue, restart TS server if error persists
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
          <TouchableOpacity style={styles.buildingSelector}>
            <View style={styles.buildingIcon}>
              <Text style={styles.buildingIconText}>SH</Text>
            </View>
            <Text style={styles.buildingName}>SmartHome KĐT...</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
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
            Chào {user?.fullName || user?.phoneNumber || 'Cư dân'}
          </Text>

          {/* My Room Card */}
          {myRoom && (
            <TouchableOpacity
              style={styles.roomCard}
              // @ts-ignore - Navigation typing issue
              onPress={() => navigation.navigate('RoomDetail' as never)}
            >
              <View style={styles.roomCardHeader}>
                <View style={styles.roomCardIcon}>
                  <Ionicons name="home" size={24} color="#2563EB" />
                </View>
                <View style={styles.roomCardInfo}>
                  <Text style={styles.roomCardTitle}>Phòng của tôi</Text>
                  <Text style={styles.roomCardCode}>{myRoom.roomCode}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
              <View style={styles.roomCardDetails}>
                <View style={styles.roomCardDetail}>
                  <Ionicons name="layers-outline" size={16} color="#6B7280" />
                  <Text style={styles.roomCardDetailText}>Tầng {myRoom.floorNumber}</Text>
                </View>
                {myRoom.area && (
                  <View style={styles.roomCardDetail}>
                    <Ionicons name="expand-outline" size={16} color="#6B7280" />
                    <Text style={styles.roomCardDetailText}>{myRoom.area} m²</Text>
                  </View>
                )}
                <View style={styles.roomCardDetail}>
                  <Ionicons name="business-outline" size={16} color="#6B7280" />
                  <Text style={styles.roomCardDetailText}>{myRoom.buildingName}</Text>
                </View>
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

              <View style={styles.billDetails}>
                <View>
                  <Text style={styles.billTotalLabel}>Tổng tiền:</Text>
                  <Text style={styles.billDeadline}>
                    Hạn thanh toán:{' '}
                    {currentInvoice.dueDate
                      ? new Date(currentInvoice.dueDate).toLocaleDateString('vi-VN')
                      : 'Chưa có'}
                  </Text>
                </View>
                <Text style={styles.billAmount}>
                  {invoiceService.formatCurrency(currentInvoice.totalAmount)}
                </Text>
              </View>

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
                <Ionicons name="construct" size={24} color="#2563EB" />
              </View>
              <Text style={styles.utilityText}>Báo cáo sự cố</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.utilityCard}
              onPress={() => navigation.navigate('Issues' as never)}
            >
              <View style={styles.utilityIcon}>
                <Ionicons name="list" size={24} color="#2563EB" />
                {maintenanceCount > 0 && (
                  <View style={styles.utilityBadge}>
                    <Text style={styles.utilityBadgeText}>{maintenanceCount}</Text>
                  </View>
                )}
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
    top: 48,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buildingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  buildingIconText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  buildingName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  notificationButton: {
    position: 'absolute',
    top: 48,
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
  },  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roomCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roomCardInfo: {
    flex: 1,
  },
  roomCardTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  roomCardCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  roomCardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roomCardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roomCardDetailText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },  warningBanner: {
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
    backgroundColor: '#F0F4F8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  billLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  billMonth: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  billDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  billTotalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  billDeadline: {
    fontSize: 12,
    color: '#6B7280',
  },
  billAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  noBillText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
    marginBottom: 12,
  },
  payButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
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
    backgroundColor: '#EFF6FF',
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
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
