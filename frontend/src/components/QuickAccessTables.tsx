import { Send, MessageSquare, AlertCircle, CheckCircle, X, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useSearch } from '../contexts/SearchContext';
import { HighlightText } from './HighlightText';

// Reduced to top 3-4 items only with checkbox selection
const overdueInvoices = [
  { id: 'INV-2026-112', room: 'C-312', tenant: 'Lê Văn C', amount: '6.500.000', daysLate: 22, lastReminder: '7 ngày trước' },
  { id: 'INV-2026-189', room: 'A-305', tenant: 'Hoàng Văn E', amount: '5.500.000', daysLate: 18, lastReminder: '6 ngày trước' },
  { id: 'INV-2026-045', room: 'A-101', tenant: 'Nguyễn Văn A', amount: '5.200.000', daysLate: 15, lastReminder: '5 ngày trước' },
];

const newIssues = [
  { id: 'REQ-2026-089', room: 'A-203', type: 'Điện', description: 'Mất điện toàn bộ phòng', time: '10:30 - 12/02/2026' },
  { id: 'REQ-2026-093', room: 'A-508', type: 'Điện', description: 'Cầu dao bị ngắt liên tục', time: '08:05 - 11/02/2026' },
  { id: 'REQ-2026-090', room: 'B-115', type: 'Nước', description: 'Không có nước nóng', time: '09:15 - 12/02/2026' },
];

const unansweredQuestions = [
  { id: 'Q-2026-234', room: 'B-308', question: 'Quy định về nuôi thú cưng lớn hơn 10kg như thế nào?', time: '11:20 - 12/02/2026', category: 'Nội quy' },
  { id: 'Q-2026-236', room: 'A-601', question: 'Phí gửi xe máy điện tính như xe máy thường hay có ưu đãi?', time: '09:30 - 11/02/2026', category: 'Phí dịch vụ' },
  { id: 'Q-2026-237', room: 'D-112', question: 'Có thể lắp thêm điều hòa thứ 2 không? Cần thủ tục gì?', time: '13:15 - 10/02/2026', category: 'Thủ tục' },
];

