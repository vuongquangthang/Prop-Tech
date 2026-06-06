import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, X, ChevronRight, Filter, FileText, AlertTriangle, Edit2 } from 'lucide-react';
import { api } from '../lib/api-client';
import { API_ENDPOINTS } from '../lib/api-config';

interface LineItem {
  id: number;
  itemType: string;
  serviceId?: number;
  serviceName?: string;
  quantity?: number;
  unitPrice?: number;
  subtotal: number;
  description?: string;
}

interface DraftInvoice {
  id: number;
  contractId: number;
  roomId?: number;
  roomNumber?: string;
  residentName?: string;
  month: number;
  year: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate?: string;
  lineItems: LineItem[];
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  TienPhong: 'Tiền phòng',
  Dien: 'Tiền điện',
  Nuoc: 'Tiền nước',
  DichVu: 'Dịch vụ',
  PhatSinh: 'Phát sinh',
  KhauTru: 'Khấu trừ',
};

export function DraftInvoicesPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [drafts, setDrafts] = useState<DraftInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedInvoice, setSelectedInvoice] = useState<DraftInvoice | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [calcResult, setCalcResult] = useState<{ totalInvoices: number; totalAmount: number; skipped: number; skippedReasons: string[]; errors: string[] } | null>(null);

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    try {
      const res = await api.get<DraftInvoice[]>(API_ENDPOINTS.INVOICES.DRAFTS);
      setDrafts(res.data);
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Không thể tải hóa đơn nháp.']);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  const handleCalculate = async () => {
    setCalculating(true);
    setErrors([]);
    setSuccessMsg('');
    try {
      const res = await api.post<{ totalInvoices: number; totalAmount: number; skipped: number; skippedReasons: string[]; errors: string[] }>(
        API_ENDPOINTS.INVOICES.CALCULATE(selectedYear, selectedMonth)
      );
      setCalcResult(res.data);
      if (res.data.totalInvoices > 0) {
        setSuccessMsg(`✅ Đã tạo ${res.data.totalInvoices} hóa đơn nháp, tổng ${res.data.totalAmount.toLocaleString('vi-VN')} đ`);
      } else if (res.data.skipped > 0) {
        setSuccessMsg(`ℹ️ Không tạo hóa đơn mới — ${res.data.skipped} hợp đồng đã có hóa đơn tháng này rồi.`);
      } else {
        setSuccessMsg('ℹ️ Không có hợp đồng nào để tính toán. Vui lòng kiểm tra lại chỉ số điện/nước.');
      }
      await loadDrafts();
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Lỗi khi tính toán.']);
    } finally {
      setCalculating(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === drafts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(drafts.map(d => d.id)));
    }
  };

  const handleBatchApprove = async () => {
    setApproving(true);
    setErrors([]);
    setSuccessMsg('');
    setShowConfirm(false);
    try {
      const res = await api.post<{ success: number; failed: number; errors: string[] }>(
        API_ENDPOINTS.INVOICES.APPROVE_BATCH,
        { invoiceIds: Array.from(selectedIds) }
      );
      const data = res.data;
      if (data.errors.length > 0) setErrors(data.errors);
      setSuccessMsg(`✅ Đã phê duyệt ${data.success} hóa đơn và gửi thông báo cho cư dân.${data.failed > 0 ? ` ${data.failed} lỗi.` : ''}`);
      setSelectedIds(new Set());
      setSelectedInvoice(null);
      await loadDrafts();
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Lỗi khi phê duyệt hóa đơn.']);
    } finally {
      setApproving(false);
    }
  };

  const handleRejectInvoice = async (id: number) => {
    const reason = prompt('Lý do từ chối:');
    if (!reason) return;
    try {
      await api.put(API_ENDPOINTS.INVOICES.REJECT(id), { reason });
      setSuccessMsg('Đã từ chối hóa đơn.');
      if (selectedInvoice?.id === id) setSelectedInvoice(null);
      await loadDrafts();
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Lỗi khi từ chối hóa đơn.']);
    }
  };

  const yearOptions = [currentDate.getFullYear(), currentDate.getFullYear() - 1];
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-between)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Hóa đơn nháp</h1>
          <p style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Xem xét và phê duyệt hóa đơn trước khi gửi đến cư dân
          </p>
        </div>
      </div>

      {/* Step 1: Calculate */}
      <div style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-card)', padding: 'var(--space-card)' }}>
        <h2 style={{ fontSize: 'var(--type-section-title)', fontWeight: 600, marginBottom: '16px' }}>
          Bước 1: Tính toán hóa đơn
        </h2>
        <div className="flex items-center gap-4">
          <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            style={{ padding: '10px 14px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-button)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}
          >
            {monthOptions.map(m => <option key={m} value={m}>Tháng {String(m).padStart(2, '0')}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            style={{ padding: '10px 14px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-button)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={handleCalculate}
            disabled={calculating}
            style={{ padding: '10px 24px', backgroundColor: 'var(--brand-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-button)', fontWeight: 600, cursor: 'pointer', opacity: calculating ? 0.6 : 1 }}
          >
            {calculating ? 'Đang tính...' : `Tính hóa đơn tháng ${String(selectedMonth).padStart(2,'0')}/${selectedYear}`}
          </button>
        </div>
        {calcResult && (
          <div style={{ marginTop: '12px', fontSize: '14px' }}>
            {calcResult.totalInvoices > 0 && (
              <div style={{ color: '#15803d' }}>
                Đã tạo <strong>{calcResult.totalInvoices}</strong> hóa đơn nháp, tổng <strong>{calcResult.totalAmount.toLocaleString('vi-VN')} đ</strong>
              </div>
            )}
            {calcResult.skipped > 0 && (
              <div style={{ color: '#b45309', marginTop: '4px' }}>
                ⚠️ Bỏ qua <strong>{calcResult.skipped}</strong> hợp đồng đã có hóa đơn tháng này.
                {calcResult.skippedReasons.length > 0 && (
                  <ul style={{ marginTop: '4px', paddingLeft: '16px', fontSize: 'var(--type-caption)' }}>
                    {calcResult.skippedReasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                )}
              </div>
            )}
            {calcResult.errors.length > 0 && (
              <div style={{ color: '#b45309', marginTop: '4px' }}>
                ⚠️ {calcResult.errors.length} phòng chưa có chỉ số điện/nước
              </div>
            )}
          </div>
        )}
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

      {/* Step 2 & 3: Review + Approve */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Invoice list */}
        <div style={{ flex: 1, backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-card)' }}>
          <div style={{ padding: 'var(--space-card)', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 'var(--type-section-title)', fontWeight: 600 }}>
              Bước 2: Xem xét — {drafts.length} hóa đơn nháp
            </h2>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={approving}
                style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 'var(--radius-button)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <CheckCircle size={16} />
                Phê duyệt {selectedIds.size} hóa đơn đã chọn
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải...</div>
          ) : drafts.length === 0 ? (
            <div className="p-8 text-center">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Chưa có hóa đơn nháp nào.</p>
              <p className="text-sm text-gray-400 mt-1">Hãy chốt chỉ số điện/nước rồi bấm "Tính hóa đơn" ở Bước 1.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--surface-bg)', borderBottom: '1px solid var(--surface-border)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <input type="checkbox" checked={selectedIds.size === drafts.length && drafts.length > 0} onChange={toggleSelectAll} />
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 700 }}>Phòng</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 700 }}>Cư dân</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 700 }}>Kỳ</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: 700 }}>Tổng tiền</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 700 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map(inv => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    style={{ borderBottom: '1px solid var(--surface-border)', cursor: 'pointer', backgroundColor: selectedInvoice?.id === inv.id ? 'var(--brand-surface)' : undefined }}
                    className="hover:bg-[var(--surface-bg)] transition-colors"
                  >
                    <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(inv.id)} onChange={() => toggleSelect(inv.id)} />
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>{inv.roomNumber}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>{inv.residentName || '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {String(inv.month).padStart(2,'0')}/{inv.year}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--brand-primary)' }}>
                      {inv.totalAmount.toLocaleString('vi-VN')} đ
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          title="Xem chi tiết"
                          style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--brand-primary)' }}
                        >
                          <ChevronRight size={16} />
                        </button>
                        <button
                          onClick={() => handleRejectInvoice(inv.id)}
                          title="Từ chối"
                          style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail sidebar */}
        {selectedInvoice && (
          <div style={{ width: '360px', backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-card)', flexShrink: 0 }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Chi tiết — Phòng {selectedInvoice.roomNumber}</h3>
              <button onClick={() => setSelectedInvoice(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Kỳ: <strong>Tháng {String(selectedInvoice.month).padStart(2,'0')}/{selectedInvoice.year}</strong>
              </div>
              {selectedInvoice.residentName && (
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Cư dân: <strong>{selectedInvoice.residentName}</strong>
                </div>
              )}

              {/* Line items */}
              <div style={{ border: '1px solid var(--surface-border)', borderRadius: '8px', overflow: 'hidden' }}>
                {selectedInvoice.lineItems.map(item => (
                  <div key={item.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{ITEM_TYPE_LABELS[item.itemType] || item.itemType}</div>
                      {item.description && <div style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>{item.description}</div>}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                      {item.subtotal.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                ))}
                <div style={{ padding: '12px 14px', backgroundColor: 'var(--surface-bg)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700 }}>Tổng cộng</span>
                  <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '16px' }}>
                    {selectedInvoice.totalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={async () => {
                    try {
                      await api.put(API_ENDPOINTS.INVOICES.APPROVE(selectedInvoice.id));
                      setSuccessMsg(`✅ Đã phê duyệt hóa đơn phòng ${selectedInvoice.roomNumber}.`);
                      setSelectedInvoice(null);
                      await loadDrafts();
                    } catch (err: any) {
                      setErrors([err.response?.data?.message || 'Lỗi khi phê duyệt.']);
                    }
                  }}
                  style={{ padding: '10px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <CheckCircle size={16} /> Phê duyệt hóa đơn này
                </button>
                <button
                  onClick={() => handleRejectInvoice(selectedInvoice.id)}
                  style={{ padding: '10px', backgroundColor: 'white', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Từ chối
                </button>
              </div>

              <div style={{ padding: '10px', backgroundColor: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', fontSize: 'var(--type-caption)', color: '#854d0e' }}>
                <AlertTriangle size={12} className="inline mr-1" />
                Sau khi phê duyệt, cư dân sẽ nhận thông báo và thấy hóa đơn này trên app.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm batch approve dialog */}
      {showConfirm && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-[420px] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-green-600" />
              <h3 className="text-lg font-semibold">Xác nhận phê duyệt</h3>
            </div>
            <p className="text-sm text-gray-700">
              Bạn có chắc muốn phê duyệt và gửi <strong>{selectedIds.size} hóa đơn</strong> cho cư dân?
              Sau khi phê duyệt, cư dân sẽ nhận thông báo qua app.
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <button onClick={() => setShowConfirm(false)} className="px-5 py-2 border border-gray-300 rounded text-sm">Hủy</button>
              <button onClick={handleBatchApprove} disabled={approving} className="px-5 py-2 bg-green-600 text-white rounded text-sm font-semibold" style={{ opacity: approving ? 0.6 : 1 }}>
                {approving ? 'Đang phê duyệt...' : 'Xác nhận phê duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
