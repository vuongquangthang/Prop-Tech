import { Save, Calculator, Filter, CheckCircle, X, AlertTriangle, Eye, Send } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../lib/api-config';
import { getCachedData, getCurrentDataCacheScope, invalidateCachedData, setCachedData } from '../../lib/memoryDataCache';
import { FilterSelect } from '../ui/FilterSelect';
import { PageHeader } from '../ui/product-system';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { useTablePagination } from '../../lib/useTablePagination';
import { TablePaginationBar } from '../ui/TablePaginationBar';

interface RoomUtilityReading {
  roomId: number;
  roomCode: string;
  buildingName?: string;
  floorName?: string;
  residentName?: string;
  elecUsageDetailId?: number;
  oldElecReading?: number;
  newElecReading?: number;
  elecRecorded: boolean;
  elecIsAnomaly?: boolean;
  elecAnomalyNote?: string;
  waterUsageDetailId?: number;
  oldWaterReading?: number;
  newWaterReading?: number;
  waterRecorded: boolean;
  waterIsAnomaly?: boolean;
  waterAnomalyNote?: string;
  readingsLocked?: boolean;
  readingsLockReason?: string;
}

interface RowEdit {
  newElec: string;
  newWater: string;
}

interface CalculatedInvoiceSummary {
  id: number;
  contractId?: number;
  invoiceNumber?: string;
  roomId?: number;
  roomCode?: string;
  roomNumber?: string;
  totalAmount: number;
  status?: string;
  month?: number;
  year?: number;
}

interface UtilityReadingTableProps {
  embedded?: boolean;
}

const normalizeStatusText = (value?: string) =>
  (value || '')
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');

const isDraftInvoiceStatus = (status?: string) => {
  const normalized = normalizeStatusText(status);
  return normalized === 'draft' || normalized === 'nhap';
};

const extractInvoiceList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const UTILITY_READING_CACHE_TTL_MS = 2 * 60 * 1000;
const HIGH_ELECTRICITY_CONSUMPTION_THRESHOLD = 1000;
const HIGH_WATER_CONSUMPTION_THRESHOLD = 100;

