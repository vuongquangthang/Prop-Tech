import { Plus, Edit2, Trash2, X, AlertTriangle, History, DollarSign, Loader2, FileX, ChevronDown, Check } from 'lucide-react';
import { useMemo, useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { buildingService, serviceService, ServicePriceHistory } from '../../services/api.service';
import { formatLocalDateInput, toLocalIsoString } from '../../lib/date-utils';
import { PageHeader } from '../ui/product-system';

const DEFAULT_SERVICE_UNITS = ['Năm', 'Quý', 'Tháng', 'Người', 'kWh', 'm³'];
const SERVICE_UNITS_STORAGE_KEY = 'prop-tech-service-units';
const SERVICE_TYPES = ['Điện', 'Nước', 'Gửi xe', 'Theo người', 'Cố định khác'] as const;
type ServiceTypeValue = typeof SERVICE_TYPES[number];
const SERVICE_TYPE_DEFAULT_UNITS: Record<ServiceTypeValue, string> = {
  'Điện': 'kWh',
  'Nước': 'm³',
  'Gửi xe': 'Tháng',
  'Theo người': 'Người',
  'Cố định khác': 'Tháng',
};

interface ServiceData {
  id: number;
  name: string;
  type: string;
  unit: string;
  price: number;
  date: string;
  effectiveDate?: string;
  mandatory: boolean;
  buildingId?: number | null;
  buildingName?: string | null;
  buildingIds?: number[];
  buildingNames?: string[];
}

interface ServiceGroup extends ServiceData {
  items: ServiceData[];
  serviceIds: number[];
  buildingIds: number[];
  buildingNames: string[];
  hasMixedPrices: boolean;
}

interface BuildingOption {
  id: number;
  buildingName?: string;
  name?: string;
}

const normalizeText = (value: string | undefined) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();

const normalizeServiceType = (raw: string | undefined, serviceName?: string): ServiceTypeValue | string => {
  const value = (raw || '').trim().toLowerCase();
  const searchable = `${normalizeText(raw)} ${normalizeText(serviceName)}`;

  if (searchable.includes('dien') || searchable.includes('electric')) {
    return 'Điện';
  }
  if (searchable.includes('nuoc') || searchable.includes('water')) {
    return 'Nước';
  }
  if (searchable.includes('xe') || searchable.includes('parking')) {
    return 'Gửi xe';
  }
  if (searchable.includes('nguoi') || searchable.includes('person')) {
    return 'Theo người';
  }
  if (value.includes('cố định') || value.includes('co dinh') || value.includes('fixed')) {
    return 'Cố định khác';
  }

  return raw?.trim() || 'Cố định khác';
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
  const [serviceType, setServiceType] = useState<ServiceTypeValue>('Cố định khác');
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);

  // Add form state
  const [addName, setAddName] = useState('');
  const [addUnit, setAddUnit] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addEffectiveDate, setAddEffectiveDate] = useState(() => formatLocalDateInput());
  const [addScopeMode, setAddScopeMode] = useState<'common' | 'private'>('common');
  const [addBuildingIds, setAddBuildingIds] = useState<number[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [unitOptions, setUnitOptions] = useState<string[]>(DEFAULT_SERVICE_UNITS);
  const [unitMenuOpen, setUnitMenuOpen] = useState(false);
  const [addingCustomUnit, setAddingCustomUnit] = useState(false);
  const [customUnit, setCustomUnit] = useState('');
  const [priceScale, setPriceScale] = useState<'unit' | 'thousand' | 'million'>('thousand');
  const [priceError, setPriceError] = useState('');

  // UpdatePrice form state
  const [updateNewPrice, setUpdateNewPrice] = useState('');
  const [updateEffectiveDate, setUpdateEffectiveDate] = useState('');
  const [updateReason, setUpdateReason] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showUpdatePriceConfirm, setShowUpdatePriceConfirm] = useState(false);
  const [updatePriceScale, setUpdatePriceScale] = useState<'unit' | 'thousand' | 'million'>('thousand');
  const [updatePriceFormatError, setUpdatePriceFormatError] = useState('');
  const [editName, setEditName] = useState('');
  const [editServiceType, setEditServiceType] = useState<ServiceTypeValue>('Cố định khác');
  const [editUnit, setEditUnit] = useState('');
  const [editScopeMode, setEditScopeMode] = useState<'common' | 'private'>('common');
  const [editBuildingIds, setEditBuildingIds] = useState<number[]>([]);
  const [editUnitMenuOpen, setEditUnitMenuOpen] = useState(false);
  const [editAddingCustomUnit, setEditAddingCustomUnit] = useState(false);
  const [editCustomUnit, setEditCustomUnit] = useState('');

  // Price history state
  const [priceHistory, setPriceHistory] = useState<ServicePriceHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
    fetchBuildings();
    try {
      const savedUnits = JSON.parse(localStorage.getItem(SERVICE_UNITS_STORAGE_KEY) || '[]') as string[];
      if (Array.isArray(savedUnits)) {
        setUnitOptions(Array.from(new Set([...DEFAULT_SERVICE_UNITS, ...savedUnits.filter(Boolean)])));
      }
    } catch {
      setUnitOptions(DEFAULT_SERVICE_UNITS);
    }
  }, []);

  const fetchBuildings = async () => {
    try {
      const data = await buildingService.getAll();
      setBuildings(data as BuildingOption[]);
    } catch {
      setBuildings([]);
    }
  };

  const priceMultiplier = priceScale === 'million' ? 1_000_000 : priceScale === 'thousand' ? 1_000 : 1;
  const addPriceVnd = addPrice ? Math.round(Number(addPrice) * priceMultiplier) : 0;
  const updatePriceMultiplier = updatePriceScale === 'million' ? 1_000_000 : updatePriceScale === 'thousand' ? 1_000 : 1;
  const updatePriceVnd = updateNewPrice ? Math.round(Number(updateNewPrice) * updatePriceMultiplier) : 0;
  const allBuildingIds = buildings.map((building) => building.id);
  const selectedAddAllBuildings = allBuildingIds.length > 0 && addBuildingIds.length === allBuildingIds.length;
  const selectedEditAllBuildings = allBuildingIds.length > 0 && editBuildingIds.length === allBuildingIds.length;

  const serviceGroups = useMemo<ServiceGroup[]>(() => {
    const grouped = new Map<string, ServiceData[]>();
    services.forEach((service) => {
      const key = `${normalizeText(service.name)}__${normalizeText(service.type)}__${normalizeText(service.unit)}`;
      grouped.set(key, [...(grouped.get(key) || []), service]);
    });

    return Array.from(grouped.values()).map((items) => {
      const first = items[0];
      const prices = Array.from(new Set(items.map((item) => Number(item.price || 0))));
      const buildingIds = items.flatMap((item) =>
        item.buildingIds?.length
          ? item.buildingIds
          : typeof item.buildingId === 'number'
            ? [item.buildingId]
            : [],
      );
      const buildingNames = items.flatMap((item) =>
        item.buildingNames?.length
          ? item.buildingNames
          : item.buildingName
            ? [item.buildingName]
            : [],
      );

      return {
        ...first,
        items,
        serviceIds: items.map((item) => item.id),
        buildingIds: Array.from(new Set(buildingIds)),
        buildingNames: Array.from(new Set(buildingNames)),
        hasMixedPrices: prices.length > 1,
      };
    });
  }, [services]);

  const getBuildingLabel = (building: BuildingOption) => building.buildingName || building.name || `Tòa #${building.id}`;

  const toggleBuildingId = (
    buildingId: number,
    selectedIds: number[],
    setSelectedIds: Dispatch<SetStateAction<number[]>>,
  ) => {
    setSelectedIds(
      selectedIds.includes(buildingId)
        ? selectedIds.filter((id) => id !== buildingId)
        : [...selectedIds, buildingId],
    );
  };

  const setAllBuildings = (setSelectedIds: Dispatch<SetStateAction<number[]>>) => {
    setSelectedIds(allBuildingIds);
  };

  const handlePriceChange = (value: string) => {
    const normalized = value.replace(',', '.');
    if (!/^\d*(?:\.\d{0,2})?$/.test(normalized)) {
      setPriceError('Sai định dạng. Vui lòng điền định dạng số');
      return;
    }
    setAddPrice(normalized);
    setPriceError('');
  };

  const handleUpdatePriceChange = (value: string) => {
    const normalized = value.replace(',', '.');
    if (!/^\d*(?:\.\d{0,2})?$/.test(normalized)) {
      setUpdatePriceFormatError('Sai định dạng. Vui lòng điền định dạng số');
      return;
    }
    setUpdateNewPrice(normalized);
    setUpdatePriceFormatError('');
  };

  const handleServiceTypeChange = (nextType: ServiceTypeValue) => {
    setServiceType(nextType);
    setAddUnit(SERVICE_TYPE_DEFAULT_UNITS[nextType]);
    setUnitMenuOpen(false);
    setAddingCustomUnit(false);
  };

  const handleEditServiceTypeChange = (nextType: ServiceTypeValue) => {
    setEditServiceType(nextType);
    setEditUnit(SERVICE_TYPE_DEFAULT_UNITS[nextType]);
    setEditUnitMenuOpen(false);
    setEditAddingCustomUnit(false);
  };

  const saveCustomUnit = () => {
    const normalizedUnit = customUnit.trim();
    if (!normalizedUnit) return;

    const nextUnits = Array.from(new Set([...unitOptions, normalizedUnit]));
    setUnitOptions(nextUnits);
    setAddUnit(normalizedUnit);
    localStorage.setItem(
      SERVICE_UNITS_STORAGE_KEY,
      JSON.stringify(nextUnits.filter((unit) => !DEFAULT_SERVICE_UNITS.includes(unit))),
    );
    setCustomUnit('');
    setAddingCustomUnit(false);
    setUnitMenuOpen(false);
  };

  const saveEditCustomUnit = () => {
    const normalizedUnit = editCustomUnit.trim();
    if (!normalizedUnit) return;

    const nextUnits = Array.from(new Set([...unitOptions, normalizedUnit]));
    setUnitOptions(nextUnits);
    setEditUnit(normalizedUnit);
    localStorage.setItem(
      SERVICE_UNITS_STORAGE_KEY,
      JSON.stringify(nextUnits.filter((unit) => !DEFAULT_SERVICE_UNITS.includes(unit))),
    );
    setEditCustomUnit('');
    setEditAddingCustomUnit(false);
    setEditUnitMenuOpen(false);
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await serviceService.getAll();
      
      const serviceData: ServiceData[] = data
        .filter((service: any) => service.isActive !== false)
        .map((service: any) => ({
        id: service.id || 0,
        name: service.name || service.serviceName || service.tenDichVu || '',
        type: normalizeServiceType(service.serviceType || service.loaiDichVu, service.name || service.serviceName || service.tenDichVu),
        unit: service.unit || service.donVi || '',
        price: service.commonUnitPrice ?? service.unitPrice ?? service.donGia ?? 0,
        date: service.effectiveDate
          ? (() => { const d = new Date(service.effectiveDate); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })()
          : '—',
        effectiveDate: service.effectiveDate,
        mandatory: service.isMandatory !== undefined ? service.isMandatory : false,
        buildingId: service.buildingId ?? null,
        buildingName: service.buildingName ?? null,
        buildingIds: Array.isArray(service.buildingIds) ? service.buildingIds : [],
        buildingNames: Array.isArray(service.buildingNames) ? service.buildingNames : [],
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
    const normalizedType = normalizeServiceType(service.type, service.name) as ServiceTypeValue;
    setEditName(service.name || '');
    setEditServiceType(SERVICE_TYPES.includes(normalizedType) ? normalizedType : 'Cố định khác');
    setEditUnit(service.unit || SERVICE_TYPE_DEFAULT_UNITS['Cố định khác']);
    const scopedBuildingIds = service.buildingIds?.length ? service.buildingIds : service.buildingId ? [service.buildingId] : [];
    setEditScopeMode(scopedBuildingIds.length > 0 ? 'private' : 'common');
    setEditBuildingIds(scopedBuildingIds);
    setUpdateNewPrice(service.price ? String(Number(service.price) / 1_000) : '');
    setUpdateEffectiveDate(service.effectiveDate ? formatLocalDateInput(new Date(service.effectiveDate)) : formatLocalDateInput());
    setUpdateReason('');
    setUpdateError(null);
    setUpdatePriceScale('thousand');
    setUpdatePriceFormatError('');
    setEditUnitMenuOpen(false);
    setEditAddingCustomUnit(false);
    setEditCustomUnit('');
    setShowUpdatePriceConfirm(false);
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
    setAddScopeMode('common');
    setAddBuildingIds([]);
    setPriceScale('thousand'); setPriceError(''); setUnitMenuOpen(false); setAddingCustomUnit(false); setCustomUnit('');
    setServiceType('Cố định khác');
    setAddUnit(SERVICE_TYPE_DEFAULT_UNITS['Cố định khác']);
    setShowAddModal(true);
  };

  const handleAddSubmit = async () => {
    if (addScopeMode === 'private' && addBuildingIds.length === 0) {
      setAddError('Vui lòng chọn ít nhất 1 tòa nhà trước khi thêm dịch vụ');
      return;
    }
    if (!addName.trim() || !addUnit || !addPrice) {
      setAddError('Vui lòng nhập tên dịch vụ, chọn đơn vị tính và đơn giá');
      return;
    }
    if (priceError || !Number.isFinite(addPriceVnd) || addPriceVnd <= 0) {
      setPriceError('Đơn giá phải là số lớn hơn 0');
      setAddError('Vui lòng kiểm tra lại đơn giá');
      return;
    }
    setAddLoading(true); setAddError(null);
    try {
      await serviceService.create({
        name: addName.trim(),
        serviceType,
        unit: addUnit.trim() || undefined,
        commonUnitPrice: addPriceVnd,
        effectiveDate: toLocalIsoString(addEffectiveDate),
        buildingIds: addScopeMode === 'common' ? [] : addBuildingIds,
      } as any);
      await fetchServices();
      setShowAddModal(false);
    } catch (err: any) {
      setAddError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setAddLoading(false);
    }
  };

  const formatEffectiveDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  };

  const handleUpdatePriceSubmit = () => {
    if (editScopeMode === 'private' && editBuildingIds.length === 0) {
      setUpdateError('Vui lòng chọn ít nhất 1 tòa nhà');
      return;
    }
    if (!editName.trim() || !editUnit) {
      setUpdateError('Vui lòng nhập tên dịch vụ và chọn đơn vị tính');
      return;
    }
    if (!updateNewPrice) {
      setUpdateError('Vui lòng nhập đơn giá');
      return;
    }
    if (!updateEffectiveDate) {
      setUpdateError('Vui lòng chọn ngày áp dụng');
      return;
    }
    if (updatePriceFormatError || !Number.isFinite(updatePriceVnd) || updatePriceVnd <= 0) {
      setUpdateError('Đơn giá mới phải là số lớn hơn 0');
      return;
    }
    setUpdateError(null);
    setShowUpdatePriceConfirm(true);
  };

  const confirmUpdatePrice = async () => {
    setUpdateLoading(true); setUpdateError(null);
    try {
      const serviceName = editName.trim();
      const basePayload = {
        name: serviceName,
        serviceType: editServiceType,
        unit: editUnit.trim() || undefined,
        commonUnitPrice: updatePriceVnd,
        effectiveDate: toLocalIsoString(updateEffectiveDate),
        reason: updateReason.trim() || undefined,
        buildingIds: editScopeMode === 'common' ? [] : editBuildingIds,
      };
      await serviceService.update(selectedService.id, basePayload as any);
      await fetchServices();
      setShowUpdatePriceConfirm(false);
      setShowUpdatePriceModal(false);
    } catch (err: any) {
      setShowUpdatePriceConfirm(false);
      setUpdateError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true); setDeleteError(null);
    try {
      await serviceService.delete(selectedService.id);
      setServices((current) => current.filter((service) => service.id !== selectedService.id));
      setShowDeleteModal(false);
      setSelectedService(null);
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
      <PageHeader
        eyebrow="Quản lý hạ tầng"
        title="Dịch vụ & đơn giá"
        description="Quản lý danh mục dịch vụ, đơn vị tính, đơn giá hiện tại và lịch sử cập nhật giá."
        actions={
          <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded flex items-center space-x-2 hover:bg-gray-700"
          >
            <Plus size={16} />
            <span>Thêm dịch vụ mới</span>
          </button>
        }
      />
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-lg text-gray-800">Danh mục dịch vụ & Đơn giá - {serviceGroups.length} dịch vụ</h2>
        </div>
        
        {serviceGroups.length === 0 ? (
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
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Tòa nhà</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Loại dịch vụ</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Đơn vị tính</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Đơn giá hiện tại (VNĐ)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Ngày áp dụng</th>
                  <th className="px-6 py-3 text-center text-sm text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {serviceGroups.map((service) => (
                  <tr key={service.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">{service.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {service.buildingNames.length > 0 ? `${service.buildingNames.length} tòa nhà` : 'Chưa gắn tòa'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className={`admin-status-badge inline-block px-3 py-1 text-xs rounded border ${
                        service.type === 'Điện'
                          ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                          : service.type === 'Nước'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : service.type === 'Gửi xe'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : service.type === 'Theo người'
                                ? 'bg-green-50 text-green-800 border-green-200'
                                : 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}>
                        {service.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{service.unit}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 text-right">
                      {service.hasMixedPrices
                        ? 'Nhiều mức giá'
                        : typeof service.price === 'number'
                          ? service.price.toLocaleString('vi-VN')
                          : service.price}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{service.date}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleUpdatePriceClick(service)}
                          className="p-2 hover:bg-gray-100 rounded"
                          title="Sửa dịch vụ"
                          aria-label="Sửa dịch vụ"
                        >
                          <Edit2 size={16} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleShowHistory(service)}
                          className="p-2 hover:bg-gray-100 rounded"
                          title="Xem lịch sử thay đổi"
                        >
                          <History size={16} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(service)}
                          className="p-2 hover:bg-red-50 rounded"
                          title="Xóa dịch vụ"
                        >
                          <Trash2 size={16} className="text-red-600" />
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
      
      {/* Info Box */}
      <div className="bg-gray-100 border border-gray-300 rounded p-4">
        <p className="text-sm text-gray-700">
          <strong>Lưu ý:</strong> Khi cập nhật đơn giá mới, hệ thống sẽ lưu lịch sử thay đổi để đảm bảo các hóa đơn cũ không bị ảnh hưởng.
        </p>
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="admin-content-modal-overlay">
          <div className="admin-content-modal-panel admin-content-modal-panel--narrow">
            <div className="admin-content-modal-header flex items-center justify-between px-6 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <DollarSign size={21} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg text-gray-800">Thêm dịch vụ mới</h3>
                  <p className="mt-0.5 text-xs text-gray-500">Thiết lập loại phí, đơn vị tính và đơn giá áp dụng.</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="product-action-icon" aria-label="Đóng">
                <X size={19} />
              </button>
            </div>
            
            <div className="space-y-5 overflow-y-auto px-6 py-5">
              {/* Service Name */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Phạm vi áp dụng *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAddScopeMode('common')}
                      className={`border px-3 py-2 text-left text-sm ${addScopeMode === 'common' ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      Áp dụng chung
                      <span className="mt-1 block text-xs text-gray-500">Tất cả tòa nhà hiện tại và tòa thêm sau.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddScopeMode('private')}
                      className={`border px-3 py-2 text-left text-sm ${addScopeMode === 'private' ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      Áp dụng riêng
                      <span className="mt-1 block text-xs text-gray-500">Chọn một hoặc nhiều tòa cụ thể.</span>
                    </button>
                  </div>
                </div>

                {addScopeMode === 'private' && (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-sm text-gray-700">Tòa nhà áp dụng *</label>
                    <button
                      type="button"
                      onClick={() => setAllBuildings(setAddBuildingIds)}
                      disabled={selectedAddAllBuildings || buildings.length === 0}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800 disabled:text-gray-400"
                    >
                      Chọn tất cả
                    </button>
                  </div>
                  <div className="max-h-44 overflow-y-auto border border-gray-300 bg-white">
                    {buildings.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-500">Chưa có tòa nhà để chọn.</p>
                    ) : (
                      buildings.map((building) => (
                        <label key={building.id} className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={addBuildingIds.includes(building.id)}
                            onChange={() => toggleBuildingId(building.id, addBuildingIds, setAddBuildingIds)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-gray-800">{getBuildingLabel(building)}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Đã chọn {addBuildingIds.length}/{buildings.length} tòa nhà.</p>
                </div>
                )}
                <div className="grid grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Loại dịch vụ *</label>
                    <select
                      value={serviceType}
                      onChange={(event) => handleServiceTypeChange(event.target.value as ServiceTypeValue)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
                    >
                      {SERVICE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                

              {/* Unit & Price */}
                <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm text-gray-700 mb-2">Đơn vị tính *</label>
                  <button
                    type="button"
                    onClick={() => setUnitMenuOpen((open) => !open)}
                    className="service-unit-trigger flex w-full items-center justify-between px-3 text-left text-sm"
                  >
                    <span className={addUnit ? 'text-gray-800' : 'text-gray-400'}>
                      {addUnit || 'Chọn đơn vị tính'}
                    </span>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${unitMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {unitMenuOpen && (
                    <div className="app-dropdown-menu absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded border border-gray-300 bg-white shadow-lg">
                      <div className="max-h-52 overflow-y-auto p-1">
                        {unitOptions.map((unit) => (
                          <button
                            key={unit}
                            type="button"
                            onClick={() => {
                              setAddUnit(unit);
                              setUnitMenuOpen(false);
                              setAddingCustomUnit(false);
                            }}
                            className={`app-dropdown-item flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-gray-700 ${addUnit === unit ? 'is-selected' : ''}`}
                          >
                            <span>{unit}</span>
                            {addUnit === unit && <Check size={15} className="text-blue-600" />}
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-gray-200 p-2">
                        {addingCustomUnit ? (
                          <div className="flex gap-2">
                            <input
                              autoFocus
                              type="text"
                              value={customUnit}
                              onChange={(event) => setCustomUnit(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  saveCustomUnit();
                                }
                              }}
                              placeholder="Nhập đơn vị mới"
                              className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                            />
                            <button type="button" onClick={saveCustomUnit} disabled={!customUnit.trim()} className="rounded bg-gray-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">
                              LƯU
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAddingCustomUnit(true)}
                            className="app-dropdown-item flex w-full items-center justify-center gap-1 rounded px-3 py-2 text-sm font-semibold text-blue-700"
                          >
                            <Plus size={15} />
                            THÊM ĐƠN VỊ
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Đơn giá *</label>
                  {priceError && <p className="mb-1.5 text-xs text-red-600">{priceError}</p>}
                  <div className={`service-price-control ${priceError ? 'is-error' : ''}`}>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={priceScale === 'million' ? 'VD: 1.5' : priceScale === 'thousand' ? 'VD: 3.5' : 'VD: 500'}
                      value={addPrice}
                      onChange={(event) => handlePriceChange(event.target.value)}
                      className="service-price-input min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm focus:outline-none"
                    />
                    <select
                      value={priceScale}
                      onChange={(event) => setPriceScale(event.target.value as 'unit' | 'thousand' | 'million')}
                      className="service-price-scale border-0 border-l border-gray-300 bg-gray-50 px-2 text-sm focus:outline-none"
                    >
                      <option value="unit">VNĐ</option>
                      <option value="thousand">nghìn</option>
                      <option value="million">triệu</option>
                    </select>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">
                    {addPriceVnd > 0
                      ? `Tương đương ${addPriceVnd.toLocaleString('vi-VN')} VNĐ/${addUnit || 'đơn vị'}`
                      : 'Ví dụ: nhập 1 và chọn “triệu” = 1.000.000 VNĐ'}
                  </p>
                </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}
            </div>
            
            <div className="admin-content-modal-footer flex items-center justify-end space-x-3 px-6 py-4">
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

      {/* Edit Service Modal */}
      {showUpdatePriceModal && selectedService && (
        <div className="admin-content-modal-overlay">
          <div className="admin-content-modal-panel admin-content-modal-panel--narrow">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign size={20} className="text-gray-800" />
                <h3 className="text-lg text-gray-800">Sửa dịch vụ - {selectedService.name}</h3>
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
                  <p className="text-blue-700">Tên dịch vụ:</p>
                  <p className="text-blue-900 font-bold">{selectedService.name || '—'}</p>
                  <p className="text-blue-700">Phạm vi áp dụng:</p>
                  <p className="text-blue-900">{selectedService.buildingName || 'Tất cả tòa nhà'}</p>
                  <p className="text-blue-700">Loại dịch vụ:</p>
                  <p className="text-blue-900">{selectedService.type || '—'}</p>
                  <p className="text-blue-700">Đơn vị tính:</p>
                  <p className="text-blue-900">{selectedService.unit || '—'}</p>
                  <p className="text-blue-700">Đơn giá hiện tại:</p>
                  <p className="text-blue-900 font-bold">{Number(selectedService.price || 0).toLocaleString('vi-VN')} VNĐ</p>
                  <p className="text-blue-700">Ngày áp dụng:</p>
                  <p className="text-blue-900">{selectedService.date || '—'}</p>
                </div>
              </div>

              
                <div>
                  <p className="text-sm font-semibold text-gray-800">Thông tin dịch vụ</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Phạm vi áp dụng *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditScopeMode('common')}
                      className={`border px-3 py-2 text-left text-sm ${editScopeMode === 'common' ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      Áp dụng chung
                      <span className="mt-1 block text-xs text-gray-500">Tất cả tòa nhà hiện tại và tòa thêm sau.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditScopeMode('private')}
                      className={`border px-3 py-2 text-left text-sm ${editScopeMode === 'private' ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      Áp dụng riêng
                      <span className="mt-1 block text-xs text-gray-500">Chọn một hoặc nhiều tòa cụ thể.</span>
                    </button>
                  </div>
                </div>

                {editScopeMode === 'private' && (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-sm text-gray-700">Tòa nhà áp dụng *</label>
                    <button
                      type="button"
                      onClick={() => setAllBuildings(setEditBuildingIds)}
                      disabled={selectedEditAllBuildings || buildings.length === 0}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800 disabled:text-gray-400"
                    >
                      Chọn tất cả
                    </button>
                  </div>
                  <div className="max-h-44 overflow-y-auto border border-gray-300 bg-white">
                    {buildings.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-500">Chưa có tòa nhà để chọn.</p>
                    ) : (
                      buildings.map((building) => (
                        <label key={building.id} className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={editBuildingIds.includes(building.id)}
                            onChange={() => toggleBuildingId(building.id, editBuildingIds, setEditBuildingIds)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-gray-800">{getBuildingLabel(building)}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Đã chọn {editBuildingIds.length}/{buildings.length} tòa nhà.</p>
                </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Tên dịch vụ *</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Loại dịch vụ *</label>
                    <select
                      value={editServiceType}
                      onChange={(event) => handleEditServiceTypeChange(event.target.value as ServiceTypeValue)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
                    >
                      {SERVICE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-sm text-gray-700 mb-2">Đơn vị tính *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setEditUnitMenuOpen((open) => !open)}
                    className="service-unit-trigger flex w-full items-center justify-between px-3 text-left text-sm"
                  >
                    <span className={editUnit ? 'text-gray-800' : 'text-gray-400'}>
                      {editUnit || 'Chọn đơn vị tính'}
                    </span>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${editUnitMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {editUnitMenuOpen && (
                    <div className="app-dropdown-menu absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded border border-gray-300 bg-white shadow-lg">
                      <div className="max-h-52 overflow-y-auto p-1">
                        {unitOptions.map((unit) => (
                          <button
                            key={unit}
                            type="button"
                            onClick={() => {
                              setEditUnit(unit);
                              setEditUnitMenuOpen(false);
                              setEditAddingCustomUnit(false);
                            }}
                            className={`app-dropdown-item flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-gray-700 ${editUnit === unit ? 'is-selected' : ''}`}
                          >
                            <span>{unit}</span>
                            {editUnit === unit && <Check size={15} className="text-blue-600" />}
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-gray-200 p-2">
                        {editAddingCustomUnit ? (
                          <div className="flex gap-2">
                            <input
                              autoFocus
                              type="text"
                              value={editCustomUnit}
                              onChange={(event) => setEditCustomUnit(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  saveEditCustomUnit();
                                }
                              }}
                              placeholder="Nhập đơn vị mới"
                              className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                            />
                            <button type="button" onClick={saveEditCustomUnit} disabled={!editCustomUnit.trim()} className="rounded bg-gray-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">
                              LƯU
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditAddingCustomUnit(true)}
                            className="app-dropdown-item flex w-full items-center justify-center gap-1 rounded px-3 py-2 text-sm font-semibold text-blue-700"
                          >
                            <Plus size={15} />
                            THÊM ĐƠN VỊ
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                </div>

              {/* Price */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Đơn giá *</label>
                {updatePriceFormatError && <p className="mb-1.5 text-xs text-red-600">{updatePriceFormatError}</p>}
                <div className={`service-price-control ${updatePriceFormatError ? 'is-error' : ''}`}>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={updatePriceScale === 'million' ? 'VD: 1.5' : updatePriceScale === 'thousand' ? 'VD: 30' : String(selectedService.price)}
                    value={updateNewPrice}
                    onChange={(event) => handleUpdatePriceChange(event.target.value)}
                    className="service-price-input min-w-0 flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
                  />
                  <select
                    value={updatePriceScale}
                    onChange={(event) => setUpdatePriceScale(event.target.value as 'unit' | 'thousand' | 'million')}
                    className="service-price-scale px-2 text-sm focus:outline-none"
                  >
                    <option value="unit">VNĐ</option>
                    <option value="thousand">nghìn</option>
                    <option value="million">triệu</option>
                  </select>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  {updatePriceVnd > 0
                    ? `Tương đương ${updatePriceVnd.toLocaleString('vi-VN')} VNĐ/${editUnit || 'đơn vị'}`
                    : 'Ví dụ: nhập 40 và chọn “nghìn” = 40.000 VNĐ'}
                </p>
              </div>
              </div>

              {/* Apply Date */}
              <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Ngày áp dụng *</label>
                <input 
                  type="date"
                  value={updateEffectiveDate}
                  onChange={e => setUpdateEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Thông tin/giá mới chỉ áp dụng từ ngày này trở đi. Các hóa đơn cũ vẫn giữ nguyên giá
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

      {showUpdatePriceConfirm && selectedService && (
        <div className="admin-content-modal-overlay">
          <div className="admin-content-modal-panel admin-content-modal-panel--narrow">
            <div className="admin-content-modal-header flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                  <AlertTriangle size={21} />
                </div>
                <div>
                  <h3 className="text-lg text-gray-800">Xác nhận sửa dịch vụ</h3>
                  <p className="mt-0.5 text-xs text-gray-500">Thao tác này sẽ cập nhật thông tin dịch vụ.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUpdatePriceConfirm(false)}
                disabled={updateLoading}
                className="product-action-icon"
                aria-label="Đóng"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <p className="text-sm leading-6 text-gray-700">
                Bạn có chắc chắn muốn cập nhật dịch vụ này không?
              </p>
            </div>

            <div className="admin-content-modal-footer flex items-center justify-end gap-3 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowUpdatePriceConfirm(false)}
                disabled={updateLoading}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={confirmUpdatePrice}
                disabled={updateLoading}
                className="flex items-center gap-2 rounded bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {updateLoading && <Loader2 size={14} className="animate-spin" />}
                <span>Xác nhận sửa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {showHistoryModal && selectedService && (
        <div className="admin-content-modal-overlay">
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
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedService && (
        <div className="admin-content-modal-overlay">
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
                  <p className="text-sm text-gray-800"><strong>Loại dịch vụ:</strong> {selectedService.type}</p>
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
