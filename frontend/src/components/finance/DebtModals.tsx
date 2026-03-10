import { X, Eye, Send, Ban, User, Home, DollarSign, Calendar, AlertTriangle, Check, FileText, Users, Clock, Bell, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';

interface DebtModalProps {
  debt?: any;
  onClose: () => void;
}

export function ViewDebtModal({ debt, onClose }: DebtModalProps) {
  const [showContractModal, setShowContractModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showTransactionHistoryModal, setShowTransactionHistoryModal] = useState(false);
  const [showSendReminderModal, setShowSendReminderModal] = useState(false);
  const [showBlockAccountModal, setShowBlockAccountModal] = useState(false);

  return (
    <>
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[1000px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Eye size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Chi tiết công nợ - Phòng {debt?.room}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Status Alert */}
          {debt?.daysLate >= 30 && (
            <div className="bg-red-50 border-2 border-red-400 rounded p-4 flex items-start space-x-3">
              <AlertTriangle size={28} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-bold mb-2">🚨 CẢNH BÁO NGHIÊM TRỌNG - ĐÃ QUÁ 30 NGÀY!</p>
                <p className="text-sm text-red-700 mb-2">
                  Phòng này đã nợ <strong>{debt?.daysLate} ngày</strong> với tổng số tiền <strong>{debt?.amount} VNĐ</strong>. 
                  Đã gửi <strong>{debt?.reminderLevel} lần nhắc nợ</strong> nhưng chưa thanh toán.
                </p>
                <div className="bg-red-100 border border-red-300 rounded p-3 mt-2">
                  <p className="text-sm text-red-800 font-bold mb-1">⚡ Hành động khẩn cấp:</p>
                  <ul className="text-sm text-red-700 space-y-1 ml-4">
                    <li>• <strong>Khóa tài khoản App</strong> cho tất cả 4 người</li>
                    <li>• <strong>Gửi thông báo cứng</strong> về khả năng chấm dứt hợp đồng</li>
                    <li>• <strong>Cân nhắc buộc thôi thuê</strong> nếu không thanh toán trong 7 ngày</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {debt?.daysLate >= 15 && debt?.daysLate < 30 && (
            <div className="bg-orange-50 border border-orange-300 rounded p-4 flex items-start space-x-3">
              <AlertTriangle size={24} className="text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-orange-800 font-bold mb-1">⚠️ Cảnh báo mức độ 2 - Trễ {debt?.daysLate} ngày</p>
                <p className="text-sm text-orange-700">
                  Số tiền nợ: <strong>{debt?.amount} VNĐ</strong>. Đã nhắc {debt?.reminderLevel} lần. 
                  Cần gửi nhắc nợ ngay cho các thành viên.
                </p>
              </div>
            </div>
          )}

          {debt?.daysLate < 15 && (
            <div className="bg-yellow-50 border border-yellow-300 rounded p-4 flex items-start space-x-3">
              <Clock size={24} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-bold mb-1">⏰ Nhắc nhở mức độ 1 - Trễ {debt?.daysLate} ngày</p>
                <p className="text-sm text-yellow-700">
                  Số tiền nợ: <strong>{debt?.amount} VNĐ</strong>. Đã nhắc {debt?.reminderLevel} lần qua App. 
                  Có thể đợi thêm vài ngày trước khi leo thang.
                </p>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Room & Contract Info */}
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Thông tin phòng & hợp đồng</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phòng:</span>
                    <span className="text-gray-800 font-bold">{debt?.room}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diện tích:</span>
                    <span className="text-gray-800">50m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hợp đồng:</span>
                    <span className="text-gray-800 font-bold">HD-2025-067</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày bắt đầu:</span>
                    <span className="text-gray-800">15/03/2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày kết thúc:</span>
                    <span className="text-gray-800">14/03/2026</span>
                  </div>
                  <button 
                    onClick={() => setShowContractModal(true)}
                    className="w-full mt-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50"
                  >
                    → Xem chi tiết hợp đồng
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-300">
                  🔗 Thông tin từ <strong>Quản lý Hợp đồng & Cơ cấu tòa nhà</strong>
                </p>
              </div>

              {/* Family Members */}
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm text-gray-600">Thành viên trong hộ</h4>
                  <span className="text-xs text-gray-600 bg-gray-200 px-2 py-0.5 rounded">4 người</span>
                </div>
                
                <div className="space-y-2">
                  {/* Head of Household */}
                  <div className="bg-white border border-gray-300 rounded p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-lg">
                        👤
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-800 font-bold">{debt?.tenant}</p>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-300">Chủ hộ</span>
                        </div>
                        <p className="text-xs text-gray-600">{debt?.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Family Members */}
                  <div className="bg-white border border-gray-300 rounded p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-lg">
                        👤
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-700">Trần Thị B</p>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-300">Vợ/Chồng</span>
                        </div>
                        <p className="text-xs text-gray-600">0923456789</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-300 rounded p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-lg">
                        👶
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-700">Nguyễn Văn C</p>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-300">Con</span>
                        </div>
                        <p className="text-xs text-gray-600">0934567890</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-300 rounded p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-lg">
                        👵
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-700">Nguyễn Thị D</p>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-300">Mẹ/Bố</span>
                        </div>
                        <p className="text-xs text-gray-600">0945678901</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-300">
                  🔗 <strong>Tất cả 4 người</strong> đã nhận thông báo nhắc nợ. Có thể gọi điện cho bất kỳ ai.
                </p>
              </div>

              {/* Account Status */}
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Trạng thái tài khoản</h4>
                <div className="space-y-2">
                  {debt?.daysLate >= 30 ? (
                    <>
                      <div className="flex items-center justify-between p-2 bg-red-50 border border-red-300 rounded">
                        <div className="flex items-center space-x-2">
                          <Lock size={16} className="text-red-600" />
                          <span className="text-sm text-red-800 font-bold">Đang bị khóa</span>
                        </div>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">4/4 người</span>
                      </div>
                      <p className="text-xs text-red-700">
                        🔒 Tất cả 4 tài khoản đã bị khóa không thể đăng nhập App cư dân. 
                        Chỉ mở khóa khi thanh toán xong.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-2 bg-green-50 border border-green-300 rounded">
                        <div className="flex items-center space-x-2">
                          <Unlock size={16} className="text-green-600" />
                          <span className="text-sm text-green-800 font-bold">Đang hoạt động</span>
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">4/4 người</span>
                      </div>
                      <p className="text-xs text-green-700">
                        ✅ Tất cả 4 tài khoản vẫn đăng nhập App bình thường. 
                        Có thể khóa nếu quá 30 ngày.
                      </p>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-300">
                  🔗 Trạng thái đồng bộ với <strong>Danh sách Cư dân</strong>
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Unpaid Invoices */}
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Danh sách hóa đơn nợ</h4>
                <div className="space-y-2">
                  {/* Invoice 1 */}
                  <div className="bg-white border-2 border-red-300 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-gray-800 font-bold">INV-2026-003</p>
                        <p className="text-xs text-gray-600">Kỳ: 02/2026</p>
                      </div>
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded border border-red-300">Quá hạn 22 ngày</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-gray-600">Hạn thanh toán:</span>
                        <p className="text-gray-800 font-bold">15/02/2026</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Số tiền:</span>
                        <p className="text-red-700 font-bold">14.500.000 VNĐ</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowInvoiceModal(true)}
                      className="text-xs text-blue-700 hover:underline"
                    >
                      → Xem chi tiết hóa đơn
                    </button>
                  </div>

                  {/* Invoice 2 (if multiple) */}
                  {debt?.room === 'C-401' && (
                    <>
                      <div className="bg-white border-2 border-red-300 rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm text-gray-800 font-bold">INV-2025-089</p>
                            <p className="text-xs text-gray-600">Kỳ: 01/2026</p>
                          </div>
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded border border-red-300">Quá hạn 52 ngày</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div>
                            <span className="text-gray-600">Hạn thanh toán:</span>
                            <p className="text-gray-800 font-bold">15/01/2026</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Số tiền:</span>
                            <p className="text-red-700 font-bold">10.500.000 VNĐ</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setShowInvoiceModal(true)}
                          className="text-xs text-blue-700 hover:underline"
                        >
                          → Xem chi tiết hóa đơn
                        </button>
                      </div>

                      <div className="bg-red-100 border border-red-400 rounded p-3">
                        <p className="text-sm text-red-800 font-bold">⚠️ Nợ liên tục 2 tháng!</p>
                        <p className="text-xs text-red-700 mt-1">
                          Tổng nợ: <strong>25.000.000 VNĐ</strong>. Cần xử lý nghiêm khắc ngay!
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-300">
                  🔗 Chi tiết trong <strong>Quản lý Hóa đơn</strong>
                </p>
              </div>

              {/* Debt Summary */}
              <div className="bg-red-50 border-2 border-red-400 rounded p-4">
                <h4 className="text-sm text-red-800 font-bold mb-3">💰 Tổng hợp công nợ</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-700">Tổng số tiền nợ:</span>
                    <span className="text-red-900 font-bold text-lg">{debt?.amount} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Số ngày trễ:</span>
                    <span className="text-red-900 font-bold">{debt?.daysLate} ngày</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Phí trễ hạn (1%):</span>
                    <span className="text-red-900 font-bold">
                      {debt?.room === 'C-401' ? '250.000' : '145.000'} VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between border-t-2 border-red-400 pt-2">
                    <span className="text-red-800 font-bold">TỔNG PHẢI THU:</span>
                    <span className="text-red-900 font-bold text-xl">
                      {debt?.room === 'C-401' ? '25.250.000' : '14.645.000'} VNĐ
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">📊 Lịch sử thanh toán</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-green-50 border border-green-300 rounded">
                    <span className="text-gray-700">Tháng 01/2026</span>
                    <span className="text-green-700 font-bold">✅ Đúng hạn</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 border border-green-300 rounded">
                    <span className="text-gray-700">Tháng 12/2025</span>
                    <span className="text-green-700 font-bold">✅ Đúng hạn</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-300 rounded">
                    <span className="text-gray-700">Tháng 11/2025</span>
                    <span className="text-yellow-700 font-bold">⚠️ Trễ 5 ngày</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 border border-green-300 rounded">
                    <span className="text-gray-700">Tháng 10/2025</span>
                    <span className="text-green-700 font-bold">✅ Đúng hạn</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  💡 Đã thanh toán đúng hạn <strong>8/10 tháng gần đây</strong>. Trước đây là cư dân tốt.
                </p>
                <button 
                  onClick={() => setShowTransactionHistoryModal(true)}
                  className="w-full mt-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50"
                >
                  → Xem toàn bộ lịch sử giao dịch
                </button>
              </div>
            </div>
          </div>

          {/* Reminder History */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-600 mb-3">📬 Lịch sử nhắc nợ</h4>
            <div className="space-y-2">
              <div className="flex items-start justify-between p-3 bg-white border border-gray-300 rounded text-sm">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-bold mb-1">Nhắc nợ lần {debt?.reminderLevel} (Nghiêm khắc)</p>
                    <p className="text-gray-600 text-xs mb-2">
                      Gửi {debt?.daysLate >= 30 ? '05/03/2026' : '25/02/2026'} 08:00
                    </p>
                    <p className="text-gray-700 text-xs">
                      "Cảnh báo nghiêm trọng: Quý khách đã nợ quá lâu. Nếu không thanh toán trong 7 ngày, 
                      chúng tôi buộc phải khóa tài khoản App và xem xét chấm dứt hợp đồng."
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs">
                      <span className="text-green-700">✅ App: 4/4 đã đọc</span>
                      <span className="text-green-700">✅ Email: Đã gửi chủ hộ</span>
                      <span className="text-gray-600">📞 Gọi điện: Chưa</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between p-3 bg-white border border-gray-300 rounded text-sm">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-bold mb-1">Nhắc nợ lần 2 (Cảnh báo)</p>
                    <p className="text-gray-600 text-xs mb-2">Gửi 20/02/2026 08:00</p>
                    <p className="text-gray-700 text-xs">
                      "Quý khách đã quá hạn thanh toán. Vui lòng thanh toán sớm để tránh phát sinh phí trễ hạn 
                      và ảnh hưởng đến dịch vụ."
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs">
                      <span className="text-green-700">✅ App: 4/4 đã đọc</span>
                      <span className="text-green-700">✅ Email: Đã gửi</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between p-3 bg-white border border-gray-300 rounded text-sm">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-bold mb-1">Nhắc nợ lần 1 (Nhẹ nhàng)</p>
                    <p className="text-gray-600 text-xs mb-2">Gửi 16/02/2026 08:00</p>
                    <p className="text-gray-700 text-xs">
                      "Xin chào! Hóa đơn tháng 02/2026 đã quá hạn thanh toán. 
                      Vui lòng kiểm tra và thanh toán sớm nhất có thể."
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs">
                      <span className="text-green-700">✅ App: 4/4 đã đọc</span>
                      <span className="text-green-700">✅ Email: Đã gửi</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between p-3 bg-white border border-gray-300 rounded text-sm">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-bold mb-1">Gửi hóa đơn lần đầu</p>
                    <p className="text-gray-600 text-xs mb-2">Gửi 01/02/2026 08:00</p>
                    <p className="text-gray-700 text-xs">
                      "Hóa đơn tháng 02/2026 đã được tạo. Tổng tiền: 14.500.000 VNĐ. 
                      Hạn thanh toán: 15/02/2026."
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs">
                      <span className="text-green-700">✅ App: 4/4 đã đọc</span>
                      <span className="text-green-700">✅ Email: Đã gửi</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 Tổng cộng đã gửi <strong>{debt?.reminderLevel + 1} lần</strong> thông báo cho 4 thành viên. 
              Tất cả đều đã đọc nhưng chưa thanh toán.
            </p>
          </div>

        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-between sticky bottom-0 bg-white">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowSendReminderModal(true)}
              className="px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 flex items-center space-x-2"
            >
              <Send size={16} />
              <span>Gửi nhắc nợ cho 4 người</span>
            </button>
            {debt?.daysLate >= 30 && (
              <button 
                onClick={() => setShowBlockAccountModal(true)}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center space-x-2"
              >
                <Ban size={16} />
                <span>Khóa tài khoản 4 người</span>
              </button>
            )}
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>

    {/* Contract Detail Modal */}
    {showContractModal && (
      <ContractDetailModal 
        debt={debt} 
        onClose={() => setShowContractModal(false)} 
      />
    )}

    {/* Invoice Detail Modal */}
    {showInvoiceModal && (
      <InvoiceDetailModal 
        debt={debt} 
        onClose={() => setShowInvoiceModal(false)} 
      />
    )}

    {/* Transaction History Modal */}
    {showTransactionHistoryModal && (
      <TransactionHistoryModal 
        debt={debt} 
        onClose={() => setShowTransactionHistoryModal(false)} 
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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[60]">
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
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Đóng
          </button>
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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[60]">
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
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Đóng
          </button>
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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[60]">
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
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Đóng
          </button>
          <button className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">
            Xuất Excel
          </button>
        </div>
      </div>
    </div>
  );
}

export function SendReminderModal({ debt, onClose }: DebtModalProps) {
  // Các mẫu tin nhắn
  const templates = {
    gentle: `Xin chào ${debt?.tenant},

Hóa đơn tháng 02/2026 đã quá hạn thanh toán ${debt?.daysLate} ngày.
Số tiền: ${debt?.amount} VNĐ

Vui lòng thanh toán sớm nhất có thể để tránh phát sinh phí trễ hạn.

Liên hệ: 0900123456
Trân trọng!`,
    strict: `⚠️ CẢNH BÁO NGHIÊM TRỌNG

Kính gửi ${debt?.tenant},

Quý khách đã nợ hóa đơn ${debt?.daysLate} ngày với số tiền ${debt?.amount} VNĐ.

Nếu không thanh toán trong 7 ngày, chúng tôi buộc phải:
• Khóa tài khoản App của 4 thành viên
• Xem xét chấm dứt hợp đồng thuê
• Thu phí trễ hạn theo quy định

Vui lòng liên hệ ngay: 0900123456`,
    custom: `Kính gửi ${debt?.tenant},

[Nhập nội dung tin nhắc nợ tùy chỉnh của bạn tại đây]

Trân trọng,
Ban quản lý`
  };

  const [selectedTemplate, setSelectedTemplate] = useState(debt?.daysLate >= 30 ? 'strict' : 'gentle');
  const [messageContent, setMessageContent] = useState(templates[debt?.daysLate >= 30 ? 'strict' : 'gentle']);
  const [showSuccess, setShowSuccess] = useState(false);

  // Xử lý khi thay đổi template
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedTemplate(value);
    setMessageContent(templates[value as keyof typeof templates]);
  };

  // Xử lý khi gửi nhắc nợ
  const handleSendReminder = () => {
    setShowSuccess(true);
  };

  // Nếu đã gửi thành công, hiển thị thông báo
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-[500px]">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl text-gray-800 font-bold mb-2">Gửi nhắc nợ thành công!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Đã gửi tin nhắc nợ đến <strong>4 thành viên</strong> của phòng <strong>{debt?.room}</strong> qua App, Email và SMS.
            </p>
            <div className="bg-green-50 border border-green-300 rounded p-3 mb-4">
              <p className="text-sm text-green-800">
                ✓ Gửi đến: {debt?.tenant} và 3 thành viên khác<br/>
                ✓ Kênh: App thông báo + Email + SMS<br/>
                ✓ Thời gian: {new Date().toLocaleString('vi-VN')}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="w-full px-4 py-3 bg-green-600 text-white text-base rounded hover:bg-green-700"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
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
                <span className="text-red-700 font-bold">{debt?.amount} VNĐ</span>
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
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white border border-gray-300 rounded">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-sm">
                    👤
                  </div>
                  <div>
                    <p className="text-sm text-gray-800 font-bold">{debt?.tenant}</p>
                    <p className="text-xs text-gray-600">Chủ hộ • {debt?.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-xs text-gray-600">App + Email + SMS</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-white border border-gray-300 rounded">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-sm">
                    👤
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Trần Thị B</p>
                    <p className="text-xs text-gray-600">Vợ/Chồng • 0923456789</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-xs text-gray-600">App</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-white border border-gray-300 rounded">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-sm">
                    👶
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Nguyễn Văn C</p>
                    <p className="text-xs text-gray-600">Con • 0934567890</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-xs text-gray-600">App</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-white border border-gray-300 rounded">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-sm">
                    👵
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Nguyễn Thị D</p>
                    <p className="text-xs text-gray-600">Mẹ/Bố • 0945678901</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-xs text-gray-600">App</span>
                </div>
              </div>
            </div>
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
            className="px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 flex items-center space-x-2"
          >
            <Send size={16} />
            <span>Gửi cho 4 người ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function BlockAccountModal({ debt, onClose }: DebtModalProps) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
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

  // Tính tổng tiền nợ của các phòng đã chọn
  const totalAmount = debts
    ?.filter(d => selectedDebts.includes(d.room))
    .reduce((sum, d) => sum + parseFloat(d.amount.replace(/\./g, '')), 0) || 0;

  const totalRecipients = selectedDebts.length * 4; // Mỗi phòng 4 người

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-[600px]">
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
                  <strong>{new Date().toLocaleString('vi-VN')}</strong>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-full px-6 py-3 bg-green-600 text-white text-base rounded hover:bg-green-700"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
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