import { Plus, Edit2, Trash2, X, AlertTriangle, History, DollarSign, Loader2, FileX, Filter } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { buildingService, serviceService, ServicePriceHistory } from '../../services/api.service';
import { formatDisplayDate, formatLocalDateInput, toLocalIsoString } from '../../lib/date-utils';
import { PageHeader } from '../ui/product-system';
import { FilterSelect } from '../ui/FilterSelect';
import { DateTextInput } from '../ui/DateTextInput';

const SERVICE_TYPES = ['Điện', 'Nước', 'Cần nhập số lượng', 'Theo tháng'] as const;
type ServiceTypeValue = typeof SERVICE_TYPES[number];
const SERVICE_TYPE_DEFAULT_UNITS: Record<ServiceTypeValue, string> = {
  'Điện': 'kWh',
  'Nước': 'm³',
  'Cần nhập số lượng': 'Lần',
  'Theo tháng': 'Tháng',
};

interface ServiceData {
  id: number;
  name: string;
  type: string;
  unit: string;
  price: number;
  configuredPrice: number;
  scheduledPrice?: number;
  scheduledEffectiveDate?: string;
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
    return 'Cần nhập số lượng';
  }
  if (searchable.includes('nguoi') || searchable.includes('person')) {
    return 'Cần nhập số lượng';
  }
  if (value.includes('cố định') || value.includes('co dinh') || value.includes('fixed')) {
    return 'Theo tháng';
  }

  return raw?.trim() || 'Theo tháng';
};

interface ServiceTableProps {
  embedded?: boolean;
  contextBuildingId?: number | null;
  inlineForms?: boolean;
}

