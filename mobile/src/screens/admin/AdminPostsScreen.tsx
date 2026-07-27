import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/api.service';
import { postService } from '../../services/post.service';
import type { CreatePostDto, PostDto } from '../../types/dto';
import { palette, radius } from '../../theme/palette';

type RoomOption = {
  id: number;
  roomCode: string;
  buildingName?: string;
  floorNumber?: number;
  area?: number | null;
  maxOccupants?: number | null;
  defaultRentPrice?: number | null;
  status?: string;
};

type FormState = {
  roomId: number | null;
  title: string;
  baseRentPrice: string;
  contactName: string;
  contactPhone: string;
  landlordRequirements: string;
  moveInType: 'immediate' | 'from-date';
  moveInDate: string;
  floodProne: boolean;
};

const initialForm: FormState = {
  roomId: null,
  title: '',
  baseRentPrice: '',
  contactName: '',
  contactPhone: '',
  landlordRequirements: '',
  moveInType: 'immediate',
  moveInDate: '',
  floodProne: false,
};

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, '');

const formatCurrency = (amount?: number | null) => {
  if (!amount) return '—';
  return `${amount.toLocaleString('vi-VN')} đ`;
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
};

const normalizeDateInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/[/-]/).map((part) => part.trim());
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (day.length <= 2 && month.length <= 2 && year.length === 4) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return trimmed;
};

