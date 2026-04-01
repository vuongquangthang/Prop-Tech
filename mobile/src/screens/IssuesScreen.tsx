import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { IssueCard } from '../components/IssueCard';
import maintenanceService, { MaintenanceRequest } from '../services/maintenance.service';
import signalRService from '../services/signalr.service';

export default function IssuesScreen() {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState('all');
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setError(null);
      const data = await maintenanceService.getMyRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách sự cố');
      console.error('Load requests error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadRequests();
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = signalRService.onMaintenanceUpdate(() => {
      loadRequests();
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      loadRequests();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getFilteredRequests = () => {
    if (selectedTab === 'all') return requests;
    
    const statusMap: { [key: string]: string[] } = {
      'pending': ['Chờ xử lý', 'Yêu cầu sửa lại'],
      'processing': ['Đang xử lý'],
      'review': ['Chờ nghiệm thu'],
      'completed': ['Hoàn thành', 'Đã đóng'],
    };
    
    const statuses = statusMap[selectedTab];
    if (!statuses) return requests;
    
    return requests.filter(req => statuses.includes(req.status));
  };

  const filteredRequests = getFilteredRequests();

  const statusMap: { [key: string]: string[] } = {
    pending: ['Chờ xử lý', 'Yêu cầu sửa lại'],
    processing: ['Đang xử lý'],
    review: ['Chờ nghiệm thu'],
    completed: ['Hoàn thành', 'Đã đóng'],
  };

  const tabCounts = useMemo(() => ({
    all: requests.length,
    pending: requests.filter(r => statusMap.pending.includes(r.status)).length,
    processing: requests.filter(r => statusMap.processing.includes(r.status)).length,
    review: requests.filter(r => statusMap.review.includes(r.status)).length,
    completed: requests.filter(r => statusMap.completed.includes(r.status)).length,
  }), [requests]);

  const tabs: { value: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }[] = [
    { value: 'all',        label: 'Tất cả',      icon: 'list-outline',             color: '#1A4B84', bg: '#E8F0FB' },
    { value: 'pending',    label: 'Chờ xử lý',   icon: 'time-outline',             color: '#D97706', bg: '#FFFBEB' },
    { value: 'processing', label: 'Đang xử lý',  icon: 'construct-outline',        color: '#7C3AED', bg: '#F5F3FF' },
    { value: 'review',     label: 'Nghiệm thu',  icon: 'eye-outline',              color: '#0891B2', bg: '#ECFEFF' },
    { value: 'completed',  label: 'Hoàn thành',  icon: 'checkmark-circle-outline', color: '#059669', bg: '#ECFDF5' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách sự cố</Text>
        <View style={{ width: 52 }} />
      </View>

      {/* Filter Panel */}
      <View style={styles.filterPanel}>
        <View style={styles.statusRow}>
          {tabs.map(tab => {
            const active = selectedTab === tab.value;
            const count = tabCounts[tab.value as keyof typeof tabCounts];
            return (
              <TouchableOpacity
                key={tab.value}
                style={styles.statusTab}
                onPress={() => setSelectedTab(tab.value)}
              >
                <View style={[styles.statusPill, active && { backgroundColor: tab.bg, borderColor: tab.color }]}>
                  <View style={styles.pillIconRow}>
                    <Ionicons name={tab.icon} size={16} color={active ? tab.color : '#9CA3AF'} />
                    {count > 0 && (
                      <View style={[styles.badge, { backgroundColor: active ? tab.color : '#E5E7EB' }]}>
                        <Text style={[styles.badgeText, { color: active ? '#fff' : '#6B7280' }]}>{count}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.statusTabLabel, active && { color: tab.color }]}>
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Issue List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1A4B84" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRequests}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="document-outline" size={52} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Không có sự cố nào</Text>
              <Text style={styles.emptyText}>Không tìm thấy sự cố phù hợp với bộ lọc hiện tại.</Text>
            </View>
          }
          renderItem={({ item: request }) => {
            const statusInfo = maintenanceService.getStatusInfo(request.status);
            return (
              <IssueCard
                tag={maintenanceService.getIssueTypeLabel(request.issueType)}
                title={request.description || 'Không có mô tả'}
                id={`#${request.id} - ${new Date(request.createdAt).toLocaleDateString('vi-VN')}`}
                status={statusInfo}
                // @ts-ignore
                onPress={() => navigation.navigate('IssueDetail' as never, { id: request.id } as never)}
              />
            );
          }}
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.reportButton}
          // @ts-ignore
          onPress={() => navigation.navigate('ReportIssue' as never)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.reportButtonText}>Báo cáo sự cố mới</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },

  /* Filter Panel — matches BillsScreen */
  filterPanel: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: { flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 8, gap: 4 },
  statusTab: {
    flex: 1,
    alignItems: 'center',
  },
  statusPill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    width: '100%',
  },
  pillIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusTabLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', textAlign: 'center' },
  badge: {
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '700' },
  activeBar: {},

  /* List */
  listContent: { padding: 16, paddingBottom: 32 },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorText: { marginTop: 8, fontSize: 14, color: '#DC2626', textAlign: 'center' },
  emptyTitle: { marginTop: 16, fontSize: 16, fontWeight: '700', color: '#374151' },
  emptyText: { marginTop: 6, fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#1A4B84', borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  /* Footer */
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A4B84',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
