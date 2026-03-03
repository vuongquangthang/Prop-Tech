import { useNavigate } from 'react-router';
import { ArrowLeft, Download } from 'lucide-react';

export function PaymentHistory() {
  const navigate = useNavigate();

  const payments = [
    {
      month: 'Tháng 01/2026',
      date: '20/01/2026',
      amount: 2380000,
      status: 'paid',
      statusText: 'Đã thanh toán',
      method: 'Chuyển khoản',
    },
    {
      month: 'Tháng 12/2025',
      date: '18/12/2025',
      amount: 2420000,
      status: 'paid',
      statusText: 'Đã thanh toán',
      method: 'Chuyển khoản',
    },
    {
      month: 'Tháng 11/2025',
      date: '22/11/2025',
      amount: 2350000,
      status: 'paid',
      statusText: 'Đã thanh toán',
      method: 'Tiền mặt',
    },
    {
      month: 'Tháng 10/2025',
      date: '15/10/2025',
      amount: 2390000,
      status: 'paid',
      statusText: 'Đã thanh toán',
      method: 'Chuyển khoản',
    },
  ];

  return (
    <div className="bg-gray-50">
      {/* Sub Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3">
        <button onClick={() => navigate('/resident')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} color="var(--text-primary)" />
        </button>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Lịch sử thanh toán
        </h2>
      </div>

      <div className="p-4 space-y-3">
        {/* Summary Card */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Tổng đã thanh toán năm 2026
          </p>
          <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand-primary)' }}>
            2.380.000đ
          </p>
        </div>

        {/* Payment List */}
        <div className="space-y-3">
          {payments.map((payment, index) => (
            <div key={index} className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {payment.month}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Thanh toán: {payment.date}
                  </p>
                </div>
                <span
                  className="px-2 py-1 rounded-full"
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#1E7E34',
                    backgroundColor: '#E8F5E9',
                    border: '1px solid #1E7E34',
                  }}
                >
                  {payment.statusText}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Số tiền
                  </p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {payment.amount.toLocaleString('vi-VN')}đ
                  </p>
                </div>

                <div className="text-right">
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Phương thức
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {payment.method}
                  </p>
                </div>

                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Download size={18} color="var(--brand-primary)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}