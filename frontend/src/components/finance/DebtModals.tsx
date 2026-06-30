import { X, Eye, Send, Ban, User, Home, DollarSign, Calendar, AlertTriangle, Check, FileText, Users, Clock, Bell, Lock, Unlock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../lib/api-config';
import { formatDisplayDate, formatDisplayDateTime } from '../../lib/date-utils';
import { InvoiceDetailModal as InvoiceRealtimeDetailModal } from './InvoiceDetailModal';

interface DebtModalProps {
  debt?: any;
  onClose: () => void;
}

export function ViewDebtModal({ debt, onClose }: DebtModalProps) {
  const [invoice, setInvoice] = useState<any>(null);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showSendReminderModal, setShowSendReminderModal] = useState(false);
  const [showBlockAccountModal, setShowBlockAccountModal] = useState(false);

  useEffect(() => {
    let disposed = false;

    const fetchDetail = async () => {
      if (!debt?.invoiceId) {
        setError('Không tìm thấy hóa đơn cho công nợ này.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [invoiceRes, remindersRes] = await Promise.allSettled([
          api.get(API_ENDPOINTS.INVOICES.BY_ID(debt.invoiceId)),
          api.get(API_ENDPOINTS.DEBT_REMINDERS.BY_INVOICE(debt.invoiceId)),
        ]);

        if (disposed) return;

        if (invoiceRes.status === 'fulfilled') {
          setInvoice(invoiceRes.value.data);
        } else {
          setError('Không thể tải chi tiết hóa đơn từ hệ thống.');
        }

        if (remindersRes.status === 'fulfilled') {
          const sorted = [...(remindersRes.value.data || [])].sort(
            (a: any, b: any) => new Date(b.reminderTime).getTime() - new Date(a.reminderTime).getTime()
          );
          setReminders(sorted);
        } else {
          setReminders([]);
        }
      } catch {
        if (!disposed) {
          setError('Không thể tải dữ liệu chi tiết công nợ.');
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    fetchDetail();
    return () => {
      disposed = true;
    };
  }, [debt?.invoiceId]);

  const period = invoice?.month && invoice?.year
    ? `${String(invoice.month).padStart(2, '0')}/${invoice.year}`
    : '—';

  const dueDateText = invoice?.dueDate
    ? formatDisplayDate(invoice.dueDate)
    : '—';

  const statusText = invoice?.status || 'Chưa xác định';
  const totalAmount = Number(invoice?.totalAmount ?? debt?.amount ?? 0);
  const paidAmount = Number(invoice?.paidAmount ?? 0);
  const remainingAmount = Number(invoice?.remainingAmount ?? (totalAmount - paidAmount));

  const formatCurrency = (value: number) =>
    value.toLocaleString('vi-VN') + ' VNĐ';

  return (
    <>
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[920px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Eye size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Chi tiết công nợ - Phòng {debt?.room}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          {loading && (
            <div className="bg-gray-50 border border-gray-300 rounded p-8 text-center text-gray-600">
              Đang tải dữ liệu từ hệ thống...
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-300 rounded p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {debt?.daysLate >= 30 && (
                <div className="bg-red-50 border border-red-300 rounded p-4 text-sm text-red-800">
                  <strong>⚠️ Cảnh báo:</strong> Công nợ đã quá hạn {debt.daysLate} ngày. Nên xử lý ưu tiên.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-300 rounded p-4">
                  <h4 className="text-sm text-gray-700 font-bold mb-3">Thông tin công nợ</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Phòng:</span><span className="text-gray-800 font-bold">{debt?.room || invoice?.roomNumber || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Chủ hộ:</span><span className="text-gray-800">{debt?.tenant || invoice?.residentName || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Kỳ thanh toán:</span><span className="text-gray-800">{period}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Hạn thanh toán:</span><span className="text-gray-800">{dueDateText}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Trạng thái:</span><span className="text-gray-800">{statusText}</span></div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-300 rounded p-4">
                  <h4 className="text-sm text-red-800 font-bold mb-3">Tổng hợp số tiền</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-red-700">Tổng hóa đơn:</span><span className="text-red-900 font-bold">{formatCurrency(totalAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-red-700">Đã thanh toán:</span><span className="text-red-900 font-bold">{formatCurrency(paidAmount)}</span></div>
                    <div className="flex justify-between border-t border-red-300 pt-2"><span className="text-red-800 font-bold">Còn nợ:</span><span className="text-red-900 font-bold text-lg">{formatCurrency(remainingAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-red-700">Số ngày trễ:</span><span className="text-red-900 font-bold">{debt?.daysLate || 0} ngày</span></div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm text-gray-700 font-bold">Lịch sử nhắc nợ</h4>
                  <span className="text-xs text-gray-600">{reminders.length} bản ghi</span>
                </div>

                {reminders.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có lịch sử nhắc nợ cho hóa đơn này.</p>
                ) : (
                  <div className="space-y-2">
                    {reminders.map((r) => (
                      <div key={r.id} className="bg-white border border-gray-300 rounded p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-800 font-semibold">Lần nhắc #{r.reminderCount} - {r.reminderMethod}</p>
                          <span className="text-xs text-gray-500">{formatDisplayDateTime(r.reminderTime)}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Trạng thái: <strong>{r.sendStatus}</strong>{r.sentToUserPhone ? ` • Gửi tới: ${r.sentToUserPhone}` : ''}</p>
                        {r.content && <p className="text-xs text-gray-700 mt-1">{r.content}</p>}
                        {r.errorMessage && <p className="text-xs text-red-700 mt-1">Lỗi: {r.errorMessage}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-300 rounded p-4">
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="px-4 py-2 bg-white border border-blue-300 text-blue-700 text-sm rounded hover:bg-blue-100"
                >
                  Xem chi tiết hóa đơn
                </button>
              </div>
            </>
          )}

        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-start sticky bottom-0 bg-white">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowSendReminderModal(true)}
              className="px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 flex items-center space-x-2"
            >
              <Send size={16} />
              <span>Gửi nhắc nợ</span>
            </button>
            {debt?.daysLate >= 30 && (
              <button 
                onClick={() => setShowBlockAccountModal(true)}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center space-x-2"
              >
                <Ban size={16} />
                <span>Khóa tài khoản</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Invoice Detail Modal */}
    {showInvoiceModal && debt?.invoiceId && (
      <InvoiceRealtimeDetailModal
        invoiceId={debt?.invoiceId}
        invoiceNumber={invoice?.invoiceNumber}
        onClose={() => setShowInvoiceModal(false)} 
        onApprove={() => {}}
        onReject={() => {}}
        isDraft={false}
      />
    )}

    {/* Send Reminder Modal */}
    {showSendReminderModal && (
      <SendReminderModal 
        debt={debt} 
        onClose={() => setShowSendReminderModal(false)} 
      />
    )}

    {/* Block Account Modal */}
    {showBlockAccountModal && (
      <BlockAccountModal 
        debt={debt} 
        onClose={() => setShowBlockAccountModal(false)} 
      />
    )}
    </>
  );
}

// Contract Detail Modal Component
function ContractDetailModal({ debt, onClose }: DebtModalProps) {
  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[700px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center space-x-2">
            <FileText size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Chi tiết hợp đồng - Phòng {debt?.room}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Contract Info */}
          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm text-blue-800 font-bold">Thông tin hợp đồng</h4>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-300">
                Đang hiệu lực
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-700">Mã hợp đồng:</span>
                <p className="text-blue-900 font-bold">HD-2025-067</p>
              </div>
              <div>
                <span className="text-blue-700">Loại hợp đồng:</span>
                <p className="text-blue-900 font-bold">Thuê dài hạn</p>
              </div>
              <div>
                <span className="text-blue-700">Ngày bắt đầu:</span>
                <p className="text-blue-900 font-bold">15/03/2025</p>
              </div>
              <div>
                <span className="text-blue-700">Ngày kết thúc:</span>
                <p className="text-blue-900 font-bold">14/03/2026</p>
              </div>
              <div>
                <span className="text-blue-700">Thời hạn:</span>
                <p className="text-blue-900 font-bold">12 tháng</p>
              </div>
              <div>
                <span className="text-blue-700">Trạng thái:</span>
                <p className="text-green-700 font-bold">Còn 7 tháng</p>
              </div>
            </div>
          </div>

          {/* Room Info */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-700 font-bold mb-3">Thông tin phòng</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Mã phòng:</span>
                <p className="text-gray-800 font-bold">{debt?.room}</p>
              </div>
              <div>
                <span className="text-gray-600">Diện tích:</span>
                <p className="text-gray-800 font-bold">85 m²</p>
              </div>
              <div>
                <span className="text-gray-600">Tòa nhà:</span>
                <p className="text-gray-800 font-bold">Tòa C</p>
              </div>
              <div>
                <span className="text-gray-600">Tầng:</span>
                <p className="text-gray-800 font-bold">Tầng 4</p>
              </div>
              <div>
                <span className="text-gray-600">Loại phòng:</span>
                <p className="text-gray-800 font-bold">2 phòng ngủ</p>
              </div>
              <div>
                <span className="text-gray-600">Nội thất:</span>
                <p className="text-gray-800 font-bold">Full nội thất</p>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-700 font-bold mb-3">Điều khoản thanh toán</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tiền thuê hàng tháng:</span>
                <span className="text-gray-800 font-bold">12.000.000 VNĐ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phí quản lý:</span>
                <span className="text-gray-800 font-bold">2.000.000 VNĐ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tiền đặt cọc:</span>
                <span className="text-gray-800 font-bold">36.000.000 VNĐ (3 tháng)</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-2">
                <span className="text-gray-700 font-bold">Hạn thanh toán:</span>
                <span className="text-gray-800 font-bold">Ngày 10 hàng tháng</span>
              </div>
            </div>
          </div>

          {/* Tenant Info */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-700 font-bold mb-3">Chủ hợp đồng</h4>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-2xl">
                {debt?.avatar}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800 font-bold">{debt?.tenant}</p>
                <p className="text-sm text-gray-600">CMND: 001234567890</p>
                <p className="text-sm text-gray-600">SĐT: {debt?.phone}</p>
                <p className="text-sm text-gray-600">Email: nguyenvana@email.com</p>
              </div>
            </div>
          </div>

          {/* Additional Terms */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-700 font-bold mb-2">Điều khoản khác</h4>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>• Không nuôi thú cưng</li>
              <li>• Không hút thuốc trong phòng</li>
              <li>• Tối đa 4 người ở</li>
              <li>• Thông báo trước 1 tháng khi dọn đi</li>
              <li>• Chịu trách nhiệm bồi thường nếu hư hỏng tài sản</li>
            </ul>
          </div>

          {/* Warning if debt exists */}
          {debt?.amount !== '0' && (
            <div className="bg-red-50 border border-red-300 rounded p-4">
              <p className="text-sm text-red-800">
                <strong>⚠️ Cảnh báo:</strong> Hợp đồng này đang có công nợ <strong>{debt?.amount} VNĐ</strong> 
                {' '}quá hạn <strong>{debt?.daysLate} ngày</strong>. Cần xử lý khẩn cấp!
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">
            In hợp đồng
          </button>
        </div>
      </div>
    </div>
  );
}

// Invoice Detail Modal Component
function InvoiceDetailModal({ debt, onClose }: DebtModalProps) {
  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center space-x-2">
            <FileText size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Chi tiết hóa đơn - Phòng {debt?.room}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Alert if overdue */}
          {debt?.daysLate > 0 && (
            <div className="bg-red-50 border border-red-300 rounded p-4">
              <p className="text-sm text-red-800 font-bold">
                🚨 Hóa đơn này đã quá hạn {debt?.daysLate} ngày!
              </p>
            </div>
          )}

          {/* Invoice Header */}
          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm text-blue-800 font-bold">Thông tin hóa đơn</h4>
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded border border-red-300">
                Chưa thanh toán
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-700">Mã hóa đơn:</span>
                <p className="text-blue-900 font-bold">INV-2026-0189</p>
              </div>
              <div>
                <span className="text-blue-700">Kỳ thanh toán:</span>
                <p className="text-blue-900 font-bold">Tháng 2/2026</p>
              </div>
              <div>
                <span className="text-blue-700">Ngày phát hành:</span>
                <p className="text-blue-900 font-bold">01/02/2026</p>
              </div>
              <div>
                <span className="text-blue-700">Hạn thanh toán:</span>
                <p className="text-red-700 font-bold">10/02/2026</p>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-700 font-bold mb-3">Chi tiết các khoản phí</h4>
            
            {/* Table */}
            <div className="bg-white border border-gray-300 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-700 font-bold">Khoản phí</th>
                    <th className="px-3 py-2 text-center text-gray-700 font-bold">Đơn giá</th>
                    <th className="px-3 py-2 text-center text-gray-700 font-bold">Số lượng</th>
                    <th className="px-3 py-2 text-right text-gray-700 font-bold">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-800">Tiền thuê phòng</td>
                    <td className="px-3 py-2 text-center text-gray-800">12.000.000</td>
                    <td className="px-3 py-2 text-center text-gray-800">1 tháng</td>
                    <td className="px-3 py-2 text-right text-gray-800 font-bold">12.000.000</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-800">Phí quản lý</td>
                    <td className="px-3 py-2 text-center text-gray-800">2.000.000</td>
                    <td className="px-3 py-2 text-center text-gray-800">1 tháng</td>
                    <td className="px-3 py-2 text-right text-gray-800 font-bold">2.000.000</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-800">Tiền điện</td>
                    <td className="px-3 py-2 text-center text-gray-800">3.500</td>
                    <td className="px-3 py-2 text-center text-gray-800">120 kWh</td>
                    <td className="px-3 py-2 text-right text-gray-800 font-bold">420.000</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-800">Tiền nước</td>
                    <td className="px-3 py-2 text-center text-gray-800">25.000</td>
                    <td className="px-3 py-2 text-center text-gray-800">8 m³</td>
                    <td className="px-3 py-2 text-right text-gray-800 font-bold">200.000</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-800">Phí gửi xe ô tô</td>
                    <td className="px-3 py-2 text-center text-gray-800">1.500.000</td>
                    <td className="px-3 py-2 text-center text-gray-800">1 xe</td>
                    <td className="px-3 py-2 text-right text-gray-800 font-bold">1.500.000</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-800">Phí gửi xe máy</td>
                    <td className="px-3 py-2 text-center text-gray-800">100.000</td>
                    <td className="px-3 py-2 text-center text-gray-800">2 xe</td>
                    <td className="px-3 py-2 text-right text-gray-800 font-bold">200.000</td>
                  </tr>
                  <tr className="bg-yellow-50 border-t-2 border-gray-400">
                    <td colSpan={3} className="px-3 py-3 text-gray-800 font-bold">TỔNG CỘNG</td>
                    <td className="px-3 py-3 text-right text-red-700 font-bold text-base">14.500.000 VNĐ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-purple-50 border border-purple-300 rounded p-4">
            <h4 className="text-sm text-purple-800 font-bold mb-2">Thông tin thanh toán</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-700">Ngân hàng:</span>
                <span className="text-purple-900 font-bold">Vietcombank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Số tài khoản:</span>
                <span className="text-purple-900 font-bold">1234567890</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Chủ tài khoản:</span>
                <span className="text-purple-900 font-bold">BAN QUẢN LÝ CHUNG CƯ ABC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Nội dung chuyển khoản:</span>
                <span className="text-purple-900 font-bold">{debt?.room} INV-2026-0189</span>
              </div>
            </div>
            {/* Removed 'Xem lịch sử hóa đơn' button as requested */}
          </div>

          {/* QR Code */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-700 font-bold mb-3 text-center">Quét mã QR để thanh toán</h4>
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-white border-2 border-gray-400 rounded flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-2">📱</div>
                  <p className="text-xs text-gray-600">VietQR Code</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 text-center mt-2">
              Quét mã để thanh toán qua ứng dụng ngân hàng
            </p>
          </div>

          {/* Reminder History */}
          {debt?.reminderLevel > 0 && (
            <div className="bg-orange-50 border border-orange-300 rounded p-4">
              <h4 className="text-sm text-orange-800 font-bold mb-2">Lịch sử nhắc nợ</h4>
              <ul className="text-sm text-orange-800 space-y-1 ml-4">
                <li>• <strong>Lần 1:</strong> 12/02/2026 - Gửi SMS + Email + Push App</li>
                {debt?.reminderLevel >= 2 && (
                  <li>• <strong>Lần 2:</strong> 17/02/2026 - Gửi SMS + Email + Push App + Gọi điện</li>
                )}
                {debt?.reminderLevel >= 3 && (
                  <li>• <strong>Lần 3:</strong> 20/02/2026 - Cảnh báo khóa tài khoản</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
            Gửi lại hóa đơn
          </button>
          <button className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">
            In hóa đơn
          </button>
        </div>
      </div>
    </div>
  );
}

// Transaction History Modal Component
function TransactionHistoryModal({ debt, onClose }: DebtModalProps) {
  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[900px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center space-x-2">
            <Clock size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Lịch sử giao dịch - Phòng {debt?.room}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-300 rounded p-4">
              <p className="text-xs text-green-700 mb-1">Đã thanh toán</p>
              <p className="text-lg text-green-800 font-bold">8/10 tháng</p>
            </div>
            <div className="bg-red-50 border border-red-300 rounded p-4">
              <p className="text-xs text-red-700 mb-1">Chưa thanh toán</p>
              <p className="text-lg text-red-800 font-bold">2 hóa đơn</p>
            </div>
            <div className="bg-blue-50 border border-blue-300 rounded p-4">
              <p className="text-xs text-blue-700 mb-1">Tổng đã trả</p>
              <p className="text-lg text-blue-800 font-bold">116.000.000 VNĐ</p>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="bg-white border border-gray-300 rounded overflow-hidden">
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
              <h4 className="text-sm text-gray-700 font-bold">Lịch sử 10 tháng gần đây</h4>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-300">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-700 font-bold">Tháng</th>
                    <th className="px-3 py-2 text-left text-gray-700 font-bold">Mã hóa đơn</th>
                    <th className="px-3 py-2 text-right text-gray-700 font-bold">Số tiền</th>
                    <th className="px-3 py-2 text-center text-gray-700 font-bold">Hạn TT</th>
                    <th className="px-3 py-2 text-center text-gray-700 font-bold">Ngày TT</th>
                    <th className="px-3 py-2 text-center text-gray-700 font-bold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Current month - Overdue */}
                  <tr className="border-b border-gray-200 bg-red-50">
                    <td className="px-3 py-2 text-gray-800 font-bold">02/2026</td>
                    <td className="px-3 py-2 text-gray-800">INV-2026-0189</td>
                    <td className="px-3 py-2 text-right text-red-700 font-bold">14.500.000</td>
                    <td className="px-3 py-2 text-center text-gray-800">10/02/2026</td>
                    <td className="px-3 py-2 text-center text-gray-500">-</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded border border-red-300">
                        Quá hạn {debt?.daysLate} ngày
                      </span>
                    </td>
                  </tr>
                  
                  {/* Last month - Overdue */}
                  {debt?.room === 'C-401' && (
                    <tr className="border-b border-gray-200 bg-red-50">
                      <td className="px-3 py-2 text-gray-800 font-bold">01/2026</td>
                      <td className="px-3 py-2 text-gray-800">INV-2026-0067</td>
                      <td className="px-3 py-2 text-right text-red-700 font-bold">10.500.000</td>
                      <td className="px-3 py-2 text-center text-gray-800">10/01/2026</td>
                      <td className="px-3 py-2 text-center text-gray-500">-</td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded border border-red-300">
                          Quá hạn 52 ngày
                        </span>
                      </td>
                    </tr>
                  )}
                  
                  {/* Paid months */}
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-800">12/2025</td>
                    <td className="px-3 py-2 text-gray-800">INV-2025-0889</td>
                    <td className="px-3 py-2 text-right text-gray-800">14.500.000</td>
                    <td className="px-3 py-2 text-center text-gray-800">10/12/2025</td>
                    <td className="px-3 py-2 text-center text-green-700 font-bold">08/12/2025</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-300">
                        Đã thanh toán
                      </span>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-800">11/2025</td>
                    <td className="px-3 py-2 text-gray-800">INV-2025-0756</td>
                    <td className="px-3 py-2 text-right text-gray-800">14.500.000</td>
                    <td className="px-3 py-2 text-center text-gray-800">10/11/2025</td>
                    <td className="px-3 py-2 text-center text-green-700 font-bold">09/11/2025</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-300">
                        Đã thanh toán
                      </span>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-800">10/2025</td>
                    <td className="px-3 py-2 text-gray-800">INV-2025-0623</td>
                    <td className="px-3 py-2 text-right text-gray-800">14.500.000</td>
                    <td className="px-3 py-2 text-center text-gray-800">10/10/2025</td>
                    <td className="px-3 py-2 text-center text-green-700 font-bold">07/10/2025</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-300">
                        Đã thanh toán
                      </span>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-800">09/2025</td>
                    <td className="px-3 py-2 text-gray-800">INV-2025-0501</td>
                    <td className="px-3 py-2 text-right text-gray-800">14.500.000</td>
                    <td className="px-3 py-2 text-center text-gray-800">10/09/2025</td>
                    <td className="px-3 py-2 text-center text-green-700 font-bold">10/09/2025</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-300">
                        Đã thanh toán
                      </span>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-800">08/2025</td>
                    <td className="px-3 py-2 text-gray-800">INV-2025-0389</td>
                    <td className="px-3 py-2 text-right text-gray-800">14.500.000</td>
                    <td className="px-3 py-2 text-center text-gray-800">10/08/2025</td>
                    <td className="px-3 py-2 text-center text-green-700 font-bold">08/08/2025</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-300">
                        Đã thanh toán
                      </span>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-800">07/2025</td>
                    <td className="px-3 py-2 text-gray-800">INV-2025-0267</td>
                    <td className="px-3 py-2 text-right text-gray-800">14.500.000</td>
                    <td className="px-3 py-2 text-center text-gray-800">10/07/2025</td>
                    <td className="px-3 py-2 text-center text-green-700 font-bold">09/07/2025</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-300">
                        Đã thanh toán
                      </span>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-800">06/2025</td>
                    <td className="px-3 py-2 text-gray-800">INV-2025-0156</td>
                    <td className="px-3 py-2 text-right text-gray-800">14.500.000</td>
                    <td className="px-3 py-2 text-center text-gray-800">10/06/2025</td>
                    <td className="px-3 py-2 text-center text-green-700 font-bold">10/06/2025</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-300">
                        Đã thanh toán
                      </span>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-800">05/2025</td>
                    <td className="px-3 py-2 text-gray-800">INV-2025-0089</td>
                    <td className="px-3 py-2 text-right text-gray-800">14.500.000</td>
                    <td className="px-3 py-2 text-center text-gray-800">10/05/2025</td>
                    <td className="px-3 py-2 text-center text-green-700 font-bold">07/05/2025</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-300">
                        Đã thanh toán
                      </span>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-800">04/2025</td>
                    <td className="px-3 py-2 text-gray-800">INV-2025-0023</td>
                    <td className="px-3 py-2 text-right text-gray-800">14.500.000</td>
                    <td className="px-3 py-2 text-center text-gray-800">10/04/2025</td>
                    <td className="px-3 py-2 text-center text-green-700 font-bold">09/04/2025</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-300">
                        Đã thanh toán
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Method Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-gray-300 rounded p-4">
              <h4 className="text-sm text-gray-700 font-bold mb-2">Phương thức thanh toán</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Chuyển khoản:</span>
                  <span className="text-gray-800 font-bold">7 lần</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VietQR:</span>
                  <span className="text-gray-800 font-bold">1 lần</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiền mặt:</span>
                  <span className="text-gray-800 font-bold">0 lần</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-300 rounded p-4">
              <h4 className="text-sm text-gray-700 font-bold mb-2">Thống kê thanh toán</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Trước hạn:</span>
                  <span className="text-green-700 font-bold">5 lần</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Đúng hạn:</span>
                  <span className="text-blue-700 font-bold">3 lần</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trễ hạn:</span>
                  <span className="text-red-700 font-bold">2 lần</span>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="bg-blue-50 border border-blue-300 rounded p-3">
            <p className="text-xs text-blue-800">
              💡 <strong>Nhận xét:</strong> Cư dân này có lịch sử thanh toán khá tốt (8/10 tháng đã thanh toán). 
              Tình trạng nợ hiện tại có thể do khó khăn tạm thời. Nên liên hệ để hỗ trợ.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">
            Xuất Excel
          </button>
        </div>
      </div>
    </div>
  );
}

export function SendReminderModal({ debt, onClose }: DebtModalProps) {
  const [invoice, setInvoice] = useState<any>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSentCount, setLastSentCount] = useState(0);

  const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} VNĐ`;

  const buildTemplates = () => {
    const tenantName = debt?.tenant || invoice?.residentName || 'Quý cư dân';
    const period = invoice?.month && invoice?.year
      ? `${String(invoice.month).padStart(2, '0')}/${invoice.year}`
      : 'gần nhất';
    const dueDateText = invoice?.dueDate
      ? formatDisplayDate(invoice.dueDate)
      : 'chưa xác định';
    const remainAmount = Number(invoice?.remainingAmount ?? debt?.amount ?? 0);
    const daysLate = Number(debt?.daysLate ?? 0);

    return {
      gentle: `Xin chào ${tenantName},

Hóa đơn kỳ ${period} của quý cư dân đã quá hạn ${daysLate} ngày.
Số tiền còn nợ: ${formatCurrency(remainAmount)}.
Hạn thanh toán: ${dueDateText}.

Vui lòng thanh toán sớm để tránh phát sinh thêm phí trễ hạn.

Trân trọng,\nBan quản lý`,
      strict: `⚠️ CẢNH BÁO THANH TOÁN CÔNG NỢ

Kính gửi ${tenantName},

Hóa đơn kỳ ${period} đã quá hạn ${daysLate} ngày.
Số tiền còn nợ: ${formatCurrency(remainAmount)}.

Nếu tiếp tục chậm thanh toán, Ban quản lý sẽ áp dụng biện pháp xử lý theo quy định hợp đồng.
Vui lòng liên hệ ngay để được hỗ trợ.

Trân trọng,\nBan quản lý`,
      custom: `Kính gửi ${tenantName},

[Nhập nội dung nhắc nợ tùy chỉnh tại đây]

Trân trọng,\nBan quản lý`,
    };
  };

  const defaultTemplateKey = debt?.daysLate >= 30 ? 'strict' : 'gentle';
  const [selectedTemplate, setSelectedTemplate] = useState<'gentle' | 'strict' | 'custom'>(defaultTemplateKey);
  const [messageContent, setMessageContent] = useState('');

  useEffect(() => {
    let disposed = false;

    const fetchData = async () => {
      if (!debt?.invoiceId) {
        setError('Không tìm thấy mã hóa đơn để gửi nhắc nợ.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const invoiceRes = await api.get(API_ENDPOINTS.INVOICES.BY_ID(debt.invoiceId));
        if (disposed) return;
        const invoiceData = invoiceRes.data;
        setInvoice(invoiceData);

        let mappedRecipients: any[] = [];
        if (invoiceData?.roomId) {
          const contractsRes = await api.get(API_ENDPOINTS.CONTRACTS.BY_ROOM(invoiceData.roomId));
          if (!disposed) {
            const contracts = contractsRes.data || [];
            const now = new Date();
            const activeContract = contracts.find((c: any) => !c.expectedEndDate || new Date(c.expectedEndDate) >= now)
              ?? contracts[contracts.length - 1];

            mappedRecipients = (activeContract?.residents || []).map((r: any) => ({
              residentId: r.residentId,
              fullName: r.fullName || `Cư dân ${r.residentId}`,
              phoneNumber: r.phoneNumber || '',
              email: r.email || '',
              residencyRole: r.residencyRole || 'Thành viên',
            }));
          }
        }

        if (!mappedRecipients.length) {
          mappedRecipients = [
            {
              residentId: -1,
              fullName: debt?.tenant || invoiceData?.residentName || 'Chủ hộ',
              phoneNumber: debt?.phone || '',
              email: '',
              residencyRole: 'Chủ hộ',
            },
          ];
        }

        if (!disposed) {
          setRecipients(mappedRecipients);
        }
      } catch (err: any) {
        if (!disposed) {
          setError(err?.message || 'Không thể tải dữ liệu gửi nhắc nợ.');
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      disposed = true;
    };
  }, [debt?.invoiceId]);

  useEffect(() => {
    const templates = buildTemplates();
    setMessageContent(templates[selectedTemplate]);
  }, [selectedTemplate, invoice]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value as 'gentle' | 'strict' | 'custom');
  };

  const handleSendReminder = async () => {
    if (!debt?.invoiceId || !messageContent.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await api.post(API_ENDPOINTS.INVOICES.SEND_REMINDER(debt.invoiceId), { content: messageContent.trim() });
      setLastSentCount(Number(res.data?.sentCount || recipients.length || 0));
      setShowSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Gửi nhắc nợ thất bại.');
    } finally {
      setSending(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="admin-content-modal-overlay">
        <div className="relative bg-white rounded-lg w-[500px]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded p-1 hover:bg-gray-100"
            aria-label="Đóng"
          >
            <X size={20} className="text-gray-600" />
          </button>
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl text-gray-800 font-bold mb-2">Gửi nhắc nợ thành công!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Đã gửi tin nhắc nợ đến <strong>{lastSentCount || recipients.length} người nhận</strong> của phòng <strong>{debt?.room}</strong>.
            </p>
            <div className="bg-green-50 border border-green-300 rounded p-3 mb-4">
              <p className="text-sm text-green-800">
                ✓ Gửi đến: {lastSentCount || recipients.length} người<br/>
                ✓ Kênh: App thông báo (theo cấu hình hệ thống)<br/>
                ✓ Thời gian: {formatDisplayDateTime(new Date())}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[700px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Send size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Gửi nhắc nợ - Phòng {debt?.room}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {loading && (
            <div className="bg-gray-50 border border-gray-300 rounded p-4 text-sm text-gray-600">
              Đang tải dữ liệu người nhận từ hệ thống...
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-300 rounded p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="bg-orange-50 border border-orange-300 rounded p-4">
            <p className="text-sm text-orange-800">
              Bạn đang gửi nhắc nợ <strong>lần {debt?.reminderLevel + 1}</strong> cho phòng <strong>{debt?.room}</strong>
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">Thông tin công nợ:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Chủ hộ:</span>
                <span className="text-gray-800 font-bold">{debt?.tenant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số tiền nợ:</span>
                <span className="text-red-700 font-bold">{formatCurrency(Number(invoice?.remainingAmount ?? debt?.amount ?? 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số ngày trễ:</span>
                <span className="text-red-700 font-bold">{debt?.daysLate} ngày</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đã nhắc:</span>
                <span className="text-orange-700 font-bold">{debt?.reminderLevel} lần</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">Danh sách người nhận:</h4>
            {recipients.length === 0 ? (
              <p className="text-sm text-gray-500">Không có dữ liệu người nhận.</p>
            ) : (
              <div className="space-y-2">
                {recipients.map((recipient, index) => {
                  const channelText = recipient.email && recipient.phoneNumber ? 'App + Email + SMS' : recipient.phoneNumber ? 'App + SMS' : 'App';
                  return (
                    <div key={recipient.residentId || index} className="flex items-center justify-between p-2 bg-white border border-gray-300 rounded">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-sm">👤</div>
                        <div>
                          <p className="text-sm text-gray-800 font-bold">{recipient.fullName}</p>
                          <p className="text-xs text-gray-600">{recipient.residencyRole || 'Thành viên'}{recipient.phoneNumber ? ` • ${recipient.phoneNumber}` : ''}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600">{channelText}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">Nội dung nhắc nợ:</h4>
            <select 
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500 mb-3"
              value={selectedTemplate}
              onChange={handleTemplateChange}
            >
              <option value="gentle">Mẫu nhắc nhẹ (Lần 1-2)</option>
              <option value="strict">Mẫu cảnh báo nghiêm khắc (Lần 3+)</option>
              <option value="custom">Mẫu tùy chỉnh...</option>
            </select>
            <textarea 
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500 h-32"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
            />
          </div>
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={handleSendReminder}
            disabled={sending || loading || !debt?.invoiceId || !messageContent.trim()}
            className="px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 flex items-center space-x-2 disabled:opacity-50"
          >
            <Send size={16} />
            <span>{sending ? 'Đang gửi...' : `Gửi cho ${recipients.length} người ngay`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function BlockAccountModal({ debt, onClose }: DebtModalProps) {
  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Ban size={20} className="text-red-600" />
            <h3 className="text-lg text-gray-800">Khóa tài khoản App - Phòng {debt?.room}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border-2 border-red-400 rounded p-4 flex items-start space-x-3">
            <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 font-bold mb-2">⚠️ CẢNH BÁO: HÀNH ĐỘNG NGHIÊM KHẮC</p>
              <p className="text-sm text-red-700">
                Bạn đang khóa tài khoản App của <strong>TẤT CẢ 4 THÀNH VIÊN</strong> trong phòng này. 
                Họ sẽ không thể đăng nhập, xem thông tin, báo cáo sự cố cho đến khi thanh toán xong.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">Thông tin công nợ:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Phòng:</span>
                <span className="text-gray-800 font-bold">{debt?.room}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Chủ hộ:</span>
                <span className="text-gray-800 font-bold">{debt?.tenant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số tiền nợ:</span>
                <span className="text-red-700 font-bold">{debt?.amount} VNĐ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">S��� ngày trễ:</span>
                <span className="text-red-700 font-bold">{debt?.daysLate} ngày</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đã nhắc:</span>
                <span className="text-orange-700 font-bold">{debt?.reminderLevel} lần</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">Tài khoản sẽ bị khóa (4 người):</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white border border-red-300 rounded">
                <div className="flex items-center space-x-2">
                  <Lock size={16} className="text-red-600" />
                  <div>
                    <p className="text-sm text-gray-800 font-bold">{debt?.tenant}</p>
                    <p className="text-xs text-gray-600">Chủ hộ • {debt?.phone}</p>
                  </div>
                </div>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Sẽ bị khóa</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-white border border-red-300 rounded">
                <div className="flex items-center space-x-2">
                  <Lock size={16} className="text-red-600" />
                  <div>
                    <p className="text-sm text-gray-700">Trần Thị B</p>
                    <p className="text-xs text-gray-600">Vợ/Chồng • 0923456789</p>
                  </div>
                </div>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Sẽ bị khóa</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-white border border-red-300 rounded">
                <div className="flex items-center space-x-2">
                  <Lock size={16} className="text-red-600" />
                  <div>
                    <p className="text-sm text-gray-700">Nguyễn Văn C</p>
                    <p className="text-xs text-gray-600">Con • 0934567890</p>
                  </div>
                </div>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Sẽ bị khóa</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-white border border-red-300 rounded">
                <div className="flex items-center space-x-2">
                  <Lock size={16} className="text-red-600" />
                  <div>
                    <p className="text-sm text-gray-700">Nguyễn Thị D</p>
                    <p className="text-xs text-gray-600">Mẹ/Bố • 0945678901</p>
                  </div>
                </div>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Sẽ bị khóa</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">Lý do khóa tài khoản:</h4>
            <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500 mb-3">
              <option>Nợ tiền quá 30 ngày</option>
              <option>Vi phạm quy định chung cư</option>
              <option>Yêu cầu của Ban quản lý</option>
              <option>Lý do khác...</option>
            </select>
            <textarea 
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500 h-24"
              placeholder="Ghi chú thêm (tùy chọn)..."
              defaultValue="Nợ tiền quá lâu, đã nhắc nhiều lần không thanh toán. Áp dụng biện pháp khóa App để nhắc nhở nghiêm khắc."
            />
          </div>
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center space-x-2"
          >
            <Ban size={16} />
            <span>Xác nhận khóa 4 tài khoản</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function BatchSendReminderModal({ debts, onClose }: { debts?: any[], onClose: () => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState('auto');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedDebts, setSelectedDebts] = useState<string[]>(debts?.map(d => d.room) || []);

  const templates = {
    auto: 'Tự động chọn mẫu phù hợp với từng phòng (dựa vào số ngày nợ)',
    gentle: 'Mẫu nhắc nhẹ nhàng - Cho tất cả các phòng',
    strict: 'Mẫu cảnh báo nghiêm khắc - Cho tất cả các phòng',
  };

  const handleToggleDebt = (room: string) => {
    if (selectedDebts.includes(room)) {
      setSelectedDebts(selectedDebts.filter(r => r !== room));
    } else {
      setSelectedDebts([...selectedDebts, room]);
    }
  };

  const handleSendBatch = () => {
    setShowSuccess(true);
  };

  const parseAmount = (value: unknown): number => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
      const normalized = value.replace(/\./g, '').replace(/,/g, '.').trim();
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  };

  // Tính tổng tiền nợ của các phòng đã chọn
  const totalAmount = debts
    ?.filter(d => selectedDebts.includes(d.room))
    .reduce((sum, d) => sum + parseAmount(d.amount), 0) || 0;

  const totalRecipients = selectedDebts.length * 4; // Mỗi phòng 4 người

  if (showSuccess) {
    return (
      <div className="admin-content-modal-overlay">
        <div className="relative bg-white rounded-lg w-[600px]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded p-1 hover:bg-gray-100"
            aria-label="Đóng"
          >
            <X size={20} className="text-gray-600" />
          </button>
          <div className="p-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl text-gray-800 font-bold mb-3">Gửi nhắc nợ hàng loạt thành công!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Đã gửi tin nhắc nợ đến <strong>{totalRecipients} người</strong> từ <strong>{selectedDebts.length} phòng</strong> qua App, Email và SMS.
            </p>
            <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2 text-sm text-green-800">
                <div className="flex justify-between">
                  <span>✓ Số phòng đã gửi:</span>
                  <strong>{selectedDebts.length} phòng</strong>
                </div>
                <div className="flex justify-between">
                  <span>✓ Tổng số người nhận:</span>
                  <strong>{totalRecipients} người</strong>
                </div>
                <div className="flex justify-between">
                  <span>✓ Kênh gửi:</span>
                  <strong>App + Email + SMS</strong>
                </div>
                <div className="flex justify-between">
                  <span>✓ Thời gian:</span>
                  <strong>{formatDisplayDateTime(new Date())}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[900px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Send size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Gửi nhắc nợ hàng loạt</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Thống kê */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-300 rounded p-4">
              <p className="text-xs text-blue-700 mb-1">Số phòng đã chọn</p>
              <p className="text-2xl text-blue-800 font-bold">{selectedDebts.length}</p>
              <p className="text-xs text-blue-600 mt-1">phòng</p>
            </div>
            <div className="bg-orange-50 border border-orange-300 rounded p-4">
              <p className="text-xs text-orange-700 mb-1">Tổng số người nhận</p>
              <p className="text-2xl text-orange-800 font-bold">{totalRecipients}</p>
              <p className="text-xs text-orange-600 mt-1">người (mỗi phòng 4 người)</p>
            </div>
            <div className="bg-red-50 border border-red-300 rounded p-4">
              <p className="text-xs text-red-700 mb-1">Tổng công nợ</p>
              <p className="text-2xl text-red-800 font-bold">{totalAmount.toLocaleString('vi-VN')}</p>
              <p className="text-xs text-red-600 mt-1">VNĐ</p>
            </div>
          </div>

          {/* Chọn mẫu tin nhắn */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">Chọn loại tin nhắn:</h4>
            <div className="space-y-2">
              {Object.entries(templates).map(([key, description]) => (
                <label 
                  key={key}
                  className={`flex items-start p-3 border-2 rounded cursor-pointer transition-all ${
                    selectedTemplate === key 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="template" 
                    value={key}
                    checked={selectedTemplate === key}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <p className={`text-sm font-bold ${selectedTemplate === key ? 'text-blue-800' : 'text-gray-800'}`}>
                      {key === 'auto' && '🤖 Tự động'}
                      {key === 'gentle' && '😊 Nhắc nhẹ nhàng'}
                      {key === 'strict' && '⚠️ Cảnh báo nghiêm khắc'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Danh sách phòng */}
          <div className="bg-white border border-gray-300 rounded">
            <div className="border-b border-gray-300 px-4 py-3 flex items-center justify-between">
              <h4 className="text-sm text-gray-800 font-bold">Danh sách {debts?.length} phòng nợ:</h4>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setSelectedDebts(debts?.map(d => d.room) || [])}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Chọn tất cả
                </button>
                <span className="text-gray-400">|</span>
                <button 
                  onClick={() => setSelectedDebts([])}
                  className="text-xs text-gray-600 hover:underline"
                >
                  Bỏ chọn tất cả
                </button>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {debts?.map((debt, index) => (
                <label 
                  key={index}
                  className={`flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    selectedDebts.includes(debt.room) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox"
                      checked={selectedDebts.includes(debt.room)}
                      onChange={() => handleToggleDebt(debt.room)}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="text-sm text-gray-800 font-bold">{debt.room} - {debt.tenant}</p>
                      <p className="text-xs text-gray-600">
                        Nợ: <strong className="text-red-700">{debt.amount} VNĐ</strong> • 
                        Trễ: <strong>{debt.daysLate} ngày</strong> • 
                        Đã nhắc: <strong>{debt.reminderLevel} lần</strong>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {debt.daysLate >= 30 && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded border border-red-300">
                        Khẩn cấp
                      </span>
                    )}
                    {debt.daysLate >= 15 && debt.daysLate < 30 && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded border border-orange-300">
                        Cảnh báo
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {selectedDebts.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-300 rounded p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Vui lòng chọn ít nhất 1 phòng để gửi nhắc nợ.
              </p>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-between sticky bottom-0 bg-white">
          <p className="text-sm text-gray-600">
            Sẽ gửi đến <strong className="text-blue-600">{totalRecipients} người</strong> từ <strong className="text-blue-600">{selectedDebts.length} phòng</strong>
          </p>
          <div className="flex items-center space-x-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
            >
              Hủy
            </button>
            <button 
              onClick={handleSendBatch}
              disabled={selectedDebts.length === 0}
              className={`px-6 py-2 text-white text-sm rounded flex items-center space-x-2 ${
                selectedDebts.length === 0 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              <Send size={16} />
              <span>Gửi cho {totalRecipients} người ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
