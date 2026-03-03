import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  const [selectedYear, setSelectedYear] = useState('2026');
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

  // Listen for new invoice approvals via SignalR
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

  const getFilteredInvoices = () => {
    let filtered = invoices;

    // Filter by year
    if (selectedYear !== 'all') {
      filtered = filtered.filter(inv => inv.year.toString() === selectedYear);
    }

    // Filter by status
    if (selectedStatus === 'unpaid') {
      filtered = filtered.filter(inv => inv.status === 'Chưa thanh toán');
    } else if (selectedStatus === 'paid') {
      filtered = filtered.filter(inv => inv.status === 'Đã thanh toán');
    } else if (selectedStatus === 'overdue') {
      filtered = filtered.filter(inv => invoiceService.isOverdue(inv));
    }

    return filtered.sort((a, b) => {
      // Sort by year and month descending
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  };

  const filteredInvoices = getFilteredInvoices();

  const getStatusDisplay = (invoice: Invoice) => {
    if (invoice.status === 'Đã thanh toán') {
      return `Đã thanh toán: ${invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString('vi-VN') : ''}`;
    }
    if (invoiceService.isOverdue(invoice)) {
      return `Quá hạn - Hạn: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('vi-VN') : ''}`;
    }
    return `Hạn thanh toán: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('vi-VN') : ''}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử hóa đơn</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filters */}
        <View style={styles.filters}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Năm</Text>
            <View style={styles.select}>
              <Text style={styles.selectText}>{selectedYear}</Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </View>
          </View>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Trạng thái</Text>
            <View style={styles.select}>
              <Text style={styles.selectText}>{selectedStatus}</Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </View>
          </View>
        </View>

        {/* Bill List */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
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
        ) : filteredInvoices.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="document-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Chưa có hóa đơn nào</Text>
          </View>
        ) : (
          <View style={styles.billList}>
            {filteredInvoices.map((invoice) => {
              const isNew = invoiceService.isNew(invoice);
              return (
                <View key={invoice.id} style={{ position: 'relative' }}>
                  {isNew && (
                    <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, backgroundColor: '#16a34a', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>MỚI</Text>
                    </View>
                  )}
                  <BillCard
                    month={invoiceService.formatPeriod(invoice.month, invoice.year)}
                    status={getStatusDisplay(invoice)}
                    amount={invoiceService.formatCurrency(invoice.totalAmount)}
                    isActive={invoice.status === 'Chưa thanh toán'}
                    // @ts-ignore - Navigation typing issue
                    onPress={() => navigation.navigate('BillDetail' as never, { id: invoice.id })}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
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
  filters: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  billList: {
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
