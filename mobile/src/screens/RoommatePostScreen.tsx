import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { contractService } from '../services/contract.service';
import { useAuthStore } from '../store/authStore';
import { postService } from '../services/post.service';
import { roomService } from '../services/room.service';
import { PostDto } from '../types/dto';

export default function RoommatePostScreen() {
  const navigation = useNavigation<any>();
  const [post, setPost] = useState<PostDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOccupants, setCurrentOccupants] = useState<number | null>(null);
  const [needMore, setNeedMore] = useState<number | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Chưa cập nhật';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
    return date.toLocaleDateString('vi-VN');
  };

  const loadOccupancy = async (postData: PostDto) => {
    try {
      const myRoom = await roomService.getMyRoom();
      const contract = await contractService.getById(myRoom.contractId);
      const now = new Date();
      const activeResidents = contract.residents.filter((resident) => {
        if (!resident.toDate) return true;
        const toDate = new Date(resident.toDate);
        return !Number.isNaN(toDate.getTime()) && toDate > now;
      }).length;

      setCurrentOccupants(activeResidents);
      if (postData.maxOccupants != null) {
        setNeedMore(Math.max(0, postData.maxOccupants - activeResidents));
      } else {
        setNeedMore(null);
      }
    } catch {
      setCurrentOccupants(null);
      setNeedMore(null);
    }
  };

  const activeContractId = useAuthStore((s) => s.activeContractId);

  const loadPost = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await postService.getMyPost();
      setPost(data);
      await loadOccupancy(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setPost(null);
        setCurrentOccupants(null);
        setNeedMore(null);
      } else {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message || 'Không thể tải bài đăng'
          : 'Không thể tải bài đăng';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [activeContractId]);

  useFocusEffect(
    useCallback(() => {
      loadPost();
    }, [loadPost])
  );

  const toggleStatus = () => {
    if (!post) return;
    const isLocked = !post.isLocked;
    postService
      .updateLock(post.id, { isLocked })
      .then((updated) => setPost(updated))
      .catch(() => Alert.alert('Lỗi', 'Không thể cập nhật trạng thái bài đăng'))
      .finally(() => setShowStatusDialog(false));
  };

  const confirmDelete = () => {
    if (!post || deleting) return;

    Alert.alert(
      'Xóa bài đăng?',
      'Bài đăng sẽ bị xóa khỏi ứng dụng cư dân và không thể khôi phục.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await postService.delete(post.id);
              setPost(null);
              setCurrentOccupants(null);
              setNeedMore(null);
              Alert.alert('Thành công', 'Đã xóa bài đăng.');
            } catch (err) {
              const message = axios.isAxiosError(err)
                ? err.response?.data?.message || 'Không thể xóa bài đăng'
                : 'Không thể xóa bài đăng';
              Alert.alert('Lỗi', message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Quản lý bài đăng</Text>
            <Text style={styles.subtitle}>Tìm bạn ở ghép</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1A4B84" />
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : post ? (
          <>
            <View style={styles.topStatsRow}>
              <View style={styles.topStatCard}>
                <Text style={styles.topStatNumber}>{post.views}</Text>
                <Text style={styles.topStatLabel}>Lượt xem</Text>
              </View>
              <View style={styles.topStatCard}>
                <Text style={styles.topStatNumber}>{post.messages}</Text>
                <Text style={styles.topStatLabel}>Tin nhắn chờ</Text>
              </View>
            </View>

            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postSub}>
                    {currentOccupants !== null && needMore !== null
                      ? `Đang ở: ${currentOccupants} | Cần thêm: ${needMore} người`
                      : post.maxOccupants != null
                        ? `Số người tối đa: ${post.maxOccupants} người`
                        : 'Số người tối đa: Chưa cập nhật'}
                  </Text>
                </View>
                {!post.isLocked ? (
                  <View style={[styles.statusBadge, styles.statusOpen]}>
                    <Ionicons name="lock-open-outline" size={12} color="#15803D" />
                    <Text style={styles.statusOpenText}>Mở</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, styles.statusClosed]}>
                    <Ionicons name="lock-closed-outline" size={12} color="#4B5563" />
                    <Text style={styles.statusClosedText}>Khóa</Text>
                  </View>
                )}
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>Đăng: {formatDate(post.postDate)}</Text>
                <Text style={styles.metaText}>Cập nhật: {formatDate(post.createdAt)}</Text>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metricCell}>
                  <View style={styles.metricNumberRow}>
                    <Ionicons name="eye-outline" size={14} color="#6B7280" />
                    <Text style={styles.metricNumber}>{post.views}</Text>
                  </View>
                  <Text style={styles.metricLabel}>Lượt xem</Text>
                </View>
                <TouchableOpacity
                  style={styles.metricCell}
                  onPress={() => navigation.navigate('RoommateMessages')}
                >
                  <View style={styles.metricNumberRow}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color="#1A4B84" />
                    <Text style={styles.metricNumberPrimary}>{post.messages}</Text>
                  </View>
                  <Text style={styles.metricLabelPrimary}>Tin nhắn chờ</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actionsBlock}>
                <Text style={styles.actionsTitle}>THAO TÁC</Text>
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('RoommateDetail')}
                  >
                    <Ionicons name="eye-outline" size={16} color="#374151" />
                    <Text style={styles.actionButtonText}>Xem</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.replace('RoommateEdit')}
                  >
                    <Ionicons name="create-outline" size={16} color="#374151" />
                    <Text style={styles.actionButtonText}>Sửa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton} onPress={() => setShowStatusDialog(true)}>
                    <Ionicons
                      name={post.isLocked ? 'lock-open-outline' : 'lock-closed-outline'}
                      size={16}
                      color="#374151"
                    />
                    <Text style={styles.actionButtonText}>{post.isLocked ? 'Mở' : 'Khóa'}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
                  onPress={confirmDelete}
                  disabled={deleting}
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  <Text style={styles.deleteButtonText}>{deleting ? 'Đang xóa...' : 'Xóa bài đăng'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.historyButton}
                  onPress={() => navigation.navigate('RoommateHistory')}
                >
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={styles.historyButtonText}>Lịch sử chỉnh sửa</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="add" size={28} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>Bạn chưa có bài đăng nào</Text>
            <Text style={styles.emptySub}>Tạo bài đăng để tìm người ở ghép</Text>

            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('RoommateCreate')}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Tạo bài đăng</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={showStatusDialog} transparent animationType="fade" onRequestClose={() => setShowStatusDialog(false)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>{post?.isLocked ? 'Mở bài đăng?' : 'Khóa bài đăng?'}</Text>
            <Text style={styles.dialogDesc}>
              {!post?.isLocked
                ? 'Khi khóa, bài đăng sẽ không hiển thị cho người khác. Bạn có thể mở lại bất cứ lúc nào.'
                : 'Khi mở, bài đăng sẽ hiển thị công khai để mọi người có thể xem và liên hệ với bạn.'}
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancel} onPress={() => setShowStatusDialog(false)}>
                <Text style={styles.dialogCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogConfirm} onPress={toggleStatus}>
                <Text style={styles.dialogConfirmText}>{post?.isLocked ? 'Mở bài' : 'Khóa bài'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  center: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  topStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  topStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    alignItems: 'center',
  },
  topStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A4B84',
  },
  topStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  postSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusOpen: {
    backgroundColor: '#DCFCE7',
  },
  statusClosed: {
    backgroundColor: '#F3F4F6',
  },
  statusOpenText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '600',
  },
  statusClosedText: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  metricRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  metricNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  metricNumberPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A4B84',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  metricLabelPrimary: {
    fontSize: 12,
    color: '#1A4B84',
    fontWeight: '600',
    marginTop: 2,
  },
  actionsBlock: {
    padding: 12,
  },
  actionsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  historyButton: {
    marginTop: 8,
    height: 34,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  historyButtonText: {
    fontSize: 13,
    color: '#6B7280',
  },
  deleteButton: {
    marginTop: 8,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#1A4B84',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  dialogDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  dialogActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  dialogCancel: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dialogCancelText: {
    color: '#374151',
    fontWeight: '500',
  },
  dialogConfirm: {
    backgroundColor: '#1A4B84',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dialogConfirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
