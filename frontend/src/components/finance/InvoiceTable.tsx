import { useState, useEffect, useCallback } from 'react';
import { Eye, Send, Filter, CheckCircle, X, FileText, Pencil, Trash2 } from 'lucide-react';
import { useSignalRRefresh } from '../../lib/useSignalRRefresh';
import { api } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../lib/api-config';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { FilterSelect } from '../ui/FilterSelect';
import { PageHeader } from '../ui/product-system';
import { buildingService, floorService, roomService, type Building, type Floor, type Room } from '../../services/api.service';

interface LineItem {
  id: number;
  itemType: string;
  serviceId?: number;
  serviceName?: string;
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
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Selection & approve state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [approving, setApproving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Detail modal state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalInvoiceId, setModalInvoiceId] = useState<number | null>(null);
  const modalInvoice = modalInvoiceId ? allInvoices.find(i => i.id === modalInvoiceId) : null;
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    const loadLocationFilters = async () => {
      try {
        const [buildingRows, floorRows, roomRows] = await Promise.all([
          buildingService.getAll(),
          floorService.getAll(),
          roomService.getAll(),
        ]);
        setBuildings(Array.isArray(buildingRows) ? buildingRows : []);
        setFloors(Array.isArray(floorRows) ? floorRows : []);
        setRooms(Array.isArray(roomRows) ? roomRows : []);
      } catch {
        setBuildings([]);
        setFloors([]);
        setRooms([]);
      }
    };

