import { useNavigate } from 'react-router';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { invoiceService, HoaDonDetail } from '../../services/api.service';
import { useSignalRRefresh } from '../../lib/useSignalRRefresh';

const ITEM_LABEL: Record<string, string> = {
  TienPhong: 'Tiền thuê phòng',
  Dien: 'Tiền điện',
  Nuoc: 'Tiền nước',
  DichVu: 'Phí dịch vụ',
  PhatSinh: 'Phát sinh',
  KhauTru: 'Khấu trừ',
};

function isPendingStatus(s: string) {
  const lower = (s ?? '').toLowerCase();
  return lower.includes('chưa') || lower === 'pending' ||
         lower.includes('quá') || lower === 'overdue';
}

export function BillDetail() {
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<HoaDonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const invoices = await invoiceService.getMy();
      const unpaid = invoices.filter(i => isPendingStatus(i.status));
      setInvoice(unpaid[0] ?? invoices[0] ?? null);
    } catch {
      // keep null
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useSignalRRefresh(['PaymentSuccess', 'PaymentFailed', 'InvoiceUpdated'], loadData);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#F9FAFB' }}>
        <p style={{ color: '#6B7280', fontSize: 14 }}>Đang tải...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#F9FAFB' }}>
        <div style={{
          backgroundColor: '#FFF', borderBottom: '1px solid #F3F4F6',
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
        }}>
          <button onClick={() => navigate('/resident')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <ChevronLeft size={22} color="#111827" />
          </button>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Chi tiết hóa đơn</p>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 48 }}>📄</span>
          <p style={{ fontSize: 14, color: '#9CA3AF' }}>Không có hóa đơn nào</p>
        </div>
      </div>
    );
  }

  const period = `Tháng ${String(invoice.month ?? '?').padStart(2, '0')}/${invoice.year}`;
  const dueDateStr = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('vi-VN')
    : null;
  const isPending = isPendingStatus(invoice.status);

  const items = (invoice.lineItems ?? []).map(li => ({
    name: li.serviceName ?? ITEM_LABEL[li.itemType] ?? li.itemType,
    quantity: li.quantity,
    unit: li.unit,
    price: li.unitPrice,
    total: li.subtotal,
  }));

  const total = invoice.totalAmount;

  // QR content: VietQR-style string
  const qrContent = `MB|QTHANG315|${total}|PROPTECH ${period.replace('Tháng ', 'T')}`;

  const handleConfirm = async () => {
    setConfirming(true);
    // Simulate confirmation – replace with real API when available
    await new Promise(r => setTimeout(r, 1200));
    setConfirmed(true);
    setConfirming(false);
    setTimeout(() => navigate('/resident'), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#FFF', borderBottom: '1px solid #F3F4F6',
        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/resident')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          <ChevronLeft size={22} color="#111827" />
        </button>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0, flex: 1 }}>
          Chi tiết hóa đơn
        </p>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Invoice header */}
        <div style={{ textAlign: 'center', padding: '4px 0 8px' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
            Hóa đơn {period}
          </p>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            {isPending && dueDateStr
              ? `Hạn thanh toán: ${dueDateStr}`
              : invoice.paidDate
                ? `Đã thanh toán: ${new Date(invoice.paidDate).toLocaleDateString('vi-VN')}`
                : 'Đã thanh toán'}
          </p>
        </div>

        {/* Line items */}
        <div style={{
          backgroundColor: '#FFF', borderRadius: 16,
          border: '1px solid #E5E7EB', padding: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Chi tiết hóa đơn
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, paddingRight: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{item.name}</p>
                  {item.unit && item.quantity != null && item.price != null && (
                    <p style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                      {item.quantity} {item.unit} × {item.price.toLocaleString('vi-VN')}đ
                    </p>
                  )}
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>
                  {item.total.toLocaleString('vi-VN')}đ
                </p>
              </div>
            ))}
            {items.length === 0 && (
              <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>Không có chi tiết</p>
            )}
          </div>

          {/* Total */}
          <div style={{ borderTop: '2px solid #E5E7EB', marginTop: 16, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#2563EB', margin: 0 }}>Tổng cộng</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#2563EB', margin: 0 }}>
              {total.toLocaleString('vi-VN')}đ
            </p>
          </div>
        </div>

        {/* QR Payment Section */}
        {showQR && isPending && !confirmed && (
          <div style={{
            backgroundColor: '#FFF', borderRadius: 16,
            border: '2px dashed #93C5FD', padding: 16,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Quét QR để thanh toán</p>
            <QRCodeSVG value={qrContent} size={148} />
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Ngân hàng', 'MB Bank'],
                ['Số tài khoản', 'QTHANG315'],
                ['Chủ tài khoản', 'VUONG QUANG THANG'],
                ['Số tiền', total.toLocaleString('vi-VN') + 'đ'],
                ['Nội dung CK', `PROPTECH ${period.replace('Tháng ', 'T')}`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{label}</p>
                  <p style={{
                    fontSize: 13, fontWeight: 600,
                    color: label === 'Số tiền' ? '#2563EB' : '#111827',
                    margin: 0,
                  }}>{value}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleConfirm}
              disabled={confirming}
              style={{
                width: '100%', padding: '11px 0',
                backgroundColor: confirming ? '#6EE7B7' : '#059669',
                border: 'none', borderRadius: 12, cursor: 'pointer',
                fontSize: 14, fontWeight: 700, color: '#FFF',
                marginTop: 4,
              }}
            >
              {confirming ? 'Đang xác nhận...' : 'Xác nhận đã thanh toán'}
            </button>
            <button
              onClick={() => setShowQR(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B7280' }}
            >
              Hủy
            </button>
          </div>
        )}

        {/* Payment confirmed feedback */}
        {confirmed && (
          <div style={{
            backgroundColor: '#F0FDF4', borderRadius: 16,
            border: '1px solid #86EFAC', padding: 16,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <CheckCircle size={36} color="#059669" />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#059669', margin: 0 }}>Đã xác nhận thanh toán!</p>
          </div>
        )}

        {/* Actions */}
        {isPending && !showQR && !confirmed && (
          <button
            onClick={() => setShowQR(true)}
            style={{
              width: '100%', padding: '13px 0',
              backgroundColor: '#1E3A8A', border: 'none', borderRadius: 12,
              cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#FFF',
            }}
          >
            Thanh toán ngay
          </button>
        )}

        {!isPending && !confirmed && (
          <div style={{
            backgroundColor: '#F0FDF4', borderRadius: 16,
            border: '1px solid #86EFAC', padding: 14,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <CheckCircle size={22} color="#059669" />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#059669', margin: 0 }}>Đã thanh toán</p>
          </div>
        )}
      </div>
    </div>
  );
}
