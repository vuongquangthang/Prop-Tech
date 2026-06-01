import { useState, useEffect } from 'react';
import { X, Send, CheckCircle, AlertTriangle, User, Clock, ChevronRight } from 'lucide-react';
import { api } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../lib/api-config';

/* ─── Types ─────────────────────────────────────────────── */
interface LineItem {
  id: number;
  itemType: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  subtotal?: number;   // computed by backend: quantity * unitPrice
  serviceName?: string;
  unit?: string;
}

interface InvoiceDetail {
  id: number;
  contractId: number;
  roomId?: number;
  roomNumber?: string;  // room code / number
  residentName?: string;
  month: number;
  year: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount?: number;
  status: string;
  dueDate?: string;
  paidDate?: string;
  approvedAt?: string;
  rejectedReason?: string;
  lineItems: LineItem[];
}

interface RoomInfo {
  id: number;
  roomCode: string;
  area?: number;
  floorNumber?: number;
  buildingName?: string;
  status?: string;
}

interface ResidentMember {
  residentId: number;
  fullName?: string;
  phoneNumber?: string;
  residencyRole: string;
  fromDate?: string;
  toDate?: string;
}

interface ContractInfo {
  id: number;
  roomNumber?: string;
  startDate?: string;
  expectedEndDate?: string;
  actualRentPrice?: number;
  depositAmount?: number;
  residents: ResidentMember[];
}

interface Props {
  invoiceId: number;
  invoiceNumber?: string;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  isDraft: boolean;
}

/* ─── Helpers ───────────────────────────────────────────── */
const ITEM_LABELS: Record<string, string> = {
  TienPhong:   'Tiền thuê phòng',
  PhiQuanLy:   'Phí quản lý chung cư',
  Dien:        'Tiền điện',
  DienNang:    'Tiền điện',
  Nuoc:        'Tiền nước',
  DichVu:      'Dịch vụ',
  PhatSinh:    'Phát sinh',
  KhauTru:     'Khấu trừ',
  LateFee:     'Phí trễ hạn',
  Adjustment:  'Điều chỉnh',
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  Draft:          { label: 'Nhập',          color: '#374151', bg: '#f3f4f6' },
  Nháp:           { label: 'Nhập',          color: '#374151', bg: '#f3f4f6' },
  Issued:         { label: 'Chờ thanh toán', color: '#92400e', bg: '#fef3c7' },
  'Chưa thanh toán': { label: 'Chờ thanh toán', color: '#92400e', bg: '#fef3c7' },
  PartiallyPaid:  { label: 'Đã TT một phần', color: '#1e40af', bg: '#dbeafe' },
  Paid:           { label: 'Đã thanh toán',  color: '#14532d', bg: '#dcfce7' },
  'Đã thanh toán': { label: 'Đã thanh toán', color: '#14532d', bg: '#dcfce7' },
  Overdue:        { label: 'Quá hạn',        color: '#7f1d1d', bg: '#fee2e2' },
  Void:           { label: 'Đã hủy',         color: '#6b7280', bg: '#f3f4f6' },
};

const RESIDENCY_ROLE_LABELS: Record<string, string> = {
  'Người thuê chính': 'Chủ hộ',
  'Người thuê':       'Chủ hộ',
  'Người ở cùng':    'Thành viên',
  'Khác':            'Khác',
  PRIMARY:          'Chủ hộ',
  OWNER:            'Chủ hộ',
  TENANT:           'Người thuê',
};

function fmt(n: number | null | undefined) { return (n ?? 0).toLocaleString('vi-VN'); }
function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function billingPeriod(inv: InvoiceDetail) {
  if (inv.month && inv.year) return `${String(inv.month).padStart(2,'0')}/${inv.year}`;
  return '—';
}

/* ─── Sub-components ─────────────────────────────────────── */
function InfoCard({ title, headerRight, children }: { title: string; headerRight?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
      <div style={{ backgroundColor: '#f9fafb', padding: '10px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>{title}</span>
        {headerRight}
      </div>
      <div style={{ padding: '12px 16px' }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: '13px' }}>
      <span style={{ color: '#6b7280' }}>{label}:</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: '#111827' }}>{value}</span>
    </div>
  );
}

