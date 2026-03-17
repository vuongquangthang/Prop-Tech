import { X, Eye, FileText, User, Home, DollarSign, Calendar, AlertTriangle, Check, Download, Printer, Mail, Send, Users, Clock } from 'lucide-react';
import { useState } from 'react';

interface InvoiceModalProps {
  invoice?: any;
  onClose: () => void;
}

export function ViewInvoiceModal({ invoice, onClose }: InvoiceModalProps) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[900px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Eye size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Chi tiết hóa đơn - {invoice?.code}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Status Alert */}
          {invoice?.status === 'overdue' && (
            <div className="bg-red-50 border border-red-300 rounded p-4 flex items-start space-x-3">
              <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-bold mb-1">⚠️ Hóa đơn đã quá hạn 15 ngày!</p>
                <p className="text-sm text-red-700">Hạn thanh toán: 15/02/2026. Hệ thống đã tự động gửi 2 lần nhắc nợ.</p>
              </div>
            </div>
          )}

          {invoice?.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-300 rounded p-4 flex items-start space-x-3">
              <Clock size={24} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-bold mb-1">⏰ Chờ thanh toán</p>
                <p className="text-sm text-yellow-700">Hạn thanh toán: 15/02/2026 (còn 10 ngày). Đã gửi thông báo cho 4 thành viên gia đình.</p>
              </div>
            </div>
          )}

          {invoice?.status === 'paid' && (
            <div className="bg-green-50 border border-green-300 rounded p-4 flex items-start space-x-3">
              <Check size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-800 font-bold mb-1">✅ Đã thanh toán</p>
                <p className="text-sm text-green-700">Ngày thanh toán: 05/02/2026 09:45. Phương thức: Chuyển khoản qua VietQR.</p>
              </div>
            </div>
          )}

          {/* Invoice Basic Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Thông tin hóa đơn</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã hóa đơn:</span>
                    <span className="text-gray-800 font-bold">{invoice?.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kỳ thanh toán:</span>
                    <span className="text-gray-800">{invoice?.period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày lập:</span>
                    <span className="text-gray-800">01/02/2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hạn thanh toán:</span>
                    <span className="text-gray-800 font-bold">15/02/2026</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-2">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className={`font-bold ${
                      invoice?.status === 'paid' ? 'text-green-700' : 
                      invoice?.status === 'overdue' ? 'text-red-700' : 
                      invoice?.status === 'pending' ? 'text-yellow-700' : 'text-gray-700'
                    }`}>
                      {invoice?.status === 'paid' ? 'Đã thanh toán' :
                       invoice?.status === 'overdue' ? 'Quá hạn 15 ngày' :
                       invoice?.status === 'pending' ? 'Chờ thanh toán (còn 10 ngày)' : 'Nháp'}
                    </span>
                  </div>
                </div>
              </div>

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
                          <p className="text-sm text-gray-800 font-bold">{invoice?.tenant}</p>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-300">Chủ hộ</span>
                        </div>
                        <p className="text-xs text-gray-600">0912345678</p>
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
                  🔗 <strong>Tất cả 4 người</strong> đã nhận thông báo qua App cư dân. <strong>Chỉ chủ hộ</strong> có quyền thanh toán.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Invoice Details */}
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Chi tiết các khoản thu</h4>
                <div className="space-y-3">
                  {/* Rent */}
                  <div className="bg-white border border-gray-300 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-gray-800 font-bold">Tiền thuê phòng</p>
                        <p className="text-xs text-gray-600">Tháng 02/2026</p>
                      </div>
                      <p className="text-sm text-gray-800 font-bold">8.500.000</p>
                    </div>
                  </div>

                  {/* Management */}
                  <div className="bg-white border border-gray-300 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-gray-800 font-bold">Phí quản lý chung cư</p>
                        <p className="text-xs text-gray-600">50m² × 25.000 VNĐ/m²</p>
                      </div>
                      <p className="text-sm text-gray-800 font-bold">1.250.000</p>
                    </div>
                  </div>

                  {/* Electricity */}
                  <div className="bg-white border border-gray-300 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-gray-800 font-bold">Tiền điện</p>
                        <p className="text-xs text-gray-600">
                          Chỉ số cũ: <strong>1250</strong> → Chỉ số mới: <strong>1450</strong> (200 kWh)
                        </p>
                        <p className="text-xs text-gray-600">200 kWh × 3.500 VNĐ/kWh</p>
                      </div>
                      <p className="text-sm text-gray-800 font-bold">700.000</p>
                    </div>
                    <button className="text-xs text-blue-700 hover:underline">
                      → Xem lịch sử chốt điện
                    </button>
                  </div>

                  {/* Water */}
                  <div className="bg-white border border-gray-300 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-gray-800 font-bold">Tiền nước</p>
                        <p className="text-xs text-gray-600">
                          Chỉ số cũ: <strong>85</strong> → Chỉ số mới: <strong>96</strong> (11 m³)
                        </p>
                        <p className="text-xs text-gray-600">11 m³ × 25.000 VNĐ/m³</p>
                      </div>
                      <p className="text-sm text-gray-800 font-bold">275.000</p>
                    </div>
                    <button className="text-xs text-blue-700 hover:underline">
                      → Xem lịch sử chốt nước
                    </button>
                  </div>

                  {/* Internet */}
                  <div className="bg-white border border-gray-300 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-gray-800 font-bold">Internet</p>
                        <p className="text-xs text-gray-600">Gói 100Mbps</p>
                      </div>
                      <p className="text-sm text-gray-800 font-bold">200.000</p>
                    </div>
                  </div>

                  {/* Parking */}
                  <div className="bg-white border border-gray-300 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-gray-800 font-bold">Gửi xe máy</p>
                        <p className="text-xs text-gray-600">1 xe × 100.000 VNĐ/tháng</p>
                      </div>
                      <p className="text-sm text-gray-800 font-bold">100.000</p>
                    </div>
                  </div>

                  {/* Late Fee */}
                  {invoice?.status === 'overdue' && (
                    <div className="bg-red-50 border border-red-300 rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm text-red-800 font-bold">Phí trễ hạn</p>
                          <p className="text-xs text-red-700">1% × 11.025.000 × 15 ngày / 30 ngày</p>
                        </div>
                        <p className="text-sm text-red-800 font-bold">55.125</p>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="bg-blue-50 border-2 border-blue-400 rounded p-3">
                    <div className="flex justify-between items-center">
                      <p className="text-base text-blue-900 font-bold">TỔNG CỘNG</p>
                      <p className="text-xl text-blue-900 font-bold">
                        {invoice?.status === 'overdue' ? '11.080.125' : invoice?.amount} VNĐ
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-300">
                  🔗 Đơn giá từ <strong>Dịch vụ & Đơn giá</strong>, Chỉ số từ <strong>Chốt chỉ số Điện/Nước</strong>
                </p>
              </div>

              {/* Payment Info */}
              {invoice?.status === 'paid' && (
                <div className="bg-green-50 border border-green-300 rounded p-4">
                  <h4 className="text-sm text-green-800 font-bold mb-3">📝 Thông tin thanh toán</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Ngày thanh toán:</span>
                      <span className="text-green-800 font-bold">05/02/2026 09:45</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Phương thức:</span>
                      <span className="text-green-800 font-bold">Chuyển khoản VietQR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Mã giao dịch:</span>
                      <span className="text-green-800 font-bold">VNPAY-2026020509451234</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Người thanh toán:</span>
                      <span className="text-green-800 font-bold">{invoice?.tenant}</span>
                    </div>
                  </div>
                  <button className="w-full mt-3 px-3 py-2 bg-white border border-green-300 text-green-700 text-xs rounded hover:bg-green-100">
                    → Xem biên lai & Lịch sử giao dịch
                  </button>
                </div>
              )}

              {/* Payment QR Code */}
              {(invoice?.status === 'pending' || invoice?.status === 'overdue') && (
                <div className="bg-blue-50 border border-blue-300 rounded p-4">
                  <h4 className="text-sm text-blue-800 font-bold mb-3">💳 Thông tin thanh toán</h4>
                  <div className="flex items-start space-x-4">
                    <div className="w-32 h-32 bg-white border-2 border-gray-300 rounded flex items-center justify-center flex-shrink-0">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-gray-200 mx-auto mb-1"></div>
                        <p className="text-xs text-gray-600">VietQR Code</p>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2 text-sm">
                      <div>
                        <p className="text-blue-700">Ngân hàng:</p>
                        <p className="text-blue-900 font-bold">Vietcombank</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Số tài khoản:</p>
                        <p className="text-blue-900 font-bold">0123456789</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Nội dung:</p>
                        <p className="text-blue-900 font-bold">{invoice?.code} {invoice?.room}</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Số tiền:</p>
                        <p className="text-blue-900 font-bold text-lg">
                          {invoice?.status === 'overdue' ? '11.080.125' : invoice?.amount} VNĐ
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mt-3">
                    💡 Cư dân có thể quét mã QR này trong App cư dân để thanh toán tự động.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notification History */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-600 mb-3">📬 Lịch sử thông báo</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white border border-gray-300 rounded text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Gửi hóa đơn lần đầu</span>
                </div>
                <span className="text-gray-600">01/02/2026 08:00 - Đã gửi cho 4 thành viên ✅</span>
              </div>
              {invoice?.status !== 'draft' && (
                <>
                  <div className="flex items-center justify-between p-2 bg-white border border-gray-300 rounded text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-700">Nhắc nợ lần 1</span>
                    </div>
                    <span className="text-gray-600">10/02/2026 08:00 - Đã gửi cho 4 thành viên ✅</span>
                  </div>
                </>
              )}
              {invoice?.status === 'overdue' && (
                <>
                  <div className="flex items-center justify-between p-2 bg-white border border-red-300 rounded text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-gray-700">Nhắc nợ lần 2 (Quá hạn)</span>
                    </div>
                    <span className="text-gray-600">16/02/2026 08:00 - Đã gửi cho 4 thành viên ⚠️</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white border border-red-300 rounded text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-gray-700">Cảnh báo khóa tài khoản</span>
                    </div>
                    <span className="text-gray-600">Dự kiến 25/02/2026 (30 ngày quá hạn) 🔒</span>
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              🔗 Xem chi tiết trong <strong>Công nợ & Nhắc nợ</strong>
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-between sticky bottom-0 bg-white">
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-2">
              <Printer size={16} />
              <span>In hóa đơn</span>
            </button>
            <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-2">
              <Mail size={16} />
              <span>Gửi lại cho 4 người</span>
            </button>
            {invoice?.status === 'draft' && (
              <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center space-x-2">
                <Send size={16} />
                <span>Phê duyệt & Gửi</span>
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
  );
}

export function PrintInvoiceModal({ invoice, onClose }: InvoiceModalProps) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <FileText size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">In/Xuất hóa đơn - {invoice?.code}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Export Options */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">Chọn định dạng xuất:</h4>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border border-gray-300 rounded cursor-pointer hover:bg-white">
                <div className="flex items-center space-x-3">
                  <input type="radio" name="exportFormat" defaultChecked className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-800 font-bold">Hóa đơn đầy đủ (PDF)</p>
                    <p className="text-xs text-gray-600">Bao gồm chi tiết các khoản thu, chỉ số điện/nước, QR Code thanh toán</p>
                  </div>
                </div>
                <FileText size={20} className="text-gray-600" />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-300 rounded cursor-pointer hover:bg-white">
                <div className="flex items-center space-x-3">
                  <input type="radio" name="exportFormat" className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-800 font-bold">Bản tóm tắt (PDF)</p>
                    <p className="text-xs text-gray-600">Chỉ tổng tiền và hạn thanh toán (gửi qua App)</p>
                  </div>
                </div>
                <FileText size={20} className="text-gray-600" />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-300 rounded cursor-pointer hover:bg-white">
                <div className="flex items-center space-x-3">
                  <input type="radio" name="exportFormat" className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-800 font-bold">File Excel (XLSX)</p>
                    <p className="text-xs text-gray-600">Dữ liệu bảng để phân tích</p>
                  </div>
                </div>
                <Download size={20} className="text-gray-600" />
              </label>
            </div>
          </div>

          {/* Invoice Preview */}
          <div className="bg-white border-2 border-gray-300 rounded p-6" style={{ minHeight: '500px' }}>
            <div className="text-center mb-6">
              <h2 className="text-xl text-gray-800 font-bold">HÓA ĐƠN THANH TOÁN</h2>
              <p className="text-sm text-gray-600 mt-2">Số: {invoice?.code}</p>
              <p className="text-sm text-gray-600">Kỳ thanh toán: {invoice?.period}</p>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-bold mb-2">BÊN CUNG CẤP DỊCH VỤ:</p>
                  <p>CÔNG TY QUẢN LÝ CHUNG CƯ ABC</p>
                  <p>Địa chỉ: 123 Đường XYZ, Quận ABC, TP.HCM</p>
                  <p>Điện thoại: 0900123456</p>
                </div>

                <div>
                  <p className="font-bold mb-2">KHÁCH HÀNG:</p>
                  <p>Họ tên: <strong>{invoice?.tenant}</strong></p>
                  <p>Phòng: <strong>{invoice?.room}</strong> (50m²)</p>
                  <p>Điện thoại: 0912345678</p>
                  <p className="text-xs mt-1">Số người ở: 4 người (1 chủ hộ + 3 thành viên)</p>
                </div>
              </div>

              <div className="border-t-2 border-gray-300 pt-4">
                <p className="font-bold mb-3">CHI TIẾT CÁC KHOẢN THU:</p>
                
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left border border-gray-300">STT</th>
                      <th className="px-3 py-2 text-left border border-gray-300">Nội dung</th>
                      <th className="px-3 py-2 text-center border border-gray-300">Chi tiết</th>
                      <th className="px-3 py-2 text-right border border-gray-300">Thành tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2 border border-gray-300">1</td>
                      <td className="px-3 py-2 border border-gray-300">Tiền thuê phòng</td>
                      <td className="px-3 py-2 text-center border border-gray-300">Tháng 02/2026</td>
                      <td className="px-3 py-2 text-right border border-gray-300 font-bold">8.500.000</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 border border-gray-300">2</td>
                      <td className="px-3 py-2 border border-gray-300">Phí quản lý</td>
                      <td className="px-3 py-2 text-center border border-gray-300">50m² × 25.000</td>
                      <td className="px-3 py-2 text-right border border-gray-300 font-bold">1.250.000</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 border border-gray-300">3</td>
                      <td className="px-3 py-2 border border-gray-300">Tiền điện</td>
                      <td className="px-3 py-2 text-center border border-gray-300">1250 → 1450 (200 kWh)</td>
                      <td className="px-3 py-2 text-right border border-gray-300 font-bold">700.000</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 border border-gray-300">4</td>
                      <td className="px-3 py-2 border border-gray-300">Tiền nước</td>
                      <td className="px-3 py-2 text-center border border-gray-300">85 → 96 (11 m³)</td>
                      <td className="px-3 py-2 text-right border border-gray-300 font-bold">275.000</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 border border-gray-300">5</td>
                      <td className="px-3 py-2 border border-gray-300">Internet</td>
                      <td className="px-3 py-2 text-center border border-gray-300">Gói 100Mbps</td>
                      <td className="px-3 py-2 text-right border border-gray-300 font-bold">200.000</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 border border-gray-300">6</td>
                      <td className="px-3 py-2 border border-gray-300">Gửi xe máy</td>
                      <td className="px-3 py-2 text-center border border-gray-300">1 xe</td>
                      <td className="px-3 py-2 text-right border border-gray-300 font-bold">100.000</td>
                    </tr>
                    {invoice?.status === 'overdue' && (
                      <tr className="bg-red-50">
                        <td className="px-3 py-2 border border-gray-300">7</td>
                        <td className="px-3 py-2 border border-gray-300 text-red-800">Phí trễ hạn</td>
                        <td className="px-3 py-2 text-center border border-gray-300 text-red-700">1% × 15 ngày</td>
                        <td className="px-3 py-2 text-right border border-gray-300 font-bold text-red-800">55.125</td>
                      </tr>
                    )}
                    <tr className="bg-blue-100">
                      <td colSpan={3} className="px-3 py-3 border border-gray-300 text-right font-bold">TỔNG CỘNG:</td>
                      <td className="px-3 py-3 border border-gray-300 text-right font-bold text-lg">
                        {invoice?.status === 'overdue' ? '11.080.125' : invoice?.amount} VNĐ
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border-t-2 border-gray-300 pt-4">
                <p className="font-bold mb-2">THÔNG TIN THANH TOÁN:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p>• Hạn thanh toán: <strong>15/02/2026</strong></p>
                    <p>• Ngân hàng: <strong>Vietcombank</strong></p>
                    <p>• Số tài khoản: <strong>0123456789</strong></p>
                    <p>• Nội dung CK: <strong>{invoice?.code} {invoice?.room}</strong></p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-32 h-32 bg-gray-200 border-2 border-gray-400 flex items-center justify-center">
                      <p className="text-xs text-gray-600">VietQR Code</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center pt-4">
                Cảm ơn quý khách đã sử dụng dịch vụ!
              </p>
            </div>
          </div>

          {/* Additional Options */}
          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <h4 className="text-sm text-blue-800 font-bold mb-3">Tùy chọn bổ sung:</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm text-blue-800 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Bao gồm logo công ty</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-blue-800 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Hiển thị mã VietQR Code</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-blue-800 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span>Gửi email bản PDF cho tất cả 4 thành viên</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-blue-800 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span>Gửi thông báo qua App cư dân</span>
              </label>
            </div>
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
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <Printer size={16} />
            <span>In ngay</span>
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Tải xuống PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function SendInvoiceModal({ invoice, onClose }: InvoiceModalProps) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Send size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Phê duyệt & Gửi hóa đơn</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <p className="text-sm text-blue-800">
              Bạn đang phê duyệt và gửi hóa đơn <strong>{invoice?.code}</strong> cho phòng <strong>{invoice?.room}</strong>
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">Thông tin gửi:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Chủ hộ:</span>
                <span className="text-gray-800 font-bold">{invoice?.tenant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số thành viên nhận:</span>
                <span className="text-gray-800 font-bold">4 người</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="text-gray-800 font-bold">{invoice?.amount} VNĐ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hạn thanh toán:</span>
                <span className="text-gray-800 font-bold">15/02/2026</span>
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
                    <p className="text-sm text-gray-800 font-bold">{invoice?.tenant}</p>
                    <p className="text-xs text-gray-600">Chủ hộ • 0912345678</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-xs text-gray-600">App + Email</span>
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
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center space-x-2"
          >
            <Send size={16} />
            <span>Phê duyệt & Gửi cho 4 người</span>
          </button>
        </div>
      </div>
    </div>
  );
}