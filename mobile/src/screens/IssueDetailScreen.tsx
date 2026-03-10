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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import maintenanceService, { MaintenanceRequest } from '../services/maintenance.service';
import { API_BASE_URL } from '../services/api.service';

export default function IssueDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as { id: number };
  
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRequestDetail();
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
              await maintenanceService.updateStatus(id, {
                status: 'Yêu cầu sửa lại',
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
                status: 'Hoàn thành',
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
      'Đang xử lý': { label: 'Đang xử lý', color: '#2563EB', bgColor: '#DBEAFE' },
      'Chờ nghiệm thu': { label: 'Chờ nghiệm thu', color: '#7C3AED', bgColor: '#F3E8FF' },
      'Hoàn thành': { label: 'Hoàn thành', color: '#059669', bgColor: '#D1FAE5' },
      'Yêu cầu sửa lại': { label: 'Yêu cầu sửa lại', color: '#DC2626', bgColor: '#FEE2E2' },
      'Từ chối': { label: 'Từ chối', color: '#DC2626', bgColor: '#FEE2E2' },
      'Đã đóng': { label: 'Đã đóng', color: '#6B7280', bgColor: '#F3F4F6' },
    };
    return statusMap[status] || { label: status, color: '#6B7280', bgColor: '#F3F4F6' };
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
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

        {request.description && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Mô tả</Text>
            <Text style={styles.descriptionText}>{request.description}</Text>
          </>
        )}

        {request.mediaUrl && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Ảnh trước khi sửa</Text>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: `${API_BASE_URL}${request.mediaUrl}` }}
                style={styles.completionImage}
                resizeMode="cover"
              />
              <Text style={styles.imageNote}>Ảnh do cư dân gửi kèm khi báo sự cố</Text>
            </View>
          </>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Tiến độ xử lý</Text>
        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, styles.activeDot]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineText}>
                {new Date(request.createdAt).toLocaleString('vi-VN')} - Bạn đã gửi yêu cầu
              </Text>
            </View>
          </View>
          
          {request.status !== 'Chờ xử lý' && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.activeDot]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineText}>
                  BQL đã tiếp nhận - {statusInfo.label}
                </Text>
              </View>
            </View>
          )}
          
          {request.closedAt && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.activeDot]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineText}>
                  {new Date(request.closedAt).toLocaleString('vi-VN')} - Đã đóng
                </Text>
              </View>
            </View>
          )}
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
              <Image 
                source={{ uri: `${API_BASE_URL}${request.completionImageUrl}` }}
                style={styles.completionImage}
                resizeMode="cover"
              />
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
    backgroundColor: '#2563EB',
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
    padding: 24,
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
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 24,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 24,
  },
  timeline: {
    marginBottom: 24,
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
    marginTop: 4,
  },
  activeDot: {
    backgroundColor: '#3B82F6',
  },
  timelineContent: {
    flex: 1,
  },
  timelineText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  resultCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
    padding: 16,
    marginBottom: 24,
  },
  imageUrlText: {
    fontSize: 13,
    color: '#2563EB',
    marginBottom: 8,
  },
  completionImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  imageNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  satisfactionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1E3A8A',
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
    borderColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  note: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
