import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { contractService } from '../services/contract.service';
import { useAuthStore } from '../store/authStore';
import { postService } from '../services/post.service';
import { MyRoom, RoomDetail, roomService } from '../services/room.service';
import type { PostDto } from '../types/dto';
import { resolveImageUrl } from '../utils/image';

const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.round(value || 0)));

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return date.toLocaleDateString('vi-VN');
};

export default function RoommateDetailScreen() {
  const navigation = useNavigation<any>();
  const heroScrollRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<PostDto | null>(null);
  const [room, setRoom] = useState<MyRoom | null>(null);
  const [roomDetail, setRoomDetail] = useState<RoomDetail | null>(null);
  const [currentOccupants, setCurrentOccupants] = useState<number>(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [heroWidth, setHeroWidth] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const activeContractId = useAuthStore((s) => s.activeContractId);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [myPost, myRoom] = await Promise.all([postService.getMyPost(), roomService.getMyRoom()]);
      setPost(myPost);
      setRoom(myRoom);
      setCurrentImageIndex(0);
      try {
        const detail = await roomService.getRoomDetail(myRoom.roomId);
        setRoomDetail(detail);
      } catch {
        setRoomDetail(null);
      }

      const contract = await contractService.getById(myRoom.contractId);
      const now = new Date();
      const activeResidents = contract.residents.filter((resident) => {
        if (!resident.toDate) return true;
        const toDate = new Date(resident.toDate);
        return !Number.isNaN(toDate.getTime()) && toDate > now;
      }).length;
      setCurrentOccupants(myPost.currentOccupants ?? activeResidents);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không thể tải chi tiết bài đăng');
    } finally {
      setLoading(false);
    }
  }, [activeContractId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const needMore = post?.maxOccupants != null ? Math.max(0, post.maxOccupants - currentOccupants) : null;
  const mergedImages = Array.from(
    new Set([...(roomDetail?.imageUrls ?? []).filter(Boolean), ...(post?.imageUrls ?? []).filter(Boolean)])
  );
  const heroImageWidth = heroWidth || 1;

  const handleHeroLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (!nextWidth || nextWidth === heroWidth) return;
    setHeroWidth(nextWidth);
    requestAnimationFrame(() => {
      heroScrollRef.current?.scrollTo({ x: currentImageIndex * nextWidth, animated: false });
    });
  };

  const scrollToImage = (nextIndex: number) => {
    if (!mergedImages.length) return;
    const safeIndex = Math.max(0, Math.min(nextIndex, mergedImages.length - 1));
    heroScrollRef.current?.scrollTo({ x: safeIndex * heroImageWidth, animated: true });
    setCurrentImageIndex(safeIndex);
  };

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const previewImage = mergedImages[previewIndex];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Chi tiết bài đăng</Text>
            <Text style={styles.subtitle}>Tìm người ở cùng</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color="#1A4B84" /></View>
        ) : error ? (
          <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View>
        ) : post ? (
          <>
            <View style={styles.postCard}>
              <View style={styles.postHero} onLayout={handleHeroLayout}>
                {mergedImages.length ? (
                  <>
                  <ScrollView
                    ref={heroScrollRef}
                    horizontal
                    pagingEnabled
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onMomentumScrollEnd={(event) => {
                      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / heroImageWidth);
                      setCurrentImageIndex(nextIndex);
                    }}
                  >
                    {mergedImages.map((url, idx) => (
                      <TouchableOpacity
                        key={`${url}-${idx}`}
                        activeOpacity={0.95}
                        onPress={() => openPreview(idx)}
                      >
                        <Image
                          source={{ uri: resolveImageUrl(url) }}
                          style={[styles.heroImage, { width: heroImageWidth }]}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {mergedImages.length > 1 ? (
                    <>
                      <TouchableOpacity
                        style={[styles.heroNavButton, styles.heroNavLeft]}
                        onPress={() => scrollToImage(currentImageIndex - 1)}
                      >
                        <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.heroNavButton, styles.heroNavRight]}
                        onPress={() => scrollToImage(currentImageIndex + 1)}
                      >
                        <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </>
                  ) : null}
                  {mergedImages.length > 1 ? (
                    <View style={styles.paginationDots}>
                      {mergedImages.map((_, idx) => (
                        <TouchableOpacity
                          key={`dot-${idx}`}
                          style={[
                            styles.paginationDot,
                            idx === currentImageIndex && styles.paginationDotActive,
                          ]}
                          onPress={() => scrollToImage(idx)}
                        />
                      ))}
                    </View>
                  ) : null}
                  </>
                ) : (
                  <View style={styles.heroPlaceholder}>
                    <Ionicons name="image-outline" size={34} color="#9CA3AF" />
                    <Text style={styles.heroPlaceholderText}>Chưa có ảnh</Text>
                  </View>
                )}

                <View style={styles.heroOverlayRow}>
                  <View style={[styles.statusBadge, post.isLocked ? styles.statusBadgeMuted : styles.statusBadgeActive]}>
                    <Ionicons
                      name={post.isLocked ? 'lock-closed-outline' : 'lock-open-outline'}
                      size={12}
                      color={post.isLocked ? '#4B5563' : '#166534'}
                    />
                    <Text style={[styles.statusBadgeText, post.isLocked ? styles.statusBadgeTextMuted : styles.statusBadgeTextActive]}>
                      {post.isLocked ? 'Đã khóa' : 'Đang mở'}
                    </Text>
                  </View>
                  {mergedImages.length > 0 ? (
                    <View style={styles.imageCountBadge}>
                      <Ionicons name="images-outline" size={12} color="#FFFFFF" />
                      <Text style={styles.imageCountText}>{mergedImages.length} ảnh</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.postBody}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postLocation}>{post.buildingName} · Tầng {post.floorNumber} · Phòng {post.roomCode}</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.priceValue}>{formatCurrency(room?.rentPrice ?? post.baseRentPrice)} VNĐ</Text>
                  <Text style={styles.priceUnit}>/tháng</Text>
                </View>

                <View style={styles.quickStatsRow}>
                  <View style={styles.quickStatItem}>
                    <Ionicons name="people-outline" size={15} color="#1A4B84" />
                    <Text style={styles.quickStatText}>Đang ở {currentOccupants}</Text>
                  </View>
                  <View style={styles.quickStatItem}>
                    <Ionicons name="person-add-outline" size={15} color="#1A4B84" />
                    <Text style={styles.quickStatText}>Cần thêm {needMore ?? 0}</Text>
                  </View>
                  <View style={styles.quickStatItem}>
                    <Ionicons name="calendar-outline" size={15} color="#1A4B84" />
                    <Text style={styles.quickStatText}>Đăng {formatDate(post.postDate)}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Thông tin phòng</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoCell}>
                  <Text style={styles.infoLabel}>Mã phòng</Text>
                  <Text style={styles.infoValue}>{post.roomCode}</Text>
                </View>
                <View style={styles.infoCell}>
                  <Text style={styles.infoLabel}>Vị trí</Text>
                  <Text style={styles.infoValue}>{post.buildingName} - Tầng {post.floorNumber}</Text>
                </View>
                <View style={styles.infoCell}>
                  <Text style={styles.infoLabel}>Diện tích</Text>
                  <Text style={styles.infoValue}>{post.area ?? room?.area ?? 'Chưa cập nhật'} m²</Text>
                </View>
                <View style={styles.infoCell}>
                  <Text style={styles.infoLabel}>Sức chứa tối đa</Text>
                  <Text style={styles.infoValue}>{post.maxOccupants ?? room?.maxOccupants ?? 'Chưa cập nhật'} người</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Chi phí & dịch vụ</Text>
              <View style={styles.rentHighlight}>
                <Text style={styles.rentHighlightLabel}>Giá thuê sau chia</Text>
                <Text style={styles.rentHighlightValue}>{formatCurrency(post.baseRentPrice)} VNĐ/tháng</Text>
              </View>
              {post.servicePrices.length ? (
                post.servicePrices.map((item) => (
                  <View key={`${item.key}-${item.name}`} style={styles.serviceRow}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    <Text style={styles.servicePrice}>{formatCurrency(item.price)} {item.unit || ''}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.itemText}>Chưa có cấu hình giá dịch vụ.</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tiện nghi</Text>
              {post.amenities?.length ? (
                <View style={styles.amenityList}>
                  {post.amenities.map((amenity, idx) => (
                    <View key={`${amenity}-${idx}`} style={styles.amenityTag}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.itemText}>Chưa có tiện nghi.</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Điều kiện vào ở</Text>
              <View style={styles.conditionRow}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.itemText}>
                  {post.moveInType === 'from-date' ? `Có thể vào ở từ ${formatDate(post.moveInDate)}` : 'Có thể vào ở ngay'}
                </Text>
              </View>
              <View style={styles.conditionRow}>
                <Ionicons name="water-outline" size={16} color="#6B7280" />
                <Text style={styles.itemText}>Khu vực ngập lụt: {post.floodProne ? 'Có' : 'Không'}</Text>
              </View>
              <View style={styles.conditionRow}>
                <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                <Text style={styles.itemText}>Yêu cầu từ chủ phòng: {post.landlordRequirements || 'Không có'}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Liên hệ</Text>
              <View style={styles.contactRow}>
                <Ionicons name="person-outline" size={16} color="#1A4B84" />
                <Text style={styles.itemText}>{post.contactName}</Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={16} color="#1A4B84" />
                <Text style={styles.itemText}>{post.contactPhone}</Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#1A4B84" />
                <Text style={styles.itemText}>{post.contactType === 'other' ? 'Liên hệ thủ công' : 'Liên hệ qua tài khoản hiện tại'}</Text>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('RoommateMessages')}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#374151" />
          <Text style={styles.outlineText}>Tin nhắn ({post?.messages ?? 0})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('RoommateEdit')}>
          <Text style={styles.primaryText}>Chỉnh sửa</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={previewVisible} transparent animationType="fade" onRequestClose={() => setPreviewVisible(false)}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewCloseButton} onPress={() => setPreviewVisible(false)}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {previewImage ? (
            <>
              <Image source={{ uri: resolveImageUrl(previewImage) }} style={styles.previewImage} resizeMode="contain" />
              {mergedImages.length > 1 ? (
                <>
                  <TouchableOpacity
                    style={[styles.previewNavButton, styles.previewNavLeft]}
                    onPress={() => setPreviewIndex((prev) => Math.max(0, prev - 1))}
                  >
                    <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.previewNavButton, styles.previewNavRight]}
                    onPress={() => setPreviewIndex((prev) => Math.min(mergedImages.length - 1, prev + 1))}
                  >
                    <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              ) : null}
              <View style={styles.previewFooter}>
                <Text style={styles.previewCounter}>{previewIndex + 1}/{mergedImages.length}</Text>
              </View>
            </>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, gap: 12, paddingBottom: 96 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 2, fontSize: 13, color: '#6B7280' },
  postCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  postHero: {
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  heroImage: {
    width: 360,
    height: 240,
    backgroundColor: '#F3F4F6',
  },
  heroNavButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(17, 24, 39, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNavLeft: {
    left: 12,
  },
  heroNavRight: {
    right: 12,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  paginationDotActive: {
    width: 18,
    backgroundColor: '#FFFFFF',
  },
  heroPlaceholder: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
  },
  heroPlaceholderText: {
    fontSize: 13,
    color: '#6B7280',
  },
  heroOverlayRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(220, 252, 231, 0.96)',
  },
  statusBadgeMuted: {
    backgroundColor: 'rgba(243, 244, 246, 0.96)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: '#166534',
  },
  statusBadgeTextMuted: {
    color: '#4B5563',
  },
  imageCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(17, 24, 39, 0.72)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  imageCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  postBody: {
    padding: 14,
    gap: 10,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 28,
  },
  postLocation: {
    fontSize: 13,
    color: '#111827',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A4B84',
  },
  priceUnit: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 3,
  },
  quickStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EEF4FF',
  },
  quickStatText: {
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  itemText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  infoCell: {
    width: '50%',
    paddingRight: 10,
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  rentHighlight: {
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    padding: 12,
    gap: 4,
  },
  rentHighlightLabel: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  rentHighlightValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceName: { fontSize: 14, color: '#374151' },
  servicePrice: { fontSize: 14, fontWeight: '600', color: '#111827' },
  amenityList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityTag: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F9FAFB' },
  amenityText: { fontSize: 12, color: '#374151' },
  errorCard: { borderRadius: 12, backgroundColor: '#FEE2E2', padding: 12 },
  errorText: { color: '#B91C1C', fontSize: 14 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    gap: 10,
  },
  outlineBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  outlineText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  primaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1A4B84',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  previewCloseButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  previewImage: {
    width: '100%',
    height: '72%',
  },
  previewNavButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewNavLeft: {
    left: 16,
  },
  previewNavRight: {
    right: 16,
  },
  previewFooter: {
    position: 'absolute',
    bottom: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCounter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
