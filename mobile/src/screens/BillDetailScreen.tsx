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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import invoiceService, { Invoice } from '../services/invoice.service';
import paymentService from '../services/payment.service';

type RootStackParamList = {
  BillDetail: { id: number };
};

type BillDetailScreenRouteProp = RouteProp<RootStackParamList, 'BillDetail'>;

export default function BillDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<BillDetailScreenRouteProp>();
  const invoiceId = route.params?.id;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentSection, setShowPaymentSection] = useState(false);

  const loadInvoice = async () => {
    if (!invoiceId) {
      setError('Không tìm thấy thông tin hóa đơn');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await invoiceService.getById(invoiceId);
      setInvoice(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin hóa đơn');
      console.error('Load invoice error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!invoice || invoice.status === 'Đã thanh toán') return;
    try {
      setIsPaymentProcessing(true);
      const response = await paymentService.initiatePayment({
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        paymentMethod: 'QR',
      });
      const url = response.checkoutUrl || response.paymentUrl;
      if (url) {
        await Linking.openURL(url);
        setShowPaymentSection(true);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể khởi tạo thanh toán');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết hóa đơn</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1A4B84" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : error || !invoice ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
            <Text style={styles.errorText}>{error || 'Không tìm thấy hóa đơn'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadInvoice}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.invoiceTitle}>
              Hóa đơn {invoiceService.formatPeriod(invoice.month, invoice.year)}
            </Text>
            <Text style={[styles.deadline, invoice.status === 'Đã thanh toán' && styles.paidStatus]}>
              {invoice.status === 'Đã thanh toán'
                ? `Đã thanh toán: ${invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString('vi-VN') : ''}`
                : `Hạn thanh toán: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('vi-VN') : ''}`}
            </Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Chi tiết hóa đơn</Text>
            <View style={styles.detailsList}>
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
                      <Text style={styles.detailLabel}>{label}</Text>
                      <View style={styles.detailBottom}>
                        {item.quantity != null && item.unitPrice != null ? (
                          <Text style={styles.detailMeta}>
                            {item.quantity} {displayUnit} × {invoiceService.formatCurrency(item.unitPrice)}
                          </Text>
                        ) : (
                          <View />
                        )}
                        <Text style={styles.detailValue}>
                          {invoiceService.formatCurrency(item.subtotal)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.noItemsText}>Chưa có chi tiết</Text>
              )}
            </View>

            <View style={styles.totalDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>
                {invoiceService.formatCurrency(invoice.totalAmount)}
              </Text>
            </View>

        {/* PayOS Payment Section - shown after opening checkout URL */}
        {showPaymentSection && invoice.status !== 'Đã thanh toán' && (
          <View style={styles.qrSection}>
            <Ionicons name="time-outline" size={48} color="#1A4B84" />
            <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 12 }]}>
              Đang chờ xác nhận thanh toán
            </Text>
            <Text style={{ color: '#6B7280', textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
              Trang thanh toán PayOS đã được mở trong trình duyệt.{"\n"}
              Hoàn thành thanh toán, hóa đơn sẽ tự động cập nhật.
            </Text>
            <TouchableOpacity
              style={styles.confirmPayButton}
              onPress={async () => { await loadInvoice(); }}
            >
              <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
              <Text style={styles.confirmPayText}>Kiểm tra lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelPayButton}
              onPress={() => setShowPaymentSection(false)}
            >
              <Text style={styles.cancelPayText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        )}
            <View style={styles.actions}>
              {invoice.status === 'Đã thanh toán' ? (
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#059669" />
                  <Text style={styles.paidBadgeText}>Đã thanh toán</Text>
                </View>
              ) : !showPaymentSection ? (
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
    backgroundColor: '#FFFFFF',
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
  invoiceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  deadline: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
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
    marginBottom: 16,
  },
  detailsList: {
    gap: 12,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'column',
    gap: 4,
  },
  detailBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flexShrink: 1,
  },
  detailMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    flexShrink: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A4B84',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A4B84',
  },
  qrSection: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginBottom: 32,
  },
  qrCode: {
    marginBottom: 24,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  qrPlaceholder: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
  },
  bankInfo: {
    width: '100%',
    gap: 8,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bankLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  bankValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
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
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1A4B84',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paidStatus: {
    color: '#059669',
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
  paidBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    paddingVertical: 14,
  },
  paidBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  confirmPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginTop: 20,
    backgroundColor: '#059669',
    borderRadius: 12,
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
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  qrActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  openGatewayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#E8F0FB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A4B84',
  },
  openGatewayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A4B84',
  },
});