function LineItemCard({ item }: { item: LineItem }) {
  const label = ITEM_LABELS[item.itemType] || item.itemType;
  const lines = item.description ? item.description.split('\n') : [];

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{label}</span>
        <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827', flexShrink: 0, marginLeft: '12px' }}>
          {fmt(item.subtotal ?? (item.quantity ?? 0) * (item.unitPrice ?? 0))}
        </span>
      </div>
      {lines.map((ln, i) => (
        <div key={i} style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', lineHeight: 1.5 }}>{ln}</div>
      ))}
      {item.unit && (
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{item.unit}</div>
      )}
    </div>
  );
}

/* ─── Main Modal ─────────────────────────────────────────── */
export function InvoiceDetailModal({ invoiceId, invoiceNumber, onClose, onApprove, onReject, isDraft }: Props) {
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [members, setMembers] = useState<ResidentMember[]>([]);
  const [contract, setContract] = useState<ContractInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchAll = async () => {
      try {
        // Fetch invoice — use /api/HoaDon/{id}
        const detailRes = await api.get<InvoiceDetail>(API_ENDPOINTS.INVOICES.BY_ID(invoiceId));
        if (cancelled) return;
        const inv = detailRes.data;
        setDetail(inv);

        // Fetch room info and contracts in parallel (best effort)
        const [roomRes, contractsRes] = await Promise.allSettled([
          inv.roomId ? api.get<RoomInfo>(API_ENDPOINTS.ROOMS.BY_ID(inv.roomId)) : Promise.reject('no roomId'),
          inv.roomId ? api.get<ContractInfo[]>(API_ENDPOINTS.CONTRACTS.BY_ROOM(inv.roomId)) : Promise.reject('no roomId'),
        ]);
        if (cancelled) return;
        if (roomRes.status === 'fulfilled') setRoom(roomRes.value.data);
        if (contractsRes.status === 'fulfilled') {
          const contracts = contractsRes.value.data || [];
          // Pick active contract (no endDate or endDate in future), else latest
          const active = contracts.find(c => !c.expectedEndDate || new Date(c.expectedEndDate) >= new Date())
            ?? contracts[contracts.length - 1];
          if (active) {
            setContract(active);
            setMembers(active.residents || []);
          }
        }
      } catch {
        // ignore — show what we have
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [invoiceId]);

  const statusInfo = detail ? (STATUS_MAP[detail.status] || { label: detail.status, color: '#374151', bg: '#f3f4f6' }) : null;
  const primaryMember = members.find(m => m.residencyRole === 'Người thuê chính' || m.residencyRole === 'Người thuê');
  const sendCount = members.length || 1;

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '900px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 80px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Eye24 />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
              Chi tiết hóa đơn{detail ? ` — ${billingPeriod(detail)}` : invoiceNumber ? ` — ${invoiceNumber}` : ''}
            </h2>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px', color: '#6b7280' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '14px' }}>Đang tải...</div>
          ) : !detail ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '14px' }}>Không tải được dữ liệu.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

              {/* LEFT column */}
              <div>
                {/* Thông tin hóa đơn */}
                <InfoCard title="Thông tin hóa đơn">
                  <InfoRow label="Mã hóa đơn" value={`HD-${String(detail.id).padStart(5,'0')}`} bold />
                  <InfoRow label="Kỳ thanh toán" value={billingPeriod(detail)} />
                  <InfoRow
                    label="Hạn thanh toán"
                    value={<span style={{ fontWeight: 700, color: detail.dueDate && new Date(detail.dueDate) < new Date() && detail.status !== 'Đã thanh toán' ? '#dc2626' : '#111827' }}>{fmtDate(detail.dueDate)}</span>}
                    bold
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: '13px' }}>
                    <span style={{ color: '#6b7280' }}>Trạng thái:</span>
                    {statusInfo && (
                      <span style={{ padding: '2px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, backgroundColor: statusInfo.bg, color: statusInfo.color }}>
                        {statusInfo.label}
                      </span>
                    )}
                  </div>
                  {detail.paidAmount > 0 && (
                    <InfoRow label="Đã thanh toán" value={<span style={{ color: '#16a34a', fontWeight: 700 }}>{fmt(detail.paidAmount)} đ</span>} />
                  )}
                  {detail.rejectedReason && (
                    <InfoRow label="Lý do từ chối" value={<span style={{ color: '#dc2626' }}>{detail.rejectedReason}</span>} />
                  )}
                </InfoCard>

                {/* Thành viên trong hộ */}
                <InfoCard
                  title="Thành viên trong hộ"
                  headerRight={members.length > 0 ? (
                    <span style={{ fontSize: '12px', fontWeight: 600, backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px' }}>
                      {members.length} người
                    </span>
                  ) : undefined}
                >
                  {members.length === 0 ? (
                    <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>
                      Không có dữ liệu thành viên
                    </div>
                  ) : (
                    members.map(m => (
                      <div key={m.residentId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={16} style={{ color: '#9ca3af' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{m.fullName || '—'}</div>
                          {m.phoneNumber && <div style={{ fontSize: '12px', color: '#6b7280' }}>{m.phoneNumber}</div>}
                        </div>
                        <span style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid',
                          flexShrink: 0,
                          backgroundColor: (m.residencyRole === 'Người thuê chính' || m.residencyRole === 'Người thuê') ? 'rgba(30, 78, 140, 0.08)' : 'white',
                          borderColor: (m.residencyRole === 'Người thuê chính' || m.residencyRole === 'Người thuê') ? 'rgba(30, 78, 140, 0.28)' : 'var(--surface-border)',
                          color: 'var(--text-secondary)',
                        }}>
                          {RESIDENCY_ROLE_LABELS[m.residencyRole] || m.residencyRole}
                        </span>
                      </div>
                    ))
                  )}
                  {members.length > 0 && (
                    <div style={{ marginTop: '10px', padding: '8px 10px', backgroundColor: 'rgba(21, 128, 61, 0.08)', border: '1px solid rgba(21, 128, 61, 0.18)', borderRadius: '8px', fontSize: '12px', color: 'var(--success)' }}>
                      Tất cả {members.length} người đã nhận thông báo qua App cư dân. Chỉ chủ hộ có quyền thanh toán.
                    </div>
                  )}
                </InfoCard>

                {/* Lịch sử thông báo */}
                <InfoCard title="Lịch sử thông báo">
                  {detail.approvedAt ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)', flex: 1 }}>Gửi hóa đơn lần đầu</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {fmtDate(detail.approvedAt)} {detail.approvedAt ? new Date(detail.approvedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''} — Đã gửi cho {sendCount} thành viên ✅
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <Clock size={14} />
                      <span>Chưa gửi thông báo</span>
                    </div>
                  )}
                  <button
                    style={{ marginTop: '10px', fontSize: '12px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                  >
                    <ChevronRight size={13} />
                    Xem chi tiết trong <strong>Công nợ &amp; Nhắc nợ</strong>
                  </button>
                </InfoCard>
              </div>

              {/* RIGHT column — Chi tiết khoản thu */}
              <div>
                <div style={{ marginBottom: '12px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Chi tiết các khoản thu</div>

                {(detail.lineItems ?? []).length > 0 ? (
                  (detail.lineItems ?? []).map(item => <LineItemCard key={item.id} item={item} />)
                ) : (
                  <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>Không có chi tiết khoản thu</div>
                )}

                {/* Tổng cộng */}
                <div style={{ border: '1px solid rgba(30, 78, 140, 0.24)', borderRadius: '12px', padding: '16px 14px', backgroundColor: 'rgba(30, 78, 140, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--brand-primary)', letterSpacing: '0.05em' }}>TỔNG CỘNG</span>
                  <span style={{ fontWeight: 800, fontSize: '20px', color: 'var(--brand-primary)' }}>
                    {fmt(detail.totalAmount)} VND
                  </span>
                </div>

                {/* Draft warning */}
                {isDraft && (
                  <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: 'rgba(180, 83, 9, 0.08)', border: '1px solid rgba(180, 83, 9, 0.18)', borderRadius: '8px', fontSize: '12px', color: 'var(--warning)', display: 'flex', gap: '6px' }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>Sau khi phê duyệt, cư dân sẽ nhận thông báo và thấy hóa đơn này trên app.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            style={{ padding: '8px 16px', backgroundColor: 'var(--brand-primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => window.print()}
          >
            <Printer size={14} />
            In hóa đơn
          </button>
          <button
            style={{ padding: '8px 16px', backgroundColor: 'var(--brand-secondary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Send size={14} />
            Gửi lại cho {sendCount > 0 ? `${sendCount} người` : 'cư dân'}
          </button>
          {isDraft && detail && (
            <button
              style={{ padding: '8px 16px', backgroundColor: 'var(--info)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => { onApprove(detail.id); onClose(); }}
            >
              <CheckCircle size={14} />
              Phê duyệt &amp; Gửi
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{ padding: '8px 20px', border: '1px solid var(--surface-border)', borderRadius: '12px', fontSize: '13px', cursor: 'pointer', background: 'white', color: 'var(--text-primary)', fontWeight: 500 }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* tiny icon component to avoid missing import */
function Eye24() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6b7280' }}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function Printer({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}
