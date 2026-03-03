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
  waterUsageDetailId?: number;
  oldWaterReading?: number;
  newWaterReading?: number;
  waterRecorded: boolean;
}

interface RowEdit {
  newElec: string;
  newWater: string;
}

export function UtilityReadingTable() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [rooms, setRooms] = useState<RoomUtilityReading[]>([]);
  const [edits, setEdits] = useState<Record<number, RowEdit>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [calculateModal, setCalculateModal] = useState(false);
  const [calcResult, setCalcResult] = useState<{ totalInvoices: number; totalAmount: number; errors: string[] } | null>(null);

  const loadReadings = useCallback(async () => {
    setLoading(true);
    setErrors([]);
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
    setEdits(prev => ({ ...prev, [roomId]: { ...prev[roomId], [field]: value } }));
  };

  const isAbnormal = (room: RoomUtilityReading, field: 'elec' | 'water') => {
    const edit = edits[room.roomId];
    if (!edit) return false;
    const newVal = parseFloat(field === 'elec' ? edit.newElec : edit.newWater);
    const oldVal = (field === 'elec' ? room.oldElecReading : room.oldWaterReading) ?? 0;
    if (isNaN(newVal)) return false;
    return newVal < oldVal;
  };

  const calcUsage = (room: RoomUtilityReading, field: 'elec' | 'water') => {
    const edit = edits[room.roomId];
    if (!edit) return '-';
    const newVal = parseFloat(field === 'elec' ? edit.newElec : edit.newWater);
    const oldVal = (field === 'elec' ? room.oldElecReading : room.oldWaterReading) ?? 0;
    if (isNaN(newVal)) return '-';
    const usage = newVal - oldVal;
    return usage >= 0 ? usage.toFixed(field === 'water' ? 1 : 0) : '-';
  };

  const handleSaveBatch = async () => {
    setSaving(true);
    setErrors([]);
    setSuccessMsg('');
    try {
      const payload = rooms
        .filter(r => edits[r.roomId]?.newElec || edits[r.roomId]?.newWater)
        .map(r => ({
          roomId: r.roomId,
          month: selectedMonth,
          year: selectedYear,
          newElecReading: edits[r.roomId]?.newElec ? parseFloat(edits[r.roomId].newElec) : undefined,
          newWaterReading: edits[r.roomId]?.newWater ? parseFloat(edits[r.roomId].newWater) : undefined,
        }));

      const res = await api.post<{ success: number; failed: number; errors: string[] }>(
        API_ENDPOINTS.UTILITY_READINGS.RECORD_BATCH, payload
      );
      const data = res.data;
      if (data.errors.length > 0) setErrors(data.errors);
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
    try {
      const res = await api.post<{ totalInvoices: number; totalAmount: number; errors: string[] }>(
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

  const yearOptions = [currentDate.getFullYear(), currentDate.getFullYear() - 1];
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

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
              disabled={saving || loading}
              className="flex items-center rounded transition-colors hover:bg-[var(--brand-surface)]"
              style={{ padding: '16px 24px', backgroundColor: 'var(--surface-card)', border: '2px solid var(--brand-primary)', color: 'var(--brand-primary)', fontSize: 'var(--type-body)', fontWeight: 600, borderRadius: 'var(--radius-button)', height: 'var(--button-height)', gap: '8px', opacity: saving ? 0.6 : 1 }}
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
                          {room.buildingName && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{room.buildingName} - Tầng {room.floorName}</div>}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 'var(--type-body)', color: 'var(--text-secondary)' }}>{room.residentName || '-'}</td>

                        {/* Điện cũ */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)' }}>{room.oldElecReading ?? 0}</span>
                        </td>
                        {/* Điện mới */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {room.elecUsageDetailId ? (
                            <input
                              type="number"
                              placeholder="Nhập..."
                              value={edit.newElec}
                              onChange={e => handleInputChange(room.roomId, 'newElec', e.target.value)}
                              className="focus:outline-none"
                              style={{ width: '90px', padding: '8px', textAlign: 'center', fontSize: 'var(--type-body)', border: `1px solid ${elecAbnormal ? 'var(--error)' : 'var(--surface-border)'}`, borderRadius: 'var(--radius-button)', color: 'var(--text-primary)' }}
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
                          {room.waterUsageDetailId ? (
                            <input
                              type="number"
                              placeholder="Nhập..."
                              value={edit.newWater}
                              onChange={e => handleInputChange(room.roomId, 'newWater', e.target.value)}
                              className="focus:outline-none"
                              style={{ width: '90px', padding: '8px', textAlign: 'center', fontSize: 'var(--type-body)', border: `1px solid ${waterAbnormal ? 'var(--error)' : 'var(--surface-border)'}`, borderRadius: 'var(--radius-button)', color: 'var(--text-primary)' }}
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

        <div className="bg-blue-50 border border-blue-300 rounded p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Hướng dẫn:</strong> Nhập chỉ số mới → Bấm "Lưu chỉ số" → Sau khi lưu đủ, bấm "Tính hóa đơn nháp" để tạo hóa đơn ở trạng thái Nháp. Phê duyệt hóa đơn tại trang <strong>Quản lý Hóa đơn</strong>.
          </p>
        </div>
      </div>

      {/* Calculate Result Modal */}
      {calculateModal && calcResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calculator size={20} className="text-gray-800" />
                <h3 className="text-base font-semibold text-gray-800">Kết quả tính toán hóa đơn</h3>
              </div>
              <button onClick={() => setCalculateModal(false)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-300 rounded p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={20} className="text-green-600" />
                  <span className="font-semibold text-green-800">Đã tạo thành công!</span>
                </div>
                <p className="text-sm text-green-700">Tổng hóa đơn nháp: <strong>{calcResult.totalInvoices}</strong></p>
                <p className="text-sm text-green-700">Tổng tiền: <strong>{calcResult.totalAmount.toLocaleString('vi-VN')} đ</strong></p>
              </div>
              {calcResult.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
                  <p className="text-sm font-medium text-yellow-800 mb-1">⚠️ Một số phòng chưa chốt chỉ số:</p>
                  {calcResult.errors.map((e, i) => <p key={i} className="text-xs text-yellow-700">• {e}</p>)}
                </div>
              )}
              <p className="text-sm text-gray-600">Vào trang <strong>Quản lý Hóa đơn</strong> để xem xét và phê duyệt.</p>
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
