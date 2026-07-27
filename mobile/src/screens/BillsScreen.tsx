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
import { BillCard } from '../components/BillCard';
import invoiceService, { Invoice } from '../services/invoice.service';
import signalRService from '../services/signalr.service';
import { palette } from '../theme/palette';
import { contractService, ContractDetail } from '../services/contract.service';
import { useAuthStore } from '../store/authStore';

export default function BillsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const routeContractId = Number(route.params?.contractId) || undefined;
  const activeContractId = useAuthStore((state) => state.activeContractId);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedContractId, setSelectedContractId] = useState<number | 'all'>(activeContractId ?? 'all');
  const [contractPickerOpen, setContractPickerOpen] = useState(false);
  const [contracts, setContracts] = useState<ContractDetail[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = async () => {
    try {
      setError(null);
      const data = await invoiceService.getAll();
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách hóa đơn');
      console.error('Load invoices error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadInvoices();
  };

  useEffect(() => {
    loadInvoices();
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
  }, [activeContractId, routeContractId]);

  useEffect(() => {
    const unsub = signalRService.onInvoiceUpdate(() => {
      loadInvoices();
    });
    return unsub;
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [])
  );

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear().toString();
    const fromData = Array.from(new Set(invoices.map(inv => inv.year.toString()))).sort((a, b) => Number(b) - Number(a));
    if (!fromData.includes(currentYear)) fromData.unshift(currentYear);
    return ['all', ...fromData];
  }, [invoices]);

  const statusCounts = useMemo(() => {
    const contractFiltered = selectedContractId === 'all'
      ? invoices
      : invoices.filter(inv => inv.contractId === selectedContractId);
    const base = selectedYear === 'all' ? contractFiltered : contractFiltered.filter(inv => inv.year.toString() === selectedYear);
    return {
      all: base.length,
      unpaid: base.filter(inv => inv.status === 'Chưa thanh toán').length,
      paid: base.filter(inv => inv.status === 'Đã thanh toán').length,
      overdue: base.filter(inv => invoiceService.isOverdue(inv)).length,
    };
  }, [invoices, selectedContractId, selectedYear]);

  const getFilteredInvoices = () => {
    let filtered = invoices;
    if (selectedContractId !== 'all') {
      filtered = filtered.filter(inv => inv.contractId === selectedContractId);
    }
    if (selectedYear !== 'all') {
      filtered = filtered.filter(inv => inv.year.toString() === selectedYear);
    }
    if (selectedStatus === 'unpaid') {
      filtered = filtered.filter(inv => inv.status === 'Chưa thanh toán');
    } else if (selectedStatus === 'paid') {
      filtered = filtered.filter(inv => inv.status === 'Đã thanh toán');
    } else if (selectedStatus === 'overdue') {
      filtered = filtered.filter(inv => invoiceService.isOverdue(inv));
    }
    return filtered.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  };

  const filteredInvoices = getFilteredInvoices();
  const formatContractLabel = (contract?: ContractDetail) =>
    contract?.roomNumber ? `Phòng ${contract.roomNumber}` : contract?.contractCode || `HĐ #${contract?.id}`;
  const selectedContractLabel = selectedContractId === 'all'
    ? 'Tất cả hợp đồng'
    : formatContractLabel(contracts.find((contract) => contract.id === selectedContractId));

  const statusTabs: { value: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }[] = [
    { value: 'all',     label: 'Tất cả',    icon: 'list-outline',             color: palette.primary, bg: palette.primarySoft },
    { value: 'unpaid',  label: 'Chưa TT',   icon: 'time-outline',             color: '#D97706', bg: '#FFFBEB' },
    { value: 'paid',    label: 'Đã TT',     icon: 'checkmark-circle-outline', color: '#059669', bg: '#ECFDF5' },
    { value: 'overdue', label: 'Quá hạn',   icon: 'alert-circle-outline',     color: '#DC2626', bg: '#FEF2F2' },
  ];

  const getStatusDisplay = (invoice: Invoice) => {
    if (invoice.status === 'Đã thanh toán') {
      return `Đã thanh toán: ${invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString('vi-VN') : ''}`;
    }
    if (invoiceService.isOverdue(invoice)) {
      return `Quá hạn - Hạn: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('vi-VN') : ''}`;
    }
    return `Hạn thanh toán: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('vi-VN') : ''}`;
  };

  const isFiltering = selectedYear !== 'all' || selectedStatus !== 'all' || selectedContractId !== (activeContractId ?? contracts[0]?.id ?? 'all');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSideButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử hóa đơn</Text>
        {isFiltering ? (
          <TouchableOpacity style={styles.headerRightSlot} onPress={() => { setSelectedContractId(activeContractId ?? contracts[0]?.id ?? 'all'); setSelectedYear('all'); setSelectedStatus('all'); }}>
            <Text style={styles.resetText}>Xoá lọc</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRightSlot} />
        )}
      </View>

      <View style={styles.filterPanel}>
        {contracts.length > 1 && (
          <View style={styles.contractRow}>
            <Text style={styles.filterRowLabel}>Hợp đồng</Text>
            <TouchableOpacity style={styles.contractDropdownButton} onPress={() => setContractPickerOpen(true)}>
              <Text style={styles.contractDropdownText} numberOfLines={1}>{selectedContractLabel}</Text>
              <Ionicons name="chevron-down" size={18} color={palette.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {contracts.length > 1 && <View style={styles.panelDivider} />}

        <View style={styles.yearRow}>
          <Text style={styles.filterRowLabel}>Năm</Text>
          <View style={styles.yearChips}>
            {yearOptions.map(y => (
              <TouchableOpacity
                key={y}
                style={[styles.yearChip, selectedYear === y && styles.yearChipActive]}
                onPress={() => setSelectedYear(y)}
              >
                <Text style={[styles.yearChipText, selectedYear === y && styles.yearChipTextActive]}>
                  {y === 'all' ? 'Tất cả' : y}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.panelDivider} />

        <View style={styles.statusRow}>
          {statusTabs.map(tab => {
            const active = selectedStatus === tab.value;
            const count = statusCounts[tab.value as keyof typeof statusCounts];
            return (
              <TouchableOpacity
                key={tab.value}
                style={styles.statusTab}
                onPress={() => setSelectedStatus(tab.value)}
              >
                <View style={[styles.statusPill, active && { backgroundColor: tab.bg, borderColor: tab.color }]}>
                  <Ionicons name={tab.icon} size={16} color={active ? tab.color : '#9CA3AF'} />
                  <Text style={[styles.statusTabLabel, active && { color: tab.color }]}>
                    {tab.label}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.badge, { backgroundColor: active ? tab.color : '#E5E7EB' }]}>
                      <Text style={[styles.badgeText, { color: active ? '#fff' : '#6B7280' }]}>{count}</Text>
                    </View>
                  )}
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

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={palette.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadInvoices}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="document-outline" size={52} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Không có hóa đơn</Text>
              <Text style={styles.emptyText}>Không tìm thấy hóa đơn phù hợp với bộ lọc hiện tại.</Text>
            </View>
          }
          renderItem={({ item: invoice }) => {
            const isNew = invoiceService.isNew(invoice);
            return (
              <View style={{ position: 'relative' }}>
                {isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>MỚI</Text>
                  </View>
                )}
                <BillCard
                  month={invoiceService.formatPeriod(invoice.month, invoice.year)}
                  roomLabel={invoice.roomNumber ? `Phòng ${invoice.roomNumber}` : invoice.roomId ? `Phòng #${invoice.roomId}` : undefined}
                  status={getStatusDisplay(invoice)}
                  amount={invoiceService.formatCurrency(invoice.totalAmount)}
                  isActive={invoice.status === 'Chưa thanh toán'}
                  onPress={() => navigation.navigate('BillDetail', { id: invoice.id })}
                />
              </View>
            );
          }}
        />
      )}
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
  headerRightSlot: { width: 52, minHeight: 28, alignItems: 'flex-end', justifyContent: 'center', zIndex: 2 },
  headerTitle: {
    position: 'absolute',
    left: 72,
    right: 72,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: palette.text,
  },
  resetText: { fontSize: 13, fontWeight: '600', color: palette.primary, textAlign: 'right' },
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
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  filterRowLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.45,
    width: 68,
    flexShrink: 0,
  },
  contractRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  contractDropdownButton: {
    flex: 1,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  contractDropdownText: { flex: 1, fontSize: 12, fontWeight: '700', color: palette.text },
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
  contractChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  contractChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1.5,
    borderColor: 'transparent',
    maxWidth: 150,
  },
  contractChipActive: { backgroundColor: palette.primarySoft, borderColor: palette.primary },
  contractChipText: { fontSize: 13, fontWeight: '600', color: palette.textMuted },
  contractChipTextActive: { color: palette.primary },
  yearChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, flex: 1 },
  yearChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  yearChipActive: { backgroundColor: palette.primarySoft, borderColor: palette.primary },
  yearChipText: { fontSize: 12, fontWeight: '600', color: palette.textMuted },
  yearChipTextActive: { color: palette.primary },
  panelDivider: { height: 1, backgroundColor: palette.borderSoft, marginHorizontal: 16 },
  statusRow: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 10, gap: 6 },
  statusTab: {
    flex: 1,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  statusTabLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '700' },
  activeBar: {},
  _unused: {},
  listContent: { padding: 16, paddingBottom: 32 },
  newBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: palette.success,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newBadgeText: { color: 'white', fontSize: 10, fontWeight: '700' },
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
});
