import { Send, Filter, Loader2, AlertTriangle, FileX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BatchSendReminderModal } from '../finance/DebtModals';
import { invoiceService } from '../../services/api.service';
import { FilterSelect } from '../ui/FilterSelect';

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
  if (daysOverdue >= 15) return 'bg-orange-50';
  if (daysOverdue >= 7) return 'bg-yellow-50';
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
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue >= 30) return 'level4';
  if (daysOverdue >= 15) return 'level3';
  if (daysOverdue >= 7) return 'level2';
  return 'level1';
};

const getReminderLevelInfo = (daysOverdue: number) => {
  if (daysOverdue <= 0) {
    return { label: 'Chưa quá hạn', range: '0 ngày quá hạn', color: 'bg-gray-100 text-gray-700' };
  }

  if (daysOverdue >= 30) {
    return { label: 'Mức 4 - Khẩn cấp', range: 'Từ 30 ngày quá hạn', color: 'bg-red-100 text-red-800' };
  }

  if (daysOverdue >= 15) {
    return { label: 'Mức 3 - Cảnh báo', range: '15-29 ngày quá hạn', color: 'bg-orange-100 text-orange-800' };
  }

  if (daysOverdue >= 7) {
    return { label: 'Mức 2 - Nhắc lại', range: '7-14 ngày quá hạn', color: 'bg-yellow-100 text-yellow-800' };
  }

  return { label: 'Mức 1 - Nhắc nhẹ', range: '1-6 ngày quá hạn', color: 'bg-blue-100 text-blue-800' };
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
    current: { 
      label: 'Chưa quá hạn', 
      count: filteredData.filter(d => d.category === 'current').length, 
      total: filteredData.filter(d => d.category === 'current').reduce((sum, d) => sum + d.amount, 0), 
      color: 'bg-gray-50 border-gray-300' 
    },
    level1: { 
      label: 'Mức 1: 1-6 ngày', 
      count: filteredData.filter(d => d.category === 'level1').length, 
      total: filteredData.filter(d => d.category === 'level1').reduce((sum, d) => sum + d.amount, 0), 
      color: 'bg-blue-50 border-blue-300' 
    },
    level2: { 
      label: 'Mức 2: 7-14 ngày', 
      count: filteredData.filter(d => d.category === 'level2').length, 
      total: filteredData.filter(d => d.category === 'level2').reduce((sum, d) => sum + d.amount, 0), 
      color: 'bg-yellow-50 border-yellow-300' 
    },
    level3: { 
      label: 'Mức 3: 15-29 ngày', 
      count: filteredData.filter(d => d.category === 'level3').length, 
      total: filteredData.filter(d => d.category === 'level3').reduce((sum, d) => sum + d.amount, 0), 
      color: 'bg-orange-50 border-orange-300' 
    },
    level4: { 
      label: 'Mức 4: từ 30 ngày', 
      count: filteredData.filter(d => d.category === 'level4').length, 
      total: filteredData.filter(d => d.category === 'level4').reduce((sum, d) => sum + d.amount, 0), 
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
          
          <FilterSelect
            className="px-3 py-2 bg-white focus:outline-none"
            style={{ fontSize: 'var(--type-caption)' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Tất cả mức độ</option>
            <option value="current">Chưa quá hạn: 0 ngày</option>
            <option value="level1">Mức 1: 1-6 ngày</option>
            <option value="level2">Mức 2: 7-14 ngày</option>
            <option value="level3">Mức 3: 15-29 ngày</option>
            <option value="level4">Mức 4: từ 30 ngày</option>
          </FilterSelect>
          
          <FilterSelect
            className="px-3 py-2 bg-white focus:outline-none"
            style={{ fontSize: 'var(--type-caption)' }}
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
          >
            <option value="all">Tất cả tòa nhà</option>
            <option value="A">Tòa A</option>
            <option value="B">Tòa B</option>
            <option value="C">Tòa C</option>
            <option value="D">Tòa D</option>
          </FilterSelect>
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
      <div className="grid grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-gray-600 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Tổng công nợ</p>
          <p className="text-red-600" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{formatCurrency(totalDebt)}</p>
          <p className="text-gray-600 mt-1" style={{ fontSize: 'var(--type-caption)' }}>VNĐ</p>
        </div>
        <div className={`border-2 rounded p-4 ${categoryStats.current.color}`}>
          <p className="text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>{categoryStats.current.label}</p>
          <p className="text-gray-900" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>{categoryStats.current.count} phòng</p>
          <p className="text-gray-700 mt-1" style={{ fontSize: 'var(--type-caption)' }}>{formatCurrency(categoryStats.current.total)} VNĐ</p>
        </div>
        <div className={`border-2 rounded p-4 ${categoryStats.level1.color}`}>
          <p className="text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>{categoryStats.level1.label}</p>
          <p className="text-gray-900" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>{categoryStats.level1.count} phòng</p>
          <p className="text-gray-700 mt-1" style={{ fontSize: 'var(--type-caption)' }}>{formatCurrency(categoryStats.level1.total)} VNĐ</p>
        </div>
        <div className={`border-2 rounded p-4 ${categoryStats.level2.color}`}>
          <p className="text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>{categoryStats.level2.label}</p>
          <p className="text-gray-900" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>{categoryStats.level2.count} phòng</p>
          <p className="text-gray-700 mt-1" style={{ fontSize: 'var(--type-caption)' }}>{formatCurrency(categoryStats.level2.total)} VNĐ</p>
        </div>
        <div className={`border-2 rounded p-4 ${categoryStats.level3.color}`}>
          <p className="text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>{categoryStats.level3.label}</p>
          <p className="text-gray-900" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>{categoryStats.level3.count} phòng</p>
          <p className="text-gray-700 mt-1" style={{ fontSize: 'var(--type-caption)' }}>{formatCurrency(categoryStats.level3.total)} VNĐ</p>
        </div>
        <div className={`border-2 rounded p-4 ${categoryStats.level4.color}`}>
          <p className="text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>{categoryStats.level4.label}</p>
          <p className="text-gray-900" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>{categoryStats.level4.count} phòng</p>
          <p className="text-gray-700 mt-1" style={{ fontSize: 'var(--type-caption)' }}>{formatCurrency(categoryStats.level4.total)} VNĐ</p>
        </div>
      </div>
      
      {/* Debt Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-[var(--primary)]" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>Danh sách công nợ - {filteredData.length} phòng</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Mã phòng</th>
                <th className="px-6 py-3 text-left text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Cư dân đại diện</th>
                <th className="px-6 py-3 text-right text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Số tiền nợ (VNĐ)</th>
                <th className="px-6 py-3 text-center text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Số ngày quá hạn</th>
                <th className="px-6 py-3 text-center text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Mức nhắc nợ</th>
                <th className="px-6 py-3 text-center text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Số lần nhắc</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((debt, index) => {
                const reminderLevelInfo = getReminderLevelInfo(debt.daysOverdue);

                return (
                  <tr key={index} className={`border-b border-gray-200 hover:bg-gray-50 ${getRowColor(debt.daysOverdue)}`}>
                    <td className="px-6 py-4 text-gray-800" style={{ fontSize: 'var(--type-body)' }}>{debt.room}</td>
                    <td className="px-6 py-4 text-gray-700" style={{ fontSize: 'var(--type-body)' }}>{debt.tenant}</td>
                    <td className="px-6 py-4 text-red-600 text-right" style={{ fontSize: 'var(--type-body)' }}>{formatCurrency(debt.amount)}</td>
                    <td className="px-6 py-4 text-gray-800 text-center" style={{ fontSize: 'var(--type-body)' }}>{debt.daysOverdue} ngày</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-[15px] ${reminderLevelInfo.color}`}>
                          {reminderLevelInfo.label}
                        </span>
                        <span className="text-xs text-gray-500">{reminderLevelInfo.range}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-center" style={{ fontSize: 'var(--type-body)' }}>{debt.reminderCount} lần</td>
                  </tr>
                );
              })}
              {filteredData.length > 0 && (
                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td colSpan={2} className="px-6 py-4 text-gray-900" style={{ fontSize: 'var(--type-body)', fontWeight: 700 }}>Tổng cộng</td>
                  <td className="px-6 py-4 text-red-700 text-right" style={{ fontSize: 'var(--type-body)', fontWeight: 700 }}>{formatCurrency(totalDebt)}</td>
                  <td colSpan={3}></td>
                </tr>
              )}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500" style={{ fontSize: 'var(--type-body)' }}>
                    Không có dữ liệu phù hợp với bộ lọc
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Info Box */}
      {categoryStats.level4.count > 0 && (
        <div className="bg-red-50 border border-red-300 rounded p-4">
          <p className="text-red-800" style={{ fontSize: 'var(--type-caption)' }}>
            <strong>⚠️ Cảnh báo:</strong> Có {categoryStats.level4.count} phòng ở Mức 4 - từ 30 ngày quá hạn với tổng giá trị {formatCurrency(categoryStats.level4.total)} VNĐ. Cần ưu tiên xử lý.
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
