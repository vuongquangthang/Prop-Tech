import { useState, useEffect, useCallback } from 'react';
import { Eye, Send, Filter, CheckCircle, X, FileText, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { useSignalRRefresh } from '../../lib/useSignalRRefresh';
import { api } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../lib/api-config';
import { InvoiceDetailModal } from './InvoiceDetailModal';

interface LineItem {
  id: number;
  itemType: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
  tierInfo?: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  billingPeriodId: number;
  roomId: number;
  roomCode: string;
  roomNumber?: string;
  headcount?: number;
  roomCharge?: number;
  waterCharge?: number;
  electricityCharge?: number;
  serviceCharge?: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  issueDate?: string;
  dueDate?: string;
  confirmedAt?: string;
  paidAt?: string;
  lineItems?: LineItem[];
  // extra fields that may come from detail endpoint
  residentName?: string;
  month?: number;
  year?: number;
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
  'Draft':     { label: 'Nháp',          color: 'bg-gray-100 text-gray-700 border-gray-300' },
  'Nháp':      { label: 'Nháp',          color: 'bg-gray-100 text-gray-700 border-gray-300' },
  'Issued':    { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  'Chưa thanh toán': { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  'PartiallyPaid': { label: 'TT một phần', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  'Đã thanh toán một phần': { label: 'TT một phần', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  'Paid':      { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800 border-green-300' },
  'Đã thanh toán': { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800 border-green-300' },
  'Overdue':   { label: 'Quá hạn',       color: 'bg-red-100 text-red-800 border-red-300' },
  'Void':      { label: 'Đã hủy',        color: 'bg-gray-200 text-gray-500 border-gray-300' },
  'Bị từ chối': { label: 'Bị từ chối',  color: 'bg-red-100 text-red-800 border-red-300' },
};

const isDraft = (inv: Invoice) => inv.status === 'Draft' || inv.status === 'Nháp';
const isPending = (inv: Invoice) => inv.status === 'Issued' || inv.status === 'Chưa thanh toán' || inv.status === 'PartiallyPaid' || inv.status === 'Đã thanh toán một phần';
const isPaid = (inv: Invoice) => inv.status === 'Paid' || inv.status === 'Đã thanh toán';

export function InvoiceTable() {
  const currentDate = new Date();
  const [activeTab, setActiveTab] = useState('draft');
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Calculate state (draft tab)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [calculating, setCalculating] = useState(false);
  const [calcResult, setCalcResult] = useState<{ totalInvoices: number; totalAmount: number; skipped: number; skippedReasons: string[]; errors: string[] } | null>(null);
  const [showCalcPanel, setShowCalcPanel] = useState(false);

  // Selection & approve state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [approving, setApproving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Detail modal state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalInvoiceId, setModalInvoiceId] = useState<number | null>(null);
  const modalInvoice = modalInvoiceId ? allInvoices.find(i => i.id === modalInvoiceId) : null;

  // Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    try {
      const res = await api.get<Invoice[]>(API_ENDPOINTS.INVOICES.BASE);
      const normalized = (res.data || []).map((inv: any) => ({
        ...inv,
        roomCode: inv.roomCode || inv.roomNumber || inv.soPhong || '',
        roomNumber: inv.roomNumber || inv.roomCode || inv.soPhong || '',
      }));
      setAllInvoices(normalized);
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Không thể tải danh sách hóa đơn.']);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);
  useSignalRRefresh(['PaymentSuccess', 'PaymentFailed', 'InvoiceUpdated'], loadInvoices);

  const isOverdue = (inv: Invoice) =>
    isPending(inv) && !!inv.dueDate && new Date(inv.dueDate) < currentDate;

  const tabs = [
    { key: 'draft',   label: 'Nhập',           count: allInvoices.filter(isDraft).length },
    { key: 'pending', label: 'Chờ thanh toán',  count: allInvoices.filter(i => isPending(i) && !isOverdue(i)).length },
    { key: 'paid',    label: 'Đã thanh toán',   count: allInvoices.filter(isPaid).length },
    { key: 'overdue', label: 'Quá hạn',         count: allInvoices.filter(isOverdue).length },
  ];

  const tabFiltered = allInvoices.filter(inv => {
    if (activeTab === 'draft')   return isDraft(inv);
    if (activeTab === 'pending') return isPending(inv) && !isOverdue(inv);
    if (activeTab === 'paid')    return isPaid(inv);
    if (activeTab === 'overdue') return isOverdue(inv);
    return true;
  });

  const filteredInvoices = search.trim()
    ? tabFiltered.filter(inv =>
        inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
        inv.roomCode?.toLowerCase().includes(search.toLowerCase()) ||
        inv.residentName?.toLowerCase().includes(search.toLowerCase())
      )
    : tabFiltered;

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
    // If none selected, approve all drafts
    const idsToApprove = selectedIds.size > 0
      ? Array.from(selectedIds)
      : filteredInvoices.filter(isDraft).map(i => i.id);
    try {
      const res = await api.post<{ success: number; failed: number; errors: string[] }>(
        API_ENDPOINTS.INVOICES.APPROVE_BATCH,
        { invoiceIds: idsToApprove }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Quản lý Hóa đơn</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Tính toán, xem xét và theo dõi toàn bộ hóa đơn
          </p>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle size={16} className="text-green-600 shrink-0" />
          <span className="text-sm text-green-800">{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-3">
          {errors.map((e, i) => <p key={i} className="text-sm text-red-800">⚠️ {e}</p>)}
          <button onClick={() => setErrors([])} className="text-xs text-red-600 mt-1">Đóng</button>
        </div>
      )}

      {/* Tabs row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedInvoice(null); setSelectedIds(new Set()); setSearch(''); }}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: activeTab === tab.key ? 600 : 400,
              border: '1px solid',
              borderBottom: activeTab === tab.key ? '1px solid white' : '1px solid var(--surface-border)',
              borderColor: activeTab === tab.key ? 'var(--surface-border)' : 'transparent',
              borderRadius: '6px 6px 0 0',
              backgroundColor: activeTab === tab.key ? 'white' : 'transparent',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              position: 'relative',
              bottom: '-1px',
            }}
          >
            {tab.label}{' '}
            <span style={{ fontWeight: 400 }}>({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Toolbar: filter left, actions right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Filter size={18} style={{ color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Tìm mã hóa đơn, phòng..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '7px 12px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-button)', fontSize: '14px', width: '220px', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}
        />
        <div style={{ flex: 1 }} />
        {activeTab === 'draft' && (
          <>
            {/* Collapse-able calculate panel trigger */}
            <button
              onClick={() => setShowCalcPanel(v => !v)}
              style={{ padding: '8px 14px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-button)', backgroundColor: 'var(--surface-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}
            >
              Tính hóa đơn
              {showCalcPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={() => { if (selectedIds.size === 0) { setSelectedIds(new Set(filteredInvoices.map(i => i.id))); setShowConfirm(true); } else setShowConfirm(true); }}
              disabled={approving || filteredInvoices.length === 0}
              style={{ padding: '8px 16px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 'var(--radius-button)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', opacity: (approving || filteredInvoices.length === 0) ? 0.5 : 1 }}
            >
              <Send size={16} />
              Phê duyệt &amp; Gửi hàng loạt
            </button>
          </>
        )}
      </div>

      {/* Collapsible Calculate panel */}
      {activeTab === 'draft' && showCalcPanel && (
        <div style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-card)', padding: '16px' }}>
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              style={{ padding: '8px 12px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-button)', backgroundColor: 'white', color: 'var(--text-primary)', fontSize: '14px' }}
            >
              {monthOptions.map(m => <option key={m} value={m}>Tháng {String(m).padStart(2, '0')}</option>)}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              style={{ padding: '8px 12px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-button)', backgroundColor: 'white', color: 'var(--text-primary)', fontSize: '14px' }}
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={handleCalculate}
              disabled={calculating}
              style={{ padding: '8px 20px', backgroundColor: 'var(--brand-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-button)', fontWeight: 600, cursor: 'pointer', fontSize: '14px', opacity: calculating ? 0.6 : 1 }}
            >
              {calculating ? 'Đang tính...' : `Tính tháng ${String(selectedMonth).padStart(2,'0')}/${selectedYear}`}
            </button>
          </div>
          {calcResult && (
            <div style={{ marginTop: '10px', fontSize: 'var(--type-caption)' }}>
              {calcResult.totalInvoices > 0 && <div style={{ color: '#15803d' }}>✅ Đã tạo <strong>{calcResult.totalInvoices}</strong> hóa đơn nháp, tổng <strong>{calcResult.totalAmount.toLocaleString('vi-VN')} đ</strong></div>}
              {calcResult.skipped > 0 && <div style={{ color: '#b45309', marginTop: '2px' }}>⚠️ Bỏ qua <strong>{calcResult.skipped}</strong> hợp đồng đã có hóa đơn tháng này.</div>}
              {calcResult.errors.length > 0 && <div style={{ color: '#b45309', marginTop: '2px' }}>⚠️ {calcResult.errors.length} phòng chưa có chỉ số điện/nước</div>}
            </div>
          )}
        </div>
      )}

      {/* old action bar placeholder — removed, now in toolbar */}
      {false && activeTab === 'draft' && selectedIds.size > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Đã chọn {selectedIds.size} hóa đơn</span>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={approving}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-2"
            style={{ opacity: approving ? 0.6 : 1 }}
          >
            <Send size={16} />
            <span>Phê duyệt & Gửi</span>
          </button>
        </div>
      )}

      {/* Main content: table + optional sidebar */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Table */}
        <div style={{ flex: 1, backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-card)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600 }}>
              Danh sách hóa đơn — {filteredInvoices.length} hóa đơn
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
                  <tr style={{ backgroundColor: 'var(--surface-bg)' }}>
                    {activeTab === 'draft' && (
                      <th style={{ padding: '10px 16px', textAlign: 'center', width: '40px' }}>
                        <input type="checkbox" checked={selectedIds.size === filteredInvoices.length && filteredInvoices.length > 0} onChange={toggleSelectAll} />
                      </th>
                    )}
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>Mã hóa đơn</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>Phòng</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>Chủ hộ</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>Kỳ thanh toán</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>Tổng tiền (VND)</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>Trạng thái</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>Thao tác</th>
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
                        backgroundColor: selectedInvoice?.id === inv.id
                          ? '#f0f9ff'
                          : activeTab === 'overdue'
                          ? '#fef2f2'
                          : undefined
                      }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {activeTab === 'draft' && (
                        <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedIds.has(inv.id)} onChange={() => toggleSelect(inv.id)} />
                        </td>
                      )}
                      <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '14px', color: 'var(--brand-primary)' }}>
                        {inv.invoiceNumber || `INV-${String(inv.id).padStart(3,'0')}`}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600 }}>
                        {inv.roomCode || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {inv.residentName || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {inv.month && inv.year
                          ? `${String(inv.month).padStart(2,'0')}/${inv.year}`
                          : inv.issueDate
                          ? `${String(new Date(inv.issueDate).getMonth()+1).padStart(2,'0')}/${new Date(inv.issueDate).getFullYear()}`
                          : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: '14px' }}>
                        {inv.totalAmount.toLocaleString('vi-VN')}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', padding: '2px 10px', fontSize: 'var(--type-caption)', borderRadius: '4px', border: '1px solid' }}
                          className={STATUS_DISPLAY[inv.status]?.color || 'bg-gray-100 text-gray-800 border-gray-300'}
                        >
                          {STATUS_DISPLAY[inv.status]?.label || inv.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => setModalInvoiceId(inv.id)}
                            title="Xem chi tiết"
                            style={{ padding: '5px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#4b5563', display: 'flex' }}
                          >
                            <Eye size={14} />
                          </button>
                          {isDraft(inv) && (
                            <>
                              <button
                                title="Chỉnh sửa"
                                style={{ padding: '5px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#4b5563', display: 'flex' }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleApprove(inv.id, inv.roomCode)}
                                title="Phê duyệt & Gửi"
                                style={{ padding: '5px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#16a34a', display: 'flex' }}
                              >
                                <Send size={14} />
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

      </div>

      {/* Invoice detail modal */}
      {modalInvoiceId && (
        <InvoiceDetailModal
          invoiceId={modalInvoiceId}
          invoiceNumber={modalInvoice?.invoiceNumber}
          isDraft={modalInvoice ? isDraft(modalInvoice) : false}
          onClose={() => setModalInvoiceId(null)}
          onApprove={(id) => { handleApprove(id, modalInvoice?.roomCode); setModalInvoiceId(null); }}
          onReject={(id) => { handleReject(id); setModalInvoiceId(null); }}
        />
      )}

      {/* Confirm batch approve dialog */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.18)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 60px rgba(15,23,42,0.16)', border: '1px solid var(--surface-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={24} style={{ color: 'var(--success)' }} />
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Xác nhận phê duyệt hàng loạt</h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Bạn có chắc muốn phê duyệt và gửi <strong>{selectedIds.size > 0 ? selectedIds.size : filteredInvoices.length} hóa đơn</strong> cho cư dân?
              Sau khi phê duyệt, cư dân sẽ nhận thông báo qua app.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--surface-border)' }}>
              <button onClick={() => setShowConfirm(false)} style={{ padding: '8px 20px', border: '1px solid var(--surface-border)', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', background: 'white', color: 'var(--text-primary)' }}>Hủy</button>
              <button onClick={handleBatchApprove} disabled={approving} style={{ padding: '8px 20px', backgroundColor: 'var(--success)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: approving ? 0.6 : 1 }}>
                {approving ? 'Đang phê duyệt...' : 'Xác nhận phê duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}