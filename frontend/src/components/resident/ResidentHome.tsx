import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, Home, Bell, MessageCircle, Wrench, List, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { invoiceService, HoaDonDetail } from '../../services/api.service';

export function ResidentHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getUnreadNotificationCountByTarget } = useData();
  const [invoices, setInvoices] = useState<HoaDonDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const unreadNotifications = getUnreadNotificationCountByTarget('resident');

  const loadInvoices = useCallback(async () => {
    try {
      const data = await invoiceService.getMy();
      setInvoices(data);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const pendingInvoice = invoices.find(
    inv => inv.status === 'pending' || inv.status === 'Chưa thanh toán' ||
           inv.status === 'overdue'  || inv.status === 'Quá hạn',
  );

  const roomNumber = invoices[0]?.roomNumber ?? '--';
  const today = new Date();
  const isOverdue = pendingInvoice?.status === 'overdue' || pendingInvoice?.status === 'Quá hạn';
  const daysUntilDue = pendingInvoice?.dueDate
    ? Math.ceil((new Date(pendingInvoice.dueDate).getTime() - today.getTime()) / 86400000)
    : null;
  const isDueSoon = !isOverdue && daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 7;

  const utilities = [
    { icon: Wrench, label: 'Báo cáo sự cố', path: '/resident/incidents/create' },
    { icon: List,   label: 'Danh sách sự cố', path: '/resident/incidents' },
  ];

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      {/* Hero Section */}
      <div style={{ position: 'relative', height: 240, overflow: 'hidden', flexShrink: 0 }}>
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600"
          alt="Building"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)' }} />

        {/* Building pill – top left */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          display: 'flex', alignItems: 'center', gap: 8,
          backgroundColor: 'rgba(255,255,255,0.18)',
          border: '1px solid rgba(255,255,255,0.35)',
          borderRadius: 20, padding: '5px 12px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            backgroundColor: '#2563EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#FFF' }}>SH</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#FFF' }}>SmartHome KĐT...</span>
          <ChevronRight size={13} color="#FFF" />
        </div>

        {/* Notification bell – top right */}
        <button
          onClick={() => navigate('/resident/notifications')}
          style={{
            position: 'absolute', top: 10, right: 12,
            width: 36, height: 36, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.35)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Bell size={18} color="#FFF" />
          {unreadNotifications > 0 && (
            <div style={{
              position: 'absolute', top: 6, right: 6,
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: '#EF4444',
            }} />
          )}
        </button>
      </div>

      {/* Content card – overlaps hero by 64px */}
      <div style={{
        backgroundColor: '#FFF',
        borderRadius: '32px 32px 0 0',
        marginTop: -64,
        padding: '24px 16px 80px',
        minHeight: 400,
      }}>
        {/* Greeting */}
        <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          Chào {user?.fullName ?? 'Cư dân'}
        </p>
        <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 20px' }}>
          Chào mừng bạn quay trở lại!
        </p>

        {/* My Room Card */}
        <div style={{
          backgroundColor: '#FFF',
          borderRadius: 16,
          border: '1px solid #E5E7EB',
          padding: 14,
          marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: '#EFF6FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Home size={22} color="#2563EB" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
              Phòng {roomNumber}
            </p>
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              {user?.fullName ?? '—'}
            </p>
          </div>
          <ChevronRight size={18} color="#9CA3AF" />
        </div>

        {/* Warning banner – overdue */}
        {isOverdue && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <AlertCircle size={18} color="#EF4444" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', margin: 0 }}>Hóa đơn quá hạn!</p>
              <p style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>Vui lòng thanh toán ngay để tránh phạt.</p>
            </div>
          </div>
        )}

        {/* Warning banner – due soon */}
        {isDueSoon && (
          <div style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Clock size={18} color="#D97706" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#D97706', margin: 0 }}>Sắp đến hạn</p>
              <p style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>Còn {daysUntilDue} ngày đến hạn thanh toán.</p>
            </div>
          </div>
        )}

        {/* Bill Card */}
        <div style={{
          backgroundColor: '#FFF',
          borderRadius: 16,
          border: '1px solid #E5E7EB',
          padding: 16,
          marginBottom: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: '#6B7280',
            letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 10px',
          }}>
            HÓA ĐƠN HIỆN TẠI
          </p>

          {loading ? (
            <p style={{ fontSize: 14, color: '#6B7280' }}>Đang tải...</p>
          ) : pendingInvoice ? (
            <>
              <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 8px' }}>
                Tháng {pendingInvoice.month}/{pendingInvoice.year}
              </p>
              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>
                    {pendingInvoice.totalAmount.toLocaleString('vi-VN')}đ
                  </p>
                  {pendingInvoice.dueDate && (
                    <p style={{ fontSize: 11, color: '#6B7280' }}>
                      HH: {new Date(pendingInvoice.dueDate).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => navigate('/resident/bill-detail')}
                style={{
                  width: '100%', padding: '10px 0',
                  backgroundColor: '#2563EB', color: '#FFF',
                  border: 'none', borderRadius: 10, cursor: 'pointer',
                  fontSize: 14, fontWeight: 600,
                }}
              >
                Thanh toán ngay &gt;
              </button>
              <button
                onClick={() => navigate('/resident/payment-history')}
                style={{
                  width: '100%', padding: '8px 0',
                  background: 'none', border: 'none',
                  fontSize: 12, color: '#6B7280', cursor: 'pointer',
                  marginTop: 6,
                }}
              >
                Xem lịch sử hóa đơn →
              </button>
            </>
          ) : (
            <p style={{ fontSize: 14, color: '#6B7280' }}>
              {invoices.length > 0 ? 'Không có hóa đơn chờ thanh toán ✓' : 'Chưa có hóa đơn nào'}
            </p>
          )}
        </div>

        {/* TIỆN ÍCH */}
        <p style={{
          fontSize: 12, fontWeight: 700, color: '#6B7280',
          letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 12px',
        }}>
          TIỆN ÍCH
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {utilities.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                backgroundColor: '#FFF',
                border: '1px solid #E5E7EB',
                borderRadius: 16,
                padding: '16px 12px',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 8,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: '#EFF6FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={22} color="#2563EB" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', textAlign: 'center' }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Chat Button – sticky bottom-right */}
      <div style={{
        position: 'absolute',
        bottom: 72,
        right: 16,
        zIndex: 30,
      }}>
        <button
          onClick={() => navigate('/resident/chat')}
          style={{
            width: 52, height: 52, borderRadius: '50%',
            backgroundColor: '#1E3A8A',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(30,58,138,0.4)',
          }}
        >
          <MessageCircle size={24} color="#FFF" />
        </button>
      </div>
    </div>
  );
}