export default function AdminPostsScreen() {
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostDto | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [postData, roomData] = await Promise.all([
        postService.getAll(),
        apiService.get<RoomOption[]>('/api/Rooms'),
      ]);
      setPosts(postData);
      setRooms(roomData);
    } catch (error: any) {
      Alert.alert('Không tải được bài đăng', error?.message || 'Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return posts;
    return posts.filter((post) => {
      return (
        post.title.toLowerCase().includes(query) ||
        post.roomCode.toLowerCase().includes(query) ||
        post.buildingName.toLowerCase().includes(query) ||
        (post.contactPhone || '').includes(query)
      );
    });
  }, [posts, search]);

  const selectedRoom = useMemo(() => {
    return rooms.find((room) => room.id === form.roomId) || null;
  }, [form.roomId, rooms]);

  const availableRooms = useMemo(() => {
    const usedRoomIds = new Set(posts.map((post) => post.roomId));
    return rooms.filter((room) => !usedRoomIds.has(room.id));
  }, [posts, rooms]);

  const stats = useMemo(() => {
    return {
      total: posts.length,
      active: posts.filter((post) => !post.isLocked).length,
      locked: posts.filter((post) => post.isLocked).length,
    };
  }, [posts]);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreate = () => {
    setForm(initialForm);
    setShowCreate(true);
  };

  const submitCreate = async () => {
    const title = form.title.trim();
    const contactName = form.contactName.trim();
    const contactPhone = digitsOnly(form.contactPhone);
    const baseRentPrice = Number(digitsOnly(form.baseRentPrice));

    if (!form.roomId) {
      Alert.alert('Thiếu phòng', 'Vui lòng chọn phòng muốn đăng.');
      return;
    }
    if (!title || title.length < 8) {
      Alert.alert('Tiêu đề chưa hợp lệ', 'Tiêu đề nên có ít nhất 8 ký tự.');
      return;
    }
    if (!baseRentPrice || baseRentPrice <= 0) {
      Alert.alert('Giá phòng chưa hợp lệ', 'Vui lòng nhập giá phòng.');
      return;
    }
    if (!contactName || contactPhone.length !== 10) {
      Alert.alert('Liên hệ chưa hợp lệ', 'Vui lòng nhập tên liên hệ và số điện thoại 10 số.');
      return;
    }

    const payload: CreatePostDto = {
      roomId: form.roomId,
      title,
      baseRentPrice,
      moveInType: form.moveInType,
      moveInDate: form.moveInType === 'from-date' ? normalizeDateInput(form.moveInDate) : null,
      floodProne: form.floodProne,
      landlordRequirements: form.landlordRequirements.trim() || null,
      contactType: 'other',
      contactName,
      contactPhone,
      servicePrices: [],
      amenities: [],
      imageUrls: [],
    };

    setSaving(true);
    try {
      await postService.create(payload);
      await loadData();
      setShowCreate(false);
      Alert.alert('Đã tạo bài đăng', 'Bài đăng đã được tạo. Có thể bổ sung ảnh/tiện ích chi tiết trên web.');
    } catch (error: any) {
      Alert.alert('Không tạo được bài đăng', error?.message || 'Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const toggleLock = async (post: PostDto) => {
    const nextLocked = !post.isLocked;
    Alert.alert(
      nextLocked ? 'Khóa bài đăng' : 'Mở khóa bài đăng',
      `${nextLocked ? 'Khóa' : 'Mở khóa'} bài của phòng ${post.roomCode}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: nextLocked ? 'Khóa' : 'Mở khóa',
          style: nextLocked ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await postService.updateLock(post.id, { isLocked: nextLocked });
              await loadData();
            } catch (error: any) {
              Alert.alert('Không cập nhật được', error?.message || 'Vui lòng thử lại.');
            }
          },
        },
      ],
    );
  };

  const renderPost = ({ item }: { item: PostDto }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.86} onPress={() => setSelectedPost(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.roomBadge}>
          <Ionicons name="megaphone-outline" size={20} color={palette.primary} />
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardMeta}>
            {item.roomCode} · Tầng {item.floorNumber} · {item.buildingName}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.lockButton, item.isLocked ? styles.lockedButton : styles.unlockedButton]}
          onPress={() => toggleLock(item)}
        >
          <Ionicons name={item.isLocked ? 'lock-closed' : 'lock-open-outline'} size={17} color={item.isLocked ? '#dc2626' : '#16a34a'} />
        </TouchableOpacity>
      </View>
      <View style={styles.postFooter}>
        <Text style={styles.price}>{formatCurrency(item.baseRentPrice)}</Text>
        <Text style={styles.metric}>{item.views || 0} lượt xem · {item.messages || 0} tin nhắn</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Đăng bài tìm phòng</Text>
          <Text style={styles.subtitle}>Tạo nhanh, theo dõi và khóa/mở bài đăng</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreate}>
          <Ionicons name="add" size={22} color={palette.surface} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Tổng bài</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.active}</Text>
          <Text style={styles.statLabel}>Đang mở</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.locked}</Text>
          <Text style={styles.statLabel}>Đã khóa</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={palette.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm tiêu đề, mã phòng, tòa nhà"
          style={styles.searchInput}
        />
      </View>

      {loading && posts.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Đang tải bài đăng...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPost}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="megaphone-outline" size={34} color="#94a3b8" />
              <Text style={styles.emptyTitle}>Chưa có bài đăng</Text>
              <Text style={styles.emptyText}>Bấm dấu + để tạo nhanh bài đăng đầu tiên.</Text>
            </View>
          }
        />
      )}

      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Tạo bài đăng nhanh</Text>
                <Text style={styles.modalMeta}>Có thể bổ sung ảnh chi tiết trên web sau.</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={22} color="#334155" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 18 }}>
              <Text style={styles.label}>Chọn phòng</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roomChipRow}>
                {availableRooms.map((room) => (
                  <TouchableOpacity
                    key={room.id}
                    style={[styles.roomChip, form.roomId === room.id && styles.roomChipActive]}
                    onPress={() => {
                      updateForm('roomId', room.id);
                      if (!form.baseRentPrice && room.defaultRentPrice) {
                        updateForm('baseRentPrice', String(Math.trunc(room.defaultRentPrice)));
                      }
                    }}
                  >
                    <Text style={[styles.roomChipText, form.roomId === room.id && styles.roomChipTextActive]}>{room.roomCode}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {selectedRoom && (
                <Text style={styles.roomHint}>
                  Tầng {selectedRoom.floorNumber || '—'} · {selectedRoom.buildingName || 'Tòa nhà'} · {selectedRoom.status || 'Chưa rõ trạng thái'}
                </Text>
              )}

              <Text style={styles.label}>Tiêu đề *</Text>
              <TextInput
                value={form.title}
                onChangeText={(value) => updateForm('title', value)}
                placeholder="VD: Phòng sáng thoáng, gần thang máy..."
                style={styles.input}
              />

              <Text style={styles.label}>Giá phòng *</Text>
              <TextInput
                value={form.baseRentPrice}
                onChangeText={(value) => updateForm('baseRentPrice', digitsOnly(value))}
                placeholder="VD: 3500000"
                keyboardType="number-pad"
                style={styles.input}
              />

              <Text style={styles.label}>Có thể vào ở</Text>
              <View style={styles.segmented}>
                <TouchableOpacity
                  style={[styles.segmentButton, form.moveInType === 'immediate' && styles.segmentActive]}
                  onPress={() => updateForm('moveInType', 'immediate')}
                >
                  <Text style={[styles.segmentText, form.moveInType === 'immediate' && styles.segmentTextActive]}>Ở luôn</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentButton, form.moveInType === 'from-date' && styles.segmentActive]}
                  onPress={() => updateForm('moveInType', 'from-date')}
                >
                  <Text style={[styles.segmentText, form.moveInType === 'from-date' && styles.segmentTextActive]}>Từ ngày</Text>
                </TouchableOpacity>
              </View>
              {form.moveInType === 'from-date' && (
                <TextInput
                  value={form.moveInDate}
                  onChangeText={(value) => updateForm('moveInDate', value)}
                  placeholder="VD: 17/06/2027"
                  style={styles.input}
                />
              )}

              <Text style={styles.label}>Tên liên hệ *</Text>
              <TextInput
                value={form.contactName}
                onChangeText={(value) => updateForm('contactName', value)}
                placeholder="Tên người phụ trách"
                style={styles.input}
              />

              <Text style={styles.label}>Số điện thoại liên hệ *</Text>
              <TextInput
                value={form.contactPhone}
                onChangeText={(value) => updateForm('contactPhone', digitsOnly(value).slice(0, 10))}
                placeholder="10 số"
                keyboardType="number-pad"
                style={styles.input}
              />

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => updateForm('floodProne', !form.floodProne)}
              >
                <Ionicons name={form.floodProne ? 'checkbox' : 'square-outline'} size={22} color={palette.primary} />
                <Text style={styles.checkboxText}>Nằm trong khu vực dễ ngập lụt</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Yêu cầu từ chủ nhà</Text>
              <TextInput
                value={form.landlordRequirements}
                onChangeText={(value) => updateForm('landlordRequirements', value)}
                placeholder="VD: Không nuôi thú cưng, không hút thuốc..."
                multiline
                style={styles.textarea}
              />
            </ScrollView>

            <View style={styles.actionBar}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCreate(false)} disabled={saving}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={submitCreate} disabled={saving}>
                {saving ? <ActivityIndicator color={palette.surface} /> : <Text style={styles.submitText}>Tạo bài</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedPost} transparent animationType="slide" onRequestClose={() => setSelectedPost(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.detailCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedPost?.roomCode}</Text>
                <Text style={styles.modalMeta}>Tầng {selectedPost?.floorNumber} · {selectedPost?.buildingName}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPost(null)}>
                <Ionicons name="close" size={22} color="#334155" />
              </TouchableOpacity>
            </View>
            {selectedPost && (
              <View style={styles.detailBody}>
                <Text style={styles.detailTitle}>{selectedPost.title}</Text>
                <Text style={styles.detailPrice}>{formatCurrency(selectedPost.baseRentPrice)}</Text>
                <Text style={styles.detailLine}>Liên hệ: {selectedPost.contactName} · {selectedPost.contactPhone}</Text>
                <Text style={styles.detailLine}>Vào ở: {selectedPost.moveInType === 'from-date' ? formatDate(selectedPost.moveInDate) : 'Ở luôn'}</Text>
                <Text style={styles.detailLine}>Trạng thái: {selectedPost.isLocked ? 'Đã khóa' : 'Đang mở'}</Text>
                {!!selectedPost.landlordRequirements && (
                  <Text style={styles.detailNote}>{selectedPost.landlordRequirements}</Text>
                )}
                <TouchableOpacity
                  style={[styles.submitButton, selectedPost.isLocked && styles.unlockFullButton]}
                  onPress={() => toggleLock(selectedPost)}
                >
                  <Text style={styles.submitText}>{selectedPost.isLocked ? 'Mở khóa bài' : 'Khóa bài đăng'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  header: { paddingHorizontal: 10, paddingTop: 5, paddingBottom: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: palette.text, fontSize: 18, fontWeight: '900' },
  subtitle: { color: palette.textMuted, fontSize: 10, marginTop: 2 },
  addButton: { width: 34, height: 34, borderRadius: radius.lg, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 10, gap: 5, marginBottom: 5 },
  statCard: { flex: 1, backgroundColor: palette.surface, borderRadius: radius.lg, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: palette.borderSoft },
  statValue: { color: palette.text, fontSize: 13, fontWeight: '900' },
  statLabel: { color: palette.textMuted, fontSize: 9, fontWeight: '700', marginTop: 1 },
  searchBox: { marginHorizontal: 12, marginBottom: 8, height: 38, borderRadius: radius.lg, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.borderSoft, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  searchInput: { flex: 1, color: palette.text, fontSize: 12 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: palette.textMuted, marginTop: 12 },
  listContent: { padding: 10, paddingBottom: 84 },
  card: { backgroundColor: palette.surface, borderRadius: radius.xl, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: palette.borderSoft, shadowColor: palette.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  roomBadge: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardTitleWrap: { flex: 1 },
  cardTitle: { color: palette.text, fontSize: 12, fontWeight: '900' },
  cardMeta: { color: palette.textMuted, fontSize: 10, marginTop: 2 },
  lockButton: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  lockedButton: { backgroundColor: palette.dangerSoft },
  unlockedButton: { backgroundColor: palette.successSoft },
  postFooter: { marginTop: 7, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  price: { color: palette.primary, fontSize: 12, fontWeight: '900' },
  metric: { color: palette.textMuted, fontSize: 10, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: palette.text, fontSize: 14, fontWeight: '800', marginTop: 8 },
  emptyText: { color: palette.textMuted, fontSize: 14, marginTop: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '90%', backgroundColor: palette.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, overflow: 'hidden' },
  detailCard: { backgroundColor: palette.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, overflow: 'hidden' },
  modalHeader: { padding: 12, borderBottomWidth: 1, borderBottomColor: palette.borderSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  modalTitle: { color: palette.text, fontSize: 16, fontWeight: '900' },
  modalMeta: { color: palette.textMuted, fontSize: 13, marginTop: 4 },
  modalBody: { padding: 12 },
  label: { color: '#334155', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', marginTop: 14, marginBottom: 8 },
  roomChipRow: { gap: 8 },
  roomChip: { height: 32, paddingHorizontal: 10, borderRadius: radius.lg, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.borderSoft, justifyContent: 'center' },
  roomChipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  roomChipText: { color: '#334155', fontWeight: '800' },
  roomChipTextActive: { color: palette.surface },
  roomHint: { color: palette.textMuted, fontSize: 13, marginTop: 8 },
  input: { height: 38, borderRadius: radius.md, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surfaceSoft, paddingHorizontal: 9, color: palette.text, fontSize: 12 },
  textarea: { minHeight: 68, borderRadius: radius.md, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surfaceSoft, padding: 9, color: palette.text, fontSize: 12, textAlignVertical: 'top' },
  segmented: { flexDirection: 'row', backgroundColor: palette.surfaceSoft, borderRadius: radius.lg, padding: 3, marginBottom: 6 },
  segmentButton: { flex: 1, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: palette.surface },
  segmentText: { color: palette.textMuted, fontWeight: '800' },
  segmentTextActive: { color: palette.primary },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  checkboxText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  actionBar: { padding: 11, borderTopWidth: 1, borderTopColor: palette.borderSoft, flexDirection: 'row', gap: 7 },
  cancelButton: { flex: 1, height: 38, borderRadius: radius.lg, backgroundColor: palette.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#334155', fontWeight: '900' },
  submitButton: { flex: 1, height: 38, borderRadius: radius.lg, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
  unlockFullButton: { backgroundColor: palette.success },
  submitText: { color: palette.surface, fontWeight: '900' },
  detailBody: { padding: 12, gap: 7 },
  detailTitle: { color: palette.text, fontSize: 14, fontWeight: '900', lineHeight: 19 },
  detailPrice: { color: palette.primary, fontSize: 17, fontWeight: '900' },
  detailLine: { color: '#334155', fontSize: 14, lineHeight: 21 },
  detailNote: { color: '#92400e', backgroundColor: '#FEF3C7', borderRadius: radius.lg, padding: 10, lineHeight: 20 },
});
