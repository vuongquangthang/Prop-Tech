import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore - TypeScript cache issue, restart TS server if error persists
import { roomService, MyRoom, ServiceInfo, ElectricityTier } from '../services/room.service';

export default function RoomDetailScreen() {
  const navigation = useNavigation();
  const [room, setRoom] = useState<MyRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoomData();
  }, []);

  const loadRoomData = async () => {
    try {
      setError(null);
      const data = await roomService.getMyRoom();
      setRoom(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin phòng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRoomData();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông tin phòng</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A4B84" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !room) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông tin phòng</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#DC2626" />
          <Text style={styles.errorText}>{error || 'Không tìm thấy thông tin phòng'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRoomData}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin phòng</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Room Info Card */}
        <View style={styles.sectionCard}>
          <View style={styles.roomHeader}>
            <View style={styles.roomBadge}>
              <Ionicons name="home" size={24} color="#1A4B84" />
            </View>
            <View style={styles.roomHeaderText}>
              <Text style={styles.roomCode}>{room.roomCode}</Text>
              <Text style={styles.roomStatus}>{room.status}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Diện tích:</Text>
            <Text style={styles.infoValue}>{room.area ? `${room.area} m²` : 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tòa nhà:</Text>
            <Text style={styles.infoValue}>{room.buildingName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Địa chỉ:</Text>
            <Text style={styles.infoValue}>{room.buildingAddress}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tầng:</Text>
            <Text style={styles.infoValue}>Tầng {room.floorNumber}</Text>
          </View>
        </View>

        {/* Contract Info Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color="#1A4B84" />
            <Text style={styles.sectionTitle}>Thông tin hợp đồng</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày bắt đầu:</Text>
            <Text style={styles.infoValue}>{formatDate(room.contractStartDate)}</Text>
          </View>

          {room.contractEndDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày kết thúc:</Text>
              <Text style={styles.infoValue}>{formatDate(room.contractEndDate)}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Giá thuê:</Text>
            <Text style={[styles.infoValue, styles.priceValue]}>{formatCurrency(room.rentPrice)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tiền cọc:</Text>
            <Text style={[styles.infoValue, styles.priceValue]}>{formatCurrency(room.deposit)}</Text>
          </View>
        </View>

        {/* Services Card */}
        {room.services.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="grid" size={20} color="#1A4B84" />
              <Text style={styles.sectionTitle}>Dịch vụ</Text>
            </View>

          {room.services.map((service: ServiceInfo, index: number) => (
              <View key={service.serviceId} style={styles.serviceRow}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.serviceName}</Text>
                  <Text style={styles.serviceUnit}>Đơn vị: {service.unit}</Text>
                </View>
                <Text style={styles.servicePrice}>{formatCurrency(service.price)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Electricity Pricing Card */}
        {room.electricityTiers.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Bảng giá điện</Text>
            </View>

            {room.electricityBasePrice && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Giá cơ bản:</Text>
                <Text style={[styles.infoValue, styles.priceValue]}>
                  {formatCurrency(room.electricityBasePrice)}/kWh
                </Text>
              </View>
            )}

            <View style={styles.tierTable}>
              <View style={styles.tierHeaderRow}>
                <Text style={styles.tierHeaderCell}>Bậc</Text>
                <Text style={styles.tierHeaderCell}>Khoảng (kWh)</Text>
                <Text style={styles.tierHeaderCell}>Đơn giá</Text>
              </View>

            {room.electricityTiers.map((tier: ElectricityTier) => (
                <View key={tier.tierNumber} style={styles.tierRow}>
                  <Text style={styles.tierCell}>{tier.tierNumber}</Text>
                  <Text style={styles.tierCell}>
                    {tier.fromKwh} - {tier.toKwh || '∞'}
                  </Text>
                  <Text style={[styles.tierCell, styles.tierPrice]}>
                    {formatCurrency(tier.pricePerKwh)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Water Pricing Card */}
        {room.waterPricePerCubicMeter && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="water" size={20} color="#06B6D4" />
              <Text style={styles.sectionTitle}>Giá nước</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Đơn giá:</Text>
              <Text style={[styles.infoValue, styles.priceValue]}>
                {formatCurrency(room.waterPricePerCubicMeter)}/m³
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#1A4B84',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  roomBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F0FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roomHeaderText: {
    flex: 1,
  },
  roomCode: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  roomStatus: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  priceValue: {
    color: '#1A4B84',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceUnit: {
    fontSize: 12,
    color: '#6B7280',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A4B84',
    marginLeft: 12,
  },
  tierTable: {
    marginTop: 8,
  },
  tierHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  tierHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  tierRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tierCell: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
  },
  tierPrice: {
    fontWeight: '600',
    color: '#F59E0B',
  },
});
