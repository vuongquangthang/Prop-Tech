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
import { palette, radius } from '../theme/palette';

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
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const displayRoomImages = (roomDetail?.imageUrls ?? [])
    .map((url) => resolveImageUrl(url))
    .filter((url) => Boolean(url) && !failedImages.has(url));
  const normalizeDisplayName = (value?: string | null) =>
    (value || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const assetNameSet = new Set(
    (roomDetail?.assets ?? [])
      .map((asset) => normalizeDisplayName(asset.assetName))
      .filter(Boolean),
  );
  const displayAmenities = (roomDetail?.amenities?.length ? roomDetail.amenities : room?.amenities || [])
    .map((amenity) => amenity?.trim())
    .filter((amenity): amenity is string => Boolean(amenity))
    .filter((amenity, index, source) =>
      source.findIndex((item) => normalizeDisplayName(item) === normalizeDisplayName(amenity)) === index,
    )
    .filter((amenity) => !assetNameSet.has(normalizeDisplayName(amenity)));

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
        setFailedImages(new Set());
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
    if (!contractDetail) return { status: 'unknown', label: 'Không xác định', color: palette.textMuted };
    
    const today = new Date();
    const startDate = new Date(contractDetail.startDate);
    const endDate = contractDetail.expectedEndDate 
      ? new Date(contractDetail.expectedEndDate) 
      : null;

    if (endDate && today > endDate) {
      const daysOver = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
      return { status: 'expired', label: `Quá hạn ${daysOver} ngày`, color: palette.danger };
    }

    if (endDate) {
      const daysLeft = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 0) {
        return { status: 'expired', label: `Quá hạn ${Math.abs(daysLeft)} ngày`, color: palette.danger };
      } else if (daysLeft <= 7) {
        return { status: 'danger', label: `Còn ${daysLeft} ngày`, color: palette.warning };
      } else if (daysLeft <= 30) {
        return { status: 'warning', label: `Còn ${daysLeft} ngày`, color: palette.accent };
      }
    }

    if (today < startDate) {
      return { status: 'upcoming', label: 'Sắp bắt đầu', color: palette.primary };
    }

    return { status: 'active', label: 'Đang hoạt động', color: palette.success };
  };

  const parseBillingFormula = (): Array<{ name: string; itemType: string; quantity: string }> => {
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
          itemType: item.itemType || '',
          quantity: item.quantityExpression === 'n' || !item.quantity ? 'n' : String(item.quantity),
        }));
    } catch (error) {
      console.error('Error parsing billing formula:', error);
      return [];
    }
  };

  const getContractFormulaDisplayName = (item: { name: string; itemType: string }) => {
    const itemType = item.itemType.toLowerCase();
    if (itemType === 'dien') return 'Tiền điện';
    if (itemType === 'nuoc') return 'Tiền nước';
    if (itemType === 'tienphong') return 'Tiền phòng';
    return item.name;
  };

  const renderContractDetailContent = () => {
    if (contractError) {
      return <Text style={styles.contractErrorText}>{contractError}</Text>;
    }

    if (!contractDetail) {
      return null;
    }

    const statusInfo = getContractStatus();
    const formulaItems = parseBillingFormula();

    return (
      <>
        <View style={styles.contractDocumentHero}>
          <View style={styles.contractDocumentIcon}>
            <Ionicons name="document-text" size={26} color="#FFFFFF" />
          </View>
          <View style={styles.contractDocumentHeroText}>
            <Text style={styles.contractDocumentLabel}>HỢP ĐỒNG THUÊ PHÒNG</Text>
            <Text style={styles.contractDocumentCode}>
              {contractDetail.contractCode || `#${contractDetail.id}`}
            </Text>
            <Text style={styles.contractDocumentRoom}>
              Phòng {contractDetail.roomNumber || room?.roomCode || '-'}
            </Text>
          </View>
          <View
            style={[
              styles.contractDocumentStatus,
              { backgroundColor: statusInfo.color + '18', borderColor: statusInfo.color },
            ]}
          >
            <Text style={[styles.contractDocumentStatusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.contractSectionBlock}>
          <Text style={styles.contractSectionTitle}>I. Thông tin chung</Text>
          <View style={styles.contractClauseRow}>
            <Text style={styles.contractClauseLabel}>Mã hợp đồng</Text>
            <Text style={styles.contractClauseValue}>{contractDetail.contractCode || `#${contractDetail.id}`}</Text>
          </View>
          <View style={styles.contractClauseRow}>
            <Text style={styles.contractClauseLabel}>Phòng thuê</Text>
            <Text style={styles.contractClauseValue}>{contractDetail.roomNumber || room?.roomCode}</Text>
          </View>
          <View style={styles.contractClauseRow}>
            <Text style={styles.contractClauseLabel}>Ngày bắt đầu</Text>
            <Text style={styles.contractClauseValue}>{formatDate(contractDetail.startDate)}</Text>
          </View>
          {contractDetail.expectedEndDate && (
            <View style={styles.contractClauseRow}>
              <Text style={styles.contractClauseLabel}>Ngày kết thúc</Text>
              <Text style={styles.contractClauseValue}>{formatDate(contractDetail.expectedEndDate)}</Text>
            </View>
          )}
        </View>

        <View style={styles.contractSectionBlock}>
          <Text style={styles.contractSectionTitle}>II. Điều khoản tài chính</Text>
          <View style={styles.contractFinanceGrid}>
            <View style={styles.contractFinanceCard}>
              <Text style={styles.contractFinanceLabel}>Tiền thuê/tháng</Text>
              <Text style={styles.contractFinanceValue}>
                {formatCurrency(contractDetail.actualRentPrice)}
              </Text>
            </View>
            <View style={styles.contractFinanceCard}>
              <Text style={styles.contractFinanceLabel}>Tiền cọc</Text>
              <Text style={styles.contractFinanceValue}>
                {formatCurrency(contractDetail.depositAmount ?? 0)}
              </Text>
            </View>
          </View>
          <View style={styles.contractClauseRow}>
            <Text style={styles.contractClauseLabel}>Ngày thanh toán</Text>
            <Text style={styles.contractClauseValue}>
              {contractDetail.paymentDayOfMonth
                ? `Ngày ${contractDetail.paymentDayOfMonth} hàng tháng`
                : 'Không cố định'}
            </Text>
          </View>
        </View>

        {formulaItems.length > 0 && (
          <View style={styles.contractSectionBlock}>
            <Text style={styles.contractSectionTitle}>III. Công thức tính hóa đơn hàng tháng</Text>
            {formulaItems.map((item, index) => {
              const formulaName = getContractFormulaDisplayName(item);
              const formulaText = `${formulaName} × ${item.quantity}`;

              return (
                <View key={index} style={styles.contractClauseRow}>
                  <Text style={styles.contractClauseLabel}>{formulaName}</Text>
                  <Text style={styles.contractClauseValue}>{formulaText}</Text>
                </View>
              );
            })}
          </View>
        )}

        {contractDetail.residents.length > 0 && (
          <View style={styles.contractSectionBlock}>
            <Text style={styles.contractSectionTitle}>
              IV. Thành viên cư trú ({contractDetail.residents.length} người)
            </Text>
            {contractDetail.residents.map((resident) => {
              const isHeadOfHousehold = resident.residencyRole === 'Người thuê chính';
              return (
                <View
                  key={resident.residentId}
                  style={[
                    styles.residentItem,
                    isHeadOfHousehold && styles.residentItemHead,
                  ]}
                >
                  <View style={styles.residentHeader}>
                    <Text style={styles.residentName}>{resident.fullName || 'Không có tên'}</Text>
                    {isHeadOfHousehold && (
                      <View style={styles.roleTag}>
                        <Text style={styles.roleTagText}>Cư dân đại diện</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.residentMeta}>
                    <Text style={styles.residentMetaText}>{resident.residencyRole}</Text>
                  </View>
                  {resident.phoneNumber && (
                    <Text style={styles.residentMetaText}>SĐT: {resident.phoneNumber}</Text>
                  )}
                  {resident.idCardNumber && (
                    <Text style={styles.residentMetaText}>CCCD: {resident.idCardNumber}</Text>
                  )}
                  {resident.email && <Text style={styles.residentEmail}>{resident.email}</Text>}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.contractDocumentFooter}>
          <Text style={styles.contractDocumentFooterText}>
            Thông tin hợp đồng được đồng bộ từ hệ thống quản lý tòa nhà.
          </Text>
        </View>
      </>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông tin phòng</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !room) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông tin phòng</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={palette.danger} />
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
          <Ionicons name="arrow-back" size={24} color={palette.text} />
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
        <View style={styles.roomHeroCard}>
          <View style={styles.roomHeader}>
            <View style={styles.roomBadge}>
              <Ionicons name="home" size={24} color={palette.primary} />
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
          {roomDetail?.description || displayRoomImages.length > 0 ? (
            <View style={{ marginTop: 12 }}>
              {displayRoomImages[0] ? (
                <TouchableOpacity onPress={() => setPreviewImageUrl(displayRoomImages[0])}>
                  <Image
                    source={{ uri: displayRoomImages[0] }}
                    style={styles.roomPreviewImage}
                    onError={() => setFailedImages((current) => new Set(current).add(displayRoomImages[0]))}
                  />
                </TouchableOpacity>
              ) : null}
              {roomDetail?.description ? (
                <View style={styles.roomDescriptionBox}>
                  <Text style={styles.roomDescription}>{roomDetail.description}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Contract Info Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color={palette.primary} />
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
              <ActivityIndicator size="small" color={palette.primary} />
            ) : (
              <>
                <Text style={styles.contractDetailButtonText}>
                  {showContractDetail ? 'Ẩn chi tiết hợp đồng' : 'Xem chi tiết hợp đồng'}
                </Text>
                <Ionicons
                  name={showContractDetail ? 'chevron-up' : 'chevron-forward'}
                  size={18}
                  color={palette.primary}
                />
              </>
            )}
          </TouchableOpacity>

        </View>
        {/* Amenities & Assets (from detailed room) */}
        {displayAmenities.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="layers" size={20} color={palette.primary} />
              <Text style={styles.sectionTitle}>Tiện nghi</Text>
            </View>
            <View style={styles.amenityGrid}>
              {displayAmenities.map((a: string, i: number) => (
                <View key={i} style={styles.amenityChip}>
                  <Ionicons name="checkmark-circle" size={13} color={palette.secondary} />
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {roomDetail?.assets && roomDetail.assets.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="archive" size={20} color={palette.primary} />
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
              <Ionicons name="grid" size={20} color={palette.primary} />
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
              <Ionicons name="flash" size={20} color={palette.warning} />
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
              <Ionicons name="water" size={20} color={palette.secondary} />
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
      <Modal
        visible={showContractDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContractDetail(false)}
      >
        <View style={styles.contractModalOverlay}>
          <Pressable style={styles.contractModalBackdrop} onPress={() => setShowContractDetail(false)} />
          <View style={styles.contractModalCard}>
            <View style={styles.contractModalHandle} />
            <View style={styles.contractModalHeader}>
              <View style={styles.contractModalTitleWrap}>
                <Ionicons name="document-text" size={20} color={palette.primary} />
                <View>
                  <Text style={styles.contractModalTitle}>Hợp đồng thuê phòng</Text>
                  <Text style={styles.contractModalSubtitle}>Chi tiết điều khoản và thành viên cư trú</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.contractModalClose} onPress={() => setShowContractDetail(false)}>
                <Ionicons name="close" size={22} color={palette.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.contractModalScroll}
              contentContainerStyle={styles.contractModalContent}
              showsVerticalScrollIndicator={false}
            >
              {renderContractDetailContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    backgroundColor: palette.background,
  },
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.text,
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
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: palette.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.md,
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
    paddingBottom: 30,
  },
  roomHeroCard: {
    position: 'relative',
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#A7E1FF',
    padding: 16,
    marginBottom: 16,
    shadowColor: palette.shadowStrong,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 7,
    overflow: 'hidden',
  },
  sectionCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    padding: 16,
    marginBottom: 16,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 3,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  roomBadge: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: palette.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roomHeaderText: {
    flex: 1,
  },
  roomCode: {
    fontSize: 26,
    fontWeight: '900',
    color: palette.text,
    marginBottom: 4,
  },
  roomStatus: {
    fontSize: 14,
    color: palette.secondary,
    fontWeight: '800',
  },
  roomPreviewImage: {
    width: '100%',
    height: 168,
    borderRadius: radius.lg,
    marginTop: 4,
  },
  roomDescriptionBox: {
    marginTop: 10,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  roomDescription: {
    fontSize: 14,
    color: palette.textMuted,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  infoLabel: {
    fontSize: 14,
    color: palette.textMuted,
  },
  infoValue: {
    fontSize: 14,
    color: palette.text,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
  },
  priceValue: {
    color: palette.primary,
    fontWeight: '900',
  },
  contractDetailButton: {
    marginTop: 14,
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: '#A7E1FF',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contractDetailButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.primary,
  },
  contractDetailBox: {
    marginTop: 12,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    borderRadius: radius.md,
    padding: 12,
  },
  contractModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17,24,39,0.55)',
  },
  contractModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  contractModalCard: {
    maxHeight: '84%',
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  contractModalHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: palette.border,
    alignSelf: 'center',
    marginTop: 10,
  },
  contractModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  contractModalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contractModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.text,
  },
  contractModalSubtitle: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: 2,
  },
  contractModalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractModalScroll: {
    flexGrow: 0,
  },
  contractModalContent: {
    padding: 16,
    paddingBottom: 28,
  },
  contractDocumentHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.primaryDark,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 14,
  },
  contractDocumentIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contractDocumentHeroText: {
    flex: 1,
  },
  contractDocumentLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.6,
  },
  contractDocumentCode: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 3,
  },
  contractDocumentRoom: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
  },
  contractDocumentStatus: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    maxWidth: 112,
  },
  contractDocumentStatusText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  contractSectionBlock: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
  },
  contractSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.primary,
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  contractClauseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: palette.borderSoft,
  },
  contractClauseLabel: {
    flex: 0.9,
    fontSize: 13,
    color: palette.textMuted,
  },
  contractClauseValue: {
    flex: 1.1,
    fontSize: 13,
    color: palette.text,
    fontWeight: '600',
    textAlign: 'right',
  },
  contractFinanceGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  contractFinanceCard: {
    flex: 1,
    backgroundColor: palette.primarySoft,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7E1FF',
  },
  contractFinanceLabel: {
    fontSize: 12,
    color: palette.textMuted,
    marginBottom: 5,
  },
  contractFinanceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.primary,
  },
  contractDocumentFooter: {
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    borderRadius: radius.md,
    padding: 12,
  },
  contractDocumentFooterText: {
    fontSize: 12,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  infoRowCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  contractResidentsSection: {
    marginTop: 12,
  },
  contractResidentsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 8,
  },
  residentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  residentName: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.text,
  },
  residentMeta: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: 2,
  },
  contractErrorText: {
    color: palette.danger,
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.text,
    marginLeft: 8,
  },
  amenityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: palette.secondarySoft,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#B9F4E8',
  },
  amenityText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.text,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 4,
  },
  serviceUnit: {
    fontSize: 12,
    color: palette.textMuted,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.primary,
    marginLeft: 12,
  },
  tierTable: {
    marginTop: 8,
  },
  tierHeaderRow: {
    flexDirection: 'row',
    backgroundColor: palette.surfaceSoft,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  tierHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: palette.textMuted,
    textAlign: 'center',
  },
  tierRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  tierCell: {
    flex: 1,
    fontSize: 14,
    color: palette.text,
    textAlign: 'center',
  },
  tierPrice: {
    fontWeight: '600',
    color: palette.accent,
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
    borderBottomColor: palette.borderSoft,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.text,
  },
  residentItemHead: {
    backgroundColor: palette.primarySoft,
    borderLeftWidth: 3,
    borderLeftColor: palette.primary,
    paddingLeft: 10,
  },
  residentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleTag: {
    backgroundColor: palette.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A7E1FF',
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.primaryDark,
  },
  residentMetaText: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: 2,
  },
  residentEmail: {
    fontSize: 12,
    color: palette.primary,
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
