import { CheckCircle, AlertCircle, Link2, Filter, X, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { paymentService } from '../../services/api.service';

interface TransactionData {
  id: number;
  bankCode: string;
  time: string;
  amount: number;
  content: string;
  invoice: string;
  status: 'matched' | 'unmatched';
  invoiceId?: number;
  paymentMethod?: string;
}

export function TransactionTable() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [invoiceCode, setInvoiceCode] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const payments = await paymentService.getAll();
      
      // Map payments to transaction format
      const transactionData: TransactionData[] = payments.map((payment: any) => {
        const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date();
        const time = paidAt.toLocaleString('vi-VN', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        return {
          id: payment.id || 0,
          bankCode: payment.transactionCode || `TXN-${payment.id}`,
          time,
          amount: payment.amount || 0,
          content: payment.notes || 'Thanh toán',
          invoice: payment.invoiceId ? `INV-${payment.invoiceId}` : '-',
          status: payment.invoiceId ? 'matched' : 'unmatched',
          invoiceId: payment.invoiceId,
          paymentMethod: payment.paymentMethod || payment.paymentType || 'Tiền mặt',
        };
      });
      
      setTransactions(transactionData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách giao dịch');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setInvoiceCode('');
    setShowMatchModal(true);
  };

  const handleConfirmMatch = () => {
    if (selectedTransaction && invoiceCode.trim()) {
      // Cập nhật giao dịch
      setTransactions(prev => 
        prev.map(t => 
          t.id === selectedTransaction.id 
            ? { ...t, invoice: invoiceCode, status: 'matched' }
            : t
        )
      );
      
      // Đóng modal
      setShowMatchModal(false);
      setSelectedTransaction(null);
      setInvoiceCode('');
    }
  };

  // Calculate total amount
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 size={48} className="animate-spin text-gray-400" />
        <span className="text-gray-600">Đang tải dữ liệu giao dịch...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="flex flex-col items-center space-y-4">
          <AlertTriangle size={48} className="text-red-500" />
          <p className="text-red-600 text-center">{error}</p>
          <button
            onClick={fetchTransactions}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Filter size={16} />}
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Filter size={16} className="text-gray-500" />
          
          <select className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
            <option>Tất cả trạng thái</option>
            <option>Đã khớp dữ liệu</option>
            <option>Chưa khớp</option>
          </select>
          
          <input 
            type="date"
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
          />
          
          <span className="text-sm text-gray-600">đến</span>
          
          <input 
            type="date"
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
          />
        </div>
        
        <div className="text-sm text-gray-700">
          Tổng tiền: <span className="text-lg text-gray-900">{totalAmount.toLocaleString('vi-VN')} VNĐ</span>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-lg text-gray-800">Lịch sử giao dịch - {transactions.length} giao dịch</h2>
        </div>
        
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <FileText size={48} className="text-gray-300" />
            <p className="text-gray-500">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Mã giao dịch NH</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Thời gian</th>
                <th className="px-6 py-3 text-right text-sm text-gray-600">Số tiền (VNĐ)</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Nội dung chuyển khoản</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Mã hóa đơn</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Trạng thái</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className={`border-b border-gray-200 hover:bg-gray-50 ${transaction.status === 'matched' ? 'bg-green-50' : ''}`}>
                  <td className="px-6 py-4 text-sm text-gray-800">{transaction.bankCode}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{transaction.time}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">{transaction.amount.toLocaleString('vi-VN')}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{transaction.content}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {transaction.invoice !== '-' ? (
                      <span className="text-blue-600">{transaction.invoice}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {transaction.status === 'matched' ? (
                      <span className="inline-flex items-center px-3 py-1 text-xs rounded border bg-green-100 text-green-800 border-green-300">
                        <CheckCircle size={14} className="mr-1" />
                        Đã khớp
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 text-xs rounded border bg-orange-100 text-orange-800 border-orange-300">
                        <AlertCircle size={14} className="mr-1" />
                        Chưa khớp
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {transaction.status === 'unmatched' && (
                      <button className="px-3 py-1 bg-white border border-gray-800 text-gray-800 text-xs rounded hover:bg-gray-800 hover:text-white transition-colors flex items-center space-x-1 mx-auto" onClick={() => handleMatchClick(transaction)}>
                        <Link2 size={14} />
                        <span>Gạch nợ thủ công</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
      
      {/* Info Box */}
      <div className="bg-green-50 border border-green-300 rounded p-4">
        <p className="text-sm text-green-800">
          <strong>✓ Checklist đối soát:</strong> Các giao dịch có nền màu xanh nhạt là đã được hệ thống tự động xử lý thành công. Các giao dịch chưa khớp cần Admin kiểm tra và gạch nợ thủ công.
        </p>
      </div>

      {/* Match Modal */}
      {showMatchModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center space-x-2">
                <Link2 size={20} className="text-gray-800" />
                <h3 className="text-lg text-gray-800">Gạch nợ thủ công</h3>
              </div>
              <button onClick={() => setShowMatchModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Warning Alert */}
              <div className="bg-orange-50 border border-orange-300 rounded p-4 flex items-start space-x-3">
                <AlertCircle size={24} className="text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-orange-800 font-bold mb-1">⚠️ Xác nhận gạch nợ thủ công</p>
                  <p className="text-sm text-orange-700">
                    Bạn có chắc chắn muốn gạch nợ thủ công cho giao dịch này không? 
                    Hành động này sẽ khớp giao dịch với hóa đơn và không thể hoàn tác.
                  </p>
                </div>
              </div>

              {/* Transaction Info */}
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-800 font-bold mb-3">Thông tin giao dịch:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã giao dịch NH:</span>
                    <span className="text-gray-800 font-bold">{selectedTransaction.bankCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thời gian:</span>
                    <span className="text-gray-800">{selectedTransaction.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số tiền:</span>
                    <span className="text-gray-800 font-bold text-lg">{selectedTransaction.amount} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nội dung CK:</span>
                    <span className="text-gray-800">{selectedTransaction.content}</span>
                  </div>
                </div>
              </div>

              {/* Invoice Input */}
              <div className="bg-white border border-gray-300 rounded p-4">
                <label 
                  htmlFor="invoiceCode" 
                  style={{ 
                    display: 'block', 
                    fontSize: 'var(--type-body)', 
                    color: 'var(--text-primary)', 
                    fontWeight: 700, 
                    marginBottom: '12px' 
                  }}
                >
                  Mã hóa đơn cần khớp: <span className="text-red-600">*</span>
                </label>
                <input
                  id="invoiceCode"
                  type="text"
                  placeholder="Nhập mã hóa đơn (vd: INV-2026-003)"
                  value={invoiceCode}
                  onChange={(e) => setInvoiceCode(e.target.value)}
                  style={{
                    width: '100%',
                    height: 'var(--space-input-height)',
                    padding: '0 16px',
                    fontSize: 'var(--type-body)',
                    border: '2px solid var(--border-default)',
                    borderRadius: 'var(--radius-button)',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--brand-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Kiểm tra kỹ mã hóa đơn trong module <strong>Quản lý Hóa đơn</strong> trước khi xác nhận
                </p>
              </div>
            </div>
            
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
              <button 
                onClick={() => setShowMatchModal(false)}
                style={{
                  height: 'var(--space-button-height)',
                  padding: '0 24px',
                  fontSize: 'var(--type-body)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'white',
                  border: '2px solid var(--border-default)',
                  borderRadius: 'var(--radius-button)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleConfirmMatch}
                disabled={!invoiceCode.trim()}
                style={{
                  height: 'var(--space-button-height)',
                  padding: '0 24px',
                  fontSize: 'var(--type-body)',
                  color: 'white',
                  backgroundColor: invoiceCode.trim() ? 'var(--brand-primary)' : '#9ca3af',
                  border: 'none',
                  borderRadius: 'var(--radius-button)',
                  cursor: invoiceCode.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (invoiceCode.trim()) {
                    e.currentTarget.style.backgroundColor = '#153a6b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (invoiceCode.trim()) {
                    e.currentTarget.style.backgroundColor = 'var(--brand-primary)';
                  }
                }}
              >
                <CheckCircle size={16} />
                <span>Xác nhận gạch nợ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}