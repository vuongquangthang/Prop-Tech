import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Download, Check } from 'lucide-react';
import { Home, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export function PaymentQR() {
  const navigate = useNavigate();
  const { bills, updateBillStatus } = useData();
  const [downloaded, setDownloaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get current pending bill
  const currentBill = bills.find(b => b.status === 'pending') || bills[0];

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handlePaymentSimulation = () => {
    // Simulate payment success
    setShowSuccess(true);
    
    // Update bill status after 2 seconds
    setTimeout(() => {
      updateBillStatus(currentBill.id, 'paid');
      
      // Navigate back to home after payment
      setTimeout(() => {
        navigate('/resident');
      }, 1500);
    }, 2000);
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
            {/* QR Code Card */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 text-center">
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Quét mã QR để thanh toán
              </p>

              {/* QR Code Image */}
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-xl border-4 border-gray-800 shadow-lg">
                  {/* QR Code SVG - Smaller for mobile */}
                  <svg width="200" height="200" viewBox="0 0 280 280" fill="none">
                    <rect width="280" height="280" fill="white"/>
                    {/* QR Pattern - Simplified */}
                    <rect x="20" y="20" width="60" height="60" fill="black"/>
                    <rect x="30" y="30" width="40" height="40" fill="white"/>
                    <rect x="40" y="40" width="20" height="20" fill="black"/>
                    
                    <rect x="200" y="20" width="60" height="60" fill="black"/>
                    <rect x="210" y="30" width="40" height="40" fill="white"/>
                    <rect x="220" y="40" width="20" height="20" fill="black"/>
                    
                    <rect x="20" y="200" width="60" height="60" fill="black"/>
                    <rect x="30" y="210" width="40" height="40" fill="white"/>
                    <rect x="40" y="220" width="20" height="20" fill="black"/>

                    {/* Random QR blocks */}
                    <rect x="100" y="30" width="20" height="20" fill="black"/>
                    <rect x="140" y="30" width="20" height="20" fill="black"/>
                    <rect x="160" y="50" width="20" height="20" fill="black"/>
                    <rect x="100" y="70" width="20" height="20" fill="black"/>
                    <rect x="120" y="90" width="20" height="20" fill="black"/>
                    <rect x="180" y="100" width="20" height="20" fill="black"/>
                    <rect x="220" y="120" width="20" height="20" fill="black"/>
                    <rect x="100" y="140" width="20" height="20" fill="black"/>
                    <rect x="160" y="160" width="20" height="20" fill="black"/>
                    <rect x="200" y="180" width="20" height="20" fill="black"/>
                    <rect x="120" y="200" width="20" height="20" fill="black"/>
                    <rect x="140" y="220" width="20" height="20" fill="black"/>
                    <rect x="180" y="240" width="20" height="20" fill="black"/>
                  </svg>
                </div>
              </div>

              {/* Amount */}
              <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Số tiền thanh toán
                </p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '2px' }}>
                  2.450.000đ
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
                    Vietcombank
                  </p>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Số tài khoản
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    1234567890
                  </p>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Chủ tài khoản
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Smart Building
                  </p>
                </div>

                <div className="flex items-start justify-between">
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Nội dung
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>
                    A1205 022026
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

            {/* Simulate Payment Button - For Demo */}
            <button
              onClick={handlePaymentSimulation}
              className="w-full py-3 rounded-xl text-center shadow-md hover:shadow-lg transition-shadow"
              style={{
                backgroundColor: '#1E7E34',
                color: '#FFF',
                fontSize: '15px',
                fontWeight: 700,
              }}
              disabled={showSuccess}
            >
              {showSuccess ? '✓ Đã thanh toán thành công!' : '🎯 Mô phỏng thanh toán (Demo)'}
            </button>

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
          </div>
        </div>
      </div>
    </div>
  );
}