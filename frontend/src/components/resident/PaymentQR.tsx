import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Download, Check, Loader2 } from 'lucide-react';
import { Home, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/api-config';

export function PaymentQR() {
  const navigate = useNavigate();
  const { bills, updateBillStatus } = useData();
  const [downloaded, setDownloaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [transactionCode, setTransactionCode] = useState('');

  // Get current pending bill (DEMO - in production, get from route params)
  const currentBill = bills.find(b => b.status === 'pending') || bills[0];
  const total = currentBill.items.reduce((sum, item) => sum + item.total, 0);

  // Initialize payment transaction on mount
  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    setLoading(true);
    try {
      // DEMO: For now, generate demo payment data
      // In production, call: api.post(API_ENDPOINTS.PAYMENTS.INITIATE, {...})
      
      // Generate demo QR data
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`;
      const txnCode = `TXN-${Date.now()}`;
      
      // VietQR format: BankID|AccountNumber|Amount|Description|Template
      const qrContent = `970436|1234567890|${total}|${currentBill.apartment} ${new Date().getMonth() + 1}/${new Date().getFullYear()}|qr_only`;
      
      setPaymentData({
        qrContent,
        invoiceNumber,
        amount: total,
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
        accountName: 'BAN QUAN LY CHUNG CU ABC',
        content: `${currentBill.apartment} ${invoiceNumber}`,
      });
      setTransactionCode(txnCode);
    } catch (error) {
      console.error('Error initializing payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handlePaymentConfirmation = async () => {
    if (processing) return;
    
    setProcessing(true);
    try {
      // DEMO: Call payment callback API to mark as paid
      // In production: api.post(API_ENDPOINTS.PAYMENTS.CALLBACK, {...})
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      setShowSuccess(true);
      
      // Update bill status
      updateBillStatus(currentBill.id, 'paid');
      
      // Navigate back to home after success
      setTimeout(() => {
        navigate('/resident');
      }, 2000);
      
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Có lỗi xảy ra khi xác nhận thanh toán. Vui lòng thử lại!');
    } finally {
      setProcessing(false);
    }
  };

  const onClose = () => {
    navigate('/resident/bill-detail');
  };

  return (
    <div className="bg-gray-50">
      {/* Mobile Container */}
      <div 
        className="bg-white shadow-2xl relative"
        style={{ 
          width: '360px', 
          minHeight: '700px',
          borderRadius: '32px',
          border: '10px solid #1f2937',
          overflow: 'hidden',
        }}
      >
        {/* Status Bar */}
        <div 
          className="absolute top-0 left-0 right-0 bg-gray-900 z-50 flex items-center justify-between px-3"
          style={{ height: '24px' }}
        >
          <div className="flex items-center space-x-1">
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#FFF' }} />
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#FFF' }} />
          </div>
          <div className="flex items-center space-x-1">
            <span style={{ fontSize: '9px', color: '#FFF' }}>100%</span>
          </div>
        </div>

        {/* App Content */}
        <div className="bg-white" style={{ paddingTop: '24px' }}>
          {/* Header with Logo */}
          <div 
            className="bg-white border-b border-gray-200 px-3 py-3 flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              {/* Logo - Same as Web */}
              <div 
                className="flex items-center justify-center"
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  backgroundColor: '#FF5733',
                  borderRadius: '8px'
                }}
              >
                <Home size={20} style={{ color: 'white', strokeWidth: 2 }} />
              </div>
              <div>
                <h1 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  SmartHome Hub
                </h1>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} color="var(--text-secondary)" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {loading ? (
              <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                <Loader2 className="animate-spin mx-auto mb-3" size={32} color="var(--brand-primary)" />
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Đang tạo mã thanh toán...
                </p>
              </div>
            ) : paymentData ? (
              <>
                {/* QR Code Card */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 text-center">
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                    Quét mã QR để thanh toán
                  </p>

                  {/* QR Code Image */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-3 rounded-xl border-4 border-gray-800 shadow-lg">
                      <QRCodeSVG 
                        value={paymentData.qrContent}
                        size={200}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                  </div>

              {/* Amount */}
              <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Số tiền thanh toán
                </p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '2px' }}>
                  {paymentData.amount.toLocaleString('vi-VN')}đ
                </p>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="w-full py-3 rounded-xl text-center border-2 transition-all flex items-center justify-center space-x-2"
                style={{
                  borderColor: downloaded ? '#1E7E34' : 'var(--brand-primary)',
                  backgroundColor: downloaded ? '#E8F5E9' : '#FFF',
                  color: downloaded ? '#1E7E34' : 'var(--brand-primary)',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {downloaded ? (
                  <>
                    <Check size={18} />
                    <span>Đã lưu ảnh QR</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Lưu ảnh QR</span>
                  </>
                )}
              </button>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Thông tin chuyển khoản
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Ngân hàng
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {paymentData.bankName}
                  </p>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Số tài khoản
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {paymentData.accountNumber}
                  </p>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Chủ tài khoản
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {paymentData.accountName}
                  </p>
                </div>

                <div className="flex items-start justify-between">
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Nội dung
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>
                    {paymentData.content}
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#E67E22', marginBottom: '8px' }}>
                📱 Hướng dẫn thanh toán
              </p>
              <ol className="space-y-1" style={{ fontSize: '12px', color: '#E67E22', paddingLeft: '16px' }}>
                <li>Mở ứng dụng ngân hàng của bạn</li>
                <li>Chọn tính năng "Quét mã QR"</li>
                <li>Quét mã QR bên trên</li>
                <li>Kiểm tra thông tin và xác nhận</li>
              </ol>
            </div>

            {/* Payment Confirmation Button - Demo */}
            <button
              onClick={handlePaymentConfirmation}
              className="w-full py-3 rounded-xl text-center shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              style={{
                backgroundColor: showSuccess ? '#1E7E34' : '#FF5733',
                color: '#FFF',
                fontSize: '15px',
                fontWeight: 700,
                opacity: processing ? 0.7 : 1,
              }}
              disabled={showSuccess || processing}
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Đang xử lý...</span>
                </>
              ) : showSuccess ? (
                <>
                  <Check size={20} />
                  <span>Thanh toán thành công!</span>
                </>
              ) : (
                <>
                  <span>✓ Đã hoàn thành chuyển khoản</span>
                </>
              )}
            </button>

            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Nút này dành cho demo - Ấn sau khi bạn đã chuyển khoản thành công
            </p>

            {/* Support */}
            <div className="text-center">
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Gặp vấn đề khi thanh toán?
              </p>
              <button 
                className="mt-2"
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-primary)' }}
              >
                Liên hệ hỗ trợ
              </button>
            </div>
          </>
        ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}