export function ServiceTable({ embedded = false, contextBuildingId = null, inlineForms = false }: ServiceTableProps = {}) {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdatePriceModal, setShowUpdatePriceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [serviceType, setServiceType] = useState<ServiceTypeValue>('Theo tháng');
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<'all' | ServiceTypeValue>('all');
  const [serviceBuildingFilter, setServiceBuildingFilter] = useState('all');

  // Add form state
  const [addName, setAddName] = useState('');
  const [addUnit, setAddUnit] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addEffectiveDate, setAddEffectiveDate] = useState(() => formatLocalDateInput());
  const [addBuildingIds, setAddBuildingIds] = useState<number[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
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
  const [editServiceType, setEditServiceType] = useState<ServiceTypeValue>('Theo tháng');
  const [editUnit, setEditUnit] = useState('');
  const [editBuildingIds, setEditBuildingIds] = useState<number[]>([]);

  // Price history state
  const [priceHistory, setPriceHistory] = useState<ServicePriceHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
    fetchBuildings();
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

  const serviceGroups = useMemo<ServiceGroup[]>(() => {
    const grouped = new Map<string, ServiceData[]>();
    services.forEach((service) => {
      const scopedBuildingIds = service.buildingIds?.length
        ? service.buildingIds
        : typeof service.buildingId === 'number'
          ? [service.buildingId]
          : [];
      const scopeKey = scopedBuildingIds.length > 0
        ? `private:${[...scopedBuildingIds].sort((a, b) => a - b).join(',')}`
        : 'common';
      const key = `${normalizeText(service.name)}__${normalizeText(service.type)}__${normalizeText(service.unit)}__${scopeKey}`;
      grouped.set(key, [...(grouped.get(key) || []), service]);
    });

    return Array.from(grouped.values())
      .map((items) => {
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
      })
      .sort((first, second) => {
        const firstIsCommon = first.buildingIds.length === 0;
        const secondIsCommon = second.buildingIds.length === 0;
        if (firstIsCommon !== secondIsCommon) return firstIsCommon ? 1 : -1;

        const firstBuilding = firstIsCommon ? 'Chưa gắn tòa' : (first.buildingNames[0] || `Tòa #${first.buildingIds[0]}`);
        const secondBuilding = secondIsCommon ? 'Chưa gắn tòa' : (second.buildingNames[0] || `Tòa #${second.buildingIds[0]}`);
        const buildingCompare = firstBuilding.localeCompare(secondBuilding, 'vi');
        if (buildingCompare !== 0) return buildingCompare;

        return first.name.localeCompare(second.name, 'vi');
      });
  }, [services]);

  const getServiceBuildingDisplay = (service: ServiceGroup) => {
    if (service.buildingIds.length === 0) {
      return 'Chưa gắn tòa';
    }

    if (service.buildingIds.length > 1) {
      return `${service.buildingIds.length} tòa nhà`;
    }

    if (service.buildingNames.length > 0) {
      return service.buildingNames[0];
    }

    return `Tòa #${service.buildingIds[0]}`;
  };

  const filteredServiceGroups = useMemo(() => {
    const normalizedSearch = normalizeText(serviceSearch);

    return serviceGroups.filter((service) => {
      const buildingDisplay = getServiceBuildingDisplay(service);
      const searchableText = normalizeText([
        service.name,
        service.type,
        service.unit,
        service.date,
        buildingDisplay,
        service.hasMixedPrices ? 'Nhiều mức giá' : String(service.price ?? ''),
      ].join(' '));

      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesType = serviceTypeFilter === 'all' || service.type === serviceTypeFilter;
      const matchesContextBuilding =
        typeof contextBuildingId === 'number'
          ? service.buildingIds.includes(contextBuildingId)
          : true;
      const matchesManualBuilding =
        typeof contextBuildingId === 'number'
          || serviceBuildingFilter === 'all'
          || (serviceBuildingFilter === 'common' && service.buildingIds.length === 0)
          || (serviceBuildingFilter !== 'common'
            && service.buildingIds.includes(Number(serviceBuildingFilter)));

      return matchesSearch && matchesType && matchesContextBuilding && matchesManualBuilding;
    });
  }, [contextBuildingId, serviceGroups, serviceSearch, serviceTypeFilter, serviceBuildingFilter]);

  const getBuildingLabel = (building: BuildingOption) => building.buildingName || building.name || `Tòa #${building.id}`;
  const getContextBuildingLabel = () => {
    if (typeof contextBuildingId !== 'number') return '';
    const building = buildings.find((item) => item.id === contextBuildingId);
    return building ? getBuildingLabel(building) : `Tòa #${contextBuildingId}`;
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
  };

  const handleEditServiceTypeChange = (nextType: ServiceTypeValue) => {
    setEditServiceType(nextType);
    setEditUnit(SERVICE_TYPE_DEFAULT_UNITS[nextType]);
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
        price: service.currentUnitPrice ?? service.commonUnitPrice ?? service.unitPrice ?? service.donGia ?? 0,
        configuredPrice: service.commonUnitPrice ?? service.unitPrice ?? service.donGia ?? 0,
        scheduledPrice: service.scheduledUnitPrice,
        scheduledEffectiveDate: service.scheduledEffectiveDate,
        date: formatDisplayDate(service.scheduledEffectiveDate ?? service.effectiveDate),
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
    setEditServiceType(SERVICE_TYPES.includes(normalizedType) ? normalizedType : 'Theo tháng');
    setEditUnit(service.unit || SERVICE_TYPE_DEFAULT_UNITS['Theo tháng']);
    const scopedBuildingIds = service.buildingIds?.length ? service.buildingIds : service.buildingId ? [service.buildingId] : [];
    setEditBuildingIds(scopedBuildingIds);
    setUpdateNewPrice(service.configuredPrice ? String(Number(service.configuredPrice) / 1_000) : '');
    setUpdateEffectiveDate(service.effectiveDate ? formatLocalDateInput(new Date(service.effectiveDate)) : formatLocalDateInput());
    setUpdateReason('');
    setUpdateError(null);
    setUpdatePriceScale('thousand');
    setUpdatePriceFormatError('');
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
    setAddBuildingIds(typeof contextBuildingId === 'number' ? [contextBuildingId] : []);
    setPriceScale('thousand'); setPriceError('');
    setServiceType('Theo tháng');
    setAddUnit(SERVICE_TYPE_DEFAULT_UNITS['Theo tháng']);
    setShowAddModal(true);
  };

  const handleAddSubmit = async () => {
    const targetBuildingIds = typeof contextBuildingId === 'number' ? [contextBuildingId] : addBuildingIds;
    if (targetBuildingIds.length === 0) {
      setAddError('Vui lòng chọn tòa nhà áp dụng trước khi thêm dịch vụ');
      return;
    }
    if (!addName.trim() || !addUnit || !addPrice) {
      setAddError('Vui lòng nhập tên dịch vụ, loại dịch vụ và đơn giá');
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
        buildingIds: targetBuildingIds,
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
    const targetBuildingIds = typeof contextBuildingId === 'number' ? [contextBuildingId] : editBuildingIds;
    if (targetBuildingIds.length === 0) {
      setUpdateError('Vui lòng chọn tòa nhà áp dụng');
      return;
    }
    if (!editName.trim() || !editUnit) {
      setUpdateError('Vui lòng nhập tên dịch vụ và loại dịch vụ');
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
        buildingIds: typeof contextBuildingId === 'number' ? [contextBuildingId] : editBuildingIds,
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
      {!embedded && (
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
      )}
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--primary)]">Danh mục dịch vụ & Đơn giá - {filteredServiceGroups.length}/{serviceGroups.length} dịch vụ</h2>
            {embedded && (
              <button
                onClick={openAddModal}
                className="ml-auto inline-flex shrink-0 items-center gap-1.5 bg-gray-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700"
              >
                <Plus size={14} />
                <span>Thêm dịch vụ mới</span>
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Filter size={18} style={{ color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }} />
            <input
              type="text"
              value={serviceSearch}
              onChange={(event) => setServiceSearch(event.target.value)}
              placeholder="Tìm tên dịch vụ, tòa nhà, loại, đơn vị..."
              style={{
                padding: '7px 12px',
                border: '1px solid var(--surface-border)',
                borderRadius: 'var(--radius-button)',
                fontSize: '14px',
                width: '260px',
                minWidth: '260px',
                maxWidth: '260px',
                flex: '0 0 260px',
                backgroundColor: 'var(--surface-card)',
                color: 'var(--text-primary)',
              }}
            />
            <FilterSelect
              value={serviceTypeFilter}
              onChange={(event) => setServiceTypeFilter(event.target.value as 'all' | ServiceTypeValue)}
              wrapperClassName="w-[180px] min-w-[180px] max-w-[180px] flex-none"
              className="w-full"
              style={{ width: '100%', minWidth: 0, maxWidth: '100%' }}
            >
              <option value="all">Tất cả loại</option>
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </FilterSelect>
            <button
              type="button"
              onClick={() => {
                setServiceSearch('');
                setServiceTypeFilter('all');
                setServiceBuildingFilter('all');
              }}
              disabled={!serviceSearch && serviceTypeFilter === 'all' && serviceBuildingFilter === 'all'}
              className="w-[78px] min-w-[78px] max-w-[78px] flex-none px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:pointer-events-none"
              style={{ visibility: (serviceSearch || serviceTypeFilter !== 'all' || serviceBuildingFilter !== 'all') ? 'visible' : 'hidden' }}
            >
              Xóa lọc
            </button>
            <div style={{ flex: 1 }} />
          </div>
        </div>
        
        {serviceGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <FileX size={48} className="text-gray-300" />
            <p className="text-gray-500">Chưa có dịch vụ nào được cấu hình</p>
          </div>
        ) : filteredServiceGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <FileX size={48} className="text-gray-300" />
            <p className="text-gray-500">Không tìm thấy dịch vụ phù hợp với bộ lọc</p>
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
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Đơn giá (VNĐ)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Ngày áp dụng</th>
                  <th className="px-6 py-3 text-center text-sm text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredServiceGroups.map((service) => (
                  <tr key={service.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">{service.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {getServiceBuildingDisplay(service)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className={`admin-status-badge inline-block px-3 py-1 text-xs rounded border ${
                        service.type === 'Điện'
                          ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                          : service.type === 'Nước'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : service.type === 'Cần nhập số lượng'
                                ? 'bg-green-50 text-green-800 border-green-200'
                                : 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}>
                        {service.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{service.unit}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 text-right">
                      {service.hasMixedPrices ? (
                        'Nhiều mức giá'
                      ) : (
                        <>
                          <span className="block">{service.price.toLocaleString('vi-VN')}</span>
                          {typeof service.scheduledPrice === 'number' && (
                            <span className="mt-1 block text-xs text-amber-700">
                              Sắp áp dụng: {service.scheduledPrice.toLocaleString('vi-VN')}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {service.scheduledEffectiveDate ? (
                        <>
                          <span className="block text-xs text-gray-500">Giá mới từ</span>
                          <span>{formatDisplayDate(service.scheduledEffectiveDate)}</span>
                        </>
                      ) : service.date}
                    </td>
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
      
      

      {/* Add Service Modal */}
      {showAddModal && (
        <div className={inlineForms ? "border border-[var(--brand-border)] bg-white shadow-sm" : "admin-content-modal-overlay"}>
          <div className={inlineForms ? "w-full bg-white" : "admin-content-modal-panel admin-content-modal-panel--narrow"}>
            <div className={`admin-content-modal-header flex items-center justify-between px-6 py-4 ${inlineForms ? 'bg-[var(--brand-surface)]' : ''}`}>
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
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-sm text-gray-700">Tòa nhà áp dụng *</label>
                  </div>
                  {typeof contextBuildingId === 'number' ? (
                    <div className="border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900">
                      {getContextBuildingLabel()}
                    </div>
                  ) : (
                    <>
                      <div className="max-h-44 overflow-y-auto border border-gray-300 bg-white">
                        {buildings.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-gray-500">Chưa có tòa nhà để chọn.</p>
                        ) : (
                          buildings.map((building) => (
                            <label key={building.id} className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0 hover:bg-gray-50">
                              <input
                                type="radio"
                                name="add-service-building"
                                checked={addBuildingIds.includes(building.id)}
                                onChange={() => setAddBuildingIds([building.id])}
                                className="h-4 w-4"
                              />
                              <span className="text-sm text-gray-800">{getBuildingLabel(building)}</span>
                            </label>
                          ))
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Mỗi dịch vụ được thiết lập theo một tòa nhà.</p>
                    </>
                  )}
                </div>
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
                

              {/* Price */}
                <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Ngày áp dụng *</label>
                  <DateTextInput
                    value={addEffectiveDate}
                    onChange={setAddEffectiveDate}
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
        <div className={inlineForms ? "border border-[var(--brand-border)] bg-white shadow-sm" : "admin-content-modal-overlay"}>
          <div className={inlineForms ? "w-full bg-white" : "admin-content-modal-panel admin-content-modal-panel--narrow"}>
            <div className={`border-b border-gray-300 px-6 py-4 flex items-center justify-between ${inlineForms ? 'bg-[var(--brand-surface)]' : ''}`}>
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
                  <p className="text-blue-700">Tòa nhà áp dụng:</p>
                  <p className="text-blue-900">{getServiceBuildingDisplay(selectedService) || 'Chưa gắn tòa'}</p>
                  <p className="text-blue-700">Loại dịch vụ:</p>
                  <p className="text-blue-900">{selectedService.type || '—'}</p>
                  <p className="text-blue-700">Đơn vị tính:</p>
                  <p className="text-blue-900">{selectedService.unit || '—'}</p>
                  <p className="text-blue-700">Đơn giá hiện tại:</p>
                  <p className="text-blue-900 font-bold">{Number(selectedService.price || 0).toLocaleString('vi-VN')} VNĐ</p>
                  {typeof selectedService.scheduledPrice === 'number' && (
                    <>
                      <p className="text-amber-700">Đơn giá sắp áp dụng:</p>
                      <p className="font-bold text-amber-800">
                        {Number(selectedService.scheduledPrice).toLocaleString('vi-VN')} VNĐ
                        {selectedService.scheduledEffectiveDate
                          ? ` từ ${formatDisplayDate(selectedService.scheduledEffectiveDate)}`
                          : ''}
                      </p>
                    </>
                  )}
                  <p className="text-blue-700">Ngày áp dụng:</p>
                  <p className="text-blue-900">{selectedService.date || '—'}</p>
                </div>
              </div>

              
                <div>
                  <p className="text-sm font-semibold text-gray-800">Thông tin dịch vụ</p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-sm text-gray-700">Tòa nhà áp dụng *</label>
                  </div>
                  {typeof contextBuildingId === 'number' ? (
                    <div className="border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900">
                      {getContextBuildingLabel()}
                    </div>
                  ) : (
                    <>
                      <div className="max-h-44 overflow-y-auto border border-gray-300 bg-white">
                        {buildings.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-gray-500">Chưa có tòa nhà để chọn.</p>
                        ) : (
                          buildings.map((building) => (
                            <label key={building.id} className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0 hover:bg-gray-50">
                              <input
                                type="radio"
                                name="edit-service-building"
                                checked={editBuildingIds.includes(building.id)}
                                onChange={() => setEditBuildingIds([building.id])}
                                className="h-4 w-4"
                              />
                              <span className="text-sm text-gray-800">{getBuildingLabel(building)}</span>
                            </label>
                          ))
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Mỗi dịch vụ được thiết lập theo một tòa nhà.</p>
                    </>
                  )}
                </div>

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

              <div>
                <label className="block text-sm text-gray-700 mb-2">Ngày áp dụng *</label>
                <DateTextInput
                  value={updateEffectiveDate}
                  onChange={setUpdateEffectiveDate}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Thông tin/giá mới chỉ áp dụng từ ngày này trở đi. Các hóa đơn cũ vẫn giữ nguyên giá
                </p>
              </div>
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
                  <p className="mt-0.5 text-xs text-gray-500">Thao tác này có thể ảnh hưởng đến hợp đồng đang dùng dịch vụ.</p>
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
                Bạn có chắc chắn muốn cập nhật đơn giá dịch vụ <strong>{selectedService.name}</strong> không?
              </p>
              <div className="rounded border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-900">
                <p className="font-semibold">Lưu ý trước khi xác nhận:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Giá dịch vụ trong các hợp đồng/phòng đang sử dụng dịch vụ này sẽ được cập nhật theo ngày áp dụng.</li>
                  <li>Hệ thống sẽ gửi thông báo thay đổi giá đến app của cư dân thuộc các phòng có hợp đồng liên quan.</li>
                  <li>Các hóa đơn đã xuất trước ngày áp dụng vẫn giữ nguyên đơn giá snapshot cũ.</li>
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded border border-gray-200 bg-gray-50 p-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Giá hiện tại</p>
                  <p className="font-bold text-gray-800">{Number(selectedService.price || 0).toLocaleString('vi-VN')} VNĐ</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Giá mới</p>
                  <p className="font-bold text-gray-800">{updatePriceVnd.toLocaleString('vi-VN')} VNĐ</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Ngày áp dụng</p>
                  <p className="font-semibold text-gray-800">{formatEffectiveDate(updateEffectiveDate)}</p>
                </div>
              </div>
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
                <span>Xác nhận đổi giá</span>
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
                        const dateStr = formatDisplayDate(history.effectiveDate);
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
