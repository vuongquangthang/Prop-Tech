import { CheckCircle, AlertCircle, Link2, Filter, X, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSignalRRefresh } from '../../lib/useSignalRRefresh';
import { searchIncludes } from '../../lib/search';
import { paymentService } from '../../services/api.service';
import { FilterSelect } from '../ui/FilterSelect';
import { DateTextInput } from '../ui/DateTextInput';

interface TransactionData {
  id: number;
  bankCode: string;
  time: string;
  paidAt: string;
  amount: number;
  content: string;
  invoice: string;
  status: 'matched' | 'unmatched';
  invoiceId?: number;
  paymentMethod?: string;
}

const formatInvoiceCode = (invoiceId?: number) =>
  invoiceId ? `INV-${String(invoiceId).padStart(3, '0')}` : '-';

const parseInvoiceCode = (value: string) => {
  const normalized = value.trim();
  const match = normalized.match(/^(?:INV-|#)?(\d+)$/i);
  if (!match) return null;
  const invoiceId = Number(match[1]);
  return Number.isInteger(invoiceId) && invoiceId > 0 ? invoiceId : null;
};

export function TransactionTable() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [invoiceCode, setInvoiceCode] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

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
          bankCode: payment.transactionCode || `GD-${payment.id}`,
          time,
          paidAt: payment.paidAt || '',
          amount: payment.amount || 0,
          content: (payment.transferDescription && String(payment.transferDescription).trim())
            ? payment.transferDescription
            : [
                payment.paymentType || 'Thanh toán',
                payment.roomNumber ? `Phòng ${payment.roomNumber}` : null,
                payment.invoiceReference ? `HĐ ${payment.invoiceReference}` : null,
              ].filter(Boolean).join(' - '),
          invoice: formatInvoiceCode(payment.invoiceId),
          status: payment.status === 'SUCCESS' ? 'matched' : 'unmatched',
          invoiceId: payment.invoiceId,
          paymentMethod: payment.paymentType || 'Tiền mặt',
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

  useEffect(() => {
    fetchTransactions();
  }, []);
  useSignalRRefresh(['PaymentSuccess', 'PaymentFailed', 'PaymentInitiated'], fetchTransactions);

  const handleMatchClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setInvoiceCode(formatInvoiceCode(transaction.invoiceId) === '-' ? '' : formatInvoiceCode(transaction.invoiceId));
    setMatchError(null);
    setShowMatchModal(true);
  };

  const handleConfirmMatch = async () => {
    if (!selectedTransaction) return;

    const invoiceId = parseInvoiceCode(invoiceCode);
    if (!invoiceId) {
      setMatchError('Mã hóa đơn không hợp lệ. Ví dụ đúng: INV-003');
      return;
    }

    try {
      setMatchLoading(true);
      setMatchError(null);
      await paymentService.manualMatch(selectedTransaction.id, invoiceId);
      await fetchTransactions();
      setShowMatchModal(false);
      setSelectedTransaction(null);
      setInvoiceCode('');
    } catch (err: any) {
      setMatchError(err.message || 'Không thể gạch nợ giao dịch');
    } finally {
      setMatchLoading(false);
    }
  };

  const methodOptions = Array.from(new Set(transactions.map(t => t.paymentMethod || 'Khác')));

  const filteredTransactions = transactions.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;

    if (methodFilter !== 'all' && (t.paymentMethod || 'Khác') !== methodFilter) return false;

    if (fromDate || toDate) {
      const paidDate = t.paidAt ? new Date(t.paidAt) : null;
      if (!paidDate || Number.isNaN(paidDate.getTime())) return false;

      if (fromDate) {
        const from = new Date(`${fromDate}T00:00:00`);
        if (paidDate < from) return false;
      }
      if (toDate) {
        const to = new Date(`${toDate}T23:59:59`);
        if (paidDate > to) return false;
      }
    }

    if (searchText.trim()) {
      const haystack = `${t.bankCode} ${t.content} ${t.invoice} ${t.paymentMethod || ''}`;
      if (!searchIncludes(haystack, searchText)) return false;
    }

    return true;
  });

  // Calculate total amount on filtered result
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

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
      {/* Filter Bar */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          
          <FilterSelect
            className="px-2 py-1.5 text-xs bg-white focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'matched' | 'unmatched')}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="matched">Đã khớp dữ liệu</option>
            <option value="unmatched">Chưa khớp</option>
          </FilterSelect>

          <FilterSelect
            className="px-2 py-1.5 text-xs bg-white focus:outline-none"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="all">Tất cả phương thức</option>
            {methodOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </FilterSelect>

          <input
            type="text"
            placeholder="Tìm mã GD / nội dung..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500 w-52"
          />
          
          <DateTextInput
            value={fromDate}
            onChange={setFromDate}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
          />
          
          <span className="text-xs text-gray-600">→</span>
          
          <DateTextInput
            value={toDate}
            onChange={setToDate}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
          />

          <button
            onClick={() => {
              setStatusFilter('all');
              setMethodFilter('all');
              setSearchText('');
              setFromDate('');
              setToDate('');
            }}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50"
          >
            Xóa lọc
          </button>
        </div>
        
        <div className="text-xs text-gray-700 whitespace-nowrap pt-1">
          Tổng tiền: <span className="text-base text-gray-900">{totalAmount.toLocaleString('vi-VN')} VNĐ</span>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="table-section-title">Lịch sử giao dịch - {filteredTransactions.length} giao dịch</h2>
        </div>
        
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <FileText size={48} className="text-gray-300" />
            <p className="text-gray-500">Không có giao dịch phù hợp bộ lọc</p>
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
              {filteredTransactions.map((transaction) => (
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
                      <button className="transaction-manual-match-button" onClick={() => handleMatchClick(transaction)}>
                        <span className="transaction-manual-match-inner">
                          <Link2 size={14} />
                          <span>Gạch nợ thủ công</span>
                        </span>
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
      
      {/* Match Modal */}
      {showMatchModal && selectedTransaction && (
        <div className="admin-content-modal-overlay">
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
                    <span className="text-gray-800 font-bold text-lg">{selectedTransaction.amount.toLocaleString('vi-VN')} VNĐ</span>
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
                  placeholder="Nhập mã hóa đơn, ví dụ: INV-003"
                  value={invoiceCode}
                  onChange={(e) => {
                    setInvoiceCode(e.target.value);
                    setMatchError(null);
                  }}
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
                  💡 Nhập đúng mã đang hiển thị trong module <strong>Quản lý Hóa đơn</strong>.
                </p>
                {matchError && (
                  <p className="mt-2 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {matchError}
                  </p>
                )}
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
                disabled={!invoiceCode.trim() || matchLoading}
                style={{
                  height: 'var(--space-button-height)',
                  padding: '0 24px',
                  fontSize: 'var(--type-body)',
                  color: 'white',
                  backgroundColor: invoiceCode.trim() && !matchLoading ? 'var(--brand-primary)' : '#9ca3af',
                  border: 'none',
                  borderRadius: 'var(--radius-button)',
                  cursor: invoiceCode.trim() && !matchLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (invoiceCode.trim() && !matchLoading) {
                    e.currentTarget.style.backgroundColor = '#153a6b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (invoiceCode.trim() && !matchLoading) {
                    e.currentTarget.style.backgroundColor = 'var(--brand-primary)';
                  }
                }}
              >
                {matchLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                <span>{matchLoading ? 'Đang xử lý...' : 'Xác nhận gạch nợ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
