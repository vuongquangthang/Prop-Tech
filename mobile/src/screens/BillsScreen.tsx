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
import { BillCard } from '../components/BillCard';
import invoiceService, { Invoice } from '../services/invoice.service';
import signalRService from '../services/signalr.service';

export default function BillsScreen() {
  const navigation = useNavigation();
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
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
    const base = selectedYear === 'all' ? invoices : invoices.filter(inv => inv.year.toString() === selectedYear);
    return {
      all: base.length,
      unpaid: base.filter(inv => inv.status === 'Chưa thanh toán').length,
      paid: base.filter(inv => inv.status === 'Đã thanh toán').length,
      overdue: base.filter(inv => invoiceService.isOverdue(inv)).length,
    };
  }, [invoices, selectedYear]);

  const getFilteredInvoices = () => {
    let filtered = invoices;
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

  const statusTabs: { value: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }[] = [
    { value: 'all',     label: 'Tất cả',    icon: 'list-outline',             color: '#1A4B84', bg: '#E8F0FB' },
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

  const isFiltering = selectedYear !== 'all' || selectedStatus !== 'all';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử hóa đơn</Text>
        {isFiltering ? (
          <TouchableOpacity onPress={() => { setSelectedYear('all'); setSelectedStatus('all'); }}>
            <Text style={styles.resetText}>Xoá lọc</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 52 }} />
        )}
      </View>

      <View style={styles.filterPanel}>
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

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1A4B84" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
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
              <Ionicons name="document-outline" size={52} color="#D1D5DB" />
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
                  status={getStatusDisplay(invoice)}
                  amount={invoiceService.formatCurrency(invoice.totalAmount)}
                  isActive={invoice.status === 'Chưa thanh toán'}
                  onPress={() => navigation.navigate('BillDetail' as never, { id: invoice.id } as never)}
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
  resetText: { fontSize: 13, fontWeight: '600', color: '#1A4B84', width: 52, textAlign: 'right' },
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
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
  },
  filterRowLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    width: 34,
  },
  yearChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  yearChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  yearChipActive: { backgroundColor: '#E8F0FB', borderColor: '#1A4B84' },
  yearChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  yearChipTextActive: { color: '#1A4B84' },
  panelDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
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
  statusTabLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
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
    backgroundColor: '#16a34a',
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
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorText: { marginTop: 8, fontSize: 14, color: '#DC2626', textAlign: 'center' },
  emptyTitle: { marginTop: 16, fontSize: 16, fontWeight: '700', color: '#374151' },
  emptyText: { marginTop: 6, fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#1A4B84', borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
