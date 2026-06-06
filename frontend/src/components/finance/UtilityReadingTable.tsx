import { Save, Calculator, Upload, Filter, CheckCircle, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../lib/api-config';

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
}

interface RowEdit {
  newElec: string;
  newWater: string;
}

export function UtilityReadingTable() {
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
  const [calculateModal, setCalculateModal] = useState(false);
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

  const handleSaveBatch = async () => {
    setSaving(true);
    setErrors([]);
    setWarnings([]);
    setSuccessMsg('');
    try {
      const payload = rooms
        .filter(r => edits[r.roomId]?.newElec || edits[r.roomId]?.newWater)
        .map(r => ({
          roomId: r.roomId,
          month: selectedMonth,
          year: selectedYear,
          newElecReading: edits[r.roomId]?.newElec ? parseInt(edits[r.roomId].newElec, 10) : undefined,
          newWaterReading: edits[r.roomId]?.newWater ? parseInt(edits[r.roomId].newWater, 10) : undefined,
        }));

      const res = await api.post<{ success: number; failed: number; errors: string[]; warnings: string[] }>(
        API_ENDPOINTS.UTILITY_READINGS.RECORD_BATCH, payload
      );
      const data = res.data;
      if (data.errors.length > 0) setErrors(data.errors);
      if (data.warnings?.length > 0) setWarnings(data.warnings);
      setSuccessMsg(`✅ Đã lưu ${data.success} phòng thành công${data.failed > 0 ? `, ${data.failed} lỗi` : ''}.`);
      await loadReadings();
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Lỗi khi lưu chỉ số.']);
    } finally {
      setSaving(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    setErrors([]);
    setWarnings([]);
    try {
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
      setCalculateModal(true);
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Lỗi khi tính toán hóa đơn.']);
    } finally {
      setCalculating(false);
    }
  };

  const filledCount = rooms.filter(r => edits[r.roomId]?.newElec && edits[r.roomId]?.newWater).length;

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const yearOptions = [currentYear, currentYear - 1];
  // Only allow selecting current month and past months, not future months
  const maxMonthForSelectedYear = selectedYear === currentYear ? currentMonth : 12;
  const monthOptions = Array.from({ length: maxMonthForSelectedYear }, (_, i) => i + 1);

  // Only allow input for the current month
  const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth;

  useEffect(() => {
    if (selectedMonth > maxMonthForSelectedYear) {
      setSelectedMonth(maxMonthForSelectedYear);
    }
  }, [selectedMonth, maxMonthForSelectedYear]);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-between)' }}>
        {/* Filter Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: 'var(--space-between)' }}>
            <Filter size={20} style={{ color: 'var(--text-secondary)' }} />

            <select
              className="focus:outline-none"
              style={{ padding: '12px 16px', fontSize: 'var(--type-body)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-button)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)', height: 'var(--input-height)' }}
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
            >
              {monthOptions.map(m => <option key={m} value={m}>Tháng {String(m).padStart(2, '0')}</option>)}
            </select>

            <select
              className="focus:outline-none"
              style={{ padding: '12px 16px', fontSize: 'var(--type-body)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-button)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)', height: 'var(--input-height)' }}
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <button onClick={loadReadings} disabled={loading} style={{ padding: '8px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-button)', backgroundColor: 'var(--surface-card)', cursor: 'pointer' }}>
              <RefreshCw size={16} style={{ color: 'var(--text-secondary)', animation: loading ? 'spin 1s linear infinite' : undefined }} />
            </button>

            <div style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)', marginLeft: '16px' }}>
              Đã nhập: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{filledCount}/{rooms.length}</span> phòng
            </div>
          </div>

          <div className="flex items-center" style={{ gap: 'var(--space-between)' }}>
            <button
              onClick={handleSaveBatch}
              disabled={saving || loading || !isCurrentMonth}
              className="flex items-center rounded transition-colors hover:bg-[var(--brand-surface)]"
              style={{ padding: '16px 24px', backgroundColor: 'var(--surface-card)', border: '2px solid var(--brand-primary)', color: 'var(--brand-primary)', fontSize: 'var(--type-body)', fontWeight: 600, borderRadius: 'var(--radius-button)', height: 'var(--button-height)', gap: '8px', opacity: (saving || !isCurrentMonth) ? 0.6 : 1, cursor: !isCurrentMonth ? 'not-allowed' : 'pointer' }}
              title={!isCurrentMonth ? 'Chỉ có thể nhập chỉ số cho tháng hiện tại' : ''}
            >
              <Save size={20} />
              <span>{saving ? 'Đang lưu...' : 'Lưu chỉ số'}</span>
            </button>
            <button
              onClick={handleCalculate}
              disabled={calculating || loading}
              className="flex items-center rounded transition-colors"
              style={{ padding: '16px 24px', backgroundColor: 'var(--brand-primary)', border: 'none', color: 'var(--text-on-color)', fontSize: 'var(--type-body)', fontWeight: 600, borderRadius: 'var(--radius-button)', height: 'var(--button-height)', gap: '8px', opacity: calculating ? 0.6 : 1 }}
            >
              <Calculator size={20} />
              <span>{calculating ? 'Đang tính...' : 'Tính hóa đơn nháp'}</span>
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
                  {rooms.map(room => {
                    const edit = edits[room.roomId] || { newElec: '', newWater: '' };
                    const elecAbnormal = isAbnormal(room, 'elec');
                    const waterAbnormal = isAbnormal(room, 'water');
                    const elecUsage = calcUsage(room, 'elec');
                    const waterUsage = calcUsage(room, 'water');

                    return (
                      <tr key={room.roomId} style={{ borderBottom: '1px solid var(--surface-border)' }} className="hover:bg-[var(--surface-bg)] transition-colors">
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{room.roomCode}</span>
                          {room.buildingName && <div style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>{room.buildingName} - Tầng {room.floorName}</div>}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 'var(--type-body)', color: 'var(--text-secondary)' }}>{room.residentName || '-'}</td>

                        {/* Điện cũ */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)' }}>{room.oldElecReading ?? 0}</span>
                        </td>
                        {/* Điện mới */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {(isCurrentMonth || room.elecUsageDetailId) ? (
                            <input
                              type="number"
                              step={1}
                              placeholder="Nhập..."
                              value={edit.newElec}
                              onChange={e => handleInputChange(room.roomId, 'newElec', e.target.value)}
                              disabled={!isCurrentMonth}
                              className="focus:outline-none"
                              title={room.elecAnomalyNote || undefined}
                              style={{ width: '90px', padding: '8px', textAlign: 'center', fontSize: 'var(--type-body)', border: `1px solid ${elecAbnormal ? 'var(--error)' : 'var(--surface-border)'}`, borderRadius: 'var(--radius-button)', color: 'var(--text-primary)', backgroundColor: !isCurrentMonth ? 'var(--surface-bg)' : 'white', cursor: !isCurrentMonth ? 'not-allowed' : 'text' }}
                            />
                          ) : <span style={{ color: 'var(--text-secondary)' }}>N/A</span>}
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
                          {(isCurrentMonth || room.waterUsageDetailId) ? (
                            <input
                              type="number"
                              step={1}
                              placeholder="Nhập..."
                              value={edit.newWater}
                              onChange={e => handleInputChange(room.roomId, 'newWater', e.target.value)}
                              disabled={!isCurrentMonth}
                              className="focus:outline-none"
                              title={room.waterAnomalyNote || undefined}
                              style={{ width: '90px', padding: '8px', textAlign: 'center', fontSize: 'var(--type-body)', border: `1px solid ${waterAbnormal ? 'var(--error)' : 'var(--surface-border)'}`, borderRadius: 'var(--radius-button)', color: 'var(--text-primary)', backgroundColor: !isCurrentMonth ? 'var(--surface-bg)' : 'white', cursor: !isCurrentMonth ? 'not-allowed' : 'text' }}
                            />
                          ) : <span style={{ color: 'var(--text-secondary)' }}>N/A</span>}
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
          <div className="bg-white rounded-lg w-[520px] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calculator size={20} className="text-gray-800" />
                <h3 className="text-base font-semibold text-gray-800">Kết quả tính toán hóa đơn</h3>
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

              {/* Skipped reasons */}
              {calcResult.skippedReasons.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Chi tiết xử lý:</p>
                  <div className="space-y-0.5 max-h-32 overflow-y-auto">
                    {calcResult.skippedReasons.map((r, i) => <p key={i} className="text-xs text-gray-500">• {r}</p>)}
                  </div>
                </div>
              )}

              {/* Meter-reading errors */}
              {calcResult.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
                  <p className="text-xs font-semibold text-yellow-700 mb-1">⚠️ Một số phòng chưa chốt chỉ số (hóa đơn vẫn được tạo không có khoản điện/nước):</p>
                  <div className="space-y-0.5 max-h-28 overflow-y-auto">
                    {calcResult.errors.map((e, i) => <p key={i} className="text-xs text-yellow-600">• {e}</p>)}
                  </div>
                </div>
              )}

              {calcResult.warnings.length > 0 && (
                <div className="bg-red-50 border border-red-300 rounded p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Cảnh báo bất thường:</p>
                  <div className="space-y-0.5 max-h-28 overflow-y-auto">
                    {calcResult.warnings.map((w, i) => <p key={i} className="text-xs text-red-600">• {w}</p>)}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">Vào trang <strong>Quản lý Hóa đơn</strong> để xem hóa đơn nháp và phê duyệt.</p>
              <div className="flex justify-end pt-2 border-t">
                <button onClick={() => setCalculateModal(false)} className="px-5 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
