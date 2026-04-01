import { Plus, Search, Eye, FileText, AlertCircle, Loader2, AlertTriangle, FileX, Pencil, DollarSign, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CreateContractModal, ViewContractModal, PrintContractModal } from './ContractModals';
import { contractService, serviceService } from '../../services/api.service';

interface ContractData {
  id: number;
  roomId: number;
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
  residents: any[];
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
        const contractId = contract.id || contract.hopDongId || 0;
        const endDateRaw = contract.expectedEndDate || contract.endDate || null;
        const endDate = endDateRaw ? new Date(endDateRaw) : null;
        const today = new Date();
        const daysLeft = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        let status = 'active';
        if (daysLeft < 0) status = 'expired';
        else if (daysLeft <= 7) status = 'danger';
        else if (daysLeft <= 30) status = 'warning';

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
          startDate: contract.startDate ? new Date(contract.startDate).toLocaleDateString('vi-VN') : '-',
          endDate: endDateRaw ? new Date(endDateRaw).toLocaleDateString('vi-VN') : '-',
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
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalTarget, setProposalTarget] = useState<ContractData | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newRentPrice, setNewRentPrice] = useState('');
  const [proposalNote, setProposalNote] = useState('');
  const [selectedAddServiceIds, setSelectedAddServiceIds] = useState<number[]>([]);
  const [servicePriceRows, setServicePriceRows] = useState<Array<{ serviceId: number; newPrice: string }>>([]);
  const [currentServiceIds, setCurrentServiceIds] = useState<number[]>([]);
  const [currentServiceDetails, setCurrentServiceDetails] = useState<Map<number, any>>(new Map());
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  useEffect(() => {
    serviceService.getAll().then((rows: any) => {
      const list = Array.isArray(rows) ? rows : rows?.data ?? [];
      setServices(list.filter((x: any) => x.isActive !== false));
    }).catch(() => setServices([]));
  }, []);

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

  const openProposalModal = async (contract: ContractData) => {
    setProposalTarget(contract);
    setProposalError(null);
    setEffectiveDate(new Date().toISOString().slice(0, 10));
    setNewRentPrice(contract.monthlyRent ? String(contract.monthlyRent) : '');
    setProposalNote('');
    setSelectedAddServiceIds([]);
    setServicePriceRows([]);
    setCurrentServiceIds([]);
    
    // Load current services for this contract from billing formula (ground truth)
    try {
      const detail = await contractService.getById(Number(contract.id));
      
      // Extract services from billing formula for consistency with contract detail view
      if (detail?.billingFormulaJson) {
        const formula = typeof detail.billingFormulaJson === 'string' 
          ? JSON.parse(detail.billingFormulaJson)
          : detail.billingFormulaJson;
        
        if (Array.isArray(formula)) {
          // Extract all service items (DichVu, Dien, Nuoc) - exclude TienPhong (room rent)
          const serviceItems = formula.filter((item: any) => 
            item.itemType !== 'TienPhong' && (item.serviceId || item.serviceName)
          );
          const svcIds = serviceItems.map((item: any) => 
            item.serviceId ? Number(item.serviceId) : `${item.itemType}-${item.serviceName}`
          );
          
          setCurrentServiceIds(svcIds);
          
          // Store current service details for price update reference
          const detailsMap = new Map();
          serviceItems.forEach((item: any) => {
            const key = item.serviceId ? Number(item.serviceId) : `${item.itemType}-${item.serviceName}`;
            detailsMap.set(key, {
              name: item.serviceName,
              currentPrice: item.unitPrice,
              itemType: item.itemType
            });
          });
          setCurrentServiceDetails(detailsMap);
        }
      }
    } catch (e) {
      console.error('Error loading contract services:', e);
      setProposalError('Lỗi khi tải danh sách dịch vụ');
    }
    
    setIsProposalModalOpen(true);
  };

  const submitProposal = async () => {
    if (!proposalTarget) return;
    try {
      setProposalLoading(true);
      setProposalError(null);
      await contractService.proposeChange(proposalTarget.id, {
        effectiveDate,
        newRentPrice: newRentPrice ? Number(newRentPrice) : undefined,
        addedServiceIds: selectedAddServiceIds,
        servicePriceChanges: servicePriceRows
          .filter(r => r.serviceId > 0 && Number(r.newPrice) > 0)
          .map(r => ({ serviceId: r.serviceId, newPrice: Number(r.newPrice) })),
        note: proposalNote || undefined,
      });
      setIsProposalModalOpen(false);
      alert('Đã gửi thông báo chấp nhận thay đổi hợp đồng đến cư dân.');
    } catch (err: any) {
      setProposalError(err.message || 'Không thể gửi đề xuất thay đổi hợp đồng');
    } finally {
      setProposalLoading(false);
    }
  };

  const updateLatestPrices = async () => {
    try {
      setIsUpdatingPrices(true);
      setProposalError(null);
      
      const allServiceIds = Array.from(
        new Set([...currentServiceIds, ...selectedAddServiceIds])
      );
      
      const priceUpdates: Array<{ serviceId: number; newPrice: number }> = [];
      
      // Get latest prices from service catalog for all selected services
      for (const svcId of allServiceIds) {
        const service = services.find((s: any) => Number(s.id) === svcId);
        if (service) {
          const latestPrice = service.commonUnitPrice ?? service.unitPrice ?? 0;
          const currentPrice = currentServiceDetails.get(svcId)?.currentPrice ?? 0;
          
          // Only add to updates if price has changed
          if (latestPrice !== currentPrice && latestPrice > 0) {
            priceUpdates.push({ serviceId: svcId, newPrice: latestPrice });
          }
        }
      }
      
      // Update service price rows
      setServicePriceRows(priceUpdates.map(pu => ({ 
        serviceId: pu.serviceId, 
        newPrice: String(pu.newPrice) 
      })));
      
      if (priceUpdates.length > 0) {
        alert(`Đã cập nhật ${priceUpdates.length} dịch vụ với giá mới nhất từ danh mục.`);
      } else {
        alert('Tất cả các dịch vụ đều có giá mới nhất.');
      }
    } catch (err: any) {
      setProposalError('Lỗi khi cập nhật giá: ' + (err.message || 'Vui lòng thử lại'));
    } finally {
      setIsUpdatingPrices(false);
    }
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
                        <button className="p-2 hover:bg-blue-50 rounded" title="Sửa hợp đồng & gửi cư dân xác nhận" onClick={() => openProposalModal(contract)}>
                          <Pencil size={16} className="text-blue-600" />
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
        <CreateContractModal onClose={() => setIsCreateModalOpen(false)} onSuccess={fetchContracts} />
      )}
      
      {isViewModalOpen && selectedContract && (
        <ViewContractModal contract={selectedContract} onClose={() => setIsViewModalOpen(false)} />
      )}
      
      {isPrintModalOpen && selectedContract && (
        <PrintContractModal contract={selectedContract} onClose={() => setIsPrintModalOpen(false)} />
      )}

      {isProposalModalOpen && proposalTarget && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg text-gray-800">Sửa hợp đồng & gửi cư dân xác nhận</h3>
              <button onClick={() => setIsProposalModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                Hợp đồng {proposalTarget.code} - Phòng {proposalTarget.room}. Sau khi gửi, cư dân phải bấm "Xác nhận thay đổi hợp đồng" thì hệ thống mới áp dụng.
              </div>

              {/* Effective Date & Room Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ngày áp dụng *</label>
                  <input 
                    type="date" 
                    value={effectiveDate} 
                    onChange={e => setEffectiveDate(e.target.value)} 
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Cập nhật giá Phòng (VNĐ)</label>
                  <input 
                    type="number" 
                    min={0} 
                    value={newRentPrice} 
                    onChange={e => setNewRentPrice(e.target.value)} 
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    placeholder="Để trống nếu không thay đổi"
                  />
                </div>
              </div>

              {/* Current Services Section */}
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                  <FileText size={16} className="mr-2" />
                  Dịch vụ hiện tại trong hợp đồng
                </h4>
                
                {currentServiceIds.length > 0 ? (
                  <div className="space-y-2">
                    {currentServiceIds.map(serviceId => {
                      const service = services.find((s: any) => Number(s.id) === serviceId);
                      const serviceDetail = currentServiceDetails.get(serviceId);
                      const serviceName = service?.name || service?.serviceName || serviceDetail?.name || 'Dịch vụ';
                      const currentPrice = serviceDetail?.currentPrice ?? service?.commonUnitPrice ?? service?.unitPrice ?? 0;
                      
                      return (
                        <div key={serviceId} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{serviceName}</p>
                            <p className="text-xs text-gray-600">Giá hiện tại: {currentPrice.toLocaleString('vi-VN')} VNĐ</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentServiceIds(prev => prev.filter(x => x !== serviceId))}
                            className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 border border-red-200"
                          >
                            Xóa
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-3">Không có dịch vụ nào trong hợp đồng</p>
                )}
              </div>

              {/* Add New Services Section */}
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                  <Plus size={16} className="mr-2" />
                  Thêm dịch vụ mới
                </h4>
                
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded p-3 bg-white">
                  {services
                    .filter((s: any) => !currentServiceIds.includes(Number(s.id)))
                    .map((s: any) => {
                      const id = Number(s.id);
                      const checked = selectedAddServiceIds.includes(id);
                      return (
                        <label key={id} className="flex items-center text-sm text-gray-700 gap-2 p-2 hover:bg-blue-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setSelectedAddServiceIds(prev => checked ? prev.filter(x => x !== id) : [...prev, id])}
                            className="cursor-pointer"
                          />
                          <span>{s.name || s.serviceName}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Service Price Updates Section */}
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center">
                    <DollarSign size={16} className="mr-2" />
                    Cập nhật giá dịch vụ
                  </h4>
                  <button
                    type="button"
                    onClick={updateLatestPrices}
                    disabled={isUpdatingPrices || services.length === 0}
                    className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded transition"
                  >
                    {isUpdatingPrices ? 'Đang cập nhật...' : '✓ Cập nhật giá mới nhất'}
                  </button>
                </div>

                {servicePriceRows.length > 0 ? (
                  <div className="space-y-2">
                    {servicePriceRows.map((row, idx) => {
                      const service = services.find((s: any) => Number(s.id) === row.serviceId);
                      const serviceName = service?.name || service?.serviceName || 'Dịch vụ';
                      
                      return (
                        <div key={idx} className="flex items-center gap-2 bg-white p-3 rounded border border-gray-200">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{serviceName}</p>
                          </div>
                          <input
                            type="number"
                            min={0}
                            placeholder="Giá mới"
                            className="w-32 px-2 py-2 text-sm border border-gray-300 rounded"
                            value={row.newPrice}
                            onChange={e => setServicePriceRows(prev => 
                              prev.map((r, i) => i === idx ? { ...r, newPrice: e.target.value } : r)
                            )}
                          />
                          <span className="text-sm text-gray-600">VNĐ</span>
                          <button
                            type="button"
                            onClick={() => setServicePriceRows(prev => prev.filter((_, i) => i !== idx))}
                            className="px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-3">Chưa có cập nhật giá nào. Bấm nút trên để cập nhật giá mới nhất từ danh mục dịch vụ.</p>
                )}
              </div>

              {/* Note Section */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú gửi cư dân</label>
                <textarea 
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded h-20 focus:outline-none focus:border-blue-500" 
                  value={proposalNote} 
                  onChange={e => setProposalNote(e.target.value)}
                  placeholder="Thêm ghi chú để giải thích lý do thay đổi (tùy chọn)"
                />
              </div>

              {proposalError && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                  {proposalError}
                </div>
              )}
            </div>

            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button 
                className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50" 
                onClick={() => setIsProposalModalOpen(false)} 
                disabled={proposalLoading}
              >
                Hủy
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-sm transition" 
                onClick={submitProposal} 
                disabled={proposalLoading || !effectiveDate}
              >
                {proposalLoading ? 'Đang gửi...' : 'Gửi thông báo chấp nhận đến cư dân'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}