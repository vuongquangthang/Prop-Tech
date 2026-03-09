import { useNavigate } from 'react-router';
import { ArrowLeft, Download } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { invoiceService, HoaDonDetail } from '../../services/api.service';
import { useSignalRRefresh } from '../../lib/useSignalRRefresh';

export function BillDetail() {
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<HoaDonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const invoices = await invoiceService.getMy();
      // Show the most recent unpaid invoice, or latest if all paid
      const unpaid = invoices.filter(i =>
        i.status === 'Chưa thanh toán' || i.status === 'Đã thanh toán một phần',
      );
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
      <div className="bg-gray-50 flex items-center justify-center min-h-screen">
        <p style={{ color: 'var(--text-secondary)' }}>Đang tải...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3">
          <button onClick={() => navigate('/resident')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} color="var(--text-primary)" />
          </button>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Chi tiết hóa đơn</h2>
        </div>
        <div className="p-4">
          <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Không có hóa đơn nào</p>
          </div>
        </div>
      </div>
    );
  }

  const period = `Tháng ${String(invoice.month).padStart(2, '0')}/${invoice.year}`;
  const dueDateStr = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('vi-VN')
    : '—';
  const isPending = invoice.status === 'Chưa thanh toán' || invoice.status === 'Đã thanh toán một phần';

  // Map itemType to Vietnamese labels
  const itemTypeLabel: Record<string, string> = {
    TienPhong: 'Tiền thuê phòng',
    Dien: 'Điện',
    Nuoc: 'Nước',
    DichVu: 'Phí dịch vụ',
    PhatSinh: 'Phát sinh',
    KhauTru: 'Khấu trừ',
  };

  const items = (invoice.lineItems ?? []).map(li => ({
    name: li.serviceName ?? itemTypeLabel[li.itemType] ?? li.itemType,
    quantity: li.quantity,
    unit: li.unit,
    price: li.unitPrice,
    total: li.subtotal,
  }));

  const total = invoice.totalAmount;

  return (
    <div className="bg-gray-50">
      {/* Sub Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3">
        <button onClick={() => navigate('/resident')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} color="var(--text-primary)" />
        </button>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Chi tiết hóa đơn
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Bill Info Card */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Kỳ thanh toán
              </p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {period}
              </p>
            </div>
            <div className="text-right">
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Phòng
              </p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {invoice.roomNumber ?? '—'}
              </p>
            </div>
          </div>

          {/* Bill Items */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex items-start justify-between">
                <div className="flex-1">
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.name}
                  </p>
                  {item.unit && item.quantity != null && item.price != null && (
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {item.quantity} {item.unit} × {item.price.toLocaleString('vi-VN')}đ
                    </p>
                  )}
                </div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.total.toLocaleString('vi-VN')}đ
                </p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-3 border-t-2 border-gray-300 flex items-center justify-between">
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Tổng cộng
            </p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand-primary)' }}>
              {total.toLocaleString('vi-VN')}đ
            </p>
          </div>

          {/* Due Date */}
          {isPending && (
            <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <p style={{ fontSize: '12px', color: '#E67E22', textAlign: 'center' }}>
                <strong>Hạn thanh toán:</strong> {dueDateStr}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {isPending && (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/resident/payment-qr')}
              className="w-full py-3 rounded-xl text-center shadow-md hover:shadow-lg transition-shadow"
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: '#FFF',
                fontSize: '15px',
                fontWeight: 700,
              }}
            >
              Thanh toán ngay
            </button>

            <button
              className="w-full py-3 rounded-xl text-center border-2 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
              style={{
                borderColor: 'var(--brand-primary)',
                color: 'var(--brand-primary)',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              <Download size={18} />
              <span>Tải hóa đơn PDF</span>
            </button>
          </div>
        )}

        {/* Payment Note */}
        {isPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p style={{ fontSize: '12px', color: 'var(--brand-primary)' }}>
              💡 <strong>Lưu ý:</strong> Vui lòng thanh toán đúng hạn để tránh phát sinh phí chậm thanh toán.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}