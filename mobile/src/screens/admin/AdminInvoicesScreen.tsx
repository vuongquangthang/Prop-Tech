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
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import invoiceService, { CalculateInvoiceResult, Invoice } from '../../services/invoice.service';
import { palette, radius } from '../../theme/palette';

const currentDate = new Date();

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
};

const isDraft = (invoice: Invoice) => invoice.status === 'Nháp' || invoice.status === 'Draft';

export default function AdminInvoicesScreen() {
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [activeTab, setActiveTab] = useState<'draft' | 'unpaid'>('draft');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [calculateResult, setCalculateResult] = useState<CalculateInvoiceResult | null>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = activeTab === 'draft' ? await invoiceService.getDrafts() : await invoiceService.getAdminAll();
      setInvoices(data);
    } catch (error: any) {
      Alert.alert('Không tải được hóa đơn', error?.message || 'Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const periodInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchPeriod = invoice.month === selectedMonth && invoice.year === selectedYear;
      if (!matchPeriod) return false;
      if (activeTab === 'draft') return isDraft(invoice);
      return !isDraft(invoice) && invoice.status !== 'Đã thanh toán' && invoice.status !== 'Bị từ chối';
    });
  }, [activeTab, invoices, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    const totalAmount = periodInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
    return {
      count: periodInvoices.length,
      totalAmount,
    };
  }, [periodInvoices]);

  const resultInvoices = useMemo(
    () => periodInvoices.filter(isDraft),
    [periodInvoices],
  );

  const selectedInvoiceStatus = selectedInvoice
    ? (isDraft(selectedInvoice) ? 'Chờ gửi' : selectedInvoice.status)
    : '';
  const selectedInvoiceStatusColor = selectedInvoice
    ? (isDraft(selectedInvoice)
        ? { color: palette.primary, bgColor: palette.primarySoft }
        : invoiceService.getStatusColor(selectedInvoice.status))
    : { color: palette.textMuted, bgColor: palette.surfaceSoft };

  const shiftMonth = (direction: -1 | 1) => {
    const next = new Date(selectedYear, selectedMonth - 1 + direction, 1);
    setSelectedMonth(next.getMonth() + 1);
    setSelectedYear(next.getFullYear());
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const result = await invoiceService.calculateDrafts(selectedYear, selectedMonth);
      const drafts = await invoiceService.getDrafts();
      setInvoices(drafts);
      setActiveTab('draft');
      setCalculateResult(result);
    } catch (error: any) {
      Alert.alert('Không tính được hóa đơn', error?.message || 'Vui lòng kiểm tra chỉ số điện/nước.');
    } finally {
      setCalculating(false);
    }
  };

  const handleApproveOne = async (invoice: Invoice) => {
    setApproving(true);
    try {
      await invoiceService.approve(invoice.id);
      await loadInvoices();
      setSelectedInvoice(null);
      Alert.alert('Đã gửi hóa đơn', `Hóa đơn phòng ${invoice.roomNumber || invoice.id} đã được gửi cho cư dân.`);
    } catch (error: any) {
      Alert.alert('Không gửi được hóa đơn', error?.message || 'Vui lòng thử lại.');
    } finally {
      setApproving(false);
    }
  };

  const handleApproveAll = async () => {
    const draftIds = periodInvoices.filter(isDraft).map((invoice) => invoice.id);
    if (draftIds.length === 0) {
      Alert.alert('Không có hóa đơn chờ gửi', 'Không có hóa đơn nào trong tháng này để gửi cho cư dân.');
      return;
    }

    Alert.alert(
      'Gửi hóa đơn',
      `Bạn có chắc muốn gửi ${draftIds.length} hóa đơn tháng ${selectedMonth}/${selectedYear} cho cư dân?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi hóa đơn',
          style: 'default',
          onPress: async () => {
            setApproving(true);
            try {
              const result = await invoiceService.approveBatch(draftIds);
              await loadInvoices();
              Alert.alert('Kết quả gửi hóa đơn', `Thành công: ${result.success}\nLỗi: ${result.failed}`);
            } catch (error: any) {
              Alert.alert('Không gửi được hóa đơn', error?.message || 'Vui lòng thử lại.');
            } finally {
              setApproving(false);
            }
          },
        },
      ],
    );
  };

  const handleReminder = async (invoice: Invoice) => {
    try {
      const result = await invoiceService.sendReminder(invoice.id);
      Alert.alert('Đã gửi nhắc nợ', `Đã gửi đến ${result.sentCount} tài khoản liên quan phòng ${invoice.roomNumber || invoice.id}.`);
    } catch (error: any) {
      Alert.alert('Không gửi được nhắc nợ', error?.message || 'Vui lòng thử lại.');
    }
  };

  const renderInvoice = ({ item }: { item: Invoice }) => {
    const isPendingSend = isDraft(item);
    const displayStatus = isPendingSend ? 'Chờ gửi' : item.status;
    const statusColor = isPendingSend
      ? { color: palette.primary, bgColor: palette.primarySoft }
      : invoiceService.getStatusColor(item.status);
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.86} onPress={() => setSelectedInvoice(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.roomBadge}>
            <Ionicons name="home-outline" size={19} color={palette.primary} />
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.roomText}>{item.roomNumber || `Hóa đơn #${item.id}`}</Text>
            <Text style={styles.metaText}>
              {item.residentName || 'Chưa rõ cư dân'} · Hạn {formatDate(item.dueDate)}
            </Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: statusColor.bgColor }]}>
            <Text style={[styles.statusText, { color: statusColor.color }]}>{displayStatus}</Text>
          </View>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Tổng tiền</Text>
          <Text style={styles.amount}>{invoiceService.formatCurrency(item.totalAmount || 0)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Quy trình hóa đơn</Text>
          <Text style={styles.subtitle}>Tính hóa đơn, kiểm tra và gửi cư dân</Text>
        </View>
      </View>

      <View style={styles.monthRow}>
        <TouchableOpacity style={styles.monthButton} onPress={() => shiftMonth(-1)}>
          <Ionicons name="chevron-back" size={20} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{String(selectedMonth).padStart(2, '0')}/{selectedYear}</Text>
        <TouchableOpacity style={styles.monthButton} onPress={() => shiftMonth(1)}>
          <Ionicons name="chevron-forward" size={20} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate} disabled={calculating}>
          {calculating ? <ActivityIndicator color={palette.surface} /> : <Ionicons name="calculator-outline" size={18} color={palette.surface} />}
          <Text style={styles.calculateButtonText}>{calculating ? 'Đang tính...' : 'Tính hóa đơn'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.approveButton} onPress={handleApproveAll} disabled={approving || activeTab !== 'draft'}>
          {approving ? <ActivityIndicator color={palette.surface} /> : <Ionicons name="send-outline" size={18} color={palette.surface} />}
          <Text style={styles.approveButtonText}>Gửi hóa đơn</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.count}</Text>
          <Text style={styles.statLabel}>Hóa đơn</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{invoiceService.formatCurrency(stats.totalAmount)}</Text>
          <Text style={styles.statLabel}>Tổng tiền</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'draft' && styles.tabActive]} onPress={() => setActiveTab('draft')}>
          <Text style={[styles.tabText, activeTab === 'draft' && styles.tabTextActive]}>Chờ gửi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'unpaid' && styles.tabActive]} onPress={() => setActiveTab('unpaid')}>
          <Text style={[styles.tabText, activeTab === 'unpaid' && styles.tabTextActive]}>Chờ thanh toán</Text>
        </TouchableOpacity>
      </View>

      {loading && invoices.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Đang tải hóa đơn...</Text>
        </View>
      ) : (
        <FlatList
          data={periodInvoices}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderInvoice}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadInvoices} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={34} color="#94a3b8" />
              <Text style={styles.emptyTitle}>Chưa có hóa đơn</Text>
              <Text style={styles.emptyText}>Hãy chốt chỉ số rồi bấm Tính hóa đơn.</Text>
            </View>
          }
        />
      )}

      <Modal visible={!!calculateResult} transparent animationType="fade" onRequestClose={() => setCalculateResult(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.resultModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kết quả tính hóa đơn</Text>
              <TouchableOpacity onPress={() => setCalculateResult(null)}>
                <Ionicons name="close" size={22} color="#334155" />
              </TouchableOpacity>
            </View>
            {calculateResult && (
              <View style={styles.resultBody}>
                <Text style={styles.resultSuccess}>Tạo thành công {calculateResult.totalInvoices} hóa đơn</Text>
                <Text style={styles.resultLine}>Hợp đồng xử lý: {calculateResult.totalContracts}</Text>
                <Text style={styles.resultLine}>Bỏ qua: {calculateResult.skipped}</Text>
                <Text style={styles.resultAmount}>{invoiceService.formatCurrency(calculateResult.totalAmount)}</Text>

                {resultInvoices.length > 0 && (
                  <View style={styles.resultTable}>
                    <View style={styles.resultTableHeader}>
                      <Text style={[styles.resultCell, styles.resultRoomCell]}>Mã phòng</Text>
                      <Text style={[styles.resultCell, styles.resultAmountCell]}>Số tiền</Text>
                      <Text style={[styles.resultCell, styles.resultActionCell]}>Xem</Text>
                    </View>
                    {resultInvoices.map((invoice) => (
                      <View key={invoice.id} style={styles.resultTableRow}>
                        <Text style={[styles.resultCell, styles.resultRoomCell]} numberOfLines={1}>
                          {invoice.roomNumber || `#${invoice.roomId || invoice.id}`}
                        </Text>
                        <Text style={[styles.resultCell, styles.resultAmountCell]} numberOfLines={1}>
                          {invoiceService.formatCurrency(invoice.totalAmount || 0)}
                        </Text>
                        <TouchableOpacity
                          style={styles.viewInvoiceButton}
                          onPress={() => {
                            setCalculateResult(null);
                            setSelectedInvoice(invoice);
                          }}
                        >
                          <Ionicons name="eye-outline" size={16} color={palette.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {calculateResult.skippedReasons?.length > 0 && (
                  <Text style={styles.resultNote}>{calculateResult.skippedReasons.slice(0, 4).join('\n')}</Text>
                )}
                {calculateResult.errors?.length > 0 && (
                  <Text style={styles.resultError}>{calculateResult.errors.slice(0, 4).join('\n')}</Text>
                )}
                {resultInvoices.length > 0 && (
                  <TouchableOpacity
                    style={styles.resultSendButton}
                    onPress={() => {
                      setCalculateResult(null);
                      handleApproveAll();
                    }}
                    disabled={approving}
                  >
                    <Ionicons name="send-outline" size={17} color={palette.surface} />
                    <Text style={styles.resultSendText}>Gửi hóa đơn</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedInvoice} transparent animationType="slide" onRequestClose={() => setSelectedInvoice(null)}>
        <View style={styles.modalBackdropBottom}>
          <View style={styles.detailModal}>
            <View style={styles.invoiceModalHeader}>
              <View style={styles.invoiceModalHeading}>
                <View style={styles.invoiceModalIcon}>
                  <Ionicons name="receipt-outline" size={19} color={palette.primary} />
                </View>
                <View>
                  <Text style={styles.invoiceModalTitle}>Chi tiết hóa đơn</Text>
                  <Text style={styles.invoiceModalSubtitle}>Kiểm tra trước khi gửi cư dân</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.invoiceCloseButton} onPress={() => setSelectedInvoice(null)}>
                <Ionicons name="close" size={22} color="#334155" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.detailBody}
              contentContainerStyle={styles.detailBodyContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedInvoice && (
                <>
                  <View style={styles.invoicePaper}>
                    <View style={styles.paperHeader}>
                      <View style={styles.paperTitleWrap}>
                        <Text style={styles.paperKicker}>HÓA ĐƠN THANH TOÁN</Text>
                        <Text style={styles.paperTitle}>
                          Tháng {String(selectedInvoice.month).padStart(2, '0')}/{selectedInvoice.year}
                        </Text>
                      </View>
                      <View style={[styles.paperStatus, { backgroundColor: selectedInvoiceStatusColor.bgColor }]}>
                        <Text style={[styles.paperStatusText, { color: selectedInvoiceStatusColor.color }]}>
                          {selectedInvoiceStatus}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.paperInfoGrid}>
                      <View style={styles.paperInfoCell}>
                        <Text style={styles.paperInfoLabel}>Phòng</Text>
                        <Text style={styles.paperInfoValue}>{selectedInvoice.roomNumber || `#${selectedInvoice.roomId || selectedInvoice.id}`}</Text>
                      </View>
                      <View style={styles.paperInfoCell}>
                        <Text style={styles.paperInfoLabel}>Cư dân</Text>
                        <Text style={styles.paperInfoValue} numberOfLines={1}>{selectedInvoice.residentName || 'Chưa cập nhật'}</Text>
                      </View>
                      <View style={styles.paperInfoCell}>
                        <Text style={styles.paperInfoLabel}>Hạn thanh toán</Text>
                        <Text style={styles.paperInfoValue}>{formatDate(selectedInvoice.dueDate)}</Text>
                      </View>
                    </View>

                    <View style={styles.paperTotalPreview}>
                      <Text style={styles.paperTotalLabel}>Tổng cộng</Text>
                      <Text style={styles.paperTotalValue}>{invoiceService.formatCurrency(selectedInvoice.totalAmount || 0)}</Text>
                    </View>
                  </View>

                  <View style={styles.invoiceSectionHeading}>
                    <Text style={styles.invoiceSectionTitle}>Chi tiết khoản thu</Text>
                    <Text style={styles.invoiceSectionSubtitle}>Các khoản đã được tính trong hóa đơn</Text>
                  </View>

                  <View style={styles.invoiceItemsTable}>
                    <View style={styles.invoiceTableHeader}>
                      <Text style={[styles.invoiceTableHeaderText, { flex: 1 }]}>Khoản thu</Text>
                      <Text style={styles.invoiceTableHeaderText}>Thành tiền</Text>
                    </View>
                    {selectedInvoice.lineItems?.length ? selectedInvoice.lineItems.map((item, index) => {
                      const unitFallback: Record<string, string> = {
                        Dien: 'kWh',
                        Nuoc: 'm³',
                        TienPhong: 'tháng',
                        DichVu: 'tháng',
                      };
                      const displayUnit = item.unit || unitFallback[item.itemType] || '';
                      const label = item.description || item.serviceName || invoiceService.getLineItemTypeLabel(item.itemType);
                      return (
                        <View key={item.id || `${item.itemType}-${index}`} style={styles.invoiceItemRow}>
                          <View style={styles.invoiceItemContent}>
                            <Text style={styles.invoiceItemTitle}>{label}</Text>
                            {item.quantity != null && item.unitPrice != null ? (
                              <Text style={styles.invoiceItemMeta}>
                                {item.quantity} {displayUnit} × {invoiceService.formatCurrency(item.unitPrice)}
                              </Text>
                            ) : null}
                          </View>
                          <Text style={styles.invoiceItemAmount}>{invoiceService.formatCurrency(item.subtotal || 0)}</Text>
                        </View>
                      );
                    }) : (
                      <Text style={styles.invoiceEmptyItems}>Chưa có chi tiết khoản thu</Text>
                    )}
                  </View>

                  <View style={styles.invoiceGrandTotal}>
                    <Text style={styles.invoiceGrandTotalLabel}>Tổng thanh toán</Text>
                    <Text style={styles.invoiceGrandTotalValue}>{invoiceService.formatCurrency(selectedInvoice.totalAmount || 0)}</Text>
                  </View>
                </>
              )}
            </ScrollView>
            {selectedInvoice && (
              <View style={styles.actionBar}>
                {isDraft(selectedInvoice) ? (
                  <TouchableOpacity style={styles.primaryFullButton} onPress={() => handleApproveOne(selectedInvoice)} disabled={approving}>
                    {approving ? (
                      <ActivityIndicator color={palette.surface} />
                    ) : (
                      <>
                        <Ionicons name="send-outline" size={17} color={palette.surface} />
                        <Text style={styles.primaryFullText}>Gửi hóa đơn cho cư dân</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.primaryFullButton} onPress={() => handleReminder(selectedInvoice)}>
                    <Ionicons name="notifications-outline" size={17} color={palette.surface} />
                    <Text style={styles.primaryFullText}>Gửi nhắc thanh toán</Text>
                  </TouchableOpacity>
                )}
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
  header: { paddingHorizontal: 10, paddingTop: 5, paddingBottom: 5 },
  title: { color: palette.text, fontSize: 18, fontWeight: '900' },
  subtitle: { color: palette.textMuted, fontSize: 10, marginTop: 2 },
  monthRow: { marginHorizontal: 12, marginBottom: 7, backgroundColor: palette.surface, borderRadius: radius.lg, padding: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.borderSoft },
  monthButton: { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: palette.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  monthText: { minWidth: 104, textAlign: 'center', color: palette.text, fontSize: 12, fontWeight: '800' },
  actionRow: { flexDirection: 'row', paddingHorizontal: 10, gap: 6, marginTop: 5 },
  calculateButton: { flex: 1, height: 38, borderRadius: radius.lg, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  calculateButtonText: { color: palette.surface, fontWeight: '900' },
  approveButton: { flex: 1, height: 38, borderRadius: radius.lg, backgroundColor: palette.success, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  approveButtonText: { color: palette.surface, fontWeight: '900' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 10, gap: 5, marginTop: 5, marginBottom: 5 },
  statCard: { flex: 1, backgroundColor: palette.surface, borderRadius: radius.lg, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: palette.borderSoft },
  statValue: { color: palette.text, fontSize: 11, fontWeight: '900' },
  statLabel: { color: palette.textMuted, fontSize: 9, fontWeight: '700', marginTop: 1 },
  tabs: { marginHorizontal: 12, flexDirection: 'row', backgroundColor: palette.surfaceSoft, borderRadius: radius.lg, padding: 3, marginBottom: 7 },
  tab: { flex: 1, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: palette.surface },
  tabText: { color: palette.textMuted, fontSize: 13, fontWeight: '800' },
  tabTextActive: { color: palette.primary },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: palette.textMuted, marginTop: 12 },
  listContent: { padding: 10, paddingBottom: 84 },
  card: { backgroundColor: palette.surface, borderRadius: radius.xl, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: palette.borderSoft, shadowColor: palette.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  roomBadge: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardTitleWrap: { flex: 1 },
  roomText: { color: palette.text, fontSize: 12, fontWeight: '900' },
  metaText: { color: palette.textMuted, fontSize: 10, marginTop: 2 },
  statusChip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  statusText: { fontSize: 12, fontWeight: '800' },
  amountRow: { marginTop: 7, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { color: palette.textMuted, fontSize: 13, fontWeight: '700' },
  amount: { color: palette.text, fontSize: 13, fontWeight: '900' },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: palette.text, fontSize: 14, fontWeight: '800', marginTop: 8 },
  emptyText: { color: palette.textMuted, fontSize: 14, marginTop: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', justifyContent: 'center', padding: 12 },
  modalBackdropBottom: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', justifyContent: 'flex-end' },
  resultModal: { backgroundColor: palette.surface, borderRadius: radius.lg, overflow: 'hidden', maxHeight: '86%' },
  detailModal: { height: '90%', backgroundColor: palette.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, overflow: 'hidden' },
  modalHeader: { padding: 12, borderBottomWidth: 1, borderBottomColor: palette.borderSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  modalTitle: { color: palette.text, fontSize: 16, fontWeight: '900' },
  modalMeta: { color: palette.textMuted, fontSize: 13, marginTop: 4 },
  resultBody: { padding: 12 },
  resultSuccess: { color: palette.text, fontSize: 16, lineHeight: 22, fontWeight: '900', marginBottom: 6 },
  resultLine: { color: '#334155', fontSize: 15, lineHeight: 24, fontWeight: '700' },
  resultAmount: { color: palette.primary, fontSize: 15, fontWeight: '900', marginTop: 6 },
  resultTable: { marginTop: 12, borderWidth: 1, borderColor: palette.borderSoft, borderRadius: radius.lg, overflow: 'hidden' },
  resultTableHeader: { minHeight: 34, backgroundColor: palette.surfaceSoft, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  resultTableRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: palette.borderSoft },
  resultCell: { color: '#334155', fontSize: 12, fontWeight: '800' },
  resultRoomCell: { flex: 1.1 },
  resultAmountCell: { flex: 1.1, textAlign: 'right' },
  resultActionCell: { width: 42, textAlign: 'center' },
  viewInvoiceButton: { width: 42, height: 32, alignItems: 'center', justifyContent: 'center' },
  resultSendButton: { marginTop: 12, height: 40, borderRadius: radius.lg, backgroundColor: palette.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  resultSendText: { color: palette.surface, fontSize: 13, fontWeight: '900' },
  resultNote: { color: '#92400e', backgroundColor: '#FEF3C7', borderRadius: radius.lg, padding: 10, marginTop: 12, lineHeight: 19 },
  resultError: { color: palette.danger, backgroundColor: palette.dangerSoft, borderRadius: radius.lg, padding: 10, marginTop: 12, lineHeight: 19 },
  invoiceModalHeader: { minHeight: 62, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: palette.surface, borderBottomWidth: 1, borderBottomColor: palette.borderSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  invoiceModalHeading: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  invoiceModalIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  invoiceModalTitle: { color: palette.text, fontSize: 16, fontWeight: '900' },
  invoiceModalSubtitle: { color: palette.textMuted, fontSize: 11, marginTop: 2 },
  invoiceCloseButton: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: palette.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  detailBody: { flex: 1 },
  detailBodyContent: { padding: 14, paddingBottom: 24 },
  invoicePaper: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: palette.border, shadowColor: palette.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 3 },
  paperHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  paperTitleWrap: { flex: 1 },
  paperKicker: { color: palette.primary, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  paperTitle: { color: palette.text, fontSize: 18, fontWeight: '900', marginTop: 2 },
  paperStatus: { borderRadius: radius.sm, paddingHorizontal: 9, paddingVertical: 5 },
  paperStatusText: { fontSize: 11, fontWeight: '900' },
  paperInfoGrid: { flexDirection: 'row', gap: 8, paddingTop: 11, borderTopWidth: 1, borderTopColor: palette.borderSoft },
  paperInfoCell: { flex: 1 },
  paperInfoLabel: { color: palette.textMuted, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  paperInfoValue: { color: palette.text, fontSize: 12, fontWeight: '800', marginTop: 4 },
  paperTotalPreview: { marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: palette.borderSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  paperTotalLabel: { color: palette.textMuted, fontSize: 12, fontWeight: '800' },
  paperTotalValue: { color: palette.primary, fontSize: 18, fontWeight: '900' },
  invoiceSectionHeading: { marginTop: 18, marginBottom: 10 },
  invoiceSectionTitle: { color: palette.text, fontSize: 16, fontWeight: '900' },
  invoiceSectionSubtitle: { color: palette.textMuted, fontSize: 11, marginTop: 2 },
  invoiceItemsTable: { backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' },
  invoiceTableHeader: { minHeight: 36, paddingHorizontal: 12, backgroundColor: palette.surfaceSoft, borderBottomWidth: 1, borderBottomColor: palette.borderSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  invoiceTableHeaderText: { color: palette.textMuted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 },
  invoiceItemRow: { minHeight: 58, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottomWidth: 1, borderBottomColor: palette.borderSoft },
  invoiceItemContent: { flex: 1 },
  invoiceItemTitle: { color: palette.text, fontSize: 13, fontWeight: '800' },
  invoiceItemMeta: { color: palette.textMuted, fontSize: 11, marginTop: 3 },
  invoiceItemAmount: { color: palette.primaryDark, fontSize: 13, fontWeight: '900', textAlign: 'right' },
  invoiceEmptyItems: { color: palette.textMuted, fontSize: 13, textAlign: 'center', padding: 22 },
  invoiceGrandTotal: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: radius.md, backgroundColor: palette.primarySoft, borderWidth: 1, borderColor: '#A7E1FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  invoiceGrandTotalLabel: { color: palette.primaryDark, fontSize: 14, fontWeight: '900' },
  invoiceGrandTotalValue: { color: palette.primary, fontSize: 17, fontWeight: '900' },
  actionBar: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.borderSoft },
  primaryFullButton: { height: 44, borderRadius: radius.lg, backgroundColor: palette.primary, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  primaryFullText: { color: palette.surface, fontSize: 12, fontWeight: '900' },
});
