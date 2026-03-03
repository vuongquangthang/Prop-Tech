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

  const handlePayment = () => {
    if (!invoice || invoice.status === 'Đã thanh toán') return;
    setShowPaymentSection(true);
  };

  const handleConfirmPayment = async () => {
    if (!invoice) return;
    try {
      setIsPaymentProcessing(true);
      // Create a PENDING transaction then immediately confirm it as SUCCESS
      const response = await paymentService.initiatePayment({
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        paymentMethod: 'QR',
      });
      await paymentService.confirmPayment(response.transactionCode);
      setShowPaymentSection(false);
      await loadInvoice();
      Alert.alert('✅ Thanh toán thành công', 'Hóa đơn đã được xác nhận thanh toán.');
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể xác nhận thanh toán');
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
            <ActivityIndicator size="large" color="#2563EB" />
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
                invoice.lineItems.map((item, index) => (
                  <View key={index} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{item.description}</Text>
                    <Text style={styles.detailValue}>
                      {invoiceService.formatCurrency(item.subtotal)}
                    </Text>
                  </View>
                ))
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

        {/* Mock Payment Section - Show when resident taps "Thanh toán ngay" */}
        {showPaymentSection && invoice.status !== 'Đã thanh toán' && (
          <View style={styles.qrSection}>
            <Text style={styles.sectionTitle}>Thông tin chuyển khoản</Text>
            <View style={styles.qrCode}>
              <Ionicons name="qr-code" size={160} color="#1F2937" />
            </View>
            <View style={styles.bankInfo}>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Ngân hàng</Text>
                <Text style={styles.bankValue}>MB Bank</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Số tài khoản</Text>
                <Text style={styles.bankValue}>QTHANG315</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Tên tài khoản</Text>
                <Text style={styles.bankValue}>VUONG QUANG THANG</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Số tiền</Text>
                <Text style={[styles.bankValue, { color: '#2563EB' }]}>
                  {invoiceService.formatCurrency(invoice.totalAmount)}
                </Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Nội dung CK</Text>
                <Text style={styles.bankValue}>
                  {`PROPTECH T${invoice.month.toString().padStart(2,'0')}/${invoice.year}`}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.confirmPayButton, isPaymentProcessing && styles.buttonDisabled]}
              onPress={handleConfirmPayment}
              disabled={isPaymentProcessing}
            >
              {isPaymentProcessing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.confirmPayText}>Xác nhận đã thanh toán</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelPayButton}
              onPress={() => setShowPaymentSection(false)}
              disabled={isPaymentProcessing}
            >
              <Text style={styles.cancelPayText}>Hủy</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
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
    color: '#2563EB',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
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
    backgroundColor: '#2563EB',
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
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  openGatewayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
});
