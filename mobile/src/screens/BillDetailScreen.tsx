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
  Image,
  Share,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import invoiceService, { Invoice } from '../services/invoice.service';
import paymentService, { InitiatePaymentResponse } from '../services/payment.service';
import signalRService from '../services/signalr.service';

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
  const [paymentTransaction, setPaymentTransaction] = useState<InitiatePaymentResponse | null>(null);

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

    Alert.alert(
      'Xác nhận thanh toán',
      `Bạn muốn thanh toán hóa đơn ${invoiceService.formatPeriod(invoice.month, invoice.year)}?\nSố tiền: ${invoiceService.formatCurrency(invoice.totalAmount)}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Thanh toán',
          onPress: async () => {
            try {
              setIsPaymentProcessing(true);
              
              // Initiate payment transaction
              const response = await paymentService.initiatePayment({
                invoiceId: invoice.id,
                amount: invoice.totalAmount,
                paymentMethod: 'QR',
              });
              
              setPaymentTransaction(response);
              
              // Open payment gateway in browser
              const gatewayUrl = paymentService.getGatewayUrl(response.paymentUrl);
              const supported = await Linking.canOpenURL(gatewayUrl);
              
              if (supported) {
                await Linking.openURL(gatewayUrl);
                Alert.alert(
                  'Chờ xác nhận thanh toán',
                  'Vui lòng hoàn tất thanh toán trên trang cổng thanh toán.\n\nỨng dụng sẽ tự động cập nhật khi thanh toán thành công.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Lỗi', 'Không thể mở cổng thanh toán');
              }
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể khởi tạo thanh toán');
            } finally {
              setIsPaymentProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleDownloadQR = async () => {
    if (!paymentTransaction?.qrCodeUrl) {
      Alert.alert('Lỗi', 'Không tìm thấy mã QR');
      return;
    }

    try {
      await Share.share({
        message: `Thanh toán hóa đơn ${invoiceService.formatPeriod(invoice!.month, invoice!.year)}\nMã giao dịch: ${paymentTransaction.transactionCode}\nSố tiền: ${invoiceService.formatCurrency(paymentTransaction.amount)}`,
        url: paymentTransaction.qrCodeUrl,
        title: 'Mã QR thanh toán',
      });
    } catch (error: any) {
      console.error('Share QR error:', error);
      if (error.message !== 'User did not share') {
        Alert.alert('Lỗi', 'Không thể chia sẻ mã QR');
      }
    }
  };

  const handleOpenBankingApp = () => {
    const bankingApps = [
      { name: 'Vietcombank', scheme: 'vietcombank://' },
      { name: 'VietinBank', scheme: 'viettinbank://' },
      { name: 'BIDV', scheme: 'bidv://' },
      { name: 'Techcombank', scheme: 'tcb://' },
      { name: 'ACB', scheme: 'acb://' },
      { name: 'MBBank', scheme: 'mbbank://' },
      { name: 'TPBank', scheme: 'tpbank://' },
      { name: 'Agribank', scheme: 'agribank://' },
      { name: 'VPBank', scheme: 'vpbank://' },
      { name: 'Sacombank', scheme: 'sacombank://' },
      { name: 'SHB', scheme: 'shb://' },
      { name: 'MoMo', scheme: 'momo://' },
      { name: 'ZaloPay', scheme: 'zalopay://' },
      { name: 'VNPay', scheme: 'vnpay://' },
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...bankingApps.map(app => app.name), 'Hủy'],
          cancelButtonIndex: bankingApps.length,
          title: 'Chọn ứng dụng ngân hàng',
        },
        async (buttonIndex) => {
          if (buttonIndex < bankingApps.length) {
            const selectedApp = bankingApps[buttonIndex];
            try {
              const canOpen = await Linking.canOpenURL(selectedApp.scheme);
              if (canOpen) {
                await Linking.openURL(selectedApp.scheme);
              } else {
                Alert.alert(
                  'Không thể mở ứng dụng',
                  `Vui lòng cài đặt ứng dụng ${selectedApp.name} hoặc sử dụng cách thanh toán khác.`
                );
              }
            } catch (error) {
              Alert.alert('Lỗi', `Không thể mở ứng dụng ${selectedApp.name}`);
            }
          }
        }
      );
    } else {
      // Android: Show alert with buttons
      Alert.alert(
        'Chọn ứng dụng ngân hàng',
        'Chọn ứng dụng bạn muốn sử dụng để thanh toán',
        [
          ...bankingApps.slice(0, 6).map(app => ({
            text: app.name,
            onPress: async () => {
              try {
                const canOpen = await Linking.canOpenURL(app.scheme);
                if (canOpen) {
                  await Linking.openURL(app.scheme);
                } else {
                  Alert.alert(
                    'Không thể mở ứng dụng',
                    `Vui lòng cài đặt ứng dụng ${app.name} hoặc sử dụng cách thanh toán khác.`
                  );
                }
              } catch (error) {
                Alert.alert('Lỗi', `Không thể mở ứng dụng ${app.name}`);
              }
            },
          })),
          { text: 'Xem thêm', onPress: () => {
            // Show remaining apps
            Alert.alert(
              'Ứng dụng khác',
              'Chọn ứng dụng bạn muốn sử dụng',
              [
                ...bankingApps.slice(6).map(app => ({
                  text: app.name,
                  onPress: async () => {
                    try {
                      const canOpen = await Linking.canOpenURL(app.scheme);
                      if (canOpen) {
                        await Linking.openURL(app.scheme);
                      } else {
                        Alert.alert(
                          'Không thể mở ứng dụng',
                          `Vui lòng cài đặt ứng dụng ${app.name} hoặc sử dụng cách thanh toán khác.`
                        );
                      }
                    } catch (error) {
                      Alert.alert('Lỗi', `Không thể mở ứng dụng ${app.name}`);
                    }
                  },
                })),
                { text: 'Hủy', style: 'cancel' },
              ]
            );
          }},
          { text: 'Hủy', style: 'cancel' },
        ]
      );
    }
  };

  useEffect(() => {
    loadInvoice();

    // Subscribe to payment updates
    const unsubscribe = signalRService.onPaymentUpdate((payment) => {
      console.log('📱 Payment update received:', payment);
      
      // Only handle updates for this invoice
      if (payment.invoiceId !== invoiceId) return;

      if (payment.type === 'SUCCESS') {
        Alert.alert(
          '✅ Thanh toán thành công',
          `Hóa đơn đã được thanh toán.\nSố tiền: ${payment.amount?.toLocaleString()} VNĐ`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reload invoice to get updated status
                loadInvoice();
                // Clear payment transaction
                setPaymentTransaction(null);
              },
            },
          ]
        );
      } else if (payment.type === 'FAILED') {
        Alert.alert(
          '❌ Thanh toán thất bại',
          'Giao dịch không thành công. Vui lòng thử lại.',
          [
            {
              text: 'Thử lại',
              onPress: () => {
                setPaymentTransaction(null);
                handlePayment();
              },
            },
            { text: 'Đóng', style: 'cancel' },
          ]
        );
      }
    });

    return () => {
      unsubscribe();
    };
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

        {/* QR Code Section - Show when payment initiated */}
        {paymentTransaction && invoice.status !== 'Đã thanh toán' && (
          <View style={styles.qrSection}>
            <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
            {paymentTransaction.qrCodeUrl ? (
              <View style={styles.qrCode}>
                <Image
                  source={{ uri: paymentTransaction.qrCodeUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={styles.qrCode}>
                <Ionicons name="qr-code-outline" size={120} color="#1F2937" />
                <Text style={styles.qrPlaceholder}>QR Code</Text>
              </View>
            )}
            <View style={styles.bankInfo}>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Mã giao dịch</Text>
                <Text style={styles.bankValue}>{paymentTransaction.transactionCode}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Số tiền</Text>
                <Text style={styles.bankValue}>
                  {invoiceService.formatCurrency(paymentTransaction.amount)}
                </Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Trạng thái</Text>
                <Text style={[styles.bankValue, styles.statusPending]}>
                  ⏱️ {paymentTransaction.status}
                </Text>
              </View>
            </View>
            <View style={styles.qrActions}>
              <TouchableOpacity
                style={styles.qrActionButton}
                onPress={handleDownloadQR}
              >
                <Ionicons name="download-outline" size={20} color="#059669" />
                <Text style={styles.qrActionText}>Tải ảnh QR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.qrActionButton}
                onPress={handleOpenBankingApp}
              >
                <Ionicons name="wallet-outline" size={20} color="#7C3AED" />
                <Text style={styles.qrActionText}>Mở app ngân hàng</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.openGatewayButton}
              onPress={() => {
                const gatewayUrl = paymentService.getGatewayUrl(paymentTransaction.paymentUrl);
                Linking.openURL(gatewayUrl);
              }}
            >
              <Ionicons name="open-outline" size={20} color="#2563EB" />
              <Text style={styles.openGatewayText}>Mở cổng thanh toán giả lập</Text>
            </TouchableOpacity>
          </View>
        )}

            <View style={styles.actions}>
              {invoice.status !== 'Đã thanh toán' ? (
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
              ) : (
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#059669" />
                  <Text style={styles.paidBadgeText}>Đã thanh toán</Text>
                </View>
              )}
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
