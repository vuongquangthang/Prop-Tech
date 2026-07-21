import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import maintenanceService, { MaintenanceRequest } from '../services/maintenance.service';
import { resolveImageUrl } from '../utils/image';
import signalRService from '../services/signalr.service';

export default function IssueDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as { id: number };
  
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    loadRequestDetail();
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      loadRequestDetail();
    }, [id])
  );

  useEffect(() => {
    const unsubscribe = signalRService.onMaintenanceUpdate((update: any) => {
      if (String(update?.id) === String(id)) {
        loadRequestDetail();
      }
    });

    return unsubscribe;
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadRequestDetail();
    }, 30000);

    return () => clearInterval(timer);
  }, [id]);

  const loadRequestDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await maintenanceService.getById(id);
      setRequest(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết sự cố');
      console.error('Load request detail error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestRework = async () => {
    Alert.alert(
      'Yêu cầu sửa lại',
      'Bạn có chắc chắn muốn yêu cầu ban quản lý sửa lại?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await maintenanceService.close(id, {
                status: 'Sửa lại',
                adminNote: 'Cư dân yêu cầu sửa lại',
              });
              Alert.alert('Thành công', 'Đã gửi yêu cầu sửa lại đến ban quản lý');
              loadRequestDetail(); // Reload to get updated data
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể gửi yêu cầu');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleSatisfied = async () => {
    Alert.alert(
      'Xác nhận hài lòng',
      'Bạn có hài lòng với kết quả xử lý?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Hài lòng',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await maintenanceService.close(id, {
                status: 'Đã đóng',
                adminNote: 'Cư dân xác nhận hài lòng',
              });
              Alert.alert('Thành công', 'Cảm ơn phản hồi của bạn!', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể xác nhận');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
      'Chờ xử lý': { label: 'Chờ xử lý', color: '#D97706', bgColor: '#FEF3C7' },
      'Đang xử lý': { label: 'Đang xử lý', color: '#1A4B84', bgColor: '#E8F0FB' },
      'Chờ nghiệm thu': { label: 'Chờ nghiệm thu', color: '#7C3AED', bgColor: '#F3E8FF' },
      'Hoàn thành': { label: 'Hoàn thành', color: '#059669', bgColor: '#D1FAE5' },
      'Sửa lại': { label: 'Sửa lại', color: '#DC2626', bgColor: '#FEE2E2' },
      'Yêu cầu sửa lại': { label: 'Sửa lại', color: '#DC2626', bgColor: '#FEE2E2' },
      'Từ chối': { label: 'Từ chối', color: '#DC2626', bgColor: '#FEE2E2' },
      'Đã đóng': { label: 'Đã đóng', color: '#6B7280', bgColor: '#F3F4F6' },
    };
    return statusMap[status] || { label: status, color: '#6B7280', bgColor: '#F3F4F6' };
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Chưa có mốc thời gian';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const formatTimelineTime = (dateStr?: string) => {
    if (!dateStr) return 'Chưa có mốc thời gian';

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;

    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const beforeImages = (() => {
    if (!request?.mediaUrls) return [] as string[];
    try {
      const urls = JSON.parse(request.mediaUrls) as string[];
      return Array.isArray(urls) ? urls : [];
    } catch {
      return [] as string[];
    }
  })();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1A4B84" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết sự cố</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
          <Text style={styles.errorText}>{error || 'Không tìm thấy sự cố'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRequestDetail}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(request.status);
  const showActions = request.status === 'Chờ nghiệm thu';

  const timelineStatusIndex = (() => {
    switch (request.status) {
      case 'Chờ xử lý':
        return 0;
      case 'Đang xử lý':
        return 1;
      case 'Chờ nghiệm thu':
        return 2;
      case 'Hoàn thành':
      case 'Đã đóng':
        return 3;
      case 'Sửa lại':
      case 'Yêu cầu sửa lại':
      case 'Từ chối':
        return 2;
      default:
        return 0;
    }
  })();

  const timelineSteps = [
    {
      key: 'reported',
      title: 'Cư dân báo sự cố',
      description: 'Yêu cầu đã được gửi vào hệ thống.',
      time: formatTimelineTime(request.createdAt),
      icon: 'alert-circle-outline' as const,
    },
    {
      key: 'processing',
      title: 'Ban quản lý tiếp nhận',
      description: 'Sự cố được ghi nhận và bắt đầu xử lý.',
      time: request.status === 'Chờ xử lý' ? 'Chưa có mốc thời gian' : formatTimelineTime(request.updatedAt || request.createdAt),
      icon: 'construct-outline' as const,
    },
    {
      key: 'review',
      title: 'Chờ cư dân nghiệm thu',
      description: 'Ban quản lý đã phản hồi kết quả, chờ cư dân kiểm tra.',
      time: request.status === 'Chờ nghiệm thu' ? formatTimelineTime(request.updatedAt || request.createdAt) : 'Chưa có mốc thời gian',
      icon: 'checkmark-done-outline' as const,
    },
    {
      key: 'final',
      title: request.status === 'Sửa lại' || request.status === 'Yêu cầu sửa lại'
        ? 'Cư dân yêu cầu sửa lại'
        : request.status === 'Từ chối'
          ? 'Ban quản lý từ chối yêu cầu'
          : 'Sự cố đã hoàn thành',
      description: 'Yêu cầu được đóng sau khi có phản hồi cuối cùng.',
      time: request.status === 'Sửa lại' || request.status === 'Yêu cầu sửa lại'
        ? formatTimelineTime(request.updatedAt || request.createdAt)
        : request.status === 'Từ chối'
          ? formatTimelineTime(request.closedAt || request.updatedAt || request.createdAt)
          : request.status === 'Đã đóng' || request.status === 'Hoàn thành'
            ? formatTimelineTime(request.closedAt || request.updatedAt || request.createdAt)
            : 'Chưa có mốc thời gian',
      icon: 'checkmark-circle-outline' as const,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sự cố</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.issueTitle}>
          {maintenanceService.getIssueTypeLabel(request.issueType)}
        </Text>
        <Text style={styles.issueId}>
          #{request.id} - {new Date(request.createdAt).toLocaleDateString('vi-VN')} - Phòng {request.roomNumber || request.roomId}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
          <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: statusInfo.bgColor }]}> 
              <Ionicons name="time-outline" size={18} color={statusInfo.color} />
            </View>
            <View style={styles.summaryTextBlock}>
              <Text style={styles.summaryTitle}>Đang theo dõi tiến độ xử lý</Text>
              <Text style={styles.summaryText}>
                {request.status === 'Chờ xử lý' && 'Sự cố đã được ghi nhận, đang chờ ban quản lý tiếp nhận.'}
                {request.status === 'Đang xử lý' && 'Ban quản lý đang kiểm tra và xử lý sự cố.'}
                {request.status === 'Chờ nghiệm thu' && 'Đã gửi kết quả, vui lòng kiểm tra và phản hồi.'}
                {(request.status === 'Hoàn thành' || request.status === 'Đã đóng') && 'Sự cố đã được đóng và hoàn tất quy trình.'}
                {(request.status === 'Sửa lại' || request.status === 'Yêu cầu sửa lại') && 'Cư dân đã yêu cầu sửa lại, ban quản lý cần xử lý tiếp.'}
                {request.status === 'Từ chối' && 'Yêu cầu đã bị từ chối, vui lòng xem lại nội dung.'}
              </Text>
            </View>
          </View>
        </View>

        {request.description && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Mô tả</Text>
            <Text style={styles.descriptionText}>{request.description}</Text>
          </>
        )}

        {beforeImages.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Ảnh trước khi sửa</Text>
            <View style={styles.imageContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageRow}
              >
                {beforeImages.map((url, index) => (
                  <TouchableOpacity
                    key={`${url}-${index}`}
                    activeOpacity={0.9}
                    onPress={() => setPreviewImageUrl(resolveImageUrl(url))}
                  >
                    <Image
                      source={{ uri: resolveImageUrl(url) }}
                      style={styles.incidentThumbnail}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.imageNote}>Ảnh do cư dân gửi kèm khi báo sự cố</Text>
            </View>
          </>
        )}

        <View style={styles.divider} />

        <View style={styles.timelineCard}>
          <View style={styles.timelineHeader}>
            <View>
              <Text style={styles.sectionTitle}>Tiến độ xử lý</Text>
              <Text style={styles.timelineSubtitle}>Các mốc được sắp theo đúng quy trình tiếp nhận và phản hồi.</Text>
            </View>
          </View>

          <View style={styles.timeline}>
            {timelineSteps.map((step, index) => {
              const isDone = index < timelineStatusIndex || request.status === 'Đã đóng' || request.status === 'Hoàn thành';
              const isCurrent = index === timelineStatusIndex && request.status !== 'Từ chối';
              return (
                <View key={step.key} style={styles.timelineItem}>
                  <View style={styles.timelineRailWrap}>
                    <View style={[
                      styles.timelineDot,
                      isDone && styles.doneDot,
                      !isDone && !isCurrent && styles.inactiveDot,
                      isCurrent && styles.currentDot,
                    ]}>
                      <Ionicons
                        name={step.icon}
                        size={10}
                        color={isDone || isCurrent ? '#FFFFFF' : '#9CA3AF'}
                      />
                    </View>
                    {index < timelineSteps.length - 1 && <View style={[styles.timelineRail, isDone && styles.doneRail]} />}
                  </View>

                  <View style={[
                    styles.timelineContent,
                    isDone && styles.timelineContentDone,
                    isCurrent && styles.timelineContentCurrent,
                  ]}>
                    <View style={styles.timelineTitleRow}>
                      <Text style={styles.timelineTitle}>{step.title}</Text>
                    </View>
                    <Text style={styles.timelineText}>{step.description}</Text>
                    <Text style={styles.timelineTime}>{step.time}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {request.adminNote && (
          <>
            <Text style={styles.sectionTitle}>Ghi chú từ ban quản lý</Text>
            <View style={styles.resultCard}>
              <Text style={styles.resultNote}>{request.adminNote}</Text>
            </View>
          </>
        )}

        {request.completionImageUrl && (
          <>
            <Text style={styles.sectionTitle}>Ảnh kết quả</Text>
            <View style={styles.imageContainer}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setPreviewImageUrl(resolveImageUrl(request.completionImageUrl))}
              >
                <Image 
                  source={{ uri: resolveImageUrl(request.completionImageUrl) }}
                  style={styles.incidentThumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <Text style={styles.imageNote}>BQL đã gửi ảnh kết quả xử lý</Text>
            </View>
          </>
        )}

        {showActions && (
          <>
            <Text style={styles.satisfactionTitle}>
              Bạn có hài lòng với kết quả xử lý?
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleRequestRework}
                disabled={isSubmitting}
              >
                <Text style={styles.secondaryButtonText}>Yêu cầu sửa lại</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleSatisfied}
                disabled={isSubmitting}
              >
                <Text style={styles.primaryButtonText}>Hài lòng</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.note}>
              Lưu ý: Tự động đóng sau 48h nếu không phản hồi.
            </Text>
          </>
        )}
      </ScrollView>

      <Modal visible={!!previewImageUrl} transparent animationType="fade" onRequestClose={() => setPreviewImageUrl(null)}>
        <Pressable style={styles.previewOverlay} onPress={() => setPreviewImageUrl(null)}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={() => setPreviewImageUrl(null)}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#1A4B84',
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 18,
  },
  issueTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  issueId: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 14,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 14,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  timelineSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 17,
  },
  timeline: {
    paddingTop: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineRailWrap: {
    width: 18,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  activeDot: {
    backgroundColor: '#3B82F6',
  },
  doneDot: {
    backgroundColor: '#16A34A',
  },
  currentDot: {
    backgroundColor: '#1D4ED8',
    transform: [{ scale: 1.08 }],
  },
  inactiveDot: {
    backgroundColor: '#D1D5DB',
  },
  timelineRail: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: -1,
  },
  doneRail: {
    backgroundColor: '#BBF7D0',
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timelineContentCurrent: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  timelineContentDone: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  timelineText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  timelineTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  resultCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  resultNote: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  imageContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  imageUrlText: {
    fontSize: 13,
    color: '#1A4B84',
    marginBottom: 8,
  },
  incidentThumbnail: {
    width: 112,
    height: 84,
    borderRadius: 8,
  },
  imageNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  satisfactionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1A4B84',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1A4B84',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A4B84',
  },
  note: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  previewHeader: {
    position: 'absolute',
    top: 44,
    right: 20,
    zIndex: 2,
  },
  previewImage: {
    width: '100%',
    height: '82%',
  },
});