export function QuickAccessTables() {
  const [reminderModal, setReminderModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [answerModal, setAnswerModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  
  // Checkbox selection states
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  
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
  }, [searchTerm]);

  const filteredNewIssues = useMemo(() => {
    if (!searchTerm) return newIssues;
    return newIssues.filter(issue => 
      issue.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const filteredUnansweredQuestions = useMemo(() => {
    if (!searchTerm) return unansweredQuestions;
    return unansweredQuestions.filter(q => 
      q.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.question.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <>
      <div className="space-y-8">
        {/* Priority 1: Overdue Invoices - HIGHEST PRIORITY (Full Width, Red) */}
        <div className="bg-surface-card border-2 rounded-[16px] shadow-sm" style={{ borderColor: 'var(--error)' }}>
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
                    {overdueInvoices.length} hóa đơn (Còn 15 nữa) - Tổng nợ: 22.100.000 VNĐ
                  </p>
                </div>
              </div>
              <div className="flex items-center" style={{ gap: 'var(--space-between)' }}>
                {selectedInvoices.length > 0 && (
                  <button 
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
                      gap: '8px'
                    }}
                  >
                    Nhắc nợ {selectedInvoices.length} hóa đơn đã chọn
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
                  <span>Xem tất cả 18 hóa đơn</span>
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
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setReminderModal(true);
                        }}
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

        {/* Two Column Layout for Secondary Priorities */}
        <div className="grid grid-cols-2" style={{ gap: 'var(--space-layout)' }}>
          {/* Priority 2: New Issues - MEDIUM PRIORITY (Orange, Lighter) */}
          <div className="bg-surface-card rounded" style={{ border: '1px solid #FED7AA', borderRadius: 'var(--radius-card)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #FED7AA', backgroundColor: '#FFF7ED' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center" style={{ gap: '12px' }}>
                  <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: '#FDBA74' }}>
                    <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: 700 }}>Sự cố mới gửi</h2>
                    <p style={{ fontSize: 'var(--type-caption)', color: 'var(--warning)' }}>{newIssues.length} sự cố (Còn 8 nữa)</p>
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
                  <span>Xem tất cả 11</span>
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

          {/* Priority 3: Questions Need Approval - LOW PRIORITY (Gray/Blue accent) */}
          <div className="bg-surface-card rounded" style={{ border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-card)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--surface-border)', backgroundColor: 'var(--brand-surface)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center" style={{ gap: '12px' }}>
                  <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: '#BFDBFE' }}>
                    <MessageSquare size={20} style={{ color: 'var(--brand-primary)' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: 700 }}>Câu hỏi cần phê duyệt</h2>
                    <p style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>{unansweredQuestions.length} câu (Còn 8 nữa)</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <button 
                  onClick={() => navigate('/knowledge-base')}
                  className="rounded transition-colors flex items-center" 
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: 'var(--surface-card)',
                    border: '2px solid var(--brand-primary)',
                    color: 'var(--brand-primary)',
                    fontSize: 'var(--type-caption)',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-button)',
                    gap: '4px'
                  }}
                >
                  <span>Xem tất cả 11</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <table className="w-full" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <th style={{ textAlign: 'left', fontSize: 'var(--type-caption)', color: 'var(--text-primary)', paddingBottom: '12px', fontWeight: 700, width: '80px' }}>Phòng</th>
                    <th style={{ textAlign: 'left', fontSize: 'var(--type-caption)', color: 'var(--text-primary)', paddingBottom: '12px', fontWeight: 700, paddingLeft: '20px' }}>Câu hỏi</th>
                    <th style={{ textAlign: 'center', fontSize: 'var(--type-caption)', color: 'var(--text-primary)', paddingBottom: '12px', fontWeight: 700, width: '110px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnansweredQuestions.map((q, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ paddingTop: '16px', paddingBottom: '16px', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700, width: '80px' }}>
                        <HighlightText text={q.room} searchTerm={searchTerm} />
                      </td>
                      <td style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '20px', paddingRight: '12px', fontSize: 'var(--type-body)', color: 'var(--text-primary)' }}>
                        <HighlightText text={q.question} searchTerm={searchTerm} />
                      </td>
                      <td style={{ paddingTop: '16px', paddingBottom: '16px', textAlign: 'center', width: '110px' }}>
                        <button 
                          onClick={() => {
                            setSelectedQuestion(q);
                            setAnswerModal(true);
                          }}
                          className="rounded transition-colors"
                          style={{ 
                            padding: '8px 16px',
                            backgroundColor: 'var(--brand-primary)',
                            color: 'var(--text-on-color)',
                            fontSize: 'var(--type-caption)',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-button)'
                          }}
                        >
                          Phê duyệt
                        </button>
                      </td>
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
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
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
                  defaultValue={`Kính gửi ${selectedInvoice.tenant},\n\nChúng tôi nhận thấy hóa đơn phòng ${selectedInvoice.room} số tiền ${selectedInvoice.amount} VNĐ đã quá hạn ${selectedInvoice.daysLate} ngày.\n\nVui lòng thanh toán trong vòng 3 ngày làm việc.\n\nTrân trọng,\nBan quản lý`}
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
                  border: 'none'
                }}>
                  <Send size={20} />
                  <span>Gửi tin nhắn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Answer Question Modal */}
      {answerModal && selectedQuestion && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-surface-card" style={{ 
            borderRadius: 'var(--radius-large)', 
            width: '700px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div className="flex items-center justify-between" style={{ 
              borderBottom: '1px solid var(--surface-border)', 
              padding: 'var(--space-card)'
            }}>
              <div className="flex items-center" style={{ gap: '12px' }}>
                <MessageSquare size={24} style={{ color: 'var(--brand-primary)' }} />
                <h3 style={{ fontSize: 'var(--type-section-title)', color: 'var(--text-primary)', fontWeight: 600 }}>Phê duyệt câu trả lời & Lưu vào kho tri thức</h3>
              </div>
              <button onClick={() => setAnswerModal(false)} className="p-2 hover:bg-[var(--brand-surface)] rounded transition-colors">
                <X size={20} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            <div style={{ padding: 'var(--space-card)', display: 'flex', flexDirection: 'column', gap: 'var(--space-between)' }}>
              <div className="bg-blue-50 border border-blue-300 rounded p-4">
                <p style={{ fontSize: 'var(--type-caption)', color: '#1e40af', marginBottom: '4px' }}>Câu hỏi từ phòng {selectedQuestion.room}</p>
                <p style={{ fontSize: 'var(--type-body)', color: '#1e3a8a', fontWeight: 600 }}>{selectedQuestion.question}</p>
              </div>

              <div>
                <label className="block" style={{ fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>Danh mục *</label>
                <select 
                  className="w-full focus:outline-none" 
                  style={{
                    padding: '14px 16px',
                    fontSize: 'var(--type-body)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-button)',
                    backgroundColor: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                    height: 'var(--input-height)'
                  }}
                  defaultValue={selectedQuestion.category}
                >
                  <option>Nội quy</option>
                  <option>Dịch vụ</option>
                  <option>Phí dịch vụ</option>
                  <option>Thủ tục</option>
                  <option>Tiện ích</option>
                  <option>Khác</option>
                </select>
              </div>

              <div>
                <label className="block" style={{ fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>Câu trả lời *</label>
                <textarea 
                  rows={6}
                  placeholder="Nhập câu trả lời chi tiết. Câu trả lời này sẽ được lưu vào kho tri thức để AI chatbot tự động trả lời cho các câu hỏi tương tự trong tương lai..."
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
                />
              </div>

              <div className="bg-green-50 border border-green-300 rounded p-3">
                <div className="flex items-start space-x-2">
                  <input type="checkbox" id="autoReply" className="w-4 h-4 mt-0.5" defaultChecked />
                  <label htmlFor="autoReply" style={{ fontSize: 'var(--type-caption)', color: '#15803d' }}>
                    Tự động gửi câu trả lời này cho cư dân qua chatbot và train AI để tự trả lời các câu tương tự
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end" style={{ gap: 'var(--space-between)', paddingTop: 'var(--space-between)', borderTop: '1px solid var(--surface-border)' }}>
                <button 
                  onClick={() => setAnswerModal(false)}
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
                  backgroundColor: 'var(--brand-primary)',
                  color: 'var(--text-on-color)',
                  fontSize: 'var(--type-body)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-button)',
                  height: 'var(--button-height)',
                  gap: '8px',
                  border: 'none'
                }}>
                  <CheckCircle size={20} />
                  <span>Phê duyệt & Lưu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}