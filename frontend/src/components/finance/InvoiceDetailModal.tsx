import { useState, useEffect } from 'react';
import { X, Send, CheckCircle, AlertTriangle, User, Clock, ChevronRight, Home, CalendarDays, ReceiptText, Wallet } from 'lucide-react';
import { api } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../lib/api-config';
import { formatDisplayDate } from '../../lib/date-utils';

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
  Draft:          { label: 'Nháp',          color: '#374151', bg: '#f3f4f6' },
  Nháp:           { label: 'Nháp',          color: '#374151', bg: '#f3f4f6' },
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
  return formatDisplayDate(d);
}
function billingPeriod(inv: InvoiceDetail) {
  if (inv.month && inv.year) return `${String(inv.month).padStart(2,'0')}/${inv.year}`;
  return '—';
}

/* ─── Sub-components ─────────────────────────────────────── */
function InfoCard({ title, headerRight, children }: { title: string; headerRight?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '14px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
      <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: '13px', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</span>
        {headerRight}
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '6px 0', fontSize: '13px' }}>
      <span style={{ color: '#6b7280' }}>{label}:</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: '#111827', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function LineItemCard({ item }: { item: LineItem }) {
  const label = ITEM_LABELS[item.itemType] || item.itemType;
  const lines = item.description ? item.description.split('\n') : [];
  const subtotal = item.subtotal ?? (item.quantity ?? 0) * (item.unitPrice ?? 0);
  const displayName = item.serviceName || lines[0] || label;
  const normalizeText = (value: string) => value.trim().toLowerCase();
  const hiddenDescriptions = new Set([normalizeText(displayName), normalizeText(label)]);
  const detailLines = (item.serviceName ? lines : lines.slice(1))
    .filter(line => line.trim())
    .filter(line => !hiddenDescriptions.has(normalizeText(line)));

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827', lineHeight: 1.35 }}>{displayName}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '999px', backgroundColor: '#eef2ff', color: '#3730a3', padding: '3px 9px', fontWeight: 700, fontSize: '11px' }}>{label}</span>
          </div>
          {detailLines.map((ln, i) => (
            <div key={i} style={{ fontSize: '13px', color: '#6b7280', marginTop: i === 0 ? '6px' : '3px', lineHeight: 1.45 }}>{ln}</div>
          ))}
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
            SL: <strong>{fmt(item.quantity ?? 0)}</strong>{item.unit ? ` ${item.unit}` : ''} · Đơn giá: <strong>{fmt(item.unitPrice ?? 0)} đ</strong>
          </div>
        </div>
        <span style={{ fontWeight: 800, fontSize: '15px', color: '#111827', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {fmt(subtotal)} đ
        </span>
      </div>
    </div>
  );
}

function SummaryTile({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '14px', padding: '14px 16px', backgroundColor: accent ? '#eff6ff' : '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: accent ? '#dbeafe' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent ? '#1d4ed8' : '#4b5563' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{value}</div>
      </div>
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
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

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
  const canResendInvoice = Boolean(detail && !isDraft && detail.status !== 'Nháp' && detail.status !== 'Bị từ chối');

  const handleResendInvoice = async () => {
    if (!detail || !canResendInvoice) return;
    setResending(true);
    setResendMessage('');
    setResendError('');
    try {
      const res = await api.post<{ sentCount?: number }>(API_ENDPOINTS.INVOICES.RESEND(detail.id));
      const sentCount = res.data?.sentCount ?? sendCount;
      setResendMessage(`Đã gửi lại hóa đơn cho ${sentCount} người.`);
    } catch (err: any) {
      setResendError(err.response?.data?.message || 'Không thể gửi lại hóa đơn.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="admin-content-modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ backgroundColor: '#f8fafc', borderRadius: '18px', width: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 80px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
              <ReceiptText size={21} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>
                Chi tiết hóa đơn{detail ? ` tháng ${billingPeriod(detail)}` : invoiceNumber ? ` — ${invoiceNumber}` : ''}
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#6b7280' }}>{invoiceNumber || (detail ? `HD-${String(detail.id).padStart(5,'0')}` : 'Đang tải...')}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', padding: '8px', color: '#6b7280', borderRadius: 10 }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '14px' }}>Đang tải...</div>
          ) : !detail ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '14px' }}>Không tải được dữ liệu.</div>
          ) : (
            <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '18px' }}>
              <SummaryTile icon={<Home size={18} />} label="Phòng" value={room?.roomCode || detail.roomNumber || '—'} />
              <SummaryTile icon={<CalendarDays size={18} />} label="Kỳ thanh toán" value={billingPeriod(detail)} />
              <SummaryTile icon={<Wallet size={18} />} label="Tổng tiền" value={`${fmt(detail.totalAmount)} đ`} accent />
              <SummaryTile
                icon={<CheckCircle size={18} />}
                label="Trạng thái"
                value={statusInfo ? (
                  <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                ) : '—'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.35fr', gap: '20px', alignItems: 'start' }}>

              {/* LEFT column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Thông tin hóa đơn */}
                <InfoCard title="Thông tin hóa đơn">
                  <InfoRow label="Mã hóa đơn" value={`HD-${String(detail.id).padStart(5,'0')}`} bold />
                  <InfoRow label="Kỳ thanh toán" value={billingPeriod(detail)} />
                  <InfoRow
                    label="Hạn thanh toán"
                    value={<span style={{ fontWeight: 700, color: detail.dueDate && new Date(detail.dueDate) < new Date() && detail.status !== 'Đã thanh toán' ? '#dc2626' : '#111827' }}>{fmtDate(detail.dueDate)}</span>}
                    bold
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 'var(--type-caption)' }}>
                    <span style={{ color: '#6b7280' }}>Trạng thái:</span>
                    {statusInfo && (
                      <span style={{ padding: '2px 10px', borderRadius: '4px', fontSize: 'var(--type-caption)', fontWeight: 600, backgroundColor: statusInfo.bg, color: statusInfo.color }}>
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
                    <span style={{ fontSize: 'var(--type-caption)', fontWeight: 600, backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 'var(--radius-badge)' }}>
                      {members.length} người
                    </span>
                  ) : undefined}
                >
                  {members.length === 0 ? (
                    <div style={{ fontSize: 'var(--type-caption)', color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>
                      Không có dữ liệu thành viên
                    </div>
                  ) : (
                    members.map(m => (
                      <div key={m.residentId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={16} style={{ color: '#9ca3af' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 'var(--type-caption)', fontWeight: 600, color: '#111827' }}>{m.fullName || '—'}</div>
                          {m.phoneNumber && <div style={{ fontSize: 'var(--type-caption)', color: '#6b7280' }}>{m.phoneNumber}</div>}
                        </div>
                        <span style={{
                          fontSize: 'var(--type-caption)', padding: '2px 8px', borderRadius: '4px', border: '1px solid',
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
                  {/* {members.length > 0 && (
                    <div style={{ marginTop: '10px', padding: '8px 10px', backgroundColor: 'rgba(21, 128, 61, 0.08)', border: '1px solid rgba(21, 128, 61, 0.18)', borderRadius: '8px', fontSize: 'var(--type-caption)', color: 'var(--success)' }}>
                      Tất cả {members.length} người đã nhận thông báo qua App cư dân. Chỉ chủ hộ có quyền thanh toán.
                    </div>
                  )} */}
                </InfoCard>

                {/* Lịch sử thông báo */}
                <InfoCard title="Lịch sử thông báo">
                  {detail.approvedAt ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--type-caption)' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)', flex: 1 }}>Gửi hóa đơn lần đầu</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--type-caption)' }}>
                        {fmtDate(detail.approvedAt)} {detail.approvedAt ? new Date(detail.approvedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''} — Đã gửi cho {sendCount} thành viên ✅
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                      <Clock size={14} />
                      <span>Chưa gửi thông báo</span>
                    </div>
                  )}
                  <button
                    style={{ marginTop: '10px', fontSize: 'var(--type-caption)', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                  >
                    <ChevronRight size={13} />
                    Xem chi tiết trong <strong>Công nợ &amp; Nhắc nợ</strong>
                  </button>
                </InfoCard>
              </div>

              {/* RIGHT column — Chi tiết khoản thu */}
              <div>
                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>Chi tiết các khoản thu</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 2 }}>{(detail.lineItems ?? []).length} khoản trong hóa đơn</div>
                  </div>
                </div>

                {(detail.lineItems ?? []).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(detail.lineItems ?? []).map(item => <LineItemCard key={item.id} item={item} />)}
                  </div>
                ) : (
                  <div style={{ fontSize: 'var(--type-caption)', color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>Không có chi tiết khoản thu</div>
                )}

                {/* Tổng cộng */}
                <div style={{ border: '1px solid rgba(37, 99, 235, 0.24)', borderRadius: '16px', padding: '18px 16px', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: '#1d4ed8', letterSpacing: '0.06em' }}>TỔNG THANH TOÁN</span>
                  <span style={{ fontWeight: 900, fontSize: '22px', color: '#1d4ed8' }}>
                    {fmt(detail.totalAmount)} VNĐ
                  </span>
                </div>

                {/* Draft warning */}
                {isDraft && (
                  <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: 'rgba(180, 83, 9, 0.08)', border: '1px solid rgba(180, 83, 9, 0.18)', borderRadius: '8px', fontSize: 'var(--type-caption)', color: 'var(--warning)', display: 'flex', gap: '6px' }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>Sau khi phê duyệt, cư dân sẽ nhận thông báo và thấy hóa đơn này trên app.</span>
                  </div>
                )}
              </div>
            </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff' }}>
          <button
            style={{ padding: '8px 16px', backgroundColor: 'var(--brand-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-button)', fontWeight: 600, cursor: 'pointer', fontSize: 'var(--type-caption)', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => window.print()}
          >
            <Printer size={14} />
            In hóa đơn
          </button>
          <button
            onClick={handleResendInvoice}
            disabled={!canResendInvoice || resending}
            style={{ padding: '8px 16px', backgroundColor: 'var(--brand-secondary)', color: 'white', border: 'none', borderRadius: 'var(--radius-button)', fontWeight: 600, cursor: (!canResendInvoice || resending) ? 'not-allowed' : 'pointer', fontSize: 'var(--type-caption)', display: 'flex', alignItems: 'center', gap: '6px', opacity: (!canResendInvoice || resending) ? 0.55 : 1 }}
          >
            <Send size={14} />
            {resending ? 'Đang gửi...' : `Gửi lại cho ${sendCount > 0 ? `${sendCount} người` : 'cư dân'}`}
          </button>
          {resendMessage && <span style={{ fontSize: 'var(--type-caption)', color: 'var(--success)' }}>{resendMessage}</span>}
          {resendError && <span style={{ fontSize: 'var(--type-caption)', color: 'var(--error)' }}>{resendError}</span>}
          {isDraft && detail && (
            <button
              style={{ padding: '8px 16px', backgroundColor: 'var(--info)', color: 'white', border: 'none', borderRadius: 'var(--radius-button)', fontWeight: 600, cursor: 'pointer', fontSize: 'var(--type-caption)', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => { onApprove(detail.id); onClose(); }}
            >
              <CheckCircle size={14} />
              Phê duyệt &amp; Gửi
            </button>
          )}
          <div style={{ flex: 1 }} />
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
