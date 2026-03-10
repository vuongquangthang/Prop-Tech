import { useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { invoiceService, HoaDonDetail } from '../../services/api.service';
import { useSignalRRefresh } from '../../lib/useSignalRRefresh';

const STATUS_OPTIONS = [
  { value: 'all',          label: 'Tất cả' },
  { value: 'pending',      label: 'Chưa thanh toán' },
  { value: 'paid',         label: 'Đã thanh toán' },
  { value: 'overdue',      label: 'Quá hạn' },
];

function getStatusInfo(status: string): { label: string; color: string; bg: string } {
  const s = (status ?? '').toLowerCase();
  if (s.includes('chưa') || s === 'pending')
    return { label: 'Chưa thanh toán', color: '#D97706', bg: '#FEF3C7' };
  if (s.includes('quá') || s === 'overdue')
    return { label: 'Quá hạn', color: '#DC2626', bg: '#FEE2E2' };
  if (s.includes('đã') || s === 'paid')
    return { label: 'Đã thanh toán', color: '#059669', bg: '#D1FAE5' };
  return { label: status, color: '#6B7280', bg: '#F3F4F6' };
}

function matchesFilter(inv: HoaDonDetail, filterStatus: string): boolean {
  if (filterStatus === 'all') return true;
  const s = (inv.status ?? '').toLowerCase();
  if (filterStatus === 'pending')
    return s.includes('chưa') || s === 'pending';
  if (filterStatus === 'overdue')
    return s.includes('quá') || s === 'overdue';
  if (filterStatus === 'paid')
    return s.includes('đã') || s === 'paid';
  return true;
}

export function PaymentHistory() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<HoaDonDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState('all');

  const loadData = useCallback(async () => {
    try {
      const data = await invoiceService.getMy();
      setInvoices(data);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useSignalRRefresh(['InvoiceUpdated', 'PaymentSuccess'], loadData);

  // Build year list from invoices
  const years = Array.from(
    new Set(invoices.map(inv => inv.year ?? new Date().getFullYear())),
  ).sort((a, b) => b - a);
  if (!years.includes(filterYear)) years.push(filterYear);
  years.sort((a, b) => b - a);

  const filtered = invoices
    .filter(inv => (inv.year ?? 0) === filterYear)
    .filter(inv => matchesFilter(inv, filterStatus))
    .sort((a, b) => (b.month ?? 0) - (a.month ?? 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#FFF',
        borderBottom: '1px solid #F3F4F6',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px',
      }}>
        <button
          onClick={() => navigate('/resident')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          <ChevronLeft size={22} color="#111827" />
        </button>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0, flex: 1 }}>
          Lịch sử hóa đơn
        </p>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: '#FFF',
        borderBottom: '1px solid #F3F4F6',
        padding: '10px 16px',
        display: 'flex', gap: 10,
      }}>
        <select
          value={filterYear}
          onChange={e => setFilterYear(Number(e.target.value))}
          style={{
            flex: 1, padding: '7px 10px',
            border: '1px solid #E5E7EB', borderRadius: 10,
            fontSize: 13, color: '#111827', backgroundColor: '#FFF',
            appearance: 'none',
          }}
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{
            flex: 1, padding: '7px 10px',
            border: '1px solid #E5E7EB', borderRadius: 10,
            fontSize: 13, color: '#111827', backgroundColor: '#FFF',
            appearance: 'none',
          }}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#6B7280', fontSize: 14, paddingTop: 40 }}>Đang tải...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <p style={{ fontSize: 40 }}>📄</p>
            <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 10 }}>Không có hóa đơn nào</p>
          </div>
        ) : (
          filtered.map(inv => {
            const si = getStatusInfo(inv.status);
            const isPending = (inv.status ?? '').toLowerCase().includes('chưa') || inv.status === 'pending';
            const isNew = inv.createdDate &&
              (Date.now() - new Date(inv.createdDate).getTime()) < 7 * 86400000;
            return (
              <div
                key={inv.id}
                onClick={() => navigate('/resident/bill-detail')}
                style={{
                  backgroundColor: '#FFF',
                  borderRadius: 16,
                  border: isPending ? '1.5px solid #2563EB' : '1px solid #E5E7EB',
                  padding: 16,
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                {isNew && (
                  <div style={{
                    position: 'absolute', top: -1, right: 12,
                    backgroundColor: '#059669', borderRadius: '0 0 6px 6px',
                    padding: '2px 8px',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#FFF' }}>MỚI</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
                      Tháng {String(inv.month ?? '?').padStart(2, '0')}/{inv.year}
                    </p>
                    <p style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>
                      Phòng {inv.roomNumber ?? '—'}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: si.color, backgroundColor: si.bg,
                    padding: '3px 10px', borderRadius: 20,
                  }}>
                    {si.label}
                  </span>
                </div>
                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 17, fontWeight: 700, color: isPending ? '#2563EB' : '#111827', margin: 0 }}>
                    {inv.totalAmount.toLocaleString('vi-VN')}đ
                  </p>
                  {inv.dueDate && (
                    <p style={{ fontSize: 11, color: '#6B7280' }}>
                      HH: {new Date(inv.dueDate).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
