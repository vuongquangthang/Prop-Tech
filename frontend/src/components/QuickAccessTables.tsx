import { Send, AlertCircle, X, ChevronRight } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSignalRRefresh } from '../lib/useSignalRRefresh';
import { useNavigate } from 'react-router';
import { useSearch } from '../contexts/SearchContext';
import { HighlightText } from './HighlightText';
import { invoiceService, Invoice } from '../services/api.service';
import { maintenanceService, MaintenanceRequest } from '../services/feature.service';

interface OverdueInvoice {
  id: string;
  invoiceId: number;
  room: string;
  tenant: string;
  amount: string;
  daysLate: number;
}

interface NewIssue {
  id: string;
  room: string;
  type: string;
  description: string;
  time: string;
}



const mapInvoice = (inv: Invoice): OverdueInvoice => {
  const due = inv.dueDate ? new Date(inv.dueDate) : null;
  const daysLate = due ? Math.max(0, Math.floor((Date.now() - due.getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const debt = inv.remainingAmount ?? (inv.totalAmount - (inv.paidAmount ?? 0));
  return {
    id: `HD-${inv.id}`,
    invoiceId: inv.id,
    room: inv.roomNumber ?? (inv.roomId ? `P-${inv.roomId}` : '—'),
    tenant: inv.residentName ?? '—',
    amount: new Intl.NumberFormat('vi-VN').format(debt > 0 ? debt : inv.totalAmount),
    daysLate,
  };
};

const mapMaintenance = (req: MaintenanceRequest): NewIssue => {
  const date = new Date(req.createdAt);
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} - ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  return {
    id: `REQ-${req.id}`,
    room: req.roomNumber ?? `P-${req.roomId}`,
    type: req.issueType,
    description: req.description || req.issueType,
    time,
  };
};

export function QuickAccessTables() {
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
  const [newIssues, setNewIssues] = useState<NewIssue[]>([]);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [totalIssues, setTotalIssues] = useState(0);
  const [reminderModal, setReminderModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [reminderMessage, setReminderMessage] = useState('');
  const [sendingReminder, setSendingReminder] = useState(false);
  const [sendingBatchReminder, setSendingBatchReminder] = useState(false);

  const loadData = useCallback(() => {
    invoiceService.getUnpaid()
      .then(data => {
        setTotalUnpaid(data.length);
        setOverdueInvoices(data.slice(0, 3).map(mapInvoice));
      })
      .catch(() => {});

    maintenanceService.getAll()
      .then(data => {
        const newOnes = data
          .filter((r: MaintenanceRequest) =>
            r.status === 'Pending' || r.status === 'Chờ xử lý' || r.status === 'pending' || r.status === 'new' || r.status === 'Mới' || r.status === 'Yêu cầu sửa lại',
          )
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTotalIssues(newOnes.length);
        setNewIssues(newOnes.map(mapMaintenance));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useSignalRRefresh(['NewMaintenanceRequest', 'MaintenanceRequestUpdated', 'PaymentSuccess', 'PaymentFailed'], loadData);

  const toggleInvoiceSelection = (id: string) => {
    setSelectedInvoices(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const toggleAllInvoices = () => {
    setSelectedInvoices(prev => 
      prev.length === overdueInvoices.length ? [] : overdueInvoices.map(i => i.id)
    );
  };

  const navigate = useNavigate();
  const { searchTerm } = useSearch();

  const filteredOverdueInvoices = useMemo(() => {
    if (!searchTerm) return overdueInvoices;
    return overdueInvoices.filter(invoice => 
      invoice.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.tenant.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, overdueInvoices]);

  const filteredNewIssues = useMemo(() => {
    if (!searchTerm) return newIssues;
    return newIssues.filter(issue => 
      issue.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, newIssues]);

  const getDefaultReminderMessage = (invoice: OverdueInvoice) =>
    `Kính gửi ${invoice.tenant},\n\nChúng tôi ghi nhận hóa đơn phòng ${invoice.room} còn nợ ${invoice.amount} VNĐ và đã quá hạn ${invoice.daysLate} ngày.\n\nVui lòng thanh toán trong thời gian sớm nhất để tránh ảnh hưởng các dịch vụ liên quan.\n\nTrân trọng,\nBan quản lý`;

  const openReminderModal = (invoice: OverdueInvoice) => {
    setSelectedInvoice(invoice);
    setReminderMessage(getDefaultReminderMessage(invoice));
    setReminderModal(true);
  };

  const handleSendReminder = async () => {
    if (!selectedInvoice?.invoiceId) return;
    try {
      setSendingReminder(true);
      const result = await invoiceService.sendReminder(selectedInvoice.invoiceId, reminderMessage);
      alert(`Đã gửi nhắc nợ thành công cho ${result.sentCount} cư dân.`);
      setSelectedInvoices(prev => prev.filter(id => id !== selectedInvoice.id));
      setReminderModal(false);
      setSelectedInvoice(null);
      loadData();
    } catch (error: any) {
      alert(error?.message || 'Gửi nhắc nợ thất bại');
    } finally {
      setSendingReminder(false);
    }
  };

  const handleSendBatchReminders = async () => {
    if (selectedInvoices.length === 0) return;

    const selected = overdueInvoices.filter(i => selectedInvoices.includes(i.id));
    if (selected.length === 0) return;

    try {
      setSendingBatchReminder(true);
      const results = await Promise.allSettled(selected.map(i => invoiceService.sendReminder(i.invoiceId)));
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      alert(`Đã gửi nhắc nợ cho ${successCount}/${results.length} hóa đơn.${failCount > 0 ? ` ${failCount} hóa đơn gửi lỗi.` : ''}`);

      if (successCount > 0) {
        setSelectedInvoices([]);
        loadData();
      }
    } finally {
      setSendingBatchReminder(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* Priority 1: Overdue Invoices - HIGHEST PRIORITY (Full Width, Red) */}
        <div className="bg-surface-card border-2 rounded-[16px] shadow-sm" style={{ borderColor: 'var(--error)', overflow: 'hidden' }}>
          <div className="border-b-2 px-6 py-5" style={{ borderColor: 'var(--error)', backgroundColor: '#FEF2F2' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ gap: 'var(--space-between)' }}>
                <div className="w-12 h-12 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--error)' }}>
                  <AlertCircle size={24} style={{ color: 'var(--text-on-color)' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 'var(--type-section-title)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Hóa đơn quá hạn chưa thu
                  </h2>
                  <p style={{ fontSize: 'var(--type-caption)', color: 'var(--error)', fontWeight: 600 }}>
                    {overdueInvoices.length} hóa đơn{totalUnpaid > overdueInvoices.length ? ` (Còn ${totalUnpaid - overdueInvoices.length} nữa)` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center" style={{ gap: 'var(--space-between)' }}>
                {selectedInvoices.length > 0 && (
                  <button 
                    onClick={handleSendBatchReminders}
                    disabled={sendingBatchReminder}
                    className="rounded shadow transition-colors"
                    style={{ 
                      padding: '16px 20px',
                      backgroundColor: 'var(--error)',
                      color: 'var(--text-on-color)',
                      fontSize: 'var(--type-body)',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-button)',
                      height: 'var(--button-height)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: sendingBatchReminder ? 0.7 : 1
                    }}
                  >
                    {sendingBatchReminder ? 'Đang gửi...' : `Nhắc nợ ${selectedInvoices.length} hóa đơn đã chọn`}
                  </button>
                )}
                <button 
                  onClick={() => navigate('/debt-management')}
                  className="rounded transition-colors"
                  style={{ 
                    padding: '16px 20px',
                    backgroundColor: 'var(--surface-card)',
                    border: '2px solid var(--error)',
                    color: 'var(--error)',
                    fontSize: 'var(--type-body)',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-button)',
                    height: 'var(--button-height)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>Xem tất cả {totalUnpaid} hóa đơn</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
          <div style={{ padding: 'var(--space-card)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
                  <th style={{ textAlign: 'left', paddingBottom: '16px', width: '48px' }}>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5"
                      checked={selectedInvoices.length === overdueInvoices.length}
                      onChange={toggleAllInvoices}
                    />
                  </th>
                  <th style={{ textAlign: 'left', fontSize: 'var(--type-body-bold)', color: 'var(--text-primary)', paddingBottom: '16px', fontWeight: 700 }}>Phòng</th>
                  <th style={{ textAlign: 'left', fontSize: 'var(--type-body-bold)', color: 'var(--text-primary)', paddingBottom: '16px', fontWeight: 700 }}>Chủ hộ</th>
                  <th style={{ textAlign: 'right', fontSize: 'var(--type-body-bold)', color: 'var(--text-primary)', paddingBottom: '16px', fontWeight: 700 }}>Số tiền nợ</th>
                  <th style={{ textAlign: 'center', fontSize: 'var(--type-body-bold)', color: 'var(--text-primary)', paddingBottom: '16px', fontWeight: 700 }}>Số ngày trễ</th>
                  <th style={{ textAlign: 'center', fontSize: 'var(--type-body-bold)', color: 'var(--text-primary)', paddingBottom: '16px', fontWeight: 700 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredOverdueInvoices.map((invoice, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <td style={{ paddingTop: '20px', paddingBottom: '20px' }}>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => toggleInvoiceSelection(invoice.id)}
                      />
                    </td>
                    <td style={{ paddingTop: '20px', paddingBottom: '20px', fontSize: 'var(--type-body-bold)', color: 'var(--text-primary)', fontWeight: 700 }}>
                      <HighlightText text={invoice.room} searchTerm={searchTerm} />
                    </td>
                    <td style={{ paddingTop: '20px', paddingBottom: '20px', fontSize: 'var(--type-body)', color: 'var(--text-primary)' }}>
                      <HighlightText text={invoice.tenant} searchTerm={searchTerm} />
                    </td>
                    <td style={{ paddingTop: '20px', paddingBottom: '20px', fontSize: 'var(--type-body-bold)', color: 'var(--error)', textAlign: 'right', fontWeight: 700 }}>{invoice.amount} đ</td>
                    <td style={{ paddingTop: '20px', paddingBottom: '20px', textAlign: 'center' }}>
                      <span className="rounded" style={{
                        fontSize: 'var(--type-body)',
                        padding: '8px 16px',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-button)',
                        backgroundColor: parseInt(invoice.daysLate as any) > 15 ? '#FEE2E2' : '#FEF3C7',
                        color: parseInt(invoice.daysLate as any) > 15 ? 'var(--error)' : 'var(--warning)'
                      }}>
                        {invoice.daysLate} ngày
                      </span>
                    </td>
                    <td style={{ paddingTop: '20px', paddingBottom: '20px', textAlign: 'center' }}>
                      <button 
                        onClick={() => openReminderModal(invoice)}
                        className="rounded transition-colors"
                        style={{ 
                          padding: '12px 20px',
                          backgroundColor: 'var(--error)',
                          color: 'var(--text-on-color)',
                          fontSize: 'var(--type-body)',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-button)'
                        }}
                      >
                        Nhắc nợ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Secondary Priority Layout */}
        <div className="grid grid-cols-1" style={{ gap: 'var(--space-layout)' }}>
          {/* Priority 2: New Issues - MEDIUM PRIORITY (Orange, Lighter) */}
          <div className="bg-surface-card rounded" style={{ border: '1px solid #FED7AA', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #FED7AA', backgroundColor: '#FFF7ED' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center" style={{ gap: '12px' }}>
                  <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: '#FDBA74' }}>
                    <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 'var(--type-section-title)', color: 'var(--text-primary)', fontWeight: 600 }}>Sự cố chờ xử lý</h2>
                    <p style={{ fontSize: 'var(--type-caption)', color: 'var(--warning)' }}>{newIssues.length} sự cố{totalIssues > newIssues.length ? ` (Còn ${totalIssues - newIssues.length} nữa)` : ''}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <button 
                  onClick={() => navigate('/maintenance-request')}
                  className="rounded transition-colors flex items-center" 
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: 'var(--surface-card)',
                    border: '2px solid var(--warning)',
                    color: 'var(--warning)',
                    fontSize: 'var(--type-caption)',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-button)',
                    gap: '4px'
                  }}
                >
                  <span>Xem tất cả {totalIssues}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <th style={{ textAlign: 'left', fontSize: 'var(--type-caption)', color: 'var(--text-primary)', paddingBottom: '12px', fontWeight: 700, width: '80px' }}>Phòng</th>
                    <th style={{ textAlign: 'left', fontSize: 'var(--type-caption)', color: 'var(--text-primary)', paddingBottom: '12px', fontWeight: 700, paddingLeft: '16px' }}>Vấn đề</th>
                    <th style={{ textAlign: 'center', fontSize: 'var(--type-caption)', color: 'var(--text-primary)', paddingBottom: '12px', fontWeight: 700, width: '140px' }}>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNewIssues.map((issue, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ paddingTop: '16px', paddingBottom: '16px', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700, width: '80px' }}>
                        <HighlightText text={issue.room} searchTerm={searchTerm} />
                      </td>
                      <td style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '16px', fontSize: 'var(--type-body)', color: 'var(--text-primary)' }}>
                        <HighlightText text={issue.description} searchTerm={searchTerm} />
                      </td>
                      <td style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '12px', textAlign: 'center', fontSize: 'var(--type-caption)', color: 'var(--text-secondary)', width: '140px' }}>{issue.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      {/* Reminder Modal */}
      {reminderModal && selectedInvoice && (
        <div className="admin-content-modal-overlay" style={{ backgroundColor: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-surface-card" style={{ 
            borderRadius: 'var(--radius-large)', 
            width: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div className="flex items-center justify-between" style={{ 
              borderBottom: '1px solid var(--surface-border)', 
              padding: 'var(--space-card)'
            }}>
              <div className="flex items-center" style={{ gap: '12px' }}>
                <Send size={24} style={{ color: 'var(--error)' }} />
                <h3 style={{ fontSize: 'var(--type-section-title)', color: 'var(--text-primary)', fontWeight: 600 }}>Gửi nhắc nợ</h3>
              </div>
              <button onClick={() => setReminderModal(false)} className="p-2 hover:bg-[var(--brand-surface)] rounded transition-colors">
                <X size={20} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            <div style={{ padding: 'var(--space-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-between)' }}>
              <div className="rounded" style={{ 
                backgroundColor: 'var(--surface-bg)', 
                border: '1px solid var(--surface-border)', 
                borderRadius: 'var(--radius-button)',
                padding: 'var(--space-between)' 
              }}>
                <div className="grid grid-cols-2" style={{ gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>Phòng</p>
                    <p style={{ fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 600, marginTop: '4px' }}>{selectedInvoice.room}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>Chủ hộ</p>
                    <p style={{ fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 600, marginTop: '4px' }}>{selectedInvoice.tenant}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>Số tiền nợ</p>
                    <p style={{ fontSize: 'var(--type-body)', color: 'var(--error)', fontWeight: 700, marginTop: '4px' }}>{selectedInvoice.amount} VNĐ</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>Số ngày trễ</p>
                    <p style={{ fontSize: 'var(--type-body)', color: 'var(--error)', fontWeight: 700, marginTop: '4px' }}>{selectedInvoice.daysLate} ngày</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block" style={{ fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>Nội dung tin nhắn</label>
                <textarea 
                  rows={5}
                  className="w-full focus:outline-none"
                  style={{
                    padding: '12px 16px',
                    fontSize: 'var(--type-body)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-button)',
                    backgroundColor: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                    lineHeight: 1.5
                  }}
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end" style={{ gap: 'var(--space-between)', paddingTop: 'var(--space-between)', borderTop: '1px solid var(--surface-border)' }}>
                <button 
                  onClick={() => setReminderModal(false)}
                  className="rounded transition-colors"
                  style={{
                    padding: '16px 24px',
                    backgroundColor: 'var(--surface-card)',
                    border: '2px solid var(--surface-border)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--type-body)',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-button)',
                    height: 'var(--button-height)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  Hủy
                </button>
                <button className="rounded transition-colors flex items-center" style={{
                  padding: '16px 24px',
                  backgroundColor: 'var(--error)',
                  color: 'var(--text-on-color)',
                  fontSize: 'var(--type-body)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-button)',
                  height: 'var(--button-height)',
                  gap: '8px',
                  border: 'none',
                  opacity: sendingReminder ? 0.7 : 1
                }}
                onClick={handleSendReminder}
                disabled={sendingReminder}
                >
                  <Send size={20} />
                  <span>{sendingReminder ? 'Đang gửi...' : 'Gửi tin nhắn'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}