import { Plus, Search, Eye, Printer, AlertCircle, Loader2, AlertTriangle, FileX, Pencil, Filter, CalendarPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { CreateContractModal, ViewContractModal, PrintContractModal, EditContractModal, ExtendContractModal } from './ContractModals';
import { contractService, tatToanService } from '../../services/api.service';
import { formatDisplayDate } from '../../lib/date-utils';
import { DataCard, DataTable, EmptyState, LoadingState, StatusBadge } from '../ui/product-system';
import { FilterSelect } from '../ui/FilterSelect';
import { searchIncludes } from '../../lib/search';

interface ContractData {
  id: number;
  roomId: number;
  code: string;
  contractCode: string;
  room: string;
  tenant: string;
  startDate: string;
  endDate: string;
  expectedEndDate?: string;
  deposit: number;
  monthlyRent: number;
  daysLeft: number;
  status: string;
  residents: any[];
}

export function ContractList() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, settlements] = await Promise.all([
        contractService.getAll(),
        tatToanService.getAll(),
      ]);

      const completedStatuses = new Set(['completed', 'hoàn thành', 'hoan thanh', 'da hoan tien']);
      const endedContractIds = new Set<number>(
        (Array.isArray(settlements) ? settlements : [])
          .filter((s: any) => completedStatuses.has(String(s?.status || '').trim().toLowerCase()))
          .map((s: any) => Number(s?.residencyId))
          .filter((id: number) => Number.isFinite(id) && id > 0)
      );
      
      // Map contracts to table format
      const contractData: ContractData[] = data.map((contract: any) => {
        const contractId = contract.id || contract.hopDongId || 0;
        const endDateRaw = contract.expectedEndDate || contract.endDate || null;
        const endDate = endDateRaw ? new Date(endDateRaw) : null;
        const today = new Date();
        const daysLeft = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        let status = 'active';
        if (endedContractIds.has(Number(contractId))) {
          status = 'ended';
        } else if (daysLeft < 0) {
          status = 'expired';
        } else if (daysLeft <= 7) {
          status = 'danger';
        } else if (daysLeft <= 30) {
          status = 'warning';
        }

        const residents: any[] = (contract.residents || []).map((r: any) => ({
          id: r.id || r.residentId,
          residentId: r.residentId || r.id,
          fullName: r.fullName || r.hoTen,
          phoneNumber: r.phoneNumber || r.soDienThoai,
          idCardNumber: r.idCardNumber || r.soCCCD,
          email: r.email,
          residencyRole: r.residencyRole || r.vaiTroCuTru,
        }));

        // Tenant: main resident from residents array (role = "Người thuê chính" or first resident)
        const mainResident = residents.find((r: any) => r.residencyRole === 'Người thuê chính') || residents[0];
        const tenantName = mainResident?.fullName || contract.tenantName || contract.tenCuDan || '-';
        
        return {
          id: contractId,
          roomId: contract.roomId || contract.phongId || 0,
          code: contract.contractCode || contract.maHopDong || `HD-${String(contractId).padStart(4, '0')}`,
          contractCode: contract.contractCode || contract.maHopDong || `HD-${String(contractId).padStart(4, '0')}`,
          room: contract.roomNumber || contract.soPhong || '-',
          tenant: tenantName,
          startDate: formatDisplayDate(contract.startDate, '-'),
          endDate: formatDisplayDate(endDateRaw, '-'),
          expectedEndDate: endDateRaw || undefined,
          deposit: contract.depositAmount ?? contract.deposit ?? contract.tienCoc ?? 0,
          monthlyRent: contract.actualRentPrice ?? contract.monthlyRent ?? contract.giaThue ?? 0,
          daysLeft,
          status,
          residents,
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
    if (status === 'ended') return 'bg-gray-50';
    return '';
  };

  const getStatusBadge = (daysLeft: number, status: string) => {
    if (status === 'ended') {
      return <StatusBadge tone="neutral">Đã hết</StatusBadge>;
    }
    if (status === 'expired') {
      return <StatusBadge tone="danger">
        <AlertCircle size={14} className="mr-1" />
        Quá hạn {Math.abs(daysLeft)} ngày
      </StatusBadge>;
    }
    if (status === 'danger') {
      return <StatusBadge tone="warning">
        <AlertCircle size={14} className="mr-1" />
        Còn {daysLeft} ngày
      </StatusBadge>;
    }
    if (status === 'warning') {
      return <StatusBadge tone="warning">Còn {daysLeft} ngày</StatusBadge>;
    }
    return <StatusBadge tone="success">Còn {daysLeft} ngày</StatusBadge>;
  };

  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ContractData | null>(null);

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

  const openEditModal = (contract: ContractData) => {
    setEditTarget(contract);
    setIsEditModalOpen(true);
  };

  const openExtendModal = (contract: ContractData) => {
    setSelectedContract(contract);
    setIsExtendModalOpen(true);
  };

  // FIX: Handle contract creation success - reload list and navigate
  const handleContractCreateSuccess = async () => {
    setIsCreateModalOpen(false);
    await fetchContracts();
    // Redirect to contracts page after successful creation
    navigate('/contract-management', { replace: true });
  };

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      searchIncludes(contract.code, searchTerm) ||
      searchIncludes(contract.room, searchTerm) ||
      searchIncludes(contract.tenant, searchTerm);
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Loading state
  if (loading) {
    return (
      <DataCard>
        <LoadingState label="Đang tải danh sách hợp đồng..." />
      </DataCard>
    );
  }

  // Error state
  if (error) {
    return (
      <DataCard>
        <EmptyState
          icon={<AlertTriangle size={26} />}
          title="Không thể tải danh sách hợp đồng"
          description={error}
          action={<button onClick={fetchContracts} className="app-button-primary">Thử lại</button>}
        />
      </DataCard>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Filter size={16} className="text-gray-500" />
          <FilterSelect
            className="app-select"
            style={{ width: '220px', flex: '0 0 220px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="warning">Sắp hết hạn (&lt;30 ngày)</option>
            <option value="danger">Sắp hết hạn (&lt;7 ngày)</option>
            <option value="expired">Đã quá hạn</option>
            <option value="ended">Đã hết</option>
          </FilterSelect>
          <input
            type="text"
            placeholder="Tìm theo mã hợp đồng, phòng hoặc cư dân đại diện..."
            className="app-input"
            style={{ width: '360px', flex: '0 0 360px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="app-button-primary" onClick={openCreateModal}>
          <Plus size={16} />
          <span>Tạo hợp đồng mới</span>
        </button>
      </div>
      
      {/* Table */}
      <DataCard title={`Danh sách hợp đồng · ${filteredContracts.length} hợp đồng`} description="Các cảnh báo ngày hết hạn được tính theo ngày kết thúc dự kiến.">
        {filteredContracts.length === 0 ? (
          <EmptyState icon={<FileX size={26} />} title="Chưa có hợp đồng nào" description="Tạo hợp đồng đầu tiên để bắt đầu quản lý cư trú và thanh toán." />
        ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>Mã hợp đồng</th>
                  <th>Phòng</th>
                  <th>Cư dân đại diện</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th>Tiền cọc (VNĐ)</th>
                  <th>Tiền thuê/tháng</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className={`cursor-pointer ${getRowColor(contract.status)}`}
                    onClick={() => openViewModal(contract)}
                  >
                    <td className="font-semibold text-[var(--brand-primary)]">{contract.code}</td>
                    <td>{contract.room}</td>
                    <td>{contract.tenant}</td>
                    <td>{contract.startDate}</td>
                    <td>{contract.endDate}</td>
                    <td className="font-semibold">{contract.deposit.toLocaleString('vi-VN')}</td>
                    <td className="font-semibold">{contract.monthlyRent.toLocaleString('vi-VN')}</td>
                    <td>
                      {getStatusBadge(contract.daysLeft, contract.status)}
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button className="product-action-icon" title="Xem chi tiết" onClick={() => openViewModal(contract)}>
                          <Eye size={16} />
                        </button>
                        <button className="product-action-icon" title="In hợp đồng" onClick={() => openPrintModal(contract)}>
                          <Printer size={16} />
                        </button>
                        <button className="product-action-icon" title="Cập nhật hợp đồng" onClick={() => openEditModal(contract)}>
                          <Pencil size={16} />
                        </button>
                        {contract.status !== 'ended' && (
                          <button className="product-action-icon" title="Gia hạn hợp đồng" onClick={() => openExtendModal(contract)}>
                            <CalendarPlus size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
        )}
      </DataCard>
      
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
        <CreateContractModal onClose={() => setIsCreateModalOpen(false)} onSuccess={handleContractCreateSuccess} />
      )}
      
      {isViewModalOpen && selectedContract && (
        <ViewContractModal contract={selectedContract} onClose={() => setIsViewModalOpen(false)} />
      )}
      
      {isPrintModalOpen && selectedContract && (
        <PrintContractModal contract={selectedContract} onClose={() => setIsPrintModalOpen(false)} />
      )}

      {isEditModalOpen && editTarget && (
        <EditContractModal contract={editTarget} onClose={() => setIsEditModalOpen(false)} onSuccess={fetchContracts} />
      )}

      {isExtendModalOpen && selectedContract && (
        <ExtendContractModal contract={selectedContract} onClose={() => setIsExtendModalOpen(false)} onSuccess={fetchContracts} />
      )}
    </div>
  );
}
