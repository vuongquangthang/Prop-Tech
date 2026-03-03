import { useState, useEffect, useCallback } from 'react';
import { Eye, Send, Filter, CheckCircle, X, RefreshCw, AlertTriangle, ChevronRight, FileText } from 'lucide-react';
import { api } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../lib/api-config';

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

interface Invoice {
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

const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  'Nháp': { label: 'Nháp', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  'Chưa thanh toán': { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  'Đã thanh toán một phần': { label: 'TT một phần', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  'Đã thanh toán': { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800 border-green-300' },
  'Bị từ chối': { label: 'Bị từ chối', color: 'bg-red-100 text-red-800 border-red-300' },
};

export function InvoiceTable() {
  const currentDate = new Date();
  const [activeTab, setActiveTab] = useState('draft');
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate state (draft tab)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [calculating, setCalculating] = useState(false);
  const [calcResult, setCalcResult] = useState<{ totalInvoices: number; totalAmount: number; skipped: number; skippedReasons: string[]; errors: string[] } | null>(null);

  // Selection & approve state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [approving, setApproving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Detail state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    try {
      const res = await api.get<Invoice[]>(API_ENDPOINTS.INVOICES.BASE);
      setAllInvoices(res.data);
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Không thể tải danh sách hóa đơn.']);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const isOverdue = (inv: Invoice) =>
    (inv.status === 'Chưa thanh toán' || inv.status === 'Đã thanh toán một phần') &&
    !!inv.dueDate && new Date(inv.dueDate) < currentDate;

  const tabs = [
    { key: 'draft', label: 'Nháp', count: allInvoices.filter(i => i.status === 'Nháp').length },
    { key: 'pending', label: 'Chờ thanh toán', count: allInvoices.filter(i => (i.status === 'Chưa thanh toán' || i.status === 'Đã thanh toán một phần') && !isOverdue(i)).length },
    { key: 'paid', label: 'Đã thanh toán', count: allInvoices.filter(i => i.status === 'Đã thanh toán').length },
    { key: 'overdue', label: 'Quá hạn', count: allInvoices.filter(i => isOverdue(i)).length },
  ];

  const filteredInvoices = allInvoices.filter(inv => {
    if (activeTab === 'draft') return inv.status === 'Nháp';
    if (activeTab === 'pending') return (inv.status === 'Chưa thanh toán' || inv.status === 'Đã thanh toán một phần') && !isOverdue(inv);
    if (activeTab === 'paid') return inv.status === 'Đã thanh toán';
    if (activeTab === 'overdue') return isOverdue(inv);
    return true;
  });

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
        setSuccessMsg('ℹ️ Không có hợp đồng nào để tính toán.');
      }
      await loadInvoices();
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Lỗi khi tính toán hóa đơn.']);
    } finally {
      setCalculating(false);
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
      if (res.data.errors.length > 0) setErrors(res.data.errors);
      setSuccessMsg(`✅ Đã phê duyệt ${res.data.success} hóa đơn và gửi thông báo cho cư dân.${res.data.failed > 0 ? ` ${res.data.failed} lỗi.` : ''}`);
      setSelectedIds(new Set());
      setSelectedInvoice(null);
      await loadInvoices();
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Lỗi khi phê duyệt hóa đơn.']);
    } finally {
      setApproving(false);
    }
  };

  const handleApprove = async (id: number, roomNumber?: string) => {
    try {
      await api.put(API_ENDPOINTS.INVOICES.APPROVE(id));
      setSuccessMsg(`✅ Đã phê duyệt hóa đơn phòng ${roomNumber || id}.`);
      if (selectedInvoice?.id === id) setSelectedInvoice(null);
      await loadInvoices();
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Lỗi khi phê duyệt.']);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Lý do từ chối:');
    if (!reason) return;
    try {
      await api.put(API_ENDPOINTS.INVOICES.REJECT(id), { reason });
      setSuccessMsg('Đã từ chối hóa đơn.');
      if (selectedInvoice?.id === id) setSelectedInvoice(null);
      await loadInvoices();
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Lỗi khi từ chối.']);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredInvoices.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredInvoices.map(d => d.id)));
  };

  const yearOptions = [currentDate.getFullYear(), currentDate.getFullYear() - 1];
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-between)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Quản lý Hóa đơn</h1>
          <p style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Tính toán, xem xét và theo dõi toàn bộ hóa đơn
          </p>
        </div>
        <button
          onClick={loadInvoices}
          disabled={loading}
          style={{ padding: '8px 16px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-button)', backgroundColor: 'var(--surface-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>

      {/* Calculate section — shown only in Draft tab */}
      {activeTab === 'draft' && (
        <div style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-card)', padding: 'var(--space-card)' }}>
          <h2 style={{ fontSize: 'var(--type-section-title)', fontWeight: 600, marginBottom: '16px' }}>Tính toán hóa đơn</h2>
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
      )}

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
          <button onClick={() => setErrors([])} className="text-xs text-red-600 mt-1">Đóng</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedInvoice(null); setSelectedIds(new Set()); }}
            className={`px-4 py-2 text-sm rounded-t border-2 border-b-0 transition-colors ${
              activeTab === tab.key
                ? 'bg-white border-gray-300 text-gray-900'
                : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label} <span className={`ml-1 ${activeTab === tab.key ? 'text-gray-900' : 'text-gray-500'}`}>({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Action bar */}
      {activeTab === 'draft' && selectedIds.size > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Đã chọn {selectedIds.size} hóa đơn</span>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={approving}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-2"
            style={{ opacity: approving ? 0.6 : 1 }}
          >
            <Send size={16} />
            <span>Phê duyệt & Gửi {selectedIds.size} hóa đơn đã chọn</span>
          </button>
        </div>
      )}

      {/* Main content: table + optional sidebar */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Table */}
        <div style={{ flex: 1, backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-card)' }}>
          <div style={{ padding: 'var(--space-card)', borderBottom: '1px solid var(--surface-border)' }}>
            <h2 style={{ fontSize: 'var(--type-section-title)', fontWeight: 600 }}>
              Danh sách — {filteredInvoices.length} hóa đơn
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Không có hóa đơn nào.</p>
              {activeTab === 'draft' && (
                <p className="text-sm text-gray-400 mt-1">Hãy chốt chỉ số điện/nước rồi bấm "Tính hóa đơn" ở trên.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--surface-bg)', borderBottom: '1px solid var(--surface-border)' }}>
                  <tr>
                    {activeTab === 'draft' && (
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input type="checkbox" checked={selectedIds.size === filteredInvoices.length && filteredInvoices.length > 0} onChange={toggleSelectAll} />
                      </th>
                    )}
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 700 }}>Phòng</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 700 }}>Cư dân</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 700 }}>Kỳ</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: 700 }}>Tổng tiền</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 700 }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 700 }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(inv => (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      style={{
                        borderBottom: '1px solid var(--surface-border)',
                        cursor: 'pointer',
                        backgroundColor: selectedInvoice?.id === inv.id ? 'var(--brand-surface)' : activeTab === 'overdue' ? '#fef2f2' : undefined
                      }}
                      className="hover:bg-[var(--surface-bg)] transition-colors"
                    >
                      {activeTab === 'draft' && (
                        <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedIds.has(inv.id)} onChange={() => toggleSelect(inv.id)} />
                        </td>
                      )}
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>{inv.roomNumber || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>{inv.residentName || '—'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {String(inv.month).padStart(2,'0')}/{inv.year}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--brand-primary)' }}>
                        {inv.totalAmount.toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span className={`inline-block px-3 py-1 text-xs rounded border ${STATUS_DISPLAY[inv.status]?.color || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                          {STATUS_DISPLAY[inv.status]?.label || inv.status}
                        </span>
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
                          {inv.status === 'Nháp' && (
                            <>
                              <button
                                onClick={() => handleApprove(inv.id, inv.roomNumber)}
                                title="Phê duyệt & Gửi"
                                style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: '#16a34a' }}
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => handleReject(inv.id)}
                                title="Từ chối"
                                style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}
                              >
                                <X size={16} />
                              </button>
                            </>
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
              {selectedInvoice.dueDate && (
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Hạn TT: <strong>{new Date(selectedInvoice.dueDate).toLocaleDateString('vi-VN')}</strong>
                </div>
              )}
              {selectedInvoice.paidAmount > 0 && (
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Đã thanh toán: <strong style={{ color: '#16a34a' }}>{selectedInvoice.paidAmount.toLocaleString('vi-VN')} đ</strong>
                </div>
              )}

              {/* Line items */}
              {selectedInvoice.lineItems.length > 0 && (
                <div style={{ border: '1px solid var(--surface-border)', borderRadius: '8px', overflow: 'hidden' }}>
                  {selectedInvoice.lineItems.map(item => (
                    <div key={item.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{ITEM_TYPE_LABELS[item.itemType] || item.itemType}</div>
                        {item.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.description}</div>}
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
              )}

              {/* Actions for draft */}
              {selectedInvoice.status === 'Nháp' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <button
                    onClick={() => handleApprove(selectedInvoice.id, selectedInvoice.roomNumber)}
                    style={{ padding: '10px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <CheckCircle size={16} /> Phê duyệt hóa đơn này
                  </button>
                  <button
                    onClick={() => handleReject(selectedInvoice.id)}
                    style={{ padding: '10px', backgroundColor: 'white', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Từ chối
                  </button>
                  <div style={{ padding: '10px', backgroundColor: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', fontSize: '12px', color: '#854d0e' }}>
                    <AlertTriangle size={12} className="inline mr-1" />
                    Sau khi phê duyệt, cư dân sẽ nhận thông báo và thấy hóa đơn này trên app.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirm batch approve dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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