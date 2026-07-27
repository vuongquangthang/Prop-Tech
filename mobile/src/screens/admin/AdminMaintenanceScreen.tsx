import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import maintenanceService, { MaintenanceRequest } from '../../services/maintenance.service';
import { fileService } from '../../services/file.service';
import { resolveImageUrl } from '../../utils/image';
import { palette, radius } from '../../theme/palette';

const STATUS_FILTERS = ['Tất cả', 'Chờ xử lý', 'Đang xử lý', 'Chờ nghiệm thu', 'Sửa lại', 'Đã đóng'];

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const parseImages = (json?: string) => {
  if (!json) return [] as string[];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

export default function AdminMaintenanceScreen() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);
  const [note, setNote] = useState('');
  const [proofImage, setProofImage] = useState<{ uri: string; uploadedUrl?: string } | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data =
        statusFilter === 'Tất cả'
          ? await maintenanceService.getAll()
          : await maintenanceService.getByStatus(statusFilter);
      setRequests(data);
    } catch (error: any) {
      Alert.alert('Không tải được sự cố', error?.message || 'Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const stats = useMemo(() => {
    const pending = requests.filter((item) => item.status === 'Chờ xử lý' || item.status === 'Sửa lại' || item.status === 'Yêu cầu sửa lại').length;
    const processing = requests.filter((item) => item.status === 'Đang xử lý').length;
    const review = requests.filter((item) => item.status === 'Chờ nghiệm thu').length;
    return { total: requests.length, pending, processing, review };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requests;
    return requests.filter((item) => {
      return (
        (item.roomNumber || '').toLowerCase().includes(query) ||
        (item.userName || '').toLowerCase().includes(query) ||
        maintenanceService.getIssueTypeLabel(item.issueType).toLowerCase().includes(query) ||
        (item.description || '').toLowerCase().includes(query)
      );
    });
  }, [requests, search]);

  const openDetail = (request: MaintenanceRequest) => {
    setSelected(request);
    setNote(request.adminNote || '');
    setProofImage(request.completionImageUrl ? { uri: resolveImageUrl(request.completionImageUrl), uploadedUrl: request.completionImageUrl } : null);
  };

  const closeDetail = () => {
    setSelected(null);
    setNote('');
    setProofImage(null);
  };

  const pickProofImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Thiếu quyền camera', 'Vui lòng cấp quyền camera để chụp ảnh nghiệm thu.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.72,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setProofImage({ uri: result.assets[0].uri });
    }
  };

  const submitUpdate = async (nextStatus: 'Đang xử lý' | 'Chờ nghiệm thu' | 'Chờ xử lý') => {
    if (!selected) return;
    setSaving(true);
    try {
      let completionImageUrl = proofImage?.uploadedUrl;
      if (proofImage?.uri && !completionImageUrl) {
        completionImageUrl = await fileService.uploadImage(proofImage.uri, `maintenance_${selected.id}_${Date.now()}.jpg`);
      }

      await maintenanceService.updateStatus(selected.id, {
        status: nextStatus,
        adminNote: note.trim() || undefined,
        completionImageUrl,
      });

      await loadRequests();
      closeDetail();
      Alert.alert(
        'Đã cập nhật sự cố',
        nextStatus === 'Chờ nghiệm thu'
          ? 'Đã gửi kết quả xử lý và minh chứng để cư dân nghiệm thu.'
          : 'Trạng thái sự cố đã được cập nhật.',
      );
    } catch (error: any) {
      Alert.alert('Không cập nhật được', error?.message || 'Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const renderStatusChip = (status: string) => {
    const info = maintenanceService.getStatusInfo(status);
    return (
      <View style={[styles.statusChip, { backgroundColor: info.bgColor }]}>
        <Text style={[styles.statusChipText, { color: info.color }]}>{info.label}</Text>
      </View>
    );
  };

  const renderRequest = ({ item }: { item: MaintenanceRequest }) => {
    const info = maintenanceService.getStatusInfo(item.status);
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.86} onPress={() => openDetail(item)}>
        <View style={styles.cardHeader}>
          <View style={[styles.issueIcon, { backgroundColor: info.bgColor }]}>
            <Ionicons
              name={maintenanceService.getIssueTypeIcon(item.issueType) as keyof typeof Ionicons.glyphMap}
              size={22}
              color={info.color}
            />
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle}>{maintenanceService.getIssueTypeLabel(item.issueType)}</Text>
            <Text style={styles.cardMeta}>
              {item.roomNumber || 'Chưa rõ phòng'} · {formatDateTime(item.createdAt)}
            </Text>
          </View>
          {renderStatusChip(item.status)}
        </View>

        {!!item.description && <Text style={styles.description} numberOfLines={2}>{item.description}</Text>}
        {!!item.completionImageUrl && (
          <View style={styles.proofInline}>
            <Ionicons name="image-outline" size={16} color="#0f766e" />
            <Text style={styles.proofInlineText}>Đã có ảnh minh chứng xử lý</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const beforeImages = parseImages(selected?.mediaUrls);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Báo cáo sự cố</Text>
        <Text style={styles.subtitle}>Theo dõi xử lý, nghiệm thu và ảnh minh chứng</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Tổng</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Chờ xử lý</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.review}</Text>
          <Text style={styles.statLabel}>Nghiệm thu</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={palette.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm phòng, cư dân, loại sự cố"
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {STATUS_FILTERS.map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
            onPress={() => setStatusFilter(status)}
          >
            <Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>{status}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && requests.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Đang tải sự cố...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRequest}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRequests} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="construct-outline" size={34} color="#94a3b8" />
              <Text style={styles.emptyTitle}>Không có sự cố phù hợp</Text>
              <Text style={styles.emptyText}>Thử đổi bộ lọc hoặc kéo xuống để tải lại.</Text>
            </View>
          }
        />
      )}

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={closeDetail}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selected ? maintenanceService.getIssueTypeLabel(selected.issueType) : ''}</Text>
                <Text style={styles.modalMeta}>{selected?.roomNumber || 'Chưa rõ phòng'} · {formatDateTime(selected?.createdAt)}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={closeDetail}>
                <Ionicons name="close" size={22} color="#334155" />
              </TouchableOpacity>
            </View>

            {selected && (
              <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 18 }}>
                {renderStatusChip(selected.status)}
                <Text style={styles.sectionLabel}>Mô tả cư dân</Text>
                <Text style={styles.modalText}>{selected.description || 'Không có mô tả.'}</Text>

                {beforeImages.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Ảnh cư dân gửi</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                      {beforeImages.map((url, index) => (
                        <Image key={`${url}-${index}`} source={{ uri: resolveImageUrl(url) }} style={styles.thumbnail} />
                      ))}
                    </ScrollView>
                  </>
                )}

                <Text style={styles.sectionLabel}>Ghi chú xử lý</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="VD: Đã thay aptomat, kiểm tra lại ổn định..."
                  multiline
                  style={styles.noteInput}
                />

                <Text style={styles.sectionLabel}>Ảnh minh chứng nghiệm thu</Text>
                {proofImage ? (
                  <Image source={{ uri: proofImage.uri }} style={styles.proofImage} />
                ) : (
                  <View style={styles.noProofBox}>
                    <Ionicons name="camera-outline" size={26} color={palette.textMuted} />
                    <Text style={styles.noProofText}>Chưa có ảnh minh chứng</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.cameraButton} onPress={pickProofImage} disabled={saving}>
                  <Ionicons name="camera-outline" size={19} color={palette.primary} />
                  <Text style={styles.cameraButtonText}>{proofImage ? 'Chụp lại ảnh' : 'Chụp ảnh minh chứng'}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            <View style={styles.actionBar}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => submitUpdate('Đang xử lý')}
                disabled={saving}
              >
                <Text style={styles.secondaryButtonText}>Đang xử lý</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => submitUpdate('Chờ nghiệm thu')}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color={palette.surface} /> : <Text style={styles.primaryButtonText}>Gửi nghiệm thu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  header: { paddingHorizontal: 10, paddingTop: 5, paddingBottom: 5 },
  title: { color: palette.text, fontSize: 18, fontWeight: '900' },
  subtitle: { color: palette.textMuted, fontSize: 10, marginTop: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 10, gap: 5, marginBottom: 5 },
  statCard: { flex: 1, backgroundColor: palette.surface, borderRadius: radius.lg, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: palette.borderSoft },
  statValue: { color: palette.text, fontSize: 13, fontWeight: '900' },
  statLabel: { color: palette.textMuted, fontSize: 9, fontWeight: '700', marginTop: 1 },
  searchBox: {
    marginHorizontal: 10,
    marginBottom: 6,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, color: palette.text, fontSize: 12 },
  filterScroll: { flexGrow: 0, height: 38, marginBottom: 2 },
  filterRow: { paddingHorizontal: 10, gap: 5, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 10, height: 30, borderRadius: radius.lg, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.borderSoft, justifyContent: 'center' },
  filterChipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  filterText: { color: '#334155', fontSize: 13, fontWeight: '700' },
  filterTextActive: { color: palette.surface },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: palette.textMuted, marginTop: 12 },
  listContent: { paddingHorizontal: 10, paddingTop: 4, paddingBottom: 84 },
  card: { backgroundColor: palette.surface, borderRadius: radius.xl, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: palette.borderSoft, shadowColor: palette.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  issueIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitleWrap: { flex: 1 },
  cardTitle: { color: palette.text, fontSize: 12, fontWeight: '900' },
  cardMeta: { color: palette.textMuted, fontSize: 10, marginTop: 2 },
  statusChip: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  statusChipText: { fontSize: 10, fontWeight: '800' },
  description: { color: '#334155', fontSize: 11, lineHeight: 15, marginTop: 7 },
  proofInline: { marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  proofInlineText: { color: palette.secondary, fontSize: 13, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: palette.text, fontSize: 14, fontWeight: '800', marginTop: 8 },
  emptyText: { color: palette.textMuted, fontSize: 14, marginTop: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '88%', backgroundColor: palette.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, overflow: 'hidden' },
  modalHeader: { padding: 12, borderBottomWidth: 1, borderBottomColor: palette.borderSoft, flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { color: palette.text, fontSize: 16, fontWeight: '900' },
  modalMeta: { color: palette.textMuted, fontSize: 13, marginTop: 4 },
  closeButton: { width: 32, height: 32, borderRadius: radius.lg, backgroundColor: palette.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 12 },
  sectionLabel: { color: '#334155', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  modalText: { color: '#334155', fontSize: 15, lineHeight: 22 },
  imageRow: { gap: 10 },
  thumbnail: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: palette.surfaceSoft },
  noteInput: { minHeight: 72, borderRadius: radius.md, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surfaceSoft, padding: 9, textAlignVertical: 'top', color: palette.text, fontSize: 12 },
  proofImage: { width: '100%', height: 140, borderRadius: radius.md, backgroundColor: palette.surfaceSoft },
  noProofBox: { height: 86, borderRadius: radius.md, backgroundColor: palette.surfaceSoft, borderWidth: 1, borderStyle: 'dashed', borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  noProofText: { color: palette.textMuted, fontSize: 13, fontWeight: '700', marginTop: 8 },
  cameraButton: { marginTop: 8, height: 36, borderRadius: radius.lg, borderWidth: 1, borderColor: '#BAE6FD', backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  cameraButtonText: { color: palette.primary, fontSize: 14, fontWeight: '800' },
  actionBar: { padding: 11, borderTopWidth: 1, borderTopColor: palette.borderSoft, flexDirection: 'row', gap: 7 },
  secondaryButton: { flex: 1, height: 38, borderRadius: radius.lg, backgroundColor: palette.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#334155', fontSize: 12, fontWeight: '800' },
  primaryButton: { flex: 1.2, height: 38, borderRadius: radius.lg, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: palette.surface, fontSize: 12, fontWeight: '900' },
});
