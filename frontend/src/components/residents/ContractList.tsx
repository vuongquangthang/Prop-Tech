import { Plus, Search, Eye, FileText, AlertCircle, Loader2, AlertTriangle, FileX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CreateContractModal, ViewContractModal, PrintContractModal } from './ContractModals';
import { contractService } from '../../services/api.service';

interface ContractData {
  id: number;
  code: string;
  contractCode: string;
  room: string;
  tenant: string;
  startDate: string;
  endDate: string;
  deposit: number;
  monthlyRent: number;
  daysLeft: number;
  status: string;
}

export function ContractList() {
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contractService.getAll();
      
      // Map contracts to table format
      const contractData: ContractData[] = data.map((contract: any) => {
        const endDate = contract.endDate ? new Date(contract.endDate) : null;
        const today = new Date();
        const daysLeft = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        let status = 'active';
        if (daysLeft < 0) status = 'expired';
        else if (daysLeft <= 7) status = 'danger';
        else if (daysLeft <= 30) status = 'warning';
        
        return {
          id: contract.id || contract.hopDongId || 0,
          code: contract.contractCode || contract.maHopDong || '',
          contractCode: contract.contractCode || contract.maHopDong || '',
          room: contract.roomNumber || contract.soPhong || '-',
          tenant: contract.tenantName || contract.tenCuDan || '-',
          startDate: contract.startDate ? new Date(contract.startDate).toLocaleDateString('vi-VN') : '-',
          endDate: contract.endDate ? new Date(contract.endDate).toLocaleDateString('vi-VN') : '-',
          deposit: contract.deposit || contract.tienCoc || 0,
          monthlyRent: contract.monthlyRent || contract.giaThue || 0,
          daysLeft,
          status,
        };
      });
      
      setContracts(contractData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách hợp đồng');
      console.error('Error fetching contracts:', err);
    } finally {
      setLoading(false);
    }
  };
  const getRowColor = (status: string) => {
    if (status === 'danger') return 'bg-yellow-50';
    if (status === 'expired') return 'bg-red-50';
    return '';
  };

  const getStatusBadge = (daysLeft: number, status: string) => {
    if (status === 'expired') {
      return <span className="inline-flex items-center px-3 py-1 text-xs rounded border bg-red-100 text-red-800 border-red-300">
        <AlertCircle size={14} className="mr-1" />
        Quá hạn {Math.abs(daysLeft)} ngày
      </span>;
    }
    if (status === 'danger') {
      return <span className="inline-flex items-center px-3 py-1 text-xs rounded border bg-yellow-100 text-yellow-800 border-yellow-300">
        <AlertCircle size={14} className="mr-1" />
        Còn {daysLeft} ngày
      </span>;
    }
    if (status === 'warning') {
      return <span className="inline-flex items-center px-3 py-1 text-xs rounded border bg-orange-100 text-orange-800 border-orange-300">
        Còn {daysLeft} ngày
      </span>;
    }
    return <span className="inline-flex items-center px-3 py-1 text-xs rounded border bg-green-100 text-green-800 border-green-300">
      Còn {daysLeft} ngày
    </span>;
  };

  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const openViewModal = (contract: any) => {
    setSelectedContract(contract);
    setIsViewModalOpen(true);
  };

  const openPrintModal = (contract: any) => {
    setSelectedContract(contract);
    setIsPrintModalOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 size={48} className="animate-spin text-gray-400" />
          <span className="text-gray-600">Đang tải danh sách hợp đồng...</span>
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
            onClick={fetchContracts}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo mã hợp đồng, phòng hoặc chủ hộ..."
              className="w-96 pl-10 pr-4 py-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          
          <select className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="warning">Sắp hết hạn (&lt;30 ngày)</option>
            <option value="expired">Đã quá hạn</option>
          </select>
        </div>
        
        <button className="px-4 py-2 bg-gray-800 text-white text-sm rounded flex items-center space-x-2 hover:bg-gray-700" onClick={openCreateModal}>
          <Plus size={16} />
          <span>Tạo hợp đồng mới</span>
        </button>
      </div>
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-lg text-gray-800">Danh sách hợp đồng - {contracts.length} hợp đồng</h2>
        </div>
        
        {contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <FileX size={48} className="text-gray-300" />
            <p className="text-gray-500">Chưa có hợp đồng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Mã hợp đồng</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Phòng</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Chủ hộ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Ngày bắt đầu</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Ngày kết thúc</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Tiền cọc (VNĐ)</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Tiền thuê/tháng</th>
                  <th className="px-6 py-3 text-center text-sm text-gray-600">Trạng thái</th>
                  <th className="px-6 py-3 text-center text-sm text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id} className={`border-b border-gray-200 hover:bg-gray-50 ${getRowColor(contract.status)}`}>
                    <td className="px-6 py-4 text-sm text-gray-800">{contract.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{contract.room}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{contract.tenant}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{contract.startDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{contract.endDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 text-right">{contract.deposit.toLocaleString('vi-VN')}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 text-right">{contract.monthlyRent.toLocaleString('vi-VN')}</td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(contract.daysLeft, contract.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button className="p-2 hover:bg-gray-100 rounded" title="Xem chi tiết" onClick={() => openViewModal(contract)}>
                          <Eye size={16} className="text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded" title="In hợp đồng" onClick={() => openPrintModal(contract)}>
                          <FileText size={16} className="text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Warning Box */}
      <div className="bg-yellow-50 border border-yellow-300 rounded p-4">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Lưu ý:</strong> Các hợp đồng được tô màu vàng nhạt là hợp đồng còn dưới 15 ngày. Hợp đồng tô màu đỏ nhạt là đã quá hạn, cần xử lý ngay.
        </p>
      </div>
      
      {/* Create Contract Button - Opens Modal */}
      <button 
        onClick={() => {/* Open modal */}}
        className="hidden"
        id="create-contract-modal-trigger"
      >
        Open Create Contract Modal
      </button>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateContractModal onClose={() => setIsCreateModalOpen(false)} />
      )}
      
      {isViewModalOpen && selectedContract && (
        <ViewContractModal contract={selectedContract} onClose={() => setIsViewModalOpen(false)} />
      )}
      
      {isPrintModalOpen && selectedContract && (
        <PrintContractModal contract={selectedContract} onClose={() => setIsPrintModalOpen(false)} />
      )}
    </div>
  );
}