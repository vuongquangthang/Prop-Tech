import { Send, Ban, Eye, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ViewDebtModal, SendReminderModal, BlockAccountModal, BatchSendReminderModal } from './DebtModals';
import { invoiceService } from '../../services/api.service';
import { PageHeader } from '../ui/product-system';

interface DebtData {
  invoiceId: number;
  room: string;
  tenant: string;
  phone: string;
  amount: number;
  daysLate: number;
  reminderLevel: number;
  dueDate: Date | null;
}

const getReminderLevelInfo = (daysLate: number) => {
  if (daysLate >= 30) {
    return { level: 4, label: 'Mức 4 - Khẩn cấp', range: 'Từ 30 ngày quá hạn', color: 'bg-red-100 text-red-800' };
  }

  if (daysLate >= 15) {
    return { level: 3, label: 'Mức 3 - Cảnh báo', range: '15-29 ngày quá hạn', color: 'bg-orange-100 text-orange-800' };
  }

  if (daysLate >= 7) {
    return { level: 2, label: 'Mức 2 - Nhắc lại', range: '7-14 ngày quá hạn', color: 'bg-yellow-100 text-yellow-800' };
  }

  if (daysLate > 0) {
    return { level: 1, label: 'Mức 1 - Nhắc nhẹ', range: '1-6 ngày quá hạn', color: 'bg-blue-100 text-blue-800' };
  }

  return { level: 0, label: 'Chưa quá hạn', range: '0 ngày quá hạn', color: 'bg-gray-100 text-gray-700' };
};

const getRowColor = (daysLate: number) => {
  if (daysLate >= 30) return 'bg-red-50';
  if (daysLate >= 15) return 'bg-orange-50';
  return '';
};

const calculateDaysLate = (dueDate: Date | null): number => {
  if (!dueDate) return 0;
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const calculateReminderLevel = (daysLate: number): number => {
  return getReminderLevelInfo(daysLate).level;
};

export function DebtTable() {
  const [debtData, setDebtData] = useState<DebtData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [isViewDebtModalOpen, setIsViewDebtModalOpen] = useState(false);
  const [isSendReminderModalOpen, setIsSendReminderModalOpen] = useState(false);
  const [isBlockAccountModalOpen, setIsBlockAccountModalOpen] = useState(false);
  const [isBatchSendReminderModalOpen, setIsBatchSendReminderModalOpen] = useState(false);

  useEffect(() => {
    fetchDebtData();
  }, []);

  const fetchDebtData = async () => {
    try {
      setLoading(true);
      setError(null);
      const invoices = await invoiceService.getUnpaid();
      
      // Map invoices to debt data format
      const debts: DebtData[] = invoices.map((invoice: any) => {
        const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
        const daysLate = calculateDaysLate(dueDate);
        
        return {
          invoiceId: invoice.id || 0,
          room: invoice.roomNumber || '-',
          tenant: invoice.residentName || '-',
          phone: '-', // Not available in invoice DTO
          amount: invoice.remainingAmount || invoice.totalAmount || 0,
          daysLate,
          reminderLevel: calculateReminderLevel(daysLate),
          dueDate,
        };
      });
      
      setDebtData(debts);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách công nợ');
      console.error('Error fetching debt data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openViewDebtModal = (debt: any) => {
    setSelectedDebt(debt);
    setIsViewDebtModalOpen(true);
  };

  const openSendReminderModal = (debt: any) => {
    setSelectedDebt(debt);
    setIsSendReminderModalOpen(true);
  };

  const openBlockAccountModal = (debt: any) => {
    setSelectedDebt(debt);
    setIsBlockAccountModalOpen(true);
  };

  const filteredData = debtData;

  // Tính toán số liệu thống kê dựa trên dữ liệu đã lọc
  const totalDebt = filteredData.reduce((sum, debt) => sum + debt.amount, 0);
  const totalRooms = filteredData.length;
  const over30Days = filteredData.filter(debt => debt.daysLate >= 30).length;

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 size={48} className="animate-spin text-gray-400" />
        <span className="text-gray-600">Đang tải dữ liệu công nợ...</span>
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
            onClick={fetchDebtData}
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
      <PageHeader
        eyebrow="Hóa đơn & Tài chính"
        title="Công nợ & nhắc nợ"
        description="Theo dõi các hóa đơn chưa thanh toán, mức độ quá hạn và thao tác nhắc nợ."
        actions={
          <button
            onClick={() => setIsBatchSendReminderModalOpen(true)}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2"
          >
            <Send size={16} />
            <span>Gửi nhắc nợ hàng loạt</span>
          </button>
        }
      />

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
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-lg text-gray-800">Danh sách công nợ - {filteredData.length} phòng</h2>
        </div>
        
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <FileText size={48} className="text-gray-300" />
            <p className="text-gray-500">Không có công nợ nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Phòng</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Chủ hộ</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Số tiền nợ (VNĐ)</th>
                  <th className="px-6 py-3 text-center text-sm text-gray-600">Số ngày trễ</th>
                  <th className="px-6 py-3 text-center text-sm text-gray-600">Mức nhắc nợ</th>
                  <th className="px-6 py-3 text-center text-sm text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((debt) => {
                  const reminderLevelInfo = getReminderLevelInfo(debt.daysLate);

                  return (
                    <tr key={debt.invoiceId} className={`border-b border-gray-200 hover:bg-gray-50 ${getRowColor(debt.daysLate)}`}>
                      <td className="px-6 py-4 text-sm text-gray-800">{debt.room}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{debt.tenant}</td>
                      <td className="px-6 py-4 text-sm text-red-600 text-right">{debt.amount.toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 text-sm text-gray-800 text-center">{debt.daysLate} ngày</td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-[15px] ${reminderLevelInfo.color}`}>
                            {reminderLevelInfo.label}
                          </span>
                          <span className="text-xs text-gray-500">{reminderLevelInfo.range}</span>
                        </div>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Warning Box */}
      {over30Days > 0 && (
        <div className="bg-red-50 border border-red-300 rounded p-4">
          <p className="text-sm text-red-800">
            <strong>⚠️ Cảnh báo:</strong> Có {over30Days} phòng đã nợ quá 30 ngày. Nên áp dụng biện pháp "Chặn truy cập App" để nhắc nhở nghiêm khắc. Các phòng có nền màu đỏ/cam cần ưu tiên xử lý.
          </p>
        </div>
      )}

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
