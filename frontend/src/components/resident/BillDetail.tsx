import { useNavigate } from 'react-router';
import { ArrowLeft, Download } from 'lucide-react';

const mockBill = {
  id: 'bill-demo-1',
  apartment: 'A-1205',
  period: 'Tháng 02/2026',
  dueDate: '28/02/2026',
  status: 'pending' as const,
  items: [
    { name: 'Tiền thuê phòng', price: 4500000, total: 4500000 },
    { name: 'Điện', quantity: 120, unit: 'kWh', price: 3500, total: 420000 },
    { name: 'Nước', quantity: 8, unit: 'm³', price: 15000, total: 120000 },
    { name: 'Phí quản lý', price: 200000, total: 200000 },
    { name: 'Internet', price: 180000, total: 180000 },
  ],
};

export function BillDetail() {
  const navigate = useNavigate();

  const currentBill = mockBill;
  const total = currentBill.items.reduce((sum, item) => sum + item.total, 0);

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
                {currentBill.period}
              </p>
            </div>
            <div className="text-right">
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Căn hộ
              </p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {currentBill.apartment}
              </p>
            </div>
          </div>

          {/* Bill Items */}
          <div className="space-y-3">
            {currentBill.items.map((item, index) => (
              <div key={index} className="flex items-start justify-between">
                <div className="flex-1">
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.name}
                  </p>
                  {item.unit && (
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
          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <p style={{ fontSize: '12px', color: '#E67E22', textAlign: 'center' }}>
              <strong>Hạn thanh toán:</strong> {currentBill.dueDate}
            </p>
          </div>
        </div>

        {/* Actions */}
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

        {/* Payment Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p style={{ fontSize: '12px', color: 'var(--brand-primary)' }}>
            💡 <strong>Lưu ý:</strong> Vui lòng thanh toán đúng hạn để tránh phát sinh phí chậm thanh toán.
          </p>
        </div>
      </div>
    </div>
  );
}