export function UtilityReadingTable({ embedded = false }: UtilityReadingTableProps = {}) {
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [rooms, setRooms] = useState<RoomUtilityReading[]>([]);
  const [edits, setEdits] = useState<Record<number, RowEdit>>({});
  const [editedRoomIds, setEditedRoomIds] = useState<Set<number>>(new Set());
  const [recentlySavedRoomIds, setRecentlySavedRoomIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [calculateModal, setCalculateModal] = useState(false);
  const [calculatedInvoices, setCalculatedInvoices] = useState<CalculatedInvoiceSummary[]>([]);
  const [lockedCalculatedRoomIds, setLockedCalculatedRoomIds] = useState<Set<number>>(new Set());
  const [modalInvoiceId, setModalInvoiceId] = useState<number | null>(null);
  const [sendingInvoices, setSendingInvoices] = useState(false);
  const [sendResult, setSendResult] = useState('');
  const [showAllSkippedReasons, setShowAllSkippedReasons] = useState(false);
  const [showAllCalculationErrors, setShowAllCalculationErrors] = useState(false);
  const [showAllCalculationWarnings, setShowAllCalculationWarnings] = useState(false);
  const [calcResult, setCalcResult] = useState<{
    totalContracts: number;
    totalInvoices: number;
    totalAmount: number;
    skipped: number;
    invoices?: CalculatedInvoiceSummary[];
    skippedReasons: string[];
    errors: string[];
    warnings: string[];
  } | null>(null);

  const hydrateReadings = useCallback((data: RoomUtilityReading[]) => {
    setRooms(data);
    const initEdits: Record<number, RowEdit> = {};
    data.forEach(r => {
      initEdits[r.roomId] = {
        newElec: r.newElecReading != null ? String(r.newElecReading) : '',
        newWater: r.newWaterReading != null ? String(r.newWaterReading) : '',
      };
    });
    setEdits(initEdits);
  }, []);

  const loadReadings = useCallback(async ({ force = false, silent = false }: { force?: boolean; silent?: boolean } = {}) => {
    const cacheScope = getCurrentDataCacheScope();
    const cacheKey = `utility-readings:${cacheScope}:${selectedYear}:${selectedMonth}`;
    const cached = !force ? getCachedData<RoomUtilityReading[]>(cacheKey, UTILITY_READING_CACHE_TTL_MS) : null;

    if (cached) {
      hydrateReadings(cached);
      setErrors([]);
      setWarnings([]);
      return;
    }

    if (!silent) setLoading(true);
    setErrors([]);
    setWarnings([]);
    try {
      const res = await api.get<RoomUtilityReading[]>(API_ENDPOINTS.UTILITY_READINGS.MONTH(selectedYear, selectedMonth));
      setCachedData(cacheKey, res.data);
      hydrateReadings(res.data);
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Không thể tải dữ liệu. Vui lòng kiểm tra kết nối.']);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [hydrateReadings, selectedYear, selectedMonth]);

  useEffect(() => { loadReadings(); }, [loadReadings]);

  useEffect(() => {
    const handleInvoiceUpdated = () => {
      invalidateCachedData(`utility-readings:${getCurrentDataCacheScope()}:`);
    };

    window.addEventListener('billing-invoices-updated', handleInvoiceUpdated);
    return () => window.removeEventListener('billing-invoices-updated', handleInvoiceUpdated);
  }, []);

  useEffect(() => {
    setLockedCalculatedRoomIds(new Set());
    setCalculatedInvoices([]);
    setCalcResult(null);
    setSendResult('');
    setEditedRoomIds(new Set());
    setRecentlySavedRoomIds([]);
    setShowAllSkippedReasons(false);
    setShowAllCalculationErrors(false);
    setShowAllCalculationWarnings(false);
  }, [selectedMonth, selectedYear]);

  const handleInputChange = (roomId: number, field: 'newElec' | 'newWater', value: string) => {
    const integerOnly = value.replace(/[^0-9]/g, '');
    setEdits(prev => ({ ...prev, [roomId]: { ...prev[roomId], [field]: integerOnly } }));
    setEditedRoomIds(prev => {
      const next = new Set(prev);
      next.add(roomId);
      return next;
    });
  };

  const isAbnormal = (room: RoomUtilityReading, field: 'elec' | 'water') => {
    const edit = edits[room.roomId];
    if (!edit) return false;
    const newVal = parseFloat(field === 'elec' ? edit.newElec : edit.newWater);
    const oldVal = (field === 'elec' ? room.oldElecReading : room.oldWaterReading) ?? 0;
    if (isNaN(newVal)) return false;
    if (newVal < oldVal) return true;
    const usage = newVal - oldVal;
    if (field === 'elec' && usage > HIGH_ELECTRICITY_CONSUMPTION_THRESHOLD) return true;
    if (field === 'water' && usage > HIGH_WATER_CONSUMPTION_THRESHOLD) return true;
    return field === 'elec' ? !!room.elecIsAnomaly : !!room.waterIsAnomaly;
  };

  const getReadingWarning = (room: RoomUtilityReading, field: 'elec' | 'water') => {
    const edit = edits[room.roomId];
    if (!edit) return field === 'elec' ? room.elecAnomalyNote : room.waterAnomalyNote;

    const newVal = parseFloat(field === 'elec' ? edit.newElec : edit.newWater);
    const oldVal = (field === 'elec' ? room.oldElecReading : room.oldWaterReading) ?? 0;
    if (isNaN(newVal)) return field === 'elec' ? room.elecAnomalyNote : room.waterAnomalyNote;
    if (newVal < oldVal) return `Chỉ số ${field === 'elec' ? 'điện' : 'nước'} mới không được nhỏ hơn chỉ số cũ`;

    const usage = newVal - oldVal;
    if (field === 'elec' && usage > HIGH_ELECTRICITY_CONSUMPTION_THRESHOLD) {
      return `Tiêu thụ điện cao bất thường: ${usage.toLocaleString('vi-VN')} kWh`;
    }
    if (field === 'water' && usage > HIGH_WATER_CONSUMPTION_THRESHOLD) {
      return `Tiêu thụ nước cao bất thường: ${usage.toLocaleString('vi-VN')} m³`;
    }

    return field === 'elec' ? room.elecAnomalyNote : room.waterAnomalyNote;
  };

  const calcUsage = (room: RoomUtilityReading, field: 'elec' | 'water') => {
    const edit = edits[room.roomId];
    if (!edit) return '-';
    const newVal = parseInt(field === 'elec' ? edit.newElec : edit.newWater, 10);
    const oldVal = (field === 'elec' ? room.oldElecReading : room.oldWaterReading) ?? 0;
    if (isNaN(newVal)) return '-';
    const usage = newVal - oldVal;
    return usage >= 0 ? String(Math.round(usage)) : '-';
  };

  const hasEnteredRequiredReadings = (room: RoomUtilityReading) => {
    const edit = edits[room.roomId];
    if (!edit) return false;
    const requiresElec = Boolean(room.elecUsageDetailId);
    const requiresWater = Boolean(room.waterUsageDetailId);
    if (!requiresElec && !requiresWater) return false;
    return (!requiresElec || Boolean(edit.newElec)) && (!requiresWater || Boolean(edit.newWater));
  };

  const hasSavedRequiredReadings = (room: RoomUtilityReading) => {
    const requiresElec = Boolean(room.elecUsageDetailId);
    const requiresWater = Boolean(room.waterUsageDetailId);
    if (!requiresElec && !requiresWater) return false;
    return (!requiresElec || room.elecRecorded) && (!requiresWater || room.waterRecorded);
  };

  const getEditedEnteredRoomIds = () => rooms
    .filter(room => editedRoomIds.has(room.roomId))
    .filter(hasEnteredRequiredReadings)
    .map(room => room.roomId);

  const saveReadingsBatch = async ({ showSuccess = true }: { showSuccess?: boolean } = {}) => {
    setSaving(true);
    setErrors([]);
    setWarnings([]);
    if (showSuccess) setSuccessMsg('');
    try {
      const targetRoomIds = getEditedEnteredRoomIds();
      if (targetRoomIds.length === 0) {
        return {
          ok: true,
          roomIds: [],
        };
      }

      const payload = rooms
        .filter(r =>
          targetRoomIds.includes(r.roomId)
          &&
          !r.readingsLocked
        )
        .map(r => ({
          roomId: r.roomId,
          month: selectedMonth,
          year: selectedYear,
          elecUsageDetailId: r.elecUsageDetailId,
          waterUsageDetailId: r.waterUsageDetailId,
          newElecReading: r.elecUsageDetailId && edits[r.roomId]?.newElec ? parseInt(edits[r.roomId].newElec, 10) : undefined,
          newWaterReading: r.waterUsageDetailId && edits[r.roomId]?.newWater ? parseInt(edits[r.roomId].newWater, 10) : undefined,
        }));

      const res = await api.post<{ success: number; failed: number; errors: string[]; warnings: string[] }>(
        API_ENDPOINTS.UTILITY_READINGS.RECORD_BATCH, payload
      );
      const data = res.data;
      const responseErrors = data.errors || [];
      const responseWarnings = data.warnings || [];
      if (showSuccess) {
        setSuccessMsg(`✅ Đã lưu ${data.success} phòng thành công${data.failed > 0 ? `, ${data.failed} lỗi` : ''}.`);
      }
      if (data.failed === 0 && responseErrors.length === 0) {
        setRecentlySavedRoomIds(targetRoomIds);
        setEditedRoomIds(prev => {
          const next = new Set(prev);
          targetRoomIds.forEach(roomId => next.delete(roomId));
          return next;
        });
      }
      invalidateCachedData(`utility-readings:${getCurrentDataCacheScope()}:`);
      await loadReadings({ force: true, silent: true });
      if (responseErrors.length > 0) setErrors(responseErrors);
      if (responseWarnings.length > 0) setWarnings(responseWarnings);
      return {
        ok: data.failed === 0 && responseErrors.length === 0,
        roomIds: targetRoomIds,
      };
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Lỗi khi lưu chỉ số.']);
      return { ok: false, roomIds: [] };
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBatch = async () => {
    await saveReadingsBatch();
  };

  const loadCalculatedInvoices = async () => {
    // Prefer the dedicated drafts endpoint; fallback to base list if needed.
    const [draftsRes, invoicesRes] = await Promise.all([
      api.get(API_ENDPOINTS.INVOICES.DRAFTS).catch(() => ({ data: [] })),
      api.get(API_ENDPOINTS.INVOICES.BASE).catch(() => ({ data: [] })),
    ]);

    const allCandidates = [
      ...extractInvoiceList(draftsRes.data),
      ...extractInvoiceList(invoicesRes.data),
    ];

    const uniqueById = new Map<number, any>();
    allCandidates.forEach((candidate) => {
      const id = Number(candidate?.id);
      if (Number.isFinite(id) && id > 0 && !uniqueById.has(id)) {
        uniqueById.set(id, candidate);
      }
    });

    return Array.from(uniqueById.values())
      .filter(inv => Number(inv.month) === selectedMonth && Number(inv.year) === selectedYear)
      .filter(inv => isDraftInvoiceStatus(inv.status))
      .map((inv: any) => ({
        ...inv,
        contractId: inv.contractId ?? inv.hopDongId,
        roomId: inv.roomId ?? inv.phongId,
        roomCode: inv.roomCode || inv.roomNumber || inv.soPhong || '',
        roomNumber: inv.roomNumber || inv.roomCode || inv.soPhong || '',
      }));
  };

  const handleCalculate = async () => {
    setCalculating(true);
    setErrors([]);
    setWarnings([]);
    setSuccessMsg('');
    try {
      const saved = await saveReadingsBatch({ showSuccess: false });
      if (!saved.ok) return;

      const enteredRoomIds = saved.roomIds.length > 0
        ? saved.roomIds
        : recentlySavedRoomIds.length > 0
          ? recentlySavedRoomIds
          : [];
      if (enteredRoomIds.length === 0) {
        setErrors(['Vui lòng nhập chỉ số cho ít nhất một phòng trước khi tính hóa đơn.']);
        return;
      }

      const res = await api.post<{
        totalContracts: number;
        totalInvoices: number;
        totalAmount: number;
        skipped: number;
        invoices?: CalculatedInvoiceSummary[];
        skippedReasons: string[];
        errors: string[];
        warnings: string[];
      }>(
        API_ENDPOINTS.INVOICES.CALCULATE(selectedYear, selectedMonth),
        { roomIds: enteredRoomIds }
      );

      const displayDrafts = res.data.invoices
        ? res.data.invoices.map((inv: any) => ({
            ...inv,
            contractId: inv.contractId ?? inv.hopDongId,
            roomId: inv.roomId ?? inv.phongId,
            roomCode: inv.roomCode || inv.roomNumber || inv.soPhong || '',
            roomNumber: inv.roomNumber || inv.roomCode || inv.soPhong || '',
          }))
        : await loadCalculatedInvoices();

      setCalcResult(res.data);
      setLockedCalculatedRoomIds(new Set(enteredRoomIds));
      setCalculatedInvoices(displayDrafts);
      setSendResult('');
      setShowAllSkippedReasons(false);
      setShowAllCalculationErrors(false);
      setShowAllCalculationWarnings(false);
      setCalculateModal(true);
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Lỗi khi tính toán hóa đơn.']);
    } finally {
      setCalculating(false);
    }
  };

  const handleSendCalculatedInvoices = async () => {
    const invoiceIds = calculatedInvoices.map(inv => inv.id);
    if (invoiceIds.length === 0) return;
    setSendingInvoices(true);
    setSendResult('');
    setErrors([]);
    try {
      const res = await api.post<{ success: number; failed: number; errors: string[] }>(
        API_ENDPOINTS.INVOICES.APPROVE_BATCH,
        { invoiceIds }
      );
      if (res.data.errors?.length > 0) setErrors(res.data.errors);
      const message = `Đã gửi ${res.data.success} hóa đơn cho cư dân${res.data.failed > 0 ? `, ${res.data.failed} lỗi` : ''}.`;
      setSendResult(message);
      setCalculatedInvoices([]);
      await loadReadings();
      window.dispatchEvent(new CustomEvent('billing-invoices-updated'));
      if (res.data.success > 0 && res.data.failed === 0) {
        setCalculateModal(false);
        setCalcResult(null);
        setSuccessMsg(message);
      }
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Lỗi khi gửi hóa đơn.']);
    } finally {
      setSendingInvoices(false);
    }
  };

  const buildingOptions = useMemo(() => {
    const buildings = new Set<string>();
    rooms.forEach(room => {
      const buildingName = (room.buildingName || '').trim();
      if (buildingName) buildings.add(buildingName);
    });
    return Array.from(buildings).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [rooms]);

  const floorOptions = useMemo(() => {
    const floors = new Set<string>();
    rooms.forEach(room => {
      const buildingName = (room.buildingName || '').trim();
      if (selectedBuilding !== 'all' && buildingName !== selectedBuilding) return;
      const floorName = (room.floorName || '').trim();
      if (floorName) floors.add(floorName);
    });
    return Array.from(floors).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
  }, [rooms, selectedBuilding]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const buildingName = (room.buildingName || '').trim();
      const floorName = (room.floorName || '').trim();
      const matchesBuilding = selectedBuilding === 'all' || buildingName === selectedBuilding;
      const matchesFloor = selectedFloor === 'all' || floorName === selectedFloor;
      return matchesBuilding && matchesFloor;
    });
  }, [rooms, selectedBuilding, selectedFloor]);

  const sortedFilteredRooms = useMemo(() => {
    return filteredRooms
      .map((room, index) => ({ room, index }))
      .sort((left, right) => {
        const getRank = (room: RoomUtilityReading) => {
          const hasRequiredService = Boolean(room.elecUsageDetailId || room.waterUsageDetailId);
          if (!hasRequiredService) return 3;
          if (!hasSavedRequiredReadings(room)) return room.readingsLocked ? 2 : 0;
          return 1;
        };

        const rankDiff = getRank(left.room) - getRank(right.room);
        return rankDiff !== 0 ? rankDiff : left.index - right.index;
      })
      .map(({ room }) => room);
  }, [filteredRooms]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    pagedItems: pagedRooms,
  } = useTablePagination(sortedFilteredRooms, {
    initialPageSize: 10,
    resetDeps: [selectedBuilding, selectedFloor, selectedMonth, selectedYear],
  });

  useEffect(() => {
    if (selectedFloor !== 'all' && !floorOptions.includes(selectedFloor)) {
      setSelectedFloor('all');
    }
  }, [floorOptions, selectedFloor]);

  const fillableRooms = filteredRooms.filter(room => room.elecUsageDetailId || room.waterUsageDetailId);
  const filledCount = fillableRooms.filter(hasEnteredRequiredReadings).length;

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const yearOptions = [currentYear, currentYear - 1];
  // Only allow selecting current month and past months, not future months
  const maxMonthForSelectedYear = selectedYear === currentYear ? currentMonth : 12;
  const monthOptions = Array.from({ length: maxMonthForSelectedYear }, (_, i) => i + 1);

  const isFuturePeriod = selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth);
  const missingSkippedReasonCount = calcResult
    ? Math.max(0, Number(calcResult.skipped || 0) - calcResult.skippedReasons.length)
    : 0;

  useEffect(() => {
    if (selectedMonth > maxMonthForSelectedYear) {
      setSelectedMonth(maxMonthForSelectedYear);
    }
  }, [selectedMonth, maxMonthForSelectedYear]);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-between)' }}>
        {!embedded && (
          <PageHeader
            eyebrow="Hóa đơn & Tài chính"
            title="Chốt chỉ số điện/nước"
            description="Nhập chỉ số theo tháng và chỉ tính hóa đơn cho các phòng có dữ liệu hợp lệ."
          />
        )}

        {/* Filter Bar */}
        <div
          className="flex w-full items-center"
          style={{ gap: '12px', overflowX: 'auto', whiteSpace: 'nowrap', justifyContent: 'space-between' }}
        >
          <div className="flex min-w-0 items-center" style={{ gap: '12px', flexWrap: 'nowrap' }}>
            <Filter size={18} style={{ color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }} />

            <FilterSelect
              wrapperClassName="w-[150px] min-w-[150px] max-w-[150px] flex-none"
              className="w-full focus:outline-none"
              style={{ width: '100%', minWidth: 0, maxWidth: '100%', fieldSizing: 'fixed' } as React.CSSProperties}
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
            >
              {monthOptions.map(m => <option key={m} value={m}>Tháng {String(m).padStart(2, '0')}</option>)}
            </FilterSelect>

            <FilterSelect
              wrapperClassName="w-[112px] min-w-[112px] max-w-[112px] flex-none"
              className="w-full focus:outline-none"
              style={{ width: '100%', minWidth: 0, maxWidth: '100%', fieldSizing: 'fixed' } as React.CSSProperties}
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </FilterSelect>

            <FilterSelect
              wrapperClassName="w-[170px] min-w-[170px] max-w-[170px] flex-none"
              className="w-full focus:outline-none"
              style={{ width: '100%', minWidth: 0, maxWidth: '100%', fieldSizing: 'fixed' } as React.CSSProperties}
              value={selectedBuilding}
              onChange={e => {
                setSelectedBuilding(e.target.value);
                setSelectedFloor('all');
              }}
            >
              <option value="all">Tất cả tòa</option>
              {buildingOptions.map(building => (
                <option key={building} value={building}>{building}</option>
              ))}
            </FilterSelect>

            <FilterSelect
              wrapperClassName="w-[150px] min-w-[150px] max-w-[150px] flex-none"
              className="w-full focus:outline-none"
              style={{ width: '100%', minWidth: 0, maxWidth: '100%', fieldSizing: 'fixed' } as React.CSSProperties}
              value={selectedFloor}
              onChange={e => setSelectedFloor(e.target.value)}
            >
              <option value="all">Tất cả tầng</option>
              {floorOptions.map(floor => (
                <option key={floor} value={floor}>{`Tầng ${floor}`}</option>
              ))}
            </FilterSelect>

            <div style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)', marginLeft: '12px', flexShrink: 0 }}>
              Đã nhập: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{filledCount}/{fillableRooms.length}</span> phòng
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center justify-end" style={{ gap: '10px' }}>
            <button
              onClick={handleSaveBatch}
              disabled={saving || loading || isFuturePeriod}
              className="flex items-center rounded transition-colors hover:bg-[var(--brand-surface)]"
              style={{ padding: '0 18px', backgroundColor: 'var(--surface-card)', border: '2px solid var(--brand-primary)', color: 'var(--brand-primary)', fontSize: 'var(--type-body)', fontWeight: 600, borderRadius: 'var(--radius-button)', height: '42px', gap: '8px', opacity: (saving || isFuturePeriod) ? 0.6 : 1, cursor: isFuturePeriod ? 'not-allowed' : 'pointer' }}
              title={isFuturePeriod ? 'Không thể nhập chỉ số cho tháng tương lai' : ''}
            >
              <Save size={18} />
              <span>{saving ? 'Đang lưu...' : 'Lưu chỉ số'}</span>
            </button>
            <button
              onClick={handleCalculate}
              disabled={calculating || saving || loading}
              className="flex items-center rounded transition-colors"
              style={{ padding: '0 18px', backgroundColor: 'var(--brand-primary)', border: 'none', color: 'var(--text-on-color)', fontSize: 'var(--type-body)', fontWeight: 600, borderRadius: 'var(--radius-button)', height: '42px', gap: '8px', opacity: (calculating || saving) ? 0.6 : 1 }}
            >
              <Calculator size={18} />
              <span>{saving ? 'Đang lưu...' : calculating ? 'Đang tính...' : 'Tính hóa đơn'}</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="bg-green-50 border border-green-300 rounded p-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-sm text-green-800">{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="ml-auto"><X size={14} /></button>
          </div>
        )}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-300 rounded p-3">
            {errors.map((e, i) => <p key={i} className="text-sm text-red-800">⚠️ {e}</p>)}
          </div>
        )}
        {warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
            {warnings.map((w, i) => <p key={i} className="text-sm text-yellow-800">⚠️ {w}</p>)}
          </div>
        )}

        {/* Table */}
        <div className="rounded" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-card)' }}>
          <div style={{ borderBottom: '1px solid var(--surface-border)', padding: 'var(--space-card)' }}>
            <h2 className="table-section-title">
              Chỉ số Điện/Nước — Tháng {String(selectedMonth).padStart(2, '0')}/{selectedYear}
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
          ) : rooms.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Không có phòng nào đang có hợp đồng.</div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Không có phòng phù hợp với bộ lọc tòa/tầng.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--surface-bg)', borderBottom: '1px solid var(--surface-border)' }}>
                  <tr>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>Phòng</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>Cư dân</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>Điện cũ (kWh)</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>Điện mới</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>Tiêu thụ</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>Nước cũ (m³)</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>Nước mới</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>Tiêu thụ</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRooms.map(room => {
                    const edit = edits[room.roomId] || { newElec: '', newWater: '' };
                    const elecAbnormal = isAbnormal(room, 'elec');
                    const waterAbnormal = isAbnormal(room, 'water');
                    const elecUsage = calcUsage(room, 'elec');
                    const waterUsage = calcUsage(room, 'water');
                    const rowLocked = Boolean(room.readingsLocked) || lockedCalculatedRoomIds.has(room.roomId);
                    const elecApplicable = Boolean(room.elecUsageDetailId);
                    const waterApplicable = Boolean(room.waterUsageDetailId);
                    const lockTitle = room.readingsLockReason || 'Phòng đã được tính hóa đơn, không thể sửa chỉ số.';
                    const elecWarning = getReadingWarning(room, 'elec');
                    const waterWarning = getReadingWarning(room, 'water');

                    return (
                      <tr
                        key={room.roomId}
                        style={{
                          borderBottom: '1px solid var(--surface-border)',
                          opacity: rowLocked ? 0.55 : 1,
                          backgroundColor: rowLocked ? 'var(--surface-bg)' : undefined,
                        }}
                        className="hover:bg-[var(--surface-bg)] transition-colors"
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{room.roomCode}</span>
                          {room.buildingName && <div style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>{room.floorName ? `Tầng ${room.floorName} - ` : ''}{room.buildingName}</div>}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 'var(--type-body)', color: 'var(--text-secondary)' }}>{room.residentName || '-'}</td>

                        {/* Điện cũ */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)' }}>{room.oldElecReading ?? 0}</span>
                        </td>
                        {/* Điện mới */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {elecApplicable ? (
                            <input
                              type="number"
                              step={1}
                              placeholder="Nhập..."
                              value={edit.newElec}
                              onChange={e => handleInputChange(room.roomId, 'newElec', e.target.value)}
                              disabled={isFuturePeriod || rowLocked}
                              className="focus:outline-none"
                              title={rowLocked ? lockTitle : elecWarning || undefined}
                              style={{ width: '90px', padding: '8px', textAlign: 'center', fontSize: 'var(--type-body)', border: `1px solid ${elecAbnormal ? 'var(--error)' : 'var(--surface-border)'}`, borderRadius: 'var(--radius-button)', color: 'var(--text-primary)', backgroundColor: (isFuturePeriod || rowLocked) ? 'var(--surface-bg)' : 'white', cursor: (isFuturePeriod || rowLocked) ? 'not-allowed' : 'text' }}
                            />
                          ) : <span style={{ color: 'var(--text-secondary)' }}>Không áp dụng</span>}
                        </td>
                        {/* Tiêu thụ điện */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div className="flex flex-col items-center gap-1">
                            <span style={{ fontWeight: 700, color: elecAbnormal ? 'var(--error)' : elecUsage !== '-' ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
                              {elecUsage} {elecAbnormal && <AlertTriangle size={14} className="inline" />}
                            </span>
                            {elecWarning && elecAbnormal && (
                              <span className="text-[11px] font-semibold text-red-600">Bất thường</span>
                            )}
                          </div>
                        </td>

                        {/* Nước cũ */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)' }}>{room.oldWaterReading ?? 0}</span>
                        </td>
                        {/* Nước mới */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {waterApplicable ? (
                            <input
                              type="number"
                              step={1}
                              placeholder="Nhập..."
                              value={edit.newWater}
                              onChange={e => handleInputChange(room.roomId, 'newWater', e.target.value)}
                              disabled={isFuturePeriod || rowLocked}
                              className="focus:outline-none"
                              title={rowLocked ? lockTitle : waterWarning || undefined}
                              style={{ width: '90px', padding: '8px', textAlign: 'center', fontSize: 'var(--type-body)', border: `1px solid ${waterAbnormal ? 'var(--error)' : 'var(--surface-border)'}`, borderRadius: 'var(--radius-button)', color: 'var(--text-primary)', backgroundColor: (isFuturePeriod || rowLocked) ? 'var(--surface-bg)' : 'white', cursor: (isFuturePeriod || rowLocked) ? 'not-allowed' : 'text' }}
                            />
                          ) : <span style={{ color: 'var(--text-secondary)' }}>Không áp dụng</span>}
                        </td>
                        {/* Tiêu thụ nước */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div className="flex flex-col items-center gap-1">
                            <span style={{ fontWeight: 700, color: waterAbnormal ? 'var(--error)' : waterUsage !== '-' ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
                              {waterUsage} {waterAbnormal && <AlertTriangle size={14} className="inline" />}
                            </span>
                            {waterWarning && waterAbnormal && (
                              <span className="text-[11px] font-semibold text-red-600">Cảnh báo bất thường</span>
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
          {filteredRooms.length > 0 && (
            <TablePaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      </div>

      {/* Calculate Result Modal */}
      {calculateModal && calcResult && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-full max-w-[1180px] max-h-[90vh] overflow-y-auto mx-4">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calculator size={20} className="text-gray-800" />
                <h3 className="text-base font-semibold text-gray-800">Tạo thành công {calcResult.totalInvoices} hóa đơn</h3>
              </div>
              <button
                type="button"
                onClick={() => setCalculateModal(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Summary row */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <p className="text-xs text-gray-500 mb-1">Hợp đồng xử lý</p>
                  <p className="text-xl font-bold text-gray-800">{calcResult.totalContracts}</p>
                </div>
                <div className={`border rounded p-3 ${calcResult.totalInvoices > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="text-xs text-gray-500 mb-1">Hóa đơn đã tạo</p>
                  <p className={`text-xl font-bold ${calcResult.totalInvoices > 0 ? 'text-green-700' : 'text-gray-400'}`}>{calcResult.totalInvoices}</p>
                </div>
                <div className={`border rounded p-3 ${calcResult.skipped > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="text-xs text-gray-500 mb-1">Bỏ qua</p>
                  <p className={`text-xl font-bold ${calcResult.skipped > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>{calcResult.skipped}</p>
                </div>
              </div>

              {/* Success / warning banner */}
              {calcResult.totalInvoices > 0 ? (
                <div className="bg-green-50 border border-green-300 rounded p-4 flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-800 text-sm">Tạo hóa đơn thành công!</p>
                    <p className="text-sm text-green-700 mt-1">Tổng tiền: <strong>{calcResult.totalAmount.toLocaleString('vi-VN')} đ</strong></p>
                    <p className="text-xs text-green-700 mt-1">Các phòng đã nhập chỉ số đã được khóa để tránh sửa sau khi tính hóa đơn.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-300 rounded p-4 flex items-start gap-3">
                  <AlertTriangle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-800 text-sm">Không có hóa đơn nào được tạo mới.</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {calcResult.skipped > 0
                        ? 'Tất cả hợp đồng đã có hóa đơn được phê duyệt hoặc đã thanh toán.'
                        : calcResult.totalContracts === 0
                          ? 'Không tìm thấy hợp đồng nào có cư dân đang ở. Vui lòng kiểm tra dữ liệu hợp đồng.'
                          : 'Kiểm tra chi tiết bên dưới.'}
                    </p>
                  </div>
                </div>
              )}

              {calculatedInvoices.length > 0 && (
                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Mã phòng</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Số tiền</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Xem chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculatedInvoices.map(invoice => (
                        <tr
                          key={invoice.id}
                          className="cursor-pointer border-t border-gray-200 hover:bg-gray-50"
                          onClick={() => setModalInvoiceId(invoice.id)}
                        >
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {invoice.roomCode || invoice.roomNumber || `#${invoice.roomId}`}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                            {(invoice.totalAmount || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-4 py-3 text-center" onClick={(event) => event.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setModalInvoiceId(invoice.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                              title="Xem chi tiết"
                              aria-label="Xem chi tiết"
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {calcResult.totalInvoices > 0 && calculatedInvoices.length === 0 && !sendResult && (
                <div className="bg-yellow-50 border border-yellow-300 rounded p-3 text-sm text-yellow-800">
                  Hóa đơn đã được tính nhưng không tìm thấy hóa đơn nháp để gửi. Vui lòng kiểm tra danh sách hóa đơn.
                </div>
              )}

              {sendResult && (
                <div className="bg-green-50 border border-green-300 rounded p-3 text-sm font-semibold text-green-800">
                  {sendResult}
                </div>
              )}

              {/* Skipped reasons */}
              {(calcResult.skipped > 0 || calcResult.skippedReasons.length > 0) && (
                <div className="bg-yellow-50 border border-yellow-300 rounded p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-yellow-600" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-800">Phòng bị bỏ qua</p>
                        <p className="mt-0.5 text-xs text-yellow-700">{calcResult.skipped || calcResult.skippedReasons.length} phòng không tạo hóa đơn</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAllSkippedReasons((current) => !current)}
                      disabled={calcResult.skippedReasons.length === 0 && missingSkippedReasonCount === 0}
                      className="shrink-0 rounded border border-yellow-300 bg-white px-3 py-1.5 text-xs font-semibold text-yellow-700 hover:bg-yellow-100"
                      title={showAllSkippedReasons ? 'Thu gọn' : 'Mở danh sách'}
                      aria-label={showAllSkippedReasons ? 'Thu gọn' : 'Mở danh sách'}
                    >
                      {showAllSkippedReasons ? 'v' : '>'}
                    </button>
                  </div>
                  {showAllSkippedReasons && (
                    <div className="mt-3 max-h-44 space-y-1 overflow-y-auto border-t border-yellow-200 pt-3 pr-1">
                      {calcResult.skippedReasons.map((reason, index) => (
                        <p key={index} className="text-xs text-yellow-700">• {reason}</p>
                      ))}
                      {missingSkippedReasonCount > 0 && (
                        <p className="text-xs text-yellow-700">
                          • Còn {missingSkippedReasonCount} phòng/hợp đồng đã được bỏ qua nhưng backend chưa trả chi tiết.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Calculation errors */}
              {calcResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-300 rounded p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-red-600" />
                      <div>
                        <p className="text-sm font-semibold text-red-800">Lỗi không tạo được hóa đơn</p>
                        <p className="mt-0.5 text-xs text-red-700">{calcResult.errors.length} lỗi cần xử lý</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAllCalculationErrors((current) => !current)}
                      className="shrink-0 rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      {showAllCalculationErrors ? 'Thu gọn' : 'Xem'}
                    </button>
                  </div>
                  {showAllCalculationErrors && (
                    <div className="mt-3 max-h-36 space-y-1 overflow-y-auto border-t border-red-200 pt-3 pr-1">
                      {calcResult.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-700">• {error}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {calcResult.warnings.length > 0 && (
                <div className="bg-orange-50 border border-orange-300 rounded p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-orange-600" />
                      <div>
                        <p className="text-sm font-semibold text-orange-800">Cảnh báo cần kiểm tra</p>
                        <p className="mt-0.5 text-xs text-orange-700">{calcResult.warnings.length} cảnh báo công thức/dịch vụ</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAllCalculationWarnings((current) => !current)}
                      className="shrink-0 rounded border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                    >
                      {showAllCalculationWarnings ? 'Thu gọn' : 'Xem'}
                    </button>
                  </div>
                  {showAllCalculationWarnings && (
                    <div className="mt-3 max-h-36 space-y-1 overflow-y-auto border-t border-orange-200 pt-3 pr-1">
                      {calcResult.warnings.map((warning, index) => (
                        <p key={index} className="text-xs text-orange-700">• {warning}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCalculateModal(false)}
                  className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSendCalculatedInvoices}
                  disabled={sendingInvoices || calculatedInvoices.length === 0}
                  className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  <Send size={16} />
                  {sendingInvoices ? 'Đang gửi...' : 'Gửi hóa đơn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {modalInvoiceId && (
        <InvoiceDetailModal
          invoiceId={modalInvoiceId}
          isDraft
          onClose={() => setModalInvoiceId(null)}
          onApprove={() => setModalInvoiceId(null)}
          onReject={() => setModalInvoiceId(null)}
        />
      )}
    </>
  );
}