    void loadLocationFilters();
  }, []);

  const isOverdue = (inv: Invoice) =>
    isPending(inv) && !!inv.dueDate && new Date(inv.dueDate) < currentDate;

  const tabs = [
    { key: 'draft',   label: 'Nháp',           count: allInvoices.filter(isDraft).length },
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

  const roomByInvoice = (invoice: Invoice) => rooms.find(room =>
    (invoice.roomId && room.id === invoice.roomId) ||
    (!!invoice.roomCode && room.roomCode === invoice.roomCode) ||
    (!!invoice.roomNumber && room.roomCode === invoice.roomNumber)
  );

  const locationFiltered = tabFiltered.filter(invoice => {
    const room = roomByInvoice(invoice);
    if (selectedBuildingId && String(room?.buildingId ?? '') !== selectedBuildingId) return false;
    if (selectedFloorId && String(room?.floorId ?? '') !== selectedFloorId) return false;
    if (selectedRoomId && String(room?.id ?? '') !== selectedRoomId) return false;
    return true;
  });

  const filteredInvoices = search.trim()
    ? locationFiltered.filter(inv =>
        inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
        inv.roomCode?.toLowerCase().includes(search.toLowerCase()) ||
        inv.residentName?.toLowerCase().includes(search.toLowerCase())
      )
    : locationFiltered;

  const availableFloors = selectedBuildingId
    ? floors.filter(floor => String(floor.buildingId) === selectedBuildingId)
    : floors;
  const availableRooms = rooms.filter(room => {
    if (selectedBuildingId && String(room.buildingId ?? '') !== selectedBuildingId) return false;
    if (selectedFloorId && String(room.floorId) !== selectedFloorId) return false;
    return true;
  });

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

  const handleDeleteInvoice = async () => {
    if (!deleteInvoice) return;
    setDeleting(true);
    setErrors([]);
    setSuccessMsg('');
    try {
      await api.delete(API_ENDPOINTS.INVOICES.BY_ID(deleteInvoice.id));
      setSuccessMsg(`✅ Đã xóa hóa đơn ${deleteInvoice.invoiceNumber || `INV-${String(deleteInvoice.id).padStart(3, '0')}`}.`);
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(deleteInvoice.id);
        return next;
      });
      if (selectedInvoice?.id === deleteInvoice.id) setSelectedInvoice(null);
      if (modalInvoiceId === deleteInvoice.id) setModalInvoiceId(null);
      if (editingInvoice?.id === deleteInvoice.id) setEditingInvoice(null);
      setDeleteInvoice(null);
      await loadInvoices();
    } catch (err: any) {
      setErrors([err.response?.data?.message || 'Không thể xóa hóa đơn.']);
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredInvoices.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredInvoices.map(d => d.id)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        eyebrow="Hóa đơn & Tài chính"
        title="Quản lý hóa đơn"
        description="Tính toán, xem xét và theo dõi toàn bộ hóa đơn theo từng trạng thái."
      />

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
          style={{ padding: '7px 12px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-button)', fontSize: '14px', width: '220px', minWidth: '220px', maxWidth: '220px', flex: '0 0 220px', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}
        />
        <FilterSelect
          value={selectedBuildingId}
          onChange={(event) => {
            setSelectedBuildingId(event.target.value);
            setSelectedFloorId('');
            setSelectedRoomId('');
            setSelectedIds(new Set());
          }}
          wrapperClassName="w-[170px] min-w-[170px] max-w-[170px] flex-none"
          className="w-full"
          style={{ width: '100%', minWidth: 0, maxWidth: '100%', fieldSizing: 'fixed' } as React.CSSProperties}
        >
          <option value="">Tất cả tòa</option>
          {buildings.map(building => (
            <option key={building.id} value={String(building.id)}>
              {building.buildingName || building.buildingCode || `Tòa ${building.id}`}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={selectedFloorId}
          onChange={(event) => {
            setSelectedFloorId(event.target.value);
            setSelectedRoomId('');
            setSelectedIds(new Set());
          }}
          wrapperClassName="w-[150px] min-w-[150px] max-w-[150px] flex-none"
          className="w-full"
          style={{ width: '100%', minWidth: 0, maxWidth: '100%', fieldSizing: 'fixed' } as React.CSSProperties}
        >
          <option value="">Tất cả tầng</option>
          {availableFloors.map(floor => (
            <option key={floor.id} value={String(floor.id)}>
              Tầng {floor.floorNumber}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={selectedRoomId}
          onChange={(event) => {
            setSelectedRoomId(event.target.value);
            setSelectedIds(new Set());
          }}
          wrapperClassName="w-[150px] min-w-[150px] max-w-[150px] flex-none"
          className="w-full"
          style={{ width: '100%', minWidth: 0, maxWidth: '100%', fieldSizing: 'fixed' } as React.CSSProperties}
        >
          <option value="">Tất cả phòng</option>
          {availableRooms.map(room => (
            <option key={room.id} value={String(room.id)}>
              {room.roomCode}
            </option>
          ))}
        </FilterSelect>
        <button
          onClick={() => {
            setSelectedBuildingId('');
            setSelectedFloorId('');
            setSelectedRoomId('');
            setSelectedIds(new Set());
          }}
          disabled={!selectedBuildingId && !selectedFloorId && !selectedRoomId}
          className="w-[78px] min-w-[78px] max-w-[78px] flex-none px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:pointer-events-none"
          style={{ visibility: (selectedBuildingId || selectedFloorId || selectedRoomId) ? 'visible' : 'hidden' }}
        >
          Xóa lọc
        </button>
        <div style={{ flex: 1 }} />
        {activeTab === 'draft' && (
          <>
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
                <p className="text-sm text-gray-400 mt-1">Hãy chốt chỉ số điện/nước rồi tạo hóa đơn nháp từ trang Chốt chỉ số Điện/Nước.</p>
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
                        <span style={{ display: 'inline-block', padding: '2px 10px', fontSize: 'var(--type-caption)', borderRadius: 'var(--radius-status-badge)', border: 0 }}
                          className={`admin-status-badge ${STATUS_DISPLAY[inv.status]?.color || 'bg-gray-100 text-gray-800 border-gray-300'}`}
                        >
                          {STATUS_DISPLAY[inv.status]?.label || inv.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => setModalInvoiceId(inv.id)}
                            title="Xem chi tiết"
                            style={{ padding: '5px', border: 0, borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#4b5563', display: 'flex' }}
                          >
                            <Eye size={14} />
                          </button>
                          {isDraft(inv) && (
                            <>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setEditingInvoice(inv);
                                }}
                                title="Chỉnh sửa"
                                style={{ padding: '5px', border: 0, borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#4b5563', display: 'flex' }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleApprove(inv.id, inv.roomCode)}
                                title="Phê duyệt & Gửi"
                                style={{ padding: '5px', border: 0, borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#16a34a', display: 'flex' }}
                              >
                                <Send size={14} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteInvoice(inv);
                            }}
                            title="Xóa hóa đơn"
                            style={{ padding: '5px', border: 0, borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#dc2626', display: 'flex' }}
                          >
                            <Trash2 size={14} />
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

      {editingInvoice && (
        <EditDraftInvoiceModal
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSaved={async () => {
            setSuccessMsg(`✅ Đã cập nhật hóa đơn nháp phòng ${editingInvoice.roomCode || editingInvoice.invoiceNumber}.`);
            setEditingInvoice(null);
            await loadInvoices();
          }}
        />
      )}

      {/* Confirm batch approve dialog */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.18)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-modal)', width: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 60px rgba(15,23,42,0.16)', border: '1px solid var(--surface-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={24} style={{ color: 'var(--success)' }} />
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Xác nhận phê duyệt hàng loạt</h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Bạn có chắc muốn phê duyệt và gửi <strong>{selectedIds.size > 0 ? selectedIds.size : filteredInvoices.length} hóa đơn</strong> cho cư dân?
              Sau khi phê duyệt, cư dân sẽ nhận thông báo qua app.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--surface-border)' }}>
              <button onClick={() => setShowConfirm(false)} style={{ padding: '8px 20px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-button)', fontSize: '14px', cursor: 'pointer', background: 'white', color: 'var(--text-primary)' }}>Hủy</button>
              <button onClick={handleBatchApprove} disabled={approving} style={{ padding: '8px 20px', backgroundColor: 'var(--success)', color: 'white', border: 'none', borderRadius: 'var(--radius-button)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: approving ? 0.6 : 1 }}>
                {approving ? 'Đang phê duyệt...' : 'Xác nhận phê duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteInvoice && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.18)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-modal)', width: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 60px rgba(15,23,42,0.16)', border: '1px solid var(--surface-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Trash2 size={24} style={{ color: '#dc2626' }} />
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Xác nhận xóa hóa đơn</h3>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <p>Bạn có chắc muốn xóa hóa đơn này không?</p>
              <p><strong>Mã hóa đơn:</strong> {deleteInvoice.invoiceNumber || `INV-${String(deleteInvoice.id).padStart(3, '0')}`}</p>
              <p><strong>Phòng:</strong> {deleteInvoice.roomCode || '—'}</p>
              <p><strong>Tổng tiền:</strong> {deleteInvoice.totalAmount.toLocaleString('vi-VN')} VND</p>
              <p style={{ marginTop: '8px', color: '#b91c1c' }}>Lưu ý: hóa đơn đã có thanh toán sẽ không thể xóa.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--surface-border)' }}>
              <button
                onClick={() => setDeleteInvoice(null)}
                disabled={deleting}
                style={{ padding: '8px 20px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-button)', fontSize: '14px', cursor: 'pointer', background: 'white', color: 'var(--text-primary)', opacity: deleting ? 0.6 : 1 }}
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteInvoice}
                disabled={deleting}
                style={{ padding: '8px 20px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: 'var(--radius-button)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DraftLineItemForm {
  id: number;
  itemType: string;
  serviceId?: number;
  description: string;
  quantity: string;
  unitPrice: string;
}

function EditDraftInvoiceModal({
  invoice,
  onClose,
  onSaved,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [lineItems, setLineItems] = useState<DraftLineItemForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadDetail = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get<Invoice>(API_ENDPOINTS.INVOICES.BY_ID(invoice.id));
        const items = response.data.lineItems || [];
        if (!mounted) return;
        setLineItems(items.map((item) => ({
          id: item.id,
          itemType: item.itemType || 'DichVu',
          serviceId: item.serviceId,
          description: item.description || item.serviceName || item.itemType || 'Khoản thu',
          quantity: String(item.quantity ?? 1),
          unitPrice: String(item.unitPrice ?? 0),
        })));
      } catch (err: any) {
        if (mounted) setError(err.response?.data?.message || 'Không thể tải chi tiết hóa đơn nháp.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadDetail();
    return () => { mounted = false; };
  }, [invoice.id]);

  const updateLineItem = (id: number, field: keyof DraftLineItemForm, value: string) => {
    setLineItems((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const parseMoney = (value: string) => Number(value.replace(/[^\d.]/g, '')) || 0;
  const parseQuantity = (value: string) => Number(value.replace(/[^\d.]/g, '')) || 0;
  const totalAmount = lineItems.reduce((sum, item) => sum + parseQuantity(item.quantity) * parseMoney(item.unitPrice), 0);

  const handleSave = async () => {
    const invalidItem = lineItems.find((item) => !item.description.trim() || parseQuantity(item.quantity) < 0 || parseMoney(item.unitPrice) < 0);
    if (invalidItem) {
      setError('Vui lòng kiểm tra mô tả, số lượng và đơn giá của các khoản thu.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await api.put(API_ENDPOINTS.INVOICES.EDIT_DRAFT(invoice.id), {
        lineItems: lineItems.map((item) => ({
          itemType: item.itemType,
          serviceId: item.serviceId,
          quantity: parseQuantity(item.quantity),
          unitPrice: parseMoney(item.unitPrice),
          description: item.description.trim(),
        })),
      });
      await onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể lưu hóa đơn nháp.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[860px] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Sửa hóa đơn nháp</h3>
            <p className="text-sm text-gray-500">Phòng {invoice.roomCode || '---'} · {invoice.invoiceNumber}</p>
          </div>
          <button onClick={onClose} disabled={saving} className="p-1 text-gray-500 hover:text-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="py-10 text-center text-gray-500">Đang tải chi tiết hóa đơn...</div>
          ) : (
            <div className="space-y-3">
              {lineItems.map((item, index) => {
                const subtotal = parseQuantity(item.quantity) * parseMoney(item.unitPrice);
                return (
                  <div key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Khoản thu #{index + 1}</span>
                      <span className="text-sm font-bold text-gray-900">{subtotal.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-5">
                        <label className="mb-1 block text-xs text-gray-600">Mô tả</label>
                        <input
                          value={item.description}
                          onChange={(event) => updateLineItem(item.id, 'description', event.target.value)}
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="mb-1 block text-xs text-gray-600">Loại</label>
                        <select
                          value={item.itemType}
                          onChange={(event) => updateLineItem(item.id, 'itemType', event.target.value)}
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                        >
                          <option value="TienPhong">Tiền phòng</option>
                          <option value="Dien">Điện</option>
                          <option value="Nuoc">Nước</option>
                          <option value="DichVu">Dịch vụ</option>
                          <option value="PhatSinh">Phát sinh</option>
                          <option value="KhauTru">Khấu trừ</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="mb-1 block text-xs text-gray-600">Số lượng</label>
                        <input
                          value={item.quantity}
                          onChange={(event) => updateLineItem(item.id, 'quantity', event.target.value.replace(/[^\d.]/g, ''))}
                          inputMode="decimal"
                          className="w-full rounded border border-gray-300 px-3 py-2 text-right text-sm focus:outline-none focus:border-gray-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="mb-1 block text-xs text-gray-600">Đơn giá</label>
                        <input
                          value={item.unitPrice}
                          onChange={(event) => updateLineItem(item.id, 'unitPrice', event.target.value.replace(/[^\d.]/g, ''))}
                          inputMode="decimal"
                          className="w-full rounded border border-gray-300 px-3 py-2 text-right text-sm focus:outline-none focus:border-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-between bg-white">
          <div className="text-sm text-gray-700">
            Tổng sau chỉnh sửa: <strong>{totalAmount.toLocaleString('vi-VN')} VNĐ</strong>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} disabled={saving} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">Hủy</button>
            <button onClick={handleSave} disabled={saving || loading || lineItems.length === 0} className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
