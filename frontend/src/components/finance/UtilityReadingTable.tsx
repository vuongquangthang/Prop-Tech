import { Save, Calculator, Filter, CheckCircle, X, AlertTriangle, Eye, Send } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../lib/api-config';
import { FilterSelect } from '../ui/FilterSelect';
import { PageHeader } from '../ui/product-system';
import { InvoiceDetailModal } from './InvoiceDetailModal';

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

const CALCULATION_RESULT_PREVIEW_LIMIT = 5;

export function UtilityReadingTable({ embedded = false }: UtilityReadingTableProps = {}) {
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [rooms, setRooms] = useState<RoomUtilityReading[]>([]);
  const [edits, setEdits] = useState<Record<number, RowEdit>>({});
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
    skippedReasons: string[];
    errors: string[];
    warnings: string[];
  } | null>(null);

  const loadReadings = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    setWarnings([]);
    try {
      const res = await api.get<RoomUtilityReading[]>(API_ENDPOINTS.UTILITY_READINGS.MONTH(selectedYear, selectedMonth));
      setRooms(res.data);
      // Init edits with existing recorded values
      const initEdits: Record<number, RowEdit> = {};
      res.data.forEach(r => {
        initEdits[r.roomId] = {
          newElec: r.newElecReading != null ? String(r.newElecReading) : '',
          newWater: r.newWaterReading != null ? String(r.newWaterReading) : '',
        };
      });
      setEdits(initEdits);
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Không thể tải dữ liệu. Vui lòng kiểm tra kết nối.']);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => { loadReadings(); }, [loadReadings]);

  useEffect(() => {
    setLockedCalculatedRoomIds(new Set());
    setCalculatedInvoices([]);
    setCalcResult(null);
    setSendResult('');
    setShowAllSkippedReasons(false);
    setShowAllCalculationErrors(false);
    setShowAllCalculationWarnings(false);
  }, [selectedMonth, selectedYear]);

  const handleInputChange = (roomId: number, field: 'newElec' | 'newWater', value: string) => {
    const integerOnly = value.replace(/[^0-9]/g, '');
    setEdits(prev => ({ ...prev, [roomId]: { ...prev[roomId], [field]: integerOnly } }));
  };

  const isAbnormal = (room: RoomUtilityReading, field: 'elec' | 'water') => {
    const edit = edits[room.roomId];
    if (!edit) return false;
    const newVal = parseFloat(field === 'elec' ? edit.newElec : edit.newWater);
    const oldVal = (field === 'elec' ? room.oldElecReading : room.oldWaterReading) ?? 0;
    if (isNaN(newVal)) return false;
    if (newVal < oldVal) return true;
    return field === 'elec' ? !!room.elecIsAnomaly : !!room.waterIsAnomaly;
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

  const saveReadingsBatch = async ({ showSuccess = true }: { showSuccess?: boolean } = {}) => {
    setSaving(true);
    setErrors([]);
    setWarnings([]);
    if (showSuccess) setSuccessMsg('');
    try {
      const payload = rooms
        .filter(r =>
          !r.readingsLocked
          && (
            (r.elecUsageDetailId && edits[r.roomId]?.newElec)
            || (r.waterUsageDetailId && edits[r.roomId]?.newWater)
          )
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
      if (data.errors.length > 0) setErrors(data.errors);
      if (data.warnings?.length > 0) setWarnings(data.warnings);
      if (showSuccess) {
        setSuccessMsg(`✅ Đã lưu ${data.success} phòng thành công${data.failed > 0 ? `, ${data.failed} lỗi` : ''}.`);
      }
      await loadReadings();
      return data.failed === 0 && data.errors.length === 0;
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Lỗi khi lưu chỉ số.']);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBatch = async () => {
    await saveReadingsBatch();
  };

  const getEnteredRoomIds = () => rooms
    .filter(hasEnteredRequiredReadings)
    .map(r => r.roomId);

  const loadCalculatedInvoices = async (roomIds: number[]) => {
    if (roomIds.length === 0) return [];
    const res = await api.get<CalculatedInvoiceSummary[]>(API_ENDPOINTS.INVOICES.BASE);
    return (res.data || [])
      .filter(inv => Number(inv.month) === selectedMonth && Number(inv.year) === selectedYear)
      .filter(inv => roomIds.includes(Number(inv.roomId)))
      .filter(inv => inv.status === 'Draft' || inv.status === 'Nháp')
      .map((inv: any) => ({
        ...inv,
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
      if (isCurrentMonth) {
        const saved = await saveReadingsBatch({ showSuccess: false });
        if (!saved) return;
      }

      const enteredRoomIds = getEnteredRoomIds();
      const res = await api.post<{
        totalContracts: number;
        totalInvoices: number;
        totalAmount: number;
        skipped: number;
        skippedReasons: string[];
        errors: string[];
        warnings: string[];
      }>(
        API_ENDPOINTS.INVOICES.CALCULATE(selectedYear, selectedMonth)
      );
      setCalcResult(res.data);
      setLockedCalculatedRoomIds(new Set(enteredRoomIds));
      setCalculatedInvoices(await loadCalculatedInvoices(enteredRoomIds));
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
      setSendResult(`Đã gửi ${res.data.success} hóa đơn cho cư dân${res.data.failed > 0 ? `, ${res.data.failed} lỗi` : ''}.`);
      setCalculatedInvoices([]);
      window.dispatchEvent(new CustomEvent('billing-invoices-updated'));
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

  // Only allow input for the current month
  const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth;

  const skippedReasonsPreview = calcResult
    ? (showAllSkippedReasons ? calcResult.skippedReasons : calcResult.skippedReasons.slice(0, CALCULATION_RESULT_PREVIEW_LIMIT))
    : [];
  const calculationErrorsPreview = calcResult
    ? (showAllCalculationErrors ? calcResult.errors : calcResult.errors.slice(0, CALCULATION_RESULT_PREVIEW_LIMIT))
    : [];
  const calculationWarningsPreview = calcResult
    ? (showAllCalculationWarnings ? calcResult.warnings : calcResult.warnings.slice(0, CALCULATION_RESULT_PREVIEW_LIMIT))
    : [];

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
              disabled={saving || loading || !isCurrentMonth}
              className="flex items-center rounded transition-colors hover:bg-[var(--brand-surface)]"
              style={{ padding: '0 18px', backgroundColor: 'var(--surface-card)', border: '2px solid var(--brand-primary)', color: 'var(--brand-primary)', fontSize: 'var(--type-body)', fontWeight: 600, borderRadius: 'var(--radius-button)', height: '42px', gap: '8px', opacity: (saving || !isCurrentMonth) ? 0.6 : 1, cursor: !isCurrentMonth ? 'not-allowed' : 'pointer' }}
              title={!isCurrentMonth ? 'Chỉ có thể nhập chỉ số cho tháng hiện tại' : ''}
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
            <h2 style={{ fontSize: 'var(--type-section-title)', color: 'var(--text-primary)', fontWeight: 600 }}>
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
                  {filteredRooms.map(room => {
                    const edit = edits[room.roomId] || { newElec: '', newWater: '' };
                    const elecAbnormal = isAbnormal(room, 'elec');
                    const waterAbnormal = isAbnormal(room, 'water');
                    const elecUsage = calcUsage(room, 'elec');
                    const waterUsage = calcUsage(room, 'water');
                    const rowLocked = Boolean(room.readingsLocked) || lockedCalculatedRoomIds.has(room.roomId);
                    const elecApplicable = Boolean(room.elecUsageDetailId);
                    const waterApplicable = Boolean(room.waterUsageDetailId);
                    const lockTitle = room.readingsLockReason || 'Phòng đã được tính hóa đơn, không thể sửa chỉ số.';

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
                              disabled={!isCurrentMonth || rowLocked}
                              className="focus:outline-none"
                              title={rowLocked ? lockTitle : room.elecAnomalyNote || undefined}
                              style={{ width: '90px', padding: '8px', textAlign: 'center', fontSize: 'var(--type-body)', border: `1px solid ${elecAbnormal ? 'var(--error)' : 'var(--surface-border)'}`, borderRadius: 'var(--radius-button)', color: 'var(--text-primary)', backgroundColor: (!isCurrentMonth || rowLocked) ? 'var(--surface-bg)' : 'white', cursor: (!isCurrentMonth || rowLocked) ? 'not-allowed' : 'text' }}
                            />
                          ) : <span style={{ color: 'var(--text-secondary)' }}>Không áp dụng</span>}
                        </td>
                        {/* Tiêu thụ điện */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: elecAbnormal ? 'var(--error)' : elecUsage !== '-' ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
                            {elecUsage} {elecAbnormal && <AlertTriangle size={14} className="inline" />}
                          </span>
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
                              disabled={!isCurrentMonth || rowLocked}
                              className="focus:outline-none"
                              title={rowLocked ? lockTitle : room.waterAnomalyNote || undefined}
                              style={{ width: '90px', padding: '8px', textAlign: 'center', fontSize: 'var(--type-body)', border: `1px solid ${waterAbnormal ? 'var(--error)' : 'var(--surface-border)'}`, borderRadius: 'var(--radius-button)', color: 'var(--text-primary)', backgroundColor: (!isCurrentMonth || rowLocked) ? 'var(--surface-bg)' : 'white', cursor: (!isCurrentMonth || rowLocked) ? 'not-allowed' : 'text' }}
                            />
                          ) : <span style={{ color: 'var(--text-secondary)' }}>Không áp dụng</span>}
                        </td>
                        {/* Tiêu thụ nước */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: waterAbnormal ? 'var(--error)' : waterUsage !== '-' ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
                            {waterUsage} {waterAbnormal && <AlertTriangle size={14} className="inline" />}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Calculate Result Modal */}
      {calculateModal && calcResult && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-[760px] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calculator size={20} className="text-gray-800" />
                <h3 className="text-base font-semibold text-gray-800">Tạo thành công {calcResult.totalInvoices} hóa đơn</h3>
              </div>
              <button onClick={() => setCalculateModal(false)}><X size={20} /></button>
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
                              className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye size={14} />
                              Xem
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
              {calcResult.skippedReasons.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-yellow-700">⚠️ Phòng bị bỏ qua ({calcResult.skippedReasons.length})</p>
                    {calcResult.skippedReasons.length > CALCULATION_RESULT_PREVIEW_LIMIT && (
                      <button
                        type="button"
                        onClick={() => setShowAllSkippedReasons((current) => !current)}
                        className="text-xs font-semibold text-yellow-700 underline-offset-2 hover:underline"
                      >
                        {showAllSkippedReasons ? 'Thu gọn' : `Xem thêm ${calcResult.skippedReasons.length - CALCULATION_RESULT_PREVIEW_LIMIT}`}
                      </button>
                    )}
                  </div>
                  <div className={`space-y-0.5 ${showAllSkippedReasons ? 'max-h-44 overflow-y-auto pr-1' : ''}`}>
                    {skippedReasonsPreview.map((r, i) => <p key={i} className="text-xs text-yellow-600">• {r}</p>)}
                  </div>
                  {!showAllSkippedReasons && calcResult.skippedReasons.length > CALCULATION_RESULT_PREVIEW_LIMIT && (
                    <p className="mt-2 text-xs text-yellow-700">
                      Còn {calcResult.skippedReasons.length - CALCULATION_RESULT_PREVIEW_LIMIT} phòng bị bỏ qua. Bấm “Xem thêm” nếu cần kiểm tra chi tiết.
                    </p>
                  )}
                </div>
              )}

              {/* Calculation errors */}
              {calcResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-300 rounded p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-red-700">⚠️ Lỗi không tạo được hóa đơn ({calcResult.errors.length})</p>
                    {calcResult.errors.length > CALCULATION_RESULT_PREVIEW_LIMIT && (
                      <button
                        type="button"
                        onClick={() => setShowAllCalculationErrors((current) => !current)}
                        className="text-xs font-semibold text-red-700 underline-offset-2 hover:underline"
                      >
                        {showAllCalculationErrors ? 'Thu gọn' : `Xem thêm ${calcResult.errors.length - CALCULATION_RESULT_PREVIEW_LIMIT}`}
                      </button>
                    )}
                  </div>
                  <div className={`space-y-0.5 ${showAllCalculationErrors ? 'max-h-36 overflow-y-auto pr-1' : ''}`}>
                    {calculationErrorsPreview.map((e, i) => <p key={i} className="text-xs text-red-600">• {e}</p>)}
                  </div>
                </div>
              )}

              {calcResult.warnings.length > 0 && (
                <div className="bg-orange-50 border border-orange-300 rounded p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-orange-700">⚠️ Cảnh báo cần kiểm tra công thức/dịch vụ ({calcResult.warnings.length})</p>
                    {calcResult.warnings.length > CALCULATION_RESULT_PREVIEW_LIMIT && (
                      <button
                        type="button"
                        onClick={() => setShowAllCalculationWarnings((current) => !current)}
                        className="text-xs font-semibold text-orange-700 underline-offset-2 hover:underline"
                      >
                        {showAllCalculationWarnings ? 'Thu gọn' : `Xem thêm ${calcResult.warnings.length - CALCULATION_RESULT_PREVIEW_LIMIT}`}
                      </button>
                    )}
                  </div>
                  <div className={`space-y-0.5 ${showAllCalculationWarnings ? 'max-h-36 overflow-y-auto pr-1' : ''}`}>
                    {calculationWarningsPreview.map((w, i) => <p key={i} className="text-xs text-orange-600">• {w}</p>)}
                  </div>
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
