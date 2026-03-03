import { CheckCircle, AlertCircle, Link2, Filter, X } from 'lucide-react';
import { useState } from 'react';

const transactionsData = [
  { 
    id: 1,
    bankCode: 'VCB-20260205-001', 
    time: '05/02/2026 14:30', 
    amount: '12.350.000', 
    content: 'INV-2026-001 A-101', 
    invoice: 'INV-2026-001',
    status: 'matched'
  },
  { 
    id: 2,
    bankCode: 'VCB-20260205-002', 
    time: '05/02/2026 15:45', 
    amount: '13.200.000', 
    content: 'INV-2026-002 B-205', 
    invoice: 'INV-2026-002',
    status: 'matched'
  },
  { 
    id: 3,
    bankCode: 'VCB-20260205-003', 
    time: '05/02/2026 16:20', 
    amount: '14.500.000', 
    content: 'Tran Thi B tien phong', 
    invoice: '-',
    status: 'unmatched'
  },
  { 
    id: 4,
    bankCode: 'VCB-20260205-004', 
    time: '05/02/2026 17:10', 
    amount: '12.000.000', 
    content: 'INV-2026-005 A-203', 
    invoice: 'INV-2026-005',
    status: 'matched'
  },
  { 
    id: 5,
    bankCode: 'VCB-20260204-089', 
    time: '04/02/2026 10:15', 
    amount: '10.000.000', 
    content: 'Chuyen tien', 
    invoice: '-',
    status: 'unmatched'
  },
  { 
    id: 6,
    bankCode: 'VCB-20260204-090', 
    time: '04/02/2026 11:30', 
    amount: '13.800.000', 
    content: 'INV-2026-006 B-115', 
    invoice: 'INV-2026-006',
    status: 'matched'
  },
];

export function TransactionTable() {
  const [transactions, setTransactions] = useState(transactionsData);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [invoiceCode, setInvoiceCode] = useState('');

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

  return (
    <div className="space-y-4">
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
          Tổng tiền: <span className="text-lg text-gray-900">76.050.000 VNĐ</span>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-lg text-gray-800">Lịch sử giao dịch - {transactionsData.length} giao dịch</h2>
        </div>
        
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
              {transactions.map((transaction, index) => (
                <tr key={index} className={`border-b border-gray-200 hover:bg-gray-50 ${transaction.status === 'matched' ? 'bg-green-50' : ''}`}>
                  <td className="px-6 py-4 text-sm text-gray-800">{transaction.bankCode}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{transaction.time}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right">{transaction.amount}</td>
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