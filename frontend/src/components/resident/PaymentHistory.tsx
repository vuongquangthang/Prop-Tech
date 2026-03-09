import { useNavigate } from 'react-router';
import { ArrowLeft, Download } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { paymentService, ResidentPayment } from '../../services/api.service';
import { useSignalRRefresh } from '../../lib/useSignalRRefresh';

export function PaymentHistory() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<ResidentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await paymentService.getMyPayments();
      setPayments(data);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useSignalRRefresh(['PaymentSuccess', 'PaymentFailed'], loadData);

  // Calculate total paid this year
  const currentYear = new Date().getFullYear();
  const totalThisYear = payments
    .filter(p => p.paidAt && new Date(p.paidAt).getFullYear() === currentYear)
    .reduce((sum, p) => sum + p.amount, 0);

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
            Tổng đã thanh toán năm {currentYear}
          </p>
          <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand-primary)' }}>
            {totalThisYear > 0 ? `${totalThisYear.toLocaleString('vi-VN')}đ` : loading ? '...' : '0đ'}
          </p>
        </div>

        {/* Payment List */}
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>Đang tải...</p>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => {
              const paidDate = payment.paidAt
                ? new Date(payment.paidAt).toLocaleDateString('vi-VN')
                : new Date(payment.createdAt).toLocaleDateString('vi-VN');
              const ref = payment.invoiceReference
                ? `Tháng ${payment.invoiceReference}`
                : paidDate;
              return (
                <div key={payment.id} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {ref}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Thanh toán: {paidDate}
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
                      Đã thanh toán
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
                        {payment.paymentType}
                      </p>
                    </div>

                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Download size={18} color="var(--brand-primary)" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}