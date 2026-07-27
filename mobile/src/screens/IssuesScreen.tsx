import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { IssueCard } from '../components/IssueCard';
import maintenanceService, { MaintenanceRequest } from '../services/maintenance.service';
import signalRService from '../services/signalr.service';
import { palette } from '../theme/palette';
import { contractService, ContractDetail } from '../services/contract.service';
import { useAuthStore } from '../store/authStore';

export default function IssuesScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const routeContractId = Number(route.params?.contractId) || undefined;
  const routeRoomId = Number(route.params?.roomId) || undefined;
  const activeContractId = useAuthStore((state) => state.activeContractId);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedContractId, setSelectedContractId] = useState<number | 'all'>(activeContractId ?? 'all');
  const [contractPickerOpen, setContractPickerOpen] = useState(false);
  const [contracts, setContracts] = useState<ContractDetail[]>([]);
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

  useEffect(() => {
    let mounted = true;
    contractService
      .getMyContracts()
      .then((items) => {
        if (!mounted) return;
        setContracts(items);
        const nextContractId = routeContractId && items.some((item) => item.id === routeContractId)
          ? routeContractId
          : routeRoomId && items.some((item) => item.roomId === routeRoomId)
            ? items.find((item) => item.roomId === routeRoomId)?.id
            : activeContractId && items.some((item) => item.id === activeContractId)
              ? activeContractId
              : items[0]?.id;
        setSelectedContractId(nextContractId ?? 'all');
      })
      .catch(() => {
        if (mounted) setContracts([]);
      });

    return () => {
      mounted = false;
    };
  }, [activeContractId, routeContractId, routeRoomId]);

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
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const selectedContractRoomId = selectedContractId === 'all'
    ? null
    : contracts.find((contract) => contract.id === selectedContractId)?.roomId;

  const scopedRequests = useMemo(() => {
    return selectedContractRoomId ? requests.filter(req => req.roomId === selectedContractRoomId) : requests;
  }, [requests, selectedContractRoomId]);

  const getFilteredRequests = () => {
    const selectedRoomId = selectedContractId === 'all'
      ? null
      : contracts.find((contract) => contract.id === selectedContractId)?.roomId;
    let base = selectedRoomId ? requests.filter(req => req.roomId === selectedRoomId) : requests;
    if (selectedTab === 'all') return base;
    
    const statusMap: { [key: string]: string[] } = {
      'pending': ['Chờ xử lý', 'Sửa lại', 'Yêu cầu sửa lại'],
      'processing': ['Đang xử lý'],
      'review': ['Chờ nghiệm thu'],
      'completed': ['Hoàn thành', 'Đã đóng'],
    };
    
    const statuses = statusMap[selectedTab];
    if (!statuses) return base;
    
    return base.filter(req => statuses.includes(req.status));
  };

  const filteredRequests = getFilteredRequests();
  const formatContractLabel = (contract?: ContractDetail) =>
    contract?.roomNumber ? `Phòng ${contract.roomNumber}` : contract?.contractCode || `HĐ #${contract?.id}`;
  const selectedContractLabel = selectedContractId === 'all'
    ? 'Tất cả hợp đồng'
    : formatContractLabel(contracts.find((contract) => contract.id === selectedContractId));

  const statusMap: { [key: string]: string[] } = {
    pending: ['Chờ xử lý', 'Sửa lại', 'Yêu cầu sửa lại'],
    processing: ['Đang xử lý'],
    review: ['Chờ nghiệm thu'],
    completed: ['Hoàn thành', 'Đã đóng'],
  };

  const tabCounts = useMemo(() => ({
    all: scopedRequests.length,
    pending: scopedRequests.filter(r => statusMap.pending.includes(r.status)).length,
    processing: scopedRequests.filter(r => statusMap.processing.includes(r.status)).length,
    review: scopedRequests.filter(r => statusMap.review.includes(r.status)).length,
    completed: scopedRequests.filter(r => statusMap.completed.includes(r.status)).length,
  }), [scopedRequests]);

  const tabs: { value: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }[] = [
    { value: 'all',        label: 'Tất cả',      icon: 'list-outline',             color: palette.primary, bg: palette.primarySoft },
    { value: 'pending',    label: 'Chờ xử lý',   icon: 'time-outline',             color: '#D97706', bg: '#FFFBEB' },
    { value: 'processing', label: 'Đang xử lý',  icon: 'construct-outline',        color: '#7C3AED', bg: '#F5F3FF' },
    { value: 'review',     label: 'Nghiệm thu',  icon: 'eye-outline',              color: '#0891B2', bg: '#ECFEFF' },
    { value: 'completed',  label: 'Hoàn thành',  icon: 'checkmark-circle-outline', color: '#059669', bg: '#ECFDF5' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSideButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách sự cố</Text>
        <View style={styles.headerRightSlot} />
      </View>

      {/* Filter Panel */}
      <View style={styles.filterPanel}>
        {contracts.length > 1 && (
          <View style={styles.contractRow}>
            <Text style={styles.contractRowLabel}>Hợp đồng</Text>
            <TouchableOpacity style={styles.contractDropdownButton} onPress={() => setContractPickerOpen(true)}>
              <Text style={styles.contractDropdownText} numberOfLines={1}>{selectedContractLabel}</Text>
              <Ionicons name="chevron-down" size={18} color={palette.textMuted} />
            </TouchableOpacity>
          </View>
        )}
        {contracts.length > 1 && <View style={styles.panelDivider} />}

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

      <Modal visible={contractPickerOpen} transparent animationType="fade" onRequestClose={() => setContractPickerOpen(false)}>
        <View style={styles.dropdownBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setContractPickerOpen(false)} />
          <View style={styles.dropdownCard}>
            <Text style={styles.dropdownTitle}>Chọn hợp đồng</Text>
            <TouchableOpacity
              style={[styles.dropdownOption, selectedContractId === 'all' && styles.dropdownOptionActive]}
              onPress={() => { setSelectedContractId('all'); setContractPickerOpen(false); }}
            >
              <Text style={[styles.dropdownOptionText, selectedContractId === 'all' && styles.dropdownOptionTextActive]}>
                Tất cả hợp đồng
              </Text>
              {selectedContractId === 'all' && <Ionicons name="checkmark" size={18} color={palette.primary} />}
            </TouchableOpacity>
            {contracts.map((contract) => {
              const selected = selectedContractId === contract.id;
              return (
                <TouchableOpacity
                  key={contract.id}
                  style={[styles.dropdownOption, selected && styles.dropdownOptionActive]}
                  onPress={() => { setSelectedContractId(contract.id); setContractPickerOpen(false); }}
                >
                  <Text style={[styles.dropdownOptionText, selected && styles.dropdownOptionTextActive]} numberOfLines={1}>
                    {formatContractLabel(contract)}
                  </Text>
                  {selected && <Ionicons name="checkmark" size={18} color={palette.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Issue List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={palette.danger} />
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
              <Ionicons name="document-outline" size={52} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Không có sự cố nào</Text>
              <Text style={styles.emptyText}>Không tìm thấy sự cố phù hợp với bộ lọc hiện tại.</Text>
            </View>
          }
          renderItem={({ item: request }) => {
            const statusInfo = maintenanceService.getStatusInfo(request.status);
            return (
              <IssueCard
                tag={maintenanceService.getIssueTypeLabel(request.issueType)}
                roomLabel={request.roomNumber ? `Phòng ${request.roomNumber}` : `Phòng #${request.roomId}`}
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
  container: { flex: 1, backgroundColor: palette.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  headerSideButton: { width: 52, height: 28, justifyContent: 'center', zIndex: 2 },
  headerRightSlot: { width: 52, minHeight: 28, zIndex: 2 },
  headerTitle: {
    position: 'absolute',
    left: 72,
    right: 72,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: palette.text,
  },

  /* Filter Panel — matches BillsScreen */
  filterPanel: {
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
  contractRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  contractRowLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    width: 68,
  },
  contractDropdownButton: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  contractDropdownText: { flex: 1, fontSize: 13, fontWeight: '700', color: palette.text },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    justifyContent: 'center',
    padding: 24,
  },
  dropdownCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  dropdownTitle: { fontSize: 16, fontWeight: '800', color: palette.text, marginBottom: 8 },
  dropdownOption: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  dropdownOptionActive: { backgroundColor: palette.primarySoft },
  dropdownOptionText: { flex: 1, fontSize: 14, fontWeight: '700', color: palette.textMuted },
  dropdownOptionTextActive: { color: palette.primary },
  panelDivider: { height: 1, backgroundColor: palette.borderSoft, marginHorizontal: 12 },
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
  statusTabLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8', textAlign: 'center' },
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
  loadingText: { marginTop: 12, fontSize: 14, color: palette.textMuted },
  errorText: { marginTop: 8, fontSize: 14, color: palette.danger, textAlign: 'center' },
  emptyTitle: { marginTop: 16, fontSize: 16, fontWeight: '700', color: palette.text },
  emptyText: { marginTop: 6, fontSize: 13, color: palette.textMuted, textAlign: 'center', lineHeight: 20 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: palette.primary, borderRadius: 12 },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  /* Footer */
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.borderSoft,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    shadowColor: palette.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
