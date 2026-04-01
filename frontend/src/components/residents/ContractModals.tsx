import { X, User, Home, Calendar, DollarSign, FileText, AlertTriangle, Check, Eye, Printer, Download, Mail, Plus, Users } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { buildingService, roomService, residentService, contractService } from '../../services/api.service';
import { Loader2 } from 'lucide-react';
import { formatLocalDateInput } from '../../lib/date-utils';
import { api } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../lib/api-config';
import { invoiceService, serviceService } from '../../services/api.service';

interface ContractModalProps {
  contract?: any;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  idCard: string;
  email?: string;
  avatar: string;
}

interface BillingFormulaRow {
  key: string;
  sortOrder: number;
  itemType: 'TienPhong' | 'Dien' | 'Nuoc' | 'DichVu';
  serviceId?: number;
  serviceName: string;
  unitPrice: number;
  quantityExpression: 'fixed' | 'n';
  quantityMode?: 'fixed' | 'vehicle' | 'person';
}

function normalizeText(value: string | undefined) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

function isMeterService(service: any) {
  const name = normalizeText(service?.name || service?.serviceName || '');
  return name.includes('dien') || name.includes('nuoc') || name.includes('water') || name.includes('electric');
}

function isVehicleService(service: any) {
  const name = normalizeText(service?.name || service?.serviceName || '');
  const type = normalizeText(service?.serviceType || service?.loai || '');
  return type.includes('xe') || type.includes('gui xe') || name.includes('xe') || name.includes('parking');
}

function isPerPersonService(service: any) {
  const name = normalizeText(service?.name || service?.serviceName || '');
  const type = normalizeText(service?.serviceType || service?.loai || '');
  const unit = normalizeText(service?.unit || service?.donVi || '');
  return unit.includes('nguoi') || unit.includes('person') || name.includes('nguoi') || type.includes('nguoi');
}

