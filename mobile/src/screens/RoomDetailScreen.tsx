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
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore - TypeScript cache issue, restart TS server if error persists
import { roomService, MyRoom, ServiceInfo, ElectricityTier, RoomDetail } from '../services/room.service';
import { contractService, ContractDetail } from '../services/contract.service';
import { useAuthStore } from '../store/authStore';
import { resolveImageUrl } from '../utils/image';

export default function RoomDetailScreen() {
  const navigation = useNavigation();
  const [room, setRoom] = useState<MyRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractDetail, setContractDetail] = useState<ContractDetail | null>(null);
  const [isContractLoading, setIsContractLoading] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const [showContractDetail, setShowContractDetail] = useState(false);
  const [roomDetail, setRoomDetail] = useState<RoomDetail | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const activeContractId = useAuthStore((s) => s.activeContractId);

  useEffect(() => {
    loadRoomData();
  }, [activeContractId]);

  const loadRoomData = async () => {
    try {
      setError(null);
      const data = await roomService.getMyRoom();
      setRoom(data);
      // fetch full room detail (includes images, assets, description, amenities)
      try {
        const detail = await roomService.getRoomDetail(data.roomId);
        setRoomDetail(detail);
      } catch (e) {
        // non-fatal: show basic my-room info if detail fails
        setRoomDetail(null);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin phòng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setContractDetail(null);
    setContractError(null);
    setShowContractDetail(false);
    await loadRoomData();
    setIsRefreshing(false);
  };

  const loadContractDetail = async () => {
    if (!room?.contractId) {
      setContractError('Không tìm thấy mã hợp đồng');
      return;
    }

    try {
      setIsContractLoading(true);
      setContractError(null);
      const data = await contractService.getById(room.contractId);
      setContractDetail(data);
      setShowContractDetail(true);
    } catch (err: any) {
      setContractError(err?.message || 'Không thể tải chi tiết hợp đồng');
      setShowContractDetail(true);
    } finally {
      setIsContractLoading(false);
    }
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

  const getContractStatus = (): { status: string; label: string; color: string } => {
    if (!contractDetail) return { status: 'unknown', label: 'Không xác định', color: '#6B7280' };
    
    const today = new Date();
    const startDate = new Date(contractDetail.startDate);
    const endDate = contractDetail.expectedEndDate 
      ? new Date(contractDetail.expectedEndDate) 
      : null;

    if (endDate && today > endDate) {
      const daysOver = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
      return { status: 'expired', label: `Quá hạn ${daysOver} ngày`, color: '#DC2626' };
    }

    if (endDate) {
      const daysLeft = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 0) {
        return { status: 'expired', label: `Quá hạn ${Math.abs(daysLeft)} ngày`, color: '#DC2626' };
      } else if (daysLeft <= 7) {
        return { status: 'danger', label: `Còn ${daysLeft} ngày`, color: '#EAB308' };
      } else if (daysLeft <= 30) {
        return { status: 'warning', label: `Còn ${daysLeft} ngày`, color: '#F97316' };
      }
    }

    if (today < startDate) {
      return { status: 'upcoming', label: 'Sắp bắt đầu', color: '#3B82F6' };
    }

    return { status: 'active', label: 'Đang hoạt động', color: '#22C55E' };
  };

  const parseBillingFormula = (): Array<{ name: string; unitPrice: number; quantity: string }> => {
    if (!contractDetail) return [];
    
    try {
      const formulaJson = contractDetail.billingFormulaJson || contractDetail.BillingFormulaJson;
      if (!formulaJson) return [];
      
      const formula = typeof formulaJson === 'string' 
        ? JSON.parse(formulaJson)
        : formulaJson;
      
      if (!Array.isArray(formula)) return [];
      
      return formula
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((item: any) => ({
          name: item.serviceName || item.itemType || 'Dịch vụ',
          unitPrice: item.unitPrice || 0,
          quantity: item.quantityExpression === 'n' || !item.quantity ? 'n' : String(item.quantity),
        }));
    } catch (error) {
      console.error('Error parsing billing formula:', error);
      return [];
    }
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

          {room.maxOccupants != null && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số người tối đa:</Text>
              <Text style={styles.infoValue}>{room.maxOccupants}</Text>
            </View>
          )}

          {/* Description */}
          {roomDetail?.description || roomDetail?.imageUrls?.length ? (
            <View style={{ marginTop: 12 }}>
              {roomDetail?.imageUrls?.[0] ? (
                <TouchableOpacity onPress={() => setPreviewImageUrl(resolveImageUrl(roomDetail.imageUrls?.[0] || ''))}>
                  <Image source={{ uri: resolveImageUrl(roomDetail.imageUrls?.[0] || '') }} style={{ width: '100%', height: 200, borderRadius: 8 }} />
                </TouchableOpacity>
              ) : null}
              {roomDetail?.description ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>{roomDetail.description}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Contract Info Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color="#1A4B84" />
            <Text style={styles.sectionTitle}>Thông tin hợp đồng</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã hợp đồng:</Text>
            <Text style={styles.infoValue}>#{room.contractId}</Text>
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

          <TouchableOpacity
            style={styles.contractDetailButton}
            onPress={() => {
              if (showContractDetail) {
                setShowContractDetail(false);
                return;
              }

              if (contractDetail) {
                setShowContractDetail(true);
                return;
              }

              loadContractDetail();
            }}
            disabled={isContractLoading}
          >
            {isContractLoading ? (
              <ActivityIndicator size="small" color="#1A4B84" />
            ) : (
              <>
                <Text style={styles.contractDetailButtonText}>
                  {showContractDetail ? 'Ẩn chi tiết hợp đồng' : 'Xem chi tiết hợp đồng'}
                </Text>
                <Ionicons
                  name={showContractDetail ? 'chevron-up' : 'chevron-forward'}
                  size={18}
                  color="#1A4B84"
                />
              </>
            )}
          </TouchableOpacity>

          {showContractDetail && (
            <View style={styles.contractDetailBox}>
              {contractError ? (
                <Text style={styles.contractErrorText}>{contractError}</Text>
              ) : contractDetail ? (
                <>
                  {/* Status Badge */}
                  {(() => {
                    const statusInfo = getContractStatus();
                    return (
                      <View style={[styles.infoRowCompact, { marginBottom: 12 }]}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: statusInfo.color + '20', borderColor: statusInfo.color },
                          ]}
                        >
                          <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                            {statusInfo.label}
                          </Text>
                        </View>
                      </View>
                    );
                  })()}

                  {/* Basic Contract Info */}
                  <View style={styles.sectionDivider}>
                    <Text style={styles.sectionSubtitle}>Thông tin hợp đồng</Text>
                  </View>

                  <View style={styles.infoRowCompact}>
                    <Text style={styles.infoLabel}>Mã HD:</Text>
                    <Text style={styles.infoValue}>{contractDetail.contractCode || `#${contractDetail.id}`}</Text>
                  </View>
                  <View style={styles.infoRowCompact}>
                    <Text style={styles.infoLabel}>Phòng:</Text>
                    <Text style={styles.infoValue}>{contractDetail.roomNumber || room.roomCode}</Text>
                  </View>
                  <View style={styles.infoRowCompact}>
                    <Text style={styles.infoLabel}>Ngày bắt đầu:</Text>
                    <Text style={styles.infoValue}>{formatDate(contractDetail.startDate)}</Text>
                  </View>
                  {contractDetail.expectedEndDate && (
                    <View style={styles.infoRowCompact}>
                      <Text style={styles.infoLabel}>Ngày kết thúc:</Text>
                      <Text style={styles.infoValue}>{formatDate(contractDetail.expectedEndDate)}</Text>
                    </View>
                  )}

                  {/* Cost Information */}
                  <View style={[styles.sectionDivider, { marginTop: 12 }]}>
                    <Text style={styles.sectionSubtitle}>Chi phí</Text>
                  </View>

                  <View style={styles.infoRowCompact}>
                    <Text style={styles.infoLabel}>Tiền thuê/tháng:</Text>
                    <Text style={[styles.infoValue, styles.priceValue]}>
                      {formatCurrency(contractDetail.actualRentPrice)}
                    </Text>
                  </View>
                  <View style={styles.infoRowCompact}>
                    <Text style={styles.infoLabel}>Tiền cọc:</Text>
                    <Text style={[styles.infoValue, styles.priceValue]}>
                      {formatCurrency(contractDetail.depositAmount ?? 0)}
                    </Text>
                  </View>
                  <View style={styles.infoRowCompact}>
                    <Text style={styles.infoLabel}>Ngày thanh toán:</Text>
                    <Text style={styles.infoValue}>
                      {contractDetail.paymentDayOfMonth
                        ? `Ngày ${contractDetail.paymentDayOfMonth} hàng tháng`
                        : 'Không cố định'}
                    </Text>
                  </View>

                  {/* Billing Formula */}
                  {(() => {
                    const formulaItems = parseBillingFormula();
                    return formulaItems.length > 0 ? (
                      <>
                        <View style={[styles.sectionDivider, { marginTop: 12 }]}>
                          <Text style={styles.sectionSubtitle}>Công thức tính hóa đơn hàng tháng</Text>
                        </View>
                        {formulaItems.map((item, index) => {
                          const formulaText =
                            item.quantity === 'n'
                              ? `${formatCurrency(item.unitPrice)} × n`
                              : `${formatCurrency(item.unitPrice)} × ${item.quantity} = ${formatCurrency(
                                  item.unitPrice * parseInt(item.quantity, 10)
                                )}`;

                          return (
                            <View key={index} style={styles.infoRowCompact}>
                              <Text style={styles.infoLabel}>{item.name}:</Text>
                              <Text style={styles.infoValue}>{formulaText}</Text>
                            </View>
                          );
                        })}
                      </>
                    ) : null;
                  })()}

                  {/* Residents Information */}
                  {contractDetail.residents.length > 0 && (
                    <>
                      <View style={[styles.sectionDivider, { marginTop: 12 }]}>
                        <Text style={styles.sectionSubtitle}>
                          Thành viên trong hộ ({contractDetail.residents.length} người)
                        </Text>
                      </View>
                      {contractDetail.residents.map((resident) => {
                        const isHeadOfHousehold =
                          resident.residencyRole === 'Người thuê chính';
                        return (
                          <View
                            key={resident.residentId}
                            style={[
                              styles.residentItem,
                              isHeadOfHousehold && styles.residentItemHead,
                            ]}
                          >
                            <View style={styles.residentHeader}>
                              <Text style={styles.residentName}>
                                {resident.fullName || 'Không có tên'}
                              </Text>
                              {isHeadOfHousehold && (
                                <View style={styles.roleTag}>
                                  <Text style={styles.roleTagText}>Chủ hộ</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.residentMeta}>
                              <Text style={styles.residentMetaText}>
                                {resident.residencyRole}
                              </Text>
                            </View>
                            {resident.phoneNumber && (
                              <Text style={styles.residentMetaText}>
                                SĐT: {resident.phoneNumber}
                              </Text>
                            )}
                            {resident.idCardNumber && (
                              <Text style={styles.residentMetaText}>
                                CCCD: {resident.idCardNumber}
                              </Text>
                            )}
                            {resident.email && (
                              <Text style={styles.residentEmail}>{resident.email}</Text>
                            )}
                          </View>
                        );
                      })}
                    </>
                  )}
                </>
              ) : null}
            </View>
          )}
        </View>
        {/* Amenities & Assets (from detailed room) */}
        {((roomDetail && roomDetail.amenities && roomDetail.amenities.length > 0) || (room.amenities && room.amenities.length > 0)) && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="layers" size={20} color="#1A4B84" />
              <Text style={styles.sectionTitle}>Tiện nghi</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {(roomDetail?.amenities?.length ? roomDetail.amenities : room.amenities || []).map((a: string, i: number) => (
                <View key={i} style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: '#374151' }}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {roomDetail?.assets && roomDetail.assets.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="archive" size={20} color="#1A4B84" />
              <Text style={styles.sectionTitle}>Tài sản trong phòng</Text>
            </View>
            {roomDetail.assets.map((asset) => (
              <View key={asset.assetId} style={styles.infoRowCompact}>
                <Text style={styles.infoLabel}>{asset.assetName}</Text>
                <Text style={styles.infoValue}>x{asset.quantity}</Text>
              </View>
            ))}
          </View>
        )}

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
      {/* Image preview modal */}
      <Modal visible={!!previewImageUrl} transparent animationType="fade" onRequestClose={() => setPreviewImageUrl(null)}>
        <Pressable style={styles.previewOverlay} onPress={() => setPreviewImageUrl(null)}>
          {previewImageUrl && (
            <Image source={{ uri: previewImageUrl }} style={styles.previewImage} resizeMode="contain" />
          )}
        </Pressable>
      </Modal>
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
  contractDetailButton: {
    marginTop: 14,
    backgroundColor: '#EEF4FB',
    borderWidth: 1,
    borderColor: '#D0E0F3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contractDetailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A4B84',
  },
  contractDetailBox: {
    marginTop: 12,
    backgroundColor: '#F9FBFD',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
  },
  infoRowCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contractResidentsSection: {
    marginTop: 12,
  },
  contractResidentsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  residentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  residentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  residentMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  contractErrorText: {
    color: '#DC2626',
    fontSize: 13,
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionDivider: {
    marginTop: 12,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  residentItemHead: {
    backgroundColor: '#EEF4FB',
    borderLeftWidth: 3,
    borderLeftColor: '#1A4B84',
    paddingLeft: 10,
  },
  residentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },
  residentMetaText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  residentEmail: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 4,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '92%',
    height: '72%',
  },
});
