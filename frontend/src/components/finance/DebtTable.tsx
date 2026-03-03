import { Send, Ban, Eye, Filter } from 'lucide-react';
import { useState } from 'react';
import { ViewDebtModal, SendReminderModal, BlockAccountModal, BatchSendReminderModal } from './DebtModals';

const debtData = [
  { 
    room: 'C-312', 
    tenant: 'Lê Văn C', 
    phone: '0934567890', 
    amount: '14.500.000', 
    daysLate: 22,
    reminderLevel: 2
  },
  { 
    room: 'D-108', 
    tenant: 'Phạm Thị D', 
    phone: '0945678901', 
    amount: '11.800.000', 
    daysLate: 18,
    reminderLevel: 2
  },
  { 
    room: 'A-205', 
    tenant: 'Trương Văn H', 
    phone: '0978901234', 
    amount: '12.300.000', 
    daysLate: 12,
    reminderLevel: 1
  },
  { 
    room: 'B-310', 
    tenant: 'Đỗ Thị I', 
    phone: '0989012345', 
    amount: '13.500.000', 
    daysLate: 8,
    reminderLevel: 1
  },
  { 
    room: 'C-401', 
    tenant: 'Mai Văn G', 
    phone: '0990123456', 
    amount: '10.500.000', 
    daysLate: 35,
    reminderLevel: 3
  },
];

const getReminderBadge = (level: number) => {
  const configs = {
    1: { label: 'Lần 1', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    2: { label: 'Lần 2', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    3: { label: 'Lần 3', color: 'bg-red-100 text-red-800 border-red-300' },
  };
  const config = configs[level as keyof typeof configs];
  return <span className={`inline-block px-3 py-1 text-xs rounded border ${config.color}`}>{config.label}</span>;
};

const getRowColor = (daysLate: number) => {
  if (daysLate >= 30) return 'bg-red-50';
  if (daysLate >= 15) return 'bg-orange-50';
  return '';
};

export function DebtTable() {
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [isViewDebtModalOpen, setIsViewDebtModalOpen] = useState(false);
  const [isSendReminderModalOpen, setIsSendReminderModalOpen] = useState(false);
  const [isBlockAccountModalOpen, setIsBlockAccountModalOpen] = useState(false);
  const [isBatchSendReminderModalOpen, setIsBatchSendReminderModalOpen] = useState(false);
  const [reminderLevelFilter, setReminderLevelFilter] = useState('all');

  const openViewDebtModal = (debt) => {
    setSelectedDebt(debt);
    setIsViewDebtModalOpen(true);
  };

  const openSendReminderModal = (debt) => {
    setSelectedDebt(debt);
    setIsSendReminderModalOpen(true);
  };

  const openBlockAccountModal = (debt) => {
    setSelectedDebt(debt);
    setIsBlockAccountModalOpen(true);
  };

  // Lọc dữ liệu theo mức độ nhắc
  const filteredData = debtData.filter(debt => {
    if (reminderLevelFilter !== 'all') {
      const level = parseInt(reminderLevelFilter);
      if (debt.reminderLevel !== level) return false;
    }
    return true;
  });

  // Tính toán số liệu thống kê dựa trên dữ liệu đã lọc
  const totalDebt = filteredData.reduce((sum, debt) => 
    sum + parseFloat(debt.amount.replace(/\./g, '')), 0
  );
  const totalRooms = filteredData.length;
  const over30Days = filteredData.filter(debt => debt.daysLate >= 30).length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Tổng công nợ</p>
          <p className="text-2xl text-red-600">{totalDebt.toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-1">VNĐ</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Số phòng nợ</p>
          <p className="text-2xl text-gray-900">{totalRooms}</p>
          <p className="text-xs text-gray-600 mt-1">phòng</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Nợ quá 30 ngày</p>
          <p className="text-2xl text-red-600">{over30Days}</p>
          <p className="text-xs text-gray-600 mt-1">phòng</p>
        </div>
      </div>
      
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Filter size={16} className="text-gray-500" />
          
          <select 
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
            value={reminderLevelFilter}
            onChange={(e) => setReminderLevelFilter(e.target.value)}
          >
            <option value="all">Tất cả mức độ</option>
            <option value="1">Lần 1</option>
            <option value="2">Lần 2</option>
            <option value="3">Lần 3</option>
          </select>
        </div>
        
        <button 
          onClick={() => setIsBatchSendReminderModalOpen(true)}
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2"
        >
          <Send size={16} />
          <span>Gửi nhắc nợ hàng loạt</span>
        </button>
      </div>
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-lg text-gray-800">Danh sách công nợ - {filteredData.length} phòng</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Phòng</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Chủ hộ</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Số điện thoại</th>
                <th className="px-6 py-3 text-right text-sm text-gray-600">Số tiền nợ (VNĐ)</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Số ngày trễ</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Cấp độ nhắc</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((debt, index) => (
                <tr key={index} className={`border-b border-gray-200 hover:bg-gray-50 ${getRowColor(debt.daysLate)}`}>
                  <td className="px-6 py-4 text-sm text-gray-800">{debt.room}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{debt.tenant}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{debt.phone}</td>
                  <td className="px-6 py-4 text-sm text-red-600 text-right">{debt.amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-center">{debt.daysLate}</td>
                  <td className="px-6 py-4 text-center">
                    {getReminderBadge(debt.reminderLevel)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded" title="Xem lịch sử nhắc nợ" onClick={() => openViewDebtModal(debt)}>
                        <Eye size={16} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded" title="Gửi nhắc nợ" onClick={() => openSendReminderModal(debt)}>
                        <Send size={16} className="text-gray-600" />
                      </button>
                      {debt.daysLate >= 30 && (
                        <button className="p-2 hover:bg-gray-100 rounded" title="Chặn truy cập App" onClick={() => openBlockAccountModal(debt)}>
                          <Ban size={16} className="text-red-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Warning Box */}
      <div className="bg-red-50 border border-red-300 rounded p-4">
        <p className="text-sm text-red-800">
          <strong>⚠️ Cảnh báo:</strong> Phòng C-401 đã nợ quá 30 ngày. Nên áp dụng biện pháp "Chặn truy cập App" để nhắc nhở nghiêm khắc. Các phòng có nền màu đỏ/cam cần ưu tiên xử lý.
        </p>
      </div>

      {/* Modals */}
      {isViewDebtModalOpen && selectedDebt && (
        <ViewDebtModal debt={selectedDebt} onClose={() => setIsViewDebtModalOpen(false)} />
      )}
      {isSendReminderModalOpen && selectedDebt && (
        <SendReminderModal debt={selectedDebt} onClose={() => setIsSendReminderModalOpen(false)} />
      )}
      {isBlockAccountModalOpen && selectedDebt && (
        <BlockAccountModal debt={selectedDebt} onClose={() => setIsBlockAccountModalOpen(false)} />
      )}
      {isBatchSendReminderModalOpen && (
        <BatchSendReminderModal debts={debtData} onClose={() => setIsBatchSendReminderModalOpen(false)} />
      )}
    </div>
  );
}