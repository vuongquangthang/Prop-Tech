import { Plus, Edit2, Trash2, X, AlertTriangle, History, DollarSign, Loader2, FileX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { serviceService, ServicePriceHistory } from '../../services/api.service';
import { formatLocalDateInput, toLocalIsoString } from '../../lib/date-utils';

interface ServiceData {
  id: number;
  name: string;
  type: string;
  unit: string;
  price: number;
  date: string;
  mandatory: boolean;
}

const normalizeServiceType = (raw: string | undefined): 'Cố định' | 'Biến đổi' => {
  const value = (raw || '').trim().toLowerCase();
  if (value.includes('biến') || value.includes('bien') || value.includes('variable')) {
    return 'Biến đổi';
  }
  return 'Cố định';
};

export function ServiceTable() {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdatePriceModal, setShowUpdatePriceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [serviceType, setServiceType] = useState<'fixed' | 'variable'>('fixed');

  // Add form state
  const [addName, setAddName] = useState('');
  const [addUnit, setAddUnit] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addEffectiveDate, setAddEffectiveDate] = useState(() => formatLocalDateInput());
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // UpdatePrice form state
  const [updateNewPrice, setUpdateNewPrice] = useState('');
  const [updateEffectiveDate, setUpdateEffectiveDate] = useState('');
  const [updateReason, setUpdateReason] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Price history state
  const [priceHistory, setPriceHistory] = useState<ServicePriceHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await serviceService.getAll();
      
      const serviceData: ServiceData[] = data.map((service: any) => ({
        id: service.id || 0,
        name: service.name || service.serviceName || service.tenDichVu || '',
        type: normalizeServiceType(service.serviceType || service.loaiDichVu),
        unit: service.unit || service.donVi || '',
        price: service.commonUnitPrice ?? service.unitPrice ?? service.donGia ?? 0,
        date: service.effectiveDate
          ? (() => { const d = new Date(service.effectiveDate); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })()
          : '—',
        mandatory: service.isActive !== undefined ? service.isActive : (service.isMandatory !== undefined ? service.isMandatory : true),
      }));
      
      setServices(serviceData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách dịch vụ');
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePriceClick = (service: any) => {
    setSelectedService(service);
    setUpdateNewPrice('');
    setUpdateEffectiveDate(formatLocalDateInput());
    setUpdateReason('');
    setUpdateError(null);
    setShowUpdatePriceModal(true);
  };

  const handleDeleteClick = (service: any) => {
    setSelectedService(service);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleShowHistory = (service: any) => {
    setSelectedService(service);
    setPriceHistory([]);
    setHistoryLoading(true);
    setShowHistoryModal(true);
    serviceService.getPriceHistory(service.id)
      .then(data => setPriceHistory(data))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  };

  const openAddModal = () => {
    setAddName(''); setAddUnit(''); setAddPrice(''); setAddError(null); setAddEffectiveDate(formatLocalDateInput());
    setServiceType('fixed');
    setShowAddModal(true);
  };

  const handleAddSubmit = async () => {
    if (!addName.trim() || !addPrice) {
      setAddError('Vui lòng nhập tên dịch vụ và đơn giá');
      return;
    }
    setAddLoading(true); setAddError(null);
    try {
      await serviceService.create({
        name: addName.trim(),
        serviceType: serviceType === 'fixed' ? 'Cố định' : 'Biến đổi',
        unit: addUnit.trim() || undefined,
        commonUnitPrice: parseFloat(addPrice),
        effectiveDate: toLocalIsoString(addEffectiveDate),
      } as any);
      await fetchServices();
      setShowAddModal(false);
    } catch (err: any) {
      setAddError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdatePriceSubmit = async () => {
    if (!updateNewPrice) {
      setUpdateError('Vui lòng nhập đơn giá mới');
      return;
    }
    if (!updateEffectiveDate) {
      setUpdateError('Vui lòng chọn ngày áp dụng');
      return;
    }
    setUpdateLoading(true); setUpdateError(null);
    try {
      await serviceService.update(selectedService.id, {
        commonUnitPrice: parseFloat(updateNewPrice),
        effectiveDate: toLocalIsoString(updateEffectiveDate),
        reason: updateReason.trim() || undefined,
      } as any);
      await fetchServices();
      setShowUpdatePriceModal(false);
    } catch (err: any) {
      setUpdateError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true); setDeleteError(null);
    try {
      await serviceService.delete(selectedService.id);
      await fetchServices();
      setShowDeleteModal(false);
    } catch (err: any) {
      setDeleteError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 size={48} className="animate-spin text-gray-400" />
          <span className="text-gray-600">Đang tải danh sách dịch vụ...</span>
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
            onClick={fetchServices}
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
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div></div>
        
        <button 
          onClick={openAddModal}
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded flex items-center space-x-2 hover:bg-gray-700"
        >
          <Plus size={16} />
          <span>Thêm dịch vụ mới</span>
        </button>
      </div>
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-lg text-gray-800">Danh mục dịch vụ & Đơn giá - {services.length} dịch vụ</h2>
        </div>
        
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <FileX size={48} className="text-gray-300" />
            <p className="text-gray-500">Chưa có dịch vụ nào được cấu hình</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Tên dịch vụ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Loại phí</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Đơn vị tính</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Đơn giá hiện tại (VNĐ)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Ngày áp dụng</th>
                  <th className="px-6 py-3 text-center text-sm text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">{service.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className={`inline-block px-3 py-1 text-xs rounded border ${
                        service.type === 'Cố định'
                          ? 'bg-gray-100 text-gray-800 border-gray-300'
                          : 'bg-orange-100 text-orange-800 border-orange-300'
                      }`}>
                        {service.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{service.unit}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 text-right">
                      {typeof service.price === 'number' ? service.price.toLocaleString('vi-VN') : service.price}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{service.date}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleUpdatePriceClick(service)}
                          className="px-3 py-1 bg-white border border-gray-800 text-gray-800 text-xs rounded hover:bg-gray-800 hover:text-white transition-colors flex items-center space-x-1"
                          title="Cập nhật đơn giá"
                        >
                          <Edit2 size={14} />
                          <span>Cập nhật giá</span>
                        </button>
                        <button
                          onClick={() => handleShowHistory(service)}
                          className="p-2 hover:bg-gray-100 rounded"
                          title="Xem lịch sử thay đổi"
                        >
                          <History size={16} className="text-gray-600" />
                        </button>
                        {!service.mandatory && (
                          <button
                            onClick={() => handleDeleteClick(service)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title="Xóa dịch vụ"
                          >
                            <Trash2 size={16} className="text-gray-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Info Box */}
      <div className="bg-gray-100 border border-gray-300 rounded p-4">
        <p className="text-sm text-gray-700">
          <strong>Lưu ý:</strong> Khi cập nhật đơn giá mới, hệ thống sẽ lưu lịch sử thay đổi để đảm bảo các hóa đơn cũ không bị ảnh hưởng.
        </p>
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center space-x-2">
                <Plus size={20} className="text-gray-800" />
                <h3 className="text-lg text-gray-800">Thêm dịch vụ mới</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Service Name */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tên dịch vụ *</label>
                <input 
                  type="text"
                  placeholder="VD: Phí giặt ủi, Phí an ninh..."
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Loại phí *</label>
                <div className="flex space-x-2">
                  <button 
                    type="button"
                    className={`flex-1 px-4 py-2 text-sm rounded border transition-colors ${serviceType === 'fixed' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => setServiceType('fixed')}
                  >
                    Cố định
                  </button>
                  <button 
                    type="button"
                    className={`flex-1 px-4 py-2 text-sm rounded border transition-colors ${serviceType === 'variable' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => setServiceType('variable')}
                  >
                    Biến đổi
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Cố định: Phí không thay đổi theo lượng sử dụng (VD: Phí quản lý). 
                  Biến đổi: Phí tính theo lượng sử dụng (VD: Điện, nước)
                </p>
              </div>

              {/* Unit & Price */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Đơn vị tính *</label>
                  <input 
                    type="text"
                    placeholder="VD: Tháng, kWh, m³..."
                    value={addUnit}
                    onChange={e => setAddUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Đơn giá (VNĐ) *</label>
                  <input 
                    type="number"
                    placeholder="VD: 200000"
                    value={addPrice}
                    onChange={e => setAddPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Ngày áp dụng *</label>
                  <input
                    type="date"
                    value={addEffectiveDate}
                    onChange={e => setAddEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
              </div>

              {addError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{addError}</p>
              )}
            </div>
            
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setShowAddModal(false)}
                disabled={addLoading}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleAddSubmit}
                disabled={addLoading}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {addLoading && <Loader2 size={14} className="animate-spin" />}
                <span>Xác nhận thêm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Price Modal */}
      {showUpdatePriceModal && selectedService && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign size={20} className="text-gray-800" />
                <h3 className="text-lg text-gray-800">Cập nhật đơn giá - {selectedService.name}</h3>
              </div>
              <button onClick={() => setShowUpdatePriceModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Current Price Info */}
              <div className="bg-blue-50 border border-blue-300 rounded p-4">
                <h4 className="text-sm text-blue-800 mb-2 font-bold">Thông tin hiện tại</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-blue-700">Đơn giá hiện tại:</p>
                  <p className="text-blue-900 font-bold">{selectedService.price} VNĐ</p>
                  <p className="text-blue-700">Ngày áp dụng:</p>
                  <p className="text-blue-900">{selectedService.date}</p>
                  <p className="text-blue-700">Loại phí:</p>
                  <p className="text-blue-900">{selectedService.type}</p>
                </div>
              </div>

              {/* New Price */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Đơn giá mới (VNĐ) *</label>
                <input 
                  type="number"
                  placeholder={String(selectedService.price)}
                  value={updateNewPrice}
                  onChange={e => setUpdateNewPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>

              {/* Apply Date */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Ngày áp dụng giá mới *</label>
                <input 
                  type="date"
                  value={updateEffectiveDate}
                  onChange={e => setUpdateEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Giá mới chỉ áp dụng từ ngày này trở đi. Các hóa đơn cũ vẫn giữ nguyên giá
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Lý do thay đổi</label>
                <input 
                  type="text"
                  placeholder="VD: Theo quy định mới, Điều chỉnh giá..."
                  value={updateReason}
                  onChange={e => setUpdateReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>

              {/* Warning */}
              <div className="bg-orange-50 border border-orange-300 rounded p-4">
                <p className="text-xs text-orange-800">
                  <strong>⚠️ Lưu ý:</strong> Hệ thống sẽ lưu lịch sử thay đổi giá. 
                  Bạn có thể xem lại bằng cách nhấn vào nút <History size={12} className="inline" /> ở bảng danh sách.
                </p>
              </div>

              {updateError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{updateError}</p>
              )}
            </div>
            
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setShowUpdatePriceModal(false)}
                disabled={updateLoading}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleUpdatePriceSubmit}
                disabled={updateLoading}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {updateLoading && <Loader2 size={14} className="animate-spin" />}
                <span>Xác nhận cập nhật</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {showHistoryModal && selectedService && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[700px] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center space-x-2">
                <History size={20} className="text-gray-800" />
                <h3 className="text-lg text-gray-800">Lịch sử thay đổi giá - {selectedService.name}</h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-gray-400" />
                </div>
              ) : priceHistory.length > 0 ? (
                <div className="bg-white border border-gray-300 rounded">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-300">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm text-gray-600">STT</th>
                        <th className="px-4 py-3 text-left text-sm text-gray-600">Ngày áp dụng</th>
                        <th className="px-4 py-3 text-right text-sm text-gray-600">Giá cũ (VNĐ)</th>
                        <th className="px-4 py-3 text-right text-sm text-gray-600">Giá mới (VNĐ)</th>
                        <th className="px-4 py-3 text-left text-sm text-gray-600">Lý do thay đổi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceHistory.map((history, index) => {
                        const d = new Date(history.effectiveDate);
                        const dateStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
                        return (
                          <tr key={history.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-gray-800">{dateStr}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 text-right">{history.oldPrice.toLocaleString('vi-VN')}</td>
                            <td className="px-4 py-3 text-sm text-gray-800 text-right font-bold">{history.newPrice.toLocaleString('vi-VN')}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{history.reason || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-300 rounded p-8 text-center">
                  <History size={48} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Chưa có lịch sử thay đổi giá cho dịch vụ này</p>
                  <p className="text-xs text-gray-500 mt-1">Lịch sử sẽ được lưu khi bạn cập nhật giá lần đầu</p>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedService && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg text-gray-800">Xác nhận xóa</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Warning */}
              <div className="flex items-start space-x-3 bg-red-50 border border-red-300 rounded p-4">
                <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-bold mb-1">Bạn có chắc chắn muốn xóa dịch vụ này?</p>
                  <p className="text-sm text-red-700">Hành động này không thể hoàn tác!</p>
                </div>
              </div>

              {/* Service Info */}
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <p className="text-sm text-gray-600 mb-2">Dịch vụ sẽ bị xóa:</p>
                <div className="space-y-1">
                  <p className="text-sm text-gray-800"><strong>Tên dịch vụ:</strong> {selectedService.name}</p>
                  <p className="text-sm text-gray-800"><strong>Loại phí:</strong> {selectedService.type}</p>
                  <p className="text-sm text-gray-800"><strong>Đơn giá:</strong> {selectedService.price} VNĐ/{selectedService.unit}</p>
                </div>
              </div>

              {/* Impact Warning */}
              <div className="bg-orange-50 border border-orange-300 rounded p-4">
                <p className="text-sm text-orange-800">
                  <strong>⚠️ Lưu ý:</strong> Dịch vụ sẽ bị xóa khỏi danh sách. 
                  Các hóa đơn đã tạo trước đó vẫn giữ nguyên thông tin dịch vụ này.
                </p>
              </div>

              {deleteError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{deleteError}</p>
              )}
            </div>
            
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button 
                onClick={handleDeleteCancel}
                disabled={deleteLoading}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}