function toNumber(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getNextSequence(contracts: any[], year: number) {
  const prefix = `HD-${year}-`;
  let max = 0;

  contracts.forEach((c: any) => {
    const code = String(c?.contractCode || c?.code || '').trim();
    if (!code.startsWith(prefix)) return;

    const seqText = code.slice(prefix.length);
    const seq = Number(seqText);
    if (Number.isFinite(seq) && seq > max) {
      max = seq;
    }
  });

  return max + 1;
}

export function CreateContractModal({ onClose, onSuccess }: ContractModalProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [activePricingCatalog, setActivePricingCatalog] = useState<any[]>([]);

  // API data
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);

  // Form state - Step 1
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');

  // Form state - Step 2 (tenant)
  const [tenantType, setTenantType] = useState<'new' | 'existing'>('new');
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantIdCard, setTenantIdCard] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');

  // Form state - Step 3 (contract terms)
  const [startDate, setStartDate] = useState(() => formatLocalDateInput());
  const [durationMonths, setDurationMonths] = useState('12');
  const [durationOptions, setDurationOptions] = useState<number[]>([6, 12, 24]);
  const [appliedCustomDurationMonths, setAppliedCustomDurationMonths] = useState<string>('');
  const [showCustomDurationInput, setShowCustomDurationInput] = useState(false);
  const [customDurationValue, setCustomDurationValue] = useState('');
  const [customDurationUnit, setCustomDurationUnit] = useState<'months' | 'years'>('months');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [contractSequence, setContractSequence] = useState(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [formulaQuantities, setFormulaQuantities] = useState<Record<string, string>>({});
  const [vehicleCount, setVehicleCount] = useState('0');

  // Loading/error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    buildingService.getAll().then((data: any) => setBuildings(Array.isArray(data) ? data : data?.data ?? [])).catch(() => {});
    residentService.getAll().then((data: any) => setResidents(Array.isArray(data) ? data : data?.data ?? [])).catch(() => {});
    contractService.getAll().then((data: any) => {
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      setContractSequence(getNextSequence(rows, new Date(startDate || Date.now()).getFullYear()));
    }).catch(() => setContractSequence(1));
    serviceService.getAll().then((data: any) => {
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      setActivePricingCatalog(rows.filter((s: any) => s.isActive !== false));
    }).catch(() => setActivePricingCatalog([]));
  }, []);

  useEffect(() => {
    contractService.getAll().then((data: any) => {
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      setContractSequence(getNextSequence(rows, new Date(startDate || Date.now()).getFullYear()));
    }).catch(() => setContractSequence(1));
  }, [startDate]);

  const contractCodePreview = `HD-${new Date(startDate || Date.now()).getFullYear()}-${String(contractSequence).padStart(5, '0')}`;

  const addCustomDuration = () => {
    const n = parseInt(customDurationValue, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    const months = customDurationUnit === 'years' ? n * 12 : n;
    // Custom duration is only applied for current contract, not persisted to base option list.
    setAppliedCustomDurationMonths(String(months));
    setDurationMonths(String(months));
    setCustomDurationValue('');
    setShowCustomDurationInput(false);
  };

  const selectedServices = useMemo(() => {
    const selected = new Set(selectedServiceIds);
    return activePricingCatalog.filter((s: any) => selected.has(Number(s.id ?? s.serviceId ?? 0)));
  }, [activePricingCatalog, selectedServiceIds]);

  const hasVehicleServiceSelected = useMemo(() => {
    return selectedServices.some((s: any) => isVehicleService(s) && !isMeterService(s));
  }, [selectedServices]);

  const householdMemberCount = useMemo(() => {
    // Chủ hộ ở bước 2 luôn được thêm vào hợp đồng, bước 2B là thành viên ở cùng.
    return 1 + familyMembers.length;
  }, [familyMembers.length]);

  const formulaRows = useMemo<BillingFormulaRow[]>(() => {
    const rows: BillingFormulaRow[] = [
      {
        key: 'rent',
        sortOrder: 1,
        itemType: 'TienPhong',
        serviceName: 'Tiền phòng',
        unitPrice: toNumber(monthlyRent),
        quantityExpression: 'fixed',
        quantityMode: 'fixed',
      },
    ];

    selectedServices.forEach((service: any, index: number) => {
      const id = Number(service.id ?? service.serviceId ?? 0);
      const name = service.name || service.serviceName || 'Dịch vụ';
      const price = toNumber(service.commonUnitPrice ?? service.unitPrice);
      const meter = isMeterService(service);
      const vehicleBased = !meter && isVehicleService(service);
      const personBased = !meter && !vehicleBased && isPerPersonService(service);

      rows.push({
        key: `svc-${id}`,
        sortOrder: index + 2,
        itemType: meter ? (normalizeText(name).includes('nuoc') || normalizeText(name).includes('water') ? 'Nuoc' : 'Dien') : 'DichVu',
        serviceId: id,
        serviceName: name,
        unitPrice: price,
        quantityExpression: meter ? 'n' : 'fixed',
        quantityMode: vehicleBased ? 'vehicle' : (personBased ? 'person' : 'fixed'),
      });
    });

    return rows;
  }, [selectedServices, monthlyRent]);

  const updateFormulaQuantity = (key: string, value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    setFormulaQuantities(prev => ({ ...prev, [key]: digitsOnly }));
  };

  const getNaturalQuantity = (key: string) => {
    const raw = formulaQuantities[key] || '1';
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  };

  const getVehicleQuantity = () => {
    const digitsOnly = vehicleCount.replace(/\D/g, '');
    const parsed = parseInt(digitsOnly, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };

  const getPersonQuantity = () => {
    return householdMemberCount;
  };

  const getRowQuantity = (row: BillingFormulaRow) => {
    if (row.quantityExpression === 'n') {
      return null;
    }

    if (row.quantityMode === 'vehicle') {
      return getVehicleQuantity();
    }

    if (row.quantityMode === 'person') {
      return getPersonQuantity();
    }

    return getNaturalQuantity(row.key);
  };

  const getFormulaTotalText = (row: BillingFormulaRow) => {
    if (row.quantityExpression === 'n') {
      return `${row.unitPrice.toLocaleString('vi-VN')} x n`;
    }

    const quantity = getRowQuantity(row) ?? 0;
    return (row.unitPrice * quantity).toLocaleString('vi-VN');
  };

  const getRowFormulaText = (row: BillingFormulaRow) => {
    const unitPrice = row.unitPrice.toLocaleString('vi-VN');
    if (row.quantityExpression === 'n') {
      return `${unitPrice} x n`;
    }

    const quantity = getRowQuantity(row) ?? 0;
    return `${unitPrice} x ${quantity}`;
  };

  const monthlyFormulaExpression = useMemo(() => {
    if (!formulaRows.length) return '';

    const parts = formulaRows.map((row) => {
      return `${row.serviceName}(${getRowFormulaText(row)})`;
    });

    return parts.join(' + ');
  }, [formulaRows, formulaQuantities, vehicleCount, householdMemberCount]);

  const toggleServiceSelection = (serviceId: number) => {
    setSelectedServiceIds(prev => prev.includes(serviceId)
      ? prev.filter(id => id !== serviceId)
      : [...prev, serviceId]);
  };

  useEffect(() => {
    if (tenantType !== 'existing') return;
    const r = residents.find((x: any) => String(x.id) === selectedResidentId);
    if (!r) return;
    setTenantName(r.fullName || r.hoTen || '');
    setTenantIdCard(r.idCardNumber || r.soCCCD || '');
    setTenantPhone(r.phoneNumber || r.soDienThoai || '');
    setTenantEmail(r.email || '');
  }, [tenantType, selectedResidentId, residents]);

  useEffect(() => {
    if (selectedBuildingId) {
      roomService.getAll().then((data: any) => {
        const all = Array.isArray(data) ? data : data?.data ?? [];
        const filtered = all.filter((r: any) => {
          const floor = r.floor || r.floorId;
          return floor?.buildingId?.toString() === selectedBuildingId || r.buildingId?.toString() === selectedBuildingId;
        });
        setRooms(filtered.length ? filtered : all);
      }).catch(() => {});
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    const room = rooms.find((r: any) => String(r.id ?? r.roomId) === selectedRoomId);
    if (!room) return;

    const defaultRent = toNumber(room.defaultRentPrice ?? room.rentPrice ?? room.monthlyRent ?? room.giaThueMacDinh);
    if (defaultRent > 0) {
      setMonthlyRent(String(defaultRent));
    }
  }, [selectedRoomId, rooms]);

  const handleRemoveMember = (id: string) => {
    setFamilyMembers(familyMembers.filter(member => member.id !== id));
  };

  const handleAddMember = (newMember: Omit<FamilyMember, 'id'>) => {
    const member: FamilyMember = { ...newMember, id: Date.now().toString() };
    setFamilyMembers([...familyMembers, member]);
    setShowAddMemberModal(false);
  };

  const handleSubmit = async () => {
    if (!selectedRoomId || !startDate || !monthlyRent) {
      setError('Vui lòng điền đầy đủ: Phòng, Ngày bắt đầu, Tiền thuê');
      return;
    }

    if (tenantType === 'new' && (!tenantName.trim() || !tenantIdCard.trim() || !tenantPhone.trim())) {
      setError('Vui lòng điền đầy đủ: Phòng, Họ tên, CCCD, SĐT chủ hộ, Ngày bắt đầu, Tiền thuê');
      return;
    }

    if (tenantType === 'existing' && !selectedResidentId) {
      setError('Vui lòng chọn cư dân đã có làm chủ hộ');
      return;
    }

    setLoading(true); setError(null);
    try {
      // Resolve head of household resident ID
      let tenantResidentId: number | undefined;
      if (tenantType === 'existing') {
        tenantResidentId = parseInt(selectedResidentId, 10);
      } else {
        const tenantRes: any = await residentService.create({
          fullName: tenantName.trim(),
          phoneNumber: tenantPhone.trim(),
          idCardNumber: tenantIdCard.trim(),
          email: tenantEmail.trim() || undefined,
        } as any);
        tenantResidentId = tenantRes?.id ?? tenantRes?.residentId ?? tenantRes?.data?.id;
      }

      // Create family member residents
      const memberResidentIds: number[] = [];
      const memberEmailMap: Map<number, string> = new Map(); // Track email for each resident
      for (const m of familyMembers) {
        try {
          const mr: any = await residentService.create({ fullName: m.name, phoneNumber: m.phone, idCardNumber: m.idCard, email: m.email || undefined } as any);
          const mid = mr?.id ?? mr?.residentId ?? mr?.data?.id;
          if (!mid) {
            throw new Error(`Không thể tạo cư dân thành viên: ${m.name}`);
          }
          memberResidentIds.push(mid);
          if (m.email) {
            memberEmailMap.set(mid, m.email); // Store email for later use
          }
        } catch (memberErr: any) {
          throw new Error(memberErr?.message || `Không thể tạo cư dân thành viên: ${m.name}`);
        }
      }

      // Calculate expected end date
      const end = new Date(startDate);
      end.setMonth(end.getMonth() + parseInt(durationMonths));

      // Build residents array
      const residentsPayload: any[] = [];
      if (tenantResidentId) {
        residentsPayload.push({ 
          residentId: tenantResidentId, 
          residencyRole: 'Người thuê chính', 
          fromDate: startDate,
          email: tenantEmail.trim() || undefined
        });
      }
      memberResidentIds.forEach(mid => {
        const email = memberEmailMap.get(mid);
        residentsPayload.push({ 
          residentId: mid, 
          residencyRole: 'Thành viên', 
          fromDate: startDate,
          email: email || undefined
        });
      });

      await contractService.create({
        roomId: parseInt(selectedRoomId),
        startDate,
        expectedEndDate: formatLocalDateInput(end),
        actualRentPrice: parseFloat(monthlyRent.replace(/[^0-9.]/g, '')),
        depositAmount: deposit ? parseFloat(deposit.replace(/[^0-9.]/g, '')) : undefined,
        selectedServiceIds,
        billingFormulaItems: formulaRows.map((row) => ({
          sortOrder: row.sortOrder,
          itemType: row.itemType,
          serviceId: row.serviceId,
          serviceName: row.serviceName,
          unitPrice: row.unitPrice,
          quantity: row.quantityExpression === 'n' ? null : getRowQuantity(row),
          quantityExpression: row.quantityExpression === 'n' ? 'n' : String(getRowQuantity(row) ?? 0),
        })),
        residents: residentsPayload,
      } as any);

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[900px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <FileText size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Tạo hợp đồng mới</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Step 1: Room Selection */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3 flex items-center">
              <Home size={16} className="mr-2" />
              BƯỚC 1: Chọn phòng
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tòa nhà *</label>
                <select
                  value={selectedBuildingId}
                  onChange={e => { setSelectedBuildingId(e.target.value); setSelectedRoomId(''); }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                >
                  <option value="">Chọn tòa nhà...</option>
                  {buildings.map((b: any) => (
                    <option key={b.id ?? b.buildingId} value={b.id ?? b.buildingId}>{b.buildingName ?? b.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2">Phòng *</label>
                <select
                  value={selectedRoomId}
                  onChange={e => setSelectedRoomId(e.target.value)}
                  disabled={!selectedBuildingId}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500 disabled:bg-gray-100"
                >
                  <option value="">Chọn phòng...</option>
                  {rooms.map((r: any) => {
                    const id = r.id ?? r.roomId;
                    const code = r.roomCode ?? r.code ?? r.name;
                    const area = r.area ? ` - ${r.area}m²` : '';
                    const status = r.status ?? '';
                    const isEmpty = status === 'Trống' || status === '' || status === 'empty';
                    return <option key={id} value={id} disabled={!isEmpty}>{code}{area} ({isEmpty ? '✅ Trống' : status})</option>;
                  })}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  🔗 Danh sách phòng từ <strong>Quản lý Hạ tầng → Cơ cấu tòa nhà</strong>
                </p>
              </div>
            </div>

          </div>

          {/* Step 2: Head of Household */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3 flex items-center">
              <User size={16} className="mr-2" />
              BƯỚC 2: Thông tin chủ hộ (Người ký hợp đồng)
            </h4>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input type="radio" name="tenantType" id="newTenant" checked={tenantType === 'new'} onChange={() => { setTenantType('new'); setSelectedResidentId(''); }} className="w-4 h-4" />
                <label htmlFor="newTenant" className="text-sm text-gray-700 font-bold">Cư dân mới (Tự động tạo tài khoản)</label>
              </div>

              <div className="grid grid-cols-2 gap-4 ml-7">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Họ và tên *</label>
                  <input 
                    type="text"
                    placeholder="VD: Nguyễn Văn A"
                    value={tenantName}
                    onChange={e => setTenantName(e.target.value)}
                    disabled={tenantType !== 'new'}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">CMND/CCCD *</label>
                  <input 
                    type="text"
                    placeholder="VD: 001234567890"
                    value={tenantIdCard}
                    onChange={e => setTenantIdCard(e.target.value)}
                    disabled={tenantType !== 'new'}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Số điện thoại *</label>
                  <input 
                    type="text"
                    placeholder="VD: 0912345678"
                    value={tenantPhone}
                    onChange={e => setTenantPhone(e.target.value)}
                    disabled={tenantType !== 'new'}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Email</label>
                  <input 
                    type="email"
                    placeholder="VD: email@example.com"
                    value={tenantEmail}
                    onChange={e => setTenantEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>
              </div>

              <div className="border-t border-gray-300 pt-3">
                <div className="flex items-center space-x-3">
                  <input type="radio" name="tenantType" id="existingTenant" checked={tenantType === 'existing'} onChange={() => setTenantType('existing')} className="w-4 h-4" />
                  <label htmlFor="existingTenant" className="text-sm text-gray-700 font-bold">Chọn từ cư dân đã có</label>
                </div>
                <select 
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500 mt-2" 
                  disabled={tenantType !== 'existing'} 
                  value={selectedResidentId} 
                  onChange={(e) => setSelectedResidentId(e.target.value)}
                  size={5}
                  style={{ height: 'auto', maxHeight: '180px', overflow: 'auto', marginLeft: '28px', width: 'calc(100% - 28px)' }}
                >
                  <option value="">Chọn cư dân...</option>
                  {residents.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.fullName || r.hoTen} - {(r.phoneNumber || r.soDienThoai || '---')} - {(r.roomCode || r.soPhong || 'Chưa có phòng')}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1" style={{ marginLeft: '28px' }}>
                  🔗 Danh sách đồng bộ từ <strong>Cư dân & Hợp đồng → Danh sách Cư dân</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Step 2B: Family Members */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm text-gray-800 font-bold flex items-center">
                <Users size={16} className="mr-2" />
                BƯỚC 2B: Thành viên cùng ở (Không bắt buộc)
              </h4>
              <button className="px-3 py-1.5 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 flex items-center space-x-1" onClick={() => setShowAddMemberModal(true)}>
                <Plus size={14} />
                <span>Thêm thành viên</span>
              </button>
            </div>

            {/* Member List */}
            {familyMembers.length > 0 ? (
              <div className="space-y-2">
                {familyMembers.map(member => (
                  <div key={member.id} className="bg-white border border-gray-300 rounded p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-xl">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="text-sm text-gray-800 font-bold">{member.name}</p>
                          <p className="text-xs text-gray-600">{member.relationship}</p>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Xóa thành viên" onClick={() => handleRemoveMember(member.id)}>
                        <X size={16} className="text-red-600" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">SĐT:</span>
                        <span className="text-gray-800 ml-1 font-bold">{member.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">CMND:</span>
                        <span className="text-gray-800 ml-1 font-bold">{member.idCard}</span>
                      </div>
                      {member.email && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Email:</span>
                          <span className="text-gray-800 ml-1">{member.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center text-gray-500">
                <Users size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Chưa có thành viên nào</p>
                <p className="text-xs mt-1">Nhấn "Thêm thành viên" để bắt đầu</p>
              </div>
            )}
          </div>

          {/* Step 3: Contract Details */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3 flex items-center">
              <Calendar size={16} className="mr-2" />
              BƯỚC 3: Điều khoản hợp đồng
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Mã hợp đồng</label>
                <input 
                  type="text"
                  value={contractCodePreview}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100 focus:outline-none"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Ngày bắt đầu *</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Thời hạn *</label>
                <div className="flex items-center gap-2">
                  <select
                    value={durationMonths}
                    onChange={e => {
                      setDurationMonths(e.target.value);
                      if (appliedCustomDurationMonths && e.target.value !== appliedCustomDurationMonths) {
                        setAppliedCustomDurationMonths('');
                      }
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  >
                    {durationOptions.map((m) => (
                      <option key={m} value={String(m)}>{m % 12 === 0 ? `${m / 12} năm` : `${m} tháng`}</option>
                    ))}
                    {appliedCustomDurationMonths && !durationOptions.includes(parseInt(appliedCustomDurationMonths, 10)) && (
                      <option value={appliedCustomDurationMonths}>
                        {Number(appliedCustomDurationMonths) % 12 === 0
                          ? `${Number(appliedCustomDurationMonths) / 12} năm (tùy chọn)`
                          : `${appliedCustomDurationMonths} tháng (tùy chọn)`}
                      </option>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCustomDurationInput(v => !v)}
                    className="px-2.5 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    title="Thêm thời hạn mới"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {showCustomDurationInput && (
                  <div className="mt-2 flex items-center gap-2 justify-center">
                    <input
                      type="number"
                      min={1}
                      value={customDurationValue}
                      onChange={e => setCustomDurationValue(e.target.value)}
                      placeholder="Thời hạn"
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                    <select
                      value={customDurationUnit}
                      onChange={e => setCustomDurationUnit(e.target.value as 'months' | 'years')}
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    >
                      <option value="months">tháng</option>
                      <option value="years">năm</option>
                    </select>
                    <button
                      type="button"
                      onClick={addCustomDuration}
                      className="px-5 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
                      style={{ whiteSpace: 'nowrap', minWidth: 80 }}
                    >
                      Áp dụng
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tiền thuê/tháng (VNĐ) *</label>
                <input 
                  type="text"
                  placeholder="VD: 8500000"
                  value={monthlyRent}
                  onChange={e => setMonthlyRent(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tiền cọc (VNĐ)</label>
                <input 
                  type="text"
                  placeholder="Thường = 1 tháng thuê"
                  value={deposit}
                  onChange={e => setDeposit(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Hạn thanh toán hàng tháng đang dùng chung theo cấu hình hệ thống cho tất cả phòng.
            </p>
          </div>

          {/* Step 4: Services */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3 flex items-center">
              <DollarSign size={16} className="mr-2" />
              BƯỚC 4: Danh mục đơn giá áp dụng
            </h4>

            <div className="space-y-2">
              {activePricingCatalog.length > 0 ? (
                activePricingCatalog.map((service: any) => (
                  <button
                    type="button"
                    key={service.id || service.serviceId || service.name}
                    onClick={() => toggleServiceSelection(Number(service.id ?? service.serviceId ?? 0))}
                    className="w-full flex items-center justify-between text-sm text-gray-700 p-2 rounded bg-white border border-gray-200 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2 cursor-pointer text-left">
                      <input
                        type="checkbox"
                        checked={selectedServiceIds.includes(Number(service.id ?? service.serviceId ?? 0))}
                        readOnly
                        className="pointer-events-none"
                      />
                      <span>{service.name || service.serviceName || 'Dịch vụ'}</span>
                    </span>
                    <span className="text-gray-800 font-bold">
                      {Number(service.commonUnitPrice ?? service.unitPrice ?? 0).toLocaleString('vi-VN')} VNĐ{service.unit ? `/${service.unit}` : ''}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500">Chưa có dữ liệu danh mục đơn giá.</p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              🔗 Đơn giá đồng bộ từ <strong>Quản lý Hạ tầng → Dịch vụ & Đơn giá</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Đã chọn: <strong>{selectedServiceIds.length}</strong> danh mục (tùy chọn)
            </p>
            {hasVehicleServiceSelected && (
              <div className="mt-3 p-3 bg-white border border-gray-200 rounded">
                <label className="block text-sm text-gray-700 mb-2 font-medium">Số lượng xe (áp dụng cho dịch vụ trông xe)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={vehicleCount}
                  onChange={(e) => setVehicleCount(e.target.value.replace(/\D/g, ''))}
                  className="w-32 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Số lượng này sẽ tự động dùng cho tất cả dòng dịch vụ tính theo đầu xe.</p>
              </div>
            )}
          </div>

          {/* Step 5 */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">BƯỚC 5: Công thức hóa đơn cuối tháng</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left border-b border-gray-200">Dịch vụ</th>
                    <th className="px-3 py-2 text-right border-b border-gray-200">Đơn giá</th>
                    <th className="px-3 py-2 text-center border-b border-gray-200">Số lượng</th>
                    <th className="px-3 py-2 text-left border-b border-gray-200">Công thức</th>
                    <th className="px-3 py-2 text-right border-b border-gray-200">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {formulaRows.map((row) => (
                    <tr key={row.key} className="bg-white">
                      <td className="px-3 py-2 border-b border-gray-100">{row.serviceName}</td>
                      <td className="px-3 py-2 text-right border-b border-gray-100">{row.unitPrice.toLocaleString('vi-VN')}</td>
                      <td className="px-3 py-2 text-center border-b border-gray-100">
                        {row.quantityExpression === 'n' ? (
                          <span className="font-bold">n</span>
                        ) : row.quantityMode === 'vehicle' ? (
                          <span className="font-bold text-blue-700">{getRowQuantity(row)}</span>
                        ) : row.quantityMode === 'person' ? (
                          <span className="font-bold text-blue-700">{getRowQuantity(row)}</span>
                        ) : (
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={formulaQuantities[row.key] || '1'}
                            onChange={(e) => updateFormulaQuantity(row.key, e.target.value)}
                            onBlur={(e) => {
                              if (!e.target.value || parseInt(e.target.value, 10) <= 0) {
                                updateFormulaQuantity(row.key, '1');
                              }
                            }}
                            className="w-20 px-2 py-1 text-center border border-gray-300 rounded"
                          />
                        )}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100 text-gray-700">{getRowFormulaText(row)}</td>
                      <td className="px-3 py-2 text-right border-b border-gray-100">{getFormulaTotalText(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 bg-white border border-gray-200 rounded p-3">
              <p className="text-xs text-gray-600 mb-1">Công thức hóa đơn tháng (để kiểm tra):</p>
              <p className="text-sm text-gray-800 font-medium break-words">
                {monthlyFormulaExpression || '(chưa có công thức)'}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Công thức sẽ được lưu theo hợp đồng/phòng và áp dụng khi tính hóa đơn nháp mỗi tháng.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{error}</p>
          )}
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <Check size={16} />
            <span>Tạo hợp đồng ({1 + familyMembers.length} người)</span>
          </button>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddFamilyMemberModal onClose={() => setShowAddMemberModal(false)} onAdd={handleAddMember} />
      )}
    </div>
  );
}

// Add Family Member Modal Component
function AddFamilyMemberModal({ onClose, onAdd }: { onClose: () => void, onAdd: (member: Omit<FamilyMember, 'id'>) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Vợ/Chồng',
    phone: '',
    idCard: '',
    email: '',
    avatar: '👤'
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || !formData.idCard) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }
    onAdd(formData);
  };

  const relationshipOptions = [
    { value: 'Vợ/Chồng', label: 'Vợ/Chồng', avatar: '👤' },
    { value: 'Con', label: 'Con', avatar: '👶' },
    { value: 'Mẹ/Bố', label: 'Mẹ/Bố', avatar: '👵' },
    { value: 'Anh/Chị/Em', label: 'Anh/Chị/Em', avatar: '👤' },
    { value: 'Ông/Bà', label: 'Ông/Bà', avatar: '👴' },
    { value: 'Khác', label: 'Khác', avatar: '👤' }
  ];

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center space-x-2">
            <User size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Thêm thành viên cùng ở</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">

          <div>
            <label className="block text-sm text-gray-700 mb-2">Mối quan hệ với chủ hộ *</label>
            <select 
              value={formData.relationship}
              onChange={(e) => {
                const selected = relationshipOptions.find(opt => opt.value === e.target.value);
                setFormData({ ...formData, relationship: e.target.value, avatar: selected?.avatar || '👤' });
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            >
              {relationshipOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.avatar} {opt.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Họ và tên *</label>
              <input 
                type="text"
                placeholder="VD: Trần Thị B"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">CMND/CCCD *</label>
              <input 
                type="text"
                placeholder="VD: 001234567891"
                value={formData.idCard}
                onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Số điện thoại *</label>
              <input 
                type="text"
                placeholder="VD: 0923456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Dùng để đăng nhập App cư dân</p>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Email (Tùy chọn)</label>
              <input 
                type="email"
                placeholder="VD: tranthib@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Thêm thành viên</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function ViewContractModal({ contract, onClose }: ContractModalProps) {
  const [contractDetail, setContractDetail] = useState<any>(contract ?? null);
  const [roomDetail, setRoomDetail] = useState<any>(null);
  const [activeServices, setActiveServices] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [currentDebt, setCurrentDebt] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetailData = async () => {
      if (!contract?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch full contract detail to get billingFormulaJson and other fields
        const detail = await contractService.getById(Number(contract.id));
        setContractDetail(detail);

        const roomId = detail?.roomId || contract?.roomId;
        if (roomId) {
          try {
            const roomData = await roomService.getById(Number(roomId));
            setRoomDetail(roomData);
          } catch (e) {
            console.error('Error fetching room detail:', e);
          }
        }

        try {
          const invoices = await invoiceService.getAll();
          const relatedInvoices = (invoices || []).filter((inv: any) => {
            const cid = Number(inv.contractId || inv.hopDongId || 0);
            const rid = Number(inv.roomId || inv.phongId || 0);
            return cid === Number(contract.id) || (roomId && rid === Number(roomId));
          });

          const paid = relatedInvoices.reduce((sum: number, inv: any) => sum + Number(inv.paidAmount || 0), 0);
          const total = relatedInvoices.reduce((sum: number, inv: any) => sum + Number(inv.totalAmount || 0), 0);
          
          setTotalPaid(paid);
          setCurrentDebt(total - paid);
        } catch (e) {
          console.error('Error calculating financial data:', e);
        }

        // Extract services from billing formula (ground truth) instead of ChiTietSuDungDichVu
        // This ensures consistency with the monthly billing formula display
        if (detail?.billingFormulaJson) {
          try {
            const formula = typeof detail.billingFormulaJson === 'string' 
              ? JSON.parse(detail.billingFormulaJson)
              : detail.billingFormulaJson;
            
            if (Array.isArray(formula)) {
              // Extract all service items (DichVu, Dien, Nuoc) - exclude TienPhong (room rent)
              const serviceItems = formula.filter((item: any) => 
                item.itemType !== 'TienPhong' && (item.serviceId || item.serviceName)
              );
              const uniqueServices = Array.from(
                new Map(serviceItems.map((item: any) => [
                  item.serviceId || `${item.itemType}-${item.serviceName}`,
                  {
                    serviceId: item.serviceId || 0,
                    serviceName: item.serviceName || item.itemType,
                    commonUnitPrice: item.unitPrice,
                    unitPrice: item.unitPrice,
                    itemType: item.itemType,
                  }
                ])).values()
              );
              setActiveServices(uniqueServices);
            }
          } catch (e) {
            console.error('Error parsing billing formula for services:', e);
            // Fallback to GetServicesByContract if formula parsing fails
            try {
              const services = await serviceService.getByContract(Number(contract.id));
              setActiveServices(services || []);
            } catch (fallbackError) {
              console.error('Fallback error fetching services:', fallbackError);
            }
          }
        }
      } catch (e) {
        console.error('Error loading contract details:', e);
        setContractDetail(contract);
      } finally {
        setLoading(false);
      }
    };

    loadDetailData();
  }, [contract?.id]);

  const fmtCurrency = (v: any) => Number(v ?? 0).toLocaleString('vi-VN');
  const formatDateVi = (v: any) => {
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString('vi-VN');
  };

  const displayCode = contractDetail?.code || contractDetail?.contractCode || contractDetail?.maHopDong || contract?.code || '-';
  const displayRoom = contractDetail?.room || contractDetail?.roomNumber || contractDetail?.soPhong || contract?.room || '-';
  const displayStartDate = contractDetail?.startDate ? formatDateVi(contractDetail.startDate) : contract?.startDate || '-';
  const displayEndDate = contractDetail?.expectedEndDate
    ? formatDateVi(contractDetail.expectedEndDate)
    : (contractDetail?.endDate ? formatDateVi(contractDetail.endDate) : (contract?.endDate || '-'));
  const displayRent = contractDetail?.monthlyRent ?? contractDetail?.actualRentPrice ?? contract?.monthlyRent ?? 0;
  const displayDeposit = contractDetail?.deposit ?? contractDetail?.depositAmount ?? contract?.deposit ?? 0;

  const residentList: any[] = Array.isArray(contractDetail?.residents)
    ? contractDetail.residents
    : (Array.isArray(contract?.residents) ? contract.residents : []);
  const headOfHousehold = residentList.find((r: any) => r.residencyRole === 'Người thuê chính') || residentList[0];

  const getResidentName = (r: any) => r?.fullName || r?.hoTen || 'Không rõ';
  const getResidentPhone = (r: any) => r?.phoneNumber || r?.soDienThoai || '---';
  const getResidentIdCard = (r: any) => r?.idCardNumber || r?.soCCCD || '---';

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-[400px] p-10 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
          <p className="text-gray-600">Đang tải chi tiết hợp đồng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[900px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Eye size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Chi tiết hợp đồng - {displayCode}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Status Alert */}
          {contract?.status === 'expired' && (
            <div className="bg-red-50 border border-red-300 rounded p-4 flex items-start space-x-3">
              <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-bold mb-1">⚠️ Hợp đồng đã quá hạn {Math.abs(contract.daysLeft)} ngày!</p>
                <p className="text-sm text-red-700">Vui lòng liên hệ cư dân để gia hạn hoặc thanh lý hợp đồng.</p>
              </div>
            </div>
          )}

          {contract?.status === 'danger' && (
            <div className="bg-yellow-50 border border-yellow-300 rounded p-4 flex items-start space-x-3">
              <AlertTriangle size={24} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-bold mb-1">⚠️ Hợp đồng sắp hết hn (còn {contract.daysLeft} ngày)</p>
                <p className="text-sm text-yellow-700">Nên liên hệ cư dân để chuẩn bị gia hạn.</p>
              </div>
            </div>
          )}

          {/* Contract Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Thông tin hợp đồng</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã hợp đồng:</span>
                    <span className="text-gray-800 font-bold">{displayCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phòng:</span>
                    <span className="text-gray-800 font-bold">{displayRoom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày bắt đầu:</span>
                    <span className="text-gray-800">{displayStartDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày kết thúc:</span>
                    <span className="text-gray-800">{displayEndDate}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-2">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className={`font-bold ${
                      contract?.status === 'active' ? 'text-green-700' : 
                      contract?.status === 'expired' ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      {contract?.status === 'active' ? 'Đang hoạt động' :
                       contract?.status === 'expired' ? `Quá hạn ${Math.abs(contract.daysLeft)} ngày` :
                       `Còn ${contract?.daysLeft} ngày`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm text-gray-600">Thành viên trong hộ</h4>
                  <span className="text-xs text-gray-600 bg-gray-200 px-2 py-0.5 rounded">{residentList.length} người</span>
                </div>
                
                {/* Head of Household */}
                <div className="space-y-2">
                  {headOfHousehold && (
                    <div className="bg-white border border-gray-300 rounded p-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-lg">
                          👤
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-800 font-bold">{getResidentName(headOfHousehold)}</p>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-300">Chủ hộ</span>
                          </div>
                          <p className="text-xs text-gray-600">{getResidentPhone(headOfHousehold)} • {getResidentIdCard(headOfHousehold)}</p>
                          {headOfHousehold.email && <p className="text-xs text-blue-600">{headOfHousehold.email}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {residentList.filter((r: any) => r !== headOfHousehold).map((member: any, idx: number) => (
                    <div key={member.id || member.residentId || idx} className="bg-white border border-gray-300 rounded p-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-lg">
                          👤
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-700">{getResidentName(member)}</p>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-300">{member.residencyRole || 'Thành viên'}</span>
                          </div>
                          <p className="text-xs text-gray-600">{getResidentPhone(member)}</p>
                          {member.email && <p className="text-xs text-blue-600">{member.email}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-300">
                  🔗 Tất cả thành viên có tài khoản trong <strong>Danh sách Cư dân</strong>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Chi phí</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiền thuê/tháng:</span>
                    <span className="text-gray-800 font-bold">{fmtCurrency(displayRent)} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiền cọc:</span>
                    <span className="text-gray-800 font-bold">{fmtCurrency(displayDeposit)} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày thanh toán:</span>
                    <span className="text-gray-800">Ngày 5 hàng tháng</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Công thức tính hóa đơn hàng tháng</h4>
                <div className="space-y-2 text-sm">
                  {(contractDetail?.billingFormulaJson || contractDetail?.BillingFormulaJson) ? (
                    (() => {
                      try {
                        // Support both camelCase and PascalCase from backend
                        const formulaJson = contractDetail.billingFormulaJson || contractDetail.BillingFormulaJson;
                        const formula = typeof formulaJson === 'string' 
                          ? JSON.parse(formulaJson)
                          : formulaJson;
                        
                        const items = Array.isArray(formula) ? formula : [];
                        
                        return items.length > 0 ? (
                          <>
                            {items.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((item: any, idx: number) => {
                              const qtyText = item.quantityExpression === 'n' || !item.quantity 
                                ? 'n' 
                                : item.quantity;
                              const unitPrice = fmtCurrency(item.unitPrice || 0);
                              
                              return (
                                <div key={idx} className="flex justify-between items-start py-1">
                                  <span className="text-gray-700 flex-1">
                                    {idx + 1}. {item.serviceName || item.itemType}
                                  </span>
                                  <span className="text-gray-800 font-mono text-right">
                                    {unitPrice} × {qtyText}
                                  </span>
                                </div>
                              );
                            })}
                            <div className="border-t border-gray-300 pt-2 mt-2">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-800 font-bold">Tổng cộng</span>
                                <span className="text-blue-700 font-bold">= Σ (Đơn giá × Số lượng)</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 pt-2 border-t border-gray-300 mt-2">
                              💡 <strong>n</strong> = Số lượng thực tế sử dụng trong tháng (điện, nước: từ chỉ số đồng hồ)
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-500">Công thức trống</p>
                        );
                      } catch (e) {
                        console.error('Error parsing billing formula:', e);
                        return <p className="text-red-500 text-xs">Lỗi khi đọc công thức</p>;
                      }
                    })()
                  ) : (
                    <p className="text-gray-500 text-xs">
                      Sử dụng công thức mặc định từ danh sách dịch vụ đang kích hoạt
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Dịch vụ đang sử dụng</h4>
                <div className="space-y-2 text-sm">
                  {activeServices.length > 0 ? (
                    activeServices.map((service: any) => (
                      <div key={service.serviceId || service.id || service.name} className="flex justify-between items-center">
                        <span className="text-gray-700">{service.serviceName || service.name || 'Dịch vụ'}</span>
                        <span className="text-gray-800 font-bold">
                          {fmtCurrency(service.unitPrice ?? service.commonUnitPrice ?? service.price ?? 0)} VNĐ{service.unit ? `/${service.unit}` : ''}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Không có dữ liệu dịch vụ</p>
                  )}
                  <p className="text-xs text-gray-500 pt-2 border-t border-gray-300">
                    🔗 Đơn giá từ <strong>Dịch vụ & Đơn giá</strong>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Thông tin thanh toán</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng đã thanh toán:</span>
                    <span className="text-green-700 font-bold">{fmtCurrency(totalPaid)} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Công nợ hiện tại:</span>
                    <span className={currentDebt > 0 ? 'text-red-700 font-bold' : 'text-gray-800'}>
                      {fmtCurrency(currentDebt)} VNĐ
                    </span>
                  </div>
                </div>
              </div>

              {/* Electricity Pricing */}
              {roomDetail?.electricityTiers && roomDetail.electricityTiers.length > 0 && (
                <div className="bg-gray-50 border border-gray-300 rounded p-4">
                  <h4 className="text-sm text-gray-600 mb-3">⚡ Bảng giá điện</h4>
                  {roomDetail.electricityBasePrice && (
                    <div className="mb-3 pb-3 border-b border-gray-300">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Giá cơ bản:</span>
                        <span className="text-gray-800 font-bold">{fmtCurrency(roomDetail.electricityBasePrice)}/kWh</span>
                      </div>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white">
                          <th className="px-2 py-2 text-left text-gray-600 border-b border-gray-300">Bậc</th>
                          <th className="px-2 py-2 text-left text-gray-600 border-b border-gray-300">Khoảng (kWh)</th>
                          <th className="px-2 py-2 text-right text-gray-600 border-b border-gray-300">Đơn giá</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomDetail.electricityTiers.map((tier: any) => (
                          <tr key={tier.tierNumber} className="border-b border-gray-200">
                            <td className="px-2 py-2 text-gray-700">{tier.tierNumber}</td>
                            <td className="px-2 py-2 text-gray-700">{tier.fromKwh} - {tier.toKwh || '∞'}</td>
                            <td className="px-2 py-2 text-right text-gray-800 font-bold">{fmtCurrency(tier.pricePerKwh)}/kWh</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Water Pricing */}
              {roomDetail?.waterPricePerCubicMeter && (
                <div className="bg-gray-50 border border-gray-300 rounded p-4">
                  <h4 className="text-sm text-gray-600 mb-3">💧 Giá nước</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Đơn giá:</span>
                    <span className="text-gray-800 font-bold">{fmtCurrency(roomDetail.waterPricePerCubicMeter)}/m³</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Room Details */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-600 mb-3">Thông tin phòng</h4>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Diện tích:</p>
                <p className="text-gray-800 font-bold">{roomDetail?.area ? `${roomDetail.area}m²` : '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Tầng:</p>
                <p className="text-gray-800 font-bold">{roomDetail?.floorNumber ? `Tầng ${roomDetail.floorNumber}` : '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Tòa nhà:</p>
                <p className="text-gray-800 font-bold">{roomDetail?.buildingName || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Trạng thái:</p>
                <p className="text-green-700 font-bold">{roomDetail?.status || '-'}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p className="text-gray-600 text-xs mb-2">Tiện nghi:</p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(roomDetail?.assets) && roomDetail.assets.length > 0 ? (
                  roomDetail.assets.map((asset: any, idx: number) => (
                    <span key={asset.assetId || idx} className="px-2 py-1 bg-white border border-gray-300 text-xs rounded">
                      {asset.assetName || 'Tài sản'}{asset.quantity ? ` (${asset.quantity})` : ''}
                    </span>
                  ))
                ) : (
                  <span className="px-2 py-1 bg-white border border-gray-300 text-xs rounded">Không có dữ liệu tài sản</span>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              🔗 Thông tin đồng bộ từ <strong>Quản lý Hạ tầng → Cơ cấu tòa nhà & Quản lý kho tài sản</strong>
            </p>
          </div>

        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-between sticky bottom-0 bg-white">
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-2">
              <Printer size={16} />
              <span>In hợp đồng</span>
            </button>
            <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-2">
              <Mail size={16} />
              <span>Gửi Email cho 4 người</span>
            </button>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export function PrintContractModal({ contract, onClose }: ContractModalProps) {
  const residentList: any[] = Array.isArray(contract?.residents) ? contract.residents : [];
  const headOfHousehold = residentList.find((r: any) => r.residencyRole === 'Người thuê chính') || residentList[0];

  const getResidentName = (r: any) => r?.fullName || r?.hoTen || 'Không rõ';
  const getResidentPhone = (r: any) => r?.phoneNumber || r?.soDienThoai || '---';
  const getResidentIdCard = (r: any) => r?.idCardNumber || r?.soCCCD || '---';
  const getResidentEmail = (r: any) => r?.email || '---';

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <FileText size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">In/Xuất hợp đồng - {contract?.code}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Export Options */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">Chọn định dạng xuất:</h4>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border border-gray-300 rounded cursor-pointer hover:bg-white">
                <div className="flex items-center space-x-3">
                  <input type="radio" name="exportFormat" defaultChecked className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-800 font-bold">Hợp đồng đầy đủ (PDF)</p>
                    <p className="text-xs text-gray-600">Bao gồm tất cả điều khoản, chữ ký số, đóng dấu</p>
                  </div>
                </div>
                <FileText size={20} className="text-gray-600" />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-300 rounded cursor-pointer hover:bg-white">
                <div className="flex items-center space-x-3">
                  <input type="radio" name="exportFormat" className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-800 font-bold">Bản tóm tắt (PDF)</p>
                    <p className="text-xs text-gray-600">Chỉ thông tin chính: Phòng, Cư dân, Thời hạn, Chi phí</p>
                  </div>
                </div>
                <FileText size={20} className="text-gray-600" />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-300 rounded cursor-pointer hover:bg-white">
                <div className="flex items-center space-x-3">
                  <input type="radio" name="exportFormat" className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-800 font-bold">File Word (DOCX)</p>
                    <p className="text-xs text-gray-600">Có thể chỉnh sửa trước khi in</p>
                  </div>
                </div>
                <Download size={20} className="text-gray-600" />
              </label>
            </div>
          </div>

          {/* Contract Preview */}
          <div className="bg-white border-2 border-gray-300 rounded p-6" style={{ minHeight: '400px' }}>
            <div className="text-center mb-6">
              <h2 className="text-xl text-gray-800 font-bold">HỢP ĐỒNG THUÊ PHÒNG</h2>
              <p className="text-sm text-gray-600 mt-2">Số: {contract?.code}</p>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <p className="font-bold mb-2">BÊN CHO THUÊ (Bên A):</p>
                <p>Tên: CÔNG TY QUẢN LÝ CHUNG CƯ ABC</p>
                <p>Địa chỉ: 123 Đường XYZ, Quận ABC, TP.HCM</p>
                <p>Điện thoại: 0900123456</p>
              </div>

              <div>
                <p className="font-bold mb-2">BÊN THUÊ (Bên B):</p>
                <p>Họ tên: {headOfHousehold ? getResidentName(headOfHousehold) : contract?.tenant}</p>
                <p>CMND/CCCD: {headOfHousehold ? getResidentIdCard(headOfHousehold) : '---'}</p>
                <p>Điện thoại: {headOfHousehold ? getResidentPhone(headOfHousehold) : '---'}</p>
                <p>Email: {headOfHousehold ? getResidentEmail(headOfHousehold) : '---'}</p>
                <p className="mt-2 font-bold">Số người cùng ở: {residentList.length} người (Bao gồm chủ hộ)</p>
                {residentList.map((member: any, idx: number) => (
                  <p key={member.id || member.residentId || idx} className="ml-4">
                    {idx + 1}. {getResidentName(member)} ({member.residencyRole || 'Thành viên'}) - SĐT: {getResidentPhone(member)}
                  </p>
                ))}
              </div>

              <div>
                <p className="font-bold mb-2">ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG</p>
                <p>Bên A đồng ý cho Bên B thuê phòng <strong>{contract?.room}</strong></p>
                <p>Diện tích: <strong>50m²</strong>, Tầng <strong>1</strong></p>
              </div>

              <div>
                <p className="font-bold mb-2">ĐIỀU 2: THỜI HẠN THUÊ</p>
                <p>Từ ngày: <strong>{contract?.startDate}</strong></p>
                <p>Đến ngày: <strong>{contract?.endDate}</strong></p>
              </div>

              <div>
                <p className="font-bold mb-2">ĐIỀU 3: GIÁ CHO THUÊ VÀ PHƯƠNG THỨC THANH TOÁN</p>
                <p>Tiền thuê: <strong>{contract?.monthlyRent} VNĐ/tháng</strong></p>
                <p>Tiền cọc: <strong>{contract?.deposit} VNĐ</strong></p>
                <p>Ngày thanh toán: <strong>Ngày 5 hàng tháng</strong></p>
              </div>

              <div>
                <p className="font-bold mb-2">ĐIỀU 4: DỊCH VỤ KÈM THEO</p>
                <p>• Quản lý chung cư: 25.000 VNĐ/m²</p>
                <p>• Tiền điện: 3.500 VNĐ/kWh</p>
                <p>• Tiền nước: 25.000 VNĐ/m³</p>
                <p>• Gửi xe máy: 100.000 VNĐ/tháng</p>
              </div>

              <p className="text-xs text-gray-500 text-center pt-4">
                (Còn 5 điều khoản nữa trong bản đầy đủ...)
              </p>
            </div>
          </div>

          {/* Additional Options */}
          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <h4 className="text-sm text-blue-800 font-bold mb-3">Tùy chọn bổ sung:</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm text-blue-800 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Bao gồm chữ ký số của Ban quản lý</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-blue-800 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Đóng dấu công ty (watermark)</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-blue-800 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span>Gửi email bản PDF cho tất cả {residentList.length} thành viên</span>
              </label>
            </div>
          </div>

        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <Printer size={16} />
            <span>In ngay</span>
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Tải xuống PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}