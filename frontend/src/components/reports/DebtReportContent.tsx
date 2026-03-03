import { Send, Filter, Loader2, AlertTriangle, FileX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BatchSendReminderModal } from '../finance/DebtModals';
import { invoiceService } from '../../services/api.service';

interface DebtData {
  room: string;
  tenant: string;
  phone: string;
  amount: number;
  daysOverdue: number;
  reminderCount: number;
  category: string;
  building: string;
  members: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

const getRowColor = (daysOverdue: number) => {
  if (daysOverdue >= 30) return 'bg-red-50';
  if (daysOverdue >= 5) return 'bg-orange-50';
  return 'bg-yellow-50';
};

const getDaysOverdue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

const categorizeDebt = (daysOverdue: number): string => {
  if (daysOverdue < 5) return 'under5';
  if (daysOverdue <= 15) return 'mid';
  return 'hard';
};

export function DebtReportContent() {
  const [debtData, setDebtData] = useState<DebtData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [isBatchSendReminderModalOpen, setIsBatchSendReminderModalOpen] = useState(false);

  useEffect(() => {
    fetchDebtData();
  }, []);

  const fetchDebtData = async () => {
    try {
      setLoading(true);
      setError(null);
      const unpaidInvoices = await invoiceService.getUnpaid();
      
      const debts: DebtData[] = unpaidInvoices.map((invoice: any) => {
        const daysOverdue = getDaysOverdue(invoice.dueDate || invoice.ngayHetHan || '');
        const category = categorizeDebt(daysOverdue);
        
        // Extract building code from room number (e.g., "A-101" -> "A")
        const roomNumber = invoice.roomNumber || invoice.soPhong || '';
        const building = roomNumber.split('-')[0] || 'Unknown';
        
        return {
          room: roomNumber,
          tenant: invoice.tenantName || invoice.tenCuDan || 'N/A',
          phone: invoice.phoneNumber || invoice.soDienThoai || '',
          amount: invoice.totalAmount || invoice.tongTien || 0,
          daysOverdue,
          reminderCount: invoice.reminderCount || 0,
          category,
          building,
          members: 1, // TODO: Get actual member count from contract/residency
        };
      });
      
      setDebtData(debts);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu công nợ');
      console.error('Error fetching debt data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on selections
  const filteredData = debtData.filter(debt => {
    const categoryMatch = categoryFilter === 'all' || debt.category === categoryFilter;
    const buildingMatch = buildingFilter === 'all' || debt.building === buildingFilter;
    return categoryMatch && buildingMatch;
  });

  const categoryStats = {
    under5: { 
      label: 'Nợ dưới 5 ngày', 
      count: filteredData.filter(d => d.category === 'under5').length, 
      total: filteredData.filter(d => d.category === 'under5').reduce((sum, d) => sum + d.amount, 0), 
      color: 'bg-yellow-50 border-yellow-300' 
    },
    mid: { 
      label: 'Nợ 5-15 ngày', 
      count: filteredData.filter(d => d.category === 'mid').length, 
      total: filteredData.filter(d => d.category === 'mid').reduce((sum, d) => sum + d.amount, 0), 
      color: 'bg-orange-50 border-orange-300' 
    },
    hard: { 
      label: 'Nợ khó đòi (>30 ngày)', 
      count: filteredData.filter(d => d.category === 'hard').length, 
      total: filteredData.filter(d => d.category === 'hard').reduce((sum, d) => sum + d.amount, 0), 
      color: 'bg-red-50 border-red-300' 
    },
  };

  const totalDebt = filteredData.reduce((sum, d) => sum + d.amount, 0);

  // Convert to format expected by BatchSendReminderModal
  const debtsForModal = filteredData.map(debt => ({
    room: debt.room,
    tenant: debt.tenant,
    amount: formatCurrency(debt.amount),
    daysLate: debt.daysOverdue,
    reminderLevel: debt.reminderCount,
    members: debt.members
  }));

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 size={48} className="animate-spin text-gray-400" />
          <span className="text-gray-600">Đang tải dữ liệu công nợ...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <AlertTriangle size={48} className="text-red-500" />
          <p className="text-red-600 text-center">{error}</p>
          <button 
            onClick={fetchDebtData}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (debtData.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <FileX size={48} className="text-gray-300" />
          <p className="text-gray-500">Không có hóa đơn nợ nào</p>
          <p className="text-sm text-gray-400">Tất cả hóa đơn đã được thanh toán</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Filter size={16} className="text-gray-500" />
          
          <select 
            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
            style={{ fontSize: 'var(--type-caption)' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Tất cả mức độ</option>
            <option value="under5">Dưới 5 ngày</option>
            <option value="mid">5-15 ngày</option>
            <option value="hard">Trên 30 ngày</option>
          </select>
          
          <select 
            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
            style={{ fontSize: 'var(--type-caption)' }}
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
          >
            <option value="all">Tất cả tòa nhà</option>
            <option value="A">Tòa A</option>
            <option value="B">Tòa B</option>
            <option value="C">Tòa C</option>
            <option value="D">Tòa D</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsBatchSendReminderModalOpen(true)}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center space-x-2"
            style={{ fontSize: 'var(--type-caption)', height: 'var(--button-height)', borderRadius: 'var(--radius-button)' }}
          >
            <Send size={16} />
            <span>Gửi nhắc nợ hàng loạt</span>
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-gray-600 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Tổng công nợ</p>
          <p className="text-red-600" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{formatCurrency(totalDebt)}</p>
          <p className="text-gray-600 mt-1" style={{ fontSize: 'var(--type-caption)' }}>VNĐ</p>
        </div>
        <div className={`border-2 rounded p-4 ${categoryStats.under5.color}`}>
          <p className="text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>{categoryStats.under5.label}</p>
          <p className="text-gray-900" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>{categoryStats.under5.count} phòng</p>
          <p className="text-gray-700 mt-1" style={{ fontSize: 'var(--type-caption)' }}>{formatCurrency(categoryStats.under5.total)} VNĐ</p>
        </div>
        <div className={`border-2 rounded p-4 ${categoryStats.mid.color}`}>
          <p className="text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>{categoryStats.mid.label}</p>
          <p className="text-gray-900" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>{categoryStats.mid.count} phòng</p>
          <p className="text-gray-700 mt-1" style={{ fontSize: 'var(--type-caption)' }}>{formatCurrency(categoryStats.mid.total)} VNĐ</p>
        </div>
        <div className={`border-2 rounded p-4 ${categoryStats.hard.color}`}>
          <p className="text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>{categoryStats.hard.label}</p>
          <p className="text-gray-900" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>{categoryStats.hard.count} phòng</p>
          <p className="text-gray-700 mt-1" style={{ fontSize: 'var(--type-caption)' }}>{formatCurrency(categoryStats.hard.total)} VNĐ</p>
        </div>
      </div>
      
      {/* Debt Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-gray-800" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>Danh sách công nợ - {filteredData.length} phòng</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Mã phòng</th>
                <th className="px-6 py-3 text-left text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Chủ hộ</th>
                <th className="px-6 py-3 text-left text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Số điện thoại</th>
                <th className="px-6 py-3 text-right text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Số tiền nợ (VNĐ)</th>
                <th className="px-6 py-3 text-center text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Số ngày quá hạn</th>
                <th className="px-6 py-3 text-center text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Số lần nhắc</th>
                <th className="px-6 py-3 text-center text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Phân loại</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((debt, index) => (
                <tr key={index} className={`border-b border-gray-200 hover:bg-gray-50 ${getRowColor(debt.daysOverdue)}`}>
                  <td className="px-6 py-4 text-gray-800" style={{ fontSize: 'var(--type-body)' }}>{debt.room}</td>
                  <td className="px-6 py-4 text-gray-700" style={{ fontSize: 'var(--type-body)' }}>{debt.tenant}</td>
                  <td className="px-6 py-4 text-gray-700" style={{ fontSize: 'var(--type-body)' }}>{debt.phone}</td>
                  <td className="px-6 py-4 text-red-600 text-right" style={{ fontSize: 'var(--type-body)' }}>{formatCurrency(debt.amount)}</td>
                  <td className="px-6 py-4 text-gray-800 text-center" style={{ fontSize: 'var(--type-body)' }}>{debt.daysOverdue}</td>
                  <td className="px-6 py-4 text-gray-700 text-center" style={{ fontSize: 'var(--type-body)' }}>{debt.reminderCount} lần</td>
                  <td className="px-6 py-4 text-center">
                    {debt.category === 'under5' && (
                      <span className="inline-block px-3 py-1 rounded border bg-yellow-100 text-yellow-800 border-yellow-300" style={{ fontSize: 'var(--type-caption)' }}>
                        Mới phát sinh
                      </span>
                    )}
                    {debt.category === 'mid' && (
                      <span className="inline-block px-3 py-1 rounded border bg-orange-100 text-orange-800 border-orange-300" style={{ fontSize: 'var(--type-caption)' }}>
                        Cần theo dõi
                      </span>
                    )}
                    {debt.category === 'hard' && (
                      <span className="inline-block px-3 py-1 rounded border bg-red-100 text-red-800 border-red-300" style={{ fontSize: 'var(--type-caption)' }}>
                        Khó đòi
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredData.length > 0 && (
                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td colSpan={3} className="px-6 py-4 text-gray-900" style={{ fontSize: 'var(--type-body)', fontWeight: 700 }}>Tổng cộng</td>
                  <td className="px-6 py-4 text-red-700 text-right" style={{ fontSize: 'var(--type-body)', fontWeight: 700 }}>{formatCurrency(totalDebt)}</td>
                  <td colSpan={3}></td>
                </tr>
              )}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500" style={{ fontSize: 'var(--type-body)' }}>
                    Không có dữ liệu phù hợp với bộ lọc
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Info Box */}
      {categoryStats.hard.count > 0 && (
        <div className="bg-red-50 border border-red-300 rounded p-4">
          <p className="text-red-800" style={{ fontSize: 'var(--type-caption)' }}>
            <strong>⚠️ Cảnh báo:</strong> Có {categoryStats.hard.count} phòng nợ quá 30 ngày (Màu nền đỏ) với tổng giá trị {formatCurrency(categoryStats.hard.total)} VNĐ. Cần có biện pháp xử lý nghiêm khắc hoặc khởi kiện theo hợp đồng.
          </p>
        </div>
      )}

      {/* Batch Send Reminder Modal */}
      {isBatchSendReminderModalOpen && (
        <BatchSendReminderModal 
          debts={debtsForModal} 
          onClose={() => setIsBatchSendReminderModalOpen(false)} 
        />
      )}
    </div>
  );
}
