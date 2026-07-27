import React, { useState, useEffect, useCallback } from 'react';
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
  Clipboard,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import invoiceService, { Invoice } from '../services/invoice.service';
import paymentService, { InitiatePaymentResponse } from '../services/payment.service';
import signalRService from '../services/signalr.service';
import { contractService } from '../services/contract.service';
import { useAuthStore } from '../store/authStore';
import { canResidentManageFinancialActions } from '../utils/residentPermissions';
import { palette, radius } from '../theme/palette';

type RootStackParamList = {
  BillDetail: { id: number };
};

type BillDetailScreenRouteProp = RouteProp<RootStackParamList, 'BillDetail'>;

export default function BillDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<BillDetailScreenRouteProp>();
  const invoiceId = route.params?.id;
  const currentUser = useAuthStore(state => state.user);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<InitiatePaymentResponse | null>(null);
  const [canPayInvoice, setCanPayInvoice] = useState(false);
  const paymentPermissionMessage = 'Chỉ chủ hộ/người thuê chính được thanh toán hóa đơn. Thành viên cần được chủ hộ hoặc chủ nhà xử lý.';

  const loadInvoice = useCallback(async () => {
    if (!invoiceId) {
      setError('Không tìm thấy thông tin hóa đơn');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setCanPayInvoice(false);
      const data = await invoiceService.getById(invoiceId);
      setInvoice(data);
      try {
        const contract = await contractService.getById(data.contractId);
        setCanPayInvoice(canResidentManageFinancialActions(contract, currentUser?.residentId));
      } catch {
        setCanPayInvoice(false);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin hóa đơn');
      console.error('Load invoice error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId, currentUser?.residentId]);

  const handlePayment = async () => {
    if (!invoice || invoice.status === 'Đã thanh toán') return;
    if (!canPayInvoice) {
      Alert.alert('Không có quyền thanh toán', paymentPermissionMessage);
      return;
    }

    try {
      setIsPaymentProcessing(true);
      const response = await paymentService.initiatePayment({
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        paymentMethod: 'QR',
      });
      console.log('[PayOS] initiate response:', JSON.stringify(response, null, 2));
      setPaymentInfo(response);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể khởi tạo thanh toán');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  /**
   * PayOS trả về raw EMV QR string (000201...), không phải URL.
   * Dùng qrserver.com để render thành ảnh.
   */
  const buildQrImageUri = (qrData: string): string => {
    if (!qrData) return '';
    if (qrData.startsWith('http')) return qrData;
    if (qrData.startsWith('data:')) return qrData;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Đã sao chép', `${label} đã được sao chép`);
  };

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  // Auto-refresh when PayOS webhook fires PaymentSuccess via SignalR
  useEffect(() => {
    const unsub = signalRService.onPaymentUpdate((payment) => {
      if (payment.invoiceId === invoiceId && payment.type === 'SUCCESS') {
        loadInvoice();
        setPaymentInfo(null);
      }
    });
    return unsub;
  }, [invoiceId, loadInvoice]);

  // Re-fetch when user returns to screen (e.g., after pressing Home then back)
  useFocusEffect(
    useCallback(() => {
      if (paymentInfo) {
        loadInvoice();
      }
    }, [paymentInfo, loadInvoice])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết hóa đơn</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : error || !invoice ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={palette.danger} />
            <Text style={styles.errorText}>{error || 'Không tìm thấy hóa đơn'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadInvoice}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.invoicePaper}>
              <View style={styles.paperHeader}>
                <View>
                  <Text style={styles.paperKicker}>HÓA ĐƠN THANH TOÁN</Text>
                  <Text style={styles.invoiceTitle}>
                    Tháng {String(invoice.month).padStart(2, '0')}/{invoice.year}
                  </Text>
                </View>
                <View style={[
                  styles.statusChip,
                  invoice.status === 'Đã thanh toán' ? styles.statusChipPaid : styles.statusChipPending,
                ]}>
                  <Text style={[
                    styles.statusChipText,
                    invoice.status === 'Đã thanh toán' ? styles.statusChipTextPaid : styles.statusChipTextPending,
                  ]}>
                    {invoice.status === 'Đã thanh toán' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                  </Text>
                </View>
              </View>

              <View style={styles.paperInfoGrid}>
                <View style={styles.paperInfoCell}>
                  <Text style={styles.paperInfoLabel}>Phòng</Text>
                  <Text style={styles.paperInfoValue}>{invoice.roomNumber || `#${invoice.roomId}`}</Text>
                </View>
                <View style={styles.paperInfoCell}>
                  <Text style={styles.paperInfoLabel}>
                    {invoice.status === 'Đã thanh toán' ? 'Ngày thanh toán' : 'Hạn thanh toán'}
                  </Text>
                  <Text style={styles.paperInfoValue}>
                    {invoice.status === 'Đã thanh toán'
                      ? (invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString('vi-VN') : 'Đã ghi nhận')
                      : (invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('vi-VN') : 'Chưa có')}
                  </Text>
                </View>
              </View>

              <View style={styles.paperTotalPreview}>
                <Text style={styles.paperTotalLabel}>Tổng cộng</Text>
                <Text style={styles.paperTotalValue}>{invoiceService.formatCurrency(invoice.totalAmount)}</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Chi tiết khoản thu</Text>
              <Text style={styles.sectionSubtitle}>Các khoản đã được chốt theo hóa đơn</Text>
            </View>
            <View style={styles.detailsList}>
              <View style={styles.invoiceTableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Khoản thu</Text>
                <Text style={styles.tableHeaderText}>Thành tiền</Text>
              </View>
              {invoice.lineItems && invoice.lineItems.length > 0 ? (
                invoice.lineItems.map((item, index) => {
                  const unitFallback: Record<string, string> = {
                    Dien: 'kWh',
                    Nuoc: 'm³',
                    TienPhong: 'tháng',
                    DichVu: 'tháng',
                  };
                  const displayUnit = item.unit || unitFallback[item.itemType] || '';
                  const label =
                    item.description ||
                    item.serviceName ||
                    invoiceService.getLineItemTypeLabel(item.itemType);
                  return (
                    <View key={index} style={styles.detailRow}>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>{label}</Text>
                        {item.quantity != null && item.unitPrice != null ? (
                          <Text style={styles.detailMeta}>
                            {item.quantity} {displayUnit} × {invoiceService.formatCurrency(item.unitPrice)}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.detailValue}>
                        {invoiceService.formatCurrency(item.subtotal)}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.noItemsText}>Chưa có chi tiết</Text>
              )}
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{invoiceService.formatCurrency(invoice.totalAmount)}</Text>
            </View>

        {/* Inline QR payment panel - shown after initiating payment */}
        {paymentInfo && invoice.status !== 'Đã thanh toán' && (() => {
          const qrUri = buildQrImageUri(paymentInfo.qrCodeUrl);
          return (
            <View style={styles.qrSection}>
              <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>

              {/* Bank logo + name header */}
              {(paymentInfo.bankLogoUrl || paymentInfo.bankName) ? (
                <View style={styles.bankHeader}>
                  {paymentInfo.bankLogoUrl ? (
                    <Image
                      source={{ uri: paymentInfo.bankLogoUrl }}
                      style={styles.bankLogo}
                      resizeMode="contain"
                    />
                  ) : null}
                  {paymentInfo.bankName ? (
                    <Text style={styles.bankName}>{paymentInfo.bankName}</Text>
                  ) : null}
                </View>
              ) : null}

              {/* QR code image */}
              {qrUri ? (
                <View style={styles.qrCode}>
                  <Image
                    source={{ uri: qrUri }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <Text style={styles.qrPlaceholder}>Đang tải mã QR…</Text>
              )}

              {/* Bank transfer details */}
              <View style={styles.bankInfo}>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Số tiền</Text>
                  <Text style={[styles.bankValue, { color: palette.primary }]}>
                    {invoiceService.formatCurrency(paymentInfo.amount)}
                  </Text>
                </View>
                {paymentInfo.bankAccountNumber ? (
                  <TouchableOpacity
                    style={styles.bankRow}
                    onPress={() => copyToClipboard(paymentInfo.bankAccountNumber, 'Số tài khoản')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.bankLabel}>Số tài khoản</Text>
                    <View style={styles.bankValueRow}>
                      <Text style={styles.bankValue}>{paymentInfo.bankAccountNumber}</Text>
                      <Ionicons name="copy-outline" size={14} color="#6B7280" style={{ marginLeft: 4 }} />
                    </View>
                  </TouchableOpacity>
                ) : null}
                {paymentInfo.bankAccountName ? (
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Chủ tài khoản</Text>
                    <Text style={styles.bankValue}>{paymentInfo.bankAccountName}</Text>
                  </View>
                ) : null}
                {paymentInfo.transferDescription ? (
                  <TouchableOpacity
                    style={styles.bankRow}
                    onPress={() => copyToClipboard(paymentInfo.transferDescription, 'Nội dung chuyển khoản')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.bankLabel}>Nội dung CK</Text>
                    <View style={styles.bankValueRow}>
                      <Text numberOfLines={1} style={[styles.bankValue, { maxWidth: '60%' }]}>
                        {paymentInfo.transferDescription}
                      </Text>
                      <Ionicons name="copy-outline" size={14} color="#6B7280" style={{ marginLeft: 4 }} />
                    </View>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Action buttons */}
              <View style={styles.qrActions}>
                <TouchableOpacity
                  style={styles.qrActionButton}
                  onPress={async () => { await loadInvoice(); }}
                >
                  <Ionicons name="refresh-outline" size={18} color={palette.text} />
                  <Text style={styles.qrActionText}>Kiểm tra</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.qrActionButton}
                  onPress={() => setPaymentInfo(null)}
                >
                  <Ionicons name="close-outline" size={18} color={palette.text} />
                  <Text style={styles.qrActionText}>Đóng</Text>
                </TouchableOpacity>
              </View>

              {/* Fallback: open PayOS in browser */}
              {(paymentInfo.checkoutUrl || paymentInfo.paymentUrl) ? (
                <TouchableOpacity
                  style={styles.openGatewayButton}
                  onPress={() => Linking.openURL(paymentService.getGatewayUrl((paymentInfo.checkoutUrl || paymentInfo.paymentUrl)!))}
                >
                  <Ionicons name="open-outline" size={16} color={palette.primary} />
                  <Text style={styles.openGatewayText}>Mở trang thanh toán</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })()}
            <View style={styles.actions}>
              {invoice.status === 'Đã thanh toán' ? (
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={24} color={palette.success} />
                  <Text style={styles.paidBadgeText}>Đã thanh toán</Text>
                </View>
              ) : !paymentInfo && canPayInvoice ? (
                <TouchableOpacity 
                  style={[styles.primaryButton, isPaymentProcessing && styles.buttonDisabled]} 
                  onPress={handlePayment}
                  disabled={isPaymentProcessing}
                >
                  {isPaymentProcessing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Thanh toán ngay</Text>
                  )}
                </TouchableOpacity>
              ) : !paymentInfo ? (
                <View style={styles.permissionNotice}>
                  <Ionicons name="lock-closed-outline" size={18} color="#92400E" />
                  <Text style={styles.permissionNoticeText}>{paymentPermissionMessage}</Text>
                </View>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
    backgroundColor: palette.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.text,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 20,
    paddingBottom: 34,
  },
  invoicePaper: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 3,
  },
  paperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paperKicker: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.primary,
    letterSpacing: 0.8,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  statusChipPaid: {
    backgroundColor: palette.successSoft,
  },
  statusChipPending: {
    backgroundColor: palette.accentSoft,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusChipTextPaid: {
    color: palette.success,
  },
  statusChipTextPending: {
    color: palette.accent,
  },
  invoiceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.text,
    marginTop: 2,
  },
  paperInfoGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: palette.borderSoft,
  },
  paperInfoCell: {
    flex: 1,
  },
  paperInfoLabel: {
    fontSize: 10,
    color: palette.textMuted,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  paperInfoValue: {
    fontSize: 13,
    color: palette.text,
    fontWeight: '800',
    marginTop: 4,
  },
  paperTotalPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: palette.borderSoft,
  },
  paperTotalLabel: {
    fontSize: 12,
    color: palette.textMuted,
    fontWeight: '800',
  },
  paperTotalValue: {
    fontSize: 18,
    color: palette.primary,
    fontWeight: '900',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: 3,
  },
  detailsList: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  invoiceTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceSoft,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: palette.surface,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  detailContent: {
    flex: 1,
  },
  detailBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: palette.text,
    fontWeight: '700',
    flexShrink: 1,
    marginBottom: 3,
  },
  detailMeta: {
    fontSize: 12,
    color: palette.textMuted,
    flexShrink: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.primaryDark,
    textAlign: 'right',
    minWidth: 104,
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#A7E1FF',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.primaryDark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: palette.primary,
  },
  qrSection: {
    borderWidth: 1,
    borderColor: '#A7E1FF',
    borderRadius: radius.xl,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F7FCFF',
    marginBottom: 24,
    gap: 12,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 4,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.text,
    textAlign: 'center',
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    width: '100%',
    justifyContent: 'center',
  },
  bankLogo: {
    width: 80,
    height: 32,
  },
  bankName: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.text,
  },
  qrCode: {
    marginVertical: 4,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: radius.md,
  },
  qrPlaceholder: {
    marginTop: 8,
    fontSize: 12,
    color: palette.textMuted,
  },
  bankInfo: {
    width: '100%',
    gap: 8,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  bankValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankLabel: {
    fontSize: 14,
    color: palette.textMuted,
  },
  bankValue: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: palette.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primary,
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
    color: palette.textMuted,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: palette.danger,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: palette.primary,
    borderRadius: radius.md,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paidStatus: {
    color: palette.success,
    fontWeight: '600',
  },
  noItemsText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  permissionNotice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  permissionNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#92400E',
  },
  paidBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: palette.successSoft,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  paidBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.success,
  },
  confirmPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginTop: 20,
    backgroundColor: palette.success,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  confirmPayText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelPayButton: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 10,
  },
  cancelPayText: {
    fontSize: 14,
    color: palette.textMuted,
    fontWeight: '500',
  },
  statusPending: {
    color: '#D97706',
    fontWeight: '600',
  },
  qrActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  qrActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  qrActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.text,
  },
  openGatewayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: palette.primarySoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  openGatewayText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.primary,
  },
});
